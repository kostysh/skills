---
name: dossier-engineer
description: Lean docs-as-code process for large app development with AI agents. Uses one Feature Dossier per selected backlog work, one global index, separated workflow and coverage state, machine-checkable review/verification/step-close artifacts, scoped audits, and repo-overlay ingestion. Works downstream from backlog-engineer rather than competing with it for backlog extraction.
compatibility: Designed for git repos. The packaged CLI at scripts/dossier.mjs requires Node.js >= 22.22.0.
---

# Dossier Engineer

This skill implements a **low-overhead, high-control** downstream workflow for large projects with AI agents.

`dossier-engineer` does not extract backlog from architecture. Backlog shaping, backlog selection, and backlog readiness belong to `backlog-engineer`. This skill starts from already selected backlog work and carries that work through intake, specification, planning, implementation, review, and closure.

The workflow addresses five failure modes commonly encountered in long real-world sessions:

- false “step complete” claims before independent review is actually fresh;
- overloaded status fields that mix dossier maturity with coverage enforcement;
- manual, repeated verification bundles that are easy to forget and hard to rerun consistently;
- docs realignment that changes executable behavior without forcing an explicit code-impact audit;
- ambiguous “what next?” answers when backlog state, dossier state, review state, and git state disagree.

## What this skill optimizes for

- **One Feature = One Dossier file**: requirements, design, slices, coverage map, links, and change history stay in one place.
- **One global index**: navigation and dependency visibility stay centralized.
- **Traceability by stable IDs**: `F-*`, `AC-*`, `SL-*`, `T-*`, `ADR-*`.
- **Machine-checkable process closure**: verification, review, and closure become durable repo artifacts instead of chat memory.
- **Selected-work discipline**: dossier work starts from already selected backlog work instead of rediscovering backlog locally.
- **Backlog-aware delivery**: dossier-side shaping, planning, and implementation flow feed lifecycle-changing facts back into `backlog-engineer`.
- **Repo-aware execution**: repo-local rules from `AGENTS.md` and ADRs are ingested before planning or implementation decisions are made.

## Core artifacts

Canonical product docs:

- `docs/features/F-XXXX-<slug>.md` — **Feature Dossier** (**SSoT for that feature**).
- `docs/ssot/index.md` — **Global navigation + dependency index**.
- `docs/architecture/system.md` — canonical architecture overview.
- `docs/adr/*.md` — optional cross-cutting ADRs.
- `AGENTS.md` — repo-level operating rules and workflow overlays.

Backlog source of truth:

- backlog graph creation, backlog selection, backlog readiness, and backlog status actualization live in `backlog-engineer`, not in `dossier-engineer`.

Canonical process artifacts:

- `.dossier/logs/<feature>/<stage>-<cycle>.md` — workflow-stage process telemetry for `spec-compact`, `plan-slice`, and `implementation`.
- `.dossier/verification/<feature>/<step>-<event>.json` — verification bundle result from `dossier-verify`.
- `.dossier/reviews/<feature>/<step>-<event>.json` — independent review result from `review-artifact`.
- `.dossier/steps/<feature>/<step>.json` — machine-checkable closure state from `dossier-step-close`.
- `.dossier/drift/<feature>/*.json` — executable-contract impact results from `contract-drift-audit`.

CLI utility:

- Canonical runtime entrypoint: `node scripts/dossier.mjs <command> [options]`
- Built artifact path: `scripts/dossier.mjs`
- Package maintenance:
  `pnpm --filter @kostysh/dossier-engineer-cli build`
  `pnpm --filter @kostysh/dossier-engineer-cli lint`
  `pnpm --filter @kostysh/dossier-engineer-cli test`
- Operational workflow guide: [references/workflow.md](references/workflow.md)

Templates:

- Feature dossier template: [references/DOSSIER_TEMPLATE.md](references/DOSSIER_TEMPLATE.md)
- Index template: [references/SSOT_INDEX_TEMPLATE.md](references/SSOT_INDEX_TEMPLATE.md)
- ADR block template: [references/ADR_BLOCK_TEMPLATE.md](references/ADR_BLOCK_TEMPLATE.md)
- Repo `AGENTS.md` template: [references/REPO_AGENTS_TEMPLATE.md](references/REPO_AGENTS_TEMPLATE.md)

## State model (keep these dimensions separate)

Do **not** overload one field to mean multiple things.

### 1. Dossier maturity state

Applies only to dossier frontmatter `status`:

- `proposed`
- `shaped`
- `planned`
- `in_progress`
- `done`
- `parked`

Meaning:

- `proposed` — intake exists, but design is still draft.
- `shaped` — compact design and planning blockers are explicit enough to plan slices.
- `planned` — slice/task forecast is ready; implementation can start.
- `in_progress` — executable work is active.
- `done` — the feature is delivered and aligned.
- `parked` — intentionally paused.

### 2. Coverage enforcement state

Applies via dossier frontmatter `coverage_gate`:

- `deferred` — gaps are informational; planning may proceed.
- `strict` — gaps are blocking.

Default policy when `coverage_gate` is omitted:

- `proposed`, `shaped`, `planned` → `deferred`
- `in_progress`, `done` → `strict`

Repo overlays may tighten this. If they do, follow the repo rule and make it explicit in the dossier.

### 3. Review freshness state

Applies to `.dossier/reviews/...` artifacts:

- `missing`
- `pass`
- `fail`
- `stale`

A review is **stale** when a material change alters the reviewed scope after the review.

Commit SHA is trace metadata only. It records which repository state was visible when the event happened; it is not a freshness, validity, or lifecycle gate.

### 4. Step closure state

Applies to `.dossier/steps/...` artifacts:

- `open`
- `blocked`
- `closed`

A step is `closed` only when `process_complete: true`.

### 5. Worktree cleanliness state

Applies to the working tree only:

- `dirty`
- `clean`

## Hard rules (must follow)

1. **No duplicated requirements.**
   Acceptance criteria text lives only in the Feature Dossier.

2. **Always start from the index.**
   To answer “where is X?”, open `docs/ssot/index.md` first.

3. **Every behavior-changing PR must update docs.**
   Progress, coverage map, change log, and assumption shifts must be reflected in the dossier.

4. **Traceability uses stable IDs only.**
   Use `F-*`, `AC-*`, `ADR-*`, `SL-*`, and `T-*`.

5. **Backlog shaping belongs to `backlog-engineer`.**
   `dossier-engineer` must not rediscover backlog from architecture or maintain its own candidate backlog surface.

6. **Make architecture coverage explicit.**
   Backbone seams need visible ownership just like user-visible features do.

7. **Promote cross-cutting delivery assumptions early.**
   Architecture or repo-level ADRs should carry shared runtime, deployment, or verification constraints.

8. **No technical debt by default.**
   Every mutating step must include an explicit debt review, dependency/seam re-check, and durable handling path for every finding.

9. **No “step complete” claim without machine-checkable closure.**
   A mutating step is not complete until `dossier-verify`, independent review, and `dossier-step-close` all pass for the same intended scope.

10. **Material change invalidates prior review by default.**
    If code, tests, executable dossier sections, architecture, or ADRs change after review, treat the review as stale unless a stricter repo-local rule says otherwise.

11. **Forecast is not commitment.**
    Slices and tasks are forecast by default. Commitment lives in acceptance criteria, Definition of Done, verification/coverage gates, and explicit rollout constraints unless a repo overlay says otherwise.

12. **Ingest repo overlays before acting.**
    Before `feature-intake`, `spec-compact`, `plan-slice`, `implementation`, `change-proposal`, `dossier-verify`, and `next-step`, read repo-root `AGENTS.md` and any referenced repo-level ADRs that constrain the work.

13. **Independent review should be truly independent and fail closed.**
    Spawn a separate reviewer agent that did not author the changes or the close-out summary whenever the `spawn_agent` tool exists. If platform policy requires explicit user authorization before spawning, ask for that authorization instead of downgrading the review. If a separate reviewer agent cannot be used, treat the step as blocked unless the user explicitly approves degraded review mode. Do not silently substitute self-review or `emulated-independent-review`.

## Repo overlay ingestion

Before any planning or delivery command that can change repo state:

1. Read repo-root `AGENTS.md`.
2. Extract stricter local rules that override the default skill.
3. Re-read relevant repo-level ADRs and architecture sections that those rules point to.
4. If a repo overlay conflicts with the default skill, prefer the repo overlay.
5. In the final step summary, state which overlay mattered if it changed behavior.

Typical overlay examples:

- stricter plan-gate requirements before `spec-compact` or `plan-slice`;
- project-specific verification commands that must be added to `dossier-verify --extra`;
- stricter coverage policy for `planned` dossiers;
- repo-specific branch, commit, or release rules.
- repo-specific source-of-truth paths, runtime commands, or smoke expectations.

Overlay hygiene rule:

- Repo-root `AGENTS.md` should contain repo-specific overlays only.
- Do not duplicate the default dossier workflow, review model, or closure protocol in `AGENTS.md` unless the repository is intentionally tightening or overriding them.

## Backlog actualization rules

Operational summary:

- [Workflow guide: backlog actualization rule](references/workflow.md#backlog-actualization-rule)

When dossier work changes backlog truth, return to `backlog-engineer` explicitly:

- after dossier shaping/specification is complete enough to remove design ambiguity, actualize the selected backlog work to `specified`;
- after planning is complete enough to make implementation-ready sequencing explicit, actualize the selected backlog work to `planned`;
- after implementation and closure establish delivered behavior, actualize the selected backlog work to `implemented`;
- if dossier work reveals new blockers, dependencies, clarified context, or cross-cutting decisions, patch backlog state before continuing.

Closure rule:

- for truth-changing workflow stages, backlog actualization is part of the stage closure contract;
- do not treat the stage as complete until backlog actualization through `backlog-engineer` is done;
- `refresh` alone is not backlog actualization when dossier work changed `delivery_state` or surfaced dossier-local blockers, dependencies, or context facts that must be patched explicitly.

## Step closure contract

For every **mutating delivery step** (`feature-intake`, `spec-compact`, `plan-slice`, `implementation`, `change-proposal`, or a user-approved implementation increment):

1. Finish the command’s local work.
2. Run the command-specific checks.
3. Perform manual debt review on the changed scope.
4. Run `node scripts/dossier.mjs debt-audit --changed-only`.
5. Re-check dependencies, adjacent seams, delivered dossiers, architecture, and repo ADRs.
6. Run `node scripts/dossier.mjs dossier-verify ...` for the relevant scope.
7. Run an independent review with a separate reviewer agent. If spawning requires explicit user authorization, ask for it. If a separate reviewer agent cannot be used, treat the step as blocked unless the user explicitly approves degraded review mode.
8. Persist the verdict with `node scripts/dossier.mjs review-artifact ...`. This command records an already obtained independent review result; it does not perform the review itself.
9. If the step changed backlog truth, actualize backlog state through `backlog-engineer` before step closure.
10. Close the step with `node scripts/dossier.mjs dossier-step-close ...`.
11. Only after `process_complete: true` and required backlog actualization may the agent say the step is complete.

### Final step summary contract

Every mutating-step close-out must explicitly state:

- `Changed artifacts:`
- `Checks:`
- `Debt review:`
- `Review verdict:`
- `Review freshness:`
- `Process-complete: yes|no`
- `Blocking items:`
- `Next step:`

If `Process-complete: no`, the response must not use “complete”, “closed”, or equivalent language for that step.

## Material change / review freshness policy

Treat the review as stale when any of the following changed after the reviewed scope:

- source code;
- tests;
- runtime or deployment configuration;
- dossier sections that alter executable behavior or verification expectations;
- architecture or ADR content that constrains the delivered path.

Conservative default:

- progress-only metadata, index refreshes, and generated red-flag updates may remain non-material if they do not affect executable truth;
- when uncertain, invalidate the review and rerun it.

## Independent review execution model

After completing any command, the authoring agent must obtain an independent review before claiming success.

This section defines the skill-wide independence rule.
For `Workflow stage: implementation`, the audit stack, review brief, and classifier-based re-audit rules live in [Implementation audit policy](references/implementation-audit-policy.md).

Default contract:

1. Spawn a separate reviewer agent that did not produce the changes or the final answer whenever the `spawn_agent` tool exists.
2. Give the reviewer the command name, touched files, relevant command output or artifacts, debt-review outcome, and the command-specific checklist.
3. The reviewer must inspect actual repo state and generated artifacts, not trust the author’s summary.
4. For mutating steps, persist the reviewer’s verdict with `review-artifact` and use it for step closure.
5. For read-only or report-producing commands, the reviewer still checks output fidelity even when no step-close artifact is required.
6. Resolve every `must-fix` finding, rerun affected checks, and rerun review when the fixes were material.
7. If the current platform policy requires explicit user authorization before spawning, request that authorization rather than downgrading review.
8. If a separate reviewer agent still cannot be used, treat the step as blocked unless the user explicitly approves degraded review mode.
9. Do not silently substitute self-review or `emulated-independent-review` for a required independent review.

## Review checklist design rules

Every command-specific checklist below follows the same review philosophy:

1. **Check actual repo state**, not the author’s summary.
2. **Separate artifact correctness from process correctness.**
3. **Check cross-artifact alignment**: dossier ↔ tests ↔ index ↔ backlog ↔ architecture ↔ ADRs.
4. **Check freshness**: if a material change altered the reviewed scope after review, the previous review does not count. Commit SHA is only trace metadata.
5. **Check close-out truthfulness**: the final answer must accurately report blockers, next step, and process-complete state.
6. **For read-only commands**, review the report fidelity instead of expecting mutations.
7. **Green automation is never enough by itself**: a reviewer still checks for semantic gaps, especially for side-effecting code.
8. **Check completeness against intended scope**: no silent stubs, hidden scope cuts, or undocumented “later” deferrals.
9. **When a stage has a dedicated audit policy, use it instead of inventing a local audit stack.**
   For `Workflow stage: implementation`, use [Implementation audit policy](references/implementation-audit-policy.md) for audit order, brief shape, and classifier-based re-audit rules.

## Workflow stages and shipped CLI commands

Compact operational summary:

- [Workflow guide](references/workflow.md)

Two layers exist in this skill:

- workflow stages that the agent must perform as part of the process;
- shipped CLI commands that are actually exposed by `node scripts/dossier.mjs`.

Do not assume that every workflow stage is a runnable CLI subcommand.
Treat a named step as workflow-only unless it appears in the shipped CLI command list below or in `node scripts/dossier.mjs --help`.
Do not write or infer examples such as `node scripts/dossier.mjs spec-compact`, `node scripts/dossier.mjs plan-slice`, or `node scripts/dossier.mjs implementation`.

Shipped CLI commands in the current runtime:

- `feature-intake`
- `sync-index`
- `index-refresh`
- `lint-dossiers`
- `dependency-graph`
- `coverage-audit`
- `debt-audit` (compatibility alias: `marker-audit`)
- `contract-drift-audit`
- `review-artifact`
- `dossier-step-close`
- `dossier-verify`
- `next-step`

Checklist meaning in this section:

- These checklists are internal self-check and completion gates for the agent using this skill.
- They define what must be true before a workflow stage is treated as complete or before a CLI command result is trusted.
- They do **not** replace external audits such as spec-conformance review, code review, or security review when those audits are required by the process.

### Workflow stages

#### Workflow stage: `init`

Bootstrap the dossier protocol in a repository that already has architecture.

Operational summary:

- [Workflow guide: repository bootstrap](references/workflow.md#workflow-stage-repository-bootstrap-init)
- [Detailed stage steps](references/workflow-stage-init.md)

Minimal requirement:

- A repo-level architecture document must already exist. If none exists, stop and say that initialization requires architecture first.

Determinism policy:

- `init` proceeds automatically only when the next action is unambiguous.
- If multiple plausible architecture documents exist and no canonical choice is obvious, ask the user.
- If existing repo-root `AGENTS.md`, `docs/ssot/index.md`, or repo-local scripts contain custom structure that cannot be safely normalized, ask before rewriting.

Steps:

- See [workflow-stage-init.md](references/workflow-stage-init.md).

Stage exit checklist:

- [ ] If no architecture existed, the command stopped cleanly and did not leave half-created bootstrap artifacts behind.
- [ ] If `init` proceeded, canonical docs directories and `.dossier/` exist.
- [ ] Canonical scripts and `scripts/lib/*` were provisioned when safe, or divergence was surfaced explicitly instead of overwritten blindly.
- [ ] Repo-root `AGENTS.md` preserves unrelated repo instructions while adding only repo-specific overlays; default skill workflow rules are not duplicated unless intentionally tightened.
- [ ] No placeholder feature dossiers were created.
- [ ] Reported invariants are grounded in architecture/ADRs instead of being invented.
- [ ] The final report distinguishes created, moved, normalized, and untouched artifacts accurately.

#### Workflow stage: `spec-compact`

Turn the existing dossier into a compact spec that is specific enough to implement and verify.

Use this reference when the feature has meaningful operator/agent/machine-facing or safety-sensitive surface:

- [Spec and plan risk patterns](references/spec-and-plan-risk-patterns.md)
- [Workflow stage logging](references/workflow-stage-logging.md)
- [Detailed stage steps](references/workflow-stage-spec-compact.md)

Trigger summary:

- Add `Terms & thresholds` only when the feature introduces new terms, roles, states, statuses, or limits that could be read in more than one way.
- If the feature changes a request, response, event, webhook, or external payload, add a compact contract cue.
- If a rule has 2+ independent conditions, add a decision table or decision list.
- If the feature has named states, transitions, or guards, add a compact state list or state table.
- If activation order matters because of migration, feature flag, cutover, backfill, or irreversible side effects, add a compact rollout / activation note.

Steps:

- See [workflow-stage-spec-compact.md](references/workflow-stage-spec-compact.md).

Stage exit checklist:

Spec quality:
- [ ] The same dossier was evolved in place; no shadow SSoT exists.
- [ ] Acceptance criteria are atomic, observable, behavior-first, and specific enough to verify.
- [ ] The dossier captures success behavior plus invalid input / dependency failure / duplicate-retry behavior where relevant.
- [ ] New ambiguous terms or thresholds were normalized via a compact `Terms & thresholds` block when triggered.
- [ ] Constraints, assumptions, and open questions are explicit instead of being hidden inside prose.
- [ ] Open questions carry owner/date, a `needed_by` marker, and a next decision path.
- [ ] Operator/agent contract was captured explicitly when the feature has meaningful operator-facing, agent-facing, or machine-facing behavior.
- [ ] Safety and boundary semantics were captured when the feature touches trust boundaries or failure-prone surfaces.
- [ ] NFRs are compact, normative-only, and measurable via a metric, budget, threshold, or observable signal.
- [ ] A quick wording pass removed vague wording, compound ACs, and raw `TBD`.
- [ ] Unresolved implementation-shaping decisions were triaged as `normative now`, `implementation freedom`, or `temporary assumption` instead of being left in one vague bucket.

Trigger-based additions:
- [ ] Boundary I/O changes include a contract/schema pointer or compact contract sketch, plus error model and retry/idempotency notes when relevant.
- [ ] Design covers API, runtime/deployment, data changes, invariants or migration notes, failure modes, and an initial verification plan when relevant.
- [ ] Decision tables or state lists were added when rule complexity or statefulness crossed the trigger threshold.
- [ ] Rollout / activation notes were added when migration, feature flags, cutover, backfill, or irreversible side effects make activation order matter.
- [ ] Definition of Done and the initial coverage plan were recorded explicitly.

Process integrity:
- [ ] Repo overlays and repo ADRs were ingested before finalizing the spec.
- [ ] If a workflow-stage logging trigger fired, the stage log was opened or updated.
- [ ] The stage log records inputs, decisions/reclassifications, operator/review cycles, process misses, and backlog actualization outcome.
- [ ] The stage log does not duplicate AC text or dossier truth.
- [ ] Any cross-cutting decision was externalized instead of being left hidden inside one dossier.
- [ ] `status` is consistent with spec maturity and `coverage_gate` stays explicit.
- [ ] If shaping changed backlog truth, the backlog was updated through `backlog-engineer` before leaving this stage.
- [ ] The final answer reports any overlay that changed the default path.

#### Workflow stage: `plan-slice`

Add an incremental slicing plan inside the dossier.

Use this reference when the feature needs explicit contract-risk planning or post-implementation usage validation:

- [Spec and plan risk patterns](references/spec-and-plan-risk-patterns.md)
- [Workflow stage logging](references/workflow-stage-logging.md)
- [Detailed stage steps](references/workflow-stage-plan-slice.md)

Trigger summary:

- Do not move to `planned` while an unresolved `Open question` is marked `needed_by: before_planned`.
- Treat slices and tasks as forecast by default; commitment stays in ACs, Definition of Done, verification/coverage gates, and explicit rollout constraints.
- If a slice depends on another dossier, an external team, or a shared subsystem, add `Depends on:` with owner and unblock condition.
- If a slice relies on a high-risk assumption, add `Assumes:` and `Fallback:` notes.
- If activation order matters because of migration, feature flag, cutover, backfill, or irreversible side effects, add a compact rollout / activation note.
- If a slice touches a shared runtime, contract, migration path, or other cross-cutting surface, name the approval path.

Steps:

- See [workflow-stage-plan-slice.md](references/workflow-stage-plan-slice.md).

Stage exit checklist:

- [ ] No unresolved `Open question` marked `needed_by: before_planned` remains.
- [ ] The dossier contains 2–6 slices in delivery order.
- [ ] Slices are ordered prerequisite-first and risk-first, and at least one early slice proves a key risk, assumption, or rollout path.
- [ ] Every slice is small enough to verify and review as one coherent increment.
- [ ] Every slice states a concrete deliverable, cites AC IDs, and names the verification artifact(s) that prove it.
- [ ] Relevant contract risks were identified explicitly instead of being left for late corrective work.
- [ ] `Depends on:` with owner/unblock condition is present when slice-level external dependencies exist.
- [ ] `Assumes:` and `Fallback:` notes are present when slice-level high-risk assumptions exist.
- [ ] A rollout / activation note exists when migration, feature flags, cutover, backfill, or irreversible side effects make release order matter.
- [ ] A cross-cutting approval or decision path is explicit when shared runtime, contract, or migration surfaces are involved.
- [ ] Drift-guard work was planned when the feature spans multiple normative layers.
- [ ] A real usage audit and corrective categories were planned when the feature has meaningful operator-facing, agent-facing, or machine-facing behavior.
- [ ] Tasks reference Slice IDs or AC IDs and do not restate AC text.
- [ ] Any required realignment of existing delivered work is explicit.
- [ ] The plan treats slices/tasks as forecast, while ACs, Definition of Done, verification/coverage gates, and explicit rollout constraints carry the commitment signal.
- [ ] If a workflow-stage logging trigger fired, the stage log was opened or updated.
- [ ] The stage log records slice boundary decisions, planning assumptions/fallbacks, review cycles, process misses, and backlog actualization outcome.
- [ ] The stage log does not duplicate slice or task text from the dossier.
- [ ] `status: planned` is used for planning maturity, while `coverage_gate` independently captures coverage strictness.
- [ ] If planning changed backlog truth, the backlog was updated through `backlog-engineer` before leaving this stage.
- [ ] The final answer does not rationalize a status workaround such as “planned but really shaped”; it uses the explicit state model instead.

#### Workflow stage: `implementation`

Implement the planned feature while keeping dossier, architecture, overlays, and delivered substrate aligned.

Use these references together with this stage:

- [Implementation audit policy](references/implementation-audit-policy.md)
- [Workflow stage logging](references/workflow-stage-logging.md)
- [Workflow guide](references/workflow.md#no-technical-debt-policy)
- [Detailed stage steps](references/workflow-stage-implementation.md)

Steps:

- See [workflow-stage-implementation.md](references/workflow-stage-implementation.md).

Required adversarial checklist for side-effecting code:

- timeout budget is explicit and consistent across call chain;
- late completion after caller timeout cannot violate externally visible guarantees;
- abort/cancellation propagates correctly;
- partial side effects have rollback, compensation, or safe retry semantics;
- idempotency and duplicate delivery/retry behavior are explicit;
- logging/audit append failures have defined behavior;
- crash/restart boundaries do not produce impossible states.

Stage exit checklist:

- [ ] For multi-step or package-based work, the stage log was opened before the first mutating edit and kept current through close-out.
- [ ] Code changes follow the canonical stack, runtime, deployment path, and repo overlays.
- [ ] Delivered behavior maps back to slices/ACs or to an explicit approved change.
- [ ] Completeness review passed: the implementation fully covers the intended slices/ACs/approved changes, with no silent stubs, placeholders, scope cuts, or undocumented “later” deferrals.
- [ ] `spec-conformance` review passed against the dossier, overlays, approved changes, and relevant contracts for the changed scope.
- [ ] If the changed scope includes executable code, runtime wiring, or trust-boundary changes, code review passed via `code-reviewer`: correctness, maintainability, typing/contracts, error handling, state/resource lifecycle, and boundary handling are sound for the changed scope.
- [ ] If the changed scope includes executable code, runtime wiring, or trust-boundary changes, security review passed via `security-reviewer`: auth/authz, input validation, injection, secret handling, logging/redaction, trust boundaries, and data exposure risks were checked for the changed scope.
- [ ] Findings from the nested `code-reviewer` and `security-reviewer` passes were explicitly reported by the reviewer, even though no separate nested review artifacts were created.
- [ ] Follow-up fixes were re-audited according to the classifier-based narrow re-audit rules from [Implementation audit policy](references/implementation-audit-policy.md).
- [ ] Verification was added alongside code: AC-linked tests plus smoke/startup/container checks when relevant.
- [ ] Newly discovered prerequisites or cross-cutting invariants were externalized promptly.
- [ ] The target dossier was updated in the same workstream.
- [ ] The no-technical-debt policy was applied and every debt item was either resolved or explicitly recorded in a canonical artifact.
- [ ] Side-effecting behavior passed the adversarial checklist above.
- [ ] `coverage_gate` is strict when implementation closure depends on executable verification.
- [ ] If implementation changed backlog truth, the backlog was updated through `backlog-engineer` before leaving this stage.
- [ ] `dossier-verify`, independent review, and `dossier-step-close` all ran on the closure target.
- [ ] The final answer accurately reports `Process-complete: yes|no`.

#### Workflow stage: `adr-log`

Record an architectural decision as an ADR block (default) or separate ADR file (rare).

Rules:

- Use ADR blocks inside the dossier for feature-local decisions.
- Create `docs/adr/ADR-YYYY-MM-DD-<slug>.md` only for cross-cutting decisions.

Stage exit checklist:

- [ ] The decision was recorded in the right place.
- [ ] The ADR has a stable ID, title, status, date, context, decision, alternatives, and consequences.
- [ ] The ADR captures a real architectural fork or durable constraint.
- [ ] Consequences and follow-ups are reflected in the affected dossier, backlog, or architecture.
- [ ] Discoverability from dossier/index/architecture paths is preserved.

#### Workflow stage: `dependency-check`

Validate and visualize dependencies.

Steps:

- [Detailed stage steps](references/workflow-stage-dependency-check.md)

Stage exit checklist:

- [ ] Every `depends_on` entry is formatted as `F-XXXX` and points to an existing dossier.
- [ ] The Mermaid graph matches current frontmatter.
- [ ] `docs/ssot/index.md` contains the refreshed dependency graph with no stale edges.
- [ ] Any invalid or missing dependency was reported explicitly.
- [ ] The updated index remains metadata/link oriented.

#### Workflow stage: `change-proposal`

Apply requirement changes safely.

This stage must end with one explicit dossier-side `backlog impact verdict`:

- `no-op`
- `patch existing item`
- `source update`
- `new backlog item`

Steps:

- [Detailed stage steps](references/workflow-stage-change-proposal.md)

Stage exit checklist:

- [ ] The change log contains a new version/date/reason entry.
- [ ] Planning-affecting changes use an explicit reason tag such as `[clarification]`, `[scope realignment]`, `[dependency realignment]`, `[risk discovery]`, or `[contract drift]`.
- [ ] Requirement edits were applied in the dossier SSoT, not in a shadow source.
- [ ] Slices, tasks, coverage map, DoD, dependency references, rollout notes, approval paths, and assumption/fallback notes were updated consistently.
- [ ] `contract-drift-audit` ran when executable contract changes or mature dossier states made it necessary.
- [ ] If executable follow-up is required, it is explicit in a canonical artifact.
- [ ] One explicit dossier-side `backlog impact verdict` was selected: `no-op`, `patch existing item`, `source update`, or `new backlog item`.
- [ ] If the verdict is `no-op`, the change meets the literal no-op criteria.
- [ ] If the verdict is not `no-op`, backlog actualization through `backlog-engineer` finished before stage closure.
- [ ] `lint-dossiers`, `coverage-audit`, marker audit, and index refresh ran after the change.
- [ ] The final answer explicitly states whether code/test/runtime follow-up is still required.

### CLI commands

#### CLI command: `help`

Provide a short workflow summary for the user.

Output:

- Keep it brief and practical.
- Summarize the default flow as:
  `selected backlog work -> feature-intake -> spec-compact -> plan-slice -> implementation -> dossier-verify -> review-artifact -> dossier-step-close`
- Mention that backlog creation, backlog selection, readiness, gaps, and lifecycle actualization belong to `backlog-engineer`.
- Mention that `change-proposal` + `contract-drift-audit` is the side path for requirement changes on mature work.
- Remind the user:
  - `docs/features/F-*.md` is the per-feature SSoT;
  - `docs/ssot/index.md` lists only real dossiers;
  - `coverage_gate` is distinct from dossier `status`;
  - `next-step` is dossier-local and does not choose backlog work.

Stage exit checklist:

- [ ] The reply is brief and practical.
- [ ] The flow includes closure steps, not just authoring steps.
- [ ] The reply correctly distinguishes dossier `status` from `coverage_gate`.
- [ ] It correctly states that `docs/ssot/index.md` lists only real dossiers.
- [ ] It correctly states that backlog shaping and selection belong to `backlog-engineer`.

#### CLI command: `feature-intake`

Create a new Feature Dossier and register it in the global index.

Operational summary:

- [Workflow guide: feature-intake](references/workflow.md#cli-command-feature-intake)

Steps:

1. Confirm that backlog work has already been selected through `backlog-engineer`.
2. Determine the next free `F-XXXX`.
3. Re-read architecture, ADR, and backlog context for the selected work.
4. Create `docs/features/F-XXXX-<slug>.md` from the dossier template.
5. Fill frontmatter with:
   - `id`
   - `title`
   - `status: proposed`
   - `coverage_gate: deferred`
   - `owners`
   - `area`
   - `depends_on`
   - `impacts`
   - `created`
   - `updated`
6. Record one canonical backlog handoff block in the dossier:
   - backlog item key;
   - backlog delivery state at intake;
   - relevant backlog source traceability;
   - known blockers and dependencies already visible at intake time.
7. Treat that backlog handoff block as human-facing continuity and traceability only.
   CLI commands such as `next-step` do not parse dossier prose or use that block as machine-readable state.
8. Capture the selected backlog context, delivered prerequisites, runtime assumptions, and dependency seams in the dossier body.
9. Use `node scripts/dossier.mjs index-refresh` as the canonical full refresh path after intake.
   Use `sync-index` only when you intentionally need table/graph refresh without a Red flags update.
10. If `feature-intake --json` returns `partial_success: true`, treat intake as incomplete until the reported `index-refresh` failure is resolved.
11. If intake reveals new blockers, missing dependencies, missing context, or lifecycle-changing facts, update backlog state through `backlog-engineer` before moving forward.

Command correctness checklist:

- [ ] The selected work came from `backlog-engineer`, not from local architecture rediscovery.
- [ ] The new dossier uses the next free `F-XXXX` and a stable slug.
- [ ] Frontmatter is valid and complete enough for the workflow, including explicit `coverage_gate`.
- [ ] `status` is `proposed`, `coverage_gate` is explicit, and the dossier does not pretend that compact specification is already complete.
- [ ] The dossier contains one explicit backlog handoff block with item key, backlog state, source traceability, and intake-time blockers/dependencies.
- [ ] Context, scope, constraints, and assumptions are grounded in architecture, ADR, and selected-work context.
- [ ] `depends_on` contains only real delivered prerequisites.
- [ ] Intake-side blockers or missing dependencies were returned to `backlog-engineer` before the next downstream stage.
- [ ] `docs/ssot/index.md` contains exactly one row for the new dossier.

#### CLI command: `coverage-audit`

Check that every AC is covered by tests.

Contract:

- Each AC ID must appear in tests or in a `// Covers: AC-...` comment.
- Coverage enforcement uses `coverage_gate`, not dossier `status` alone.
- `--orphans-scope` controls whether orphan AC references are reported for the dossier only or for the whole repo.

Run examples:

- `node scripts/dossier.mjs coverage-audit --dossier docs/features/F-XXXX-*.md`
- `node scripts/dossier.mjs coverage-audit --changed-only --base origin/main`
- `node scripts/dossier.mjs coverage-audit --dossier docs/features/F-XXXX-*.md --orphans-scope=dossier`

Command correctness checklist:

- [ ] The audit ran against the intended scope.
- [ ] `coverage_gate` handling matches the actual frontmatter or repo policy.
- [ ] Missing AC references are listed explicitly.
- [ ] Orphan reporting scope is correct for the use case.
- [ ] The report clearly distinguishes blocking gaps from informational gaps.
- [ ] The final claim matches actual findings and exit status.

#### CLI command: `debt-audit` (compatibility alias: `marker-audit`)

Check for explicit unresolved debt markers.

Contract:

- This is intentionally narrow automation for `TODO` / `FIXME` / `HACK` / `XXX` markers.
- `debt-audit` is the shipped CLI command; `marker-audit` is a compatibility alias.
- It augments, but never replaces, the manual technical-debt review.
- It is **not** a completeness audit and does not prove that the implementation matches the full intended scope.

Run examples:

- `node scripts/dossier.mjs debt-audit`
- `node scripts/dossier.mjs debt-audit --changed-only --base origin/main`
- `node scripts/dossier.mjs marker-audit --paths src/server,docs/features/F-0001-foo.md`

Audit fidelity checklist:

- [ ] The audit ran against the intended scope.
- [ ] The report clearly states that it is marker-only.
- [ ] Any findings were removed immediately or surfaced as blocking until a canonical follow-up artifact exists.
- [ ] The final claim does not treat this audit as a substitute for manual debt review or implementation-completeness review.

#### CLI command: `dependency-graph`

Generate the current dossier dependency graph.

Run:

- `node scripts/dossier.mjs dependency-graph`

Audit fidelity checklist:

- [ ] The graph is generated from current dossier frontmatter.
- [ ] Dependency edges reflect current `depends_on` relationships.
- [ ] The output is treated as a generated view, not as an editable source of truth.
- [ ] Any missing dossier references were surfaced before relying on the graph.

#### CLI command: `sync-index`

Regenerate `docs/ssot/index.md` from dossier frontmatter.

Run:

- `node scripts/dossier.mjs sync-index`

Command correctness checklist:

- [ ] `docs/ssot/index.md` was regenerated from current dossier frontmatter.
- [ ] The features table contains one row per dossier and no `CF-*` entries.
- [ ] Status and coverage gate are shown as separate signals.
- [ ] The dependency graph matches current dossiers and `depends_on` edges.
- [ ] Existing non-generated sections were preserved.

#### CLI command: `index-refresh`

Canonical single-writer refresh for the index.

Run:

- `node scripts/dossier.mjs index-refresh`

Behavior:

- Runs `sync-index` first.
- Then runs `lint-dossiers --update-index` to refresh the generated Red flags block.
- Use this when you want one deterministic writer for both generated sections.

Command correctness checklist:

- [ ] `sync-index` ran before any Red flags update.
- [ ] The index was mutated by one orchestrated path rather than multiple ad hoc writers.
- [ ] Generated feature/dependency content and Red flags content are both fresh.
- [ ] The final report states that this was an orchestrated index refresh.

#### CLI command: `lint-dossiers` (recommended)

Validate structure, metadata, links, and duplication constraints.

Reference:

- [Lint rules](references/lint-rules.md)

Run:

- `node scripts/dossier.mjs lint-dossiers`
- `node scripts/dossier.mjs lint-dossiers --update-index`

Contract:

- By default, `lint-dossiers` is read-only.
- Use `--update-index` only when you intentionally want to refresh the Red flags block.

Audit fidelity checklist:

- [ ] Lint was run against the current repo state and findings were captured faithfully.
- [ ] Any reported errors were fixed before claiming success, or surfaced as blocking.
- [ ] Frontmatter, AC IDs, coverage map rows, dependency references, and explicit `coverage_gate` handling were actually checked.
- [ ] If `--update-index` was used, the generated Red flags block was refreshed without clobbering other content.
- [ ] The final claim matches the tool output and exit status.

#### CLI command: `dossier-verify`

Run the canonical verification bundle and persist its result.

Purpose:

- Reduce manual repetition.
- Produce a durable artifact for `dossier-step-close`.
- Make reruns after review fixes deterministic.

Run examples:

- `node scripts/dossier.mjs dossier-verify --step implementation --dossier docs/features/F-0001-foo.md`
- `node scripts/dossier.mjs dossier-verify --step implementation --changed-only --base origin/main --extra "pnpm test" --extra "pnpm lint"`

Default bundle:

- `index-refresh`
- `lint-dossiers`
- `coverage-audit`
- marker audit / `debt-audit`
- `git diff --check` when git is available
- repo-specific extras via repeated `--extra`

Important:

- Use `--dossier` as the canonical closure path for one dossier.
- Use `--changed-only` only for repo-scope verification of the current change set.

Audit fidelity checklist:

- [ ] The artifact scope matches the intended dossier or changed set.
- [ ] The recorded command list includes both canonical dossier checks and required repo-specific extras.
- [ ] Exit codes, stdout/stderr, and overall pass/fail are captured faithfully.
- [ ] The artifact records event commit only as trace metadata when git is available.
- [ ] The author did not claim “all checks passed” if the artifact says otherwise.

#### CLI command: `review-artifact`

Persist a reviewer-supplied verdict as a durable artifact.

Purpose:

- Record review event provenance, including event commit when git is available.
- Keep review freshness tied to material scope changes, not commit SHA changes.
- Preserve must-fix and should-fix findings outside chat.
- Record reviewer provenance explicitly.
- Persist the result of a review that already happened; this command does not perform the review itself.

Run examples:

- `node scripts/dossier.mjs review-artifact --dossier docs/features/F-0001-foo.md --step implementation --reviewer independent-reviewer --verdict PASS`
- `node scripts/dossier.mjs review-artifact --dossier docs/features/F-0001-foo.md --step implementation --reviewer independent-reviewer --verdict FAIL --must-fix "Missing rollback path"`

Command correctness checklist:

- [ ] The artifact is tied to the intended dossier and step.
- [ ] Reviewer provenance is explicit.
- [ ] PASS artifacts do not contain unresolved must-fix findings.
- [ ] Findings are explicit and durable instead of being left in chat only.
- [ ] Commit SHA, if recorded, is treated as trace metadata only.
- [ ] The final answer references review freshness accurately.

#### CLI command: `dossier-step-close`

Machine-checkable closure gate for a mutating step.

Purpose:

- Block false “done” claims.
- Merge verification truth, review truth, and material-scope freshness.
- Persist canonical `process_complete` state.

Run example:

- `node scripts/dossier.mjs dossier-step-close --dossier docs/features/F-0001-foo.md --step implementation --verify-artifact .dossier/verification/F-0001/implementation-<event>.json --review-artifact .dossier/reviews/F-0001/implementation-<event>.json`

Contract:

- Fails if verification artifact did not pass.
- Fails if review artifact is not PASS.
- Fails if the worktree is dirty unless explicitly allowed.
- Writes a step artifact either way so blockers stay durable.

Command correctness checklist:

- [ ] The step artifact exists for the intended dossier and step.
- [ ] `process_complete: true` appears only when verification passed, review passed, and no known material-scope freshness blocker exists.
- [ ] Any blockers are explicit and accurate.
- [ ] The artifact’s `next_step` is sensible for the dossier’s current state.
- [ ] The final answer uses the artifact truth rather than wishful language.

#### CLI command: `contract-drift-audit`

Detect when dossier changes alter executable behavior without matching code/test/runtime follow-up.

Purpose:

- Prevent docs-only self-deception on mature features.
- Make “does this require code follow-up?” explicit and reproducible.

Run examples:

- `node scripts/dossier.mjs contract-drift-audit --dossier docs/features/F-0001-foo.md`
- `node scripts/dossier.mjs contract-drift-audit --dossier docs/features/F-0001-foo.md --base origin/main`

Audit fidelity checklist:

- [ ] The baseline snapshot is correct for the comparison being made.
- [ ] Added/removed AC IDs and changed executable sections are reported accurately.
- [ ] Mature dossier states trigger the audit when executable contract changes.
- [ ] If code/test/runtime follow-up is missing, the report says so explicitly.
- [ ] The final answer does not call the change docs-only when the audit disagrees.

#### CLI command: `next-step`

Return the next dossier-local workflow action for already selected work.

Operational summary:

- [Workflow guide: next-step](references/workflow.md#cli-command-next-step)

Purpose:

- Resolve ambiguity inside the dossier workflow after work has already been selected through `backlog-engineer`.
- For this decision, the CLI reads only structured dossier fields and durable artifacts. It never interprets dossier body prose.

Run examples:

- `node scripts/dossier.mjs next-step --dossier docs/features/F-0001-foo.md`
- `node scripts/dossier.mjs next-step --dossier docs/features/F-0001-foo.md --json`

Expected output dimensions:

- `workflow_stage_next` (real workflow stage or `null`)
- `target_dossier`
- `dossier_status`
- `blocking_gate`
- `uncommitted_work`
- `review_freshness`
- `process_complete`

Command correctness checklist:

- [ ] The answer stays dossier-local and does not try to choose backlog work.
- [ ] When more than one dossier exists in the repo, `--dossier` was used instead of relying on implicit selection.
- [ ] The command is treated as structured-state/artifact-driven only; it never infers blockers or decisions from dossier body prose.
- [ ] Blocking gates come from actual durable artifacts when available.
- [ ] Dirty worktree state is surfaced explicitly.
- [ ] Review freshness is reported from durable review state and material-scope policy, not from current commit SHA.
- [ ] Repo overlays and repo ADRs were ingested before acting on the result; `next-step` output does not replace overlay ingestion.
- [ ] The final answer tells the user to return to `backlog-engineer` when backlog blockers or lifecycle updates must be resolved.

## Examples

- Single Feature Dossier example:
  [references/example-feature-dossier.md](references/example-feature-dossier.md)
- Repository-level example:
  [assets/example-repo/AGENTS.md](assets/example-repo/AGENTS.md)
  with companion docs in `assets/example-repo/docs/*` and test stubs in `assets/example-repo/src/*`.
