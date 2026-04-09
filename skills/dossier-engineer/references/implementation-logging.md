# Implementation Logging

This reference defines the logging contract for package-based implementation work.

Use it together with `Workflow stage: implementation` in [../SKILL.md](../SKILL.md).

## When logging is required

Use an implementation log for any multi-step, package-based, or plan-driven implementation cycle.

At minimum, logging is expected when:

- the work follows a refactoring plan or explicit package sequence;
- external audits are part of the close-out path;
- the work is large enough that review rounds, corrective passes, or operator clarifications matter;
- retrospective analysis is expected after the cycle.

## Core rules

1. Create the package start entry before the first mutating edit.
2. One package equals one closure target.
3. Record external review events as they happen.
4. Record final commit information in the same package entry.
5. If a process miss happens, log it explicitly instead of hiding it in prose.

If a second independent closure target appears, open a new package id instead of stretching the old one.

## Mandatory metadata block

Every package entry should start with a machine-friendly metadata block.

Recommended fields:

```yaml
package_id: P1
cycle_id: process-hardening-1
skill: dossier-engineer
package_type: docs
change_kind:
  - process-contract
  - references
  - docs-tests
normative_sources:
  - docs/cross-skill-process-model.ru.md
  - SKILL.md
  - references/workflow.md
  - docs/refactoring-plan-5.ru.md
session_id: 019d...
start_ts: 2026-04-09T02:27:01+02:00
ready_for_review_ts: 2026-04-09T03:10:00+02:00
final_pass_ts: 2026-04-09T03:31:00+02:00
commit_ts: 2026-04-09T03:34:12+02:00
commit_sha: abc1234
review_policy:
  spec: required
  code: skipped
  security: skipped
review_rounds: 2
review_findings_total: 1
out_of_spec_decisions_total: 0
duration_minutes: 67
log_quality:
  start_captured: true
  commit_recorded: true
  duration_exact: true
```

## `session_id`

Record the session id when the runtime exposes it.

In the current Codex runtime, use `CODEX_THREAD_ID` when it is present. In practice this value matches the active rollout/session id used in `$CODEX_HOME/sessions/.../rollout-...-<id>.jsonl`.

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
- `Decisions / assumptions beyond the current model`
- `Local acceptance`
- `Review events`
- `Process misses`
- `Close-out`

The narrative is still useful. The metadata block does not replace it.

## Decision classes

Do not mix all decisions outside the current model into one bucket.

Use these classes:

### Spec gap decisions

Decisions that show the current specification or process model is too weak and should be revised later.

### Implementation freedom decisions

Legitimate local design choices that stay within the specification and do not require immediate spec changes.

### Temporary assumptions

Assumptions that must be removed, validated, or explicitly carried forward before the wider cycle is treated as clean.

## Review event log

Every package entry should contain a review-event block with timestamps.

Recommended shape:

```md
### Review events

- 2026-04-09T03:10:00+02:00 `spec` requested
- 2026-04-09T03:13:00+02:00 `spec` non-compliant
  - missing backlog actualization wording
- 2026-04-09T03:15:00+02:00 follow-up applied
- 2026-04-09T03:16:00+02:00 `spec` pass
```

Useful fields to capture:

- request time;
- initial verdict;
- final verdict;
- short findings summary;
- whether follow-up was applied.

## Process misses

Log process misses explicitly.

Examples:

- start timestamp was captured late;
- review brief omitted already-fixed findings;
- final commit sha was backfilled late;
- one package accidentally grew a second closure target.

Do not hide these inside general prose.

## Metrics to capture

### Package metrics

- `package_type`
- `change_kind_count`
- `scope_paths_count`
- `duration_minutes`
- `review_rounds_total`
- `out_of_spec_decisions_total`
- `process_misses_total`
- `commit_recorded`
- `duration_exact`

### Review metrics

- initial verdict by review type
- final verdict by review type
- findings count by review type
- findings count by severity
- reround count
- `ready_for_review -> first verdict` latency
- `first non-pass -> final pass` latency
- stale finding count
- skipped review count and reason

### Specification/process metrics

- `spec_gap_decisions_total`
- `implementation_freedom_decisions_total`
- `temporary_assumptions_total`
- `cross_skill_boundary_changes_total`
- `doc_runtime_drift_incidents_total`
- `plan_corrective_cycles_after_main_plan`
- `packages_triggered_by_real_usage_feedback`

### Process metrics

- packages with missing start timestamp
- packages with missing final commit id
- packages where the log was restored after work started
- packages closed without exact duration
- packages requiring operator clarification
- packages where review brief quality caused rework

### Operator/agent contract metrics

- ambiguity incidents in `SKILL.md`
- help/discoverability defects
- machine-field overload incidents
- path/root semantics incidents
- docs-only normative fixes count
- docs-contract tests added or updated

## Minimal quality bar

A package log is process-incomplete if any of these is missing without explicit explanation:

- start capture before the first meaningful edit;
- review events for required external audits;
- final commit id;
- explicit note about exact vs approximate duration;
- explicit note about decisions beyond the current model.
