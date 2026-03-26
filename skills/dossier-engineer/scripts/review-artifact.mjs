#!/usr/bin/env node
/**
 * review-artifact.mjs
 *
 * Persists an independent review result as a durable JSON artifact.
 * The artifact becomes the machine-checkable input for dossier-step-close.
 *
 * Usage:
 *   node scripts/review-artifact.mjs --dossier docs/features/F-0001-foo.md --step implementation --verdict PASS
 *   node scripts/review-artifact.mjs --dossier docs/features/F-0001-foo.md --step implementation --verdict FAIL --must-fix "Missing rollback path"
 */

import path from 'node:path';

import { readDossierRecord } from './lib/dossier-utils.mjs';
import { writeJsonAtomic } from './lib/fs-utils.mjs';
import { getCurrentCommit, inGitRepo } from './lib/git-utils.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const take = (name, fallback = null) => {
    const index = args.indexOf(name);
    if (index === -1) return fallback;
    const value = args[index + 1];
    if (!value || value.startsWith('--')) return fallback;
    return value;
  };
  const takeMany = (name) => {
    const values = [];
    for (let index = 0; index < args.length; index += 1) {
      if (args[index] === name) {
        const value = args[index + 1];
        if (value && !value.startsWith('--')) values.push(value);
      }
    }
    return values;
  };

  return {
    root: take('--root', process.cwd()),
    dossier: take('--dossier', null),
    step: take('--step', null),
    verdict: take('--verdict', null),
    reviewer: take('--reviewer', 'independent-reviewer'),
    reviewedCommit: take('--reviewed-commit', null),
    notes: take('--notes', ''),
    output: take('--output', null),
    mustFix: takeMany('--must-fix'),
    shouldFix: takeMany('--should-fix'),
    evidence: takeMany('--evidence'),
  };
};

const ensureRequired = (value, message) => {
  if (!value) throw new Error(message);
  return value;
};

const main = async () => {
  const {
    root,
    dossier,
    step,
    verdict,
    reviewer,
    reviewedCommit,
    notes,
    output,
    mustFix,
    shouldFix,
    evidence,
  } = parseArgs();
  const absRoot = path.resolve(root);
  const absDossier = path.resolve(absRoot, ensureRequired(dossier, '--dossier is required.'));
  const normalizedStep = ensureRequired(step, '--step is required.');
  const normalizedVerdict = String(ensureRequired(verdict, '--verdict is required.')).toUpperCase();

  if (!['PASS', 'FAIL'].includes(normalizedVerdict)) {
    throw new Error('--verdict must be PASS or FAIL.');
  }
  if (normalizedVerdict === 'PASS' && mustFix.length > 0) {
    throw new Error('PASS review artifacts cannot contain --must-fix findings.');
  }

  const dossierRecord = await readDossierRecord(absDossier, { root: absRoot });
  const featureId = String(dossierRecord.frontmatter.id ?? path.basename(absDossier, '.md'));
  const commit = reviewedCommit || (inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null);
  if (!commit) {
    throw new Error(
      'Could not determine reviewed commit. Provide --reviewed-commit when git metadata is unavailable.',
    );
  }

  const artifact = {
    version: 1,
    created_at: new Date().toISOString(),
    reviewer,
    step: normalizedStep,
    dossier: dossierRecord.relPath,
    feature_id: featureId,
    reviewed_commit: commit,
    verdict: normalizedVerdict,
    findings: {
      must_fix: mustFix,
      should_fix: shouldFix,
      evidence,
    },
    notes,
  };

  const defaultOutput = path.join(
    absRoot,
    '.dossier',
    'reviews',
    featureId,
    `${normalizedStep}-${commit.slice(0, 12)}.json`,
  );
  const outputPath = output ? path.resolve(absRoot, output) : defaultOutput;
  await writeJsonAtomic(outputPath, artifact);

  console.log(
    `[review-artifact] Wrote ${path.relative(absRoot, outputPath).split(path.sep).join('/')}`,
  );
  console.log(
    `[review-artifact] verdict=${normalizedVerdict} step=${normalizedStep} feature=${featureId} commit=${commit}`,
  );
};

main().catch((error) => {
  console.error('[review-artifact] FATAL:', error?.stack ?? String(error));
  process.exit(1);
});
