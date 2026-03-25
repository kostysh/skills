#!/usr/bin/env node
/**
 * coverage-audit.mjs
 *
 * Checks that each acceptance criterion ID is referenced in tests.
 * - Test reference can be in the test name or in a comment: // Covers: AC-...
 * - Coverage enforcement is separated from dossier maturity via `coverage_gate`.
 *   When `coverage_gate` is absent, the default blocking statuses are `in_progress` and `done`.
 * - Orphan reporting is scope-aware so dossier-specific audits do not get buried in repo-wide noise.
 *
 * Usage:
 *   node scripts/coverage-audit.mjs --dossier docs/features/F-0001-foo.md
 *   node scripts/coverage-audit.mjs --dossiers-dir docs/features
 *   node scripts/coverage-audit.mjs --changed-only --base origin/main
 *   node scripts/coverage-audit.mjs --dossier docs/features/F-0001-foo.md --orphans-scope=dossier
 */

import path from 'node:path';

import {
  DEFAULT_DOSSIERS_DIR,
  DEFAULT_STRICT_COVERAGE_STATUSES,
  extractAcIds,
  extractFeatureIdFromAc,
  listDossierFiles,
  matchesFeatureFile,
  readDossierRecord,
} from './lib/dossier-utils.mjs';
import { readText, walk } from './lib/fs-utils.mjs';
import {
  getChangedFiles,
  inGitRepo,
  normalizeRepoPath,
  resolveBaseRef,
  toRepoRelativePath,
} from './lib/git-utils.mjs';

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

  const strictStatusesRaw = get('--strict-statuses', null);
  const strictStatuses = strictStatusesRaw
    ? new Set(
        strictStatusesRaw
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      )
    : DEFAULT_STRICT_COVERAGE_STATUSES;

  return {
    root: get('--root', process.cwd()),
    dossier: get('--dossier', null),
    dossiersDir: get('--dossiers-dir', DEFAULT_DOSSIERS_DIR),
    changedOnly: has('--changed-only'),
    base: get('--base', null),
    strictStatuses,
    orphansScope: get('--orphans-scope', 'auto'),
  };
};

const isTestFile = (filePath) =>
  /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath) ||
  filePath.split(path.sep).includes('test') ||
  filePath.split(path.sep).includes('tests');

const selectChangedDossiers = async ({ absRoot, dossiersDir, baseRef }) => {
  if (!inGitRepo(absRoot)) {
    throw new Error('--changed-only requires a git repository.');
  }

  const absDossiersDir = path.resolve(absRoot, dossiersDir);
  const dossierFiles = await listDossierFiles(absDossiersDir);
  const dossierAbsPaths = dossierFiles.map((fileName) => path.join(absDossiersDir, fileName));
  const selected = new Set();

  const changedFiles = getChangedFiles(absRoot, baseRef);
  const changedAbsPaths = changedFiles.map((fileName) => normalizeRepoPath(absRoot, fileName));

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

const resolveOrphanScope = ({ orphansScope, dossier, changedOnly }) => {
  if (orphansScope !== 'auto') return orphansScope;
  if (dossier || changedOnly) return 'dossier';
  return 'repo';
};

const main = async () => {
  const { root, dossier, dossiersDir, changedOnly, base, strictStatuses, orphansScope } =
    parseArgs();
  const absRoot = path.resolve(root);

  if (dossier && changedOnly) {
    throw new Error('--dossier and --changed-only cannot be used together.');
  }

  /** @type {string[]} */
  const selectedDossiers = [];
  if (dossier) {
    selectedDossiers.push(path.resolve(absRoot, dossier));
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

    selectedDossiers.push(...selected);
  } else {
    const absDossiersDir = path.resolve(absRoot, dossiersDir);
    const fileNames = await listDossierFiles(absDossiersDir);
    for (const fileName of fileNames) selectedDossiers.push(path.join(absDossiersDir, fileName));
  }

  const testFiles = await walk(absRoot, [], { includeFile: isTestFile, rootDir: absRoot });
  const testContents = new Map();
  for (const testFile of testFiles) {
    try {
      testContents.set(testFile, await readText(testFile));
    } catch {
      // Ignore unreadable files.
    }
  }

  const results = [];
  const selectedFeatureIds = new Set();
  for (const dossierPath of selectedDossiers) {
    const record = await readDossierRecord(dossierPath, {
      root: absRoot,
      strictStatuses,
    });
    const frontmatter = record.frontmatter ?? {};
    const featureId =
      typeof frontmatter.id === 'string' ? frontmatter.id : path.basename(dossierPath, '.md');
    selectedFeatureIds.add(featureId);

    const found = new Map();
    const missing = [];
    for (const acId of record.acIds) {
      const hits = [];
      for (const [testFile, content] of testContents.entries()) {
        if (content.includes(acId)) hits.push(toRepoRelativePath(absRoot, testFile));
      }
      if (hits.length === 0) missing.push(acId);
      else found.set(acId, hits);
    }

    results.push({
      dossier: record.relPath,
      featureId,
      title: frontmatter.title ?? '',
      status: frontmatter.status ?? null,
      coverageGate: record.coverageGate,
      acCount: record.acIds.length,
      found,
      missing,
    });
  }

  const orphanMode = resolveOrphanScope({ orphansScope, dossier, changedOnly });
  const allAuditedAcs = new Set(
    results.flatMap((result) => [...result.found.keys(), ...result.missing]),
  );
  const orphan = new Map();
  const regex = /\bAC-F(\d{4})-(\d{1,2})\b/g;

  for (const [testFile, content] of testContents.entries()) {
    for (;;) {
      const match = regex.exec(content);
      if (!match) break;
      const acId = `AC-F${match[1]}-${match[2].padStart(2, '0')}`;
      if (allAuditedAcs.has(acId)) continue;

      const featureId = extractFeatureIdFromAc(acId);
      const inScope =
        orphanMode === 'repo' ||
        (orphanMode === 'dossier' && featureId && selectedFeatureIds.has(featureId));
      if (!inScope || orphanMode === 'none') continue;

      const relPath = toRepoRelativePath(absRoot, testFile);
      if (!orphan.has(acId)) orphan.set(acId, new Set());
      orphan.get(acId).add(relPath);
    }
  }

  const blockingMissing = results.reduce(
    (total, result) => total + (result.coverageGate === 'strict' ? result.missing.length : 0),
    0,
  );
  const informationalMissing = results.reduce(
    (total, result) => total + (result.coverageGate !== 'strict' ? result.missing.length : 0),
    0,
  );

  console.log(
    `Coverage audit: ${results.length} dossier(s), ${testFiles.length} test file(s) scanned. Blocking missing: ${blockingMissing}. Informational missing: ${informationalMissing}. Orphans: ${orphan.size} (scope: ${orphanMode}).`,
  );

  for (const result of results) {
    console.log(`\n== ${result.dossier} ==`);
    console.log(
      `Status: ${result.status ?? 'unknown'} | coverage gate: ${result.coverageGate} | AC count: ${result.acCount}`,
    );

    if (result.missing.length === 0) {
      console.log('All audited AC IDs are referenced in tests.');
    } else {
      const label = result.coverageGate === 'strict' ? 'Blocking' : 'Informational';
      console.log(`${label} missing AC reference(s):`);
      for (const acId of result.missing) console.log(`- ${acId}`);
    }
  }

  if (orphan.size > 0) {
    console.log(`\n== Orphan AC references (${orphanMode} scope) ==`);
    for (const [acId, files] of [...orphan.entries()].sort((left, right) =>
      left[0].localeCompare(right[0]),
    )) {
      console.log(`- ${acId}: ${[...files].sort().join(', ')}`);
    }
  }

  if (blockingMissing > 0) process.exit(3);
};

main().catch((error) => {
  console.error('[coverage-audit] FATAL:', error?.stack ?? String(error));
  process.exit(1);
});
