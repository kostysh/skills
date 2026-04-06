import {
  PatchItemCommandInputSchema,
  PatchItemCommandOutputSchema,
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
    description: 'Path to the authored patch-item file.',
    required: true,
  },
  {
    flags: ['--dry-run'],
    description: 'Validate and simulate patch application without writing to disk.',
  },
] as const satisfies readonly CommandHelpOption[];

export const PATCH_ITEM_COMMAND = definePlaceholderCommand({
  name: 'patch-item',
  summary: 'Apply a patch that updates existing tasks.',
  usage: ['backlog-engineer patch-item --patch <path> [--dry-run]'],
  options: OPTIONS,
  inputSchema: PatchItemCommandInputSchema,
  outputSchema: PatchItemCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('patch-item', args, {
      options: {
        patch: { type: 'string' },
        'dry-run': { type: 'boolean' },
      },
    });
    assertNoPositionals('patch-item', parsed.positionals);

    return parseUsageInput('patch-item', PatchItemCommandInputSchema, {
      patch: requireStringOption('patch-item', '--patch', getStringOption(parsed.values.patch)),
      dry_run: parsed.values['dry-run'] === true,
    });
  },
});
