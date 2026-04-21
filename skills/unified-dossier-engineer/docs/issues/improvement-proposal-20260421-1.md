# Improvement Proposal: restore operator-facing stage-log value

Date: 2026-04-21

## Problem

The merged `unified-dossier-engineer` preserved strict telemetry and closure truth, but the active log contract became too thin.

As a result, stage logs can now degrade into almost-frontmatter-only artifacts with a short mechanical summary and transition list. This preserves timestamps and transition evidence, but it no longer preserves enough operator-facing reasoning trail for:

- continuous improvement of skills and methods;
- retrospective analysis of process friction;
- review of stage-local decisions that went beyond the original specification;
- understanding why a stage closed in its final shape.

Example symptom:

- a recent `spec-compact` log in `yaagi` contains correct frontmatter and `transition_events[]`, but almost no human-meaningful evidence beyond “Mechanical stage-controller log.”

This is not a telemetry failure. It is a contract-design regression.

## Why this matters

Stage logs are not only lifecycle telemetry.

They are also operator-facing evidence artifacts. They must help answer questions like:

- what decisions were made during the stage;
- what was clarified or reshaped beyond the incoming specification;
- whether the agent hit process misses, rerounds, or blocked transitions;
- which operator clarifications changed the shape of the stage;
- whether the stage exposed weaknesses in the current skill or methodology.

If logs preserve only machine transitions and closure timestamps, the operator loses the evidence needed for retrospective-driven process improvement.

## Root cause

During merge, the active contract shifted too far toward:

- thin telemetry;
- commandized stage transitions;
- deterministic structured fields.

That shift was correct in part, but it removed too much of the old required narrative scaffold from the deleted `dossier-engineer`.

The result is an imbalance:

- machine-readable evidence is preserved;
- operator-readable process evidence is no longer required strongly enough.

## Comparison matrix

| Aspect | Old `dossier-engineer` | Old `backlog-engineer` | Current `unified-dossier-engineer` | Target after this proposal |
| --- | --- | --- | --- | --- |
| Primary purpose of stage logs | Telemetry + operator-facing process evidence | No first-class stage-log contract; mostly utility state/artifacts | Thin telemetry + closure support | Telemetry + operator-facing process evidence |
| YAML frontmatter | Required | N/A | Required | Required |
| Stable structured fields | Required and explicit | N/A | Required and explicit | Required and explicit |
| Narrative sections | Required and fixed | N/A | Allowed but not strongly normalized | Required and normalized |
| Mandatory section scaffold | Yes | N/A | No | Yes |
| Decisions beyond incoming spec | Explicitly preserved | N/A | Not guaranteed | Explicitly preserved |
| Operator clarifications | Explicitly preserved | N/A | Not guaranteed | Explicitly preserved |
| Review/process friction trail | Explicitly preserved | Partial via command outputs, not stage logs | Partially preserved through arrays | Preserved in both arrays and narrative summary |
| `transition_events[]` | Not central | N/A | Central | Central, but not sufficient on their own |
| Usefulness for retrospective improvement | High | Medium for backlog truth, low for stage reasoning | Medium-low | High |

## Required correction

The merged skill should keep deterministic telemetry, but it must explicitly restore a minimum operator-facing narrative contract.

The active contract should say that intake and stage logs are both:

- human-readable;
- machine-checkable;
- suitable for retrospective and operator decisions about process improvement.

## Proposed target contract

### 1. Keep the current structured telemetry

Do not remove:

- YAML frontmatter;
- canonical IDs and timestamps;
- bounded event arrays;
- `transition_events[]`;
- durable artifact references;
- strict closure truth rules.

### 2. Restore a required narrative scaffold

For stage logs, require these sections again:

- `Scope`
- `Inputs actually used`
- `Decisions / reclassifications`
- `Operator feedback`
- `Review events`
- `Backlog follow-up`
- `Process misses`
- `Close-out`

Inside `Decisions / reclassifications`, require these subheadings:

- `Spec gap decisions`
- `Implementation freedom decisions`
- `Temporary assumptions`

If a section is empty, require `none` instead of deleting the section.

### 3. Define what must be preserved in narrative form

When applicable, the log must preserve:

- decisions that shaped the stage beyond the incoming spec;
- operator clarifications that changed the outcome;
- decisions intentionally left as implementation freedom;
- temporary assumptions accepted during the stage;
- reround reasons that matter for operator learning;
- process misses and their practical consequence;
- why closure happened in the final form.

### 4. Keep stage-controller commands subordinate

Stage-controller commands may write:

- `stage_state`
- `entered_ts`
- `ready_for_close_ts`
- `transition_events[]`

But they must not redefine the stage log as a purely mechanical artifact. Commandized transitions should improve determinism, not suppress operator-facing evidence.

### 5. Re-state the purpose of logs explicitly

The active references should explicitly say:

- logs exist not only for lifecycle reconstruction;
- logs also exist to support operator judgment about process, skills, and methods;
- log design must therefore preserve enough evidence for continuous improvement.

## Scope of change

This proposal affects the active merged log contract, primarily:

- `references/telemetry-and-closure.md`
- `references/commandized-stage-control.md`

It may also require follow-up updates in:

- generated `SKILL.md`
- docs-contract tests if they currently protect an overly-thin interpretation

## Non-goals

- Do not revert to overly long prose-heavy logs.
- Do not make CLI infer missing reasoning from prose.
- Do not weaken telemetry determinism or closure truth.
- Do not remove commandized stage transitions.

## Acceptance criteria

- The active log contract explicitly restores operator-facing narrative requirements.
- A stage log can no longer truthfully pass as “almost frontmatter only” when non-trivial decisions or process friction happened.
- `transition_events[]` remains authoritative for mechanical transitions, but no longer acts as a de facto substitute for the full stage record.
- Retrospective analysis can rely on logs for both deterministic counters and concrete human-meaningful process evidence.

## Implementation note

The preferred implementation direction is not to invent a second artifact.

The existing stage log should remain the single human-readable stage record, with:

- structured frontmatter for deterministic telemetry;
- concise but required narrative sections for operator-facing evidence.
