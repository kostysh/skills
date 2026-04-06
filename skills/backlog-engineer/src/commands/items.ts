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
import { definePlaceholderCommand } from './placeholder.ts';

const OPTIONS = [
  {
    flags: ['--item-keys'],
    value_name: '<item_key_1>,<item_key_2>',
    description: 'Comma-separated item keys to load as full task cards.',
    required: true,
  },
] as const satisfies readonly CommandHelpOption[];

export const ITEMS_COMMAND = definePlaceholderCommand({
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
});
