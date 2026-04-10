import path from 'node:path';

import { z } from 'zod';

export function uniqueArraySchema<T extends z.ZodTypeAny>(
  itemSchema: T,
  getKey: (value: z.infer<T>) => string,
  issueMessage: string,
) {
  return z.array(itemSchema).superRefine((items, ctx) => {
    const seen = new Map<string, number>();

    for (const [index, item] of items.entries()) {
      const key = getKey(item);
      const duplicateIndex = seen.get(key);

      if (duplicateIndex !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issueMessage,
          path: [index],
        });
        continue;
      }

      seen.set(key, index);
    }
  });
}

export function nonEmptyObjectSchema<T extends z.ZodRawShape>(shape: T) {
  return z
    .strictObject(shape)
    .partial()
    .superRefine((value, ctx) => {
      if (Object.keys(value).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Object must contain at least one field.',
        });
      }
    });
}

export const NonEmptyStringSchema = z.string().trim().min(1);
export const ItemKeySchema = NonEmptyStringSchema;
export const ClaimKeySchema = NonEmptyStringSchema;
export const ContractKeySchema = NonEmptyStringSchema;
export const DataDomainKeySchema = NonEmptyStringSchema;
export const QualityAttributeKeySchema = NonEmptyStringSchema;
export const PolicyDecisionKeySchema = NonEmptyStringSchema;
export const SourceIdSchema = z.string().uuid();
export const TodoIdSchema = z.string().uuid();
export const PacketIdSchema = z.string().uuid();
export const PatchIdSchema = NonEmptyStringSchema;
export const SourceLabelSchema = NonEmptyStringSchema;
export const CliPathInputSchema = NonEmptyStringSchema.superRefine((value, ctx) => {
  if (value.includes('\0')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Path input must not contain NUL bytes.',
    });
  }
});
export const NormalizedFsPathSchema = NonEmptyStringSchema.superRefine((value, ctx) => {
  if (value.includes('\0')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Filesystem path must not contain NUL bytes.',
    });
  }

  if (!path.isAbsolute(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Normalized filesystem path must be absolute.',
    });
  }

  if (path.normalize(value) !== value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Filesystem path must already be normalized.',
    });
  }
});
function validateRelativePosixPath(
  value: string,
  ctx: z.RefinementCtx,
  options: {
    label: string;
    allowParentSegments: boolean;
  },
) {
  if (value.includes('\0')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${options.label} must not contain NUL bytes.`,
    });
  }

  if (value.startsWith('/')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${options.label} must not be absolute.`,
    });
  }

  if (value.includes('\\')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${options.label} must use POSIX separators.`,
    });
  }

  if (/^[A-Za-z]:(?:$|\/)/.test(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${options.label} must not use Windows drive-prefixed forms.`,
    });
  }

  const segments = value.split('/');
  if (segments.some((segment) => segment.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${options.label} must not contain empty segments.`,
    });
  }

  if (segments.some((segment) => segment === '.')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${options.label} must not contain dot segments.`,
    });
  }
  if (!options.allowParentSegments && segments.some((segment) => segment === '..')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${options.label} must not contain parent segments.`,
    });
  }

  if (path.posix.normalize(value) !== value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${options.label} must already be normalized.`,
    });
  }
}

export const BacklogRelativePosixPathSchema = NonEmptyStringSchema.superRefine((value, ctx) => {
  validateRelativePosixPath(value, ctx, {
    label: 'Backlog-relative path',
    allowParentSegments: false,
  });
});

export const SourceRelativePosixPathSchema = NonEmptyStringSchema.superRefine((value, ctx) => {
  validateRelativePosixPath(value, ctx, {
    label: 'Source path',
    allowParentSegments: true,
  });
});
export const Sha256HexSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const IsoUtcTimestampSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/);
export const SchemaVersionSchema = z.number().int().min(0);
export const LayoutVersionSchema = z.number().int().min(0);
export const PositiveIntSchema = z.number().int().positive();
export const NonNegativeIntSchema = z.number().int().min(0);
export const ApplyIndexSchema = PositiveIntSchema;
export const SequenceSchema = PositiveIntSchema;

export const DeliveryStateSchema = z.enum(['defined', 'specified', 'planned', 'implemented']);
export const AttentionReasonCodeSchema = z.enum([
  'source_changed',
  'dependency_changed',
  'context_changed',
  'gaps',
]);
export const TodoTypeSchema = z.enum([
  'review_source_change',
  'review_dependency_change',
  'review_context_change',
]);
export const TodoManagedBySchema = z.enum(['refresh', 'mutation']);
export const PatchKindSchema = z.enum(['patch-item', 'remove-item', 'source-maintenance']);
export const PatchOperationActionSchema = z.enum([
  'replace_fields',
  'append_unique',
  'remove_values',
  'remove_todo',
  'remove_item',
  'remove_source_references',
]);

export const ControlledStringSchema = NonEmptyStringSchema;
export const KeyStrategySchema = z.record(NonEmptyStringSchema, NonEmptyStringSchema);
export const StructuredSummaryPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);
export const StructuredSummaryValueSchema = z.union([
  StructuredSummaryPrimitiveSchema,
  z.array(StructuredSummaryPrimitiveSchema),
]);
export const StructuredSummaryEntrySchema = z.record(
  NonEmptyStringSchema,
  StructuredSummaryValueSchema,
);

export const SourceSummarySchema = z.strictObject({
  source_id: SourceIdSchema,
  source_label: SourceLabelSchema,
});

export type NonEmptyString = z.infer<typeof NonEmptyStringSchema>;
export type ItemKey = z.infer<typeof ItemKeySchema>;
export type ClaimKey = z.infer<typeof ClaimKeySchema>;
export type ContractKey = z.infer<typeof ContractKeySchema>;
export type DataDomainKey = z.infer<typeof DataDomainKeySchema>;
export type QualityAttributeKey = z.infer<typeof QualityAttributeKeySchema>;
export type PolicyDecisionKey = z.infer<typeof PolicyDecisionKeySchema>;
export type SourceId = z.infer<typeof SourceIdSchema>;
export type TodoId = z.infer<typeof TodoIdSchema>;
export type PacketId = z.infer<typeof PacketIdSchema>;
export type PatchId = z.infer<typeof PatchIdSchema>;
export type SourceLabel = z.infer<typeof SourceLabelSchema>;
export type CliPathInput = z.infer<typeof CliPathInputSchema>;
export type NormalizedFsPath = z.infer<typeof NormalizedFsPathSchema>;
export type BacklogRelativePosixPath = z.infer<typeof BacklogRelativePosixPathSchema>;
export type SourceRelativePosixPath = z.infer<typeof SourceRelativePosixPathSchema>;
export type Sha256Hex = z.infer<typeof Sha256HexSchema>;
export type IsoUtcTimestamp = z.infer<typeof IsoUtcTimestampSchema>;
export type SchemaVersion = z.infer<typeof SchemaVersionSchema>;
export type LayoutVersion = z.infer<typeof LayoutVersionSchema>;
export type PositiveInt = z.infer<typeof PositiveIntSchema>;
export type NonNegativeInt = z.infer<typeof NonNegativeIntSchema>;
export type ApplyIndex = z.infer<typeof ApplyIndexSchema>;
export type Sequence = z.infer<typeof SequenceSchema>;
export type DeliveryState = z.infer<typeof DeliveryStateSchema>;
export type AttentionReasonCode = z.infer<typeof AttentionReasonCodeSchema>;
export type TodoType = z.infer<typeof TodoTypeSchema>;
export type TodoManagedBy = z.infer<typeof TodoManagedBySchema>;
export type PatchKind = z.infer<typeof PatchKindSchema>;
export type PatchOperationAction = z.infer<typeof PatchOperationActionSchema>;
export type KeyStrategy = z.infer<typeof KeyStrategySchema>;
export type StructuredSummaryEntry = z.infer<typeof StructuredSummaryEntrySchema>;
export type SourceSummary = z.infer<typeof SourceSummarySchema>;
