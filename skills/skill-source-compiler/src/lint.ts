import { resolve } from "node:path";

import { fileExists } from "./fs-utils.ts";
import { loadSourceBundle, type LoadedSourceBundle } from "./source-loader.ts";
import { containsAbsolutePath, normalizeText } from "./text.ts";

export interface Diagnostic {
  readonly level: "error" | "warning";
  readonly code: string;
  readonly message: string;
}

export interface LintResult {
  readonly diagnostics: readonly Diagnostic[];
  readonly loaded: LoadedSourceBundle;
  readonly ok: boolean;
}

const pushIf = (
  diagnostics: Diagnostic[],
  condition: boolean,
  level: Diagnostic["level"],
  code: string,
  message: string,
): void => {
  if (condition) {
    diagnostics.push({ code, level, message });
  }
};

const duplicateIds = (items: readonly string[]): readonly string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of items) {
    if (seen.has(item)) {
      duplicates.add(item);
      continue;
    }
    seen.add(item);
  }
  return [...duplicates].sort();
};

const detectDuplicateNormativeTexts = (texts: readonly string[]): readonly string[] => {
  const counts = new Map<string, number>();
  for (const text of texts) {
    const normalized = normalizeText(text);
    if (normalized.length < 24) {
      continue;
    }
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([text]) => text)
    .sort();
};

const lintLoadedBundle = async (loaded: LoadedSourceBundle): Promise<LintResult> => {
  const diagnostics: Diagnostic[] = [];
  const { source } = loaded;

  const ids = [
    ...source.references.map((entry) => entry.id),
    ...source.assets.map((entry) => entry.id),
    ...source.copies.map((entry) => entry.id),
    ...source.supporting.map((entry) => entry.id),
    ...source.sections.workflow.map((entry) => entry.id),
    ...source.sections.interop.map((entry) => entry.id),
    ...source.sections.commands.map((entry) => entry.id),
    ...source.sections.gotchas.map((entry) => entry.id),
    ...source.sections.policies.map((entry) => entry.id),
  ];

  for (const duplicateId of duplicateIds(ids)) {
    diagnostics.push({
      code: "duplicate-id",
      level: "error",
      message: `Duplicate id detected: ${duplicateId}`,
    });
  }

  const targetPaths = [
    ...source.references.map((entry) => entry.target),
    ...source.assets.map((entry) => entry.target),
    ...source.copies.map((entry) => entry.target),
    ...source.supporting.map((entry) => entry.target),
  ];
  for (const duplicateTarget of duplicateIds(targetPaths)) {
    diagnostics.push({
      code: "duplicate-target",
      level: "error",
      message: `Multiple emitted files target the same path: ${duplicateTarget}`,
    });
  }

  const requiredReferenceIds = new Set(source.surfaces.active.requiredReferences);
  const optionalReferenceIds = new Set(source.surfaces.active.optionalReferences);
  for (const referenceId of requiredReferenceIds) {
    pushIf(
      diagnostics,
      !source.references.some((entry) => entry.id === referenceId),
      "error",
      "unknown-required-reference",
      `Required reference id is not declared in references: ${referenceId}`,
    );
  }
  for (const referenceId of optionalReferenceIds) {
    pushIf(
      diagnostics,
      !source.references.some((entry) => entry.id === referenceId),
      "error",
      "unknown-optional-reference",
      `Optional reference id is not declared in references: ${referenceId}`,
    );
  }

  for (const reference of source.references) {
    if (reference.required && !requiredReferenceIds.has(reference.id)) {
      diagnostics.push({
        code: "unreachable-required-reference",
        level: "error",
        message: `Reference ${reference.id} is marked required but is not listed in surfaces.active.requiredReferences.`,
      });
    }
  }

  for (const entry of [...source.references, ...source.assets, ...source.copies, ...source.supporting]) {
    pushIf(
      diagnostics,
      containsAbsolutePath(entry.description ?? ""),
      "error",
      "absolute-path-in-description",
      `Description for ${entry.id} contains an absolute path hint.`,
    );
  }

  const normativeTexts = [
    ...source.sections.startHere,
    ...source.sections.whenToUse,
    ...source.sections.whenNotToUse,
    ...source.sections.workflow.flatMap((entry) => [entry.goal, ...entry.steps, ...entry.validation]),
    ...source.sections.interop.flatMap((entry) => [entry.domain, entry.winner, entry.rationale]),
    ...source.sections.commands.flatMap((entry) => [entry.command, entry.summary, entry.when, ...entry.inputs, ...entry.outputs]),
    ...source.sections.gotchas.map((entry) => entry.text),
    ...source.sections.policies.flatMap((entry) => [entry.title, entry.text]),
    ...source.sections.portability.rules,
    ...source.sections.portability.checklist,
  ];
  for (const duplicateText of detectDuplicateNormativeTexts(normativeTexts)) {
    diagnostics.push({
      code: "duplicated-guidance",
      level: "warning",
      message: `Potential duplicate guidance detected: ${duplicateText}`,
    });
  }

  for (const command of source.sections.commands) {
    pushIf(
      diagnostics,
      command.script === undefined,
      "error",
      "missing-command-runtime",
      `Command ${command.id} does not declare a runtime script.`,
    );

    if (command.script !== undefined) {
      const hasEmittedScript = source.copies.some((entry) => entry.target === command.script);
      pushIf(
        diagnostics,
        !hasEmittedScript,
        "error",
        "missing-command-script",
        `Command ${command.id} references ${command.script}, but no copied runtime file emits that path.`,
      );
    }

    for (const testPath of command.tests) {
      const absoluteTestPath = resolve(loaded.rootDir, testPath);
      const exists = await fileExists(absoluteTestPath);
      pushIf(
        diagnostics,
        !exists,
        "error",
        "missing-command-test",
        `Command ${command.id} expects test file ${testPath}, but it does not exist.`,
      );

      const hasEmittedTest = source.copies.some((entry) => entry.target === testPath);
      pushIf(
        diagnostics,
        !hasEmittedTest,
        "error",
        "missing-command-test-copy",
        `Command ${command.id} references ${testPath}, but no copied runtime file emits that path.`,
      );
    }
  }

  pushIf(
    diagnostics,
    source.sections.commands.length > 0 && loaded.packageVersion === null,
    "error",
    "missing-package-manifest",
    "Command-bearing source bundles must include package.json so the shipped CLI version can be tracked separately.",
  );

  const referencesToSupportingTargets = new Set(source.supporting.map((entry) => entry.target));
  for (const reference of source.references) {
    pushIf(
      diagnostics,
      referencesToSupportingTargets.has(reference.target),
      "error",
      "surface-conflict",
      `Target ${reference.target} is declared as both active and supporting content.`,
    );
  }

  return {
    diagnostics,
    loaded,
    ok: diagnostics.every((entry) => entry.level !== "error"),
  };
};

/**
 * Lints a structured source bundle.
 */
export const lintSourceBundle = async (rootDir: string): Promise<LintResult> =>
  lintLoadedBundle(await loadSourceBundle(rootDir));
