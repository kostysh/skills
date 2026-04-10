import {
  PacketCommandInputSchema,
  PacketCommandOutputSchema,
  type CommandHelpOption,
  type PacketCommandInput,
  type PacketCommandOutput,
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
  appendAppliedPacketEntry,
  assertCanonicalReplayMatchesState,
  readAuthoredJsonFile,
} from './mutation-helpers.ts';
import {
  ABSOLUTE_OUTPUT_NOTE,
  BACKLOG_MUTATION_SCOPE_NOTE,
  SERIAL_MUTATION_NOTE,
} from './help-notes.ts';
import path from 'node:path';

const OPTIONS = [
  {
    flags: ['--path'],
    value_name: '<path>',
    description: 'Path to the authored packet file.',
    required: true,
  },
  {
    flags: ['--dry-run'],
    description: 'Validate and simulate packet application without writing to disk.',
  },
] as const satisfies readonly CommandHelpOption[];

export const PACKET_COMMAND: CommandDefinition<PacketCommandInput, PacketCommandOutput> = {
  name: 'packet',
  summary: 'Apply a packet that adds new backlog tasks.',
  usage: ['backlog-engineer packet --path <path> [--dry-run]'],
  options: OPTIONS,
  notes: [
    BACKLOG_MUTATION_SCOPE_NOTE,
    '`--path` resolves from the current working directory.',
    '`--dry-run` validates and simulates packet apply without writing canonical imports or backlog state.',
    'On real apply, output distinguishes the authored draft from the immutable canonical import copy.',
    SERIAL_MUTATION_NOTE,
    ABSOLUTE_OUTPUT_NOTE,
  ],
  inputSchema: PacketCommandInputSchema,
  outputSchema: PacketCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('packet', args, {
      options: {
        path: { type: 'string' },
        'dry-run': { type: 'boolean' },
      },
    });
    assertNoPositionals('packet', parsed.positionals);

    return parseUsageInput('packet', PacketCommandInputSchema, {
      path: requireStringOption('packet', '--path', getStringOption(parsed.values.path)),
      dry_run: parsed.values['dry-run'] === true,
    });
  },
  async execute(input, context) {
    if (!context.backlogRoot) {
      throw context.errors.create('BE_ROOT_NOT_FOUND', undefined, {
        details: {
          command: 'packet',
        },
      });
    }

    const [state, sourceRegistry, appliedRegistry, packetInput] = await Promise.all([
      context.ensureMutationState(),
      context.artifacts.readSourceRegistry(context.backlogRoot),
      context.artifacts.readAppliedRegistry(context.backlogRoot),
      readAuthoredJsonFile({
        context,
        commandName: 'packet',
        inputPath: input.path,
        parse: (raw) => context.schemas.parsePacketFile(raw),
      }),
    ]);

    const packetId = context.host.createUuid();
    const summary = await context.core.mutation.applyPacket({
      state,
      packet: packetInput.value,
      sourceRegistry,
      packetId,
      dryRun: input.dry_run,
    });
    const { state: nextState, ...summaryOutput } = summary;
    const outputBase = {
      ...summaryOutput,
      authored_packet_path: packetInput.absolutePath,
    };

    if (input.dry_run) {
      return outputBase;
    }

    const appliedAt = context.host.nowIsoUtc();
    const canonicalImport = await context.artifacts.importPacketFile({
      root: context.backlogRoot,
      packetId,
      sourcePath: packetInput.absolutePath,
      canonicalBasename: packetInput.canonicalBasename,
      rawContent: packetInput.rawContent,
    });
    const nextAppliedRegistry = appendAppliedPacketEntry({
      schemas: context.schemas,
      registry: appliedRegistry,
      packetId,
      canonicalPath: canonicalImport.canonicalPath,
      contentHash: canonicalImport.sha256,
      appliedAt,
      itemKeys: packetInput.value.items.map((item) => item.item_key),
    });

    await context.artifacts.writeAppliedRegistry(context.backlogRoot, nextAppliedRegistry);
    await context.artifacts.writeState(context.backlogRoot, nextState);
    await assertCanonicalReplayMatchesState({
      artifactKind: 'packet',
      canonicalPath: canonicalImport.canonicalPath,
      commandName: 'packet',
      context,
      state: nextState,
    });
    const output = {
      ...outputBase,
      canonical_packet_path: path.resolve(context.backlogRoot, canonicalImport.canonicalPath),
      canonical_packet_purpose: 'immutable_import_copy' as const,
    };
    await context.hooks.afterPacketApplied?.({
      summary: output,
      state: nextState,
      backlogRoot: context.backlogRoot,
    });

    return output;
  },
};
