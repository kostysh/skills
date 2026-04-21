# Telemetry and closure

Use this reference when designing lifecycle identity, logs, closure artifacts, or retrospective support in the merged skill.

Use it together with:

- [Delivery workflow layer](delivery-workflow-layer.md)
- [Commandized stage control](commandized-stage-control.md)

## Purpose

The merged skill must stay observable without inventing magical runtime behavior.

Telemetry must support:

- deterministic lifecycle reconstruction
- truthful blocked/open/closed closure state
- retrospective-ready objective signals
- operator-facing evidence for process-improvement decisions
- clear separation between mechanical aggregation and agent-owned semantic analysis

## Artifact families

The merged design keeps telemetry and closure artifacts in separate accounting families under `.dossier`:

- logs under `.dossier/logs/*`
- review artifacts under `.dossier/reviews/*`
- verification artifacts under `.dossier/verification/*`
- step-close artifacts under `.dossier/steps/*`
- lifecycle snapshots under `.dossier/metrics/*`
- session discoverability under `.dossier/retro/session-index.jsonl`

Do not collapse these into one prose log or one generic journal file.

## Identity contract

The merged telemetry layer must preserve these stable identities:

- `feature_id`
- `backlog_item_key`
- `feature_cycle_id`
- stage-local `cycle_id`

Rules:

- each feature cycle gets one stable `feature_cycle_id`
- `feature-intake` has its own `cycle_id`, linked to the same `feature_cycle_id`
- each stage log (`spec-compact`, `plan-slice`, `implementation`) has its own stage-local `cycle_id`, linked to the same `feature_cycle_id`
- lifecycle snapshot identity is `(feature_id, feature_cycle_id)`

## Log contract

Merged telemetry must preserve the current useful shape:

- intake and stage logs remain human-readable Markdown artifacts
- those logs start with YAML frontmatter
- machine-readable fields live in bounded structured fields, not in CLI inference from prose
- narrative sections remain required for operator-facing human context on non-trivial stages

Minimum machine-readable fields stay explicit:

- canonical ids
- canonical timestamps
- bounded event arrays where applicable
- linked durable artifact references where such artifacts truly exist

Purpose rule:

- logs exist not only for lifecycle reconstruction;
- logs also exist to support operator judgment about process, skills, and methods;
- frontmatter plus a mechanical transition list is not sufficient for a non-trivial stage.

Required scaffold for `feature-intake` logs:

- `Scope`
- `Inputs actually used`
- `Backlog handoff decisions`
- `Intake findings`
- `Operator feedback`
- `Index refresh`
- `Backlog follow-up`
- `Process misses`
- helper-owned `Transition events`
- `Close-out`

Required scaffold for stage logs (`spec-compact`, `plan-slice`, `implementation`, `change-proposal`):

- `Scope`
- `Inputs actually used`
- `Decisions / reclassifications`
- `Operator feedback`
- `Review events`
- `Backlog follow-up`
- `Process misses`
- helper-owned `Transition events`
- `Close-out`

Inside `Decisions / reclassifications`, keep these subheadings:

- `Spec gap decisions`
- `Implementation freedom decisions`
- `Temporary assumptions`

If a required section has no notable content, write `none` instead of deleting it.

If future stage-controller commands add progress-transition fields, they must remain subordinate to this telemetry model:

- progress transitions may add deterministic stage-progress evidence;
- they must not replace helper-owned closure truth;
- repeated block/resume history should live in bounded transition events rather than ambiguous singleton summary timestamps.
- helper-owned closure updates must preserve authored narrative sections instead of collapsing the log back to a mechanical body.

## Session anchors

Retrospective discoverability must stay deterministic.

Required rules:

- session anchors are stored in repo artifacts only as stable lookup seams
- `.dossier/retro/session-index.jsonl` stores session anchors, not absolute machine-local trace paths
- session discoverability must remain runtime-aware without hardcoding one workstation layout as universal truth

## Source-review signals

Telemetry must reflect source-review blocking truth.

Minimum required signals:

- `open_source_review_count`
- `source_review_blocked_item_count`

Those signals belong to deterministic readiness reporting. They do not require prose analysis.

## Closure truth

The merged design must keep closure strict.

Required rules:

- blocked, open, and closed remain truthful durable states
- implementation closure truth requires authoritative step-close evidence
- `lifecycle-refresh` remains the shipped lifecycle aggregation helper for lifecycle snapshots and session-index refresh
- lifecycle timestamps must never materialize from chat-only or commit-only signals

Semantic heritage rule:

- the merged design preserves the current `dossier-step-close` and `lifecycle-refresh` semantics as authoritative closure and lifecycle-aggregation anchors
- those names are now shipped merged commands and remain the authoritative semantic anchors for closure and lifecycle aggregation

## Metrics contract

The telemetry layer must make these signals computable from deterministic artifacts:

- feature-cycle duration
- phase duration
- review-loop duration
- rerounds per feature
- first-pass close rate
- closure latency
- verification friction
- backlog actualization friction
- operator intervention counts
- telemetry completeness

This does not mean the first-wave runtime already materializes every desired metric field. It means the merged artifact model already preserves enough identity, timestamps, and bounded events for later mechanical aggregation.

## CLI boundary

The merged telemetry layer stays mechanical.

Allowed utility behavior:

- read/write lifecycle artifacts
- validate schema and invariants
- aggregate deterministic snapshots

Forbidden utility behavior:

- interpret prose to infer missing closure truth
- classify source changes semantically
- attribute root cause or skill blame

Those remain agent responsibilities.

## Negative rules

- do not collapse logs, reviews, verification, steps, and metrics into one artifact family
- do not let closure truth depend on commit presence, chat summaries, or informal review pass
- do not store absolute runtime-only trace paths as canonical repo truth
- do not promise merged telemetry commands before utility specification and runtime packages define them
