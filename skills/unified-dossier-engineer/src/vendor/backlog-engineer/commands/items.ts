import {
  ItemsCommandInputSchema,
  ItemsCommandOutputSchema,
  type CommandHelpOption,
} from '../schemas/index.ts';
import {
  assertNoPositionals,
  getStringOption,
  parseCommandArgs,
  parseUsageInput,
  requireStringOption,
  splitCsvFlag,
} from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import type { ItemsCommandInput, ItemsCommandOutput } from '../schemas/index.ts';
import { loadQueryStateWithRegistry } from './query-helpers.ts';

const OPTIONS = [
  {
    flags: ['--item-keys'],
    value_name: '<item_key_1>,<item_key_2>',
    description: 'Comma-separated item keys to load as full task cards.',
    required: true,
  },
] as const satisfies readonly CommandHelpOption[];

export const ITEMS_COMMAND: CommandDefinition<ItemsCommandInput, ItemsCommandOutput> = {
  name: 'items',
  summary: 'Show one or more full task cards by item key.',
  usage: ['backlog-engineer items --item-keys <item_key_1>,<item_key_2>'],
  options: OPTIONS,
  inputSchema: ItemsCommandInputSchema,
  outputSchema: ItemsCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('items', args, {
      options: {
        'item-keys': { type: 'string' },
      },
    });
    assertNoPositionals('items', parsed.positionals);

    return parseUsageInput('items', ItemsCommandInputSchema, {
      item_keys: splitCsvFlag(
        requireStringOption('items', '--item-keys', getStringOption(parsed.values['item-keys'])),
      ),
    });
  },
  async execute(input, context) {
    const { state, registry } = await loadQueryStateWithRegistry(context);
    return context.core.items.getItems({
      state,
      itemKeys: input.item_keys,
      registry,
    });
  },
};
