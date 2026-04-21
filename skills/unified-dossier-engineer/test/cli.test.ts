import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');

type CliResult = {
  code: number;
  stderr: string;
  stdout: string;
};

type CliEnvelope<T> = {
  command: string;
  data: T;
  next_commands: string[];
  result: 'blocked' | 'fail' | 'ok' | 'partial_success';
  scope: Record<string, unknown>;
  warnings: string[];
};

async function makeTempRepoPath(): Promise<string> {
  return path.join(await mkdtemp(path.join(os.tmpdir(), 'ude-cli-')), 'repo');
}

function scriptPath(): string {
  return path.join(SKILL_DIR, 'scripts', 'dossier-engineer.mjs');
}

function runCli(
  args: string[],
  options: {
    allowFailure?: boolean;
    cwd?: string;
  } = {},
): CliResult {
  const result = spawnSync(process.execPath, [scriptPath(), ...args], {
    cwd: options.cwd ?? SKILL_DIR,
    encoding: 'utf8',
  });

  const code = result.status ?? 1;
  if (!options.allowFailure) {
    assert.equal(
      code,
      0,
      [
        `CLI exited with ${code}`,
        `stdout:\n${result.stdout ?? ''}`,
        `stderr:\n${result.stderr ?? ''}`,
      ].join('\n\n'),
    );
  }

  return {
    code,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function parseEnvelope<T>(stdout: string): CliEnvelope<T> {
  return JSON.parse(stdout) as CliEnvelope<T>;
}

async function initializeRepo(repo: string): Promise<void> {
  runCli(['init', '--path', repo]);
}

async function seedRefreshableBacklog(repo: string): Promise<void> {
  await initializeRepo(repo);

  const fixtureRoot = path.join(FIXTURES_DIR, 'refreshable-backlog');
  await cp(path.join(fixtureRoot, 'sources'), path.join(repo, 'sources'), { recursive: true });
  await cp(path.join(fixtureRoot, 'packets'), path.join(repo, '.dossier', 'backlog', 'packets'), {
    recursive: true,
  });
  await cp(path.join(fixtureRoot, 'patches'), path.join(repo, '.dossier', 'backlog', 'patches'), {
    recursive: true,
  });

  await cp(
    path.join(fixtureRoot, '.backlog', 'state.json'),
    path.join(repo, '.dossier', 'backlog', 'state.json'),
  );
  await cp(
    path.join(fixtureRoot, '.backlog', 'sources.json'),
    path.join(repo, '.dossier', 'backlog', 'sources.json'),
  );

  const appliedPath = path.join(repo, '.dossier', 'backlog', 'applied.json');
  const applied = JSON.parse(
    await readFile(path.join(fixtureRoot, '.backlog', 'applied.json'), 'utf8'),
  ) as {
    patches: Array<{ canonical_path: string }>;
    packets: Array<{ canonical_path: string }>;
  };
  applied.packets = applied.packets.map((entry) => ({
    ...entry,
    canonical_path: `.dossier/backlog/${entry.canonical_path}`,
  }));
  applied.patches = applied.patches.map((entry) => ({
    ...entry,
    canonical_path: `.dossier/backlog/${entry.canonical_path}`,
  }));
  await writeFile(appliedPath, `${JSON.stringify(applied, null, 2)}\n`);
}

test('init creates the unified process root and SSOT skeleton', async () => {
  const repo = await makeTempRepoPath();

  const initResult = parseEnvelope<{
    backlog_manifest_path: string;
    dossiers_dir: string;
    index_path: string;
    path: string;
    process_manifest_path: string;
  }>(runCli(['init', '--path', repo]).stdout);
  const payload = initResult.data;

  assert.equal(payload.process_manifest_path, path.join(repo, '.dossier', 'manifest.json'));
  assert.equal(payload.backlog_manifest_path, path.join(repo, '.dossier', 'backlog', 'manifest.json'));
  assert.equal(payload.index_path, path.join(repo, 'docs', 'ssot', 'index.md'));
  assert.equal(payload.dossiers_dir, path.join(repo, 'docs', 'ssot', 'features'));
  assert.equal(initResult.command, 'init');
  assert.equal(initResult.result, 'ok');
  await stat(path.join(repo, '.dossier', 'backlog', 'state.json'));
  await stat(path.join(repo, '.dossier', 'logs', 'feature-intake'));
  await stat(path.join(repo, 'docs', 'ssot', 'features', '.gitkeep'));
});

test('command help smoke covers the shipped public surface', () => {
  const commands = [
    'help',
    'feature-intake',
    'register-source',
    'list-sources',
    'update-source-path',
    'remove-source',
    'search',
    'gaps',
    'template',
    'packet',
    'patch-item',
    'remove-item',
    'report',
    'plan-slice',
    'implementation',
    'change-proposal',
    'contract-drift-audit',
    'coverage-audit',
    'debt-audit',
    'dependency-graph',
    'sync-index',
    'index-refresh',
    'lint-dossiers',
    'dossier-verify',
    'dossier-step-close',
    'next-step',
    'lifecycle-refresh',
  ] as const;

  for (const command of commands) {
    const result = command === 'help' ? runCli(['--help']) : runCli(['help', command]);
    assert.match(result.stdout, /Usage:/, `missing Usage block for ${command}`);
    assert.match(result.stdout, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    if (command === 'feature-intake') {
      assert.match(result.stdout, /canonical stage-controller commands/);
      assert.doesNotMatch(result.stdout, /not shipped CLI subcommands/);
    }
  }

  const globalHelp = runCli(['--help']);
  assert.match(globalHelp.stdout, /The only public utility for the merged dossier\/backlog runtime\./);
  assert.doesNotMatch(globalHelp.stdout, /references\/workflow\.md/);
  assert.doesNotMatch(globalHelp.stdout, /\badr-log\b/);
  assert.doesNotMatch(globalHelp.stdout, /\bdependency-check\b/);
});

test('legacy commands are not part of the shipped public surface', () => {
  const help = runCli(['--help']);
  assert.doesNotMatch(help.stdout, /marker-audit/);
  assert.doesNotMatch(help.stdout, /migrate-split-artifacts/);
  assert.doesNotMatch(help.stdout, /rollout-readiness/);
  assert.doesNotMatch(help.stdout, /backlog-engineer is transitional/);

  for (const command of ['marker-audit', 'migrate-split-artifacts', 'rollout-readiness'] as const) {
    const result = runCli([command], { allowFailure: true });
    assert.equal(result.code, 2);
    assert.match(result.stderr, new RegExp(`Unknown command: ${command}`));
  }
});

test('backlog root discovery errors point to dossier-engineer init', async () => {
  const repo = await makeTempRepoPath();
  await mkdir(repo, { recursive: true });

  const result = runCli(
    ['register-source', '--path', 'docs/source.md', '--kind', 'spec', '--authority', 'repo'],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 5);
  assert.match(result.stderr, /dossier-engineer init --path <path>/);
  assert.doesNotMatch(result.stderr, /backlog-engineer init/);
});

test('feature-intake and stage controllers produce unified dossiers and stage logs', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    backlog_followup_kind: null;
    backlog_followup_required: boolean;
    backlog_followup_resolved: boolean;
    cycle_id: string;
    dossier: string;
    entered_ts: string;
    feature_cycle_id: string;
    feature_id: string;
    log_path: string;
    next_commands: string[];
    ready_for_close_ts: string;
    stage: string;
    stage_state: string;
    transition_events: Array<{ at: string; kind: string }>;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Auth Timeout',
        '--backlog-item-key',
        'auth-timeout',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'auth.md',
        '--area',
        'auth',
        '--owner',
        'identity',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );
  const intake = intakeEnvelope.data;

  assert.equal(intakeEnvelope.command, 'feature-intake');
  assert.equal(intakeEnvelope.result, 'ok');
  assert.deepEqual(intakeEnvelope.scope, {
    feature_cycle_id: intake.feature_cycle_id,
    feature_id: intake.feature_id,
  });
  assert.match(intake.dossier, /^docs\/ssot\/features\/F-\d{4}-/);
  assert.equal(intake.stage, 'feature-intake');
  assert.equal(intake.stage_state, 'ready_for_close');
  assert.match(intake.cycle_id, /^intake-/);
  assert.match(intake.entered_ts, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(intake.ready_for_close_ts, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(intake.log_path, `.dossier/logs/feature-intake/${intake.feature_id}--${intake.feature_cycle_id}.md`);
  assert.deepEqual(intake.transition_events.map((event) => event.kind), ['entered', 'ready_for_close']);
  assert.equal(intake.backlog_followup_required, false);
  assert.equal(intake.backlog_followup_kind, null);
  assert.equal(intake.backlog_followup_resolved, true);
  assert.deepEqual(intakeEnvelope.next_commands, [`dossier-engineer spec-compact --feature-id ${intake.feature_id}`]);
  await stat(path.join(repo, intake.dossier));
  await stat(path.join(repo, '.dossier', 'logs', 'feature-intake', `${intake.feature_id}--${intake.feature_cycle_id}.md`));

  const stageStartEnvelope = parseEnvelope<{
    cycle_id: string;
    feature_cycle_id: string;
    stage_state: string;
  }>(
    runCli(['spec-compact', '--feature-id', intake.feature_id], { cwd: repo }).stdout,
  );
  const stageStart = stageStartEnvelope.data;
  const stageReadyEnvelope = parseEnvelope<{
    cycle_id: string;
    feature_cycle_id: string;
    ready_for_close_ts: string;
    stage_state: string;
  }>(
    runCli(['spec-compact', '--feature-id', intake.feature_id, '--ready-for-close'], {
      cwd: repo,
    }).stdout,
  );
  const stageReady = stageReadyEnvelope.data;
  const stageReadyWithCycleEnvelope = parseEnvelope<{
    cycle_id: string;
    feature_cycle_id: string;
    log_path: string;
    ready_for_close_ts: string;
    stage_state: string;
  }>(
    runCli(
      ['spec-compact', '--feature-id', intake.feature_id, '--cycle-id', stageStart.cycle_id, '--ready-for-close'],
      { cwd: repo },
    ).stdout,
  );
  const stageReadyWithCycle = stageReadyWithCycleEnvelope.data;

  assert.equal(stageStart.feature_cycle_id, intake.feature_cycle_id);
  assert.equal(stageReady.feature_cycle_id, intake.feature_cycle_id);
  assert.equal(stageReadyWithCycle.feature_cycle_id, intake.feature_cycle_id);
  assert.equal(stageReady.cycle_id, stageStart.cycle_id);
  assert.equal(stageReadyWithCycle.cycle_id, stageStart.cycle_id);
  assert.equal(stageStart.stage_state, 'in_progress');
  assert.equal(stageReady.stage_state, 'ready_for_close');
  assert.equal(stageReadyWithCycle.stage_state, 'ready_for_close');
  assert.match(stageReady.ready_for_close_ts, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(
    stageReadyWithCycle.log_path,
    new RegExp(`^\\.dossier/logs/spec-compact/${intake.feature_id}--${intake.feature_cycle_id}--${stageStart.cycle_id}\\.md$`),
  );
});

test('dossier-verify artifacts use the canonical dossier-engineer command display', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Verification Command Display',
        '--backlog-item-key',
        'verification-command-display',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'verification.md',
        '--area',
        'ops',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const verifyResult = runCli(
    [
      'dossier-verify',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--skip-index-refresh',
      '--skip-diff-check',
    ],
    { cwd: repo, allowFailure: true },
  );
  assert.match(verifyResult.stdout, /\[dossier-verify\] artifact=/);
  const artifactRelativePath = verifyResult.stdout.match(/\[dossier-verify\] artifact=(.+)/)?.[1]?.trim();
  assert.ok(artifactRelativePath, 'verification artifact path not found in stdout');

  const artifact = JSON.parse(
    await readFile(path.join(repo, artifactRelativePath), 'utf8'),
  ) as {
    checks: Array<{ command: string }>;
  };
  for (const check of artifact.checks) {
    assert.match(check.command, /\bdossier-engineer\b/);
    assert.doesNotMatch(check.command, /node scripts\/dossier\.mjs/);
  }
});

test('next-step ignores non-canonical workflow stages from stale step artifacts', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Next Step Canonical Guard',
        '--backlog-item-key',
        'next-step-canonical-guard',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'next-step.md',
        '--area',
        'ops',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const featureId = intakeEnvelope.data.feature_id;
  const stepDir = path.join(repo, '.dossier', 'steps', featureId);
  await mkdir(stepDir, { recursive: true });
  await writeFile(
    path.join(stepDir, 'implementation.json'),
    `${JSON.stringify(
      {
        version: 1,
        created_at: new Date().toISOString(),
        feature_id: featureId,
        dossier: intakeEnvelope.data.dossier,
        step: 'implementation',
        process_complete: false,
        next_step: 'adr-log',
        blockers: [],
      },
      null,
      2,
    )}\n`,
  );

  const nextStep = JSON.parse(
    runCli(['next-step', '--dossier', intakeEnvelope.data.dossier, '--json'], { cwd: repo }).stdout,
  ) as {
    blocking_gate: string[];
    workflow_stage_next: string | null;
  };

  assert.equal(nextStep.workflow_stage_next, null);
  assert.ok(Array.isArray(nextStep.blocking_gate));
});

test('feature-intake rejects invalid log roots before creating a dossier', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const outside = await mkdtemp(path.join(os.tmpdir(), 'ude-fi-log-'));
  const featureIntakeLogsDir = path.join(repo, '.dossier', 'logs', 'feature-intake');
  await rm(featureIntakeLogsDir, { recursive: true, force: true });
  await symlink(outside, featureIntakeLogsDir);

  const result = runCli(
    [
      'feature-intake',
      '--title',
      'Broken Intake Log',
      '--backlog-item-key',
      'broken-intake-log',
      '--backlog-delivery-state',
      'defined',
      '--backlog-source',
      'broken.md',
      '--area',
      'ops',
      '--owner',
      'platform',
      '--impact',
      'backend',
      '--json',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_FEATURE_INTAKE_FAILED');
  assert.match(payload.error.message, /symlinked path components|must stay inside/);
  const dossiers = (await readdir(path.join(repo, 'docs', 'ssot', 'features'))).filter(
    (entry) => entry !== '.gitkeep',
  );
  assert.deepEqual(dossiers, []);
});

test('feature-intake preserves vendored partial-success output when index refresh fails after dossier creation', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const indexPath = path.join(repo, 'docs', 'ssot', 'index.md');
  await rm(indexPath, { force: true });
  await mkdir(indexPath, { recursive: true });

  const result = runCli(
    [
      'feature-intake',
      '--title',
      'Index Partial Success',
      '--backlog-item-key',
      'index-partial-success',
      '--backlog-delivery-state',
      'defined',
      '--backlog-source',
      'index-partial.md',
      '--area',
      'ops',
      '--owner',
      'platform',
      '--impact',
      'backend',
      '--json',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  const envelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
    feature_cycle_id: null;
    partial_success: boolean;
  }>(result.stdout);
  assert.equal(envelope.result, 'partial_success');
  assert.equal(envelope.data.partial_success, true);
  assert.equal(envelope.data.feature_cycle_id, null);
  await stat(path.join(repo, envelope.data.dossier));
});

test('feature-intake surfaces vendored validation failures before dossier creation', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const result = runCli(
    [
      'feature-intake',
      '--title',
      'Missing Owner',
      '--backlog-item-key',
      'missing-owner',
      '--backlog-delivery-state',
      'defined',
      '--backlog-source',
      'missing-owner.md',
      '--area',
      'ops',
      '--impact',
      'backend',
      '--json',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_FEATURE_INTAKE_FAILED');
  assert.match(payload.error.message, /--owner is required/i);
});

test('stage controllers require canonical frontmatter backlog_item_key', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Backlog Link Guard',
        '--backlog-item-key',
        'backlog-link-guard',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'backlog-link.md',
        '--area',
        'ops',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const dossierPath = path.join(repo, intakeEnvelope.data.dossier);
  const original = await readFile(dossierPath, 'utf8');
  await writeFile(dossierPath, original.replace(/^backlog_item_key: .+$/m, ''));

  const result = runCli(
    ['spec-compact', '--feature-id', intakeEnvelope.data.feature_id],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_STAGE_CONTROL_FAILED');
  assert.match(payload.error.message, /backlog_item_key/);
});

test('refresh opens source-review records and overlays readiness-focused read models', async () => {
  const repo = await makeTempRepoPath();
  await seedRefreshableBacklog(repo);

  await writeFile(
    path.join(repo, 'sources', 'docs', 'modules', 'auth.md'),
    `${await readFile(path.join(repo, 'sources', 'docs', 'modules', 'auth.md'), 'utf8')}\nchange`,
  );

  const refreshEnvelope = parseEnvelope<{
    source_review_ids: string[];
    source_reviews_created: number;
  }>(runCli(['refresh'], { cwd: repo }).stdout);
  const refresh = refreshEnvelope.data;
  const attentionEnvelope = parseEnvelope<Array<Record<string, unknown>>>(runCli(['attention'], { cwd: repo }).stdout);
  const attention = attentionEnvelope.data;
  const itemsEnvelope = parseEnvelope<
    Array<{
      computed_state: { ready_for_next_step: boolean };
      item: { item_key: string };
      open_source_review_ids: string[];
      source_review_blocked: boolean;
    }>
  >(
    runCli(['items', '--item-keys', 'auth-core'], { cwd: repo }).stdout,
  );
  const items = itemsEnvelope.data;
  const statusEnvelope = parseEnvelope<{
    open_source_review_count: number;
    ready_for_next_step_count: number;
    source_review_blocked_item_count: number;
  }>(runCli(['status'], { cwd: repo }).stdout);
  const status = statusEnvelope.data;
  const queueEnvelope = parseEnvelope<Array<{ items: string[] }>>(runCli(['queue'], { cwd: repo }).stdout);
  const queue = queueEnvelope.data;

  assert.equal(refreshEnvelope.command, 'refresh');
  assert.equal(refresh.source_reviews_created, 1);
  assert.deepEqual(refresh.source_review_ids, ['sr-11111111-1111-4111-8111-111111111111']);
  assert.equal(refreshEnvelope.next_commands[0], 'dossier-engineer attention');
  assert.match(refreshEnvelope.next_commands[1] ?? '', /dossier-engineer items --item-keys .*auth-core/);
  assert.equal(attention[0]?.entry_kind, 'source_review');
  assert.equal(attention[0]?.source_review_id, 'sr-11111111-1111-4111-8111-111111111111');
  assert.match(
    String((attention[0]?.next_commands as string[] | undefined)?.[1] ?? ''),
    /dossier-engineer items --item-keys .*auth-core.*auth-session-timeout-enforcement/,
  );
  assert.equal(items[0]?.item.item_key, 'auth-core');
  assert.equal(items[0]?.source_review_blocked, true);
  assert.equal(items[0]?.computed_state.ready_for_next_step, false);
  assert.deepEqual(items[0]?.open_source_review_ids, ['sr-11111111-1111-4111-8111-111111111111']);
  assert.equal(status.open_source_review_count, 1);
  assert.equal(status.source_review_blocked_item_count, 3);
  assert.equal(status.ready_for_next_step_count, 1);
  assert.equal(queue.length, 1);
  assert.deepEqual(queue[0]?.items, ['session-ui-timeout-banner']);
});

test('ack-source-review closes source-review records and restores readiness counts', async () => {
  const repo = await makeTempRepoPath();
  await seedRefreshableBacklog(repo);

  await writeFile(
    path.join(repo, 'sources', 'docs', 'modules', 'auth.md'),
    `${await readFile(path.join(repo, 'sources', 'docs', 'modules', 'auth.md'), 'utf8')}\nchange`,
  );
  runCli(['refresh'], { cwd: repo });

  const ackEnvelope = parseEnvelope<{
    outcome: string;
    resolution_kind: string;
    status: string;
  }>(
    runCli(['ack-source-review', '--source-id', '11111111-1111-4111-8111-111111111111'], {
      cwd: repo,
    }).stdout,
  );
  const ack = ackEnvelope.data;
  const statusEnvelope = parseEnvelope<{
    open_source_review_count: number;
    ready_for_next_step_count: number;
    source_review_blocked_item_count: number;
  }>(runCli(['status'], { cwd: repo }).stdout);
  const status = statusEnvelope.data;
  const queueEnvelope = parseEnvelope<Array<{ items: string[] }>>(runCli(['queue'], { cwd: repo }).stdout);
  const queue = queueEnvelope.data;

  assert.equal(ackEnvelope.command, 'ack-source-review');
  assert.equal(ack.status, 'closed');
  assert.equal(ack.outcome, 'no_backlog_change');
  assert.equal(ack.resolution_kind, 'ack');
  assert.equal(status.open_source_review_count, 0);
  assert.equal(status.source_review_blocked_item_count, 0);
  assert.equal(status.ready_for_next_step_count, 3);
  assert.equal(queue.length, 1);
  assert.deepEqual(queue[0]?.items, [
    'auth-core',
    'auth-session-timeout-enforcement',
    'session-ui-timeout-banner',
  ]);
});

test('source-maintenance commands return resolved source-review references', async () => {
  const repo = await makeTempRepoPath();
  await seedRefreshableBacklog(repo);

  await writeFile(
    path.join(repo, 'sources', 'docs', 'modules', 'auth.md'),
    `${await readFile(path.join(repo, 'sources', 'docs', 'modules', 'auth.md'), 'utf8')}\nchange`,
  );
  runCli(['refresh'], { cwd: repo });

  const envelope = parseEnvelope<{
    resolved_source_review_ids: string[];
    resolution_kind: string;
  }>(
    runCli(
      [
        'update-source-path',
        '--source-id',
        '11111111-1111-4111-8111-111111111111',
        '--new-path',
        'sources/docs/modules/auth.v2.md',
      ],
      { cwd: repo },
    ).stdout,
  );

  assert.equal(envelope.data.resolution_kind, 'update-source-path');
  assert.deepEqual(envelope.data.resolved_source_review_ids, [
    'sr-11111111-1111-4111-8111-111111111111',
  ]);
});

test('update-source-path rejects invalid source-review roots before mutating backlog truth', async () => {
  const repo = await makeTempRepoPath();
  await seedRefreshableBacklog(repo);

  await writeFile(
    path.join(repo, 'sources', 'docs', 'modules', 'auth.md'),
    `${await readFile(path.join(repo, 'sources', 'docs', 'modules', 'auth.md'), 'utf8')}\nchange`,
  );
  runCli(['refresh'], { cwd: repo });

  const sourceReviewDir = path.join(repo, '.dossier', 'backlog', 'source-review');
  const outside = await mkdtemp(path.join(os.tmpdir(), 'ude-source-review-'));
  await rm(sourceReviewDir, { recursive: true, force: true });
  await symlink(outside, sourceReviewDir);

  const result = runCli(
    [
      'update-source-path',
      '--source-id',
      '11111111-1111-4111-8111-111111111111',
      '--new-path',
      'sources/docs/modules/auth.v2.md',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.match(payload.error.message, /symlinked path components|must stay inside/);
  const registry = JSON.parse(
    await readFile(path.join(repo, '.dossier', 'backlog', 'sources.json'), 'utf8'),
  ) as {
    sources: Array<{ path: string; source_id: string }>;
  };
  assert.equal(
    registry.sources.find((entry) => entry.source_id === '11111111-1111-4111-8111-111111111111')
      ?.path,
    'sources/docs/modules/auth.md',
  );
});

test('stage controllers reject non-dossier paths even when feature id is valid', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Bad Dossier Guard',
        '--backlog-item-key',
        'bad-dossier-guard',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'guard.md',
        '--area',
        'ops',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  await writeFile(path.join(repo, 'misc.md'), '# not a dossier\n');
  const result = runCli(
    [
      'spec-compact',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--dossier',
      'misc.md',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_STAGE_CONTROL_FAILED');
  assert.match(payload.error.message, /must stay inside .*docs[\\/]ssot[\\/]features|dossier path/);
});

test('lifecycle-refresh rejects symlinked retro paths before writing derived artifacts', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    feature_cycle_id: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Lifecycle Guard',
        '--backlog-item-key',
        'lifecycle-guard',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'lifecycle.md',
        '--area',
        'ops',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );
  const intake = intakeEnvelope.data;

  const fs = await import('node:fs/promises');
  const outside = await mkdtemp(path.join(os.tmpdir(), 'ude-symlink-'));
  await fs.rm(path.join(repo, '.dossier', 'retro'), { recursive: true, force: true });
  await fs.symlink(outside, path.join(repo, '.dossier', 'retro'));

  const result = runCli(
    [
      'lifecycle-refresh',
      '--feature-id',
      intake.feature_id,
      '--feature-cycle-id',
      intake.feature_cycle_id,
      '--json',
    ],
    { cwd: repo, allowFailure: true },
  );
  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_LIFECYCLE_REFRESH_FAILED');
  assert.match(payload.error.message, /symlinked path components|must stay inside/);
});

test('lifecycle-refresh rejects dossiers with unsafe feature ids before deriving artifact paths', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
    feature_cycle_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Unsafe Feature Id Guard',
        '--backlog-item-key',
        'unsafe-feature-id-guard',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'unsafe.md',
        '--area',
        'ops',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const dossierPath = path.join(repo, intakeEnvelope.data.dossier);
  const original = await readFile(dossierPath, 'utf8');
  await writeFile(dossierPath, original.replace(/^id: .+$/m, 'id: ../../ude-escape'));

  const result = runCli(
    ['lifecycle-refresh', '--dossier', intakeEnvelope.data.dossier, '--json'],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_LIFECYCLE_REFRESH_FAILED');
  assert.match(payload.error.message, /feature id/i);
});

test('lifecycle-refresh rejects poisoned implementation step artifacts outside managed roots', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    feature_cycle_id: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Poisoned Step Artifact Guard',
        '--backlog-item-key',
        'poisoned-step-artifact-guard',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'poisoned.md',
        '--area',
        'ops',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  parseEnvelope<{ log_path: string }>(
    runCli(
      [
        'implementation',
        '--feature-id',
        intakeEnvelope.data.feature_id,
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const implementationEnvelope = parseEnvelope<{ log_path: string }>(
    runCli(
      [
        'implementation',
        '--feature-id',
        intakeEnvelope.data.feature_id,
        '--ready-for-close',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const implementationLogPath = path.join(repo, implementationEnvelope.data.log_path);
  const original = await readFile(implementationLogPath, 'utf8');
  const poisoned = original.replace(
    '\n---\n\n## Summary\n',
    '\nprocess_complete_ts: 2026-04-21T10:00:00.000Z\nstep_artifact: ../outside/implementation.json\n---\n\n## Summary\n',
  );
  await writeFile(implementationLogPath, poisoned);

  const result = runCli(
    [
      'lifecycle-refresh',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--feature-cycle-id',
      intakeEnvelope.data.feature_cycle_id,
      '--json',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_LIFECYCLE_REFRESH_FAILED');
  assert.match(payload.error.message, /implementation step artifact|must stay inside/);
});

test('lifecycle-refresh includes change-proposal stage telemetry', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    feature_cycle_id: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Change Proposal Telemetry',
        '--backlog-item-key',
        'change-proposal-telemetry',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'change-proposal.md',
        '--area',
        'ops',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  runCli(['change-proposal', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  runCli(['change-proposal', '--feature-id', intakeEnvelope.data.feature_id, '--ready-for-close'], {
    cwd: repo,
  });

  const refreshEnvelope = parseEnvelope<{
    snapshot: {
      lifecycle: {
        stages: Record<string, { cycle_ids: string[] }>;
      };
    };
    session_index_path: string;
  }>(
    runCli(
      [
        'lifecycle-refresh',
        '--feature-id',
        intakeEnvelope.data.feature_id,
        '--feature-cycle-id',
        intakeEnvelope.data.feature_cycle_id,
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  assert.ok(refreshEnvelope.data.snapshot.lifecycle.stages['change-proposal']);
  assert.ok(
    refreshEnvelope.data.snapshot.lifecycle.stages['change-proposal'].cycle_ids.length > 0,
  );
});

test('index helpers reject symlinked default SSOT index paths', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const outside = await mkdtemp(path.join(os.tmpdir(), 'ude-index-symlink-'));
  const indexPath = path.join(repo, 'docs', 'ssot', 'index.md');
  await rm(indexPath, { force: true });
  await symlink(path.join(outside, 'index.md'), indexPath);

  const result = runCli(['index-refresh'], { cwd: repo, allowFailure: true });
  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_INDEX_HELPER_FAILED');
  assert.match(payload.error.message, /symlinked path components|must stay inside/);
});

test('review-artifact rejects unsupported steps before touching the vendored command', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intake = JSON.parse(
    runCli(
      [
        'feature-intake',
        '--title',
        'Review Guard',
        '--backlog-item-key',
        'review-guard',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'review.md',
        '--area',
        'docs',
        '--owner',
        'platform',
        '--impact',
        'docs',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  ) as { dossier: string };

  const result = runCli(
    ['review-artifact', '--dossier', intake.dossier, '--step', 'bogus-step'],
    { cwd: repo, allowFailure: true },
  );
  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_REVIEW_ARTIFACT_FAILED');
  assert.match(payload.error.message, /--step must be one of:/);
});

test('dossier-step-close rejects symlinked verification artifacts before vendored closeout', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Symlinked Verify Guard',
        '--backlog-item-key',
        'symlinked-verify-guard',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'verify-guard.md',
        '--area',
        'docs',
        '--owner',
        'platform',
        '--impact',
        'docs',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const outside = await mkdtemp(path.join(os.tmpdir(), 'ude-verify-link-'));
  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'feature-intake.json',
  );
  const reviewArtifact = path.join(
    repo,
    '.dossier',
    'reviews',
    intakeEnvelope.data.feature_id,
    'feature-intake.json',
  );
  await mkdir(path.dirname(verifyArtifact), { recursive: true });
  await mkdir(path.dirname(reviewArtifact), { recursive: true });
  await writeFile(
    path.join(outside, 'verify.json'),
    `${JSON.stringify(
      {
        feature_id: intakeEnvelope.data.feature_id,
        step: 'feature-intake',
        status: 'pass',
      },
      null,
      2,
    )}\n`,
  );
  await symlink(path.join(outside, 'verify.json'), verifyArtifact);
  await writeFile(
    reviewArtifact,
    `${JSON.stringify(
      {
        feature_id: intakeEnvelope.data.feature_id,
        step: 'feature-intake',
        verdict: 'PASS',
        reviewer: 'test-reviewer',
        findings: { must_fix: [] },
      },
      null,
      2,
    )}\n`,
  );

  const result = runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      reviewArtifact,
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_DOSSIER_STEP_CLOSE_FAILED');
  assert.match(payload.error.message, /symlinked path components|must stay inside/);
});

test('dossier-step-close rejects unsupported steps before touching the vendored command', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Step Close Guard',
        '--backlog-item-key',
        'step-close-guard',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'step-close.md',
        '--area',
        'docs',
        '--owner',
        'platform',
        '--impact',
        'docs',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const result = runCli(
    ['dossier-step-close', '--dossier', intakeEnvelope.data.dossier, '--step', 'bogus-step'],
    { cwd: repo, allowFailure: true },
  );
  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_DOSSIER_STEP_CLOSE_FAILED');
  assert.match(payload.error.message, /--step must be one of:/);
});

test('dossier-step-close maps truthful blocked outcomes to exit code 3 with symbolic error code', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Blocked Closeout',
        '--backlog-item-key',
        'blocked-closeout',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'blocked-closeout.md',
        '--area',
        'docs',
        '--owner',
        'platform',
        '--impact',
        'docs',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'feature-intake.json',
  );
  const reviewArtifact = path.join(
    repo,
    '.dossier',
    'reviews',
    intakeEnvelope.data.feature_id,
    'feature-intake.json',
  );
  await mkdir(path.dirname(verifyArtifact), { recursive: true });
  await mkdir(path.dirname(reviewArtifact), { recursive: true });
  await writeFile(
    verifyArtifact,
    `${JSON.stringify(
      {
        feature_id: intakeEnvelope.data.feature_id,
        step: 'feature-intake',
        status: 'pass',
        event_commit: null,
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    reviewArtifact,
    `${JSON.stringify(
      {
        feature_id: intakeEnvelope.data.feature_id,
        step: 'feature-intake',
        verdict: 'FAIL',
        reviewer: 'test-reviewer',
        findings: { must_fix: ['Closeout remains blocked.'] },
        event_commit: null,
      },
      null,
      2,
    )}\n`,
  );

  const result = runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      reviewArtifact,
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 3);
  const payload = JSON.parse(result.stderr) as {
    error: { blockers: string[]; code: string; message: string; step_artifact: string };
  };
  assert.equal(payload.error.code, 'UDE_CLOSURE_BLOCKED');
  assert.ok(payload.error.blockers.length > 0);
  assert.match(payload.error.step_artifact, /\.dossier\/steps\/F-\d{4}\/feature-intake\.json$/);
});

test('dossier-step-close rejects invalid stage log paths before writing step artifacts', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
    feature_cycle_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Step Close Log Guard',
        '--backlog-item-key',
        'step-close-log-guard',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'step-close-log.md',
        '--area',
        'docs',
        '--owner',
        'platform',
        '--impact',
        'docs',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const stageLogDir = path.join(repo, '.dossier', 'logs', 'feature-intake');
  const originalStageLogName = `${intakeEnvelope.data.feature_id}--${intakeEnvelope.data.feature_cycle_id}.md`;
  const originalStageLog = await readFile(path.join(stageLogDir, originalStageLogName), 'utf8');
  const outside = await mkdtemp(path.join(os.tmpdir(), 'ude-step-close-log-'));
  await rm(stageLogDir, { recursive: true, force: true });
  await writeFile(path.join(outside, originalStageLogName), originalStageLog);
  await symlink(outside, stageLogDir);

  const result = runCli(
    ['dossier-step-close', '--dossier', intakeEnvelope.data.dossier, '--step', 'feature-intake'],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  const payload = JSON.parse(result.stderr) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'UDE_DOSSIER_STEP_CLOSE_FAILED');
  assert.match(payload.error.message, /symlinked path components|must stay inside/);
  await stat(path.join(repo, '.dossier', 'steps', intakeEnvelope.data.feature_id)).then(
    () => assert.fail('step artifact directory should not be created'),
    () => undefined,
  );
});
