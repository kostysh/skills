import {
  ListSourcesCommandInputSchema,
  ListSourcesCommandOutputSchema,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import { definePlaceholderCommand } from './placeholder.ts';

const OPTIONS = [
  {
    flags: ['--item-key'],
    value_name: '<item_key>',
    description: 'Limit the result to sources linked to a single task.',
  },
  {
    flags: ['--path'],
    value_name: '<path>',
    description: 'Filter sources by the provided source path.',
  },
] as const satisfies readonly CommandHelpOption[];

export const LIST_SOURCES_COMMAND = definePlaceholderCommand({
  name: 'list-sources',
  summary: 'List registered sources and source metadata.',
  usage: [
    'backlog-engineer list-sources',
    'backlog-engineer list-sources --item-key <item_key>',
    'backlog-engineer list-sources --path <path>',
  ],
  options: OPTIONS,
  inputSchema: ListSourcesCommandInputSchema,
  outputSchema: ListSourcesCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('list-sources', args, {
      options: {
        'item-key': { type: 'string' },
        path: { type: 'string' },
      },
    });
    assertNoPositionals('list-sources', parsed.positionals);

    return parseUsageInput('list-sources', ListSourcesCommandInputSchema, {
      ...(typeof parsed.values['item-key'] === 'string'
        ? { item_key: parsed.values['item-key'] }
        : {}),
      ...(typeof parsed.values.path === 'string' ? { path: parsed.values.path } : {}),
    });
  },
});
