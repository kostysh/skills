import type { ErrorPayload, JsonObject, JsonValue } from '../schemas/index.ts';
import { ERROR_DEFAULT_MESSAGES, ERROR_EXIT_CODES, type ErrorCode } from './error-codes.ts';

export type BacklogErrorOptions = {
  code: ErrorCode;
  message?: string;
  details?: JsonObject;
  hint?: string;
  cause?: unknown;
};

function isJsonObjectCandidate(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeJsonValue(value: unknown, seen: WeakSet<object>): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') {
    return String(value);
  }

  if (value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    const result: JsonValue[] = [];
    for (const entry of value) {
      result.push(sanitizeJsonValue(entry, seen));
    }
    return result;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (isJsonObjectCandidate(value)) {
    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);

    const result: Record<string, JsonValue> = {};
    for (const [entryKey, entryValue] of Object.entries(value)) {
      result[entryKey] = sanitizeJsonValue(entryValue, seen);
    }

    seen.delete(value);
    return result;
  }

  return '[Unsupported value]';
}

function sanitizeJsonObject(details: unknown): JsonObject | undefined {
  if (!details) {
    return undefined;
  }

  if (!isJsonObjectCandidate(details)) {
    return undefined;
  }

  const sanitized = sanitizeJsonValue(details, new WeakSet());
  if (!sanitized || typeof sanitized !== 'object' || Array.isArray(sanitized)) {
    return undefined;
  }

  return sanitized;
}

export class BacklogError extends Error {
  readonly code: ErrorCode;
  readonly exitCode: number;
  readonly details?: JsonObject;
  readonly hint?: string;

  constructor(options: BacklogErrorOptions) {
    super(options.message ?? ERROR_DEFAULT_MESSAGES[options.code], {
      cause: options.cause,
    });
    this.name = 'BacklogError';
    this.code = options.code;
    this.exitCode = ERROR_EXIT_CODES[options.code];
    const sanitizedDetails = sanitizeJsonObject(options.details);
    if (sanitizedDetails) {
      this.details = sanitizedDetails;
    }
    if (options.hint) {
      this.hint = options.hint;
    }
  }

  toPayload(): ErrorPayload {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
        ...(this.hint ? { hint: this.hint } : {}),
      },
    };
  }
}

export function isBacklogError(value: unknown): value is BacklogError {
  return value instanceof BacklogError;
}
