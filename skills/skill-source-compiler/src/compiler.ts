import { isAbsolute, relative, resolve } from 'node:path';

import { removeDirectory, writeTextFile, copyFilePortable } from './fs-utils.ts';
import { SkillforgeError } from './errors.ts';
import { lintSourceBundle } from './lint.ts';
import { renderCompileReport, renderSkillMarkdown } from './renderer.ts';
import type { SkillSourceFile } from './schema.ts';
import type { LoadedSourceBundle } from './source-loader.ts';

export interface CompileOptions {
  readonly outDir: string;
  readonly clean?: boolean;
}

export interface CompileResult {
  readonly outputDir: string;
  readonly warnings: readonly string[];
}

export interface RegenerateResult {
  readonly outputDir: string;
  readonly warnings: readonly string[];
}

export interface RenderedSourceBundle {
  readonly compileReport: string;
  readonly loaded: LoadedSourceBundle;
  readonly skillMarkdown: string;
  readonly warnings: readonly string[];
}

interface PreparedCompile {
  readonly copiedFiles: readonly PreparedCopy[];
  readonly outputDir: string;
  readonly rendered: RenderedSourceBundle;
}

interface PreparedCopy {
  readonly file: SkillSourceFile;
  readonly sourcePath: string;
  readonly targetPath: string;
}

const buildSkillMarkdownSizeWarning = (
  currentSizeBytes: number,
  recommendedMaxBytes: number,
): string =>
  `Generated SKILL.md is ${currentSizeBytes} bytes, above the recommended maximum ${recommendedMaxBytes} bytes. ` +
  'Move detailed guidance into references/* and keep SKILL.md focused on activation, workflow, and navigation. ' +
  'Raise skill.recommended-skill-md-max-bytes only when references cannot reasonably reduce the size.';

const isSameOrNestedPath = (firstPath: string, secondPath: string): boolean => {
  const relativePath = relative(firstPath, secondPath);
  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !isAbsolute(relativePath))
  );
};

const pathsOverlap = (firstPath: string, secondPath: string): boolean =>
  isSameOrNestedPath(firstPath, secondPath) || isSameOrNestedPath(secondPath, firstPath);

const assertIndependentOutputDir = (sourceDir: string, outputDir: string): void => {
  const normalizedSourceDir = resolve(sourceDir);
  const normalizedOutputDir = resolve(outputDir);
  if (!pathsOverlap(normalizedSourceDir, normalizedOutputDir)) {
    return;
  }

  throw new SkillforgeError(
    'unsafe-output-overlap',
    `Output directory ${normalizedOutputDir} overlaps source bundle ${normalizedSourceDir}. ` +
      'Use an independent output directory for compile/compile-all, or use regenerate for in-place updates.',
  );
};

const collectCopyFiles = (
  loaded: LoadedSourceBundle,
  outputDir: string,
): readonly PreparedCopy[] => {
  const files = [
    ...loaded.source.references,
    ...loaded.source.assets,
    ...loaded.source.copies,
    ...loaded.source.supporting,
  ];

  return files.map((file) => ({
    file,
    sourcePath: resolve(loaded.rootDir, file.source),
    targetPath: resolve(outputDir, file.target),
  }));
};

export const renderSourceBundle = async (sourceDir: string): Promise<RenderedSourceBundle> => {
  const lint = await lintSourceBundle(sourceDir);
  if (!lint.ok) {
    const messages = lint.diagnostics
      .map((entry) => `[${entry.level}] ${entry.code}: ${entry.message}`)
      .join('\n');
    throw new SkillforgeError(
      'lint-failed',
      `Cannot compile source bundle with lint errors:\n${messages}`,
    );
  }

  const { loaded } = lint;
  const skillMarkdown = renderSkillMarkdown(loaded);
  const warnings = lint.diagnostics
    .filter((entry) => entry.level === 'warning')
    .map((entry) => entry.message);
  const skillMarkdownSizeBytes = Buffer.byteLength(skillMarkdown, 'utf8');
  const recommendedMaxBytes = loaded.source.skill['recommended-skill-md-max-bytes'];

  if (skillMarkdownSizeBytes > recommendedMaxBytes) {
    warnings.push(buildSkillMarkdownSizeWarning(skillMarkdownSizeBytes, recommendedMaxBytes));
  }

  return {
    compileReport: renderCompileReport(loaded, warnings),
    loaded,
    skillMarkdown,
    warnings,
  };
};

const prepareCompile = async (
  sourceDir: string,
  options: CompileOptions,
): Promise<PreparedCompile> => {
  const rendered = await renderSourceBundle(sourceDir);
  const outputDir = resolve(options.outDir, rendered.loaded.source.skill.name);
  assertIndependentOutputDir(rendered.loaded.rootDir, outputDir);

  return {
    copiedFiles: collectCopyFiles(rendered.loaded, outputDir),
    outputDir,
    rendered,
  };
};

const writePreparedCompile = async (
  prepared: PreparedCompile,
  options: CompileOptions,
): Promise<CompileResult> => {
  if (options.clean ?? true) {
    await removeDirectory(prepared.outputDir);
  }

  await writeTextFile(resolve(prepared.outputDir, 'SKILL.md'), prepared.rendered.skillMarkdown);
  await writeTextFile(
    resolve(prepared.outputDir, 'docs/compile-report.md'),
    prepared.rendered.compileReport,
  );

  for (const file of prepared.copiedFiles) {
    await copyFilePortable(file.sourcePath, file.targetPath);
  }

  return {
    outputDir: prepared.outputDir,
    warnings: prepared.rendered.warnings,
  };
};

/**
 * Compiles a source bundle into a standard skill folder.
 */
export const compileSourceBundle = async (
  sourceDir: string,
  options: CompileOptions,
): Promise<CompileResult> => {
  const prepared = await prepareCompile(sourceDir, options);
  return writePreparedCompile(prepared, options);
};

/**
 * Regenerates compiler-owned output inside a source bundle folder.
 */
export const regenerateSourceBundle = async (sourceDir: string): Promise<RegenerateResult> => {
  const rendered = await renderSourceBundle(sourceDir);
  const copiedFiles = collectCopyFiles(rendered.loaded, rendered.loaded.rootDir);

  for (const file of copiedFiles) {
    if (resolve(file.sourcePath) === resolve(file.targetPath)) {
      continue;
    }

    throw new SkillforgeError(
      'unsafe-in-place-target',
      `In-place regeneration cannot copy ${file.file.source} to ${file.file.target} without an explicit ownership marker.`,
    );
  }

  await writeTextFile(resolve(rendered.loaded.rootDir, 'SKILL.md'), rendered.skillMarkdown);
  await writeTextFile(
    resolve(rendered.loaded.rootDir, 'docs/compile-report.md'),
    rendered.compileReport,
  );

  return {
    outputDir: rendered.loaded.rootDir,
    warnings: rendered.warnings,
  };
};

/**
 * Compiles every source bundle contained in a directory.
 */
export const compileAllSourceBundles = async (
  sourcesRoot: string,
  options: CompileOptions,
): Promise<readonly CompileResult[]> => {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(sourcesRoot, { withFileTypes: true });
  const prepared: PreparedCompile[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    prepared.push(await prepareCompile(resolve(sourcesRoot, entry.name), options));
  }

  const results: CompileResult[] = [];
  for (const entry of prepared) {
    results.push(await writePreparedCompile(entry, options));
  }
  return results;
};
