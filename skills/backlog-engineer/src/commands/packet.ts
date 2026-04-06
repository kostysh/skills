import {
  PacketCommandInputSchema,
  PacketCommandOutputSchema,
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
    description: 'Path to the authored packet file.',
    required: true,
  },
  {
    flags: ['--dry-run'],
    description: 'Validate and simulate packet application without writing to disk.',
  },
] as const satisfies readonly CommandHelpOption[];

export const PACKET_COMMAND = definePlaceholderCommand({
  name: 'packet',
  summary: 'Apply a packet that adds new backlog tasks.',
  usage: ['backlog-engineer packet --path <path> [--dry-run]'],
  options: OPTIONS,
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
});
