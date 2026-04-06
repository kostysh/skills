import {
  ReportCommandInputSchema,
  ReportCommandOutputSchema,
  type CommandHelpOption,
} from '../schemas/index.ts';
import { assertNoPositionals, parseCommandArgs, parseUsageInput } from './arg-parsers.ts';
import { definePlaceholderCommand } from './placeholder.ts';

const OPTIONS = [] as const satisfies readonly CommandHelpOption[];

export const REPORT_COMMAND = definePlaceholderCommand({
  name: 'report',
  summary: 'Generate a human-readable backlog report on disk.',
  usage: ['backlog-engineer report'],
  options: OPTIONS,
  inputSchema: ReportCommandInputSchema,
  outputSchema: ReportCommandOutputSchema,
  parseArgs(args) {
    const parsed = parseCommandArgs('report', args, {});
    assertNoPositionals('report', parsed.positionals);

    return parseUsageInput('report', ReportCommandInputSchema, {});
  },
});
