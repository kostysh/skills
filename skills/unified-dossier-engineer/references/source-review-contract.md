# Source-review contract

Use this reference when designing source-change handling in the merged skill.

## Purpose

The merged skill must remove the current behavior where a source hash change can immediately flood many linked items with item-level `needs_attention`.

The replacement model is source-first review.

## Core behavior

When a registered source changes:

1. the utility detects the hash change
2. the utility opens or updates a source-review record in `.dossier/backlog/source-review/`
3. the utility does not immediately create a mass item-level `needs_attention` flood
4. the agent reviews the changed source and linked backlog items
5. only then does explicit backlog mutation work or no-op closure happen

## Minimal source-review record

```json
{
  "source_review_id": "<uuid-or-stable-key>",
  "source_id": "<source_id>",
  "source_label": "docs/architecture/auth.md",
  "previous_hash": "<previous_hash>",
  "current_hash": "<current_hash>",
  "status": "open",
  "linked_item_keys": ["auth-core", "auth-session-timeout-enforcement"],
  "linked_item_count": 2,
  "opened_at": "<timestamp>",
  "closed_at": null,
  "resolved_at": null,
  "outcome": "pending",
  "resolution_kind": null,
  "resolution_ref": null
}
```

## Read-model consequences

`refresh --source-*` must return a compact source-review scope rather than a generic item todo flood.

Minimum first-wave shape:

- `changed_sources`
- `source_reviews_created`
- `source_reviews_updated`
- `source_review_ids`
- `next_commands`

`attention` must surface open source-review records before generic item-level review entries.

## Readiness consequences

Open source review blocks readiness for linked items:

- linked items do not count as cleanly ready while unresolved source review exists
- `ready_for_next_step = false` for linked items while source review is open
- item-level review escalation happens only after confirmed backlog mutation work

## Truthful closure

While the record is open:

- `status = open`
- `outcome = pending`

Closing the record requires an explicit outcome:

- `no_backlog_change`
- `patched_existing_items`
- `created_new_item`
- `source_maintenance`

`resolution_kind` must identify the closure path:

- `ack`
- `patch-item`
- `packet`
- `update-source-path`
- `remove-source`

`resolution_ref` must point to the related acknowledgment or mutation artifact/command result.

`resolved_at` must be set only when the outcome is no longer `pending`.

## Canonical no-op path

1. `refresh --source-*`
2. agent reads the changed source and linked items
3. agent concludes `no backlog change`
4. explicit acknowledgment closes the source-review record with:
   - `outcome = no_backlog_change`
   - `resolution_kind = ack`
5. clean confirmation comes from `status`, not from chat-only reasoning

## Negative rules

- do not classify prose changes semantically inside the utility
- do not use NLP-based change typing in the CLI contract
- do not create item-level attention flood as the first automatic effect of a hash change
