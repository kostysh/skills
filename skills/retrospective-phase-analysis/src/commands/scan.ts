import { buildScanSummary } from '../core/build-scan-summary.ts';
import {
  COMMON_OPTION_SPECS,
  parseOptions,
  resolveCommandOutputPath,
  toBoolean,
  toCommonCommandInput,
  toOptionalString,
  toRequiredString,
  writeJson,
} from './shared.ts';
import type { CommandDefinition, ScanCommandInput } from './types.ts';

export const SCAN_COMMAND: CommandDefinition<ScanCommandInput> = {
  name: 'scan',
  summary: 'Build a JSON summary from a session trace and stage logs.',
  usage: [
    'node scripts/retro-cli.mjs scan --session <file>',
    'node scripts/retro-cli.mjs scan --session <file> --out-root <dir> --pretty',
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
  ],
  notes: [
    'The agent must resolve the target session and pass the canonical trace file via --session.',
    'The JSON summary is heuristic and should be validated against the cited artifacts.',
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
    const out = toOptionalString(options.out);
    if (out) {
      input.out = out;
    }
    return input;
  },
  run(input) {
    const summary = buildScanSummary(input);
    const outputPath = resolveCommandOutputPath(summary, input, 'scan');
    writeJson(outputPath, summary, input.pretty);
  },
};
