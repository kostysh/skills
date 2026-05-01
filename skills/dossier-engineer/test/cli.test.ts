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
      'Production entrypoint: scripts/dossier-engineer.mjs command execution. Runtime path: CLI parse -> runCommand -> stage and queue handlers.',
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
      '| AC | Evidence |',
      '| --- | --- |',
      '| AC-1 | CLI runtime acceptance test and review artifact |',
      '',
      '### Risks and fallback/change-proposal triggers',
      '',
      '- If the production entrypoint changes, open a change-proposal before implementation closure.',
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
    ).status,
    0,
  );
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
      "writeFileSync(file, raw.replace(/^material_scope_hash: .*$/m, 'material_scope_hash: changed-by-test'), 'utf8');",
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
        'reviewer',
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
    ).status,
    0,
  );
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
        'behavioral',
        '--verdict',
        'pass',
        '--summary',
        'observed',
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
