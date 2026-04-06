import { ZodError } from 'zod';

import type { JsonObject } from '../schemas/index.ts';
import { BacklogError, type BacklogErrorOptions, isBacklogError } from './backlog-error.ts';
import { type ErrorCode, ERROR_EXIT_CODES } from './error-codes.ts';

export function createBacklogError(options: BacklogErrorOptions): BacklogError {
  return new BacklogError(options);
}

export function createInvalidJsonError(details?: JsonObject, cause?: unknown): BacklogError {
  return createBacklogError({
    code: 'BE_INVALID_JSON',
    hint: 'Fix the JSON syntax and retry the command.',
    ...(details ? { details } : {}),
    ...(cause ? { cause } : {}),
  });
}

export function createUsageError(
  details?: JsonObject,
  hint?: string,
  cause?: unknown,
): BacklogError {
  return createBacklogError({
    code: 'BE_USAGE_INVALID',
    ...(hint ? { hint } : {}),
    ...(details ? { details } : {}),
    ...(cause ? { cause } : {}),
  });
}

export function createSchemaInvalidError(details?: JsonObject, cause?: unknown): BacklogError {
  return createBacklogError({
    code: 'BE_SCHEMA_INVALID',
    hint: 'Fix the input shape so it matches the documented schema.',
    ...(details ? { details } : {}),
    ...(cause ? { cause } : {}),
  });
}

export function fromZodError(error: ZodError, details?: JsonObject): BacklogError {
  const serializableIssues = JSON.parse(JSON.stringify(error.issues)) as JsonObject['issues'];

  return createSchemaInvalidError(
    {
      issues: serializableIssues,
      ...(details ?? {}),
    },
    error,
  );
}

export function normalizeError(error: unknown): BacklogError {
  if (isBacklogError(error)) {
    return error;
  }

  if (error instanceof ZodError) {
    return fromZodError(error);
  }

  return createBacklogError({
    code: 'BE_INTERNAL_STATE_CORRUPT',
    ...(error instanceof Error ? { details: { cause_name: error.name } } : {}),
    ...(error ? { cause: error } : {}),
  });
}

export function getExitCodeForErrorCode(code: ErrorCode): number {
  return ERROR_EXIT_CODES[code];
}
