import { z } from 'zod';

import {
  ClaimKeySchema,
  ContractKeySchema,
  DataDomainKeySchema,
  DeliveryStateSchema,
  ItemKeySchema,
  NonEmptyStringSchema,
  PatchIdSchema,
  PolicyDecisionKeySchema,
  QualityAttributeKeySchema,
  SequenceSchema,
  SourceIdSchema,
  TodoIdSchema,
  IsoUtcTimestampSchema,
  nonEmptyObjectSchema,
  uniqueArraySchema,
} from './scalars.ts';

const ReplaceableStringArrayFieldSchema = z.enum([
  'gaps',
  'depends_on_keys',
  'claim_keys',
  'contract_keys',
  'data_domain_keys',
  'quality_attribute_keys',
  'policy_decision_keys',
]);

const ReplaceableSourceArrayFieldSchema = z.enum([
  'origin_source_ids',
  'specification_source_ids',
  'plan_source_ids',
  'implementation_source_ids',
  'test_source_ids',
]);

export const PatchMetadataSchema = z.strictObject({
  patch_id: PatchIdSchema,
  created_at: IsoUtcTimestampSchema,
  sequence: SequenceSchema,
  target_item_keys: uniqueArraySchema(
    ItemKeySchema,
    (value) => value,
    'Patch target item keys must be unique.',
  ).min(1),
});

export const ReplaceFieldsSchema = nonEmptyObjectSchema({
  title: NonEmptyStringSchema,
  type: NonEmptyStringSchema,
  delivery_state: DeliveryStateSchema,
  gaps: uniqueArraySchema(NonEmptyStringSchema, (value) => value, 'Gaps must be unique.'),
  depends_on_keys: uniqueArraySchema(
    ItemKeySchema,
    (value) => value,
    'Dependency item keys must be unique.',
  ),
  origin_source_ids: uniqueArraySchema(
    SourceIdSchema,
    (value) => value,
    'Source IDs must be unique.',
  ),
  specification_source_ids: uniqueArraySchema(
    SourceIdSchema,
    (value) => value,
    'Source IDs must be unique.',
  ),
  plan_source_ids: uniqueArraySchema(
    SourceIdSchema,
    (value) => value,
    'Source IDs must be unique.',
  ),
  implementation_source_ids: uniqueArraySchema(
    SourceIdSchema,
    (value) => value,
    'Source IDs must be unique.',
  ),
  test_source_ids: uniqueArraySchema(
    SourceIdSchema,
    (value) => value,
    'Source IDs must be unique.',
  ),
  claim_keys: uniqueArraySchema(ClaimKeySchema, (value) => value, 'Claim keys must be unique.'),
  contract_keys: uniqueArraySchema(
    ContractKeySchema,
    (value) => value,
    'Contract keys must be unique.',
  ),
  data_domain_keys: uniqueArraySchema(
    DataDomainKeySchema,
    (value) => value,
    'Data domain keys must be unique.',
  ),
  quality_attribute_keys: uniqueArraySchema(
    QualityAttributeKeySchema,
    (value) => value,
    'Quality attribute keys must be unique.',
  ),
  policy_decision_keys: uniqueArraySchema(
    PolicyDecisionKeySchema,
    (value) => value,
    'Policy decision keys must be unique.',
  ),
});

export const ReplaceFieldsOperationSchema = z.strictObject({
  item_key: ItemKeySchema,
  action: z.literal('replace_fields'),
  fields: ReplaceFieldsSchema,
});

const AppendUniqueStringOperationSchema = z.strictObject({
  item_key: ItemKeySchema,
  action: z.literal('append_unique'),
  field: ReplaceableStringArrayFieldSchema,
  values: uniqueArraySchema(NonEmptyStringSchema, (value) => value, 'Values must be unique.').min(
    1,
  ),
});

const AppendUniqueSourceOperationSchema = z.strictObject({
  item_key: ItemKeySchema,
  action: z.literal('append_unique'),
  field: ReplaceableSourceArrayFieldSchema,
  values: uniqueArraySchema(SourceIdSchema, (value) => value, 'Values must be unique.').min(1),
});

export const AppendUniqueOperationSchema = z.union([
  AppendUniqueStringOperationSchema,
  AppendUniqueSourceOperationSchema,
]);

const RemoveValuesStringOperationSchema = z.strictObject({
  item_key: ItemKeySchema,
  action: z.literal('remove_values'),
  field: ReplaceableStringArrayFieldSchema,
  values: uniqueArraySchema(NonEmptyStringSchema, (value) => value, 'Values must be unique.').min(
    1,
  ),
});

const RemoveValuesSourceOperationSchema = z.strictObject({
  item_key: ItemKeySchema,
  action: z.literal('remove_values'),
  field: ReplaceableSourceArrayFieldSchema,
  values: uniqueArraySchema(SourceIdSchema, (value) => value, 'Values must be unique.').min(1),
});

export const RemoveValuesOperationSchema = z.union([
  RemoveValuesStringOperationSchema,
  RemoveValuesSourceOperationSchema,
]);

export const RemoveTodoOperationSchema = z.strictObject({
  item_key: ItemKeySchema,
  action: z.literal('remove_todo'),
  todo_ids: uniqueArraySchema(TodoIdSchema, (value) => value, 'Todo IDs must be unique.').min(1),
});

export const RemoveItemOperationSchema = z.strictObject({
  item_key: ItemKeySchema,
  action: z.literal('remove_item'),
});

export const RemoveSourceReferencesOperationSchema = z.strictObject({
  action: z.literal('remove_source_references'),
  source_id: SourceIdSchema,
  affected_item_keys: uniqueArraySchema(
    ItemKeySchema,
    (value) => value,
    'Affected item keys must be unique.',
  ),
});

export const PatchOperationSchema = z.union([
  ReplaceFieldsOperationSchema,
  AppendUniqueOperationSchema,
  RemoveValuesOperationSchema,
  RemoveTodoOperationSchema,
  RemoveItemOperationSchema,
  RemoveSourceReferencesOperationSchema,
]);

export const PatchFileSchema = z
  .strictObject({
    metadata: PatchMetadataSchema,
    operations: z.array(PatchOperationSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const targetKeys = new Set(value.metadata.target_item_keys);

    for (const [index, operation] of value.operations.entries()) {
      if ('item_key' in operation && !targetKeys.has(operation.item_key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Patch operation item_key must belong to metadata.target_item_keys.',
          path: ['operations', index, 'item_key'],
        });
      }
    }
  });

export const PatchItemFileSchema = PatchFileSchema.superRefine((value, ctx) => {
  for (const [index, operation] of value.operations.entries()) {
    if (operation.action === 'remove_item' || operation.action === 'remove_source_references') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'patch-item must not contain remove_item or source maintenance operations.',
        path: ['operations', index, 'action'],
      });
    }
  }
});

export const RemoveItemPatchFileSchema = PatchFileSchema.superRefine((value, ctx) => {
  const removedKeys = new Set<string>();

  for (const [index, operation] of value.operations.entries()) {
    if (operation.action !== 'remove_item') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'remove-item patch may contain only remove_item operations.',
        path: ['operations', index, 'action'],
      });
      continue;
    }

    removedKeys.add(operation.item_key);
  }

  for (const [index, itemKey] of value.metadata.target_item_keys.entries()) {
    if (!removedKeys.has(itemKey)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'remove-item patch must cover every metadata.target_item_keys entry.',
        path: ['metadata', 'target_item_keys', index],
      });
    }
  }
});

export type PatchMetadata = z.infer<typeof PatchMetadataSchema>;
export type ReplaceFields = z.infer<typeof ReplaceFieldsSchema>;
export type ReplaceFieldsOperation = z.infer<typeof ReplaceFieldsOperationSchema>;
export type AppendUniqueOperation = z.infer<typeof AppendUniqueOperationSchema>;
export type RemoveValuesOperation = z.infer<typeof RemoveValuesOperationSchema>;
export type RemoveTodoOperation = z.infer<typeof RemoveTodoOperationSchema>;
export type RemoveItemOperation = z.infer<typeof RemoveItemOperationSchema>;
export type PatchOperation = z.infer<typeof PatchOperationSchema>;
export type PatchFile = z.infer<typeof PatchFileSchema>;
