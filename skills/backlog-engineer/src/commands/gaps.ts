import {
  GapsCommandInputSchema,
  GapsCommandOutputSchema,
  type GapsCommandInput,
  type GapsCommandOutput,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import { loadQueryState } from './query-helpers.ts';

const OPTIONS = [
  {
    flags: ['--item-key'],
    value_name: '<item_key>',
    description: 'Restrict output to a single task key.',
  },
] as const satisfies readonly CommandHelpOption[];

export const GAPS_COMMAND: CommandDefinition<GapsCommandInput, GapsCommandOutput> = {
  name: 'gaps',
  summary: 'List explicit blockers and unresolved gaps.',
  usage: ['backlog-engineer gaps', 'backlog-engineer gaps --item-key <item_key>'],
  options: OPTIONS,
  inputSchema: GapsCommandInputSchema,
  outputSchema: GapsCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('gaps', args, {
      options: {
        'item-key': { type: 'string' },
      },
    });
    assertNoPositionals('gaps', parsed.positionals);

    return parseUsageInput('gaps', GapsCommandInputSchema, {
      ...(typeof parsed.values['item-key'] === 'string'
        ? { item_key: parsed.values['item-key'] }
        : {}),
    });
  },
  async execute(input, context) {
    const state = await loadQueryState(context);
    return context.core.mutation.getGaps({
      state,
      filters: input,
    });
  },
};
