import {
  buildCommandHelpOutput,
  buildGlobalHelpOutput,
  buildVersionOutput,
  findCommand,
} from './command-registry.ts';
import { createUsageError, normalizeCliError } from './errors.ts';
import { parseCliIntent } from './parse-argv.ts';
import type { AnyCommandDefinition } from '../commands/index.ts';

export interface CliIo {
  stdout: Pick<NodeJS.WriteStream, 'write'>;
  stderr: Pick<NodeJS.WriteStream, 'write'>;
}

function commandHelpRequested(args: string[]): boolean {
  return args.includes('--help') || args.includes('-h');
}

function writeLine(stream: Pick<NodeJS.WriteStream, 'write'>, text: string): void {
  stream.write(text.endsWith('\n') ? text : `${text}\n`);
}

export async function runCli(
  argv: string[],
  cliIo: CliIo,
  version: string,
  dependencies: {
    findCommand?: (name: string) => AnyCommandDefinition | undefined;
  } = {},
): Promise<number> {
  try {
    const intent = parseCliIntent(argv);
    const findCommandImpl = dependencies.findCommand ?? findCommand;

    if (intent.kind === 'global_help') {
      writeLine(cliIo.stdout, buildGlobalHelpOutput(version));
      return 0;
    }

    if (intent.kind === 'version') {
      writeLine(cliIo.stdout, buildVersionOutput(version));
      return 0;
    }

    const command = findCommandImpl(intent.commandName);
    if (!command) {
      throw createUsageError(`Unknown command: ${intent.commandName}`);
    }

    if (intent.kind === 'command_help') {
      writeLine(cliIo.stdout, buildCommandHelpOutput(command));
      return 0;
    }

    if (commandHelpRequested(intent.args)) {
      writeLine(cliIo.stdout, buildCommandHelpOutput(command));
      return 0;
    }

    const input = command.parseArgs(intent.args);
    await command.run(input);
    return 0;
  } catch (error) {
    const normalized = normalizeCliError(error);
    writeLine(cliIo.stderr, normalized.message);
    return normalized.exitCode;
  }
}
