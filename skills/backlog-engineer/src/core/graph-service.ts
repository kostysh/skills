import type { ErrorModule } from '../errors/index.ts';
import type { ItemKey, SchemaModule, StateFile, TodoId } from '../schemas/index.ts';
import {
  applyPacketItemsOnly,
  applyPatchReplay,
  synchronizeOpenTodoIds,
} from './replay-pipeline.ts';
import type { GraphService } from './types.ts';

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function collectRemovedTodoIds(before: StateFile, after: StateFile): TodoId[] {
  const remainingTodoIds = new Set(after.todos.map((todo) => todo.todo_id));
  return uniqueSorted(
    before.todos.filter((todo) => !remainingTodoIds.has(todo.todo_id)).map((todo) => todo.todo_id),
  );
}

export function buildDependencyIndex(state: StateFile): Map<ItemKey, ItemKey[]> {
  return new Map(
    state.items.map((item) => [
      item.item_key,
      [...item.depends_on_keys].sort((a, b) => a.localeCompare(b)),
    ]),
  );
}

export function buildReverseDependencyIndex(state: StateFile): Map<ItemKey, ItemKey[]> {
  const reverse = new Map<ItemKey, Set<ItemKey>>();

  for (const item of state.items) {
    reverse.set(item.item_key, new Set());
  }

  for (const item of state.items) {
    for (const dependencyKey of item.depends_on_keys) {
      const dependents = reverse.get(dependencyKey);
      if (dependents) {
        dependents.add(item.item_key);
      }
    }
  }

  return new Map(
    [...reverse.entries()].map(([itemKey, dependents]) => [
      itemKey,
      [...dependents].sort((left, right) => left.localeCompare(right)),
    ]),
  );
}

export function resolveItemSubgraph(payload: {
  state: StateFile;
  rootItemKeys: ItemKey[];
}): ItemKey[] {
  const reverse = buildReverseDependencyIndex(payload.state);
  const visited = new Set<ItemKey>();
  const stack = [...payload.rootItemKeys].sort((left, right) => right.localeCompare(left));

  while (stack.length > 0) {
    const itemKey = stack.pop();
    if (!itemKey || visited.has(itemKey)) {
      continue;
    }
    visited.add(itemKey);

    for (const dependentKey of reverse.get(itemKey) ?? []) {
      stack.push(dependentKey);
    }
  }

  return [...visited].sort((left, right) => left.localeCompare(right));
}

export function cleanupRemovedItemReferences(payload: {
  state: StateFile;
  removedItemKeys: ItemKey[];
}): StateFile {
  if (payload.removedItemKeys.length === 0) {
    return payload.state;
  }

  const removedItemKeys = new Set(payload.removedItemKeys);
  const nextState: StateFile = structuredClone(payload.state);

  nextState.items = nextState.items
    .filter((item) => !removedItemKeys.has(item.item_key))
    .map((item) => ({
      ...item,
      depends_on_keys: item.depends_on_keys.filter((itemKey) => !removedItemKeys.has(itemKey)),
    }));

  nextState.todos = nextState.todos.filter((todo) => !removedItemKeys.has(todo.item_key));
  nextState.context.quality_attributes = nextState.context.quality_attributes.map(
    (qualityAttribute) => ({
      ...qualityAttribute,
      applies_to_item_keys: qualityAttribute.applies_to_item_keys.filter(
        (itemKey) => !removedItemKeys.has(itemKey),
      ),
    }),
  );
  nextState.context.policy_decisions = nextState.context.policy_decisions.map((policyDecision) => ({
    ...policyDecision,
    related_item_keys: policyDecision.related_item_keys.filter(
      (itemKey) => !removedItemKeys.has(itemKey),
    ),
  }));

  return nextState;
}

export function createGraphService(payload: {
  errors: ErrorModule;
  schemas: SchemaModule;
}): GraphService {
  return {
    assertPacketAddsOnlyNewItems({ state, packet }) {
      const existingItemKeys = new Set(state.items.map((item) => item.item_key));
      for (const item of packet.items) {
        if (!existingItemKeys.has(item.item_key)) {
          continue;
        }

        throw payload.errors.create('BE_PACKET_ITEM_ALREADY_EXISTS', undefined, {
          details: {
            item_key: item.item_key,
          },
        });
      }
    },

    applyPacketItems({ state, packet }) {
      const addedItemKeys = packet.items.map((item) => item.item_key);
      const nextState = applyPacketItemsOnly({
        state,
        items: packet.items,
        errors: payload.errors,
      });
      const synchronizedState = synchronizeOpenTodoIds({
        schemas: payload.schemas,
        state: nextState,
      });

      return {
        state: synchronizedState,
        addedItemKeys: uniqueSorted(addedItemKeys),
      };
    },

    applyPatchOperations({ state, patch }) {
      const removedItemKeys = uniqueSorted(
        patch.operations
          .filter((operation) => operation.action === 'remove_item')
          .map((operation) => operation.item_key),
      );
      const updatedItemKeys = uniqueSorted(
        patch.operations
          .filter((operation) => operation.action !== 'remove_item')
          .map((operation) => operation.item_key),
      );
      const nextState = applyPatchReplay({
        state,
        patch,
        errors: payload.errors,
      });
      const synchronizedState = synchronizeOpenTodoIds({
        schemas: payload.schemas,
        state: nextState,
      });

      return {
        state: synchronizedState,
        updatedItemKeys,
        removedItemKeys,
        removedTodoIds: collectRemovedTodoIds(state, nextState),
      };
    },

    buildDependencyIndex,
    buildReverseDependencyIndex,
    resolveItemSubgraph,
    cleanupRemovedItemReferences,
  };
}
