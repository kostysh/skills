import type {
  ItemKey,
  SourceId,
  SourceRegistryFile,
  StateFile,
  StateItem,
} from '../schemas/index.ts';
import type { AttentionService, ItemsService, QueueService } from '../core/types.ts';
import type { HookRegistry } from '../hooks/index.ts';
import type { LocalMermaidGraph, ReportModel } from './index.ts';
import { renderStateMermaidGraph } from './render-mermaid-graph.ts';

type ReportReadServices = {
  items: ItemsService;
  attention: AttentionService;
  queue: QueueService;
};

function collectItemSourceIds(item: StateItem): SourceId[] {
  return [
    ...item.origin_source_ids,
    ...item.specification_source_ids,
    ...item.plan_source_ids,
    ...item.implementation_source_ids,
    ...item.test_source_ids,
  ];
}

function formatSummaryValue(
  value: string | number | boolean | null | readonly (string | number | boolean | null)[],
): string {
  if (Array.isArray(value)) {
    return value.map((entry) => (entry === null ? 'null' : String(entry))).join(', ');
  }

  return value === null ? 'null' : String(value);
}

function formatStructuredSummaryBlock(payload: {
  label: string;
  entries: ReadonlyArray<StateFile['context']['target_system'][number]>;
}): string[] {
  return payload.entries.map((entry, index) => {
    const fields = Object.entries(entry)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}: ${formatSummaryValue(value)}`)
      .join('; ');

    return `${payload.label} ${index + 1}: ${fields}`;
  });
}

function buildFallbackSystemSummary(payload: {
  state: StateFile;
  registry: SourceRegistryFile;
}): string[] {
  const sourceLabelById = new Map(
    payload.registry.sources.map((source) => [source.source_id, source.source_label]),
  );
  const sourceCoverage = new Map<SourceId, number>();
  const typeCounts = new Map<string, number>();
  const deliveryCounts = new Map<string, number>();

  for (const item of payload.state.items) {
    typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1);
    deliveryCounts.set(item.delivery_state, (deliveryCounts.get(item.delivery_state) ?? 0) + 1);

    for (const sourceId of new Set(collectItemSourceIds(item))) {
      sourceCoverage.set(sourceId, (sourceCoverage.get(sourceId) ?? 0) + 1);
    }
  }

  const topSources = [...sourceCoverage.entries()]
    .map(([sourceId, count]) => ({
      source_id: sourceId,
      source_label: sourceLabelById.get(sourceId) ?? sourceId,
      count,
    }))
    .sort((left, right) => {
      const byCount = right.count - left.count;
      if (byCount !== 0) {
        return byCount;
      }

      const byLabel = left.source_label.localeCompare(right.source_label);
      if (byLabel !== 0) {
        return byLabel;
      }

      return left.source_id.localeCompare(right.source_id);
    })
    .slice(0, 5)
    .map((entry) => `${entry.source_label} (${entry.count})`);

  const typeSummary = [...typeCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ');
  const deliverySummary = [...deliveryCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([deliveryState, count]) => `${deliveryState}: ${count}`)
    .join(', ');

  return [
    `Registered sources: ${payload.registry.sources.length}`,
    `Top sources by task coverage: ${topSources.length > 0 ? topSources.join('; ') : 'none'}`,
    `Items by type: ${typeSummary || 'none'}`,
    `Items by delivery state: ${deliverySummary || 'none'}`,
  ];
}

function buildSystemSummary(payload: {
  state: StateFile;
  registry: SourceRegistryFile;
  hookLines: string[];
}): string[] {
  const baseLines =
    payload.state.context.target_system.length > 0 || payload.state.context.as_built.length > 0
      ? [
          ...formatStructuredSummaryBlock({
            label: 'Target system',
            entries: payload.state.context.target_system,
          }),
          ...formatStructuredSummaryBlock({
            label: 'As built',
            entries: payload.state.context.as_built,
          }),
        ]
      : buildFallbackSystemSummary({
          state: payload.state,
          registry: payload.registry,
        });

  return [
    ...new Set([...baseLines, ...payload.hookLines.map((line) => line.trim()).filter(Boolean)]),
  ];
}

function isLargeBacklog(state: StateFile): boolean {
  const edgeCount = state.items.reduce((sum, item) => sum + item.depends_on_keys.length, 0);
  return state.items.length > 75 || edgeCount > 120;
}

function buildUndirectedAdjacency(items: readonly StateItem[]): Map<ItemKey, Set<ItemKey>> {
  const adjacency = new Map<ItemKey, Set<ItemKey>>();

  for (const item of items) {
    if (!adjacency.has(item.item_key)) {
      adjacency.set(item.item_key, new Set<ItemKey>());
    }

    for (const dependencyKey of item.depends_on_keys) {
      if (!adjacency.has(dependencyKey)) {
        adjacency.set(dependencyKey, new Set<ItemKey>());
      }

      adjacency.get(item.item_key)?.add(dependencyKey);
      adjacency.get(dependencyKey)?.add(item.item_key);
    }
  }

  return adjacency;
}

function buildConnectedComponents(items: readonly StateItem[]): ItemKey[][] {
  const itemByKey = new Map(items.map((item) => [item.item_key, item]));
  const adjacency = buildUndirectedAdjacency(items);
  const visited = new Set<ItemKey>();
  const components: ItemKey[][] = [];

  for (const item of items
    .map((entry) => entry.item_key)
    .sort((left, right) => left.localeCompare(right))) {
    if (visited.has(item)) {
      continue;
    }

    const component: ItemKey[] = [];
    const queue = [item];
    visited.add(item);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || !itemByKey.has(current)) {
        continue;
      }

      component.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (visited.has(neighbor) || !itemByKey.has(neighbor)) {
          continue;
        }

        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    component.sort((left, right) => left.localeCompare(right));
    components.push(component);
  }

  return components;
}

function chooseLocalGraphTitle(payload: {
  componentItems: readonly StateItem[];
  registry: SourceRegistryFile;
}): string {
  const sourceLabelById = new Map(
    payload.registry.sources.map((source) => [source.source_id, source.source_label]),
  );
  const sourceCounts = new Map<SourceId, number>();

  for (const item of payload.componentItems) {
    for (const sourceId of new Set(item.origin_source_ids)) {
      sourceCounts.set(sourceId, (sourceCounts.get(sourceId) ?? 0) + 1);
    }
  }

  if (sourceCounts.size === 0) {
    return 'Local graph — no origin source';
  }

  const [winner] = [...sourceCounts.entries()]
    .map(([sourceId, count]) => ({
      source_id: sourceId,
      source_label: sourceLabelById.get(sourceId) ?? sourceId,
      count,
    }))
    .sort((left, right) => {
      const byCount = right.count - left.count;
      if (byCount !== 0) {
        return byCount;
      }

      const byLabel = left.source_label.localeCompare(right.source_label);
      if (byLabel !== 0) {
        return byLabel;
      }

      return left.source_id.localeCompare(right.source_id);
    });

  return `Local graph — ${winner?.source_label ?? 'no origin source'}`;
}

function buildLocalMermaidGraphs(payload: {
  state: StateFile;
  registry: SourceRegistryFile;
}): LocalMermaidGraph[] {
  if (!isLargeBacklog(payload.state)) {
    return [];
  }

  const itemByKey = new Map(payload.state.items.map((item) => [item.item_key, item]));

  return buildConnectedComponents(payload.state.items)
    .map((itemKeys) => {
      const componentItems = itemKeys
        .map((itemKey) => itemByKey.get(itemKey))
        .filter((item): item is StateItem => item !== undefined);

      return {
        title: chooseLocalGraphTitle({
          componentItems,
          registry: payload.registry,
        }),
        mermaid: renderStateMermaidGraph(componentItems),
        item_keys: [...itemKeys],
      };
    })
    .sort((left, right) => {
      const byTitle = left.title.localeCompare(right.title);
      if (byTitle !== 0) {
        return byTitle;
      }

      const byFirstItem = (left.item_keys[0] ?? '').localeCompare(right.item_keys[0] ?? '');
      if (byFirstItem !== 0) {
        return byFirstItem;
      }

      return left.item_keys.length - right.item_keys.length;
    });
}

export async function buildReportModel(payload: {
  state: StateFile;
  registry: SourceRegistryFile;
  services: ReportReadServices;
  hooks: HookRegistry;
}): Promise<ReportModel> {
  const sortedItemKeys = payload.state.items
    .map((item) => item.item_key)
    .sort((left, right) => left.localeCompare(right));

  const [itemCatalog, attentionItems, queueChains, hookSummary] = await Promise.all([
    Promise.resolve(
      payload.services.items.getItems({
        state: payload.state,
        itemKeys: sortedItemKeys,
        registry: payload.registry,
      }),
    ),
    Promise.resolve(
      payload.services.attention.buildAttentionList({
        state: payload.state,
        registry: payload.registry,
      }),
    ),
    Promise.resolve(
      payload.services.queue.buildQueueChains({
        state: payload.state,
      }),
    ),
    payload.hooks.buildSystemSummary?.({
      context: payload.state.context,
      items: payload.state.items,
    }) ?? Promise.resolve([]),
  ]);

  const metrics = {
    totalItems: payload.state.items.length,
    itemsNeedingAttention: payload.state.items.filter((item) => item.needs_attention).length,
    readyForNextStep: payload.state.items.filter((item) => item.ready_for_next_step).length,
    openGaps: payload.state.items.filter((item) => item.gaps.length > 0).length,
    openTodos: payload.state.todos.length,
  };

  return {
    systemSummary: buildSystemSummary({
      state: payload.state,
      registry: payload.registry,
      hookLines: hookSummary,
    }),
    metrics,
    globalMermaidGraph: renderStateMermaidGraph(payload.state.items),
    localMermaidGraphs: buildLocalMermaidGraphs({
      state: payload.state,
      registry: payload.registry,
    }),
    attentionItems,
    queueChains,
    itemCatalog,
  };
}
