# Operator Workflows

This file defines the stable operator-facing use cases and the agent workflows behind them.

For one canonical first-run walkthrough, use [First Backlog Walkthrough](first-backlog-walkthrough.md).

## Canonical operator asks

| Operator ask | Canonical agent flow |
| --- | --- |
| Create backlog from architecture | preflight on system state -> source-set gate -> `init` -> `register-source` for all relevant sources -> `template packet` -> author packet -> if risky `packet --dry-run` -> `packet` -> `status` |
| Add a new module or source | `list-sources` -> `register-source` -> `template packet` -> author packet -> if risky `packet --dry-run` -> `packet` |
| Update backlog after document changes | Prefer scoped `refresh`; then `search`; add new tasks through `template packet` -> `packet`; change existing tasks through `template patch` -> `patch-item`; remove obsolete tasks through `remove-item`; use `--dry-run` before risky mutations |
| Show overall state | `status`; if operator asks for current state right now use `status --refresh`; if operator asks for a document use `report` |
| Show what changed after the last action | Use the compact response of the last mutating command; only then fetch `items` if details are needed |
| Show what needs attention | `attention` -> `items` only for selected tasks |
| Show what can be taken next | `queue` -> `items` only for selected tasks |
| Check one module, source, or task | If `item_key` is known: `items`; if a source is known: scoped `refresh` -> `search` -> optionally `items`; otherwise `search` -> `items` |

## Queue semantics

Treat `queue` as a list of ordered chains, not a flat list.

- one root branch of the graph corresponds to one queue chain;
- only tasks that are runnable now should appear there;
- the utility should return the chain already ordered for next-step work.
- queue chain count is not expected to equal the count of all `ready_for_next_step` tasks.

## First-run preflight

Before creating a new backlog, analyze operator input first.

- if the operator already said the system is design-only, proceed directly to backlog authoring;
- if the operator already said the system is partially implemented, request the best available source of truth for delivery state;
- if the operator did not say, ask a short preflight question before running `init`.

After preflight, close a separate source-set gate before packet authoring.

- identify the full source set, not just the anchor source;
- if the operator says `based on X`, treat `X` as the anchor source, not the only source, unless the operator explicitly says `only from X`;
- if an architecture source points to upstream concept documents, ADRs, or cross-cutting contracts, those become mandatory inputs unless the operator explicitly excludes them.

Allowed evidence for delivery state:

- codebase;
- tests;
- architecture and ADR documents;
- existing backlog or planning docs;
- explicit operator instruction.

Use the strongest evidence first and stay conservative when evidence conflicts.

For partially implemented repositories, the minimum first-pass source set includes:

- architecture anchor source;
- source of truth for delivery state;
- repo-level cross-cutting ADR or decision sources, when declared as canonical;
- upstream concept or system-definition sources that the architecture source explicitly relies on.

Planning backlog documents may inform task names, ownership, or delivery hints, but they do not substitute extraction from concept, architecture, and ADR sources.

## Mutation serialization

For one backlog root, all mutating commands must run only sequentially.

Never run these in parallel for the same root:

- `register-source`
- `packet`
- `patch-item`
- `remove-item`
- `refresh`
- `delete-backlog`

## Output interpretation

### Mutating commands

- expect compact summaries, not full task cards;
- if `todo_created` or `todo_updated` is non-zero, follow only the returned scope through `attention` or `items`;
- otherwise stop if the operator asked only for the mutation result.

### `packet`

- the authored packet stays your draft;
- the utility keeps its own immutable canonical import copy;
- current truth still comes from the utility, not from either packet file.

## Agent accents

These emphases are mandatory:

- keep the operator out of internal command choreography;
- prefer scoped operations over global ones when scope is known;
- keep mutation results compact;
- do not read packets as current truth after registration;
- do not silently invent missing context;
- use `--dry-run` before risky or large mutations;
- treat utility-generated state as authoritative for the current backlog;
- use `template` before freehand packet or patch authoring when possible.
