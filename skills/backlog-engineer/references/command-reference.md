# Command Reference

This file gives the agent a stable per-command contract without relying on working documents.

## Execution note

Command examples in this skill may use `backlog-engineer ...` as the semantic command form.

If the CLI is not installed in `PATH`, use this fallback command prefix instead:

```bash
node <skill-root>/scripts/backlog-engineer.mjs ...
```

Where:

- `<skill-root>` means the directory that contains this skill's `SKILL.md`

Important:

- this fallback changes only the script path;
- it does not change `cwd`;
- backlog root discovery and relative path resolution still depend on the working directory where the command is executed.

## `init`

Use when backlog does not exist yet.

Creates:

- backlog root directory;
- `.backlog.json`;
- backlog-local `.gitignore`;
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

Behavior notes:

- machine-facing filesystem paths in command output are absolute;
- `init` creates or updates a managed `.gitignore` section that ignores `/.backlog/mutation.lock`;
- if the target directory already contains a single regular `.gitignore`, `init` preserves its existing content and appends or refreshes the managed section instead of overwriting the file.
- if file-backed execution cannot provide safe anchored directory handling for managed artifact writes, `init` fails with `BE_PLATFORM_UNSUPPORTED`.

Cross-skill note:

- `init` establishes the backlog layer only;
- after backlog selection later in the process, downstream dossier work moves to `dossier-engineer`, not to more backlog authoring.

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
  "path": "<absolute_source_path>",
  "kind": "<source_kind>",
  "authority": "<source_authority>",
  "note": "<readable_note>",
  "hash": "<content_hash>"
}
```

Behavior:

- returns existing source if the normalized path is already registered;
- the source registry stores `path` as a normalized POSIX path relative to backlog root and may contain `..` for external source files;
- machine-facing command output returns source `path` as an absolute filesystem path;
- does not create a duplicate for the same normalized path.
- do not run `register-source` in parallel with other mutating commands for the same backlog root.
- if another mutating command already owns the backlog root, expect `BE_MUTATION_LOCKED`.
- if the host runtime cannot provide safe anchored directory handling for utility-owned artifacts, expect `BE_PLATFORM_UNSUPPORTED`.

## `list-sources`

Use when `source_id` or `source_label` is needed.

Supported scopes:

- all sources;
- by `--item-key`;
- by `--path`.

Returns an array of registered source records.

Behavior:

- each returned source record uses an absolute filesystem path in the machine-facing `path` field;
- internal source registry storage remains relative to backlog root.

## `template`

Use before freehand authoring when a skeleton helps.

For exact packet and patch field shapes, use [Data Model](data-model.md) as the normative source.

Supported modes:

- `template packet`
- `template patch`

`template packet` should create a richer starter draft with:

- `context` and `items`;
- starter entries for `target_system` and `as_built`;
- placeholder `source_id` slots;
- starter item/context links that show expected field usage.

The packet template is a draft, not an apply-ready packet. Replace placeholders and remove starter entries that do not apply before running `packet`.

For one end-to-end first-run flow, use [First Backlog Walkthrough](first-backlog-walkthrough.md).

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
- machine-facing `output_path` is absolute.

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

- `authored_packet_path`
- `canonical_packet_path` on real apply
- `canonical_packet_purpose = "immutable_import_copy"` on real apply
- `counts`
- `added`
- `removed` as an always-empty compatibility bucket
- `todo_created`
- `todo_updated`
- `dry_run`
- `next_commands`

Interpretation:

- `authored_packet_path` is the authored draft that the agent supplied;
- `authored_packet_path` and `canonical_packet_path` are absolute filesystem paths in machine-facing output;
- `canonical_packet_path` is the immutable import copy owned by the utility;
- `canonical_packet_purpose = "immutable_import_copy"` means the canonical file is intentional, not clutter;
- the authored packet remains your draft file;
- the utility stores a separate immutable canonical import copy;
- current backlog truth is still read from the utility.

Cross-skill note:

- `packet` is for backlog creation and backlog growth, not for dossier-side lifecycle actualization of already selected work.

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

Cross-skill note:

- `patch-item` is the normal backlog mutation after dossier shaping / planning / implementation when the affected backlog items are already known;
- use it to actualize `delivery_state`, blockers, dependencies, and context facts that dossier work made explicit;
- for truth-changing dossier stages, `patch-item`-driven actualization belongs to the closure contract of that stage, not to an optional later cleanup pass.

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

Cross-skill note:

- use scoped `refresh` after dossier work when updated source documents may have changed backlog-derived state;
- dossier artifacts may support the decision to refresh or patch, but they do not replace architecture or ADR sources as canonical upstream truth;
- `refresh` alone does not actualize `delivery_state` or dossier-discovered blockers, dependencies, or context facts that require an explicit patch on already known backlog items.

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

Cross-skill note:

- use `status` before dossier intake when the operator wants the current backlog picture;
- use `status` again after dossier-side lifecycle changes when you need to confirm the updated backlog state after actualization.

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

Machine-facing output returns `report_path` as an absolute filesystem path.

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

Cross-skill note:

- use `items` to inspect the selected backlog work before dossier intake or after backlog actualization;
- do not treat dossier-local state as a substitute for the canonical item card in the backlog utility.

## `queue`

Use `queue` as the answer to “what can be taken next”.

Interpretation:

- it returns ordered chains, not a flat set of all ready tasks;
- queue chain count is not expected to equal the count of all `ready_for_next_step` tasks.

Cross-skill note:

- use `queue` to choose the next backlog work item;
- use dossier-local `next-step` only after a backlog item has already been selected and handed off.

## `attention`

Use `attention` when the operator needs the review-oriented backlog subset.

Cross-skill note:

- `attention` remains a backlog-side read model;
- read it before dossier intake when you need the current review-oriented backlog signal;
- do not persist `attention` as part of the durable dossier handoff.

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

Cross-skill note:

- use `gaps` before dossier intake when you need the backlog-side blocker picture for the selected work;
- if dossier work discovers a new blocker or unresolved dependency, return here or to `items` after backlog actualization to confirm the updated blocker state.

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

Managed deletion scope:

- `.backlog.json`
- utility-managed section in `.gitignore`
- `AGENTS.md`
- `.backlog/`
- `packets/`
- `patches/`
- `reports/`

If `.gitignore` also contains user rules, `delete-backlog` removes only the managed section and keeps the remaining file content.

Machine-facing output returns `deleted_path` as an absolute filesystem path for the removed backlog root.
