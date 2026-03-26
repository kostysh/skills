#!/usr/bin/env node
/**
 * dossier-step-close.mjs
 *
 * Machine-checkable closure gate for a mutating dossier step.
 * Refuses to mark a step process-complete unless:
 * - verification artifact passed,
 * - review artifact exists and is PASS,
 * - review is fresh for the current commit,
 * - the worktree is clean (unless explicitly allowed).
 */

import path from 'node:path';

import { readDossierRecord } from './lib/dossier-utils.mjs';
import { readText, writeJsonAtomic } from './lib/fs-utils.mjs';
import { getCurrentCommit, getDirtyPaths, inGitRepo } from './lib/git-utils.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const has = (name) => args.includes(name);
  const take = (name, fallback = null) => {
    const index = args.indexOf(name);
    if (index === -1) return fallback;
    const value = args[index + 1];
    if (!value || value.startsWith('--')) return fallback;
    return value;
  };

  return {
    root: take('--root', process.cwd()),
    dossier: take('--dossier', null),
    step: take('--step', null),
    verifyArtifact: take('--verify-artifact', null),
    reviewArtifact: take('--review-artifact', null),
    nextStep: take('--next-step', null),
    output: take('--output', null),
    allowDirty: has('--allow-dirty'),
  };
};

const relativeToRoot = (root, targetPath) =>
  path.relative(root, targetPath).split(path.sep).join('/');

const readJsonOrBlock = async ({ root, artifactPath, label, blockers }) => {
  const absPath = path.resolve(root, artifactPath);

  try {
    return JSON.parse(await readText(absPath));
  } catch (error) {
    const reason = String(error?.message ?? error);
    blockers.push(`Could not read ${label} artifact ${relativeToRoot(root, absPath)} (${reason}).`);
    return null;
  }
};

const defaultNextStep = (status, step) => {
  if (step === 'feature-intake') return 'spec-compact';
  if (step === 'spec-compact') return 'plan-slice';
  if (step === 'plan-slice') return 'implementation';
  if (step === 'change-proposal') return 'contract-drift-audit';

  switch (status) {
    case 'proposed':
      return 'spec-compact';
    case 'shaped':
      return 'plan-slice';
    case 'planned':
    case 'in_progress':
      return 'implementation';
    case 'done':
      return 'none';
    case 'parked':
      return 'resume-or-discard';
    default:
      return 'next-step';
  }
};

const main = async () => {
  const { root, dossier, step, verifyArtifact, reviewArtifact, nextStep, output, allowDirty } =
    parseArgs();
  const absRoot = path.resolve(root);
  const absDossier = path.resolve(absRoot, dossier ?? '');
  const normalizedStep = step;
  if (!dossier) throw new Error('--dossier is required.');
  if (!normalizedStep) throw new Error('--step is required.');
  if (!verifyArtifact) throw new Error('--verify-artifact is required.');
  if (!reviewArtifact) throw new Error('--review-artifact is required.');

  const dossierRecord = await readDossierRecord(absDossier, { root: absRoot });
  const featureId = String(dossierRecord.frontmatter.id ?? path.basename(absDossier, '.md'));
  const blockers = [];
  const verify = await readJsonOrBlock({
    root: absRoot,
    artifactPath: verifyArtifact,
    label: 'verification',
    blockers,
  });
  const review = await readJsonOrBlock({
    root: absRoot,
    artifactPath: reviewArtifact,
    label: 'review',
    blockers,
  });
  const currentCommit = inGitRepo(absRoot)
    ? getCurrentCommit(absRoot)
    : (review?.reviewed_commit ?? verify?.current_commit ?? null);

  if (verify && verify.status !== 'pass') {
    blockers.push(
      `Verification artifact does not report status=pass (got ${String(verify.status)}).`,
    );
  }
  if (verify && verify.step !== normalizedStep) {
    blockers.push(
      `Verification artifact step mismatch: expected ${normalizedStep}, got ${verify.step}.`,
    );
  }
  if (verify?.feature_id && verify.feature_id !== featureId) {
    blockers.push(
      `Verification artifact feature mismatch: expected ${featureId}, got ${verify.feature_id}.`,
    );
  }

  if (review && review.verdict !== 'PASS') {
    blockers.push(`Review artifact verdict is ${review.verdict}, expected PASS.`);
  }
  if (review && review.step !== normalizedStep) {
    blockers.push(`Review artifact step mismatch: expected ${normalizedStep}, got ${review.step}.`);
  }
  if (review?.feature_id && review.feature_id !== featureId) {
    blockers.push(
      `Review artifact feature mismatch: expected ${featureId}, got ${review.feature_id}.`,
    );
  }
  if (Array.isArray(review?.findings?.must_fix) && review.findings.must_fix.length > 0) {
    blockers.push('Review artifact still contains must-fix findings.');
  }

  if (currentCommit && review?.reviewed_commit && review.reviewed_commit !== currentCommit) {
    blockers.push(
      `Review freshness is stale for current commit ${currentCommit}; review artifact is tied to ${review.reviewed_commit}.`,
    );
  }
  if (currentCommit && verify?.current_commit && verify.current_commit !== currentCommit) {
    blockers.push(
      `Verification artifact is stale for current commit ${currentCommit}; verify artifact is tied to ${verify.current_commit}.`,
    );
  }

  if (inGitRepo(absRoot) && !allowDirty) {
    const dirtyPaths = getDirtyPaths(absRoot).filter(
      (filePath) => !filePath.startsWith('.dossier/'),
    );
    if (dirtyPaths.length > 0) {
      blockers.push(`Worktree is dirty outside .dossier/: ${dirtyPaths.join(', ')}`);
    }
  }

  const processComplete = blockers.length === 0;
  const artifact = {
    version: 1,
    created_at: new Date().toISOString(),
    feature_id: featureId,
    dossier: dossierRecord.relPath,
    step: normalizedStep,
    dossier_status: dossierRecord.frontmatter.status ?? null,
    current_commit: currentCommit,
    verification_artifact: relativeToRoot(absRoot, path.resolve(absRoot, verifyArtifact)),
    review_artifact: relativeToRoot(absRoot, path.resolve(absRoot, reviewArtifact)),
    review_fresh_for_commit: Boolean(currentCommit && review?.reviewed_commit === currentCommit),
    process_complete: processComplete,
    blockers,
    next_step: nextStep || defaultNextStep(dossierRecord.frontmatter.status, normalizedStep),
  };

  const defaultOutput = path.join(
    absRoot,
    '.dossier',
    'steps',
    featureId,
    `${normalizedStep}.json`,
  );
  const outputPath = output ? path.resolve(absRoot, output) : defaultOutput;
  await writeJsonAtomic(outputPath, artifact);

  console.log(`[dossier-step-close] Wrote ${relativeToRoot(absRoot, outputPath)}`);
  console.log(
    `[dossier-step-close] process_complete=${processComplete ? 'yes' : 'no'} step=${normalizedStep} feature=${featureId}`,
  );
  if (blockers.length > 0) {
    console.error('[dossier-step-close] blockers:');
    for (const blocker of blockers) console.error(`- ${blocker}`);
    process.exit(2);
  }
};

main().catch((error) => {
  console.error('[dossier-step-close] FATAL:', error?.stack ?? String(error));
  process.exit(1);
});
