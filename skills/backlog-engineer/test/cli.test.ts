import assert from 'node:assert/strict';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cp, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import {
  AttentionCommandOutputSchema,
  CommandHelpOutputSchema,
  DeleteBacklogCommandOutputSchema,
  ErrorPayloadSchema,
  GapsCommandOutputSchema,
  GlobalHelpOutputSchema,
  InitCommandOutputSchema,
  ItemsCommandOutputSchema,
  ListSourcesCommandOutputSchema,
  QueueCommandOutputSchema,
  RefreshCommandOutputSchema,
  RegisterSourceCommandOutputSchema,
  RootMarkerFileSchema,
  SearchCommandOutputSchema,
  SourceRegistryFileSchema,
  StatusCommandOutputSchema,
  TemplateCommandOutputSchema,
  VersionOutputSchema,
  StateFileSchema,
  AppliedRegistryFileSchema,
} from '../src/schemas/index.ts';
import { runCli as runCliSource } from '../src/cli/run-cli.ts';
import type { AnyCommandDefinition, CliIo } from '../src/commands/index.ts';
import type { RuntimeModule } from '../src/runtime/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const CLI_PATH = path.join(SKILL_DIR, 'scripts', 'backlog-engineer.mjs');
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-cli-'));
}

async function copyBacklogFixture(fixtureName: string, targetRoot: string): Promise<void> {
  await cp(path.join(FIXTURES_DIR, 'backlogs', fixtureName), targetRoot, {
    recursive: true,
  });
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

void test('register-source and list-sources work on the built CLI', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const docsDir = path.join(tempRoot, 'docs', 'modules');

  try {
    assert.equal(runBuiltCli(['init', '--path', backlogRoot]).status, 0);
    await mkdir(docsDir, { recursive: true });
    await writeFile(path.join(docsDir, 'auth.md'), '# auth\n', 'utf8');
    await writeFile(path.join(docsDir, 'session-ui.md'), '# session\n', 'utf8');

    const registerAuth = runBuiltCli(
      [
        'register-source',
        '--path',
        '../docs/modules/auth.md',
        '--kind',
        'module',
        '--authority',
        'authoritative',
      ],
      { cwd: backlogRoot },
    );
    const registerSession = runBuiltCli(
      [
        'register-source',
        '--path',
        '../docs/modules/session-ui.md',
        '--kind',
        'module',
        '--authority',
        'authoritative',
      ],
      { cwd: backlogRoot },
    );

    assert.equal(registerAuth.status, 0);
    assert.equal(registerSession.status, 0);

    const authOutput = RegisterSourceCommandOutputSchema.parse(parseStdoutJson(registerAuth));
    assert.equal(authOutput.source_label, '../docs/modules/auth.md');

    const listed = runBuiltCli(['list-sources'], { cwd: backlogRoot });
    assert.equal(listed.status, 0);
    assert.deepEqual(
      ListSourcesCommandOutputSchema.parse(parseStdoutJson(listed)).map(
        (source) => source.source_label,
      ),
      ['../docs/modules/auth.md', '../docs/modules/session-ui.md'],
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('mutating commands fail with BE_MUTATION_LOCKED when backlog lock file already exists', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const docsDir = path.join(tempRoot, 'docs');

  try {
    assert.equal(runBuiltCli(['init', '--path', backlogRoot]).status, 0);
    await mkdir(docsDir, { recursive: true });
    await writeFile(path.join(docsDir, 'auth.md'), '# auth\n', 'utf8');
    await writeFile(
      path.join(backlogRoot, '.backlog', 'mutation.lock'),
      '{"command":"register-source"}\n',
      'utf8',
    );

    const registerResult = runBuiltCli(
      [
        'register-source',
        '--path',
        '../docs/auth.md',
        '--kind',
        'module',
        '--authority',
        'authoritative',
      ],
      { cwd: backlogRoot },
    );

    assert.equal(registerResult.status, 7);
    const registerError = ErrorPayloadSchema.parse(parseStderrJson(registerResult));
    assert.equal(registerError.error.code, 'BE_MUTATION_LOCKED');
    assert.equal(
      registerError.error.details?.lock_path,
      path.join(backlogRoot, '.backlog', 'mutation.lock'),
    );

    const refreshStatusResult = runBuiltCli(['status', '--refresh'], { cwd: backlogRoot });
    assert.equal(refreshStatusResult.status, 7);
    const refreshStatusError = ErrorPayloadSchema.parse(parseStderrJson(refreshStatusResult));
    assert.equal(refreshStatusError.error.code, 'BE_MUTATION_LOCKED');

    const plainStatusResult = runBuiltCli(['status'], { cwd: backlogRoot });
    assert.equal(plainStatusResult.status, 0);
    StatusCommandOutputSchema.parse(parseStdoutJson(plainStatusResult));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('mutation lock is removed after a mutating command fails', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const docsDir = path.join(tempRoot, 'docs');

  try {
    assert.equal(runBuiltCli(['init', '--path', backlogRoot]).status, 0);
    await mkdir(docsDir, { recursive: true });

    const failedRegister = runBuiltCli(
      [
        'register-source',
        '--path',
        '../docs/missing.md',
        '--kind',
        'module',
        '--authority',
        'authoritative',
      ],
      { cwd: backlogRoot },
    );

    assert.notEqual(failedRegister.status, 0);
    assert.equal(await lstat(path.join(backlogRoot, '.backlog')).then(() => true), true);
    await assert.rejects(lstat(path.join(backlogRoot, '.backlog', 'mutation.lock')), /ENOENT/);

    await writeFile(path.join(docsDir, 'missing.md'), '# now present\n', 'utf8');
    const successfulRegister = runBuiltCli(
      [
        'register-source',
        '--path',
        '../docs/missing.md',
        '--kind',
        'module',
        '--authority',
        'authoritative',
      ],
      { cwd: backlogRoot },
    );

    assert.equal(successfulRegister.status, 0);
    RegisterSourceCommandOutputSchema.parse(parseStdoutJson(successfulRegister));
    await assert.rejects(lstat(path.join(backlogRoot, '.backlog', 'mutation.lock')), /ENOENT/);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('template packet and template patch write draft files through the built CLI', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const fixtureBacklogRoot = path.join(tempRoot, 'fixture-backlog');

  try {
    assert.equal(runBuiltCli(['init', '--path', backlogRoot]).status, 0);

    const packetTemplate = runBuiltCli(['template', 'packet', '--out', './drafts/'], {
      cwd: backlogRoot,
    });
    assert.equal(packetTemplate.status, 0);
    const packetOutput = TemplateCommandOutputSchema.parse(parseStdoutJson(packetTemplate));
    assert.equal(
      packetOutput.output_path,
      path.join(backlogRoot, 'drafts', 'packet.template.json'),
    );

    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), fixtureBacklogRoot, {
      recursive: true,
    });

    const patchTemplate = runBuiltCli(
      ['template', 'patch', '--item-keys', 'auth-core', '--out', './drafts/'],
      { cwd: fixtureBacklogRoot },
    );
    assert.equal(patchTemplate.status, 0);
    const patchOutput = TemplateCommandOutputSchema.parse(parseStdoutJson(patchTemplate));
    assert.equal(
      patchOutput.output_path,
      path.join(fixtureBacklogRoot, 'drafts', '002-patch.template.json'),
    );
    const patchDraft = JSON.parse(await readFile(patchOutput.output_path, 'utf8')) as {
      metadata: {
        patch_id: string;
        created_at: string;
        sequence: number;
        target_item_keys: string[];
      };
      operations: unknown[];
    };
    assert.match(
      patchDraft.metadata.patch_id,
      /^\d{4}-\d{2}-\d{2}-002-patch-template-[a-f0-9]{8}$/,
    );
    assert.match(patchDraft.metadata.created_at, /^\d{4}-\d{2}-\d{2}T.*Z$/);
    assert.equal(patchDraft.metadata.sequence, 2);
    assert.deepEqual(patchDraft.metadata.target_item_keys, ['auth-core']);
    assert.deepEqual(patchDraft.operations, []);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('template patch rebuilds missing state.json through the built CLI', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    await rm(path.join(backlogRoot, '.backlog', 'state.json'));

    const result = runBuiltCli(
      ['template', 'patch', '--item-keys', 'auth-core', '--out', './drafts/'],
      { cwd: backlogRoot },
    );

    assert.equal(result.status, 0);
    const output = TemplateCommandOutputSchema.parse(parseStdoutJson(result));
    assert.equal(output.output_path, path.join(backlogRoot, 'drafts', '002-patch.template.json'));
    StateFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      ) as unknown,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('list-sources and template patch reject symlinked managed JSON artifacts on the built CLI', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const docsDir = path.join(backlogRoot, 'sources', 'docs', 'modules');

  try {
    assert.equal(runBuiltCli(['init', '--path', backlogRoot]).status, 0);
    await mkdir(docsDir, { recursive: true });
    await writeFile(path.join(docsDir, 'auth.md'), '# auth\n', 'utf8');

    const registerResult = runBuiltCli(
      [
        'register-source',
        '--path',
        './sources/docs/modules/auth.md',
        '--kind',
        'module',
        '--authority',
        'authoritative',
      ],
      { cwd: backlogRoot },
    );
    assert.equal(registerResult.status, 0);

    const escapedSourcesPath = path.join(tempRoot, 'escaped-sources.json');
    const escapedStatePath = path.join(tempRoot, 'escaped-state.json');
    await writeFile(
      escapedSourcesPath,
      await readFile(path.join(backlogRoot, '.backlog', 'sources.json'), 'utf8'),
      'utf8',
    );
    await writeFile(
      escapedStatePath,
      await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      'utf8',
    );
    await rm(path.join(backlogRoot, '.backlog', 'sources.json'));
    await rm(path.join(backlogRoot, '.backlog', 'state.json'));
    await symlink(escapedSourcesPath, path.join(backlogRoot, '.backlog', 'sources.json'), 'file');
    await symlink(escapedStatePath, path.join(backlogRoot, '.backlog', 'state.json'), 'file');

    const listResult = runBuiltCli(['list-sources'], { cwd: backlogRoot });
    assert.equal(listResult.status, 1);
    assert.equal(
      ErrorPayloadSchema.parse(parseStderrJson(listResult)).error.code,
      'BE_INTERNAL_STATE_CORRUPT',
    );

    const templateResult = runBuiltCli(
      ['template', 'patch', '--item-keys', 'auth-core', '--out', './drafts/'],
      { cwd: backlogRoot },
    );
    assert.equal(templateResult.status, 1);
    assert.equal(
      ErrorPayloadSchema.parse(parseStderrJson(templateResult)).error.code,
      'BE_INTERNAL_STATE_CORRUPT',
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('refresh --source-path updates source registry and state on the built CLI', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await writeFile(
      path.join(backlogRoot, 'sources', 'docs', 'modules', 'auth.md'),
      await readFile(
        path.join(
          FIXTURES_DIR,
          'backlogs',
          'refreshable-backlog',
          'sources',
          'docs',
          'modules',
          'auth.v2.md',
        ),
        'utf8',
      ),
      'utf8',
    );

    const result = runBuiltCli(['refresh', '--source-path', './sources/docs/modules/auth.md'], {
      cwd: backlogRoot,
    });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');

    const output = RefreshCommandOutputSchema.parse(parseStdoutJson(result));
    assert.equal(output.counts.changed_sources, 1);
    assert.deepEqual(
      output.changed_sources.map((source) => source.source_label),
      ['sources/docs/modules/auth.md'],
    );

    const state = StateFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      ) as unknown,
    );
    const sourceRegistry = SourceRegistryFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'sources.json'), 'utf8'),
      ) as unknown,
    );
    const authSource = sourceRegistry.sources.find(
      (source) => source.source_label === 'sources/docs/modules/auth.md',
    );

    assert.ok(state.last_refresh_at);
    assert.ok(authSource);
    assert.notEqual(
      authSource?.hash,
      'bd9499983cfceaa0aa7cf63e29e832c141d1ff9b20f2da9d658d8cf3da605b65',
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('refresh --source-path rejects an unregistered source path on the built CLI', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);

    const result = runBuiltCli(['refresh', '--source-path', './sources/docs/modules/missing.md'], {
      cwd: backlogRoot,
    });

    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, '');

    const errorPayload = ErrorPayloadSchema.parse(parseStderrJson(result));
    assert.equal(errorPayload.error.code, 'BE_SOURCE_NOT_FOUND');
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('status --refresh runs refresh first on the built CLI', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await writeFile(
      path.join(backlogRoot, 'sources', 'docs', 'modules', 'auth.md'),
      await readFile(
        path.join(
          FIXTURES_DIR,
          'backlogs',
          'refreshable-backlog',
          'sources',
          'docs',
          'modules',
          'auth.v2.md',
        ),
        'utf8',
      ),
      'utf8',
    );

    const result = runBuiltCli(['status', '--refresh'], { cwd: backlogRoot });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');

    const output = StatusCommandOutputSchema.parse(parseStdoutJson(result));
    assert.equal(output.total_items, 4);
    assert.ok(output.open_todo_count > 0);
    assert.ok(output.last_refresh_at);

    const state = StateFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      ) as unknown,
    );
    assert.equal(state.last_refresh_at, output.last_refresh_at);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('status rebuilds missing state.json through hidden maintenance rebuild on the built CLI', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await rm(path.join(backlogRoot, '.backlog', 'state.json'));

    const result = runBuiltCli(['status'], { cwd: backlogRoot });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');

    const status = StatusCommandOutputSchema.parse(parseStdoutJson(result));
    assert.equal(status.total_items, 4);

    const rebuiltState = StateFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      ) as unknown,
    );
    assert.equal(rebuiltState.items.length, 4);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('items, search, gaps, queue, and attention work on the built CLI', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');

  try {
    await copyBacklogFixture('todo-dedup-backlog', backlogRoot);

    const itemsResult = runBuiltCli(
      ['items', '--item-keys', 'session-ui-timeout-banner,auth-core'],
      { cwd: backlogRoot },
    );
    assert.equal(itemsResult.status, 0);
    assert.deepEqual(
      ItemsCommandOutputSchema.parse(parseStdoutJson(itemsResult)).map(
        (entry) => entry.item.item_key,
      ),
      ['session-ui-timeout-banner', 'auth-core'],
    );

    const searchResult = runBuiltCli(['search', '--needs-attention', 'true'], {
      cwd: backlogRoot,
    });
    assert.equal(searchResult.status, 0);
    assert.deepEqual(
      SearchCommandOutputSchema.parse(parseStdoutJson(searchResult)).map((entry) => entry.item_key),
      ['auth-session-timeout-audit', 'session-ui-timeout-banner'],
    );

    const gapsResult = runBuiltCli(['gaps'], { cwd: backlogRoot });
    assert.equal(gapsResult.status, 0);
    assert.deepEqual(
      GapsCommandOutputSchema.parse(parseStdoutJson(gapsResult)).map((entry) => entry.item_key),
      ['auth-session-timeout-audit'],
    );

    const queueFixtureRoot = path.join(tempRoot, 'queue-backlog');
    await copyBacklogFixture('refreshable-backlog', queueFixtureRoot);

    const queueResult = runBuiltCli(['queue'], { cwd: queueFixtureRoot });
    assert.equal(queueResult.status, 0);
    assert.deepEqual(
      QueueCommandOutputSchema.parse(parseStdoutJson(queueResult)).map(
        (entry) => entry.root_item_key,
      ),
      ['auth-core'],
    );

    const attentionResult = runBuiltCli(['attention'], { cwd: backlogRoot });
    assert.equal(attentionResult.status, 0);
    assert.deepEqual(
      AttentionCommandOutputSchema.parse(parseStdoutJson(attentionResult)).map(
        (entry) => entry.item_key,
      ),
      ['session-ui-timeout-banner', 'auth-session-timeout-audit'],
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
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
      deleted_path: backlogRoot,
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

void test('delete-backlog --confirm preserves user gitignore content and removes only the managed section', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');

  try {
    const initResult = runBuiltCli(['init', '--path', backlogRoot]);
    assert.equal(initResult.status, 0);
    await writeFile(
      path.join(backlogRoot, '.gitignore'),
      [
        'node_modules/',
        '# backlog-engineer managed start',
        '/.backlog/mutation.lock',
        '# backlog-engineer managed end',
        '',
      ].join('\n'),
      'utf8',
    );

    const result = runBuiltCli(['delete-backlog', '--confirm'], { cwd: backlogRoot });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');
    assert.deepEqual(DeleteBacklogCommandOutputSchema.parse(parseStdoutJson(result)), {
      deleted_path: backlogRoot,
      deleted: true,
    });
    assert.equal(await readFile(path.join(backlogRoot, '.gitignore'), 'utf8'), 'node_modules/\n');
    await assert.rejects(() => readFile(path.join(backlogRoot, '.backlog.json'), 'utf8'));
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
    getProcessCwd() {
      return '/tmp/runtime-cwd';
    },
    createContext() {
      return Promise.resolve({
        host: {
          resolveCliPath(inputPath) {
            return path.resolve('/tmp/backlog', inputPath);
          },
          readCliTextFile(inputPath) {
            return Promise.resolve({
              absolutePath: path.resolve('/tmp/backlog', inputPath),
              canonicalBasename: path.basename(String(inputPath)),
              rawContent: '',
            });
          },
          getProcessCwd() {
            return '/tmp';
          },
          chdir() {},
          nowIsoUtc() {
            return '2026-04-06T12:00:00.000Z';
          },
          createUuid() {
            return '11111111-1111-4111-8111-111111111111';
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
        acquireMutationLock: () => Promise.resolve(async () => {}),
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

void test('runCli uses injected runtime cwd when getCwd override is not provided', async () => {
  const captured: string[] = [];
  const command: AnyCommandDefinition = {
    name: 'status',
    summary: 'test command',
    usage: ['backlog-engineer status'],
    options: [],
    inputSchema: z.object({ refresh: z.boolean() }),
    outputSchema: z.object({ ok: z.literal(true) }),
    parseArgs: () => ({ refresh: false }),
    execute: () => Promise.resolve({ ok: true }),
  };
  const runtime: RuntimeModule = {
    getProcessCwd() {
      return '/tmp/runtime-only-cwd';
    },
    createContext(_command, cwd) {
      captured.push(cwd);
      return Promise.resolve({
        host: {
          resolveCliPath(inputPath) {
            return path.resolve('/tmp/runtime-only-cwd', inputPath);
          },
          readCliTextFile(inputPath) {
            return Promise.resolve({
              absolutePath: path.resolve('/tmp/runtime-only-cwd', inputPath),
              canonicalBasename: path.basename(String(inputPath)),
              rawContent: '',
            });
          },
          getProcessCwd() {
            return '/tmp/runtime-only-cwd';
          },
          chdir() {},
          nowIsoUtc() {
            return '2026-04-06T12:00:00.000Z';
          },
          createUuid() {
            return '11111111-1111-4111-8111-111111111111';
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
        hooks: {},
        ensureQueryState: () => Promise.reject(new Error('not used in cwd test')),
        ensureMutationState: () => Promise.reject(new Error('not used in cwd test')),
        acquireMutationLock: () => Promise.resolve(async () => {}),
      });
    },
    rebuildState: () => Promise.reject(new Error('not used in cwd test')),
  };
  const { cliIo } = createBufferingCliIo();

  const exitCode = await runCliSource(['status'], cliIo, '0.1.0-test', {
    findCommand: (name) => (name === 'status' ? command : undefined),
    createRuntime: () => runtime,
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(captured, ['/tmp/runtime-only-cwd']);
});
