export type CliIo = {
  stdout: Pick<NodeJS.WriteStream, 'write'>;
  stderr: Pick<NodeJS.WriteStream, 'write'>;
};

export const CLI_DISPLAY_NAME = 'backlog-engineer';
export const EXIT_SUCCESS = 0;
export const EXIT_USAGE = 64;
export const EXIT_NOT_IMPLEMENTED = 3;

type CommandDefinition = {
  name: string;
  summary: string;
  helpText: () => string;
  execute: (args: string[], io: CliIo) => number | Promise<number>;
};

function writeLine(stream: Pick<NodeJS.WriteStream, 'write'>, line = ''): void {
  stream.write(`${line}\n`);
}

function placeholderHelp(name: string, summary: string): string {
  return [
    `${CLI_DISPLAY_NAME} ${name}`,
    '',
    summary,
    '',
    'Status: scaffolded command, behavior not implemented yet.',
  ].join('\n');
}

function runPlaceholderCommand(commandName: string, io: CliIo, args: string[]): number {
  writeLine(io.stderr, `Command \`${commandName}\` is scaffolded but not implemented yet.`);
  if (args.length > 0) {
    writeLine(io.stderr, `Received args: ${args.join(' ')}`);
  }
  writeLine(io.stderr, 'Use `backlog-engineer help` to inspect the planned command surface.');
  return EXIT_NOT_IMPLEMENTED;
}

function defineCommand(name: string, summary: string): CommandDefinition {
  return {
    name,
    summary,
    helpText: () => placeholderHelp(name, summary),
    execute: (args, io) => runPlaceholderCommand(name, io, args),
  };
}

export const COMMANDS = [
  defineCommand('init', 'Initialize a backlog directory and utility-owned artifacts.'),
  defineCommand('register-source', 'Register a source document and obtain a source ID.'),
  defineCommand('list-sources', 'List registered sources and source metadata.'),
  defineCommand('template', 'Generate packet or patch templates.'),
  defineCommand('packet', 'Apply a packet that adds new backlog tasks.'),
  defineCommand('patch-item', 'Apply a patch that updates existing tasks.'),
  defineCommand('remove-item', 'Apply a patch that removes obsolete tasks.'),
  defineCommand('refresh', 'Refresh source-derived state in full or scoped form.'),
  defineCommand('status', 'Show short backlog status summary.'),
  defineCommand('report', 'Generate a human-readable backlog report on disk.'),
  defineCommand('items', 'Show one or more full task cards by item key.'),
  defineCommand('search', 'Search tasks when keys are not yet known.'),
  defineCommand('gaps', 'List explicit blockers and unresolved gaps.'),
  defineCommand('queue', 'Return ordered chains of tasks that can be taken next.'),
  defineCommand('attention', 'Return tasks that require review or re-checking.'),
  defineCommand('delete-backlog', 'Delete the backlog and its utility-owned artifacts.'),
] as const satisfies readonly CommandDefinition[];

const COMMAND_MAP = new Map(COMMANDS.map((command) => [command.name, command]));

export function findCommand(name: string): CommandDefinition | undefined {
  return COMMAND_MAP.get(name);
}

export async function executeCommand(
  command: CommandDefinition,
  args: string[],
  io: CliIo,
): Promise<number> {
  return await command.execute(args, io);
}

export function globalHelp(): string {
  const lines = [
    `${CLI_DISPLAY_NAME}`,
    '',
    'Scaffolded CLI for the backlog-engineer skill.',
    'The command surface exists, but command behavior is still to be implemented.',
    '',
    'Usage:',
    `  ${CLI_DISPLAY_NAME} <command> [options]`,
    `  ${CLI_DISPLAY_NAME} help [command]`,
    `  ${CLI_DISPLAY_NAME} --version`,
    '',
    'Commands:',
  ];

  for (const command of COMMANDS) {
    lines.push(`  ${command.name.padEnd(16)} ${command.summary}`);
  }

  return lines.join('\n');
}
