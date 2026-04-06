import type { ZodType } from 'zod';

import type { CommandHelpOption } from '../schemas/index.ts';
import type { CommandExecutionContext } from '../runtime/command-context.ts';
import type { CommandName } from '../runtime/shared.ts';

export type CliIo = {
  stdout: Pick<NodeJS.WriteStream, 'write'>;
  stderr: Pick<NodeJS.WriteStream, 'write'>;
};

export type { CommandExecutionContext };

export type CommandDefinition<TInput = unknown, TOutput = unknown> = {
  name: CommandName;
  summary: string;
  usage: readonly string[];
  options: readonly CommandHelpOption[];
  inputSchema: ZodType<TInput>;
  outputSchema: ZodType<TOutput>;
  parseArgs: (args: string[]) => TInput;
  execute: (input: TInput, context: CommandExecutionContext) => Promise<TOutput> | TOutput;
};

export type AnyCommandDefinition = CommandDefinition<unknown, unknown>;
