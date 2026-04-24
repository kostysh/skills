# Delivery workflow layer

Use this reference when preserving or designing dossier-side execution workflow inside this skill.

Use it together with:

- [Audit policy](audit-policy.md)
- [Commandized stage control](commandized-stage-control.md)
- [Implementation pre-review checklists](implementation-pre-review-checklists.md)
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
- return to backlog truth layer when planning changes backlog truth

`plan-slice` is not implementation-ready when the implementation objective is ambiguous.
If a future implementation agent would need to rediscover the goal from prior chat or backlog prose, the stage must remain open or blocked rather than handing off a task list.

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

After a successful `implementation` close, the workflow must run explicit post-close backlog hygiene before claiming the branch is backlog-clean or recommending a next intake. The required evidence is `refresh`, then `status`, `attention`, and `queue`, persisted through `post-close-hygiene`. This checkpoint is branch/readiness evidence after closure; it is not an extra `dossier-step-close` gate.

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
  - `spec-compact` close requires the selected backlog item to be at least `specified`
  - `plan-slice` close requires the selected backlog item to be at least `planned`
  - `implementation` close requires the selected backlog item to be `implemented`
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
- debt review
- required external audit bundle in fail-closed mode
- selected backlog item lifecycle reconciliation for stages that advance backlog truth
- review freshness validation
- implementation pre-review checklist completeness only when explicit risk families are declared
- explicit pre-close / DoD readiness
- authoritative step-close artifact
- post-close backlog hygiene evidence after successful `implementation` close and before branch-complete reporting or next-intake recommendation
- truthful blocked close branch

For `implementation`, the stronger bundle policy from [Audit policy](audit-policy.md) applies:

- `spec-conformance-reviewer` is first;
- code-bearing scope also requires `code-reviewer` and `security-reviewer`;
- truthful closure is blocked until that required bundle is fully satisfied.
- implementation rerounds preserve earlier failed review evidence and close only from the final valid PASS bundle selected by `dossier-step-close`.
- successful `implementation` closure marks post-close backlog hygiene as required and initially `missing`; clean branch-complete reporting requires a fresh `post-close-hygiene` artifact.

Important:

- commit history is trace metadata only
- chat summaries are never closure truth
- informal “looks good” signals never replace durable closure evidence
- an external-looking reviewer run does not satisfy closure policy if it inherited the authoring agent's forked/full-history context
- `dossier-step-close` must not auto-run source refresh or auto-ack source-review records; `post-close-hygiene` is the explicit helper for the post-close refresh/status/attention/queue checkpoint.

## Semantic heritage versus shipped runtime

This skill now ships first-wave commands, but workflow semantics still stay broader than the currently automated surface.

Use names such as `feature-intake`, `change-proposal`, `contract-drift-audit`, and `backlog impact verdict` as semantic anchors for the shipped runtime and active methodology.

The stage-controller command boundary is defined separately in [Commandized stage control](commandized-stage-control.md). That boundary is now active shipped behavior and remains the upstream rule for future hardening work.

## Negative rules

- do not degrade the mature change branch into a backlog appendix
- do not let delivery closure bypass required backlog actualization
- do not infer implementation risk families from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose
- do not let `dossier-step-close` mark `spec-compact`, `plan-slice`, or `implementation` complete while the selected backlog item is behind the stage lifecycle target
- do not claim an implementation branch is backlog-clean before fresh post-close hygiene evidence exists
- do not hide open source reviews after post-close refresh behind a clean final state
- do not dissolve `coverage_gate` into generic maturity wording
- do not equate backlog `planned|implemented` with dossier `planned|done`
