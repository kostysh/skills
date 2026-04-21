import type { ErrorModule } from '../errors/index.ts';
import type { SearchCommandInput, SchemaModule, StateItem } from '../schemas/index.ts';
import type { SearchService } from './types.ts';
import {
  buildItemContextSummary,
  collectSourceSummariesForItem,
  createSourceSummaryLookup,
} from './read-model-helpers.ts';

function intersects<T>(left: readonly T[], right: readonly T[]): boolean {
  const rightSet = new Set(right);
  return left.some((value) => rightSet.has(value));
}

function collectMatchReasons(payload: { filters: SearchCommandInput; item: StateItem }): string[] {
  const reasons: string[] = [];
  const context = buildItemContextSummary(payload.item);
  const sourceIds = [
    ...payload.item.origin_source_ids,
    ...payload.item.specification_source_ids,
    ...payload.item.plan_source_ids,
    ...payload.item.implementation_source_ids,
    ...payload.item.test_source_ids,
  ];

  if (payload.filters.source_ids) {
    reasons.push(
      `source_ids=${sourceIds
        .filter((sourceId) => payload.filters.source_ids?.includes(sourceId))
        .join(',')}`,
    );
  }
  if (payload.filters.delivery_state) {
    reasons.push(`delivery_state=${payload.filters.delivery_state}`);
  }
  if (payload.filters.needs_attention !== undefined) {
    reasons.push(`needs_attention=${String(payload.filters.needs_attention)}`);
  }
  if (payload.filters.ready_for_next_step !== undefined) {
    reasons.push(`ready_for_next_step=${String(payload.filters.ready_for_next_step)}`);
  }
  if (payload.filters.claim_keys) {
    reasons.push(
      `claim_keys=${context.claim_keys.filter((key) => payload.filters.claim_keys?.includes(key)).join(',')}`,
    );
  }
  if (payload.filters.contract_keys) {
    reasons.push(
      `contract_keys=${context.contract_keys.filter((key) => payload.filters.contract_keys?.includes(key)).join(',')}`,
    );
  }
  if (payload.filters.data_domain_keys) {
    reasons.push(
      `data_domain_keys=${context.data_domain_keys.filter((key) => payload.filters.data_domain_keys?.includes(key)).join(',')}`,
    );
  }
  if (payload.filters.quality_attribute_keys) {
    reasons.push(
      `quality_attribute_keys=${context.quality_attribute_keys.filter((key) => payload.filters.quality_attribute_keys?.includes(key)).join(',')}`,
    );
  }
  if (payload.filters.policy_decision_keys) {
    reasons.push(
      `policy_decision_keys=${context.policy_decision_keys.filter((key) => payload.filters.policy_decision_keys?.includes(key)).join(',')}`,
    );
  }

  return reasons;
}

function matchesFilters(payload: { item: StateItem; filters: SearchCommandInput }): boolean {
  const { item, filters } = payload;
  const context = buildItemContextSummary(item);
  const sourceIds = [
    ...item.origin_source_ids,
    ...item.specification_source_ids,
    ...item.plan_source_ids,
    ...item.implementation_source_ids,
    ...item.test_source_ids,
  ];

  if (filters.source_ids && !intersects(sourceIds, filters.source_ids)) {
    return false;
  }
  if (filters.delivery_state && item.delivery_state !== filters.delivery_state) {
    return false;
  }
  if (filters.needs_attention !== undefined && item.needs_attention !== filters.needs_attention) {
    return false;
  }
  if (
    filters.ready_for_next_step !== undefined &&
    item.ready_for_next_step !== filters.ready_for_next_step
  ) {
    return false;
  }
  if (filters.claim_keys && !intersects(context.claim_keys, filters.claim_keys)) {
    return false;
  }
  if (filters.contract_keys && !intersects(context.contract_keys, filters.contract_keys)) {
    return false;
  }
  if (filters.data_domain_keys && !intersects(context.data_domain_keys, filters.data_domain_keys)) {
    return false;
  }
  if (
    filters.quality_attribute_keys &&
    !intersects(context.quality_attribute_keys, filters.quality_attribute_keys)
  ) {
    return false;
  }
  if (
    filters.policy_decision_keys &&
    !intersects(context.policy_decision_keys, filters.policy_decision_keys)
  ) {
    return false;
  }

  return true;
}

export function createSearchService(payload: {
  errors: ErrorModule;
  schemas: SchemaModule;
}): SearchService {
  return {
    search({ state, filters, registry }) {
      const sourceSummariesById = createSourceSummaryLookup(registry);
      const results = [...state.items]
        .filter((item) =>
          matchesFilters({
            item,
            filters,
          }),
        )
        .sort((left, right) => left.item_key.localeCompare(right.item_key))
        .map((item) => ({
          item_key: item.item_key,
          title: item.title,
          type: item.type,
          delivery_state: item.delivery_state,
          needs_attention: item.needs_attention,
          ready_for_next_step: item.ready_for_next_step,
          attention_reason_codes: [...item.attention_reason_codes],
          attention_reasons: [...item.attention_reasons],
          source_summaries: collectSourceSummariesForItem({
            item,
            sourceSummariesById,
            errors: payload.errors,
          }),
          match_reasons: collectMatchReasons({
            filters,
            item,
          }),
        }));

      return payload.schemas.parseCommandOutput('search', results);
    },
  };
}
