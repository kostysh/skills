# Document-to-Packet Workflow

This file explains how to turn architecture documents into a packet without inventing missing facts.

## Core idea

The agent reads prose documents, extracts stable context and atomic tasks, then authors a packet that the utility can materialize.

The utility does not interpret prose for you.

## Step-by-step workflow

### 1. Read the documents

Read the relevant inputs first:

- architecture overview
- module documents
- ADRs
- technical decisions
- integration notes

Before authoring anything, answer these questions for yourself:

- what modules or areas exist?
- what new or changed behavior is required?
- what interfaces, data, and constraints matter?
- what is still unclear?

Before a brand-new backlog, also answer:

- is the system only being designed;
- is it already partially implemented;
- what evidence is available to infer `delivery_state`.

### 2. Register the sources

Every document that materially participates in the backlog should become a registered source.

Workflow:

1. read the document;
2. choose the right source classification;
3. `register-source`;
4. keep the returned `source_id`.

Do not guess `source_id`.

For one backlog root, do not register sources in parallel with other mutating commands.

### 3. Extract stable context

Create packet context only where it helps the backlog stay complete and understandable.

Extract:

- glossary terms that matter for task meaning;
- claims that tasks should cover;
- contracts that tasks will touch;
- data domains that matter;
- quality attributes that matter;
- policy decisions that constrain work.

Do not dump the whole document into context.

### 4. Extract candidate tasks

Turn prose into candidate tasks by looking for:

- user-visible or system-visible behavior that must exist;
- interfaces that must be introduced or changed;
- data work that must happen;
- migrations, transitions, or cleanup implied by the design;
- operational or quality work that is explicitly required.

Each candidate should be small enough to hand off later.

### 5. Enforce atomicity

For each candidate, check:

- does it have one clear goal?
- does it have one clear result?
- could it be separately specified?
- could it be separately planned?
- could it be separately implemented?

If not, split it.

### 6. Add dependencies

For each atomic task, ask:

- what must exist first?
- what blocks this task from moving forward?

Only real blockers belong in `depends_on_keys`.

Do not use dependencies to express weak association or module membership.

### 7. Add explicit gaps

Whenever the source documents do not support a confident decision:

- write a `gap`;
- do not invent the missing fact.

Typical gap cases:

- missing API contract details;
- missing ownership decision;
- missing migration strategy;
- unclear sequencing between tasks.

Continue without a `gap` only when the available evidence is already enough to describe the task correctly without invention.

### 8. Choose packet vs patch

Use this rule:

- new tasks -> `packet`
- existing tasks changed -> patch
- existing tasks removed -> removal patch

If the same document change creates both new tasks and modifications to old tasks, you may need:

- one packet for new tasks;
- one patch for updates;
- one removal patch if tasks became obsolete.

### 9. Start from templates

Do not author from memory when a template is available.

Use:

- `template packet`
- `template patch`

Then fill in:

- source IDs
- keys
- dependencies
- context links
- gaps

### 10. Run preview when risky

Before a risky or large mutation:

- `packet --dry-run`
- `patch-item --dry-run`
- `remove-item --dry-run`

### 11. Read the right follow-up

After a mutating command:

- if `todo_created` or `todo_updated` is non-zero, go only to `attention` or `items` for the returned keys;
- otherwise stop if the operator only asked for the result.

After `packet` specifically:

- treat the authored packet file as your draft;
- expect the utility to keep a separate immutable canonical import copy;
- read current backlog truth from the utility, not from packet files.

## Practical checklist

Before applying a packet, confirm:

- all relevant documents were registered as sources;
- every task has `item_key`, `title`, `type`, `delivery_state`, `origin_source_ids`;
- dependencies are real blockers;
- missing facts became `gaps`;
- context links are explicit where needed;
- no existing task is being changed through `packet`.

Before applying a patch, confirm:

- target tasks already exist;
- you read current state through `search` and `items`;
- the patch only changes existing tasks or closes utility-owned `todo`;
- sequence and metadata are filled;
- the operation list matches the intended change.

## Anti-patterns

Do not do these:

- read packet files as current truth after registration;
- invent missing data instead of adding `gaps`;
- use `packet` to mutate existing tasks;
- use patch workflows to add brand-new tasks;
- encode weak associations as hard dependencies;
- create large non-atomic “module tasks” that cannot be handed downstream.
