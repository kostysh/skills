import {
  InitCommandInputSchema,
  InitCommandOutputSchema,
  type CommandHelpOption,
  type InitCommandInput,
  type InitCommandOutput,
} from '../schemas/index.ts';
import {
  assertNoPositionals,
  getStringOption,
  parseCommandArgs,
  parseUsageInput,
  requireStringOption,
} from './arg-parsers.ts';
import { ABSOLUTE_OUTPUT_NOTE } from './help-notes.ts';
import type { CommandDefinition } from './types.ts';

const OPTIONS = [
  {
    flags: ['--path'],
    value_name: '<path>',
    description: 'Path to the backlog root directory to initialize.',
    required: true,
  },
] as const satisfies readonly CommandHelpOption[];

export const INIT_COMMAND: CommandDefinition<InitCommandInput, InitCommandOutput> = {
  name: 'init',
  summary: 'Initialize a backlog directory and utility-owned artifacts.',
  usage: ['backlog-engineer init --path <path>'],
  options: OPTIONS,
  notes: [
    '`--path` resolves from the current working directory.',
    'The target directory becomes a backlog root and receives `.backlog.json`, `.backlog/`, `AGENTS.md`, and standard artifact directories.',
    ABSOLUTE_OUTPUT_NOTE,
  ],
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
  async execute(input, context) {
    const root = context.host.resolveCliPath(input.path);
    const createdAt = context.host.nowIsoUtc();
    const agentsContent = context.templates.renderBacklogAgentsTemplate();

    return context.artifacts.initializeBacklogRoot({
      root,
      createdAt,
      agentsContent,
    });
  },
};
