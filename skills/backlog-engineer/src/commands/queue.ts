import {
  QueueCommandInputSchema,
  QueueCommandOutputSchema,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import { definePlaceholderCommand } from './placeholder.ts';

const OPTIONS = [] as const satisfies readonly CommandHelpOption[];

export const QUEUE_COMMAND = definePlaceholderCommand({
  name: 'queue',
  summary: 'Return ordered chains of tasks that can be taken next.',
  usage: ['backlog-engineer queue'],
  options: OPTIONS,
  inputSchema: QueueCommandInputSchema,
  outputSchema: QueueCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('queue', args, {});
    assertNoPositionals('queue', parsed.positionals);

    return parseUsageInput('queue', QueueCommandInputSchema, {});
  },
});
