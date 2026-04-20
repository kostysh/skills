# Lifecycle Telemetry

## Applies to

This reference defines the active telemetry contract for:

- `CLI command: feature-intake`
- `Workflow stage: spec-compact`
- `Workflow stage: plan-slice`
- `Workflow stage: implementation`
- `CLI command: lifecycle-refresh`

Use it together with:

- [feature-intake-logging.md](feature-intake-logging.md)
- [workflow-stage-logging.md](workflow-stage-logging.md)
- [workflow.md](workflow.md)

## Purpose

Lifecycle telemetry exists so retrospective can reason from durable, structured evidence instead of reconstructing timelines from prose.

The contract has three layers:

1. structured lifecycle telemetry written into intake/stage logs;
2. mechanical utility support that validates and aggregates structured fields;
3. agent-authored retrospective analysis that interprets signals, attributes process gaps, and proposes fixes.

Boundary rule:

- the agent owns semantic interpretation, root-cause analysis, and skill-gap attribution;
- the CLI owns only mechanical read/write/validate/aggregate behavior.

## Mandatory ownership

Lifecycle telemetry is always on for the lifecycle this skill owns:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`

Ordinary smooth cycles still produce telemetry. They use a thin record:

- YAML frontmatter at the top of the log;
- short narrative sections;
- empty arrays or `none` where nothing notable happened;
- truthful closure markers and durable artifact links only where the workflow actually reached them.

Absence of a log is no longer the low-overhead path.

## Log format

Lifecycle logs must start with YAML frontmatter fenced by `---`.

Example:

```md
---
feature_id: F-0001
feature_cycle_id: fc01
backlog_item_key: auth-password-reset
command: feature-intake
cycle_id: c01
session_id: 019d...
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T09:00:00+02:00
intake_process_complete_ts: 2026-04-20T09:22:00+02:00
backlog_events: []
operator_interventions: []
process_miss_events: []
---

## Scope

none
```

Use the same format for stage logs, replacing `command` with `stage`.

## Identity model

Two ids are required and they do different work:

- `feature_cycle_id` groups one end-to-end lifecycle run, for example `fc01`;
- `cycle_id` remains the command-local or stage-local closure-target id, for example `c01` for intake or a short stage-local cycle id for stage logs.

Rules:

- keep `feature_cycle_id` stable across intake, spec, planning, implementation, verification/review/close-out refreshes, and the related lifecycle snapshot;
- keep `cycle_id` stable only while the literal command/stage closure target is unchanged;
- `feature_cycle_id` supplements `cycle_id`; it never replaces it.

## Session anchors

Mandatory lifecycle telemetry must capture session anchors when the runtime exposes them reliably.

Required fields:

- `session_id`
- `trace_runtime`
- `trace_locator_kind`

Rules:

- in Codex, use `CODEX_THREAD_ID` when available;
- when the runtime can provide a reliable session id, omitting `session_id` is a process miss, not a normal outcome;
- never store absolute local trace-file paths in repo artifacts;
- use `trace_locator_kind` to describe the stable lookup seam, not a machine-local file path.

## Canonical timestamps

Primary timestamps:

- `start_ts`
- `intake_process_complete_ts`
- `local_gates_green_ts`
- `process_complete_ts`
- `step_close_ts`
- `first_review_agent_started_ts`
- `final_pass_ts`
- optional trace-only `final_commit_ts`

Writer rules:

- `feature-intake.start_ts` is the canonical full-cycle start marker.
- `intake_process_complete_ts` is written only by truthful `feature-intake` closure for the same closure target.
- `process_complete_ts` is written only when the same closure target reached truthful stage completion.
- `implementation.process_complete_ts` counts as the primary engineering end marker only when it matches successful `dossier-step-close` closure for the same closure target.
- `step_close_ts` is the durable companion timestamp for the step artifact update.
- `final_commit_ts` is trace metadata only. It is never a lifecycle gate.

## Bounded event arrays

Event arrays are the authoritative machine-readable source for metrics and friction accounting.

Use these arrays when they apply:

- `review_events[]`
- `verification_events[]`
- `backlog_events[]`
- `operator_interventions[]`
- `process_miss_events[]`
- optional `hard_incident_events[]`

Keep arrays empty when the event class did not occur.

### `review_events[]`

Minimum bounded fields:

- `requested_ts`
- `verdict_ts`
- `role`
- `verdict`
- `allowed_by_policy`
- `invalidated`
- `rerun_reason`

Evidence rules:

- attempts with `invalidated: true` do not count as review evidence;
- attempts with `allowed_by_policy: false` do not count as review evidence;
- those attempts still count as orchestration/friction/process telemetry.

### `verification_events[]`

Minimum bounded fields:

- `name`
- `status`
- `started_ts`
- `finished_ts`
- `failure_class`

Use `status: fail` only for real failed checks; skipped checks should use `skip`.

### `backlog_events[]`

Minimum bounded fields:

- `event_class`
- `status`
- `started_ts`
- `finished_ts`

Recommended event classes:

- `patch_item`
- `refresh`
- `refresh_then_patch`
- `source_update`
- `new_backlog_item`

Failure-like states for metrics:

- `blocked`
- `failed`
- `incomplete`

### `operator_interventions[]`

Minimum bounded fields:

- `intervention_class`
- `ts`
- optional `ref`

### `process_miss_events[]`

Minimum bounded fields:

- `miss_id`
- `severity`
- `ts`
- `class`

`heavy-runtime-misuse:` may appear in the narrative `Process misses` section, but machine-facing telemetry must come from explicit bounded fields rather than CLI inference from prose.

## Core metrics v1

These are the primary lifecycle metrics the logging method is expected to make computable from canonical telemetry:

- `feature_cycle_time`
- `phase_cycle_time`
- `review_loop_time`
- `rerounds_per_feature`
- `first_pass_close_rate`
- `closure_latency`
- `verification_friction`
- `backlog_actualization_friction`
- `operator_interventions_total`
- `telemetry_completeness`

The shipped lifecycle snapshot currently materializes this built-in subset directly:

- `feature_cycle_time_ms`
- `phase_cycle_time_ms`
- `review_loop_time_ms`
- `rerounds_per_feature`
- `first_pass_close`
- `closure_latency_ms`
- `verification_failures_total`
- `backlog_actualization_failures_total`
- `operator_interventions_total`

Metrics such as `verification_friction`, `backlog_actualization_friction`, and `telemetry_completeness` remain computable from the same bounded events and timestamps, but retrospective consumers may derive them until the runtime artifact grows an explicit field for them.

Derived-only signals that remain retrospective-layer unless explicitly added later:

- broad `incident_rate`
- exact cross-review `audit_yield`
- weighted `operator effort cost`

## Lifecycle snapshot artifact

The canonical aggregated artifact is:

```text
.dossier/metrics/<feature-id>/<feature_cycle_id>.json
```

It is built mechanically from structured telemetry and durable JSON artifacts.

Minimum content:

- lifecycle identity;
- intake/stage timestamps;
- linked intake/stage log paths;
- linked step artifacts used for truthful implementation closure;
- derived metrics such as:
  - `feature_cycle_time_ms`
  - `phase_cycle_time_ms`
  - `review_loop_time_ms`
  - `rerounds_per_feature`
  - `first_pass_close`
  - `closure_latency_ms`
  - `verification_failures_total`
  - `backlog_actualization_failures_total`
  - `operator_interventions_total`

## Repo-local session discoverability

The repo-local hint/index surface is:

```text
.dossier/retro/session-index.jsonl
```

Minimum record:

- `feature_cycle_id`
- `feature_id`
- `backlog_item_key`
- `stage`
- `session_id`
- `trace_runtime`
- `trace_locator_kind`
- `stage_log_path`
- `start_ts`
- `end_ts`

Rules:

- this file is a hint/index surface, not authoritative trace resolution by itself;
- multiple records may exist for one `feature_cycle_id`;
- one `feature_cycle_id` may span multiple `session_id` values;
- records are machine-generated from structured telemetry, not manually authored narrative.

## Mechanical helper boundary

The shipped helper is:

- `node scripts/dossier.mjs lifecycle-refresh --feature-id F-XXXX [--feature-cycle-id fcNN]`

Helper responsibilities:

- read structured lifecycle logs and durable JSON artifacts;
- validate required ids and the closure ties it can deterministically prove;
- compute deterministic counters and durations;
- refresh lifecycle snapshot artifacts;
- refresh repo-local session-index records from current structured telemetry.

Negative boundary:

- no prose interpretation;
- no root-cause inference;
- no semantic grouping of findings from free text;
- no skill-blame attribution;
- no hidden auto-open or hidden auto-rewrite of stage logs.
