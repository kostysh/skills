import {
  StatusCommandInputSchema,
  StatusCommandOutputSchema,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import { definePlaceholderCommand } from './placeholder.ts';

const OPTIONS = [
  {
    flags: ['--refresh'],
    description: 'Run refresh before returning the status summary.',
  },
] as const satisfies readonly CommandHelpOption[];

export const STATUS_COMMAND = definePlaceholderCommand({
  name: 'status',
  summary: 'Show short backlog status summary.',
  usage: ['backlog-engineer status [--refresh]'],
  options: OPTIONS,
  inputSchema: StatusCommandInputSchema,
  outputSchema: StatusCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('status', args, {
      options: {
        refresh: { type: 'boolean' },
      },
    });
    assertNoPositionals('status', parsed.positionals);

    return parseUsageInput('status', StatusCommandInputSchema, {
      refresh: parsed.values.refresh === true,
    });
  },
});
