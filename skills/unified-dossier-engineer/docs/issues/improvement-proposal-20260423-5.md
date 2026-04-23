# Improvement Proposal: make stage artifacts schema-consistent and machine-complete

Issue ID: `ISS-03`

Primary owner skill: `unified-dossier-engineer`

## Problem

The current stage-artifact model is usable for human review, but it is not machine-complete enough for reliable downstream tooling.

The grouped problems are related and should be solved as one schema issue:

- stage log and stage-state can drift on shared fields;
- artifact linkage is incomplete for reviews, verification, and close-out outputs;
- skill usage is not explicitly recorded as agent-supplied stage context;
- `Process misses` remains prose-first instead of structured machine state;
- scope identity is incomplete, so downstream consumers fall back to noisy trace-derived inference.

These are separate symptoms of one root issue: the stage-artifact schema still depends too much on prose and reconstruction.

## Why This Matters

Without a machine-complete stage schema:

- retrospective tooling must guess from logs instead of reading declared state;
- parity bugs can exist between stage log and stage-state;
- process metrics are noisy because prose is treated as telemetry;
- skill usage and scope boundaries are reconstructed from trace fragments instead of being explicitly supplied by the agent;
- future workflow automation remains fragile even when the human-readable log looks fine.

## Current Active Surface

Relevant active references:

- [Unified artifact topology](../../references/unified-artifact-topology.md)
- [Telemetry and closure](../../references/telemetry-and-closure.md)
- [Commandized stage control](../../references/commandized-stage-control.md)
- [Delivery workflow layer](../../references/delivery-workflow-layer.md)

## Required Correction

Extend the stage-artifact contract so that the machine-facing state needed by downstream consumers is stored explicitly in stage metadata and mirrored faithfully into stage-state.

This issue intentionally covers one bounded schema family:

1. parity between stage log and stage-state;
2. explicit artifact link arrays and commit anchors;
3. explicit operator-supplied skill annotations;
4. structured `process_misses`;
5. explicit scope identity fields.

## What Must Change

### 1. Shared-field parity

Define and protect the shared machine fields that must never drift between stage log metadata and stage-state.

At minimum, the contract must cover the shared fields introduced or tightened by this issue, not only the existing base fields.

For this issue, helper-managed `stage-state` should remain the authoritative structured coordination and validation surface, while stage-log metadata is the bounded human-readable mirror of that structured state.

### 2. Artifact linkage

Add machine-complete linkage for:

- review artifacts;
- verification artifacts;
- step-close artifact;
- optional final commit anchors only as trace links when the runtime already records them.

The goal is explicit linkage, not heuristic recovery.
Commit anchors must not become required truthful closure evidence under this issue.

### 3. Skill annotations

Add explicit stage-level skill annotations as agent-supplied inputs rather than trace-derived guesses.

Recommended shape:

- `skills_used`
- `skill_issues`
- `skill_followups`

These fields should reflect deliberate operator/agent annotations for the stage, not automatic skill scraping from conversation trace.

### 4. Structured process misses

Replace prose-only process-miss telemetry with structured machine state while preserving human-readable rendering.

The preferred direction is a simple repeatable DSL that the agent passes explicitly to stage-control and that is stored as structured metadata/state.

Expected shape should remain minimal and bounded, for example:

- `id`
- `category`
- `severity`
- `resolved`
- `summary`

Human-readable `Process misses` narrative may remain as a rendered mirror, but it must stop being the only source of truth.

### 5. Explicit scope identity

Add explicit scope identity fields so downstream consumers do not need broad trace-derived guessing.

At minimum, the contract should cover:

- `primary_feature_id` when needed distinct from local stage context;
- `primary_backlog_item_key` or equivalent explicit backlog scope identity;
- `phase_scope` or equivalent explicit boundary descriptor.

## External Spec-Conformance Review

Status: reviewed

Verdict on initial draft: `insufficient`

Key review outcome:

- the grouped schema issue was accepted as the right bounded problem;
- the draft needed one missing authority rule so parity does not leave two competing sources of truth;
- the commit-anchor wording needed tightening so optional trace links do not drift into required closure truth;
- acceptance needed to require runtime-enforced write/validation parity, not only docs and tests.

## Acceptance Criteria

This issue is fixed only when:

- the stage-artifact contract defines the new machine-facing fields explicitly;
- helper-managed `stage-state` remains the authoritative structured coordination/validation surface for the fields owned by this issue, with stage-log metadata as the bounded mirror;
- stage log metadata and stage-state preserve parity for the fields owned by this issue;
- review/verification/close-out linkage is explicit rather than heuristic;
- any commit anchors introduced or preserved by this issue remain optional trace links and are not required truthful closure evidence;
- skill annotations are agent-supplied and structured rather than trace-scraped;
- `process_misses` has a structured source of truth and no longer relies only on prose parsing;
- explicit scope identity fields reduce the need for trace-derived scope guessing;
- shipped writers and validators across stage-control, review, verification, and step-close paths materialize and enforce the schema/parity expectations;
- docs and tests protect the schema additions and enforcement expectations.

## Mandatory Planning And Implementation Constraint

Any future planning or implementation for this issue must stay tightly scoped to the specific schema gaps enumerated here.

Mandatory boundaries:

- implement only the fields, inputs, rendering, and tests needed for parity, linkage, skill annotations, structured `process_misses`, and scope identity;
- prefer the smallest sufficient schema change set and the simplest repeatable DSL that satisfies the contract;
- do not widen this issue into retrospective-tool discovery logic, report rendering strategy, or unrelated workflow redesign;
- do not add automatic skill extraction or automatic process-miss inference from trace or prose under this issue;
- if another telemetry need appears outside these fields, record a new follow-up instead of extending this issue.

## Non-Goals

- Do not redesign the full lifecycle telemetry model.
- Do not add generic trace scraping as a substitute for explicit stage metadata.
- Do not mix session provenance changes from `ISS-02` into this issue except where the shared schema must coexist cleanly.
