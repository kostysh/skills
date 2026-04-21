import { z } from 'zod';

import {
  ClaimKeySchema,
  ControlledStringSchema,
  ContractKeySchema,
  DataDomainKeySchema,
  DeliveryStateSchema,
  ItemKeySchema,
  KeyStrategySchema,
  NonEmptyStringSchema,
  PolicyDecisionKeySchema,
  QualityAttributeKeySchema,
  SourceIdSchema,
  StructuredSummaryEntrySchema,
  uniqueArraySchema,
} from './scalars.ts';

export const GlossaryEntrySchema = z.strictObject({
  term: NonEmptyStringSchema,
  definition: NonEmptyStringSchema,
  aliases: uniqueArraySchema(
    NonEmptyStringSchema,
    (value) => value,
    'Glossary aliases must be unique.',
  ),
});

export const ClaimSchema = z.strictObject({
  claim_key: ClaimKeySchema,
  title: NonEmptyStringSchema,
  claim_class: ControlledStringSchema,
  commitment: ControlledStringSchema,
  source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, 'Source IDs must be unique.'),
});

export const ContractSchema = z.strictObject({
  contract_key: ContractKeySchema,
  title: NonEmptyStringSchema,
  owner: NonEmptyStringSchema,
  versioning_strategy: NonEmptyStringSchema,
  reconciliation_strategy: NonEmptyStringSchema,
  deprecation_window: NonEmptyStringSchema,
  retirement_condition: NonEmptyStringSchema,
});

export const DataDomainSchema = z.strictObject({
  data_domain_key: DataDomainKeySchema,
  title: NonEmptyStringSchema,
  data_class: ControlledStringSchema,
  owners: uniqueArraySchema(
    NonEmptyStringSchema,
    (value) => value,
    'Data domain owners must be unique.',
  ),
});

export const QualityAttributeSchema = z.strictObject({
  quality_attribute_key: QualityAttributeKeySchema,
  title: NonEmptyStringSchema,
  quality_class: ControlledStringSchema,
  target: NonEmptyStringSchema,
  applies_to_item_keys: uniqueArraySchema(
    ItemKeySchema,
    (value) => value,
    'Quality attribute item keys must be unique.',
  ),
  owner_keys: uniqueArraySchema(
    NonEmptyStringSchema,
    (value) => value,
    'Quality attribute owner keys must be unique.',
  ),
  source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, 'Source IDs must be unique.'),
});

export const PolicyDecisionSchema = z.strictObject({
  policy_decision_key: PolicyDecisionKeySchema,
  title: NonEmptyStringSchema,
  policy_surface: ControlledStringSchema,
  decision_state: ControlledStringSchema,
  owner: NonEmptyStringSchema,
  source_ids: uniqueArraySchema(SourceIdSchema, (value) => value, 'Source IDs must be unique.'),
  related_item_keys: uniqueArraySchema(
    ItemKeySchema,
    (value) => value,
    'Related item keys must be unique.',
  ),
});

export const PacketContextSchema = z.strictObject({
  glossary: uniqueArraySchema(
    GlossaryEntrySchema,
    (value) => value.term,
    'Glossary terms must be unique.',
  ),
  key_strategy: KeyStrategySchema,
  target_system: z.array(StructuredSummaryEntrySchema).default([]),
  as_built: z.array(StructuredSummaryEntrySchema).default([]),
  claims: uniqueArraySchema(ClaimSchema, (value) => value.claim_key, 'Claim keys must be unique.'),
  contracts: uniqueArraySchema(
    ContractSchema,
    (value) => value.contract_key,
    'Contract keys must be unique.',
  ),
  data_domains: uniqueArraySchema(
    DataDomainSchema,
    (value) => value.data_domain_key,
    'Data domain keys must be unique.',
  ),
  quality_attributes: uniqueArraySchema(
    QualityAttributeSchema,
    (value) => value.quality_attribute_key,
    'Quality attribute keys must be unique.',
  ),
  policy_decisions: uniqueArraySchema(
    PolicyDecisionSchema,
    (value) => value.policy_decision_key,
    'Policy decision keys must be unique.',
  ),
});

export const PacketItemSchema = z
  .strictObject({
    item_key: ItemKeySchema,
    title: NonEmptyStringSchema,
    type: ControlledStringSchema,
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
  })
  .superRefine((value, ctx) => {
    if (value.depends_on_keys.includes(value.item_key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Item must not depend on itself.',
        path: ['depends_on_keys'],
      });
    }
  });

export const PacketFileSchema = z
  .strictObject({
    context: PacketContextSchema,
    items: z.array(PacketItemSchema),
  })
  .superRefine((value, ctx) => {
    const seenItemKeys = new Set<string>();
    for (const [index, item] of value.items.entries()) {
      if (seenItemKeys.has(item.item_key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Packet contains duplicate item_key values.',
          path: ['items', index, 'item_key'],
        });
        continue;
      }

      seenItemKeys.add(item.item_key);
    }
  });

export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type Contract = z.infer<typeof ContractSchema>;
export type DataDomain = z.infer<typeof DataDomainSchema>;
export type QualityAttribute = z.infer<typeof QualityAttributeSchema>;
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;
export type PacketContext = z.infer<typeof PacketContextSchema>;
export type PacketItem = z.infer<typeof PacketItemSchema>;
export type PacketFile = z.infer<typeof PacketFileSchema>;
