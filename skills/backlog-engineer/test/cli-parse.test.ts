import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCliIntent } from '../src/cli/parse-argv.ts';
import { BacklogError } from '../src/errors/index.ts';

void test('parseCliIntent returns global help for empty argv', () => {
  assert.deepEqual(parseCliIntent([]), { kind: 'global_help' });
});

void test('parseCliIntent returns version intent for --version', () => {
  assert.deepEqual(parseCliIntent(['--version']), { kind: 'version' });
});

void test('parseCliIntent returns command help for help <command>', () => {
  assert.deepEqual(parseCliIntent(['help', 'refresh']), {
    kind: 'command_help',
    commandName: 'refresh',
  });
});

void test('parseCliIntent returns command run for known command form', () => {
  assert.deepEqual(parseCliIntent(['status', '--refresh']), {
    kind: 'command_run',
    commandName: 'status',
    args: ['--refresh'],
  });
});

void test('parseCliIntent rejects unknown global flags as usage errors', () => {
  assert.throws(
    () => parseCliIntent(['--wat']),
    (error: unknown) =>
      error instanceof BacklogError && error.code === 'BE_USAGE_INVALID' && error.exitCode === 2,
  );
});

void test('parseCliIntent rejects extra help positionals as usage errors', () => {
  assert.throws(
    () => parseCliIntent(['help', 'refresh', 'extra']),
    (error: unknown) => error instanceof BacklogError && error.code === 'BE_USAGE_INVALID',
  );
});
