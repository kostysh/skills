# Data Model

This file defines the stable data shapes the agent is expected to author.

## Naming rules

Use these naming rules consistently:

- `*_key` = agent-authored stable business key
- `*_id` = utility-authored technical identifier

Examples:

- `item_key`
- `claim_key`
- `contract_key`
- `source_id`
- `todo_id`

Never invent technical IDs in authored packet or patch files.

## Source registration model

Registered sources are utility-owned records. The agent does not invent `source_id`.

Expected returned source shape:

```json
{
  "id": "<uuid>",
  "source_label": "docs/architecture/system.md",
  "path": "<normalized_path>",
  "kind": "<source_kind>",
  "authority": "<source_authority>",
  "note": "<readable_note>",
  "hash": "<content_hash>"
}
```

### Starter source kinds

Use a small controlled set unless a repository has already standardized a different one:

- `architecture`
- `module`
- `adr`
- `technical-decision`
- `integration`
- `operations`
- `planning`
- `specification`

### Starter source authorities

Use a small controlled set unless a repository has already standardized a different one:

- `authoritative`
- `supporting`
- `derived`

Use `authoritative` only when the document is a true source of requirements or design truth for the scoped work.

## Packet shape

Use packet files to add new tasks only.

```json
{
  "context": {
    "glossary": [],
    "key_strategy": {},
    "target_system": [],
    "as_built": [],
    "claims": [],
    "contracts": [],
    "data_domains": [],
    "quality_attributes": [],
    "policy_decisions": []
  },
  "items": []
}
```

### `context.glossary`

Each glossary entry should look like this:

```json
{
  "term": "<term_title>",
  "definition": "<term_definition>",
  "aliases": ["<term_alias>"]
}
```

Use glossary entries for terms that the task graph depends on semantically.

### `context.key_strategy`

Use `key_strategy` to document how keys are formed.

At minimum, explain:

- how module or area prefixes are chosen;
- how task keys stay stable across updates;
- how context keys such as `claim_key` and `contract_key` are named.

### `context.target_system`

Optional, short, structured summary of target architecture.

Use it:

- in the initial backlog packet;
- or when it materially helps explain task extraction.

Do not turn it into a long prose block.

### `context.as_built`

Optional, short, structured summary of current known implementation reality.

Use it only when needed to explain why tasks are required or why existing tasks must change.

### `context.claims`

Use `claims` for requirements, obligations, or architectural assertions that tasks should cover.

```json
{
  "claim_key": "<claim_key>",
  "title": "<claim_title>",
  "claim_class": "<claim_class>",
  "commitment": "<claim_commitment>",
  "source_ids": ["<source_id>"]
}
```

Starter `claim_class` values:

- `behavior`
- `constraint`
- `quality`
- `operational`

Starter `commitment` values:

- `required`
- `planned`
- `optional`

### `context.contracts`

Use `contracts` for interfaces and integrations that tasks touch.

```json
{
  "contract_key": "<contract_key>",
  "title": "<title>",
  "owner": "<owner>",
  "versioning_strategy": "<versioning_strategy>",
  "reconciliation_strategy": "<reconciliation_strategy>",
  "deprecation_window": "<deprecation_window>",
  "retirement_condition": "<retirement_condition>"
}
```

### `context.data_domains`

Use `data_domains` for data ownership and boundaries.

```json
{
  "data_domain_key": "<data_domain_key>",
  "title": "<title>",
  "data_class": "<data_class>",
  "owners": ["<owner>"]
}
```

### `context.quality_attributes`

Use `quality_attributes` for non-functional constraints.

```json
{
  "quality_attribute_key": "<quality_attribute_key>",
  "title": "<title>",
  "quality_class": "<quality_class>",
  "target": "<target>",
  "applies_to_item_keys": ["<item_key>"],
  "owner_keys": ["<owner_key>"],
  "source_ids": ["<source_id>"]
}
```

Starter `quality_class` values:

- `performance`
- `reliability`
- `security`
- `observability`
- `operability`
- `maintainability`

### `context.policy_decisions`

Use `policy_decisions` for project-level rules and restrictions.

```json
{
  "policy_decision_key": "<policy_decision_key>",
  "title": "<title>",
  "policy_surface": "<policy_surface>",
  "decision_state": "<decision_state>",
  "owner": "<owner>",
  "source_ids": ["<source_id>"],
  "related_item_keys": ["<item_key>"]
}
```

Starter `decision_state` values:

- `required`
- `approved`
- `deferred`
- `superseded`

## Task shape

Each `items[]` entry is an atomic task.

```json
{
  "item_key": "<item_key>",
  "title": "<title>",
  "type": "<item_type>",
  "delivery_state": "<delivery_state>",
  "gaps": ["<gap_description>"],
  "depends_on_keys": ["<item_key>"],
  "origin_source_ids": ["<source_id>"],
  "specification_source_ids": ["<source_id>"],
  "plan_source_ids": ["<source_id>"],
  "implementation_source_ids": ["<source_id>"],
  "test_source_ids": ["<source_id>"],
  "claim_keys": ["<claim_key>"],
  "contract_keys": ["<contract_key>"],
  "data_domain_keys": ["<data_domain_key>"],
  "quality_attribute_keys": ["<quality_attribute_key>"],
  "policy_decision_keys": ["<policy_decision_key>"]
}
```

### Task fields

| Field | Meaning | Authoring rule |
| --- | --- | --- |
| `item_key` | stable task key | choose it once and keep it stable across later patches |
| `title` | human-readable task title | make it implementation-meaningful, not vague module prose |
| `type` | task category | keep one consistent taxonomy inside the backlog |
| `delivery_state` | coarse lifecycle state | use a small stable set such as `defined`, `specified`, `planned`, `implemented` |
| `gaps` | explicit missing information | if non-empty, the task is blocked |
| `depends_on_keys` | blockers from other tasks | list only real blocking dependencies |
| `origin_source_ids` | source documents from which the task comes | always populate for traceability |
| other `*_source_ids` | sources relevant to later stages | use only when that stage is explicitly grounded in a source |
| `claim_keys` etc. | context links | link only the context that truly constrains or explains the task |

### Atomicity rules

A task is atomic when:

- it has one clear goal;
- it has one clear result;
- it can be separately specified;
- it can be separately planned;
- it can be separately implemented.

If a node cannot be handed off cleanly to specification or implementation, split it before authoring the packet.

### Recommended starter task types

If the repository has no stricter taxonomy yet, use a small working set such as:

- `feature`
- `api`
- `integration`
- `data`
- `migration`
- `ui`
- `infra`
- `security`
- `observability`

Keep the chosen set consistent inside one backlog.

### Starter delivery states

Use a small stable set:

- `defined`
- `specified`
- `planned`
- `implemented`

## Patch shape

Use patch files only for existing tasks.

The utility concept expects patch metadata plus one or more operations.

```json
{
  "metadata": {
    "patch_id": "<patch_id>",
    "created_at": "<iso8601>",
    "sequence": "<monotonic_sequence>",
    "target_item_keys": ["<item_key>"]
  },
  "operations": []
}
```

### Patch metadata

| Field | Meaning | Rule |
| --- | --- | --- |
| `patch_id` | stable patch identifier | keep unique inside one backlog |
| `created_at` | creation timestamp | use ISO 8601 UTC |
| `sequence` | deterministic ordering field | keep monotonic within the backlog |
| `target_item_keys` | tasks this patch is intended to touch | list all directly targeted tasks |

### Patch operations

Use a small explicit operation vocabulary.

Recommended starter operations:

- `replace_fields`
- `append_unique`
- `remove_values`
- `remove_todo`
- `remove_item`

Example update operation:

```json
{
  "item_key": "auth-session-timeout",
  "action": "replace_fields",
  "fields": {
    "title": "Enforce session timeout in auth middleware",
    "delivery_state": "specified",
    "gaps": []
  }
}
```

Example array update operation:

```json
{
  "item_key": "session-ui",
  "action": "append_unique",
  "field": "depends_on_keys",
  "values": ["auth-session-timeout"]
}
```

Example todo close operation:

```json
{
  "item_key": "session-ui",
  "action": "remove_todo",
  "todo_ids": ["<todo_id>"]
}
```

Example remove operation:

```json
{
  "item_key": "legacy-auth-ui",
  "action": "remove_item"
}
```

Use `remove-item` to apply removal patches, even though the file still has patch shape.

## Utility-owned todo model

Open `todo` is utility-owned derived state. The agent may close it through patch workflows but must not author it in packets.

Expected todo shape:

```json
{
  "todo_id": "<todo_id>",
  "type": "review_source_change",
  "message": "<human_readable_reason>",
  "created_at": "<iso8601>",
  "related_sources": [
    {
      "source_id": "<source_id>",
      "source_label": "<source_label>"
    }
  ],
  "related_item_keys": ["<item_key>"]
}
```

Starter `todo.type` values:

- `review_source_change`
- `review_dependency_change`
- `review_context_change`

Do not invent additional todo types unless the repository standardizes them.

## Derived task state

The utility computes these fields when returning task cards:

- `needs_attention`
- `attention_reasons`
- `ready_for_next_step`

Use these rules:

- non-empty `gaps` means blocked;
- open `todo` caused by source, dependency, or context change means review is needed;
- `ready_for_next_step = true` means the task can be taken further.

Expected attention reason order:

1. source change
2. dependency change
3. context change
4. explicit gaps
