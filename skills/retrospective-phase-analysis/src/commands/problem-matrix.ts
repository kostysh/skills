import { buildScanSummary } from '../core/build-scan-summary.ts';
import { redactScanSummaryForPublicArtifact } from '../core/shared.ts';
import { buildProblemMatrixMarkdown } from '../render/problem-matrix-markdown.ts';
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
import type { CommandDefinition, ProblemMatrixCommandInput } from './types.ts';

export const PROBLEM_MATRIX_COMMAND: CommandDefinition<ProblemMatrixCommandInput> = {
  name: 'problem-matrix',
  summary: 'Generate a skill/process problem matrix draft.',
  usage: [
    'node scripts/retro-cli.mjs problem-matrix --run-dir <dir>',
    'node scripts/retro-cli.mjs problem-matrix --session <file> --out-root <dir>',
    'node scripts/retro-cli.mjs problem-matrix --session <file> --out <file>',
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
    'The generated matrix is a draft grouping of reusable skill/process problems.',
    'Without --out, the command writes problem-matrix-by-skill.md into the selected run directory.',
  ],
  parseArgs(argv) {
    const options = parseOptions(argv, this.options);
    const input: ProblemMatrixCommandInput = {
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
    const outputPath = resolveCommandOutputPath(scan, input, 'problem-matrix');
    const publicScan = redactScanSummaryForPublicArtifact(scan);
    writeText(outputPath, buildProblemMatrixMarkdown(publicScan));
    return undefined;
  },
};
