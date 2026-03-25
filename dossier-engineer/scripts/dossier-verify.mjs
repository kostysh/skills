#!/usr/bin/env node
/**
 * dossier-verify.mjs
 *
 * Canonical verification bundle for dossier workflow steps.
 * Runs the skill-provided checks in one place and emits a JSON artifact that
 * dossier-step-close can validate.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readDossierRecord } from './lib/dossier-utils.mjs';
import { writeJsonAtomic } from './lib/fs-utils.mjs';
import { getCurrentCommit, inGitRepo } from './lib/git-utils.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const quoteArg = (value) => {
  const text = String(value);
  return /^[A-Za-z0-9_./:=,@+-]+$/.test(text) ? text : JSON.stringify(text);
};

const formatCli = (parts) => parts.map((part) => quoteArg(part)).join(' ');

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
    step: take('--step', 'implementation'),
    dossier: take('--dossier', null),
    changedOnly: has('--changed-only'),
    base: take('--base', null),
    output: take('--output', null),
    skipSyncIndex: has('--skip-sync-index'),
    skipDiffCheck: has('--skip-diff-check'),
    coverageOrphansScope: take('--coverage-orphans-scope', 'auto'),
    extra: takeMany('--extra'),
  };
};

const runCommand = ({ name, command, args = [], cwd, shell = false, displayCommand = null }) => {
  const startedAt = Date.now();
  const result = shell
    ? spawnSync(command, {
        cwd,
        encoding: 'utf8',
        shell: true,
      })
    : spawnSync(command, args, {
        cwd,
        encoding: 'utf8',
      });
  return {
    name,
    command: displayCommand ?? (shell ? String(command) : formatCli([command, ...args])),
    exit_code: typeof result.status === 'number' ? result.status : 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    duration_ms: Date.now() - startedAt,
    status: result.status === 0 ? 'pass' : 'fail',
  };
};

const relativeToRoot = (root, targetPath) =>
  path.relative(root, targetPath).split(path.sep).join('/');
const canonicalNodeCommand = (scriptName, args = []) =>
  formatCli(['node', `scripts/${scriptName}`, ...args]);

const main = async () => {
  const {
    root,
    step,
    dossier,
    changedOnly,
    base,
    output,
    skipSyncIndex,
    skipDiffCheck,
    coverageOrphansScope,
    extra,
  } = parseArgs();
  const absRoot = path.resolve(root);

  if (dossier && changedOnly) {
    throw new Error('--dossier and --changed-only cannot be used together.');
  }

  let featureId = 'global';
  let dossierRelPath = null;
  if (dossier) {
    const dossierRecord = await readDossierRecord(path.resolve(absRoot, dossier), {
      root: absRoot,
    });
    featureId = String(dossierRecord.frontmatter.id ?? path.basename(dossierRecord.absPath, '.md'));
    dossierRelPath = dossierRecord.relPath;
  }

  /** @type {Array<{ name: string, command: string, exit_code: number, stdout: string, stderr: string, duration_ms: number, status: string }>} */
  const checks = [];
  const addNodeScript = (name, scriptName, scriptArgs, displayArgs = scriptArgs) => {
    checks.push(
      runCommand({
        name,
        command: process.execPath,
        args: [path.join(scriptDir, scriptName), ...scriptArgs],
        cwd: absRoot,
        displayCommand: canonicalNodeCommand(scriptName, displayArgs),
      }),
    );
  };

  if (!skipSyncIndex) {
    addNodeScript('sync-index', 'sync-index.mjs', ['--root', absRoot], ['--root', '.']);
  }

  addNodeScript('lint-dossiers', 'lint-dossiers.mjs', ['--root', absRoot], ['--root', '.']);

  const coverageArgs = ['--root', absRoot, '--orphans-scope', coverageOrphansScope];
  const coverageDisplayArgs = ['--root', '.', '--orphans-scope', coverageOrphansScope];
  if (dossierRelPath) {
    coverageArgs.push('--dossier', dossierRelPath);
    coverageDisplayArgs.push('--dossier', dossierRelPath);
  } else if (changedOnly) {
    coverageArgs.push('--changed-only');
    coverageDisplayArgs.push('--changed-only');
    if (base) coverageArgs.push('--base', base);
    if (base) coverageDisplayArgs.push('--base', base);
  }
  addNodeScript('coverage-audit', 'coverage-audit.mjs', coverageArgs, coverageDisplayArgs);

  const markerArgs = ['--root', absRoot];
  const markerDisplayArgs = ['--root', '.'];
  if (inGitRepo(absRoot) && (dossierRelPath || changedOnly)) {
    markerArgs.push('--changed-only');
    markerDisplayArgs.push('--changed-only');
    if (base) markerArgs.push('--base', base);
    if (base) markerDisplayArgs.push('--base', base);
  } else if (dossierRelPath) {
    markerArgs.push('--paths', dossierRelPath);
    markerDisplayArgs.push('--paths', dossierRelPath);
  }
  addNodeScript('debt-audit', 'debt-audit.mjs', markerArgs, markerDisplayArgs);

  if (inGitRepo(absRoot) && !skipDiffCheck) {
    checks.push(
      runCommand({
        name: 'git-diff-check',
        command: 'git',
        args: ['diff', '--check'],
        cwd: absRoot,
        displayCommand: 'git diff --check',
      }),
    );
  }

  for (const extraCommand of extra) {
    checks.push(
      runCommand({
        name: `extra:${extraCommand}`,
        command: extraCommand,
        cwd: absRoot,
        shell: true,
        displayCommand: extraCommand,
      }),
    );
  }

  const overallStatus = checks.every((check) => check.status === 'pass') ? 'pass' : 'fail';
  const currentCommit = inGitRepo(absRoot) ? getCurrentCommit(absRoot) : null;
  const artifact = {
    version: 1,
    created_at: new Date().toISOString(),
    step,
    feature_id: featureId,
    dossier: dossierRelPath,
    current_commit: currentCommit,
    status: overallStatus,
    checks,
  };

  const defaultOutput = path.join(
    absRoot,
    '.dossier',
    'verification',
    featureId,
    `${step}-${currentCommit ? currentCommit.slice(0, 12) : 'workspace'}.json`,
  );
  const outputPath = output ? path.resolve(absRoot, output) : defaultOutput;
  await writeJsonAtomic(outputPath, artifact);

  console.log(`[dossier-verify] status=${overallStatus} step=${step} feature=${featureId}`);
  console.log(`[dossier-verify] artifact=${relativeToRoot(absRoot, outputPath)}`);
  for (const check of checks) {
    console.log(
      `- ${check.name}: ${check.status} (exit ${check.exit_code}, ${check.duration_ms} ms)`,
    );
  }

  if (overallStatus !== 'pass') process.exit(2);
};

main().catch((error) => {
  console.error('[dossier-verify] FATAL:', error?.stack ?? String(error));
  process.exit(1);
});
