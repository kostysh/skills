# Operator Workflows

This file defines the stable operator-facing use cases and the agent workflows behind them.

For one canonical first-run walkthrough, use [First Backlog Walkthrough](first-backlog-walkthrough.md).

Cross-skill wording rule:

- names such as `spec-compact`, `plan-slice`, and `implementation` refer to dossier workflow stages, not to shipped backlog or dossier CLI subcommands.

## Canonical operator asks

| Operator ask | Canonical agent flow |
| --- | --- |
| Create backlog from architecture | preflight on system state -> source-set gate -> `init` -> `register-source` for all relevant sources -> `template packet` -> author packet -> if risky `packet --dry-run` -> `packet` -> `status` |
| Add a new module or source | `list-sources` -> `register-source` -> `template packet` -> author packet -> if risky `packet --dry-run` -> `packet` |
| Update backlog after document changes | If a source moved, use `update-source-path`; if a source was deleted, use `remove-source`; otherwise prefer scoped `refresh`; then `search`; add new tasks through `template packet` -> `packet`; change existing tasks through `template patch` -> `patch-item`; remove obsolete tasks through `remove-item`; use `--dry-run` before risky mutations |
| Choose the next work and hand off to dossier | `queue` or scoped `status`/`items` -> read current `delivery_state`, blockers, dependencies, and source traceability -> hand off the selected backlog work to `dossier-engineer feature-intake` |
| Update backlog after dossier shaping/specification | after dossier workflow stage `spec-compact`, and before that stage is treated as complete, choose `patch-item` or `refresh + patch`; `patch-item` branch = resolve scope -> `template patch` -> `patch-item --dry-run` -> `patch-item` -> `items` -> `status`; `refresh + patch` branch = scoped `refresh` -> resolve scope -> `template patch` -> `patch-item --dry-run` -> `patch-item` -> `items` -> `status` |
| Update backlog after dossier planning | after dossier workflow stage `plan-slice`, and before that stage is treated as complete, choose `patch-item` or `refresh + patch`; record newly explicit dependencies or sequencing constraints; finish on `items` plus `status`, not on patch success alone |
| Update backlog after dossier implementation/closure | after dossier workflow stage `implementation`, then `dossier-verify` and `review-artifact`, actualize backlog truth before `dossier-step-close`; use the same lifecycle `patch-item` or `refresh + patch` recipe, then confirm the selected backlog work as `implemented` or record follow-up backlog facts through `items` plus `status` |
| Update backlog after dossier `change-proposal` | read the dossier-side `backlog impact verdict`; `no-op` -> confirm no backlog mutation; `patch existing item` -> resolve scope -> `template patch` -> `patch-item --dry-run` -> `patch-item` -> `items` -> `status`; `source update` -> if source is new, `register-source`; if the same source moved, `update-source-path`; if the source was deleted, `remove-source`; if a registered source changed, scoped `refresh`; then patch every known impacted item through `template patch` -> `patch-item --dry-run` -> `patch-item`; create new work only if the refreshed source still implies separate delta work; finish on `items` -> `status`; `new backlog item` -> `template packet` -> `packet` -> `items` -> `status`, while keeping old item history honest |
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

Cross-skill interpretation:

- `queue` decides which backlog work should move next;
- dossier-local `next-step` decides how already selected work should move locally;
- do not use dossier-local `next-step` as a substitute for backlog selection.

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

### Dossier-side actualization

When dossier work changes backlog truth:

- lifecycle actualization after `spec-compact`, `plan-slice`, and `implementation` has only two truthful closure branches:
  - `patch-item`
  - `refresh + patch`
- use the lifecycle `patch-item` branch only when the affected backlog items are already known and source-derived state does not need recalculation first;
- for that branch, use `items` when keys are already known, or `search` with shipped structural filters and then `items` when keys are not yet known -> `template patch` -> `patch-item --dry-run` -> `patch-item`;
- use scoped `refresh` first only when the dossier-side change came from updated source documents and source-derived state may have changed;
- after that refresh, resolve the now-known scope, then run `template patch` -> `patch-item --dry-run` -> `patch-item` when `delivery_state`, blockers, dependencies, or context facts still need explicit actualization on already known backlog items;
- `refresh` alone does not actualize `delivery_state` or dossier-discovered blockers, dependencies, or context facts that require an explicit patch;
- keep the mutation scoped to the selected work and the newly discovered linked facts whenever possible;
- if dossier work surfaced a new blocker, dependency, or context fact, patch backlog before continuing dossier-local workflow.
- for truth-changing dossier stages, backlog actualization is part of stage closure, not an optional follow-up after closure.
- for dossier-side actualization patches, `template patch` is the required default starting point and `patch-item --dry-run` is the required pre-apply step.
- finish dossier-side actualization only after clean confirmation:
  - use `items` as the required scoped truth read whenever item-card truth changed;
  - use `status` as the required artifact-integrity confirmation surface;
  - use `status --refresh` only when a wider global integrity sweep is explicitly needed and the broader scope is acceptable;
  - mutation success alone is not a clean closure.

For dossier workflow stage `change-proposal`, use the dossier-side `backlog impact verdict` literally:

- `no-op` -> no backlog mutation and no backlog rediscovery;
- `patch existing item` -> patch already known impacted items only through `template patch` -> `patch-item --dry-run` -> `patch-item`, then confirm clean state through `items` and `status`;
- `source update` -> if the source is new, `register-source` first; if the same source moved, `update-source-path`; if the source was deleted, `remove-source`; if the source is already registered and changed, scoped `refresh` first; then patch all known impacted items; then create new work only if the refreshed source still implies separate delta work; finish on clean confirmation through `items` and `status`;
- `new backlog item` -> create a separate delta item through `template packet` -> `packet`, then confirm clean state with `items` and `status` while keeping existing implemented history honest.

Special guards:

- a new ADR created during `change-proposal` is always a backlog-relevant source update;
- if changed source and changed work truth appear together, primary branch = `source update`;
- for shared-source or multi-item impact, partial sync is not an allowed closure outcome;
- an already `implemented` item does not silently downgrade just because later delta work was discovered; later delta work becomes a new backlog item.
- stale refresh-managed review todo are cleared only through scoped `refresh`; do not close them through `patch-item remove_todo`.

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
