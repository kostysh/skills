import {
  StatusCommandInputSchema,
  StatusCommandOutputSchema,
  type StatusCommandInput,
  type StatusCommandOutput,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import { BACKLOG_QUERY_SCOPE_NOTE, SERIAL_MUTATION_NOTE } from './help-notes.ts';
import { buildStatusSummary, executeRefreshFlow } from './refresh-helpers.ts';

const OPTIONS = [
  {
    flags: ['--refresh'],
    description: 'Run refresh before returning the status summary.',
  },
] as const satisfies readonly CommandHelpOption[];

export const STATUS_COMMAND: CommandDefinition<StatusCommandInput, StatusCommandOutput> = {
  name: 'status',
  summary: 'Show short backlog status summary.',
  usage: ['backlog-engineer status [--refresh]'],
  options: OPTIONS,
  notes: [
    BACKLOG_QUERY_SCOPE_NOTE,
    '`status` returns a short summary of the current backlog state.',
    '`status --refresh` first runs refresh, so treat it as a mutating composite command.',
    SERIAL_MUTATION_NOTE,
  ],
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
  async execute(input, context) {
    if (!context.backlogRoot) {
      throw context.errors.create('BE_ROOT_NOT_FOUND');
    }

    if (input.refresh) {
      const refreshed = await executeRefreshFlow({
        input: { kind: 'all' },
        context,
      });

      return buildStatusSummary({
        context,
        state: refreshed.state,
      });
    }

    const { state } = await context.ensureQueryState();
    return buildStatusSummary({
      context,
      state,
    });
  },
};
