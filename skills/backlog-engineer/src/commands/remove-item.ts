import {
  RemoveItemCommandInputSchema,
  RemoveItemCommandOutputSchema,
  type CommandHelpOption,
} from '../schemas/index.ts';
import {
  assertNoPositionals,
  getStringOption,
  parseCommandArgs,
  parseUsageInput,
  requireStringOption,
} from './arg-parsers.ts';
import { definePlaceholderCommand } from './placeholder.ts';

const OPTIONS = [
  {
    flags: ['--patch'],
    value_name: '<path>',
    description: 'Path to the authored remove-item patch file.',
    required: true,
  },
  {
    flags: ['--dry-run'],
    description: 'Validate and simulate item removal without writing to disk.',
  },
] as const satisfies readonly CommandHelpOption[];

export const REMOVE_ITEM_COMMAND = definePlaceholderCommand({
  name: 'remove-item',
  summary: 'Apply a patch that removes obsolete tasks.',
  usage: ['backlog-engineer remove-item --patch <path> [--dry-run]'],
  options: OPTIONS,
  inputSchema: RemoveItemCommandInputSchema,
  outputSchema: RemoveItemCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('remove-item', args, {
      options: {
        patch: { type: 'string' },
        'dry-run': { type: 'boolean' },
      },
    });
    assertNoPositionals('remove-item', parsed.positionals);

    return parseUsageInput('remove-item', RemoveItemCommandInputSchema, {
      patch: requireStringOption('remove-item', '--patch', getStringOption(parsed.values.patch)),
      dry_run: parsed.values['dry-run'] === true,
    });
  },
});
