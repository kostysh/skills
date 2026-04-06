import {
  RegisterSourceCommandInputSchema,
  RegisterSourceCommandOutputSchema,
  type RegisterSourceCommandInput,
  type RegisterSourceCommandOutput,
  type CommandHelpOption,
} from '../schemas/index.ts';
import {
  assertNoPositionals,
  getStringOption,
  parseCommandArgs,
  parseUsageInput,
  requireStringOption,
} from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import { validateSourceAuthority, validateSourceKind } from '../sources/index.ts';

const OPTIONS = [
  {
    flags: ['--path'],
    value_name: '<path>',
    description: 'Path to the source document to register.',
    required: true,
  },
  {
    flags: ['--kind'],
    value_name: '<kind>',
    description: 'Source kind defined by the skill contract.',
    required: true,
  },
  {
    flags: ['--authority'],
    value_name: '<authority>',
    description: 'Source authority defined by the skill contract.',
    required: true,
  },
  {
    flags: ['--note'],
    value_name: '<note>',
    description: 'Readable operator note attached to the source registration.',
  },
] as const satisfies readonly CommandHelpOption[];

export const REGISTER_SOURCE_COMMAND: CommandDefinition<
  RegisterSourceCommandInput,
  RegisterSourceCommandOutput
> = {
  name: 'register-source',
  summary: 'Register a source document and obtain a source ID.',
  usage: [
    'backlog-engineer register-source --path <path> --kind <kind> --authority <authority> [--note <note>]',
  ],
  options: OPTIONS,
  inputSchema: RegisterSourceCommandInputSchema,
  outputSchema: RegisterSourceCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('register-source', args, {
      options: {
        path: { type: 'string' },
        kind: { type: 'string' },
        authority: { type: 'string' },
        note: { type: 'string' },
      },
    });
    assertNoPositionals('register-source', parsed.positionals);

    return parseUsageInput('register-source', RegisterSourceCommandInputSchema, {
      path: requireStringOption('register-source', '--path', getStringOption(parsed.values.path)),
      kind: requireStringOption('register-source', '--kind', getStringOption(parsed.values.kind)),
      authority: requireStringOption(
        'register-source',
        '--authority',
        getStringOption(parsed.values.authority),
      ),
      ...(getStringOption(parsed.values.note) ? { note: getStringOption(parsed.values.note) } : {}),
    });
  },
  async execute(input, context) {
    if (!context.backlogRoot) {
      throw context.errors.create('BE_ROOT_NOT_FOUND');
    }

    validateSourceKind(input.kind, context.errors);
    validateSourceAuthority(input.authority, context.errors);

    const normalizedSource = await context.sources.resolveCliSourcePath({
      backlogRoot: context.backlogRoot,
      inputPath: context.host.resolveCliPath(input.path),
    });
    const existingRegistry = await context.artifacts.readSourceRegistry(context.backlogRoot);
    const existingSource = existingRegistry.sources.find(
      (source) => source.path === normalizedSource.relative_path,
    );

    if (existingSource) {
      return context.schemas.parseCommandOutput('register-source', {
        source_id: existingSource.source_id,
        source_label: existingSource.source_label,
        path: existingSource.path,
        kind: existingSource.kind,
        authority: existingSource.authority,
        ...(existingSource.note ? { note: existingSource.note } : {}),
        hash: existingSource.hash,
      });
    }

    const now = context.host.nowIsoUtc();
    const sourceHash = await context.sources.hashSourceFile(normalizedSource.absolute_path);
    const source = context.sources.buildSourceRecord({
      sourceId: context.host.createUuid(),
      relativePath: normalizedSource.relative_path,
      kind: input.kind,
      authority: input.authority,
      ...(input.note ? { note: input.note } : {}),
      registeredAt: now,
      lastCheckedAt: now,
      sourceHash,
    });
    const { registry, created } = context.sources.registerSource({
      registry: existingRegistry,
      source,
    });

    if (created) {
      await context.artifacts.writeSourceRegistry(context.backlogRoot, registry);
      await context.hooks.afterSourceRegistered?.({
        source,
        backlogRoot: context.backlogRoot,
      });
    }

    return context.schemas.parseCommandOutput('register-source', {
      source_id: source.source_id,
      source_label: source.source_label,
      path: source.path,
      kind: source.kind,
      authority: source.authority,
      ...(source.note ? { note: source.note } : {}),
      hash: source.hash,
    });
  },
};
