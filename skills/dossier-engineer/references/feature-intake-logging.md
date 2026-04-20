# Feature Intake Logging

## Applies to

This reference defines the intake telemetry contract for one command only:

- `CLI command: feature-intake`

It does not apply to workflow stages such as `spec-compact`, `plan-slice`, or `implementation`.
For those stages, use [workflow-stage-logging.md](workflow-stage-logging.md).

Use it together with [lifecycle-telemetry.md](lifecycle-telemetry.md).

## Purpose

An intake log is command-level lifecycle telemetry.

It records:

- which backlog item entered intake;
- which dossier id/path intake created;
- intake-time blockers, dependencies, and missing context;
- `index-refresh` outcome;
- backlog actualization outcome when intake discovered backlog-relevant truth;
- bounded operator/backlog/process-miss events for the intake cycle.

It does not replace the Feature Dossier.

## Storage path

Use:

```text
.dossier/logs/<feature-id>/feature-intake-<cycle-id>.md
```

Rules:

- `<feature-id>` must match the dossier feature id `F-XXXX`;
- `<cycle-id>` must use the canonical format `cNN`;
- the filename suffix must match the `cycle_id` value inside the frontmatter exactly;
- one intake log equals one literal intake closure target.

## Always-on rule

`feature-intake` always leaves an intake log for the owned lifecycle.

Low overhead comes from a thin record:

- YAML frontmatter fenced by `---`;
- concise narrative sections;
- empty arrays when an event class did not occur;
- `none` for empty narrative sections instead of long prose.

Absence of an intake log is no longer the valid low-overhead path.

## Timing rule

- open the intake log before dossier creation;
- keep it current through dossier creation, `index-refresh`, backlog actualization, and intake close-out;
- if the log was opened late, record that as a `process_miss_events[]` entry instead of treating late logging as harmless.

## Closure blocking rule

`feature-intake` is not truthfully complete until all are true:

- the intake log exists and is current for the same closure target;
- `index-refresh` is settled;
- required backlog actualization is settled;
- `intake_process_complete_ts` is backfilled truthfully.

## Required frontmatter

Every intake log must start with YAML frontmatter fenced by `---`.

Minimum fields:

```yaml
---
feature_id: F-XXXX
feature_cycle_id: fc01
backlog_item_key: CF-XXX
command: feature-intake
cycle_id: c01
session_id: 019d...
trace_runtime: codex
trace_locator_kind: session_id
start_ts: 2026-04-20T09:00:00+02:00
source_inputs:
  - docs/ssot/index.md
repo_overlays:
  - AGENTS.md
backlog_events: []
operator_interventions: []
process_miss_events: []
---
```

Close-out fields to add before truthful intake completion:

```yaml
intake_process_complete_ts: 2026-04-20T09:22:00+02:00
index_refresh_ts: 2026-04-20T09:18:00+02:00
index_refresh_status: success | partial_success | failed
backlog_actualized: true | false
dossier_path: docs/features/F-XXXX-foo.md
```

Rules:

- `feature_cycle_id` must stay stable across the full feature lifecycle;
- `cycle_id` stays stable while the literal intake closure target is unchanged;
- in runtimes with reliable session identity, omitting `session_id` is a process miss;
- do not use `log_required` or `log_required_reason`; the log already exists unconditionally in the always-on model.

## Required narrative sections

After the frontmatter, keep these sections:

- `Scope`
- `Inputs actually used`
- `Backlog handoff decisions`
- `Intake findings`
- `Operator feedback`
- `Index refresh`
- `Backlog actualization`
- `Process misses`
- `Close-out`

If a section has no notable content, write `none`.

## Intake facts that must remain explicit

Preserve these facts explicitly:

- which backlog item entered intake;
- which `F-XXXX` was assigned;
- which dossier path was created;
- whether intake surfaced blockers, dependencies, or missing context;
- whether backlog actualization was required and how it ended;
- how `index-refresh` ended;
- whether truthful intake completion was reached.

## Event classes that matter for intake

The intake log should normally use:

- `backlog_events[]`
- `operator_interventions[]`
- `process_miss_events[]`

Do not invent review or verification arrays for intake unless the workflow truly produced those events.

## Interaction with session-level ops log

Ordinary intake stays in the intake log only.

If intake turns into a cross-skill migration, repair, or backlog-recovery episode:

- keep the intake log as the primary record of the `feature-intake` command flow;
- open a companion session-level ops log only for the cross-skill boundary;
- cross-link the two artifacts instead of letting one replace the other.
