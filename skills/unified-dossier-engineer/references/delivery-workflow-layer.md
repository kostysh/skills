# Delivery workflow layer

Use this reference when preserving or designing dossier-side execution workflow inside the merged skill.

Use it together with:

- [Commandized stage control](commandized-stage-control.md)
- [Telemetry and closure](telemetry-and-closure.md)

## What this layer owns

The delivery workflow layer owns:

- `feature-intake`
- feature dossier creation and upkeep
- `spec-compact`
- `plan-slice`
- `implementation`
- mature change path: `change-proposal`, `contract-drift-audit`, `backlog impact verdict`
- review and verification freshness
- `coverage_gate`
- pre-close / DoD readiness
- authoritative step closure

It does not own backlog graph truth, source registry mutation, or backlog read-model semantics.

## One feature equals one backlog item

This invariant stays strict after the merge:

- one feature cycle maps to exactly one selected backlog item
- one canonical feature dossier maps to exactly one backlog item
- delivery workflow does not aggregate multiple backlog items into one feature dossier

If work later fans out, that becomes explicit backlog actualization work rather than silent dossier scope growth.

## Canonical flow

The merged design must preserve this default lifecycle:

`selected backlog work -> feature-intake -> spec-compact -> plan-slice -> implementation -> authoritative step close`

The merged design must also preserve the mature change branch as first-class workflow, not as a side note:

`change-proposal -> contract-drift-audit -> explicit backlog impact verdict -> backlog actualization when verdict is not no-op`

## Stage obligations

### `feature-intake`

The merged workflow must preserve:

- one durable handoff from selected backlog item into feature workflow
- backlog item key, source traceability, blockers, and dependencies captured at intake
- truthful start of the feature cycle before downstream planning or implementation

### `spec-compact`

The merged workflow must preserve:

- explicit requirements and acceptance framing for the selected backlog item
- adversarial / edge-case / boundary shaping where the changed scope needs it
- return to backlog truth layer when specification changes backlog truth

### `plan-slice`

The merged workflow must preserve:

- explicit implementation plan for the selected backlog item
- proof obligations for verification
- explicit handling of heavy-runtime planning when the trigger fires
- return to backlog truth layer when planning changes backlog truth

### `implementation`

The merged workflow must preserve:

- dossier-local implementation execution
- local verification artifacts
- debt review
- independent review in fail-closed mode
- review freshness control
- authoritative close-out only after readiness is truthful

## Backlog actualization inside one skill

Merge removes the cross-skill handoff, but not the truth boundary.

Rules:

- if dossier-side work changes backlog truth, the agent stays inside the same merged skill and moves into the backlog actualization branch
- delivery closure is not truthful while required backlog actualization remains unresolved
- mature change path must always end with one explicit backlog impact verdict:
  - `no-op`
  - `patch existing item`
  - `source update`
  - `new backlog item`

## Required state axes

The merged workflow must keep these axes separate:

- backlog item lifecycle
- feature dossier maturity
- `coverage_gate`
- review freshness
- verification freshness
- step closure state

Required consequence:

- no single flat status enum may replace this crosswalk
- `ready_for_next_step` must stay explainable rather than inferred from prose

## Closure discipline

The merged delivery workflow must preserve all hard gates from the current dossier model.

Required gates:

- local verification artifacts before final closure claim
- debt review
- independent review in fail-closed mode
- review freshness validation
- explicit pre-close / DoD readiness
- authoritative step-close artifact
- truthful blocked close branch

Important:

- commit history is trace metadata only
- chat summaries are never closure truth
- informal “looks good” signals never replace durable closure evidence

## Semantic heritage versus shipped runtime

This skill now ships first-wave merged commands, but workflow semantics still stay broader than the currently automated surface.

Use names such as `feature-intake`, `change-proposal`, `contract-drift-audit`, and `backlog impact verdict` as semantic anchors for the shipped runtime and active methodology.

The stage-controller command boundary is defined separately in [Commandized stage control](commandized-stage-control.md). That boundary is now active shipped behavior and remains the upstream rule for future hardening work.

## Negative rules

- do not degrade the mature change branch into a backlog appendix
- do not let delivery closure bypass required backlog actualization
- do not dissolve `coverage_gate` into generic maturity wording
- do not equate backlog `planned|implemented` with dossier `planned|done`
