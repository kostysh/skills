import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { BacklogError, type ErrorModule } from '../src/errors/index.ts';
import { createNoOpRegistry } from '../src/hooks/index.ts';
import { RootMarkerFileSchema, StateFileSchema } from '../src/schemas/index.ts';
import {
  createNodeRuntimeDependencies,
  createRuntime,
  findBacklogRoot,
} from '../src/runtime/index.ts';

const FIXTURES_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures');

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-runtime-'));
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

void test('default ensureQueryState drops todo-only divergence and restores canonical state', async () => {
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
    assert.deepEqual(result.state.todos, []);
    const restoredItem = result.state.items.find((item) => item.item_key === 'auth-core');
    assert.deepEqual(restoredItem?.open_todo_ids, []);
    assert.equal(restoredItem?.needs_attention, false);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
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
