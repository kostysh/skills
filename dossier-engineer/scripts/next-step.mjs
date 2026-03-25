#!/usr/bin/env node
/**
 * next-step.mjs
 *
 * Canonical answer to “what should happen next?” across backlog state,
 * dossier maturity, review freshness, and uncommitted work.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { DEFAULT_DOSSIERS_DIR, readAllDossiers, readDossierRecord } from './lib/dossier-utils.mjs';
import { fileExists, readText } from './lib/fs-utils.mjs';
import { getCurrentCommit, hasDirtyWorktree, inGitRepo } from './lib/git-utils.mjs';

const BACKLOG_FILE = 'docs/backlog/feature-candidates.md';

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
    json: has('--json'),
  };
};

const parseCandidates = (markdown) => {
  const candidates = [];
  for (const line of String(markdown).split(/\r?\n/)) {
    if (!/^\|\s*CF-\d+\s*\|/.test(line)) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 7) continue;
    const [id, title, area, status, dependsOn, why, dossier] = cells;
    candidates.push({ id, title, area, status, dependsOn, why, dossier });
  }
  return candidates;
};

const statusToNextStep = (status) => {
  switch (status) {
    case 'proposed':
      return 'spec-compact';
    case 'shaped':
      return 'plan-slice';
    case 'planned':
      return 'implementation';
    case 'in_progress':
      return 'implementation';
    case 'done':
      return 'none';
    case 'parked':
      return 'resume-or-discard';
    default:
      return 'feature-intake';
  }
};

const readLatestJsonFile = async (dirPath) => {
  if (!(await fileExists(dirPath))) return null;
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(async (entry) => {
        const absPath = path.join(dirPath, entry.name);
        const stat = await fs.stat(absPath);
        return { absPath, mtimeMs: stat.mtimeMs };
      }),
  );
  files.sort((left, right) => right.mtimeMs - left.mtimeMs);
  if (files.length === 0) return null;
  return JSON.parse(await fs.readFile(files[0].absPath, 'utf8'));
};

const selectActiveDossier = (dossiers) => {
  const priority = ['in_progress', 'planned', 'shaped', 'proposed', 'parked', 'done'];
  return (
    [...dossiers].sort((left, right) => {
      const leftPriority = priority.indexOf(String(left.frontmatter.status));
      const rightPriority = priority.indexOf(String(right.frontmatter.status));
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return String(left.frontmatter.id).localeCompare(String(right.frontmatter.id));
    })[0] ?? null
  );
};

const main = async () => {
  const { root, dossier, json } = parseArgs();
  const absRoot = path.resolve(root);
  const dossiers = await readAllDossiers(absRoot, DEFAULT_DOSSIERS_DIR, { root: absRoot });

  let target;
  if (dossier) {
    target = await readDossierRecord(path.resolve(absRoot, dossier), { root: absRoot });
  } else {
    target = selectActiveDossier(dossiers);
  }

  const backlogPath = path.resolve(absRoot, BACKLOG_FILE);
  const candidates = (await fileExists(backlogPath))
    ? parseCandidates(await readText(backlogPath))
    : [];
  const backlogNext =
    candidates.find((candidate) => candidate.status === 'confirmed') ??
    candidates.find((candidate) => candidate.status === 'candidate') ??
    null;

  let latestStepArtifact = null;
  let latestReviewArtifact = null;
  let currentCommit = null;
  let dirtyWorktree = false;
  if (inGitRepo(absRoot)) {
    currentCommit = getCurrentCommit(absRoot);
    dirtyWorktree = hasDirtyWorktree(absRoot);
  }

  if (target) {
    const featureId = String(target.frontmatter.id ?? path.basename(target.absPath, '.md'));
    latestStepArtifact = await readLatestJsonFile(
      path.join(absRoot, '.dossier', 'steps', featureId),
    );
    latestReviewArtifact = await readLatestJsonFile(
      path.join(absRoot, '.dossier', 'reviews', featureId),
    );
  }

  const workflowNext =
    latestStepArtifact?.process_complete === false
      ? latestStepArtifact.next_step
      : target
        ? statusToNextStep(target.frontmatter.status)
        : backlogNext
          ? 'feature-intake'
          : 'feature-discovery';

  const blockers =
    latestStepArtifact?.process_complete === false ? latestStepArtifact.blockers : [];
  const reviewFreshness = latestReviewArtifact
    ? currentCommit && latestReviewArtifact.reviewed_commit !== currentCommit
      ? `stale for current commit ${currentCommit}`
      : `valid for commit ${latestReviewArtifact.reviewed_commit}`
    : 'no review artifact found';

  const summary = {
    target_dossier: target ? target.relPath : null,
    dossier_status: target?.frontmatter.status ?? null,
    workflow_next: workflowNext,
    blocking_gate: blockers,
    backlog_next: backlogNext ? `${backlogNext.id} ${backlogNext.title}` : null,
    uncommitted_work: dirtyWorktree,
    review_freshness: reviewFreshness,
    process_complete: latestStepArtifact ? Boolean(latestStepArtifact.process_complete) : null,
  };

  if (json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`Workflow next: ${summary.workflow_next}`);
  console.log(`Target dossier: ${summary.target_dossier ?? 'none selected'}`);
  console.log(`Dossier status: ${summary.dossier_status ?? 'n/a'}`);
  console.log(
    `Blocking gate: ${summary.blocking_gate.length > 0 ? summary.blocking_gate.join(' | ') : 'none recorded'}`,
  );
  console.log(`Backlog next: ${summary.backlog_next ?? 'none'}`);
  console.log(`Uncommitted work: ${summary.uncommitted_work ? 'yes' : 'no'}`);
  console.log(`Review freshness: ${summary.review_freshness}`);
  console.log(
    `Process-complete: ${summary.process_complete === null ? 'unknown' : summary.process_complete ? 'yes' : 'no'}`,
  );
};

main().catch((error) => {
  console.error('[next-step] FATAL:', error?.stack ?? String(error));
  process.exit(1);
});
