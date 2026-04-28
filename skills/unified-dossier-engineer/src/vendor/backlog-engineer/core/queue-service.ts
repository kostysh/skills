import type { ErrorModule } from '../errors/index.ts';
import type { QueueService } from './types.ts';
import type { SchemaModule, StateItem } from '../schemas/index.ts';
import { buildReadyQueueRoots, countReadyDescendants } from './read-model-helpers.ts';
import { buildReverseDependencyIndex } from './graph-service.ts';

function createReadySubset(items: readonly StateItem[]): StateItem[] {
  return items.filter(
    (item) =>
      item.ready_for_next_step &&
      item.delivery_state !== 'intaken' &&
      item.delivery_state !== 'implemented' &&
      item.gaps.length === 0,
  );
}

function computeDepths(payload: {
  reverseDependencies: Map<string, string[]>;
  rootItemKey: string;
  readyItemKeys: Set<string>;
}): Map<string, number> {
  const depths = new Map<string, number>([[payload.rootItemKey, 0]]);
  const queue = [payload.rootItemKey];

  while (queue.length > 0) {
    const itemKey = queue.shift();
    if (!itemKey) {
      continue;
    }

    const depth = depths.get(itemKey) ?? 0;
    for (const dependentKey of payload.reverseDependencies.get(itemKey) ?? []) {
      if (!payload.readyItemKeys.has(dependentKey) || depths.has(dependentKey)) {
        continue;
      }

      depths.set(dependentKey, depth + 1);
      queue.push(dependentKey);
    }
  }

  return depths;
}

export function createQueueService(payload: {
  errors: ErrorModule;
  schemas: SchemaModule;
}): QueueService {
  return {
    buildQueueChains({ state }) {
      const readyItems = createReadySubset(state.items);
      const readyItemKeys = new Set(readyItems.map((item) => item.item_key));
      const reverseDependencies = buildReverseDependencyIndex(state);

      const chains = buildReadyQueueRoots(readyItems).map((rootItemKey) => {
        const depths = computeDepths({
          reverseDependencies,
          rootItemKey,
          readyItemKeys,
        });
        const items = [...depths.keys()].sort((left, right) => {
          const byDepth =
            (depths.get(left) ?? Number.MAX_SAFE_INTEGER) -
            (depths.get(right) ?? Number.MAX_SAFE_INTEGER);
          if (byDepth !== 0) {
            return byDepth;
          }

          const byDownstream =
            countReadyDescendants({
              reverseDependencies,
              readyItemKeys,
              rootItemKey: right,
            }) -
            countReadyDescendants({
              reverseDependencies,
              readyItemKeys,
              rootItemKey: left,
            });
          if (byDownstream !== 0) {
            return byDownstream;
          }

          return left.localeCompare(right);
        });

        return {
          root_item_key: rootItemKey,
          items,
          ordering_rule: ['depth', 'downstream_dependency_count', 'item_key'] as const,
        };
      });

      const sortedChains = chains.sort((left, right) => {
        const byRoot = left.root_item_key.localeCompare(right.root_item_key);
        if (byRoot !== 0) {
          return byRoot;
        }

        const leftFirst = left.items[1] ?? left.items[0] ?? '';
        const rightFirst = right.items[1] ?? right.items[0] ?? '';
        const byFirst = leftFirst.localeCompare(rightFirst);
        if (byFirst !== 0) {
          return byFirst;
        }

        return left.items.length - right.items.length;
      });

      return payload.schemas.parseCommandOutput('queue', sortedChains);
    },
  };
}
