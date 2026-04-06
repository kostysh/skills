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
  assert.match(result.stdout, /sync-index/);
  assert.match(result.stdout, /dossier-verify/);
  assert.match(result.stdout, /marker-audit/);
  assert.equal(result.stderr, '');
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
