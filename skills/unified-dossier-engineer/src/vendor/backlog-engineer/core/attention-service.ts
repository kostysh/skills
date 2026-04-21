import type { ErrorModule } from '../errors/index.ts';
import type { AttentionService } from './types.ts';
import type { SchemaModule } from '../schemas/index.ts';
import {
  collectSourceSummariesForItem,
  compareAttentionReasonCodes,
  createSourceSummaryLookup,
} from './read-model-helpers.ts';

export function createAttentionService(payload: {
  errors: ErrorModule;
  schemas: SchemaModule;
}): AttentionService {
  return {
    buildAttentionList({ state, registry }) {
      const sourceSummariesById = createSourceSummaryLookup(registry);
      const entries = state.items
        .filter((item) => item.needs_attention)
        .map((item) => ({
          item_key: item.item_key,
          title: item.title,
          attention_reason_codes: [...item.attention_reason_codes],
          attention_reasons: [...item.attention_reasons],
          source_summaries: collectSourceSummariesForItem({
            item,
            sourceSummariesById,
            errors: payload.errors,
          }),
        }))
        .sort((left, right) => {
          const byReasons = compareAttentionReasonCodes(
            left.attention_reason_codes,
            right.attention_reason_codes,
          );
          if (byReasons !== 0) {
            return byReasons;
          }

          return left.item_key.localeCompare(right.item_key);
        });

      return payload.schemas.parseCommandOutput('attention', entries);
    },
  };
}
