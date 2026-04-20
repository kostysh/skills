import { resolve } from "node:path";
import YAML from "yaml";

import { readTextFile, walkFiles } from "./fs-utils.ts";
import { compiledFrontmatterSchema } from "./schema.ts";
import { containsAbsolutePath } from "./text.ts";

export interface CheckDiagnostic {
  readonly level: "error" | "warning";
  readonly code: string;
  readonly message: string;
}

export interface CheckResult {
  readonly diagnostics: readonly CheckDiagnostic[];
  readonly ok: boolean;
}

const finalizeResult = (diagnostics: readonly CheckDiagnostic[]): CheckResult => ({
  diagnostics,
  ok: diagnostics.every((entry) => entry.level !== "error"),
});

const extractFrontmatter = (markdown: string): { body: string; frontmatter: unknown } => {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u);
  if (match === null) {
    throw new Error("SKILL.md is missing YAML frontmatter.");
  }

  return {
    body: match[2] ?? "",
    frontmatter: YAML.parse(match[1] ?? ""),
  };
};

/**
 * Checks a compiled skill folder for portability and structural invariants.
 */
export const checkCompiledSkill = async (skillDir: string): Promise<CheckResult> => {
  const diagnostics: CheckDiagnostic[] = [];
  const normalizedDir = resolve(skillDir);
  const skillMarkdownPath = resolve(normalizedDir, "SKILL.md");
  const markdown = await readTextFile(skillMarkdownPath).catch((error: unknown) => {
    diagnostics.push({
      code: "missing-skill-markdown",
      level: "error",
      message: `Could not read ${skillMarkdownPath}: ${error instanceof Error ? error.message : String(error)}`,
    });
    return null;
  });
  if (markdown === null) {
    return finalizeResult(diagnostics);
  }

  let body = "";
  let frontmatter: unknown = {};
  try {
    const extracted = extractFrontmatter(markdown);
    body = extracted.body;
    frontmatter = extracted.frontmatter;
  } catch (error: unknown) {
    diagnostics.push({
      code: "missing-frontmatter",
      level: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const parsedFrontmatter = compiledFrontmatterSchema.safeParse(frontmatter);
  if (!parsedFrontmatter.success) {
    diagnostics.push({
      code: "invalid-frontmatter",
      level: "error",
      message: parsedFrontmatter.error.message,
    });
  } else {
    const folderName = normalizedDir.split(/[/\\]/u).at(-1);
    if (parsedFrontmatter.data.name !== folderName) {
      diagnostics.push({
        code: "folder-name-mismatch",
        level: "error",
        message: `Frontmatter name ${parsedFrontmatter.data.name} does not match folder ${folderName}.`,
      });
    }
  }

  const requiredHeadings = [
    "## Start here",
    "## When to use this skill",
    "## When NOT to use this skill",
    "## Required active references",
    "## Portability rules",
    "## Supporting and historical surface",
  ];

  for (const heading of requiredHeadings) {
    if (!body.includes(heading)) {
      diagnostics.push({
        code: "missing-heading",
        level: "error",
        message: `Generated SKILL.md is missing heading: ${heading}`,
      });
    }
  }

  if (containsAbsolutePath(markdown)) {
    diagnostics.push({
      code: "absolute-path-in-skill",
      level: "error",
      message: "Compiled SKILL.md contains an absolute path.",
    });
  }

  const relativeFiles = await walkFiles(normalizedDir);
  for (const relativePath of relativeFiles) {
    const content = await readTextFile(resolve(normalizedDir, relativePath)).catch(() => "");
    if (content !== "" && containsAbsolutePath(content)) {
      diagnostics.push({
        code: "absolute-path-in-file",
        level: "error",
        message: `Compiled file contains an absolute path: ${relativePath}`,
      });
    }
  }

  const requiredReferenceLinks = [...markdown.matchAll(/\[[^\]]+\]\((references\/[^)]+)\)/gu)]
    .map((match) => match[1])
    .filter((value): value is string => value !== undefined);
  if (requiredReferenceLinks.length === 0) {
    diagnostics.push({
      code: "no-reference-links",
      level: "error",
      message: "Compiled SKILL.md does not link to any reference file.",
    });
  }

  for (const referencePath of requiredReferenceLinks) {
    if (!relativeFiles.includes(referencePath)) {
      diagnostics.push({
        code: "missing-linked-reference",
        level: "error",
        message: `SKILL.md links to ${referencePath}, but the file is missing.`,
      });
    }
  }

  return finalizeResult(diagnostics);
};
