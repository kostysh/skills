#!/usr/bin/env node
/**
 * debt-audit.mjs
 *
 * Marker audit compatibility entrypoint.
 * Checks only for explicit unresolved debt-marker keywords.
 * This script is intentionally narrow and must not be treated as a substitute
 * for manual debt review or step-closure verification.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { walk } from './lib/fs-utils.mjs';
import { getChangedFiles, inGitRepo, normalizeRepoPath, resolveBaseRef } from './lib/git-utils.mjs';

const DEFAULT_SCAN_ROOTS = [
  'src',
  'apps',
  'packages',
  'infra',
  'scripts',
  'test',
  'docs',
  '.github',
  'AGENTS.md',
  'README.md',
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'tsconfig.base.json',
  'tsconfig.typecheck.json',
  'tsconfig.eslint.json',
  'biome.json',
  'eslint.config.js',
];

const MARKER_PATTERN = /\b(TODO|FIXME|HACK|XXX)\b/;
const MARKDOWN_MARKER_PATTERN = /^\s*(?:>\s*)?(?:[-*+]|\d+\.)?\s*(TODO|FIXME|HACK|XXX)\b/;
const COMMENT_MARKER_PATTERN = /(?:^|\s)(?:\/\/|#|\/\*|\*|<!--|;|--\s).*\b(TODO|FIXME|HACK|XXX)\b/;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const has = (name) => args.includes(name);
  const get = (name, fallback) => {
    const index = args.indexOf(name);
    if (index === -1) return fallback;
    const value = args[index + 1];
    if (!value || value.startsWith('--')) return fallback;
    return value;
  };

  const rawPaths = get('--paths', '');
  return {
    root: get('--root', process.cwd()),
    changedOnly: has('--changed-only'),
    base: get('--base', null),
    paths: rawPaths
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  };
};

const isMarkdownLike = (filePath) => /\.(md|mdx|txt)$/i.test(filePath);

const shouldFlagLine = (filePath, line) => {
  if (!MARKER_PATTERN.test(line)) return false;
  if (COMMENT_MARKER_PATTERN.test(line)) return true;
  if (isMarkdownLike(filePath) && MARKDOWN_MARKER_PATTERN.test(line)) return true;
  return false;
};

const collectExplicitPaths = async (root, relPaths) => {
  const files = [];
  for (const relPath of relPaths) {
    const absPath = path.resolve(root, relPath);
    const stat = await fs.stat(absPath);
    if (stat.isDirectory()) {
      await walk(absPath, files, { rootDir: root });
      continue;
    }
    if (stat.isFile()) files.push(absPath);
  }
  return [...new Set(files)].sort();
};

const collectDefaultFiles = async (root) => {
  const files = [];
  for (const relPath of DEFAULT_SCAN_ROOTS) {
    const absPath = path.resolve(root, relPath);
    try {
      const stat = await fs.stat(absPath);
      if (stat.isDirectory()) {
        await walk(absPath, files, { rootDir: root });
      } else if (stat.isFile()) {
        files.push(absPath);
      }
    } catch {
      // Ignore missing optional paths.
    }
  }
  return [...new Set(files)].sort();
};

const main = async () => {
  const { root, changedOnly, base, paths } = parseArgs();
  const absRoot = path.resolve(root);

  /** @type {string[]} */
  let filesToScan;
  if (paths.length > 0) {
    filesToScan = await collectExplicitPaths(absRoot, paths);
  } else if (changedOnly) {
    if (!inGitRepo(absRoot)) {
      throw new Error('--changed-only requires a git repository.');
    }

    const baseRef = resolveBaseRef(absRoot, base);
    filesToScan = getChangedFiles(absRoot, baseRef).map((filePath) =>
      normalizeRepoPath(absRoot, filePath),
    );
  } else {
    filesToScan = await collectDefaultFiles(absRoot);
  }

  /** @type {Array<{ file: string, line: number, marker: string, text: string }>} */
  const findings = [];
  for (const filePath of filesToScan) {
    let content;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      continue;
    }

    const relPath =
      path.relative(absRoot, filePath).split(path.sep).join('/') || path.basename(filePath);
    const lines = content.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      if (!shouldFlagLine(filePath, line)) continue;
      const markerMatch = line.match(MARKER_PATTERN);
      findings.push({
        file: relPath,
        line: index + 1,
        marker: markerMatch?.[1] ?? 'MARKER',
        text: line.trim(),
      });
    }
  }

  console.log(`Marker audit (debt-audit compatibility): ${filesToScan.length} file(s) scanned.`);
  console.log('Scope: explicit debt markers only; manual debt review is still required.');

  if (findings.length === 0) {
    console.log('No unresolved debt markers found.');
    return;
  }

  console.error(`Found ${findings.length} unresolved debt marker(s):`);
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.marker}] ${finding.text}`);
  }

  process.exitCode = 2;
};

main().catch((error) => {
  console.error(`[debt-audit] ERROR: ${error?.message ?? String(error)}`);
  if (error?.stack) console.error(error.stack);
  process.exit(1);
});
