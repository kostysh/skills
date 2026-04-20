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
  assert.match(result.stdout, /Commands below are shipped CLI commands only\./);
  assert.match(
    result.stdout,
    /Workflow stages such as init \(repository bootstrap\), spec-compact, plan-slice, implementation/,
  );
  assert.match(result.stdout, /feature-intake/);
  assert.match(result.stdout, /sync-index/);
  assert.match(result.stdout, /dossier-verify/);
  assert.match(result.stdout, /lifecycle-refresh/);
  assert.match(result.stdout, /marker-audit/);
  assert.doesNotMatch(result.stdout, /ops-log/);
  assert.doesNotMatch(result.stdout, /session-ops-log/);
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
    workflow_stage_next: string;
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
  assert.equal(summary.workflow_stage_next, 'spec-compact');

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
    workflow_stage_next: string;
  };
  assert.equal(summary.target_dossier, 'docs/features/F-0001-sample.md');
  assert.equal(summary.workflow_stage_next, 'implementation');
  assert.equal(summary.dossier_status, 'planned');
});

void test('lifecycle-refresh rebuilds lifecycle metrics and repo-local session anchors', (t) => {
  const repoRoot = createRepoFixture(t);

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/feature-intake-c01.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
command: feature-intake
cycle_id: c01
session_id: 019d-intake
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T09:00:00+02:00
intake_process_complete_ts: 2026-04-20T09:15:00+02:00
backlog_events:
  - event_class: patch_item
    status: success
    started_ts: 2026-04-20T09:10:00+02:00
    finished_ts: 2026-04-20T09:12:00+02:00
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/spec-compact-main.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
stage: spec-compact
cycle_id: main
session_id: 019d-spec
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T09:16:00+02:00
process_complete_ts: 2026-04-20T09:40:00+02:00
first_review_agent_started_ts: 2026-04-20T09:30:00+02:00
final_pass_ts: 2026-04-20T09:38:00+02:00
review_events:
  - requested_ts: 2026-04-20T09:29:00+02:00
    verdict_ts: 2026-04-20T09:38:00+02:00
    role: spec-conformance
    verdict: pass
    allowed_by_policy: true
    invalidated: false
    rerun_reason: none
verification_events:
  - name: spec-lint
    status: pass
    started_ts: 2026-04-20T09:26:00+02:00
    finished_ts: 2026-04-20T09:27:00+02:00
    failure_class: none
backlog_events:
  - event_class: patch_item
    status: success
    started_ts: 2026-04-20T09:39:00+02:00
    finished_ts: 2026-04-20T09:40:00+02:00
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/plan-slice-main.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
stage: plan-slice
cycle_id: main
session_id: 019d-plan
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T09:45:00+02:00
process_complete_ts: 2026-04-20T10:05:00+02:00
review_events:
  - requested_ts: 2026-04-20T09:58:00+02:00
    verdict_ts: 2026-04-20T10:00:00+02:00
    role: spec-conformance
    verdict: pass
    allowed_by_policy: true
    invalidated: false
    rerun_reason: none
verification_events:
  - name: plan-check
    status: fail
    started_ts: 2026-04-20T09:50:00+02:00
    finished_ts: 2026-04-20T09:51:00+02:00
    failure_class: missing-proof
  - name: plan-check
    status: pass
    started_ts: 2026-04-20T09:54:00+02:00
    finished_ts: 2026-04-20T09:55:00+02:00
    failure_class: none
backlog_events: []
operator_interventions:
  - intervention_class: clarification
    ts: 2026-04-20T09:56:00+02:00
process_miss_events: []
---

## Scope

none
`,
  );

  writeFile(
    repoRoot,
    '.dossier/steps/F-0001/implementation.json',
    JSON.stringify(
      {
        version: 1,
        created_at: '2026-04-20T11:38:00+02:00',
        feature_id: 'F-0001',
        step: 'implementation',
        process_complete: true,
        blockers: [],
      },
      null,
      2,
    ),
  );

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/implementation-main.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
stage: implementation
cycle_id: main
session_id: 019d-impl
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T10:10:00+02:00
local_gates_green_ts: 2026-04-20T11:20:00+02:00
process_complete_ts: 2026-04-20T11:35:00+02:00
step_close_ts: 2026-04-20T11:38:00+02:00
step_artifact: .dossier/steps/F-0001/implementation.json
first_review_agent_started_ts: 2026-04-20T11:00:00+02:00
final_pass_ts: 2026-04-20T11:18:00+02:00
review_events:
  - requested_ts: 2026-04-20T10:58:00+02:00
    verdict_ts: 2026-04-20T11:05:00+02:00
    role: independent
    verdict: findings
    allowed_by_policy: true
    invalidated: false
    rerun_reason: review_findings
  - requested_ts: 2026-04-20T11:10:00+02:00
    verdict_ts: 2026-04-20T11:18:00+02:00
    role: independent
    verdict: pass
    allowed_by_policy: true
    invalidated: false
    rerun_reason: none
verification_events:
  - name: dossier-verify
    status: pass
    started_ts: 2026-04-20T10:45:00+02:00
    finished_ts: 2026-04-20T10:58:00+02:00
    failure_class: none
backlog_events:
  - event_class: patch_item
    status: blocked
    started_ts: 2026-04-20T11:19:00+02:00
    finished_ts: 2026-04-20T11:21:00+02:00
operator_interventions:
  - intervention_class: approval
    ts: 2026-04-20T11:08:00+02:00
process_miss_events:
  - miss_id: PM-001
    severity: medium
    ts: 2026-04-20T10:30:00+02:00
    class: heavy-runtime-misuse
---

## Scope

none
`,
  );

  const result = runCli([
    'lifecycle-refresh',
    '--root',
    repoRoot,
    '--feature-id',
    'F-0001',
    '--feature-cycle-id',
    'fc01',
    '--json',
  ]);
  assert.equal(result.status, 0, result.stderr);

  const summary = JSON.parse(result.stdout) as {
    feature_cycle_id: string;
    feature_id: string;
    metrics_path: string;
    session_index_path: string;
    snapshot: {
      lifecycle: {
        feature_cycle_time_ms: number | null;
        stages: {
          'spec-compact': {
            process_complete_ts: string | null;
          };
          implementation: {
            process_complete_ts: string | null;
          };
        };
      };
      metrics: {
        backlog_actualization_failures_total: number;
        closure_latency_ms: number | null;
        first_pass_close: boolean | null;
        operator_interventions_total: number;
        phase_cycle_time_ms: Record<string, number | null>;
        rerounds_per_feature: number;
        review_loop_time_ms: number | null;
        verification_failures_total: number;
      };
    };
  };

  assert.equal(summary.feature_id, 'F-0001');
  assert.equal(summary.feature_cycle_id, 'fc01');
  assert.equal(summary.snapshot.lifecycle.stages['spec-compact'].process_complete_ts, '2026-04-20T09:40:00+02:00');
  assert.equal(summary.snapshot.lifecycle.stages.implementation.process_complete_ts, '2026-04-20T11:35:00+02:00');
  assert.equal(summary.snapshot.metrics.verification_failures_total, 1);
  assert.equal(summary.snapshot.metrics.backlog_actualization_failures_total, 1);
  assert.equal(summary.snapshot.metrics.operator_interventions_total, 2);
  assert.equal(summary.snapshot.metrics.rerounds_per_feature, 1);
  assert.equal(summary.snapshot.metrics.first_pass_close, false);
  assert.equal(summary.snapshot.metrics.closure_latency_ms, 18 * 60 * 1000);
  assert.equal(summary.snapshot.metrics.phase_cycle_time_ms['spec-compact'], 24 * 60 * 1000);
  assert.equal(summary.snapshot.metrics.review_loop_time_ms, 108 * 60 * 1000);
  assert.equal(summary.snapshot.lifecycle.feature_cycle_time_ms, 155 * 60 * 1000);

  const metricsArtifact = JSON.parse(
    fs.readFileSync(path.join(repoRoot, summary.metrics_path), 'utf8'),
  ) as { identity: { feature_cycle_id: string } };
  assert.equal(metricsArtifact.identity.feature_cycle_id, 'fc01');

  const sessionIndex = fs.readFileSync(path.join(repoRoot, summary.session_index_path), 'utf8');
  assert.match(sessionIndex, /"feature_cycle_id":"fc01"/);
  assert.match(sessionIndex, /"stage_log_path":"\.dossier\/logs\/F-0001\/implementation-main\.md"/);
  assert.doesNotMatch(sessionIndex, new RegExp(escapeRegExp(repoRoot)));
});

void test('lifecycle-refresh rejects implementation end markers backed by mismatched step artifacts', (t) => {
  const repoRoot = createRepoFixture(t);

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/feature-intake-c01.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
command: feature-intake
cycle_id: c01
session_id: 019d-intake
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T09:00:00+02:00
intake_process_complete_ts: 2026-04-20T09:15:00+02:00
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  writeFile(
    repoRoot,
    '.dossier/steps/F-0001/implementation.json',
    JSON.stringify(
      {
        version: 1,
        created_at: '2026-04-20T11:38:00+02:00',
        feature_id: 'F-9999',
        step: 'change-proposal',
        process_complete: true,
        blockers: [],
      },
      null,
      2,
    ),
  );

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/implementation-main.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
stage: implementation
cycle_id: main
session_id: 019d-impl
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T10:10:00+02:00
local_gates_green_ts: 2026-04-20T11:20:00+02:00
process_complete_ts: 2026-04-20T11:35:00+02:00
step_close_ts: 2026-04-20T11:38:00+02:00
step_artifact: .dossier/steps/F-0001/implementation.json
review_events: []
verification_events: []
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  const result = runCli([
    'lifecycle-refresh',
    '--root',
    repoRoot,
    '--feature-id',
    'F-0001',
    '--feature-cycle-id',
    'fc01',
    '--json',
  ]);
  assert.equal(result.status, 0, result.stderr);

  const summary = JSON.parse(result.stdout) as {
    session_index_path: string;
    snapshot: {
      lifecycle: {
        feature_cycle_time_ms: number | null;
        stages: {
          implementation: {
            process_complete_ts: string | null;
          };
        };
      };
      metrics: {
        first_pass_close: boolean | null;
      };
    };
  };

  assert.equal(summary.snapshot.lifecycle.stages.implementation.process_complete_ts, null);
  assert.equal(summary.snapshot.lifecycle.feature_cycle_time_ms, null);
  assert.equal(summary.snapshot.metrics.first_pass_close, null);

  const sessionIndex = fs.readFileSync(path.join(repoRoot, summary.session_index_path), 'utf8');
  assert.match(sessionIndex, /"stage":"implementation"/);
  assert.match(sessionIndex, /"end_ts":null/);
});

void test('lifecycle-refresh replaces stale session-index rows when the same stage log changes session_id', (t) => {
  const repoRoot = createRepoFixture(t);

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/feature-intake-c01.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
command: feature-intake
cycle_id: c01
session_id: intake-s1
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T09:00:00+02:00
intake_process_complete_ts: 2026-04-20T09:15:00+02:00
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/implementation-main.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
stage: implementation
cycle_id: main
session_id: impl-s1
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T10:10:00+02:00
process_complete_ts: 2026-04-20T11:35:00+02:00
step_close_ts: 2026-04-20T11:38:00+02:00
step_artifact: .dossier/steps/F-0001/implementation.json
review_events: []
verification_events: []
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  writeFile(
    repoRoot,
    '.dossier/steps/F-0001/implementation.json',
    JSON.stringify(
      {
        version: 1,
        created_at: '2026-04-20T11:38:00+02:00',
        feature_id: 'F-0001',
        step: 'implementation',
        process_complete: true,
        blockers: [],
      },
      null,
      2,
    ),
  );

  let result = runCli([
    'lifecycle-refresh',
    '--root',
    repoRoot,
    '--feature-id',
    'F-0001',
    '--feature-cycle-id',
    'fc01',
    '--json',
  ]);
  assert.equal(result.status, 0, result.stderr);

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/implementation-main.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
stage: implementation
cycle_id: main
session_id: impl-s2
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T10:10:00+02:00
process_complete_ts: 2026-04-20T11:35:00+02:00
step_close_ts: 2026-04-20T11:38:00+02:00
step_artifact: .dossier/steps/F-0001/implementation.json
review_events: []
verification_events: []
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  result = runCli([
    'lifecycle-refresh',
    '--root',
    repoRoot,
    '--feature-id',
    'F-0001',
    '--feature-cycle-id',
    'fc01',
    '--json',
  ]);
  assert.equal(result.status, 0, result.stderr);

  const summary = JSON.parse(result.stdout) as { session_index_path: string };
  const sessionIndex = fs.readFileSync(path.join(repoRoot, summary.session_index_path), 'utf8');
  assert.match(sessionIndex, /"session_id":"impl-s2"/);
  assert.doesNotMatch(sessionIndex, /"session_id":"impl-s1"/);
});

void test('lifecycle-refresh computes review loop time by actual timestamps, not lexicographic offset order', (t) => {
  const repoRoot = createRepoFixture(t);

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/feature-intake-c01.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
command: feature-intake
cycle_id: c01
session_id: intake-s1
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T07:00:00Z
intake_process_complete_ts: 2026-04-20T07:10:00Z
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/spec-compact-main.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
stage: spec-compact
cycle_id: main
session_id: spec-s1
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T09:00:00+02:00
process_complete_ts: 2026-04-20T09:20:00+02:00
first_review_agent_started_ts: 2026-04-20T09:30:00+02:00
review_events: []
verification_events: []
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  writeFile(
    repoRoot,
    '.dossier/steps/F-0001/implementation.json',
    JSON.stringify(
      {
        version: 1,
        created_at: '2026-04-20T08:50:00+01:00',
        feature_id: 'F-0001',
        step: 'implementation',
        process_complete: true,
        blockers: [],
      },
      null,
      2,
    ),
  );

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/implementation-main.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
stage: implementation
cycle_id: main
session_id: impl-s1
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T08:35:00+01:00
process_complete_ts: 2026-04-20T08:50:00+01:00
step_close_ts: 2026-04-20T08:51:00+01:00
step_artifact: .dossier/steps/F-0001/implementation.json
final_pass_ts: 2026-04-20T08:45:00+01:00
review_events: []
verification_events: []
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  const result = runCli([
    'lifecycle-refresh',
    '--root',
    repoRoot,
    '--feature-id',
    'F-0001',
    '--feature-cycle-id',
    'fc01',
    '--json',
  ]);
  assert.equal(result.status, 0, result.stderr);

  const summary = JSON.parse(result.stdout) as {
    snapshot: {
      metrics: {
        review_loop_time_ms: number | null;
      };
    };
  };
  assert.equal(summary.snapshot.metrics.review_loop_time_ms, 15 * 60 * 1000);
});

void test('lifecycle-refresh keeps per-log end timestamps distinct inside the same stage', (t) => {
  const repoRoot = createRepoFixture(t);

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/feature-intake-c01.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
command: feature-intake
cycle_id: c01
session_id: intake-s1
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T09:00:00+02:00
intake_process_complete_ts: 2026-04-20T09:15:00+02:00
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/spec-compact-main.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
stage: spec-compact
cycle_id: main
session_id: spec-s1
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T09:16:00+02:00
process_complete_ts: 2026-04-20T09:40:00+02:00
review_events: []
verification_events: []
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  writeFile(
    repoRoot,
    '.dossier/logs/F-0001/spec-compact-reround.md',
    `---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
stage: spec-compact
cycle_id: reround
session_id: spec-s2
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T09:45:00+02:00
process_complete_ts: 2026-04-20T10:05:00+02:00
review_events: []
verification_events: []
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
`,
  );

  const result = runCli([
    'lifecycle-refresh',
    '--root',
    repoRoot,
    '--feature-id',
    'F-0001',
    '--feature-cycle-id',
    'fc01',
    '--json',
  ]);
  assert.equal(result.status, 0, result.stderr);

  const summary = JSON.parse(result.stdout) as { session_index_path: string };
  const sessionIndex = fs
    .readFileSync(path.join(repoRoot, summary.session_index_path), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as { stage_log_path: string; end_ts: string | null });

  const mainRecord = sessionIndex.find((record) =>
    record.stage_log_path.endsWith('/spec-compact-main.md'),
  );
  const reroundRecord = sessionIndex.find((record) =>
    record.stage_log_path.endsWith('/spec-compact-reround.md'),
  );

  assert.equal(mainRecord?.end_ts, '2026-04-20T09:40:00+02:00');
  assert.equal(reroundRecord?.end_ts, '2026-04-20T10:05:00+02:00');
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
    workflow_stage_next: string | null;
  };

  assert.equal(summary.target_dossier, null);
  assert.equal(summary.dossier_status, null);
  assert.equal(summary.workflow_stage_next, null);
  assert.deepEqual(summary.blocking_gate, [
    'No active dossier found. Select backlog work with backlog-engineer and create a dossier via feature-intake before using next-step.',
  ]);
});

void test('next-step normalizes non-stage artifact next_step values to null', (t) => {
  const repoRoot = createRepoFixture(t);

  fs.mkdirSync(path.join(repoRoot, '.dossier', 'steps', 'F-0001'), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, '.dossier/steps/F-0001/change-proposal.json'),
    JSON.stringify({
      version: 1,
      created_at: new Date().toISOString(),
      feature_id: 'F-0001',
      dossier: 'docs/features/F-0001-sample.md',
      step: 'change-proposal',
      process_complete: false,
      blockers: [
        'Executable contract changed; run contract-drift-audit before choosing the next workflow stage.',
      ],
      next_step: 'contract-drift-audit',
    }),
  );

  const nextStepResult = runCli([
    'next-step',
    '--root',
    repoRoot,
    '--dossier',
    'docs/features/F-0001-sample.md',
    '--json',
  ]);
  assert.equal(nextStepResult.status, 0);

  const summary = JSON.parse(nextStepResult.stdout) as {
    blocking_gate: string[];
    workflow_stage_next: string | null;
  };

  assert.equal(summary.workflow_stage_next, null);
  assert.deepEqual(summary.blocking_gate, [
    'Executable contract changed; run contract-drift-audit before choosing the next workflow stage.',
  ]);
});

void test('review-artifact requires explicit reviewer provenance', (t) => {
  const repoRoot = createRepoFixture(t);

  assert.equal(runCli(['index-refresh', '--root', repoRoot]).status, 0);
  assert.equal(runCommand('git', ['add', '.'], repoRoot).status, 0);
  assert.equal(runCommand('git', ['commit', '-m', 'seed dossier repo'], repoRoot).status, 0);

  const result = runCli([
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

  assert.equal(result.status, 2);
  assert.match(result.stderr, /--reviewer is required\./);
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
  const verificationPayload = JSON.parse(
    fs.readFileSync(path.join(repoRoot, verificationArtifact), 'utf8'),
  ) as {
    checks: Array<{ name: string }>;
    event_commit: string | null;
  };
  assert.equal(verificationPayload.event_commit, commit);
  assert.equal(verificationPayload.checks[0]?.name, 'index-refresh');
  assert.equal(verificationPayload.checks[1]?.name, 'lint-dossiers');

  const reviewResult = runCli([
    'review-artifact',
    '--root',
    repoRoot,
    '--dossier',
    'docs/features/F-0001-sample.md',
    '--step',
    'implementation',
    '--reviewer',
    'code-reviewer',
    '--verdict',
    'PASS',
  ]);
  assert.equal(reviewResult.status, 0);

  const reviewArtifact = `.dossier/reviews/F-0001/implementation-${shortCommit}.json`;
  assert.equal(fs.existsSync(path.join(repoRoot, reviewArtifact)), true);
  const reviewPayload = JSON.parse(
    fs.readFileSync(path.join(repoRoot, reviewArtifact), 'utf8'),
  ) as {
    event_commit: string | null;
  };
  assert.equal(reviewPayload.event_commit, commit);

  writeFile(repoRoot, 'README.md', 'Unrelated repository note.\n');
  assert.equal(runCommand('git', ['add', 'README.md'], repoRoot).status, 0);
  assert.equal(runCommand('git', ['commit', '-m', 'add unrelated note'], repoRoot).status, 0);

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
    event_commit: string | null;
    next_step: string;
    process_complete: boolean;
    review_freshness: string;
    review_trace_commit: string | null;
  };
  assert.notEqual(stepArtifact.event_commit, commit);
  assert.equal(stepArtifact.process_complete, true);
  assert.equal(stepArtifact.review_freshness, 'pass');
  assert.equal(stepArtifact.review_trace_commit, commit);
  assert.equal(stepArtifact.next_step, 'implementation');
});

void test('dossier-step-close rejects a review artifact without reviewer provenance', (t) => {
  const repoRoot = createRepoFixture(t);

  assert.equal(runCli(['index-refresh', '--root', repoRoot]).status, 0);
  assert.equal(runCommand('git', ['add', '.'], repoRoot).status, 0);
  assert.equal(runCommand('git', ['commit', '-m', 'seed dossier repo'], repoRoot).status, 0);

  const commit = runCommand('git', ['rev-parse', '--verify', 'HEAD'], repoRoot).stdout.trim();
  const shortCommit = commit.slice(0, 12);

  assert.equal(
    runCli([
      'dossier-verify',
      '--root',
      repoRoot,
      '--step',
      'implementation',
      '--dossier',
      'docs/features/F-0001-sample.md',
    ]).status,
    0,
  );

  const verificationArtifact = `.dossier/verification/F-0001/implementation-${shortCommit}.json`;
  const reviewArtifact = `.dossier/reviews/F-0001/implementation-${shortCommit}.json`;
  fs.mkdirSync(path.join(repoRoot, '.dossier/reviews/F-0001'), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, reviewArtifact),
    JSON.stringify(
      {
        version: 1,
        created_at: new Date().toISOString(),
        step: 'implementation',
        dossier: 'docs/features/F-0001-sample.md',
        feature_id: 'F-0001',
        event_commit: commit,
        verdict: 'PASS',
        findings: {
          must_fix: [],
          should_fix: [],
          evidence: [],
        },
        notes: '',
      },
      null,
      2,
    ),
  );

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

  assert.equal(closeResult.status, 2);
  assert.match(closeResult.stderr, /Review artifact is missing reviewer provenance\./);
});
