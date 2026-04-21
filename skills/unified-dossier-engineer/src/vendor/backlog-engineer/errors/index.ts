import { type BacklogError, isBacklogError } from './backlog-error.ts';
import type { ErrorCode } from './error-codes.ts';
import { createBacklogError, normalizeError } from './factories.ts';
import type { ErrorPayload, JsonObject } from '../schemas/index.ts';

export interface ErrorModule {
  create(
    code: ErrorCode,
    message?: string,
    options?: {
      details?: JsonObject;
      hint?: string;
      cause?: unknown;
    },
  ): BacklogError;
  isBacklogError(value: unknown): value is BacklogError;
  toPayload(error: unknown): ErrorPayload;
  toExitCode(error: unknown): number;
}

export function createErrorModule(): ErrorModule {
  return {
    create(code, message, options) {
      return createBacklogError({
        code,
        ...(message ? { message } : {}),
        ...(options?.details ? { details: options.details } : {}),
        ...(options?.hint ? { hint: options.hint } : {}),
        ...(options?.cause ? { cause: options.cause } : {}),
      });
    },
    isBacklogError,
    toPayload(error) {
      return normalizeError(error).toPayload();
    },
    toExitCode(error) {
      return normalizeError(error).exitCode;
    },
  };
}

export { EXIT_SUCCESS, EXIT_USAGE } from './exit-codes.ts';
export { BacklogError, isBacklogError, type BacklogErrorOptions } from './backlog-error.ts';
export {
  ERROR_CODES,
  ERROR_DEFAULT_MESSAGES,
  ERROR_EXIT_CODES,
  INTERNAL_ERROR_CODES,
  type ErrorCode,
} from './error-codes.ts';
export {
  createBacklogError,
  createInvalidJsonError,
  createSchemaInvalidError,
  createUsageError,
  fromZodError,
  getExitCodeForErrorCode,
  normalizeError,
} from './factories.ts';
