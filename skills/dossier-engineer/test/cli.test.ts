import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
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

test('init creates markdown-only dossier project and directories', async () => {
  const root = await tempProject();
  const result = run(['init', '--root', root, '--project-name', 'Example'], root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const project = await readFile(path.join(root, 'docs/dossier/project.md'), 'utf8');
  assert.match(project, /artifact_type: dossier_project/);
  assert.match(project, /project_id: PRJ-\d{8}-example-[a-f0-9]{6}/);
  assert.doesNotMatch(project, /state\.json/);
});

test('scaffold-generating commands remind agents to complete artifact bodies', async () => {
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

test('source, capability, work, verification, review, stage and hygiene flow is observable', async () => {
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
  assert.equal(
    run(['hygiene', 'run', '--root', root, '--work', workId, '--stage', 'implementation'], root)
      .status,
    0,
  );
  assert.equal(run(['lint', '--root', root], root).status, 0);
});

test('lint rejects forbidden canonical JSON state', async () => {
  const root = await tempProject();
  assert.equal(run(['init', '--root', root, '--project-name', 'Forbidden'], root).status, 0);
  await writeFile(path.join(root, 'docs/dossier/state.json'), '{}\n', 'utf8');
  const result = run(['lint', '--root', root], root);
  assert.equal(result.status, 3);
  assert.match(result.stdout, /Forbidden canonical state file exists/);
});
