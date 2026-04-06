import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const CLI_PATH = path.join(SKILL_DIR, 'scripts', 'backlog-engineer.mjs');

function runCli(
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

void test('global help exposes the planned command surface', () => {
  const result = runCli(['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /register-source/);
  assert.match(result.stdout, /patch-item/);
  assert.match(result.stdout, /delete-backlog/);
  assert.equal(result.stderr, '');
});

void test('placeholder command returns a not-implemented exit code', () => {
  const result = runCli(['init', '--path', './backlog']);

  assert.equal(result.status, 3);
  assert.match(result.stderr, /scaffolded but not implemented yet/);
  assert.match(result.stderr, /Received args: --path \.\/backlog/);
});

void test('help for a specific command is available', () => {
  const result = runCli(['help', 'refresh']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /backlog-engineer refresh/);
  assert.match(result.stdout, /behavior not implemented yet/);
});
