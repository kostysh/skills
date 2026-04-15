# Строгие схемы и типы утилиты `@kostysh/backlog-engineer-cli`

Документ фиксирует exact shape всех основных структур данных утилиты:

- authored packet;
- authored patch;
- source record;
- `.backlog/sources.json`;
- `.backlog/applied.json`;
- `.backlog/state.json`;
- utility-owned `todo`;
- command input/output;
- error payload.

Документ предназначен для реализации `zod@v4` схем и TypeScript типов.

## 1. Общие правила схем

### 1.1. Exact object policy

Все object-схемы, кроме специально отмеченных map-like структур, должны быть exact:

- в `zod@v4` использовать `z.strictObject(...)`;
- неизвестные ключи запрещены;
- дополнительные поля не допускаются.

Исключения:

- `context.key_strategy`
- элементы `target_system`
- элементы `as_built`
- `error.details`

Они допускают map-like форму по отдельным правилам ниже.

### 1.2. Naming policy

- `*_key` = agent-authored stable business key
- `*_id` = utility-authored technical identifier

Во внешнем контракте источники используют только `source_id`.

### 1.3. Scalar aliases

В коде удобно завести такие базовые схемы и типы:

```ts
type NonEmptyString = string;
type ItemKey = string;
type ClaimKey = string;
type ContractKey = string;
type DataDomainKey = string;
type QualityAttributeKey = string;
type PolicyDecisionKey = string;
type SourceId = string;          // UUID
type TodoId = string;            // UUID
type PacketId = string;          // UUID
type PatchId = string;
type IsoUtcTimestamp = string;   // ISO 8601 UTC
type Sha256Hex = string;
type CliPathInput = string;
type NormalizedFsPath = string;
type BacklogRelativePosixPath = string;
type SourceRelativePosixPath = string;
type SourceLabel = string;
type SchemaVersion = number;
type LayoutVersion = number;
type PositiveInt = number;
type NonNegativeInt = number;
type ApplyIndex = number;
type Sequence = number;
```

Минимальные schema constraints:

- `NonEmptyString`: `z.string().trim().min(1)`
- `ItemKey` / `ClaimKey` / `ContractKey` / `DataDomainKey` / `QualityAttributeKey` / `PolicyDecisionKey`: `z.string().trim().min(1)`
- `SourceId` / `TodoId` / `PacketId`: `z.uuid()`
- `PatchId`: `z.string().trim().min(1)`
- `SourceLabel`: `z.string().trim().min(1)`
- `IsoUtcTimestamp`: `z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/)`
- `Sha256Hex`: `z.string().regex(/^[a-f0-9]{64}$/)`
- `CliPathInput`: `z.string().trim().min(1)`
- `NormalizedFsPath`: `z.string().trim().min(1)`
- `BacklogRelativePosixPath`: `z.string().trim().min(1)` + semantic validation для utility-owned paths внутри backlog root
- `SourceRelativePosixPath`: `z.string().trim().min(1)` + semantic validation для source paths relative to backlog root; parent segments `..` допустимы
- `SchemaVersion` / `LayoutVersion` / `NonNegativeInt`: `z.number().int().min(0)`
- `PositiveInt` / `ApplyIndex` / `Sequence`: `z.number().int().positive()`

Path aliases are used at different normalization levels:

- `CliPathInput` = raw path from argv or command call
- `NormalizedFsPath` = normalized filesystem path returned to caller
- `BacklogRelativePosixPath` = persisted utility-owned path inside backlog root
- `SourceRelativePosixPath` = persisted source path relative to backlog root; may contain `..`

### 1.4. Common enums

#### `DeliveryState`

```ts
type DeliveryState = "defined" | "specified" | "planned" | "implemented";
```

#### `AttentionReasonCode`

```ts
type AttentionReasonCode =
  | "source_changed"
  | "dependency_changed"
  | "context_changed"
  | "gaps";
```

#### `TodoType`

```ts
type TodoType =
  | "review_source_change"
  | "review_dependency_change"
  | "review_context_change";
```

#### `PatchKind`

```ts
type PatchKind = "patch-item" | "remove-item" | "source-maintenance";
```

#### `PatchOperationAction`

```ts
type PatchOperationAction =
  | "replace_fields"
  | "append_unique"
  | "remove_values"
  | "remove_todo"
  | "remove_item"
  | "remove_source_references";
```

### 1.5. Extensible controlled strings

Эти поля остаются расширяемыми на уровне репозитория, поэтому schema для них:

- `type`
- `kind`
- `authority`
- `claim_class`
- `commitment`
- `quality_class`
- `decision_state`
- `policy_surface`

Базовое правило:

```ts
z.string().trim().min(1)
```

## 2. Reusable helper types

### 2.1. `KeyStrategy`

```ts
type KeyStrategy = Record<string, string>;
```

Schema:

```ts
const KeyStrategySchema = z.record(z.string().trim().min(1), z.string().trim().min(1));
```

### 2.2. `StructuredSummaryEntry`

Используется для:

- `target_system`
- `as_built`

```ts
type StructuredSummaryPrimitive = string | number | boolean | null;
type StructuredSummaryValue =
  | StructuredSummaryPrimitive
  | StructuredSummaryPrimitive[];

type StructuredSummaryEntry = Record<string, StructuredSummaryValue>;
```

Schema:

```ts
const StructuredSummaryValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])),
]);

const StructuredSummaryEntrySchema = z.record(
  z.string().trim().min(1),
  StructuredSummaryValueSchema,
);
```

### 2.3. `SourceSummary`

```ts
type SourceSummary = {
  source_id: SourceId;
  source_label: SourceLabel;
};
```

## 3. Packet schemas

### 3.1. `GlossaryEntry`

```ts
type GlossaryEntry = {
  term: NonEmptyString;
  definition: NonEmptyString;
  aliases: NonEmptyString[];
};
```

Rules:

- `aliases` unique after trim

### 3.2. `Claim`

```ts
type Claim = {
  claim_key: ClaimKey;
  title: NonEmptyString;
  claim_class: NonEmptyString;
  commitment: NonEmptyString;
  source_ids: SourceId[];
};
```

### 3.3. `Contract`

```ts
type Contract = {
  contract_key: ContractKey;
  title: NonEmptyString;
  owner: NonEmptyString;
  versioning_strategy: NonEmptyString;
  reconciliation_strategy: NonEmptyString;
  deprecation_window: NonEmptyString;
  retirement_condition: NonEmptyString;
};
```

### 3.4. `DataDomain`

```ts
type DataDomain = {
  data_domain_key: DataDomainKey;
  title: NonEmptyString;
  data_class: NonEmptyString;
  owners: NonEmptyString[];
};
```

### 3.5. `QualityAttribute`

```ts
type QualityAttribute = {
  quality_attribute_key: QualityAttributeKey;
  title: NonEmptyString;
  quality_class: NonEmptyString;
  target: NonEmptyString;
  applies_to_item_keys: ItemKey[];
  owner_keys: NonEmptyString[];
  source_ids: SourceId[];
};
```

### 3.6. `PolicyDecision`

```ts
type PolicyDecision = {
  policy_decision_key: PolicyDecisionKey;
  title: NonEmptyString;
  policy_surface: NonEmptyString;
  decision_state: NonEmptyString;
  owner: NonEmptyString;
  source_ids: SourceId[];
  related_item_keys: ItemKey[];
};
```

### 3.7. `PacketContext`

```ts
type PacketContext = {
  glossary: GlossaryEntry[];
  key_strategy: KeyStrategy;
  target_system: StructuredSummaryEntry[];
  as_built: StructuredSummaryEntry[];
  claims: Claim[];
  contracts: Contract[];
  data_domains: DataDomain[];
  quality_attributes: QualityAttribute[];
  policy_decisions: PolicyDecision[];
};
```

### 3.8. `PacketItem`

```ts
type PacketItem = {
  item_key: ItemKey;
  title: NonEmptyString;
  type: NonEmptyString;
  delivery_state: DeliveryState;
  gaps: NonEmptyString[];
  depends_on_keys: ItemKey[];
  origin_source_ids: SourceId[];
  specification_source_ids: SourceId[];
  plan_source_ids: SourceId[];
  implementation_source_ids: SourceId[];
  test_source_ids: SourceId[];
  claim_keys: ClaimKey[];
  contract_keys: ContractKey[];
  data_domain_keys: DataDomainKey[];
  quality_attribute_keys: QualityAttributeKey[];
  policy_decision_keys: PolicyDecisionKey[];
};
```

Rules:

- all arrays required, even when empty;
- `gaps` stores only authored gaps;
- no derived fields allowed.

### 3.9. `PacketFile`

```ts
type PacketFile = {
  context: PacketContext;
  items: PacketItem[];
};
```

Rules:

- `items` may be empty only for purely context-carrying packets if repository explicitly allows it;
- otherwise semantic validation may require `items.length > 0`.

## 4. Patch schemas

### 4.1. `PatchMetadata`

```ts
type PatchMetadata = {
  patch_id: PatchId;
  created_at: IsoUtcTimestamp;
  sequence: Sequence;
  target_item_keys: ItemKey[];
};
```

Rules:

- `sequence` = positive integer;
- `target_item_keys` non-empty unique array.

### 4.2. `ReplaceFieldsOperation`

```ts
type ReplaceFieldsOperation = {
  item_key: ItemKey;
  action: "replace_fields";
  fields: Partial<{
    title: NonEmptyString;
    type: NonEmptyString;
    delivery_state: DeliveryState;
    gaps: NonEmptyString[];
    depends_on_keys: ItemKey[];
    origin_source_ids: SourceId[];
    specification_source_ids: SourceId[];
    plan_source_ids: SourceId[];
    implementation_source_ids: SourceId[];
    test_source_ids: SourceId[];
    claim_keys: ClaimKey[];
    contract_keys: ContractKey[];
    data_domain_keys: DataDomainKey[];
    quality_attribute_keys: QualityAttributeKey[];
    policy_decision_keys: PolicyDecisionKey[];
  }>;
};
```

Rules:

- `fields` must be non-empty;
- forbidden keys:
  - `item_key`
  - `reverse_dependency_keys`
  - `open_todo_ids`
  - `needs_attention`
  - `attention_reason_codes`
  - `attention_reasons`
  - `ready_for_next_step`

### 4.3. `AppendUniqueOperation`

```ts
type AppendUniqueStringField =
  | "gaps"
  | "depends_on_keys"
  | "claim_keys"
  | "contract_keys"
  | "data_domain_keys"
  | "quality_attribute_keys"
  | "policy_decision_keys";

type AppendUniqueSourceField =
  | "origin_source_ids"
  | "specification_source_ids"
  | "plan_source_ids"
  | "implementation_source_ids"
  | "test_source_ids";

type AppendUniqueStringOperation = {
  item_key: ItemKey;
  action: "append_unique";
  field: AppendUniqueStringField;
  values: NonEmptyString[];
};

type AppendUniqueSourceOperation = {
  item_key: ItemKey;
  action: "append_unique";
  field: AppendUniqueSourceField;
  values: SourceId[];
};

type AppendUniqueOperation =
  | AppendUniqueStringOperation
  | AppendUniqueSourceOperation;
```

### 4.4. `RemoveValuesOperation`

```ts
type RemoveValuesStringOperation = {
  item_key: ItemKey;
  action: "remove_values";
  field: AppendUniqueStringField;
  values: NonEmptyString[];
};

type RemoveValuesSourceOperation = {
  item_key: ItemKey;
  action: "remove_values";
  field: AppendUniqueSourceField;
  values: SourceId[];
};

type RemoveValuesOperation =
  | RemoveValuesStringOperation
  | RemoveValuesSourceOperation;
```

### 4.5. `RemoveTodoOperation`

```ts
type RemoveTodoOperation = {
  item_key: ItemKey;
  action: "remove_todo";
  todo_ids: TodoId[];
};
```

### 4.6. `RemoveItemOperation`

```ts
type RemoveItemOperation = {
  item_key: ItemKey;
  action: "remove_item";
};
```

### 4.7. `PatchOperation`

```ts
type PatchOperation =
  | ReplaceFieldsOperation
  | AppendUniqueOperation
  | RemoveValuesOperation
  | RemoveTodoOperation
  | RemoveItemOperation;
```

### 4.8. `PatchFile`

```ts
type PatchFile = {
  metadata: PatchMetadata;
  operations: PatchOperation[];
};
```

File-level invariants:

- `operations` must be non-empty;
- every `operations[*].item_key` must belong to `metadata.target_item_keys`;
- `metadata.target_item_keys` must be unique;
- `metadata.sequence` must be a positive integer;
- `metadata.patch_id` must be non-empty;
- `remove-item` requires that every `target_item_key` has a matching `remove_item` operation;
- `patch-item` must not contain `remove_item` or `remove_source_references`.

Semantic command restrictions:

- `patch-item` accepts:
  - `replace_fields`
  - `append_unique`
  - `remove_values`
  - `remove_todo`
- `remove-item` accepts only:
  - `remove_item`
- `source-maintenance` accepts only:
  - `remove_source_references`

## 5. Utility-owned artifact schemas

### 5.1. `RootMarkerFile`

```ts
type RootMarkerFile = {
  schema_version: SchemaVersion;
  tool_name: NonEmptyString;
  created_at: IsoUtcTimestamp;
  layout_version: LayoutVersion;
};
```

### 5.2. `SourceRecord`

```ts
type SourceRecord = {
  source_id: SourceId;
  source_label: SourceLabel;
  path: SourceRelativePosixPath;
  kind: NonEmptyString;
  authority: NonEmptyString;
  note?: NonEmptyString;
  hash: Sha256Hex;
  registered_at: IsoUtcTimestamp;
  last_checked_at: IsoUtcTimestamp;
};
```

### 5.3. `SourceRegistryFile`

```ts
type SourceRegistryFile = {
  schema_version: SchemaVersion;
  created_at: IsoUtcTimestamp;
  updated_at: IsoUtcTimestamp;
  sources: SourceRecord[];
};
```

### 5.4. `AppliedPacketEntry`

```ts
type AppliedPacketEntry = {
  packet_id: PacketId;
  apply_index: ApplyIndex;
  canonical_path: BacklogRelativePosixPath;
  content_hash: Sha256Hex;
  applied_at: IsoUtcTimestamp;
  item_keys: ItemKey[];
};
```

### 5.5. `AppliedPatchEntry`

```ts
type AppliedPatchEntry = {
  patch_id: PatchId;
  apply_index: ApplyIndex;
  canonical_path: BacklogRelativePosixPath;
  content_hash: Sha256Hex;
  sequence: Sequence;
  applied_at: IsoUtcTimestamp;
  kind: PatchKind;
  target_item_keys: ItemKey[];
};
```

### 5.6. `AppliedRegistryFile`

```ts
type AppliedRegistryFile = {
  schema_version: SchemaVersion;
  created_at: IsoUtcTimestamp;
  updated_at: IsoUtcTimestamp;
  next_apply_index: ApplyIndex;
  packets: AppliedPacketEntry[];
  patches: AppliedPatchEntry[];
};
```

### 5.7. `StateItem`

```ts
type StateItem = PacketItem & {
  reverse_dependency_keys: ItemKey[];
  open_todo_ids: TodoId[];
  needs_attention: boolean;
  attention_reason_codes: AttentionReasonCode[];
  attention_reasons: NonEmptyString[];
  ready_for_next_step: boolean;
};
```

Rules:

- `attention_reason_codes` is the primary machine-readable derived layer;
- `attention_reasons` is a denormalized human-readable layer stored alongside codes for direct read responses;
- both arrays must have the same length and matching order.

### 5.8. `Todo`

```ts
type Todo = {
  todo_id: TodoId;
  item_key: ItemKey;
  type: TodoType;
  managed_by: "refresh" | "mutation";
  message: NonEmptyString;
  created_at: IsoUtcTimestamp;
  related_sources: SourceSummary[];
  related_item_keys: ItemKey[];
};
```

Rules:

- only open todo records exist in state;
- resolved todo is removed, not status-flipped.
- `managed_by` is utility-owned and indicates which subsystem is allowed to auto-clean the todo:
  - `refresh`
  - `mutation`
- canonicalization for semantic equality must:
  - sort `related_item_keys`;
  - sort `related_sources` by `source_id`;
  - remove duplicates before comparison;
- deduplication key:
  - `item_key`
  - `type`
  - canonicalized `related_item_keys`
  - canonicalized `related_sources`
- `managed_by` does not participate in the semantic equality key; when semantic effect matches, resulting todo keeps `managed_by = mutation` if either side is mutation-managed.

### 5.9. `StateFile`

```ts
type StateFile = {
  schema_version: SchemaVersion;
  created_at: IsoUtcTimestamp;
  updated_at: IsoUtcTimestamp;
  last_refresh_at: IsoUtcTimestamp | null;
  context: PacketContext;
  items: StateItem[];
  todos: Todo[];
};
```

## 6. Common response helper schemas

### 6.1. `CommandSuggestion`

```ts
type CommandSuggestion = {
  command:
    | "status"
    | "report"
    | "items"
    | "search"
    | "gaps"
    | "queue"
    | "attention"
    | "refresh";
  args: string[];
  reason: NonEmptyString;
};
```

### 6.2. Specialized mutation count DTOs

```ts
type PacketMutationCounts = {
  added: NonNegativeInt;
  removed: NonNegativeInt;
  todo_created: NonNegativeInt;
  todo_updated: NonNegativeInt;
};

type PatchItemMutationCounts = {
  updated: NonNegativeInt;
  todo_created: NonNegativeInt;
  todo_updated: NonNegativeInt;
  todo_removed: NonNegativeInt;
};

type RemoveItemMutationCounts = {
  removed: NonNegativeInt;
  todo_created: NonNegativeInt;
  todo_updated: NonNegativeInt;
  todo_removed: NonNegativeInt;
};

type RefreshMutationCounts = {
  changed_sources: NonNegativeInt;
  todo_created: NonNegativeInt;
  todo_updated: NonNegativeInt;
  todo_removed: NonNegativeInt;
};

type UpdateSourcePathMutationCounts = RefreshMutationCounts;

type RemoveSourceMutationCounts = {
  updated: NonNegativeInt;
  todo_created: NonNegativeInt;
  todo_updated: NonNegativeInt;
  todo_removed: NonNegativeInt;
};
```

### 6.3. `ItemComputedState`

```ts
type ItemComputedState = {
  needs_attention: boolean;
  attention_reason_codes: AttentionReasonCode[];
  attention_reasons: NonEmptyString[];
  ready_for_next_step: boolean;
};
```

### 6.4. `ItemContextSummary`

```ts
type ItemContextSummary = {
  claim_keys: ClaimKey[];
  contract_keys: ContractKey[];
  data_domain_keys: DataDomainKey[];
  quality_attribute_keys: QualityAttributeKey[];
  policy_decision_keys: PolicyDecisionKey[];
};
```

## 7. Command input/output DTOs

Ниже — нормализованные command DTOs после argv parsing.

### 7.1. `InitCommandInput` / `InitCommandOutput`

```ts
type InitCommandInput = {
  path: CliPathInput;
};

type InitCommandOutput = {
  path: NormalizedFsPath;
  root_marker_path: NormalizedFsPath;
  agents_path: NormalizedFsPath;
};
```

### 7.2. `RegisterSourceCommandInput` / `RegisterSourceCommandOutput`

```ts
type RegisterSourceCommandInput = {
  path: CliPathInput;
  kind: NonEmptyString;
  authority: NonEmptyString;
  note?: NonEmptyString;
};

type RegisterSourceCommandOutput = {
  source_id: SourceId;
  source_label: SourceLabel;
  path: NormalizedFsPath;
  kind: NonEmptyString;
  authority: NonEmptyString;
  note?: NonEmptyString;
  hash: Sha256Hex;
};
```

Note:

- this document follows the stricter public contract from `utility-spec.ru.md`;
- examples in `process-cli.ru.md` for source-related commands are UX-simplified and should not override these DTO shapes.

### 7.3. `ListSourcesCommandInput` / `ListSourcesCommandOutput`

```ts
type ListSourcesCommandInput = {
  item_key?: ItemKey;
  path?: CliPathInput;
};

type RegisteredSourceOutput = {
  source_id: SourceId;
  source_label: SourceLabel;
  path: NormalizedFsPath;
  kind: NonEmptyString;
  authority: NonEmptyString;
  note?: NonEmptyString;
  hash: Sha256Hex;
};

type ListSourcesCommandOutput = RegisteredSourceOutput[];
```

### 7.3.1. `UpdateSourcePathCommandInput` / `UpdateSourcePathCommandOutput`

```ts
type SourceSelectorInput =
  | { kind: "source_id"; source_id: SourceId }
  | { kind: "source_label"; source_label: SourceLabel }
  | { kind: "source_path"; source_path: CliPathInput };

type UpdateSourcePathCommandInput = {
  selector: SourceSelectorInput;
  new_path: CliPathInput;
  dry_run?: boolean;
};

type UpdateSourcePathCommandOutput = RegisteredSourceOutput & {
  dry_run: boolean;
  previous_path: NormalizedFsPath;
  hash_changed: boolean;
  counts: UpdateSourcePathMutationCounts;
  todo_created: ItemKey[];
  todo_updated: ItemKey[];
  todo_removed: ItemKey[];
  next_commands: CommandSuggestion[];
};
```

### 7.3.2. `RemoveSourceCommandInput` / `RemoveSourceCommandOutput`

```ts
type RemoveSourceCommandInput = {
  selector: SourceSelectorInput;
  dry_run?: boolean;
};

type RemoveSourceCommandOutput = RegisteredSourceOutput & {
  dry_run: boolean;
  canonical_patch_path?: NormalizedFsPath;
  canonical_patch_purpose?: "immutable_replay_artifact";
  removed: boolean;
  counts: RemoveSourceMutationCounts;
  updated_item_keys: ItemKey[];
  todo_created: ItemKey[];
  todo_updated: ItemKey[];
  todo_removed: ItemKey[];
  next_commands: CommandSuggestion[];
};
```

### 7.4. `TemplateCommandInput` / `TemplateCommandOutput`

```ts
type TemplatePacketCommandInput = {
  mode: "packet";
  out: CliPathInput;
};

type TemplatePatchCommandInput = {
  mode: "patch";
  out: CliPathInput;
  item_keys: ItemKey[];
};

type TemplateCommandInput =
  | TemplatePacketCommandInput
  | TemplatePatchCommandInput;

type TemplateCommandOutput = {
  mode: "packet" | "patch";
  output_path: NormalizedFsPath;
};
```

### 7.5. `PacketCommandInput` / `PacketCommandOutput`

```ts
type PacketCommandInput = {
  path: CliPathInput;
  dry_run?: boolean;
};

type PacketCommandOutput = {
  dry_run: boolean;
  authored_packet_path: NormalizedFsPath;
  canonical_packet_path?: NormalizedFsPath;
  canonical_packet_purpose?: "immutable_import_copy";
  counts: PacketMutationCounts;
  added: ItemKey[];
  removed: ItemKey[];
  todo_created: ItemKey[];
  todo_updated: ItemKey[];
  next_commands: CommandSuggestion[];
};
```

### 7.6. `PatchItemCommandInput` / `PatchItemCommandOutput`

```ts
type PatchItemCommandInput = {
  patch: CliPathInput;
  dry_run?: boolean;
};

type PatchItemCommandOutput = {
  dry_run: boolean;
  authored_patch_path?: NormalizedFsPath;
  canonical_patch_path?: NormalizedFsPath;
  canonical_patch_purpose?: "immutable_replay_artifact";
  counts: PatchItemMutationCounts;
  updated: ItemKey[];
  todo_created: ItemKey[];
  todo_updated: ItemKey[];
  todo_removed: ItemKey[];
  next_commands: CommandSuggestion[];
};
```

### 7.7. `RemoveItemCommandInput` / `RemoveItemCommandOutput`

```ts
type RemoveItemCommandInput = {
  patch: CliPathInput;
  dry_run?: boolean;
};

type RemoveItemCommandOutput = {
  dry_run: boolean;
  authored_patch_path?: NormalizedFsPath;
  canonical_patch_path?: NormalizedFsPath;
  canonical_patch_purpose?: "immutable_replay_artifact";
  counts: RemoveItemMutationCounts;
  removed: ItemKey[];
  todo_created: ItemKey[];
  todo_updated: ItemKey[];
  todo_removed: ItemKey[];
  next_commands: CommandSuggestion[];
};
```

### 7.8. `RefreshCommandInput` / `RefreshCommandOutput`

```ts
type RefreshCommandInput =
  | { kind: "all" }
  | { kind: "item"; item_key: ItemKey }
  | { kind: "source_id"; source_id: SourceId }
  | { kind: "source_label"; source_label: SourceLabel }
  | { kind: "source_path"; source_path: CliPathInput };

type RefreshCommandOutput = {
  counts: RefreshMutationCounts;
  changed_sources: SourceSummary[];
  todo_created: ItemKey[];
  todo_updated: ItemKey[];
  todo_removed: ItemKey[];
  next_commands: CommandSuggestion[];
};
```

### 7.9. `StatusCommandInput` / `StatusCommandOutput`

```ts
type StatusCommandInput = {
  refresh?: boolean;
};

type CanonicalArtifactIntegrity = {
  applied_canonical_paths_exist: boolean;
  missing_canonical_paths: Array<{
    artifact_kind: "packet" | "patch";
    canonical_path: NormalizedFsPath;
    packet_id?: string;
    patch_id?: string;
    apply_index: NonNegativeInt;
    sequence?: NonNegativeInt;
  }>;
};

type StatusCommandOutput = {
  total_items: NonNegativeInt;
  last_refresh_at: IsoUtcTimestamp | null;
  defined_count: NonNegativeInt;
  specified_count: NonNegativeInt;
  planned_count: NonNegativeInt;
  implemented_count: NonNegativeInt;
  gaps_count: NonNegativeInt;
  needs_attention_count: NonNegativeInt;
  ready_for_next_step_count: NonNegativeInt;
  open_todo_count: NonNegativeInt;
  artifact_integrity: CanonicalArtifactIntegrity;
};
```

### 7.10. `ReportCommandInput` / `ReportCommandOutput`

```ts
type ReportCommandInput = {};

type ReportCommandOutput = {
  report_path: NormalizedFsPath;
  generated_at: IsoUtcTimestamp;
  item_count: NonNegativeInt;
};
```

### 7.11. `ItemsCommandInput` / `ItemsCommandOutput`

```ts
type ItemsCommandInput = {
  item_keys: ItemKey[];
};

type ItemCard = {
  item: PacketItem;
  reverse_dependency_keys: ItemKey[];
  source_summaries: SourceSummary[];
  context: ItemContextSummary;
  computed_state: ItemComputedState;
  todo: Todo[];
};

type ItemsCommandOutput = ItemCard[];
```

### 7.12. `SearchCommandInput` / `SearchCommandOutput`

```ts
type SearchCommandInput = {
  source_ids?: SourceId[];
  delivery_state?: DeliveryState;
  needs_attention?: boolean;
  ready_for_next_step?: boolean;
  claim_keys?: ClaimKey[];
  contract_keys?: ContractKey[];
  data_domain_keys?: DataDomainKey[];
  quality_attribute_keys?: QualityAttributeKey[];
  policy_decision_keys?: PolicyDecisionKey[];
};

type SearchResult = {
  item_key: ItemKey;
  title: NonEmptyString;
  type: NonEmptyString;
  delivery_state: DeliveryState;
  needs_attention: boolean;
  ready_for_next_step: boolean;
  attention_reason_codes: AttentionReasonCode[];
  attention_reasons: NonEmptyString[];
  source_summaries: SourceSummary[];
  match_reasons: NonEmptyString[];
};

type SearchCommandOutput = SearchResult[];
```

### 7.13. `GapsCommandInput` / `GapsCommandOutput`

```ts
type GapsCommandInput = {
  item_key?: ItemKey;
};

type GapsEntry = {
  item_key: ItemKey;
  title: NonEmptyString;
  gaps: NonEmptyString[];
};

type GapsCommandOutput = GapsEntry[];
```

### 7.14. `QueueCommandInput` / `QueueCommandOutput`

```ts
type QueueCommandInput = {};

type QueueChain = {
  root_item_key: ItemKey;
  items: ItemKey[];
  ordering_rule: [
    "depth",
    "downstream_dependency_count",
    "item_key",
  ];
};

type QueueCommandOutput = QueueChain[];
```

### 7.15. `AttentionCommandInput` / `AttentionCommandOutput`

```ts
type AttentionCommandInput = {};

type AttentionEntry = {
  item_key: ItemKey;
  title: NonEmptyString;
  attention_reason_codes: AttentionReasonCode[];
  attention_reasons: NonEmptyString[];
  source_summaries: SourceSummary[];
};

type AttentionCommandOutput = AttentionEntry[];
```

### 7.16. `DeleteBacklogCommandInput` / `DeleteBacklogCommandOutput`

```ts
type DeleteBacklogCommandInput = {
  confirm: true;
};

type DeleteBacklogCommandOutput = {
  deleted_path: NormalizedFsPath;
  deleted: true;
};
```

## 8. Error payload schema

### 8.1. `ErrorPayload`

```ts
type ErrorPayload = {
  error: {
    code: NonEmptyString;
    message: NonEmptyString;
    details?: Record<string, unknown>;
    hint?: NonEmptyString;
  };
};
```

Schema notes:

- `error` exact object;
- `details` is the only intentionally loose map;
- `code` must be stable and machine-readable.

### 8.2. Recommended error code enum

В коде стоит завести `const` enum-like union минимум для уже зафиксированных кодов:

```ts
type ErrorCode =
  | "BE_ROOT_NOT_FOUND"
  | "BE_ROOT_ALREADY_EXISTS"
  | "BE_ROOT_NOT_EMPTY"
  | "BE_INVALID_JSON"
  | "BE_SCHEMA_INVALID"
  | "BE_INPUT_FILE_NOT_FOUND"
  | "BE_SOURCE_NOT_FOUND"
  | "BE_SOURCE_FILE_MISSING"
  | "BE_SOURCE_READ_FAILED"
  | "BE_SOURCE_KIND_INVALID"
  | "BE_SOURCE_AUTHORITY_INVALID"
  | "BE_PACKET_ITEM_ALREADY_EXISTS"
  | "BE_PACKET_DUPLICATE_ITEM_KEYS"
  | "BE_CONTEXT_CONFLICT_GLOSSARY"
  | "BE_CONTEXT_CONFLICT_ENTITY"
  | "BE_DEPENDENCY_NOT_FOUND"
  | "BE_PATCH_TARGET_NOT_FOUND"
  | "BE_PATCH_ID_CONFLICT"
  | "BE_PATCH_SEQUENCE_CONFLICT"
  | "BE_PATCH_OPERATION_INVALID"
  | "BE_TODO_REFRESH_MANAGED"
  | "BE_TODO_NOT_FOUND"
  | "BE_ITEM_NOT_FOUND"
  | "BE_CANONICAL_WRITE_FAILED"
  | "BE_CANONICAL_ARTIFACT_MISSING"
  | "BE_REPORT_WRITE_FAILED"
  | "BE_TEMPLATE_OUTPUT_INVALID"
  | "BE_DELETE_CONFIRM_REQUIRED"
  | "BE_MUTATION_LOCKED"
  | "BE_PLATFORM_UNSUPPORTED"
  | "BE_REBUILD_REPLAY_FAILED"
  | "BE_INTERNAL_STATE_CORRUPT";
```

## 9. Zod naming convention

Рекомендуемая naming-схема в коде:

- `PacketFileSchema`
- `PatchFileSchema`
- `SourceRecordSchema`
- `SourceRegistryFileSchema`
- `AppliedRegistryFileSchema`
- `StateFileSchema`
- `TodoSchema`
- `InitCommandInputSchema`
- `InitCommandOutputSchema`
- ...
- `ErrorPayloadSchema`

Для каждого schema рядом должен быть экспортирован соответствующий inferred type:

```ts
export type PacketFile = z.infer<typeof PacketFileSchema>;
```

## 10. Минимальный набор schema-level тестов

Минимум должны существовать tests на:

- accept valid `.backlog.json`
- reject `.backlog.json` with unknown field
- reject non-UTC timestamp like `2026-04-03T12:00:00+02:00`
- accept valid packet
- reject packet with unknown top-level field
- reject packet item with derived field
- reject patch with empty `target_item_keys`
- reject patch operation whose `item_key` is outside `target_item_keys`
- reject `patch-item` with `remove_item`
- reject `remove-item` patch with incomplete coverage of `target_item_keys`
- reject `remove-item` patch with non-`remove_item` operation
- accept valid `SourceRecord`
- reject invalid `Sha256Hex`
- accept valid `StateFile`
- reject `StateItem` without derived fields
- accept valid `ErrorPayload`
- reject output object with unknown field where schema is exact
