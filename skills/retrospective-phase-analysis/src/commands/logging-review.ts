import { buildScanSummary } from '../core/build-scan-summary.ts';
import { buildLoggingReviewMarkdown } from '../render/logging-review-markdown.ts';
import {
  COMMON_OPTION_SPECS,
  parseOptions,
  toCommonCommandInput,
  toRequiredString,
  writeText,
} from './shared.ts';
import type { CommandDefinition, LoggingReviewCommandInput } from './types.ts';

export const LOGGING_REVIEW_COMMAND: CommandDefinition<LoggingReviewCommandInput> = {
  name: 'logging-review',
  summary: 'Generate a logging-quality and improvement draft.',
  usage: ['node scripts/retro-cli.mjs logging-review --logs-dir <dir> --out <file>'],
  options: [
    ...COMMON_OPTION_SPECS,
    {
      name: 'out',
      type: 'string',
      valueLabel: '<file>',
      description: 'Output Markdown path.',
      required: true,
    },
  ],
  notes: ['Logging review drafts focus on observability quality and follow-up automation ideas.'],
  parseArgs(argv) {
    const options = parseOptions(argv, this.options);
    return {
      ...toCommonCommandInput(options),
      out: toRequiredString(options.out, 'logging-review requires --out'),
    };
  },
  run(input) {
    const scan = buildScanSummary(input);
    writeText(input.out, buildLoggingReviewMarkdown(scan));
  },
};
