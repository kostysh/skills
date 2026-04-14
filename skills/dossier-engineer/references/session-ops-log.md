# Session-level Ops Log

## Applies to

This reference defines the session-level ops log contract for cross-skill episodes that do not fit naturally inside one dossier stage.

Use it together with [workflow.md](workflow.md) and [../SKILL.md](../SKILL.md).

## Purpose

A session-level ops log is process telemetry for migration, repair, and orchestration episodes that cross skill or stage boundaries.

It answers:

- what operational episode consumed time outside one clean dossier-stage boundary;
- which skills and artifacts were involved;
- what operator interventions or infrastructure issues shaped the outcome;
- how the episode ended and which durable artifacts now carry the result.

It does not replace:

- the Feature Dossier;
- workflow-stage logs;
- verification, review, or step-close artifacts;
- backlog actualization through `backlog-engineer`.

Do not use this as a second stage log.

## Storage path

Use:

```text
.dossier/ops/<session>/<episode>.md
```

Rules:

- `<session>` should be the reliable session id when the runtime exposes one.
- If no reliable session id exists, use a stable human-chosen surrogate such as `manual-2026-04-14-repair-loop` and explain it in the log.
- `<episode>` should be short and human-readable.
- One file equals one operational episode.
- If the episode splits into two independent closure targets, close the first log and open a second episode log.

## When the ops log is required

Open or update a session-level ops log when all of these are true:

- the work materially crosses skills, workflow stages, or both;
- the main episode does not belong naturally to one dossier-stage log;
- the episode would otherwise be reconstructable mainly from raw session trace, shell history, or scattered commits.

Common trigger classes:

- backlog workflow migration;
- repair loop after a utility or runtime defect;
- cross-skill handoff recovery;
- audit-infrastructure instability episode;
- process-model correction outside one clean stage.

## When not to open it

Do not open a session-level ops log when any of these is true:

- one workflow-stage log already captures the whole episode well enough;
- the work is an ordinary stage-local reround or narrow follow-up;
- the change is trivial and one-step;
- the episode is only a small backlog patch or small doc correction with no meaningful cross-skill recovery work.

## Timing rule

- If the cross-skill episode is obvious before substantive mutations, open the ops log before the first substantive mutation.
- If the boundary only becomes clear mid-stream, open the log immediately and record `late_start: true`.
- Update the log whenever skill ownership, touched artifacts, or outcome changes materially.
- Close the log only after the episode outcome and linked durable artifacts are explicit.

## Mandatory metadata block

Every required session-level ops log must start with a machine-friendly metadata block.

Minimum fields:

```yaml
session_id: 019d...
start_ts: 2026-04-14T10:00:00+02:00
end_ts: 2026-04-14T11:40:00+02:00
episode_kind: repair-loop
skills_involved:
  - dossier-engineer
  - backlog-engineer
artifacts_touched:
  - skills/dossier-engineer/SKILL.md
operator_interventions_total: 1
linked_stage_logs:
  - .dossier/logs/F-0001/implementation-p2.md
linked_review_artifacts:
  - .dossier/reviews/F-0001/implementation-abc123.json
linked_verification_artifacts:
  - .dossier/verification/F-0001/implementation-abc123.json
linked_backlog_artifacts:
  - backlog/packets/packet-2026-04-14.json
outcome: stabilized
late_start: false
```

## Episode kinds

Use one primary `episode_kind`:

- `backlog-workflow-migration`
- `repair-loop`
- `cross-skill-handoff-recovery`
- `audit-infrastructure-instability`
- `process-model-correction`

If the episode has a secondary character, describe it in the narrative instead of inventing a compound value.

## Required narrative sections

After the metadata block, keep a short narrative structure:

- `Scope`
- `Why this is not stage-local`
- `Skills and handoffs`
- `Artifacts touched`
- `Operator interventions`
- `Outcome / follow-up`

Keep the narrative concise.
Do not copy Feature Dossier truth, full review prose, or full backlog packets into this log.

## Linking rules

When the episode overlaps stage-local work:

- link the relevant stage logs instead of repeating their local details;
- link review, verification, step-close, and backlog artifacts that closed the episode;
- if the episode changed stage-local truth, make sure the affected stage log was also updated.

When no linked artifact exists yet:

- say so explicitly;
- update the log later when the durable artifact is created.

## Quality bar

When the ops log was required, it is process-incomplete if any of these is missing without explicit explanation:

- why the episode was not stage-local;
- the skills involved;
- the artifact set actually touched;
- operator intervention count when the operator materially redirected the episode;
- linked stage, review, verification, or backlog artifacts when they exist;
- explicit outcome and any remaining follow-up.

The session-level ops log is telemetry only.
It does not make the workflow complete by itself.
