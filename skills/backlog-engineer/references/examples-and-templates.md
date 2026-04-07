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

This patch updates existing tasks and closes one open todo.

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
      "todo_ids": ["<todo_id>"]
    }
  ]
}
```

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
