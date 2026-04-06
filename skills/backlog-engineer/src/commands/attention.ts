import {
  AttentionCommandInputSchema,
  AttentionCommandOutputSchema,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import { definePlaceholderCommand } from './placeholder.ts';

const OPTIONS = [] as const satisfies readonly CommandHelpOption[];

export const ATTENTION_COMMAND = definePlaceholderCommand({
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
});
