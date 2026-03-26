import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const CLI_PATH = path.join(SKILL_DIR, 'scripts', 'dossier.mjs');

function runCli(args, { cwd = SKILL_DIR } = {}) {
  const result = spawnSync('node', [CLI_PATH, ...args], {
    cwd,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function writeFile(root, relPath, content) {
  const absPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content);
}

function createRepoFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-engineer-'));
  t.after(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  writeFile(
    root,
    'docs/features/F-0001-sample.md',
    `---
id: F-0001
title: Sample dossier
status: planned
area: api
owners: ["@team"]
depends_on: []
impacts: ["api"]
coverage_gate: strict
created: 2026-03-26
updated: 2026-03-26
---

## Scope

Implement the sample flow.

## Acceptance criteria

- AC-F0001-01 Request succeeds for a valid payload.
- AC-F0001-02 Request rejects malformed payloads.

## Coverage map

| AC-F0001-01 | test/sample.test.mjs |
| AC-F0001-02 | test/sample.test.mjs |

## Change log

- 2026-03-26: Initial dossier.
`,
  );
  writeFile(
    root,
    'test/sample.test.mjs',
    `import test from 'node:test';
import assert from 'node:assert/strict';

test('AC-F0001-01 accepts valid payloads', () => {
  assert.equal(1 + 1, 2);
});

test('AC-F0001-02 rejects malformed payloads', () => {
  // Covers: AC-F0001-02
  assert.equal(2 + 2, 4);
});
`,
  );

  assert.equal(runCommand('git', ['init'], root).status, 0);
  assert.equal(runCommand('git', ['config', 'user.name', 'Codex'], root).status, 0);
  assert.equal(runCommand('git', ['config', 'user.email', 'codex@example.com'], root).status, 0);

  return root;
}

test('global help exposes unified commands and compatibility aliases', () => {
  const result = runCli(['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /sync-index/);
  assert.match(result.stdout, /dossier-verify/);
  assert.match(result.stdout, /marker-audit/);
  assert.equal(result.stderr, '');
});

test('index-refresh creates the generated index content', (t) => {
  const repoRoot = createRepoFixture(t);

  const result = runCli(['index-refresh', '--root', repoRoot]);
  assert.equal(result.status, 0);

  const indexPath = path.join(repoRoot, 'docs/ssot/index.md');
  const indexText = fs.readFileSync(indexPath, 'utf8');
  assert.match(indexText, /\| F-0001 \| Sample dossier \| planned \| strict \| api \|/);
  assert.match(indexText, /graph TD/);
  assert.match(indexText, /No red flags detected/);
});

test('coverage-audit passes and next-step returns implementation for the active dossier', (t) => {
  const repoRoot = createRepoFixture(t);

  const coverageResult = runCli([
    'coverage-audit',
    '--root',
    repoRoot,
    '--dossier',
    'docs/features/F-0001-sample.md',
  ]);
  assert.equal(coverageResult.status, 0);
  assert.match(coverageResult.stdout, /Blocking missing: 0/);

  const nextStepResult = runCli(['next-step', '--root', repoRoot, '--json']);
  assert.equal(nextStepResult.status, 0);

  const summary = JSON.parse(nextStepResult.stdout);
  assert.equal(summary.target_dossier, 'docs/features/F-0001-sample.md');
  assert.equal(summary.workflow_next, 'implementation');
  assert.equal(summary.dossier_status, 'planned');
});

test('verify, review-artifact, and dossier-step-close complete the implementation step', (t) => {
  const repoRoot = createRepoFixture(t);

  assert.equal(runCli(['index-refresh', '--root', repoRoot]).status, 0);
  assert.equal(runCommand('git', ['add', '.'], repoRoot).status, 0);
  assert.equal(runCommand('git', ['commit', '-m', 'seed dossier repo'], repoRoot).status, 0);

  const commit = runCommand('git', ['rev-parse', '--verify', 'HEAD'], repoRoot).stdout.trim();
  const shortCommit = commit.slice(0, 12);

  const verifyResult = runCli([
    'dossier-verify',
    '--root',
    repoRoot,
    '--step',
    'implementation',
    '--dossier',
    'docs/features/F-0001-sample.md',
  ]);
  assert.equal(verifyResult.status, 0);

  const verificationArtifact = `.dossier/verification/F-0001/implementation-${shortCommit}.json`;
  assert.equal(fs.existsSync(path.join(repoRoot, verificationArtifact)), true);

  const reviewResult = runCli([
    'review-artifact',
    '--root',
    repoRoot,
    '--dossier',
    'docs/features/F-0001-sample.md',
    '--step',
    'implementation',
    '--verdict',
    'PASS',
  ]);
  assert.equal(reviewResult.status, 0);

  const reviewArtifact = `.dossier/reviews/F-0001/implementation-${shortCommit}.json`;
  assert.equal(fs.existsSync(path.join(repoRoot, reviewArtifact)), true);

  const closeResult = runCli([
    'dossier-step-close',
    '--root',
    repoRoot,
    '--dossier',
    'docs/features/F-0001-sample.md',
    '--step',
    'implementation',
    '--verify-artifact',
    verificationArtifact,
    '--review-artifact',
    reviewArtifact,
  ]);
  assert.equal(closeResult.status, 0);

  const stepArtifact = JSON.parse(
    fs.readFileSync(path.join(repoRoot, '.dossier/steps/F-0001/implementation.json'), 'utf8'),
  );
  assert.equal(stepArtifact.process_complete, true);
  assert.equal(stepArtifact.next_step, 'implementation');
});
