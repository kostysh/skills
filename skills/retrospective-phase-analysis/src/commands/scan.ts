import { buildScanSummary } from '../core/build-scan-summary.ts';
import {
  COMMON_OPTION_SPECS,
  parseOptions,
  toBoolean,
  toCommonCommandInput,
  toRequiredString,
  writeJson,
} from './shared.ts';
import type { CommandDefinition, ScanCommandInput } from './types.ts';

export const SCAN_COMMAND: CommandDefinition<ScanCommandInput> = {
  name: 'scan',
  summary: 'Build a JSON summary from a session trace, session id, and stage logs.',
  usage: [
    'node scripts/retro-cli.mjs scan --session <file> --logs-dir <dir> --out <file>',
    'node scripts/retro-cli.mjs scan --session-id <id> --out <file>',
    'node scripts/retro-cli.mjs scan --logs-dir <dir> --artifacts-dir <dir> --out <file> --pretty',
  ],
  options: [
    ...COMMON_OPTION_SPECS,
    {
      name: 'out',
      type: 'string',
      valueLabel: '<file>',
      description: 'Output JSON path.',
      required: true,
    },
    {
      name: 'pretty',
      type: 'boolean',
      description: 'Pretty-print JSON output.',
    },
  ],
  notes: [
    'The JSON summary is heuristic and should be validated against the cited artifacts.',
    'When --session-id is provided, the command resolves the rollout JSONL trace beneath $CODEX_HOME/sessions or ~/.codex/sessions.',
    'If logs or artifacts directories are omitted, the command tries standard project directories derived from session_meta.cwd.',
  ],
  parseArgs(argv) {
    const options = parseOptions(argv, this.options);
    return {
      ...toCommonCommandInput(options),
      out: toRequiredString(options.out, 'scan requires --out'),
      pretty: toBoolean(options.pretty),
    };
  },
  run(input) {
    writeJson(input.out, buildScanSummary(input), input.pretty);
  },
};
