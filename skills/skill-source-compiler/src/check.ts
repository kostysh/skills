import { resolve } from 'node:path';
import YAML from 'yaml';

import { renderSourceBundle, type RenderedSourceBundle } from './compiler.ts';
import { fileExists, readTextFile, walkFiles } from './fs-utils.ts';
import { compiledFrontmatterSchema } from './schema.ts';
import { containsAbsolutePath } from './text.ts';

export interface CheckDiagnostic {
  readonly level: 'error' | 'warning';
  readonly code: string;
  readonly message: string;
}

export interface CheckResult {
  readonly diagnostics: readonly CheckDiagnostic[];
  readonly ok: boolean;
}

const finalizeResult = (diagnostics: readonly CheckDiagnostic[]): CheckResult => ({
  diagnostics,
  ok: diagnostics.every((entry) => entry.level !== 'error'),
});

const extractFrontmatter = (markdown: string): { body: string; frontmatter: unknown } => {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u);
  if (match === null) {
    throw new Error('SKILL.md is missing YAML frontmatter.');
  }

  return {
    body: match[2] ?? '',
    frontmatter: YAML.parse(match[1] ?? ''),
  };
};

const checkSkillMarkdown = async (
  skillDir: string,
  markdown: string,
  relativeFiles: readonly string[],
  readRelativeFile: (relativePath: string) => Promise<string>,
  diagnostics: CheckDiagnostic[],
): Promise<void> => {
  let body = '';
  let frontmatter: unknown = {};
  try {
    const extracted = extractFrontmatter(markdown);
    body = extracted.body;
    frontmatter = extracted.frontmatter;
  } catch (error: unknown) {
    diagnostics.push({
      code: 'missing-frontmatter',
      level: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const parsedFrontmatter = compiledFrontmatterSchema.safeParse(frontmatter);
  if (!parsedFrontmatter.success) {
    diagnostics.push({
      code: 'invalid-frontmatter',
      level: 'error',
      message: parsedFrontmatter.error.message,
    });
  } else {
    const folderName = resolve(skillDir).split(/[/\\]/u).at(-1);
    if (parsedFrontmatter.data.name !== folderName) {
      diagnostics.push({
        code: 'folder-name-mismatch',
        level: 'error',
        message: `Frontmatter name ${parsedFrontmatter.data.name} does not match folder ${folderName}.`,
      });
    }
  }

  const requiredHeadings = [
    '## Start here',
    '## When to use this skill',
    '## When NOT to use this skill',
    '## Required active references',
    '## Portability rules',
    '## Supporting and historical surface',
  ];

  for (const heading of requiredHeadings) {
    if (!body.includes(heading)) {
      diagnostics.push({
        code: 'missing-heading',
        level: 'error',
        message: `Generated SKILL.md is missing heading: ${heading}`,
      });
    }
  }

  if (containsAbsolutePath(markdown)) {
    diagnostics.push({
      code: 'absolute-path-in-skill',
      level: 'error',
      message: 'Compiled SKILL.md contains an absolute path.',
    });
  }

  for (const relativePath of relativeFiles) {
    const content = await readRelativeFile(relativePath).catch(() => '');
    if (content !== '' && containsAbsolutePath(content)) {
      diagnostics.push({
        code: 'absolute-path-in-file',
        level: 'error',
        message: `Compiled file contains an absolute path: ${relativePath}`,
      });
    }
  }

  const requiredReferenceLinks = [...markdown.matchAll(/\[[^\]]+\]\((references\/[^)]+)\)/gu)]
    .map((match) => match[1])
    .filter((value): value is string => value !== undefined);
  if (requiredReferenceLinks.length === 0) {
    diagnostics.push({
      code: 'no-reference-links',
      level: 'error',
      message: 'Compiled SKILL.md does not link to any reference file.',
    });
  }

  for (const referencePath of requiredReferenceLinks) {
    if (!relativeFiles.includes(referencePath)) {
      diagnostics.push({
        code: 'missing-linked-reference',
        level: 'error',
        message: `SKILL.md links to ${referencePath}, but the file is missing.`,
      });
    }
  }
};

const collectEmittedRelativeFiles = (rendered: RenderedSourceBundle): readonly string[] => {
  const files = [
    'SKILL.md',
    'docs/compile-report.md',
    ...rendered.loaded.source.references.map((entry) => entry.target),
    ...rendered.loaded.source.assets.map((entry) => entry.target),
    ...rendered.loaded.source.copies.map((entry) => entry.target),
    ...rendered.loaded.source.supporting.map((entry) => entry.target),
  ];

  return [...new Set(files)].sort();
};

const checkSourceBundle = async (skillDir: string): Promise<CheckResult> => {
  const diagnostics: CheckDiagnostic[] = [];
  const normalizedDir = resolve(skillDir);
  const rendered = await renderSourceBundle(normalizedDir).catch((error: unknown) => {
    diagnostics.push({
      code: 'source-render-failed',
      level: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  });

  if (rendered === null) {
    return finalizeResult(diagnostics);
  }

  const existingSkillMarkdown = await readTextFile(resolve(normalizedDir, 'SKILL.md')).catch(
    () => null,
  );
  if (existingSkillMarkdown !== null && existingSkillMarkdown !== rendered.skillMarkdown) {
    diagnostics.push({
      code: 'generated-skill-drift',
      level: 'error',
      message: 'SKILL.md does not match the current source bundle render.',
    });
  }

  const existingCompileReport = await readTextFile(
    resolve(normalizedDir, 'docs/compile-report.md'),
  ).catch(() => null);
  if (existingCompileReport !== null && existingCompileReport !== rendered.compileReport) {
    diagnostics.push({
      code: 'compile-report-drift',
      level: 'error',
      message: 'docs/compile-report.md does not match the current source bundle render.',
    });
  }

  const relativeFiles = collectEmittedRelativeFiles(rendered);
  const sourceContentByTarget = new Map<string, string>();
  sourceContentByTarget.set('SKILL.md', rendered.skillMarkdown);
  sourceContentByTarget.set('docs/compile-report.md', rendered.compileReport);

  for (const entry of [
    ...rendered.loaded.source.references,
    ...rendered.loaded.source.assets,
    ...rendered.loaded.source.copies,
    ...rendered.loaded.source.supporting,
  ]) {
    const sourceFile = rendered.loaded.files.get(entry.source);
    if (sourceFile !== undefined) {
      sourceContentByTarget.set(entry.target, sourceFile.content);
    }
  }

  await checkSkillMarkdown(
    normalizedDir,
    rendered.skillMarkdown,
    relativeFiles,
    (relativePath) => Promise.resolve(sourceContentByTarget.get(relativePath) ?? ''),
    diagnostics,
  );

  return finalizeResult(diagnostics);
};

/**
 * Checks a compiled skill folder for portability and structural invariants.
 */
export const checkCompiledSkill = async (skillDir: string): Promise<CheckResult> => {
  const diagnostics: CheckDiagnostic[] = [];
  const normalizedDir = resolve(skillDir);
  if (await fileExists(resolve(normalizedDir, 'skill.yaml'))) {
    return checkSourceBundle(normalizedDir);
  }

  const skillMarkdownPath = resolve(normalizedDir, 'SKILL.md');
  const markdown = await readTextFile(skillMarkdownPath).catch((error: unknown) => {
    diagnostics.push({
      code: 'missing-skill-markdown',
      level: 'error',
      message: `Could not read ${skillMarkdownPath}: ${error instanceof Error ? error.message : String(error)}`,
    });
    return null;
  });
  if (markdown === null) {
    return finalizeResult(diagnostics);
  }

  const relativeFiles = await walkFiles(normalizedDir);
  await checkSkillMarkdown(
    normalizedDir,
    markdown,
    relativeFiles,
    async (relativePath) => readTextFile(resolve(normalizedDir, relativePath)),
    diagnostics,
  );

  return finalizeResult(diagnostics);
};
