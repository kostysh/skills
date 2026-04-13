import { buildScanSummary } from '../core/build-scan-summary.ts';
import { buildSkillAuditMarkdown } from '../render/skill-audit-markdown.ts';
import {
  COMMON_OPTION_SPECS,
  parseOptions,
  toCommonCommandInput,
  toRequiredString,
  writeText,
} from './shared.ts';
import type { CommandDefinition, SkillAuditCommandInput } from './types.ts';

export const SKILL_AUDIT_COMMAND: CommandDefinition<SkillAuditCommandInput> = {
  name: 'skill-audit',
  summary: 'Generate a skill-focused Markdown draft.',
  usage: [
    'node scripts/retro-cli.mjs skill-audit --logs-dir <dir> --skills-dir <dir> --out <file>',
  ],
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
  notes: ['Use this draft as a triage aid before editing skill instructions or process policy.'],
  parseArgs(argv) {
    const options = parseOptions(argv, this.options);
    return {
      ...toCommonCommandInput(options),
      out: toRequiredString(options.out, 'skill-audit requires --out'),
    };
  },
  run(input) {
    const scan = buildScanSummary(input);
    writeText(input.out, buildSkillAuditMarkdown(scan));
  },
};
