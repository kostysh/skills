# Commandized stage control

Use this reference when maintaining the shipped stage-controller model for primary delivery workflows in this skill.

## Purpose

This skill removes the old ambiguity where some delivery steps were real commands and others were prose-only workflow stages.

Target model:

- every primary delivery workflow stage gets a mechanical stage-controller command;
- helper commands remain a separate family;
- semantic work stays agent-owned.

This reference defines the active boundary for the shipped first-wave stage-controller commands.

## Primary delivery stage-controller set

The utility treats these stages as first-class stage-controller commands:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

Why these stages:

- they are the primary delivery workflow boundaries;
- they already carry distinct readiness and telemetry semantics;
- commandizing them removes confusion between runnable state transitions and prose-only stage names.

## Helper command family

These remain separate helper commands rather than stage controllers:

- `contract-drift-audit`
- `dossier-verify`
- `review-artifact`
- `dossier-step-close`
- `lifecycle-refresh`
- `next-step`

Rationale:

- they do not represent primary delivery-stage ownership;
- they persist or aggregate evidence, query dossier-local state, or enforce closure truth;
- folding them into stage-controller commands would blur closure and verification boundaries.

## Authority boundary

Stage-controller commands are mechanical progress controllers.

They may:

- open a stage cycle;
- resume a stage cycle;
- mark a stage blocked;
- mark a stage ready for close;
- bootstrap or update the stage log;
- bootstrap or update the helper-managed stage state for the same stage cycle;
- validate structured prerequisites and state invariants;
- expose machine-readable follow-up signals.

They must not:

- write specification or plan content on behalf of the agent;
- make semantic product decisions;
- mutate backlog truth directly;
- materialize authoritative `closed` state;
- write final lifecycle closure timestamps as truth of record.

Upper authority limit:

- stage-controller commands stop at `ready_for_close`;
- authoritative `closed` state stays with `dossier-step-close`;
- lifecycle truth after closure stays with `lifecycle-refresh` when lifecycle aggregation is required.

## Session provenance input

Stage-controller writes require explicit session provenance.

Required contract:

- the agent determines the current session id before invoking the runtime;
- every stage-controller bootstrap/update path that writes a stage log or helper-managed stage state receives `--session-id <id>`;
- optional `--trace-runtime <name>` may record an explicit runtime label, but it is not required and has no runtime-specific default;
- when `--session-id` is missing, the command fails closed before writing stage artifacts;
- the runtime records only the explicit input it received and must not auto-discover session ids from runtime-private stores or silently trust environment fallback values.

Runtime-specific variables may be useful to the agent while it manually determines the id, but they are not the portable CLI contract.

## Machine-complete stage schema

Helper-managed stage state under `.dossier/stages/*` is the authoritative structured coordination and validation surface for stage schema fields. Stage log YAML frontmatter is a bounded human-readable mirror of that structured state.

Parity-protected fields:

- `backlog_followup_required`
- `backlog_followup_kind`
- `backlog_followup_resolved`
- `backlog_lifecycle_target`
- `backlog_lifecycle_current`
- `backlog_lifecycle_reconciled`
- `backlog_actualization_artifacts`
- `backlog_actualization_verdict`
- `review_artifacts`
- `verification_artifacts`
- `step_artifact`
- `final_delivery_commit`
- `final_closure_commit`
- `skills_used`
- `skill_issues`
- `skill_followups`
- `process_misses`
- `primary_feature_id`
- `primary_backlog_item_key`
- `phase_scope`

Rules:

- selected-feature lifecycle reconciliation fields are explicit machine state and are not inferred from prose;
- review, verification, and close-out artifact links must be stored as explicit repo-relative arrays or fields, not recovered heuristically from prose;
- `final_delivery_commit` and `final_closure_commit` are optional trace links only and must not become required closure evidence;
- `skills_used`, `skill_issues`, and `skill_followups` are agent-supplied annotations, not automatic skill extraction from conversation traces;
- `process_misses` is the structured source of truth for process misses, while the `Process misses` Markdown section is a rendered mirror plus preserved human notes;
- stage-controller writes accept `--skill-used`, `--skill-issue`, `--skill-followup`, `--process-miss`, and `--phase-scope` as explicit machine-facing stage context.

Repeatable `--process-miss` DSL:

```text
id=<id>;category=<category>;severity=<low|medium|high>;resolved=<true|false>;summary=<text>
```

Malformed entries fail before stage artifacts are written.

## Logging role

Stage-controller commands should become canonical writers for stage progress transitions.

Minimum mechanical transition surface:

- `stage_state`
- `entered_ts`
- `ready_for_close_ts`
- `transition_events[]`
- explicit session provenance from `--session-id`
- parity-protected schema fields mirrored from `.dossier/stages/*`

Rules:

- stage logs remain Markdown artifacts with YAML frontmatter and narrative sections;
- helper-managed stage state under `.dossier/stages/*` carries the structured current-cycle stage data for scope, review-bundle membership, and close-out validation;
- for parity-protected fields, `.dossier/stages/*` is authoritative and stage log frontmatter mirrors it;
- required section scaffold must stay present for both `feature-intake` and primary stage logs rather than collapsing into an almost-frontmatter-only body;
- Generated scaffold headings may be materialized as stable labels; mechanical scaffold generation does not determine the language of authored narrative.
- event history for repeated block/resume cycles lives authoritatively in `transition_events[]`;
- do not introduce ambiguous singleton timestamps such as `blocked_ts` or `resumed_ts` without explicit derived semantics like `first_*` or `last_*`;
- transition surfaces complement existing telemetry; they do not replace bounded event arrays or closure artifacts.
- stage-controller reruns and helper-owned closure updates must preserve authored narrative sections without translation or normalization while updating helper-owned structured fields and transition evidence.

## Backlog interaction rule

Stage-controller commands do not mutate backlog truth directly.

Instead they must materialize explicit follow-up state:

- `backlog_followup_required: true|false`
- `backlog_followup_kind`
- `backlog_followup_resolved: true|false`

Ordinary truth-changing delivery stages may require:

- `patch-item`
- `refresh+patch`

For selected-feature lifecycle progression, stage controllers must expose the target and current backlog state for:

- `spec-compact -> specified`
- `plan-slice -> planned`
- `implementation -> implemented`

If the selected backlog item is behind the target, the stage-controller write keeps or sets backlog follow-up unresolved. The actual mutation remains a backlog command.

For the mature change path, the stronger explicit selector remains:

- `backlog impact verdict`

Allowed values:

- `no-op`
- `patch existing item`
- `source update`
- `new backlog item`

Truthful stage closure is blocked while required backlog follow-up remains unresolved.

## Closure and telemetry alignment

Commandized stage control must not weaken the already-established closure contract.

Required alignment:

- `dossier-step-close` remains the authoritative closure artifact writer;
- `dossier-step-close` enforces selected backlog item lifecycle reconciliation before writing a step artifact for `spec-compact`, `plan-slice`, and `implementation`;
- `lifecycle-refresh` remains the lifecycle aggregation helper when lifecycle snapshots or session indexes need refresh;
- stage-controller commands must not duplicate helper-owned closure truth;
- commandized transitions should improve telemetry determinism, not create a second closure authority surface.
- helper-owned closure writes must not erase authored narrative sections from the stage log.
- `ready_for_close` means the stage is ready to enter audit-policy-governed verification, non-forked/no-full-history external review, and helper-owned closure; it never means truthfully closed and does not prove the reviewer launch mode.
- for `plan-slice`, `ready_for_close` also presumes agent-owned semantic readiness: the plan has an explicit execution target, completion recognition, and implementation boundaries. The stage controller does not author or validate that semantic content.
- for every mutating stage, helper-owned close-out must enforce the required external audit bundle defined in [Audit policy](audit-policy.md).

## Utility-spec handoff

This reference remains an upstream design input for utility-spec and later runtime hardening work.

The utility specification must derive from this boundary and define:

- exact command help/output surface;
- exact stage-state enums;
- exact transition event schema;
- exact backlog follow-up field names and allowed values.

The utility specification and runtime packages now ship this boundary in first-wave form. Later packages may harden or extend it, but they must not weaken the authority split defined here.

## Negative rules

- do not document flags or output fields for stage-controller commands that the shipped runtime does not actually expose
- do not make runtime-specific session discovery the canonical stage-controller provenance contract
- do not infer skill usage or process misses from traces or prose when explicit schema fields are required
- do not infer backlog lifecycle reconciliation from traces, prose, commit messages, or `docs/ssot/index.md`
- do not make optional commit anchors a required proof for truthful closure
- do not let stage controllers absorb `dossier-step-close`, `lifecycle-refresh`, or `next-step`
- do not make stage-controller commands semantic automation
- do not treat a mechanical `ready_for_close` transition as a substitute for agent-owned `plan-slice` execution-target clarity
- do not let commandized stage control blur the boundary between delivery progress and backlog truth mutation
