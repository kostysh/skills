---
name: backlog-engineer
description: |
  Turn architecture, ADRs, and technical decisions into a maintainable backlog
  graph of atomic tasks with source traceability, dependency links, immutable
  packets, patch-based updates, and operator-friendly backlog sync workflows.
  Use when creating a backlog from architecture, adding a new module,
  synchronizing backlog after document changes, or authoring packet and patch
  inputs for the planned directory-root backlog utility.
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

Fast navigation:

- need command choice first: go to `Quick command choice`
- need full command behavior: open [Command Reference](references/command-reference.md)
- need packet or patch shapes: open [Data Model](references/data-model.md)
- need to turn documents into tasks: open [Document-to-Packet Workflow](references/document-to-packet-workflow.md)
- need concrete examples or starter files: open [Examples and Templates](references/examples-and-templates.md)

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

The runtime utility is part of the method contract, but it may not yet exist in the target repository.

Use this skill even when the runtime is absent to:

- read source documents;
- decide the right backlog workflow;
- author packet and patch inputs;
- avoid inventing behavior outside the documented method.

Never claim that the CLI exists unless the target repository actually contains it.

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

## Quick command choice

Use this table for the first command decision. Command details and workflow rules live in local references.

| Need | Preferred command | Rule |
| --- | --- | --- |
| initialize backlog directory | `init` | Start the backlog directory and utility-owned artifacts. |
| register a document source | `register-source` | Read the document first, then register it. |
| inspect registered sources | `list-sources` | Use when `source_id` or `source_label` is needed. |
| create an empty packet or patch skeleton | `template` | Prefer `template packet` and `template patch` over freehand authoring. |
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
| Create backlog from architecture | `init` -> `register-source` for all documents -> `template packet` -> author packet -> if risky `packet --dry-run` -> `packet` -> `status` |
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
