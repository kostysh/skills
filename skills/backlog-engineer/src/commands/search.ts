import {
  SearchCommandInputSchema,
  SearchCommandOutputSchema,
  type CommandHelpOption,
} from '../schemas/index.ts';
import {
  assertNoPositionals,
  getStringOption,
  parseBooleanValue,
  parseCommandArgs,
  parseUsageInput,
  splitCsvFlag,
} from './arg-parsers.ts';
import { definePlaceholderCommand } from './placeholder.ts';

const OPTIONS = [
  {
    flags: ['--source-ids'],
    value_name: '<source_id_1>,<source_id_2>',
    description: 'Filter by one or more registered source IDs.',
  },
  {
    flags: ['--delivery-state'],
    value_name: '<state>',
    description: 'Filter by delivery state.',
  },
  {
    flags: ['--needs-attention'],
    value_name: 'true|false',
    description: 'Filter by computed needs_attention state.',
  },
  {
    flags: ['--ready-for-next-step'],
    value_name: 'true|false',
    description: 'Filter by computed ready_for_next_step state.',
  },
  {
    flags: ['--claim-keys'],
    value_name: '<claim_key_1>,<claim_key_2>',
    description: 'Filter by claim links.',
  },
  {
    flags: ['--contract-keys'],
    value_name: '<contract_key_1>,<contract_key_2>',
    description: 'Filter by contract links.',
  },
  {
    flags: ['--data-domain-keys'],
    value_name: '<data_domain_key_1>,<data_domain_key_2>',
    description: 'Filter by data domain links.',
  },
  {
    flags: ['--quality-attribute-keys'],
    value_name: '<quality_attribute_key_1>,<quality_attribute_key_2>',
    description: 'Filter by quality attribute links.',
  },
  {
    flags: ['--policy-decision-keys'],
    value_name: '<policy_decision_key_1>,<policy_decision_key_2>',
    description: 'Filter by policy decision links.',
  },
] as const satisfies readonly CommandHelpOption[];

export const SEARCH_COMMAND = definePlaceholderCommand({
  name: 'search',
  summary: 'Search tasks when keys are not yet known.',
  usage: [
    'backlog-engineer search [--source-ids <source_id_1>,<source_id_2>] [--delivery-state <state>] [--needs-attention true|false] [--ready-for-next-step true|false] [--claim-keys <claim_key_1>,<claim_key_2>] [--contract-keys <contract_key_1>,<contract_key_2>] [--data-domain-keys <data_domain_key_1>,<data_domain_key_2>] [--quality-attribute-keys <quality_attribute_key_1>,<quality_attribute_key_2>] [--policy-decision-keys <policy_decision_key_1>,<policy_decision_key_2>]',
  ],
  options: OPTIONS,
  inputSchema: SearchCommandInputSchema,
  outputSchema: SearchCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('search', args, {
      options: {
        'source-ids': { type: 'string' },
        'delivery-state': { type: 'string' },
        'needs-attention': { type: 'string' },
        'ready-for-next-step': { type: 'string' },
        'claim-keys': { type: 'string' },
        'contract-keys': { type: 'string' },
        'data-domain-keys': { type: 'string' },
        'quality-attribute-keys': { type: 'string' },
        'policy-decision-keys': { type: 'string' },
      },
    });
    assertNoPositionals('search', parsed.positionals);

    return parseUsageInput('search', SearchCommandInputSchema, {
      ...(getStringOption(parsed.values['source-ids'])
        ? { source_ids: splitCsvFlag(getStringOption(parsed.values['source-ids'])) }
        : {}),
      ...(getStringOption(parsed.values['delivery-state'])
        ? { delivery_state: getStringOption(parsed.values['delivery-state']) }
        : {}),
      ...(getStringOption(parsed.values['needs-attention'])
        ? {
            needs_attention: parseBooleanValue(
              'search',
              '--needs-attention',
              getStringOption(parsed.values['needs-attention']),
            ),
          }
        : {}),
      ...(getStringOption(parsed.values['ready-for-next-step'])
        ? {
            ready_for_next_step: parseBooleanValue(
              'search',
              '--ready-for-next-step',
              getStringOption(parsed.values['ready-for-next-step']),
            ),
          }
        : {}),
      ...(getStringOption(parsed.values['claim-keys'])
        ? { claim_keys: splitCsvFlag(getStringOption(parsed.values['claim-keys'])) }
        : {}),
      ...(getStringOption(parsed.values['contract-keys'])
        ? { contract_keys: splitCsvFlag(getStringOption(parsed.values['contract-keys'])) }
        : {}),
      ...(getStringOption(parsed.values['data-domain-keys'])
        ? { data_domain_keys: splitCsvFlag(getStringOption(parsed.values['data-domain-keys'])) }
        : {}),
      ...(getStringOption(parsed.values['quality-attribute-keys'])
        ? {
            quality_attribute_keys: splitCsvFlag(
              getStringOption(parsed.values['quality-attribute-keys']),
            ),
          }
        : {}),
      ...(getStringOption(parsed.values['policy-decision-keys'])
        ? {
            policy_decision_keys: splitCsvFlag(
              getStringOption(parsed.values['policy-decision-keys']),
            ),
          }
        : {}),
    });
  },
});
