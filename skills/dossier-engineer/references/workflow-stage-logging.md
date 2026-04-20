# Workflow Stage Logging

## Applies to

This reference defines the lifecycle telemetry contract for three workflow stages only:

- `Workflow stage: spec-compact`
- `Workflow stage: plan-slice`
- `Workflow stage: implementation`

It does not apply to `CLI command: feature-intake`; use [feature-intake-logging.md](feature-intake-logging.md) for intake telemetry.

Use it together with [lifecycle-telemetry.md](lifecycle-telemetry.md).

## Purpose

A stage log is lifecycle telemetry for one stage closure target.

It records:

- stage-local decisions and reclassifications;
- review, verification, backlog, operator, and process-miss events;
- lifecycle timestamps and closure markers;
- links to durable verification/review/step artifacts;
- enough structure for deterministic metric aggregation without prose analysis.

It does not replace the Feature Dossier.

## Storage path

Use:

```text
.dossier/logs/<feature>/<stage>-<cycle>.md
```

Rules:

- `<feature>` should match the dossier feature id or stable slug;
- `<stage>` must be one of `spec-compact`, `plan-slice`, or `implementation`;
- `<cycle>` remains the stage-local closure-target id;
- one log file equals one stage-local closure target.

## Always-on rule

`spec-compact`, `plan-slice`, and `implementation` always leave stage logs for the owned lifecycle.

Use a thin log instead of a skip path:

- YAML frontmatter fenced by `---`;
- concise narrative sections;
- empty event arrays when nothing happened;
- `none` in empty narrative sections instead of long prose.

Do not use `log_required` or `log_required_reason` in the active contract.

## Timing rule

- open or update the stage log before the first substantive mutation of the stage;
- keep it current through review, backlog actualization, and close-out;
- if the log starts late, capture that in `process_miss_events[]`.

## Required frontmatter

Every stage log must start with YAML frontmatter fenced by `---`.

Minimum fields:

```yaml
---
feature_id: F-XXXX
feature_cycle_id: fc01
backlog_item_key: CF-XXX
stage: spec-compact | plan-slice | implementation
cycle_id: short-human-readable-id
session_id: 019d...
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T10:00:00+02:00
local_gates_green_ts: 2026-04-20T10:45:00+02:00
process_complete_ts: 2026-04-20T11:10:00+02:00
step_close_ts: 2026-04-20T11:12:00+02:00
first_review_agent_started_ts: 2026-04-20T10:52:00+02:00
final_pass_ts: 2026-04-20T11:05:00+02:00
source_inputs:
  - docs/ssot/index.md
repo_overlays:
  - AGENTS.md
review_events: []
verification_events: []
backlog_events: []
operator_interventions: []
process_miss_events: []
hard_incident_events: []
---
```

Add durable artifact links when the workflow actually produced them, for example:

```yaml
verification_artifact: .dossier/verification/...
review_artifact: .dossier/reviews/...
step_artifact: .dossier/steps/...
```

Rules:

- `feature_cycle_id` must stay stable across intake and all three stages for the same lifecycle run;
- `cycle_id` stays stage-local and does not replace `feature_cycle_id`;
- in runtimes with reliable session identity, omitting `session_id` is a process miss;
- `implementation.process_complete_ts` is truthful only when the referenced `step_artifact` is a successful `dossier-step-close` artifact for the same closure target;
- `verification_artifact`, `review_artifact`, and `step_artifact` are mandatory only when the workflow actually produced the linked durable artifact for that closure target;
- `final_commit_ts`, when used, remains trace metadata only.

## Required narrative sections

After the frontmatter, keep these sections:

- `Scope`
- `Inputs actually used`
- `Decisions / reclassifications`
- `Operator feedback`
- `Review events`
- `Backlog actualization`
- `Process misses`
- `Close-out`

Inside `Decisions / reclassifications`, always keep these subheadings:

- `Spec gap decisions`
- `Implementation freedom decisions`
- `Temporary assumptions`

If a section or subheading has nothing notable, write `none`.

## Event arrays are authoritative

Event arrays are the primary metric source. Summary counters may exist for convenience, but they are derived and non-authoritative when equivalent events exist.

Use these arrays when they apply:

- `review_events[]`
- `verification_events[]`
- `backlog_events[]`
- `operator_interventions[]`
- `process_miss_events[]`
- optional `hard_incident_events[]`

Evidence rule for review metrics:

- attempts with `invalidated: true` do not count as review evidence;
- attempts with `allowed_by_policy: false` do not count as review evidence;
- those attempts still count as orchestration or friction telemetry.

## Stage-specific emphasis

### `spec-compact`

The stage log should preserve:

- implementation-shaping decisions and reclassifications;
- whether the heavy-runtime trigger fired and where the runtime envelope lives;
- backlog actualization outcome when shaping changed backlog truth.

### `plan-slice`

The stage log should preserve:

- slice boundary decisions and reshapes;
- assumptions/fallbacks;
- whether a heavy-runtime verification ladder was defined;
- whether the only-observable-seam exception was invoked;
- backlog actualization outcome when planning changed backlog truth.

### `implementation`

The stage log should preserve:

- slice/package completion status;
- review and verification evidence linked to the closure target;
- backlog actualization result and backlog artifact integrity result;
- `step_close_ts` and the linked step artifact;
- heavy-runtime misuse as an explicit `process_miss_events[]` entry when it occurred.

If the heavy-runtime branch is active, repeated heavy smoke / repeated cold-start / repeated cache-download reruns are a process smell rather than neutral work unless an explicit exception applies.

## Mechanical helper boundary

`node scripts/dossier.mjs lifecycle-refresh` may read these stage logs and aggregate:

- lifecycle snapshot artifacts in `.dossier/metrics/...`;
- repo-local session anchors in `.dossier/retro/session-index.jsonl`.

The helper is mechanical only:

- it reads structured frontmatter and JSON artifacts;
- it computes deterministic counters and durations;
- it does not interpret narrative prose and does not infer missing events from free text.
