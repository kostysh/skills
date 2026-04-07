import type { CommandExecutionContext } from './types.ts';
import type {
  ItemKey,
  RefreshCommandInput,
  RefreshCommandOutput,
  SourceId,
  SourceRegistryFile,
  StateFile,
  StatusCommandOutput,
} from '../schemas/index.ts';

type RefreshResolution = {
  selectedSourceIds: SourceId[];
  mutationScope: RefreshCommandInput;
};

function collectItemSourceIds(item: StateFile['items'][number]): Set<SourceId> {
  return new Set<SourceId>([
    ...item.origin_source_ids,
    ...item.specification_source_ids,
    ...item.plan_source_ids,
    ...item.implementation_source_ids,
    ...item.test_source_ids,
  ]);
}

function collectSourceIdsForItemKeys(payload: {
  state: StateFile;
  itemKeys: readonly ItemKey[];
}): SourceId[] {
  const itemKeySet = new Set(payload.itemKeys);
  const sourceIds = new Set<SourceId>();

  for (const item of payload.state.items) {
    if (!itemKeySet.has(item.item_key)) {
      continue;
    }

    for (const sourceId of collectItemSourceIds(item)) {
      sourceIds.add(sourceId);
    }
  }

  return [...sourceIds].sort((left, right) => left.localeCompare(right));
}

function resolveRefreshSourceIds(payload: {
  input: RefreshCommandInput;
  context: CommandExecutionContext;
  state: StateFile;
  registry: SourceRegistryFile;
  backlogRoot: string;
}): RefreshResolution {
  const { input, context, state, registry, backlogRoot } = payload;

  if (input.kind === 'all') {
    return {
      selectedSourceIds: [...registry.sources]
        .map((source) => source.source_id)
        .sort((left, right) => left.localeCompare(right)),
      mutationScope: input,
    };
  }

  if (input.kind === 'item') {
    const rootItem = state.items.find((item) => item.item_key === input.item_key);
    if (!rootItem) {
      throw context.errors.create('BE_ITEM_NOT_FOUND', undefined, {
        details: {
          item_key: input.item_key,
        },
      });
    }

    const subgraphItemKeys = context.core.graph.resolveItemSubgraph({
      state,
      rootItemKeys: [input.item_key],
    });

    return {
      selectedSourceIds: collectSourceIdsForItemKeys({
        state,
        itemKeys: subgraphItemKeys,
      }),
      mutationScope: input,
    };
  }

  const scope = context.sources.resolveSourceScope({
    backlogRoot,
    state,
    registry,
    selector:
      input.kind === 'source_path'
        ? {
            kind: 'source_path',
            source_path: context.host.resolveCliPath(input.source_path),
          }
        : input,
  });
  const [selectedSourceId] = scope.sourceIds;
  if (!selectedSourceId) {
    throw context.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
      details:
        input.kind === 'source_label'
          ? { source_label: input.source_label }
          : input.kind === 'source_path'
            ? { source_path: input.source_path }
            : {},
    });
  }

  return {
    selectedSourceIds: [
      ...new Set([
        ...scope.sourceIds,
        ...collectSourceIdsForItemKeys({
          state,
          itemKeys: scope.subgraphItemKeys,
        }),
      ]),
    ].sort((left, right) => left.localeCompare(right)),
    mutationScope: {
      kind: 'source_id',
      source_id: selectedSourceId,
    },
  };
}

export async function executeRefreshFlow(payload: {
  input: RefreshCommandInput;
  context: CommandExecutionContext;
}): Promise<{ summary: RefreshCommandOutput; state: StateFile; registry: SourceRegistryFile }> {
  const { input, context } = payload;
  const backlogRoot = context.backlogRoot;
  if (!backlogRoot) {
    throw context.errors.create('BE_ROOT_NOT_FOUND');
  }

  const [state, registry] = await Promise.all([
    context.ensureMutationState(),
    context.artifacts.readSourceRegistry(backlogRoot),
  ]);

  const { selectedSourceIds, mutationScope } = resolveRefreshSourceIds({
    input,
    context,
    state,
    registry,
    backlogRoot,
  });

  const refreshedSources = await context.sources.refreshSourceHashes({
    backlogRoot,
    registry,
    selectedSourceIds,
  });

  const result = await context.core.mutation.refresh({
    state,
    sourceRegistry: refreshedSources.registry,
    changedSourceIds: refreshedSources.changedSourceIds,
    scope: mutationScope,
  });

  const { state: nextState, registry: nextRegistry, ...summary } = result;

  await context.artifacts.writeState(backlogRoot, nextState);
  try {
    await context.artifacts.writeSourceRegistry(backlogRoot, nextRegistry);
  } catch (error) {
    try {
      await context.artifacts.writeState(backlogRoot, state);
    } catch (rollbackError) {
      throw context.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
        details: {
          command: 'refresh',
          phase: 'write_source_registry',
          rollback: 'write_state',
        },
        hint: 'Refresh failed after persisting state and state rollback also failed.',
        cause: rollbackError,
      });
    }

    throw error;
  }
  await context.hooks.afterRefresh?.({
    summary,
    state: nextState,
    backlogRoot,
  });

  return {
    summary,
    state: nextState,
    registry: nextRegistry,
  };
}

export function buildStatusSummary(payload: {
  context: CommandExecutionContext;
  state: StateFile;
}): StatusCommandOutput {
  const { context, state } = payload;
  const counts = {
    defined_count: 0,
    specified_count: 0,
    planned_count: 0,
    implemented_count: 0,
    gaps_count: 0,
    needs_attention_count: 0,
    ready_for_next_step_count: 0,
    open_todo_count: state.todos.length,
  };

  for (const item of state.items) {
    if (item.delivery_state === 'defined') {
      counts.defined_count += 1;
    }
    if (item.delivery_state === 'specified') {
      counts.specified_count += 1;
    }
    if (item.delivery_state === 'planned') {
      counts.planned_count += 1;
    }
    if (item.delivery_state === 'implemented') {
      counts.implemented_count += 1;
    }
    if (item.gaps.length > 0) {
      counts.gaps_count += 1;
    }
    if (item.needs_attention) {
      counts.needs_attention_count += 1;
    }
    if (item.ready_for_next_step) {
      counts.ready_for_next_step_count += 1;
    }
  }

  return context.schemas.parseCommandOutput('status', {
    total_items: state.items.length,
    last_refresh_at: state.last_refresh_at,
    ...counts,
  });
}
