import { buildScanSummary } from '../core/build-scan-summary.ts';
import { buildSkillAuditMarkdown } from '../render/skill-audit-markdown.ts';
import {
  COMMON_OPTION_SPECS,
  parseOptions,
  resolveCommandOutputPath,
  toCommonCommandInput,
  toOptionalString,
  writeText,
} from './shared.ts';
import type { CommandDefinition, SkillAuditCommandInput } from './types.ts';

export const SKILL_AUDIT_COMMAND: CommandDefinition<SkillAuditCommandInput> = {
  name: 'skill-audit',
  summary: 'Generate a skill-focused Markdown draft.',
  usage: [
    'node scripts/retro-cli.mjs skill-audit --session <file> --skills-dir <dir>',
    'node scripts/retro-cli.mjs skill-audit --skills-dir <dir> --out-root <dir>',
    'node scripts/retro-cli.mjs skill-audit --logs-dir <dir> --skills-dir <dir> --out <file>',
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
    'Use this draft as a triage aid before editing skill instructions or process policy.',
    'Without --out, the command writes skill-audit.md into the durable run directory selected for this retrospective scope.',
  ],
  parseArgs(argv) {
    const options = parseOptions(argv, this.options);
    const input: SkillAuditCommandInput = {
      ...toCommonCommandInput(options),
    };
    const out = toOptionalString(options.out);
    if (out) {
      input.out = out;
    }
    return input;
  },
  run(input) {
    const scan = buildScanSummary(input);
    const outputPath = resolveCommandOutputPath(scan, input, 'skill-audit');
    writeText(outputPath, buildSkillAuditMarkdown(scan));
  },
};
