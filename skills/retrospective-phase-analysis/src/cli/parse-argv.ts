import { createUsageError } from './errors.ts';

export type CliIntent =
  | { kind: 'global_help' }
  | { kind: 'version' }
  | { kind: 'command_help'; commandName: string }
  | { kind: 'command_run'; commandName: string; args: string[] };

function usageHint(): string {
  return 'Run `node scripts/retro-cli.mjs --help` to inspect the available command surface.';
}

function assertNoExtraGlobalArgs(argv: string[], intent: 'global_help' | 'version'): void {
  if (argv.length === 1) {
    return;
  }

  throw createUsageError(
    `Unexpected extra arguments after ${
      intent === 'version' ? '--version' : '--help'
    }: ${argv.slice(1).join(' ')}`,
  );
}

export function parseCliIntent(argv: string[]): CliIntent {
  const [first, ...rest] = argv;

  if (!first) {
    return { kind: 'global_help' };
  }

  if (first === '--help' || first === '-h') {
    assertNoExtraGlobalArgs(argv, 'global_help');
    return { kind: 'global_help' };
  }

  if (first === '--version') {
    assertNoExtraGlobalArgs(argv, 'version');
    return { kind: 'version' };
  }

  if (first === 'help') {
    if (rest.length === 0) {
      return { kind: 'global_help' };
    }

    if (rest.length === 1) {
      const [commandName] = rest;
      if (!commandName) {
        throw createUsageError('help requires a command name');
      }
      return { kind: 'command_help', commandName };
    }

    throw createUsageError(`Unexpected extra arguments after help: ${rest.slice(1).join(' ')}`);
  }

  if (first.startsWith('-')) {
    throw createUsageError(`Unknown global option: ${first}. ${usageHint()}`);
  }

  return {
    kind: 'command_run',
    commandName: first,
    args: rest,
  };
}
