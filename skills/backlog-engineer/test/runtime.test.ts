import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { BacklogError, type ErrorModule } from '../src/errors/index.ts';
import { createNoOpRegistry } from '../src/hooks/index.ts';
import { RootMarkerFileSchema, StateFileSchema } from '../src/schemas/index.ts';
import {
  createNodePathPort,
  createNodeRuntimeDependencies,
  createRuntime,
  findBacklogRoot,
} from '../src/runtime/index.ts';
import type { FileSystemPort } from '../src/runtime/ports.ts';
import { createInMemoryFileSystemPort } from './support/in-memory-fs.ts';

const FIXTURES_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures');

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-runtime-'));
}

async function buildInMemorySeedFromFixture(payload: {
  fixtureDirName: string;
  targetRoot: string;
}): Promise<
  Array<
    | { path: string; type: 'directory' }
    | {
        path: string;
        type: 'file';
        content: string;
      }
  >
> {
  const fixtureRoot = path.join(FIXTURES_DIR, 'backlogs', payload.fixtureDirName);
  const seed: Array<
    | { path: string; type: 'directory' }
    | {
        path: string;
        type: 'file';
        content: string;
      }
  > = [{ path: payload.targetRoot, type: 'directory' }];

  async function walkDirectory(sourceDir: string, targetDir: string): Promise<void> {
    const entries = await readdir(sourceDir, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name);
      const targetPath = path.posix.join(targetDir, entry.name);

      if (entry.isDirectory()) {
        seed.push({
          path: targetPath,
          type: 'directory',
        });
        await walkDirectory(sourcePath, targetPath);
        continue;
      }

      seed.push({
        path: targetPath,
        type: 'file',
        content: await readFile(sourcePath, 'utf8'),
      });
    }
  }

  await walkDirectory(fixtureRoot, payload.targetRoot);
  return seed;
}

function mapSeedFileContent(
  seed: Array<
    | { path: string; type: 'directory' }
    | {
        path: string;
        type: 'file';
        content: string;
      }
  >,
  targetPath: string,
  transform: (content: string) => string,
) {
  return seed.map((entry) => {
    if (entry.type !== 'file' || entry.path !== targetPath) {
      return entry;
    }

    return {
      ...entry,
      content: transform(entry.content),
    };
  });
}

async function writeRootMarker(root: string): Promise<void> {
  const marker = RootMarkerFileSchema.parse({
    schema_version: 1,
    tool_name: '@kostysh/backlog-engineer-cli',
    created_at: '2026-04-06T12:00:00Z',
    layout_version: 1,
  });

  await writeFile(path.join(root, '.backlog.json'), JSON.stringify(marker, null, 2), 'utf8');
}

function createMinimalState() {
  return StateFileSchema.parse({
    schema_version: 1,
    created_at: '2026-04-06T12:00:00Z',
    updated_at: '2026-04-06T12:00:00Z',
    last_refresh_at: null,
    context: {
      glossary: [],
      key_strategy: {},
      target_system: [],
      as_built: [],
      claims: [],
      contracts: [],
      data_domains: [],
      quality_attributes: [],
      policy_decisions: [],
    },
    items: [],
    todos: [],
  });
}

void test('findBacklogRoot returns the nearest backlog root from a nested directory', async () => {
  const root = await createTempDir();
  const nested = path.join(root, 'nested', 'child');

  await mkdir(nested, { recursive: true });
  await writeRootMarker(root);

  try {
    const dependencies = createNodeRuntimeDependencies();
    const backlogRoot = await findBacklogRoot(dependencies.fs, dependencies.path, nested);

    assert.equal(backlogRoot, root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('findBacklogRoot ignores non-file .backlog.json entries', async () => {
  const root = await createTempDir();
  const nested = path.join(root, 'nested');

  await mkdir(path.join(root, '.backlog.json'), { recursive: true });
  await mkdir(nested, { recursive: true });

  try {
    const dependencies = createNodeRuntimeDependencies();
    const backlogRoot = await findBacklogRoot(dependencies.fs, dependencies.path, nested);

    assert.equal(backlogRoot, undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('findBacklogRoot ignores symlinked .backlog.json markers', async () => {
  const root = await createTempDir();
  const nested = path.join(root, 'nested');
  const realMarker = path.join(root, 'real-marker.json');

  await writeFile(realMarker, '{}', 'utf8');
  await symlink(realMarker, path.join(root, '.backlog.json'), 'file');
  await mkdir(nested, { recursive: true });

  try {
    const dependencies = createNodeRuntimeDependencies();
    const backlogRoot = await findBacklogRoot(dependencies.fs, dependencies.path, nested);

    assert.equal(backlogRoot, undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('createContext allows init without existing backlog root', async () => {
  const root = await createTempDir();
  const runtime = createRuntime();

  try {
    const context = await runtime.createContext('init', root);

    assert.equal(context.backlogRoot, undefined);
    assert.equal(context.host.resolveCliPath('./backlog'), path.resolve(root, 'backlog'));
    assert.match(context.host.nowIsoUtc(), /^\d{4}-\d{2}-\d{2}T/);
    assert.match(context.host.createUuid(), /^[0-9a-f-]{36}$/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('createContext rejects non-init commands outside backlog root', async () => {
  const root = await createTempDir();
  const runtime = createRuntime();

  try {
    await assert.rejects(
      () => runtime.createContext('status', root),
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_ROOT_NOT_FOUND',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('createNoOpRegistry provides safe async no-op hooks', async () => {
  const hooks = createNoOpRegistry();
  const sections = [{ key: 'summary', title: 'Summary', markdown: 'ok' }];

  await hooks.beforeCommand?.({ command: 'status', input: {} });
  await hooks.afterCommand?.({ command: 'status', output: {} });
  await hooks.afterSourceRegistered?.({
    source: {
      source_id: '00000000-0000-4000-8000-000000000001',
      source_label: 'docs/architecture.md',
      path: 'docs/architecture.md',
      kind: 'architecture',
      authority: 'authoritative',
      hash: 'a'.repeat(64),
      registered_at: '2026-04-06T12:00:00Z',
      last_checked_at: '2026-04-06T12:00:00Z',
    },
    backlogRoot: '/tmp/example',
  });

  const systemSummary = await hooks.buildSystemSummary?.({
    context: createMinimalState().context,
    items: [],
  });
  const decorated = await hooks.decorateReportSections?.({ sections });

  assert.deepEqual(systemSummary, []);
  assert.deepEqual(decorated, sections);
});

void test('runtime wires hooks and state coordinator through command context', async () => {
  const root = await createTempDir();
  const nested = path.join(root, 'nested');
  await mkdir(nested, { recursive: true });
  await writeRootMarker(root);

  const state = createMinimalState();
  const calls = {
    ensureQueryState: 0,
    ensureMutationState: 0,
    rebuildState: 0,
  };
  const hooks = createNoOpRegistry();

  const runtime = createRuntime({
    dependencies: {
      hooks,
      uuid: {
        create() {
          return '11111111-1111-4111-8111-111111111111';
        },
      },
    },
    stateCoordinator: {
      ensureQueryState() {
        calls.ensureQueryState += 1;
        return Promise.resolve({
          state,
          rebuilt: false,
        });
      },
      ensureMutationState() {
        calls.ensureMutationState += 1;
        return Promise.resolve(state);
      },
      rebuildState() {
        calls.rebuildState += 1;
        return Promise.resolve(state);
      },
    },
  });

  try {
    const context = await runtime.createContext('status', nested);

    assert.equal(context.backlogRoot, root);
    assert.equal(context.hooks, hooks);
    assert.equal(context.host.resolveCliPath('./child'), path.join(nested, 'child'));
    assert.equal(context.host.createUuid(), '11111111-1111-4111-8111-111111111111');
    assert.deepEqual(await context.ensureQueryState(), { state, rebuilt: false });
    assert.deepEqual(await context.ensureMutationState(), state);
    assert.deepEqual(await runtime.rebuildState(root), state);
    assert.deepEqual(calls, {
      ensureQueryState: 1,
      ensureMutationState: 1,
      rebuildState: 1,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('default ensureQueryState rebuilds missing state.json from canonical artifacts', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
    },
  });

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    await rm(path.join(backlogRoot, '.backlog', 'state.json'));

    const context = await runtime.createContext('status', backlogRoot);
    const result = await context.ensureQueryState();

    assert.equal(result.rebuilt, true);
    assert.ok(result.state.items.some((item) => item.item_key === 'auth-core'));
    StateFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      ) as unknown,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('default ensureQueryState reuses an existing valid state.json without hidden rewrite', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return '2099-01-01T00:00:00.000Z';
        },
      },
    },
  });

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    const statePath = path.join(backlogRoot, '.backlog', 'state.json');
    const originalState = await readFile(statePath, 'utf8');

    const context = await runtime.createContext('status', backlogRoot);
    const result = await context.ensureQueryState();

    assert.equal(result.rebuilt, false);
    assert.equal(await readFile(statePath, 'utf8'), originalState);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('default ensureQueryState rewrites divergent state.json to match canonical artifacts', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
    },
  });

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    const statePath = path.join(backlogRoot, '.backlog', 'state.json');
    const divergentState = StateFileSchema.parse(
      JSON.parse(await readFile(statePath, 'utf8')) as unknown,
    );
    divergentState.items = divergentState.items.map((item) =>
      item.item_key === 'auth-core' ? { ...item, title: 'Divergent title' } : item,
    );
    await writeFile(statePath, `${JSON.stringify(divergentState, null, 2)}\n`, 'utf8');

    const context = await runtime.createContext('status', backlogRoot);
    const result = await context.ensureQueryState();

    assert.equal(result.rebuilt, true);
    const restoredItem = result.state.items.find((item) => item.item_key === 'auth-core');
    assert.equal(restoredItem?.title, 'Implement core session validation');
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('default ensureQueryState preserves a valid runtime todo layer and canonicalizes derived state', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
    },
  });

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    const statePath = path.join(backlogRoot, '.backlog', 'state.json');
    const divergentState = StateFileSchema.parse(
      JSON.parse(await readFile(statePath, 'utf8')) as unknown,
    );
    divergentState.todos.push({
      todo_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      item_key: 'auth-core',
      type: 'review_source_change',
      managed_by: 'refresh',
      message: 'Re-check source change.',
      created_at: '2026-04-06T11:59:00.000Z',
      related_sources: [
        {
          source_id: '11111111-1111-4111-8111-111111111111',
          source_label: 'sources/docs/modules/auth.md',
        },
      ],
      related_item_keys: [],
    });
    divergentState.items = divergentState.items.map((item) =>
      item.item_key === 'auth-core'
        ? {
            ...item,
            open_todo_ids: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
            needs_attention: true,
            attention_reason_codes: ['source_changed'],
            attention_reasons: ['нужно проверить изменение источника sources/docs/modules/auth.md'],
            ready_for_next_step: false,
          }
        : item,
    );
    await writeFile(statePath, `${JSON.stringify(divergentState, null, 2)}\n`, 'utf8');

    const context = await runtime.createContext('status', backlogRoot);
    const result = await context.ensureQueryState();

    assert.equal(result.rebuilt, true);
    assert.equal(result.state.todos.length, 1);
    const restoredItem = result.state.items.find((item) => item.item_key === 'auth-core');
    assert.deepEqual(restoredItem?.open_todo_ids, ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']);
    assert.equal(restoredItem?.needs_attention, true);
    assert.deepEqual(restoredItem?.attention_reason_codes, ['source_changed']);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('default ensureQueryState drops stale refresh-managed source todo when rebuilt item no longer links the source', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = mapSeedFileContent(
    mapSeedFileContent(
      await buildInMemorySeedFromFixture({
        fixtureDirName: 'single-branch-backlog',
        targetRoot: backlogRoot,
      }),
      `${backlogRoot}/packets/2d764141a49f--auth-module.packet.json`,
      (content) => {
        const packet = JSON.parse(content) as {
          items: Array<{
            item_key: string;
            origin_source_ids: string[];
            specification_source_ids: string[];
            plan_source_ids: string[];
            implementation_source_ids: string[];
            test_source_ids: string[];
          }>;
        };
        packet.items = packet.items.map((item) =>
          item.item_key === 'auth-core'
            ? {
                ...item,
                origin_source_ids: [],
                specification_source_ids: [],
                plan_source_ids: [],
                implementation_source_ids: [],
                test_source_ids: [],
              }
            : item,
        );
        return `${JSON.stringify(packet, null, 2)}\n`;
      },
    ),
    `${backlogRoot}/.backlog/state.json`,
    (content) => {
      const state = StateFileSchema.parse(JSON.parse(content) as unknown);
      state.todos.push({
        todo_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        item_key: 'auth-core',
        type: 'review_source_change',
        managed_by: 'refresh',
        message: 'Re-check auth source.',
        created_at: '2026-04-06T11:59:00.000Z',
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
              open_todo_ids: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
              needs_attention: true,
              attention_reason_codes: ['source_changed'],
              attention_reasons: [
                'нужно проверить изменение источника sources/docs/modules/auth.md',
              ],
              ready_for_next_step: false,
            }
          : item,
      );
      return `${JSON.stringify(state, null, 2)}\n`;
    },
  );
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed,
      }),
      path: createNodePathPort(),
    },
  });

  const context = await runtime.createContext('status', backlogRoot);
  const result = await context.ensureQueryState();
  const authCore = result.state.items.find((item) => item.item_key === 'auth-core');

  assert.deepEqual(authCore?.origin_source_ids, []);
  assert.equal(
    result.state.todos.some((todo) => todo.todo_id === 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
    false,
  );
  assert.deepEqual(authCore?.open_todo_ids, []);
  assert.deepEqual(authCore?.attention_reason_codes, []);
});

void test('default ensureQueryState preserves mutation-managed source review todo when rebuilt item no longer links the source', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = mapSeedFileContent(
    mapSeedFileContent(
      await buildInMemorySeedFromFixture({
        fixtureDirName: 'single-branch-backlog',
        targetRoot: backlogRoot,
      }),
      `${backlogRoot}/packets/2d764141a49f--auth-module.packet.json`,
      (content) => {
        const packet = JSON.parse(content) as {
          items: Array<{
            item_key: string;
            origin_source_ids: string[];
            specification_source_ids: string[];
            plan_source_ids: string[];
            implementation_source_ids: string[];
            test_source_ids: string[];
          }>;
        };
        packet.items = packet.items.map((item) =>
          item.item_key === 'auth-core'
            ? {
                ...item,
                origin_source_ids: [],
                specification_source_ids: [],
                plan_source_ids: [],
                implementation_source_ids: [],
                test_source_ids: [],
              }
            : item,
        );
        return `${JSON.stringify(packet, null, 2)}\n`;
      },
    ),
    `${backlogRoot}/.backlog/state.json`,
    (content) => {
      const state = StateFileSchema.parse(JSON.parse(content) as unknown);
      state.todos.push({
        todo_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        item_key: 'auth-core',
        type: 'review_source_change',
        managed_by: 'mutation',
        message: 'Keep mutation-managed review.',
        created_at: '2026-04-06T11:58:00.000Z',
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
              open_todo_ids: ['cccccccc-cccc-4ccc-8ccc-cccccccccccc'],
              needs_attention: true,
              attention_reason_codes: ['source_changed'],
              attention_reasons: [
                'нужно проверить изменение источника sources/docs/modules/auth.md',
              ],
              ready_for_next_step: false,
            }
          : item,
      );
      return `${JSON.stringify(state, null, 2)}\n`;
    },
  );
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed,
      }),
      path: createNodePathPort(),
    },
  });

  const context = await runtime.createContext('status', backlogRoot);
  const result = await context.ensureQueryState();
  const authCore = result.state.items.find((item) => item.item_key === 'auth-core');

  assert.equal(
    result.state.todos.some((todo) => todo.todo_id === 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
    true,
  );
  assert.deepEqual(authCore?.open_todo_ids, ['cccccccc-cccc-4ccc-8ccc-cccccccccccc']);
  assert.deepEqual(authCore?.attention_reason_codes, ['source_changed']);
});

void test('default ensureQueryState preserves mutation-managed dependency review todo when related item is absent from canonical state', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = mapSeedFileContent(
    await buildInMemorySeedFromFixture({
      fixtureDirName: 'single-branch-backlog',
      targetRoot: backlogRoot,
    }),
    `${backlogRoot}/.backlog/state.json`,
    (content) => {
      const state = StateFileSchema.parse(JSON.parse(content) as unknown);
      state.todos.push({
        todo_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        item_key: 'auth-core',
        type: 'review_dependency_change',
        managed_by: 'mutation',
        message: 'Keep mutation-managed dependency review.',
        created_at: '2026-04-06T11:57:00.000Z',
        related_sources: [],
        related_item_keys: ['removed-item'],
      });
      state.items = state.items.map((item) =>
        item.item_key === 'auth-core'
          ? {
              ...item,
              open_todo_ids: ['dddddddd-dddd-4ddd-8ddd-dddddddddddd'],
              needs_attention: true,
              attention_reason_codes: ['dependency_changed'],
              attention_reasons: ['Нужен review: изменилась зависимость задачи.'],
              ready_for_next_step: false,
            }
          : item,
      );
      return `${JSON.stringify(state, null, 2)}\n`;
    },
  );
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed,
      }),
      path: createNodePathPort(),
    },
  });

  const context = await runtime.createContext('status', backlogRoot);
  const result = await context.ensureQueryState();
  const authCore = result.state.items.find((item) => item.item_key === 'auth-core');

  assert.equal(
    result.state.todos.some((todo) => todo.todo_id === 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
    true,
  );
  assert.deepEqual(authCore?.open_todo_ids, ['dddddddd-dddd-4ddd-8ddd-dddddddddddd']);
  assert.deepEqual(authCore?.attention_reason_codes, ['dependency_changed']);
});

void test('default ensureQueryState fails fast on duplicate patch sequence in applied registry', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    const appliedPath = path.join(backlogRoot, '.backlog', 'applied.json');
    const applied = JSON.parse(await readFile(appliedPath, 'utf8')) as {
      schema_version: number;
      created_at: string;
      updated_at: string;
      next_apply_index: number;
      packets: unknown[];
      patches: Array<{
        patch_id: string;
        apply_index: number;
        canonical_path: string;
        content_hash: string;
        sequence: number;
        applied_at: string;
        kind: string;
        target_item_keys: string[];
      }>;
    };
    applied.patches.push({
      patch_id: '2026-04-03-002-auth-progress',
      apply_index: 3,
      canonical_path: 'patches/222c4f042c00--auth-module.patch-item.json',
      content_hash: '2'.repeat(64),
      sequence: 1,
      applied_at: '2026-04-03T12:25:00Z',
      kind: 'patch-item',
      target_item_keys: ['auth-core'],
    });
    await writeFile(appliedPath, `${JSON.stringify(applied, null, 2)}\n`, 'utf8');

    const context = await runtime.createContext('status', backlogRoot);
    await assert.rejects(
      () => context.ensureQueryState(),
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_PATCH_SEQUENCE_CONFLICT',
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('default ensureQueryState fails when canonical backlog references source_ids missing from sources.json', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    const sourcesPath = path.join(backlogRoot, '.backlog', 'sources.json');
    const registry = JSON.parse(await readFile(sourcesPath, 'utf8')) as {
      schema_version: number;
      created_at: string;
      updated_at: string;
      sources: unknown[];
    };
    registry.sources = [];
    await writeFile(sourcesPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
    await rm(path.join(backlogRoot, '.backlog', 'state.json'));

    const context = await runtime.createContext('status', backlogRoot);
    await assert.rejects(
      () => context.ensureQueryState(),
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('ensureMutationState with in-memory adapters returns current state for a valid backlog snapshot', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = await buildInMemorySeedFromFixture({
    fixtureDirName: 'single-branch-backlog',
    targetRoot: backlogRoot,
  });
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed,
      }),
      path: createNodePathPort(),
    },
  });

  const context = await runtime.createContext('packet', backlogRoot);
  const state = await context.ensureMutationState();

  assert.ok(state.items.some((item) => item.item_key === 'auth-core'));
  assert.equal(state.items.length, 3);
});

void test('ensureQueryState with in-memory adapters reuses an existing valid state snapshot', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = await buildInMemorySeedFromFixture({
    fixtureDirName: 'single-branch-backlog',
    targetRoot: backlogRoot,
  });
  const fs: FileSystemPort = createInMemoryFileSystemPort({
    cwd: backlogRoot,
    seed,
  });
  const runtime = createRuntime({
    dependencies: {
      fs,
      path: createNodePathPort(),
    },
  });

  const originalState = await fs.readText(`${backlogRoot}/.backlog/state.json`);
  const originalSources = await fs.readText(`${backlogRoot}/.backlog/sources.json`);
  const originalApplied = await fs.readText(`${backlogRoot}/.backlog/applied.json`);

  const context = await runtime.createContext('status', backlogRoot);
  const result = await context.ensureQueryState();

  assert.equal(result.rebuilt, false);
  assert.equal(await fs.readText(`${backlogRoot}/.backlog/state.json`), originalState);
  assert.equal(await fs.readText(`${backlogRoot}/.backlog/sources.json`), originalSources);
  assert.equal(await fs.readText(`${backlogRoot}/.backlog/applied.json`), originalApplied);
});

void test('ensureQueryState with in-memory adapters rebuilds a missing state snapshot without mutating registries', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = (
    await buildInMemorySeedFromFixture({
      fixtureDirName: 'single-branch-backlog',
      targetRoot: backlogRoot,
    })
  ).filter((entry) => entry.path !== `${backlogRoot}/.backlog/state.json`);
  const fs: FileSystemPort = createInMemoryFileSystemPort({
    cwd: backlogRoot,
    seed,
  });
  const runtime = createRuntime({
    dependencies: {
      fs,
      path: createNodePathPort(),
    },
  });

  const originalSources = await fs.readText(`${backlogRoot}/.backlog/sources.json`);
  const originalApplied = await fs.readText(`${backlogRoot}/.backlog/applied.json`);

  const context = await runtime.createContext('status', backlogRoot);
  const result = await context.ensureQueryState();

  assert.equal(result.rebuilt, true);
  assert.ok(result.state.items.some((item) => item.item_key === 'auth-core'));
  assert.equal(await fs.readText(`${backlogRoot}/.backlog/sources.json`), originalSources);
  assert.equal(await fs.readText(`${backlogRoot}/.backlog/applied.json`), originalApplied);
});

void test('ensureQueryState with in-memory adapters rebuilds a corrupted state snapshot', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = mapSeedFileContent(
    await buildInMemorySeedFromFixture({
      fixtureDirName: 'single-branch-backlog',
      targetRoot: backlogRoot,
    }),
    `${backlogRoot}/.backlog/state.json`,
    () => '{"schema_version":1,"created_at":"broken"',
  );
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed,
      }),
      path: createNodePathPort(),
    },
  });

  const context = await runtime.createContext('status', backlogRoot);
  const result = await context.ensureQueryState();

  assert.equal(result.rebuilt, true);
  assert.equal(
    result.state.items.find((item) => item.item_key === 'auth-core')?.title,
    'Implement core session validation',
  );
});

void test('ensureQueryState with in-memory adapters rebuilds a divergent state snapshot', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = mapSeedFileContent(
    await buildInMemorySeedFromFixture({
      fixtureDirName: 'single-branch-backlog',
      targetRoot: backlogRoot,
    }),
    `${backlogRoot}/.backlog/state.json`,
    (content) => {
      const state = JSON.parse(content) as {
        items: Array<{ item_key: string; title: string }>;
      };
      state.items = state.items.map((item) =>
        item.item_key === 'auth-core' ? { ...item, title: 'TAMPERED TITLE' } : item,
      );
      return `${JSON.stringify(state, null, 2)}\n`;
    },
  );
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed,
      }),
      path: createNodePathPort(),
    },
  });

  const context = await runtime.createContext('status', backlogRoot);
  const result = await context.ensureQueryState();

  assert.equal(result.rebuilt, true);
  assert.equal(
    result.state.items.find((item) => item.item_key === 'auth-core')?.title,
    'Implement core session validation',
  );
});

void test('ensureMutationState with in-memory adapters returns rebuilt canonical state when state.json is tampered', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = await buildInMemorySeedFromFixture({
    fixtureDirName: 'single-branch-backlog',
    targetRoot: backlogRoot,
  });
  const tamperedSeed = seed.map((entry) => {
    if (entry.type !== 'file' || entry.path !== `${backlogRoot}/.backlog/state.json`) {
      return entry;
    }

    return {
      ...entry,
      content: entry.content.replace('Implement core session validation', 'TAMPERED TITLE'),
    };
  });
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed: tamperedSeed,
      }),
      path: createNodePathPort(),
    },
  });

  const context = await runtime.createContext('patch-item', backlogRoot);
  const state = await context.ensureMutationState();

  assert.equal(
    state.items.find((item) => item.item_key === 'auth-core')?.title,
    'Implement core session validation',
  );
});

void test('runtime rebuildState with in-memory adapters fails fast for broken registries and canonical artifacts', async () => {
  const cases = [
    'broken-registry-backlog-missing-sources',
    'broken-registry-backlog-invalid-sources',
    'broken-registry-backlog-missing-applied',
    'broken-registry-backlog-invalid-applied',
    'missing-canonical-artifact-backlog',
    'missing-canonical-patch-backlog',
    'invalid-canonical-packet-backlog',
    'invalid-canonical-patch-backlog',
  ] as const;

  for (const fixtureDirName of cases) {
    const backlogRoot = `/repo/${fixtureDirName}`;
    const seed = await buildInMemorySeedFromFixture({
      fixtureDirName,
      targetRoot: backlogRoot,
    });
    const runtime = createRuntime({
      dependencies: {
        fs: createInMemoryFileSystemPort({
          cwd: backlogRoot,
          seed,
        }),
        path: createNodePathPort(),
      },
    });

    await assert.rejects(
      () => runtime.rebuildState(backlogRoot),
      (error: unknown) =>
        error instanceof BacklogError &&
        (error.code === 'BE_INTERNAL_STATE_CORRUPT' || error.code === 'BE_PATCH_SEQUENCE_CONFLICT'),
      fixtureDirName,
    );
  }
});

void test('runtime rebuildState with in-memory adapters rejects patch_id collisions in applied registry', async () => {
  const backlogRoot = '/repo/backlog';
  const baseSeed = await buildInMemorySeedFromFixture({
    fixtureDirName: 'single-branch-backlog',
    targetRoot: backlogRoot,
  });
  const seed = mapSeedFileContent(baseSeed, `${backlogRoot}/.backlog/applied.json`, (content) => {
    const applied = JSON.parse(content) as {
      patches: Array<{ patch_id: string; apply_index: number }>;
    };
    const firstPatch = applied.patches[0];
    assert.ok(firstPatch);
    applied.patches = [
      ...applied.patches,
      {
        ...firstPatch,
        apply_index: 3,
      },
    ];
    return `${JSON.stringify(applied, null, 2)}\n`;
  });
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed,
      }),
      path: createNodePathPort(),
    },
  });

  await assert.rejects(
    () => runtime.rebuildState(backlogRoot),
    (error: unknown) => error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
  );
});

void test('runtime rebuildState with in-memory adapters rejects apply_index collisions in applied registry', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = mapSeedFileContent(
    await buildInMemorySeedFromFixture({
      fixtureDirName: 'single-branch-backlog',
      targetRoot: backlogRoot,
    }),
    `${backlogRoot}/.backlog/applied.json`,
    (content) => {
      const applied = JSON.parse(content) as {
        patches: Array<{ patch_id: string; apply_index: number }>;
      };
      const firstPatch = applied.patches[0];
      assert.ok(firstPatch);
      applied.patches = [
        ...applied.patches,
        {
          ...firstPatch,
          patch_id: '2026-04-03-777-collision',
        },
      ];
      return `${JSON.stringify(applied, null, 2)}\n`;
    },
  );
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed,
      }),
      path: createNodePathPort(),
    },
  });

  await assert.rejects(
    () => runtime.rebuildState(backlogRoot),
    (error: unknown) => error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
  );
});

void test('runtime rebuildState with in-memory adapters does not invoke top-level command hooks', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = await buildInMemorySeedFromFixture({
    fixtureDirName: 'single-branch-backlog',
    targetRoot: backlogRoot,
  });
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed,
      }),
      path: createNodePathPort(),
      hooks: {
        ...createNoOpRegistry(),
        beforeCommand() {
          throw new Error('beforeCommand should not run during rebuild');
        },
        afterCommand() {
          throw new Error('afterCommand should not run during rebuild');
        },
      },
    },
  });

  const state = await runtime.rebuildState(backlogRoot);
  assert.ok(state.items.some((item) => item.item_key === 'auth-core'));
});

void test('ensureMutationState with in-memory adapters fails fast on invalid canonical packet artifacts', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = await buildInMemorySeedFromFixture({
    fixtureDirName: 'invalid-canonical-packet-backlog',
    targetRoot: backlogRoot,
  });
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed,
      }),
      path: createNodePathPort(),
    },
  });

  const context = await runtime.createContext('packet', backlogRoot);
  await assert.rejects(
    () => context.ensureMutationState(),
    (error: unknown) => error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
  );
});

void test('ensureMutationState with in-memory adapters fails fast on missing canonical patch artifacts', async () => {
  const backlogRoot = '/repo/backlog';
  const seed = await buildInMemorySeedFromFixture({
    fixtureDirName: 'missing-canonical-patch-backlog',
    targetRoot: backlogRoot,
  });
  const runtime = createRuntime({
    dependencies: {
      fs: createInMemoryFileSystemPort({
        cwd: backlogRoot,
        seed,
      }),
      path: createNodePathPort(),
    },
  });

  const context = await runtime.createContext('patch-item', backlogRoot);
  await assert.rejects(
    () => context.ensureMutationState(),
    (error: unknown) => error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
  );
});

void test('runtime uses injected ErrorModule for root, unavailable-module, and default coordinator failures', async () => {
  const root = await createTempDir();
  const outsideRoot = await createTempDir();
  const nested = path.join(root, 'nested');
  await mkdir(nested, { recursive: true });
  await writeRootMarker(root);

  const createdCodes: string[] = [];
  const errorModule = {
    create(code, message, options) {
      createdCodes.push(code);

      return new BacklogError({
        code,
        ...(message ? { message } : {}),
        ...(options?.details ? { details: options.details } : {}),
        ...(options?.hint ? { hint: options.hint } : {}),
        ...(options?.cause ? { cause: options.cause } : {}),
      });
    },
    isBacklogError(value: unknown): value is BacklogError {
      return value instanceof BacklogError;
    },
    toPayload(error: unknown) {
      return (error as BacklogError).toPayload();
    },
    toExitCode(error: unknown) {
      return (error as BacklogError).exitCode;
    },
  } satisfies ErrorModule;

  const runtime = createRuntime({
    modules: {
      errors: errorModule,
    },
  });

  try {
    const initContext = await runtime.createContext('init', outsideRoot);
    await assert.rejects(
      () => initContext.ensureQueryState(),
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_ROOT_NOT_FOUND',
    );

    const context = await runtime.createContext('status', nested);
    await assert.rejects(
      () => context.ensureQueryState(),
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
    );

    await assert.rejects(
      () => context.artifacts.readState(root),
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
    );

    assert.deepEqual(createdCodes, [
      'BE_ROOT_NOT_FOUND',
      'BE_INTERNAL_STATE_CORRUPT',
      'BE_INTERNAL_STATE_CORRUPT',
      'BE_INTERNAL_STATE_CORRUPT',
      'BE_INTERNAL_STATE_CORRUPT',
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outsideRoot, { recursive: true, force: true });
  }
});
