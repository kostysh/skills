import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  CommandHelpOutputSchema,
  ErrorPayloadSchema,
  GlobalHelpOutputSchema,
  VersionOutputSchema,
} from '../src/schemas/index.ts';

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

function parseStdoutJson(result: SpawnSyncReturns<string>): unknown {
  assert.notEqual(result.stdout, '');
  return JSON.parse(result.stdout) as unknown;
}

function parseStderrJson(result: SpawnSyncReturns<string>): unknown {
  assert.notEqual(result.stderr, '');
  return JSON.parse(result.stderr) as unknown;
}

void test('global help returns JSON help payload on stdout', () => {
  const result = runCli(['--help']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');

  const parsed = GlobalHelpOutputSchema.parse(parseStdoutJson(result));
  assert.equal(parsed.cli_name, 'backlog-engineer');
  assert.ok(parsed.commands.some((command) => command.name === 'register-source'));
  assert.ok(parsed.commands.some((command) => command.name === 'patch-item'));
});

void test('version returns JSON version payload on stdout', () => {
  const result = runCli(['--version']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');

  const parsed = VersionOutputSchema.parse(parseStdoutJson(result));
  assert.equal(parsed.cli_name, 'backlog-engineer');
  assert.match(parsed.version, /^\d+\.\d+\.\d+/);
});

void test('help for a specific command returns command help JSON', () => {
  const result = runCli(['help', 'refresh']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');

  const parsed = CommandHelpOutputSchema.parse(parseStdoutJson(result));
  assert.equal(parsed.command, 'refresh');
  assert.ok(parsed.usage.some((entry) => entry.includes('refresh --source-id')));
});

void test('command-local --help returns command help JSON', () => {
  const result = runCli(['status', '--help']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');

  const parsed = CommandHelpOutputSchema.parse(parseStdoutJson(result));
  assert.equal(parsed.command, 'status');
  assert.ok(parsed.options.some((option) => option.flags.includes('--refresh')));
});

void test('unknown command returns usage error on stderr', () => {
  const result = runCli(['unknown-command']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');

  const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
  assert.equal(parsed.error.code, 'BE_USAGE_INVALID');
  assert.equal(parsed.error.details?.command, 'unknown-command');
});

void test('unsupported command flag returns usage error on stderr', () => {
  const result = runCli(['status', '--unknown']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');

  const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
  assert.equal(parsed.error.code, 'BE_USAGE_INVALID');
  assert.equal(parsed.error.details?.command, 'status');
});

void test('delete-backlog without confirm returns destructive-action error on stderr', () => {
  const result = runCli(['delete-backlog']);

  assert.equal(result.status, 6);
  assert.equal(result.stdout, '');

  const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
  assert.equal(parsed.error.code, 'BE_DELETE_CONFIRM_REQUIRED');
});

void test('placeholder command preserves final JSON error envelope', () => {
  const result = runCli(['init', '--path', './backlog']);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');

  const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
  assert.equal(parsed.error.code, 'BE_INTERNAL_STATE_CORRUPT');
  assert.match(parsed.error.message, /not implemented yet/i);
});
