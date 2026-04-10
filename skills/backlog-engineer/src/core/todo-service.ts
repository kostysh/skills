import type { ErrorModule } from '../errors/index.ts';
import type {
  ItemKey,
  SchemaModule,
  SourceId,
  SourceRegistryFile,
  SourceSummary,
  Todo,
  TodoId,
  TodoManagedBy,
  TodoType,
} from '../schemas/index.ts';
import type { ClockPort, UuidPort } from '../runtime/ports.ts';
import { synchronizeOpenTodoIds } from './replay-pipeline.ts';
import type { TodoService } from './types.ts';

function cloneState<T>(value: T): T {
  return structuredClone(value);
}

function sortItemKeys(values: Iterable<ItemKey>): ItemKey[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function sortSourceSummaries(values: Iterable<SourceSummary>): SourceSummary[] {
  const deduped = new Map<string, SourceSummary>();
  for (const value of values) {
    deduped.set(value.source_id, value);
  }

  return [...deduped.values()].sort((left, right) => {
    const labelCompare = left.source_label.localeCompare(right.source_label);
    if (labelCompare !== 0) {
      return labelCompare;
    }

    return left.source_id.localeCompare(right.source_id);
  });
}

function sortTodos(values: readonly Todo[]): Todo[] {
  return [...values].sort((left, right) => left.todo_id.localeCompare(right.todo_id));
}

function resolveTodoManagedBy(todo: Todo): TodoManagedBy {
  return todo.managed_by ?? 'mutation';
}

function buildSemanticKey(todo: Todo): string {
  const sourceIds = sortSourceSummaries(todo.related_sources).map((source) => source.source_id);
  const relatedItemKeys = sortItemKeys(todo.related_item_keys);
  return [todo.item_key, todo.type, sourceIds.join(','), relatedItemKeys.join(',')].join('|');
}

function createSourceChangeMessage(relatedSources: readonly SourceSummary[]): string {
  const labels = sortSourceSummaries(relatedSources).map((source) => source.source_label);
  if (labels.length === 0) {
    return 'Review the linked source change.';
  }

  return `Review source change: ${labels.join(', ')}.`;
}

function createSourceRemovalMessage(relatedSources: readonly SourceSummary[]): string {
  const labels = sortSourceSummaries(relatedSources).map((source) => source.source_label);
  if (labels.length === 0) {
    return 'Source was removed. Review whether this task needs replacement source coverage.';
  }

  return `Source was removed: ${labels.join(', ')}. Review whether this task needs replacement source coverage.`;
}

function createDependencyChangeMessage(relatedItemKeys: readonly ItemKey[]): string {
  const keys = sortItemKeys(relatedItemKeys);
  if (keys.length === 0) {
    return 'Review dependency changes for this task.';
  }

  return `Upstream task changed: ${keys.join(', ')}. Review whether this task needs updates.`;
}

function createContextChangeMessage(relatedItemKeys: readonly ItemKey[]): string {
  const keys = sortItemKeys(relatedItemKeys);
  if (keys.length === 0) {
    return 'Review task context changes.';
  }

  return `Task context changed through: ${keys.join(', ')}. Review whether updates are needed.`;
}

function buildTodo(payload: {
  uuid: UuidPort;
  clock: ClockPort;
  itemKey: ItemKey;
  type: TodoType;
  managedBy: TodoManagedBy;
  relatedSources?: SourceSummary[];
  relatedItemKeys?: ItemKey[];
  message?: string;
}): Todo {
  const relatedSources = sortSourceSummaries(payload.relatedSources ?? []);
  const relatedItemKeys = sortItemKeys(payload.relatedItemKeys ?? []);

  const message =
    payload.message ??
    (payload.type === 'review_source_change'
      ? createSourceChangeMessage(relatedSources)
      : payload.type === 'review_dependency_change'
        ? createDependencyChangeMessage(relatedItemKeys)
        : createContextChangeMessage(relatedItemKeys));

  return {
    todo_id: payload.uuid.create(),
    item_key: payload.itemKey,
    type: payload.type,
    managed_by: payload.managedBy,
    message,
    created_at: payload.clock.nowIsoUtc(),
    related_sources: relatedSources,
    related_item_keys: relatedItemKeys,
  };
}

function resolveSourceSummaries(payload: {
  registry: SourceRegistryFile;
  sourceIds: readonly SourceId[];
  errors: ErrorModule;
}): SourceSummary[] {
  const byId = new Map(payload.registry.sources.map((source) => [source.source_id, source]));
  const summaries: SourceSummary[] = [];

  for (const sourceId of payload.sourceIds) {
    const source = byId.get(sourceId);
    if (!source) {
      throw payload.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
        details: {
          source_id: sourceId,
        },
      });
    }

    summaries.push({
      source_id: source.source_id,
      source_label: source.source_label,
    });
  }

  return sortSourceSummaries(summaries);
}

export function createTodoService(payload: {
  errors: ErrorModule;
  schemas: SchemaModule;
  clock: ClockPort;
  uuid: UuidPort;
}): TodoService {
  return {
    createOrMergeTodos({ state, todos }) {
      const nextState = cloneState(state);
      const bySemanticKey = new Map(nextState.todos.map((todo) => [buildSemanticKey(todo), todo]));
      const createdTodoIds: TodoId[] = [];
      const updatedTodoIds: TodoId[] = [];

      for (const incomingTodo of sortTodos(todos)) {
        const semanticKey = buildSemanticKey(incomingTodo);
        const existing = bySemanticKey.get(semanticKey);
        if (!existing) {
          nextState.todos.push(incomingTodo);
          bySemanticKey.set(semanticKey, incomingTodo);
          createdTodoIds.push(incomingTodo.todo_id);
          continue;
        }

        const normalizedIncoming: Todo = {
          ...incomingTodo,
          todo_id: existing.todo_id,
          created_at: existing.created_at,
          managed_by:
            resolveTodoManagedBy(existing) === 'mutation' ||
            resolveTodoManagedBy(incomingTodo) === 'mutation'
              ? 'mutation'
              : 'refresh',
        };

        if (JSON.stringify(existing) === JSON.stringify(normalizedIncoming)) {
          continue;
        }

        nextState.todos = nextState.todos.map((todo) =>
          todo.todo_id === existing.todo_id ? normalizedIncoming : todo,
        );
        bySemanticKey.set(semanticKey, normalizedIncoming);
        updatedTodoIds.push(existing.todo_id);
      }

      nextState.todos = sortTodos(nextState.todos);
      const synchronizedState = synchronizeOpenTodoIds({
        schemas: payload.schemas,
        state: nextState,
      });

      return {
        state: synchronizedState,
        createdTodoIds: sortItemKeys(createdTodoIds),
        updatedTodoIds: sortItemKeys(updatedTodoIds),
      };
    },

    removeTodos({ state, todoIds }) {
      const nextState = cloneState(state);
      const requestedTodoIds = new Set(todoIds);
      const existingTodoIds = new Set(nextState.todos.map((todo) => todo.todo_id));

      for (const todoId of requestedTodoIds) {
        if (existingTodoIds.has(todoId)) {
          continue;
        }

        throw payload.errors.create('BE_TODO_NOT_FOUND', undefined, {
          details: {
            todo_id: todoId,
          },
        });
      }

      nextState.todos = sortTodos(
        nextState.todos.filter((todo) => !requestedTodoIds.has(todo.todo_id)),
      );
      const synchronizedState = synchronizeOpenTodoIds({
        schemas: payload.schemas,
        state: nextState,
      });

      return {
        state: synchronizedState,
        removedTodoIds: sortItemKeys(requestedTodoIds),
      };
    },

    generateTodosForSourceChange({
      state,
      registry,
      sourceIds,
      affectedItemKeys,
      requireDirectSourceLink = true,
      managedBy = 'mutation',
    }) {
      const relatedSources = resolveSourceSummaries({
        registry,
        sourceIds,
        errors: payload.errors,
      });
      const itemKeys = sortItemKeys(affectedItemKeys);
      const itemsByKey = new Map(state.items.map((item) => [item.item_key, item]));

      return itemKeys.flatMap((itemKey) => {
        const item = itemsByKey.get(itemKey);
        if (!item) {
          return [];
        }

        const itemSourceIds = new Set([
          ...item.origin_source_ids,
          ...item.specification_source_ids,
          ...item.plan_source_ids,
          ...item.implementation_source_ids,
          ...item.test_source_ids,
        ]);
        const relevantSources = relatedSources.filter((source) =>
          itemSourceIds.has(source.source_id),
        );
        if (requireDirectSourceLink && relevantSources.length === 0) {
          return [];
        }

        return [
          buildTodo({
            uuid: payload.uuid,
            clock: payload.clock,
            itemKey,
            type: 'review_source_change',
            managedBy,
            relatedSources: requireDirectSourceLink ? relevantSources : relatedSources,
          }),
        ];
      });
    },

    generateTodosForSourceRemoval({
      state,
      registry,
      sourceIds,
      affectedItemKeys,
      managedBy = 'mutation',
    }) {
      const relatedSources = resolveSourceSummaries({
        registry,
        sourceIds,
        errors: payload.errors,
      });
      const itemKeys = sortItemKeys(affectedItemKeys);
      const itemsByKey = new Map(state.items.map((item) => [item.item_key, item]));
      const message = createSourceRemovalMessage(relatedSources);

      return itemKeys.flatMap((itemKey) => {
        if (!itemsByKey.has(itemKey)) {
          return [];
        }

        return [
          buildTodo({
            uuid: payload.uuid,
            clock: payload.clock,
            itemKey,
            type: 'review_source_change',
            managedBy,
            relatedSources,
            message,
          }),
        ];
      });
    },

    generateTodosForDependencyChange({
      dependentItemKeys,
      changedItemKeys,
      managedBy = 'mutation',
      relatedSources = [],
    }) {
      const sortedChangedKeys = sortItemKeys(changedItemKeys);
      const sortedRelatedSources = sortSourceSummaries(relatedSources);
      return sortItemKeys(dependentItemKeys).map((itemKey) =>
        buildTodo({
          uuid: payload.uuid,
          clock: payload.clock,
          itemKey,
          type: 'review_dependency_change',
          managedBy,
          relatedSources: sortedRelatedSources,
          relatedItemKeys: sortedChangedKeys,
        }),
      );
    },

    generateTodosForContextChange({ changedItemKeys, affectedItemKeys, managedBy = 'mutation' }) {
      const sortedChangedKeys = sortItemKeys(changedItemKeys);
      const targetItemKeys = sortItemKeys(affectedItemKeys ?? changedItemKeys);
      return targetItemKeys.map((itemKey) =>
        buildTodo({
          uuid: payload.uuid,
          clock: payload.clock,
          itemKey,
          type: 'review_context_change',
          managedBy,
          relatedItemKeys: sortedChangedKeys,
        }),
      );
    },
  };
}
