---
name: backlog-engineer
description: |
  Turn architecture, ADRs, and technical decisions into a maintainable backlog
  graph of atomic tasks with source traceability, dependency links, immutable
  packets, patch-based updates, and operator-friendly backlog sync workflows.
  Use when creating a backlog from architecture, adding a new module,
  synchronizing backlog after document changes, or authoring packet and patch
  inputs for the directory-root backlog utility.
---

# Backlog Engineer

## Overview

Use this skill to build and maintain a backlog graph from architecture-level inputs.

The method is centered on:

- atomic tasks as the main backlog unit;
- dependency links between tasks;
- explicit source traceability;
- immutable packets for new tasks;
- patch-based change and removal workflows;
- utility-owned derived state that stays understandable for the operator.

This skill is not for proof bundles, review gates, scoring, drift control, or rebaseline workflows.

## Start here

If you only read one section before acting, read this one.

Critical rules:

1. New tasks are added only through `packet`.
2. Existing tasks are changed or removed only through patch workflows.
3. After registration, current truth is read from the utility, not from packet or patch files.
4. Missing information becomes explicit `gaps`, not agent invention.
5. Use `--dry-run` before risky or large mutations.
6. Prefer scoped operations over global ones when scope is known.
7. Before creating a new backlog, analyze what the operator already told you; if system state is missing, ask once and wait.
8. All mutating commands for one backlog root run only sequentially, never in parallel.

Fast navigation:

- need command choice first: go to `Quick command choice`
- need full command behavior: open [Command Reference](references/command-reference.md)
- need packet or patch shapes: open [Data Model](references/data-model.md)
- need to turn documents into tasks: open [Document-to-Packet Workflow](references/document-to-packet-workflow.md)
- need one exact first-run flow: open [First Backlog Walkthrough](references/first-backlog-walkthrough.md)
- need concrete examples or starter files: open [Examples and Templates](references/examples-and-templates.md)

## Preflight before first backlog

Before creating a new backlog, analyze the operator request first.

Decide which of these facts the operator already provided explicitly:

- whether the system is design-only or already partially implemented;
- what source of truth should be used to infer `delivery_state`;
- whether the operator is explicitly directing you to inspect the repo or codebase.

If the operator already stated the system state clearly, use that statement.

If the operator did not state it clearly, ask one short combined preflight question and then stop until the operator answers.

The question must cover both:

- whether the system is design-only or already partially implemented;
- what source of truth should be used for `delivery_state`, if implementation already exists.

Example shape:

> Is the system still only being designed, or is it already partially implemented? If it is partially implemented, what should I use as the source of truth for delivery state: codebase, tests, architecture docs, or something else?

Negative rule:

- until the operator answers that question, do not go into the repo, code, or tests to infer implementation state on your own.

If the system is partially implemented, use the source of truth the operator already gave you, or ask for that source only if it is still missing after the first blocking question.

If the system is design-only:

- do not spend time searching for `implemented` work;
- proceed directly to backlog authoring from design inputs.

If the operator is unsure:

- assume mixed evidence may exist;
- inspect the strongest available implementation signal before assigning `delivery_state`.

## First backlog strategy

For a brand-new backlog built from architecture, use `coverage-first backlog` as the default strategy.

That means:

- include already implemented architecture-significant tasks;
- include not-yet-implemented tasks;
- use `implemented` items as part of the architecture coverage map, not as future work.

Do not exclude implemented tasks just to keep the backlog short.

Exception:

- do not create backlog items for incidental code that does not form a meaningful architecture-significant task.

## When to use

Use this skill when the job is one of these:

| Situation | Use this skill | Reason |
| --- | --- | --- |
| Architecture docs or ADRs must become a backlog graph | Yes | This is the core purpose of the skill. |
| A new module must be added to an existing backlog | Yes | The skill supports packet-based backlog growth from new sources. |
| Existing documents changed and backlog must be synchronized | Yes | The skill defines refresh, packet, and patch workflows. |
| Operator needs a natural-language backlog workflow | Yes | The skill keeps command choice with the agent, not the operator. |
| Work is sprint planning, implementation-only work, or a bug fix | No | This skill is for backlog graph shaping and sync. |
| Work requires governance-heavy proof, scoring, or rebaseline behavior | No | Those concerns are outside this skill's scope. |

## When NOT to use

Do not use this skill as a replacement for:

- sprint planning once backlog graph truth already exists;
- implementation-only execution of already known work;
- freeform brainstorming with no authoritative documents;
- methods that require proof registers, review gates, scoring, drift control, or rebaseline.

## Runtime status

The skill now includes a working CLI implementation.

Current runtime status:

- package: `@kostysh/backlog-engineer-cli`
- source entrypoint: `src/cli.ts`
- built artifact: `scripts/backlog-engineer.mjs`
- full command surface is implemented;
- runtime state, canonical artifacts, packets, patches, reports, and delete flow are wired end to end;
- packet and patch authoring rules in this skill match the implemented CLI surface.

Execution note:

- default command examples use `backlog-engineer ...` as the semantic command form;
- if the CLI is not installed in `PATH`, replace only the command prefix with:
  - `node <skill-root>/scripts/backlog-engineer.mjs ...`
- `<skill-root>` means the directory that contains this skill's `SKILL.md`;
- do not change `cwd` for that substitution:
  - root discovery and relative path resolution still depend on the working directory where you execute the command.

## Role split

Keep the operator, the agent, and the utility separate.

- Operator:
  - writes and updates architecture and project documents;
  - asks for backlog creation, backlog synchronization, or scoped backlog inspection;
  - approves risky changes when needed.
- Agent:
  - reads prose documents;
  - interprets requirements, gaps, context, and task dependencies;
  - authors packet and patch files;
  - chooses the right command sequence;
  - returns concise answers to the operator.
- Utility:
  - owns the canonical backlog state;
  - owns source registration and technical IDs;
  - materializes the backlog graph from packets and patches;
  - computes derived state such as `needs_attention` and `ready_for_next_step`;
  - returns compact, deterministic results.

The operator should not be pulled into internal command choreography.

The agent must not reconstruct current backlog truth from packet and patch files after registration.

## Core rules

1. The main backlog unit is an atomic task.
2. The graph is built from tasks and `depends_on` links.
3. Agent-defined business identifiers use `*_key`; utility-defined technical identifiers use `*_id`.
4. One backlog equals one directory.
5. All backlog artifacts live inside that directory.
6. After registration, current state is read from the utility, not from packet or patch files.
7. `report` is a generated read model, not source of truth.
8. Missing information must become explicit `gaps`, not agent invention.
9. New tasks are added only through `packet`.
10. Changes and deletions of existing tasks happen only through patch workflows.
11. Registered packets are immutable.
12. Utility-owned `todo` items are not authored in packets.
13. Use `--dry-run` before risky or large mutations.

## Delivery state inference

Use these rules when assigning `delivery_state`.

Allowed evidence sources:

- explicit operator instruction;
- real code paths and runtime wiring;
- tests that prove a capability exists;
- architecture or ADR documents;
- planning or backlog documents.

Use this priority order:

1. explicit operator instruction about system state or source of truth
2. direct implementation evidence from code and tests
3. architecture or ADR statements
4. planning or backlog documents

Conservative rules:

- use `implemented` only when there is strong evidence that the capability already exists in the system;
- use `planned` or `specified` when the design is clear but implementation evidence is missing;
- use `defined` when the task is real but the shape is still too loose for stronger staging;
- if evidence conflicts and cannot be resolved confidently, prefer the less advanced state or add a `gap`.

Do not turn temporary input labels into permanent backlog semantics.

Example:

- a planning document says `intaken`
- the agent may use that as one input signal
- but the final backlog still stores only the utility's real `delivery_state` values

## Reconciliation rules

When both as-built reality and planning-state documents exist:

- treat as-built evidence as the source of truth for what is already delivered;
- treat planning-state evidence as the source of truth for future ownership, intended seams, and candidate work;
- reconcile them in the packet the agent authors;
- do not expect the utility to perform reconciliation for you.

Typical split:

- code, tests, or delivery index -> what is already implemented
- planning backlog or candidate list -> what still needs to exist

If the two disagree and you cannot resolve the disagreement confidently:

- do not guess;
- capture the uncertainty as a `gap` on the affected task or tasks.

## `gap` vs continue

`Gap` means a missing external fact that makes the task unsafe to state confidently without invention.

Add a `gap` when:

- a required prerequisite is unknown;
- an ownership or contract decision is missing;
- migration or sequencing cannot be established from available evidence;
- the current implementation state cannot be determined well enough to stage the task honestly.

Continue without a `gap` when:

- the available evidence is enough to describe the task correctly;
- some lower-level detail is still open but does not invalidate the task itself;
- no invention is needed to keep the task accurate.

Simple rule:

- if the missing fact would make the task false, too optimistic, or not safely actionable, add a `gap`;
- otherwise continue.

If the missing fact can be resolved by explicit work, do not stop at `gap` alone.

Create a separate task such as:

- `clarification`
- `investigation`
- `decision`

Then:

- make the blocked task depend on that new task;
- keep the `gap` on the blocked task if the uncertainty still matters.

Do not leave a brand-new backlog with only blocked gap items when the blocking uncertainty itself can be expressed as concrete work.

## Path and root mental model

Use this model consistently:

- one backlog equals one backlog root directory;
- the utility discovers backlog root by finding `.backlog.json` from the current working directory upward;
- query commands are backlog-scoped, not global;
- for one active backlog workflow, keep a stable working directory inside the backlog root;
- source document paths may point outside the backlog root;
- command flags like `--path` and `--out` still resolve as normal CLI filesystem paths unless the command explicitly says otherwise.

## Quick command choice

Use this table for the first command decision. Command details and workflow rules live in local references.

| Need | Preferred command | Rule |
| --- | --- | --- |
| initialize backlog directory | `init` | Start the backlog directory and utility-owned artifacts. |
| register a document source | `register-source` | Read the document first, then register it. |
| inspect registered sources | `list-sources` | Use when `source_id` or `source_label` is needed. |
| create a starter packet draft or patch skeleton | `template` | `template packet` creates a richer starter draft; `template patch` creates the patch skeleton. |
| add new tasks | `packet` | New tasks only. Never mutate or delete existing tasks through `packet`. |
| change existing tasks | `patch-item` | Use patches for changes to existing tasks. |
| remove existing tasks | `remove-item` | Use patches for deletions too. |
| refresh source-derived state | `refresh` | Prefer scoped `refresh --source-*` or `--item-key` when scope is known. |
| quick overall summary | `status` | Short dialog summary only. |
| fresh overall summary right now | `status --refresh` | Global refresh, then status. |
| full operator document on disk | `report` | Use only when the operator explicitly wants a report file. |
| keys unknown, need candidates | `search` | Filtering and candidate selection. |
| keys known, need full cards | `items` | Full task cards only after keys are known. |
| explicit blockers | `gaps` | Use when the operator wants blockers, not just general attention. |
| what needs review now | `attention` | Review-oriented list. |
| what can be taken next | `queue` | Returns ordered chains, not a flat list. |
| delete entire backlog | `delete-backlog` | Only on direct operator request. |

## Operator workflows

Use these as the canonical top-level flows:

| Operator ask | Canonical agent flow |
| --- | --- |
| Create backlog from architecture | preflight on system state -> `init` -> `register-source` for all documents -> `template packet` -> author packet -> if risky `packet --dry-run` -> `packet` -> `status` |
| Add a new module or source | `list-sources` -> `register-source` -> `template packet` -> author packet -> if risky `packet --dry-run` -> `packet` |
| Update backlog after document changes | Prefer scoped `refresh`; then `search`; add new tasks through `template packet` -> `packet`; change existing tasks through `template patch` -> `patch-item`; remove obsolete tasks through `remove-item`; use `--dry-run` before risky mutations |
| Show overall state | `status`; if operator asks for current state right now use `status --refresh`; if operator asks for a document use `report` |
| Show what changed after the last action | Use the compact response of the last mutating command; only then fetch `items` if details are needed |
| Show what needs attention | `attention` -> `items` only for selected tasks |
| Show what can be taken next | `queue` -> `items` only for selected tasks |
| Check one module, source, or task | If `item_key` is known: `items`; if a source is known: scoped `refresh` -> `search` -> optionally `items`; otherwise `search` -> `items` |

## Read-model rules

Use these rules in answers:

- `gaps` means blocked;
- open `todo` caused by source, dependency, or context change means review is needed;
- `ready_for_next_step = true` means the task can be taken further.

Also keep these command boundaries explicit:

- `status` = short dialog summary;
- `report` = full document on disk;
- `search` = keys unknown or filtering needed;
- `items` = keys known and full cards needed;
- `queue` = ordered chains of tasks that can be taken next;
- `attention` = review-oriented subset with utility-provided reasons.

Do not invent hidden interpretations beyond these rules.

`Queue` rule:

- `queue` returns chains, not a flat set of all ready tasks;
- a task can be ready and still appear inside more than one chain;
- therefore `ready_for_next_step` count and queue chain count are not expected to be equal.

## Mutation serialization

For one backlog root, all mutating commands must run only sequentially.

This applies to:

- `register-source`
- `packet`
- `patch-item`
- `remove-item`
- `refresh`
- `delete-backlog`

Do not run these in parallel for the same root even if they look independent.

This rule is especially strict for source registration:

- if multiple sources are needed, register them one by one;
- never run `register-source` in parallel for one backlog root.

## What to expect in output

Use these notes only as high-level interpretation rules.

Do not treat this section as a replacement for command-level reference details.

### Mutating commands

For `packet`, `patch-item`, `remove-item`, and `refresh`:

- expect a compact mutation summary, not full task cards;
- use `counts` for the broad result;
- use `todo_created`, `todo_updated`, and `todo_removed` to see where follow-up work appeared;
- use `next_commands` as the preferred next-step hint from the utility.

Follow-up rule:

- if `todo_created` or `todo_updated` is non-zero, go only to `attention` or `items` for the returned scope;
- if no new review work appeared and the operator asked only for the mutation result, stop there.

### `packet`

Interpret `packet` success like this:

- your authored packet file remains your authored draft;
- the utility may store its own immutable canonical import copy;
- current backlog truth still comes from the utility, not from packet files.

### `status`

- `status` is only a short summary for dialog;
- `status --refresh` performs refresh first, then returns the same summary shape.

### `search`

- use `search` when keys are unknown or you need candidate selection;
- do not use it as a replacement for full task cards.

### `items`

- use `items` only after keys are known;
- treat it as the authoritative full-card view for those tasks.

### `attention`

- `attention` is review-oriented, not a full task inventory;
- use it when the operator asks what needs checking now.

### `queue`

- `queue` is the preferred answer to “what can be taken next”;
- it already returns ordered chains;
- do not reinterpret it as “all tasks with `ready_for_next_step = true`”.

## Interop

Use this skill alongside others like this:

- `documentation`:
  - use `backlog-engineer` for backlog method and task extraction;
  - use `documentation` only when the source documents themselves need restructuring or rewriting.
- `git-engineer`:
  - use `backlog-engineer` for method and artifact content;
  - use `git-engineer` for commit hygiene and branch discipline when versioning skill changes.

When there is tension:

- this skill owns the backlog method;
- work after the next atomic task has already been selected is outside this skill's scope.

## Agent accents to preserve

These are non-negotiable emphases for agent behavior:

- keep the operator out of internal command choreography;
- prefer scoped operations over global ones when scope is known;
- keep mutation results compact;
- do not read packets as current truth after registration;
- do not silently invent missing context;
- use `--dry-run` before risky or large mutations;
- treat utility-generated state as authoritative for the current backlog;
- use `template` before freehand packet or patch authoring when possible.
- analyze operator input before first backlog authoring and ask one blocking preflight question if system state is missing;
- serialize all mutating commands for one backlog root;
- interpret command outputs by utility semantics, not by filename intuition.

## Local references

Use these local references when you need detail beyond the quick contract:

- for command semantics first: [Command Reference](references/command-reference.md)
- for authored shapes first: [Data Model](references/data-model.md)
- for extraction from prose first: [Document-to-Packet Workflow](references/document-to-packet-workflow.md)
- for concrete examples and starter files first: [Examples and Templates](references/examples-and-templates.md)

- [Command Reference](references/command-reference.md)
- [CLI Contract](references/cli-contract.md)
- [Data Model](references/data-model.md)
- [Document-to-Packet Workflow](references/document-to-packet-workflow.md)
- [Packet and Patch Authoring](references/packet-and-patch.md)
- [Examples and Templates](references/examples-and-templates.md)
- [Operator Workflows](references/operator-workflows.md)

The skill must remain usable even if local working documents in `docs/` are later removed.

## Method boundary

This skill defines a backlog-sync method centered on:

- atomic tasks;
- source traceability;
- packet-based growth;
- patch-based mutation;
- utility-owned derived state.

Do not extend it with undocumented governance layers such as proof bundles, review gates, scoring, drift control, or rebaseline behavior.
