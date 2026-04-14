# Feature Intake Logging

## Applies to

This reference defines the logging contract for one command only:

- `CLI command: feature-intake`

It does not apply to workflow stages such as `spec-compact`, `plan-slice`, or `implementation`.

For those workflow stages, use [workflow-stage-logging.md](workflow-stage-logging.md).

## Purpose

An intake log is command-level process telemetry.

It answers: how did the selected backlog work become this concrete dossier handoff?

It records:

- the selected backlog work that entered intake;
- the dossier id and dossier path that intake created;
- intake-time blockers, dependencies, and missing context;
- operator rerounds that changed intake direction;
- `index-refresh` outcome;
- backlog actualization outcome when intake discovered backlog-relevant truth.

It does not replace the Feature Dossier. The Feature Dossier remains the feature SSoT for current requirements, design, planning, coverage, links, and progress.

It also does not replace session-level ops logs, verification artifacts, review artifacts, or backlog actualization through `backlog-engineer`.

## Storage path

Use:

```text
.dossier/logs/<feature-id>/feature-intake-<cycle>.md
```

Rules:

- `<feature-id>` must match the dossier feature id `F-XXXX`.
- `<cycle>` should be short and human-readable.
- One intake log equals one literal intake closure target.

Cycle rule:

- Keep the same cycle when the literal closure target is unchanged:
  - the same selected backlog item;
  - the same future dossier;
  - the same intake attempt, even if operator rerounds, `index-refresh` reruns, or backlog actualization follow-ups happened.
- Open a new cycle only when the closure target changes literally:
  - intake stops and is replaced by intake for another backlog item;
  - the agent abandons the original dossier target and creates a different dossier as the new canonical target;
  - the previous intake cycle was closed or abandoned and a new independent intake attempt starts.

## When logging is required

Open or update an intake log when any trigger fires:

- intake discovered new blockers, dependencies, missing context, or lifecycle-changing facts;
- intake requires backlog actualization through `backlog-engineer`;
- operator feedback changes intake direction after the first draft;
- intake runs in more than one meaningful pass;
- `index-refresh` returns `partial_success`, fails, or needs a rerun;
- a process miss occurs;
- retrospective telemetry was requested or is reasonably expected.

## Low-overhead skip path

An intake log may be skipped only when all conditions are true:

- intake was completed in one clean pass;
- the dossier was created cleanly and the backlog handoff block did not need rerounds;
- no new blockers, dependencies, or missing context were discovered;
- backlog actualization was not required;
- `index-refresh` completed cleanly without `partial_success` and without a rerun;
- no process miss occurred;
- retrospective telemetry was not requested and is not reasonably expected.

If skipped, state the reason in the final summary. Example:

```text
intake log skipped: one-pass dossier creation; no intake logging trigger fired
```

## Timing rule

- If an intake logging trigger is known before edits, open the log before the first substantive dossier mutation.
- If the trigger appears mid-command, open the log immediately.
- For late starts, record `late_start: true` and a process miss note.
- Keep the log current through `feature-intake`, `index-refresh`, backlog actualization, and the final close-out summary.

## Closure blocking rule

If an intake logging trigger fired, `feature-intake` cannot be treated as truthfully `process_complete: true` until the required intake log was opened or updated to the final state of that intake cycle.

Treat these as blocking:

- required intake log missing;
- required intake log stale after a material intake change;
- `partial_success` still unresolved;
- required backlog actualization still incomplete.

## Mandatory metadata block

Every required intake log must start with a machine-friendly metadata block.

Open-time minimum fields:

```yaml
feature_id: F-XXXX
backlog_item_key: CF-XXX
command: feature-intake
cycle_id: short-human-readable-id
session_id: 019d... # omit if runtime does not expose a reliable value
start_ts: 2026-04-14T10:00:00+02:00
source_inputs:
  - docs/ssot/index.md
repo_overlays:
  - AGENTS.md
log_required: true
log_required_reason:
  - backlog_actualization
  - intake_reround
```

Close-out fields to add or backfill before truthful command closure:

```yaml
index_refresh_ts: 2026-04-14T10:05:00+02:00
index_refresh_status: success | partial_success | failed
backlog_actualized: true
handoff_block_written: true
dossier_path: docs/features/F-XXXX-foo.md
```

Rule:

- open the log early with the open-time minimum fields;
- omit fields that are not yet knowable;
- backfill close-out fields before the command is treated as truthfully complete;
- never invent placeholders for unknown values.

## `session_id`

Record `session_id` only when the runtime exposes a reliable value.

In Codex, use `CODEX_THREAD_ID` when it is present.

If no reliable runtime signal exists, omit `session_id` instead of inventing a placeholder string.

## Required narrative sections

After the metadata block, keep a short narrative structure:

- `Scope`
- `Inputs actually used`
- `Backlog handoff decisions`
- `Intake findings`
- `Operator feedback`
- `Index refresh`
- `Backlog actualization`
- `Process misses`
- `Close-out`

Keep the sections concise. Do not duplicate the dossier body or copy the full backlog packet.

## Intake-specific facts that must be preserved

When logging is required, preserve these intake facts explicitly:

- which backlog item entered intake;
- which `F-XXXX` was assigned;
- which dossier path was created;
- whether the backlog handoff block was written immediately or corrected later;
- which blockers, dependencies, or missing-context facts appeared during intake;
- whether backlog actualization was required and what happened;
- how `index-refresh` ended;
- whether intake was process-complete or remained partially complete.

## Interaction with session-level ops log

Ordinary intake stays in the intake log only.

If a normal intake turns mid-command into a cross-skill migration, repair, or backlog-recovery episode:

- the intake log remains the primary record of the `feature-intake` command flow;
- open a companion session-level ops log only for the cross-skill episode boundary;
- cross-link the two artifacts instead of letting one replace the other.

Use [session-ops-log.md](session-ops-log.md) for the companion cross-skill episode when needed.
