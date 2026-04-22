# Commandized stage control

Use this reference when maintaining the shipped stage-controller model for primary delivery workflows in the merged skill.

## Purpose

The merged skill removes the old ambiguity where some delivery steps were real commands and others were prose-only workflow stages.

Target model:

- every primary delivery workflow stage gets a mechanical stage-controller command;
- helper commands remain a separate family;
- semantic work stays agent-owned.

This reference defines the active boundary for the shipped first-wave stage-controller commands.

## Primary delivery stage-controller set

The merged utility treats these stages as first-class stage-controller commands:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

Why these stages:

- they are the primary delivery workflow boundaries;
- they already carry distinct readiness and telemetry semantics;
- commandizing them removes confusion between runnable state transitions and prose-only stage names.

## Helper command family

These remain separate helper commands rather than stage controllers:

- `contract-drift-audit`
- `dossier-verify`
- `review-artifact`
- `dossier-step-close`
- `lifecycle-refresh`
- `next-step`

Rationale:

- they do not represent primary delivery-stage ownership;
- they persist or aggregate evidence, query dossier-local state, or enforce closure truth;
- folding them into stage-controller commands would blur closure and verification boundaries.

## Authority boundary

Stage-controller commands are mechanical progress controllers.

They may:

- open a stage cycle;
- resume a stage cycle;
- mark a stage blocked;
- mark a stage ready for close;
- bootstrap or update the stage log;
- bootstrap or update the helper-managed stage state for the same stage cycle;
- validate structured prerequisites and state invariants;
- expose machine-readable follow-up signals.

They must not:

- write specification or plan content on behalf of the agent;
- make semantic product decisions;
- mutate backlog truth directly;
- materialize authoritative `closed` state;
- write final lifecycle closure timestamps as truth of record.

Upper authority limit:

- stage-controller commands stop at `ready_for_close`;
- authoritative `closed` state stays with `dossier-step-close`;
- lifecycle truth after closure stays with `lifecycle-refresh` when lifecycle aggregation is required.

## Logging role

Stage-controller commands should become canonical writers for stage progress transitions.

Minimum mechanical transition surface:

- `stage_state`
- `entered_ts`
- `ready_for_close_ts`
- `transition_events[]`

Rules:

- stage logs remain Markdown artifacts with YAML frontmatter and narrative sections;
- helper-managed stage state under `.dossier/stages/*` carries the structured current-cycle stage data for scope, review-bundle membership, and close-out validation;
- required section scaffold must stay present for both `feature-intake` and primary stage logs rather than collapsing into an almost-frontmatter-only body;
- event history for repeated block/resume cycles lives authoritatively in `transition_events[]`;
- do not introduce ambiguous singleton timestamps such as `blocked_ts` or `resumed_ts` without explicit derived semantics like `first_*` or `last_*`;
- transition surfaces complement existing telemetry; they do not replace bounded event arrays or closure artifacts.
- stage-controller reruns and helper-owned closure updates must preserve authored narrative sections while updating helper-owned structured fields and transition evidence.

## Backlog interaction rule

Stage-controller commands do not mutate backlog truth directly.

Instead they must materialize explicit follow-up state:

- `backlog_followup_required: true|false`
- `backlog_followup_kind`
- `backlog_followup_resolved: true|false`

Ordinary truth-changing delivery stages may require:

- `patch-item`
- `refresh+patch`

For the mature change path, the stronger explicit selector remains:

- `backlog impact verdict`

Allowed values:

- `no-op`
- `patch existing item`
- `source update`
- `new backlog item`

Truthful stage closure is blocked while required backlog follow-up remains unresolved.

## Closure and telemetry alignment

Commandized stage control must not weaken the already-established closure contract.

Required alignment:

- `dossier-step-close` remains the authoritative closure artifact writer;
- `lifecycle-refresh` remains the lifecycle aggregation helper when lifecycle snapshots or session indexes need refresh;
- stage-controller commands must not duplicate helper-owned closure truth;
- commandized transitions should improve telemetry determinism, not create a second closure authority surface.
- helper-owned closure writes must not erase authored narrative sections from the stage log.
- `ready_for_close` means the stage is ready to enter audit-policy-governed verification, external review, and helper-owned closure; it never means truthfully closed.
- for every mutating stage, helper-owned close-out must enforce the required external audit bundle defined in [Audit policy](audit-policy.md).

## Utility-spec handoff

This reference remains an upstream design input for utility-spec and later runtime hardening work.

The utility specification must derive from this boundary and define:

- exact command help/output surface;
- exact stage-state enums;
- exact transition event schema;
- exact backlog follow-up field names and allowed values.

The utility specification and runtime packages now ship this boundary in first-wave form. Later packages may harden or extend it, but they must not weaken the authority split defined here.

## Negative rules

- do not document flags or output fields for stage-controller commands that the shipped runtime does not actually expose
- do not let stage controllers absorb `dossier-step-close`, `lifecycle-refresh`, or `next-step`
- do not make stage-controller commands semantic automation
- do not let commandized stage control blur the boundary between delivery progress and backlog truth mutation
