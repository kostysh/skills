import {
  LOGGING_REVIEW_COMMAND,
  PROBLEM_MATRIX_COMMAND,
  REPORT_COMMAND,
  SCAN_COMMAND,
  SKILL_AUDIT_COMMAND,
  VALIDATE_COMMAND,
} from '../commands/index.ts';
import { optionToHelpLine } from '../commands/shared.ts';
import type { AnyCommandDefinition } from '../commands/types.ts';

export const CLI_DISPLAY_NAME = 'node scripts/retro-cli.mjs';

export const COMMANDS = [
  SCAN_COMMAND,
  REPORT_COMMAND,
  SKILL_AUDIT_COMMAND,
  LOGGING_REVIEW_COMMAND,
  PROBLEM_MATRIX_COMMAND,
  VALIDATE_COMMAND,
] satisfies readonly AnyCommandDefinition[];

const COMMAND_MAP = new Map<string, AnyCommandDefinition>(
  COMMANDS.map((command) => [command.name, command]),
);

export function findCommand(name: string): AnyCommandDefinition | undefined {
  return COMMAND_MAP.get(name);
}

export function buildGlobalHelpOutput(version: string): string {
  const commandLines = COMMANDS.map(
    (command) => `  ${command.name.padEnd(15)}${command.summary}`,
  ).join('\n');

  return `retrospective-phase-analysis CLI (v${version})

Usage:
  ${CLI_DISPLAY_NAME} <command> [options]
  ${CLI_DISPLAY_NAME} help [command]
  ${CLI_DISPLAY_NAME} --help
  ${CLI_DISPLAY_NAME} --version

Commands:
${commandLines}

Notes:
  Generated reports are drafts; validate them against the cited artifacts.
  scan prints the canonical run_dir on stdout; other commands write output files and stay quiet unless help or version is requested.
`;
}

export function buildCommandHelpOutput(command: AnyCommandDefinition): string {
  const optionLines = [
    '  -h, --help'.padEnd(30) + 'Show command help.',
    ...command.options.map((option) => `  ${optionToHelpLine(option)}`),
  ].join('\n');
  const noteLines = command.notes?.map((note) => `  - ${note}`).join('\n') ?? '  - none';

  return `${command.name} - ${command.summary}

Usage:
${command.usage.map((line) => `  ${line}`).join('\n')}

Options:
${optionLines}

Notes:
${noteLines}
`;
}

export function buildVersionOutput(version: string): string {
  return version;
}
