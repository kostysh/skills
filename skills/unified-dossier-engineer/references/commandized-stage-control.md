# Commandized stage control

Use this reference when designing the future command model for primary delivery workflows in the merged skill.

## Purpose

The merged skill should remove the old ambiguity where some delivery steps were real commands and others were prose-only workflow stages.

Target model:

- every primary delivery workflow stage gets a mechanical stage-controller command;
- helper commands remain a separate family;
- semantic work stays agent-owned.

This reference defines the boundary. It does not claim that the merged runtime already ships these commands.

## Primary delivery stage-controller set

The future merged utility should treat these stages as first-class stage-controller commands:

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
- event history for repeated block/resume cycles lives authoritatively in `transition_events[]`;
- do not introduce ambiguous singleton timestamps such as `blocked_ts` or `resumed_ts` without explicit derived semantics like `first_*` or `last_*`;
- transition surfaces complement existing telemetry; they do not replace bounded event arrays or closure artifacts.

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

## Closure and telemetry compatibility

Commandized stage control must not weaken the already-established closure contract.

Required compatibility:

- `dossier-step-close` remains the authoritative closure artifact writer;
- `lifecycle-refresh` remains the lifecycle aggregation helper when lifecycle snapshots or session indexes need refresh;
- stage-controller commands must not duplicate helper-owned closure truth;
- commandized transitions should improve telemetry determinism, not create a second closure authority surface.

## Utility-spec handoff

This reference is an upstream design input for the future utility specification.

The utility specification must derive from this boundary and define:

- exact command help/output surface;
- exact stage-state enums;
- exact transition event schema;
- exact backlog follow-up field names and allowed values.

Until the utility specification and runtime packages land, this document stays normative for design intent only, not for shipped CLI examples.

## Negative rules

- do not present these future stage-controller names as already shipped commands
- do not let stage controllers absorb `dossier-step-close`, `lifecycle-refresh`, or `next-step`
- do not make stage-controller commands semantic automation
- do not let commandized stage control blur the boundary between delivery progress and backlog truth mutation
