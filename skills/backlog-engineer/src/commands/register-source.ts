import {
  RegisterSourceCommandInputSchema,
  RegisterSourceCommandOutputSchema,
  type CommandHelpOption,
} from '../schemas/index.ts';
import {
  assertNoPositionals,
  getStringOption,
  parseCommandArgs,
  parseUsageInput,
  requireStringOption,
} from './arg-parsers.ts';
import { definePlaceholderCommand } from './placeholder.ts';

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

export const REGISTER_SOURCE_COMMAND = definePlaceholderCommand({
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
});
