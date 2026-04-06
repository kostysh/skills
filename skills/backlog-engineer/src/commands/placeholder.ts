import { EXIT_NOT_IMPLEMENTED } from '../errors/index.ts';
import type { CliIo, CommandDefinition } from './types.ts';

function writeLine(stream: Pick<NodeJS.WriteStream, 'write'>, line = ''): void {
  stream.write(`${line}\n`);
}

function placeholderHelp(name: string, summary: string): string {
  return [
    `backlog-engineer ${name}`,
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

export function definePlaceholderCommand(name: string, summary: string): CommandDefinition {
  return {
    name,
    summary,
    helpText: () => placeholderHelp(name, summary),
    execute: (args, io) => runPlaceholderCommand(name, io, args),
  };
}
