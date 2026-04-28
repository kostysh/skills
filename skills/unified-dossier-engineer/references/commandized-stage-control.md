# Commandized stage control

Use this reference when maintaining the shipped stage-controller model for primary delivery workflows in this skill.

Use it together with [Implementation pre-review checklists](implementation-pre-review-checklists.md) when changing implementation risk-family inputs or pre-review readiness gates.
Use it together with [Policy/admission risk families](policy-admission-risk-families.md) when changing `plan-slice` policy/admission inputs, negative matrix validation, or implementation readiness rechecks.
Use it together with [Audit handoff recipes](audit-handoff-recipes.md) when changing reviewer handoff prompts or audit recording guidance.

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
- `post-close-hygiene`
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

Schema snippets and CLI DSL snippets in this reference are runtime contracts for helper-managed state and command inputs. They are not prompts asking the model to hand-author free-form machine output.

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
- `review_events`
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
- selected closure summary fields: `closure_bundle_id`, `closure_bundle_rounds_by_audit_class`, compatibility `closure_bundle_round`, `selected_review_artifacts`, `selected_verification_artifact`, `selected_step_artifact`, and `selected_closure_ts`
- RPA producer fields: `rpa_source_identity`, `rpa_source_quality`, and `non_pass_review_events`
- plan-slice-only `policy_admission_risk_profile`
- plan-slice-only `policy_admission_risk_rationale`
- plan-slice-only `policy_admission_risk_families`
- plan-slice-only `policy_admission_negative_matrix`
- plan-slice-only `policy_admission_matrix_status`
- plan-slice-only `policy_admission_matrix_blockers`
- implementation-only `pre_review_risk_families`
- implementation-only `pre_review_checklists`
- implementation-only `pre_review_checklist_status`
- implementation-only `pre_review_checklist_blockers`
- implementation-only `post_close_backlog_hygiene_required`
- implementation-only `post_close_backlog_hygiene_status`
- implementation-only `post_close_backlog_hygiene_artifact`
- implementation-only `post_close_backlog_hygiene_checked_at`
- implementation-only `post_close_backlog_hygiene_refresh_at`
- implementation-only `post_close_open_source_review_count`
- implementation-only `post_close_source_review_blocked_item_count`
- implementation-only `post_close_lifecycle_reconciliation_drift_count`
- implementation-only `post_close_unresolved_attention_present`
- implementation-only `post_close_backlog_hygiene_blockers`
- implementation-only post-close hygiene v2 fields: `post_close_backlog_hygiene_global_refresh_artifact`, `post_close_affected_feature_ids`, `post_close_pre_status_summary`, `post_close_post_status_summary`, and `post_close_hygiene_schema_version`

Rules:

- selected-feature lifecycle reconciliation fields are explicit machine state and are not inferred from prose;
- review, verification, and close-out artifact links must be stored as explicit repo-relative arrays or fields, not recovered heuristically from prose;
- review attempt linkage in `review_events[]` must include attempt id, round id, round number, immutable artifact path, optional latest copy path, audit class, verdict, reviewer provenance, and freshness/invalidation state;
- `review_artifacts` stores immutable attempt artifact paths, while latest copies remain compatibility conveniences rather than closure truth;
- `final_delivery_commit` and `final_closure_commit` are optional trace links only and must not become required closure evidence;
- artifact-level `event_commit` values on selected review and verification artifacts are material-scope freshness anchors in git repositories when present or expected; stage-level commit fields are trace context, not closure proof;
- `skills_used`, `skill_issues`, and `skill_followups` are agent-supplied annotations, not automatic skill extraction from conversation traces;
- `process_misses` is the structured source of truth for process misses, while the `Process misses` Markdown section is a rendered mirror plus preserved human notes;
- stage-controller writes accept `--skill-used`, `--skill-issue`, `--skill-followup`, `--process-miss`, and `--phase-scope` as explicit machine-facing stage context.
- `plan-slice` accepts policy/admission classification inputs: `--policy-admission-risk-profile`, `--policy-admission-risk-rationale`, repeatable `--policy-admission-risk`, and repeatable `--policy-admission-negative`.
- `implementation` also accepts repeatable `--risk-family <id>` and `--pre-review-check <dsl>` as explicit author-side readiness evidence; other stage controllers reject those flags before writing artifacts.
- `plan-slice` also accepts policy/admission classification inputs; other stage controllers reject those flags before writing artifacts.

`phase_scope` clarification:

- `phase_scope` is a dossier workflow accounting field for grouping stage activity and telemetry inside this skill;
- it is not the OpenAI Responses API assistant-item `phase`;
- if a host manually replays Responses output items, preserve the API `phase` outside dossier stage schema instead of mapping it into `phase_scope`.

Repeatable `--process-miss` DSL:

```text
id=<id>;category=<category>;severity=<low|medium|high>;resolved=<true|false>;summary=<text>
```

Malformed entries fail before stage artifacts are written.

Repeatable `--pre-review-check` DSL:

```text
risk_family=<id>;id=<id>;status=<pass|not_applicable|blocked>;summary=<text>;evidence=<text>;test_refs=<comma-list>
```

`plan-slice` policy/admission inputs:

```text
--policy-admission-risk-profile <not_applicable|applicable>
--policy-admission-risk-rationale <text>
--policy-admission-risk <admission|replay|evidence|release-policy|runtime-gating>
--policy-admission-negative <dsl>
```

Repeatable `--policy-admission-negative` DSL for `plan-slice`:

```text
ac=<id>;risk=<admission|replay|evidence|release-policy|runtime-gating>;negative_test=<text>;production_path=<path-or-behavior>;evidence=<path-or-command>
```

Readiness rules:

- risk families are explicit declarations and must not be inferred from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose;
- policy/admission risk families are explicit `plan-slice` declarations and must not be inferred from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose;
- `plan-slice --ready-for-close` requires `--policy-admission-risk-profile <not_applicable|applicable>`;
- `not_applicable` requires `--policy-admission-risk-rationale <text>` and no declared policy/admission risks;
- `applicable` requires at least one bounded risk family and negative-matrix coverage for every declared family;
- checklist entries must reference a declared `--risk-family`;
- `policy-admission-governance` requires the checklist ids listed in [Implementation pre-review checklists](implementation-pre-review-checklists.md);
- custom risk families require at least one `pass` or `not_applicable` entry and no `blocked` entries;
- `implementation --ready-for-close` fails before writing `stage_state: ready_for_close` when the declared checklist status is `missing` or `blocked`.
- `plan-slice --ready-for-close` fails before writing `stage_state: ready_for_close` when policy/admission classification is missing, `not_applicable` lacks a rationale, an unsupported risk id is declared, or applicable risks lack negative-matrix coverage;
- the runtime validates policy/admission field shape and declared-risk coverage, not semantic acceptance-criteria completeness.

Linked `plan-slice` lookup for implementation readiness:

- canonical lookup is the helper-managed `.dossier/stages/<feature_id>/plan-slice.json` record for the same `feature_id`;
- if that helper-managed state is absent, the runtime may fall back to the latest `plan-slice` stage log for the same `feature_id`;
- the linked `plan-slice` must belong to the same `feature_cycle_id` as the implementation stage; a mismatched `feature_cycle_id` is stale and blocks readiness;
- if no `plan-slice` state or log exists, legacy/non-commandized flows are treated as `not_required` rather than inventing a policy/admission requirement;
- when linked state exists, missing classification, incomplete matrix coverage, or blocked matrix status fails before implementation writes `stage_state: ready_for_close`.

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

- `feature-intake -> intaken`
- `spec-compact -> specified`
- `plan-slice -> planned`
- `implementation -> implemented`

If the selected backlog item is behind the target, the stage-controller write keeps or sets backlog follow-up unresolved. The actual mutation remains a backlog command.
`feature-intake` must not directly mutate backlog truth; the agent uses `patch-item` or `refresh+patch` to actualize `defined -> intaken` and passes accepted evidence to `dossier-step-close`.

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
- successful `implementation` closure marks post-close backlog hygiene required and missing, but does not run source refresh or block the step artifact on post-close hygiene;
- `post-close-hygiene` is the explicit helper that runs refresh/status/attention/queue evidence after implementation close and records clean or blocked readiness state;
- `post-close-hygiene` writes the durable global refresh artifact before per-feature state points to it, separates global refresh evidence from per-feature hygiene artifacts, and records run id, affected/failed feature ids, pre/post status summaries, retry command for failed or partial runs, and schema version; failed or partial feature writes return JSON result `fail`, not `partial_success`.
- `lifecycle-refresh` remains the lifecycle aggregation helper when lifecycle snapshots or session indexes need refresh;
- stage-controller commands must not duplicate helper-owned closure truth;
- commandized transitions should improve telemetry determinism, not create a second closure authority surface.
- helper-owned closure writes must not erase authored narrative sections from the stage log.
- `ready_for_close` means the stage is ready to enter audit-policy-governed verification, non-forked/no-full-history external review, and helper-owned closure; it never means truthfully closed and does not prove the reviewer launch mode.
- for `plan-slice`, `ready_for_close` also presumes agent-owned semantic readiness: the plan has an explicit execution target, completion recognition, and implementation boundaries. The stage controller does not author or validate that semantic content.
- for every mutating stage, helper-owned close-out must enforce the required external audit bundle defined in [Audit policy](audit-policy.md).
- implementation pre-review checklist evidence is author-side readiness context only; it does not satisfy or weaken the external audit bundle.
- post-close backlog hygiene is branch/readiness evidence after closure; it does not replace `dossier-step-close` and must not auto-ack source-review records.
- for `plan-slice`, protected side-effect preset content is agent-owned semantic handoff and audit-scope content. The stage controller must not infer it from filenames, diffs, keywords, chat summaries, or prose.
- pre-close hygiene rehearsal before final verification/review is an agent-owned ordering guard; stage-controller commands do not auto-run refresh/status/attention/source-review checks or auto-ack source reviews.

## Utility-spec handoff

This reference remains an upstream design input for utility-spec and later runtime hardening work.

The utility specification must derive from this boundary and define:

- exact command help/output surface;
- exact stage-state enums;
- exact transition event schema;
- exact backlog follow-up field names and allowed values.
- exact post-close hygiene field names, statuses, artifact path, and readiness warning behavior.
- exact policy/admission flag names, negative-matrix field names, and readiness outputs.
- exact selected closure bundle and RPA producer field names.

The utility specification and runtime packages now ship this boundary in first-wave form. Later packages may harden or extend it, but they must not weaken the authority split defined here.

## Negative rules

- do not document flags or output fields for stage-controller commands that the shipped runtime does not actually expose
- do not make runtime-specific session discovery the canonical stage-controller provenance contract
- do not infer skill usage or process misses from traces or prose when explicit schema fields are required
- do not infer implementation risk-family declarations from traces, prose, keywords, filenames, or diffs
- do not infer policy/admission classification or negative-matrix applicability from traces, prose, keywords, filenames, or diffs
- do not infer backlog lifecycle reconciliation from traces, prose, commit messages, or `docs/ssot/index.md`
- do not make optional commit anchors a required proof for truthful closure
- do not let stage controllers absorb `dossier-step-close`, `lifecycle-refresh`, or `next-step`
- do not let `dossier-step-close` silently absorb the explicit `post-close-hygiene` checkpoint
- do not make stage-controller commands semantic automation
- do not treat a mechanical `ready_for_close` transition as a substitute for agent-owned `plan-slice` execution-target clarity
- do not imply that stage controllers author, infer, or validate protected side-effect invariants
- do not imply that stage controllers perform pre-close hygiene rehearsal
- do not let commandized stage control blur the boundary between delivery progress and backlog truth mutation
