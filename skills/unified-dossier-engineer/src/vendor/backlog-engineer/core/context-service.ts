import type { ErrorModule } from '../errors/index.ts';
import type { PacketContext, SchemaModule } from '../schemas/index.ts';
import { mergePacketContextOnly } from './replay-pipeline.ts';
import type { ContextService } from './types.ts';

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function compareByKey<T extends Record<string, unknown>>(
  current: readonly T[],
  incoming: readonly T[],
  keyField: keyof T,
  errors: ErrorModule,
): void {
  const currentByKey = new Map(current.map((entry) => [String(entry[keyField]), entry]));

  for (const entry of incoming) {
    const key = String(entry[keyField]);
    const existing = currentByKey.get(key);
    if (!existing) {
      continue;
    }

    if (!deepEqual(existing, entry)) {
      throw errors.create('BE_CONTEXT_CONFLICT_ENTITY', undefined, {
        details: {
          key,
          key_field: String(keyField),
        },
      });
    }
  }
}

function diffContextKeys(before: PacketContext, after: PacketContext): string[] {
  const changed: string[] = [];

  if (!deepEqual(before.glossary, after.glossary)) {
    changed.push('glossary');
  }
  if (!deepEqual(before.key_strategy, after.key_strategy)) {
    changed.push('key_strategy');
  }
  if (!deepEqual(before.target_system, after.target_system)) {
    changed.push('target_system');
  }
  if (!deepEqual(before.as_built, after.as_built)) {
    changed.push('as_built');
  }
  if (!deepEqual(before.claims, after.claims)) {
    changed.push('claims');
  }
  if (!deepEqual(before.contracts, after.contracts)) {
    changed.push('contracts');
  }
  if (!deepEqual(before.data_domains, after.data_domains)) {
    changed.push('data_domains');
  }
  if (!deepEqual(before.quality_attributes, after.quality_attributes)) {
    changed.push('quality_attributes');
  }
  if (!deepEqual(before.policy_decisions, after.policy_decisions)) {
    changed.push('policy_decisions');
  }

  return changed;
}

export function createContextService(payload: {
  errors: ErrorModule;
  schemas: SchemaModule;
}): ContextService {
  return {
    mergePacketContext({ state, packet }) {
      const nextState = mergePacketContextOnly({
        state,
        packet,
        errors: payload.errors,
      });

      return {
        state: nextState,
        changedContextKeys: diffContextKeys(state.context, nextState.context),
      };
    },

    assertNoGlossaryConflicts({ state, packet }) {
      const glossaryByTerm = new Map(
        state.context.glossary.map((entry) => [entry.term, entry.definition]),
      );

      for (const entry of packet.context.glossary) {
        const existingDefinition = glossaryByTerm.get(entry.term);
        if (existingDefinition === undefined || existingDefinition === entry.definition) {
          continue;
        }

        throw payload.errors.create('BE_CONTEXT_CONFLICT_GLOSSARY', undefined, {
          details: {
            term: entry.term,
          },
        });
      }
    },

    assertImmutableContextEntities({ state, packet }) {
      if (
        Object.keys(state.context.key_strategy).length > 0 &&
        !deepEqual(state.context.key_strategy, packet.context.key_strategy)
      ) {
        throw payload.errors.create('BE_CONTEXT_CONFLICT_ENTITY', undefined, {
          details: {
            key_field: 'key_strategy',
          },
        });
      }

      compareByKey(state.context.claims, packet.context.claims, 'claim_key', payload.errors);
      compareByKey(
        state.context.contracts,
        packet.context.contracts,
        'contract_key',
        payload.errors,
      );
      compareByKey(
        state.context.data_domains,
        packet.context.data_domains,
        'data_domain_key',
        payload.errors,
      );
      compareByKey(
        state.context.quality_attributes,
        packet.context.quality_attributes,
        'quality_attribute_key',
        payload.errors,
      );
      compareByKey(
        state.context.policy_decisions,
        packet.context.policy_decisions,
        'policy_decision_key',
        payload.errors,
      );
    },
  };
}
