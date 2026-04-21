import type { ErrorModule } from '../errors/index.ts';
import type { SchemaModule } from '../schemas/index.ts';
import { recomputeDerivedState } from './replay-pipeline.ts';
import type { DerivedStateService } from './types.ts';

export function createDerivedStateService(payload: {
  errors: ErrorModule;
  schemas: SchemaModule;
}): DerivedStateService {
  return {
    recomputeAll(state) {
      return recomputeDerivedState({
        schemas: payload.schemas,
        state,
      });
    },

    recomputeItems({ state }) {
      return recomputeDerivedState({
        schemas: payload.schemas,
        state,
      });
    },

    computeItemState({ state, itemKey }) {
      const nextState = recomputeDerivedState({
        schemas: payload.schemas,
        state,
      });
      const item = nextState.items.find((candidate) => candidate.item_key === itemKey);
      if (!item) {
        throw payload.errors.create('BE_ITEM_NOT_FOUND', undefined, {
          details: {
            item_key: itemKey,
          },
        });
      }

      return {
        needs_attention: item.needs_attention,
        attention_reason_codes: item.attention_reason_codes,
        attention_reasons: item.attention_reasons,
        ready_for_next_step: item.ready_for_next_step,
      };
    },
  };
}
