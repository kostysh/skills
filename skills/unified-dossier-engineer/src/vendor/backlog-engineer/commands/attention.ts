import {
  AttentionCommandInputSchema,
  AttentionCommandOutputSchema,
  type AttentionCommandInput,
  type AttentionCommandOutput,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import { BACKLOG_QUERY_SCOPE_NOTE } from './help-notes.ts';
import { loadQueryStateWithRegistry } from './query-helpers.ts';

const OPTIONS = [] as const satisfies readonly CommandHelpOption[];

export const ATTENTION_COMMAND: CommandDefinition<AttentionCommandInput, AttentionCommandOutput> = {
  name: 'attention',
  summary: 'Return tasks that require review or re-checking.',
  usage: ['backlog-engineer attention'],
  options: OPTIONS,
  notes: [
    BACKLOG_QUERY_SCOPE_NOTE,
    '`attention` returns review and re-check items, not every blocked task in the backlog.',
    'Entries are ordered by severity first, then by item key.',
  ],
  inputSchema: AttentionCommandInputSchema,
  outputSchema: AttentionCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('attention', args, {});
    assertNoPositionals('attention', parsed.positionals);

    return parseUsageInput('attention', AttentionCommandInputSchema, {});
  },
  async execute(_input, context) {
    const { state, registry } = await loadQueryStateWithRegistry(context);
    return context.core.attention.buildAttentionList({
      state,
      registry,
    });
  },
};
