import { resolve } from "node:path";

import { removeDirectory, writeTextFile, copyFilePortable } from "./fs-utils.ts";
import { SkillforgeError } from "./errors.ts";
import { lintSourceBundle } from "./lint.ts";
import { renderCompileReport, renderSkillMarkdown } from "./renderer.ts";

export interface CompileOptions {
  readonly outDir: string;
  readonly clean?: boolean;
}

export interface CompileResult {
  readonly outputDir: string;
  readonly warnings: readonly string[];
}

const buildSkillMarkdownSizeWarning = (currentSizeBytes: number, recommendedMaxBytes: number): string =>
  `Generated SKILL.md is ${currentSizeBytes} bytes, above the recommended maximum ${recommendedMaxBytes} bytes. ` +
  "Move detailed guidance into references/* and keep SKILL.md focused on activation, workflow, and navigation. " +
  "Raise skill.recommended-skill-md-max-bytes only when references cannot reasonably reduce the size.";

/**
 * Compiles a source bundle into a standard skill folder.
 */
export const compileSourceBundle = async (
  sourceDir: string,
  options: CompileOptions,
): Promise<CompileResult> => {
  const lint = await lintSourceBundle(sourceDir);
  if (!lint.ok) {
    const messages = lint.diagnostics.map((entry) => `[${entry.level}] ${entry.code}: ${entry.message}`).join("\n");
    throw new SkillforgeError("lint-failed", `Cannot compile source bundle with lint errors:\n${messages}`);
  }

  const { loaded } = lint;
  const outputDir = resolve(options.outDir, loaded.source.skill.name);
  if (options.clean ?? true) {
    await removeDirectory(outputDir);
  }

  const renderedSkillMarkdown = renderSkillMarkdown(loaded);
  const warnings = lint.diagnostics.filter((entry) => entry.level === "warning").map((entry) => entry.message);
  const skillMarkdownSizeBytes = Buffer.byteLength(renderedSkillMarkdown, "utf8");
  const recommendedMaxBytes = loaded.source.skill["recommended-skill-md-max-bytes"];

  if (skillMarkdownSizeBytes > recommendedMaxBytes) {
    warnings.push(buildSkillMarkdownSizeWarning(skillMarkdownSizeBytes, recommendedMaxBytes));
  }

  await writeTextFile(resolve(outputDir, "SKILL.md"), renderedSkillMarkdown);
  await writeTextFile(resolve(outputDir, "docs/compile-report.md"), renderCompileReport(loaded, warnings));

  for (const file of loaded.source.references) {
    await copyFilePortable(resolve(loaded.rootDir, file.source), resolve(outputDir, file.target));
  }
  for (const file of loaded.source.assets) {
    await copyFilePortable(resolve(loaded.rootDir, file.source), resolve(outputDir, file.target));
  }
  for (const file of loaded.source.copies) {
    await copyFilePortable(resolve(loaded.rootDir, file.source), resolve(outputDir, file.target));
  }
  for (const file of loaded.source.supporting) {
    await copyFilePortable(resolve(loaded.rootDir, file.source), resolve(outputDir, file.target));
  }

  return {
    outputDir,
    warnings,
  };
};

/**
 * Compiles every source bundle contained in a directory.
 */
export const compileAllSourceBundles = async (
  sourcesRoot: string,
  options: CompileOptions,
): Promise<readonly CompileResult[]> => {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(sourcesRoot, { withFileTypes: true });
  const results: CompileResult[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    results.push(await compileSourceBundle(resolve(sourcesRoot, entry.name), options));
  }
  return results;
};
