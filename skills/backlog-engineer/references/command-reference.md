# Command Reference

This file gives the agent a stable per-command contract without relying on working documents.

## `init`

Use when backlog does not exist yet.

Creates:

- backlog root directory;
- `.backlog.json`;
- `AGENTS.md`;
- utility-owned state artifacts;
- `packets/`, `patches/`, and report-artifact directories.

Expected response:

```json
{
  "path": "<backlog_dir>",
  "root_marker_path": "<backlog_dir>/.backlog.json",
  "agents_path": "<backlog_dir>/AGENTS.md"
}
```

## `register-source`

Use when a document must become part of backlog inputs.

Input fields:

- `--path`
- `--kind`
- `--authority`
- optional `--note`

Expected response shape:

```json
{
  "source_id": "<uuid>",
  "source_label": "<readable_label>",
  "path": "<normalized_path>",
  "kind": "<source_kind>",
  "authority": "<source_authority>",
  "note": "<readable_note>",
  "hash": "<content_hash>"
}
```

Behavior:

- returns existing source if the normalized path is already registered;
- `path` is stored as a normalized POSIX path relative to backlog root and may contain `..` for external source files;
- does not create a duplicate for the same normalized path.
- do not run `register-source` in parallel with other mutating commands for the same backlog root.

## `list-sources`

Use when `source_id` or `source_label` is needed.

Supported scopes:

- all sources;
- by `--item-key`;
- by `--path`.

Returns an array of registered source records.

## `template`

Use before freehand authoring when a skeleton helps.

Supported modes:

- `template packet`
- `template patch`

`template packet` should create a packet skeleton with `context` and `items`.

`template patch` should create a patch skeleton with:

- `patch_id`
- `created_at`
- `sequence`
- `target_item_keys`
- `operations`

`template patch` must keep draft generation collision-safe:

- generated `patch_id` should be unique even before the patch is ever applied;
- default directory output starts with `<sequence>-patch.template.json`;
- if that draft file already exists, the utility should choose a unique suffixed basename instead of overwriting it.

## `packet`

Use only for new tasks.

Behavior:

- reads the packet;
- validates shape;
- fails if any `item_key` already exists;
- adds new tasks;
- rebuilds graph edges from `depends_on_keys`;
- updates derived state and utility-owned `todo`.

Supports:

- `--dry-run`

Compact response should include:

- `counts`
- `added`
- `removed` as an always-empty compatibility bucket
- `todo_created`
- `todo_updated`
- `dry_run`
- `next_commands`

Interpretation:

- the authored packet remains your draft file;
- the utility stores a separate immutable canonical import copy;
- current backlog truth is still read from the utility.

## `patch-item`

Use only for existing tasks that changed.

Behavior:

- validates patch metadata;
- validates `target_item_keys`;
- applies operations to existing tasks;
- rebuilds affected graph region;
- updates derived state and utility-owned `todo`.

Supports:

- `--dry-run`

Compact response should include:

- `counts`
- `updated`
- `todo_created`
- `todo_updated`
- `todo_removed`
- `dry_run`
- `next_commands`

## `remove-item`

Use only when existing tasks are obsolete.

Behavior:

- validates removal patch metadata;
- validates `target_item_keys`;
- removes tasks;
- updates dependent tasks;
- updates derived state and utility-owned `todo`.

Supports:

- `--dry-run`

Compact response should include:

- `counts`
- `removed`
- `todo_created`
- `todo_updated`
- `todo_removed`
- `dry_run`
- `next_commands`

## `refresh`

Use when source-derived state may have changed.

Supported scopes:

- global `refresh`
- `refresh --item-key`
- `refresh --source-id`
- `refresh --source-label`
- `refresh --source-path`

Behavior:

- recomputes source hashes in the requested scope;
- finds the affected task set;
- updates derived state and utility-owned `todo`.

Compact response should include:

- `counts`
- `changed_sources`
- `todo_created`
- `todo_updated`
- `todo_removed`
- `next_commands`

## `status`

Use for a short overall summary in dialog.

`status --refresh` should:

- perform a global refresh;
- then return ordinary status.

Expected fields:

- total task count;
- `last_refresh_at`;
- counts by `delivery_state`;
- count of tasks with `gaps`;
- count of tasks with `needs_attention`;
- count of tasks with `ready_for_next_step`;
- count of tasks with open `todo`.

## `report`

Use only when the operator explicitly wants a file on disk.

Should generate a standard report artifact without `--out`.

Report should contain:

- short system summary;
- backlog metrics;
- Mermaid task graph;
- needs-attention section;
- ready-for-next-step section;
- full human-readable task catalog.

## `items`

Use when task keys are already known and full cards are needed.

Input:

- `--item-keys "<k1>,<k2>"`

Return an array even for one key.

Each item card should include:

- task fields;
- dependencies;
- reverse dependencies;
- linked sources with both `source_id` and `source_label`;
- linked context entities;
- `needs_attention`;
- `attention_reasons`;
- `ready_for_next_step`;
- open `todo`.

## `queue`

Use `queue` as the answer to “what can be taken next”.

Interpretation:

- it returns ordered chains, not a flat set of all ready tasks;
- queue chain count is not expected to equal the count of all `ready_for_next_step` tasks.

## `search`

Use when keys are not yet known or filtering is needed.

Return compact candidate summaries, not full cards.

At minimum, each result should include:

- `item_key`
- `title`
- `type`
- `delivery_state`
- `needs_attention`
- `ready_for_next_step`
- `attention_reasons`
- `source_summaries`
- `match_reasons`

## `gaps`

Use when explicit blockers are needed.

Supported scopes:

- all tasks with gaps;
- one task via `--item-key`.

## `queue`

Use when the operator asks what can be taken next.

Returns:

- ordered chains, not a flat list.

Each chain should identify:

- root task;
- ordered item list;
- ordering rule.

Only tasks should appear there that:

- are not implemented;
- have no unresolved dependencies;
- have no gaps;
- are `ready_for_next_step = true`.

## `attention`

Use when the operator wants review-oriented work.

Each result should include:

- `item_key`
- `title`
- `attention_reasons`
- optionally compact source summaries

Reason order should be:

1. source change
2. dependency change
3. context change
4. explicit gaps

## `delete-backlog`

Use only on direct operator request.

Treat as destructive and confirm intent before use.
