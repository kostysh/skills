import {
  CLI_DISPLAY_NAME,
  buildCommandHelpOutput,
  buildGlobalHelpOutput,
  buildVersionOutput,
  findCommand,
} from './command-registry.ts';
import { parseCliIntent } from './parse-argv.ts';
import {
  createUsageError,
  normalizeError,
  type BacklogError,
  EXIT_SUCCESS,
} from '../errors/index.ts';
import type { AnyCommandDefinition, CliIo } from '../commands/index.ts';
import { createRuntime, type RuntimeModule } from '../runtime/index.ts';

type RunCliDependencies = {
  findCommand?: (name: string) => AnyCommandDefinition | undefined;
  createRuntime?: () => RuntimeModule;
  getCwd?: () => string;
};

function shouldAcquireMutationLock(commandName: string, input: unknown): boolean {
  switch (commandName) {
    case 'register-source':
    case 'packet':
    case 'patch-item':
    case 'remove-item':
    case 'refresh':
    case 'report':
    case 'delete-backlog':
      return true;
    case 'status':
      return (
        typeof input === 'object' &&
        input !== null &&
        'refresh' in input &&
        (input as { refresh?: unknown }).refresh === true
      );
    default:
      return false;
  }
}

function commandHelpRequested(args: string[]): boolean {
  return args.includes('--help') || args.includes('-h');
}

function writeJson(stream: Pick<NodeJS.WriteStream, 'write'>, payload: unknown): void {
  stream.write(`${JSON.stringify(payload)}\n`);
}

function usageHint(): string {
  return `Run \`${CLI_DISPLAY_NAME} --help\` to inspect the available command surface.`;
}

function writeErrorPayload(cliIo: CliIo, error: BacklogError): number {
  writeJson(cliIo.stderr, error.toPayload());
  return error.exitCode;
}

export async function runCli(
  argv: string[],
  cliIo: CliIo,
  version: string,
  dependencies: RunCliDependencies = {},
): Promise<number> {
  try {
    const intent = parseCliIntent(argv);
    const findCommandImpl = dependencies.findCommand ?? findCommand;
    const createRuntimeImpl = dependencies.createRuntime ?? createRuntime;

    if (intent.kind === 'global_help') {
      writeJson(cliIo.stdout, buildGlobalHelpOutput(version));
      return EXIT_SUCCESS;
    }

    if (intent.kind === 'version') {
      writeJson(cliIo.stdout, buildVersionOutput(version));
      return EXIT_SUCCESS;
    }

    const commandName = intent.commandName;
    const command = findCommandImpl(commandName);
    if (!command) {
      throw createUsageError(
        {
          reason: 'unknown_command',
          command: commandName,
        },
        usageHint(),
      );
    }

    if (intent.kind === 'command_help') {
      writeJson(cliIo.stdout, buildCommandHelpOutput(command, version));
      return EXIT_SUCCESS;
    }

    if (commandHelpRequested(intent.args)) {
      writeJson(cliIo.stdout, buildCommandHelpOutput(command, version));
      return EXIT_SUCCESS;
    }

    const input = command.parseArgs(intent.args);
    const runtime = createRuntimeImpl();
    const commandCwd = dependencies.getCwd ? dependencies.getCwd() : runtime.getProcessCwd();
    const context = await runtime.createContext(command.name, commandCwd);
    const releaseMutationLock =
      context.backlogRoot && shouldAcquireMutationLock(command.name, input)
        ? await context.acquireMutationLock(command.name)
        : undefined;
    try {
      await context.hooks.beforeCommand?.({
        command: command.name,
        input,
        ...(context.backlogRoot ? { backlogRoot: context.backlogRoot } : {}),
      });

      const output = await command.execute(input, context);
      const validatedOutput = command.outputSchema.parse(output);
      await context.hooks.afterCommand?.({
        command: command.name,
        output: validatedOutput,
        ...(context.backlogRoot ? { backlogRoot: context.backlogRoot } : {}),
      });
      writeJson(cliIo.stdout, validatedOutput);
      return EXIT_SUCCESS;
    } finally {
      await releaseMutationLock?.();
    }
  } catch (error) {
    return writeErrorPayload(cliIo, normalizeError(error));
  }
}
