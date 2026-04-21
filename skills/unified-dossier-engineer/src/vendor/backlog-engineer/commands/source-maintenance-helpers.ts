import path from 'node:path';

import type {
  CommandSuggestion,
  ItemKey,
  SchemaModule,
  SourceId,
  SourceRecord,
  SourceRegistryFile,
  SourceSummary,
  StateFile,
  Todo,
  TodoId,
} from '../schemas/index.ts';

export function sortKeys<T extends string>(values: Iterable<T>): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function toSourceOutput(payload: { backlogRoot: string; source: SourceRecord }): {
  source_id: SourceId;
  source_label: string;
  path: string;
  kind: string;
  authority: string;
  note?: string;
  hash: string;
} {
  return {
    source_id: payload.source.source_id,
    source_label: payload.source.source_label,
    path: path.resolve(payload.backlogRoot, payload.source.path),
    kind: payload.source.kind,
    authority: payload.source.authority,
    ...(payload.source.note ? { note: payload.source.note } : {}),
    hash: payload.source.hash,
  };
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

function syncUtilityOwnedSourceMessage(payload: {
  todo: Todo;
  previousRelatedSources: SourceSummary[];
  currentRelatedSources: SourceSummary[];
  nextRelatedSources: SourceSummary[];
}): string {
  if (payload.todo.type !== 'review_source_change') {
    return payload.todo.message;
  }

  const previousChangeMessage = createSourceChangeMessage(payload.previousRelatedSources);
  const currentChangeMessage = createSourceChangeMessage(payload.currentRelatedSources);
  if (
    payload.todo.message === previousChangeMessage ||
    payload.todo.message === currentChangeMessage
  ) {
    return createSourceChangeMessage(payload.nextRelatedSources);
  }

  const previousRemovalMessage = createSourceRemovalMessage(payload.previousRelatedSources);
  const currentRemovalMessage = createSourceRemovalMessage(payload.currentRelatedSources);
  if (
    payload.todo.message === previousRemovalMessage ||
    payload.todo.message === currentRemovalMessage
  ) {
    return createSourceRemovalMessage(payload.nextRelatedSources);
  }

  return payload.todo.message;
}

function relatedSourcesChanged(payload: {
  before: readonly SourceSummary[];
  after: readonly SourceSummary[];
}): boolean {
  if (payload.before.length !== payload.after.length) {
    return true;
  }

  return payload.before.some((source, index) => {
    const afterSource = payload.after[index];
    return (
      afterSource === undefined ||
      source.source_id !== afterSource.source_id ||
      source.source_label !== afterSource.source_label
    );
  });
}

export function syncTodoSourceLabels(payload: {
  schemas: SchemaModule;
  state: StateFile;
  registry: SourceRegistryFile;
  previousRegistry?: SourceRegistryFile;
}): {
  state: StateFile;
  todoUpdated: ItemKey[];
} {
  const labelsById = new Map(
    payload.registry.sources.map((source) => [source.source_id, source.source_label]),
  );
  const previousLabelsById = new Map(
    (payload.previousRegistry?.sources ?? []).map((source) => [
      source.source_id,
      source.source_label,
    ]),
  );
  const todoUpdated = new Set<ItemKey>();

  const todos = payload.state.todos.map((todo) => {
    const previousRelatedSources = todo.related_sources.map((source) => ({
      ...source,
      source_label: previousLabelsById.get(source.source_id) ?? source.source_label,
    }));
    const currentRelatedSources = todo.related_sources;
    const relatedSources = todo.related_sources.map((source) => {
      const nextLabel = labelsById.get(source.source_id) ?? source.source_label;

      return {
        ...source,
        source_label: nextLabel,
      };
    });
    const message = syncUtilityOwnedSourceMessage({
      todo,
      previousRelatedSources,
      currentRelatedSources,
      nextRelatedSources: relatedSources,
    });

    if (
      message !== todo.message ||
      relatedSourcesChanged({
        before: todo.related_sources,
        after: relatedSources,
      })
    ) {
      todoUpdated.add(todo.item_key);
    }

    return {
      ...todo,
      message,
      related_sources: relatedSources,
    };
  });

  return {
    state: payload.schemas.parseStateFile({
      ...payload.state,
      todos,
    }),
    todoUpdated: sortKeys(todoUpdated),
  };
}

export function mapTodoIdsToItemKeys(payload: {
  beforeState: StateFile;
  afterState: StateFile;
  todoIds: readonly TodoId[];
}): ItemKey[] {
  const todoById = new Map([
    ...payload.beforeState.todos.map((todo) => [todo.todo_id, todo.item_key] as const),
    ...payload.afterState.todos.map((todo) => [todo.todo_id, todo.item_key] as const),
  ]);

  return sortKeys(
    payload.todoIds.flatMap((todoId) => {
      const itemKey = todoById.get(todoId);
      return itemKey ? [itemKey] : [];
    }),
  );
}

export function buildReviewNextCommands(payload: {
  itemKeys: readonly ItemKey[];
  fallbackReason: string;
  itemsReason: string;
}): CommandSuggestion[] {
  const itemKeys = sortKeys(payload.itemKeys);
  if (itemKeys.length === 0) {
    return [];
  }

  return [
    {
      command: 'attention',
      args: [],
      reason: payload.fallbackReason,
    },
    {
      command: 'items',
      args: ['--item-keys', itemKeys.join(',')],
      reason: payload.itemsReason,
    },
  ];
}
