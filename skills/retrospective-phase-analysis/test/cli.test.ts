import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const CLI_PATH = path.join(SKILL_DIR, 'scripts', 'retro-cli.mjs');
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');

function fixturePath(...segments: string[]): string {
  return path.join(FIXTURES_DIR, ...segments);
}

function runBuiltCli(
  args: string[],
  { cwd = SKILL_DIR, env }: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): SpawnSyncReturns<string> {
  const result = spawnSync('node', [CLI_PATH, ...args], {
    cwd,
    env,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
}

async function createDiscoveryFixture(): Promise<{
  tempDir: string;
  codexHome: string;
  projectRoot: string;
  sessionId: string;
}> {
  const tempDir = await createTempDir();
  const projectRoot = path.join(tempDir, 'project');
  const codexHome = path.join(tempDir, 'codex-home');
  const sessionId = '019d7490-46d0-7811-b43f-056bb617a7ab';
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionsDir = path.join(codexHome, 'sessions', '2026', '04', '10');
  const sessionPath = path.join(sessionsDir, `rollout-2026-04-10T10-00-00-${sessionId}.jsonl`);

  await cp(fixturePath('artifacts'), projectRoot, { recursive: true });
  await mkdir(path.dirname(logsDir), { recursive: true });
  await cp(fixturePath('logs'), logsDir, { recursive: true });
  await mkdir(sessionsDir, { recursive: true });

  const sessionLines = [
    JSON.stringify({
      timestamp: '2026-04-10T09:59:00Z',
      type: 'session_meta',
      payload: { id: sessionId, cwd: projectRoot },
    }),
    JSON.stringify({
      ts: '2026-04-10T10:00:00Z',
      type: 'assistant',
      content: 'Investigate CF-0016 and F-0016 via docs/features/F-0016-retro.md.',
    }),
    JSON.stringify({
      created_at: '2026-04-10T10:05:00Z',
      event: 'tool_call',
      tool_name: 'functions.exec_command',
      command: "sed -n '1,200p' src/retro/collector.ts",
    }),
  ];
  await writeFile(sessionPath, `${sessionLines.join('\n')}\n`, 'utf8');

  return { tempDir, codexHome, projectRoot, sessionId };
}

void test('global help and command help are available on the built CLI', () => {
  const help = runBuiltCli(['--help']);
  assert.equal(help.status, 0);
  assert.equal(help.stderr, '');
  assert.match(help.stdout, /retrospective-phase-analysis CLI/u);
  assert.match(help.stdout, /scan/u);
  assert.match(help.stdout, /logging-review/u);

  const commandHelp = runBuiltCli(['help', 'report']);
  assert.equal(commandHelp.status, 0);
  assert.equal(commandHelp.stderr, '');
  assert.match(commandHelp.stdout, /^report - Generate a Markdown retrospective draft\./mu);
  assert.match(commandHelp.stdout, /--title <text>/u);
});

void test('scan writes a JSON summary file from fixture inputs', async () => {
  const tempDir = await createTempDir();
  const outputPath = path.join(tempDir, 'scan-summary.json');

  try {
    const result = runBuiltCli([
      'scan',
      '--session',
      fixturePath('sessions', 'phase-session.jsonl'),
      '--logs-dir',
      fixturePath('logs'),
      '--artifacts-dir',
      fixturePath('artifacts'),
      '--skills-dir',
      fixturePath('skills'),
      '--out',
      outputPath,
      '--pretty',
    ]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');

    const parsed = JSON.parse(await readFile(outputPath, 'utf8')) as {
      stageLogs: { count: number };
      candidateIncidents: unknown[];
    };
    assert.equal(parsed.stageLogs.count, 2);
    assert.equal(parsed.candidateIncidents.length > 0, true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('scan resolves a trace from --session-id and discovers standard evidence directories', async () => {
  const { tempDir, codexHome, projectRoot, sessionId } = await createDiscoveryFixture();
  const outputPath = path.join(tempDir, 'scan-summary.json');

  try {
    const result = runBuiltCli(
      ['scan', '--session-id', sessionId, '--out', outputPath, '--pretty'],
      {
        env: { ...process.env, CODEX_HOME: codexHome },
      },
    );

    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');

    const parsed = JSON.parse(await readFile(outputPath, 'utf8')) as {
      resolved: { sessionId: string | null; logsDir: string | null; discoveryMode: string };
      scope: {
        project_root: string | null;
        mentioned_backlog_items: string[];
        mentioned_features: string[];
      };
    };

    assert.equal(parsed.resolved.discoveryMode, 'explicit_session_id');
    assert.equal(parsed.resolved.sessionId, sessionId);
    assert.equal(parsed.resolved.logsDir, path.join(projectRoot, '.dossier', 'logs'));
    assert.equal(parsed.scope.project_root, projectRoot);
    assert.deepEqual(parsed.scope.mentioned_backlog_items, ['CF-0016']);
    assert.deepEqual(parsed.scope.mentioned_features, ['F-0016']);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('scan returns a clear error when an explicit --session-id cannot be resolved', async () => {
  const tempDir = await createTempDir();
  const outputPath = path.join(tempDir, 'scan-summary.json');

  try {
    const result = runBuiltCli(['scan', '--session-id', '019d0000-missing', '--out', outputPath], {
      env: { ...process.env, CODEX_HOME: path.join(tempDir, 'empty-codex-home') },
    });

    assert.equal(result.status, 2);
    assert.match(result.stderr, /Could not resolve session trace for session_id/u);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('report writes a markdown draft from fixture inputs', async () => {
  const tempDir = await createTempDir();
  const outputPath = path.join(tempDir, 'retrospective.md');

  try {
    const result = runBuiltCli([
      'report',
      '--session',
      fixturePath('sessions', 'phase-session.jsonl'),
      '--logs-dir',
      fixturePath('logs'),
      '--artifacts-dir',
      fixturePath('artifacts'),
      '--skills-dir',
      fixturePath('skills'),
      '--phase',
      'implementation',
      '--title',
      'Retrospective: implementation',
      '--out',
      outputPath,
    ]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');

    const markdown = await readFile(outputPath, 'utf8');
    assert.match(markdown, /^# Retrospective: implementation/mu);
    assert.match(markdown, /^## Candidate incidents$/mu);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
