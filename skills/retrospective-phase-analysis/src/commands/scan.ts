import { buildScanSummary } from '../core/build-scan-summary.ts';
import { redactScanSummaryForPublicArtifact } from '../core/shared.ts';
import { createUsageError } from '../cli/errors.ts';
import {
  COMMON_OPTION_SPECS,
  assertOutputOverrideIsExclusive,
  parseOptions,
  resolveCommandOutputPath,
  toBoolean,
  toCommonCommandInput,
  toOptionalString,
  toRequiredString,
  toStringList,
  writeJson,
} from './shared.ts';
import type { CommandDefinition, ScanCommandInput } from './types.ts';

function parsePositiveInteger(value: string | undefined, optionName: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw createUsageError(`${optionName} must be a positive integer`);
  }

  return parsed;
}

function parseIsoTimestamp(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    throw createUsageError('--until-ts must be a valid ISO-like timestamp');
  }

  return value;
}

function toScanUsageError(error: unknown): never {
  if (error instanceof Error) {
    const usageMessages = [
      '--until-line',
      '--until-ts',
      'Use either --until-line or --until-ts',
      'Manual artifact overrides require',
    ];
    if (usageMessages.some((message) => error.message.startsWith(message))) {
      throw createUsageError(error.message);
    }
  }

  throw error;
}

export const SCAN_COMMAND: CommandDefinition<ScanCommandInput> = {
  name: 'scan',
  summary: 'Build a JSON summary from a session trace and stage logs.',
  usage: [
    'node scripts/retro-cli.mjs scan --session <file>',
    'node scripts/retro-cli.mjs scan --session <file> --out-root <dir> --pretty',
    'node scripts/retro-cli.mjs scan --session <file> --run-dir <dir> --language ru',
    'node scripts/retro-cli.mjs scan --session <file> --until-ts <iso>',
    'node scripts/retro-cli.mjs scan --session <file> --out <file> --pretty',
  ],
  options: [
    ...COMMON_OPTION_SPECS,
    {
      name: 'out',
      type: 'string',
      valueLabel: '<file>',
      description: 'Output JSON path override.',
    },
    {
      name: 'pretty',
      type: 'boolean',
      description: 'Pretty-print JSON output.',
    },
    {
      name: 'until-line',
      type: 'string',
      valueLabel: '<n>',
      description: 'Analyze only session events at or before this JSONL line.',
    },
    {
      name: 'until-ts',
      type: 'string',
      valueLabel: '<iso>',
      description: 'Analyze only session events at or before this timestamp.',
    },
    {
      name: 'stage-log',
      type: 'string',
      repeatable: true,
      valueLabel: '<path>',
      description: 'Manually include a stage log; requires --artifact-evidence.',
    },
    {
      name: 'review-artifact',
      type: 'string',
      repeatable: true,
      valueLabel: '<path>',
      description: 'Manually include a review artifact; requires --artifact-evidence.',
    },
    {
      name: 'verification-artifact',
      type: 'string',
      repeatable: true,
      valueLabel: '<path>',
      description: 'Manually include a verification artifact; requires --artifact-evidence.',
    },
    {
      name: 'artifact-evidence',
      type: 'string',
      valueLabel: '<text>',
      description: 'Required justification for manual artifact inclusion.',
    },
  ],
  notes: [
    'The agent must resolve the target session and pass the canonical trace file via --session.',
    'The JSON summary is heuristic and should be validated against the cited artifacts.',
    'Use --until-line or --until-ts only when the analyzed phase is a prefix of the trace.',
    'Manual artifact paths are controlled overrides and must include --artifact-evidence.',
    'If logs or artifacts directories are omitted, the command tries standard project directories derived from session_meta.cwd.',
    'Without --out, the command writes to a durable run directory under .dossier/retro when a dossier-managed project root is available.',
  ],
  parseArgs(argv) {
    const options = parseOptions(argv, this.options);
    const input: ScanCommandInput = {
      ...toCommonCommandInput(options),
      session: toRequiredString(options.session, 'scan requires --session'),
      pretty: toBoolean(options.pretty),
    };
    const untilLine = parsePositiveInteger(toOptionalString(options['until-line']), '--until-line');
    const untilTs = parseIsoTimestamp(toOptionalString(options['until-ts']));
    if (untilLine !== undefined && untilTs !== undefined) {
      throw createUsageError('Use either --until-line or --until-ts, not both');
    }
    if (untilLine !== undefined) {
      input.untilLine = untilLine;
    }
    if (untilTs !== undefined) {
      input.untilTs = untilTs;
    }

    const stageLogs = toStringList(options['stage-log']);
    const reviewArtifacts = toStringList(options['review-artifact']);
    const verificationArtifacts = toStringList(options['verification-artifact']);
    const artifactEvidence = toOptionalString(options['artifact-evidence']);
    if (stageLogs.length > 0) {
      input.stageLogs = stageLogs;
    }
    if (reviewArtifacts.length > 0) {
      input.reviewArtifacts = reviewArtifacts;
    }
    if (verificationArtifacts.length > 0) {
      input.verificationArtifacts = verificationArtifacts;
    }
    if (artifactEvidence) {
      input.artifactEvidence = artifactEvidence;
    }
    if (
      (stageLogs.length > 0 || reviewArtifacts.length > 0 || verificationArtifacts.length > 0) &&
      !artifactEvidence
    ) {
      throw createUsageError(
        'Manual artifact overrides require --artifact-evidence with a short justification',
      );
    }

    const out = toOptionalString(options.out);
    if (out) {
      input.out = out;
    }
    assertOutputOverrideIsExclusive(input);
    return input;
  },
  run(input) {
    let summary: ReturnType<typeof buildScanSummary>;
    try {
      summary = buildScanSummary(input);
    } catch (error) {
      toScanUsageError(error);
    }
    const outputPath = resolveCommandOutputPath(summary, input, 'scan');
    const publicSummary = redactScanSummaryForPublicArtifact(summary);
    writeJson(outputPath, publicSummary, input.pretty);
    return JSON.stringify({
      run_dir: summary.run_dir,
      scan_summary: outputPath,
      report_language: summary.report_language,
    });
  },
};
