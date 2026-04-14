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
.dossier/logs/<feature-id>/feature-intake-<cycle-id>.md
```

Rules:

- `<feature-id>` must match the dossier feature id `F-XXXX`.
- `<cycle-id>` must use the canonical format `cNN` where `NN` is a two-digit decimal counter starting at `01`.
- The filename suffix must match the `cycle_id` value in the metadata block exactly.
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
- For a new cycle under the same `feature_id`, use the next free `cNN`.

## When logging is required

Open or update an intake log when any objective trigger fires:

- intake requires backlog actualization through `backlog-engineer`;
- operator feedback arrives after dossier creation or after the backlog handoff block was written and forces a correction in the same intake cycle;
- `index-refresh` returns `partial_success`;
- `index-refresh` fails;
- `index-refresh` for the current cycle is rerun after an earlier non-success result or after operator correction;
- a process miss occurs, including late log start;
- operator explicitly requested retrospective telemetry for this intake cycle.

Use only these canonical `log_required_reason` values:

- `backlog_actualization_required`
- `operator_reround_after_dossier_creation`
- `index_refresh_partial_success`
- `index_refresh_failed`
- `index_refresh_rerun`
- `process_miss`
- `retrospective_requested`

For `feature-intake`, treat only these cases as `process_miss`:

- `late_start: true`;
- the intake log had to be renamed or moved because `feature_id`, `cycle_id`, or the filename suffix was wrong;
- the agent attempted truthful closure while a required intake log update, a required backlog actualization, or the current cycle `index-refresh` outcome was still unresolved.

Do not invent additional `process_miss` categories locally. If an event does not match one of the cases above, record it in narrative prose instead of using `process_miss` as a machine-facing trigger.

## Low-overhead skip path

An intake log may be skipped only when none of the objective triggers above fired for the current intake cycle.

If skipped, state the reason in the final summary. Example:

```text
intake log skipped: no objective intake logging trigger fired
```

## Timing rule

- If an objective trigger is already known before dossier creation, open the log before creating `docs/features/F-XXXX-<slug>.md`.
- If an objective trigger appears after dossier creation, after the backlog handoff block was written, or after dossier body edits started, open the log immediately.
- Mark `late_start: true` only when the trigger was already known before dossier creation but the log was opened later.
- Record a process miss note whenever `late_start: true`.
- Keep the log current through `feature-intake`, `index-refresh`, backlog actualization, and the final close-out summary.

## Closure blocking rule

If an objective intake logging trigger fired, `feature-intake` cannot be treated as truthfully `process_complete: true` until the required intake log was opened or updated to the final state of that intake cycle.

Treat these as blocking:

- required intake log missing;
- required intake log missing the latest `index-refresh` outcome, the latest backlog actualization outcome, or the latest operator reround outcome for the current cycle;
- `partial_success` still unresolved;
- required backlog actualization still incomplete.

## Mandatory metadata block

Every required intake log must start with a machine-friendly metadata block.

Open-time minimum fields:

```yaml
feature_id: F-XXXX
backlog_item_key: CF-XXX
command: feature-intake
cycle_id: c01
late_start: false
session_id: 019d... # omit if runtime does not expose a reliable value
start_ts: 2026-04-14T10:00:00+02:00
source_inputs:
  - docs/ssot/index.md
repo_overlays:
  - AGENTS.md
log_required: true
log_required_reason:
  - backlog_actualization_required
  - operator_reround_after_dossier_creation
```

Close-out fields to add or backfill before truthful command closure:

```yaml
index_refresh_ts: 2026-04-14T10:05:00+02:00
index_refresh_status: success | partial_success | failed
backlog_actualized: true | false
handoff_block_written: true
dossier_path: docs/features/F-XXXX-foo.md
```

Rule:

- open the log early with the open-time minimum fields;
- omit fields that are not yet knowable;
- backfill close-out fields before the command is treated as truthfully complete;
- never invent placeholders for unknown values.
- if `late_start` becomes true, update the open-time metadata block instead of recording it only in narrative prose.
- always backfill `backlog_actualized` as an explicit boolean: use `true` only when backlog actualization actually ran and completed for this intake cycle; otherwise write `false`.

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
