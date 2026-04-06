import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import {
  CommandHelpOutputSchema,
  ErrorPayloadSchema,
  GlobalHelpOutputSchema,
  VersionOutputSchema,
} from '../src/schemas/index.ts';
import { runCli as runCliSource } from '../src/cli/run-cli.ts';
import type { AnyCommandDefinition, CliIo } from '../src/commands/index.ts';
import type { RuntimeModule } from '../src/runtime/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const CLI_PATH = path.join(SKILL_DIR, 'scripts', 'backlog-engineer.mjs');

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

function parseStdoutJson(result: SpawnSyncReturns<string>): unknown {
  assert.notEqual(result.stdout, '');
  return JSON.parse(result.stdout) as unknown;
}

function parseStderrJson(result: SpawnSyncReturns<string>): unknown {
  assert.notEqual(result.stderr, '');
  return JSON.parse(result.stderr) as unknown;
}

function createBufferingCliIo(): {
  cliIo: CliIo;
  stdoutBuffer: string[];
  stderrBuffer: string[];
} {
  const stdoutBuffer: string[] = [];
  const stderrBuffer: string[] = [];

  return {
    cliIo: {
      stdout: {
        write(chunk: string) {
          stdoutBuffer.push(chunk);
          return true;
        },
      },
      stderr: {
        write(chunk: string) {
          stderrBuffer.push(chunk);
          return true;
        },
      },
    },
    stdoutBuffer,
    stderrBuffer,
  };
}

void test('global help returns JSON help payload on stdout', () => {
  const result = runBuiltCli(['--help']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');

  const parsed = GlobalHelpOutputSchema.parse(parseStdoutJson(result));
  assert.equal(parsed.cli_name, 'backlog-engineer');
  assert.ok(parsed.commands.some((command) => command.name === 'register-source'));
  assert.ok(parsed.commands.some((command) => command.name === 'patch-item'));
});

void test('version returns JSON version payload on stdout', () => {
  const result = runBuiltCli(['--version']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');

  const parsed = VersionOutputSchema.parse(parseStdoutJson(result));
  assert.equal(parsed.cli_name, 'backlog-engineer');
  assert.match(parsed.version, /^\d+\.\d+\.\d+/);
});

void test('help for a specific command returns command help JSON', () => {
  const result = runBuiltCli(['help', 'refresh']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');

  const parsed = CommandHelpOutputSchema.parse(parseStdoutJson(result));
  assert.equal(parsed.command, 'refresh');
  assert.ok(parsed.usage.some((entry) => entry.includes('refresh --source-id')));
});

void test('command-local --help returns command help JSON', () => {
  const result = runBuiltCli(['status', '--help']);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');

  const parsed = CommandHelpOutputSchema.parse(parseStdoutJson(result));
  assert.equal(parsed.command, 'status');
  assert.ok(parsed.options.some((option) => option.flags.includes('--refresh')));
});

void test('unknown command returns usage error on stderr', () => {
  const result = runBuiltCli(['unknown-command']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');

  const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
  assert.equal(parsed.error.code, 'BE_USAGE_INVALID');
  assert.equal(parsed.error.details?.command, 'unknown-command');
});

void test('unsupported command flag returns usage error on stderr', () => {
  const result = runBuiltCli(['status', '--unknown']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');

  const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
  assert.equal(parsed.error.code, 'BE_USAGE_INVALID');
  assert.equal(parsed.error.details?.command, 'status');
});

void test('delete-backlog without confirm returns destructive-action error on stderr', () => {
  const result = runBuiltCli(['delete-backlog']);

  assert.equal(result.status, 6);
  assert.equal(result.stdout, '');

  const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
  assert.equal(parsed.error.code, 'BE_DELETE_CONFIRM_REQUIRED');
});

void test('placeholder command preserves final JSON error envelope', () => {
  const result = runBuiltCli(['init', '--path', './backlog']);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');

  const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
  assert.equal(parsed.error.code, 'BE_INTERNAL_STATE_CORRUPT');
  assert.match(parsed.error.message, /not implemented yet/i);
});

void test('runCli invokes beforeCommand and afterCommand hooks around successful execution', async () => {
  const events: unknown[] = [];
  const command: AnyCommandDefinition = {
    name: 'status',
    summary: 'test command',
    usage: ['backlog-engineer status'],
    options: [],
    inputSchema: z.object({ refresh: z.boolean() }),
    outputSchema: z.object({ ok: z.literal(true) }),
    parseArgs: () => ({ refresh: false }),
    execute: (input, context) => {
      events.push({
        phase: 'execute',
        input,
        hasBacklogRoot: 'backlogRoot' in context,
      });
      return Promise.resolve({ ok: true });
    },
  };
  const runtime: RuntimeModule = {
    createContext() {
      return Promise.resolve({
        backlogRoot: '/tmp/backlog',
        artifacts: {} as never,
        sources: {} as never,
        templates: {} as never,
        reports: {} as never,
        schemas: {} as never,
        errors: {} as never,
        core: {} as never,
        hooks: {
          beforeCommand(payload) {
            events.push({
              phase: 'before',
              payload,
            });
            return Promise.resolve();
          },
          afterCommand(payload) {
            events.push({
              phase: 'after',
              payload,
            });
            return Promise.resolve();
          },
        },
        ensureQueryState: () => Promise.reject(new Error('not used in hook test')),
        ensureMutationState: () => Promise.reject(new Error('not used in hook test')),
      });
    },
    rebuildState: () => Promise.reject(new Error('not used in hook test')),
  };
  const { cliIo, stdoutBuffer, stderrBuffer } = createBufferingCliIo();

  const exitCode = await runCliSource(['status'], cliIo, '0.1.0-test', {
    findCommand: (name) => (name === 'status' ? command : undefined),
    createRuntime: () => runtime,
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(stderrBuffer, []);
  assert.deepEqual(stdoutBuffer, ['{"ok":true}\n']);
  assert.deepEqual(events, [
    {
      phase: 'before',
      payload: {
        command: 'status',
        input: { refresh: false },
        backlogRoot: '/tmp/backlog',
      },
    },
    {
      phase: 'execute',
      input: { refresh: false },
      hasBacklogRoot: true,
    },
    {
      phase: 'after',
      payload: {
        command: 'status',
        output: { ok: true },
        backlogRoot: '/tmp/backlog',
      },
    },
  ]);
});
