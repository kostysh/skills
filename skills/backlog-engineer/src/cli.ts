import packageJson from '../package.json';
import {
  CLI_DISPLAY_NAME,
  COMMANDS,
  EXIT_SUCCESS,
  EXIT_USAGE,
  type CliIo,
  executeCommand,
  findCommand,
  globalHelp,
} from './commands.js';

const io: CliIo = {
  stdout: process.stdout,
  stderr: process.stderr,
};

function writeLine(stream: Pick<NodeJS.WriteStream, 'write'>, line = ''): void {
  stream.write(`${line}\n`);
}

async function runCli(argv: string[], cliIo: CliIo): Promise<number> {
  const [commandName, ...rest] = argv;

  if (!commandName || commandName === '--help' || commandName === '-h') {
    writeLine(cliIo.stdout, globalHelp());
    return EXIT_SUCCESS;
  }

  if (commandName === '--version') {
    writeLine(cliIo.stdout, packageJson.version);
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

  return executeCommand(command, rest, cliIo);
}

const exitCode = await runCli(process.argv.slice(2), io);
process.exitCode = exitCode;

export { runCli, COMMANDS };
