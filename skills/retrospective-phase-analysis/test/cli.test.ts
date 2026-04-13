import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
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
  { cwd = SKILL_DIR }: { cwd?: string } = {},
): SpawnSyncReturns<string> {
  const result = spawnSync('node', [CLI_PATH, ...args], {
    cwd,
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
