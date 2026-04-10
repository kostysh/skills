import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { runCli as runCliSource } from '../src/cli/run-cli.ts';
import { INIT_COMMAND } from '../src/commands/init.ts';
import { PACKET_COMMAND } from '../src/commands/packet.ts';
import { PATCH_ITEM_COMMAND } from '../src/commands/patch-item.ts';
import { REGISTER_SOURCE_COMMAND } from '../src/commands/register-source.ts';
import { REMOVE_ITEM_COMMAND } from '../src/commands/remove-item.ts';
import { REMOVE_SOURCE_COMMAND } from '../src/commands/remove-source.ts';
import { UPDATE_SOURCE_PATH_COMMAND } from '../src/commands/update-source-path.ts';
import { BacklogError } from '../src/errors/index.ts';
import { createNoOpRegistry } from '../src/hooks/index.ts';
import { createNodePathPort, createRuntime } from '../src/runtime/index.ts';
import {
  AppliedRegistryFileSchema,
  ErrorPayloadSchema,
  PacketCommandOutputSchema,
  PatchItemCommandOutputSchema,
  RemoveItemCommandOutputSchema,
  RemoveSourceCommandOutputSchema,
  SourceRegistryFileSchema,
  StateFileSchema,
  UpdateSourcePathCommandOutputSchema,
} from '../src/schemas/index.ts';
import type { CliIo } from '../src/commands/index.ts';
import type { RuntimeModule } from '../src/runtime/index.ts';
import { createInMemoryFileSystemPort } from './support/in-memory-fs.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');
const AUTH_RUNTIME_UUID_VALUES = [
  '11111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
];

type InMemoryFsFaultRule = {
  op: 'writeText' | 'rename' | 'rm' | 'mkdir';
  path?: string;
  code: string;
  once?: boolean;
};

type InMemoryFsSeedEntry =
  | {
      path: string;
      type: 'file';
      content: string;
    }
  | {
      path: string;
      type: 'directory';
    };

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-mutation-command-'));
}

function createRuntimeForMutationTest(payload: {
  hooks?: ReturnType<typeof createNoOpRegistry>;
  uuidValues?: string[];
}) {
  let uuidIndex = 0;

  return createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
      uuid: {
        create() {
          const nextValue =
            payload.uuidValues?.[Math.min(uuidIndex, Math.max(payload.uuidValues.length - 1, 0))];
          uuidIndex += 1;

          return nextValue ?? `00000000-0000-4000-8000-${String(uuidIndex).padStart(12, '0')}`;
        },
      },
      ...(payload.hooks ? { hooks: payload.hooks } : {}),
    },
  });
}

function createInMemoryMutationRuntime(payload: {
  cwd?: string;
  hooks?: ReturnType<typeof createNoOpRegistry>;
  uuidValues?: string[];
  faults?: InMemoryFsFaultRule[];
  seed?: InMemoryFsSeedEntry[];
}) {
  let uuidIndex = 0;
  const cwd = payload.cwd ?? '/workspace';
  const fsOptions: {
    cwd: string;
    faults?: InMemoryFsFaultRule[];
    seed?: InMemoryFsSeedEntry[];
  } = {
    cwd,
  };
  if (payload.faults !== undefined) {
    fsOptions.faults = payload.faults;
  }
  if (payload.seed !== undefined) {
    fsOptions.seed = payload.seed;
  }
  const fs = createInMemoryFileSystemPort(fsOptions);
  const runtime = createRuntime({
    dependencies: {
      fs,
      path: createNodePathPort(),
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
      uuid: {
        create() {
          const nextValue =
            payload.uuidValues?.[Math.min(uuidIndex, Math.max(payload.uuidValues.length - 1, 0))];
          uuidIndex += 1;

          return nextValue ?? `00000000-0000-4000-8000-${String(uuidIndex).padStart(12, '0')}`;
        },
      },
      ...(payload.hooks ? { hooks: payload.hooks } : {}),
    },
  });

  return {
    cwd,
    fs,
    runtime,
  };
}

async function bootstrapBacklog(cwd: string, runtime = createRuntimeForMutationTest({})) {
  const initContext = await runtime.createContext('init', cwd);
  const backlogRoot = path.join(cwd, 'backlog');
  await INIT_COMMAND.execute({ path: './backlog' }, initContext);

  return {
    runtime,
    backlogRoot,
  };
}

async function copyFixtureText(relativePath: string): Promise<string> {
  return readFile(path.join(FIXTURES_DIR, relativePath), 'utf8');
}

async function writeFixtureFile(payload: {
  targetPath: string;
  fixtureRelativePath: string;
}): Promise<void> {
  await mkdir(path.dirname(payload.targetPath), {
    recursive: true,
  });
  await writeFile(payload.targetPath, await copyFixtureText(payload.fixtureRelativePath), 'utf8');
}

async function writeFixtureToInMemoryFile(payload: {
  fs: ReturnType<typeof createInMemoryFileSystemPort>;
  targetPath: string;
  fixtureRelativePath: string;
}): Promise<void> {
  await payload.fs.writeText(
    payload.targetPath,
    await copyFixtureText(payload.fixtureRelativePath),
  );
}

async function registerSourceFromFixture(payload: {
  runtime: ReturnType<typeof createRuntimeForMutationTest>;
  backlogRoot: string;
  sourceFixtureRelativePath: string;
  backlogRelativePath: string;
  authority: 'authoritative' | 'supporting';
  note?: string;
}): Promise<void> {
  const sourcePathOnDisk = path.join(payload.backlogRoot, payload.backlogRelativePath);
  await writeFixtureFile({
    targetPath: sourcePathOnDisk,
    fixtureRelativePath: payload.sourceFixtureRelativePath,
  });

  const context = await payload.runtime.createContext('register-source', payload.backlogRoot);
  await REGISTER_SOURCE_COMMAND.execute(
    {
      path: `./${payload.backlogRelativePath}`,
      kind: 'module',
      authority: payload.authority,
      ...(payload.note ? { note: payload.note } : {}),
    },
    context,
  );
}

async function readAppliedRegistry(backlogRoot: string) {
  return AppliedRegistryFileSchema.parse(
    JSON.parse(
      await readFile(path.join(backlogRoot, '.backlog', 'applied.json'), 'utf8'),
    ) as unknown,
  );
}

async function readState(backlogRoot: string) {
  return StateFileSchema.parse(
    JSON.parse(await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8')) as unknown,
  );
}

async function readSourceRegistry(backlogRoot: string) {
  return SourceRegistryFileSchema.parse(
    JSON.parse(
      await readFile(path.join(backlogRoot, '.backlog', 'sources.json'), 'utf8'),
    ) as unknown,
  );
}

function collectSourceIdsFromStateItem(
  item: ReturnType<typeof StateFileSchema.parse>['items'][number],
) {
  return [
    ...item.origin_source_ids,
    ...item.specification_source_ids,
    ...item.plan_source_ids,
    ...item.implementation_source_ids,
    ...item.test_source_ids,
  ];
}

async function listDirectory(dirPath: string): Promise<string[]> {
  try {
    return (await readdir(dirPath)).sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return [];
    }
    throw error;
  }
}

function withoutDryRun<T extends { dry_run: boolean }>(value: T): Omit<T, 'dry_run'> {
  const { dry_run, ...rest } = value;
  void dry_run;
  return rest;
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

function parseStdoutJson(stdoutBuffer: string[]): unknown {
  const output = stdoutBuffer.join('');
  assert.notEqual(output, '');
  return JSON.parse(output) as unknown;
}

function parseStderrJson(stderrBuffer: string[]): unknown {
  const output = stderrBuffer.join('');
  assert.notEqual(output, '');
  return JSON.parse(output) as unknown;
}

function createFixedBacklogRuntime(payload: {
  runtime: ReturnType<typeof createRuntimeForMutationTest>;
  backlogRoot: string;
}): RuntimeModule {
  return {
    getProcessCwd() {
      return payload.backlogRoot;
    },
    createContext(command) {
      return payload.runtime.createContext(command, payload.backlogRoot);
    },
    rebuildState(root) {
      return payload.runtime.rebuildState(root);
    },
  };
}

async function runCliWithRuntime(payload: { args: string[]; runtime: RuntimeModule }): Promise<{
  exitCode: number;
  stdoutBuffer: string[];
  stderrBuffer: string[];
}> {
  const { cliIo, stdoutBuffer, stderrBuffer } = createBufferingCliIo();
  const exitCode = await runCliSource(payload.args, cliIo, '0.1.0-test', {
    createRuntime: () => payload.runtime,
  });

  return {
    exitCode,
    stdoutBuffer,
    stderrBuffer,
  };
}

async function bootstrapAuthBacklog(payload: {
  runtime: ReturnType<typeof createRuntimeForMutationTest>;
  cwd: string;
}): Promise<{
  backlogRoot: string;
  packetPath: string;
  patchPath: string;
}> {
  const { backlogRoot } = await bootstrapBacklog(payload.cwd, payload.runtime);
  await registerSourceFromFixture({
    runtime: payload.runtime,
    backlogRoot,
    sourceFixtureRelativePath: 'sources/docs/modules/auth.v1.md',
    backlogRelativePath: 'sources/docs/modules/auth.md',
    authority: 'authoritative',
    note: 'Auth module architecture',
  });

  const packetPath = path.join(backlogRoot, 'drafts', 'auth-module.packet.json');
  await writeFixtureFile({
    targetPath: packetPath,
    fixtureRelativePath: 'authored/packets/auth-module.packet.json',
  });

  const patchPath = path.join(backlogRoot, 'drafts', 'auth-module.patch-item.json');
  await writeFixtureFile({
    targetPath: patchPath,
    fixtureRelativePath: 'authored/patches/auth-module.patch-item.json',
  });

  return {
    backlogRoot,
    packetPath,
    patchPath,
  };
}

async function seedAuthPacket(payload: {
  runtime: ReturnType<typeof createRuntimeForMutationTest>;
  backlogRoot: string;
  packetPath: string;
}): Promise<void> {
  const packetContext = await payload.runtime.createContext('packet', payload.backlogRoot);
  await PACKET_COMMAND.execute(
    {
      path: `./${path.relative(payload.backlogRoot, payload.packetPath).split(path.sep).join('/')}`,
      dry_run: false,
    },
    packetContext,
  );
}

void test('packet command applies a packet, persists canonical imports, and skips persistence during dry-run', async () => {
  const cwd = await createTempDir();
  const hooks = createNoOpRegistry();
  const afterPacketAppliedCalls: Array<{
    summary: ReturnType<typeof PacketCommandOutputSchema.parse>;
    stateItemKeys: string[];
  }> = [];
  hooks.afterPacketApplied = ({ summary, state }) => {
    afterPacketAppliedCalls.push({
      summary: PacketCommandOutputSchema.parse(summary),
      stateItemKeys: state.items
        .map((item) => item.item_key)
        .sort((left, right) => left.localeCompare(right)),
    });
    return Promise.resolve();
  };
  const runtime = createRuntimeForMutationTest({
    hooks,
    uuidValues: [
      '11111111-1111-4111-8111-111111111111',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    ],
  });

  try {
    const { backlogRoot } = await bootstrapBacklog(cwd, runtime);
    await registerSourceFromFixture({
      runtime,
      backlogRoot,
      sourceFixtureRelativePath: 'sources/docs/modules/auth.v1.md',
      backlogRelativePath: 'sources/docs/modules/auth.md',
      authority: 'authoritative',
      note: 'Auth module architecture',
    });

    const packetPath = path.join(backlogRoot, 'drafts', 'auth-module.packet.json');
    await writeFixtureFile({
      targetPath: packetPath,
      fixtureRelativePath: 'authored/packets/auth-module.packet.json',
    });

    const beforeApplied = await readFile(
      path.join(backlogRoot, '.backlog', 'applied.json'),
      'utf8',
    );
    const beforeState = await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8');

    const packetContext = await runtime.createContext('packet', backlogRoot);
    const dryRunOutput = PacketCommandOutputSchema.parse(
      await PACKET_COMMAND.execute(
        {
          path: './drafts/auth-module.packet.json',
          dry_run: true,
        },
        packetContext,
      ),
    );

    assert.deepEqual(dryRunOutput, {
      dry_run: true,
      authored_packet_path: packetPath,
      counts: {
        added: 3,
        removed: 0,
        todo_created: 0,
        todo_updated: 0,
      },
      added: ['auth-core', 'auth-session-timeout-audit', 'auth-session-timeout-enforcement'],
      removed: [],
      todo_created: [],
      todo_updated: [],
      next_commands: [],
    });
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'applied.json'), 'utf8'),
      beforeApplied,
    );
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      beforeState,
    );
    assert.deepEqual(await listDirectory(path.join(backlogRoot, 'packets')), []);
    assert.equal(afterPacketAppliedCalls.length, 0);

    const realOutput = PacketCommandOutputSchema.parse(
      await PACKET_COMMAND.execute(
        {
          path: './drafts/auth-module.packet.json',
          dry_run: false,
        },
        packetContext,
      ),
    );

    assert.deepEqual(withoutDryRun(realOutput), {
      ...withoutDryRun(dryRunOutput),
      canonical_packet_path: `${backlogRoot}/packets/2d764141a49f--auth-module.packet.json`,
      canonical_packet_purpose: 'immutable_import_copy',
    });
    assert.equal(realOutput.dry_run, false);

    const appliedRegistry = await readAppliedRegistry(backlogRoot);
    assert.equal(appliedRegistry.packets.length, 1);
    assert.equal(appliedRegistry.patches.length, 0);
    assert.equal(appliedRegistry.packets[0]?.packet_id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1');
    assert.equal(appliedRegistry.packets[0]?.item_keys.length, 3);
    assert.deepEqual(await listDirectory(path.join(backlogRoot, 'packets')), [
      appliedRegistry.packets[0]?.canonical_path.split('/')[1],
    ]);

    const nextState = await readState(backlogRoot);
    assert.deepEqual(
      nextState.items.map((item) => item.item_key).sort((left, right) => left.localeCompare(right)),
      ['auth-core', 'auth-session-timeout-audit', 'auth-session-timeout-enforcement'],
    );
    assert.equal(afterPacketAppliedCalls.length, 1);
    assert.deepEqual(afterPacketAppliedCalls[0]?.summary, realOutput);
    assert.deepEqual(afterPacketAppliedCalls[0]?.stateItemKeys, [
      'auth-core',
      'auth-session-timeout-audit',
      'auth-session-timeout-enforcement',
    ]);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('patch-item command applies patch semantics, persists canonical imports, and honors dry-run parity', async () => {
  const cwd = await createTempDir();
  const hooks = createNoOpRegistry();
  const afterPatchAppliedCalls: Array<ReturnType<typeof PatchItemCommandOutputSchema.parse>> = [];
  hooks.afterPatchApplied = ({ summary }) => {
    if ('updated' in summary) {
      afterPatchAppliedCalls.push(PatchItemCommandOutputSchema.parse(summary));
    }
    return Promise.resolve();
  };
  const runtime = createRuntimeForMutationTest({
    hooks,
    uuidValues: ['11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'],
  });

  try {
    const { backlogRoot } = await bootstrapBacklog(cwd, runtime);
    await registerSourceFromFixture({
      runtime,
      backlogRoot,
      sourceFixtureRelativePath: 'sources/docs/modules/auth.v1.md',
      backlogRelativePath: 'sources/docs/modules/auth.md',
      authority: 'authoritative',
      note: 'Auth module architecture',
    });
    const packetPath = path.join(backlogRoot, 'drafts', 'auth-module.packet.json');
    await writeFixtureFile({
      targetPath: packetPath,
      fixtureRelativePath: 'authored/packets/auth-module.packet.json',
    });
    const packetContext = await runtime.createContext('packet', backlogRoot);
    await PACKET_COMMAND.execute(
      {
        path: './drafts/auth-module.packet.json',
        dry_run: false,
      },
      packetContext,
    );

    const patchPath = path.join(backlogRoot, 'drafts', 'auth-module.patch-item.json');
    await writeFixtureFile({
      targetPath: patchPath,
      fixtureRelativePath: 'authored/patches/auth-module.patch-item.json',
    });

    const beforeApplied = await readFile(
      path.join(backlogRoot, '.backlog', 'applied.json'),
      'utf8',
    );
    const beforeState = await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8');
    const beforePatchFiles = await listDirectory(path.join(backlogRoot, 'patches'));

    const patchContext = await runtime.createContext('patch-item', backlogRoot);
    const dryRunOutput = PatchItemCommandOutputSchema.parse(
      await PATCH_ITEM_COMMAND.execute(
        {
          patch: './drafts/auth-module.patch-item.json',
          dry_run: true,
        },
        patchContext,
      ),
    );

    assert.deepEqual(dryRunOutput, {
      dry_run: true,
      counts: {
        updated: 2,
        todo_created: 1,
        todo_updated: 0,
        todo_removed: 0,
      },
      updated: ['auth-core', 'auth-session-timeout-enforcement'],
      todo_created: ['auth-session-timeout-audit'],
      todo_updated: [],
      todo_removed: [],
      next_commands: [
        {
          command: 'attention',
          args: [],
          reason: 'Review tasks affected by the patch.',
        },
        {
          command: 'items',
          args: ['--item-keys', 'auth-session-timeout-audit'],
          reason: 'Inspect full cards of directly changed tasks.',
        },
      ],
    });
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'applied.json'), 'utf8'),
      beforeApplied,
    );
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      beforeState,
    );
    assert.deepEqual(await listDirectory(path.join(backlogRoot, 'patches')), beforePatchFiles);
    assert.equal(afterPatchAppliedCalls.length, 0);

    const realOutput = PatchItemCommandOutputSchema.parse(
      await PATCH_ITEM_COMMAND.execute(
        {
          patch: './drafts/auth-module.patch-item.json',
          dry_run: false,
        },
        patchContext,
      ),
    );

    assert.deepEqual(withoutDryRun(realOutput), withoutDryRun(dryRunOutput));
    assert.equal(realOutput.dry_run, false);

    const appliedRegistry = await readAppliedRegistry(backlogRoot);
    assert.equal(appliedRegistry.patches.length, 1);
    assert.equal(appliedRegistry.patches[0]?.patch_id, '2026-04-03-001-auth-progress');
    assert.equal(appliedRegistry.patches[0]?.kind, 'patch-item');
    assert.deepEqual(await listDirectory(path.join(backlogRoot, 'patches')), [
      appliedRegistry.patches[0]?.canonical_path.split('/')[1],
    ]);

    const nextState = await readState(backlogRoot);
    assert.equal(
      nextState.items.find((item) => item.item_key === 'auth-core')?.delivery_state,
      'specified',
    );
    assert.equal(
      nextState.items.find((item) => item.item_key === 'auth-session-timeout-enforcement')
        ?.delivery_state,
      'specified',
    );
    assert.deepEqual(
      nextState.items.find((item) => item.item_key === 'auth-session-timeout-enforcement')?.gaps ??
        [],
      [],
    );

    assert.equal(afterPatchAppliedCalls.length, 1);
    assert.deepEqual(afterPatchAppliedCalls[0], realOutput);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('update-source-path keeps source_id stable and creates no review todo when hash is unchanged', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({
    uuidValues: AUTH_RUNTIME_UUID_VALUES,
  });

  try {
    const { backlogRoot } = await bootstrapBacklog(cwd, runtime);
    await registerSourceFromFixture({
      runtime,
      backlogRoot,
      sourceFixtureRelativePath: 'sources/docs/modules/auth.v1.md',
      backlogRelativePath: 'sources/docs/modules/auth.md',
      authority: 'authoritative',
      note: 'Auth module architecture',
    });
    await writeFixtureFile({
      targetPath: path.join(backlogRoot, 'sources/docs/modules/auth-renamed.md'),
      fixtureRelativePath: 'sources/docs/modules/auth.v1.md',
    });

    const beforeRegistry = await readFile(
      path.join(backlogRoot, '.backlog', 'sources.json'),
      'utf8',
    );
    const beforeState = await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8');

    const dryRunOutput = UpdateSourcePathCommandOutputSchema.parse(
      await UPDATE_SOURCE_PATH_COMMAND.execute(
        {
          selector: {
            kind: 'source_id',
            source_id: '11111111-1111-4111-8111-111111111111',
          },
          new_path: './sources/docs/modules/auth-renamed.md',
          dry_run: true,
        },
        await runtime.createContext('update-source-path', backlogRoot),
      ),
    );

    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'sources.json'), 'utf8'),
      beforeRegistry,
    );
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      beforeState,
    );

    const updateOutput = UpdateSourcePathCommandOutputSchema.parse(
      await UPDATE_SOURCE_PATH_COMMAND.execute(
        {
          selector: {
            kind: 'source_id',
            source_id: '11111111-1111-4111-8111-111111111111',
          },
          new_path: './sources/docs/modules/auth-renamed.md',
          dry_run: false,
        },
        await runtime.createContext('update-source-path', backlogRoot),
      ),
    );

    assert.deepEqual(withoutDryRun(updateOutput), withoutDryRun(dryRunOutput));
    assert.equal(updateOutput.source_id, '11111111-1111-4111-8111-111111111111');
    assert.equal(updateOutput.source_label, 'sources/docs/modules/auth-renamed.md');
    assert.equal(
      updateOutput.previous_path,
      path.join(backlogRoot, 'sources/docs/modules/auth.md'),
    );
    assert.equal(updateOutput.path, path.join(backlogRoot, 'sources/docs/modules/auth-renamed.md'));
    assert.equal(updateOutput.hash_changed, false);
    assert.deepEqual(updateOutput.counts, {
      changed_sources: 1,
      todo_created: 0,
      todo_updated: 0,
      todo_removed: 0,
    });

    const registry = await readSourceRegistry(backlogRoot);
    assert.equal(registry.sources.length, 1);
    assert.equal(registry.sources[0]?.source_id, '11111111-1111-4111-8111-111111111111');
    assert.equal(registry.sources[0]?.path, 'sources/docs/modules/auth-renamed.md');
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('update-source-path rewrites source labels in existing todo messages when hash is unchanged', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({
    uuidValues: AUTH_RUNTIME_UUID_VALUES,
  });

  try {
    const { backlogRoot, packetPath } = await bootstrapAuthBacklog({
      runtime,
      cwd,
    });
    await seedAuthPacket({
      runtime,
      backlogRoot,
      packetPath,
    });
    await writeFixtureFile({
      targetPath: path.join(backlogRoot, 'sources/docs/modules/auth-renamed.md'),
      fixtureRelativePath: 'sources/docs/modules/auth.v1.md',
    });

    const todoId = '77777777-7777-4777-8777-777777777777';
    const state = await readState(backlogRoot);
    const stateWithTodo = StateFileSchema.parse({
      ...state,
      todos: [
        ...state.todos,
        {
          todo_id: todoId,
          item_key: 'auth-core',
          type: 'review_source_change',
          managed_by: 'mutation',
          message: 'Review source change: sources/docs/modules/auth.md.',
          created_at: '2026-04-06T11:00:00.000Z',
          related_sources: [
            {
              source_id: '11111111-1111-4111-8111-111111111111',
              source_label: 'sources/docs/modules/auth.md',
            },
          ],
          related_item_keys: [],
        },
      ],
      items: state.items.map((item) =>
        item.item_key === 'auth-core'
          ? {
              ...item,
              open_todo_ids: [...item.open_todo_ids, todoId],
              needs_attention: true,
            }
          : item,
      ),
    });
    await writeFile(
      path.join(backlogRoot, '.backlog', 'state.json'),
      `${JSON.stringify(stateWithTodo, null, 2)}\n`,
      'utf8',
    );

    const output = UpdateSourcePathCommandOutputSchema.parse(
      await UPDATE_SOURCE_PATH_COMMAND.execute(
        {
          selector: {
            kind: 'source_id',
            source_id: '11111111-1111-4111-8111-111111111111',
          },
          new_path: './sources/docs/modules/auth-renamed.md',
          dry_run: false,
        },
        await runtime.createContext('update-source-path', backlogRoot),
      ),
    );

    assert.equal(output.hash_changed, false);
    assert.deepEqual(output.counts, {
      changed_sources: 1,
      todo_created: 0,
      todo_updated: 1,
      todo_removed: 0,
    });
    assert.deepEqual(output.todo_updated, ['auth-core']);
    assert.deepEqual(output.next_commands, []);
    const nextState = await readState(backlogRoot);
    const todo = nextState.todos.find((candidate) => candidate.todo_id === todoId);
    assert.equal(todo?.message, 'Review source change: sources/docs/modules/auth-renamed.md.');
    assert.deepEqual(todo?.related_sources, [
      {
        source_id: '11111111-1111-4111-8111-111111111111',
        source_label: 'sources/docs/modules/auth-renamed.md',
      },
    ]);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('update-source-path treats equivalent normalized paths as a no-op', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({
    uuidValues: AUTH_RUNTIME_UUID_VALUES,
  });

  try {
    const { backlogRoot } = await bootstrapBacklog(cwd, runtime);
    await registerSourceFromFixture({
      runtime,
      backlogRoot,
      sourceFixtureRelativePath: 'sources/docs/modules/auth.v1.md',
      backlogRelativePath: 'sources/docs/modules/auth.md',
      authority: 'authoritative',
    });

    const beforeRegistry = await readFile(
      path.join(backlogRoot, '.backlog', 'sources.json'),
      'utf8',
    );
    const beforeState = await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8');

    const output = UpdateSourcePathCommandOutputSchema.parse(
      await UPDATE_SOURCE_PATH_COMMAND.execute(
        {
          selector: {
            kind: 'source_path',
            source_path: './sources/docs/modules/auth.md',
          },
          new_path: './sources/docs/modules/../modules/auth.md',
          dry_run: false,
        },
        await runtime.createContext('update-source-path', backlogRoot),
      ),
    );

    assert.equal(output.hash_changed, false);
    assert.deepEqual(output.counts, {
      changed_sources: 0,
      todo_created: 0,
      todo_updated: 0,
      todo_removed: 0,
    });
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'sources.json'), 'utf8'),
      beforeRegistry,
    );
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      beforeState,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('update-source-path supports external source relocation', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({
    uuidValues: AUTH_RUNTIME_UUID_VALUES,
  });

  try {
    const { backlogRoot } = await bootstrapBacklog(cwd, runtime);
    const docsRoot = path.join(cwd, 'docs');
    await writeFixtureFile({
      targetPath: path.join(docsRoot, 'auth.md'),
      fixtureRelativePath: 'sources/docs/modules/auth.v1.md',
    });
    await writeFixtureFile({
      targetPath: path.join(docsRoot, 'moved', 'auth.md'),
      fixtureRelativePath: 'sources/docs/modules/auth.v1.md',
    });

    const registerContext = await runtime.createContext('register-source', backlogRoot);
    await REGISTER_SOURCE_COMMAND.execute(
      {
        path: '../docs/auth.md',
        kind: 'module',
        authority: 'authoritative',
      },
      registerContext,
    );

    const output = UpdateSourcePathCommandOutputSchema.parse(
      await UPDATE_SOURCE_PATH_COMMAND.execute(
        {
          selector: {
            kind: 'source_path',
            source_path: '../docs/auth.md',
          },
          new_path: '../docs/moved/auth.md',
          dry_run: false,
        },
        await runtime.createContext('update-source-path', backlogRoot),
      ),
    );

    assert.equal(output.source_label, '../docs/moved/auth.md');
    assert.equal(output.path, path.join(docsRoot, 'moved', 'auth.md'));
    const registry = await readSourceRegistry(backlogRoot);
    assert.equal(registry.sources[0]?.path, '../docs/moved/auth.md');
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('update-source-path applies scoped refresh semantics when moved source content changed', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({
    uuidValues: [
      ...AUTH_RUNTIME_UUID_VALUES,
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
      'ffffffff-ffff-4fff-8fff-fffffffffff1',
      '99999999-9999-4999-8999-999999999991',
      '99999999-9999-4999-8999-999999999992',
    ],
  });

  try {
    const { backlogRoot, packetPath } = await bootstrapAuthBacklog({
      runtime,
      cwd,
    });
    await seedAuthPacket({
      runtime,
      backlogRoot,
      packetPath,
    });
    await writeFixtureFile({
      targetPath: path.join(backlogRoot, 'sources/docs/modules/auth-v2.md'),
      fixtureRelativePath: 'sources/docs/modules/auth.v2.md',
    });

    const beforeRegistry = await readFile(
      path.join(backlogRoot, '.backlog', 'sources.json'),
      'utf8',
    );
    const beforeState = await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8');

    const dryRunOutput = UpdateSourcePathCommandOutputSchema.parse(
      await UPDATE_SOURCE_PATH_COMMAND.execute(
        {
          selector: {
            kind: 'source_path',
            source_path: './sources/docs/modules/auth.md',
          },
          new_path: './sources/docs/modules/auth-v2.md',
          dry_run: true,
        },
        await runtime.createContext('update-source-path', backlogRoot),
      ),
    );

    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'sources.json'), 'utf8'),
      beforeRegistry,
    );
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      beforeState,
    );

    const output = UpdateSourcePathCommandOutputSchema.parse(
      await UPDATE_SOURCE_PATH_COMMAND.execute(
        {
          selector: {
            kind: 'source_path',
            source_path: './sources/docs/modules/auth.md',
          },
          new_path: './sources/docs/modules/auth-v2.md',
          dry_run: false,
        },
        await runtime.createContext('update-source-path', backlogRoot),
      ),
    );

    assert.deepEqual(withoutDryRun(output), withoutDryRun(dryRunOutput));
    assert.equal(output.source_id, '11111111-1111-4111-8111-111111111111');
    assert.equal(output.hash_changed, true);
    assert.equal(output.counts.changed_sources, 1);
    assert.deepEqual(output.todo_created, [
      'auth-core',
      'auth-session-timeout-audit',
      'auth-session-timeout-enforcement',
    ]);

    const registry = await readSourceRegistry(backlogRoot);
    assert.equal(registry.sources[0]?.path, 'sources/docs/modules/auth-v2.md');
    const state = await readState(backlogRoot);
    assert.equal(state.last_refresh_at, '2026-04-06T12:00:00.000Z');
    assert.equal(
      state.todos.every((todo) =>
        todo.related_sources.every(
          (source) => source.source_label === 'sources/docs/modules/auth-v2.md',
        ),
      ),
      true,
    );
    const sourceLinkedTodos = state.todos.filter((todo) =>
      todo.related_sources.some(
        (source) => source.source_id === '11111111-1111-4111-8111-111111111111',
      ),
    );
    assert.notEqual(sourceLinkedTodos.length, 0);
    assert.equal(
      sourceLinkedTodos.every(
        (todo) =>
          todo.message.includes('sources/docs/modules/auth-v2.md') &&
          !todo.message.includes('sources/docs/modules/auth.md'),
      ),
      true,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('update-source-path rejects missing, unsafe, and unknown source inputs', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({
    uuidValues: AUTH_RUNTIME_UUID_VALUES,
  });

  try {
    const { backlogRoot } = await bootstrapBacklog(cwd, runtime);
    await registerSourceFromFixture({
      runtime,
      backlogRoot,
      sourceFixtureRelativePath: 'sources/docs/modules/auth.v1.md',
      backlogRelativePath: 'sources/docs/modules/auth.md',
      authority: 'authoritative',
    });

    await assert.rejects(
      async () => {
        await UPDATE_SOURCE_PATH_COMMAND.execute(
          {
            selector: {
              kind: 'source_id',
              source_id: '11111111-1111-4111-8111-111111111111',
            },
            new_path: './sources/docs/modules/missing.md',
            dry_run: false,
          },
          await runtime.createContext('update-source-path', backlogRoot),
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_SOURCE_FILE_MISSING',
    );

    const symlinkTarget = path.join(cwd, 'outside-source.md');
    await writeFixtureFile({
      targetPath: symlinkTarget,
      fixtureRelativePath: 'sources/docs/modules/auth.v1.md',
    });
    await symlink(symlinkTarget, path.join(backlogRoot, 'sources/docs/modules/auth-link.md'));
    await assert.rejects(
      async () => {
        await UPDATE_SOURCE_PATH_COMMAND.execute(
          {
            selector: {
              kind: 'source_id',
              source_id: '11111111-1111-4111-8111-111111111111',
            },
            new_path: './sources/docs/modules/auth-link.md',
            dry_run: false,
          },
          await runtime.createContext('update-source-path', backlogRoot),
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_SOURCE_READ_FAILED',
    );

    await assert.rejects(
      async () => {
        await UPDATE_SOURCE_PATH_COMMAND.execute(
          {
            selector: {
              kind: 'source_id',
              source_id: '99999999-9999-4999-8999-999999999999',
            },
            new_path: './sources/docs/modules/auth.md',
            dry_run: false,
          },
          await runtime.createContext('update-source-path', backlogRoot),
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_SOURCE_NOT_FOUND',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('update-source-path rejects path collisions with BE_SOURCE_PATH_CONFLICT', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({
    uuidValues: ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'],
  });

  try {
    const { backlogRoot } = await bootstrapBacklog(cwd, runtime);
    await registerSourceFromFixture({
      runtime,
      backlogRoot,
      sourceFixtureRelativePath: 'sources/docs/modules/auth.v1.md',
      backlogRelativePath: 'sources/docs/modules/auth.md',
      authority: 'authoritative',
    });
    await registerSourceFromFixture({
      runtime,
      backlogRoot,
      sourceFixtureRelativePath: 'sources/docs/modules/billing.md',
      backlogRelativePath: 'sources/docs/modules/billing.md',
      authority: 'supporting',
    });
    await rm(path.join(backlogRoot, 'sources/docs/modules/billing.md'));

    await assert.rejects(
      async () => {
        await UPDATE_SOURCE_PATH_COMMAND.execute(
          {
            selector: {
              kind: 'source_id',
              source_id: '11111111-1111-4111-8111-111111111111',
            },
            new_path: './sources/docs/modules/billing.md',
            dry_run: false,
          },
          await runtime.createContext('update-source-path', backlogRoot),
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_SOURCE_PATH_CONFLICT',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('remove-item command deletes target items, cleans linked context references, and honors dry-run parity', async () => {
  const cwd = await createTempDir();
  const hooks = createNoOpRegistry();
  const afterPatchAppliedCalls: Array<ReturnType<typeof RemoveItemCommandOutputSchema.parse>> = [];
  hooks.afterPatchApplied = ({ summary }) => {
    if ('removed' in summary) {
      afterPatchAppliedCalls.push(RemoveItemCommandOutputSchema.parse(summary));
    }
    return Promise.resolve();
  };
  try {
    const backlogRoot = path.join(cwd, 'backlog');
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'context-linked-cleanup-backlog'), backlogRoot, {
      recursive: true,
    });
    const runtime = createRuntime({
      dependencies: {
        clock: {
          nowIsoUtc() {
            return '2026-04-06T12:00:00.000Z';
          },
        },
        hooks,
      },
      stateCoordinator: {
        async ensureQueryState(payload) {
          return {
            state: await payload.modules.artifacts.readState(payload.backlogRoot),
            rebuilt: false,
          };
        },
        ensureMutationState(payload) {
          return payload.modules.artifacts.readState(payload.backlogRoot);
        },
        rebuildState(payload) {
          return payload.modules.artifacts.readState(payload.backlogRoot);
        },
      },
    });

    const removePatchPath = path.join(backlogRoot, 'drafts', 'remove-legacy-auth-ui.patch.json');
    await writeFixtureFile({
      targetPath: removePatchPath,
      fixtureRelativePath: 'authored/patches/remove-legacy-auth-ui.patch.json',
    });

    const beforeApplied = await readFile(
      path.join(backlogRoot, '.backlog', 'applied.json'),
      'utf8',
    );
    const beforeState = await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8');
    const beforePatchFiles = await listDirectory(path.join(backlogRoot, 'patches'));

    const removeContext = await runtime.createContext('remove-item', backlogRoot);
    const dryRunOutput = RemoveItemCommandOutputSchema.parse(
      await REMOVE_ITEM_COMMAND.execute(
        {
          patch: './drafts/remove-legacy-auth-ui.patch.json',
          dry_run: true,
        },
        removeContext,
      ),
    );

    assert.deepEqual(dryRunOutput, {
      dry_run: true,
      counts: {
        removed: 1,
        todo_created: 0,
        todo_updated: 0,
        todo_removed: 1,
      },
      removed: ['legacy-auth-ui'],
      todo_created: [],
      todo_updated: [],
      todo_removed: ['legacy-auth-ui'],
      next_commands: [],
    });
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'applied.json'), 'utf8'),
      beforeApplied,
    );
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      beforeState,
    );
    assert.deepEqual(await listDirectory(path.join(backlogRoot, 'patches')), beforePatchFiles);
    assert.equal(afterPatchAppliedCalls.length, 0);

    const realOutput = RemoveItemCommandOutputSchema.parse(
      await REMOVE_ITEM_COMMAND.execute(
        {
          patch: './drafts/remove-legacy-auth-ui.patch.json',
          dry_run: false,
        },
        removeContext,
      ),
    );

    assert.deepEqual(withoutDryRun(realOutput), withoutDryRun(dryRunOutput));
    assert.equal(realOutput.dry_run, false);

    const appliedRegistry = await readAppliedRegistry(backlogRoot);
    assert.equal(appliedRegistry.patches.length, 2);
    const removePatchEntry = appliedRegistry.patches.at(-1);
    assert.equal(removePatchEntry?.patch_id, '2026-04-03-002-remove-legacy-auth-ui');
    assert.equal(removePatchEntry?.kind, 'remove-item');
    assert.deepEqual(await listDirectory(path.join(backlogRoot, 'patches')), [
      ...beforePatchFiles,
      removePatchEntry?.canonical_path.split('/')[1],
    ]);

    const nextState = await readState(backlogRoot);
    assert.equal(
      nextState.items.some((item) => item.item_key === 'legacy-auth-ui'),
      false,
    );
    assert.equal(
      nextState.context.quality_attributes.some((entry) =>
        entry.applies_to_item_keys.includes('legacy-auth-ui'),
      ),
      false,
    );
    assert.equal(
      nextState.context.policy_decisions.some((entry) =>
        entry.related_item_keys.includes('legacy-auth-ui'),
      ),
      false,
    );

    assert.equal(afterPatchAppliedCalls.length, 1);
    assert.deepEqual(afterPatchAppliedCalls[0], realOutput);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('remove-source writes durable cleanup, deletes registry record, and stays replay-safe', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({
    uuidValues: [
      ...AUTH_RUNTIME_UUID_VALUES,
      '99999999-9999-4999-8999-999999999999',
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
      'ffffffff-ffff-4fff-8fff-fffffffffff1',
      '99999999-9999-4999-8999-999999999991',
      '99999999-9999-4999-8999-999999999992',
      '99999999-9999-4999-8999-999999999993',
      '99999999-9999-4999-8999-999999999994',
      '99999999-9999-4999-8999-999999999995',
      '99999999-9999-4999-8999-999999999996',
      '99999999-9999-4999-8999-999999999997',
      '99999999-9999-4999-8999-999999999998',
      '99999999-9999-4999-8999-999999999999',
    ],
  });

  try {
    const { backlogRoot, packetPath } = await bootstrapAuthBacklog({
      runtime,
      cwd,
    });
    const packet = JSON.parse(await readFile(packetPath, 'utf8')) as {
      items: Array<Record<string, unknown>>;
    };
    packet.items.push({
      item_key: 'auth-dependent-review',
      title: 'Review downstream auth behavior after source removal',
      type: 'feature',
      delivery_state: 'defined',
      gaps: [],
      depends_on_keys: ['auth-session-timeout-enforcement'],
      origin_source_ids: [],
      specification_source_ids: [],
      plan_source_ids: [],
      implementation_source_ids: [],
      test_source_ids: [],
      claim_keys: [],
      contract_keys: [],
      data_domain_keys: [],
      quality_attribute_keys: [],
      policy_decision_keys: [],
    });
    await writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
    await seedAuthPacket({
      runtime,
      backlogRoot,
      packetPath,
    });

    const beforeApplied = await readFile(
      path.join(backlogRoot, '.backlog', 'applied.json'),
      'utf8',
    );
    const beforeRegistry = await readFile(
      path.join(backlogRoot, '.backlog', 'sources.json'),
      'utf8',
    );
    const beforeState = await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8');
    const beforePatchFiles = await listDirectory(path.join(backlogRoot, 'patches'));

    const dryRunOutput = RemoveSourceCommandOutputSchema.parse(
      await REMOVE_SOURCE_COMMAND.execute(
        {
          selector: {
            kind: 'source_id',
            source_id: '11111111-1111-4111-8111-111111111111',
          },
          dry_run: true,
        },
        await runtime.createContext('remove-source', backlogRoot),
      ),
    );

    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'applied.json'), 'utf8'),
      beforeApplied,
    );
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'sources.json'), 'utf8'),
      beforeRegistry,
    );
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      beforeState,
    );
    assert.deepEqual(await listDirectory(path.join(backlogRoot, 'patches')), beforePatchFiles);

    const output = RemoveSourceCommandOutputSchema.parse(
      await REMOVE_SOURCE_COMMAND.execute(
        {
          selector: {
            kind: 'source_id',
            source_id: '11111111-1111-4111-8111-111111111111',
          },
          dry_run: false,
        },
        await runtime.createContext('remove-source', backlogRoot),
      ),
    );

    assert.deepEqual(withoutDryRun(output), withoutDryRun(dryRunOutput));
    assert.equal(output.removed, true);
    assert.equal(output.source_label, 'sources/docs/modules/auth.md');
    assert.deepEqual(output.updated_item_keys, [
      'auth-core',
      'auth-session-timeout-audit',
      'auth-session-timeout-enforcement',
    ]);
    assert.deepEqual(output.todo_created, [
      'auth-core',
      'auth-dependent-review',
      'auth-session-timeout-audit',
      'auth-session-timeout-enforcement',
    ]);
    assert.equal(output.counts.updated, 3);

    const registry = await readSourceRegistry(backlogRoot);
    assert.deepEqual(registry.sources, []);

    const appliedRegistry = await readAppliedRegistry(backlogRoot);
    assert.equal(appliedRegistry.patches.length, 1);
    assert.equal(appliedRegistry.patches.at(-1)?.kind, 'source-maintenance');

    const state = await readState(backlogRoot);
    for (const item of state.items) {
      assert.equal(
        collectSourceIdsFromStateItem(item).includes('11111111-1111-4111-8111-111111111111'),
        false,
      );
    }
    assert.equal(
      state.context.claims.some((claim) =>
        claim.source_ids.includes('11111111-1111-4111-8111-111111111111'),
      ),
      false,
    );
    assert.equal(
      state.context.quality_attributes.some((qualityAttribute) =>
        qualityAttribute.source_ids.includes('11111111-1111-4111-8111-111111111111'),
      ),
      false,
    );
    assert.equal(
      state.context.policy_decisions.some((policyDecision) =>
        policyDecision.source_ids.includes('11111111-1111-4111-8111-111111111111'),
      ),
      false,
    );
    assert.equal(
      state.todos.filter((todo) => todo.message.includes('Source was removed')).length,
      4,
    );

    const rebuiltState = await runtime.rebuildState(backlogRoot);
    for (const item of rebuiltState.items) {
      assert.equal(
        collectSourceIdsFromStateItem(item).includes('11111111-1111-4111-8111-111111111111'),
        false,
      );
    }
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('remove-source rolls back maintenance artifacts when source registry write fails', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({
    uuidValues: [
      ...AUTH_RUNTIME_UUID_VALUES,
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
      'ffffffff-ffff-4fff-8fff-fffffffffff1',
      '99999999-9999-4999-8999-999999999991',
      '99999999-9999-4999-8999-999999999992',
      '99999999-9999-4999-8999-999999999993',
      '99999999-9999-4999-8999-999999999994',
    ],
  });

  try {
    const { backlogRoot, packetPath } = await bootstrapAuthBacklog({
      runtime,
      cwd,
    });
    await seedAuthPacket({
      runtime,
      backlogRoot,
      packetPath,
    });

    const beforeApplied = await readFile(
      path.join(backlogRoot, '.backlog', 'applied.json'),
      'utf8',
    );
    const beforeRegistry = await readFile(
      path.join(backlogRoot, '.backlog', 'sources.json'),
      'utf8',
    );
    const beforeState = await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8');
    const beforePatchFiles = await listDirectory(path.join(backlogRoot, 'patches'));

    const removeContext = await runtime.createContext('remove-source', backlogRoot);
    const writeSourceRegistry = removeContext.artifacts.writeSourceRegistry.bind(
      removeContext.artifacts,
    );
    let failNextSourceRegistryWrite = true;
    removeContext.artifacts.writeSourceRegistry = async (root, value) => {
      if (failNextSourceRegistryWrite) {
        failNextSourceRegistryWrite = false;
        throw new Error('simulated writeSourceRegistry failure');
      }

      return writeSourceRegistry(root, value);
    };

    await assert.rejects(
      async () => {
        await REMOVE_SOURCE_COMMAND.execute(
          {
            selector: {
              kind: 'source_id',
              source_id: '11111111-1111-4111-8111-111111111111',
            },
            dry_run: false,
          },
          removeContext,
        );
      },
      (error: unknown) =>
        error instanceof Error && error.message === 'simulated writeSourceRegistry failure',
    );

    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'applied.json'), 'utf8'),
      beforeApplied,
    );
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'sources.json'), 'utf8'),
      beforeRegistry,
    );
    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      beforeState,
    );
    assert.deepEqual(await listDirectory(path.join(backlogRoot, 'patches')), beforePatchFiles);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('remove-source fails closed when a context-only source reference has no affected item scope', async () => {
  const cwd = await createTempDir();

  try {
    const backlogRoot = path.join(cwd, 'backlog');
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'empty-backlog'), backlogRoot, {
      recursive: true,
    });
    await writeFixtureFile({
      targetPath: path.join(backlogRoot, 'sources/docs/modules/auth.md'),
      fixtureRelativePath: 'sources/docs/modules/auth.v1.md',
    });

    const runtime = createRuntimeForMutationTest({
      uuidValues: AUTH_RUNTIME_UUID_VALUES,
    });
    await REGISTER_SOURCE_COMMAND.execute(
      {
        path: './sources/docs/modules/auth.md',
        kind: 'module',
        authority: 'authoritative',
      },
      await runtime.createContext('register-source', backlogRoot),
    );

    const contextOnlyState = StateFileSchema.parse({
      ...(await readState(backlogRoot)),
      context: {
        ...(await readState(backlogRoot)).context,
        claims: [
          {
            claim_key: 'context-only-claim',
            title: 'Context-only source reference',
            claim_class: 'security',
            commitment: 'required',
            source_ids: ['11111111-1111-4111-8111-111111111111'],
          },
        ],
      },
    });
    await writeFile(
      path.join(backlogRoot, '.backlog', 'state.json'),
      `${JSON.stringify(contextOnlyState, null, 2)}\n`,
      'utf8',
    );

    const nonRebuildingRuntime = createRuntime({
      dependencies: {
        clock: {
          nowIsoUtc() {
            return '2026-04-06T12:00:00.000Z';
          },
        },
      },
      stateCoordinator: {
        async ensureQueryState(payload) {
          return {
            state: await payload.modules.artifacts.readState(payload.backlogRoot),
            rebuilt: false,
          };
        },
        ensureMutationState(payload) {
          return payload.modules.artifacts.readState(payload.backlogRoot);
        },
        rebuildState(payload) {
          return payload.modules.artifacts.readState(payload.backlogRoot);
        },
      },
    });

    await assert.rejects(
      async () => {
        await REMOVE_SOURCE_COMMAND.execute(
          {
            selector: {
              kind: 'source_id',
              source_id: '11111111-1111-4111-8111-111111111111',
            },
            dry_run: false,
          },
          await nonRebuildingRuntime.createContext('remove-source', backlogRoot),
        );
      },
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_SOURCE_REMOVE_UNSUPPORTED',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('mutation commands read authored packet and patch files through injected runtime adapters', async () => {
  const { cwd, fs, runtime } = createInMemoryMutationRuntime({
    cwd: '/workspace',
    uuidValues: AUTH_RUNTIME_UUID_VALUES,
  });
  const { backlogRoot } = await bootstrapBacklog(cwd, runtime);

  await writeFixtureToInMemoryFile({
    fs,
    targetPath: `${backlogRoot}/sources/docs/modules/auth.md`,
    fixtureRelativePath: 'sources/docs/modules/auth.v1.md',
  });
  await REGISTER_SOURCE_COMMAND.execute(
    {
      path: './sources/docs/modules/auth.md',
      kind: 'module',
      authority: 'authoritative',
      note: 'Auth module architecture',
    },
    await runtime.createContext('register-source', backlogRoot),
  );

  await writeFixtureToInMemoryFile({
    fs,
    targetPath: `${backlogRoot}/drafts/auth-module.packet.json`,
    fixtureRelativePath: 'authored/packets/auth-module.packet.json',
  });

  const packetOutput = PacketCommandOutputSchema.parse(
    await PACKET_COMMAND.execute(
      {
        path: './drafts/auth-module.packet.json',
        dry_run: false,
      },
      await runtime.createContext('packet', backlogRoot),
    ),
  );
  assert.equal(packetOutput.counts.added, 3);
  assert.equal(packetOutput.authored_packet_path, `${backlogRoot}/drafts/auth-module.packet.json`);
  assert.equal(
    packetOutput.canonical_packet_path,
    `${backlogRoot}/packets/2d764141a49f--auth-module.packet.json`,
  );
  assert.equal(packetOutput.canonical_packet_purpose, 'immutable_import_copy');

  await writeFixtureToInMemoryFile({
    fs,
    targetPath: `${backlogRoot}/drafts/auth-module.patch-item.json`,
    fixtureRelativePath: 'authored/patches/auth-module.patch-item.json',
  });

  const patchOutput = PatchItemCommandOutputSchema.parse(
    await PATCH_ITEM_COMMAND.execute(
      {
        patch: './drafts/auth-module.patch-item.json',
        dry_run: false,
      },
      await runtime.createContext('patch-item', backlogRoot),
    ),
  );
  assert.equal(patchOutput.counts.updated, 2);

  await fs.writeText(
    `${backlogRoot}/drafts/remove-auth-session-timeout-audit.patch.json`,
    JSON.stringify(
      {
        metadata: {
          patch_id: '2026-04-06-003-remove-auth-session-timeout-audit',
          created_at: '2026-04-06T12:40:00Z',
          sequence: 2,
          target_item_keys: ['auth-session-timeout-audit'],
        },
        operations: [
          {
            item_key: 'auth-session-timeout-audit',
            action: 'remove_item',
          },
        ],
      },
      null,
      2,
    ),
  );

  const removeOutput = RemoveItemCommandOutputSchema.parse(
    await REMOVE_ITEM_COMMAND.execute(
      {
        patch: './drafts/remove-auth-session-timeout-audit.patch.json',
        dry_run: false,
      },
      await runtime.createContext('remove-item', backlogRoot),
    ),
  );
  assert.equal(removeOutput.counts.removed, 1);
});

void test('patch-item rejects remove_todo for refresh-managed review todo', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({});

  try {
    const backlogRoot = path.join(cwd, 'backlog');
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'refreshable-backlog'), backlogRoot, {
      recursive: true,
    });

    const refreshTodoId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    const state = await readState(backlogRoot);
    state.todos.push({
      todo_id: refreshTodoId,
      item_key: 'auth-core',
      type: 'review_source_change',
      managed_by: 'refresh',
      message: 'Review source change: sources/docs/modules/auth.md.',
      created_at: '2026-04-10T09:30:00.000Z',
      related_sources: [
        {
          source_id: '11111111-1111-4111-8111-111111111111',
          source_label: 'sources/docs/modules/auth.md',
        },
      ],
      related_item_keys: [],
    });
    state.items = state.items.map((item) =>
      item.item_key === 'auth-core'
        ? {
            ...item,
            open_todo_ids: [refreshTodoId],
            needs_attention: true,
            attention_reason_codes: ['source_changed'],
            attention_reasons: ['Source changed: review sources/docs/modules/auth.md.'],
            ready_for_next_step: false,
          }
        : item,
    );
    await writeFile(
      path.join(backlogRoot, '.backlog', 'state.json'),
      `${JSON.stringify(state, null, 2)}\n`,
      'utf8',
    );

    const patchPath = path.join(backlogRoot, 'drafts', 'close-refresh-review.patch.json');
    await mkdir(path.dirname(patchPath), { recursive: true });
    await writeFile(
      patchPath,
      `${JSON.stringify(
        {
          metadata: {
            patch_id: '2026-04-10-001-close-refresh-review',
            created_at: '2026-04-10T09:35:00.000Z',
            sequence: 2,
            target_item_keys: ['auth-core'],
          },
          operations: [
            {
              item_key: 'auth-core',
              action: 'remove_todo',
              todo_ids: [refreshTodoId],
            },
          ],
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    const beforeApplied = await readAppliedRegistry(backlogRoot);
    const patchContext = await runtime.createContext('patch-item', backlogRoot);
    await assert.rejects(
      async () => {
        await PATCH_ITEM_COMMAND.execute(
          {
            patch: './drafts/close-refresh-review.patch.json',
            dry_run: false,
          },
          patchContext,
        );
      },
      (error: unknown) =>
        error instanceof BacklogError &&
        error.code === 'BE_TODO_REFRESH_MANAGED' &&
        error.details?.todo_id === refreshTodoId &&
        typeof error.hint === 'string' &&
        error.hint.includes('refresh'),
    );

    assert.deepEqual(await readAppliedRegistry(backlogRoot), beforeApplied);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('packet command rejects symlinked authored packet files', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({
    uuidValues: AUTH_RUNTIME_UUID_VALUES,
  });

  try {
    const { backlogRoot } = await bootstrapAuthBacklog({
      runtime,
      cwd,
    });
    const externalPacketPath = path.join(cwd, 'external-auth-module.packet.json');
    await writeFixtureFile({
      targetPath: externalPacketPath,
      fixtureRelativePath: 'authored/packets/auth-module.packet.json',
    });
    const symlinkedPacketPath = path.join(backlogRoot, 'drafts', 'linked.packet.json');
    await symlink(externalPacketPath, symlinkedPacketPath, 'file');
    const packetContext = await runtime.createContext('packet', backlogRoot);

    await assert.rejects(
      async () =>
        PACKET_COMMAND.execute(
          {
            path: './drafts/linked.packet.json',
            dry_run: false,
          },
          packetContext,
        ),
      (error: unknown) =>
        error instanceof Error &&
        'code' in error &&
        (error as { code?: string }).code === 'BE_INPUT_FILE_NOT_FOUND',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('runtime host fails closed when anchored authored-input reads are unsupported on the platform', async () => {
  const { cwd, fs, runtime } = createInMemoryMutationRuntime({
    cwd: '/workspace',
    uuidValues: AUTH_RUNTIME_UUID_VALUES,
  });

  await bootstrapBacklog(cwd, runtime);
  await writeFixtureToInMemoryFile({
    fs,
    targetPath: '/workspace/backlog/drafts/auth-module.packet.json',
    fixtureRelativePath: 'authored/packets/auth-module.packet.json',
  });
  fs.openDirectory = () => {
    const error = new Error('ENOTSUP: /workspace/backlog/drafts') as NodeJS.ErrnoException;
    error.code = 'ENOTSUP';
    error.path = '/workspace/backlog/drafts';
    return Promise.reject(error);
  };

  const context = await runtime.createContext('packet', '/workspace/backlog');
  await assert.rejects(
    async () => {
      await context.host.readCliTextFile('./drafts/auth-module.packet.json');
    },
    (error: unknown) =>
      error instanceof Error && 'code' in error && error.code === 'BE_PLATFORM_UNSUPPORTED',
  );
});

void test('patch-item rebuilds canonical state before mutating after a previous writeState failure', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForMutationTest({
    uuidValues: AUTH_RUNTIME_UUID_VALUES,
  });

  try {
    const { backlogRoot, packetPath, patchPath } = await bootstrapAuthBacklog({
      runtime,
      cwd,
    });
    const packetContext = await runtime.createContext('packet', backlogRoot);
    const originalWriteState = packetContext.artifacts.writeState.bind(packetContext.artifacts);
    packetContext.artifacts.writeState = () =>
      Promise.reject(
        packetContext.errors.create('BE_CANONICAL_WRITE_FAILED', undefined, {
          details: {
            path: path.join(backlogRoot, '.backlog', 'state.json'),
            reason: 'injected_failure',
          },
        }),
      );

    await assert.rejects(
      async () =>
        PACKET_COMMAND.execute(
          {
            path: `./${path.relative(backlogRoot, packetPath).split(path.sep).join('/')}`,
            dry_run: false,
          },
          packetContext,
        ),
      (error: unknown) =>
        error instanceof Error &&
        'code' in error &&
        (error as { code?: string }).code === 'BE_CANONICAL_WRITE_FAILED',
    );

    packetContext.artifacts.writeState = originalWriteState;

    const patchOutput = PatchItemCommandOutputSchema.parse(
      await PATCH_ITEM_COMMAND.execute(
        {
          patch: `./${path.relative(backlogRoot, patchPath).split(path.sep).join('/')}`,
          dry_run: false,
        },
        await runtime.createContext('patch-item', backlogRoot),
      ),
    );

    assert.equal(patchOutput.counts.updated, 2);
    const recoveredState = await readState(backlogRoot);
    assert.equal(recoveredState.items.length, 3);
    assert.equal(
      recoveredState.items.find((item) => item.item_key === 'auth-core')?.delivery_state,
      'specified',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('patch-item mutates from rebuilt canonical state instead of persisting a tampered state snapshot', async () => {
  const cwd = await createTempDir();
  const setupRuntime = createRuntimeForMutationTest({
    uuidValues: AUTH_RUNTIME_UUID_VALUES,
  });

  try {
    const { backlogRoot, packetPath, patchPath } = await bootstrapAuthBacklog({
      runtime: setupRuntime,
      cwd,
    });
    await seedAuthPacket({
      runtime: setupRuntime,
      backlogRoot,
      packetPath,
    });

    const tamperedState = await readState(backlogRoot);
    const authCore = tamperedState.items.find((item) => item.item_key === 'auth-core');
    assert.ok(authCore);
    authCore.title = 'TAMPERED TITLE';
    await writeFile(
      path.join(backlogRoot, '.backlog', 'state.json'),
      `${JSON.stringify(tamperedState, null, 2)}\n`,
      'utf8',
    );

    const mutationRuntime = createRuntimeForMutationTest({});
    const patchOutput = PatchItemCommandOutputSchema.parse(
      await PATCH_ITEM_COMMAND.execute(
        {
          patch: `./${path.relative(backlogRoot, patchPath).split(path.sep).join('/')}`,
          dry_run: false,
        },
        await mutationRuntime.createContext('patch-item', backlogRoot),
      ),
    );

    assert.equal(patchOutput.counts.updated, 2);
    const nextState = await readState(backlogRoot);
    assert.equal(
      nextState.items.find((item) => item.item_key === 'auth-core')?.title,
      'Implement core session validation',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('runCli mutation path invokes beforeCommand, afterCommand, and mutation hooks for packet, patch-item, and remove-item', {
  concurrency: false,
}, async () => {
  const cwd = await createTempDir();

  try {
    const packetHooks = createNoOpRegistry();
    const packetEvents: string[] = [];
    packetHooks.beforeCommand = ({ command }) => {
      packetEvents.push(`before:${command}`);
      return Promise.resolve();
    };
    packetHooks.afterCommand = ({ command }) => {
      packetEvents.push(`after:${command}`);
      return Promise.resolve();
    };
    packetHooks.afterPacketApplied = () => {
      packetEvents.push('afterPacketApplied');
      return Promise.resolve();
    };
    const packetRuntime = createRuntimeForMutationTest({
      hooks: packetHooks,
      uuidValues: AUTH_RUNTIME_UUID_VALUES,
    });
    const packetSetup = await bootstrapAuthBacklog({
      runtime: packetRuntime,
      cwd,
    });
    const packetResult = await runCliWithRuntime({
      args: ['packet', '--path', './drafts/auth-module.packet.json'],
      runtime: createFixedBacklogRuntime({
        runtime: packetRuntime,
        backlogRoot: packetSetup.backlogRoot,
      }),
    });

    assert.equal(packetResult.exitCode, 0);
    assert.equal(packetResult.stderrBuffer.join(''), '');
    PacketCommandOutputSchema.parse(parseStdoutJson(packetResult.stdoutBuffer));
    assert.deepEqual(packetEvents, ['before:packet', 'afterPacketApplied', 'after:packet']);

    const patchHooks = createNoOpRegistry();
    const patchEvents: string[] = [];
    patchHooks.beforeCommand = ({ command }) => {
      patchEvents.push(`before:${command}`);
      return Promise.resolve();
    };
    patchHooks.afterCommand = ({ command }) => {
      patchEvents.push(`after:${command}`);
      return Promise.resolve();
    };
    patchHooks.afterPatchApplied = () => {
      patchEvents.push('afterPatchApplied');
      return Promise.resolve();
    };
    const patchSetupRuntime = createRuntimeForMutationTest({
      uuidValues: AUTH_RUNTIME_UUID_VALUES,
    });
    const patchSetup = await bootstrapAuthBacklog({
      runtime: patchSetupRuntime,
      cwd: path.join(cwd, 'patch-item'),
    });
    await seedAuthPacket({
      runtime: patchSetupRuntime,
      backlogRoot: patchSetup.backlogRoot,
      packetPath: patchSetup.packetPath,
    });
    const patchRuntime = createRuntimeForMutationTest({
      hooks: patchHooks,
    });
    const patchResult = await runCliWithRuntime({
      args: ['patch-item', '--patch', './drafts/auth-module.patch-item.json'],
      runtime: createFixedBacklogRuntime({
        runtime: patchRuntime,
        backlogRoot: patchSetup.backlogRoot,
      }),
    });

    assert.equal(patchResult.exitCode, 0);
    assert.equal(patchResult.stderrBuffer.join(''), '');
    PatchItemCommandOutputSchema.parse(parseStdoutJson(patchResult.stdoutBuffer));
    assert.deepEqual(patchEvents, ['before:patch-item', 'afterPatchApplied', 'after:patch-item']);

    const removeHooks = createNoOpRegistry();
    const removeEvents: string[] = [];
    removeHooks.beforeCommand = ({ command }) => {
      removeEvents.push(`before:${command}`);
      return Promise.resolve();
    };
    removeHooks.afterCommand = ({ command }) => {
      removeEvents.push(`after:${command}`);
      return Promise.resolve();
    };
    removeHooks.afterPatchApplied = () => {
      removeEvents.push('afterPatchApplied');
      return Promise.resolve();
    };
    const removeSetupRuntime = createRuntimeForMutationTest({
      uuidValues: AUTH_RUNTIME_UUID_VALUES,
    });
    const removeSetup = await bootstrapAuthBacklog({
      runtime: removeSetupRuntime,
      cwd: path.join(cwd, 'remove-item'),
    });
    await seedAuthPacket({
      runtime: removeSetupRuntime,
      backlogRoot: removeSetup.backlogRoot,
      packetPath: removeSetup.packetPath,
    });
    const removePatchPath = path.join(
      removeSetup.backlogRoot,
      'drafts',
      'remove-auth-session-timeout-audit.patch.json',
    );
    await writeFile(
      removePatchPath,
      JSON.stringify(
        {
          metadata: {
            patch_id: '2026-04-06-001-remove-auth-session-timeout-audit',
            created_at: '2026-04-06T12:30:00Z',
            sequence: 1,
            target_item_keys: ['auth-session-timeout-audit'],
          },
          operations: [
            {
              item_key: 'auth-session-timeout-audit',
              action: 'remove_item',
            },
          ],
        },
        null,
        2,
      ),
      'utf8',
    );
    const removeRuntime = createRuntimeForMutationTest({
      hooks: removeHooks,
    });
    const removeResult = await runCliWithRuntime({
      args: ['remove-item', '--patch', './drafts/remove-auth-session-timeout-audit.patch.json'],
      runtime: createFixedBacklogRuntime({
        runtime: removeRuntime,
        backlogRoot: removeSetup.backlogRoot,
      }),
    });

    assert.equal(removeResult.exitCode, 0);
    assert.equal(removeResult.stderrBuffer.join(''), '');
    RemoveItemCommandOutputSchema.parse(parseStdoutJson(removeResult.stdoutBuffer));
    assert.deepEqual(removeEvents, [
      'before:remove-item',
      'afterPatchApplied',
      'after:remove-item',
    ]);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('runCli surfaces mutation hook failures through the final error contract for packet, patch-item, and remove-item', {
  concurrency: false,
}, async () => {
  const cwd = await createTempDir();

  try {
    const packetHooks = createNoOpRegistry();
    const packetEvents: string[] = [];
    packetHooks.beforeCommand = ({ command }) => {
      packetEvents.push(`before:${command}`);
      return Promise.resolve();
    };
    packetHooks.afterCommand = ({ command }) => {
      packetEvents.push(`after:${command}`);
      return Promise.resolve();
    };
    packetHooks.afterPacketApplied = () => Promise.reject(new Error('packet hook failed'));
    const packetRuntime = createRuntimeForMutationTest({
      hooks: packetHooks,
      uuidValues: AUTH_RUNTIME_UUID_VALUES,
    });
    const packetSetup = await bootstrapAuthBacklog({
      runtime: packetRuntime,
      cwd,
    });
    const packetResult = await runCliWithRuntime({
      args: ['packet', '--path', './drafts/auth-module.packet.json'],
      runtime: createFixedBacklogRuntime({
        runtime: packetRuntime,
        backlogRoot: packetSetup.backlogRoot,
      }),
    });

    assert.equal(packetResult.exitCode, 1);
    assert.equal(packetResult.stdoutBuffer.join(''), '');
    assert.equal(
      ErrorPayloadSchema.parse(parseStderrJson(packetResult.stderrBuffer)).error.code,
      'BE_INTERNAL_STATE_CORRUPT',
    );
    assert.deepEqual(packetEvents, ['before:packet']);

    const patchSetupRuntime = createRuntimeForMutationTest({
      uuidValues: AUTH_RUNTIME_UUID_VALUES,
    });
    const patchSetup = await bootstrapAuthBacklog({
      runtime: patchSetupRuntime,
      cwd: path.join(cwd, 'patch-item'),
    });
    await seedAuthPacket({
      runtime: patchSetupRuntime,
      backlogRoot: patchSetup.backlogRoot,
      packetPath: patchSetup.packetPath,
    });
    const patchHooks = createNoOpRegistry();
    const patchEvents: string[] = [];
    patchHooks.beforeCommand = ({ command }) => {
      patchEvents.push(`before:${command}`);
      return Promise.resolve();
    };
    patchHooks.afterCommand = ({ command }) => {
      patchEvents.push(`after:${command}`);
      return Promise.resolve();
    };
    patchHooks.afterPatchApplied = () => Promise.reject(new Error('patch hook failed'));
    const patchRuntime = createRuntimeForMutationTest({
      hooks: patchHooks,
    });
    const patchResult = await runCliWithRuntime({
      args: ['patch-item', '--patch', './drafts/auth-module.patch-item.json'],
      runtime: createFixedBacklogRuntime({
        runtime: patchRuntime,
        backlogRoot: patchSetup.backlogRoot,
      }),
    });

    assert.equal(patchResult.exitCode, 1);
    assert.equal(patchResult.stdoutBuffer.join(''), '');
    assert.equal(
      ErrorPayloadSchema.parse(parseStderrJson(patchResult.stderrBuffer)).error.code,
      'BE_INTERNAL_STATE_CORRUPT',
    );
    assert.deepEqual(patchEvents, ['before:patch-item']);

    const removeSetupRuntime = createRuntimeForMutationTest({
      uuidValues: AUTH_RUNTIME_UUID_VALUES,
    });
    const removeSetup = await bootstrapAuthBacklog({
      runtime: removeSetupRuntime,
      cwd: path.join(cwd, 'remove-item'),
    });
    await seedAuthPacket({
      runtime: removeSetupRuntime,
      backlogRoot: removeSetup.backlogRoot,
      packetPath: removeSetup.packetPath,
    });
    const removePatchPath = path.join(
      removeSetup.backlogRoot,
      'drafts',
      'remove-auth-session-timeout-audit.patch.json',
    );
    await writeFile(
      removePatchPath,
      JSON.stringify(
        {
          metadata: {
            patch_id: '2026-04-06-002-remove-auth-session-timeout-audit',
            created_at: '2026-04-06T12:35:00Z',
            sequence: 1,
            target_item_keys: ['auth-session-timeout-audit'],
          },
          operations: [
            {
              item_key: 'auth-session-timeout-audit',
              action: 'remove_item',
            },
          ],
        },
        null,
        2,
      ),
      'utf8',
    );
    const removeHooks = createNoOpRegistry();
    const removeEvents: string[] = [];
    removeHooks.beforeCommand = ({ command }) => {
      removeEvents.push(`before:${command}`);
      return Promise.resolve();
    };
    removeHooks.afterCommand = ({ command }) => {
      removeEvents.push(`after:${command}`);
      return Promise.resolve();
    };
    removeHooks.afterPatchApplied = () => Promise.reject(new Error('remove hook failed'));
    const removeRuntime = createRuntimeForMutationTest({
      hooks: removeHooks,
    });
    const removeResult = await runCliWithRuntime({
      args: ['remove-item', '--patch', './drafts/remove-auth-session-timeout-audit.patch.json'],
      runtime: createFixedBacklogRuntime({
        runtime: removeRuntime,
        backlogRoot: removeSetup.backlogRoot,
      }),
    });

    assert.equal(removeResult.exitCode, 1);
    assert.equal(removeResult.stdoutBuffer.join(''), '');
    assert.equal(
      ErrorPayloadSchema.parse(parseStderrJson(removeResult.stderrBuffer)).error.code,
      'BE_INTERNAL_STATE_CORRUPT',
    );
    assert.deepEqual(removeEvents, ['before:remove-item']);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
