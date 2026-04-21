import {
  UpdateSourcePathCommandInputSchema,
  UpdateSourcePathCommandOutputSchema,
  type CommandHelpOption,
  type SourceRecord,
  type SourceRegistryFile,
  type UpdateSourcePathCommandInput,
  type UpdateSourcePathCommandOutput,
} from '../schemas/index.ts';
import {
  assertNoPositionals,
  getStringOption,
  parseCommandArgs,
  parseUsageInput,
  requireStringOption,
} from './arg-parsers.ts';
import {
  ABSOLUTE_OUTPUT_NOTE,
  BACKLOG_MUTATION_SCOPE_NOTE,
  SERIAL_MUTATION_NOTE,
} from './help-notes.ts';
import type { CommandDefinition } from './types.ts';
import { buildSourceSelectorFromFlags, resolveSourceRecord } from './source-selector.ts';
import { sortKeys, syncTodoSourceLabels, toSourceOutput } from './source-maintenance-helpers.ts';

const OPTIONS = [
  {
    flags: ['--source-id'],
    value_name: '<source_id>',
    description: 'Registered source ID to update.',
  },
  {
    flags: ['--source-label'],
    value_name: '<source_label>',
    description: 'Registered source label to update.',
  },
  {
    flags: ['--source-path'],
    value_name: '<path>',
    description: 'Registered source path to update.',
  },
  {
    flags: ['--new-path'],
    value_name: '<path>',
    description: 'New filesystem path for the same logical source.',
    required: true,
  },
  {
    flags: ['--dry-run'],
    description: 'Validate and simulate path update without writing to disk.',
  },
] as const satisfies readonly CommandHelpOption[];

function sortSources(values: readonly SourceRecord[]): SourceRecord[] {
  return [...values].sort((left, right) => {
    const labelCompare = left.source_label.localeCompare(right.source_label);
    if (labelCompare !== 0) {
      return labelCompare;
    }

    return left.source_id.localeCompare(right.source_id);
  });
}

function updateRegistrySource(payload: {
  registry: SourceRegistryFile;
  source: SourceRecord;
  updatedSource: SourceRecord;
  updatedAt: string;
}): SourceRegistryFile {
  return {
    ...payload.registry,
    updated_at: payload.updatedAt,
    sources: sortSources(
      payload.registry.sources.map((candidate) =>
        candidate.source_id === payload.source.source_id ? payload.updatedSource : candidate,
      ),
    ),
  };
}

export const UPDATE_SOURCE_PATH_COMMAND: CommandDefinition<
  UpdateSourcePathCommandInput,
  UpdateSourcePathCommandOutput
> = {
  name: 'update-source-path',
  summary: 'Update the registered path of an existing source.',
  usage: [
    'backlog-engineer update-source-path --source-id <source_id> --new-path <path> [--dry-run]',
    'backlog-engineer update-source-path --source-label <source_label> --new-path <path> [--dry-run]',
    'backlog-engineer update-source-path --source-path <path> --new-path <path> [--dry-run]',
  ],
  options: OPTIONS,
  notes: [
    BACKLOG_MUTATION_SCOPE_NOTE,
    'The source keeps the same source_id; only its path, label, hash, and last_checked_at can change.',
    'If the new file hash changed, the command applies scoped refresh semantics for the same source_id.',
    SERIAL_MUTATION_NOTE,
    ABSOLUTE_OUTPUT_NOTE,
  ],
  inputSchema: UpdateSourcePathCommandInputSchema,
  outputSchema: UpdateSourcePathCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('update-source-path', args, {
      options: {
        'source-id': { type: 'string' },
        'source-label': { type: 'string' },
        'source-path': { type: 'string' },
        'new-path': { type: 'string' },
        'dry-run': { type: 'boolean' },
      },
    });
    assertNoPositionals('update-source-path', parsed.positionals);

    return parseUsageInput('update-source-path', UpdateSourcePathCommandInputSchema, {
      selector: buildSourceSelectorFromFlags({
        commandName: 'update-source-path',
        sourceId: getStringOption(parsed.values['source-id']),
        sourceLabel: getStringOption(parsed.values['source-label']),
        sourcePath: getStringOption(parsed.values['source-path']),
      }),
      new_path: requireStringOption(
        'update-source-path',
        '--new-path',
        getStringOption(parsed.values['new-path']),
      ),
      dry_run: parsed.values['dry-run'] === true,
    });
  },
  async execute(input, context) {
    if (!context.backlogRoot) {
      throw context.errors.create('BE_ROOT_NOT_FOUND');
    }
    const backlogRoot = context.backlogRoot;

    const [state, registry] = await Promise.all([
      context.ensureMutationState(),
      context.artifacts.readSourceRegistry(backlogRoot),
    ]);
    const source = await resolveSourceRecord({
      context,
      registry,
      selector: input.selector,
    });
    const normalizedNewPath = await context.sources.resolveCliSourcePath({
      backlogRoot,
      inputPath: context.host.resolveCliPath(input.new_path),
    });

    if (normalizedNewPath.relative_path === source.path) {
      await context.sources.hashSourceFile(normalizedNewPath.absolute_path);

      return context.schemas.parseCommandOutput('update-source-path', {
        dry_run: input.dry_run,
        ...toSourceOutput({ backlogRoot, source }),
        previous_path: toSourceOutput({ backlogRoot, source }).path,
        hash_changed: false,
        counts: {
          changed_sources: 0,
          todo_created: 0,
          todo_updated: 0,
          todo_removed: 0,
        },
        todo_created: [],
        todo_updated: [],
        todo_removed: [],
        next_commands: [],
      });
    }

    const conflictingSource = registry.sources.find(
      (candidate) =>
        candidate.path === normalizedNewPath.relative_path &&
        candidate.source_id !== source.source_id,
    );
    if (conflictingSource) {
      throw context.errors.create('BE_SOURCE_PATH_CONFLICT', undefined, {
        details: {
          source_id: source.source_id,
          source_label: source.source_label,
          new_path: normalizedNewPath.relative_path,
          conflicting_source_id: conflictingSource.source_id,
          conflicting_source_label: conflictingSource.source_label,
        },
        hint: 'Use a path not already registered by another source, or remove/update the conflicting source first.',
      });
    }

    const newHash = await context.sources.hashSourceFile(normalizedNewPath.absolute_path);
    const now = context.host.nowIsoUtc();
    const updatedSource = context.schemas.parseSourceRegistry({
      ...registry,
      sources: [
        {
          ...source,
          source_label: normalizedNewPath.source_label,
          path: normalizedNewPath.relative_path,
          hash: newHash,
          last_checked_at: now,
        },
      ],
    }).sources[0];
    if (!updatedSource) {
      throw context.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
        details: {
          command: 'update-source-path',
          reason: 'updated_source_parse_failed',
        },
      });
    }

    const nextRegistry = context.schemas.parseSourceRegistry(
      updateRegistrySource({
        registry,
        source,
        updatedSource,
        updatedAt: now,
      }),
    );
    const hashChanged = newHash !== source.hash;
    const previousPath = toSourceOutput({ backlogRoot, source }).path;

    if (!hashChanged) {
      const syncResult = syncTodoSourceLabels({
        schemas: context.schemas,
        state,
        registry: nextRegistry,
        previousRegistry: registry,
      });
      const syncedState = context.schemas.parseStateFile({
        ...syncResult.state,
        updated_at: now,
      });
      const output = context.schemas.parseCommandOutput('update-source-path', {
        dry_run: input.dry_run,
        ...toSourceOutput({ backlogRoot, source: updatedSource }),
        previous_path: previousPath,
        hash_changed: false,
        counts: {
          changed_sources: 1,
          todo_created: 0,
          todo_updated: syncResult.todoUpdated.length,
          todo_removed: 0,
        },
        todo_created: [],
        todo_updated: syncResult.todoUpdated,
        todo_removed: [],
        next_commands: [],
      });

      if (!input.dry_run) {
        await context.artifacts.writeState(backlogRoot, syncedState);
        try {
          await context.artifacts.writeSourceRegistry(backlogRoot, nextRegistry);
        } catch (error) {
          try {
            await context.artifacts.writeState(backlogRoot, state);
          } catch (rollbackError) {
            throw context.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
              details: {
                command: 'update-source-path',
                phase: 'write_source_registry',
                rollback: 'write_state',
              },
              hint: 'Source path update failed after persisting state and state rollback also failed.',
              cause: rollbackError,
            });
          }

          throw error;
        }
      }

      return output;
    }

    const refreshResult = await context.core.mutation.refresh({
      state,
      sourceRegistry: nextRegistry,
      changedSourceIds: [source.source_id],
      scope: {
        kind: 'source_id',
        source_id: source.source_id,
      },
    });
    const { state: refreshedState, registry: refreshedRegistry, ...refreshSummary } = refreshResult;
    const syncResult = syncTodoSourceLabels({
      schemas: context.schemas,
      state: refreshedState,
      registry: refreshedRegistry,
      previousRegistry: registry,
    });
    const nextState = syncResult.state;
    const todoUpdated = sortKeys([...refreshSummary.todo_updated, ...syncResult.todoUpdated]);
    const output = context.schemas.parseCommandOutput('update-source-path', {
      dry_run: input.dry_run,
      ...toSourceOutput({ backlogRoot, source: updatedSource }),
      previous_path: previousPath,
      hash_changed: true,
      counts: {
        ...refreshSummary.counts,
        todo_updated: todoUpdated.length,
      },
      todo_created: sortKeys(refreshSummary.todo_created),
      todo_updated: todoUpdated,
      todo_removed: sortKeys(refreshSummary.todo_removed),
      next_commands: refreshSummary.next_commands,
    });

    if (!input.dry_run) {
      await context.artifacts.writeState(backlogRoot, nextState);
      try {
        await context.artifacts.writeSourceRegistry(backlogRoot, refreshedRegistry);
      } catch (error) {
        try {
          await context.artifacts.writeState(backlogRoot, state);
        } catch (rollbackError) {
          throw context.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
            details: {
              command: 'update-source-path',
              phase: 'write_source_registry',
              rollback: 'write_state',
            },
            hint: 'Source path update failed after persisting state and state rollback also failed.',
            cause: rollbackError,
          });
        }

        throw error;
      }
      await context.hooks.afterRefresh?.({
        summary: refreshSummary,
        state: nextState,
        backlogRoot,
      });
    }

    return output;
  },
};
