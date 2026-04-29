# Delivery workflow layer

Use this reference when preserving or designing dossier-side execution workflow inside this skill.

Use it together with:

- [Audit policy](audit-policy.md)
- [Audit handoff recipes](audit-handoff-recipes.md)
- [Commandized stage control](commandized-stage-control.md)
- [Implementation pre-review checklists](implementation-pre-review-checklists.md)
- [Policy/admission risk families](policy-admission-risk-families.md)
- [Telemetry and closure](telemetry-and-closure.md)

## What this layer owns

The delivery workflow layer owns:

- `feature-intake`
- feature dossier creation and upkeep
- `spec-compact`
- `plan-slice`
- `implementation`
- mature change path: `change-proposal`, `contract-drift-audit`, `backlog impact verdict`
- review and verification freshness
- `coverage_gate`
- pre-close / DoD readiness
- authoritative step closure

It does not own backlog graph truth, source registry mutation, or backlog read-model semantics.

## One feature equals one backlog item

This invariant stays strict:

- one feature cycle maps to exactly one selected backlog item
- one canonical feature dossier maps to exactly one backlog item
- delivery workflow does not aggregate multiple backlog items into one feature dossier

If work later fans out, that becomes explicit backlog actualization work rather than silent dossier scope growth.

## Canonical flow

The workflow must preserve this default lifecycle:

`selected backlog work -> feature-intake -> spec-compact -> plan-slice -> implementation -> authoritative step close`

The workflow must also preserve the mature change branch as first-class workflow, not as a side note:

`change-proposal -> contract-drift-audit -> explicit backlog impact verdict -> backlog actualization when verdict is not no-op`

## Stage-level decision rules

Use these rules to avoid both under-execution and process-heavy overexecution. They classify agent action; they do not remove any stage obligation below.

| Stage | Continue | Ask operator | Block | Stop |
| --- | --- | --- | --- | --- |
| `feature-intake` | Selected backlog item, source traceability, blockers, and dependencies are concrete enough to start the feature cycle. | The selected item, source authority, or intended feature boundary is ambiguous. | Intake cannot truthfully capture backlog item identity, source traceability, or known blockers. | Intake log and helper-managed stage state capture the durable handoff and required audit path. |
| `spec-compact` | Requirements, acceptance framing, and relevant edge cases are sufficient for the selected backlog item. | Requirement authority conflicts or the operator must decide a product boundary. | Specification changes backlog truth and actualization is unresolved, or acceptance remains undecidable. | The compact states requirements, non-goals or known gaps, proof obligations, and the required external audit path. |
| `plan-slice` | The implementation target, completion recognition, boundaries, proof obligations, and protected side-effect preset if triggered are explicit. | The target outcome, rollout boundary, protected side effect, or non-goal needs operator judgment. | A future implementation agent would need to rediscover the goal, or backlog actualization required by planning is unresolved. | The plan is implementation-ready, audit scope is clear, and no further context search is needed for the next safe action. |
| `implementation` | The implementation scope, local verification, debt review, pre-review checklist evidence when declared, and final review bundle path are clear. | The operator must decide scope expansion, destructive side effect, external-review permission, or unresolved source-review outcome. | Required verification, backlog lifecycle reconciliation, source-review resolution, external audit, or freshness evidence is missing. | `dossier-step-close` has truthfully closed the step and `post-close-hygiene` has recorded clean or blocked branch/readiness evidence. |
| `change-proposal` | The proposed change, drift evidence, and backlog impact verdict path are concrete. | The operator must choose between no-op, patch existing item, source update, or new backlog item. | Contract drift or backlog impact cannot be classified with current evidence. | The explicit backlog impact verdict is recorded and required actualization/audit work is complete or blocked. |

Progress-update rule:

- during long-running tool, verification, or audit workflows, provide a concise progress update when the host environment supports visible updates;
- progress updates are operator UX only and never replace verification artifacts, review artifacts, stage logs, helper-managed state, or closure truth.

## Stage obligations

### `feature-intake`

The workflow must preserve:

- one durable handoff from selected backlog item into feature workflow
- backlog item key, source traceability, blockers, and dependencies captured at intake
- truthful start of the feature cycle before downstream planning or implementation

### `spec-compact`

The workflow must preserve:

- explicit requirements and acceptance framing for the selected backlog item
- adversarial / edge-case / boundary shaping where the changed scope needs it
- return to backlog truth layer when specification changes backlog truth

### `plan-slice`

The workflow must preserve:

- explicit implementation plan for the selected backlog item
- explicit execution target: the concrete outcome the implementation agent must reach
- completion recognition that links the target outcome to acceptance criteria, Definition of Done, or verification obligations
- explicit non-goals or boundaries for the implementation pass; if no extra boundaries exist beyond acceptance criteria, DoD, or rollout constraints, say so explicitly
- proof obligations for verification
- explicit handling of heavy-runtime planning when the trigger fires
- protected side-effect risk preset when implementation touches deploy, rollback, release, external executor, host/container boundary, caller-controlled input, or another protected side effect
- explicit policy/admission classification before implementation handoff: `not_applicable` with rationale, or `applicable` with bounded risk families and negative matrix
- return to backlog truth layer when planning changes backlog truth

`plan-slice` is not implementation-ready when the implementation objective is ambiguous.
If a future implementation agent would need to rediscover the goal from prior chat or backlog prose, the stage must remain open or blocked rather than handing off a task list.

When the protected side-effect risk preset applies, `plan-slice` handoff and audit scope must explicitly call out these invariants:

- reservation before side effect;
- idempotent replay behavior;
- terminal CAS / no terminal overwrite;
- strict caller input;
- live-vs-stale running behavior.

When policy/admission risk applies, `plan-slice` must record the UDE-owned taxonomy from [Policy/admission risk families](policy-admission-risk-families.md): `admission`, `replay`, `evidence`, `release-policy`, and `runtime-gating`. Applicable scopes must include a negative matrix with `AC -> risk -> negative test -> production path -> evidence source` before the stage can be treated as implementation-ready. `not_applicable` is allowed only with explicit rationale and no declared risk families.

### `implementation`

The workflow must preserve:

- dossier-local implementation execution
- local verification artifacts
- pre-review checklist completeness when explicit implementation risk families are declared
- debt review
- required external audits in fail-closed mode
- review freshness control
- authoritative close-out only after readiness is truthful
- post-close backlog hygiene evidence before final branch-complete reporting or recommending the next intake

Implementation pre-review checklist evidence is required only for declared risk families. The workflow must not infer those families from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose.

Implementation readiness must recheck the linked `plan-slice` policy/admission classification. The linked plan is the helper-managed `plan-slice` state for the same `feature_id` and `feature_cycle_id`, with latest same-feature `plan-slice` stage-log fallback only when helper-managed state is absent. A mismatched `feature_cycle_id` is stale and blocks readiness. If no linked `plan-slice` state or log exists, legacy/non-commandized flows do not invent a policy/admission requirement. If linked `plan-slice` declared applicable policy/admission risks and the matrix is missing, incomplete, or blocked, `implementation --ready-for-close` must fail before material close readiness.

After a successful `implementation` close, the workflow must run explicit post-close backlog hygiene before claiming the branch is backlog-clean or recommending a next intake. The required evidence is `refresh`, then `status`, `attention`, and `queue`, persisted through `post-close-hygiene`. This checkpoint is branch/readiness evidence after closure; it is not an extra `dossier-step-close` gate.

Before final verification and the final external review bundle, implementation should run a pre-close hygiene rehearsal when refresh/status/attention/source-review checks can open or update backlog/source-review truth. This rehearsal runs those checks without auto-ack, resolves discovered source-review or attention blockers through explicit backlog truth actions, and then reruns final verification and affected audits if any material backlog/source-review mutation happened after earlier audits.

Final implementation close sequencing must stay explicit:

`material commit freeze -> external reviewers write immutable review artifacts -> final verification -> dossier-step-close -> post-close hygiene`

Rules:

- after material commit freeze, do not make material source/test/backlog truth changes before the final review artifacts are recorded;
- external reviewers must record PASS or FAIL through `review-artifact`, leaving immutable review attempt artifacts;
- correction work after a prose/trace FAIL must stop until the reviewer-owned immutable FAIL artifact exists with `must_fix` and `evidence`, or a structured process miss records that original reviewer accounting is unrecoverable;
- final verification must correspond to the same material scope reviewed by the external auditors;
- when a code-bearing implementation stage declares pre-review risk families, run `dossier-verify --verification-profile <repo-relative-json>` before close; the profile declares `scope`, `required_categories`, and `categories.<id>.command` or `categories.<id>.evidence`, and `--extra` remains free-form supplemental verification rather than a required-category contract;
- the protected implementation profile scope is `implementation-protected-side-effects`, and the profile must declare at least one required category;
- if any material mutation happens after final audits or final verification, rerun affected verification and affected review artifacts before `dossier-step-close`;
- post-close hygiene remains a separate confirmation after close and does not replace pre-close rehearsal, final verification, final audits, or `dossier-step-close`.

## Required mutating-stage audit baseline

Every mutating dossier stage requires external review before truthful closure:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

Baseline mapping for non-code stages is defined in [Audit policy](audit-policy.md).

Important:

- self-review is not a valid substitute;
- reviewer delegation with forked context or full-history inheritance is not a valid substitute for an external independent audit;
- if an invalid review launch method is discovered, that audit must be rerun and cannot be accepted as a quiet PASS;
- `review-artifact` persists already obtained audit evidence and does not replace the audit itself;
- each `review-artifact` attempt preserves its own immutable artifact, so a failed review and the later passing rerun remain reconstructable without stage-log prose;
- `dossier-step-close` is not truthful while required audits are missing, stale, or invalidated.
- helper validation must use the helper-managed stage state for current-cycle review coordination and implementation scope rather than human-authored stage-log frontmatter.

Stage schema rule:

- helper-managed stage state is authoritative for parity-protected machine fields such as backlog follow-up state, artifact links, skill annotations, structured `process_misses`, and scope identity;
- stage log frontmatter mirrors those fields for human-readable context;
- agents supply skill annotations and process misses explicitly via stage-controller inputs;
- delivery workflow must not recover these fields by scraping traces or prose.

## Backlog actualization inside one skill

One skill removes the cross-skill handoff, but not the truth boundary.

Rules:

- if dossier-side work changes backlog truth, the agent stays inside this skill and moves into the backlog actualization branch
- delivery closure is not truthful while required backlog actualization remains unresolved
- selected-feature lifecycle closure must reconcile dossier progress with backlog delivery state:
  - `feature-intake` close requires the selected backlog item to be at least `intaken`
  - `spec-compact` close requires the selected backlog item to be at least `specified`
  - `plan-slice` close requires the selected backlog item to be at least `planned`
  - `implementation` close requires the selected backlog item to be `implemented`
- `intaken` means dossier handoff exists; it is not equivalent to `specified`, planned, implemented, or dossier maturity
- `dossier-step-close` must fail closed before writing a step artifact when the selected backlog item is behind the target state
- current backlog truth must satisfy the target; backlog actualization artifacts are trace evidence and must not override current state validation
- mature change path must always end with one explicit backlog impact verdict:
  - `no-op`
  - `patch existing item`
  - `source update`
  - `new backlog item`

## Required state axes

The workflow must keep these axes separate:

- backlog item lifecycle
- feature dossier maturity
- `coverage_gate`
- review freshness
- verification freshness
- step closure state

Required consequence:

- no single flat status enum may replace this crosswalk
- `ready_for_next_step` must stay explainable rather than inferred from prose

## Closure discipline

The delivery workflow must preserve all hard gates from the current dossier model.

Required gates:

- local verification artifacts before final closure claim
- named verification-profile categories when code-bearing implementation declares pre-review risk families
- debt review
- required external audit bundle in fail-closed mode
- selected backlog item lifecycle reconciliation for stages that advance backlog truth
- policy/admission classification and negative matrix for applicable `plan-slice` scopes
- review freshness validation
- implementation pre-review checklist completeness only when explicit risk families are declared
- explicit pre-close / DoD readiness
- pre-close hygiene rehearsal before final verification/final review bundle when backlog/source-review checks can mutate truth, with no auto-ack behavior
- authoritative step-close artifact
- post-close backlog hygiene evidence after successful `implementation` close and before branch-complete reporting or next-intake recommendation
- truthful blocked close branch

For `implementation`, the stronger bundle policy from [Audit policy](audit-policy.md) applies:

- `spec-conformance-reviewer` is first;
- code-bearing scope also requires `code-reviewer` and `security-reviewer`;
- truthful closure is blocked until that required bundle is fully satisfied.
- implementation rerounds preserve earlier failed review evidence and close only from the final valid PASS bundle selected by `dossier-step-close`.
- successful `implementation` closure marks post-close backlog hygiene as required and initially `missing`; clean branch-complete reporting requires a fresh `post-close-hygiene` artifact.
- final implementation close follows `material commit freeze -> external reviewers write immutable review artifacts -> final verification -> dossier-step-close -> post-close hygiene`.

Important:

- commit history is trace metadata only
- chat summaries are never closure truth
- informal “looks good” signals never replace durable closure evidence
- an external-looking reviewer run does not satisfy closure policy if it inherited the authoring agent's forked/full-history context
- `dossier-step-close` must not auto-run source refresh or auto-ack source-review records; `post-close-hygiene` is the explicit helper for the post-close refresh/status/attention/queue checkpoint.
- pre-close hygiene rehearsal does not replace post-close hygiene; it is an ordering guard before final verification/review, while post-close hygiene remains the confirmation checkpoint after `implementation` close.

## Semantic heritage versus shipped runtime

This skill now ships first-wave commands, but workflow semantics still stay broader than the currently automated surface.

Use names such as `feature-intake`, `change-proposal`, `contract-drift-audit`, and `backlog impact verdict` as semantic anchors for the shipped runtime and active methodology.

The stage-controller command boundary is defined separately in [Commandized stage control](commandized-stage-control.md). That boundary is now active shipped behavior and remains the upstream rule for future hardening work.

## Negative rules

- do not degrade the mature change branch into a backlog appendix
- do not let delivery closure bypass required backlog actualization
- do not infer implementation risk families from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose
- do not infer policy/admission risk classification from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose
- do not hand off applicable policy/admission implementation before `plan-slice` has a complete negative matrix
- do not let `dossier-step-close` mark `spec-compact`, `plan-slice`, or `implementation` complete while the selected backlog item is behind the stage lifecycle target
- do not claim an implementation branch is backlog-clean before fresh post-close hygiene evidence exists
- do not hide open source reviews after post-close refresh behind a clean final state
- do not treat pre-close hygiene rehearsal as source-review auto-ack or as a replacement for explicit source-review resolution
- do not treat protected side-effect preset guidance as runtime-inferred checklist evidence
- do not dissolve `coverage_gate` into generic maturity wording
- do not equate backlog `planned|implemented` with dossier `planned|done`
