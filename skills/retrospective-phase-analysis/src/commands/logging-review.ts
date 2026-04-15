import { buildScanSummary } from '../core/build-scan-summary.ts';
import { redactScanSummaryForPublicArtifact } from '../core/shared.ts';
import { buildLoggingReviewMarkdown } from '../render/logging-review-markdown.ts';
import {
  COMMON_OPTION_SPECS,
  assertOutputOverrideIsExclusive,
  loadScanSummaryFromRunDir,
  parseOptions,
  resolveCommandOutputPath,
  toCommonCommandInput,
  toOptionalString,
  writeText,
} from './shared.ts';
import type { CommandDefinition, LoggingReviewCommandInput } from './types.ts';

export const LOGGING_REVIEW_COMMAND: CommandDefinition<LoggingReviewCommandInput> = {
  name: 'logging-review',
  summary: 'Generate a logging-quality and improvement draft.',
  usage: [
    'node scripts/retro-cli.mjs logging-review --session <file>',
    'node scripts/retro-cli.mjs logging-review --run-dir <dir>',
    'node scripts/retro-cli.mjs logging-review --logs-dir <dir> --out-root <dir>',
    'node scripts/retro-cli.mjs logging-review --logs-dir <dir> --out <file>',
  ],
  options: [
    ...COMMON_OPTION_SPECS,
    {
      name: 'out',
      type: 'string',
      valueLabel: '<file>',
      description: 'Output Markdown path override.',
    },
  ],
  notes: [
    'Logging review drafts focus on observability quality and follow-up automation ideas.',
    'Without --out, the command writes logging-review.md into the durable run directory selected for this retrospective scope.',
  ],
  parseArgs(argv) {
    const options = parseOptions(argv, this.options);
    const input: LoggingReviewCommandInput = {
      ...toCommonCommandInput(options),
    };
    const out = toOptionalString(options.out);
    if (out) {
      input.out = out;
    }
    assertOutputOverrideIsExclusive(input);
    return input;
  },
  run(input) {
    const scan = input.runDir ? loadScanSummaryFromRunDir(input.runDir) : buildScanSummary(input);
    const outputPath = resolveCommandOutputPath(scan, input, 'logging-review');
    const publicScan = redactScanSummaryForPublicArtifact(scan);
    writeText(outputPath, buildLoggingReviewMarkdown(publicScan));
    return undefined;
  },
};
