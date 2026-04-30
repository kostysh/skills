import YAML from 'yaml';

import type { CommandResult } from '../domain.ts';
import { DossierError, UsageError } from '../errors.ts';
import { defaultContext } from '../infra.ts';
import { type ParsedCommand, runCommand } from '../app.ts';

export interface CliIo {
  readonly stdout: Pick<NodeJS.WriteStream, 'write'>;
  readonly stderr: Pick<NodeJS.WriteStream, 'write'>;
}

const TOOL_NAME = 'dossier-engineer';

const write = (stream: Pick<NodeJS.WriteStream, 'write'>, value: string): void => {
  stream.write(`${value}\n`);
};

const COMMANDS = [
  'init --root <path> --project-name "<name>"',
  'status --root <path>',
  'attention --root <path>',
  'queue --root <path> [--area <area>] [--owner <owner>]',
  'next --work <work-id>',
  'lint --root <path> | --path <artifact-path>',
  'source add|list|refresh|impact|review resolve',
  'capability create|claim set|anti-claim add|demo record|check',
  'baseline create|capability add',
  'guardrail add|check|resolve',
  'work create|acceptance add|demo set|anti-claim add|challenge record|support explain|dependency add|dependency remove|blocker add|blocker resolve|risk set|split|retire',
  'stage start|ready|close|reopen|log',
  'verify required|run|record',
  'review required|record',
  'hygiene run',
  'changeset create',
  'report create',
  'retro create',
];

const renderHelp = (version: string, command?: string): string => {
  if (command !== undefined) {
    return [
      `${TOOL_NAME} ${command}`,
      '',
      'Common options:',
      '  --root <path>       Dossier root. Defaults to nearest docs/dossier/project.md.',
      '  --format text|yaml  Output format. Defaults to text.',
      '  --quiet             Suppress summaries, never blockers or next actions.',
      '',
      'Run `dossier-engineer help` for the command family list.',
    ].join('\n');
  }

  return [
    `${TOOL_NAME} CLI v${version}`,
    '',
    'Purpose:',
    '  Manage Markdown/YAML dossier artifacts without JSON canonical state.',
    '',
    'Commands:',
    ...COMMANDS.map((entry) => `  ${entry}`),
    '',
    'Common options:',
    '  --root <path>       Dossier root.',
    '  --format text|yaml  Machine-readable YAML output.',
    '  --quiet             Keep blockers and next actions visible.',
    '',
    'Exit codes:',
    '  0 success, no blockers',
    '  1 invalid command, args, filesystem, or parser error',
    '  2 protocol validation blocked the action',
    '  3 lint found errors',
    '  4 external verification command failed',
    '  5 dossier root not found or unsupported layout',
  ].join('\n');
};

const parse = (args: readonly string[]): ParsedCommand => {
  const words: string[] = [];
  const positionals: string[] = [];
  const options: Record<string, string | boolean | string[]> = {};

  const commandLimit =
    args[0] === 'source' && args[1] === 'review'
      ? 3
      : args[0] === 'capability' && ['claim', 'anti-claim', 'demo'].includes(String(args[1]))
        ? 3
        : args[0] === 'baseline' && args[1] === 'capability'
          ? 3
          : args[0] === 'work' &&
              [
                'acceptance',
                'demo',
                'anti-claim',
                'challenge',
                'support',
                'dependency',
                'blocker',
                'risk',
              ].includes(String(args[1]))
            ? 3
            : 2;

  let index = 0;
  while (index < args.length) {
    const token = args[index];
    if (token === undefined) break;
    if (token.startsWith('--')) {
      const name = token.slice(2);
      const next = args[index + 1];
      let parsed: string | boolean = true;
      if (next !== undefined && !next.startsWith('--')) {
        parsed = next;
        index += 1;
      }
      const existing = options[name];
      if (existing === undefined) {
        options[name] = parsed;
      } else if (Array.isArray(existing)) {
        options[name] = [...existing, String(parsed)];
      } else {
        options[name] = [String(existing), String(parsed)];
      }
    } else if (words.length < commandLimit) {
      words.push(token);
    } else {
      positionals.push(token);
    }
    index += 1;
  }

  if (words.length === 0) {
    words.push('help');
  }

  return { words, options, positionals, raw: [TOOL_NAME, ...args].join(' ') };
};

const outputFormat = (command: ParsedCommand): 'text' | 'yaml' => {
  const raw = command.options.format;
  if (raw === undefined || raw === 'text') return 'text';
  if (raw === 'yaml') return 'yaml';
  throw new UsageError('Invalid --format. Expected text or yaml.');
};

const quiet = (command: ParsedCommand): boolean => command.options.quiet === true;

const renderText = (result: CommandResult, compact: boolean): string => {
  const lines: string[] = [];
  lines.push(`Result: ${result.result}`);
  lines.push(`Command: ${result.command}`);
  if (!compact && result.summary !== undefined && result.summary.length > 0) {
    lines.push('Summary:');
    lines.push(...result.summary.map((entry) => `- ${entry}`));
  }
  if (!compact && result.findings !== undefined && result.findings.length > 0) {
    lines.push('Findings:');
    lines.push(...result.findings.map((entry) => `- ${entry}`));
  }
  lines.push('Created artifacts:');
  lines.push(
    ...(result.created_artifacts.length === 0
      ? ['- none']
      : result.created_artifacts.map((entry) => `- ${entry.path}`)),
  );
  lines.push('Changed artifacts:');
  lines.push(
    ...(result.changed_artifacts.length === 0
      ? ['- none']
      : result.changed_artifacts.map((entry) => `- ${entry.path}`)),
  );
  lines.push('Warnings:');
  lines.push(
    ...(result.warnings.length === 0 ? ['- none'] : result.warnings.map((entry) => `- ${entry}`)),
  );
  lines.push('Blockers:');
  lines.push(
    ...(result.blockers.length === 0 ? ['- none'] : result.blockers.map((entry) => `- ${entry}`)),
  );
  lines.push('Next actions:');
  lines.push(
    ...(result.next_actions.length === 0
      ? ['1. none']
      : result.next_actions.map(
          (entry, index) => `${index + 1}. ${entry.command} - ${entry.reason}`,
        )),
  );
  return lines.join('\n');
};

const renderYaml = (result: CommandResult): string =>
  YAML.stringify({
    result: result.result,
    command: result.command.replace(/^dossier-engineer\s*/, ''),
    summary: result.summary ?? [],
    findings: result.findings ?? [],
    created_artifacts: result.created_artifacts,
    changed_artifacts: result.changed_artifacts,
    warnings: result.warnings,
    blockers: result.blockers,
    next_actions: result.next_actions,
  });

export const runCli = async (
  args: readonly string[],
  io: CliIo,
  version: string,
): Promise<number> => {
  try {
    if (args.length === 0 || args[0] === '-h' || args[0] === '--help' || args[0] === 'help') {
      const requested = args[0] === 'help' ? args.slice(1).join(' ') || undefined : undefined;
      write(io.stdout, renderHelp(version, requested));
      return 0;
    }
    if (args[0] === '-v' || args[0] === '--version') {
      write(io.stdout, version);
      return 0;
    }
    const command = parse(args);
    const format = outputFormat(command);
    const commandResult = await runCommand(defaultContext(process.cwd()), command);
    write(
      io.stdout,
      format === 'yaml' ? renderYaml(commandResult) : renderText(commandResult, quiet(command)),
    );
    return (
      commandResult.exitCode ??
      (commandResult.result === 'blocked' ? 2 : commandResult.result === 'failed' ? 1 : 0)
    );
  } catch (error) {
    const exitCode = error instanceof DossierError ? error.exitCode : 1;
    let format: 'text' | 'yaml' = 'text';
    try {
      format = outputFormat(parse(args));
    } catch {
      format = 'text';
    }
    const failure: CommandResult = {
      result: exitCode === 2 ? 'blocked' : 'failed',
      command: [TOOL_NAME, ...args].join(' '),
      created_artifacts: [],
      changed_artifacts: [],
      warnings: [],
      blockers: [error instanceof Error ? error.message : String(error)],
      next_actions: [
        {
          command: 'dossier-engineer help',
          reason: 'Review command usage and required options.',
        },
      ],
      exitCode,
    };
    write(io.stdout, format === 'yaml' ? renderYaml(failure) : renderText(failure, false));
    return exitCode;
  }
};
