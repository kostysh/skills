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
  projectRoot: string;
  sessionPath: string;
}> {
  const tempDir = await createTempDir();
  const projectRoot = path.join(tempDir, 'project');
  const sessionId = '019d7490-46d0-7811-b43f-056bb617a7ab';
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionsDir = path.join(tempDir, 'sessions');
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
      type: 'tool_call',
      tool: 'functions.apply_patch',
      patch: '*** Begin Patch\n*** Update File: .dossier/logs/implementation.md\n*** End Patch',
      message: 'Update .dossier/logs/implementation.md after review.',
    }),
    JSON.stringify({
      time: '2026-04-10T10:06:00Z',
      kind: 'tool_result',
      recipient: 'functions.apply_patch',
      status: 'ok',
      notes: 'Updated .dossier/logs/implementation.md',
    }),
  ];
  await writeFile(sessionPath, `${sessionLines.join('\n')}\n`, 'utf8');

  return { tempDir, projectRoot, sessionPath };
}

async function createFallbackOutputFixture(): Promise<{
  tempDir: string;
  projectRoot: string;
  sessionPath: string;
}> {
  const tempDir = await createTempDir();
  const projectRoot = path.join(tempDir, 'plain-project');
  const sessionsDir = path.join(tempDir, 'sessions');
  const sessionId = '019d7490-46d0-7811-b43f-056bb617a7ac';
  const sessionPath = path.join(sessionsDir, `rollout-2026-04-10T10-00-00-${sessionId}.jsonl`);

  await mkdir(projectRoot, { recursive: true });
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
      content: 'Investigate CF-0016 in an ad-hoc project.',
    }),
  ];
  await writeFile(sessionPath, `${sessionLines.join('\n')}\n`, 'utf8');

  return { tempDir, projectRoot, sessionPath };
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

  const scanHelp = runBuiltCli(['help', 'scan']);
  assert.equal(scanHelp.status, 0);
  assert.equal(scanHelp.stderr, '');
  assert.match(scanHelp.stdout, /^ {2}node scripts\/retro-cli\.mjs scan --session <file>$/mu);
  assert.match(scanHelp.stdout, /scan --session <file> --out-root <dir> --pretty/u);
  assert.match(scanHelp.stdout, /scan --session <file> --out <file> --pretty/u);
  assert.doesNotMatch(
    scanHelp.stdout,
    /scan --logs-dir <dir> --artifacts-dir <dir> --out <file> --pretty/u,
  );
});

void test('scan writes a JSON summary file from fixture inputs', async () => {
  const tempDir = await createTempDir();
  const outputPath = path.join(tempDir, 'scan-summary.json');

  try {
    const result = runBuiltCli([
      'scan',
      '--session',
      fixturePath('sessions', 'phase-session-with-log-link.jsonl'),
      '--logs-dir',
      fixturePath('artifacts', '.dossier', 'logs'),
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
    assert.equal(parsed.stageLogs.count, 1);
    assert.equal(parsed.candidateIncidents.length > 0, true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('scan returns a usage error when --session is omitted', async () => {
  const tempDir = await createTempDir();
  const outputPath = path.join(tempDir, 'scan-summary.json');

  try {
    const result = runBuiltCli([
      'scan',
      '--logs-dir',
      fixturePath('artifacts', '.dossier', 'logs'),
      '--artifacts-dir',
      fixturePath('artifacts'),
      '--out',
      outputPath,
    ]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /scan requires --session/u);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('scan discovers standard evidence directories from session_meta.cwd after the agent supplies the trace file', async () => {
  const { tempDir, projectRoot, sessionPath } = await createDiscoveryFixture();
  const outputPath = path.join(tempDir, 'scan-summary.json');

  try {
    const result = runBuiltCli(['scan', '--session', sessionPath, '--out', outputPath, '--pretty']);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');

    const parsed = JSON.parse(await readFile(outputPath, 'utf8')) as {
      resolved: { session: string | null; logsDir: string | null };
      stageLogs: { count: number };
      scope: {
        project_root: string | null;
        mentioned_backlog_items: string[];
        mentioned_features: string[];
        candidate_stage_logs: string[];
      };
    };

    assert.equal(parsed.resolved.session, sessionPath);
    assert.equal(parsed.resolved.logsDir, path.join(projectRoot, '.dossier', 'logs'));
    assert.equal(parsed.scope.project_root, projectRoot);
    assert.deepEqual(parsed.scope.mentioned_backlog_items, ['CF-0016']);
    assert.deepEqual(parsed.scope.mentioned_features, ['F-0016']);
    assert.equal(parsed.stageLogs.count, 1);
    assert.deepEqual(parsed.scope.candidate_stage_logs, [
      path.join(projectRoot, '.dossier', 'logs', 'implementation.md'),
    ]);
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
      fixturePath('sessions', 'phase-session-with-log-link.jsonl'),
      '--logs-dir',
      fixturePath('artifacts', '.dossier', 'logs'),
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
    assert.match(markdown, /Backlog actualization deferred/mu);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('scan and report reuse the same durable retrospective run directory by default', async () => {
  const { tempDir, projectRoot, sessionPath } = await createDiscoveryFixture();
  const baseRunDir = path.join(
    projectRoot,
    '.dossier',
    'retro',
    'cf-0016',
    'retrospective-20260410-095900-019d7490',
  );
  const rerunDir = `${baseRunDir}-r2`;

  try {
    const firstScan = runBuiltCli(['scan', '--session', sessionPath]);
    assert.equal(firstScan.status, 0);

    const firstScanOutput = path.join(baseRunDir, 'scan-summary.json');
    await readFile(firstScanOutput, 'utf8');

    const firstReport = runBuiltCli(['report', '--session', sessionPath, '--phase', 'implementation']);
    assert.equal(firstReport.status, 0);

    const firstReportOutput = path.join(baseRunDir, 'retrospective-report.md');
    const firstReportMarkdown = await readFile(firstReportOutput, 'utf8');
    assert.match(firstReportMarkdown, /^# Retrospective:/mu);

    const secondScan = runBuiltCli(['scan', '--session', sessionPath]);
    assert.equal(secondScan.status, 0);
    await readFile(path.join(rerunDir, 'scan-summary.json'), 'utf8');

    const secondReport = runBuiltCli(['report', '--session', sessionPath, '--phase', 'implementation']);
    assert.equal(secondReport.status, 0);
    await readFile(path.join(rerunDir, 'retrospective-report.md'), 'utf8');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('scan falls back to out/retro when the project root is not dossier-managed', async () => {
  const { tempDir, projectRoot, sessionPath } = await createFallbackOutputFixture();

  try {
    const result = runBuiltCli(['scan', '--session', sessionPath]);
    assert.equal(result.status, 0);

    const outputPath = path.join(
      projectRoot,
      'out',
      'retro',
      'cf-0016',
      'retrospective-20260410-095900-019d7490',
      'scan-summary.json',
    );
    const parsed = JSON.parse(await readFile(outputPath, 'utf8')) as {
      recommendedOutput: { mode: string; root: string };
    };
    assert.equal(parsed.recommendedOutput.mode, 'fallback-default');
    assert.equal(parsed.recommendedOutput.root, path.join(projectRoot, 'out', 'retro'));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
