# Examples and Templates

Use this file when you need concrete authoring examples instead of just rules.

Important:

- this file is illustrative;
- the normative field-shape rules live in [Data Model](data-model.md);
- when example wording and normative shape ever appear to disagree, follow `data-model.md`.

Template files also live in local assets:

- [Packet template](../assets/packet.template.json)
- [Patch template](../assets/patch.template.json)
- [Removal patch template](../assets/remove-item.patch.template.json)

For one complete first-run scenario, use [First Backlog Walkthrough](first-backlog-walkthrough.md).

Important:

- the packet template is a starter draft, not an apply-ready packet;
- replace placeholder values such as `<source_id_1>` before running `packet`;
- remove starter entries that do not apply to the current backlog slice.

## Example packet

This example adds new auth-related tasks extracted from architecture.

```json
{
  "context": {
    "glossary": [
      {
        "term": "session timeout",
        "definition": "Maximum idle time before a user session must expire.",
        "aliases": ["idle timeout"]
      }
    ],
    "key_strategy": {
      "module_prefix": "auth",
      "item_pattern": "<module>-<capability>-<result>"
    },
    "target_system": [
      {
        "area": "auth",
        "summary": "Session lifecycle is enforced in the auth service.",
        "services": ["auth-api", "session-worker"]
      }
    ],
    "as_built": [
      {
        "area": "auth",
        "implemented_services": ["auth-api"],
        "missing_services": ["session-worker"],
        "session_timeout_enforced": false
      }
    ],
    "claims": [
      {
        "claim_key": "auth-session-timeout",
        "title": "User sessions must expire after configured inactivity.",
        "claim_class": "behavior",
        "commitment": "required",
        "source_ids": ["<source_id_auth_module>"]
      }
    ],
    "contracts": [
      {
        "contract_key": "auth-session-api",
        "title": "Session management HTTP contract",
        "owner": "auth-team",
        "versioning_strategy": "path-versioning",
        "reconciliation_strategy": "backward-compatible",
        "deprecation_window": "90d",
        "retirement_condition": "all callers migrated"
      }
    ],
    "data_domains": [
      {
        "data_domain_key": "auth-session-data",
        "title": "Auth session state",
        "data_class": "application-state",
        "owners": ["auth-team"]
      }
    ],
    "quality_attributes": [
      {
        "quality_attribute_key": "auth-session-observability",
        "title": "Session timeout should be observable in logs and metrics",
        "quality_class": "observability",
        "target": "every forced timeout emits an audit event",
        "applies_to_item_keys": [
          "auth-session-timeout-enforcement",
          "auth-session-timeout-audit"
        ],
        "owner_keys": ["auth-team"],
        "source_ids": ["<source_id_auth_module>"]
      }
    ],
    "policy_decisions": []
  },
  "items": [
    {
      "item_key": "auth-session-timeout-enforcement",
      "title": "Enforce session timeout in auth middleware",
      "type": "feature",
      "delivery_state": "defined",
      "gaps": [],
      "depends_on_keys": [],
      "origin_source_ids": ["<source_id_auth_module>"],
      "specification_source_ids": ["<source_id_auth_module>"],
      "plan_source_ids": [],
      "implementation_source_ids": [],
      "test_source_ids": [],
      "claim_keys": ["auth-session-timeout"],
      "contract_keys": ["auth-session-api"],
      "data_domain_keys": ["auth-session-data"],
      "quality_attribute_keys": ["auth-session-observability"],
      "policy_decision_keys": []
    },
    {
      "item_key": "auth-session-timeout-audit",
      "title": "Emit audit events for forced session timeout",
      "type": "observability",
      "delivery_state": "defined",
      "gaps": [
        "Audit event schema is not yet specified."
      ],
      "depends_on_keys": ["auth-session-timeout-enforcement"],
      "origin_source_ids": ["<source_id_auth_module>"],
      "specification_source_ids": ["<source_id_auth_module>"],
      "plan_source_ids": [],
      "implementation_source_ids": [],
      "test_source_ids": [],
      "claim_keys": ["auth-session-timeout"],
      "contract_keys": [],
      "data_domain_keys": ["auth-session-data"],
      "quality_attribute_keys": ["auth-session-observability"],
      "policy_decision_keys": []
    }
  ]
}
```

## Example update patch

This patch updates existing tasks and closes one open mutation-managed todo.

```json
{
  "metadata": {
    "patch_id": "2026-04-02-001-auth-session-timeout",
    "created_at": "2026-04-02T12:00:00Z",
    "sequence": "2026-04-02-001",
    "target_item_keys": [
      "auth-session-timeout-enforcement",
      "auth-session-timeout-audit"
    ]
  },
  "operations": [
    {
      "item_key": "auth-session-timeout-enforcement",
      "action": "replace_fields",
      "fields": {
        "delivery_state": "specified"
      }
    },
    {
      "item_key": "auth-session-timeout-audit",
      "action": "replace_fields",
      "fields": {
        "gaps": []
      }
    },
    {
      "item_key": "auth-session-timeout-audit",
      "action": "remove_todo",
      "todo_ids": ["<mutation-managed todo_id>"]
    }
  ]
}
```

## Dossier-driven actualization examples

Use these examples when backlog truth changes after dossier-side work.

### After dossier shaping/specification -> `specified`

```json
{
  "metadata": {
    "patch_id": "2026-04-08-001-auth-session-timeout-specified",
    "created_at": "2026-04-08T10:00:00Z",
    "sequence": "2026-04-08-001",
    "target_item_keys": ["auth-session-timeout-enforcement"]
  },
  "operations": [
    {
      "item_key": "auth-session-timeout-enforcement",
      "action": "replace_fields",
      "fields": {
        "delivery_state": "specified"
      }
    }
  ]
}
```

### After dossier planning -> `planned`

```json
{
  "metadata": {
    "patch_id": "2026-04-08-002-auth-session-timeout-planned",
    "created_at": "2026-04-08T11:00:00Z",
    "sequence": "2026-04-08-002",
    "target_item_keys": ["auth-session-timeout-enforcement"]
  },
  "operations": [
    {
      "item_key": "auth-session-timeout-enforcement",
      "action": "replace_fields",
      "fields": {
        "delivery_state": "planned"
      }
    }
  ]
}
```

### After implementation + closure -> `implemented`

```json
{
  "metadata": {
    "patch_id": "2026-04-08-003-auth-session-timeout-implemented",
    "created_at": "2026-04-08T16:00:00Z",
    "sequence": "2026-04-08-003",
    "target_item_keys": ["auth-session-timeout-enforcement"]
  },
  "operations": [
    {
      "item_key": "auth-session-timeout-enforcement",
      "action": "replace_fields",
      "fields": {
        "delivery_state": "implemented"
      }
    }
  ]
}
```

### Dossier discovered blocker or dependency

```json
{
  "metadata": {
    "patch_id": "2026-04-08-004-auth-session-timeout-dependency",
    "created_at": "2026-04-08T17:00:00Z",
    "sequence": "2026-04-08-004",
    "target_item_keys": ["auth-session-timeout-audit"]
  },
  "operations": [
    {
      "item_key": "auth-session-timeout-audit",
      "action": "replace_fields",
      "fields": {
        "depends_on_keys": [
          "auth-session-timeout-enforcement",
          "shared-audit-schema-definition"
        ],
        "gaps": [
          "Shared audit schema must be agreed before timeout audit events can be finalized."
        ]
      }
    }
  ]
}
```

### Dossier discovered context fact

```json
{
  "metadata": {
    "patch_id": "2026-04-08-005-auth-session-timeout-context-fact",
    "created_at": "2026-04-08T17:30:00Z",
    "sequence": "2026-04-08-005",
    "target_item_keys": ["auth-session-timeout-enforcement"]
  },
  "operations": [
    {
      "item_key": "auth-session-timeout-enforcement",
      "action": "append_unique",
      "field": "contract_keys",
      "values": ["audit-event-reason-code-contract"]
    }
  ]
}
```

Use this pattern only when dossier work makes an already existing backlog context entity newly relevant to the selected work.

These examples assume dossier-side work made the new backlog fact explicit.
Use them as backlog actualization patterns, not as dossier-local workflow steps.

## Example removal patch

Use removal patches only when the task is obsolete, not when it merely changed.

```json
{
  "metadata": {
    "patch_id": "2026-04-02-002-remove-legacy-auth-ui",
    "created_at": "2026-04-02T14:10:00Z",
    "sequence": "2026-04-02-002",
    "target_item_keys": ["legacy-auth-ui"]
  },
  "operations": [
    {
      "item_key": "legacy-auth-ui",
      "action": "remove_item"
    }
  ]
}
```

## Example extraction pattern

Use this thought process when converting prose into tasks:

1. Source says: “Sessions must expire after inactivity.”
   - create a behavior claim
   - create enforcement task
2. Source also says: “Timeouts must be auditable.”
   - create observability task
   - add dependency on enforcement task
3. Source does not specify audit schema.
   - add `gap`
   - do not invent the schema

This is the basic move the skill should repeat for each document section.
