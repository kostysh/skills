import { createBacklogError } from '../errors/index.ts';
import {
  DeleteBacklogCommandInputSchema,
  DeleteBacklogCommandOutputSchema,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import { definePlaceholderCommand } from './placeholder.ts';

const OPTIONS = [
  {
    flags: ['--confirm'],
    description: 'Explicitly confirm backlog deletion.',
    required: true,
  },
] as const satisfies readonly CommandHelpOption[];

export const DELETE_BACKLOG_COMMAND = definePlaceholderCommand({
  name: 'delete-backlog',
  summary: 'Delete the backlog and its utility-owned artifacts.',
  usage: ['backlog-engineer delete-backlog --confirm'],
  options: OPTIONS,
  inputSchema: DeleteBacklogCommandInputSchema,
  outputSchema: DeleteBacklogCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('delete-backlog', args, {
      options: {
        confirm: { type: 'boolean' },
      },
    });
    assertNoPositionals('delete-backlog', parsed.positionals);

    if (parsed.values.confirm !== true) {
      throw createBacklogError({
        code: 'BE_DELETE_CONFIRM_REQUIRED',
        details: {
          command: 'delete-backlog',
        },
        hint: 'Re-run the command with `--confirm` only after explicit operator approval.',
      });
    }

    return parseUsageInput('delete-backlog', DeleteBacklogCommandInputSchema, {
      confirm: true,
    });
  },
});
