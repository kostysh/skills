import {
  QueueCommandInputSchema,
  QueueCommandOutputSchema,
  type QueueCommandInput,
  type QueueCommandOutput,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import { BACKLOG_QUERY_SCOPE_NOTE } from './help-notes.ts';
import { loadQueryState } from './query-helpers.ts';

const OPTIONS = [] as const satisfies readonly CommandHelpOption[];

export const QUEUE_COMMAND: CommandDefinition<QueueCommandInput, QueueCommandOutput> = {
  name: 'queue',
  summary: 'Return ordered chains of tasks that can be taken next.',
  usage: ['backlog-engineer queue'],
  options: OPTIONS,
  notes: [
    BACKLOG_QUERY_SCOPE_NOTE,
    '`queue` returns ordered ready chains, not a flat list of every ready item.',
    'If `queue` is empty, inspect `gaps` and `attention` before assuming backlog creation failed.',
  ],
  inputSchema: QueueCommandInputSchema,
  outputSchema: QueueCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('queue', args, {});
    assertNoPositionals('queue', parsed.positionals);

    return parseUsageInput('queue', QueueCommandInputSchema, {});
  },
  async execute(_input, context) {
    const state = await loadQueryState(context);
    return context.core.queue.buildQueueChains({
      state,
    });
  },
};
