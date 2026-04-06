import { CLI_DISPLAY_NAME, findCommand, globalHelp } from './command-registry.ts';
import { executeCommand, type CliIo } from '../commands/index.ts';
import { EXIT_SUCCESS, EXIT_USAGE } from '../errors/index.ts';

function writeLine(stream: Pick<NodeJS.WriteStream, 'write'>, line = ''): void {
  stream.write(`${line}\n`);
}

export async function runCli(argv: string[], cliIo: CliIo, version: string): Promise<number> {
  const [commandName, ...rest] = argv;

  if (!commandName || commandName === '--help' || commandName === '-h') {
    writeLine(cliIo.stdout, globalHelp());
    return EXIT_SUCCESS;
  }

  if (commandName === '--version') {
    writeLine(cliIo.stdout, version);
    return EXIT_SUCCESS;
  }

  if (commandName === 'help') {
    const helpTarget = rest[0];
    if (!helpTarget) {
      writeLine(cliIo.stdout, globalHelp());
      return EXIT_SUCCESS;
    }

    const command = findCommand(helpTarget);
    if (!command) {
      writeLine(cliIo.stderr, `Unknown command: ${helpTarget}`);
      writeLine(cliIo.stderr, globalHelp());
      return EXIT_USAGE;
    }

    writeLine(cliIo.stdout, command.helpText());
    return EXIT_SUCCESS;
  }

  const command = findCommand(commandName);
  if (!command) {
    writeLine(cliIo.stderr, `Unknown command: ${commandName}`);
    writeLine(cliIo.stderr, '');
    writeLine(cliIo.stderr, `Run \`${CLI_DISPLAY_NAME} help\` to list available commands.`);
    return EXIT_USAGE;
  }

  return await executeCommand(command, rest, cliIo);
}
