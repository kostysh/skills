import {
  InitCommandInputSchema,
  InitCommandOutputSchema,
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
    description: 'Path to the backlog root directory to initialize.',
    required: true,
  },
] as const satisfies readonly CommandHelpOption[];

export const INIT_COMMAND = definePlaceholderCommand({
  name: 'init',
  summary: 'Initialize a backlog directory and utility-owned artifacts.',
  usage: ['backlog-engineer init --path <path>'],
  options: OPTIONS,
  inputSchema: InitCommandInputSchema,
  outputSchema: InitCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('init', args, {
      options: {
        path: { type: 'string' },
      },
    });
    assertNoPositionals('init', parsed.positionals);

    return parseUsageInput('init', InitCommandInputSchema, {
      path: requireStringOption('init', '--path', getStringOption(parsed.values.path)),
    });
  },
});
