import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const CLI_PATH = path.join(SKILL_DIR, 'scripts', 'dossier.mjs');

function runCli(args: string[], options: { cwd?: string } = {}) {
  const result = spawnSync('node', [CLI_PATH, ...args], {
    cwd: options.cwd ?? SKILL_DIR,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function runCommand(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function writeFile(root: string, relPath: string, content: string): void {
  const absPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content);
}

function createRepoFixture(t: test.TestContext): string {
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

## Definition of Done

- AC-backed tests exist for both request outcomes.
- The sample flow is covered by the coverage map.

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

void test('global help exposes unified commands and compatibility aliases', () => {
  const result = runCli(['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /feature-intake/);
  assert.match(result.stdout, /sync-index/);
  assert.match(result.stdout, /dossier-verify/);
  assert.match(result.stdout, /marker-audit/);
  assert.equal(result.stderr, '');
});

void test('feature-intake creates a dossier from selected backlog work and updates the index', (t) => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-engineer-intake-'));
  t.after(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  writeFile(repoRoot, 'docs/architecture/system.md', '# System\n');

  const result = runCli([
    'feature-intake',
    '--root',
    repoRoot,
    '--title',
    'Password reset',
    '--backlog-item-key',
    'auth-password-reset',
    '--backlog-delivery-state',
    'planned',
    '--backlog-source',
    'docs/architecture/system.md',
    '--backlog-source',
    'docs/adr/ADR-001-auth-contract.md',
    '--backlog-dependency',
    'identity-session-hardening',
    '--backlog-blocker',
    'Awaiting password reset copy review',
    '--area',
    'auth',
    '--owner',
    '@auth-team',
    '--impact',
    'client',
    '--impact',
    'server',
    '--json',
  ]);
  assert.equal(result.status, 0);

  const summary = JSON.parse(result.stdout) as {
    backlog_blockers: string[];
    backlog_delivery_state: string;
    backlog_dependencies: string[];
    backlog_item_key: string;
    backlog_source_traceability: string[];
    dossier: string;
    feature_id: string;
    partial_success: boolean;
    workflow_next: string;
  };

  assert.equal(summary.feature_id, 'F-0001');
  assert.equal(summary.backlog_item_key, 'auth-password-reset');
  assert.equal(summary.backlog_delivery_state, 'planned');
  assert.deepEqual(summary.backlog_source_traceability, [
    'docs/architecture/system.md',
    'docs/adr/ADR-001-auth-contract.md',
  ]);
  assert.deepEqual(summary.backlog_dependencies, ['identity-session-hardening']);
  assert.deepEqual(summary.backlog_blockers, ['Awaiting password reset copy review']);
  assert.equal(summary.partial_success, false);
  assert.equal(summary.workflow_next, 'spec-compact');

  const dossierText = fs.readFileSync(path.join(repoRoot, summary.dossier), 'utf8');
  assert.match(dossierText, /Backlog item key: auth-password-reset/);
  assert.match(dossierText, /Backlog delivery state at intake: planned/);
  assert.match(dossierText, /docs\/architecture\/system\.md/);
  assert.match(dossierText, /Awaiting password reset copy review/);
  assert.match(dossierText, /status: proposed/);

  const indexText = fs.readFileSync(path.join(repoRoot, 'docs/ssot/index.md'), 'utf8');
  assert.match(indexText, /\| F-0001 \| Password reset \| proposed \| deferred \| auth \|/);
});

void test('feature-intake rejects outputs outside docs/features', (t) => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-engineer-intake-boundary-'));
  t.after(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  writeFile(repoRoot, 'docs/architecture/system.md', '# System\n');

  const result = runCli([
    'feature-intake',
    '--root',
    repoRoot,
    '--title',
    'Password reset',
    '--backlog-item-key',
    'auth-password-reset',
    '--backlog-delivery-state',
    'planned',
    '--backlog-source',
    'docs/architecture/system.md',
    '--area',
    'auth',
    '--owner',
    '@auth-team',
    '--impact',
    'client',
    '--output',
    '../outside/F-0001-password-reset.md',
  ]);

  assert.equal(result.status, 2);
  assert.match(
    result.stderr,
    /--output must point to a dossier file directly inside docs\/features/,
  );
  assert.equal(
    fs.existsSync(path.join(repoRoot, '..', 'outside', 'F-0001-password-reset.md')),
    false,
  );
});

void test('feature-intake rejects nested outputs below docs/features', (t) => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-engineer-intake-nested-'));
  t.after(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  writeFile(repoRoot, 'docs/architecture/system.md', '# System\n');

  const result = runCli([
    'feature-intake',
    '--root',
    repoRoot,
    '--title',
    'Password reset',
    '--backlog-item-key',
    'auth-password-reset',
    '--backlog-delivery-state',
    'planned',
    '--backlog-source',
    'docs/architecture/system.md',
    '--area',
    'auth',
    '--owner',
    '@auth-team',
    '--impact',
    'client',
    '--output',
    'docs/features/nested/F-0001-password-reset.md',
  ]);

  assert.equal(result.status, 2);
  assert.match(
    result.stderr,
    /--output must point to a dossier file directly inside docs\/features/,
  );
});

void test('index-refresh creates the generated index content', (t) => {
  const repoRoot = createRepoFixture(t);

  const result = runCli(['index-refresh', '--root', repoRoot]);
  assert.equal(result.status, 0);

  const indexPath = path.join(repoRoot, 'docs/ssot/index.md');
  const indexText = fs.readFileSync(indexPath, 'utf8');
  assert.match(indexText, /\| F-0001 \| Sample dossier \| planned \| strict \| api \|/);
  assert.match(indexText, /graph TD/);
  assert.match(indexText, /No red flags detected/);
});

void test('coverage-audit passes and next-step returns implementation for the active dossier', (t) => {
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

  const summary = JSON.parse(nextStepResult.stdout) as {
    dossier_status: string;
    target_dossier: string;
    workflow_next: string;
  };
  assert.equal(summary.target_dossier, 'docs/features/F-0001-sample.md');
  assert.equal(summary.workflow_next, 'implementation');
  assert.equal(summary.dossier_status, 'planned');
});

void test('next-step requires --dossier when multiple dossiers exist', (t) => {
  const repoRoot = createRepoFixture(t);
  writeFile(
    repoRoot,
    'docs/features/F-0002-another.md',
    `---
id: F-0002
title: Another dossier
status: proposed
area: auth
owners: ["@team"]
depends_on: []
impacts: ["api"]
coverage_gate: deferred
created: 2026-03-26
updated: 2026-03-26
---

## Scope

Another dossier.
`,
  );

  const result = runCli(['next-step', '--root', repoRoot, '--json']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /When more than one dossier exists, --dossier is required/);
});

void test('feature-intake help exposes structured backlog handoff options', () => {
  const result = runCli(['feature-intake', '--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /--backlog-item-key/);
  assert.match(result.stdout, /--backlog-delivery-state/);
  assert.match(result.stdout, /--backlog-source/);
  assert.doesNotMatch(result.stdout, /--selected-work/);
});

void test('feature-intake propagates index-refresh failure after dossier creation', (t) => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-engineer-intake-refresh-fail-'));
  t.after(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  writeFile(repoRoot, 'docs/architecture/system.md', '# System\n');
  writeFile(
    repoRoot,
    'docs/features/F-0001-broken.md',
    `---
id: F-0001
title: Broken dossier
status: planned
area: auth
owners: ["@team"]
depends_on: []
impacts: ["api"]
coverage_gate: strict
created: 2026-03-26
updated: 2026-03-26
---

## Scope

Broken dossier.

## Change log

- 2026-03-26: Created.
`,
  );

  const result = runCli([
    'feature-intake',
    '--root',
    repoRoot,
    '--title',
    'Password reset',
    '--backlog-item-key',
    'auth-password-reset',
    '--backlog-delivery-state',
    'planned',
    '--backlog-source',
    'docs/architecture/system.md',
    '--area',
    'auth',
    '--owner',
    '@auth-team',
    '--impact',
    'client',
    '--json',
  ]);

  assert.equal(result.status, 2);
  const summary = JSON.parse(result.stdout) as {
    backlog_item_key: string;
    dossier: string;
    feature_id: string;
    partial_success: boolean;
    refresh_exit_code: number;
    refresh_stderr: string | null;
    refresh_stdout: string | null;
  };
  assert.equal(summary.feature_id, 'F-0002');
  assert.equal(summary.backlog_item_key, 'auth-password-reset');
  assert.equal(summary.partial_success, true);
  assert.equal(summary.refresh_exit_code, 2);
  assert.match(summary.refresh_stdout ?? '', /Found 2 error\(s\), 4 warning\(s\)/);
  assert.equal(summary.refresh_stderr, null);
  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/features/F-0002-password-reset.md')), true);
});

void test('feature-intake rejects deprecated selected-work flag with a migration error', (t) => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-engineer-intake-selected-work-'));
  t.after(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  writeFile(repoRoot, 'docs/architecture/system.md', '# System\n');

  const result = runCli([
    'feature-intake',
    '--root',
    repoRoot,
    '--title',
    'Password reset',
    '--selected-work',
    'auth-password-reset',
    '--area',
    'auth',
    '--owner',
    '@auth-team',
    '--impact',
    'client',
  ]);

  assert.equal(result.status, 2);
  assert.match(
    result.stderr,
    /--selected-work is no longer supported\. Use --backlog-item-key, --backlog-delivery-state, and at least one --backlog-source\./,
  );
});

void test('feature-intake rejects symlinked dossier directories that escape the repo root', (t) => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-engineer-intake-symlink-'));
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-engineer-outside-'));
  t.after(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
    fs.rmSync(outsideRoot, { recursive: true, force: true });
  });

  writeFile(repoRoot, 'docs/architecture/system.md', '# System\n');
  fs.rmSync(path.join(repoRoot, 'docs', 'features'), { recursive: true, force: true });
  fs.symlinkSync(outsideRoot, path.join(repoRoot, 'docs', 'features'), 'dir');

  const result = runCli([
    'feature-intake',
    '--root',
    repoRoot,
    '--title',
    'Password reset',
    '--backlog-item-key',
    'auth-password-reset',
    '--backlog-delivery-state',
    'planned',
    '--backlog-source',
    'docs/architecture/system.md',
    '--area',
    'auth',
    '--owner',
    '@auth-team',
    '--impact',
    'client',
  ]);

  assert.equal(result.status, 2);
  assert.match(
    result.stderr,
    /docs\/features must be a real directory inside the repository root and must not be a symlinked path\./,
  );
  assert.equal(fs.existsSync(path.join(outsideRoot, 'F-0001-password-reset.md')), false);
});

void test('next-step returns a dossier-local blocker when no dossier exists yet', (t) => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-engineer-empty-'));
  t.after(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  const nextStepResult = runCli(['next-step', '--root', repoRoot, '--json']);
  assert.equal(nextStepResult.status, 0);

  const summary = JSON.parse(nextStepResult.stdout) as {
    blocking_gate: string[];
    dossier_status: string | null;
    target_dossier: string | null;
    workflow_next: string | null;
  };

  assert.equal(summary.target_dossier, null);
  assert.equal(summary.dossier_status, null);
  assert.equal(summary.workflow_next, null);
  assert.deepEqual(summary.blocking_gate, [
    'No active dossier found. Select backlog work with backlog-engineer and create a dossier via feature-intake before using next-step.',
  ]);
});

void test('lint-dossiers reports compact-spec nudges for smells and weak contract cues', (t) => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-engineer-lint-'));
  t.after(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  writeFile(
    repoRoot,
    'docs/features/F-0002-smelly.md',
    `---
id: F-0002
title: Smelly dossier
status: shaped
area: api
owners: ["@team"]
depends_on: []
impacts: ["api"]
coverage_gate: deferred
created: 2026-03-26
updated: 2026-03-26
---

## Scope

Implement a shaped API feature.

## Requirements & Acceptance Criteria

- AC-F0002-01 Request validates the payload and stores the result.

## NFR

- Performance: fast.

## Design (compact)

### API surface
- POST /widgets
  - body: { name: string }
  - response: { ok: true }

### Edge cases and failure modes
- TBD: decide how duplicate submissions behave.

## Change log

- 2026-03-26: Initial shaped draft.
`,
  );

  const result = runCli(['lint-dossiers', '--root', repoRoot]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Missing Definition of Done section/);
  assert.match(result.stdout, /Boundary I\/O appears in the compact design/);
  assert.match(result.stdout, /Potential compound ACs detected/);
  assert.match(result.stdout, /Raw TBD found in executable sections/);
  assert.match(result.stdout, /NFR section looks aspirational/);
  assert.match(result.stdout, /Vague wording in executable sections/);
});

void test('lint-dossiers reports planning nudges for readiness, dependencies, rollout notes, and replanning tags', (t) => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dossier-engineer-plan-lint-'));
  t.after(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  writeFile(
    repoRoot,
    'docs/features/F-0009-platform-adapter.md',
    `---
id: F-0009
title: Platform adapter seam
status: done
area: platform
owners: ["@platform"]
depends_on: []
impacts: ["worker"]
coverage_gate: strict
created: 2026-03-26
updated: 2026-03-26
---

## Requirements & Acceptance Criteria

- AC-F0009-01 Adapter accepts queued work from the shared worker.

## Definition of Done

- Adapter handoff is verified by tests.

## Coverage map

| AC-F0009-01 | test/platform-adapter.test.mjs |

## Change log

- 2026-03-26: Initial adapter dossier.
`,
  );

  writeFile(
    repoRoot,
    'docs/features/F-0003-planning-smells.md',
    `---
id: F-0003
title: Planning smell dossier
status: planned
area: worker
owners: ["@team"]
depends_on: ["F-0009"]
impacts: ["worker", "db"]
coverage_gate: deferred
created: 2026-03-26
updated: 2026-03-27
---

## Open questions

- What retry ceiling should the worker assume? Owner: @team. Next: align with ops before implementation.

## Requirements & Acceptance Criteria

- AC-F0003-01 Worker handoff persists the delivery marker before downstream dispatch.

## Definition of Done

- The handoff path is verified end to end.

## Design (compact)

### Runtime / deployment surface
- Shared worker consumes outbound handoff jobs on the existing runtime path.

### Data model changes
- Add \`handoff_started_at\`; the migration becomes one-way once the worker reads the new column.

### Verification surface / initial verification plan
- AC-F0003-01: integration

## Slicing plan

### Slice SL-F0003-01: worker handoff
Covers: AC-F0003-01
Verification: integration

## Coverage map

| AC-F0003-01 | test/worker-handoff.test.mjs | planned |

## Change log

- **v1.0 (2026-03-26):** Initial planned dossier.
- **v1.1 (2026-03-27):** Updated slices after new migration notes.
`,
  );

  const result = runCli(['lint-dossiers', '--root', repoRoot]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /planning-readiness cue/);
  assert.match(result.stdout, /Planned\+ dossier has dependencies/);
  assert.match(result.stdout, /rollout order matters/);
  assert.match(result.stdout, /no short reason tags were found/);
});

void test('verify, review-artifact, and dossier-step-close complete the implementation step', (t) => {
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
  ) as {
    next_step: string;
    process_complete: boolean;
  };
  assert.equal(stepArtifact.process_complete, true);
  assert.equal(stepArtifact.next_step, 'implementation');
});
