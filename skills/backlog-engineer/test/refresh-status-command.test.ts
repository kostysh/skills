import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { REFRESH_COMMAND } from '../src/commands/refresh.ts';
import { STATUS_COMMAND } from '../src/commands/status.ts';
import { isBacklogError } from '../src/errors/index.ts';
import { createNoOpRegistry } from '../src/hooks/index.ts';
import { createRuntime } from '../src/runtime/index.ts';
import {
  RefreshCommandOutputSchema,
  SourceRegistryFileSchema,
  StateFileSchema,
  StatusCommandOutputSchema,
} from '../src/schemas/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');
const AUTH_SOURCE_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_UI_SOURCE_ID = '33333333-3333-4333-8333-333333333333';

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-refresh-status-'));
}

async function copyBacklogFixture(fixtureName: string, targetRoot: string): Promise<void> {
  await cp(path.join(FIXTURES_DIR, 'backlogs', fixtureName), targetRoot, {
    recursive: true,
  });
}

async function copyFixtureText(relativePath: string): Promise<string> {
  return readFile(path.join(FIXTURES_DIR, relativePath), 'utf8');
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

function createRuntimeForRefreshTest(payload?: {
  hooks?: ReturnType<typeof createNoOpRegistry>;
  nowIsoUtc?: string;
}) {
  return createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return payload?.nowIsoUtc ?? '2026-04-06T12:00:00.000Z';
        },
      },
      ...(payload?.hooks ? { hooks: payload.hooks } : {}),
    },
  });
}

void test('refresh command updates source registry and state for a source_path selector and calls afterRefresh', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const hookPayloads: unknown[] = [];
  const hooks = createNoOpRegistry();
  hooks.afterRefresh = (payload) => {
    hookPayloads.push(payload);
    return Promise.resolve();
  };
  const runtime = createRuntimeForRefreshTest({
    hooks,
    nowIsoUtc: '2026-04-06T12:34:56.000Z',
  });

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await writeFile(
      path.join(backlogRoot, 'sources', 'docs', 'modules', 'auth.md'),
      await copyFixtureText('backlogs/refreshable-backlog/sources/docs/modules/auth.v2.md'),
      'utf8',
    );

    const context = await runtime.createContext('refresh', backlogRoot);
    const output = RefreshCommandOutputSchema.parse(
      await REFRESH_COMMAND.execute(
        {
          kind: 'source_path',
          source_path: './sources/docs/modules/auth.md',
        },
        context,
      ),
    );

    assert.equal(output.counts.changed_sources, 1);
    assert.deepEqual(
      output.changed_sources.map((source) => source.source_id),
      [AUTH_SOURCE_ID],
    );
    assert.ok(output.todo_created.length + output.todo_updated.length > 0);
    assert.deepEqual(
      output.next_commands.map((entry) => entry.command),
      ['attention', 'items'],
    );

    const state = await readState(backlogRoot);
    const registry = await readSourceRegistry(backlogRoot);
    const authSource = registry.sources.find((source) => source.source_id === AUTH_SOURCE_ID);

    assert.equal(state.last_refresh_at, '2026-04-06T12:34:56.000Z');
    assert.ok(authSource);
    assert.equal(authSource?.last_checked_at, '2026-04-06T12:34:56.000Z');
    assert.notEqual(
      authSource?.hash,
      'bd9499983cfceaa0aa7cf63e29e832c141d1ff9b20f2da9d658d8cf3da605b65',
    );
    assert.equal(hookPayloads.length, 1);
    assert.deepEqual(
      (hookPayloads[0] as { summary: { counts: { changed_sources: number } } }).summary.counts,
      output.counts,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('refresh command item scope refreshes all sources linked through the dependent subgraph', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntimeForRefreshTest({
    nowIsoUtc: '2026-04-06T12:45:00.000Z',
  });

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await writeFile(
      path.join(backlogRoot, 'sources', 'docs', 'modules', 'session-ui.md'),
      '# session-ui v2\n',
      'utf8',
    );

    const context = await runtime.createContext('refresh', backlogRoot);
    const output = RefreshCommandOutputSchema.parse(
      await REFRESH_COMMAND.execute(
        {
          kind: 'item',
          item_key: 'auth-session-timeout-enforcement',
        },
        context,
      ),
    );

    assert.equal(output.counts.changed_sources, 1);
    assert.deepEqual(
      output.changed_sources.map((source) => source.source_id),
      [SESSION_UI_SOURCE_ID],
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('refresh command supports source_id and source_label selectors', async () => {
  const selectors = [
    {
      kind: 'source_id' as const,
      input: { kind: 'source_id' as const, source_id: AUTH_SOURCE_ID },
    },
    {
      kind: 'source_label' as const,
      input: {
        kind: 'source_label' as const,
        source_label: 'sources/docs/modules/auth.md',
      },
    },
  ];

  for (const selector of selectors) {
    const tempRoot = await createTempDir();
    const backlogRoot = path.join(tempRoot, 'backlog');
    const runtime = createRuntimeForRefreshTest();

    try {
      await copyBacklogFixture('refreshable-backlog', backlogRoot);
      const context = await runtime.createContext('refresh', backlogRoot);
      const output = RefreshCommandOutputSchema.parse(
        await REFRESH_COMMAND.execute(selector.input, context),
      );

      assert.equal(output.counts.changed_sources, 0);
      assert.equal(output.changed_sources.length, 0);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  }
});

void test('refresh command supports a global refresh scope', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntimeForRefreshTest({
    nowIsoUtc: '2026-04-06T12:50:00.000Z',
  });

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await writeFile(
      path.join(backlogRoot, 'sources', 'docs', 'modules', 'auth.md'),
      await copyFixtureText('backlogs/refreshable-backlog/sources/docs/modules/auth.v2.md'),
      'utf8',
    );

    const context = await runtime.createContext('refresh', backlogRoot);
    const output = RefreshCommandOutputSchema.parse(
      await REFRESH_COMMAND.execute({ kind: 'all' }, context),
    );

    assert.equal(output.counts.changed_sources, 1);
    assert.deepEqual(
      output.changed_sources.map((source) => source.source_id),
      [AUTH_SOURCE_ID],
    );
    assert.ok(output.todo_created.length > 0);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('refresh command rejects a source_path selector that is not registered', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntimeForRefreshTest();

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);

    const context = await runtime.createContext('refresh', backlogRoot);
    await assert.rejects(
      async () =>
        await REFRESH_COMMAND.execute(
          {
            kind: 'source_path',
            source_path: './sources/docs/modules/missing.md',
          },
          context,
        ),
      (error: unknown) => {
        assert.ok(isBacklogError(error));
        assert.equal(error.code, 'BE_SOURCE_NOT_FOUND');
        return true;
      },
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('unchanged global refresh produces no semantic changes and preserves existing context review todo', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntimeForRefreshTest({
    nowIsoUtc: '2026-04-06T12:54:00.000Z',
  });

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    const statePath = path.join(backlogRoot, '.backlog', 'state.json');
    const state = await readState(backlogRoot);
    state.todos.push({
      todo_id: '00000000-0000-4000-8000-000000000299',
      item_key: 'auth-core',
      type: 'review_context_change',
      managed_by: 'mutation',
      message: 'Context changed',
      created_at: '2026-04-06T12:00:00.000Z',
      related_sources: [],
      related_item_keys: ['auth-core'],
    });
    state.items = state.items.map((item) =>
      item.item_key === 'auth-core'
        ? {
            ...item,
            open_todo_ids: ['00000000-0000-4000-8000-000000000299'],
            needs_attention: true,
            attention_reason_codes: ['context_changed'],
            attention_reasons: ['Нужен review: изменился контекст задачи.'],
            ready_for_next_step: false,
          }
        : item,
    );
    await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

    const context = await runtime.createContext('refresh', backlogRoot);
    const output = RefreshCommandOutputSchema.parse(
      await REFRESH_COMMAND.execute({ kind: 'all' }, context),
    );

    assert.equal(output.counts.changed_sources, 0);
    assert.deepEqual(output.changed_sources, []);
    assert.deepEqual(output.todo_created, []);
    assert.deepEqual(output.todo_updated, []);

    const persistedState = await readState(backlogRoot);
    assert.equal(
      persistedState.todos.some((todo) => todo.type === 'review_context_change'),
      true,
    );
    assert.deepEqual(
      persistedState.items.find((item) => item.item_key === 'auth-core')?.attention_reason_codes,
      ['context_changed'],
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('status command returns a short summary and status --refresh composes refresh first', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntimeForRefreshTest({
    nowIsoUtc: '2026-04-06T12:56:00.000Z',
  });

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);

    const plainContext = await runtime.createContext('status', backlogRoot);
    const plainStatus = StatusCommandOutputSchema.parse(
      await STATUS_COMMAND.execute({ refresh: false }, plainContext),
    );

    assert.equal(plainStatus.total_items, 4);
    assert.equal(plainStatus.last_refresh_at, '2026-04-03T12:20:00Z');
    assert.equal(plainStatus.gaps_count, 1);
    assert.equal(plainStatus.needs_attention_count, 1);

    await writeFile(
      path.join(backlogRoot, 'sources', 'docs', 'modules', 'auth.md'),
      await copyFixtureText('backlogs/refreshable-backlog/sources/docs/modules/auth.v2.md'),
      'utf8',
    );

    const refreshContext = await runtime.createContext('status', backlogRoot);
    const refreshedStatus = StatusCommandOutputSchema.parse(
      await STATUS_COMMAND.execute({ refresh: true }, refreshContext),
    );

    assert.equal(refreshedStatus.total_items, 4);
    assert.equal(refreshedStatus.last_refresh_at, '2026-04-06T12:56:00.000Z');
    assert.ok(refreshedStatus.open_todo_count > plainStatus.open_todo_count);

    const persistedState = await readState(backlogRoot);
    assert.equal(persistedState.last_refresh_at, '2026-04-06T12:56:00.000Z');
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('plain status preserves refresh-derived todo layer after refresh has already run', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntimeForRefreshTest({
    nowIsoUtc: '2026-04-06T13:10:00.000Z',
  });

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await writeFile(
      path.join(backlogRoot, 'sources', 'docs', 'modules', 'auth.md'),
      await copyFixtureText('backlogs/refreshable-backlog/sources/docs/modules/auth.v2.md'),
      'utf8',
    );

    const refreshContext = await runtime.createContext('refresh', backlogRoot);
    const refreshOutput = RefreshCommandOutputSchema.parse(
      await REFRESH_COMMAND.execute(
        {
          kind: 'source_path',
          source_path: './sources/docs/modules/auth.md',
        },
        refreshContext,
      ),
    );
    assert.ok(refreshOutput.todo_created.length > 0);

    const statusContext = await runtime.createContext('status', backlogRoot);
    const statusOutput = StatusCommandOutputSchema.parse(
      await STATUS_COMMAND.execute({ refresh: false }, statusContext),
    );

    assert.ok(statusOutput.open_todo_count > 0);
    const persistedState = await readState(backlogRoot);
    assert.equal(persistedState.todos.length, statusOutput.open_todo_count);
    assert.ok(persistedState.todos.some((todo) => todo.managed_by === 'refresh'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('refresh does not advance source hashes when persisting state fails', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntimeForRefreshTest({
    nowIsoUtc: '2026-04-06T13:20:00.000Z',
  });

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await writeFile(
      path.join(backlogRoot, 'sources', 'docs', 'modules', 'auth.md'),
      await copyFixtureText('backlogs/refreshable-backlog/sources/docs/modules/auth.v2.md'),
      'utf8',
    );

    const registryBefore = await readSourceRegistry(backlogRoot);
    const authBefore = registryBefore.sources.find((source) => source.source_id === AUTH_SOURCE_ID);
    assert.ok(authBefore);

    const context = await runtime.createContext('refresh', backlogRoot);
    const originalWriteState = context.artifacts.writeState.bind(context.artifacts);
    context.artifacts.writeState = () => Promise.reject(new Error('simulated writeState failure'));

    await assert.rejects(
      async () =>
        await REFRESH_COMMAND.execute(
          {
            kind: 'source_path',
            source_path: './sources/docs/modules/auth.md',
          },
          context,
        ),
    );

    const registryAfter = await readSourceRegistry(backlogRoot);
    const authAfter = registryAfter.sources.find((source) => source.source_id === AUTH_SOURCE_ID);
    assert.equal(authAfter?.hash, authBefore.hash);
    assert.equal(authAfter?.last_checked_at, authBefore.last_checked_at);

    context.artifacts.writeState = originalWriteState;
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('refresh rolls state back when source registry persistence fails after state write', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntimeForRefreshTest({
    nowIsoUtc: '2026-04-06T13:35:00.000Z',
  });

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await writeFile(
      path.join(backlogRoot, 'sources', 'docs', 'modules', 'auth.md'),
      await copyFixtureText('backlogs/refreshable-backlog/sources/docs/modules/auth.v2.md'),
      'utf8',
    );

    const stateBefore = await readState(backlogRoot);
    const registryBefore = await readSourceRegistry(backlogRoot);
    const authBefore = registryBefore.sources.find((source) => source.source_id === AUTH_SOURCE_ID);
    assert.ok(authBefore);

    const context = await runtime.createContext('refresh', backlogRoot);
    context.artifacts.writeSourceRegistry = () =>
      Promise.reject(new Error('simulated writeSourceRegistry failure'));

    await assert.rejects(
      async () =>
        await REFRESH_COMMAND.execute(
          {
            kind: 'source_path',
            source_path: './sources/docs/modules/auth.md',
          },
          context,
        ),
    );

    const stateAfter = await readState(backlogRoot);
    const registryAfter = await readSourceRegistry(backlogRoot);
    const authAfter = registryAfter.sources.find((source) => source.source_id === AUTH_SOURCE_ID);

    assert.deepEqual(stateAfter, stateBefore);
    assert.equal(authAfter?.hash, authBefore.hash);
    assert.equal(authAfter?.last_checked_at, authBefore.last_checked_at);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
