import { createUsageError } from '../errors/index.ts';

export type CliIntent =
  | { kind: 'global_help' }
  | { kind: 'version' }
  | { kind: 'command_help'; commandName: string }
  | { kind: 'command_run'; commandName: string; args: string[] };

function usageHint(): string {
  return 'Run `backlog-engineer --help` to inspect the available command surface.';
}

function assertNoExtraGlobalArgs(argv: string[], intent: 'global_help' | 'version'): void {
  if (argv.length === 1) {
    return;
  }

  throw createUsageError(
    {
      command: intent === 'version' ? '--version' : '--help',
      unexpected_argv: argv.slice(1),
    },
    usageHint(),
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
        throw createUsageError(
          {
            command: 'help',
          },
          usageHint(),
        );
      }

      return { kind: 'command_help', commandName };
    }

    throw createUsageError(
      {
        command: 'help',
        unexpected_argv: rest.slice(1),
      },
      usageHint(),
    );
  }

  if (first.startsWith('-')) {
    throw createUsageError(
      {
        reason: 'unknown_global_flag',
        flag: first,
      },
      usageHint(),
    );
  }

  return {
    kind: 'command_run',
    commandName: first,
    args: rest,
  };
}
