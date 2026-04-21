import path from 'node:path';

import {
  ListSourcesCommandInputSchema,
  ListSourcesCommandOutputSchema,
  type ListSourcesCommandInput,
  type ListSourcesCommandOutput,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import { ABSOLUTE_OUTPUT_NOTE, BACKLOG_QUERY_SCOPE_NOTE } from './help-notes.ts';

function collectItemSourceIds(item: {
  origin_source_ids: string[];
  specification_source_ids: string[];
  plan_source_ids: string[];
  implementation_source_ids: string[];
  test_source_ids: string[];
}): Set<string> {
  return new Set([
    ...item.origin_source_ids,
    ...item.specification_source_ids,
    ...item.plan_source_ids,
    ...item.implementation_source_ids,
    ...item.test_source_ids,
  ]);
}

const OPTIONS = [
  {
    flags: ['--item-key'],
    value_name: '<item_key>',
    description: 'Limit the result to sources linked to a single task.',
  },
  {
    flags: ['--path'],
    value_name: '<path>',
    description: 'Filter sources by the provided source path.',
  },
] as const satisfies readonly CommandHelpOption[];

export const LIST_SOURCES_COMMAND: CommandDefinition<
  ListSourcesCommandInput,
  ListSourcesCommandOutput
> = {
  name: 'list-sources',
  summary: 'List registered sources and source metadata.',
  usage: [
    'backlog-engineer list-sources',
    'backlog-engineer list-sources --item-key <item_key>',
    'backlog-engineer list-sources --path <path>',
  ],
  options: OPTIONS,
  notes: [
    BACKLOG_QUERY_SCOPE_NOTE,
    '`--path` resolves from the current working directory before it is normalized relative to backlog root for matching.',
    ABSOLUTE_OUTPUT_NOTE,
  ],
  inputSchema: ListSourcesCommandInputSchema,
  outputSchema: ListSourcesCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('list-sources', args, {
      options: {
        'item-key': { type: 'string' },
        path: { type: 'string' },
      },
    });
    assertNoPositionals('list-sources', parsed.positionals);

    return parseUsageInput('list-sources', ListSourcesCommandInputSchema, {
      ...(typeof parsed.values['item-key'] === 'string'
        ? { item_key: parsed.values['item-key'] }
        : {}),
      ...(typeof parsed.values.path === 'string' ? { path: parsed.values.path } : {}),
    });
  },
  async execute(input, context) {
    if (!context.backlogRoot) {
      throw context.errors.create('BE_ROOT_NOT_FOUND');
    }
    const backlogRoot = context.backlogRoot;

    let sources = [...(await context.artifacts.readSourceRegistry(backlogRoot)).sources];

    if (input.item_key) {
      const { state } = await context.ensureQueryState();
      const item = state.items.find((candidate) => candidate.item_key === input.item_key);
      if (!item) {
        throw context.errors.create('BE_ITEM_NOT_FOUND', undefined, {
          details: {
            item_key: input.item_key,
          },
        });
      }

      const itemSourceIds = collectItemSourceIds(item);
      sources = sources.filter((source) => itemSourceIds.has(source.source_id));
    }

    if (input.path) {
      const normalizedSource = await context.sources.resolveCliSourcePath({
        backlogRoot,
        inputPath: context.host.resolveCliPath(input.path),
      });
      sources = sources.filter((source) => source.path === normalizedSource.relative_path);
    }

    return context.schemas.parseCommandOutput('list-sources', [
      ...sources
        .sort((left, right) => {
          const labelCompare = left.source_label.localeCompare(right.source_label);
          if (labelCompare !== 0) {
            return labelCompare;
          }

          return left.source_id.localeCompare(right.source_id);
        })
        .map((source) => ({
          source_id: source.source_id,
          source_label: source.source_label,
          path: path.resolve(backlogRoot, source.path),
          kind: source.kind,
          authority: source.authority,
          ...(source.note ? { note: source.note } : {}),
          hash: source.hash,
          registered_at: source.registered_at,
          last_checked_at: source.last_checked_at,
        })),
    ]);
  },
};
