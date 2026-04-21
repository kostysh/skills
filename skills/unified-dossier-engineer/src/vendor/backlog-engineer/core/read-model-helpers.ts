import type {
  AttentionReasonCode,
  ItemContextSummary,
  ItemKey,
  PacketItem,
  SourceId,
  SourceRegistryFile,
  SourceSummary,
  StateFile,
  StateItem,
  Todo,
} from '../schemas/index.ts';
import type { ErrorModule } from '../errors/index.ts';

export const ATTENTION_REASON_ORDER: readonly AttentionReasonCode[] = [
  'source_changed',
  'dependency_changed',
  'context_changed',
  'gaps',
] as const;

function collectItemSourceIds(item: StateItem): Set<SourceId> {
  return new Set<SourceId>([
    ...item.origin_source_ids,
    ...item.specification_source_ids,
    ...item.plan_source_ids,
    ...item.implementation_source_ids,
    ...item.test_source_ids,
  ]);
}

export function createSourceSummaryLookup(
  registry: SourceRegistryFile,
): Map<SourceId, SourceSummary> {
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

export function collectSourceSummariesForItem(payload: {
  item: StateItem;
  sourceSummariesById: Map<SourceId, SourceSummary>;
  errors: ErrorModule;
}): SourceSummary[] {
  return [...collectItemSourceIds(payload.item)]
    .map((sourceId) => {
      const summary = payload.sourceSummariesById.get(sourceId);
      if (!summary) {
        throw payload.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
          details: {
            source_id: sourceId,
            item_key: payload.item.item_key,
          },
        });
      }

      return summary;
    })
    .sort((left, right) => {
      const byLabel = left.source_label.localeCompare(right.source_label);
      if (byLabel !== 0) {
        return byLabel;
      }

      return left.source_id.localeCompare(right.source_id);
    });
}

export function toPacketItem(item: StateItem): PacketItem {
  return {
    item_key: item.item_key,
    title: item.title,
    type: item.type,
    delivery_state: item.delivery_state,
    gaps: [...item.gaps],
    depends_on_keys: [...item.depends_on_keys],
    origin_source_ids: [...item.origin_source_ids],
    specification_source_ids: [...item.specification_source_ids],
    plan_source_ids: [...item.plan_source_ids],
    implementation_source_ids: [...item.implementation_source_ids],
    test_source_ids: [...item.test_source_ids],
    claim_keys: [...item.claim_keys],
    contract_keys: [...item.contract_keys],
    data_domain_keys: [...item.data_domain_keys],
    quality_attribute_keys: [...item.quality_attribute_keys],
    policy_decision_keys: [...item.policy_decision_keys],
  };
}

export function buildItemContextSummary(item: StateItem): ItemContextSummary {
  return {
    claim_keys: [...item.claim_keys],
    contract_keys: [...item.contract_keys],
    data_domain_keys: [...item.data_domain_keys],
    quality_attribute_keys: [...item.quality_attribute_keys],
    policy_decision_keys: [...item.policy_decision_keys],
  };
}

export function collectItemTodos(payload: { state: StateFile; itemKey: ItemKey }): Todo[] {
  const openTodoIds = new Set(
    payload.state.items.find((item) => item.item_key === payload.itemKey)?.open_todo_ids ?? [],
  );

  return payload.state.todos
    .filter((todo) => todo.item_key === payload.itemKey && openTodoIds.has(todo.todo_id))
    .sort((left, right) => left.todo_id.localeCompare(right.todo_id));
}

export function compareAttentionReasonCodes(
  left: readonly AttentionReasonCode[],
  right: readonly AttentionReasonCode[],
): number {
  const rank = new Map(ATTENTION_REASON_ORDER.map((code, index) => [code, index]));
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftCode = left[index];
    const rightCode = right[index];
    if (leftCode === rightCode) {
      continue;
    }
    if (leftCode === undefined) {
      return -1;
    }
    if (rightCode === undefined) {
      return 1;
    }

    return (
      (rank.get(leftCode) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(rightCode) ?? Number.MAX_SAFE_INTEGER)
    );
  }

  return 0;
}

export function buildReadyQueueRoots(items: readonly StateItem[]): ItemKey[] {
  const readyItemKeys = new Set(items.map((item) => item.item_key));
  return items
    .filter((item) => item.depends_on_keys.every((itemKey) => !readyItemKeys.has(itemKey)))
    .map((item) => item.item_key)
    .sort((left, right) => left.localeCompare(right));
}

export function countReadyDescendants(payload: {
  reverseDependencies: Map<ItemKey, ItemKey[]>;
  readyItemKeys: Set<ItemKey>;
  rootItemKey: ItemKey;
}): number {
  const visited = new Set<ItemKey>();
  const stack = [...(payload.reverseDependencies.get(payload.rootItemKey) ?? [])];

  while (stack.length > 0) {
    const itemKey = stack.pop();
    if (!itemKey || visited.has(itemKey) || !payload.readyItemKeys.has(itemKey)) {
      continue;
    }

    visited.add(itemKey);
    for (const dependentKey of payload.reverseDependencies.get(itemKey) ?? []) {
      stack.push(dependentKey);
    }
  }

  return visited.size;
}

export function sortTodoItemKeys(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
