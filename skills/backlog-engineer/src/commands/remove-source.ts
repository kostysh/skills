import path from 'node:path';

import {
  RemoveSourceCommandInputSchema,
  RemoveSourceCommandOutputSchema,
  type BacklogRelativePosixPath,
  type CommandHelpOption,
  type ItemKey,
  type PatchFile,
  type RemoveSourceCommandInput,
  type RemoveSourceCommandOutput,
  type SourceId,
  type SourceRecord,
  type SourceRegistryFile,
  type StateFile,
} from '../schemas/index.ts';
import { SCHEMA_VERSION } from '../runtime/tool-metadata.ts';
import {
  assertNoPositionals,
  getStringOption,
  parseCommandArgs,
  parseUsageInput,
} from './arg-parsers.ts';
import {
  ABSOLUTE_OUTPUT_NOTE,
  BACKLOG_MUTATION_SCOPE_NOTE,
  SERIAL_MUTATION_NOTE,
} from './help-notes.ts';
import {
  appendAppliedPatchEntry,
  assertCanonicalReplayMatchesState,
  assertPatchRegistryConstraints,
} from './mutation-helpers.ts';
import type { CommandDefinition } from './types.ts';
import { buildSourceSelectorFromFlags, resolveSourceRecord } from './source-selector.ts';
import { sortKeys, toSourceOutput } from './source-maintenance-helpers.ts';

const OPTIONS = [
  {
    flags: ['--source-id'],
    value_name: '<source_id>',
    description: 'Registered source ID to remove.',
  },
  {
    flags: ['--source-label'],
    value_name: '<source_label>',
    description: 'Registered source label to remove.',
  },
  {
    flags: ['--source-path'],
    value_name: '<path>',
    description: 'Registered source path to remove.',
  },
  {
    flags: ['--dry-run'],
    description: 'Validate and simulate source removal without writing to disk.',
  },
] as const satisfies readonly CommandHelpOption[];

type RemoveSourceSummary = Pick<
  RemoveSourceCommandOutput,
  | 'counts'
  | 'updated_item_keys'
  | 'todo_created'
  | 'todo_updated'
  | 'todo_removed'
  | 'next_commands'
>;

function collectItemSourceIds(item: StateFile['items'][number]): Set<SourceId> {
  return new Set<SourceId>([
    ...item.origin_source_ids,
    ...item.specification_source_ids,
    ...item.plan_source_ids,
    ...item.implementation_source_ids,
    ...item.test_source_ids,
  ]);
}

function collectSourceRemovalScope(payload: { state: StateFile; sourceId: SourceId }): {
  rootItemKeys: ItemKey[];
  directItemKeys: ItemKey[];
  referencingContextKeys: string[];
} {
  const rootItemKeys = new Set<ItemKey>();
  const directItemKeys = new Set<ItemKey>();
  const referencingContextKeys = new Set<string>();

  for (const item of payload.state.items) {
    if (!collectItemSourceIds(item).has(payload.sourceId)) {
      continue;
    }

    rootItemKeys.add(item.item_key);
    directItemKeys.add(item.item_key);
  }

  const itemsByClaimKey = new Map<string, ItemKey[]>();
  const itemsByQualityAttributeKey = new Map<string, ItemKey[]>();
  const itemsByPolicyDecisionKey = new Map<string, ItemKey[]>();

  for (const item of payload.state.items) {
    for (const claimKey of item.claim_keys) {
      itemsByClaimKey.set(claimKey, [...(itemsByClaimKey.get(claimKey) ?? []), item.item_key]);
    }
    for (const qualityAttributeKey of item.quality_attribute_keys) {
      itemsByQualityAttributeKey.set(qualityAttributeKey, [
        ...(itemsByQualityAttributeKey.get(qualityAttributeKey) ?? []),
        item.item_key,
      ]);
    }
    for (const policyDecisionKey of item.policy_decision_keys) {
      itemsByPolicyDecisionKey.set(policyDecisionKey, [
        ...(itemsByPolicyDecisionKey.get(policyDecisionKey) ?? []),
        item.item_key,
      ]);
    }
  }

  for (const claim of payload.state.context.claims) {
    if (!claim.source_ids.includes(payload.sourceId)) {
      continue;
    }

    referencingContextKeys.add(`claim:${claim.claim_key}`);
    for (const itemKey of itemsByClaimKey.get(claim.claim_key) ?? []) {
      rootItemKeys.add(itemKey);
    }
  }

  for (const qualityAttribute of payload.state.context.quality_attributes) {
    if (!qualityAttribute.source_ids.includes(payload.sourceId)) {
      continue;
    }

    referencingContextKeys.add(`quality_attribute:${qualityAttribute.quality_attribute_key}`);
    for (const itemKey of qualityAttribute.applies_to_item_keys) {
      rootItemKeys.add(itemKey);
    }
    for (const itemKey of itemsByQualityAttributeKey.get(qualityAttribute.quality_attribute_key) ??
      []) {
      rootItemKeys.add(itemKey);
    }
  }

  for (const policyDecision of payload.state.context.policy_decisions) {
    if (!policyDecision.source_ids.includes(payload.sourceId)) {
      continue;
    }

    referencingContextKeys.add(`policy_decision:${policyDecision.policy_decision_key}`);
    for (const itemKey of policyDecision.related_item_keys) {
      rootItemKeys.add(itemKey);
    }
    for (const itemKey of itemsByPolicyDecisionKey.get(policyDecision.policy_decision_key) ?? []) {
      rootItemKeys.add(itemKey);
    }
  }

  return {
    rootItemKeys: sortKeys(rootItemKeys),
    directItemKeys: sortKeys(directItemKeys),
    referencingContextKeys: sortKeys(referencingContextKeys),
  };
}

function removeSourceFromRegistry(payload: {
  registry: SourceRegistryFile;
  source: SourceRecord;
  updatedAt: string;
}): SourceRegistryFile {
  return {
    ...payload.registry,
    updated_at: payload.updatedAt,
    sources: payload.registry.sources.filter(
      (candidate) => candidate.source_id !== payload.source.source_id,
    ),
  };
}

function createMaintenancePatch(payload: {
  context: {
    host: { createUuid(): string; nowIsoUtc(): string };
    schemas: { parsePatchFile(raw: unknown): PatchFile };
  };
  sourceId: SourceId;
  affectedItemKeys: ItemKey[];
  sequence: number;
}): PatchFile {
  return payload.context.schemas.parsePatchFile({
    metadata: {
      patch_id: `source-maintenance-${payload.context.host.createUuid()}`,
      created_at: payload.context.host.nowIsoUtc(),
      sequence: payload.sequence,
      target_item_keys: payload.affectedItemKeys,
    },
    operations: [
      {
        action: 'remove_source_references',
        source_id: payload.sourceId,
        affected_item_keys: payload.affectedItemKeys,
      },
    ],
  });
}

export const REMOVE_SOURCE_COMMAND: CommandDefinition<
  RemoveSourceCommandInput,
  RemoveSourceCommandOutput
> = {
  name: 'remove-source',
  summary: 'Remove a source after durable cleanup of backlog references.',
  usage: [
    'backlog-engineer remove-source --source-id <source_id> [--dry-run]',
    'backlog-engineer remove-source --source-label <source_label> [--dry-run]',
    'backlog-engineer remove-source --source-path <path> [--dry-run]',
  ],
  options: OPTIONS,
  notes: [
    BACKLOG_MUTATION_SCOPE_NOTE,
    'The command removes source references from durable backlog truth before deleting the source registry record.',
    'Affected items receive mutation-managed review todo that explicitly says the source was removed.',
    SERIAL_MUTATION_NOTE,
    ABSOLUTE_OUTPUT_NOTE,
  ],
  inputSchema: RemoveSourceCommandInputSchema,
  outputSchema: RemoveSourceCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('remove-source', args, {
      options: {
        'source-id': { type: 'string' },
        'source-label': { type: 'string' },
        'source-path': { type: 'string' },
        'dry-run': { type: 'boolean' },
      },
    });
    assertNoPositionals('remove-source', parsed.positionals);

    return parseUsageInput('remove-source', RemoveSourceCommandInputSchema, {
      selector: buildSourceSelectorFromFlags({
        commandName: 'remove-source',
        sourceId: getStringOption(parsed.values['source-id']),
        sourceLabel: getStringOption(parsed.values['source-label']),
        sourcePath: getStringOption(parsed.values['source-path']),
      }),
      dry_run: parsed.values['dry-run'] === true,
    });
  },
  async execute(input, context) {
    if (!context.backlogRoot) {
      throw context.errors.create('BE_ROOT_NOT_FOUND');
    }
    const backlogRoot = context.backlogRoot;

    const [state, registry, appliedRegistry] = await Promise.all([
      context.ensureMutationState(),
      context.artifacts.readSourceRegistry(backlogRoot),
      context.artifacts.readAppliedRegistry(backlogRoot),
    ]);
    const source = await resolveSourceRecord({
      context,
      registry,
      selector: input.selector,
    });
    const sourceOutput = toSourceOutput({ backlogRoot, source });
    const removalScope = collectSourceRemovalScope({
      state,
      sourceId: source.source_id,
    });

    if (removalScope.rootItemKeys.length === 0 && removalScope.referencingContextKeys.length > 0) {
      throw context.errors.create('BE_SOURCE_REMOVE_UNSUPPORTED', undefined, {
        details: {
          source_id: source.source_id,
          source_label: source.source_label,
          path: source.path,
          referencing_item_keys: removalScope.directItemKeys,
          referencing_context_keys: removalScope.referencingContextKeys,
        },
        hint: 'The source is referenced only by context entities with no affected item scope, so this utility version cannot attach a review-visible cleanup mutation.',
      });
    }

    const affectedItemKeys =
      removalScope.rootItemKeys.length === 0
        ? []
        : context.core.graph.resolveItemSubgraph({
            state,
            rootItemKeys: removalScope.rootItemKeys,
          });
    const sequence = Math.max(0, ...appliedRegistry.patches.map((entry) => entry.sequence)) + 1;
    const maintenancePatch =
      affectedItemKeys.length === 0
        ? undefined
        : createMaintenancePatch({
            context,
            sourceId: source.source_id,
            affectedItemKeys,
            sequence,
          });

    let nextState = state;
    let summary: RemoveSourceSummary = {
      counts: {
        updated: 0,
        todo_created: 0,
        todo_updated: 0,
        todo_removed: 0,
      },
      updated_item_keys: [] as ItemKey[],
      todo_created: [] as ItemKey[],
      todo_updated: [] as ItemKey[],
      todo_removed: [] as ItemKey[],
      next_commands: [],
    };

    if (maintenancePatch) {
      assertPatchRegistryConstraints({
        context,
        registry: appliedRegistry,
        patch: maintenancePatch,
      });
      const maintenanceSummary = await context.core.mutation.removeSourceReferences({
        state,
        patch: maintenancePatch,
        sourceRegistry: registry,
        sourceId: source.source_id,
        affectedItemKeys,
        updatedItemKeys: removalScope.directItemKeys,
      });
      nextState = maintenanceSummary.state;
      summary = {
        counts: maintenanceSummary.counts,
        updated_item_keys: maintenanceSummary.updated_item_keys,
        todo_created: maintenanceSummary.todo_created,
        todo_updated: maintenanceSummary.todo_updated,
        todo_removed: maintenanceSummary.todo_removed,
        next_commands: maintenanceSummary.next_commands,
      };
    }

    const outputBase = {
      dry_run: input.dry_run,
      ...sourceOutput,
      removed: true,
      ...summary,
    };
    const output = context.schemas.parseCommandOutput('remove-source', outputBase);

    if (input.dry_run) {
      return output;
    }

    const nextRegistry = context.schemas.parseSourceRegistry({
      ...removeSourceFromRegistry({
        registry,
        source,
        updatedAt: context.host.nowIsoUtc(),
      }),
      schema_version: SCHEMA_VERSION,
    });

    if (maintenancePatch) {
      const rawContent = `${JSON.stringify(maintenancePatch, null, 2)}\n`;
      let canonicalPath: BacklogRelativePosixPath | undefined;

      try {
        const canonicalImport = await context.artifacts.importPatchFile({
          root: backlogRoot,
          patchId: maintenancePatch.metadata.patch_id,
          sourcePath: backlogRoot,
          canonicalBasename: `${maintenancePatch.metadata.patch_id}.json`,
          rawContent,
        });
        canonicalPath = canonicalImport.canonicalPath;
        const nextAppliedRegistry = appendAppliedPatchEntry({
          schemas: context.schemas,
          registry: appliedRegistry,
          patch: maintenancePatch,
          kind: 'source-maintenance',
          canonicalPath,
          contentHash: canonicalImport.sha256,
          appliedAt: context.host.nowIsoUtc(),
        });

        await context.artifacts.writeAppliedRegistry(backlogRoot, nextAppliedRegistry);
        await context.artifacts.writeState(backlogRoot, nextState);
        await context.artifacts.writeSourceRegistry(backlogRoot, nextRegistry);
        await assertCanonicalReplayMatchesState({
          artifactKind: 'patch',
          canonicalPath,
          commandName: 'remove-source',
          context,
          state: nextState,
        });
        const outputWithCanonicalPatch = context.schemas.parseCommandOutput('remove-source', {
          ...outputBase,
          canonical_patch_path: path.resolve(backlogRoot, canonicalPath),
          canonical_patch_purpose: 'immutable_replay_artifact' as const,
        });
        return outputWithCanonicalPatch;
      } catch (error) {
        const rollbackErrors: unknown[] = [];
        try {
          await context.artifacts.writeSourceRegistry(backlogRoot, registry);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
        try {
          await context.artifacts.writeState(backlogRoot, state);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
        try {
          await context.artifacts.writeAppliedRegistry(backlogRoot, appliedRegistry);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
        if (canonicalPath) {
          try {
            await context.artifacts.removeCanonicalPatchFile({
              root: backlogRoot,
              canonicalPath,
            });
          } catch (rollbackError) {
            rollbackErrors.push(rollbackError);
          }
        }

        if (rollbackErrors.length > 0) {
          throw context.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
            details: {
              command: 'remove-source',
              phase: 'source_maintenance_write',
              rollback: 'failed',
              rollback_error_count: rollbackErrors.length,
            },
            hint: 'Source removal failed after partial writes and rollback also failed; inspect backlog artifacts before retrying.',
            cause: error,
          });
        }

        throw error;
      }
    }

    await context.artifacts.writeSourceRegistry(backlogRoot, nextRegistry);
    return output;
  },
};
