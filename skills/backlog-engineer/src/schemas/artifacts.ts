import { z } from 'zod';

import { PacketContextSchema, PacketItemSchema } from './packet.ts';
import {
  ApplyIndexSchema,
  AttentionReasonCodeSchema,
  BacklogRelativePosixPathSchema,
  ControlledStringSchema,
  IsoUtcTimestampSchema,
  ItemKeySchema,
  LayoutVersionSchema,
  NonEmptyStringSchema,
  PacketIdSchema,
  PatchIdSchema,
  PatchKindSchema,
  PositiveIntSchema,
  SchemaVersionSchema,
  Sha256HexSchema,
  SourceIdSchema,
  SourceLabelSchema,
  SourceSummarySchema,
  TodoIdSchema,
  TodoManagedBySchema,
  TodoTypeSchema,
  uniqueArraySchema,
} from './scalars.ts';

export const RootMarkerFileSchema = z.strictObject({
  schema_version: SchemaVersionSchema,
  tool_name: NonEmptyStringSchema,
  created_at: IsoUtcTimestampSchema,
  layout_version: LayoutVersionSchema,
});

export const SourceRecordSchema = z.strictObject({
  source_id: SourceIdSchema,
  source_label: SourceLabelSchema,
  path: BacklogRelativePosixPathSchema,
  kind: ControlledStringSchema,
  authority: ControlledStringSchema,
  note: NonEmptyStringSchema.optional(),
  hash: Sha256HexSchema,
  registered_at: IsoUtcTimestampSchema,
  last_checked_at: IsoUtcTimestampSchema,
});

export const SourceRegistryFileSchema = z
  .strictObject({
    schema_version: SchemaVersionSchema,
    created_at: IsoUtcTimestampSchema,
    updated_at: IsoUtcTimestampSchema,
    sources: uniqueArraySchema(
      SourceRecordSchema,
      (value) => value.source_id,
      'Source IDs must be unique.',
    ),
  })
  .superRefine((value, ctx) => {
    const seenPaths = new Set<string>();

    for (const [index, source] of value.sources.entries()) {
      if (seenPaths.has(source.path)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Source paths must be unique.',
          path: ['sources', index, 'path'],
        });
        continue;
      }

      seenPaths.add(source.path);
    }
  });

export const AppliedPacketEntrySchema = z.strictObject({
  packet_id: PacketIdSchema,
  apply_index: ApplyIndexSchema,
  canonical_path: BacklogRelativePosixPathSchema,
  content_hash: Sha256HexSchema,
  applied_at: IsoUtcTimestampSchema,
  item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
});

export const AppliedPatchEntrySchema = z.strictObject({
  patch_id: PatchIdSchema,
  apply_index: ApplyIndexSchema,
  canonical_path: BacklogRelativePosixPathSchema,
  content_hash: Sha256HexSchema,
  sequence: PositiveIntSchema,
  applied_at: IsoUtcTimestampSchema,
  kind: PatchKindSchema,
  target_item_keys: uniqueArraySchema(
    ItemKeySchema,
    (value) => value,
    'Target item keys must be unique.',
  ),
});

export const AppliedRegistryFileSchema = z
  .strictObject({
    schema_version: SchemaVersionSchema,
    created_at: IsoUtcTimestampSchema,
    updated_at: IsoUtcTimestampSchema,
    next_apply_index: PositiveIntSchema,
    packets: uniqueArraySchema(
      AppliedPacketEntrySchema,
      (value) => value.packet_id,
      'Packet IDs must be unique.',
    ),
    patches: uniqueArraySchema(
      AppliedPatchEntrySchema,
      (value) => value.patch_id,
      'Patch IDs must be unique.',
    ),
  })
  .superRefine((value, ctx) => {
    const applyIndexes = new Set<number>();

    for (const [index, packet] of value.packets.entries()) {
      if (applyIndexes.has(packet.apply_index)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'apply_index values must be globally unique.',
          path: ['packets', index, 'apply_index'],
        });
        continue;
      }

      applyIndexes.add(packet.apply_index);
    }

    for (const [index, patch] of value.patches.entries()) {
      if (applyIndexes.has(patch.apply_index)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'apply_index values must be globally unique.',
          path: ['patches', index, 'apply_index'],
        });
        continue;
      }

      applyIndexes.add(patch.apply_index);
    }
  });

export const StateItemSchema = PacketItemSchema.extend({
  reverse_dependency_keys: uniqueArraySchema(
    ItemKeySchema,
    (value) => value,
    'Reverse dependency item keys must be unique.',
  ),
  open_todo_ids: uniqueArraySchema(TodoIdSchema, (value) => value, 'Open todo IDs must be unique.'),
  needs_attention: z.boolean(),
  attention_reason_codes: z.array(AttentionReasonCodeSchema),
  attention_reasons: z.array(NonEmptyStringSchema),
  ready_for_next_step: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.attention_reason_codes.length !== value.attention_reasons.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'attention_reason_codes and attention_reasons must have matching length.',
      path: ['attention_reasons'],
    });
  }
});

export const TodoSchema = z.strictObject({
  todo_id: TodoIdSchema,
  item_key: ItemKeySchema,
  type: TodoTypeSchema,
  managed_by: TodoManagedBySchema.default('mutation'),
  message: NonEmptyStringSchema,
  created_at: IsoUtcTimestampSchema,
  related_sources: uniqueArraySchema(
    SourceSummarySchema,
    (value) => value.source_id,
    'Related sources must be unique by source_id.',
  ),
  related_item_keys: uniqueArraySchema(
    ItemKeySchema,
    (value) => value,
    'Related item keys must be unique.',
  ),
});

export const StateFileSchema = z
  .strictObject({
    schema_version: SchemaVersionSchema,
    created_at: IsoUtcTimestampSchema,
    updated_at: IsoUtcTimestampSchema,
    last_refresh_at: z.nullable(IsoUtcTimestampSchema),
    context: PacketContextSchema,
    items: uniqueArraySchema(
      StateItemSchema,
      (value) => value.item_key,
      'Item keys must be unique.',
    ),
    todos: uniqueArraySchema(TodoSchema, (value) => value.todo_id, 'Todo IDs must be unique.'),
  })
  .superRefine((value, ctx) => {
    const todoIds = new Map(value.todos.map((todo) => [todo.todo_id, todo.item_key]));

    for (const [itemIndex, item] of value.items.entries()) {
      for (const [todoIndex, todoId] of item.open_todo_ids.entries()) {
        const ownerItemKey = todoIds.get(todoId);

        if (!ownerItemKey) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'open_todo_ids must reference existing todos.',
            path: ['items', itemIndex, 'open_todo_ids', todoIndex],
          });
          continue;
        }

        if (ownerItemKey !== item.item_key) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'open_todo_ids must reference todos owned by the same item.',
            path: ['items', itemIndex, 'open_todo_ids', todoIndex],
          });
        }
      }
    }
  });

export type RootMarkerFile = z.infer<typeof RootMarkerFileSchema>;
export type SourceRecord = z.infer<typeof SourceRecordSchema>;
export type SourceRegistryFile = z.infer<typeof SourceRegistryFileSchema>;
export type AppliedPacketEntry = z.infer<typeof AppliedPacketEntrySchema>;
export type AppliedPatchEntry = z.infer<typeof AppliedPatchEntrySchema>;
export type AppliedRegistryFile = z.infer<typeof AppliedRegistryFileSchema>;
export type StateItem = z.infer<typeof StateItemSchema>;
export type Todo = z.infer<typeof TodoSchema>;
export type StateFile = z.infer<typeof StateFileSchema>;
