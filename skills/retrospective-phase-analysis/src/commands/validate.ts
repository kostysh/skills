import fs from 'node:fs';
import path from 'node:path';

import { createUsageError } from '../cli/errors.ts';
import { redactScanSummaryForPublicArtifact } from '../core/shared.ts';
import {
  loadScanSummaryFromRunDir,
  parseOptions,
  toOptionalString,
  toRequiredString,
  writeJson,
} from './shared.ts';
import type { CommandDefinition, ValidateCommandInput } from './types.ts';

function parseResidualConfidence(value: string): ValidateCommandInput['residualConfidence'] {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  throw createUsageError('--residual-confidence must be one of high, medium, or low');
}

export const VALIDATE_COMMAND: CommandDefinition<ValidateCommandInput> = {
  name: 'validate',
  summary: 'Record agent validation metadata for a retrospective run.',
  usage: [
    'node scripts/retro-cli.mjs validate --run-dir <dir> --validated-scope <text> --residual-confidence <high|medium|low> --validation-notes <text>',
  ],
  options: [
    {
      name: 'run-dir',
      type: 'string',
      valueLabel: '<dir>',
      description: 'Exact canonical retrospective run directory to update.',
      required: true,
    },
    {
      name: 'validated-scope',
      type: 'string',
      valueLabel: '<text>',
      description: 'Evidence scope the agent validated.',
      required: true,
    },
    {
      name: 'residual-confidence',
      type: 'string',
      valueLabel: '<high|medium|low>',
      description: 'Residual confidence after validation.',
      required: true,
    },
    {
      name: 'validation-notes',
      type: 'string',
      valueLabel: '<text>',
      description: 'Agent-authored validation notes.',
      required: true,
    },
    {
      name: 'validated-by',
      type: 'string',
      valueLabel: '<name>',
      description: 'Optional validator identity.',
    },
  ],
  notes: [
    'This command records validation already performed by the agent; it does not validate evidence automatically.',
    'Existing reportStatus reasons are preserved so residual risks remain visible.',
  ],
  parseArgs(argv) {
    const options = parseOptions(argv, this.options);
    const runDir = toRequiredString(options['run-dir'], 'validate requires --run-dir');
    const input: ValidateCommandInput = {
      runDir,
      validatedScope: toRequiredString(
        options['validated-scope'],
        'validate requires --validated-scope',
      ),
      residualConfidence: parseResidualConfidence(
        toRequiredString(options['residual-confidence'], 'validate requires --residual-confidence'),
      ),
      validationNotes: toRequiredString(
        options['validation-notes'],
        'validate requires --validation-notes',
      ),
    };
    const validatedBy = toOptionalString(options['validated-by']);
    if (validatedBy) {
      input.validatedBy = validatedBy;
    }
    return input;
  },
  run(input) {
    const summary = loadScanSummaryFromRunDir(input.runDir);
    const scanSummaryPath = path.join(path.resolve(input.runDir), 'scan-summary.json');
    if (!fs.existsSync(scanSummaryPath)) {
      throw createUsageError(
        `--run-dir requires an existing scan-summary.json: ${scanSummaryPath}`,
      );
    }

    const updated = {
      ...summary,
      validation: {
        ...summary.validation,
        agent_validated: true,
        validated_scope: input.validatedScope,
        residual_confidence: input.residualConfidence,
        validation_notes: input.validationNotes,
        validated_at: new Date().toISOString(),
        validated_by: input.validatedBy ?? null,
      },
    };
    writeJson(scanSummaryPath, redactScanSummaryForPublicArtifact(updated), true);
    return JSON.stringify({
      run_dir: path.resolve(input.runDir),
      scan_summary: scanSummaryPath,
      agent_validated: true,
    });
  },
};
