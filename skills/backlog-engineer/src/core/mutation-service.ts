import type { ErrorModule } from '../errors/index.ts';
import type { ClockPort } from '../runtime/ports.ts';
import type {
  CommandSuggestion,
  ItemKey,
  PacketFile,
  PatchFile,
  RefreshCommandInput,
  RefreshCommandOutput,
  SchemaModule,
  SourceId,
  SourceRegistryFile,
  SourceSummary,
  StateFile,
  Todo,
  TodoId,
} from '../schemas/index.ts';
import { synchronizeOpenTodoIds } from './replay-pipeline.ts';
import type {
  ContextService,
  DerivedStateService,
  GraphService,
  MutationService,
  PacketMutationSummary,
  TodoService,
} from './types.ts';

type PacketSummary = PacketMutationSummary & { state: StateFile };
type RefreshSummary = RefreshCommandOutput & { state: StateFile; registry: SourceRegistryFile };

function sortKeys<T extends string>(values: Iterable<T>): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function cloneState<T>(value: T): T {
  return structuredClone(value);
}

function collectItemSourceIds(item: StateFile['items'][number]): Set<SourceId> {
  return new Set<SourceId>([
    ...item.origin_source_ids,
    ...item.specification_source_ids,
    ...item.plan_source_ids,
    ...item.implementation_source_ids,
    ...item.test_source_ids,
  ]);
}

function buildSourceSummaryLookup(registry: SourceRegistryFile): Map<SourceId, SourceSummary> {
  return new Map(
    registry.sources.map((source) => [
      source.source_id,
      {
        source_id: source.source_id,
        source_label: source.source_label,
      },
    ]),
  );
}

function resolveSourceIdsFromScope(payload: {
  registry: SourceRegistryFile;
  scope: RefreshCommandInput;
  errors: ErrorModule;
}): SourceId[] {
  const { scope } = payload;

  if (scope.kind === 'all' || scope.kind === 'item') {
    return [];
  }

  if (scope.kind === 'source_id') {
    if (!payload.registry.sources.some((source) => source.source_id === scope.source_id)) {
      throw payload.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
        details: {
          source_id: scope.source_id,
        },
      });
    }
    return [scope.source_id];
  }

  if (scope.kind === 'source_label') {
    const source = payload.registry.sources.find(
      (candidate) => candidate.source_label === scope.source_label,
    );
    if (!source) {
      throw payload.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
        details: {
          source_label: scope.source_label,
        },
      });
    }
    return [source.source_id];
  }

  const source = payload.registry.sources.find(
    (candidate) =>
      candidate.path === scope.source_path || candidate.source_label === scope.source_path,
  );
  if (!source) {
    throw payload.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
      details: {
        source_path: scope.source_path,
      },
    });
  }
  return [source.source_id];
}

function collectLinkedItemKeysBySourceIds(payload: {
  state: StateFile;
  sourceIds: readonly SourceId[];
}): ItemKey[] {
  const selectedSourceIds = new Set(payload.sourceIds);
  return sortKeys(
    payload.state.items
      .filter((item) => {
        const itemSourceIds = collectItemSourceIds(item);
        return [...selectedSourceIds].some((sourceId) => itemSourceIds.has(sourceId));
      })
      .map((item) => item.item_key),
  );
}

function collectPacketContextAffectedExistingItems(payload: {
  beforeState: StateFile;
  packet: PacketFile;
}): ItemKey[] {
  const existingItemKeys = new Set(payload.beforeState.items.map((item) => item.item_key));
  const existingQualityAttributeKeys = new Set(
    payload.beforeState.context.quality_attributes.map(
      (qualityAttribute) => qualityAttribute.quality_attribute_key,
    ),
  );
  const existingPolicyDecisionKeys = new Set(
    payload.beforeState.context.policy_decisions.map(
      (policyDecision) => policyDecision.policy_decision_key,
    ),
  );
  const affected = new Set<ItemKey>();

  for (const qualityAttribute of payload.packet.context.quality_attributes) {
    if (existingQualityAttributeKeys.has(qualityAttribute.quality_attribute_key)) {
      continue;
    }
    for (const itemKey of qualityAttribute.applies_to_item_keys) {
      if (existingItemKeys.has(itemKey)) {
        affected.add(itemKey);
      }
    }
  }

  for (const policyDecision of payload.packet.context.policy_decisions) {
    if (existingPolicyDecisionKeys.has(policyDecision.policy_decision_key)) {
      continue;
    }
    for (const itemKey of policyDecision.related_item_keys) {
      if (existingItemKeys.has(itemKey)) {
        affected.add(itemKey);
      }
    }
  }

  return sortKeys(affected);
}

function collectDownstreamItemKeys(
  graph: GraphService,
  state: StateFile,
  rootItemKeys: readonly ItemKey[],
): ItemKey[] {
  const rootSet = new Set(rootItemKeys);
  return graph
    .resolveItemSubgraph({
      state,
      rootItemKeys: [...rootSet],
    })
    .filter((itemKey) => !rootSet.has(itemKey));
}

function collectChangedSourceIdsForItems(payload: {
  beforeState: StateFile;
  afterState: StateFile;
  itemKeys: readonly ItemKey[];
}): Map<ItemKey, SourceId[]> {
  const beforeByKey = new Map(payload.beforeState.items.map((item) => [item.item_key, item]));
  const afterByKey = new Map(payload.afterState.items.map((item) => [item.item_key, item]));
  const sourceIdsByItem = new Map<ItemKey, SourceId[]>();

  for (const itemKey of sortKeys(payload.itemKeys)) {
    const beforeItem = beforeByKey.get(itemKey);
    const afterItem = afterByKey.get(itemKey);
    const sourceIds = sortKeys(
      new Set([
        ...(beforeItem ? [...collectItemSourceIds(beforeItem)] : []),
        ...(afterItem ? [...collectItemSourceIds(afterItem)] : []),
      ]),
    );

    sourceIdsByItem.set(itemKey, sourceIds);
  }

  return sourceIdsByItem;
}

function collectPatchFieldChanges(patch: PatchFile): {
  changedItemKeys: ItemKey[];
  sourceChangedItemKeys: ItemKey[];
  contextChangedItemKeys: ItemKey[];
} {
  const changedItemKeys = new Set<ItemKey>();
  const sourceChangedItemKeys = new Set<ItemKey>();
  const contextChangedItemKeys = new Set<ItemKey>();
  const sourceFieldNames = new Set([
    'origin_source_ids',
    'specification_source_ids',
    'plan_source_ids',
    'implementation_source_ids',
    'test_source_ids',
  ]);
  const contextFieldNames = new Set([
    'claim_keys',
    'contract_keys',
    'data_domain_keys',
    'quality_attribute_keys',
    'policy_decision_keys',
  ]);

  for (const operation of patch.operations) {
    if (operation.action === 'remove_todo' || operation.action === 'remove_item') {
      continue;
    }

    changedItemKeys.add(operation.item_key);

    if (operation.action === 'replace_fields') {
      for (const fieldName of Object.keys(operation.fields)) {
        if (sourceFieldNames.has(fieldName)) {
          sourceChangedItemKeys.add(operation.item_key);
        }
        if (contextFieldNames.has(fieldName)) {
          contextChangedItemKeys.add(operation.item_key);
        }
      }
      continue;
    }

    if (sourceFieldNames.has(operation.field)) {
      sourceChangedItemKeys.add(operation.item_key);
    }
    if (contextFieldNames.has(operation.field)) {
      contextChangedItemKeys.add(operation.item_key);
    }
  }

  return {
    changedItemKeys: sortKeys(changedItemKeys),
    sourceChangedItemKeys: sortKeys(sourceChangedItemKeys),
    contextChangedItemKeys: sortKeys(contextChangedItemKeys),
  };
}

function mapTodoIdsToItemKeys(payload: {
  state: StateFile;
  todoIds: readonly TodoId[];
}): ItemKey[] {
  if (payload.todoIds.length === 0) {
    return [];
  }

  const todoById = new Map(payload.state.todos.map((todo) => [todo.todo_id, todo.item_key]));
  return sortKeys(
    payload.todoIds.flatMap((todoId) => {
      const itemKey = todoById.get(todoId);
      return itemKey ? [itemKey] : [];
    }),
  );
}

function assertPatchTodoOperationsAreMutationSafe(payload: {
  state: StateFile;
  patch: PatchFile;
  errors: ErrorModule;
}): void {
  const todosById = new Map(payload.state.todos.map((todo) => [todo.todo_id, todo] as const));

  for (const operation of payload.patch.operations) {
    if (operation.action !== 'remove_todo') {
      continue;
    }

    for (const todoId of operation.todo_ids) {
      const todo = todosById.get(todoId);
      if (!todo) {
        continue;
      }

      if ((todo.managed_by ?? 'mutation') !== 'refresh') {
        continue;
      }

      throw payload.errors.create('BE_TODO_REFRESH_MANAGED', undefined, {
        details: {
          item_key: operation.item_key,
          todo_id: todoId,
          todo_type: todo.type,
          managed_by: todo.managed_by ?? 'refresh',
        },
        hint: 'Refresh-managed review todo are cleared through scoped refresh, not patch-item. Re-run refresh after review; use patch-item only if the review changes backlog truth.',
      });
    }
  }
}

function touchState(payload: {
  schemas: SchemaModule;
  state: StateFile;
  updatedAt: string;
  refreshAt?: string;
}): StateFile {
  return payload.schemas.parseStateFile({
    ...payload.state,
    updated_at: payload.updatedAt,
    ...(payload.refreshAt !== undefined ? { last_refresh_at: payload.refreshAt } : {}),
  });
}

function buildMutationNextCommands(payload: {
  todoCreated: readonly ItemKey[];
  todoUpdated: readonly ItemKey[];
  fallbackReason: string;
  itemsReason: string;
}): CommandSuggestion[] {
  const itemKeys = sortKeys([...payload.todoCreated, ...payload.todoUpdated]);
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

function buildRefreshNextCommands(itemKeys: readonly ItemKey[]): CommandSuggestion[] {
  const normalizedItemKeys = sortKeys(itemKeys);
  if (normalizedItemKeys.length === 0) {
    return [];
  }

  return [
    {
      command: 'attention',
      args: [],
      reason: 'Review tasks affected by refreshed source changes.',
    },
    {
      command: 'items',
      args: ['--item-keys', normalizedItemKeys.join(',')],
      reason: 'Inspect the full cards of tasks with refreshed review todo.',
    },
  ];
}

function sortChangedSources(changedSources: readonly SourceSummary[]): SourceSummary[] {
  return [...changedSources].sort((left, right) => {
    const labelCompare = left.source_label.localeCompare(right.source_label);
    if (labelCompare !== 0) {
      return labelCompare;
    }

    return left.source_id.localeCompare(right.source_id);
  });
}

function collectActiveSourceTodoItemKeys(payload: {
  state: StateFile;
  changedSourceIds: readonly SourceId[];
}): ItemKey[] {
  const changedSourceIds = new Set(payload.changedSourceIds);
  return sortKeys(
    payload.state.items
      .filter((item) => {
        const itemSourceIds = collectItemSourceIds(item);
        return [...changedSourceIds].some((sourceId) => itemSourceIds.has(sourceId));
      })
      .map((item) => item.item_key),
  );
}

function buildTodoSemanticKey(todo: Todo): string {
  return [
    todo.item_key,
    todo.type,
    sortKeys(todo.related_sources.map((source) => source.source_id)).join(','),
    sortKeys(todo.related_item_keys).join(','),
  ].join('|');
}

function removeTodosByType(payload: {
  schemas: SchemaModule;
  state: StateFile;
  todoType: Todo['type'];
  scopedItemKeys: readonly ItemKey[];
  allowedSemanticKeys?: Set<string>;
  isCleanupCandidate?: (todo: Todo) => boolean;
}): {
  state: StateFile;
  removedTodoIds: TodoId[];
} {
  const scopedItemKeys = new Set(payload.scopedItemKeys);
  const removedTodoIds = payload.state.todos
    .filter((todo) => {
      if (todo.type !== payload.todoType) {
        return false;
      }
      if (!scopedItemKeys.has(todo.item_key)) {
        return false;
      }
      if ((todo.managed_by ?? 'mutation') !== 'refresh') {
        return false;
      }
      if (!payload.isCleanupCandidate?.(todo)) {
        return false;
      }
      if (payload.allowedSemanticKeys?.has(buildTodoSemanticKey(todo))) {
        return false;
      }
      return true;
    })
    .map((todo) => todo.todo_id);

  if (removedTodoIds.length === 0) {
    return {
      state: payload.state,
      removedTodoIds: [],
    };
  }

  const removalSet = new Set(removedTodoIds);
  const nextState = cloneState(payload.state);
  nextState.todos = nextState.todos.filter((todo) => !removalSet.has(todo.todo_id));

  return {
    state: synchronizeOpenTodoIds({
      schemas: payload.schemas,
      state: nextState,
    }),
    removedTodoIds: sortKeys(removedTodoIds),
  };
}

export function createMutationService(payload: {
  errors: ErrorModule;
  schemas: SchemaModule;
  clock: ClockPort;
  graph: GraphService;
  context: ContextService;
  todo: TodoService;
  derivedState: DerivedStateService;
}): MutationService {
  const assertKnownSourceReferences = (state: StateFile, sourceRegistry: SourceRegistryFile) => {
    const sourceIds = new Set(sourceRegistry.sources.map((source) => source.source_id));
    const ensureKnownSource = (sourceId: SourceId, details: Record<string, string>) => {
      if (sourceIds.has(sourceId)) {
        return;
      }

      throw payload.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
        details: {
          ...details,
          source_id: sourceId,
        },
      });
    };

    for (const item of state.items) {
      for (const sourceId of item.origin_source_ids) {
        ensureKnownSource(sourceId, { item_key: item.item_key, field: 'origin_source_ids' });
      }
      for (const sourceId of item.specification_source_ids) {
        ensureKnownSource(sourceId, {
          item_key: item.item_key,
          field: 'specification_source_ids',
        });
      }
      for (const sourceId of item.plan_source_ids) {
        ensureKnownSource(sourceId, { item_key: item.item_key, field: 'plan_source_ids' });
      }
      for (const sourceId of item.implementation_source_ids) {
        ensureKnownSource(sourceId, {
          item_key: item.item_key,
          field: 'implementation_source_ids',
        });
      }
      for (const sourceId of item.test_source_ids) {
        ensureKnownSource(sourceId, { item_key: item.item_key, field: 'test_source_ids' });
      }
    }

    for (const claim of state.context.claims) {
      for (const sourceId of claim.source_ids) {
        ensureKnownSource(sourceId, { claim_key: claim.claim_key, field: 'source_ids' });
      }
    }

    for (const qualityAttribute of state.context.quality_attributes) {
      for (const sourceId of qualityAttribute.source_ids) {
        ensureKnownSource(sourceId, {
          quality_attribute_key: qualityAttribute.quality_attribute_key,
          field: 'source_ids',
        });
      }
    }

    for (const policyDecision of state.context.policy_decisions) {
      for (const sourceId of policyDecision.source_ids) {
        ensureKnownSource(sourceId, {
          policy_decision_key: policyDecision.policy_decision_key,
          field: 'source_ids',
        });
      }
    }
  };

  return {
    applyPacket({ state, packet, sourceRegistry, dryRun: dryRun, packetId: _packetId }) {
      void _packetId;
      payload.context.assertNoGlossaryConflicts({ state, packet });
      payload.context.assertImmutableContextEntities({ state, packet });
      payload.graph.assertPacketAddsOnlyNewItems({ state, packet });

      const existingAffectedItemKeys = collectPacketContextAffectedExistingItems({
        beforeState: state,
        packet,
      });
      const mergedContext = payload.context.mergePacketContext({ state, packet });
      const appliedItems = payload.graph.applyPacketItems({
        state: mergedContext.state,
        packet,
      });

      assertKnownSourceReferences(appliedItems.state, sourceRegistry);

      let nextState = appliedItems.state;
      let createdTodoIds: TodoId[] = [];
      let updatedTodoIds: TodoId[] = [];

      if (existingAffectedItemKeys.length > 0) {
        const contextTodos = payload.todo.generateTodosForContextChange({
          state: nextState,
          changedItemKeys: existingAffectedItemKeys,
        });
        const contextResult = payload.todo.createOrMergeTodos({
          state: nextState,
          todos: contextTodos,
        });
        nextState = contextResult.state;
        createdTodoIds = [...createdTodoIds, ...contextResult.createdTodoIds];
        updatedTodoIds = [...updatedTodoIds, ...contextResult.updatedTodoIds];

        const downstreamItemKeys = collectDownstreamItemKeys(
          payload.graph,
          nextState,
          existingAffectedItemKeys,
        );
        if (downstreamItemKeys.length > 0) {
          const dependencyTodos = payload.todo.generateTodosForDependencyChange({
            state: nextState,
            changedItemKeys: existingAffectedItemKeys,
            dependentItemKeys: downstreamItemKeys,
          });
          const dependencyResult = payload.todo.createOrMergeTodos({
            state: nextState,
            todos: dependencyTodos,
          });
          nextState = dependencyResult.state;
          createdTodoIds = [...createdTodoIds, ...dependencyResult.createdTodoIds];
          updatedTodoIds = [...updatedTodoIds, ...dependencyResult.updatedTodoIds];
        }
      }

      nextState = touchState({
        schemas: payload.schemas,
        state: payload.derivedState.recomputeAll(nextState),
        updatedAt: payload.clock.nowIsoUtc(),
      });

      const todoCreated = mapTodoIdsToItemKeys({
        state: nextState,
        todoIds: createdTodoIds,
      });
      const todoUpdated = mapTodoIdsToItemKeys({
        state: nextState,
        todoIds: updatedTodoIds,
      });

      const summary: PacketSummary = {
        state: nextState,
        dry_run: dryRun,
        counts: {
          added: appliedItems.addedItemKeys.length,
          removed: 0,
          todo_created: todoCreated.length,
          todo_updated: todoUpdated.length,
        },
        added: appliedItems.addedItemKeys,
        removed: [],
        todo_created: todoCreated,
        todo_updated: todoUpdated,
        next_commands: buildMutationNextCommands({
          todoCreated,
          todoUpdated,
          fallbackReason: 'Review existing tasks affected by newly introduced context.',
          itemsReason: 'Inspect full cards of tasks that received review todo.',
        }),
      };

      return Promise.resolve(summary);
    },

    applyPatch({ state, patch, sourceRegistry, dryRun }) {
      const isRemoveItemPatch = patch.operations.every(
        (operation) => operation.action === 'remove_item',
      );
      assertPatchTodoOperationsAreMutationSafe({
        state,
        patch,
        errors: payload.errors,
      });
      const { changedItemKeys, sourceChangedItemKeys, contextChangedItemKeys } =
        collectPatchFieldChanges(patch);
      const graphResult = payload.graph.applyPatchOperations({ state, patch });

      assertKnownSourceReferences(graphResult.state, sourceRegistry);

      let nextState = graphResult.state;
      let createdTodoIds: TodoId[] = [];
      let updatedTodoIds: TodoId[] = [];
      const removedTodoIds: TodoId[] = [...graphResult.removedTodoIds];

      if (isRemoveItemPatch) {
        const downstreamItemKeys = collectDownstreamItemKeys(
          payload.graph,
          state,
          graphResult.removedItemKeys,
        );
        if (downstreamItemKeys.length > 0) {
          const dependencyTodos = payload.todo.generateTodosForDependencyChange({
            state: nextState,
            changedItemKeys: graphResult.removedItemKeys,
            dependentItemKeys: downstreamItemKeys,
          });
          const dependencyResult = payload.todo.createOrMergeTodos({
            state: nextState,
            todos: dependencyTodos,
          });
          nextState = dependencyResult.state;
          createdTodoIds = [...createdTodoIds, ...dependencyResult.createdTodoIds];
          updatedTodoIds = [...updatedTodoIds, ...dependencyResult.updatedTodoIds];
        }
      } else {
        const downstreamItemKeys = changedItemKeys.length
          ? sortKeys(
              new Set([
                ...collectDownstreamItemKeys(payload.graph, state, changedItemKeys),
                ...collectDownstreamItemKeys(payload.graph, nextState, changedItemKeys),
              ]),
            )
          : [];

        if (changedItemKeys.length > 0 && downstreamItemKeys.length > 0) {
          const dependencyTodos = payload.todo.generateTodosForDependencyChange({
            state: nextState,
            changedItemKeys,
            dependentItemKeys: downstreamItemKeys,
          });
          const dependencyResult = payload.todo.createOrMergeTodos({
            state: nextState,
            todos: dependencyTodos,
          });
          nextState = dependencyResult.state;
          createdTodoIds = [...createdTodoIds, ...dependencyResult.createdTodoIds];
          updatedTodoIds = [...updatedTodoIds, ...dependencyResult.updatedTodoIds];
        }

        if (contextChangedItemKeys.length > 0) {
          const contextTodos = payload.todo.generateTodosForContextChange({
            state: nextState,
            changedItemKeys: contextChangedItemKeys,
            affectedItemKeys: [...contextChangedItemKeys, ...downstreamItemKeys],
          });
          const contextResult = payload.todo.createOrMergeTodos({
            state: nextState,
            todos: contextTodos,
          });
          nextState = contextResult.state;
          createdTodoIds = [...createdTodoIds, ...contextResult.createdTodoIds];
          updatedTodoIds = [...updatedTodoIds, ...contextResult.updatedTodoIds];
        }

        if (sourceChangedItemKeys.length > 0) {
          const sourceIdsByItem = collectChangedSourceIdsForItems({
            beforeState: state,
            afterState: nextState,
            itemKeys: sourceChangedItemKeys,
          });
          for (const itemKey of sourceChangedItemKeys) {
            const sourceIds = sourceIdsByItem.get(itemKey) ?? [];
            if (sourceIds.length === 0) {
              continue;
            }

            const affectedItemKeys = sortKeys([
              itemKey,
              ...collectDownstreamItemKeys(payload.graph, state, [itemKey]),
              ...collectDownstreamItemKeys(payload.graph, nextState, [itemKey]),
            ]);
            const sourceTodos = payload.todo.generateTodosForSourceChange({
              state: nextState,
              registry: sourceRegistry,
              sourceIds,
              affectedItemKeys,
              requireDirectSourceLink: false,
            });
            const sourceResult = payload.todo.createOrMergeTodos({
              state: nextState,
              todos: sourceTodos,
            });
            nextState = sourceResult.state;
            createdTodoIds = [...createdTodoIds, ...sourceResult.createdTodoIds];
            updatedTodoIds = [...updatedTodoIds, ...sourceResult.updatedTodoIds];
          }
        }
      }

      nextState = touchState({
        schemas: payload.schemas,
        state: payload.derivedState.recomputeAll(nextState),
        updatedAt: payload.clock.nowIsoUtc(),
      });

      const todoCreated = mapTodoIdsToItemKeys({
        state: nextState,
        todoIds: createdTodoIds,
      });
      const todoUpdated = mapTodoIdsToItemKeys({
        state: nextState,
        todoIds: updatedTodoIds,
      });
      const todoRemoved = sortKeys(
        new Set([
          ...mapTodoIdsToItemKeys({ state, todoIds: removedTodoIds }),
          ...graphResult.removedItemKeys,
        ]),
      );

      if (isRemoveItemPatch) {
        const summary = {
          state: nextState,
          dry_run: dryRun,
          counts: {
            removed: graphResult.removedItemKeys.length,
            todo_created: todoCreated.length,
            todo_updated: todoUpdated.length,
            todo_removed: todoRemoved.length,
          },
          removed: graphResult.removedItemKeys,
          todo_created: todoCreated,
          todo_updated: todoUpdated,
          todo_removed: todoRemoved,
          next_commands: buildMutationNextCommands({
            todoCreated,
            todoUpdated,
            fallbackReason: 'Review tasks affected by the removal.',
            itemsReason: 'Inspect full cards of tasks affected by item removal.',
          }),
        };

        return Promise.resolve({
          ...payload.schemas.parseCommandOutput('remove-item', {
            dry_run: summary.dry_run,
            counts: summary.counts,
            removed: summary.removed,
            todo_created: summary.todo_created,
            todo_updated: summary.todo_updated,
            todo_removed: summary.todo_removed,
            next_commands: summary.next_commands,
          }),
          state: nextState,
        });
      }

      const updated = sortKeys(new Set(patch.metadata.target_item_keys));
      const summary = {
        state: nextState,
        dry_run: dryRun,
        counts: {
          updated: updated.length,
          todo_created: todoCreated.length,
          todo_updated: todoUpdated.length,
          todo_removed: todoRemoved.length,
        },
        updated,
        todo_created: todoCreated,
        todo_updated: todoUpdated,
        todo_removed: todoRemoved,
        next_commands: buildMutationNextCommands({
          todoCreated,
          todoUpdated,
          fallbackReason: 'Review tasks affected by the patch.',
          itemsReason: 'Inspect full cards of directly changed tasks.',
        }),
      };

      return Promise.resolve({
        ...payload.schemas.parseCommandOutput('patch-item', {
          dry_run: summary.dry_run,
          counts: summary.counts,
          updated: summary.updated,
          todo_created: summary.todo_created,
          todo_updated: summary.todo_updated,
          todo_removed: summary.todo_removed,
          next_commands: summary.next_commands,
        }),
        state: nextState,
      });
    },

    refresh({ state, sourceRegistry, changedSourceIds, scope }) {
      const scopeItemKeys =
        scope.kind === 'all'
          ? sortKeys(state.items.map((item) => item.item_key))
          : scope.kind === 'item'
            ? (() => {
                if (!state.items.some((item) => item.item_key === scope.item_key)) {
                  throw payload.errors.create('BE_ITEM_NOT_FOUND', undefined, {
                    details: {
                      item_key: scope.item_key,
                    },
                  });
                }

                return payload.graph.resolveItemSubgraph({
                  state,
                  rootItemKeys: [scope.item_key],
                });
              })()
            : (() => {
                const selectedSourceIds = resolveSourceIdsFromScope({
                  registry: sourceRegistry,
                  scope,
                  errors: payload.errors,
                });
                const linkedItemKeys = collectLinkedItemKeysBySourceIds({
                  state,
                  sourceIds: selectedSourceIds,
                });
                if (linkedItemKeys.length === 0) {
                  return [];
                }

                const topLevelItemKeys = sortKeys(
                  new Set(
                    linkedItemKeys.flatMap((linkedItemKey) => {
                      const topLevelKeys = new Set<ItemKey>();
                      const stack: ItemKey[] = [linkedItemKey];
                      const seen = new Set<ItemKey>();

                      while (stack.length > 0) {
                        const itemKey = stack.pop();
                        if (!itemKey || seen.has(itemKey)) {
                          continue;
                        }
                        seen.add(itemKey);

                        const item = state.items.find(
                          (candidate) => candidate.item_key === itemKey,
                        );
                        if (!item || item.depends_on_keys.length === 0) {
                          topLevelKeys.add(itemKey);
                          continue;
                        }

                        for (const dependencyKey of item.depends_on_keys) {
                          stack.push(dependencyKey);
                        }
                      }

                      return [...topLevelKeys];
                    }),
                  ),
                );

                return payload.graph.resolveItemSubgraph({
                  state,
                  rootItemKeys: topLevelItemKeys,
                });
              })();

      const scopeItemSet = new Set(scopeItemKeys);
      const observedSourceIds =
        scope.kind === 'all'
          ? sortKeys(sourceRegistry.sources.map((source) => source.source_id))
          : scope.kind === 'item'
            ? sortKeys(
                new Set(
                  scopeItemKeys.flatMap((itemKey) => {
                    const item = state.items.find((candidate) => candidate.item_key === itemKey);
                    return item ? [...collectItemSourceIds(item)] : [];
                  }),
                ),
              )
            : resolveSourceIdsFromScope({
                registry: sourceRegistry,
                scope,
                errors: payload.errors,
              });
      const observedSourceIdSet = new Set(observedSourceIds);
      const observedDirectSourceItemKeySet = new Set(
        collectLinkedItemKeysBySourceIds({
          state,
          sourceIds: observedSourceIds,
        }).filter((itemKey) => scopeItemSet.has(itemKey)),
      );
      const directSourceItemKeys = collectActiveSourceTodoItemKeys({
        state,
        changedSourceIds,
      }).filter((itemKey) => scopeItemSet.has(itemKey));
      const downstreamItemKeys = collectDownstreamItemKeys(
        payload.graph,
        state,
        directSourceItemKeys,
      ).filter((itemKey) => scopeItemSet.has(itemKey));

      let nextState = state;
      let createdTodoIds: TodoId[] = [];
      let updatedTodoIds: TodoId[] = [];
      let removedTodoIds: TodoId[] = [];

      const activeSourceTodoSemanticKeys = new Set<string>();
      const activeDependencyTodoSemanticKeys = new Set<string>();
      const sourceSummaryLookup = buildSourceSummaryLookup(sourceRegistry);
      const changedSourceSummaries = sortChangedSources(
        changedSourceIds.flatMap((sourceId) => {
          const source = sourceSummaryLookup.get(sourceId);
          return source ? [source] : [];
        }),
      );

      if (directSourceItemKeys.length > 0) {
        const sourceTodos = payload.todo.generateTodosForSourceChange({
          state: nextState,
          registry: sourceRegistry,
          sourceIds: changedSourceIds,
          affectedItemKeys: directSourceItemKeys,
          managedBy: 'refresh',
        });
        for (const todo of sourceTodos) {
          activeSourceTodoSemanticKeys.add(
            [
              todo.item_key,
              todo.type,
              sortKeys(todo.related_sources.map((source) => source.source_id)).join(','),
              sortKeys(todo.related_item_keys).join(','),
            ].join('|'),
          );
        }
        const sourceResult = payload.todo.createOrMergeTodos({
          state: nextState,
          todos: sourceTodos,
        });
        nextState = sourceResult.state;
        createdTodoIds = [...createdTodoIds, ...sourceResult.createdTodoIds];
        updatedTodoIds = [...updatedTodoIds, ...sourceResult.updatedTodoIds];
      }

      if (downstreamItemKeys.length > 0) {
        const dependencyTodos = payload.todo.generateTodosForDependencyChange({
          state: nextState,
          changedItemKeys: directSourceItemKeys,
          dependentItemKeys: downstreamItemKeys,
          managedBy: 'refresh',
          relatedSources: changedSourceSummaries,
        });
        for (const todo of dependencyTodos) {
          activeDependencyTodoSemanticKeys.add(
            [
              todo.item_key,
              todo.type,
              sortKeys(todo.related_sources.map((source) => source.source_id)).join(','),
              sortKeys(todo.related_item_keys).join(','),
            ].join('|'),
          );
        }
        const dependencyResult = payload.todo.createOrMergeTodos({
          state: nextState,
          todos: dependencyTodos,
        });
        nextState = dependencyResult.state;
        createdTodoIds = [...createdTodoIds, ...dependencyResult.createdTodoIds];
        updatedTodoIds = [...updatedTodoIds, ...dependencyResult.updatedTodoIds];
      }

      const sourceTodoCleanup = removeTodosByType({
        state: nextState,
        schemas: payload.schemas,
        todoType: 'review_source_change',
        scopedItemKeys: scopeItemKeys,
        allowedSemanticKeys: activeSourceTodoSemanticKeys,
        isCleanupCandidate(todo) {
          return (
            todo.related_sources.length > 0 &&
            todo.related_sources.every((source) => observedSourceIdSet.has(source.source_id))
          );
        },
      });
      nextState = sourceTodoCleanup.state;
      removedTodoIds = [...removedTodoIds, ...sourceTodoCleanup.removedTodoIds];

      const dependencyTodoCleanup = removeTodosByType({
        state: nextState,
        schemas: payload.schemas,
        todoType: 'review_dependency_change',
        scopedItemKeys: scopeItemKeys,
        allowedSemanticKeys: activeDependencyTodoSemanticKeys,
        isCleanupCandidate(todo) {
          return (
            todo.related_sources.length > 0 &&
            todo.related_sources.every((source) => observedSourceIdSet.has(source.source_id)) &&
            todo.related_item_keys.length > 0 &&
            todo.related_item_keys.every((itemKey) => observedDirectSourceItemKeySet.has(itemKey))
          );
        },
      });
      nextState = dependencyTodoCleanup.state;
      removedTodoIds = [...removedTodoIds, ...dependencyTodoCleanup.removedTodoIds];

      nextState = touchState({
        schemas: payload.schemas,
        state: payload.derivedState.recomputeAll(nextState),
        updatedAt: payload.clock.nowIsoUtc(),
        refreshAt: payload.clock.nowIsoUtc(),
      });

      const changedSources = changedSourceSummaries;
      const todoCreated = mapTodoIdsToItemKeys({
        state: nextState,
        todoIds: createdTodoIds,
      });
      const todoUpdated = mapTodoIdsToItemKeys({
        state: nextState,
        todoIds: updatedTodoIds,
      });
      const todoRemoved = mapTodoIdsToItemKeys({
        state,
        todoIds: removedTodoIds,
      });

      const summary: RefreshSummary = {
        state: nextState,
        registry: sourceRegistry,
        counts: {
          changed_sources: changedSources.length,
          todo_created: todoCreated.length,
          todo_updated: todoUpdated.length,
          todo_removed: todoRemoved.length,
        },
        changed_sources: changedSources,
        todo_created: todoCreated,
        todo_updated: todoUpdated,
        todo_removed: todoRemoved,
        next_commands: buildRefreshNextCommands([...todoCreated, ...todoUpdated]),
      };

      return Promise.resolve({
        ...payload.schemas.parseCommandOutput('refresh', {
          counts: summary.counts,
          changed_sources: summary.changed_sources,
          todo_created: summary.todo_created,
          todo_updated: summary.todo_updated,
          todo_removed: summary.todo_removed,
          next_commands: summary.next_commands,
        }),
        state: nextState,
        registry: sourceRegistry,
      });
    },

    getGaps({ state, filters }) {
      const items = filters.item_key
        ? state.items.filter((item) => item.item_key === filters.item_key)
        : state.items;

      return items
        .filter((item) => item.gaps.length > 0)
        .map((item) => ({
          item_key: item.item_key,
          title: item.title,
          gaps: item.gaps,
        }));
    },
  };
}
