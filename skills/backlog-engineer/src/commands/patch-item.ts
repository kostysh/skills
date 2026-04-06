import {
  PatchItemFileSchema,
  PatchItemCommandInputSchema,
  PatchItemCommandOutputSchema,
  type CommandHelpOption,
  type PatchItemCommandInput,
  type PatchItemCommandOutput,
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
  readAuthoredJsonFile,
} from './mutation-helpers.ts';

const OPTIONS = [
  {
    flags: ['--patch'],
    value_name: '<path>',
    description: 'Path to the authored patch-item file.',
    required: true,
  },
  {
    flags: ['--dry-run'],
    description: 'Validate and simulate patch application without writing to disk.',
  },
] as const satisfies readonly CommandHelpOption[];

export const PATCH_ITEM_COMMAND: CommandDefinition<PatchItemCommandInput, PatchItemCommandOutput> =
  {
    name: 'patch-item',
    summary: 'Apply a patch that updates existing tasks.',
    usage: ['backlog-engineer patch-item --patch <path> [--dry-run]'],
    options: OPTIONS,
    inputSchema: PatchItemCommandInputSchema,
    outputSchema: PatchItemCommandOutputSchema,
    parseArgs(args) {
      const parsed = parseCommandArgs('patch-item', args, {
        options: {
          patch: { type: 'string' },
          'dry-run': { type: 'boolean' },
        },
      });
      assertNoPositionals('patch-item', parsed.positionals);

      return parseUsageInput('patch-item', PatchItemCommandInputSchema, {
        patch: requireStringOption('patch-item', '--patch', getStringOption(parsed.values.patch)),
        dry_run: parsed.values['dry-run'] === true,
      });
    },
    async execute(input, context) {
      if (!context.backlogRoot) {
        throw context.errors.create('BE_ROOT_NOT_FOUND', undefined, {
          details: {
            command: 'patch-item',
          },
        });
      }

      const [state, sourceRegistry, appliedRegistry, patchInput] = await Promise.all([
        context.ensureMutationState(),
        context.artifacts.readSourceRegistry(context.backlogRoot),
        context.artifacts.readAppliedRegistry(context.backlogRoot),
        readAuthoredJsonFile({
          context,
          commandName: 'patch-item',
          inputPath: input.patch,
          parse: (raw) => PatchItemFileSchema.parse(raw),
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
      if (!('updated' in summary)) {
        throw context.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
          details: {
            command: 'patch-item',
            patch_id: patchInput.value.metadata.patch_id,
          },
          hint: 'patch-item must receive a patch summary with updated item keys.',
        });
      }
      const { state: nextState, ...output } = summary;

      if (input.dry_run) {
        return output;
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
        kind: 'patch-item',
        canonicalPath: canonicalImport.canonicalPath,
        contentHash: canonicalImport.sha256,
        appliedAt,
      });

      await context.artifacts.writeAppliedRegistry(context.backlogRoot, nextAppliedRegistry);
      await context.artifacts.writeState(context.backlogRoot, nextState);
      await context.hooks.afterPatchApplied?.({
        summary: output,
        state: nextState,
        backlogRoot: context.backlogRoot,
      });

      return output;
    },
  };
