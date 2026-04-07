# CLI Contract

This file defines the stable command-level contract for the planned backlog utility.

## Directory-root contract

- one backlog equals one directory;
- the utility owns `.backlog.json` in that root;
- the utility also owns `packets/`, `patches/`, and report-artifact directories there;
- `init` should also materialize a local `AGENTS.md` reinforcement file in the backlog root;
- after `init`, commands are expected to run from that directory or its subdirectories;
- the agent should not be required to remember a backlog UUID as normal operating context.

Treat the active backlog directory as the only stable root of truth for utility operations.

## Source handling

Always separate source discovery from task authoring.

- read the source document first;
- register it through `register-source`;
- use `list-sources` whenever the current `source_id` or `source_label` is needed;
- prefer `list-sources --path` or other utility lookups over reconstructing source mappings from packet files.
- source files may live outside the backlog root; the utility persists them as normalized POSIX paths relative to backlog root and such paths may include `..`.

When source scope is known, prefer scoped refresh:

- `refresh --source-id ...`
- `refresh --source-label ...`
- `refresh --source-path ...`

Use `refresh --item-key ...` when the work is task-scoped rather than source-scoped.

## Command boundaries

| Command | Use when | Do not use when |
| --- | --- | --- |
| `init` | backlog does not exist yet | you only need to inspect an existing backlog |
| `register-source` | a document must become part of backlog inputs | you only need to inspect already registered sources |
| `list-sources` | source IDs or labels are needed | task keys are already known and you need full task cards |
| `template` | you need a packet or patch skeleton | you already have a correct packet or patch file |
| `packet` | adding new tasks | changing or deleting existing tasks |
| `patch-item` | changing existing tasks | adding brand-new tasks |
| `remove-item` | removing existing tasks | adding or editing tasks |
| `refresh` | source-derived state may have changed | you only need a static read with no refresh |
| `status` | quick overall summary in chat | operator explicitly asked for a report file |
| `status --refresh` | operator wants overall state right now | only one known source or task needs refresh |
| `report` | operator explicitly asked for a report file | quick dialog answer is enough |
| `search` | task keys are unknown or filtering is needed | task keys are already known |
| `items` | task keys are known and full cards are needed | you only need candidate discovery |
| `gaps` | operator wants explicit blockers | operator asked generally what needs review |
| `attention` | operator wants review-oriented tasks | operator wants all blockers or all runnable work |
| `queue` | operator wants what can be taken next | operator wants full cards or review-only subset |
| `delete-backlog` | operator explicitly wants total removal | any narrower mutation would do |

## Mutating commands

Treat these as mutating commands:

- `packet`
- `patch-item`
- `remove-item`
- `refresh`

They should return compact results, not full task cards.

### Required compact response shape

Expect a compact structured summary with:

- `counts`;
- direct change buckets such as `added`, `updated`, `removed`, or source-change summaries where relevant;
- `todo_created`, `todo_updated`, `todo_removed`;
- `dry_run`;
- `next_commands`, where each entry has:
  - `command`
  - `args`
  - `reason`

Do not expect full task cards or full field-level diffs in these responses.

### Follow-up rule

- if `todo_created > 0` or `todo_updated > 0`, go only to `attention` or `items` for the returned keys;
- if there are no open `todo` changes and the operator asked only for the result, do not perform extra reads.

## Read-model rules

Use these rules in answers:

- `gaps` means blocked;
- open `todo` caused by source, dependency, or context change means review is needed;
- `ready_for_next_step = true` means the task can be taken further.

Keep these boundaries explicit:

- `status` = short dialog summary;
- `report` = full document on disk;
- `search` = keys unknown or filtering needed;
- `items` = keys known and full cards needed;
- `queue` = ordered chains of tasks that can be taken next;
- `attention` = review-oriented subset with utility-provided reasons.

## Scoped checks

For one module or source:

- if the source is known, start with `refresh --source-id ...` or `refresh --source-path ...`;
- use `refresh --source-label ...` when that is the most reliable handle available in context;
- then use `search`;
- use `items` only for selected tasks;
- use `attention` only when the operator explicitly wants the review subset;
- use `gaps` only when the operator explicitly wants blockers.

For one known task:

- start with `items`;
- do not call `attention` or `gaps` separately unless the operator explicitly asks for a narrowed view.
