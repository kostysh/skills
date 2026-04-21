import { z } from 'zod';

import { ERROR_CODES } from '../errors/error-codes.ts';
import { NonEmptyStringSchema } from './scalars.ts';

export const ErrorCodeSchema = z.enum(ERROR_CODES);

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export const JsonPrimitiveSchema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([JsonPrimitiveSchema, JsonArraySchema, JsonObjectSchema]),
);

export const JsonArraySchema: z.ZodType<JsonArray> = z.lazy(() => z.array(JsonValueSchema));

export const JsonObjectSchema: z.ZodType<JsonObject> = z.lazy(() =>
  z.record(NonEmptyStringSchema, JsonValueSchema),
);

export const ErrorDetailsSchema = JsonObjectSchema;

export const ErrorPayloadSchema = z.strictObject({
  error: z.strictObject({
    code: ErrorCodeSchema,
    message: NonEmptyStringSchema,
    details: ErrorDetailsSchema.optional(),
    hint: NonEmptyStringSchema.optional(),
  }),
});

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;
