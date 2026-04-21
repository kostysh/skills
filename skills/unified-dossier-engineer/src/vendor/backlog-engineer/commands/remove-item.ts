import path from 'node:path';

import {
  RemoveItemPatchFileSchema,
  RemoveItemCommandInputSchema,
  RemoveItemCommandOutputSchema,
  type CommandHelpOption,
  type RemoveItemCommandInput,
  type RemoveItemCommandOutput,
} from '../schemas/index.ts';
import {
  assertNoPositionals,
  getStringOption,
  parseCommandArgs,
  parseUsageInput,
  requireStringOption,
} from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import {
  appendAppliedPatchEntry,
  assertPatchRegistryConstraints,
  assertCanonicalReplayMatchesState,
  readAuthoredJsonFile,
} from './mutation-helpers.ts';

const OPTIONS = [
  {
    flags: ['--patch'],
    value_name: '<path>',
    description: 'Path to the authored remove-item patch file.',
    required: true,
  },
  {
    flags: ['--dry-run'],
    description: 'Validate and simulate item removal without writing to disk.',
  },
] as const satisfies readonly CommandHelpOption[];

export const REMOVE_ITEM_COMMAND: CommandDefinition<
  RemoveItemCommandInput,
  RemoveItemCommandOutput
> = {
  name: 'remove-item',
  summary: 'Apply a patch that removes obsolete tasks.',
  usage: ['backlog-engineer remove-item --patch <path> [--dry-run]'],
  options: OPTIONS,
  inputSchema: RemoveItemCommandInputSchema,
  outputSchema: RemoveItemCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('remove-item', args, {
      options: {
        patch: { type: 'string' },
        'dry-run': { type: 'boolean' },
      },
    });
    assertNoPositionals('remove-item', parsed.positionals);

    return parseUsageInput('remove-item', RemoveItemCommandInputSchema, {
      patch: requireStringOption('remove-item', '--patch', getStringOption(parsed.values.patch)),
      dry_run: parsed.values['dry-run'] === true,
    });
  },
  async execute(input, context) {
    if (!context.backlogRoot) {
      throw context.errors.create('BE_ROOT_NOT_FOUND', undefined, {
        details: {
          command: 'remove-item',
        },
      });
    }

    const [state, sourceRegistry, appliedRegistry, patchInput] = await Promise.all([
      context.ensureMutationState(),
      context.artifacts.readSourceRegistry(context.backlogRoot),
      context.artifacts.readAppliedRegistry(context.backlogRoot),
      readAuthoredJsonFile({
        context,
        commandName: 'remove-item',
        inputPath: input.patch,
        parse: (raw) => RemoveItemPatchFileSchema.parse(raw),
      }),
    ]);

    assertPatchRegistryConstraints({
      context,
      registry: appliedRegistry,
      patch: patchInput.value,
    });

    const summary = await context.core.mutation.applyPatch({
      state,
      patch: patchInput.value,
      sourceRegistry,
      dryRun: input.dry_run,
    });
    if (!('removed' in summary)) {
      throw context.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
        details: {
          command: 'remove-item',
          patch_id: patchInput.value.metadata.patch_id,
        },
        hint: 'remove-item must receive a patch summary with removed item keys.',
      });
    }
    const { state: nextState, ...summaryOutput } = summary;
    const outputBase = {
      ...summaryOutput,
      authored_patch_path: patchInput.absolutePath,
    };

    if (input.dry_run) {
      return outputBase;
    }

    const appliedAt = context.host.nowIsoUtc();
    const canonicalImport = await context.artifacts.importPatchFile({
      root: context.backlogRoot,
      patchId: patchInput.value.metadata.patch_id,
      sourcePath: patchInput.absolutePath,
      canonicalBasename: patchInput.canonicalBasename,
      rawContent: patchInput.rawContent,
    });
    const nextAppliedRegistry = appendAppliedPatchEntry({
      schemas: context.schemas,
      registry: appliedRegistry,
      patch: patchInput.value,
      kind: 'remove-item',
      canonicalPath: canonicalImport.canonicalPath,
      contentHash: canonicalImport.sha256,
      appliedAt,
    });

    await context.artifacts.writeAppliedRegistry(context.backlogRoot, nextAppliedRegistry);
    await context.artifacts.writeState(context.backlogRoot, nextState);
    await assertCanonicalReplayMatchesState({
      artifactKind: 'patch',
      canonicalPath: canonicalImport.canonicalPath,
      commandName: 'remove-item',
      context,
      state: nextState,
    });
    const output = {
      ...outputBase,
      canonical_patch_path: path.resolve(context.backlogRoot, canonicalImport.canonicalPath),
      canonical_patch_purpose: 'immutable_replay_artifact' as const,
    };
    await context.hooks.afterPatchApplied?.({
      summary: output,
      state: nextState,
      backlogRoot: context.backlogRoot,
    });

    return output;
  },
};
