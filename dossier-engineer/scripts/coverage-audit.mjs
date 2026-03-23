#!/usr/bin/env node
/**
 * Checks that each acceptance criterion ID is referenced in tests.
 * - Test reference can be in the test name or in a comment: // Covers: AC-...
 *
 * Usage:
 *   node scripts/coverage-audit.mjs --dossier docs/features/F-0001-foo.md
 *   node scripts/coverage-audit.mjs --dossiers-dir docs/features
 *   node scripts/coverage-audit.mjs --changed-only --base origin/main
 */

import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEFAULT_DOSSIERS_DIR = 'docs/features';
const STRICT_COVERAGE_STATUSES = new Set(['planned', 'in_progress', 'done']);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const has = (name) => args.includes(name);
  const get = (name, fallback) => {
    const idx = args.indexOf(name);
    if (idx === -1) return fallback;
    const value = args[idx + 1];
    if (!value || value.startsWith('--')) return fallback;
    return value;
  };

  return {
    root: get('--root', process.cwd()),
    dossier: get('--dossier', null),
    dossiersDir: get('--dossiers-dir', DEFAULT_DOSSIERS_DIR),
    changedOnly: has('--changed-only'),
    base: get('--base', null),
  };
};

const readText = async (filePath) => fs.readFile(filePath, 'utf8');

const isIgnoredDir = (name) =>
  new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.turbo', '.cache']).has(
    name,
  );

const isTestFile = (filePath) =>
  /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) ||
  filePath.split(path.sep).includes('test') ||
  filePath.split(path.sep).includes('tests');

const walk = async (dir, files = []) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (isIgnoredDir(entry.name)) continue;
      await walk(absPath, files);
    } else if (entry.isFile()) {
      if (isTestFile(absPath)) files.push(absPath);
    }
  }
  return files;
};

const extractAcIds = (markdown) => {
  const ids = new Set();
  const regex = /\bAC-F(\d{4})-(\d{1,2})\b/g;
  for (;;) {
    const match = regex.exec(markdown);
    if (!match) break;
    ids.add(`AC-F${match[1]}-${match[2].padStart(2, '0')}`);
  }
  return [...ids].sort();
};

const extractFrontmatterStatus = (markdown) => {
  const match = String(markdown).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const statusMatch = match[1].match(/^\s*status:\s*([^\s#]+)\s*$/m);
  return statusMatch ? statusMatch[1].trim() : null;
};

const listDossierFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => /^F-\d{4}-.+\.md$/i.test(fileName) || /^F-\d{4}\.md$/i.test(fileName))
    .sort();
};

const normalizeGitPath = (filePath) => filePath.split('/').join(path.sep);

const runGit = (root, args, { allowFailure = false } = {}) => {
  try {
    return execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFailure) return null;
    const stderr = error?.stderr?.toString?.().trim?.();
    throw new Error(stderr || error?.message || `git ${args.join(' ')} failed`, {
      cause: error,
    });
  }
};

const splitLines = (text) =>
  String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const getHeadRef = (root) =>
  runGit(root, ['rev-parse', '--verify', 'HEAD'], { allowFailure: true });

const resolveBaseRef = (root, explicitBase) => {
  if (explicitBase) return explicitBase;

  const envBase =
    process.env.GITHUB_BASE_REF ||
    process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME ||
    process.env.CHANGE_TARGET;

  if (envBase) {
    for (const candidate of [envBase, `origin/${envBase}`]) {
      if (
        runGit(root, ['rev-parse', '--verify', candidate], {
          allowFailure: true,
        })
      ) {
        return candidate;
      }
    }
  }

  const originHead = runGit(
    root,
    ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'],
    {
      allowFailure: true,
    },
  );

  if (originHead && runGit(root, ['rev-parse', '--verify', originHead], { allowFailure: true })) {
    return originHead;
  }

  return null;
};

const getChangedFiles = (root, baseRef) => {
  const files = new Set();
  const addLines = (text) => {
    for (const file of splitLines(text)) files.add(normalizeGitPath(file));
  };

  const headExists = Boolean(getHeadRef(root));

  if (baseRef) {
    const mergeBase = runGit(root, ['merge-base', 'HEAD', baseRef], {
      allowFailure: true,
    });
    if (!mergeBase) {
      throw new Error(`Could not resolve merge base for HEAD and "${baseRef}".`);
    }
    addLines(
      runGit(root, ['diff', '--name-only', '--diff-filter=ACMR', mergeBase, 'HEAD'], {
        allowFailure: true,
      }),
    );
  } else if (headExists) {
    addLines(
      runGit(root, ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD'], {
        allowFailure: true,
      }),
    );
  }

  addLines(
    runGit(root, ['diff', '--name-only', '--diff-filter=ACMR'], {
      allowFailure: true,
    }),
  );
  addLines(
    runGit(root, ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
      allowFailure: true,
    }),
  );
  addLines(
    runGit(root, ['ls-files', '--others', '--exclude-standard'], {
      allowFailure: true,
    }),
  );

  return [...files].sort();
};

const extractFeatureIdFromAc = (acId) => {
  const match = String(acId).match(/^AC-F(\d{4})-\d{2}$/);
  return match ? `F-${match[1]}` : null;
};

const matchesFeatureFile = (featureId, filePath) => {
  const baseName = path.basename(filePath);
  return baseName === `${featureId}.md` || baseName.startsWith(`${featureId}-`);
};

const selectChangedDossiers = async ({ absRoot, dossiersDir, baseRef }) => {
  if (!runGit(absRoot, ['rev-parse', '--show-toplevel'], { allowFailure: true })) {
    throw new Error('--changed-only requires a git repository.');
  }

  const absDossiersDir = path.resolve(absRoot, dossiersDir);
  const dossierFiles = await listDossierFiles(absDossiersDir);
  const dossierAbsPaths = dossierFiles.map((fileName) => path.join(absDossiersDir, fileName));
  const selected = new Set();

  const changedFiles = getChangedFiles(absRoot, baseRef);
  const changedAbsPaths = changedFiles.map((fileName) =>
    path.resolve(absRoot, normalizeGitPath(fileName)),
  );

  for (const absPath of changedAbsPaths) {
    if (dossierAbsPaths.includes(absPath)) selected.add(absPath);
  }

  for (const absPath of changedAbsPaths) {
    if (!isTestFile(absPath)) continue;

    let content;
    try {
      content = await readText(absPath);
    } catch {
      continue;
    }

    for (const acId of extractAcIds(content)) {
      const featureId = extractFeatureIdFromAc(acId);
      if (!featureId) continue;

      for (const dossierPath of dossierAbsPaths) {
        if (matchesFeatureFile(featureId, dossierPath)) selected.add(dossierPath);
      }
    }
  }

  return [...selected].sort();
};

const main = async () => {
  const { root, dossier, dossiersDir, changedOnly, base } = parseArgs();
  const absRoot = path.resolve(root);

  if (dossier && changedOnly) {
    throw new Error('--dossier and --changed-only cannot be used together.');
  }

  const dossiers = [];
  if (dossier) {
    dossiers.push(path.resolve(absRoot, dossier));
  } else if (changedOnly) {
    const selected = await selectChangedDossiers({
      absRoot,
      dossiersDir,
      baseRef: resolveBaseRef(absRoot, base),
    });

    if (selected.length === 0) {
      console.log('Coverage audit: 0 dossier(s) selected by --changed-only.');
      console.log('Nothing to audit.');
      return;
    }

    dossiers.push(...selected);
  } else {
    const absDossiersDir = path.resolve(absRoot, dossiersDir);
    const fileNames = await listDossierFiles(absDossiersDir);
    for (const fileName of fileNames) dossiers.push(path.join(absDossiersDir, fileName));
  }

  const testFiles = await walk(absRoot);
  /** @type {Map<string, string>} */
  const testContents = new Map();

  for (const testFile of testFiles) {
    try {
      testContents.set(testFile, await readText(testFile));
    } catch {
      // Ignore unreadable files.
    }
  }

  /** @type {{ dossier: string, status: string | null, strictCoverage: boolean, missing: string[], found: Map<string, string[]> }[]} */
  const results = [];

  for (const dossierFile of dossiers) {
    const markdown = await readText(dossierFile);
    const status = extractFrontmatterStatus(markdown);
    const strictCoverage = STRICT_COVERAGE_STATUSES.has(status);
    const acIds = extractAcIds(markdown);

    if (acIds.length === 0) {
      results.push({
        dossier: dossierFile,
        status,
        strictCoverage,
        missing: [],
        found: new Map(),
      });
      continue;
    }

    const found = new Map();
    const missing = [];
    for (const acId of acIds) {
      const hits = [];
      for (const [testFile, content] of testContents.entries()) {
        if (content.includes(acId)) hits.push(path.relative(absRoot, testFile));
      }
      if (hits.length === 0) missing.push(acId);
      else found.set(acId, hits);
    }

    results.push({
      dossier: path.relative(absRoot, dossierFile),
      status,
      strictCoverage,
      missing,
      found,
    });
  }

  const allDossierAcs = new Set(
    results.flatMap((result) => [...result.found.keys(), ...result.missing]),
  );
  const orphan = new Map();
  const regex = /\bAC-F(\d{4})-(\d{1,2})\b/g;

  for (const [testFile, content] of testContents.entries()) {
    for (;;) {
      const match = regex.exec(content);
      if (!match) break;
      const acId = `AC-F${match[1]}-${match[2].padStart(2, '0')}`;
      if (!allDossierAcs.has(acId)) {
        const relPath = path.relative(absRoot, testFile);
        if (!orphan.has(acId)) orphan.set(acId, new Set());
        orphan.get(acId).add(relPath);
      }
    }
  }

  let totalBlockingMissing = 0;
  for (const result of results) {
    if (result.strictCoverage) totalBlockingMissing += result.missing.length;
  }

  console.log(
    `Coverage audit: ${results.length} dossier(s), ${testFiles.length} test file(s) scanned.`,
  );
  for (const result of results) {
    console.log(`\n== ${result.dossier} ==`);
    if (result.status) {
      console.log(
        `Status: ${result.status} (${result.strictCoverage ? 'blocking coverage audit' : 'informational coverage audit'})`,
      );
    }
    if (result.missing.length === 0) {
      console.log('All AC IDs referenced in tests.');
    } else {
      console.log(`Missing ${result.missing.length} AC reference(s) in tests:`);
      for (const acId of result.missing) console.log(`- ${acId}`);
      if (!result.strictCoverage) {
        console.log(
          'Coverage gaps are informational for this dossier status; they become blocking when the dossier reaches `planned`.',
        );
      }
    }
  }

  if (orphan.size) {
    console.log('\n== Orphan AC references found in tests (no matching dossier AC) ==');
    for (const [acId, files] of orphan.entries()) {
      console.log(`- ${acId}: ${[...files].join(', ')}`);
    }
  }

  if (totalBlockingMissing > 0) process.exit(3);
};

main().catch((error) => {
  console.error('[coverage-audit] FATAL:', error?.stack ?? String(error));
  process.exit(1);
});
