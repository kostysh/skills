import type { ErrorModule } from '../errors/index.ts';
import type { ItemsService } from './types.ts';
import type { SchemaModule } from '../schemas/index.ts';
import {
  buildItemContextSummary,
  collectItemTodos,
  collectSourceSummariesForItem,
  createSourceSummaryLookup,
  toPacketItem,
} from './read-model-helpers.ts';

export function createItemsService(payload: {
  errors: ErrorModule;
  schemas: SchemaModule;
}): ItemsService {
  return {
    getItems({ state, itemKeys, registry }) {
      const itemsByKey = new Map(state.items.map((item) => [item.item_key, item]));
      const sourceSummariesById = createSourceSummaryLookup(registry);

      const cards = itemKeys.map((itemKey) => {
        const item = itemsByKey.get(itemKey);
        if (!item) {
          throw payload.errors.create('BE_ITEM_NOT_FOUND', undefined, {
            details: {
              item_key: itemKey,
            },
          });
        }

        return {
          item: toPacketItem(item),
          reverse_dependency_keys: [...item.reverse_dependency_keys],
          source_summaries: collectSourceSummariesForItem({
            item,
            sourceSummariesById,
            errors: payload.errors,
          }),
          context: buildItemContextSummary(item),
          computed_state: {
            needs_attention: item.needs_attention,
            attention_reason_codes: [...item.attention_reason_codes],
            attention_reasons: [...item.attention_reasons],
            ready_for_next_step: item.ready_for_next_step,
          },
          todo: collectItemTodos({
            state,
            itemKey,
          }),
        };
      });

      return payload.schemas.parseCommandOutput('items', cards);
    },
  };
}
