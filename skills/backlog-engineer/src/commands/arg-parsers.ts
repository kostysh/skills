import { parseArgs, type ParseArgsConfig } from 'node:util';
import type { ZodType } from 'zod';

import { createUsageError } from '../errors/index.ts';
import type { JsonObject } from '../schemas/index.ts';

function helpHint(commandName: string): string {
  return `Run \`backlog-engineer help ${commandName}\` to inspect the command contract.`;
}

function serializeSchemaIssues(error: { issues: unknown }): JsonObject['issues'] {
  return JSON.parse(JSON.stringify(error.issues)) as JsonObject['issues'];
}

export type ParsedCommandArgs = ReturnType<typeof parseArgs>;

export function parseCommandArgs(
  commandName: string,
  args: string[],
  config: {
    options?: ParseArgsConfig['options'];
    allowPositionals?: boolean;
  },
): ParsedCommandArgs {
  try {
    return parseArgs({
      args,
      options: config.options,
      allowPositionals: config.allowPositionals ?? false,
      strict: true,
    });
  } catch (error) {
    throw createUsageError(
      {
        command: commandName,
        argv: args,
        parser_message: error instanceof Error ? error.message : 'Unknown argv parsing failure.',
      },
      helpHint(commandName),
      error,
    );
  }
}

export function assertNoPositionals(commandName: string, positionals: string[]): void {
  if (positionals.length === 0) {
    return;
  }

  throw createUsageError(
    {
      command: commandName,
      unexpected_positionals: positionals,
    },
    helpHint(commandName),
  );
}

export function requireStringOption(
  commandName: string,
  flagName: string,
  value: string | undefined,
): string {
  if (typeof value === 'string') {
    return value;
  }

  throw createUsageError(
    {
      command: commandName,
      missing_option: flagName,
    },
    helpHint(commandName),
  );
}

export function getStringOption(
  value: string | boolean | Array<string | boolean> | undefined,
): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function splitCsvFlag(value: string | undefined): string[] | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function parseBooleanValue(
  commandName: string,
  flagName: string,
  value: string | undefined,
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw createUsageError(
    {
      command: commandName,
      invalid_boolean_flag: flagName,
      received: value,
    },
    `Use \`${flagName} true\` or \`${flagName} false\`. ${helpHint(commandName)}`,
  );
}

export function parseUsageInput<T>(commandName: string, schema: ZodType<T>, candidate: unknown): T {
  const parsed = schema.safeParse(candidate);
  if (parsed.success) {
    return parsed.data;
  }

  throw createUsageError(
    {
      command: commandName,
      issues: serializeSchemaIssues(parsed.error),
    },
    helpHint(commandName),
    parsed.error,
  );
}
