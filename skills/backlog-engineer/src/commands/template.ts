import { createUsageError } from '../errors/index.ts';
import {
  TemplateCommandInputSchema,
  TemplateCommandOutputSchema,
  type TemplateCommandInput,
  type TemplateCommandOutput,
  type CommandHelpOption,
} from '../schemas/index.ts';
import {
  getStringOption,
  parseCommandArgs,
  parseUsageInput,
  requireStringOption,
  splitCsvFlag,
} from './arg-parsers.ts';
import type { CommandDefinition } from './types.ts';
import { ABSOLUTE_OUTPUT_NOTE } from './help-notes.ts';

const OPTIONS = [
  {
    flags: ['--out'],
    value_name: '<path>',
    description: 'Output path for the generated template file.',
    required: true,
  },
  {
    flags: ['--item-keys'],
    value_name: '<item_key_1>,<item_key_2>',
    description: 'Required for patch templates; comma-separated target item keys.',
  },
] as const satisfies readonly CommandHelpOption[];

function formatPatchSequence(sequence: number): string {
  return String(sequence).padStart(3, '0');
}

function createPatchTemplateId(createdAt: string, sequence: number, suffix: string): string {
  return `${createdAt.slice(0, 10)}-${formatPatchSequence(sequence)}-patch-template-${suffix}`;
}

function createDraftSuffix(uuid: string): string {
  return uuid.replaceAll('-', '').slice(0, 8).toLowerCase();
}

export const TEMPLATE_COMMAND: CommandDefinition<TemplateCommandInput, TemplateCommandOutput> = {
  name: 'template',
  summary: 'Generate packet or patch templates.',
  usage: [
    'backlog-engineer template packet --out <path>',
    'backlog-engineer template patch --item-keys <item_key_1>,<item_key_2> --out <path>',
  ],
  options: OPTIONS,
  notes: [
    '`template packet` writes a draft skeleton and does not require an existing backlog root.',
    '`template patch` is backlog-scoped: run it from a backlog root or one of its child directories discovered through `.backlog.json`.',
    '`--out` resolves from the current working directory.',
    ABSOLUTE_OUTPUT_NOTE,
  ],
  inputSchema: TemplateCommandInputSchema,
  outputSchema: TemplateCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('template', args, {
      allowPositionals: true,
      options: {
        out: { type: 'string' },
        'item-keys': { type: 'string' },
      },
    });

    if (parsed.positionals.length !== 1) {
      throw createUsageError(
        {
          command: 'template',
          expected_positionals: ['packet|patch'],
          received_positionals: parsed.positionals,
        },
        'Run `backlog-engineer help template` to inspect the command contract.',
      );
    }

    const [mode] = parsed.positionals;
    if (mode === 'packet') {
      return parseUsageInput('template', TemplateCommandInputSchema, {
        mode,
        out: requireStringOption('template', '--out', getStringOption(parsed.values.out)),
      });
    }

    if (mode === 'patch') {
      return parseUsageInput('template', TemplateCommandInputSchema, {
        mode,
        out: requireStringOption('template', '--out', getStringOption(parsed.values.out)),
        item_keys: splitCsvFlag(getStringOption(parsed.values['item-keys'])),
      });
    }

    throw createUsageError(
      {
        command: 'template',
        invalid_mode: mode ?? null,
      },
      'Use `template packet` or `template patch`.',
    );
  },
  async execute(input, context) {
    const cwd = context.host.resolveCliPath('.');

    if (input.mode === 'packet') {
      const outputPath = await context.artifacts.writeTemplateOutput({
        cwd,
        out: input.out,
        defaultBasename: 'packet.template.json',
        content: context.templates.renderPacketTemplate(),
      });

      return context.schemas.parseCommandOutput('template', {
        mode: 'packet',
        output_path: outputPath,
      });
    }

    if (!context.backlogRoot) {
      throw context.errors.create('BE_ROOT_NOT_FOUND');
    }

    const [appliedRegistry, queryState] = await Promise.all([
      context.artifacts.readAppliedRegistry(context.backlogRoot),
      context.ensureQueryState(),
    ]);
    const { state } = queryState;
    const missingItemKeys = input.item_keys.filter(
      (itemKey) => !state.items.some((candidate) => candidate.item_key === itemKey),
    );
    if (missingItemKeys.length > 0) {
      throw context.errors.create('BE_ITEM_NOT_FOUND', undefined, {
        details: {
          item_keys: missingItemKeys,
        },
      });
    }

    const nextSequence =
      appliedRegistry.patches.reduce((maxSequence, patch) => {
        return Math.max(maxSequence, patch.sequence);
      }, 0) + 1;
    const createdAt = context.host.nowIsoUtc();
    const draftSuffix = createDraftSuffix(context.host.createUuid());
    const outputPath = await context.artifacts.writeTemplateOutput({
      cwd,
      out: input.out,
      defaultBasename: `${formatPatchSequence(nextSequence)}-patch.template.json`,
      collisionBasename: `${formatPatchSequence(nextSequence)}-${draftSuffix}-patch.template.json`,
      content: context.templates.renderPatchTemplate({
        targetItemKeys: input.item_keys,
        kind: 'patch-item',
        patchId: createPatchTemplateId(createdAt, nextSequence, draftSuffix),
        createdAt,
        sequence: nextSequence,
      }),
    });

    return context.schemas.parseCommandOutput('template', {
      mode: 'patch',
      output_path: outputPath,
    });
  },
};
