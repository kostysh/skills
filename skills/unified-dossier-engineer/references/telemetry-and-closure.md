# Telemetry and closure

Use this reference when designing lifecycle identity, logs, closure artifacts, or retrospective support in the merged skill.

## Purpose

The merged skill must stay observable without inventing magical runtime behavior.

Telemetry must support:

- deterministic lifecycle reconstruction
- truthful blocked/open/closed closure state
- retrospective-ready objective signals
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
- narrative sections remain allowed for human context

Minimum machine-readable fields stay explicit:

- canonical ids
- canonical timestamps
- bounded event arrays where applicable
- linked durable artifact references where such artifacts truly exist

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
- a future lifecycle aggregation helper may refresh lifecycle snapshots after step closure, but naming/help surface stays provisional until the utility specification and runtime packages land
- lifecycle timestamps must never materialize from chat-only or commit-only signals

Semantic heritage rule:

- the merged design preserves the current `dossier-step-close` and `lifecycle-refresh` semantics as authoritative closure and lifecycle-aggregation anchors
- those names are planning-stage semantic anchors here, not proof of already shipped merged commands

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

This does not mean the planning-stage skill already ships all metric fields. It means the merged artifact model must preserve enough identity, timestamps, and bounded events for future mechanical aggregation.

## CLI boundary

The merged telemetry layer stays mechanical.

Allowed future utility behavior:

- read/write lifecycle artifacts
- validate schema and invariants
- aggregate deterministic snapshots

Forbidden future utility behavior:

- interpret prose to infer missing closure truth
- classify source changes semantically
- attribute root cause or skill blame

Those remain agent responsibilities.

## Negative rules

- do not collapse logs, reviews, verification, steps, and metrics into one artifact family
- do not let closure truth depend on commit presence, chat summaries, or informal review pass
- do not store absolute runtime-only trace paths as canonical repo truth
- do not promise merged telemetry commands before utility specification and runtime packages define them
