# Telemetry and closure

Use this reference when designing lifecycle identity, logs, closure artifacts, or retrospective support in this skill.

Use it together with:

- [Audit policy](audit-policy.md)
- [Delivery workflow layer](delivery-workflow-layer.md)
- [Commandized stage control](commandized-stage-control.md)
- [Implementation pre-review checklists](implementation-pre-review-checklists.md)

## Purpose

This skill must stay observable without inventing magical runtime behavior.

Telemetry must support:

- deterministic lifecycle reconstruction
- truthful blocked/open/closed closure state
- retrospective-ready objective signals
- operator-facing evidence for process-improvement decisions
- clear separation between mechanical aggregation and agent-owned semantic analysis

## Artifact families

This design keeps telemetry and closure artifacts in separate accounting families under `.dossier`:

- logs under `.dossier/logs/*`
- helper-managed stage state under `.dossier/stages/*`
- review artifacts under `.dossier/reviews/*`
- verification artifacts under `.dossier/verification/*`
- step-close artifacts under `.dossier/steps/*`
- lifecycle snapshots under `.dossier/metrics/*`
- session discoverability under `.dossier/retro/session-index.jsonl`

Do not collapse these into one prose log or one generic journal file.

Review artifacts must remain capable of carrying policy-visible audit-bundle truth:

- `audit_class`
- immutable attempt identity: `review_attempt_id`, `review_round_id`, and `review_round_number`
- immutable attempt artifact role and path linkage
- optional stable/latest copy path that points back to the immutable attempt
- external-versus-degraded review mode
- reviewer provenance
- freshness / invalidation state
- implementation review-scope and security-trigger data where applicable

Stable/latest review artifact references are backward-compatible full artifact JSON copies. They may help old consumers find the latest attempt for `(feature_id, stage, audit_class)`, but they are not the authoritative evidence and must carry `immutable_artifact_path` so new consumers can resolve the immutable attempt.

Review artifacts and helper-managed stage state are observable workflow evidence. They may record declared review mode, reviewer identity, reviewer skill, reviewer agent identity, reviewer thread provenance, freshness, and invalidation state, but they must not be presented as proof of launch-mode independence such as `fork_context`, full-history inheritance, prompt mutability, or model tier.

## Identity contract

The telemetry layer must preserve these stable identities:

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

Telemetry must preserve the current useful shape:

- intake and stage logs remain human-readable Markdown artifacts
- helper-managed stage state remains the structured coordination surface for stage scope, current-cycle audit-bundle membership, and close-out validation
- those logs start with YAML frontmatter
- machine-readable fields live in bounded structured fields, not in CLI inference from prose
- narrative sections remain required for operator-facing human context on non-trivial stages

Minimum machine-readable fields stay explicit:

- canonical ids
- canonical timestamps
- bounded event arrays where applicable
- linked durable artifact references where such artifacts truly exist
- required versus executed audit classes for mutating-stage close-out
- reviewer provenance / reviewer skill / reviewer agent identity when available
- review freshness or invalidation markers
- pending or blocked required external review signals

Machine-complete stage schema fields:

- `.dossier/stages/*` is authoritative for structured coordination/validation fields introduced for parity, linkage, skill annotations, structured process misses, and scope identity;
- stage log YAML frontmatter mirrors these fields as a bounded human-readable view;
- parity-protected fields include `backlog_followup_required`, `backlog_followup_kind`, `backlog_followup_resolved`, `review_artifacts`, `review_events`, `verification_artifacts`, `step_artifact`, `final_delivery_commit`, `final_closure_commit`, `skills_used`, `skill_issues`, `skill_followups`, `process_misses`, `primary_feature_id`, `primary_backlog_item_key`, and `phase_scope`;
- selected-feature lifecycle reconciliation fields are also parity-protected: `backlog_lifecycle_target`, `backlog_lifecycle_current`, `backlog_lifecycle_reconciled`, `backlog_actualization_artifacts`, and `backlog_actualization_verdict`;
- implementation pre-review checklist fields are parity-protected for the `implementation` stage: `pre_review_risk_families`, `pre_review_checklists`, `pre_review_checklist_status`, and `pre_review_checklist_blockers`;
- implementation post-close backlog hygiene fields are parity-protected for the `implementation` stage: `post_close_backlog_hygiene_required`, `post_close_backlog_hygiene_status`, `post_close_backlog_hygiene_artifact`, `post_close_backlog_hygiene_checked_at`, `post_close_backlog_hygiene_refresh_at`, `post_close_open_source_review_count`, `post_close_source_review_blocked_item_count`, `post_close_lifecycle_reconciliation_drift_count`, `post_close_unresolved_attention_present`, and `post_close_backlog_hygiene_blockers`;
- review/verification/close-out artifact linkage is explicit in machine fields and must not require heuristic recovery from prose;
- `review_events[]` links each attempt to `audit_class`, `verdict`, `review_attempt_id`, `review_round_id`, `review_round_number`, immutable `artifact_path`, optional `latest_copy_path`, reviewer provenance, freshness, and invalidation state;
- `review_artifacts` is an ordered unique list of immutable attempt artifact paths, including FAIL and PASS attempts;
- backlog actualization artifacts are trace links to accepted backlog mutations, while current backlog state remains the source of truth for lifecycle reconciliation;
- commit anchors are optional trace links only and must not become required closure evidence;
- skill annotations are explicit agent-supplied state and must not be scraped from conversation traces;
- `process_misses` is structured state with `id`, `category`, `severity`, `resolved`, and `summary`; prose rendering is not the source of truth.

Purpose rule:

- logs exist not only for lifecycle reconstruction;
- logs also exist to support operator judgment about process, skills, and methods;
- frontmatter plus a mechanical transition list is not sufficient for a non-trivial stage.

Operator-language rule:

- Agent-authored narrative content in dossier logs follows the operator language by default.
- An explicit operator language preference wins over the language inferred from the current request.
- In multilingual or ambiguous sessions, use the language of the current operator request unless an explicit operator language preference says otherwise.
- Generated scaffold headings may remain stable English labels unless this skill introduces a separate localization policy.
- Machine-readable fields stay schema-shaped and are not localized.
- Commands, paths, identifiers, JSON keys, YAML frontmatter keys, tool names, skill names, and direct quotes must remain exact and must not be translated.
- Historical logs are not rewritten only for language normalization.

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

For `plan-slice`, material target clarification, goal reclassification, or ambiguity resolution belongs in `Decisions / reclassifications`.
If the implementation objective remains ambiguous, record the blocker in structured `process_misses` or `Close-out` as appropriate instead of hiding it behind a mechanical transition.

If future stage-controller commands add progress-transition fields, they must remain subordinate to this telemetry model:

- progress transitions may add deterministic stage-progress evidence;
- they must not replace helper-owned closure truth;
- repeated block/resume history should live in bounded transition events rather than ambiguous singleton summary timestamps.
- helper-owned closure updates must preserve authored narrative sections instead of collapsing the log back to a mechanical body.

When helper-owned closure updates materialize audit policy state, stage logs and/or review artifacts must stay able to show:

- which mutating-stage audit classes were required;
- which audit classes were actually executed;
- whether closure is blocked by missing, stale, invalidated, or degraded review evidence.
- whether recorded review evidence is limited to observable provenance rather than proof of reviewer launch-mode independence.
- that implementation pre-review checklist evidence, when present, is author-side readiness context rather than correctness proof or audit evidence.
- that implementation post-close backlog hygiene evidence, when required, links to a durable refresh/status/attention/queue artifact before branch-complete reporting.

## Session anchors

Retrospective discoverability must stay deterministic.

Required rules:

- session anchors are stored in repo artifacts only as stable lookup seams
- `.dossier/retro/session-index.jsonl` stores session anchors, not absolute machine-local trace paths
- session discoverability must remain runtime-aware without hardcoding one workstation layout as universal truth
- stage logs and helper-managed stage state get `session_id` from explicit `--session-id` input supplied by the agent
- stage-controller writes must fail closed rather than emit `trace_locator_kind: session_id` with `session_id: null`
- runtime-specific environment variables may help the agent determine a session id before invocation, but they are optional convenience context and not the portable telemetry contract

## Source-review signals

Telemetry must reflect source-review blocking truth.

Minimum required signals:

- `open_source_review_count`
- `source_review_blocked_item_count`
- post-close backlog hygiene counts for `missing`, `stale`, and `blocked` implementation evidence

Those signals belong to deterministic readiness reporting. They do not require prose analysis.

## Closure truth

The design must keep closure strict.

Required rules:

- blocked, open, and closed remain truthful durable states
- implementation closure truth requires authoritative step-close evidence
- `dossier-step-close` must fail closed before writing a step artifact when `spec-compact`, `plan-slice`, or `implementation` lifecycle reconciliation is not satisfied by current backlog truth
- successful helper-owned closure must update helper-managed stage state and mirrored frontmatter with `step_close_ts`, `step_artifact`, `process_complete_ts`, and lifecycle reconciliation fields
- successful `implementation` closure must update helper-managed stage state and mirrored frontmatter with `post_close_backlog_hygiene_required: true` and initial `post_close_backlog_hygiene_status: missing`
- `post-close-hygiene` must persist the durable `.dossier/verification/<feature>/implementation-post-close-backlog-hygiene.json` artifact and update the implementation stage state with clean or blocked summary fields
- stale hygiene is reported when the artifact predates implementation closure or current backlog truth timestamps such as `state.updated_at` or `last_refresh_at`
- `lifecycle-refresh` remains the shipped lifecycle aggregation helper for lifecycle snapshots and session-index refresh
- lifecycle timestamps must never materialize from chat-only or commit-only signals
- required mutating-stage external review must remain mechanically visible in durable artifacts rather than inferred from prose

Semantic heritage rule:

- the design preserves the current `dossier-step-close` and `lifecycle-refresh` semantics as authoritative closure and lifecycle-aggregation anchors
- those names remain the authoritative semantic anchors for closure and lifecycle aggregation

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
- lifecycle reconciliation drift count
- operator intervention counts
- telemetry completeness

This does not mean the first-wave runtime already materializes every desired metric field. It means the artifact model already preserves enough identity, timestamps, and bounded events for later mechanical aggregation.

Reround metrics must be computable from structured `review_events[]`. For new artifacts, use `review_round_number` per audit class; do not infer rerounds only from latest review artifacts.

Required review-policy observability now includes:

- required audit classes by mutating stage
- executed audit classes by mutating stage
- reviewer provenance / reviewer skill / reviewer agent identity where provided
- stale or invalidated audit evidence
- implementation review-scope and required-security-review signals

Canonical persisted field names for that observability are:

- `required_audit_classes`
- `executed_audit_classes`
- `required_external_review_pending`
- `implementation_review_scope`
- `required_security_review`
- `reviewer_skills`
- `reviewer_agent_ids`
- `review_trace_commits`
- `invalidated_review_present`
- `stale_review_present`
- `security_trigger_reasons`

## CLI boundary

The telemetry layer stays mechanical.

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
- do not promise telemetry commands before utility specification and runtime packages define them
