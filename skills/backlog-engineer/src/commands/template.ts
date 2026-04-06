import { createUsageError } from '../errors/index.ts';
import {
  TemplateCommandInputSchema,
  TemplateCommandOutputSchema,
  type CommandHelpOption,
} from '../schemas/index.ts';
import {
  getStringOption,
  parseCommandArgs,
  parseUsageInput,
  requireStringOption,
  splitCsvFlag,
} from './arg-parsers.ts';
import { definePlaceholderCommand } from './placeholder.ts';

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

export const TEMPLATE_COMMAND = definePlaceholderCommand({
  name: 'template',
  summary: 'Generate packet or patch templates.',
  usage: [
    'backlog-engineer template packet --out <path>',
    'backlog-engineer template patch --item-keys <item_key_1>,<item_key_2> --out <path>',
  ],
  options: OPTIONS,
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
});
