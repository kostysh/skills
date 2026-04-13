import { buildScanSummary } from '../core/build-scan-summary.ts';
import { buildReportMarkdown } from '../render/report-markdown.ts';
import {
  COMMON_OPTION_SPECS,
  parseOptions,
  toCommonCommandInput,
  toOptionalString,
  toRequiredString,
  writeText,
} from './shared.ts';
import type { CommandDefinition, ReportCommandInput } from './types.ts';

export const REPORT_COMMAND: CommandDefinition<ReportCommandInput> = {
  name: 'report',
  summary: 'Generate a Markdown retrospective draft.',
  usage: [
    'node scripts/retro-cli.mjs report --session <file> --logs-dir <dir> --out <file>',
    'node scripts/retro-cli.mjs report --phase <name> --title <text> --out <file>',
  ],
  options: [
    ...COMMON_OPTION_SPECS,
    {
      name: 'phase',
      type: 'string',
      valueLabel: '<name>',
      description: 'Optional phase label for the report.',
    },
    {
      name: 'title',
      type: 'string',
      valueLabel: '<text>',
      description: 'Title override.',
    },
    {
      name: 'out',
      type: 'string',
      valueLabel: '<file>',
      description: 'Output Markdown path.',
      required: true,
    },
  ],
  notes: [
    'The generated report is a draft; read the cited artifacts before finalizing conclusions.',
  ],
  parseArgs(argv) {
    const options = parseOptions(argv, this.options);
    const input: ReportCommandInput = {
      ...toCommonCommandInput(options),
      out: toRequiredString(options.out, 'report requires --out'),
    };
    const phase = toOptionalString(options.phase);
    const title = toOptionalString(options.title);
    if (phase) {
      input.phase = phase;
    }
    if (title) {
      input.title = title;
    }
    return input;
  },
  run(input) {
    const scan = buildScanSummary(input);
    writeText(input.out, buildReportMarkdown(scan, input));
  },
};
