import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

/* eslint-disable @typescript-eslint/no-floating-promises -- node:test registrations are top-level by design. */

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

const DEFAULT_STAGE_SESSION_ID = 'test-session-0001';
const DEFAULT_TRACE_RUNTIME = 'test-agent';
const STAGE_CONTROLLER_COMMANDS_REQUIRING_SESSION = new Set([
  'feature-intake',
  'spec-compact',
  'plan-slice',
  'implementation',
  'change-proposal',
]);
const POLICY_ADMISSION_GOVERNANCE_CHECKLIST_IDS = [
  'explicit-allow-deny',
  'deny-or-failed-admission-no-invocation',
  'conflicting-request-replay-fail-closed',
  'ambiguous-stale-unsupported-evidence',
  'freshness-timestamp-required',
  'active-scope-concurrency-model',
  'append-only-decision-audit-facts',
  'regression-test-paths',
] as const;

type TestDeliveryState = 'defined' | 'specified' | 'planned' | 'implemented';

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
    env?: NodeJS.ProcessEnv;
    stageSession?: false | { sessionId?: string; traceRuntime?: string | null };
  } = {},
): CliResult {
  const cliArgs =
    options.stageSession === false ||
    args.includes('--session-id') ||
    args.includes('--help') ||
    args.includes('-h') ||
    !STAGE_CONTROLLER_COMMANDS_REQUIRING_SESSION.has(args[0] ?? '')
      ? args
      : [
          ...args,
          '--session-id',
          options.stageSession?.sessionId ?? DEFAULT_STAGE_SESSION_ID,
          ...(options.stageSession?.traceRuntime === null
            ? []
            : ['--trace-runtime', options.stageSession?.traceRuntime ?? DEFAULT_TRACE_RUNTIME]),
        ];
  const result = spawnSync(process.execPath, [scriptPath(), ...cliArgs], {
    cwd: options.cwd ?? SKILL_DIR,
    encoding: 'utf8',
    env: {
      ...process.env,
      CODEX_THREAD_ID: 'author-thread-default',
      ...options.env,
    },
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

function runGit(repo: string, args: string[]): string {
  const result = spawnSync('git', args, {
    cwd: repo,
    encoding: 'utf8',
  });
  assert.equal(
    result.status ?? 1,
    0,
    [
      `git ${args.join(' ')} failed`,
      `stdout:\n${result.stdout ?? ''}`,
      `stderr:\n${result.stderr ?? ''}`,
    ].join('\n\n'),
  );
  return result.stdout ?? '';
}

function initializeGitRepo(repo: string): void {
  runGit(repo, ['init']);
  runGit(repo, ['config', 'user.name', 'Unified Dossier Tests']);
  runGit(repo, ['config', 'user.email', 'unified-dossier-tests@example.test']);
  runGit(repo, ['config', 'commit.gpgsign', 'false']);
}

function commitRepoState(repo: string, message: string): string {
  runGit(repo, ['add', '.']);
  runGit(repo, ['commit', '-m', message]);
  return runGit(repo, ['rev-parse', 'HEAD']).trim();
}

function parseEnvelope<T>(stdout: string): CliEnvelope<T> {
  return JSON.parse(stdout) as CliEnvelope<T>;
}

function parseStageLogMetadata(content: string): Record<string, unknown> {
  const match = content.match(/^---\n([\s\S]*?)\n---/u);
  assert.ok(match?.[1], 'stage log frontmatter not found');
  return YAML.parse(match[1]) as Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/require-await -- helper stays async for readable test setup sequencing.
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

async function writeVerifyArtifactFile(payload: {
  eventCommit?: string | null;
  featureId: string;
  path: string;
  status?: 'fail' | 'pass';
  step: string;
}): Promise<void> {
  await mkdir(path.dirname(payload.path), { recursive: true });
  await writeFile(
    payload.path,
    `${JSON.stringify(
      {
        feature_id: payload.featureId,
        step: payload.step,
        status: payload.status ?? 'pass',
        event_commit: payload.eventCommit ?? null,
      },
      null,
      2,
    )}\n`,
  );
}

async function writeReviewArtifactFile(payload: {
  allowedByPolicy?: boolean;
  auditClass?: 'code-reviewer' | 'security-reviewer' | 'spec-conformance-reviewer';
  eventCommit?: string | null;
  featureId: string;
  implementationScope?: 'code-bearing' | 'non-code' | null;
  invalidated?: boolean;
  mustFix?: string[];
  path: string;
  reviewMode?: 'degraded' | 'external' | 'self-review';
  reviewer?: string;
  reviewerAgentId?: string | null;
  reviewerSkill?: string | null;
  reviewerThreadId?: string | null;
  securityTriggerReason?: string | null;
  step: string;
  verdict?: 'FAIL' | 'PASS';
}): Promise<void> {
  await mkdir(path.dirname(payload.path), { recursive: true });
  await writeFile(
    payload.path,
    `${JSON.stringify(
      {
        feature_id: payload.featureId,
        step: payload.step,
        audit_class: payload.auditClass ?? 'spec-conformance-reviewer',
        verdict: payload.verdict ?? 'PASS',
        reviewer: payload.reviewer ?? 'test-reviewer',
        reviewer_skill: payload.reviewerSkill ?? 'spec-conformance-reviewer',
        reviewer_agent_id: payload.reviewerAgentId ?? 'agent-reviewer-1',
        reviewer_thread_id: payload.reviewerThreadId ?? 'external-review-thread',
        review_mode: payload.reviewMode ?? 'external',
        implementation_scope: payload.implementationScope ?? null,
        security_trigger_reason: payload.securityTriggerReason ?? null,
        invalidated: payload.invalidated === true,
        allowed_by_policy:
          payload.allowedByPolicy ??
          ((payload.reviewMode ?? 'external') === 'external' && payload.invalidated !== true),
        findings: { must_fix: payload.mustFix ?? [] },
        event_commit: payload.eventCommit ?? null,
      },
      null,
      2,
    )}\n`,
  );
}

function testBacklogPacketItem(payload: {
  deliveryState: TestDeliveryState;
  itemKey: string;
  title?: string | undefined;
}): Record<string, unknown> {
  return {
    item_key: payload.itemKey,
    title: payload.title ?? payload.itemKey,
    type: 'feature',
    delivery_state: payload.deliveryState,
    gaps: [],
    depends_on_keys: [],
    origin_source_ids: [],
    specification_source_ids: [],
    plan_source_ids: [],
    implementation_source_ids: [],
    test_source_ids: [],
    claim_keys: [],
    contract_keys: [],
    data_domain_keys: [],
    quality_attribute_keys: [],
    policy_decision_keys: [],
  };
}

async function seedBacklogItem(payload: {
  deliveryState: TestDeliveryState;
  itemKey: string;
  repo: string;
  title?: string | undefined;
}): Promise<void> {
  const packetPath = path.join(
    payload.repo,
    'test-backlog-packets',
    `${payload.itemKey}-${payload.deliveryState}.json`,
  );
  await mkdir(path.dirname(packetPath), { recursive: true });
  await writeFile(
    packetPath,
    `${JSON.stringify(
      {
        context: {
          glossary: [],
          key_strategy: {},
          target_system: [],
          as_built: [],
          claims: [],
          contracts: [],
          data_domains: [],
          quality_attributes: [],
          policy_decisions: [],
        },
        items: [
          testBacklogPacketItem({
            itemKey: payload.itemKey,
            deliveryState: payload.deliveryState,
            title: payload.title,
          }),
        ],
      },
      null,
      2,
    )}\n`,
  );

  runCli(['packet', '--path', packetPath], { cwd: payload.repo });
}

async function applyBacklogLifecyclePatch(payload: {
  deliveryState: TestDeliveryState;
  itemKey: string;
  repo: string;
}): Promise<string> {
  const patchId = `test-${payload.itemKey}-${payload.deliveryState}`;
  const patchPath = path.join(payload.repo, 'test-backlog-patches', `${patchId}.json`);
  const appliedPath = path.join(payload.repo, '.dossier', 'backlog', 'applied.json');
  const sequence = await readFile(appliedPath, 'utf8')
    .then((content) => {
      const applied = JSON.parse(content) as {
        patches?: Array<{ sequence?: unknown }>;
      };
      return (
        Math.max(
          0,
          ...(applied.patches ?? [])
            .map((entry) => entry.sequence)
            .filter((value): value is number => typeof value === 'number'),
        ) + 1
      );
    })
    .catch(() => 1);
  await mkdir(path.dirname(patchPath), { recursive: true });
  await writeFile(
    patchPath,
    `${JSON.stringify(
      {
        metadata: {
          patch_id: patchId,
          created_at: '2026-04-24T12:00:00.000Z',
          sequence,
          target_item_keys: [payload.itemKey],
        },
        operations: [
          {
            item_key: payload.itemKey,
            action: 'replace_fields',
            fields: {
              delivery_state: payload.deliveryState,
            },
          },
        ],
      },
      null,
      2,
    )}\n`,
  );

  const envelope = parseEnvelope<{ canonical_patch_path: string }>(
    runCli(['patch-item', '--patch', patchPath], { cwd: payload.repo }).stdout,
  );
  return path.relative(payload.repo, envelope.data.canonical_patch_path).split(path.sep).join('/');
}

function policyAdmissionChecklistArgs(): string[] {
  return POLICY_ADMISSION_GOVERNANCE_CHECKLIST_IDS.flatMap((id) => [
    '--pre-review-check',
    [
      'risk_family=policy-admission-governance',
      `id=${id}`,
      'status=pass',
      `summary=${id} checked`,
      `evidence=regression evidence for ${id}`,
      'test_refs=test/cli.test.ts',
    ].join(';'),
  ]);
}

async function createImplementationFeature(payload: {
  itemKey: string;
  repo: string;
  title: string;
}): Promise<{ dossier: string; featureId: string }> {
  await seedBacklogItem({
    repo: payload.repo,
    itemKey: payload.itemKey,
    deliveryState: 'implemented',
    title: payload.title,
  });
  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        payload.title,
        '--backlog-item-key',
        payload.itemKey,
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        `${payload.itemKey}.md`,
        '--area',
        'backend',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: payload.repo },
    ).stdout,
  );
  return {
    dossier: intakeEnvelope.data.dossier,
    featureId: intakeEnvelope.data.feature_id,
  };
}

async function startImplementationFeature(payload: {
  itemKey: string;
  repo: string;
  title: string;
}): Promise<{ dossier: string; featureId: string }> {
  const feature = await createImplementationFeature(payload);
  runCli(['implementation', '--feature-id', feature.featureId], { cwd: payload.repo });
  return feature;
}

function recordReviewArtifact(payload: {
  auditClass: 'code-reviewer' | 'security-reviewer' | 'spec-conformance-reviewer';
  dossier: string;
  repo: string;
  reviewerAgentId: string;
  reviewerSkill?: string;
  reviewerThreadId: string;
  securityTriggerReason?: string;
  step: string;
}): string {
  const result = runCli(
    [
      'review-artifact',
      '--dossier',
      payload.dossier,
      '--step',
      payload.step,
      '--audit-class',
      payload.auditClass,
      ...(payload.auditClass === 'security-reviewer'
        ? ['--security-trigger-reason', payload.securityTriggerReason ?? 'test-security-scope']
        : []),
      '--verdict',
      'PASS',
      '--reviewer',
      payload.reviewerSkill ?? payload.auditClass,
      '--reviewer-skill',
      payload.reviewerSkill ?? payload.auditClass,
      '--reviewer-agent-id',
      payload.reviewerAgentId,
    ],
    { cwd: payload.repo, env: { CODEX_THREAD_ID: payload.reviewerThreadId } },
  );
  const match = result.stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u);
  assert.ok(match?.[1]);
  return match[1].trim();
}

async function closeImplementationWithSpecReview(payload: {
  dossier: string;
  featureId: string;
  repo: string;
}): Promise<void> {
  runCli(
    [
      'implementation',
      '--feature-id',
      payload.featureId,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
    ],
    { cwd: payload.repo },
  );
  const verifyArtifact = path.join(
    payload.repo,
    '.dossier',
    'verification',
    payload.featureId,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: payload.featureId,
    step: 'implementation',
  });
  const specReview = recordReviewArtifact({
    repo: payload.repo,
    dossier: payload.dossier,
    step: 'implementation',
    auditClass: 'spec-conformance-reviewer',
    reviewerAgentId: `audit-agent-${payload.featureId}-post-close-spec`,
    reviewerThreadId: `review-thread-${payload.featureId}-post-close-spec`,
  });
  const codeReview = recordReviewArtifact({
    repo: payload.repo,
    dossier: payload.dossier,
    step: 'implementation',
    auditClass: 'code-reviewer',
    reviewerAgentId: `audit-agent-${payload.featureId}-post-close-code`,
    reviewerThreadId: `review-thread-${payload.featureId}-post-close-code`,
  });
  const securityReview = recordReviewArtifact({
    repo: payload.repo,
    dossier: payload.dossier,
    step: 'implementation',
    auditClass: 'security-reviewer',
    reviewerAgentId: `audit-agent-${payload.featureId}-post-close-security`,
    reviewerThreadId: `review-thread-${payload.featureId}-post-close-security`,
    securityTriggerReason: 'post-close-hygiene-test',
  });
  runCli(
    [
      'dossier-step-close',
      '--dossier',
      payload.dossier,
      '--step',
      'implementation',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specReview,
      '--review-artifact',
      codeReview,
      '--review-artifact',
      securityReview,
    ],
    { cwd: payload.repo },
  );
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
  assert.equal(
    payload.backlog_manifest_path,
    path.join(repo, '.dossier', 'backlog', 'manifest.json'),
  );
  assert.equal(payload.index_path, path.join(repo, 'docs', 'ssot', 'index.md'));
  assert.equal(payload.dossiers_dir, path.join(repo, 'docs', 'ssot', 'features'));
  assert.equal(initResult.command, 'init');
  assert.equal(initResult.result, 'ok');
  await stat(path.join(repo, '.dossier', 'backlog', 'state.json'));
  await stat(path.join(repo, '.dossier', 'logs', 'feature-intake'));
  await stat(path.join(repo, 'docs', 'ssot', 'features', '.gitkeep'));
  const backlogAgents = await readFile(path.join(repo, '.dossier', 'backlog', 'AGENTS.md'), 'utf8');
  assert.match(backlogAgents, /utility-owned backlog artifacts for the dossier-engineer runtime/);
  assert.doesNotMatch(backlogAgents, /split backlog runtime/);
  assert.doesNotMatch(backlogAgents, /merged runtime/);
  assert.doesNotMatch(backlogAgents, /unified runtime/);
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
    'spec-compact',
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
    'review-artifact',
    'dossier-step-close',
    'post-close-hygiene',
    'next-step',
    'lifecycle-refresh',
  ] as const;

  for (const command of commands) {
    const result = command === 'help' ? runCli(['--help']) : runCli(['help', command]);
    assert.match(result.stdout, /Usage:/, `missing Usage block for ${command}`);
    assert.match(result.stdout, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(result.stdout, /merged runtime/);
    assert.doesNotMatch(result.stdout, /unified runtime/);
    assert.doesNotMatch(result.stdout, /merged skill/);
    assert.doesNotMatch(result.stdout, /split backlog runtime/);
    assert.doesNotMatch(result.stdout, /split-skill migration/);
    assert.doesNotMatch(result.stdout, /compatibility launchers/);
    if (command === 'feature-intake') {
      assert.match(result.stdout, /canonical stage-controller commands/);
      assert.doesNotMatch(result.stdout, /not shipped CLI subcommands/);
    }
    if (STAGE_CONTROLLER_COMMANDS_REQUIRING_SESSION.has(command)) {
      assert.match(result.stdout, /--session-id <id>/u);
      assert.match(result.stdout, /--trace-runtime <name>/u);
    }
    if (command === 'implementation') {
      assert.match(result.stdout, /--risk-family <id>/u);
      assert.match(result.stdout, /--pre-review-check <dsl>/u);
      assert.match(result.stdout, /declared risk families require complete non-blocked/u);
    }
    if (command === 'spec-compact' || command === 'plan-slice' || command === 'change-proposal') {
      assert.doesNotMatch(result.stdout, /--risk-family <id>/u);
      assert.doesNotMatch(result.stdout, /--pre-review-check <dsl>/u);
    }
    if (command === 'review-artifact') {
      assert.match(
        result.stdout,
        /Persist one immutable already obtained audit attempt for one audit class/u,
      );
      assert.match(result.stdout, /does not perform the review itself/u);
      assert.match(result.stdout, /stable\/latest review copies are compatibility conveniences/u);
      assert.match(result.stdout, /records observable provenance only/u);
      assert.match(result.stdout, /does not prove fork_context, full-history inheritance/u);
      assert.match(result.stdout, /forked\/full-history authoring context do not satisfy/u);
      assert.match(
        result.stdout,
        /never replaces the required audit bundle enforced by dossier-step-close/u,
      );
    }
    if (command === 'dossier-step-close') {
      assert.match(result.stdout, /Repeat for multi-audit bundles/u);
      assert.match(
        result.stdout,
        /Skip the clean-worktree blocker only; review freshness invalidation still applies/u,
      );
      assert.match(result.stdout, /validates the observable durable review bundle/u);
      assert.match(result.stdout, /does not prove reviewer launch-mode independence/u);
      assert.match(result.stdout, /forked\/full-history authoring context must be rerun/u);
      assert.match(result.stdout, /--backlog-actualization-artifact <path>/u);
    }
    if (command === 'post-close-hygiene') {
      assert.match(result.stdout, /refresh explicitly/u);
      assert.match(result.stdout, /never auto-acks source-review records/u);
      assert.match(result.stdout, /implementation-post-close-backlog-hygiene\.json/u);
    }
  }

  const globalHelp = runCli(['--help']);
  assert.match(globalHelp.stdout, /The only public utility for the dossier\/backlog runtime\./);
  assert.doesNotMatch(globalHelp.stdout, /merged runtime/);
  assert.doesNotMatch(globalHelp.stdout, /unified runtime/);
  assert.doesNotMatch(globalHelp.stdout, /merged skill/);
  assert.doesNotMatch(globalHelp.stdout, /split-skill migration/);
  assert.doesNotMatch(globalHelp.stdout, /compatibility launchers/);
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

test('stage-controller writes fail closed without explicit session id', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeWithoutSession = runCli(
    [
      'feature-intake',
      '--title',
      'Missing Session Intake',
      '--backlog-item-key',
      'missing-session-intake',
      '--backlog-delivery-state',
      'defined',
      '--backlog-source',
      'missing-session.md',
      '--area',
      'ops',
      '--owner',
      'platform',
      '--impact',
      'backend',
      '--json',
    ],
    {
      allowFailure: true,
      cwd: repo,
      env: { CODEX_SESSION_ID: 'env-session-must-not-be-used' },
      stageSession: false,
    },
  );

  assert.equal(intakeWithoutSession.code, 1);
  assert.match(intakeWithoutSession.stderr, /--session-id is required/u);
  assert.deepEqual(
    (await readdir(path.join(repo, 'docs', 'ssot', 'features'))).filter(
      (entry) => entry !== '.gitkeep',
    ),
    [],
  );
  assert.deepEqual(await readdir(path.join(repo, '.dossier', 'logs', 'feature-intake')), []);

  const intakeEnvelope = parseEnvelope<{ feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Session Guard Baseline',
        '--backlog-item-key',
        'session-guard-baseline',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'session-guard.md',
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

  for (const command of ['spec-compact', 'plan-slice', 'implementation', 'change-proposal']) {
    const result = runCli([command, '--feature-id', intakeEnvelope.data.feature_id], {
      allowFailure: true,
      cwd: repo,
      env: { CODEX_SESSION_ID: 'env-session-must-not-be-used' },
      stageSession: false,
    });
    assert.equal(result.code, 1, command);
    assert.match(result.stderr, /--session-id is required/u, command);
    assert.deepEqual(await readdir(path.join(repo, '.dossier', 'logs', command)), [], command);
  }
});

test('stage-controller update paths fail closed without explicit session id', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Session Update Guard',
        '--backlog-item-key',
        'session-update-guard',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'session-update.md',
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

  const startEnvelope = parseEnvelope<{ log_path: string }>(
    runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--json'], {
      cwd: repo,
    }).stdout,
  );
  const stageLogPath = path.join(repo, startEnvelope.data.log_path);
  const before = await readFile(stageLogPath, 'utf8');

  const result = runCli(
    ['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--ready-for-close'],
    {
      allowFailure: true,
      cwd: repo,
      env: { CODEX_SESSION_ID: 'env-session-must-not-be-used' },
      stageSession: false,
    },
  );

  assert.equal(result.code, 1);
  assert.match(result.stderr, /--session-id is required/u);
  assert.equal(await readFile(stageLogPath, 'utf8'), before);
});

test('stage-controller schema annotations and process misses mirror into stage state', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Schema Annotation Mirror',
        '--backlog-item-key',
        'schema-annotation-mirror',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'schema-annotation.md',
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

  const stageEnvelope = parseEnvelope<{ log_path: string }>(
    runCli(
      [
        'spec-compact',
        '--feature-id',
        intakeEnvelope.data.feature_id,
        '--backlog-followup-kind',
        'source-update',
        '--skill-used',
        'unified-dossier-engineer',
        '--skill-issue',
        'UDE-05',
        '--skill-followup',
        'clarify-stage-schema',
        '--process-miss',
        'id=pm-1;category=planning;severity=medium;resolved=false;summary=Plan lacked explicit target',
        '--phase-scope',
        'schema-hardening',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const stageLog = await readFile(path.join(repo, stageEnvelope.data.log_path), 'utf8');
  const metadata = parseStageLogMetadata(stageLog);
  const state = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', intakeEnvelope.data.feature_id, 'spec-compact.json'),
      'utf8',
    ),
  ) as Record<string, unknown>;

  for (const field of [
    'backlog_followup_required',
    'backlog_followup_kind',
    'backlog_followup_resolved',
    'review_artifacts',
    'verification_artifacts',
    'skills_used',
    'skill_issues',
    'skill_followups',
    'process_misses',
    'primary_feature_id',
    'primary_backlog_item_key',
    'phase_scope',
  ]) {
    assert.deepEqual(metadata[field], state[field], `schema field parity failed for ${field}`);
  }
  assert.equal(state.backlog_followup_required, true);
  assert.equal(state.backlog_followup_kind, 'source-update');
  assert.equal(state.backlog_followup_resolved, false);
  assert.deepEqual(state.skills_used, ['unified-dossier-engineer']);
  assert.deepEqual(state.skill_issues, ['UDE-05']);
  assert.deepEqual(state.skill_followups, ['clarify-stage-schema']);
  assert.deepEqual(state.process_misses, [
    {
      id: 'pm-1',
      category: 'planning',
      severity: 'medium',
      resolved: false,
      summary: 'Plan lacked explicit target',
    },
  ]);
  assert.equal(state.primary_feature_id, intakeEnvelope.data.feature_id);
  assert.equal(state.primary_backlog_item_key, 'schema-annotation-mirror');
  assert.equal(state.phase_scope, 'schema-hardening');
  assert.match(
    stageLog,
    /## Process misses\n\n- pm-1 \[medium\/planning, open\] Plan lacked explicit target/u,
  );
});

test('stage-controller rejects malformed process-miss DSL before writing stage artifacts', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Malformed Process Miss',
        '--backlog-item-key',
        'malformed-process-miss',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'malformed-process-miss.md',
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

  const result = runCli(
    [
      'spec-compact',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--process-miss',
      'id=pm-1;category=planning;severity=urgent;resolved=false;summary=bad severity',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  assert.match(result.stderr, /severity must be one of: low, medium, high/u);
  assert.deepEqual(await readdir(path.join(repo, '.dossier', 'logs', 'spec-compact')), []);
});

test('implementation ready-for-close blocks declared policy-admission-governance risk without checklist evidence', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  const feature = await startImplementationFeature({
    repo,
    itemKey: 'missing-policy-checklist',
    title: 'Missing Policy Checklist',
  });

  const result = runCli(
    [
      'implementation',
      '--feature-id',
      feature.featureId,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
      '--risk-family',
      'policy-admission-governance',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  assert.match(result.stderr, /implementation pre-review checklist is missing/u);
  assert.match(result.stderr, /explicit-allow-deny/u);
  const state = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', feature.featureId, 'implementation.json'),
      'utf8',
    ),
  ) as {
    pre_review_checklist_status: string;
    pre_review_risk_families: string[];
    stage_state: string;
  };
  assert.equal(state.stage_state, 'in_progress');
  assert.equal(state.pre_review_checklist_status, 'not_required');
  assert.deepEqual(state.pre_review_risk_families, []);
});

test('implementation records complete policy-admission-governance pre-review checklist evidence', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  const feature = await startImplementationFeature({
    repo,
    itemKey: 'complete-policy-checklist',
    title: 'Complete Policy Checklist',
  });

  const readyEnvelope = parseEnvelope<{
    log_path: string;
    pre_review_checklist_blockers: string[];
    pre_review_checklist_status: string;
    pre_review_risk_families: string[];
    stage_state: string;
  }>(
    runCli(
      [
        'implementation',
        '--feature-id',
        feature.featureId,
        '--ready-for-close',
        '--implementation-scope',
        'code-bearing',
        '--risk-family',
        'policy-admission-governance',
        ...policyAdmissionChecklistArgs(),
      ],
      { cwd: repo },
    ).stdout,
  );

  assert.equal(readyEnvelope.data.stage_state, 'ready_for_close');
  assert.equal(readyEnvelope.data.pre_review_checklist_status, 'complete');
  assert.deepEqual(readyEnvelope.data.pre_review_checklist_blockers, []);
  assert.deepEqual(readyEnvelope.data.pre_review_risk_families, ['policy-admission-governance']);

  const state = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', feature.featureId, 'implementation.json'),
      'utf8',
    ),
  ) as {
    pre_review_checklist_blockers: string[];
    pre_review_checklist_status: string;
    pre_review_checklists: Array<{
      evidence: string;
      id: string;
      risk_family: string;
      status: string;
      summary: string;
      test_refs: string[];
    }>;
    pre_review_risk_families: string[];
  };
  assert.deepEqual(state.pre_review_risk_families, ['policy-admission-governance']);
  assert.equal(state.pre_review_checklist_status, 'complete');
  assert.deepEqual(state.pre_review_checklist_blockers, []);
  assert.deepEqual(
    state.pre_review_checklists.map((entry) => entry.id),
    [...POLICY_ADMISSION_GOVERNANCE_CHECKLIST_IDS],
  );
  assert.ok(
    state.pre_review_checklists.every(
      (entry) =>
        entry.risk_family === 'policy-admission-governance' &&
        entry.status === 'pass' &&
        entry.evidence.startsWith('regression evidence for ') &&
        entry.test_refs.includes('test/cli.test.ts'),
    ),
  );

  const log = await readFile(path.join(repo, readyEnvelope.data.log_path), 'utf8');
  const metadata = parseStageLogMetadata(log);
  for (const field of [
    'pre_review_risk_families',
    'pre_review_checklists',
    'pre_review_checklist_status',
    'pre_review_checklist_blockers',
  ]) {
    assert.deepEqual(metadata[field], state[field as keyof typeof state]);
  }
});

test('implementation blocked pre-review checklist entry prevents ready-for-close', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  const feature = await startImplementationFeature({
    repo,
    itemKey: 'blocked-policy-checklist',
    title: 'Blocked Policy Checklist',
  });

  runCli(
    [
      'implementation',
      '--feature-id',
      feature.featureId,
      '--risk-family',
      'policy-admission-governance',
      '--pre-review-check',
      'risk_family=policy-admission-governance;id=explicit-allow-deny;status=blocked;summary=deny path unresolved;evidence=missing regression',
    ],
    { cwd: repo },
  );

  const readyResult = runCli(
    [
      'implementation',
      '--feature-id',
      feature.featureId,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(readyResult.code, 1);
  assert.match(readyResult.stderr, /implementation pre-review checklist is blocked/u);
  assert.match(readyResult.stderr, /policy-admission-governance\/explicit-allow-deny/u);
  const state = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', feature.featureId, 'implementation.json'),
      'utf8',
    ),
  ) as {
    pre_review_checklist_blockers: string[];
    pre_review_checklist_status: string;
    stage_state: string;
  };
  assert.equal(state.stage_state, 'in_progress');
  assert.equal(state.pre_review_checklist_status, 'blocked');
  assert.deepEqual(state.pre_review_checklist_blockers, [
    'policy-admission-governance/explicit-allow-deny blocked: deny path unresolved',
  ]);
});

test('implementation without declared risk family reaches ready-for-close without checklist gate', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  const feature = await startImplementationFeature({
    repo,
    itemKey: 'no-risk-checklist',
    title: 'No Risk Checklist',
  });

  runCli(
    [
      'implementation',
      '--feature-id',
      feature.featureId,
      '--ready-for-close',
      '--implementation-scope',
      'non-code',
    ],
    { cwd: repo },
  );

  const state = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', feature.featureId, 'implementation.json'),
      'utf8',
    ),
  ) as {
    pre_review_checklist_blockers: string[];
    pre_review_checklist_status: string;
    pre_review_checklists: unknown[];
    pre_review_risk_families: string[];
    stage_state: string;
  };
  assert.equal(state.stage_state, 'ready_for_close');
  assert.equal(state.pre_review_checklist_status, 'not_required');
  assert.deepEqual(state.pre_review_risk_families, []);
  assert.deepEqual(state.pre_review_checklists, []);
  assert.deepEqual(state.pre_review_checklist_blockers, []);
});

test('implementation accepts a custom risk family with explicit non-blocked evidence', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  const feature = await startImplementationFeature({
    repo,
    itemKey: 'custom-risk-checklist',
    title: 'Custom Risk Checklist',
  });

  runCli(
    [
      'implementation',
      '--feature-id',
      feature.featureId,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
      '--risk-family',
      'custom-admission-risk',
      '--pre-review-check',
      'risk_family=custom-admission-risk;id=custom-regression;status=not_applicable;summary=custom branch not touched;evidence=project scoped evidence',
    ],
    { cwd: repo },
  );

  const state = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', feature.featureId, 'implementation.json'),
      'utf8',
    ),
  ) as {
    pre_review_checklist_status: string;
    pre_review_checklists: Array<{ id: string; status: string }>;
    pre_review_risk_families: string[];
    stage_state: string;
  };
  assert.equal(state.stage_state, 'ready_for_close');
  assert.equal(state.pre_review_checklist_status, 'complete');
  assert.deepEqual(state.pre_review_risk_families, ['custom-admission-risk']);
  assert.deepEqual(state.pre_review_checklists, [
    {
      risk_family: 'custom-admission-risk',
      id: 'custom-regression',
      status: 'not_applicable',
      summary: 'custom branch not touched',
      evidence: 'project scoped evidence',
      test_refs: [],
    },
  ]);
});

test('implementation rejects malformed pre-review checklist DSL before writing stage artifacts', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  const feature = await createImplementationFeature({
    repo,
    itemKey: 'malformed-pre-review-checklist',
    title: 'Malformed Pre Review Checklist',
  });

  const result = runCli(
    [
      'implementation',
      '--feature-id',
      feature.featureId,
      '--risk-family',
      'policy-admission-governance',
      '--pre-review-check',
      'risk_family=policy-admission-governance;id=explicit-allow-deny;status=pass;summary=missing evidence',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  assert.match(
    result.stderr,
    /--pre-review-check must include risk_family, id, status, summary, and evidence/u,
  );
  assert.deepEqual(await readdir(path.join(repo, '.dossier', 'logs', 'implementation')), []);
  assert.rejects(
    readFile(
      path.join(repo, '.dossier', 'stages', feature.featureId, 'implementation.json'),
      'utf8',
    ),
  );
});

test('pre-review checklist flags are rejected outside implementation before writing stage artifacts', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  const feature = await createImplementationFeature({
    repo,
    itemKey: 'unsupported-checklist-stage',
    title: 'Unsupported Checklist Stage',
  });

  const result = runCli(
    [
      'spec-compact',
      '--feature-id',
      feature.featureId,
      '--risk-family',
      'policy-admission-governance',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  assert.match(
    result.stderr,
    /--risk-family and --pre-review-check are only allowed for implementation/u,
  );
  assert.deepEqual(await readdir(path.join(repo, '.dossier', 'logs', 'spec-compact')), []);
});

test('implementation pre-review checklist evidence does not satisfy external audit closure policy', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  const feature = await startImplementationFeature({
    repo,
    itemKey: 'checklist-not-audit',
    title: 'Checklist Is Not Audit',
  });

  runCli(
    [
      'implementation',
      '--feature-id',
      feature.featureId,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
      '--risk-family',
      'policy-admission-governance',
      ...policyAdmissionChecklistArgs(),
    ],
    { cwd: repo },
  );

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    feature.featureId,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: feature.featureId,
    step: 'implementation',
  });
  const specReview = recordReviewArtifact({
    repo,
    dossier: feature.dossier,
    step: 'implementation',
    auditClass: 'spec-conformance-reviewer',
    reviewerAgentId: 'audit-agent-checklist-not-audit-spec',
    reviewerThreadId: 'review-thread-checklist-not-audit-spec',
  });

  const result = runCli(
    [
      'dossier-step-close',
      '--dossier',
      feature.dossier,
      '--step',
      'implementation',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specReview,
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 3);
  const payload = JSON.parse(result.stderr) as {
    error: { blockers: string[]; code: string };
  };
  assert.equal(payload.error.code, 'UDE_CLOSURE_BLOCKED');
  assert.ok(
    payload.error.blockers.some((blocker) =>
      blocker.includes('Missing required review artifact for audit class code-reviewer'),
    ),
  );
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
  assert.equal(
    intake.log_path,
    `.dossier/logs/feature-intake/${intake.feature_id}--${intake.feature_cycle_id}.md`,
  );
  assert.deepEqual(
    intake.transition_events.map((event) => event.kind),
    ['entered', 'ready_for_close'],
  );
  assert.equal(intake.backlog_followup_required, false);
  assert.equal(intake.backlog_followup_kind, null);
  assert.equal(intake.backlog_followup_resolved, true);
  assert.deepEqual(intakeEnvelope.next_commands, [
    `dossier-engineer spec-compact --feature-id ${intake.feature_id} --session-id <id>`,
  ]);
  await stat(path.join(repo, intake.dossier));
  await stat(
    path.join(
      repo,
      '.dossier',
      'logs',
      'feature-intake',
      `${intake.feature_id}--${intake.feature_cycle_id}.md`,
    ),
  );
  const intakeLog = await readFile(
    path.join(
      repo,
      '.dossier',
      'logs',
      'feature-intake',
      `${intake.feature_id}--${intake.feature_cycle_id}.md`,
    ),
    'utf8',
  );
  assert.match(intakeLog, /## Scope\n\nnone/u);
  assert.match(intakeLog, /## Backlog handoff decisions\n\nnone/u);
  assert.match(intakeLog, /## Close-out\n\nnone/u);
  assert.match(intakeLog, /## Transition events\n\n- .*: entered/u);
  assert.match(intakeLog, new RegExp(`session_id: ${DEFAULT_STAGE_SESSION_ID}`, 'u'));
  assert.match(intakeLog, new RegExp(`trace_runtime: ${DEFAULT_TRACE_RUNTIME}`, 'u'));
  assert.match(intakeLog, /trace_locator_kind: session_id/u);
  assert.doesNotMatch(intakeLog, /intake_process_complete_ts:/u);
  const intakeState = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', intake.feature_id, 'feature-intake.json'),
      'utf8',
    ),
  ) as { session_id: string; trace_locator_kind: string; trace_runtime: string };
  assert.equal(intakeState.session_id, DEFAULT_STAGE_SESSION_ID);
  assert.equal(intakeState.trace_runtime, DEFAULT_TRACE_RUNTIME);
  assert.equal(intakeState.trace_locator_kind, 'session_id');

  const stageStartEnvelope = parseEnvelope<{
    cycle_id: string;
    feature_cycle_id: string;
    stage_state: string;
  }>(runCli(['spec-compact', '--feature-id', intake.feature_id], { cwd: repo }).stdout);
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
      [
        'spec-compact',
        '--feature-id',
        intake.feature_id,
        '--cycle-id',
        stageStart.cycle_id,
        '--ready-for-close',
      ],
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
    new RegExp(
      `^\\.dossier/logs/spec-compact/${intake.feature_id}--${intake.feature_cycle_id}--${stageStart.cycle_id}\\.md$`,
    ),
  );
  const stageLog = await readFile(path.join(repo, stageReadyWithCycle.log_path), 'utf8');
  assert.match(stageLog, /## Scope\n\nnone/u);
  assert.match(stageLog, /## Decisions \/ reclassifications/u);
  assert.match(stageLog, /### Spec gap decisions\n\nnone/u);
  assert.match(stageLog, /## Transition events\n\n- .*: entered/u);
  assert.match(stageLog, /## Close-out\n\nnone/u);
  assert.match(stageLog, new RegExp(`session_id: ${DEFAULT_STAGE_SESSION_ID}`, 'u'));
  assert.match(stageLog, new RegExp(`trace_runtime: ${DEFAULT_TRACE_RUNTIME}`, 'u'));
  assert.match(stageLog, /trace_locator_kind: session_id/u);
  const stageState = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', intake.feature_id, 'spec-compact.json'),
      'utf8',
    ),
  ) as { session_id: string; trace_locator_kind: string; trace_runtime: string };
  assert.equal(stageState.session_id, DEFAULT_STAGE_SESSION_ID);
  assert.equal(stageState.trace_runtime, DEFAULT_TRACE_RUNTIME);
  assert.equal(stageState.trace_locator_kind, 'session_id');
});

test('stage-controller reruns preserve authored narrative sections', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Narrative Preservation',
        '--backlog-item-key',
        'narrative-preservation',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'narrative.md',
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

  const stageEnvelope = parseEnvelope<{ log_path: string }>(
    runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--json'], {
      cwd: repo,
    }).stdout,
  );
  const stageLogPath = path.join(repo, stageEnvelope.data.log_path);
  const authored = (await readFile(stageLogPath, 'utf8'))
    .replace('## Scope\n\nnone', '## Scope\n\nScoped by operator clarification.')
    .replace(
      '### Spec gap decisions\n\nnone',
      '### Spec gap decisions\n\nResolved missing acceptance boundary.',
    )
    .replace('## Process misses\n\nnone', '## Process misses\n\nOne rerun was required.');
  await writeFile(stageLogPath, authored);

  runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--ready-for-close'], {
    cwd: repo,
  });

  const rerendered = await readFile(stageLogPath, 'utf8');
  assert.match(rerendered, /## Scope\n\nScoped by operator clarification\./u);
  assert.match(rerendered, /### Spec gap decisions\n\nResolved missing acceptance boundary\./u);
  assert.match(
    rerendered,
    /## Process misses\n\nnone\n\nUnstructured notes:\n\nOne rerun was required\./u,
  );
  assert.match(rerendered, /## Transition events\n\n- .*: entered\n- .*: ready_for_close/u);
});

test('stage-controller reruns preserve legacy summary and prose notes sections', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Legacy Section Preservation',
        '--backlog-item-key',
        'legacy-section-preservation',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'legacy-sections.md',
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

  const stageEnvelope = parseEnvelope<{ log_path: string }>(
    runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--json'], {
      cwd: repo,
    }).stdout,
  );
  const stageLogPath = path.join(repo, stageEnvelope.data.log_path);
  const authored = `${(await readFile(stageLogPath, 'utf8')).trimEnd()}\n\n## Summary\n\nLegacy operator summary.\n\n## Notes\n\nParagraph note preserved across rewrite.\n- Existing bullet note.\n`;
  await writeFile(stageLogPath, authored);

  runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--ready-for-close'], {
    cwd: repo,
  });

  const rerendered = await readFile(stageLogPath, 'utf8');
  assert.match(rerendered, /## Summary\n\nLegacy operator summary\./u);
  assert.match(
    rerendered,
    /## Notes\n\nParagraph note preserved across rewrite\.\n- Existing bullet note\./u,
  );
});

test('stage-controller reruns preserve decision intro prose before canonical subsections', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Decision Preface Preservation',
        '--backlog-item-key',
        'decision-preface-preservation',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'decision-preface.md',
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

  const stageEnvelope = parseEnvelope<{ log_path: string }>(
    runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--json'], {
      cwd: repo,
    }).stdout,
  );
  const stageLogPath = path.join(repo, stageEnvelope.data.log_path);
  const authored = (await readFile(stageLogPath, 'utf8')).replace(
    '## Decisions / reclassifications\n\n### Spec gap decisions\n\nnone',
    [
      '## Decisions / reclassifications',
      '',
      'Operator overview before subsections.',
      '',
      '### Spec gap decisions',
      '',
      'Resolved missing acceptance boundary.',
    ].join('\n'),
  );
  await writeFile(stageLogPath, authored);

  runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--ready-for-close'], {
    cwd: repo,
  });

  const rerendered = await readFile(stageLogPath, 'utf8');
  assert.match(
    rerendered,
    /## Decisions \/ reclassifications\n\nOperator overview before subsections\./u,
  );
  assert.match(rerendered, /### Spec gap decisions\n\nResolved missing acceptance boundary\./u);
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
  const artifactRelativePath = verifyResult.stdout
    .match(/\[dossier-verify\] artifact=(.+)/)?.[1]
    ?.trim();
  assert.ok(artifactRelativePath, 'verification artifact path not found in stdout');

  const artifact = JSON.parse(await readFile(path.join(repo, artifactRelativePath), 'utf8')) as {
    checks: Array<{ command: string }>;
  };
  for (const check of artifact.checks) {
    assert.match(check.command, /\bdossier-engineer\b/);
    assert.doesNotMatch(check.command, /node scripts\/dossier\.mjs/);
  }
});

test('dossier-verify links verification artifacts into stage log and stage state', async () => {
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
        'Verification Linkage',
        '--backlog-item-key',
        'verification-linkage',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'verification-linkage.md',
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

  runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  const verifyResult = runCli(
    [
      'dossier-verify',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'spec-compact',
      '--skip-index-refresh',
      '--skip-diff-check',
    ],
    { cwd: repo, allowFailure: true },
  );
  const artifactRelativePath = verifyResult.stdout
    .match(/\[dossier-verify\] artifact=(.+)/)?.[1]
    ?.trim();
  assert.ok(artifactRelativePath, 'verification artifact path not found in stdout');

  const state = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', intakeEnvelope.data.feature_id, 'spec-compact.json'),
      'utf8',
    ),
  ) as { log_path: string; verification_artifacts: string[] };
  assert.deepEqual(state.verification_artifacts, [artifactRelativePath]);

  const stageMetadata = parseStageLogMetadata(
    await readFile(path.join(repo, state.log_path), 'utf8'),
  );
  assert.deepEqual(stageMetadata.verification_artifacts, state.verification_artifacts);
});

test('stage re-entry clears stale verification artifacts and commit anchors', async () => {
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
        'Reentry Clears Evidence',
        '--backlog-item-key',
        'reentry-clears-evidence',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'reentry-clears-evidence.md',
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

  runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  const verifyResult = runCli(
    [
      'dossier-verify',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'spec-compact',
      '--skip-index-refresh',
      '--skip-diff-check',
    ],
    { cwd: repo, allowFailure: true },
  );
  const artifactRelativePath = verifyResult.stdout
    .match(/\[dossier-verify\] artifact=(.+)/)?.[1]
    ?.trim();
  assert.ok(artifactRelativePath, 'verification artifact path not found in stdout');

  const statePath = path.join(
    repo,
    '.dossier',
    'stages',
    intakeEnvelope.data.feature_id,
    'spec-compact.json',
  );
  const state = JSON.parse(await readFile(statePath, 'utf8')) as Record<string, unknown>;
  assert.deepEqual(state.verification_artifacts, [artifactRelativePath]);
  state.final_delivery_commit = 'stale-delivery-commit';
  state.final_closure_commit = 'stale-closure-commit';
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);

  runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });

  const reopenedState = JSON.parse(await readFile(statePath, 'utf8')) as {
    final_closure_commit: string | null;
    final_delivery_commit: string | null;
    log_path: string;
    verification_artifacts: string[];
  };
  assert.deepEqual(reopenedState.verification_artifacts, []);
  assert.equal(reopenedState.final_delivery_commit, null);
  assert.equal(reopenedState.final_closure_commit, null);

  const stageMetadata = parseStageLogMetadata(
    await readFile(path.join(repo, reopenedState.log_path), 'utf8'),
  );
  assert.deepEqual(stageMetadata.verification_artifacts, []);
  assert.equal(stageMetadata.final_delivery_commit, null);
  assert.equal(stageMetadata.final_closure_commit, null);
});

test('dossier-verify fails closed when verification linkage cannot update stage state', async () => {
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
        'Verification Linkage Failure',
        '--backlog-item-key',
        'verification-linkage-failure',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'verification-linkage-failure.md',
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

  runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  const statePath = path.join(
    repo,
    '.dossier',
    'stages',
    intakeEnvelope.data.feature_id,
    'spec-compact.json',
  );
  await rm(statePath);
  await mkdir(statePath);

  const result = runCli(
    [
      'dossier-verify',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'spec-compact',
      '--skip-index-refresh',
      '--skip-diff-check',
    ],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 1);
  assert.match(result.stdout, /\[dossier-verify\] artifact=/);
  const payload = JSON.parse(result.stderr) as {
    error: { artifact_path: string; code: string; command: string; step: string };
  };
  assert.equal(payload.error.code, 'UDE_STAGE_LINKAGE_FAILED');
  assert.equal(payload.error.command, 'dossier-verify');
  assert.equal(payload.error.step, 'spec-compact');
  assert.match(payload.error.artifact_path, /^\.dossier\/verification\/F-\d{4}\//u);
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

  const result = runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id], {
    cwd: repo,
    allowFailure: true,
  });

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
  const attentionEnvelope = parseEnvelope<Array<Record<string, unknown>>>(
    runCli(['attention'], { cwd: repo }).stdout,
  );
  const attention = attentionEnvelope.data;
  const itemsEnvelope = parseEnvelope<
    Array<{
      computed_state: { ready_for_next_step: boolean };
      item: { item_key: string };
      open_source_review_ids: string[];
      source_review_blocked: boolean;
    }>
  >(runCli(['items', '--item-keys', 'auth-core'], { cwd: repo }).stdout);
  const items = itemsEnvelope.data;
  const statusEnvelope = parseEnvelope<{
    open_source_review_count: number;
    ready_for_next_step_count: number;
    source_review_blocked_item_count: number;
  }>(runCli(['status'], { cwd: repo }).stdout);
  const status = statusEnvelope.data;
  const queueEnvelope = parseEnvelope<Array<{ items: string[] }>>(
    runCli(['queue'], { cwd: repo }).stdout,
  );
  const queue = queueEnvelope.data;

  assert.equal(refreshEnvelope.command, 'refresh');
  assert.equal(refresh.source_reviews_created, 1);
  assert.deepEqual(refresh.source_review_ids, ['sr-11111111-1111-4111-8111-111111111111']);
  assert.equal(refreshEnvelope.next_commands[0], 'dossier-engineer attention');
  assert.match(
    refreshEnvelope.next_commands[1] ?? '',
    /dossier-engineer items --item-keys .*auth-core/,
  );
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
  const queueEnvelope = parseEnvelope<Array<{ items: string[] }>>(
    runCli(['queue'], { cwd: repo }).stdout,
  );
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
    ['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--dossier', 'misc.md'],
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

  const result = runCli(['lifecycle-refresh', '--dossier', intakeEnvelope.data.dossier, '--json'], {
    cwd: repo,
    allowFailure: true,
  });

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
    runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id, '--json'], {
      cwd: repo,
    }).stdout,
  );

  parseEnvelope<{ log_path: string }>(
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

  const implementationStatePath = path.join(
    repo,
    '.dossier',
    'stages',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  const implementationState = JSON.parse(await readFile(implementationStatePath, 'utf8')) as {
    process_complete_ts: string | null;
    step_artifact: string | null;
  };
  implementationState.process_complete_ts = '2026-04-21T10:00:00.000Z';
  implementationState.step_artifact = '../outside/implementation.json';
  await writeFile(implementationStatePath, `${JSON.stringify(implementationState, null, 2)}\n`);

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
  assert.ok(refreshEnvelope.data.snapshot.lifecycle.stages['change-proposal'].cycle_ids.length > 0);
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

  const result = runCli(['review-artifact', '--dossier', intake.dossier, '--step', 'bogus-step'], {
    cwd: repo,
    allowFailure: true,
  });
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
  await writeReviewArtifactFile({
    path: reviewArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
  });

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
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
  });
  await writeReviewArtifactFile({
    path: reviewArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
    verdict: 'FAIL',
    mustFix: ['Closeout remains blocked.'],
  });

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

test('dossier-step-close requires selected backlog lifecycle actualization before writing step artifacts', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'implementation-lifecycle-required',
    deliveryState: 'planned',
  });

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Implementation Lifecycle Required',
        '--backlog-item-key',
        'implementation-lifecycle-required',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'implementation-lifecycle-required.md',
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

  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
    ],
    { cwd: repo },
  );

  const result = runCli(
    ['dossier-step-close', '--dossier', intakeEnvelope.data.dossier, '--step', 'implementation'],
    { cwd: repo, allowFailure: true },
  );

  assert.equal(result.code, 3);
  const payload = JSON.parse(result.stderr) as {
    error: {
      backlog_actualization_verdict: string;
      code: string;
      current_delivery_state: string | null;
      selected_backlog_item_key: string | null;
      target_delivery_state: string | null;
    };
  };
  assert.equal(payload.error.code, 'UDE_BACKLOG_ACTUALIZATION_REQUIRED');
  assert.equal(payload.error.selected_backlog_item_key, 'implementation-lifecycle-required');
  assert.equal(payload.error.current_delivery_state, 'planned');
  assert.equal(payload.error.target_delivery_state, 'implemented');
  assert.equal(payload.error.backlog_actualization_verdict, 'actualization_required');
  await stat(path.join(repo, '.dossier', 'steps', intakeEnvelope.data.feature_id)).then(
    () =>
      assert.fail('step artifact directory should not be created before lifecycle actualization'),
    () => undefined,
  );
});

test('dossier-step-close records applied backlog actualization artifacts in stage telemetry', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'implementation-lifecycle-actualized',
    deliveryState: 'planned',
  });

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Implementation Lifecycle Actualized',
        '--backlog-item-key',
        'implementation-lifecycle-actualized',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'implementation-lifecycle-actualized.md',
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

  const implementationStart = parseEnvelope<{ log_path: string }>(
    runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id, '--json'], {
      cwd: repo,
    }).stdout,
  );
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'non-code',
    ],
    { cwd: repo },
  );
  const actualizationArtifact = await applyBacklogLifecyclePatch({
    repo,
    itemKey: 'implementation-lifecycle-actualized',
    deliveryState: 'implemented',
  });

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'implementation',
  });
  const specReview = recordReviewArtifact({
    repo,
    dossier: intakeEnvelope.data.dossier,
    step: 'implementation',
    auditClass: 'spec-conformance-reviewer',
    reviewerAgentId: 'audit-agent-lifecycle-spec',
    reviewerThreadId: 'review-thread-lifecycle-spec',
  });
  const codeReview = recordReviewArtifact({
    repo,
    dossier: intakeEnvelope.data.dossier,
    step: 'implementation',
    auditClass: 'code-reviewer',
    reviewerAgentId: 'audit-agent-lifecycle-code',
    reviewerThreadId: 'review-thread-lifecycle-code',
  });
  const securityReview = recordReviewArtifact({
    repo,
    dossier: intakeEnvelope.data.dossier,
    step: 'implementation',
    auditClass: 'security-reviewer',
    reviewerAgentId: 'audit-agent-lifecycle-security',
    reviewerThreadId: 'review-thread-lifecycle-security',
    securityTriggerReason: 'backlog-lifecycle-actualization',
  });

  runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specReview,
      '--review-artifact',
      codeReview,
      '--review-artifact',
      securityReview,
      '--backlog-actualization-artifact',
      actualizationArtifact,
    ],
    { cwd: repo },
  );

  const stageState = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', intakeEnvelope.data.feature_id, 'implementation.json'),
      'utf8',
    ),
  ) as {
    backlog_actualization_artifacts: string[];
    backlog_actualization_verdict: string;
    backlog_lifecycle_current: string | null;
    backlog_lifecycle_reconciled: boolean;
    backlog_lifecycle_target: string | null;
    process_complete_ts: string | null;
    step_artifact: string | null;
  };
  assert.equal(stageState.backlog_lifecycle_target, 'implemented');
  assert.equal(stageState.backlog_lifecycle_current, 'implemented');
  assert.equal(stageState.backlog_lifecycle_reconciled, true);
  assert.deepEqual(stageState.backlog_actualization_artifacts, [actualizationArtifact]);
  assert.equal(stageState.backlog_actualization_verdict, 'actualized_by_backlog_artifact');
  assert.match(stageState.process_complete_ts ?? '', /^\d{4}-\d{2}-\d{2}T/u);
  assert.equal(
    stageState.step_artifact,
    `.dossier/steps/${intakeEnvelope.data.feature_id}/implementation.json`,
  );

  const stageMetadata = parseStageLogMetadata(
    await readFile(path.join(repo, implementationStart.data.log_path), 'utf8'),
  );
  assert.deepEqual(
    stageMetadata.backlog_actualization_artifacts,
    stageState.backlog_actualization_artifacts,
  );
  assert.equal(stageMetadata.backlog_actualization_verdict, 'actualized_by_backlog_artifact');
});

test('dossier-step-close accepts already reconciled backlog lifecycle without an actualization artifact', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'implementation-lifecycle-current',
    deliveryState: 'implemented',
  });

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Implementation Lifecycle Current',
        '--backlog-item-key',
        'implementation-lifecycle-current',
        '--backlog-delivery-state',
        'implemented',
        '--backlog-source',
        'implementation-lifecycle-current.md',
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

  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
    ],
    { cwd: repo },
  );

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'implementation',
  });
  const specReview = recordReviewArtifact({
    repo,
    dossier: intakeEnvelope.data.dossier,
    step: 'implementation',
    auditClass: 'spec-conformance-reviewer',
    reviewerAgentId: 'audit-agent-current-spec',
    reviewerThreadId: 'review-thread-current-spec',
  });
  const codeReview = recordReviewArtifact({
    repo,
    dossier: intakeEnvelope.data.dossier,
    step: 'implementation',
    auditClass: 'code-reviewer',
    reviewerAgentId: 'audit-agent-current-code',
    reviewerThreadId: 'review-thread-current-code',
  });
  const securityReview = recordReviewArtifact({
    repo,
    dossier: intakeEnvelope.data.dossier,
    step: 'implementation',
    auditClass: 'security-reviewer',
    reviewerAgentId: 'audit-agent-current-security',
    reviewerThreadId: 'review-thread-current-security',
    securityTriggerReason: 'current-backlog-state',
  });

  runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specReview,
      '--review-artifact',
      codeReview,
      '--review-artifact',
      securityReview,
    ],
    { cwd: repo },
  );

  const stageState = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', intakeEnvelope.data.feature_id, 'implementation.json'),
      'utf8',
    ),
  ) as {
    backlog_actualization_artifacts: string[];
    backlog_actualization_verdict: string;
    backlog_lifecycle_current: string | null;
    backlog_lifecycle_reconciled: boolean;
    backlog_lifecycle_target: string | null;
  };
  assert.equal(stageState.backlog_lifecycle_target, 'implemented');
  assert.equal(stageState.backlog_lifecycle_current, 'implemented');
  assert.equal(stageState.backlog_lifecycle_reconciled, true);
  assert.deepEqual(stageState.backlog_actualization_artifacts, []);
  assert.equal(stageState.backlog_actualization_verdict, 'current_state_satisfies_target');
});

test('implementation close marks post-close backlog hygiene missing without refreshing', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  const feature = await startImplementationFeature({
    repo,
    itemKey: 'post-close-hygiene-missing',
    title: 'Post Close Hygiene Missing',
  });

  await closeImplementationWithSpecReview({
    repo,
    dossier: feature.dossier,
    featureId: feature.featureId,
  });

  const stageState = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', feature.featureId, 'implementation.json'),
      'utf8',
    ),
  ) as {
    post_close_backlog_hygiene_artifact: string | null;
    post_close_backlog_hygiene_required: boolean;
    post_close_backlog_hygiene_status: string;
  };
  const backlogState = JSON.parse(
    await readFile(path.join(repo, '.dossier', 'backlog', 'state.json'), 'utf8'),
  ) as { last_refresh_at: string | null };
  const statusEnvelope = parseEnvelope<{
    post_close_hygiene_missing_count: number;
    post_close_hygiene_missing_feature_ids: string[];
  }>(runCli(['status'], { cwd: repo }).stdout);
  const queueEnvelope = parseEnvelope<unknown[]>(runCli(['queue'], { cwd: repo }).stdout);
  const nextStep = JSON.parse(
    runCli(['next-step', '--dossier', feature.dossier, '--json'], { cwd: repo }).stdout,
  ) as {
    post_close_backlog_hygiene_artifact: string | null;
    post_close_backlog_hygiene_status: string;
  };

  assert.equal(stageState.post_close_backlog_hygiene_required, true);
  assert.equal(stageState.post_close_backlog_hygiene_status, 'missing');
  assert.equal(stageState.post_close_backlog_hygiene_artifact, null);
  assert.equal(backlogState.last_refresh_at, null);
  assert.equal(statusEnvelope.data.post_close_hygiene_missing_count, 1);
  assert.deepEqual(statusEnvelope.data.post_close_hygiene_missing_feature_ids, [feature.featureId]);
  assert.deepEqual(queueEnvelope.warnings, [
    `Post-close backlog hygiene missing for implementation features: ${feature.featureId}`,
  ]);
  assert.equal(nextStep.post_close_backlog_hygiene_status, 'missing');
  assert.equal(nextStep.post_close_backlog_hygiene_artifact, null);
});

test('post-close-hygiene writes clean evidence and detects later stale backlog truth', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  const feature = await startImplementationFeature({
    repo,
    itemKey: 'post-close-hygiene-clean',
    title: 'Post Close Hygiene Clean',
  });
  await closeImplementationWithSpecReview({
    repo,
    dossier: feature.dossier,
    featureId: feature.featureId,
  });

  const hygieneEnvelope = parseEnvelope<{
    artifact_path: string;
    backlog_clean: boolean;
    open_source_review_count: number;
    post_close_backlog_hygiene_status: string;
  }>(
    runCli(
      ['post-close-hygiene', '--dossier', feature.dossier, '--step', 'implementation', '--json'],
      {
        cwd: repo,
      },
    ).stdout,
  );
  assert.equal(hygieneEnvelope.command, 'post-close-hygiene');
  assert.equal(hygieneEnvelope.result, 'ok');
  assert.equal(hygieneEnvelope.data.post_close_backlog_hygiene_status, 'clean');
  assert.equal(hygieneEnvelope.data.backlog_clean, true);
  assert.equal(hygieneEnvelope.data.open_source_review_count, 0);
  await stat(path.join(repo, hygieneEnvelope.data.artifact_path));

  const cleanStageState = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', feature.featureId, 'implementation.json'),
      'utf8',
    ),
  ) as {
    post_close_backlog_hygiene_artifact: string | null;
    post_close_backlog_hygiene_status: string;
  };
  assert.equal(cleanStageState.post_close_backlog_hygiene_status, 'clean');
  assert.equal(
    cleanStageState.post_close_backlog_hygiene_artifact,
    hygieneEnvelope.data.artifact_path,
  );

  const cleanNextStep = JSON.parse(
    runCli(['next-step', '--dossier', feature.dossier, '--json'], { cwd: repo }).stdout,
  ) as { post_close_backlog_hygiene_status: string };
  assert.equal(cleanNextStep.post_close_backlog_hygiene_status, 'clean');

  const backlogStatePath = path.join(repo, '.dossier', 'backlog', 'state.json');
  const backlogState = JSON.parse(await readFile(backlogStatePath, 'utf8')) as Record<
    string,
    unknown
  >;
  await writeFile(
    backlogStatePath,
    `${JSON.stringify({ ...backlogState, updated_at: '2999-01-01T00:00:00.000Z' }, null, 2)}\n`,
  );
  const staleStatus = parseEnvelope<{
    post_close_hygiene_stale_count: number;
    post_close_hygiene_stale_feature_ids: string[];
  }>(runCli(['status'], { cwd: repo }).stdout);
  const staleQueue = parseEnvelope<unknown[]>(runCli(['queue'], { cwd: repo }).stdout);

  assert.equal(staleStatus.data.post_close_hygiene_stale_count, 1);
  assert.deepEqual(staleStatus.data.post_close_hygiene_stale_feature_ids, [feature.featureId]);
  assert.deepEqual(staleQueue.warnings, [
    `Post-close backlog hygiene stale for implementation features: ${feature.featureId}`,
  ]);
});

test('post-close-hygiene marks changed sources blocked without auto-ack', async () => {
  const repo = await makeTempRepoPath();
  await seedRefreshableBacklog(repo);
  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Post Close Source Review Blocked',
        '--backlog-item-key',
        'auth-core',
        '--backlog-delivery-state',
        'specified',
        '--backlog-source',
        'sources/docs/modules/auth.md',
        '--area',
        'backend',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );
  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  await applyBacklogLifecyclePatch({
    repo,
    itemKey: 'auth-core',
    deliveryState: 'implemented',
  });
  await closeImplementationWithSpecReview({
    repo,
    dossier: intakeEnvelope.data.dossier,
    featureId: intakeEnvelope.data.feature_id,
  });
  await writeFile(
    path.join(repo, 'sources', 'docs', 'modules', 'auth.md'),
    `${await readFile(path.join(repo, 'sources', 'docs', 'modules', 'auth.md'), 'utf8')}\npost-close change`,
  );

  const hygieneEnvelope = parseEnvelope<{
    artifact_path: string;
    backlog_clean: boolean;
    open_source_review_count: number;
    post_close_backlog_hygiene_status: string;
    source_review_blocked_item_count: number;
  }>(
    runCli(
      [
        'post-close-hygiene',
        '--feature-id',
        intakeEnvelope.data.feature_id,
        '--step',
        'implementation',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );
  const statusEnvelope = parseEnvelope<{
    open_source_review_count: number;
    post_close_hygiene_blocked_count: number;
    source_review_blocked_item_count: number;
  }>(runCli(['status'], { cwd: repo }).stdout);
  const sourceReview = JSON.parse(
    await readFile(
      path.join(
        repo,
        '.dossier',
        'backlog',
        'source-review',
        'sr-11111111-1111-4111-8111-111111111111.json',
      ),
      'utf8',
    ),
  ) as { status: string };

  assert.equal(hygieneEnvelope.result, 'blocked');
  assert.equal(hygieneEnvelope.data.post_close_backlog_hygiene_status, 'blocked');
  assert.equal(hygieneEnvelope.data.backlog_clean, false);
  assert.equal(hygieneEnvelope.data.open_source_review_count, 1);
  assert.equal(hygieneEnvelope.data.source_review_blocked_item_count, 3);
  assert.equal(statusEnvelope.data.open_source_review_count, 1);
  assert.equal(statusEnvelope.data.source_review_blocked_item_count, 3);
  assert.equal(statusEnvelope.data.post_close_hygiene_blocked_count, 1);
  assert.equal(sourceReview.status, 'open');
});

test('legacy implementation state without post-close required flag remains not_required', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  const feature = await startImplementationFeature({
    repo,
    itemKey: 'post-close-hygiene-legacy',
    title: 'Post Close Hygiene Legacy',
  });
  await closeImplementationWithSpecReview({
    repo,
    dossier: feature.dossier,
    featureId: feature.featureId,
  });

  const stageStatePath = path.join(
    repo,
    '.dossier',
    'stages',
    feature.featureId,
    'implementation.json',
  );
  const stageState = JSON.parse(await readFile(stageStatePath, 'utf8')) as Record<string, unknown>;
  for (const key of Object.keys(stageState)) {
    if (key.startsWith('post_close_')) {
      delete stageState[key];
    }
  }
  await writeFile(stageStatePath, `${JSON.stringify(stageState, null, 2)}\n`);

  const nextStep = JSON.parse(
    runCli(['next-step', '--dossier', feature.dossier, '--json'], { cwd: repo }).stdout,
  ) as { post_close_backlog_hygiene_status: string };
  const statusEnvelope = parseEnvelope<{
    post_close_hygiene_missing_count: number;
    post_close_hygiene_stale_count: number;
    post_close_hygiene_blocked_count: number;
  }>(runCli(['status'], { cwd: repo }).stdout);

  assert.equal(nextStep.post_close_backlog_hygiene_status, 'not_required');
  assert.equal(statusEnvelope.data.post_close_hygiene_missing_count, 0);
  assert.equal(statusEnvelope.data.post_close_hygiene_stale_count, 0);
  assert.equal(statusEnvelope.data.post_close_hygiene_blocked_count, 0);
});

test('spec and plan close-out enforce their selected backlog lifecycle targets', async () => {
  const cases = [
    {
      stage: 'spec-compact',
      itemKey: 'spec-lifecycle-required',
      current: 'defined',
      target: 'specified',
    },
    {
      stage: 'plan-slice',
      itemKey: 'plan-lifecycle-required',
      current: 'specified',
      target: 'planned',
    },
  ] as const;

  for (const { stage, itemKey, current, target } of cases) {
    const repo = await makeTempRepoPath();
    await initializeRepo(repo);
    await seedBacklogItem({
      repo,
      itemKey,
      deliveryState: current,
    });

    const intakeEnvelope = parseEnvelope<{
      dossier: string;
      feature_id: string;
    }>(
      runCli(
        [
          'feature-intake',
          '--title',
          `${stage} Lifecycle Required`,
          '--backlog-item-key',
          itemKey,
          '--backlog-delivery-state',
          current,
          '--backlog-source',
          `${itemKey}.md`,
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

    runCli([stage, '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
    runCli([stage, '--feature-id', intakeEnvelope.data.feature_id, '--ready-for-close'], {
      cwd: repo,
    });

    const result = runCli(
      ['dossier-step-close', '--dossier', intakeEnvelope.data.dossier, '--step', stage],
      { cwd: repo, allowFailure: true },
    );

    assert.equal(result.code, 3, stage);
    const payload = JSON.parse(result.stderr) as {
      error: {
        code: string;
        current_delivery_state: string | null;
        target_delivery_state: string | null;
      };
    };
    assert.equal(payload.error.code, 'UDE_BACKLOG_ACTUALIZATION_REQUIRED');
    assert.equal(payload.error.current_delivery_state, current);
    assert.equal(payload.error.target_delivery_state, target);
    await stat(path.join(repo, '.dossier', 'steps', intakeEnvelope.data.feature_id)).then(
      () => assert.fail(`${stage} step artifact directory should not be created`),
      () => undefined,
    );
  }
});

test('status and queue expose lifecycle drift instead of silently returning stale done features', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'done-feature-stale-backlog',
    deliveryState: 'planned',
  });

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Done Feature Stale Backlog',
        '--backlog-item-key',
        'done-feature-stale-backlog',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'done-feature-stale-backlog.md',
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

  const dossierPath = path.join(repo, intakeEnvelope.data.dossier);
  await writeFile(
    dossierPath,
    (await readFile(dossierPath, 'utf8')).replace(/^status: .+$/mu, 'status: done'),
  );

  const statusEnvelope = parseEnvelope<{
    lifecycle_reconciliation_drift_count: number;
    lifecycle_reconciliation_drifts: Array<{
      backlog_item_key: string | null;
      expected_delivery_state: string | null;
      feature_id: string;
      kind: string;
    }>;
    ready_for_next_step_count: number;
  }>(runCli(['status'], { cwd: repo }).stdout);
  assert.equal(statusEnvelope.data.lifecycle_reconciliation_drift_count, 1);
  assert.equal(statusEnvelope.data.ready_for_next_step_count, 0);
  assert.deepEqual(statusEnvelope.data.lifecycle_reconciliation_drifts, [
    {
      kind: 'done_feature_backlog_state',
      feature_id: intakeEnvelope.data.feature_id,
      backlog_item_key: 'done-feature-stale-backlog',
      backlog_delivery_state: 'planned',
      expected_delivery_state: 'implemented',
      step_artifact: null,
      message: `Feature ${intakeEnvelope.data.feature_id} is done while selected backlog item done-feature-stale-backlog is planned, expected implemented.`,
    },
  ]);

  const queueEnvelope = parseEnvelope<Array<{ items: string[] }>>(
    runCli(['queue'], { cwd: repo }).stdout,
  );
  assert.deepEqual(queueEnvelope.data, []);
  assert.deepEqual(queueEnvelope.warnings, [
    'Lifecycle reconciliation drift blocked queue items: done-feature-stale-backlog',
  ]);
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

test('dossier-step-close preserves authored intake narrative sections', async () => {
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
        'Closeout Narrative Preservation',
        '--backlog-item-key',
        'closeout-narrative-preservation',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'closeout-preservation.md',
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

  const intakeLogPath = path.join(
    repo,
    '.dossier',
    'logs',
    'feature-intake',
    `${intakeEnvelope.data.feature_id}--${intakeEnvelope.data.feature_cycle_id}.md`,
  );
  const authored = (await readFile(intakeLogPath, 'utf8'))
    .replace('## Scope\n\nnone', '## Scope\n\nOperator asked for a minimal intake pass.')
    .replace(
      '## Backlog handoff decisions\n\nnone',
      '## Backlog handoff decisions\n\nConfirmed backlog item remains the single feature source.',
    )
    .replace('## Close-out\n\nnone', '## Close-out\n\nReady for truthful closeout.');
  await writeFile(intakeLogPath, authored);

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'feature-intake.json',
  );
  await mkdir(path.dirname(verifyArtifact), { recursive: true });
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
  });
  const reviewArtifact = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'intake-reviewer',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-intake',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-intake-preserve' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(reviewArtifact);

  runCli(
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
    { cwd: repo, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  const closedLog = await readFile(intakeLogPath, 'utf8');
  assert.match(closedLog, /## Scope\n\nOperator asked for a minimal intake pass\./u);
  assert.match(
    closedLog,
    /## Backlog handoff decisions\n\nConfirmed backlog item remains the single feature source\./u,
  );
  assert.match(closedLog, /## Close-out\n\nReady for truthful closeout\./u);
  assert.match(closedLog, /intake_process_complete_ts:/u);
  assert.match(closedLog, /step_close_ts:/u);
  assert.match(closedLog, /step_artifact:/u);
});

test('review-artifact persists audit-class metadata and updates stage-log review summary', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Review Artifact Summary',
        '--backlog-item-key',
        'review-artifact-summary',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'review-artifact-summary.md',
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

  const stageEnvelope = parseEnvelope<{ log_path: string }>(
    runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--json'], {
      cwd: repo,
    }).stdout,
  );

  const reviewResult = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'spec-compact',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-7',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-spec-1' } },
  );

  assert.match(reviewResult.stdout, /\[review-artifact\] audit_class=spec-conformance-reviewer/u);
  const stageLog = await readFile(path.join(repo, stageEnvelope.data.log_path), 'utf8');
  assert.match(stageLog, /required_audit_classes:\n {2}- spec-conformance-reviewer/u);
  assert.match(stageLog, /executed_audit_classes:\n {2}- spec-conformance-reviewer/u);
  assert.match(stageLog, /required_external_review_pending: false/u);
  assert.match(stageLog, /reviewer_skills:\n {2}- spec-conformance-reviewer/u);
  assert.match(stageLog, /reviewer_agent_ids:\n {2}- audit-agent-7/u);
  assert.match(stageLog, /first_review_agent_started_ts:/u);
});

test('review-artifact fails closed when review linkage cannot update stage state', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Review Linkage Failure',
        '--backlog-item-key',
        'review-linkage-failure',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'review-linkage-failure.md',
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

  runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  const statePath = path.join(
    repo,
    '.dossier',
    'stages',
    intakeEnvelope.data.feature_id,
    'spec-compact.json',
  );
  const stateDir = path.dirname(statePath);
  await chmod(stateDir, 0o500);
  let result: CliResult;
  try {
    result = runCli(
      [
        'review-artifact',
        '--dossier',
        intakeEnvelope.data.dossier,
        '--step',
        'spec-compact',
        '--audit-class',
        'spec-conformance-reviewer',
        '--verdict',
        'PASS',
        '--reviewer',
        'external-spec-review',
        '--reviewer-skill',
        'spec-conformance-reviewer',
        '--reviewer-agent-id',
        'audit-agent-linkage-fail',
      ],
      {
        cwd: repo,
        allowFailure: true,
        env: { CODEX_THREAD_ID: 'review-thread-linkage-fail' },
      },
    );
  } finally {
    await chmod(stateDir, 0o700);
  }

  assert.equal(result.code, 1);
  assert.match(result.stdout, /\[review-artifact\] Wrote /u);
  const payload = JSON.parse(result.stderr) as {
    error: { artifact_path: string; code: string; command: string; step: string };
  };
  assert.equal(payload.error.code, 'UDE_STAGE_LINKAGE_FAILED');
  assert.equal(payload.error.command, 'review-artifact');
  assert.equal(payload.error.step, 'spec-compact');
  assert.match(payload.error.artifact_path, /^\.dossier\/reviews\/F-\d{4}\//u);
});

test('review-artifact marks stale git-backed reviews as pending in stage telemetry', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'stale-review-telemetry',
    deliveryState: 'specified',
  });
  commitRepoState(repo, 'baseline');

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_cycle_id: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Stale Review Telemetry',
        '--backlog-item-key',
        'stale-review-telemetry',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'stale-review.md',
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

  const stageEnvelope = parseEnvelope<{ log_path: string }>(
    runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--json'], {
      cwd: repo,
    }).stdout,
  );
  commitRepoState(repo, 'stage setup');

  const reviewResult = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'spec-compact',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-7',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-spec-2' } },
  );
  const reviewArtifactMatch = reviewResult.stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u);
  assert.ok(reviewArtifactMatch?.[1]);

  await writeFile(path.join(repo, 'post-review-change.txt'), 'material change\n');
  commitRepoState(repo, 'post review mutation');

  const stageLogBeforeClose = await readFile(path.join(repo, stageEnvelope.data.log_path), 'utf8');
  assert.match(stageLogBeforeClose, /required_external_review_pending: false/u);
  assert.match(stageLogBeforeClose, /stale_review_present: false/u);

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'spec-compact.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'spec-compact',
  });

  const closeResult = runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'spec-compact',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      reviewArtifactMatch[1].trim(),
    ],
    { cwd: repo, allowFailure: true, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  assert.equal(closeResult.code, 3);
  const blockedPayload = JSON.parse(closeResult.stderr) as {
    error: { blockers: string[]; code: string };
  };
  assert.equal(blockedPayload.error.code, 'UDE_CLOSURE_BLOCKED');
  assert.ok(
    blockedPayload.error.blockers.some((blocker) => blocker.includes('is stale: event commit')),
  );

  const stageLogAfterClose = await readFile(path.join(repo, stageEnvelope.data.log_path), 'utf8');
  assert.match(stageLogAfterClose, /required_external_review_pending: true/u);
  assert.match(stageLogAfterClose, /stale_review_present: true/u);

  const refreshEnvelope = parseEnvelope<{
    snapshot: {
      lifecycle: {
        stages: Record<
          string,
          {
            review_policy: {
              required_external_review_pending: boolean | null;
              stale_review_present: boolean | null;
            };
          }
        >;
      };
    };
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
  const specCompactStage = refreshEnvelope.data.snapshot.lifecycle.stages['spec-compact'];
  assert.ok(specCompactStage);
  assert.equal(specCompactStage.review_policy.required_external_review_pending, true);
  assert.equal(specCompactStage.review_policy.stale_review_present, true);
});

test('latest invalidated audit event reopens the required review pending signal', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string; log_path: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Invalidated Review Pending',
        '--backlog-item-key',
        'invalidated-review-pending',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'invalidated-review-pending.md',
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

  runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-pass',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-pass' } },
  );
  runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'FAIL',
      '--invalidated',
      '--reviewer',
      'external-spec-review-rerun',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-invalidated',
      '--must-fix',
      'rerun required after material change',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-invalidated' } },
  );

  const stageLog = await readFile(path.join(repo, intakeEnvelope.data.log_path), 'utf8');
  assert.match(stageLog, /required_external_review_pending: true/u);
  assert.match(stageLog, /invalidated_review_present: true/u);
  assert.match(stageLog, /final_pass_ts: null/u);
});

test('dossier-step-close rejects self-review as a substitute for the required external baseline audit', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Self Review Block',
        '--backlog-item-key',
        'self-review-block',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'self-review.md',
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
    'feature-intake--spec.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
  });
  await writeReviewArtifactFile({
    path: reviewArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
    reviewMode: 'self-review',
    allowedByPolicy: false,
  });

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
    error: { blockers: string[]; code: string };
  };
  assert.equal(payload.error.code, 'UDE_CLOSURE_BLOCKED');
  assert.ok(payload.error.blockers.some((blocker) => blocker.includes('not an external audit')));
});

test('dossier-step-close rejects same-thread review artifacts as non-independent external audits', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Same Thread Review Block',
        '--backlog-item-key',
        'same-thread-review-block',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'same-thread-review.md',
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
  commitRepoState(repo, 'feature intake ready');

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'feature-intake.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
  });

  const reviewerEnv = { CODEX_THREAD_ID: 'author-thread-1' };
  const reviewResult = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'independent-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-1',
    ],
    { cwd: repo, env: reviewerEnv },
  );
  const reviewArtifactMatch = reviewResult.stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u);
  assert.ok(reviewArtifactMatch?.[1]);

  const result = runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--allow-dirty',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      reviewArtifactMatch[1].trim(),
    ],
    { cwd: repo, allowFailure: true, env: reviewerEnv },
  );

  assert.equal(result.code, 3);
  const payload = JSON.parse(result.stderr) as {
    error: { blockers: string[]; code: string };
  };
  assert.equal(payload.error.code, 'UDE_CLOSURE_BLOCKED');
  assert.ok(
    payload.error.blockers.some((blocker) =>
      blocker.includes('was produced by the current thread'),
    ),
  );
});

test('stage re-entry clears carried review summary and reopens the external-review requirement', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Stage Reentry Clears Review',
        '--backlog-item-key',
        'stage-reentry-clears-review',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'stage-reentry-clears-review.md',
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

  const stageStart = parseEnvelope<{ log_path: string }>(
    runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--json'], {
      cwd: repo,
    }).stdout,
  );
  runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--ready-for-close'], {
    cwd: repo,
  });
  runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'spec-compact',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-pass',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-stage-pass' } },
  );

  const readyLog = await readFile(path.join(repo, stageStart.data.log_path), 'utf8');
  assert.match(readyLog, /required_external_review_pending: false/u);
  assert.match(readyLog, /executed_audit_classes:\n {2}- spec-conformance-reviewer/u);

  runCli(['spec-compact', '--feature-id', intakeEnvelope.data.feature_id, '--json'], {
    cwd: repo,
  });

  const resumedLog = await readFile(path.join(repo, stageStart.data.log_path), 'utf8');
  assert.match(resumedLog, /required_external_review_pending: true/u);
  assert.match(resumedLog, /executed_audit_classes: \[\]/u);
  assert.match(resumedLog, /review_events: \[\]/u);
  assert.match(resumedLog, /stage_state: in_progress/u);
});

test('implementation reopen resets the stage-entry anchor for later non-code classification', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'implementation-reopen-entry-reset',
    deliveryState: 'implemented',
  });
  commitRepoState(repo, 'baseline');

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Implementation Reopen Entry Reset',
        '--backlog-item-key',
        'implementation-reopen-entry-reset',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'implementation-reopen-entry-reset.md',
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
  commitRepoState(repo, 'feature intake ready');

  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  await mkdir(path.join(repo, 'src'), { recursive: true });
  await writeFile(path.join(repo, 'src', 'feature.ts'), 'export const feature = true;\n');
  commitRepoState(repo, 'add code-bearing implementation');
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
    ],
    { cwd: repo },
  );

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'implementation',
    eventCommit: runGit(repo, ['rev-parse', 'HEAD']).trim(),
  });

  const firstPassArtifacts = (
    [
      ['spec-conformance-reviewer', 'spec-reviewer'],
      ['code-reviewer', 'code-reviewer'],
      ['security-reviewer', 'security-reviewer'],
    ] as const
  ).map(([auditClass, reviewer], index) => {
    const match = runCli(
      [
        'review-artifact',
        '--dossier',
        intakeEnvelope.data.dossier,
        '--step',
        'implementation',
        '--audit-class',
        auditClass,
        '--verdict',
        'PASS',
        '--reviewer',
        reviewer,
        '--reviewer-skill',
        auditClass,
        '--reviewer-agent-id',
        `audit-agent-reopen-${index + 1}`,
        ...(auditClass === 'security-reviewer'
          ? ['--security-trigger-reason', 'initial code-bearing seam']
          : []),
      ],
      { cwd: repo, env: { CODEX_THREAD_ID: `review-thread-reopen-${index + 1}` } },
    ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u);
    assert.ok(match?.[1]);
    return match[1].trim();
  });
  const [specArtifact, codeArtifact, securityArtifact] = firstPassArtifacts;
  assert.ok(specArtifact);
  assert.ok(codeArtifact);
  assert.ok(securityArtifact);

  runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specArtifact,
      '--review-artifact',
      codeArtifact,
      '--review-artifact',
      securityArtifact,
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  await writeFile(path.join(repo, 'docs-only.md'), '# docs only change\n');
  commitRepoState(repo, 'docs-only reopen change');
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'non-code',
    ],
    { cwd: repo },
  );

  const reopenSpecReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'reopen-spec-reviewer',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-reopen-spec-only',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-reopen-spec' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(reopenSpecReview);

  const reopenReviewArtifact = JSON.parse(
    await readFile(path.join(repo, reopenSpecReview), 'utf8'),
  ) as { implementation_scope: string | null };
  assert.equal(reopenReviewArtifact.implementation_scope, 'non-code');
});

test('non-implementation mutating stages keep the required external baseline at close-out', async () => {
  const cases = [
    { stage: 'spec-compact', title: 'Spec Compact Baseline', deliveryState: 'specified' },
    { stage: 'plan-slice', title: 'Plan Slice Baseline', deliveryState: 'planned' },
    { stage: 'change-proposal', title: 'Change Proposal Baseline', deliveryState: 'defined' },
  ] as const;

  for (const { stage, title, deliveryState } of cases) {
    const repo = await makeTempRepoPath();
    await initializeRepo(repo);
    await seedBacklogItem({
      repo,
      itemKey: `${stage}-baseline`,
      deliveryState,
    });

    const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
      runCli(
        [
          'feature-intake',
          '--title',
          title,
          '--backlog-item-key',
          `${stage}-baseline`,
          '--backlog-delivery-state',
          'defined',
          '--backlog-source',
          `${stage}.md`,
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

    runCli([stage, '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
    runCli([stage, '--feature-id', intakeEnvelope.data.feature_id, '--ready-for-close'], {
      cwd: repo,
    });

    const verifyArtifact = path.join(
      repo,
      '.dossier',
      'verification',
      intakeEnvelope.data.feature_id,
      `${stage}.json`,
    );
    const reviewArtifact = path.join(
      repo,
      '.dossier',
      'reviews',
      intakeEnvelope.data.feature_id,
      `${stage}--spec.json`,
    );
    await writeVerifyArtifactFile({
      path: verifyArtifact,
      featureId: intakeEnvelope.data.feature_id,
      step: stage,
    });
    await writeReviewArtifactFile({
      path: reviewArtifact,
      featureId: intakeEnvelope.data.feature_id,
      step: stage,
      reviewMode: 'self-review',
      allowedByPolicy: false,
    });

    const result = runCli(
      [
        'dossier-step-close',
        '--dossier',
        intakeEnvelope.data.dossier,
        '--step',
        stage,
        '--verify-artifact',
        verifyArtifact,
        '--review-artifact',
        reviewArtifact,
      ],
      { cwd: repo, allowFailure: true },
    );

    assert.equal(result.code, 3, `${stage} must block without an external baseline review`);
    const payload = JSON.parse(result.stderr) as {
      error: { blockers: string[]; code: string };
    };
    assert.equal(payload.error.code, 'UDE_CLOSURE_BLOCKED');
    assert.ok(
      payload.error.blockers.some((blocker) => blocker.includes('not an external audit')),
      `${stage} must report the missing external baseline`,
    );
  }
});

test('implementation close-out blocks code-bearing scope when the security audit is missing', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'missing-security-audit',
    deliveryState: 'implemented',
  });

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Missing Security Audit',
        '--backlog-item-key',
        'missing-security-audit',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'missing-security.md',
        '--area',
        'backend',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
    ],
    {
      cwd: repo,
    },
  );

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'implementation',
  });
  const specReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'spec-reviewer',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-spec',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-spec-missing-security' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  const codeReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'code-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'code-reviewer',
      '--reviewer-skill',
      'code-reviewer',
      '--reviewer-agent-id',
      'audit-agent-code',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-code-missing-security' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(specReview);
  assert.ok(codeReview);

  const result = runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specReview,
      '--review-artifact',
      codeReview,
    ],
    { cwd: repo, allowFailure: true, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  assert.equal(result.code, 3);
  const payload = JSON.parse(result.stderr) as {
    error: { blockers: string[]; code: string; step_artifact: string };
  };
  assert.equal(payload.error.code, 'UDE_CLOSURE_BLOCKED');
  assert.ok(
    payload.error.blockers.some((blocker) =>
      blocker.includes('Missing required review artifact for audit class security-reviewer'),
    ),
  );
  const stepArtifact = JSON.parse(
    await readFile(path.join(repo, payload.error.step_artifact), 'utf8'),
  ) as {
    required_audit_classes: string[];
    required_external_review_pending: boolean;
  };
  assert.deepEqual(stepArtifact.required_audit_classes, [
    'spec-conformance-reviewer',
    'code-reviewer',
    'security-reviewer',
  ]);
  assert.equal(stepArtifact.required_external_review_pending, true);
});

test('implementation close-out accepts the full code-bearing audit bundle and records audit observability', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'full-code-bearing-bundle',
    deliveryState: 'implemented',
  });

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Full Code Bearing Bundle',
        '--backlog-item-key',
        'full-code-bearing-bundle',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'full-code-bearing.md',
        '--area',
        'backend',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const implementationStart = parseEnvelope<{ log_path: string }>(
    runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id, '--json'], {
      cwd: repo,
    }).stdout,
  );
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
    ],
    {
      cwd: repo,
    },
  );

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'implementation',
  });
  const specReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'spec-reviewer',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-spec',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-spec-success' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  const codeReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'code-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'code-reviewer',
      '--reviewer-skill',
      'code-reviewer',
      '--reviewer-agent-id',
      'audit-agent-code',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-code-success' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  const securityReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'security-reviewer',
      '--security-trigger-reason',
      'runtime-wiring-changed',
      '--verdict',
      'PASS',
      '--reviewer',
      'security-reviewer',
      '--reviewer-skill',
      'security-reviewer',
      '--reviewer-agent-id',
      'audit-agent-security',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-security-success' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(specReview);
  assert.ok(codeReview);
  assert.ok(securityReview);

  runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specReview,
      '--review-artifact',
      codeReview,
      '--review-artifact',
      securityReview,
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  const stepArtifact = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'steps', intakeEnvelope.data.feature_id, 'implementation.json'),
      'utf8',
    ),
  ) as {
    executed_audit_classes: string[];
    process_complete: boolean;
    required_audit_classes: string[];
    required_external_review_pending: boolean;
    required_security_review: boolean;
    review_artifacts: string[];
    reviewer_agent_ids: string[];
    reviewer_skills: string[];
    security_trigger_reasons: string[];
    verification_artifact: string;
  };
  assert.equal(stepArtifact.process_complete, true);
  assert.deepEqual(stepArtifact.required_audit_classes, [
    'spec-conformance-reviewer',
    'code-reviewer',
    'security-reviewer',
  ]);
  assert.deepEqual(stepArtifact.executed_audit_classes, [
    'spec-conformance-reviewer',
    'code-reviewer',
    'security-reviewer',
  ]);
  assert.equal(stepArtifact.required_external_review_pending, false);
  assert.equal(stepArtifact.required_security_review, true);
  assert.deepEqual(stepArtifact.reviewer_agent_ids, [
    'audit-agent-spec',
    'audit-agent-code',
    'audit-agent-security',
  ]);
  assert.deepEqual(stepArtifact.reviewer_skills, [
    'spec-conformance-reviewer',
    'code-reviewer',
    'security-reviewer',
  ]);
  assert.deepEqual(stepArtifact.security_trigger_reasons, ['runtime-wiring-changed']);
  assert.deepEqual(stepArtifact.review_artifacts, [specReview, codeReview, securityReview]);

  const stageLog = await readFile(path.join(repo, implementationStart.data.log_path), 'utf8');
  assert.match(
    stageLog,
    /required_audit_classes:\n {2}- spec-conformance-reviewer\n {2}- code-reviewer\n {2}- security-reviewer/u,
  );
  assert.match(stageLog, /required_external_review_pending: false/u);
  assert.match(stageLog, /required_security_review: true/u);
  const stageMetadata = parseStageLogMetadata(stageLog);
  const stageState = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', intakeEnvelope.data.feature_id, 'implementation.json'),
      'utf8',
    ),
  ) as {
    review_artifacts: string[];
    step_artifact: string;
    verification_artifacts: string[];
  };
  assert.deepEqual(stageState.review_artifacts, [specReview, codeReview, securityReview]);
  assert.deepEqual(stageState.verification_artifacts, [stepArtifact.verification_artifact]);
  assert.equal(
    stageState.step_artifact,
    `.dossier/steps/${intakeEnvelope.data.feature_id}/implementation.json`,
  );
  assert.deepEqual(stageMetadata.review_artifacts, stageState.review_artifacts);
  assert.deepEqual(stageMetadata.verification_artifacts, stageState.verification_artifacts);
  assert.equal(stageMetadata.step_artifact, stageState.step_artifact);
});

test('implementation close-out rejects out-of-order required audits', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'out-of-order-implementation-audits',
    deliveryState: 'implemented',
  });
  commitRepoState(repo, 'baseline');

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Out Of Order Implementation Audits',
        '--backlog-item-key',
        'out-of-order-implementation-audits',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'out-of-order-implementation-audits.md',
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
  commitRepoState(repo, 'feature intake ready');

  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  await mkdir(path.join(repo, 'src'), { recursive: true });
  await writeFile(path.join(repo, 'src', 'order.ts'), 'export const ordered = true;\n');
  commitRepoState(repo, 'code-bearing change');
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
    ],
    { cwd: repo },
  );

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'implementation',
    eventCommit: runGit(repo, ['rev-parse', 'HEAD']).trim(),
  });

  const codeReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'code-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'code-reviewer',
      '--reviewer-skill',
      'code-reviewer',
      '--reviewer-agent-id',
      'audit-agent-order-code',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-order-code' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  const specReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'spec-reviewer',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-order-spec',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-order-spec' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  const securityReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'security-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'security-reviewer',
      '--reviewer-skill',
      'security-reviewer',
      '--reviewer-agent-id',
      'audit-agent-order-security',
      '--security-trigger-reason',
      'code-bearing implementation path',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-order-security' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];

  assert.ok(codeReview);
  assert.ok(specReview);
  assert.ok(securityReview);

  const result = runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specReview,
      '--review-artifact',
      codeReview,
      '--review-artifact',
      securityReview,
    ],
    { cwd: repo, allowFailure: true, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  assert.equal(result.code, 3);
  const payload = JSON.parse(result.stderr) as {
    error: { blockers: string[]; code: string };
  };
  assert.equal(payload.error.code, 'UDE_CLOSURE_BLOCKED');
  assert.ok(
    payload.error.blockers.some((blocker) =>
      blocker.includes('Implementation audit bundle order is invalid'),
    ),
  );
});

test('lifecycle-refresh treats a first-pass code-bearing audit bundle as zero rerounds', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'lifecycle-first-pass-bundle',
    deliveryState: 'implemented',
  });
  commitRepoState(repo, 'baseline');

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_cycle_id: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Lifecycle First Pass Bundle',
        '--backlog-item-key',
        'lifecycle-first-pass-bundle',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'lifecycle-first-pass.md',
        '--area',
        'backend',
        '--owner',
        'platform',
        '--impact',
        'backend',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'code-bearing',
    ],
    {
      cwd: repo,
    },
  );
  commitRepoState(repo, 'implementation ready for review');

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'implementation',
  });

  const specReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'spec-reviewer',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-spec',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-spec-first-pass' } },
  );
  const codeReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'code-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'code-reviewer',
      '--reviewer-skill',
      'code-reviewer',
      '--reviewer-agent-id',
      'audit-agent-code',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-code-first-pass' } },
  );
  const securityReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'security-reviewer',
      '--security-trigger-reason',
      'runtime-wiring-changed',
      '--verdict',
      'PASS',
      '--reviewer',
      'security-reviewer',
      '--reviewer-skill',
      'security-reviewer',
      '--reviewer-agent-id',
      'audit-agent-security',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-security-first-pass' } },
  );

  const reviewArtifacts = [specReview, codeReview, securityReview].map((result) => {
    const match = result.stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u);
    assert.ok(match?.[1]);
    return match[1].trim();
  });
  const [specReviewArtifact, codeReviewArtifact, securityReviewArtifact] = reviewArtifacts;
  assert.ok(specReviewArtifact);
  assert.ok(codeReviewArtifact);
  assert.ok(securityReviewArtifact);

  runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--allow-dirty',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specReviewArtifact,
      '--review-artifact',
      codeReviewArtifact,
      '--review-artifact',
      securityReviewArtifact,
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  const refreshEnvelope = parseEnvelope<{
    snapshot: {
      lifecycle: {
        intake: {
          review_policy: {
            required_audit_classes: string[];
            required_external_review_pending: boolean | null;
          };
        };
        stages: Record<
          string,
          {
            review_policy: {
              executed_audit_classes: string[];
            };
          }
        >;
      };
      metrics: {
        first_pass_close: boolean | null;
        rerounds_per_feature: number;
      };
    };
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
  const implementationStage = refreshEnvelope.data.snapshot.lifecycle.stages.implementation;
  assert.ok(implementationStage);

  assert.deepEqual(
    refreshEnvelope.data.snapshot.lifecycle.intake.review_policy.required_audit_classes,
    ['spec-conformance-reviewer'],
  );
  assert.equal(
    refreshEnvelope.data.snapshot.lifecycle.intake.review_policy.required_external_review_pending,
    true,
  );
  assert.deepEqual(implementationStage.review_policy.executed_audit_classes, [
    'spec-conformance-reviewer',
    'code-reviewer',
    'security-reviewer',
  ]);
  assert.equal(refreshEnvelope.data.snapshot.metrics.rerounds_per_feature, 0);
  assert.equal(refreshEnvelope.data.snapshot.metrics.first_pass_close, true);
});

test('implementation close-out allows the explicit non-code baseline with only spec-conformance review', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'implementation-non-code',
    deliveryState: 'implemented',
  });
  commitRepoState(repo, 'baseline');

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Implementation Non Code',
        '--backlog-item-key',
        'implementation-non-code',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'implementation-non-code.md',
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
  commitRepoState(repo, 'feature intake ready');

  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'non-code',
    ],
    {
      cwd: repo,
    },
  );

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'implementation',
  });
  const specReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'non-code-reviewer',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-non-code',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-non-code' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(specReview);

  runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specReview,
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  const stepArtifact = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'steps', intakeEnvelope.data.feature_id, 'implementation.json'),
      'utf8',
    ),
  ) as {
    implementation_review_scope: string | null;
    process_complete: boolean;
    required_audit_classes: string[];
    required_security_review: boolean;
  };
  assert.equal(stepArtifact.process_complete, true);
  assert.equal(stepArtifact.implementation_review_scope, 'non-code');
  assert.deepEqual(stepArtifact.required_audit_classes, ['spec-conformance-reviewer']);
  assert.equal(stepArtifact.required_security_review, false);
});

test('lifecycle-refresh counts same-audit rerounds from structured review round numbers', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'implementation-reround-metrics',
    deliveryState: 'implemented',
  });
  commitRepoState(repo, 'baseline');

  const intakeEnvelope = parseEnvelope<{
    dossier: string;
    feature_cycle_id: string;
    feature_id: string;
  }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Implementation Reround Metrics',
        '--backlog-item-key',
        'implementation-reround-metrics',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'implementation-reround-metrics.md',
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
  commitRepoState(repo, 'feature intake ready');

  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'non-code',
    ],
    { cwd: repo },
  );

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'implementation',
  });

  const failedReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'FAIL',
      '--must-fix',
      'Add reround evidence.',
      '--reviewer',
      'spec-reviewer',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-reround-fail',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-reround-fail' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  const passingReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'spec-reviewer',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-reround-pass',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-reround-pass' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(failedReview);
  assert.ok(passingReview);

  runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      passingReview,
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  const refreshEnvelope = parseEnvelope<{
    snapshot: {
      metrics: {
        first_pass_close: boolean | null;
        rerounds_per_feature: number;
      };
    };
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

  assert.equal(refreshEnvelope.data.snapshot.metrics.rerounds_per_feature, 1);
  assert.equal(refreshEnvelope.data.snapshot.metrics.first_pass_close, false);
});

test('review-artifact records null reviewer_thread_id when runtime provenance is unavailable', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'No Thread Provenance',
        '--backlog-item-key',
        'no-thread-provenance',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'no-thread-provenance.md',
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
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-no-thread',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: '' } },
  );

  assert.equal(result.code, 0);
  const reviewArtifactPath = result.stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(reviewArtifactPath);
  const reviewArtifact = JSON.parse(
    await readFile(path.join(repo, reviewArtifactPath), 'utf8'),
  ) as { reviewer_thread_id: string | null };
  assert.equal(reviewArtifact.reviewer_thread_id, null);
});

test('implementation non-code close-out ignores tampered stage-log scope and uses machine stage state', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'machine-stage-state-scope',
    deliveryState: 'implemented',
  });
  commitRepoState(repo, 'baseline');

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Machine Stage State Scope',
        '--backlog-item-key',
        'machine-stage-state-scope',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'machine-stage-state-scope.md',
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
  commitRepoState(repo, 'feature intake ready');

  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  const readyEnvelope = parseEnvelope<{ log_path: string }>(
    runCli(
      [
        'implementation',
        '--feature-id',
        intakeEnvelope.data.feature_id,
        '--ready-for-close',
        '--implementation-scope',
        'non-code',
        '--json',
      ],
      { cwd: repo },
    ).stdout,
  );

  const implementationLogPath = path.join(repo, readyEnvelope.data.log_path);
  const tamperedLog = (await readFile(implementationLogPath, 'utf8')).replace(
    'implementation_review_scope: non-code',
    'implementation_review_scope: code-bearing',
  );
  await writeFile(implementationLogPath, tamperedLog);

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'implementation',
  });

  const specReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'machine-state-reviewer',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-machine-state',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-machine-state' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(specReview);

  runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specReview,
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  const reviewArtifact = JSON.parse(await readFile(path.join(repo, specReview), 'utf8')) as {
    implementation_scope: string | null;
  };
  assert.equal(reviewArtifact.implementation_scope, 'non-code');

  const stepArtifact = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'steps', intakeEnvelope.data.feature_id, 'implementation.json'),
      'utf8',
    ),
  ) as {
    implementation_review_scope: string | null;
    process_complete: boolean;
    required_audit_classes: string[];
  };
  assert.equal(stepArtifact.process_complete, true);
  assert.equal(stepArtifact.implementation_review_scope, 'non-code');
  assert.deepEqual(stepArtifact.required_audit_classes, ['spec-conformance-reviewer']);
});

test('dirty code forces implementation close-out back to code-bearing scope even with --allow-dirty', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);
  await seedBacklogItem({
    repo,
    itemKey: 'dirty-code-reclassifies-scope',
    deliveryState: 'implemented',
  });
  commitRepoState(repo, 'baseline');

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Dirty Code Reclassifies Scope',
        '--backlog-item-key',
        'dirty-code-reclassifies-scope',
        '--backlog-delivery-state',
        'planned',
        '--backlog-source',
        'dirty-code-reclassifies-scope.md',
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
  commitRepoState(repo, 'feature intake ready');

  runCli(['implementation', '--feature-id', intakeEnvelope.data.feature_id], { cwd: repo });
  runCli(
    [
      'implementation',
      '--feature-id',
      intakeEnvelope.data.feature_id,
      '--ready-for-close',
      '--implementation-scope',
      'non-code',
    ],
    { cwd: repo },
  );

  await mkdir(path.join(repo, 'src'), { recursive: true });
  await writeFile(path.join(repo, 'src', 'runtime.ts'), 'export const runtime = true;\n');

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'implementation.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'implementation',
  });
  const specReview = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'dirty-code-reviewer',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-dirty-code',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-dirty-code' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(specReview);

  const result = runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'implementation',
      '--allow-dirty',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      specReview,
    ],
    { cwd: repo, allowFailure: true, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  assert.equal(result.code, 3);
  const payload = JSON.parse(result.stderr) as {
    error: { blockers: string[]; code: string; step_artifact: string };
  };
  assert.equal(payload.error.code, 'UDE_CLOSURE_BLOCKED');
  assert.ok(
    payload.error.blockers.some((blocker) =>
      blocker.includes('Missing required review artifact for audit class code-reviewer.'),
    ),
  );

  const stepArtifact = JSON.parse(
    await readFile(path.join(repo, payload.error.step_artifact), 'utf8'),
  ) as {
    implementation_review_scope: string | null;
    process_complete: boolean;
    required_audit_classes: string[];
    required_external_review_pending: boolean;
    required_security_review: boolean;
  };
  assert.equal(stepArtifact.process_complete, false);
  assert.equal(stepArtifact.implementation_review_scope, 'code-bearing');
  assert.deepEqual(stepArtifact.required_audit_classes, [
    'spec-conformance-reviewer',
    'code-reviewer',
    'security-reviewer',
  ]);
  assert.equal(stepArtifact.required_security_review, true);
  assert.equal(stepArtifact.required_external_review_pending, true);
});

test('process-trust close-out accepts review artifacts without reviewer_thread_id', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Process Trust Review Pending',
        '--backlog-item-key',
        'process-trust-review-pending',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'process-trust-review-pending.md',
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
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
  });

  const reviewArtifactPath = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-process-trust',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: '' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(reviewArtifactPath);

  runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      reviewArtifactPath,
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  const stepArtifact = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'steps', intakeEnvelope.data.feature_id, 'feature-intake.json'),
      'utf8',
    ),
  ) as {
    process_complete: boolean;
    required_external_review_pending: boolean;
  };
  assert.equal(stepArtifact.process_complete, true);
  assert.equal(stepArtifact.required_external_review_pending, false);
});

test('allow-dirty does not bypass audit freshness invalidation for uncommitted changes', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);
  commitRepoState(repo, 'baseline');

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Allow Dirty Still Invalidates Audits',
        '--backlog-item-key',
        'allow-dirty-still-invalidates-audits',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'allow-dirty-still-invalidates-audits.md',
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
  commitRepoState(repo, 'feature intake ready');

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'feature-intake.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
    eventCommit: runGit(repo, ['rev-parse', 'HEAD']).trim(),
  });

  const reviewArtifactPath = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-allow-dirty',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-allow-dirty' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(reviewArtifactPath);

  const backlogStatePath = path.join(repo, '.dossier', 'backlog', 'state.json');
  const backlogState = JSON.parse(await readFile(backlogStatePath, 'utf8')) as {
    last_refresh_at: string | null;
  };
  backlogState.last_refresh_at = '2026-04-22T12:00:00.000Z';
  await writeFile(backlogStatePath, `${JSON.stringify(backlogState, null, 2)}\n`);

  const result = runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--allow-dirty',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      reviewArtifactPath,
    ],
    { cwd: repo, allowFailure: true, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  assert.equal(result.code, 3);
  const payload = JSON.parse(result.stderr) as {
    error: { blockers: string[]; code: string; step_artifact: string };
  };
  assert.equal(payload.error.code, 'UDE_CLOSURE_BLOCKED');
  assert.ok(
    payload.error.blockers.some((blocker) =>
      blocker.includes('Required audits are stale against uncommitted material changes:'),
    ),
  );

  const stepArtifact = JSON.parse(
    await readFile(path.join(repo, payload.error.step_artifact), 'utf8'),
  ) as {
    process_complete: boolean;
    required_external_review_pending: boolean;
    review_freshness: string;
  };
  assert.equal(stepArtifact.process_complete, false);
  assert.equal(stepArtifact.required_external_review_pending, true);
  assert.equal(stepArtifact.review_freshness, 'stale');
});

test('allow-dirty still permits helper-owned backlog support files that are freshness-exempt', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);
  commitRepoState(repo, 'baseline');

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Helper-Owned Backlog Support Files Stay Exempt',
        '--backlog-item-key',
        'helper-owned-backlog-support-files-stay-exempt',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'helper-owned-backlog-support-files-stay-exempt.md',
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
  commitRepoState(repo, 'feature intake ready');

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'feature-intake.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
    eventCommit: runGit(repo, ['rev-parse', 'HEAD']).trim(),
  });

  const reviewArtifactPath = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-helper-support-files',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-helper-support-files' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(reviewArtifactPath);

  await writeFile(path.join(repo, '.dossier', 'backlog', '.gitignore'), 'mutation.lock\n');
  await writeFile(path.join(repo, '.dossier', 'backlog', 'AGENTS.md'), 'helper-owned guidance\n');
  await mkdir(path.join(repo, '.dossier', 'backlog', 'reports'), { recursive: true });
  await writeFile(
    path.join(repo, '.dossier', 'backlog', 'reports', 'backlog-report.md'),
    '# report\n',
  );
  await writeFile(path.join(repo, '.dossier', 'backlog', 'mutation.lock'), 'locked\n');

  runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--allow-dirty',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      reviewArtifactPath,
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  const stepArtifact = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'steps', intakeEnvelope.data.feature_id, 'feature-intake.json'),
      'utf8',
    ),
  ) as {
    process_complete: boolean;
    required_external_review_pending: boolean;
    review_freshness: string;
  };
  assert.equal(stepArtifact.process_complete, true);
  assert.equal(stepArtifact.required_external_review_pending, false);
  assert.equal(stepArtifact.review_freshness, 'pass');
});

test('review-artifact uses unique output paths for repeated same-commit same-class writes', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Unique Review Artifact Paths',
        '--backlog-item-key',
        'unique-review-artifact-paths',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'unique-review-artifact-paths.md',
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
  commitRepoState(repo, 'feature intake ready');

  const first = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-1',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-unique-1' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  const second = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-2',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-unique-2' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];

  assert.ok(first);
  assert.ok(second);
  assert.notEqual(first, second);
});

test('review-artifact preserves immutable same-class FAIL and PASS attempts with latest compatibility copy', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Immutable Review Attempts',
        '--backlog-item-key',
        'immutable-review-attempts',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'immutable-review-attempts.md',
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
  const eventCommit = commitRepoState(repo, 'feature intake ready');

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'feature-intake.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
    eventCommit,
  });

  const failArtifactPath = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'FAIL',
      '--must-fix',
      'Clarify immutable evidence handling.',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-immutable-fail',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-immutable-fail' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  const passArtifactPath = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-immutable-pass',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-immutable-pass' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];

  assert.ok(failArtifactPath);
  assert.ok(passArtifactPath);
  assert.notEqual(failArtifactPath, passArtifactPath);

  const failArtifact = JSON.parse(await readFile(path.join(repo, failArtifactPath), 'utf8')) as {
    artifact_role: string;
    findings: { must_fix: string[] };
    latest_copy_path: string;
    review_attempt_id: string;
    review_round_id: string;
    review_round_number: number;
    verdict: string;
  };
  const passArtifact = JSON.parse(await readFile(path.join(repo, passArtifactPath), 'utf8')) as {
    artifact_role: string;
    audit_class: string;
    event_commit: string | null;
    feature_id: string;
    findings: { must_fix: string[] };
    latest_copy_path: string;
    review_attempt_id: string;
    review_round_id: string;
    review_round_number: number;
    reviewer: string;
    reviewer_agent_id: string;
    reviewer_skill: string;
    step: string;
    verdict: string;
  };

  assert.equal(failArtifact.artifact_role, 'immutable_attempt');
  assert.equal(failArtifact.review_round_id, 'r01');
  assert.equal(failArtifact.review_round_number, 1);
  assert.equal(failArtifact.verdict, 'FAIL');
  assert.deepEqual(failArtifact.findings.must_fix, ['Clarify immutable evidence handling.']);
  assert.equal(passArtifact.artifact_role, 'immutable_attempt');
  assert.equal(passArtifact.review_round_id, 'r02');
  assert.equal(passArtifact.review_round_number, 2);
  assert.equal(passArtifact.verdict, 'PASS');

  const latestCopy = JSON.parse(
    await readFile(path.join(repo, passArtifact.latest_copy_path), 'utf8'),
  ) as {
    artifact_role: string;
    audit_class: string;
    feature_id: string;
    findings: { must_fix: string[] };
    immutable_artifact_path: string;
    reviewer: string;
    reviewer_agent_id: string;
    reviewer_skill: string;
    step: string;
    verdict: string;
  };
  assert.equal(latestCopy.artifact_role, 'latest_copy');
  assert.equal(latestCopy.immutable_artifact_path, passArtifactPath);
  assert.equal(latestCopy.audit_class, 'spec-conformance-reviewer');
  assert.equal(latestCopy.verdict, 'PASS');
  assert.deepEqual(latestCopy.findings.must_fix, []);
  assert.equal(latestCopy.reviewer, 'external-spec-review');
  assert.equal(latestCopy.reviewer_skill, 'spec-conformance-reviewer');
  assert.equal(latestCopy.reviewer_agent_id, 'audit-agent-immutable-pass');
  assert.equal(latestCopy.feature_id, intakeEnvelope.data.feature_id);
  assert.equal(latestCopy.step, 'feature-intake');

  const legacyLatestCopy = JSON.parse(
    await readFile(
      path.join(
        repo,
        '.dossier',
        'reviews',
        intakeEnvelope.data.feature_id,
        'feature-intake-spec-conformance-review.json',
      ),
      'utf8',
    ),
  ) as { artifact_role: string; immutable_artifact_path: string; verdict: string };
  assert.equal(legacyLatestCopy.artifact_role, 'latest_copy');
  assert.equal(legacyLatestCopy.immutable_artifact_path, passArtifactPath);
  assert.equal(legacyLatestCopy.verdict, 'PASS');

  const stageState = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'stages', intakeEnvelope.data.feature_id, 'feature-intake.json'),
      'utf8',
    ),
  ) as {
    review_artifacts: string[];
    review_events: Array<{
      artifact_path: string;
      latest_copy_path: string | null;
      review_attempt_id: string;
      review_round_id: string;
      review_round_number: number;
      verdict: string;
    }>;
  };
  assert.deepEqual(stageState.review_artifacts, [failArtifactPath, passArtifactPath]);
  assert.equal(stageState.review_events.length, 2);
  assert.deepEqual(
    stageState.review_events.map((event) => ({
      artifact_path: event.artifact_path,
      latest_copy_path: event.latest_copy_path,
      review_attempt_id: event.review_attempt_id,
      review_round_id: event.review_round_id,
      review_round_number: event.review_round_number,
      verdict: event.verdict,
    })),
    [
      {
        artifact_path: failArtifactPath,
        latest_copy_path: failArtifact.latest_copy_path,
        review_attempt_id: failArtifact.review_attempt_id,
        review_round_id: 'r01',
        review_round_number: 1,
        verdict: 'FAIL',
      },
      {
        artifact_path: passArtifactPath,
        latest_copy_path: passArtifact.latest_copy_path,
        review_attempt_id: passArtifact.review_attempt_id,
        review_round_id: 'r02',
        review_round_number: 2,
        verdict: 'PASS',
      },
    ],
  );

  runCli(
    [
      'dossier-step-close',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--verify-artifact',
      verifyArtifact,
      '--review-artifact',
      passArtifact.latest_copy_path,
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  const stepArtifact = JSON.parse(
    await readFile(
      path.join(repo, '.dossier', 'steps', intakeEnvelope.data.feature_id, 'feature-intake.json'),
      'utf8',
    ),
  ) as {
    process_complete: boolean;
    review_artifacts: string[];
  };
  assert.equal(stepArtifact.process_complete, true);
  assert.deepEqual(stepArtifact.review_artifacts, [passArtifactPath]);
});

test('dossier-step-close rejects latest review copies that do not resolve to immutable attempts', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);
  initializeGitRepo(repo);

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Broken Latest Review Copy',
        '--backlog-item-key',
        'broken-latest-review-copy',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'broken-latest-review-copy.md',
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
  const eventCommit = commitRepoState(repo, 'feature intake ready');

  const verifyArtifact = path.join(
    repo,
    '.dossier',
    'verification',
    intakeEnvelope.data.feature_id,
    'feature-intake.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
    eventCommit,
  });

  const passArtifactPath = runCli(
    [
      'review-artifact',
      '--dossier',
      intakeEnvelope.data.dossier,
      '--step',
      'feature-intake',
      '--audit-class',
      'spec-conformance-reviewer',
      '--verdict',
      'PASS',
      '--reviewer',
      'external-spec-review',
      '--reviewer-skill',
      'spec-conformance-reviewer',
      '--reviewer-agent-id',
      'audit-agent-broken-latest',
    ],
    { cwd: repo, env: { CODEX_THREAD_ID: 'review-thread-broken-latest' } },
  ).stdout.match(/\[review-artifact\] Wrote ([^\n]+)/u)?.[1];
  assert.ok(passArtifactPath);

  const passArtifact = JSON.parse(await readFile(path.join(repo, passArtifactPath), 'utf8')) as {
    latest_copy_path: string;
  };
  const latestCopyPath = path.join(repo, passArtifact.latest_copy_path);
  const latestCopy = JSON.parse(await readFile(latestCopyPath, 'utf8')) as Record<string, unknown>;
  latestCopy.immutable_artifact_path = passArtifact.latest_copy_path;
  await writeFile(latestCopyPath, `${JSON.stringify(latestCopy, null, 2)}\n`);

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
      passArtifact.latest_copy_path,
    ],
    { cwd: repo, allowFailure: true, env: { CODEX_THREAD_ID: 'author-thread-default' } },
  );

  assert.equal(result.code, 3);
  const payload = JSON.parse(result.stderr) as { error: { blockers: string[]; code: string } };
  assert.equal(payload.error.code, 'UDE_CLOSURE_BLOCKED');
  assert.ok(
    payload.error.blockers.some((blocker) =>
      blocker.includes('does not resolve to a managed immutable attempt artifact'),
    ),
  );
});

test('dossier-step-close rejects invalidated required audits', async () => {
  const repo = await makeTempRepoPath();
  await initializeRepo(repo);

  const intakeEnvelope = parseEnvelope<{ dossier: string; feature_id: string }>(
    runCli(
      [
        'feature-intake',
        '--title',
        'Invalidated Audit',
        '--backlog-item-key',
        'invalidated-audit',
        '--backlog-delivery-state',
        'defined',
        '--backlog-source',
        'invalidated-audit.md',
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
    'feature-intake--spec.json',
  );
  await writeVerifyArtifactFile({
    path: verifyArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
  });
  await writeReviewArtifactFile({
    path: reviewArtifact,
    featureId: intakeEnvelope.data.feature_id,
    step: 'feature-intake',
    invalidated: true,
  });

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
    error: { blockers: string[]; code: string };
  };
  assert.equal(payload.error.code, 'UDE_CLOSURE_BLOCKED');
  assert.ok(payload.error.blockers.some((blocker) => blocker.includes('marked invalidated')));
});
