import { z } from 'zod';

import { TodoSchema } from './artifacts.ts';
import { PacketItemSchema } from './packet.ts';
import {
  AttentionReasonCodeSchema,
  ClaimKeySchema,
  CliPathInputSchema,
  ContractKeySchema,
  DataDomainKeySchema,
  DeliveryStateSchema,
  ItemKeySchema,
  NonEmptyStringSchema,
  NonNegativeIntSchema,
  NormalizedFsPathSchema,
  PolicyDecisionKeySchema,
  QualityAttributeKeySchema,
  SourceIdSchema,
  SourceSummarySchema,
  SourceLabelSchema,
  IsoUtcTimestampSchema,
  uniqueArraySchema,
} from './scalars.ts';

export const CommandSuggestionSchema = z.strictObject({
  command: z.enum(['status', 'report', 'items', 'search', 'gaps', 'queue', 'attention', 'refresh']),
  args: z.array(z.string()),
  reason: NonEmptyStringSchema,
});

export const PacketMutationCountsSchema = z.strictObject({
  added: NonNegativeIntSchema,
  removed: NonNegativeIntSchema,
  todo_created: NonNegativeIntSchema,
  todo_updated: NonNegativeIntSchema,
});

export const PatchItemMutationCountsSchema = z.strictObject({
  updated: NonNegativeIntSchema,
  todo_created: NonNegativeIntSchema,
  todo_updated: NonNegativeIntSchema,
  todo_removed: NonNegativeIntSchema,
});

export const RemoveItemMutationCountsSchema = z.strictObject({
  removed: NonNegativeIntSchema,
  todo_created: NonNegativeIntSchema,
  todo_updated: NonNegativeIntSchema,
  todo_removed: NonNegativeIntSchema,
});

export const RefreshMutationCountsSchema = z.strictObject({
  changed_sources: NonNegativeIntSchema,
  todo_created: NonNegativeIntSchema,
  todo_updated: NonNegativeIntSchema,
  todo_removed: NonNegativeIntSchema,
});

export const ItemComputedStateSchema = z
  .strictObject({
    needs_attention: z.boolean(),
    attention_reason_codes: z.array(AttentionReasonCodeSchema),
    attention_reasons: z.array(NonEmptyStringSchema),
    ready_for_next_step: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.attention_reason_codes.length !== value.attention_reasons.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'attention_reason_codes and attention_reasons must have matching length.',
      });
    }
  });

export const ItemContextSummarySchema = z.strictObject({
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

export const InitCommandInputSchema = z.strictObject({
  path: CliPathInputSchema,
});

export const InitCommandOutputSchema = z.strictObject({
  path: NormalizedFsPathSchema,
  root_marker_path: NormalizedFsPathSchema,
  agents_path: NormalizedFsPathSchema,
});

export const RegisterSourceCommandInputSchema = z.strictObject({
  path: CliPathInputSchema,
  kind: NonEmptyStringSchema,
  authority: NonEmptyStringSchema,
  note: NonEmptyStringSchema.optional(),
});

export const RegisteredSourceOutputSchema = z.strictObject({
  source_id: SourceIdSchema,
  source_label: SourceLabelSchema,
  path: NormalizedFsPathSchema,
  kind: NonEmptyStringSchema,
  authority: NonEmptyStringSchema,
  note: NonEmptyStringSchema.optional(),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const RegisterSourceCommandOutputSchema = RegisteredSourceOutputSchema;

export const ListSourcesCommandInputSchema = z.strictObject({
  item_key: ItemKeySchema.optional(),
  path: CliPathInputSchema.optional(),
});

export const ListedSourceOutputSchema = RegisteredSourceOutputSchema.extend({
  registered_at: IsoUtcTimestampSchema,
  last_checked_at: IsoUtcTimestampSchema,
});

export const ListSourcesCommandOutputSchema = z.array(ListedSourceOutputSchema);

export const SourceSelectorInputSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('source_id'), source_id: SourceIdSchema }),
  z.strictObject({ kind: z.literal('source_label'), source_label: SourceLabelSchema }),
  z.strictObject({ kind: z.literal('source_path'), source_path: CliPathInputSchema }),
]);

export const UpdateSourcePathMutationCountsSchema = z.strictObject({
  changed_sources: NonNegativeIntSchema,
  todo_created: NonNegativeIntSchema,
  todo_updated: NonNegativeIntSchema,
  todo_removed: NonNegativeIntSchema,
});

export const UpdateSourcePathCommandInputSchema = z.strictObject({
  selector: SourceSelectorInputSchema,
  new_path: CliPathInputSchema,
  dry_run: z.boolean().default(false),
});

export const UpdateSourcePathCommandOutputSchema = RegisteredSourceOutputSchema.extend({
  dry_run: z.boolean(),
  previous_path: NormalizedFsPathSchema,
  hash_changed: z.boolean(),
  counts: UpdateSourcePathMutationCountsSchema,
  todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_removed: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  next_commands: z.array(CommandSuggestionSchema),
});

export const RemoveSourceMutationCountsSchema = z.strictObject({
  updated: NonNegativeIntSchema,
  todo_created: NonNegativeIntSchema,
  todo_updated: NonNegativeIntSchema,
  todo_removed: NonNegativeIntSchema,
});

export const RemoveSourceCommandInputSchema = z.strictObject({
  selector: SourceSelectorInputSchema,
  dry_run: z.boolean().default(false),
});

export const RemoveSourceCommandOutputSchema = RegisteredSourceOutputSchema.extend({
  dry_run: z.boolean(),
  canonical_patch_path: NormalizedFsPathSchema.optional(),
  canonical_patch_purpose: z.literal('immutable_replay_artifact').optional(),
  removed: z.boolean(),
  counts: RemoveSourceMutationCountsSchema,
  updated_item_keys: uniqueArraySchema(
    ItemKeySchema,
    (value) => value,
    'Updated item keys must be unique.',
  ),
  todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_removed: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  next_commands: z.array(CommandSuggestionSchema),
});

const TemplatePacketCommandInputSchema = z.strictObject({
  mode: z.literal('packet'),
  out: CliPathInputSchema,
});

const TemplatePatchCommandInputSchema = z.strictObject({
  mode: z.literal('patch'),
  out: CliPathInputSchema,
  item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.').min(1),
});

export const TemplateCommandInputSchema = z.discriminatedUnion('mode', [
  TemplatePacketCommandInputSchema,
  TemplatePatchCommandInputSchema,
]);

export const TemplateCommandOutputSchema = z.strictObject({
  mode: z.enum(['packet', 'patch']),
  output_path: NormalizedFsPathSchema,
});

export const PacketCommandInputSchema = z.strictObject({
  path: CliPathInputSchema,
  dry_run: z.boolean().default(false),
});

export const PacketCommandOutputSchema = z.strictObject({
  dry_run: z.boolean(),
  authored_packet_path: NormalizedFsPathSchema,
  canonical_packet_path: NormalizedFsPathSchema.optional(),
  canonical_packet_purpose: z.literal('immutable_import_copy').optional(),
  counts: PacketMutationCountsSchema,
  added: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  removed: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  next_commands: z.array(CommandSuggestionSchema),
});

export const PatchItemCommandInputSchema = z.strictObject({
  patch: CliPathInputSchema,
  dry_run: z.boolean().default(false),
});

export const PatchItemCommandOutputSchema = z.strictObject({
  dry_run: z.boolean(),
  authored_patch_path: NormalizedFsPathSchema.optional(),
  canonical_patch_path: NormalizedFsPathSchema.optional(),
  canonical_patch_purpose: z.literal('immutable_replay_artifact').optional(),
  counts: PatchItemMutationCountsSchema,
  updated: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_removed: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  next_commands: z.array(CommandSuggestionSchema),
});

export const RemoveItemCommandInputSchema = z.strictObject({
  patch: CliPathInputSchema,
  dry_run: z.boolean().default(false),
});

export const RemoveItemCommandOutputSchema = z.strictObject({
  dry_run: z.boolean(),
  authored_patch_path: NormalizedFsPathSchema.optional(),
  canonical_patch_path: NormalizedFsPathSchema.optional(),
  canonical_patch_purpose: z.literal('immutable_replay_artifact').optional(),
  counts: RemoveItemMutationCountsSchema,
  removed: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_removed: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  next_commands: z.array(CommandSuggestionSchema),
});

export const RefreshCommandInputSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('all') }),
  z.strictObject({ kind: z.literal('item'), item_key: ItemKeySchema }),
  z.strictObject({ kind: z.literal('source_id'), source_id: SourceIdSchema }),
  z.strictObject({ kind: z.literal('source_label'), source_label: SourceLabelSchema }),
  z.strictObject({ kind: z.literal('source_path'), source_path: CliPathInputSchema }),
]);

export const RefreshCommandOutputSchema = z.strictObject({
  counts: RefreshMutationCountsSchema,
  changed_sources: z.array(SourceSummarySchema),
  todo_created: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_updated: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  todo_removed: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.'),
  next_commands: z.array(CommandSuggestionSchema),
});

export const StatusCommandInputSchema = z.strictObject({
  refresh: z.boolean().default(false),
});

export const CanonicalArtifactIntegrityMissingPathSchema = z.strictObject({
  artifact_kind: z.enum(['packet', 'patch']),
  canonical_path: NormalizedFsPathSchema,
  packet_id: NonEmptyStringSchema.optional(),
  patch_id: NonEmptyStringSchema.optional(),
  apply_index: NonNegativeIntSchema,
  sequence: NonNegativeIntSchema.optional(),
});

export const CanonicalArtifactIntegritySchema = z.strictObject({
  applied_canonical_paths_exist: z.boolean(),
  missing_canonical_paths: z.array(CanonicalArtifactIntegrityMissingPathSchema),
});

export const StatusCommandOutputSchema = z.strictObject({
  total_items: NonNegativeIntSchema,
  last_refresh_at: z.nullable(IsoUtcTimestampSchema),
  defined_count: NonNegativeIntSchema,
  specified_count: NonNegativeIntSchema,
  planned_count: NonNegativeIntSchema,
  implemented_count: NonNegativeIntSchema,
  gaps_count: NonNegativeIntSchema,
  needs_attention_count: NonNegativeIntSchema,
  ready_for_next_step_count: NonNegativeIntSchema,
  open_todo_count: NonNegativeIntSchema,
  artifact_integrity: CanonicalArtifactIntegritySchema,
});

export const ReportCommandInputSchema = z.strictObject({});

export const ReportCommandOutputSchema = z.strictObject({
  report_path: NormalizedFsPathSchema,
  generated_at: IsoUtcTimestampSchema,
  item_count: NonNegativeIntSchema,
});

export const ItemsCommandInputSchema = z.strictObject({
  item_keys: uniqueArraySchema(ItemKeySchema, (value) => value, 'Item keys must be unique.').min(1),
});

export const ItemCardSchema = z.strictObject({
  item: PacketItemSchema,
  reverse_dependency_keys: uniqueArraySchema(
    ItemKeySchema,
    (value) => value,
    'Reverse dependency keys must be unique.',
  ),
  source_summaries: uniqueArraySchema(
    SourceSummarySchema,
    (value) => value.source_id,
    'Source summaries must be unique by source_id.',
  ),
  context: ItemContextSummarySchema,
  computed_state: ItemComputedStateSchema,
  todo: z.array(TodoSchema),
});

export const ItemsCommandOutputSchema = z.array(ItemCardSchema);

export const SearchCommandInputSchema = z.strictObject({
  source_ids: uniqueArraySchema(
    SourceIdSchema,
    (value) => value,
    'Source IDs must be unique.',
  ).optional(),
  delivery_state: DeliveryStateSchema.optional(),
  needs_attention: z.boolean().optional(),
  ready_for_next_step: z.boolean().optional(),
  claim_keys: uniqueArraySchema(
    ClaimKeySchema,
    (value) => value,
    'Claim keys must be unique.',
  ).optional(),
  contract_keys: uniqueArraySchema(
    ContractKeySchema,
    (value) => value,
    'Contract keys must be unique.',
  ).optional(),
  data_domain_keys: uniqueArraySchema(
    DataDomainKeySchema,
    (value) => value,
    'Data domain keys must be unique.',
  ).optional(),
  quality_attribute_keys: uniqueArraySchema(
    QualityAttributeKeySchema,
    (value) => value,
    'Quality attribute keys must be unique.',
  ).optional(),
  policy_decision_keys: uniqueArraySchema(
    PolicyDecisionKeySchema,
    (value) => value,
    'Policy decision keys must be unique.',
  ).optional(),
});

export const SearchResultSchema = z
  .strictObject({
    item_key: ItemKeySchema,
    title: NonEmptyStringSchema,
    type: NonEmptyStringSchema,
    delivery_state: DeliveryStateSchema,
    needs_attention: z.boolean(),
    ready_for_next_step: z.boolean(),
    attention_reason_codes: z.array(AttentionReasonCodeSchema),
    attention_reasons: z.array(NonEmptyStringSchema),
    source_summaries: uniqueArraySchema(
      SourceSummarySchema,
      (value) => value.source_id,
      'Source summaries must be unique by source_id.',
    ),
    match_reasons: uniqueArraySchema(
      NonEmptyStringSchema,
      (value) => value,
      'Match reasons must be unique.',
    ),
  })
  .superRefine((value, ctx) => {
    if (value.attention_reason_codes.length !== value.attention_reasons.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'attention_reason_codes and attention_reasons must have matching length.',
      });
    }
  });

export const SearchCommandOutputSchema = z.array(SearchResultSchema);

export const GapsCommandInputSchema = z.strictObject({
  item_key: ItemKeySchema.optional(),
});

export const GapsEntrySchema = z.strictObject({
  item_key: ItemKeySchema,
  title: NonEmptyStringSchema,
  gaps: uniqueArraySchema(NonEmptyStringSchema, (value) => value, 'Gaps must be unique.'),
});

export const GapsCommandOutputSchema = z.array(GapsEntrySchema);

export const QueueCommandInputSchema = z.strictObject({});

export const QueueChainSchema = z.strictObject({
  root_item_key: ItemKeySchema,
  items: uniqueArraySchema(ItemKeySchema, (value) => value, 'Queue item keys must be unique.').min(
    1,
  ),
  ordering_rule: z.tuple([
    z.literal('depth'),
    z.literal('downstream_dependency_count'),
    z.literal('item_key'),
  ]),
});

export const QueueCommandOutputSchema = z.array(QueueChainSchema);

export const AttentionCommandInputSchema = z.strictObject({});

export const AttentionEntrySchema = z
  .strictObject({
    item_key: ItemKeySchema,
    title: NonEmptyStringSchema,
    attention_reason_codes: z.array(AttentionReasonCodeSchema),
    attention_reasons: z.array(NonEmptyStringSchema),
    source_summaries: uniqueArraySchema(
      SourceSummarySchema,
      (value) => value.source_id,
      'Source summaries must be unique by source_id.',
    ),
  })
  .superRefine((value, ctx) => {
    if (value.attention_reason_codes.length !== value.attention_reasons.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'attention_reason_codes and attention_reasons must have matching length.',
      });
    }
  });

export const AttentionCommandOutputSchema = z.array(AttentionEntrySchema);

export const DeleteBacklogCommandInputSchema = z.strictObject({
  confirm: z.literal(true),
});

export const DeleteBacklogCommandOutputSchema = z.strictObject({
  deleted_path: NormalizedFsPathSchema,
  deleted: z.literal(true),
});

export type CommandSuggestion = z.infer<typeof CommandSuggestionSchema>;
export type PacketMutationCounts = z.infer<typeof PacketMutationCountsSchema>;
export type PatchItemMutationCounts = z.infer<typeof PatchItemMutationCountsSchema>;
export type RemoveItemMutationCounts = z.infer<typeof RemoveItemMutationCountsSchema>;
export type RefreshMutationCounts = z.infer<typeof RefreshMutationCountsSchema>;
export type ItemComputedState = z.infer<typeof ItemComputedStateSchema>;
export type ItemContextSummary = z.infer<typeof ItemContextSummarySchema>;
export type InitCommandInput = z.infer<typeof InitCommandInputSchema>;
export type InitCommandOutput = z.infer<typeof InitCommandOutputSchema>;
export type RegisterSourceCommandInput = z.infer<typeof RegisterSourceCommandInputSchema>;
export type RegisterSourceCommandOutput = z.infer<typeof RegisterSourceCommandOutputSchema>;
export type ListSourcesCommandInput = z.infer<typeof ListSourcesCommandInputSchema>;
export type ListSourcesCommandOutput = z.infer<typeof ListSourcesCommandOutputSchema>;
export type SourceSelectorInput = z.infer<typeof SourceSelectorInputSchema>;
export type UpdateSourcePathMutationCounts = z.infer<typeof UpdateSourcePathMutationCountsSchema>;
export type UpdateSourcePathCommandInput = z.infer<typeof UpdateSourcePathCommandInputSchema>;
export type UpdateSourcePathCommandOutput = z.infer<typeof UpdateSourcePathCommandOutputSchema>;
export type RemoveSourceMutationCounts = z.infer<typeof RemoveSourceMutationCountsSchema>;
export type RemoveSourceCommandInput = z.infer<typeof RemoveSourceCommandInputSchema>;
export type RemoveSourceCommandOutput = z.infer<typeof RemoveSourceCommandOutputSchema>;
export type TemplateCommandInput = z.infer<typeof TemplateCommandInputSchema>;
export type TemplateCommandOutput = z.infer<typeof TemplateCommandOutputSchema>;
export type PacketCommandInput = z.infer<typeof PacketCommandInputSchema>;
export type PacketCommandOutput = z.infer<typeof PacketCommandOutputSchema>;
export type PatchItemCommandInput = z.infer<typeof PatchItemCommandInputSchema>;
export type PatchItemCommandOutput = z.infer<typeof PatchItemCommandOutputSchema>;
export type RemoveItemCommandInput = z.infer<typeof RemoveItemCommandInputSchema>;
export type RemoveItemCommandOutput = z.infer<typeof RemoveItemCommandOutputSchema>;
export type RefreshCommandInput = z.infer<typeof RefreshCommandInputSchema>;
export type RefreshCommandOutput = z.infer<typeof RefreshCommandOutputSchema>;
export type StatusCommandInput = z.infer<typeof StatusCommandInputSchema>;
export type StatusCommandOutput = z.infer<typeof StatusCommandOutputSchema>;
export type ReportCommandInput = z.infer<typeof ReportCommandInputSchema>;
export type ReportCommandOutput = z.infer<typeof ReportCommandOutputSchema>;
export type ItemsCommandInput = z.infer<typeof ItemsCommandInputSchema>;
export type ItemCard = z.infer<typeof ItemCardSchema>;
export type ItemsCommandOutput = z.infer<typeof ItemsCommandOutputSchema>;
export type SearchCommandInput = z.infer<typeof SearchCommandInputSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchCommandOutput = z.infer<typeof SearchCommandOutputSchema>;
export type GapsCommandInput = z.infer<typeof GapsCommandInputSchema>;
export type GapsEntry = z.infer<typeof GapsEntrySchema>;
export type GapsCommandOutput = z.infer<typeof GapsCommandOutputSchema>;
export type QueueCommandInput = z.infer<typeof QueueCommandInputSchema>;
export type QueueChain = z.infer<typeof QueueChainSchema>;
export type QueueCommandOutput = z.infer<typeof QueueCommandOutputSchema>;
export type AttentionCommandInput = z.infer<typeof AttentionCommandInputSchema>;
export type AttentionEntry = z.infer<typeof AttentionEntrySchema>;
export type AttentionCommandOutput = z.infer<typeof AttentionCommandOutputSchema>;
export type DeleteBacklogCommandInput = z.infer<typeof DeleteBacklogCommandInputSchema>;
export type DeleteBacklogCommandOutput = z.infer<typeof DeleteBacklogCommandOutputSchema>;
