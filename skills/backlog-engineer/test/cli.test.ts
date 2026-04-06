import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import {
  AppliedRegistryFileSchema,
  CommandHelpOutputSchema,
  DeleteBacklogCommandOutputSchema,
  ErrorPayloadSchema,
  GlobalHelpOutputSchema,
  InitCommandOutputSchema,
  RootMarkerFileSchema,
  SourceRegistryFileSchema,
  StateFileSchema,
  VersionOutputSchema,
} from '../src/schemas/index.ts';
import { runCli as runCliSource } from '../src/cli/run-cli.ts';
import type { AnyCommandDefinition, CliIo } from '../src/commands/index.ts';
import type { RuntimeModule } from '../src/runtime/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const CLI_PATH = path.join(SKILL_DIR, 'scripts', 'backlog-engineer.mjs');

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-cli-'));
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

void test('delete-backlog --confirm deletes managed artifacts and prunes an empty backlog root', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');

  try {
    const initResult = runBuiltCli(['init', '--path', backlogRoot]);
    assert.equal(initResult.status, 0);

    const result = runBuiltCli(['delete-backlog', '--confirm'], { cwd: backlogRoot });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');
    assert.deepEqual(DeleteBacklogCommandOutputSchema.parse(parseStdoutJson(result)), {
      deleted_path: '.',
      deleted: true,
    });
    await assert.rejects(() => readFile(path.join(backlogRoot, '.backlog.json'), 'utf8'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('delete-backlog --confirm rejects backlog roots with foreign entries and preserves all files', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');

  try {
    const initResult = runBuiltCli(['init', '--path', backlogRoot]);
    assert.equal(initResult.status, 0);
    await writeFile(path.join(backlogRoot, 'README.txt'), 'keep me\n', 'utf8');

    const result = runBuiltCli(['delete-backlog', '--confirm'], { cwd: backlogRoot });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');

    const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
    assert.equal(parsed.error.code, 'BE_INTERNAL_STATE_CORRUPT');
    assert.equal(await readFile(path.join(backlogRoot, 'README.txt'), 'utf8'), 'keep me\n');
    RootMarkerFileSchema.parse(
      JSON.parse(await readFile(path.join(backlogRoot, '.backlog.json'), 'utf8')) as unknown,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('delete-backlog --confirm rejects symlinked managed entries and preserves the backlog root', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const escapedDir = path.join(tempRoot, 'outside-packets');

  try {
    const initResult = runBuiltCli(['init', '--path', backlogRoot]);
    assert.equal(initResult.status, 0);
    await mkdir(escapedDir, { recursive: true });
    await rm(path.join(backlogRoot, 'packets'), { recursive: true, force: true });
    await symlink(escapedDir, path.join(backlogRoot, 'packets'), 'dir');

    const result = runBuiltCli(['delete-backlog', '--confirm'], { cwd: backlogRoot });

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');

    const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
    assert.equal(parsed.error.code, 'BE_INTERNAL_STATE_CORRUPT');
    RootMarkerFileSchema.parse(
      JSON.parse(await readFile(path.join(backlogRoot, '.backlog.json'), 'utf8')) as unknown,
    );
    assert.equal((await lstat(path.join(backlogRoot, 'packets'))).isSymbolicLink(), true);
    assert.equal((await lstat(escapedDir)).isDirectory(), true);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('delete-backlog --confirm rejects roots whose marker is not owned by this tool', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');

  try {
    const initResult = runBuiltCli(['init', '--path', backlogRoot]);
    assert.equal(initResult.status, 0);
    await writeFile(
      path.join(backlogRoot, '.backlog.json'),
      JSON.stringify(
        {
          schema_version: 1,
          tool_name: '@other/tool',
          created_at: '2026-04-06T12:00:00.000Z',
          layout_version: 1,
        },
        null,
        2,
      ),
      'utf8',
    );

    const result = runBuiltCli(['delete-backlog', '--confirm'], { cwd: backlogRoot });

    assert.equal(result.status, 5);
    assert.equal(result.stdout, '');

    const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
    assert.equal(parsed.error.code, 'BE_ROOT_NOT_FOUND');
    RootMarkerFileSchema.parse(
      JSON.parse(await readFile(path.join(backlogRoot, '.backlog.json'), 'utf8')) as unknown,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('init creates backlog root and returns normalized output paths', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');

  try {
    const result = runBuiltCli(['init', '--path', backlogRoot]);

    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');

    const parsed = InitCommandOutputSchema.parse(parseStdoutJson(result));
    assert.equal(parsed.path, backlogRoot);
    assert.equal(parsed.root_marker_path, path.join(backlogRoot, '.backlog.json'));
    assert.equal(parsed.agents_path, path.join(backlogRoot, 'AGENTS.md'));

    RootMarkerFileSchema.parse(
      JSON.parse(await readFile(path.join(backlogRoot, '.backlog.json'), 'utf8')) as unknown,
    );
    SourceRegistryFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'sources.json'), 'utf8'),
      ) as unknown,
    );
    AppliedRegistryFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'applied.json'), 'utf8'),
      ) as unknown,
    );
    StateFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      ) as unknown,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('init fails on non-empty directory without backlog marker', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  await mkdir(backlogRoot, { recursive: true });
  await writeFile(path.join(backlogRoot, 'README.md'), '# notes\n', 'utf8');

  try {
    const result = runBuiltCli(['init', '--path', backlogRoot]);

    assert.equal(result.status, 4);
    assert.equal(result.stdout, '');

    const parsed = ErrorPayloadSchema.parse(parseStderrJson(result));
    assert.equal(parsed.error.code, 'BE_ROOT_NOT_EMPTY');
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
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
        host: {
          resolveCliPath(inputPath) {
            return path.resolve('/tmp/backlog', inputPath);
          },
          nowIsoUtc() {
            return '2026-04-06T12:00:00.000Z';
          },
        },
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
