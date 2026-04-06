import { createBacklogError } from '../errors/index.ts';
import type { CommandDefinition } from './types.ts';
import type { CommandName } from '../runtime/shared.ts';

type PlaceholderCommandConfig<TInput, TOutput> = {
  name: CommandName;
  summary: string;
  usage: readonly string[];
  options: CommandDefinition<TInput, TOutput>['options'];
  inputSchema: CommandDefinition<TInput, TOutput>['inputSchema'];
  outputSchema: CommandDefinition<TInput, TOutput>['outputSchema'];
  parseArgs: CommandDefinition<TInput, TOutput>['parseArgs'];
};

function runPlaceholderCommand(commandName: string): never {
  throw createBacklogError({
    code: 'BE_INTERNAL_STATE_CORRUPT',
    message: `Command \`${commandName}\` is not implemented yet.`,
    details: {
      command: commandName,
    },
    hint: 'Continue with the next implementation work package and replace the placeholder handler.',
  });
}

export function definePlaceholderCommand<TInput, TOutput>(
  config: PlaceholderCommandConfig<TInput, TOutput>,
): CommandDefinition<TInput, TOutput> {
  return {
    name: config.name,
    summary: config.summary,
    usage: config.usage,
    options: config.options,
    inputSchema: config.inputSchema,
    outputSchema: config.outputSchema,
    parseArgs: config.parseArgs,
    execute: () => runPlaceholderCommand(config.name),
  };
}
