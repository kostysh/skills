# Workflow Stage Logging

## Applies to

This reference defines the logging contract for three workflow stages only:

- `Workflow stage: spec-compact`
- `Workflow stage: plan-slice`
- `Workflow stage: implementation`

It is not a generic logging policy for every command or future stage.
It does not apply to `CLI command: feature-intake`; use [feature-intake-logging.md](feature-intake-logging.md) for intake telemetry.

Use it together with the relevant stage in [../SKILL.md](../SKILL.md) and the detailed stage step references.

## Purpose

A stage log is process telemetry.

It answers: how did this stage reach the current truth?

It records decisions, operator clarifications, review rounds, process misses, source inputs, and backlog actualization reasoning. It supports retrospective process analysis.

It does not replace the Feature Dossier. The Feature Dossier remains the feature SSoT for current requirements, design, slices, coverage, links, and change history.

It also does not replace verification artifacts, review artifacts, step closure artifacts, or backlog actualization through `backlog-engineer`.

## Storage path

Use:

```text
.dossier/logs/<feature>/<stage>-<cycle>.md
```

Rules:

- `<feature>` should match the dossier feature id or stable slug.
- `<stage>` must be one of `spec-compact`, `plan-slice`, or `implementation`.
- `<cycle>` should be short and human-readable.
- One log file equals one closure target.
- If a second independent closure target appears, open a new cycle log instead of stretching the old one.

## When logging is required

Open or update a stage log when any trigger fires:

- the stage changes backlog truth or requires backlog actualization;
- operator feedback or clarification changes the stage direction;
- external review returns findings or causes a reround;
- an open question is resolved, reclassified, or intentionally deferred;
- planning slice boundaries are reshaped after the first plan;
- the stage follows an explicit plan, package, refactoring plan, or multi-pass workflow;
- a process miss occurs;
- a decision or assumption goes beyond the current process model;
- retrospective process analysis is requested or reasonably expected.

## Low-overhead skip path

A stage log may be skipped only when all conditions are true:

- the change is trivial and one-step;
- backlog truth did not change;
- no operator clarification changed the stage direction;
- no external review reround occurred;
- no open question was resolved or reclassified;
- no process miss occurred;
- retrospective telemetry was not requested and is not reasonably expected.

If skipped, state the reason in the final summary. Example:

```text
stage log skipped: trivial wording-only correction; no logging trigger fired
```

## Timing rule

- If a logging trigger is known before edits, open the log before the first substantive mutation.
- If the trigger appears mid-stage, open the log immediately.
- For late starts, record `late_start: true` and a process miss note.
- Keep the log current through review, backlog actualization, step closure, and commit when the stage includes a commit.

## Mandatory metadata block

Every required stage log must start with a machine-friendly metadata block.

Minimum fields:

```yaml
feature_id: F-XXXX
backlog_item_key: CF-XXX
stage: spec-compact | plan-slice | implementation
cycle_id: short-human-readable-id
session_id: 019d... # omit if runtime does not expose a reliable value
start_ts: 2026-04-10T10:00:00+02:00
ready_for_review_ts: 2026-04-10T10:45:00+02:00
final_pass_ts: 2026-04-10T11:10:00+02:00
source_inputs:
  - docs/ssot/index.md
repo_overlays:
  - AGENTS.md
log_required: true
log_required_reason:
  - backlog_actualization
  - review_reround
backlog_actualized: true
backlog_artifact_integrity: clean | blocked | not_applicable
planned_slices:
  - SL-1
slice_status:
  SL-1: complete | in_progress | blocked | not_started
current_checkpoint: all_planned_slices_complete | allowed_stop_point | blocked | operator_pause | checkpoint_only
completion_decision: final_closeout | allowed_stop | blocked_waiting_operator | checkpoint_progress_only
canonical_for_commit: true | false | not_applicable
supersedes:
  - .dossier/reviews/old-review.md
generated_after_commit: true | false
freshness_basis: intended_final_tree | post_commit_trace_backfill | superseded_draft | not_applicable
operator_command_refs:
  - cmd-001
process_miss_refs:
  - miss_id: PM-001
    severity: low | medium | high
    operator_command_ref: cmd-001
    stage_log_ref: .dossier/logs/...
    decision_ref: .dossier/logs/...#decision
    resolution_ref: .dossier/logs/...#resolution
review_events:
  - agent_id: reviewer-agent-id
    role: spec-conformance | code | security | independent
    model: gpt-5.4
    requested_ts: 2026-04-10T10:44:00+02:00
    verdict_ts: 2026-04-10T10:50:00+02:00
    verdict: pass | findings | blocked
    rerun_reason: none | review_findings | transport_runtime_instability
    scope: short scope description
verification_artifact: .dossier/verification/...
review_artifact: .dossier/reviews/...
step_artifact: .dossier/steps/...
review_requested_ts: 2026-04-10T10:44:00+02:00
first_review_agent_started_ts: 2026-04-10T10:45:00+02:00
review_models:
  - gpt-5.4
review_retry_count: 1
review_wait_minutes: 17
transport_failures_total: 0
rerun_reasons:
  - review_findings
operator_review_interventions_total: 1
```

## `session_id`

Record `session_id` only when the runtime exposes a reliable value.

In Codex, use `CODEX_THREAD_ID` when it is present. In practice this value matches the active rollout/session id used in `$CODEX_HOME/sessions/.../rollout-...-<id>.jsonl`.

If no reliable runtime signal exists, omit `session_id` instead of inventing a placeholder string.

Examples:

```yaml
session_id: 019d3d53-b9a0-7811-974f-27688bba0eb7
```

```yaml
# session_id omitted because the runtime did not expose a reliable value
```

## Required narrative sections

After the metadata block, keep a short narrative structure:

- `Scope`
- `Inputs actually used`
- `Decisions / reclassifications`
- `Operator feedback`
- `Review events`
- `Backlog actualization`
- `Process misses`
- `Close-out`

The narrative is still useful. The metadata block does not replace it.

Inside `Decisions / reclassifications`, always include these subheadings:

- `Spec gap decisions`
- `Implementation freedom decisions`
- `Temporary assumptions`

If a class has no entries, write `none` under that subheading instead of omitting it.

Keep these sections concise. Do not copy Feature Dossier truth, full AC text, slice text, task text, or full review reports into the log.

## Completion, freshness, and trace anchors

Use these fields when they apply; do not fill them with invented placeholders.

Implementation completion fields:

- `planned_slices`: planned slice or package ids for the current closure target.
- `slice_status`: per-slice state: `complete`, `in_progress`, `blocked`, or `not_started`.
- `current_checkpoint`: current boundary, such as `all_planned_slices_complete`, `allowed_stop_point`, `blocked`, `operator_pause`, or `checkpoint_only`.
- `completion_decision`: why the agent is allowed to close, stop, block, or report checkpoint progress.

Freshness fields are conditionally required for new implementation closure / step-close artifacts when freshness applies: the artifact was created after verification/review, supersedes a previous artifact, references committed state, or receives post-commit trace-only metadata.

- `canonical_for_commit`: whether this artifact is the canonical final artifact for the commit-linked closure target.
- `supersedes`: previous artifacts made obsolete by this artifact.
- `generated_after_commit`: true only for post-commit artifacts or trace-only backfills.
- `freshness_basis`: `intended_final_tree`, `post_commit_trace_backfill`, `superseded_draft`, or `not_applicable`.

Commit SHA, when recorded, is a trace link only. It is not a validity criterion for dossier or backlog artifacts. Post-commit metadata backfill must not change technical content, verification conclusions, review conclusions, or backlog truth.

Trace anchors:

- `operator_command_refs` records the operator commands that materially shaped this stage.
- `process_miss_refs` records `miss_id`, `severity`, `operator_command_ref`, `stage_log_ref`, `decision_ref`, and `resolution_ref` for each process miss.
- `review_events` records `agent_id`, `role`, `model`, `requested_ts`, `verdict_ts`, `verdict`, `rerun_reason`, and `scope` for each external review event.

These fields are required only when the corresponding events actually happened.

## Review orchestration telemetry

When any external review was requested, record review orchestration as structured data, not only prose.

Required fields:

- `review_requested_ts`
- `first_review_agent_started_ts`
- `review_models`
- `review_retry_count`
- `review_wait_minutes`
- `transport_failures_total`
- `rerun_reasons`
- `operator_review_interventions_total`

Interpretation rules:

- `review_retry_count` counts reruns or retries after the initial request.
- `review_wait_minutes` should cover the total wait between the first review request and the final usable review verdict.
- `transport_failures_total` counts API, runtime, transport, or platform failures that forced a retry.
- `rerun_reasons` must distinguish `review_findings` from `transport_runtime_instability`.
- If the same cycle had both findings-driven and transport-driven reruns, record both reasons instead of collapsing them into one prose summary.
- `review_models` should list the actual reviewer model(s) used across the cycle when that information is visible.

## Stage-specific sections

### `spec-compact`

Capture:

- AC changes summary by stable AC id only;
- open questions resolved, reclassified, or intentionally deferred;
- `Terms & thresholds` trigger result;
- contract, safety, and operator-agent contract decisions;
- backlog actualization outcome.

Classify implementation-shaping decisions as:

- `normative now`
- `implementation freedom`
- `temporary assumption`

### `plan-slice`

Capture:

- slice boundary decisions by `SL-*` id only;
- `allowed_stop_points` for multi-slice or package-based plans;
- slices created, removed, or reshaped;
- dependencies, assumptions, and fallbacks added during planning;
- drift-guard planning;
- real usage audit planning;
- corrective categories when planned;
- backlog actualization outcome.

### `implementation`

Capture:

- package or increment id;
- planned slices, slice status, current checkpoint, and completion decision;
- changed scope paths count;
- review policy and review rounds;
- `spec-conformance`, `code-reviewer`, and `security-reviewer` audit events when applicable;
- early security seam checkpoint event when triggered;
- debt review result;
- freshness fields for implementation closure / step-close artifacts when applicable;
- commit metadata when committed;
- implementation-specific process misses;
- backlog actualization outcome and backlog artifact-integrity result.

## Decision classes

Do not mix all decisions outside the current model into one bucket.

Use these classes for every required stage log:

### Spec gap decisions

Decisions that show the current specification or process model is too weak and should be revised later.

### Implementation freedom decisions

Legitimate local design choices that stay within the specification and do not require immediate spec changes.

### Temporary assumptions

Assumptions that must be removed, validated, or explicitly carried forward before the wider cycle is treated as clean.

## Review event log

Every required stage log should contain a review-event block with timestamps.

Recommended shape:

```md
### Review events

- 2026-04-10T10:45:00+02:00 `spec` requested
- 2026-04-10T10:50:00+02:00 `spec` non-compliant
  - missing backlog actualization wording
- 2026-04-10T10:57:00+02:00 follow-up applied
- 2026-04-10T11:02:00+02:00 `spec` pass
```

Useful fields to capture:

- request time;
- initial verdict;
- final verdict;
- short findings summary;
- whether follow-up was applied;
- whether the follow-up required narrow re-audit.
- whether the reround happened because of review findings or because of transport/runtime instability.

## Backlog actualization

When the stage changes backlog truth, the log must record:

- what changed: lifecycle state, blocker, dependency, context fact, source registration, or follow-up work;
- which `backlog-engineer` action was used;
- the patch, packet, command output, or durable artifact that proves actualization;
- whether actualization completed before stage closure;
- whether backlog artifact integrity was clean after actualization, or which command/error blocked clean closure.

Do not treat `refresh` alone as actualization when dossier work changed lifecycle, blockers, dependencies, or context facts.

## Process misses

Log process misses explicitly.

Examples:

- start timestamp was captured late;
- logging trigger was recognized after mutating edits began;
- review brief omitted already-fixed findings;
- final commit metadata was backfilled late;
- one cycle accidentally grew a second closure target;
- backlog actualization was discovered after close-out had started.

Do not hide process misses inside general prose.

## Metrics to capture

### Shared metrics

- `duration_minutes`
- `operator_clarifications_total`
- `review_rounds_total`
- `review_findings_total`
- `process_misses_total`
- `backlog_actualization_count`
- `late_log_start`
- `review_retry_count`
- `review_wait_minutes`
- `transport_failures_total`
- `operator_review_interventions_total`

### Specification metrics

- `ac_changed_total`
- `open_questions_resolved_total`
- `open_questions_reclassified_total`
- `normative_now_decisions_total`
- `implementation_freedom_decisions_total`
- `temporary_assumptions_total`

### Planning metrics

- `slices_created_total`
- `slices_reshaped_total`
- `slice_boundary_changes_after_first_plan`
- `dependencies_added_total`
- `fallbacks_added_total`
- `drift_guard_items_planned_total`
- `real_usage_audit_planned`

### Implementation metrics

- `scope_paths_count`
- `code_review_rounds_total`
- `security_review_rounds_total`
- `spec_review_rounds_total`
- `debt_items_found_total`
- `debt_items_resolved_total`
- `commit_recorded`
- `planned_slices_total`
- `completed_slices_total`
- `allowed_stop_point_used`
- `early_security_checkpoint_count`
- `freshness_backfill_count`

### Review metrics

- initial verdict by review type;
- final verdict by review type;
- findings count by review type;
- findings count by severity;
- reround count;
- rerun reason count by class;
- `ready_for_review -> first verdict` latency;
- `first non-pass -> final pass` latency;
- `review_requested -> first reviewer start` latency;
- `review_requested -> final usable verdict` latency;
- stale finding count;
- skipped review count and reason.

### Process metrics

- cycles with missing start timestamp;
- cycles with missing final commit metadata;
- cycles where the log was restored after work started;
- cycles closed without exact duration;
- cycles requiring operator clarification;
- cycles where review brief quality caused rework.

## Commit metadata

Commit metadata is trace-only.

Record it when a stage includes a commit:

```yaml
commit_ts: 2026-04-10T11:20:00+02:00
commit_sha: abc1234
```

Commit SHA records which repository state was visible when the event happened. It is not a freshness, validity, or lifecycle gate.

## Minimal quality bar

When logging was required, the stage log is process-incomplete if any of these is missing without explicit explanation:

- start capture before the first substantive mutation, or `late_start: true` plus a process miss note;
- source inputs actually used;
- review events for required external audits;
- backlog actualization outcome when the stage changed backlog truth;
- final commit metadata when the stage included commit;
- explicit note about exact vs approximate duration;
- explicit note about decisions beyond the current model.

## Closure rule

If logging was required:

- the stage exit checklist cannot pass until the log links applicable verification, review, step-close, and backlog actualization artifacts;
- missing links must be explained explicitly;
- logging is not sufficient for closure by itself.
