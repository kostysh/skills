import {
  AttentionCommandInputSchema,
  AttentionCommandOutputSchema,
  type AttentionCommandInput,
  type AttentionCommandOutput,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import { loadQueryStateWithRegistry } from './query-helpers.ts';

const OPTIONS = [] as const satisfies readonly CommandHelpOption[];

export const ATTENTION_COMMAND: CommandDefinition<AttentionCommandInput, AttentionCommandOutput> = {
  name: 'attention',
  summary: 'Return tasks that require review or re-checking.',
  usage: ['backlog-engineer attention'],
  options: OPTIONS,
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
