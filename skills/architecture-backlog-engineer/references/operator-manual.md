# Operator Manual for `architecture-backlog-engineer`

This is the shipped operator manual for `architecture-backlog-engineer`.

## What the operator does

The operator works through natural-language requests to the agent.

The operator normally provides:

- one or more architecture, ADR, runtime, deployment, or evidence documents;
- an optional `run-dir`;
- an optional acceptance target;
- a create, audit, or edit request in natural language.

The operator does not:

- author packet files;
- edit canonical run artifacts by hand;
- manage internal CLI lifecycle steps.

If `run-dir` is not provided, the agent must either reuse the current run or say explicitly which run it selected.

## Role split

The operator gives intent and source documents.

The agent:

- reads prose sources;
- interprets claims, seams, gaps, unknowns, and work candidates;
- authors explicit packet files when the CLI needs machine-readable input;
- registers sources and packet refs through the bundled CLI;
- returns a human-readable answer.

The CLI:

- reads registered source refs and packet refs;
- loads packet payload from those refs;
- materializes or updates the canonical backlog graph;
- refreshes derivable state;
- validates canonical state;
- renders human-facing outputs.

The CLI does not perform semantic discovery from arbitrary prose. Prose interpretation belongs to the agent.

## Canonical artifacts

The methodology-owned artifacts are:

- `manifest.json`
- `backlog.json`
- `assessment.json`
- `journal.ndjson`
- `report.md`

Truth lives in the first four files. `report.md` is a generated read model.

The agent must not create or mutate methodology-owned artifacts directly. Those artifacts are created and updated only through the bundled CLI.

## General operating rule

When inputs or backlog meaning change, the run must be recomputed through the normal CLI workflow.

The operator should not have to remember:

- whether the run already exists;
- which canonical files are authoritative;
- which generated files are disposable;
- which internal CLI step must run next.

Those decisions belong to the skill.

## Allowed operator inputs

| Scenario group | What the operator may provide | What must not be used as a shortcut |
| --- | --- | --- |
| Create backlog | one or more authoritative architecture, ADR, current-truth, or evidence sources; optional `run-dir`; optional acceptance target | hand-editing canonical files |
| Audit backlog | `run-dir`; optional item reference; optional audit question | quoting stale `report.md` without checking the current run |
| Edit backlog | updated authoritative documents; a natural-language change request; optional `run-dir`; for `delivery_state`, authoritative current-truth evidence only | hand-editing canonical artifacts; changing `delivery_state` without authoritative current-truth evidence |

The operator may refer to a run, backlog item, spike, or architecture claim by `id`, title, or short description. When the agent resolves an ambiguous reference, it should name the canonical `item_id` or `claim_id` in the answer if that matters for later work.

## What answers should look like

The agent should answer in chat with a human-readable summary and link to the current run or `report.md` when deeper inspection is useful.

Primary answer surfaces:

- structure, ownership, sequencing, and dependencies: `report.md`
- current run status and summary metrics: `status`
- delta against baseline: `delta`
- detailed explanation after a mutating workflow: chat summary plus the refreshed run outputs

The operator should not need to read raw canonical JSON to understand the result.

## Supported operator workflows

### Create backlog

The operator may ask the agent to:

- create a new backlog from one architecture source;
- create a backlog from multiple architecture or ADR sources;
- create a backlog from architecture plus current-truth evidence;
- create a draft backlog from incomplete architecture while surfacing `Gap`, `Unknown`, and `Contradiction`.

Expected result:

- a run exists or is reused;
- the canonical backlog graph is refreshed;
- the answer points to the resulting run and human-facing outputs.

### Audit backlog

The operator may ask the agent to:

- show the structured backlog for a run;
- show summary metrics and current risk signals;
- show delivery state across items;
- show uncovered claims;
- show ranked problems;
- show items that pass DoR;
- show delta against baseline;
- show stale items, stale proofs, and stale review artifacts;
- show the summary or full details for one item.

Expected result:

- the agent answers from the current run, not from stale memory;
- the answer uses `status`, `delta`, and `report.md` as needed;
- item-level requests resolve to a canonical `item_id`.

### Edit backlog

The operator may ask the agent to:

- change general planning fields for an item;
- change a linked spike question;
- change `Gap` or `Unknown`;
- create a timeboxed spike;
- change owner;
- change `depends_on`;
- update `delivery_state` from current-truth evidence;
- mark an architecture claim as `deferred`, `optional`, or `negative_scope`;
- fix roadmap order through graph relations;
- add a missing backlog item;
- add proof or review evidence;
- re-run validation after source changes;
- establish a new baseline;
- check rebaseline readiness;
- check new stale entities after change;
- add current truth to an existing run.

Expected guardrails:

- the operator still works in natural language;
- the agent may author explicit packet files internally, but the operator does not;
- `delivery_state` must come from authoritative current-truth evidence, not from planning-only edits;
- canonical artifacts are updated only through the bundled CLI.

## Practical success criterion

The operator does not need “a graph” or “a packet” for its own sake.

The operator needs a workflow that produces:

- a precise list of backlog items derived from architecture and current truth;
- clear meaning, ownership, sequencing, and dependencies for each item;
- explicit handling of `Unknown` through clarification or spikes;
- explicit handling of `Gap` through executable work or deliberate scope decisions;
- a backlog that can be used for downstream specification and implementation planning.
