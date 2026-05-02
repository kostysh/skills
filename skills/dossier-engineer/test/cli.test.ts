import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const cli = path.resolve('scripts/dossier-engineer.mjs');

const run = (args: readonly string[], cwd: string) =>
  spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
  });

const tempProject = async () => mkdtemp(path.join(os.tmpdir(), 'dossier-engineer-'));

const replaceArtifactBody = async (absolutePath: string, body: string) => {
  const current = await readFile(absolutePath, 'utf8');
  await writeFile(
    absolutePath,
    current.replace(/^(---\n[\s\S]*?\n---\n)[\s\S]*$/m, `$1${body}`),
    'utf8',
  );
};

const completeCapabilityWorkBody = async (root: string, workId: string, title: string) => {
  await replaceArtifactBody(
    path.join(root, 'docs/dossier/work-items', `${workId}.md`),
    [
      `# ${title}`,
      '',
      '## Summary',
      '',
      'This work delivers the operator-visible lock-safe queue behavior described by the concept source.',
      '',
      '## Capability relation',
      '',
      'The work introduces the linked capability and keeps support-only implementation details out of the claim.',
      '',
      '## Source interpretation',
      '',
      'The concept source requires observable runtime behavior, not just metadata or generated reports.',
      '',
      '## Scope',
      '',
      'In scope is the runtime behavior for the named command path. Out of scope is a new artifact family.',
      '',
      '## Spec Compact',
      '',
      '### Behavior statement',
      '',
      'When the operator runs the command, the runtime reports the next safe action and preserves dossier truth.',
      '',
      '### Acceptance criteria matrix',
      '',
      '| AC | Expected behavior | Source |',
      '| --- | --- | --- |',
      '| AC-1 | Queue reports actionable stage readiness without claiming implementation readiness. | concept |',
      '',
      '### Negative acceptance / falsifiers',
      '',
      '- FALSIFIER-1: A feature-intake item must not be labelled implementation-ready.',
      '',
      '### Anti-claims and non-goals',
      '',
      '- This work does not add a database or a new mandatory dossier artifact family.',
      '',
      '### Open questions and gaps',
      '',
      '- No open product questions remain for this implementation slice.',
      '',
      '## Plan Slice',
      '',
      '### Implementation target',
      '',
      'Update the existing runtime command handlers so the operator sees truthful protocol state.',
      '',
      '### Integration path',
      '',
      '- Actor entrypoint: scripts/dossier-engineer.mjs command execution.',
      '- Runtime path: CLI parse -> runCommand -> stage and queue handlers.',
      '- Production components touched: skills/dossier-engineer/src/app.ts command handlers.',
      '- UI/API/agent path: operator CLI invocation through the bundled runtime.',
      '- State/effect path: work item frontmatter and verification records update under docs/dossier.',
      '- Continuity path: later next, queue, lint, and hygiene commands read the same dossier state.',
      '- What would prove this is integrated: the bundled runtime command observes and mutates the dossier through the documented command path.',
      '- What would prove this is only substrate: helper-only or mock-only tests pass while bundled runtime commands cannot show the behavior.',
      '',
      '### Files, interfaces, and components',
      '',
      '- skills/dossier-engineer/src/app.ts command handlers',
      '- skills/dossier-engineer/test/cli.test.ts runtime acceptance tests',
      '',
      '### Sequence',
      '',
      '1. Update runtime handlers.',
      '2. Record review evidence.',
      '3. Close stages only after gates pass.',
      '',
      '### AC to evidence matrix',
      '',
      '| AC | Observable behavior | Implementation surface | Evidence method | Falsifier |',
      '| --- | --- | --- | --- | --- |',
      '| AC-1 | Queue reports actionable stage readiness without claiming implementation readiness. | stage and queue handlers | CLI runtime acceptance test and review artifact | Passing helper-only evidence without CLI output would prove substrate-only work. |',
      '',
      '### Risks and fallback/change-proposal triggers',
      '',
      '- Change-proposal trigger: if the production entrypoint changes, open a change-proposal before implementation closure.',
      '',
      '## Acceptance criteria notes',
      '',
      'The frontmatter acceptance records mirror the matrix above.',
      '',
      '## Demonstration notes',
      '',
      'The demo exercises the CLI path instead of an internal helper only.',
      '',
      '## Anti-claims notes',
      '',
      'The anti-claim prevents treating substrate as capability completion.',
      '',
      '## Pre-implementation challenge',
      '',
      'The plan could fail if queue wording changes without changing stage state semantics.',
      '',
      '## Dependencies and blockers',
      '',
      'No unresolved dependencies or blockers remain.',
      '',
      '## Implementation notes',
      '',
      'Implementation touches the existing runtime handlers only.',
      '',
      '## Verification notes',
      '',
      'Runtime tests prove the command behavior.',
      '',
      '## Review notes',
      '',
      'Concept review is recorded before plan-slice close.',
      '',
      '## Closure notes',
      '',
      'Implementation closure is not terminal until hygiene passes.',
      '',
      '## Process notes',
      '',
      'Body content is intentionally written in the operator working language for semantic sections.',
      '',
    ].join('\n'),
  );
};

const createBasicWork = async (root: string) => {
  await writeFile(path.join(root, 'concept.md'), '# Concept\n\nObservable thing.\n', 'utf8');
  assert.equal(run(['init', '--root', root, '--project-name', 'Lock Test'], root).status, 0);

  const source = run(
    [
      'source',
      'add',
      '--root',
      root,
      '--path',
      'concept.md',
      '--kind',
      'concept',
      '--authority',
      'canonical',
      '--title',
      'Product concept',
      '--format',
      'yaml',
    ],
    root,
  );
  assert.equal(source.status, 0, source.stdout + source.stderr);
  const sourceId = /id: (SRC-[^\n]+)/.exec(source.stdout)?.[1];
  assert.ok(sourceId);

  const capability = run(
    [
      'capability',
      'create',
      '--root',
      root,
      '--title',
      'Lock capability',
      '--status',
      'intended',
      '--source',
      sourceId,
      '--format',
      'yaml',
    ],
    root,
  );
  assert.equal(capability.status, 0, capability.stdout + capability.stderr);
  const capabilityId = /id: (CAP-[^\n]+)/.exec(capability.stdout)?.[1];
  assert.ok(capabilityId);

  const work = run(
    [
      'work',
      'create',
      '--root',
      root,
      '--title',
      'Implement lock capability',
      '--type',
      'feature',
      '--delivery',
      'capability',
      '--capability',
      capabilityId,
      '--relation',
      'introduces',
      '--source',
      sourceId,
      '--area',
      'core',
      '--owner',
      'agent',
      '--format',
      'yaml',
    ],
    root,
  );
  assert.equal(work.status, 0, work.stdout + work.stderr);
  const workId = /id: (WI-[^\n]+)/.exec(work.stdout)?.[1];
  assert.ok(workId);
  return { sourceId, capabilityId, workId };
};

const reviewPacketHashFromOutput = (stdout: string): string => {
  const hash = /packet_hash: (sha256:[a-f0-9]{64})/.exec(stdout)?.[1];
  assert.ok(hash, stdout);
  return hash;
};

const recordEligibleReview = async (
  root: string,
  workId: string,
  stage: string,
  reviewClass: string,
  overrides: readonly string[] = [],
) => {
  const packet = run(
    [
      'review',
      'packet',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      stage,
      '--class',
      reviewClass,
    ],
    root,
  );
  assert.equal(packet.status, 0, packet.stdout + packet.stderr);
  const packetHash = reviewPacketHashFromOutput(packet.stdout);
  const reportPath = `review-${stage}-${reviewClass}.md`;
  await writeFile(
    path.join(root, reportPath),
    [
      `# ${reviewClass}`,
      '',
      '## Verdict',
      '',
      'PASS',
      '',
      '## Findings',
      '',
      'No blocking findings for the reviewed bounded packet.',
      '',
      '## Rationale',
      '',
      'The review was performed from the packet and readonly repository context.',
      '',
    ].join('\n'),
    'utf8',
  );
  return run(
    [
      'review',
      'record',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      stage,
      '--class',
      reviewClass,
      '--verdict',
      'pass',
      '--reviewer',
      `${reviewClass}-agent`,
      '--reviewer-kind',
      'spawned-agent',
      '--reviewer-role',
      reviewClass,
      '--reviewer-id',
      `${reviewClass}-agent`,
      '--implementer-id',
      'implementer-agent',
      '--launch-mode',
      'spawned',
      '--launch-context',
      'fresh-session-no-fork',
      '--isolation-level',
      'bounded-packet',
      '--context-inheritance',
      'none',
      '--readonly',
      'true',
      '--packet-hash',
      packetHash,
      '--required-reason',
      'test required review',
      '--reviewer-model',
      'default',
      '--reviewer-reasoning-effort',
      'high',
      '--model-selection-policy',
      'required-review-risk-weighted',
      '--model-selection-reason',
      'test review risk',
      '--report',
      reportPath,
      ...overrides,
    ],
    root,
  );
};

const preparePlanSliceReviewWork = async (root: string) => {
  const { sourceId, capabilityId, workId } = await createBasicWork(root);
  for (const args of [
    [
      'work',
      'acceptance',
      'add',
      '--root',
      root,
      '--work',
      workId,
      '--kind',
      'behavior',
      '--text',
      'operator sees truthful queue state',
      '--source',
      `${sourceId}#behavior`,
    ],
    [
      'work',
      'demo',
      'set',
      '--root',
      root,
      '--work',
      workId,
      '--name',
      'demo',
      '--scenario',
      'operator runs queue and sees next action',
    ],
    [
      'work',
      'anti-claim',
      'add',
      '--root',
      root,
      '--work',
      workId,
      '--text',
      'does not claim implementation readiness',
    ],
  ] as const) {
    assert.equal(run(args, root).status, 0);
  }
  await completeCapabilityWorkBody(root, workId, 'Implement independent review gates');
  for (const stage of ['feature-intake', 'spec-compact'] as const) {
    assert.equal(
      run(
        ['stage', 'start', '--root', root, '--work', workId, '--stage', stage, '--session', 's'],
        root,
      ).status,
      0,
    );
    assert.equal(
      run(
        [
          'stage',
          'ready',
          '--root',
          root,
          '--work',
          workId,
          '--stage',
          stage,
          '--summary',
          'ready',
        ],
        root,
      ).status,
      0,
    );
    assert.equal(
      run(['stage', 'close', '--root', root, '--work', workId, '--stage', stage], root).status,
      0,
    );
  }
  assert.equal(
    run(
      [
        'work',
        'challenge',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--summary',
        'plan could become substrate only',
      ],
      root,
    ).status,
    0,
  );
  return { sourceId, capabilityId, workId };
};

void test('init creates markdown-only dossier project and directories', async () => {
  const root = await tempProject();
  const result = run(['init', '--root', root, '--project-name', 'Example'], root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const project = await readFile(path.join(root, 'docs/dossier/project.md'), 'utf8');
  assert.match(project, /artifact_type: dossier_project/);
  assert.match(project, /project_id: PRJ-\d{8}-example-[a-f0-9]{6}/);
  assert.doesNotMatch(project, /state\.json/);
  const gitignore = await readFile(path.join(root, '.gitignore'), 'utf8');
  assert.match(gitignore, /\.dossier-runtime\//);
});

void test('scaffold-generating commands remind agents to complete artifact bodies', async () => {
  const root = await tempProject();
  await writeFile(path.join(root, 'concept.md'), '# Concept\n\nObservable thing.\n', 'utf8');
  assert.equal(run(['init', '--root', root, '--project-name', 'Body Gate'], root).status, 0);

  const source = run(
    [
      'source',
      'add',
      '--root',
      root,
      '--path',
      'concept.md',
      '--kind',
      'concept',
      '--authority',
      'canonical',
      '--title',
      'Product concept',
    ],
    root,
  );

  assert.equal(source.status, 0, source.stdout + source.stderr);
  assert.match(source.stdout, /Next actions:/);
  assert.match(source.stdout, /edit body sections in docs\/dossier\/sources\/SRC-[^\n]+\.md/);
  assert.match(
    source.stdout,
    /Complete the human-readable body before stage close, handoff, PR preparation, or final response\./,
  );
});

void test('mutating commands fail fast when dossier write lock is held', async () => {
  const root = await tempProject();
  await writeFile(path.join(root, 'concept.md'), '# Concept\n\nObservable thing.\n', 'utf8');
  assert.equal(run(['init', '--root', root, '--project-name', 'Lock Held'], root).status, 0);

  const lockDir = path.join(root, '.dossier-runtime', 'write.lock');
  await mkdir(lockDir, { recursive: true });
  await writeFile(
    path.join(lockDir, 'holder.json'),
    JSON.stringify({
      pid: 12345,
      command: 'dossier-engineer source refresh --root .',
      acquired_at: '2026-05-02T00:00:00.000Z',
    }),
    'utf8',
  );

  const blocked = run(
    [
      'source',
      'add',
      '--root',
      root,
      '--path',
      'concept.md',
      '--kind',
      'concept',
      '--authority',
      'canonical',
      '--title',
      'Product concept',
    ],
    root,
  );

  assert.equal(blocked.status, 2, blocked.stdout + blocked.stderr);
  assert.match(blocked.stdout, /\.dossier-runtime\/write\.lock/);
  assert.match(blocked.stdout, /pid=12345/);
  assert.match(blocked.stdout, /fail-fast/);
  assert.match(blocked.stdout, /re-run the blocked command after the lock is released/);

  const readOnly = run(['status', '--root', root], root);
  assert.equal(readOnly.status, 0, readOnly.stdout + readOnly.stderr);
});

void test('queue reports actionable next work without claiming implementation readiness', async () => {
  const root = await tempProject();
  const { workId } = await createBasicWork(root);

  const queued = run(['queue', '--root', root], root);

  assert.equal(queued.status, 0, queued.stdout + queued.stderr);
  assert.match(queued.stdout, /Next actionable work: 1/);
  assert.doesNotMatch(queued.stdout, /Ready work items/);
  assert.match(
    queued.stdout,
    new RegExp(
      `${workId} \\| next_action=start_stage \\| stage=feature-intake \\| implementation_ready=false`,
    ),
  );
});

void test('next treats older implemented work with closed hygiene as terminal handoff complete', async () => {
  const root = await tempProject();
  const { workId } = await createBasicWork(root);
  const workPath = path.join(root, 'docs/dossier/work-items', `${workId}.md`);
  const current = await readFile(workPath, 'utf8');
  await writeFile(
    workPath,
    current
      .replace('lifecycle: defined', 'lifecycle: implemented')
      .replace(
        'post_close_hygiene:\n  implementation: not_started',
        'post_close_hygiene:\n  implementation: closed',
      ),
    'utf8',
  );

  const result = run(['next', '--root', root, '--work', workId], root);

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /terminal closed\/handoff-complete/);
  assert.doesNotMatch(result.stdout, /hygiene run/);
});

void test('spec-compact requires marked testable anti-claims to have negative or falsifier acceptance', async () => {
  const root = await tempProject();
  const { sourceId, workId } = await createBasicWork(root);
  assert.equal(
    run(
      [
        'work',
        'acceptance',
        'add',
        '--root',
        root,
        '--work',
        workId,
        '--kind',
        'behavior',
        '--text',
        'operator sees truthful queue state',
        '--source',
        `${sourceId}#behavior`,
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'work',
        'demo',
        'set',
        '--root',
        root,
        '--work',
        workId,
        '--name',
        'demo',
        '--scenario',
        'operator runs queue and sees next action',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'work',
        'anti-claim',
        'add',
        '--root',
        root,
        '--work',
        workId,
        '--text',
        'ordinary status output is not implementation-ready',
      ],
      root,
    ).status,
    0,
  );
  await completeCapabilityWorkBody(root, workId, 'Implement negative checks');
  const workPath = path.join(root, 'docs/dossier/work-items', `${workId}.md`);
  await writeFile(
    workPath,
    (await readFile(workPath, 'utf8')).replace(
      '- FALSIFIER-1: A feature-intake item must not be labelled implementation-ready.',
      '- Testable anti-claim: A feature-intake item must not be labelled implementation-ready.',
    ),
    'utf8',
  );
  assert.equal(
    run(
      [
        'stage',
        'start',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'feature-intake',
        '--session',
        'sess-test',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'stage',
        'ready',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'feature-intake',
        '--summary',
        'ready',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(['stage', 'close', '--root', root, '--work', workId, '--stage', 'feature-intake'], root)
      .status,
    0,
  );

  const blocked = run(
    [
      'stage',
      'ready',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'spec-compact',
      '--summary',
      'ready',
    ],
    root,
  );
  assert.equal(blocked.status, 2, blocked.stdout + blocked.stderr);
  assert.match(blocked.stdout, /testable anti-claims must be represented as negative or falsifier/);

  assert.equal(
    run(
      [
        'work',
        'acceptance',
        'add',
        '--root',
        root,
        '--work',
        workId,
        '--kind',
        'negative',
        '--text',
        'feature-intake work must not be labelled implementation-ready',
        '--source',
        `${sourceId}#negative`,
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'stage',
        'ready',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'spec-compact',
        '--summary',
        'ready',
      ],
      root,
    ).status,
    0,
  );
});

void test('spec and plan-slice close gates require material body contracts and plan-slice concept review', async () => {
  const root = await tempProject();
  const { sourceId, workId } = await createBasicWork(root);
  assert.equal(
    run(
      [
        'work',
        'acceptance',
        'add',
        '--root',
        root,
        '--work',
        workId,
        '--kind',
        'behavior',
        '--text',
        'operator sees truthful queue state',
        '--source',
        `${sourceId}#behavior`,
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'work',
        'demo',
        'set',
        '--root',
        root,
        '--work',
        workId,
        '--name',
        'demo',
        '--scenario',
        'operator runs queue and sees next action',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'work',
        'anti-claim',
        'add',
        '--root',
        root,
        '--work',
        workId,
        '--text',
        'does not claim implementation readiness',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'stage',
        'start',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'feature-intake',
        '--session',
        'sess-test',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'stage',
        'ready',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'feature-intake',
        '--summary',
        'ready',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(['stage', 'close', '--root', root, '--work', workId, '--stage', 'feature-intake'], root)
      .status,
    0,
  );

  const blockedSpec = run(
    [
      'stage',
      'ready',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'spec-compact',
      '--summary',
      'ready',
    ],
    root,
  );
  assert.equal(blockedSpec.status, 2, blockedSpec.stdout + blockedSpec.stderr);
  assert.match(
    blockedSpec.stdout,
    /Spec Compact body section is missing|Spec Compact \/ Behavior statement/,
  );

  await completeCapabilityWorkBody(root, workId, 'Implement lock capability');
  assert.equal(
    run(
      [
        'stage',
        'ready',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'spec-compact',
        '--summary',
        'ready',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(['stage', 'close', '--root', root, '--work', workId, '--stage', 'spec-compact'], root)
      .status,
    0,
  );
  assert.equal(
    run(
      [
        'work',
        'challenge',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--summary',
        'plan could become substrate only',
      ],
      root,
    ).status,
    0,
  );

  const blockedPlan = run(
    [
      'stage',
      'ready',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'plan-slice',
      '--summary',
      'ready',
    ],
    root,
  );
  assert.equal(blockedPlan.status, 2, blockedPlan.stdout + blockedPlan.stderr);
  assert.match(
    blockedPlan.stdout,
    /concept-conformance-reviewer review is required before plan-slice close/,
  );

  const required = run(
    ['review', 'required', '--root', root, '--work', workId, '--stage', 'plan-slice'],
    root,
  );
  assert.equal(required.status, 2, required.stdout + required.stderr);
  assert.match(
    required.stdout,
    /concept-conformance-reviewer: missing_or_stale for stage=plan-slice/,
  );
  assert.match(
    required.stdout,
    /review record --work .* --stage plan-slice --class concept-conformance-reviewer/,
  );

  assert.equal(
    (await recordEligibleReview(root, workId, 'plan-slice', 'concept-conformance-reviewer')).status,
    0,
  );
  const readyPlan = run(
    [
      'stage',
      'ready',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'plan-slice',
      '--summary',
      'ready',
    ],
    root,
  );
  assert.equal(readyPlan.status, 0, readyPlan.stdout + readyPlan.stderr);
});

void test('required review gates reject pass artifacts without independent provenance', async () => {
  const root = await tempProject();
  const { workId } = await preparePlanSliceReviewWork(root);

  assert.equal(
    run(
      [
        'review',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'plan-slice',
        '--class',
        'concept-conformance-reviewer',
        '--verdict',
        'pass',
        '--reviewer',
        'same-session-reviewer',
      ],
      root,
    ).status,
    0,
  );

  const required = run(
    ['review', 'required', '--root', root, '--work', workId, '--stage', 'plan-slice'],
    root,
  );
  assert.equal(required.status, 2, required.stdout + required.stderr);
  assert.match(required.stdout, /concept-conformance-reviewer: ineligible/);
  assert.match(required.stdout, /launch_mode must be spawned/);
  assert.match(required.stdout, /packet_hash must be a sha256 hash from review packet/);
  assert.match(required.stdout, /reviewer_id is required/);

  const blockedPlan = run(
    [
      'stage',
      'ready',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'plan-slice',
      '--summary',
      'ready',
    ],
    root,
  );
  assert.equal(blockedPlan.status, 2, blockedPlan.stdout + blockedPlan.stderr);
  assert.match(
    blockedPlan.stdout,
    /concept-conformance-reviewer review is required before plan-slice close/,
  );
});

void test('required review gates enforce reviewer separation and packet hash freshness', async () => {
  const sameAgentRoot = await tempProject();
  const { workId: sameAgentWork } = await preparePlanSliceReviewWork(sameAgentRoot);
  assert.equal(
    (
      await recordEligibleReview(
        sameAgentRoot,
        sameAgentWork,
        'plan-slice',
        'concept-conformance-reviewer',
        ['--implementer-id', 'concept-conformance-reviewer-agent'],
      )
    ).status,
    0,
  );
  const sameAgentRequired = run(
    [
      'review',
      'required',
      '--root',
      sameAgentRoot,
      '--work',
      sameAgentWork,
      '--stage',
      'plan-slice',
    ],
    sameAgentRoot,
  );
  assert.equal(sameAgentRequired.status, 2, sameAgentRequired.stdout + sameAgentRequired.stderr);
  assert.match(sameAgentRequired.stdout, /reviewer_id must differ from implementer_id/);

  const stalePacketRoot = await tempProject();
  const { workId: stalePacketWork } = await preparePlanSliceReviewWork(stalePacketRoot);
  assert.equal(
    (
      await recordEligibleReview(
        stalePacketRoot,
        stalePacketWork,
        'plan-slice',
        'concept-conformance-reviewer',
        ['--packet-hash', `sha256:${'0'.repeat(64)}`],
      )
    ).status,
    0,
  );
  const stalePacketRequired = run(
    [
      'review',
      'required',
      '--root',
      stalePacketRoot,
      '--work',
      stalePacketWork,
      '--stage',
      'plan-slice',
    ],
    stalePacketRoot,
  );
  assert.equal(
    stalePacketRequired.status,
    2,
    stalePacketRequired.stdout + stalePacketRequired.stderr,
  );
  assert.match(stalePacketRequired.stdout, /packet_hash does not match current review packet/);
});

void test('review packet contains bounded material context for the reviewer', async () => {
  const root = await tempProject();
  const { workId } = await preparePlanSliceReviewWork(root);
  const packet = run(
    [
      'review',
      'packet',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'plan-slice',
      '--class',
      'concept-conformance-reviewer',
    ],
    root,
  );
  assert.equal(packet.status, 0, packet.stdout + packet.stderr);
  assert.match(packet.stdout, /packet_hash: sha256:[a-f0-9]{64}/);
  assert.match(packet.stdout, /Source artifacts and excerpts/);
  assert.match(packet.stdout, /concept\.md/);
  assert.match(packet.stdout, /Acceptance criteria/);
  assert.match(packet.stdout, /Anti-claims/);
  assert.match(packet.stdout, /Demo artifacts/);
  assert.match(packet.stdout, /Spec Compact/);
  assert.match(packet.stdout, /Plan Slice/);
  assert.match(packet.stdout, /Integration path/);
  assert.match(packet.stdout, /AC evidence falsifier matrix/);
  assert.match(packet.stdout, /Implementation surface/);
  assert.match(packet.stdout, /material_scope_hash:/);
  assert.doesNotMatch(packet.stdout, /hidden scratchpad|chain of thought|conversation transcript/i);
});

void test('required review gates require preserved raw reviewer report', async () => {
  const root = await tempProject();
  const { workId } = await preparePlanSliceReviewWork(root);
  const packet = run(
    [
      'review',
      'packet',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'plan-slice',
      '--class',
      'concept-conformance-reviewer',
    ],
    root,
  );
  assert.equal(packet.status, 0, packet.stdout + packet.stderr);
  const packetHash = reviewPacketHashFromOutput(packet.stdout);
  assert.equal(
    run(
      [
        'review',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'plan-slice',
        '--class',
        'concept-conformance-reviewer',
        '--verdict',
        'pass',
        '--reviewer',
        'concept-conformance-reviewer-agent',
        '--reviewer-kind',
        'spawned-agent',
        '--reviewer-role',
        'concept-conformance-reviewer',
        '--reviewer-id',
        'concept-conformance-reviewer-agent',
        '--implementer-id',
        'implementer-agent',
        '--launch-mode',
        'spawned',
        '--launch-context',
        'fresh-session-no-fork',
        '--isolation-level',
        'bounded-packet',
        '--context-inheritance',
        'none',
        '--readonly',
        'true',
        '--packet-hash',
        packetHash,
        '--reviewer-model',
        'default',
        '--reviewer-reasoning-effort',
        'high',
        '--model-selection-policy',
        'required-review-risk-weighted',
        '--model-selection-reason',
        'test review risk',
        '--summary',
        'implementer-written summary is not a raw reviewer report',
      ],
      root,
    ).status,
    0,
  );
  const required = run(
    ['review', 'required', '--root', root, '--work', workId, '--stage', 'plan-slice'],
    root,
  );
  assert.equal(required.status, 2, required.stdout + required.stderr);
  assert.match(required.stdout, /raw_report_ref is required/);

  const outsideRoot = await mkdtemp(path.join(os.tmpdir(), 'dossier-review-outside-'));
  const outsideReport = path.join(outsideRoot, 'review.md');
  await writeFile(outsideReport, '# Review\n\n## Findings\n\nPASS from outside repo.\n', 'utf8');
  const outside = run(
    [
      'review',
      'record',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'plan-slice',
      '--class',
      'concept-conformance-reviewer',
      '--verdict',
      'pass',
      '--reviewer',
      'concept-conformance-reviewer-agent',
      '--report',
      outsideReport,
    ],
    root,
  );
  assert.equal(outside.status, 1, outside.stdout + outside.stderr);
  assert.match(outside.stderr + outside.stdout, /Review report path must be relative/);

  await writeFile(path.join(root, 'empty-review.md'), '   \n', 'utf8');
  const empty = run(
    [
      'review',
      'record',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'plan-slice',
      '--class',
      'concept-conformance-reviewer',
      '--verdict',
      'pass',
      '--reviewer',
      'concept-conformance-reviewer-agent',
      '--report',
      'empty-review.md',
    ],
    root,
  );
  assert.equal(empty.status, 1, empty.stdout + empty.stderr);
  assert.match(empty.stderr + empty.stdout, /must contain reviewer-authored findings/);
});

void test('failed and blocked reviews must preserve reviewer findings', async () => {
  const root = await tempProject();
  const { workId } = await preparePlanSliceReviewWork(root);
  const missingReport = run(
    [
      'review',
      'record',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'plan-slice',
      '--class',
      'concept-conformance-reviewer',
      '--verdict',
      'fail',
      '--reviewer',
      'concept-conformance-reviewer-agent',
    ],
    root,
  );
  assert.equal(missingReport.status, 1, missingReport.stdout + missingReport.stderr);
  assert.match(missingReport.stderr + missingReport.stdout, /fail review records require --report/);

  await writeFile(
    path.join(root, 'failed-review.md'),
    [
      '# Failed concept review',
      '',
      '## Findings',
      '',
      'Blocking issue remains in the reviewed plan.',
      '',
      '## Rationale',
      '',
      'The packet does not prove the claimed capability.',
      '',
    ].join('\n'),
    'utf8',
  );
  const failed = run(
    [
      'review',
      'record',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'plan-slice',
      '--class',
      'concept-conformance-reviewer',
      '--verdict',
      'fail',
      '--reviewer',
      'concept-conformance-reviewer-agent',
      '--report',
      'failed-review.md',
    ],
    root,
  );
  assert.equal(failed.status, 2, failed.stdout + failed.stderr);
  assert.equal(
    (await recordEligibleReview(root, workId, 'plan-slice', 'concept-conformance-reviewer')).status,
    0,
  );
  const reviewFiles = await readdir(path.join(root, 'docs/dossier/reviews', workId));
  const reviewBodies = await Promise.all(
    reviewFiles.map((file) =>
      readFile(path.join(root, 'docs/dossier/reviews', workId, file), 'utf8'),
    ),
  );
  assert.ok(reviewBodies.some((body) => /verdict: fail/.test(body)));
  assert.ok(reviewBodies.some((body) => /Blocking issue remains in the reviewed plan/.test(body)));
  assert.ok(reviewBodies.some((body) => /verdict: pass/.test(body)));
});

void test('implementation review gates reject fresh pass artifacts recorded for the wrong stage', async () => {
  const root = await tempProject();
  const { workId } = await preparePlanSliceReviewWork(root);
  const packet = run(
    [
      'review',
      'packet',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'implementation',
      '--class',
      'code-reviewer',
    ],
    root,
  );
  assert.equal(packet.status, 0, packet.stdout + packet.stderr);
  const packetHash = reviewPacketHashFromOutput(packet.stdout);
  await writeFile(
    path.join(root, 'wrong-stage-code-review.md'),
    '# Code review\n\n## Findings\n\nPASS for implementation packet but wrong recorded stage.\n',
    'utf8',
  );
  assert.equal(
    run(
      [
        'review',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'feature-intake',
        '--class',
        'code-reviewer',
        '--verdict',
        'pass',
        '--reviewer',
        'code-reviewer-agent',
        '--reviewer-kind',
        'spawned-agent',
        '--reviewer-role',
        'code-reviewer',
        '--reviewer-id',
        'code-reviewer-agent',
        '--implementer-id',
        'implementer-agent',
        '--launch-mode',
        'spawned',
        '--launch-context',
        'fresh-session-no-fork',
        '--isolation-level',
        'bounded-packet',
        '--context-inheritance',
        'none',
        '--readonly',
        'true',
        '--packet-hash',
        packetHash,
        '--reviewer-model',
        'default',
        '--reviewer-reasoning-effort',
        'high',
        '--model-selection-policy',
        'required-review-risk-weighted',
        '--model-selection-reason',
        'runtime code review',
        '--report',
        'wrong-stage-code-review.md',
      ],
      root,
    ).status,
    0,
  );
  const required = run(['review', 'required', '--root', root, '--work', workId], root);
  assert.equal(required.status, 2, required.stdout + required.stderr);
  assert.match(required.stdout, /code-reviewer: missing_or_stale/);
  assert.doesNotMatch(required.stdout, /code-reviewer: fresh/);
});

void test('required review gates reject low reasoning and require high reasoning for high-risk work', async () => {
  const lowRoot = await tempProject();
  const { workId: lowWork } = await preparePlanSliceReviewWork(lowRoot);
  assert.equal(
    (
      await recordEligibleReview(lowRoot, lowWork, 'plan-slice', 'concept-conformance-reviewer', [
        '--reviewer-reasoning-effort',
        'low',
      ])
    ).status,
    0,
  );
  const lowRequired = run(
    ['review', 'required', '--root', lowRoot, '--work', lowWork, '--stage', 'plan-slice'],
    lowRoot,
  );
  assert.equal(lowRequired.status, 2, lowRequired.stdout + lowRequired.stderr);
  assert.match(lowRequired.stdout, /low reasoning is not eligible/);

  const highRiskRoot = await tempProject();
  const { workId: highRiskWork } = await preparePlanSliceReviewWork(highRiskRoot);
  assert.equal(
    run(
      [
        'work',
        'risk',
        'set',
        '--root',
        highRiskRoot,
        '--work',
        highRiskWork,
        '--implementation',
        'runtime',
      ],
      highRiskRoot,
    ).status,
    0,
  );
  assert.equal(
    (
      await recordEligibleReview(
        highRiskRoot,
        highRiskWork,
        'implementation',
        'concept-conformance-reviewer',
        ['--reviewer-reasoning-effort', 'medium'],
      )
    ).status,
    0,
  );
  const highRiskRequired = run(
    ['review', 'required', '--root', highRiskRoot, '--work', highRiskWork],
    highRiskRoot,
  );
  assert.equal(highRiskRequired.status, 2, highRiskRequired.stdout + highRiskRequired.stderr);
  assert.match(highRiskRequired.stdout, /high-risk review requires high or xhigh reasoning/);

  const declaredRiskRoot = await tempProject();
  const { workId: declaredRiskWork } = await preparePlanSliceReviewWork(declaredRiskRoot);
  assert.equal(
    (
      await recordEligibleReview(
        declaredRiskRoot,
        declaredRiskWork,
        'plan-slice',
        'concept-conformance-reviewer',
        [
          '--reviewer-reasoning-effort',
          'medium',
          '--model-selection-reason',
          'runtime provenance work',
        ],
      )
    ).status,
    0,
  );
  const declaredRiskRequired = run(
    [
      'review',
      'required',
      '--root',
      declaredRiskRoot,
      '--work',
      declaredRiskWork,
      '--stage',
      'plan-slice',
    ],
    declaredRiskRoot,
  );
  assert.equal(
    declaredRiskRequired.status,
    2,
    declaredRiskRequired.stdout + declaredRiskRequired.stderr,
  );
  assert.match(declaredRiskRequired.stdout, /high-risk review requires high or xhigh reasoning/);

  const surfaceRiskRoot = await tempProject();
  const { workId: surfaceRiskWork } = await preparePlanSliceReviewWork(surfaceRiskRoot);
  assert.equal(
    (
      await recordEligibleReview(
        surfaceRiskRoot,
        surfaceRiskWork,
        'implementation',
        'code-reviewer',
        ['--reviewer-reasoning-effort', 'medium', '--model-selection-reason', 'small code review'],
      )
    ).status,
    0,
  );
  const surfaceRiskRequired = run(
    ['review', 'required', '--root', surfaceRiskRoot, '--work', surfaceRiskWork],
    surfaceRiskRoot,
  );
  assert.equal(
    surfaceRiskRequired.status,
    2,
    surfaceRiskRequired.stdout + surfaceRiskRequired.stderr,
  );
  assert.match(surfaceRiskRequired.stdout, /code-reviewer: ineligible/);
  assert.match(surfaceRiskRequired.stdout, /high-risk review requires high or xhigh reasoning/);
});

void test('security-sensitive risk requires security-reviewer gate', async () => {
  const root = await tempProject();
  const { workId } = await preparePlanSliceReviewWork(root);
  assert.equal(
    run(
      [
        'work',
        'risk',
        'set',
        '--root',
        root,
        '--work',
        workId,
        '--implementation',
        'code',
        '--policy',
        'security',
      ],
      root,
    ).status,
    0,
  );
  const required = run(['review', 'required', '--root', root, '--work', workId], root);
  assert.equal(required.status, 2, required.stdout + required.stderr);
  assert.match(required.stdout, /code-reviewer: missing_or_stale/);
  assert.match(required.stdout, /security-reviewer: missing_or_stale/);
});

void test('plan-slice blocks weak integration path and AC evidence matrix semantics', async () => {
  const root = await tempProject();
  const { sourceId, workId } = await createBasicWork(root);
  for (const args of [
    [
      'work',
      'acceptance',
      'add',
      '--root',
      root,
      '--work',
      workId,
      '--kind',
      'behavior',
      '--text',
      'operator sees truthful queue state',
      '--source',
      `${sourceId}#behavior`,
    ],
    [
      'work',
      'acceptance',
      'add',
      '--root',
      root,
      '--work',
      workId,
      '--kind',
      'falsifier',
      '--text',
      'helper-only evidence without CLI output proves substrate-only work',
      '--source',
      `${sourceId}#falsifier`,
    ],
    [
      'work',
      'demo',
      'set',
      '--root',
      root,
      '--work',
      workId,
      '--name',
      'demo',
      '--scenario',
      'operator runs queue and sees next action',
    ],
    [
      'work',
      'anti-claim',
      'add',
      '--root',
      root,
      '--work',
      workId,
      '--text',
      'does not claim implementation readiness',
    ],
  ] as const) {
    assert.equal(run(args, root).status, 0);
  }
  await completeCapabilityWorkBody(root, workId, 'Implement integration path');
  const workPath = path.join(root, 'docs/dossier/work-items', `${workId}.md`);
  await writeFile(
    workPath,
    (await readFile(workPath, 'utf8'))
      .replace('- What would prove this is only substrate:', '- Substrate-only note:')
      .replace('Implementation surface | Evidence method | Falsifier', 'Evidence'),
    'utf8',
  );
  for (const stage of ['feature-intake', 'spec-compact'] as const) {
    assert.equal(
      run(
        [
          'stage',
          'start',
          '--root',
          root,
          '--work',
          workId,
          '--stage',
          stage,
          '--session',
          'sess-test',
        ],
        root,
      ).status,
      0,
    );
    assert.equal(
      run(
        [
          'stage',
          'ready',
          '--root',
          root,
          '--work',
          workId,
          '--stage',
          stage,
          '--summary',
          'ready',
        ],
        root,
      ).status,
      0,
    );
    assert.equal(
      run(['stage', 'close', '--root', root, '--work', workId, '--stage', stage], root).status,
      0,
    );
  }
  assert.equal(
    run(
      [
        'work',
        'challenge',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--summary',
        'plan could become substrate only',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    (await recordEligibleReview(root, workId, 'plan-slice', 'concept-conformance-reviewer')).status,
    0,
  );

  const blocked = run(
    [
      'stage',
      'ready',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'plan-slice',
      '--summary',
      'ready',
    ],
    root,
  );
  assert.equal(blocked.status, 2, blocked.stdout + blocked.stderr);
  assert.match(blocked.stdout, /Integration path lacks What would prove this is only substrate/);
  assert.match(blocked.stdout, /AC to evidence matrix lacks implementation surface/);
});

void test('plan-slice review freshness uses normalized material sections', async () => {
  const root = await tempProject();
  const { sourceId, workId } = await createBasicWork(root);
  for (const args of [
    [
      'work',
      'acceptance',
      'add',
      '--root',
      root,
      '--work',
      workId,
      '--kind',
      'behavior',
      '--text',
      'operator sees truthful queue state',
      '--source',
      `${sourceId}#behavior`,
    ],
    [
      'work',
      'demo',
      'set',
      '--root',
      root,
      '--work',
      workId,
      '--name',
      'demo',
      '--scenario',
      'operator runs queue and sees next action',
    ],
    [
      'work',
      'anti-claim',
      'add',
      '--root',
      root,
      '--work',
      workId,
      '--text',
      'does not claim implementation readiness',
    ],
  ] as const) {
    assert.equal(run(args, root).status, 0);
  }
  await completeCapabilityWorkBody(root, workId, 'Implement normalized review freshness');
  for (const stage of ['feature-intake', 'spec-compact'] as const) {
    assert.equal(
      run(
        [
          'stage',
          'start',
          '--root',
          root,
          '--work',
          workId,
          '--stage',
          stage,
          '--session',
          'sess-test',
        ],
        root,
      ).status,
      0,
    );
    assert.equal(
      run(
        [
          'stage',
          'ready',
          '--root',
          root,
          '--work',
          workId,
          '--stage',
          stage,
          '--summary',
          'ready',
        ],
        root,
      ).status,
      0,
    );
    assert.equal(
      run(['stage', 'close', '--root', root, '--work', workId, '--stage', stage], root).status,
      0,
    );
  }
  assert.equal(
    run(
      [
        'work',
        'challenge',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--summary',
        'plan could become substrate only',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    (await recordEligibleReview(root, workId, 'plan-slice', 'concept-conformance-reviewer')).status,
    0,
  );
  const fresh = run(
    ['review', 'required', '--root', root, '--work', workId, '--stage', 'plan-slice'],
    root,
  );
  assert.equal(fresh.status, 0, fresh.stdout + fresh.stderr);
  assert.match(fresh.stdout, /concept-conformance-reviewer: fresh/);

  const workPath = path.join(root, 'docs/dossier/work-items', `${workId}.md`);
  await writeFile(
    workPath,
    `${await readFile(workPath, 'utf8')}\n\n## Editorial note\n\nWhitespace-only implementation note.\n`,
    'utf8',
  );
  const stillFresh = run(
    ['review', 'required', '--root', root, '--work', workId, '--stage', 'plan-slice'],
    root,
  );
  assert.equal(stillFresh.status, 0, stillFresh.stdout + stillFresh.stderr);

  await writeFile(
    workPath,
    (await readFile(workPath, 'utf8')).replace(
      '- Runtime path: CLI parse -> runCommand -> stage and queue handlers.',
      '- Runtime path: CLI parse -> alternate runtime path.',
    ),
    'utf8',
  );
  const stale = run(
    ['review', 'required', '--root', root, '--work', workId, '--stage', 'plan-slice'],
    root,
  );
  assert.equal(stale.status, 2, stale.stdout + stale.stderr);
  assert.match(stale.stdout, /concept-conformance-reviewer: missing_or_stale/);
});

void test('known mutating commands enter the write-lock envelope', async () => {
  const root = await tempProject();
  assert.equal(run(['init', '--root', root, '--project-name', 'Command Matrix'], root).status, 0);
  const lockDir = path.join(root, '.dossier-runtime', 'write.lock');
  await mkdir(lockDir, { recursive: true });
  await writeFile(
    path.join(lockDir, 'holder.json'),
    JSON.stringify({
      pid: 321,
      command: 'dossier-engineer stage close --root . --work WI-test --stage implementation',
      acquired_at: '2026-05-02T00:00:00.000Z',
    }),
    'utf8',
  );

  const commands: readonly (readonly string[])[] = [
    ['repair', 'frontmatter', '--root', root, '--path', 'missing.md', '--type', 'work_item'],
    [
      'source',
      'add',
      '--root',
      root,
      '--path',
      'concept.md',
      '--kind',
      'concept',
      '--authority',
      'canonical',
      '--title',
      'Concept',
    ],
    ['source', 'refresh', '--root', root],
    [
      'source',
      'review',
      'resolve',
      '--root',
      root,
      '--review',
      'SR-test',
      '--verdict',
      'no_backlog_change',
      '--summary',
      'done',
    ],
    [
      'capability',
      'create',
      '--root',
      root,
      '--title',
      'Capability',
      '--status',
      'intended',
      '--source',
      'SRC-test',
    ],
    [
      'capability',
      'claim',
      'set',
      '--root',
      root,
      '--capability',
      'CAP-test',
      '--actor',
      'actor',
      '--trigger',
      'trigger',
      '--behavior',
      'behavior',
      '--response',
      'response',
      '--state-change',
      'state',
      '--continuity',
      'continuity',
    ],
    [
      'capability',
      'anti-claim',
      'add',
      '--root',
      root,
      '--capability',
      'CAP-test',
      '--text',
      'not that',
    ],
    [
      'capability',
      'demo',
      'record',
      '--root',
      root,
      '--capability',
      'CAP-test',
      '--verdict',
      'pass',
      '--summary',
      'observed',
    ],
    [
      'baseline',
      'create',
      '--root',
      root,
      '--title',
      'Baseline',
      '--mode',
      'manual',
      '--source',
      'SRC-test',
    ],
    [
      'baseline',
      'capability',
      'add',
      '--root',
      root,
      '--baseline',
      'BASE-test',
      '--capability',
      'CAP-test',
      '--status',
      'observed',
    ],
    [
      'guardrail',
      'add',
      '--root',
      root,
      '--title',
      'Guardrail',
      '--condition',
      'condition',
      '--action',
      'action',
    ],
    ['guardrail', 'check', '--root', root, '--record'],
    ['guardrail', 'resolve', '--root', root, '--guardrail', 'KILL-test', '--summary', 'resolved'],
    [
      'work',
      'create',
      '--root',
      root,
      '--title',
      'Work',
      '--type',
      'feature',
      '--delivery',
      'capability',
      '--source',
      'SRC-test',
      '--area',
      'core',
      '--owner',
      'agent',
    ],
    [
      'work',
      'acceptance',
      'add',
      '--root',
      root,
      '--work',
      'WI-test',
      '--kind',
      'behavior',
      '--text',
      'works',
    ],
    [
      'work',
      'demo',
      'set',
      '--root',
      root,
      '--work',
      'WI-test',
      '--name',
      'demo',
      '--scenario',
      'scenario',
    ],
    ['work', 'anti-claim', 'add', '--root', root, '--work', 'WI-test', '--text', 'not that'],
    ['work', 'challenge', 'record', '--root', root, '--work', 'WI-test', '--summary', 'challenge'],
    ['work', 'support', 'explain', '--root', root, '--work', 'WI-test', '--reason', 'support'],
    ['work', 'dependency', 'add', '--root', root, '--work', 'WI-test', '--dependency', 'WI-other'],
    [
      'work',
      'dependency',
      'remove',
      '--root',
      root,
      '--work',
      'WI-test',
      '--dependency',
      'WI-other',
    ],
    ['work', 'blocker', 'add', '--root', root, '--work', 'WI-test', '--summary', 'blocked'],
    [
      'work',
      'blocker',
      'resolve',
      '--root',
      root,
      '--work',
      'WI-test',
      '--blocker',
      'BLK-test',
      '--summary',
      'resolved',
    ],
    ['work', 'risk', 'set', '--root', root, '--work', 'WI-test', '--risk', 'security'],
    ['work', 'retire', '--root', root, '--work', 'WI-test', '--reason', 'obsolete'],
    ['work', 'amend', '--root', root, '--work', 'WI-test', '--summary', 'change'],
    ['work', 'split', '--root', root, '--work', 'WI-test', '--title', 'Split', '--reason', 'split'],
    [
      'stage',
      'start',
      '--root',
      root,
      '--work',
      'WI-test',
      '--stage',
      'implementation',
      '--session',
      's',
    ],
    [
      'stage',
      'ready',
      '--root',
      root,
      '--work',
      'WI-test',
      '--stage',
      'implementation',
      '--summary',
      'ready',
    ],
    ['stage', 'close', '--root', root, '--work', 'WI-test', '--stage', 'implementation'],
    [
      'stage',
      'reopen',
      '--root',
      root,
      '--work',
      'WI-test',
      '--stage',
      'implementation',
      '--reason',
      'change',
    ],
    [
      'stage',
      'log',
      '--root',
      root,
      '--work',
      'WI-test',
      '--stage',
      'implementation',
      '--summary',
      'note',
    ],
    [
      'verify',
      'record',
      '--root',
      root,
      '--work',
      'WI-test',
      '--stage',
      'implementation',
      '--profile',
      'default',
      '--evidence-class',
      'manual',
      '--verdict',
      'pass',
      '--summary',
      'ok',
    ],
    [
      'review',
      'record',
      '--root',
      root,
      '--work',
      'WI-test',
      '--stage',
      'implementation',
      '--class',
      'code-reviewer',
      '--verdict',
      'pass',
      '--reviewer',
      'reviewer',
    ],
    ['hygiene', 'run', '--root', root, '--work', 'WI-test', '--stage', 'implementation'],
    ['changeset', 'create', '--root', root, '--scope', 'current-branch', '--summary', 'summary'],
    ['report', 'create', '--root', root, '--kind', 'status', '--scope', 'repository'],
    ['retro', 'create', '--root', root, '--since', '2026-05-01', '--until', '2026-05-02'],
  ];

  for (const args of commands) {
    const blocked = run(args, root);
    assert.equal(blocked.status, 2, `${args.join(' ')}\n${blocked.stdout}${blocked.stderr}`);
    assert.match(blocked.stdout, /Dossier write lock is held/, args.join(' '));
  }
});

void test('mutation errors release the dossier write lock', async () => {
  const root = await tempProject();
  assert.equal(run(['init', '--root', root, '--project-name', 'Release Lock'], root).status, 0);

  const failed = run(['source', 'add', '--root', root], root);

  assert.equal(failed.status, 1, failed.stdout + failed.stderr);
  await assert.rejects(stat(path.join(root, '.dossier-runtime', 'write.lock')));
});

void test('verify run executes external commands outside the write lock', async () => {
  const root = await tempProject();
  const { workId } = await createBasicWork(root);
  await writeFile(
    path.join(root, 'check-no-lock.mjs'),
    [
      "import { existsSync } from 'node:fs';",
      "import path from 'node:path';",
      "process.exit(existsSync(path.join(process.cwd(), '.dossier-runtime', 'write.lock')) ? 42 : 0);",
      '',
    ].join('\n'),
    'utf8',
  );
  const projectPath = path.join(root, 'docs/dossier/project.md');
  const project = await readFile(projectPath, 'utf8');
  await writeFile(
    projectPath,
    project.replace(
      '  default:\n    commands: []',
      '  default:\n    commands:\n      - "node check-no-lock.mjs"',
    ),
    'utf8',
  );

  const verified = run(
    [
      'verify',
      'run',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'implementation',
      '--profile',
      'default',
    ],
    root,
  );

  assert.equal(verified.status, 0, verified.stdout + verified.stderr);
  await assert.rejects(stat(path.join(root, '.dossier-runtime', 'write.lock')));
  const verificationFiles = await readdir(path.join(root, 'docs/dossier/verification', workId));
  assert.ok(verificationFiles.some((entry) => entry.endsWith('.md')));
  assert.ok(verificationFiles.every((entry) => !entry.endsWith('.tmp')));
});

void test('verify run rejects stale material scope before recording results', async () => {
  const root = await tempProject();
  const { workId } = await createBasicWork(root);
  const workPath = `docs/dossier/work-items/${workId}.md`;
  await writeFile(
    path.join(root, 'mutate-scope.cjs'),
    [
      "const { readFileSync, writeFileSync } = require('node:fs');",
      'const file = process.argv[2];',
      "const raw = readFileSync(file, 'utf8');",
      "writeFileSync(file, raw.replace(/^  coverage_gate: open$/m, '  coverage_gate: changed-by-test'), 'utf8');",
      '',
    ].join('\n'),
    'utf8',
  );
  const projectPath = path.join(root, 'docs/dossier/project.md');
  const project = await readFile(projectPath, 'utf8');
  await writeFile(
    projectPath,
    project.replace(
      '  default:\n    commands: []',
      `  default:\n    commands:\n      - "node mutate-scope.cjs ${workPath}"`,
    ),
    'utf8',
  );

  const verified = run(
    [
      'verify',
      'run',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'implementation',
      '--profile',
      'default',
    ],
    root,
  );

  assert.equal(verified.status, 2, verified.stdout + verified.stderr);
  assert.match(verified.stdout, /material scope changed while the external command was running/);
  await assert.rejects(stat(path.join(root, 'docs/dossier/verification', workId)));
  await assert.rejects(stat(path.join(root, '.dossier-runtime', 'write.lock')));
});

void test('source, capability, work, verification, review, stage and hygiene flow is observable', async () => {
  const root = await tempProject();
  await writeFile(path.join(root, 'concept.md'), '# Concept\n\nObservable thing.\n', 'utf8');
  await writeFile(path.join(root, 'evidence.md'), 'Observed behavior.\n', 'utf8');
  assert.equal(run(['init', '--root', root, '--project-name', 'Flow'], root).status, 0);
  const projectPath = path.join(root, 'docs/dossier/project.md');
  const project = await readFile(projectPath, 'utf8');
  await writeFile(
    projectPath,
    project.replace(
      '  default:\n    commands: []',
      '  default:\n    commands:\n      - "node --version"',
    ),
    'utf8',
  );

  const source = run(
    [
      'source',
      'add',
      '--root',
      root,
      '--path',
      'concept.md',
      '--kind',
      'concept',
      '--authority',
      'canonical',
      '--title',
      'Product concept',
      '--format',
      'yaml',
    ],
    root,
  );
  assert.equal(source.status, 0, source.stdout);
  const sourceId = /id: (SRC-[^\n]+)/.exec(source.stdout)?.[1];
  assert.ok(sourceId);

  const capability = run(
    [
      'capability',
      'create',
      '--root',
      root,
      '--title',
      'Resume work',
      '--status',
      'intended',
      '--source',
      sourceId,
      '--format',
      'yaml',
    ],
    root,
  );
  assert.equal(capability.status, 0, capability.stdout);
  const capabilityId = /id: (CAP-[^\n]+)/.exec(capability.stdout)?.[1];
  assert.ok(capabilityId);
  assert.equal(
    run(
      [
        'capability',
        'claim',
        'set',
        '--root',
        root,
        '--capability',
        capabilityId,
        '--actor',
        'operator',
        '--trigger',
        'runs command',
        '--behavior',
        'dossier updates',
        '--response',
        'next action is shown',
        '--state-change',
        'artifact is written',
        '--continuity',
        'later status sees it',
      ],
      root,
    ).status,
    0,
  );

  const work = run(
    [
      'work',
      'create',
      '--root',
      root,
      '--title',
      'Implement resume work',
      '--type',
      'feature',
      '--delivery',
      'capability',
      '--capability',
      capabilityId,
      '--relation',
      'introduces',
      '--source',
      sourceId,
      '--area',
      'core',
      '--owner',
      'agent',
      '--format',
      'yaml',
    ],
    root,
  );
  assert.equal(work.status, 0, work.stdout);
  const workId = /id: (WI-[^\n]+)/.exec(work.stdout)?.[1];
  assert.ok(workId);
  await completeCapabilityWorkBody(root, workId, 'Implement resume work');
  assert.equal(
    run(
      [
        'work',
        'acceptance',
        'add',
        '--root',
        root,
        '--work',
        workId,
        '--kind',
        'behavior',
        '--text',
        'operator sees artifact',
        '--source',
        `${sourceId}#behavior`,
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'work',
        'demo',
        'set',
        '--root',
        root,
        '--work',
        workId,
        '--name',
        'demo',
        '--scenario',
        'operator runs command and sees artifact',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'work',
        'anti-claim',
        'add',
        '--root',
        root,
        '--work',
        workId,
        '--text',
        'does not run external audits',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'stage',
        'start',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'feature-intake',
        '--session',
        'sess-test',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'stage',
        'ready',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'feature-intake',
        '--summary',
        'ready',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(['stage', 'close', '--root', root, '--work', workId, '--stage', 'feature-intake'], root)
      .status,
    0,
  );
  assert.equal(
    run(
      [
        'stage',
        'start',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'spec-compact',
        '--session',
        'sess-test',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'stage',
        'ready',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'spec-compact',
        '--summary',
        'ready',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(['stage', 'close', '--root', root, '--work', workId, '--stage', 'spec-compact'], root)
      .status,
    0,
  );
  assert.equal(
    run(
      [
        'work',
        'challenge',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--summary',
        'could be infrastructure only',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    (await recordEligibleReview(root, workId, 'plan-slice', 'concept-conformance-reviewer')).status,
    0,
  );
  const readyPlan = run(
    [
      'stage',
      'ready',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'plan-slice',
      '--summary',
      'ready',
    ],
    root,
  );
  assert.equal(readyPlan.status, 0, readyPlan.stdout + readyPlan.stderr);
  assert.equal(
    run(['stage', 'close', '--root', root, '--work', workId, '--stage', 'plan-slice'], root).status,
    0,
  );
  assert.equal(
    run(
      [
        'verify',
        'run',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'implementation',
        '--profile',
        'default',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'verify',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'implementation',
        '--profile',
        'behavioral-demo',
        '--evidence-class',
        'headless',
        '--verdict',
        'pass',
        '--summary',
        'observed in headless support harness',
        '--evidence',
        'evidence.md',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'review',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'implementation',
        '--class',
        'concept-conformance-reviewer',
        '--verdict',
        'pass',
        '--reviewer',
        'reviewer',
      ],
      root,
    ).status,
    0,
  );
  const missingLiveApp = run(
    [
      'verify',
      'record',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'implementation',
      '--profile',
      'behavioral-demo',
      '--evidence-class',
      'live-app',
      '--verdict',
      'pass',
      '--summary',
      'observed in app',
      '--evidence',
      'evidence.md',
    ],
    root,
  );
  assert.equal(missingLiveApp.status, 1, missingLiveApp.stdout + missingLiveApp.stderr);
  assert.match(
    missingLiveApp.stderr + missingLiveApp.stdout,
    /requires --entrypoint and --runtime-path/,
  );
  assert.equal(
    run(
      [
        'review',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'implementation',
        '--class',
        'spec-conformance-reviewer',
        '--verdict',
        'pass',
        '--reviewer',
        'reviewer',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(
      [
        'stage',
        'start',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'implementation',
        '--session',
        'sess-test',
      ],
      root,
    ).status,
    0,
  );
  const blockedImplementation = run(
    [
      'stage',
      'ready',
      '--root',
      root,
      '--work',
      workId,
      '--stage',
      'implementation',
      '--summary',
      'implemented',
    ],
    root,
  );
  assert.equal(
    blockedImplementation.status,
    2,
    blockedImplementation.stdout + blockedImplementation.stderr,
  );
  assert.match(
    blockedImplementation.stdout,
    /fresh live-app behavioral-demo verification required/,
  );
  const requiredVerification = run(['verify', 'required', '--root', root, '--work', workId], root);
  assert.equal(
    requiredVerification.status,
    2,
    requiredVerification.stdout + requiredVerification.stderr,
  );
  assert.match(requiredVerification.stdout, /behavioral-demo live-app: missing_or_stale/);
  assert.match(requiredVerification.stdout, /--evidence-class live-app --entrypoint/);
  assert.equal(
    run(
      [
        'verify',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'implementation',
        '--profile',
        'behavioral-demo',
        '--evidence-class',
        'live-app',
        '--entrypoint',
        'scripts/dossier-engineer.mjs command execution',
        '--runtime-path',
        'CLI parse -> runCommand -> stage and queue handlers',
        '--verdict',
        'pass',
        '--summary',
        'observed in bundled CLI',
        '--evidence',
        'evidence.md',
      ],
      root,
    ).status,
    0,
  );
  const verificationFiles = await readdir(path.join(root, 'docs/dossier/verification', workId));
  const verificationBodies = await Promise.all(
    verificationFiles.map((file) =>
      readFile(path.join(root, 'docs/dossier/verification', workId, file), 'utf8'),
    ),
  );
  assert.ok(verificationBodies.some((text) => /evidence_class: live-app/.test(text)));
  assert.ok(
    verificationBodies.some((text) =>
      /runtime_path: CLI parse -> runCommand -> stage and queue handlers/.test(text),
    ),
  );
  const staleReviews = run(['review', 'required', '--root', root, '--work', workId], root);
  assert.equal(staleReviews.status, 2, staleReviews.stdout + staleReviews.stderr);
  assert.match(staleReviews.stdout, /concept-conformance-reviewer: missing_or_stale/);
  assert.match(staleReviews.stdout, /spec-conformance-reviewer: missing_or_stale/);
  assert.match(staleReviews.stdout, /code-reviewer: missing_or_stale/);
  for (const reviewClass of [
    'concept-conformance-reviewer',
    'spec-conformance-reviewer',
    'code-reviewer',
  ]) {
    assert.equal(
      (await recordEligibleReview(root, workId, 'implementation', reviewClass)).status,
      0,
    );
  }
  assert.equal(
    run(
      [
        'verify',
        'record',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'implementation',
        '--profile',
        'behavioral-demo',
        '--evidence-class',
        'live-app',
        '--entrypoint',
        'scripts/dossier-engineer.mjs command execution',
        '--runtime-path',
        'CLI parse -> runCommand -> stage and queue handlers',
        '--verdict',
        'pass',
        '--summary',
        'same live-app path re-observed',
        '--evidence',
        'evidence.md',
      ],
      root,
    ).status,
    0,
  );
  const stillFreshReviews = run(['review', 'required', '--root', root, '--work', workId], root);
  assert.equal(stillFreshReviews.status, 0, stillFreshReviews.stdout + stillFreshReviews.stderr);
  assert.match(stillFreshReviews.stdout, /concept-conformance-reviewer: fresh/);
  assert.match(stillFreshReviews.stdout, /spec-conformance-reviewer: fresh/);
  assert.match(stillFreshReviews.stdout, /code-reviewer: fresh/);
  assert.equal(
    run(
      [
        'stage',
        'ready',
        '--root',
        root,
        '--work',
        workId,
        '--stage',
        'implementation',
        '--summary',
        'implemented',
      ],
      root,
    ).status,
    0,
  );
  assert.equal(
    run(['stage', 'close', '--root', root, '--work', workId, '--stage', 'implementation'], root)
      .status,
    0,
  );
  const implementedWork = await readFile(
    path.join(root, 'docs/dossier/work-items', `${workId}.md`),
    'utf8',
  );
  assert.match(implementedWork, /lifecycle: implemented/);
  const hygieneNext = run(['next', '--root', root, '--work', workId], root);
  assert.equal(hygieneNext.status, 0, hygieneNext.stdout + hygieneNext.stderr);
  assert.match(hygieneNext.stdout, /hygiene run/);
  assert.equal(
    run(['hygiene', 'run', '--root', root, '--work', workId, '--stage', 'implementation'], root)
      .status,
    0,
  );
  const terminalNext = run(['next', '--root', root, '--work', workId], root);
  assert.equal(terminalNext.status, 0, terminalNext.stdout + terminalNext.stderr);
  assert.doesNotMatch(terminalNext.stdout, /hygiene run/);
  assert.match(terminalNext.stdout, /terminal closed\/handoff-complete/);
  assert.equal(run(['lint', '--root', root], root).status, 0);
});

void test('lint rejects forbidden canonical JSON state', async () => {
  const root = await tempProject();
  assert.equal(run(['init', '--root', root, '--project-name', 'Forbidden'], root).status, 0);
  await writeFile(path.join(root, 'docs/dossier/state.json'), '{}\n', 'utf8');
  const result = run(['lint', '--root', root], root);
  assert.equal(result.status, 3);
  assert.match(result.stdout, /Forbidden canonical state file exists/);
});
