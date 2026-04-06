import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createAttentionService,
  createContextService,
  createDerivedStateService,
  createGraphService,
  createItemsService,
  createMutationService,
  createQueueService,
  createSearchService,
  createTodoService,
} from '../src/core/index.ts';
import { createErrorModule } from '../src/errors/index.ts';
import {
  createSchemaModule,
  type PacketFile,
  type PatchFile,
  type SourceRegistryFile,
  type StateFile,
} from '../src/schemas/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const FIXTURES_DIR = path.join(SKILL_DIR, 'test', 'fixtures');

async function readFixtureJson<T>(relativePath: string): Promise<T> {
  const fullPath = path.join(FIXTURES_DIR, relativePath);
  return JSON.parse(await readFile(fullPath, 'utf8')) as T;
}

function createCoreServices() {
  const errors = createErrorModule();
  const schemas = createSchemaModule();
  const clock = {
    nowIsoUtc() {
      return '2026-04-06T12:00:00.000Z';
    },
  };
  let uuidCounter = 0;
  const uuid = {
    create() {
      uuidCounter += 1;
      return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, '0')}`;
    },
  };

  const graph = createGraphService({ errors, schemas });
  const context = createContextService({ errors, schemas });
  const todo = createTodoService({ errors, schemas, clock, uuid });
  const derivedState = createDerivedStateService({ errors, schemas });
  const search = createSearchService({ errors, schemas });
  const items = createItemsService({ errors, schemas });
  const queue = createQueueService({ errors, schemas });
  const attention = createAttentionService({ errors, schemas });
  const mutation = createMutationService({
    errors,
    schemas,
    clock,
    graph,
    context,
    todo,
    derivedState,
  });

  return {
    errors,
    schemas,
    graph,
    context,
    todo,
    derivedState,
    search,
    items,
    queue,
    attention,
    mutation,
  };
}

function withTodos(state: StateFile, todos: StateFile['todos']): StateFile {
  const nextState = structuredClone(state);
  const todoIdsByItemKey = new Map<string, string[]>();

  for (const todo of todos) {
    const itemTodoIds = todoIdsByItemKey.get(todo.item_key) ?? [];
    itemTodoIds.push(todo.todo_id);
    todoIdsByItemKey.set(todo.item_key, itemTodoIds);
  }

  nextState.todos = todos;
  nextState.items = nextState.items.map((item) => ({
    ...item,
    open_todo_ids: todoIdsByItemKey.get(item.item_key) ?? [],
  }));

  return nextState;
}

function findTodosByItemAndType(payload: {
  state: StateFile;
  itemKey: string;
  type: StateFile['todos'][number]['type'];
}) {
  return payload.state.todos.filter(
    (todo) => todo.item_key === payload.itemKey && todo.type === payload.type,
  );
}

void test('graph-service enforces packet new-only rule', async () => {
  const { graph, errors } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/single-branch-backlog/.backlog/state.json',
  );
  const packet = await readFixtureJson<PacketFile>('authored/packets/session-ui.packet.json');
  const firstItem = packet.items[0];

  assert.ok(firstItem);

  graph.assertPacketAddsOnlyNewItems({ state, packet });

  assert.throws(
    () => {
      graph.assertPacketAddsOnlyNewItems({
        state,
        packet: {
          ...packet,
          items: [
            {
              ...firstItem,
              item_key: 'auth-core',
            },
          ],
        },
      });
    },
    (error: unknown) =>
      errors.isBacklogError(error) && error.code === 'BE_PACKET_ITEM_ALREADY_EXISTS',
  );
});

void test('graph-service syncs open_todo_ids when patch removes todo', async () => {
  const { graph } = createCoreServices();
  const state = await readFixtureJson<StateFile>('backlogs/todo-dedup-backlog/.backlog/state.json');
  const patch: PatchFile = {
    metadata: {
      patch_id: '2026-04-06-001-remove-banner-todo',
      created_at: '2026-04-06T12:00:00.000Z',
      sequence: 10,
      target_item_keys: ['session-ui-timeout-banner'],
    },
    operations: [
      {
        item_key: 'session-ui-timeout-banner',
        action: 'remove_todo',
        todo_ids: ['66666666-6666-4666-8666-666666666661'],
      },
    ],
  };

  const result = graph.applyPatchOperations({ state, patch });
  const item = result.state.items.find(
    (candidate) => candidate.item_key === 'session-ui-timeout-banner',
  );

  assert.ok(item);
  assert.deepEqual(item.open_todo_ids, []);
  assert.deepEqual(result.removedTodoIds, ['66666666-6666-4666-8666-666666666661']);
});

void test('graph-service cleans removed item references from dependent items and context entities', async () => {
  const { graph } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/context-linked-cleanup-backlog/.backlog/state.json',
  );

  const nextState = graph.cleanupRemovedItemReferences({
    state,
    removedItemKeys: ['legacy-auth-ui'],
  });

  assert.equal(
    nextState.items.some((item) => item.item_key === 'legacy-auth-ui'),
    false,
  );
  assert.equal(
    nextState.context.quality_attributes.some((qa) =>
      qa.applies_to_item_keys.includes('legacy-auth-ui'),
    ),
    false,
  );
  assert.equal(
    nextState.context.policy_decisions.some((policy) =>
      policy.related_item_keys.includes('legacy-auth-ui'),
    ),
    false,
  );
});

void test('context-service merges repeated immutable entities and rejects glossary conflicts', async () => {
  const { context, errors } = createCoreServices();
  const emptyState = await readFixtureJson<StateFile>('backlogs/empty-backlog/.backlog/state.json');
  const packet = await readFixtureJson<PacketFile>('authored/packets/auth-module.packet.json');
  const merged = context.mergePacketContext({ state: emptyState, packet });

  assert.deepEqual(merged.changedContextKeys.sort(), [
    'as_built',
    'claims',
    'contracts',
    'data_domains',
    'glossary',
    'key_strategy',
    'policy_decisions',
    'quality_attributes',
    'target_system',
  ]);

  context.assertImmutableContextEntities({
    state: merged.state,
    packet,
  });

  const glossaryConflict = await readFixtureJson<PacketFile>(
    'authored/packets/glossary-conflict.packet.json',
  );

  assert.throws(
    () => {
      context.assertNoGlossaryConflicts({
        state: merged.state,
        packet: glossaryConflict,
      });
    },
    (error: unknown) =>
      errors.isBacklogError(error) && error.code === 'BE_CONTEXT_CONFLICT_GLOSSARY',
  );
});

void test('context-service rejects conflicting immutable context entity by key', async () => {
  const { context, errors } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/single-branch-backlog/.backlog/state.json',
  );
  const packet = await readFixtureJson<PacketFile>(
    'authored/packets/immutable-context-conflict.packet.json',
  );

  assert.throws(
    () => {
      context.assertImmutableContextEntities({ state, packet });
    },
    (error: unknown) => errors.isBacklogError(error) && error.code === 'BE_CONTEXT_CONFLICT_ENTITY',
  );
});

void test('todo-service deduplicates source-change todo by semantic effect and supports removal', async () => {
  const { todo } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );

  const generatedTodos = todo.generateTodosForSourceChange({
    state,
    registry,
    sourceIds: ['11111111-1111-4111-8111-111111111111'],
    affectedItemKeys: ['auth-core', 'auth-core'],
  });

  const firstMerge = todo.createOrMergeTodos({
    state,
    todos: generatedTodos,
  });
  const secondMerge = todo.createOrMergeTodos({
    state: firstMerge.state,
    todos: generatedTodos,
  });
  const authCore = secondMerge.state.items.find((item) => item.item_key === 'auth-core');

  assert.deepEqual(firstMerge.createdTodoIds.length, 1);
  assert.deepEqual(secondMerge.createdTodoIds, []);
  assert.deepEqual(secondMerge.updatedTodoIds, []);
  assert.ok(authCore);
  assert.equal(authCore.open_todo_ids.length, 1);

  const removal = todo.removeTodos({
    state: secondMerge.state,
    todoIds: authCore.open_todo_ids,
  });
  const removedAuthCore = removal.state.items.find((item) => item.item_key === 'auth-core');

  assert.ok(removedAuthCore);
  assert.deepEqual(removedAuthCore.open_todo_ids, []);
});

void test('derived-state-service applies ordered attention reasons and stage-aligned readiness', async () => {
  const { derivedState } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/single-branch-backlog/.backlog/state.json',
  );
  const nextState = structuredClone(state);

  const target = nextState.items.find(
    (item) => item.item_key === 'auth-session-timeout-enforcement',
  );
  assert.ok(target);
  target.gaps = ['Still blocked'];
  nextState.todos = [
    {
      todo_id: '00000000-0000-4000-8000-000000000100',
      item_key: 'auth-session-timeout-enforcement',
      type: 'review_source_change',
      managed_by: 'refresh',
      message: 'Review source change',
      created_at: '2026-04-06T12:00:00.000Z',
      related_sources: [
        {
          source_id: '11111111-1111-4111-8111-111111111111',
          source_label: 'sources/docs/modules/auth.md',
        },
      ],
      related_item_keys: [],
    },
    {
      todo_id: '00000000-0000-4000-8000-000000000101',
      item_key: 'auth-session-timeout-enforcement',
      type: 'review_dependency_change',
      managed_by: 'refresh',
      message: 'Review dependency change',
      created_at: '2026-04-06T12:00:00.000Z',
      related_sources: [],
      related_item_keys: ['auth-core'],
    },
    {
      todo_id: '00000000-0000-4000-8000-000000000102',
      item_key: 'auth-session-timeout-enforcement',
      type: 'review_context_change',
      managed_by: 'mutation',
      message: 'Review context change',
      created_at: '2026-04-06T12:00:00.000Z',
      related_sources: [],
      related_item_keys: ['auth-session-timeout-enforcement'],
    },
  ];

  const recomputed = derivedState.recomputeAll(nextState);
  const computed = derivedState.computeItemState({
    state: recomputed,
    itemKey: 'auth-session-timeout-enforcement',
  });

  assert.deepEqual(computed.attention_reason_codes, [
    'source_changed',
    'dependency_changed',
    'context_changed',
    'gaps',
  ]);
  assert.equal(computed.needs_attention, true);
  assert.equal(computed.ready_for_next_step, false);

  const blockedState = structuredClone(state);
  const dependency = blockedState.items.find((item) => item.item_key === 'auth-core');
  assert.ok(dependency);
  dependency.delivery_state = 'defined';
  const blocked = derivedState
    .recomputeAll(blockedState)
    .items.find((item) => item.item_key === 'auth-session-timeout-enforcement');

  assert.ok(blocked);
  assert.equal(blocked.ready_for_next_step, false);
});

void test('mutation-service applyPacket adds new items without creating todo for new-only branch', async () => {
  const { mutation } = createCoreServices();
  const state = await readFixtureJson<StateFile>('backlogs/empty-backlog/.backlog/state.json');
  const packet = await readFixtureJson<PacketFile>('authored/packets/auth-module.packet.json');
  const registry: SourceRegistryFile = {
    schema_version: 1,
    created_at: '2026-04-06T12:00:00.000Z',
    updated_at: '2026-04-06T12:00:00.000Z',
    sources: [
      {
        source_id: '11111111-1111-4111-8111-111111111111',
        source_label: 'sources/docs/modules/auth.md',
        path: 'sources/docs/modules/auth.md',
        kind: 'module',
        authority: 'authoritative',
        note: 'Auth module architecture',
        hash: 'a'.repeat(64),
        registered_at: '2026-04-06T12:00:00.000Z',
        last_checked_at: '2026-04-06T12:00:00.000Z',
      },
    ],
  };

  const result = await mutation.applyPacket({
    state,
    packet,
    sourceRegistry: registry,
    packetId: 'packet-auth-001',
    dryRun: true,
  });

  assert.deepEqual(result.added, [
    'auth-core',
    'auth-session-timeout-audit',
    'auth-session-timeout-enforcement',
  ]);
  assert.deepEqual(result.todo_created, []);
  assert.deepEqual(result.todo_updated, []);
  assert.equal(result.state.items.length, 3);
});

void test('mutation-service applyPacket creates context todo for existing tasks referenced by new context entities', async () => {
  const { mutation } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/multi-branch-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/multi-branch-backlog/.backlog/sources.json',
  );
  const packet: PacketFile = {
    context: {
      glossary: [],
      key_strategy: state.context.key_strategy,
      target_system: [],
      as_built: [],
      claims: [],
      contracts: [],
      data_domains: [],
      quality_attributes: [
        {
          quality_attribute_key: 'new-timeout-observability',
          title: 'Observe timeout UI consistency',
          quality_class: 'observability',
          target: 'Track timeout UX consistency in dashboard',
          applies_to_item_keys: ['auth-session-timeout-enforcement'],
          owner_keys: ['identity-team'],
          source_ids: ['11111111-1111-4111-8111-111111111111'],
        },
      ],
      policy_decisions: [],
    },
    items: [],
  };

  const result = await mutation.applyPacket({
    state,
    packet,
    sourceRegistry: registry,
    packetId: 'packet-observability-001',
    dryRun: true,
  });

  assert.deepEqual(result.todo_created, [
    'auth-session-timeout-audit',
    'auth-session-timeout-enforcement',
    'session-ui-timeout-banner',
  ]);
});

void test('mutation-service applyPatch updates items and creates downstream dependency review todo', async () => {
  const { mutation } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/multi-branch-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/multi-branch-backlog/.backlog/sources.json',
  );
  const patch = await readFixtureJson<PatchFile>('authored/patches/auth-module.patch-item.json');

  const result = await mutation.applyPatch({
    state,
    patch,
    sourceRegistry: registry,
    dryRun: true,
  });

  assert.ok('updated' in result);
  assert.deepEqual(result.updated, ['auth-core', 'auth-session-timeout-enforcement']);
  assert.deepEqual(result.todo_created, [
    'auth-session-timeout-audit',
    'session-ui-timeout-banner',
  ]);
});

void test('mutation-service applyPatch keeps source-change review when all source links are removed', async () => {
  const { mutation } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/multi-branch-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/multi-branch-backlog/.backlog/sources.json',
  );
  const patch: PatchFile = {
    metadata: {
      patch_id: '2026-04-06-010-remove-auth-sources',
      created_at: '2026-04-06T12:00:00.000Z',
      sequence: 10,
      target_item_keys: ['auth-core'],
    },
    operations: [
      {
        action: 'replace_fields',
        item_key: 'auth-core',
        fields: {
          origin_source_ids: [],
          specification_source_ids: [],
          plan_source_ids: [],
          implementation_source_ids: [],
          test_source_ids: [],
        },
      },
    ],
  };

  const result = await mutation.applyPatch({
    state,
    patch,
    sourceRegistry: registry,
    dryRun: true,
  });

  assert.ok('updated' in result);
  assert.deepEqual(result.updated, ['auth-core']);
  assert.deepEqual(
    findTodosByItemAndType({
      state: result.state,
      itemKey: 'auth-core',
      type: 'review_source_change',
    }).map((todo) => todo.related_sources.map((source) => source.source_id)),
    [['11111111-1111-4111-8111-111111111111']],
  );
});

void test('mutation-service applyPatch keeps source-change cause per changed item in multi-item patches', async () => {
  const { mutation } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/multi-branch-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/multi-branch-backlog/.backlog/sources.json',
  );
  const patch: PatchFile = {
    metadata: {
      patch_id: '2026-04-06-011-multi-item-source-change',
      created_at: '2026-04-06T12:05:00.000Z',
      sequence: 11,
      target_item_keys: ['auth-core', 'session-ui-timeout-banner'],
    },
    operations: [
      {
        action: 'replace_fields',
        item_key: 'auth-core',
        fields: {
          origin_source_ids: [],
          specification_source_ids: [],
          plan_source_ids: [],
          implementation_source_ids: [],
          test_source_ids: [],
        },
      },
      {
        action: 'replace_fields',
        item_key: 'session-ui-timeout-banner',
        fields: {
          origin_source_ids: [],
          specification_source_ids: [],
          plan_source_ids: [],
          implementation_source_ids: [],
          test_source_ids: [],
        },
      },
    ],
  };

  const result = await mutation.applyPatch({
    state,
    patch,
    sourceRegistry: registry,
    dryRun: true,
  });

  const authCoreSourceTodos = findTodosByItemAndType({
    state: result.state,
    itemKey: 'auth-core',
    type: 'review_source_change',
  });
  const bannerSourceTodos = findTodosByItemAndType({
    state: result.state,
    itemKey: 'session-ui-timeout-banner',
    type: 'review_source_change',
  });
  const enforcementSourceTodos = findTodosByItemAndType({
    state: result.state,
    itemKey: 'auth-session-timeout-enforcement',
    type: 'review_source_change',
  });

  assert.deepEqual(
    authCoreSourceTodos.map((todo) => todo.related_sources.map((source) => source.source_id)),
    [['11111111-1111-4111-8111-111111111111']],
  );
  assert.deepEqual(
    bannerSourceTodos.map((todo) => todo.related_sources.map((source) => source.source_id).sort()),
    [['11111111-1111-4111-8111-111111111111'], ['33333333-3333-4333-8333-333333333333']],
  );
  assert.deepEqual(
    enforcementSourceTodos.map((todo) => todo.related_sources.map((source) => source.source_id)),
    [['11111111-1111-4111-8111-111111111111']],
  );
});

void test('mutation-service remove-item cleans context references and creates dependency review todo', async () => {
  const { mutation } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/context-linked-cleanup-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/context-linked-cleanup-backlog/.backlog/sources.json',
  );
  const patch = await readFixtureJson<PatchFile>(
    'authored/patches/remove-legacy-auth-ui.patch.json',
  );

  const result = await mutation.applyPatch({
    state,
    patch,
    sourceRegistry: registry,
    dryRun: true,
  });

  assert.ok('removed' in result);
  assert.deepEqual(result.removed, ['legacy-auth-ui']);
  assert.equal(
    result.state.items.some((item) => item.item_key === 'legacy-auth-ui'),
    false,
  );
  assert.equal(
    result.state.context.quality_attributes.some((qa) =>
      qa.applies_to_item_keys.includes('legacy-auth-ui'),
    ),
    false,
  );
  assert.equal(
    result.state.context.policy_decisions.some((policy) =>
      policy.related_item_keys.includes('legacy-auth-ui'),
    ),
    false,
  );
});

void test('mutation-service refresh creates source and dependency review todo and keeps context todo intact', async () => {
  const { mutation } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );

  const changed = await mutation.refresh({
    state,
    sourceRegistry: registry,
    changedSourceIds: ['11111111-1111-4111-8111-111111111111'],
    scope: { kind: 'all' },
  });

  assert.deepEqual(changed.changed_sources, [
    {
      source_id: '11111111-1111-4111-8111-111111111111',
      source_label: 'sources/docs/modules/auth.md',
    },
  ]);
  assert.deepEqual(changed.todo_created, [
    'auth-core',
    'auth-session-timeout-audit',
    'auth-session-timeout-enforcement',
    'session-ui-timeout-banner',
  ]);
  assert.equal(changed.state.last_refresh_at, '2026-04-06T12:00:00.000Z');

  const stateWithContextTodo = structuredClone(state);
  stateWithContextTodo.todos.push({
    todo_id: '00000000-0000-4000-8000-000000000200',
    item_key: 'auth-core',
    type: 'review_context_change',
    managed_by: 'mutation',
    message: 'Context changed',
    created_at: '2026-04-06T12:00:00.000Z',
    related_sources: [],
    related_item_keys: ['auth-core'],
  });
  stateWithContextTodo.items = stateWithContextTodo.items.map((item) =>
    item.item_key === 'auth-core'
      ? {
          ...item,
          open_todo_ids: ['00000000-0000-4000-8000-000000000200'],
          needs_attention: true,
          attention_reason_codes: ['context_changed'],
          attention_reasons: ['Нужен review: изменился контекст задачи.'],
          ready_for_next_step: false,
        }
      : item,
  );

  const unchanged = await mutation.refresh({
    state: stateWithContextTodo,
    sourceRegistry: registry,
    changedSourceIds: [],
    scope: { kind: 'all' },
  });

  assert.equal(
    unchanged.state.todos.some((todo) => todo.type === 'review_context_change'),
    true,
  );
});

void test('mutation-service refresh updates matching source review todo and replaces stale dependency review todo by semantic effect', async () => {
  const { mutation } = createCoreServices();
  const baseState = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );
  const state = withTodos(baseState, [
    {
      todo_id: '00000000-0000-4000-8000-000000000301',
      item_key: 'auth-core',
      type: 'review_source_change',
      managed_by: 'refresh',
      message: 'Outdated source review message',
      created_at: '2026-04-05T12:00:00.000Z',
      related_sources: [
        {
          source_id: '11111111-1111-4111-8111-111111111111',
          source_label: 'sources/docs/modules/auth.md',
        },
      ],
      related_item_keys: [],
    },
    {
      todo_id: '00000000-0000-4000-8000-000000000302',
      item_key: 'session-ui-timeout-banner',
      type: 'review_dependency_change',
      managed_by: 'refresh',
      message: 'Stale dependency review',
      created_at: '2026-04-05T12:00:00.000Z',
      related_sources: [
        {
          source_id: '11111111-1111-4111-8111-111111111111',
          source_label: 'sources/docs/modules/auth.md',
        },
      ],
      related_item_keys: ['auth-core'],
    },
  ]);

  const refreshed = await mutation.refresh({
    state,
    sourceRegistry: registry,
    changedSourceIds: ['11111111-1111-4111-8111-111111111111'],
    scope: { kind: 'all' },
  });

  const authCoreSourceTodos = findTodosByItemAndType({
    state: refreshed.state,
    itemKey: 'auth-core',
    type: 'review_source_change',
  });
  const bannerDependencyTodos = findTodosByItemAndType({
    state: refreshed.state,
    itemKey: 'session-ui-timeout-banner',
    type: 'review_dependency_change',
  });

  assert.equal(authCoreSourceTodos.length, 1);
  assert.deepEqual(
    authCoreSourceTodos[0]?.related_sources.map((source) => source.source_id),
    ['11111111-1111-4111-8111-111111111111'],
  );
  assert.equal(authCoreSourceTodos[0]?.message, 'Проверь источник: sources/docs/modules/auth.md.');
  assert.equal(bannerDependencyTodos.length, 1);
  assert.deepEqual(bannerDependencyTodos[0]?.related_item_keys, [
    'auth-core',
    'auth-session-timeout-audit',
    'auth-session-timeout-enforcement',
  ]);
  assert.deepEqual(refreshed.todo_removed, ['session-ui-timeout-banner']);
});

void test('mutation-service refresh with item scope limits review todo to item subgraph', async () => {
  const { mutation } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );

  const refreshed = await mutation.refresh({
    state,
    sourceRegistry: registry,
    changedSourceIds: ['11111111-1111-4111-8111-111111111111'],
    scope: { kind: 'item', item_key: 'auth-session-timeout-enforcement' },
  });

  assert.deepEqual(refreshed.todo_created, [
    'auth-session-timeout-audit',
    'auth-session-timeout-enforcement',
    'session-ui-timeout-banner',
  ]);
  assert.equal(
    refreshed.state.todos.some(
      (todo) => todo.item_key === 'auth-core' && todo.type === 'review_source_change',
    ),
    false,
  );
  assert.equal(
    refreshed.state.todos.some(
      (todo) =>
        todo.item_key === 'session-ui-timeout-banner' && todo.type === 'review_dependency_change',
    ),
    true,
  );
});

void test('mutation-service refresh resolves source scopes by source_id and source_path', async () => {
  const { mutation } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );

  const bySourceId = await mutation.refresh({
    state,
    sourceRegistry: registry,
    changedSourceIds: ['11111111-1111-4111-8111-111111111111'],
    scope: { kind: 'source_id', source_id: '11111111-1111-4111-8111-111111111111' },
  });
  const bySourceLabel = await mutation.refresh({
    state,
    sourceRegistry: registry,
    changedSourceIds: ['11111111-1111-4111-8111-111111111111'],
    scope: { kind: 'source_label', source_label: 'sources/docs/modules/auth.md' },
  });
  const bySourcePath = await mutation.refresh({
    state,
    sourceRegistry: registry,
    changedSourceIds: ['11111111-1111-4111-8111-111111111111'],
    scope: { kind: 'source_path', source_path: 'sources/docs/modules/auth.md' },
  });

  assert.deepEqual(bySourceId.todo_created, [
    'auth-core',
    'auth-session-timeout-audit',
    'auth-session-timeout-enforcement',
    'session-ui-timeout-banner',
  ]);
  assert.deepEqual(bySourceLabel.todo_created, bySourceId.todo_created);
  assert.deepEqual(bySourcePath.todo_created, bySourceId.todo_created);
  assert.deepEqual(bySourceLabel.changed_sources, bySourceId.changed_sources);
  assert.deepEqual(bySourcePath.changed_sources, bySourceId.changed_sources);
});

void test('mutation-service refresh preserves unrelated source review todo on multi-source items', async () => {
  const { mutation } = createCoreServices();
  const baseState = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const baseRegistry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );
  const state = structuredClone(baseState);
  const registry = structuredClone(baseRegistry);
  const authCore = state.items.find((item) => item.item_key === 'auth-core');

  assert.ok(authCore);
  authCore.origin_source_ids = [
    '11111111-1111-4111-8111-111111111111',
    '33333333-3333-4333-8333-333333333333',
  ];

  const stateWithTodo = withTodos(state, [
    {
      todo_id: '00000000-0000-4000-8000-000000000303',
      item_key: 'auth-core',
      type: 'review_source_change',
      managed_by: 'mutation',
      message: 'Review unrelated source',
      created_at: '2026-04-05T12:00:00.000Z',
      related_sources: [
        {
          source_id: '33333333-3333-4333-8333-333333333333',
          source_label: 'sources/docs/modules/session-ui.md',
        },
      ],
      related_item_keys: [],
    },
  ]);

  const refreshed = await mutation.refresh({
    state: stateWithTodo,
    sourceRegistry: registry,
    changedSourceIds: ['11111111-1111-4111-8111-111111111111'],
    scope: { kind: 'source_id', source_id: '11111111-1111-4111-8111-111111111111' },
  });

  const authCoreSourceTodos = findTodosByItemAndType({
    state: refreshed.state,
    itemKey: 'auth-core',
    type: 'review_source_change',
  });

  assert.equal(authCoreSourceTodos.length, 2);
  assert.deepEqual(
    authCoreSourceTodos
      .map((todo) => todo.related_sources.map((source) => source.source_id).join(','))
      .sort(),
    ['11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333'],
  );
});

void test('mutation-service refresh preserves unrelated refresh-managed dependency review on multi-source direct items', async () => {
  const { mutation } = createCoreServices();
  const baseState = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const baseRegistry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );
  const state = structuredClone(baseState);
  const registry = structuredClone(baseRegistry);
  const authCore = state.items.find((item) => item.item_key === 'auth-core');

  assert.ok(authCore);
  authCore.origin_source_ids = [
    '11111111-1111-4111-8111-111111111111',
    '33333333-3333-4333-8333-333333333333',
  ];

  const stateWithTodo = withTodos(state, [
    {
      todo_id: '00000000-0000-4000-8000-000000000304',
      item_key: 'session-ui-timeout-banner',
      type: 'review_dependency_change',
      managed_by: 'refresh',
      message: 'Review dependency after unrelated source change',
      created_at: '2026-04-05T12:00:00.000Z',
      related_sources: [
        {
          source_id: '33333333-3333-4333-8333-333333333333',
          source_label: 'sources/docs/modules/session-ui.md',
        },
      ],
      related_item_keys: ['auth-core'],
    },
  ]);

  const refreshed = await mutation.refresh({
    state: stateWithTodo,
    sourceRegistry: registry,
    changedSourceIds: ['11111111-1111-4111-8111-111111111111'],
    scope: { kind: 'source_id', source_id: '11111111-1111-4111-8111-111111111111' },
  });

  const bannerDependencyTodos = findTodosByItemAndType({
    state: refreshed.state,
    itemKey: 'session-ui-timeout-banner',
    type: 'review_dependency_change',
  });

  assert.equal(bannerDependencyTodos.length, 2);
  assert.deepEqual(
    bannerDependencyTodos.map((todo) =>
      todo.related_sources.map((source) => source.source_id).join(','),
    ),
    ['11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333'],
  );
});

void test('items-service returns full cards in requested order', async () => {
  const { items } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );

  const result = items.getItems({
    state,
    itemKeys: ['session-ui-timeout-banner', 'auth-core'],
    registry,
  });

  assert.deepEqual(
    result.map((entry) => entry.item.item_key),
    ['session-ui-timeout-banner', 'auth-core'],
  );
  assert.deepEqual(
    result[0]?.source_summaries.map((source) => source.source_label),
    ['sources/docs/modules/session-ui.md'],
  );
  assert.deepEqual(result[1]?.context.contract_keys, ['auth-session-contract']);
});

void test('search-service filters deterministically and returns compact matches', async () => {
  const { search } = createCoreServices();
  const state = await readFixtureJson<StateFile>('backlogs/todo-dedup-backlog/.backlog/state.json');
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/todo-dedup-backlog/.backlog/sources.json',
  );

  const result = search.search({
    state,
    registry,
    filters: {
      needs_attention: true,
    },
  });

  assert.deepEqual(
    result.map((entry) => entry.item_key),
    ['auth-session-timeout-audit', 'session-ui-timeout-banner'],
  );
  assert.deepEqual(result[0]?.match_reasons, ['needs_attention=true']);
});

void test('search-service intersects combined filters and reports only matching source_ids', async () => {
  const { search } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );

  const result = search.search({
    state,
    registry,
    filters: {
      source_ids: ['11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333'],
      contract_keys: ['auth-session-contract'],
      needs_attention: false,
    },
  });

  assert.deepEqual(
    result.map((entry) => entry.item_key),
    ['auth-core', 'auth-session-timeout-enforcement'],
  );
  assert.deepEqual(result[0]?.match_reasons, [
    'source_ids=11111111-1111-4111-8111-111111111111',
    'needs_attention=false',
    'contract_keys=auth-session-contract',
  ]);
});

void test('search-service supports every documented filter branch', async () => {
  const { search } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );

  const cases: Array<{
    name: string;
    filters: Parameters<typeof search.search>[0]['filters'];
    expected: string[];
  }> = [
    {
      name: 'source_ids',
      filters: {
        source_ids: ['11111111-1111-4111-8111-111111111111'],
      },
      expected: ['auth-core', 'auth-session-timeout-audit', 'auth-session-timeout-enforcement'],
    },
    {
      name: 'delivery_state',
      filters: {
        delivery_state: 'defined' as const,
      },
      expected: ['auth-session-timeout-audit', 'session-ui-timeout-banner'],
    },
    {
      name: 'ready_for_next_step',
      filters: {
        ready_for_next_step: true,
      },
      expected: ['auth-core', 'auth-session-timeout-enforcement', 'session-ui-timeout-banner'],
    },
    {
      name: 'claim_keys',
      filters: {
        claim_keys: ['auth-session-timeout'],
      },
      expected: ['auth-session-timeout-audit', 'auth-session-timeout-enforcement'],
    },
    {
      name: 'contract_keys',
      filters: {
        contract_keys: ['auth-session-contract'],
      },
      expected: ['auth-core', 'auth-session-timeout-enforcement'],
    },
    {
      name: 'data_domain_keys',
      filters: {
        data_domain_keys: ['user-session'],
      },
      expected: ['auth-core', 'auth-session-timeout-audit', 'auth-session-timeout-enforcement'],
    },
    {
      name: 'quality_attribute_keys',
      filters: {
        quality_attribute_keys: ['security-session-timeout'],
      },
      expected: ['auth-session-timeout-audit', 'auth-session-timeout-enforcement'],
    },
    {
      name: 'policy_decision_keys',
      filters: {
        policy_decision_keys: ['policy-session-timeout-required'],
      },
      expected: ['auth-session-timeout-enforcement'],
    },
  ];

  for (const testCase of cases) {
    const result = search.search({
      state,
      registry,
      filters: testCase.filters,
    });

    assert.deepEqual(
      result.map((entry) => entry.item_key),
      testCase.expected,
      `search filter branch ${testCase.name}`,
    );
  }
});

void test('items-service rejects an unknown item key with command-level error code', async () => {
  const { items, errors } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );

  assert.throws(
    () =>
      items.getItems({
        state,
        itemKeys: ['missing-item'],
        registry,
      }),
    (error: unknown) => errors.isBacklogError(error) && error.code === 'BE_ITEM_NOT_FOUND',
  );
});

void test('queue-service returns ordered chains for ready work', async () => {
  const { queue } = createCoreServices();
  const state = await readFixtureJson<StateFile>(
    'backlogs/multi-branch-backlog/.backlog/state.json',
  );

  const result = queue.buildQueueChains({ state });

  assert.deepEqual(result, [
    {
      root_item_key: 'auth-core',
      items: ['auth-core', 'auth-session-timeout-enforcement', 'session-ui-timeout-banner'],
      ordering_rule: ['depth', 'downstream_dependency_count', 'item_key'],
    },
    {
      root_item_key: 'billing-core',
      items: ['billing-core', 'billing-invoice-export'],
      ordering_rule: ['depth', 'downstream_dependency_count', 'item_key'],
    },
  ]);
});

void test('queue-service excludes blocked, gap-bearing, and already-implemented tasks', async () => {
  const { queue } = createCoreServices();
  const state = await readFixtureJson<StateFile>('backlogs/todo-dedup-backlog/.backlog/state.json');

  const result = queue.buildQueueChains({ state });

  assert.deepEqual(result, [
    {
      root_item_key: 'auth-core',
      items: ['auth-core', 'auth-session-timeout-enforcement'],
      ordering_rule: ['depth', 'downstream_dependency_count', 'item_key'],
    },
  ]);
});

void test('attention-service returns items ordered by severity then item_key', async () => {
  const { attention } = createCoreServices();
  const state = await readFixtureJson<StateFile>('backlogs/todo-dedup-backlog/.backlog/state.json');
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/todo-dedup-backlog/.backlog/sources.json',
  );

  const result = attention.buildAttentionList({
    state,
    registry,
  });

  assert.deepEqual(
    result.map((entry) => entry.item_key),
    ['session-ui-timeout-banner', 'auth-session-timeout-audit'],
  );
  assert.deepEqual(result[0]?.attention_reason_codes, ['dependency_changed']);
  assert.deepEqual(result[1]?.attention_reason_codes, ['gaps']);
});

void test('attention-service excludes clean items and carries source summaries', async () => {
  const { attention } = createCoreServices();
  const state = await readFixtureJson<StateFile>('backlogs/todo-dedup-backlog/.backlog/state.json');
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/todo-dedup-backlog/.backlog/sources.json',
  );

  const result = attention.buildAttentionList({
    state,
    registry,
  });

  assert.equal(
    result.some((entry) => entry.item_key === 'auth-core'),
    false,
  );
  assert.deepEqual(result[0]?.source_summaries, [
    {
      source_id: '33333333-3333-4333-8333-333333333333',
      source_label: 'sources/docs/modules/session-ui.md',
    },
  ]);
  assert.deepEqual(result[1]?.source_summaries, [
    {
      source_id: '11111111-1111-4111-8111-111111111111',
      source_label: 'sources/docs/modules/auth.md',
    },
  ]);
});

void test('mutation-service refresh removes stale refresh-managed todo when selected source is unchanged', async () => {
  const { mutation } = createCoreServices();
  const baseState = await readFixtureJson<StateFile>(
    'backlogs/refreshable-backlog/.backlog/state.json',
  );
  const registry = await readFixtureJson<SourceRegistryFile>(
    'backlogs/refreshable-backlog/.backlog/sources.json',
  );
  const state = withTodos(baseState, [
    {
      todo_id: '00000000-0000-4000-8000-000000000304',
      item_key: 'auth-core',
      type: 'review_source_change',
      managed_by: 'refresh',
      message: 'Refresh-managed source review',
      created_at: '2026-04-05T12:00:00.000Z',
      related_sources: [
        {
          source_id: '11111111-1111-4111-8111-111111111111',
          source_label: 'sources/docs/modules/auth.md',
        },
      ],
      related_item_keys: [],
    },
    {
      todo_id: '00000000-0000-4000-8000-000000000305',
      item_key: 'session-ui-timeout-banner',
      type: 'review_dependency_change',
      managed_by: 'refresh',
      message: 'Refresh-managed dependency review',
      created_at: '2026-04-05T12:00:00.000Z',
      related_sources: [
        {
          source_id: '11111111-1111-4111-8111-111111111111',
          source_label: 'sources/docs/modules/auth.md',
        },
      ],
      related_item_keys: [
        'auth-core',
        'auth-session-timeout-audit',
        'auth-session-timeout-enforcement',
      ],
    },
  ]);

  const refreshed = await mutation.refresh({
    state,
    sourceRegistry: registry,
    changedSourceIds: [],
    scope: { kind: 'source_id', source_id: '11111111-1111-4111-8111-111111111111' },
  });

  assert.equal(
    refreshed.state.todos.some(
      (todo) => todo.item_key === 'auth-core' && todo.type === 'review_source_change',
    ),
    false,
  );
  assert.equal(
    refreshed.state.todos.some(
      (todo) =>
        todo.item_key === 'session-ui-timeout-banner' && todo.type === 'review_dependency_change',
    ),
    false,
  );
  assert.deepEqual(refreshed.todo_removed, ['auth-core', 'session-ui-timeout-banner']);
});
