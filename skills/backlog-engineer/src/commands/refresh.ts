import { createUsageError } from '../errors/index.ts';
import {
  RefreshCommandInputSchema,
  RefreshCommandOutputSchema,
  type RefreshCommandInput,
  type RefreshCommandOutput,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import { executeRefreshFlow } from './refresh-helpers.ts';

const OPTIONS = [
  {
    flags: ['--item-key'],
    value_name: '<item_key>',
    description: 'Refresh the dependency subgraph rooted at a specific task.',
  },
  {
    flags: ['--source-id'],
    value_name: '<source_id>',
    description: 'Refresh tasks linked to a specific source ID.',
  },
  {
    flags: ['--source-label'],
    value_name: '<source_label>',
    description: 'Refresh tasks linked to a specific source label.',
  },
  {
    flags: ['--source-path'],
    value_name: '<path>',
    description: 'Refresh tasks linked to a specific source path.',
  },
] as const satisfies readonly CommandHelpOption[];

export const REFRESH_COMMAND: CommandDefinition<RefreshCommandInput, RefreshCommandOutput> = {
  name: 'refresh',
  summary: 'Refresh source-derived state in full or scoped form.',
  usage: [
    'backlog-engineer refresh',
    'backlog-engineer refresh --item-key <item_key>',
    'backlog-engineer refresh --source-id <source_id>',
    'backlog-engineer refresh --source-label <source_label>',
    'backlog-engineer refresh --source-path <path>',
  ],
  options: OPTIONS,
  inputSchema: RefreshCommandInputSchema,
  outputSchema: RefreshCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('refresh', args, {
      options: {
        'item-key': { type: 'string' },
        'source-id': { type: 'string' },
        'source-label': { type: 'string' },
        'source-path': { type: 'string' },
      },
    });
    assertNoPositionals('refresh', parsed.positionals);

    const selectors = [
      parsed.values['item-key'] ? 'item' : null,
      parsed.values['source-id'] ? 'source_id' : null,
      parsed.values['source-label'] ? 'source_label' : null,
      parsed.values['source-path'] ? 'source_path' : null,
    ].filter((value) => value !== null);

    if (selectors.length > 1) {
      throw createUsageError(
        {
          command: 'refresh',
          conflicting_selectors: selectors,
        },
        'Use only one selector: --item-key, --source-id, --source-label, or --source-path.',
      );
    }

    if (parsed.values['item-key']) {
      return parseUsageInput('refresh', RefreshCommandInputSchema, {
        kind: 'item',
        item_key: parsed.values['item-key'],
      });
    }

    if (parsed.values['source-id']) {
      return parseUsageInput('refresh', RefreshCommandInputSchema, {
        kind: 'source_id',
        source_id: parsed.values['source-id'],
      });
    }

    if (parsed.values['source-label']) {
      return parseUsageInput('refresh', RefreshCommandInputSchema, {
        kind: 'source_label',
        source_label: parsed.values['source-label'],
      });
    }

    if (parsed.values['source-path']) {
      return parseUsageInput('refresh', RefreshCommandInputSchema, {
        kind: 'source_path',
        source_path: parsed.values['source-path'],
      });
    }

    return parseUsageInput('refresh', RefreshCommandInputSchema, {
      kind: 'all',
    });
  },
  async execute(input, context) {
    const { summary } = await executeRefreshFlow({
      input,
      context,
    });

    return summary;
  },
};
