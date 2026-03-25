---
name: dossier-engineer
version: 2.0.0
description: Lean docs-as-code process for large app development with AI agents. Uses one Feature Dossier per feature, one global index, explicit backlog discovery, separated workflow and coverage state, machine-checkable review/verification/step-close artifacts, scoped audits, and repo-overlay ingestion.
compatibility: Designed for git repos. Optional scripts in scripts/ require Node.js >= 18.
---

# Dossier Engineer

This skill implements a **low-overhead, high-control** workflow for large projects with AI agents.

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
- **Explicit architecture coverage**: backbone seams stay visible alongside user-facing capabilities.
- **Repo-aware execution**: repo-local rules from `AGENTS.md` and ADRs are ingested before planning or implementation decisions are made.

## Core artifacts

Canonical product docs:

- `docs/features/F-XXXX-<slug>.md` — **Feature Dossier** (**SSoT for that feature**).
- `docs/ssot/index.md` — **Global navigation + dependency index**.
- `docs/backlog/feature-candidates.md` — **Candidate backlog** (**non-SSoT**).
- `docs/architecture/system.md` — canonical architecture overview.
- `docs/adr/*.md` — optional cross-cutting ADRs.
- `AGENTS.md` — repo-level operating rules and workflow overlays.

Canonical process artifacts:

- `.dossier/verification/<feature>/<step>-<commit>.json` — verification bundle result from `dossier-verify`.
- `.dossier/reviews/<feature>/<step>-<commit>.json` — independent review result from `review-artifact`.
- `.dossier/steps/<feature>/<step>.json` — machine-checkable closure state from `dossier-step-close`.
- `.dossier/drift/<feature>/*.json` — executable-contract impact results from `contract-drift-audit`.

Templates:

- Feature dossier template: [references/DOSSIER_TEMPLATE.md](references/DOSSIER_TEMPLATE.md)
- Index template: [references/SSOT_INDEX_TEMPLATE.md](references/SSOT_INDEX_TEMPLATE.md)
- Candidate backlog template: [references/FEATURE_CANDIDATES_TEMPLATE.md](references/FEATURE_CANDIDATES_TEMPLATE.md)
- ADR block template: [references/ADR_BLOCK_TEMPLATE.md](references/ADR_BLOCK_TEMPLATE.md)
- Repo `AGENTS.md` template: [references/REPO_AGENTS_TEMPLATE.md](references/REPO_AGENTS_TEMPLATE.md)

## State model (keep these dimensions separate)

Do **not** overload one field to mean multiple things.

### 1. Candidate backlog state

Applies only to `docs/backlog/feature-candidates.md` entries:

- `candidate`
- `confirmed`
- `intaken`
- `discarded`

### 2. Dossier maturity state

Applies only to dossier frontmatter `status`:

- `proposed`
- `shaped`
- `planned`
- `in_progress`
- `done`
- `parked`

Meaning:

- `proposed` — intake exists, but design is still draft.
- `shaped` — compact design and constraints are resolved enough to plan slices.
- `planned` — slices/tasks are ready; implementation can start.
- `in_progress` — executable work is active.
- `done` — the feature is delivered and aligned.
- `parked` — intentionally paused.

### 3. Coverage enforcement state

Applies via dossier frontmatter `coverage_gate`:

- `deferred` — gaps are informational; planning may proceed.
- `strict` — gaps are blocking.

Default policy when `coverage_gate` is omitted:

- `proposed`, `shaped`, `planned` → `deferred`
- `in_progress`, `done` → `strict`

Repo overlays may tighten this. If they do, follow the repo rule and make it explicit in the dossier.

### 4. Review freshness state

Applies to `.dossier/reviews/...` artifacts:

- `missing`
- `pass`
- `fail`
- `stale`

A review is **stale** when the reviewed commit no longer matches the current closure target.

### 5. Step closure state

Applies to `.dossier/steps/...` artifacts:

- `open`
- `blocked`
- `closed`

A step is `closed` only when `process_complete: true`.

### 6. Commit completeness state

Applies to the working tree and closure target:

- `dirty`
- `clean-unreviewed`
- `clean-reviewed`
- `clean-but-stale-review`

## Hard rules (must follow)

1. **No duplicated requirements.**
   Acceptance criteria text lives only in the Feature Dossier.

2. **Always start from the index.**
   To answer “where is X?”, open `docs/ssot/index.md` first.

3. **Every behavior-changing PR must update docs.**
   Progress, coverage map, change log, and assumption shifts must be reflected in the dossier.

4. **Traceability uses stable IDs only.**
   Use `F-*`, `AC-*`, `ADR-*`, `SL-*`, and `T-*`.

5. **Candidate features are not dossiers.**
   `docs/ssot/index.md` lists only real dossiers.

6. **Make architecture coverage explicit.**
   Backbone seams need visible ownership just like user-visible features do.

7. **Promote cross-cutting delivery assumptions early.**
   Architecture or repo-level ADRs should carry shared runtime, deployment, or verification constraints.

8. **No technical debt by default.**
   Every mutating step must include an explicit debt review, dependency/seam re-check, and durable handling path for every finding.

9. **No “step complete” claim without machine-checkable closure.**
   A mutating step is not complete until `dossier-verify`, independent review, and `dossier-step-close` all pass on the same closure target.

10. **Material change invalidates prior review by default.**
    If code, tests, executable dossier sections, architecture, or ADRs change after review, treat the review as stale unless a stricter repo-local rule says otherwise.

11. **Ingest repo overlays before acting.**
    Before `spec-compact`, `plan-slice`, `implementation`, `change-proposal`, `dossier-verify`, and `next-step`, read repo-root `AGENTS.md` and any referenced repo-level ADRs that constrain the work.

12. **Independent review should be truly independent.**
    Prefer a separate (spawn) reviewer agent that did not author the changes or the close-out summary. If the platform cannot spawn agents, emulate role separation explicitly and use the stricter interpretation.

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

## Step closure contract

For every **mutating** step (`init`, `feature-discovery`, `feature-intake`, `spec-compact`, `plan-slice`, `implementation`, `change-proposal`, `adr-log`, `dependency-check`, `sync-index`, `index-refresh`, or a user-approved implementation increment):

1. Finish the command’s local work.
2. Run the command-specific checks.
3. Perform manual debt review on the changed scope.
4. Run `node scripts/debt-audit.mjs --changed-only` when the repo provides it.
5. Re-check dependencies, adjacent seams, delivered dossiers, architecture, and repo ADRs.
6. Run `node scripts/dossier-verify.mjs ...` for the relevant scope.
7. Run an independent review. Prefer a separate reviewer agent that did not author the change or the close-out summary.
8. Persist the verdict with `node scripts/review-artifact.mjs ...`.
9. Close the step with `node scripts/dossier-step-close.mjs ...`.
10. Only after `process_complete: true` may the agent say the step is complete.

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

Treat the review as stale when any of the following changed after the reviewed commit:

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

Default contract:

1. Spawn a separate reviewer agent that did not produce the changes or the final answer whenever the platform supports it.
2. Give the reviewer the command name, touched files, relevant command output or artifacts, debt-review outcome, and the command-specific checklist.
3. The reviewer must inspect actual repo state and generated artifacts, not trust the author’s summary.
4. For mutating steps, persist the reviewer’s verdict with `review-artifact` and use it for step closure.
5. For read-only or report-producing commands, the reviewer still checks output fidelity even when no step-close artifact is required.
6. Resolve every `must-fix` finding, rerun affected checks, and rerun review when the fixes were material.
7. If the platform cannot spawn agents, emulate role separation explicitly and prefer the stricter interpretation.

## Review checklist design rules

Every command-specific checklist below follows the same review philosophy:

1. **Check actual repo state**, not the author’s summary.
2. **Separate artifact correctness from process correctness.**
3. **Check cross-artifact alignment**: dossier ↔ tests ↔ index ↔ backlog ↔ architecture ↔ ADRs.
4. **Check freshness**: if review or verification is tied to an older commit, it does not count.
5. **Check close-out truthfulness**: the final answer must accurately report blockers, next step, and process-complete state.
6. **For read-only commands**, review the report fidelity instead of expecting mutations.
7. **Green automation is never enough by itself**: a reviewer still checks for semantic gaps, especially for side-effecting code.
8. **Check completeness against intended scope**: no silent stubs, hidden scope cuts, or undocumented “later” deferrals.
9. **For implementation review, separate completeness review, code review, and security review** instead of assuming one umbrella check covers them.

## Commands / modes

### `help`

Provide a short workflow summary for the user.

Output:

- Keep it brief and practical.
- Summarize the default flow as:
  `init -> feature-discovery -> mark candidate confirmed -> feature-intake -> spec-compact -> plan-slice -> implementation -> dossier-verify -> review-artifact -> dossier-step-close`
- Mention that `change-proposal` + `contract-drift-audit` is the side path for requirement changes on mature work.
- Remind the user:
  - `docs/features/F-*.md` is the per-feature SSoT;
  - `docs/ssot/index.md` lists only real dossiers;
  - `docs/backlog/feature-candidates.md` is a non-SSoT candidate backlog;
  - `coverage_gate` is distinct from dossier `status`.

Review checklist:

- [ ] The reply is brief and practical.
- [ ] The flow includes closure steps, not just authoring steps.
- [ ] The reply correctly distinguishes dossier `status` from `coverage_gate`.
- [ ] It correctly states that `docs/ssot/index.md` lists only real dossiers.
- [ ] It correctly states that `docs/backlog/feature-candidates.md` is non-SSoT.

### `init`

Bootstrap the dossier protocol in a repository that already has architecture.

Minimal requirement:

- A repo-level architecture document must already exist. If none exists, stop and say that initialization requires architecture first.

Determinism policy:

- `init` proceeds automatically only when the next action is unambiguous.
- If multiple plausible architecture documents exist and no canonical choice is obvious, ask the user.
- If existing repo-root `AGENTS.md`, `docs/ssot/index.md`, or repo-local scripts contain custom structure that cannot be safely normalized, ask before rewriting.

Steps:

1. Check for `docs/architecture/system.md`.
2. If missing, search for plausible repo-level architecture docs under `docs/`.
3. If no architecture exists, stop without partial bootstrap.
4. If exactly one clear candidate exists, move or rename it to `docs/architecture/system.md`.
5. Ensure `docs/features/`, `docs/backlog/`, and `.dossier/` directories exist.
6. Provision canonical dossier automation scripts into repo `scripts/` when safe:
   - `sync-index.mjs`
   - `lint-dossiers.mjs`
   - `coverage-audit.mjs`
   - `dependency-graph.mjs`
   - `debt-audit.mjs`
   - `marker-audit.mjs`
   - `index-refresh.mjs`
   - `dossier-verify.mjs`
   - `review-artifact.mjs`
   - `dossier-step-close.mjs`
   - `contract-drift-audit.mjs`
   - `next-step.mjs`
   - `scripts/lib/*`
7. Create or normalize `docs/ssot/index.md`.
8. Create or normalize `docs/backlog/feature-candidates.md`.
9. Create or update repo-root `AGENTS.md`.
10. Re-read architecture and surface day-1 implementation invariants that future modes must preserve.
11. Report created, moved, renamed, normalized, and untouched artifacts separately.

Review checklist:

- [ ] If no architecture existed, the command stopped cleanly and did not leave half-created bootstrap artifacts behind.
- [ ] If `init` proceeded, canonical docs directories and `.dossier/` exist.
- [ ] Canonical scripts and `scripts/lib/*` were provisioned when safe, or divergence was surfaced explicitly instead of overwritten blindly.
- [ ] Repo-root `AGENTS.md` preserves unrelated repo instructions while adding dossier workflow rules.
- [ ] No placeholder feature dossiers were created.
- [ ] Reported invariants are grounded in architecture/ADRs instead of being invented.
- [ ] The final report distinguishes created, moved, normalized, and untouched artifacts accurately.

### `feature-discovery`

Read architecture and refresh the candidate backlog.

Output:

- `docs/backlog/feature-candidates.md` with temporary `CF-*` entries.
- Candidate entries must be coarse, backlog-sized, and tied either to a user-visible capability or to an architecture-mandated backbone seam.

Steps:

1. Read canonical architecture from `docs/architecture/system.md`.
2. Read existing `docs/backlog/feature-candidates.md`.
3. Read existing dossiers and `docs/ssot/index.md` to avoid duplication.
4. Extract candidate features from architecture.
5. Check coverage of major architecture seams so missing owners remain visible.
6. Create or update `docs/backlog/feature-candidates.md`.
7. If architecture is too vague to separate features confidently, ask the user instead of inventing a backlog.

Review checklist:

- [ ] The backlog was refreshed from architecture, or architecture ambiguity was surfaced explicitly.
- [ ] Only `CF-*` IDs are used in the candidate backlog.
- [ ] Candidate entries are backlog-sized and traceable to user-visible capabilities or architecture seams.
- [ ] Existing real dossiers were not duplicated as new candidates.
- [ ] `docs/ssot/index.md` still lists only real dossiers.
- [ ] Missing backbone owners are visible via candidate entries or coverage notes.

### `feature-intake`

Create a new Feature Dossier and register it in the global index.

Steps:

1. Determine the next free `F-XXXX`.
2. Re-read architecture and backlog context for the selected candidate.
3. Create `docs/features/F-XXXX-<slug>.md` from the dossier template.
4. Fill frontmatter with:
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
5. Capture phase baseline, delivered prerequisites, runtime assumptions, and dependency seams.
6. If intake reveals a missing prerequisite seam without an owner, refresh backlog ownership first.
7. Mark the matching `CF-*` entry as `intaken` and link the dossier.
8. Run `node scripts/sync-index.mjs` or `node scripts/index-refresh.mjs`.

Review checklist:

- [ ] The new dossier uses the next free `F-XXXX` and a stable slug.
- [ ] Frontmatter is valid and complete enough for lint, including explicit `coverage_gate`.
- [ ] `status` is `proposed`, `coverage_gate` is explicit, and AC IDs match the feature numeric ID.
- [ ] Context, scope, constraints, and assumptions are grounded in architecture/backlog context.
- [ ] `depends_on` contains only real delivered prerequisites.
- [ ] If intake exposed a missing prerequisite seam, backlog ownership was refreshed before implementation starts.
- [ ] The matching `CF-*` entry is marked `intaken` and links to the dossier.
- [ ] `docs/ssot/index.md` contains exactly one row for the new dossier.

### `spec-compact`

Evolve the same dossier into a minimal implementable spec.

Steps:

1. Re-read repo overlays from `AGENTS.md` and relevant repo ADRs.
2. Refine ACs to be testable.
3. Add compact design:
   - API surface
   - runtime and deployment surface when relevant
   - data model changes
   - edge cases and failure modes
   - verification surface
4. Add Definition of Done and an initial coverage map plan.
5. If an architectural fork exists, run `adr-log`.
6. If the spec introduces a cross-cutting decision, promote it to architecture or a repo ADR.
7. Set dossier `status: shaped` unless a stricter repo overlay defines a different maturity rule.
8. Keep `coverage_gate` explicit; default is still `deferred` unless repo rules say otherwise.

Review checklist:

- [ ] The same dossier was evolved in place; no shadow SSoT exists.
- [ ] Acceptance criteria are specific enough to verify.
- [ ] Design covers API, runtime/deployment, data changes, failure modes, and verification surface when relevant.
- [ ] Repo overlays and repo ADRs were ingested before finalizing the spec.
- [ ] Any cross-cutting decision was externalized instead of being left hidden inside one dossier.
- [ ] `status` is consistent with spec maturity and `coverage_gate` stays explicit.
- [ ] The final answer reports any overlay that changed the default path.

### `plan-slice`

Add an incremental slicing plan inside the dossier.

Steps:

1. Re-read repo overlays that constrain planning.
2. Create 2–6 slices in delivery order.
3. For each slice, state the deliverable and which AC IDs it covers.
4. For each slice, name the verification artifact that proves it.
5. For each slice, list tasks that reference AC IDs or Slice IDs only.
6. If the feature requires realignment of delivered work, make that realignment explicit as a slice or linked task.
7. Set dossier `status: planned`.
8. Set or confirm `coverage_gate` explicitly.
   - Default: `deferred`
   - Tighten to `strict` only when the repo overlay requires it or planning is intentionally treated as a blocking verification gate.

Review checklist:

- [ ] The dossier contains 2–6 slices in delivery order.
- [ ] Every slice states a concrete deliverable and cites AC IDs.
- [ ] Every slice names the verification artifact(s) that prove it.
- [ ] Tasks reference Slice IDs or AC IDs and do not restate AC text.
- [ ] Any required realignment of existing delivered work is explicit.
- [ ] `status: planned` is used for planning maturity, while `coverage_gate` independently captures coverage strictness.
- [ ] The final answer does not rationalize a status workaround such as “planned but really shaped”; it uses the explicit state model instead.

### `implementation`

Implement the planned feature while keeping dossier, architecture, overlays, and delivered substrate aligned.

Steps:

1. Start from `docs/ssot/index.md`, then open the target dossier, dependent dossiers, relevant architecture sections, repo `AGENTS.md`, and repo ADRs.
2. Deliver on the canonical stack, runtime, and deployment path from the first executable change.
3. Build verification alongside implementation.
4. When implementation reveals a missing prerequisite seam or cross-cutting invariant, externalize it immediately.
5. Update the target dossier in the same workstream:
   - progress and links
   - coverage map
   - change log when behavior or assumptions changed
   - `coverage_gate: strict` when executable coverage must now block closure
6. Run project checks plus `node scripts/dossier-verify.mjs ...`.
7. Run an explicit completeness review against the dossier, slices, approved changes, and repo overlays. Any stub, reduced scope, placeholder, or deferred behavior must be recorded explicitly; never leave it implicit.
8. Run independent review and persist it. Prefer a separate reviewer agent that did not author the change.
9. Close the step with `dossier-step-close` before saying it is complete.

Required adversarial checklist for side-effecting code:

- timeout budget is explicit and consistent across call chain;
- late completion after caller timeout cannot violate externally visible guarantees;
- abort/cancellation propagates correctly;
- partial side effects have rollback, compensation, or safe retry semantics;
- idempotency and duplicate delivery/retry behavior are explicit;
- logging/audit append failures have defined behavior;
- crash/restart boundaries do not produce impossible states.

Review checklist:

- [ ] Code changes follow the canonical stack, runtime, deployment path, and repo overlays.
- [ ] Delivered behavior maps back to slices/ACs or to an explicit approved change.
- [ ] Completeness review passed: the implementation fully covers the intended slices/ACs/approved changes, with no silent stubs, placeholders, scope cuts, or undocumented “later” deferrals.
- [ ] Code review passed: correctness, maintainability, typing/contracts, error handling, state/resource lifecycle, and boundary handling are sound for the changed scope.
- [ ] Security review passed: auth/authz, input validation, injection, secret handling, logging/redaction, trust boundaries, and data exposure risks were checked for the changed scope.
- [ ] Verification was added alongside code: AC-linked tests plus smoke/startup/container checks when relevant.
- [ ] Newly discovered prerequisites or cross-cutting invariants were externalized promptly.
- [ ] The target dossier was updated in the same workstream.
- [ ] Side-effecting behavior passed the adversarial checklist above.
- [ ] `coverage_gate` is strict when implementation closure depends on executable verification.
- [ ] `dossier-verify`, independent review, and `dossier-step-close` all ran on the closure target.
- [ ] The final answer accurately reports `Process-complete: yes|no`.

### `adr-log`

Record an architectural decision as an ADR block (default) or separate ADR file (rare).

Rules:

- Use ADR blocks inside the dossier for feature-local decisions.
- Create `docs/adr/ADR-YYYY-MM-DD-<slug>.md` only for cross-cutting decisions.

Review checklist:

- [ ] The decision was recorded in the right place.
- [ ] The ADR has a stable ID, title, status, date, context, decision, alternatives, and consequences.
- [ ] The ADR captures a real architectural fork or durable constraint.
- [ ] Consequences and follow-ups are reflected in the affected dossier, backlog, or architecture.
- [ ] Discoverability from dossier/index/architecture paths is preserved.

### `dependency-check`

Validate and visualize dependencies.

Steps:

1. Read `depends_on` and `impacts` from dossier frontmatter.
2. Validate that all referenced `F-*` dossiers exist.
3. Generate a Mermaid graph via `node scripts/dependency-graph.mjs`.
4. Refresh the index with `node scripts/sync-index.mjs` or `node scripts/index-refresh.mjs`.

Review checklist:

- [ ] Every `depends_on` entry is formatted as `F-XXXX` and points to an existing dossier.
- [ ] The Mermaid graph matches current frontmatter.
- [ ] `docs/ssot/index.md` contains the refreshed dependency graph with no stale edges.
- [ ] Any invalid or missing dependency was reported explicitly.
- [ ] The updated index remains metadata/link oriented.

### `coverage-audit`

Check that every AC is covered by tests.

Contract:

- Each AC ID must appear in tests or in a `// Covers: AC-...` comment.
- Coverage enforcement uses `coverage_gate`, not dossier `status` alone.
- `--orphans-scope` controls whether orphan AC references are reported for the dossier only or for the whole repo.

Run examples:

- `node scripts/coverage-audit.mjs --dossier docs/features/F-XXXX-*.md`
- `node scripts/coverage-audit.mjs --changed-only --base origin/main`
- `node scripts/coverage-audit.mjs --dossier docs/features/F-XXXX-*.md --orphans-scope=dossier`

Review checklist:

- [ ] The audit ran against the intended scope.
- [ ] `coverage_gate` handling matches the actual frontmatter or repo policy.
- [ ] Missing AC references are listed explicitly.
- [ ] Orphan reporting scope is correct for the use case.
- [ ] The report clearly distinguishes blocking gaps from informational gaps.
- [ ] The final claim matches actual findings and exit status.

### `marker-audit` / `debt-audit` (recommended)

Check for explicit unresolved debt markers.

Contract:

- This is intentionally narrow automation for `TODO` / `FIXME` / `HACK` / `XXX` markers.
- `debt-audit.mjs` is retained as the compatibility entrypoint.
- It augments, but never replaces, the manual technical-debt review.
- It is **not** a completeness audit and does not prove that the implementation matches the full intended scope.

Run examples:

- `node scripts/debt-audit.mjs`
- `node scripts/debt-audit.mjs --changed-only --base origin/main`
- `node scripts/marker-audit.mjs --paths src/server,docs/features/F-0001-foo.md`

Review checklist:

- [ ] The audit ran against the intended scope.
- [ ] The report clearly states that it is marker-only.
- [ ] Any findings were removed immediately or surfaced as blocking until a canonical follow-up artifact exists.
- [ ] The final claim does not treat this audit as a substitute for manual debt review or implementation-completeness review.

### `change-proposal`

Apply requirement changes safely.

Steps:

1. Re-read repo overlays, architecture, and the current dossier maturity.
2. Add a new change-log entry.
3. Modify the AC list and every directly affected executable section.
4. Update slices, tasks, coverage map references, DoD, and dependency references.
5. If the dossier is `planned`, `in_progress`, or `done`, or if executable sections changed, run `node scripts/contract-drift-audit.mjs --dossier ...`.
6. If drift audit says follow-up is required, make that follow-up explicit:
   - same dossier slice/task;
   - linked backlog item;
   - ADR or architecture update.
7. Run `lint-dossiers`, `coverage-audit`, marker audit, and `sync-index` or `index-refresh`.
8. Do not report the step as docs-only complete when executable follow-up is still required.

Review checklist:

- [ ] The change log contains a new version/date/reason entry.
- [ ] Requirement edits were applied in the dossier SSoT, not in a shadow source.
- [ ] Slices, tasks, coverage map, DoD, and dependency references were updated consistently.
- [ ] `contract-drift-audit` ran when executable contract changes or mature dossier states made it necessary.
- [ ] If executable follow-up is required, it is explicit in a canonical artifact.
- [ ] `lint-dossiers`, `coverage-audit`, marker audit, and index refresh ran after the change.
- [ ] The final answer explicitly states whether code/test/runtime follow-up is still required.

### `sync-index`

Regenerate `docs/ssot/index.md` from dossier frontmatter.

Run:

- `node scripts/sync-index.mjs`

Review checklist:

- [ ] `docs/ssot/index.md` was regenerated from current dossier frontmatter.
- [ ] The features table contains one row per dossier and no `CF-*` entries.
- [ ] Status and coverage gate are shown as separate signals.
- [ ] The dependency graph matches current dossiers and `depends_on` edges.
- [ ] Existing non-generated sections were preserved.

### `index-refresh`

Canonical single-writer refresh for the index.

Run:

- `node scripts/index-refresh.mjs`

Behavior:

- Runs `sync-index` first.
- Then runs `lint-dossiers --update-index` to refresh the generated Red flags block.
- Use this when you want one deterministic writer for both generated sections.

Review checklist:

- [ ] `sync-index` ran before any Red flags update.
- [ ] The index was mutated by one orchestrated path rather than multiple ad hoc writers.
- [ ] Generated feature/dependency content and Red flags content are both fresh.
- [ ] The final report states that this was an orchestrated index refresh.

### `lint-dossiers` (recommended)

Validate structure, metadata, links, and duplication constraints.

Run:

- `node scripts/lint-dossiers.mjs`
- `node scripts/lint-dossiers.mjs --update-index`

Contract:

- By default, `lint-dossiers` is read-only.
- Use `--update-index` only when you intentionally want to refresh the Red flags block.

Review checklist:

- [ ] Lint was run against the current repo state and findings were captured faithfully.
- [ ] Any reported errors were fixed before claiming success, or surfaced as blocking.
- [ ] Frontmatter, AC IDs, coverage map rows, dependency references, and explicit `coverage_gate` handling were actually checked.
- [ ] If `--update-index` was used, the generated Red flags block was refreshed without clobbering other content.
- [ ] The final claim matches the tool output and exit status.

### `dossier-verify`

Run the canonical verification bundle and persist its result.

Purpose:

- Reduce manual repetition.
- Produce a durable artifact for `dossier-step-close`.
- Make reruns after review fixes deterministic.

Run examples:

- `node scripts/dossier-verify.mjs --step implementation --dossier docs/features/F-0001-foo.md`
- `node scripts/dossier-verify.mjs --step implementation --changed-only --base origin/main --extra "pnpm test" --extra "pnpm lint"`

Default bundle:

- `sync-index`
- `lint-dossiers`
- `coverage-audit`
- marker audit / `debt-audit`
- `git diff --check` when git is available
- repo-specific extras via repeated `--extra`

Review checklist:

- [ ] The artifact scope matches the intended dossier or changed set.
- [ ] The recorded command list includes both canonical dossier checks and required repo-specific extras.
- [ ] Exit codes, stdout/stderr, and overall pass/fail are captured faithfully.
- [ ] The artifact is tied to the current closure target commit.
- [ ] The author did not claim “all checks passed” if the artifact says otherwise.

### `review-artifact`

Persist the independent reviewer’s verdict as a durable artifact.

Purpose:

- Tie review to a specific commit.
- Make review freshness machine-checkable.
- Preserve must-fix and should-fix findings outside chat.

Run examples:

- `node scripts/review-artifact.mjs --dossier docs/features/F-0001-foo.md --step implementation --verdict PASS`
- `node scripts/review-artifact.mjs --dossier docs/features/F-0001-foo.md --step implementation --verdict FAIL --must-fix "Missing rollback path"`

Review checklist:

- [ ] The artifact is tied to the intended dossier, step, and reviewed commit.
- [ ] PASS artifacts do not contain unresolved must-fix findings.
- [ ] Findings are explicit and durable instead of being left in chat only.
- [ ] The reviewed commit matches the closure target or is clearly marked stale later.
- [ ] The final answer references review freshness accurately.

### `dossier-step-close`

Machine-checkable closure gate for a mutating step.

Purpose:

- Block false “done” claims.
- Merge verification truth, review truth, and current commit freshness.
- Persist canonical `process_complete` state.

Run example:

- `node scripts/dossier-step-close.mjs --dossier docs/features/F-0001-foo.md --step implementation --verify-artifact .dossier/verification/F-0001/implementation-<sha>.json --review-artifact .dossier/reviews/F-0001/implementation-<sha>.json`

Contract:

- Fails if verification artifact did not pass.
- Fails if review artifact is not PASS.
- Fails if review or verification is stale for the current commit.
- Fails if the worktree is dirty unless explicitly allowed.
- Writes a step artifact either way so blockers stay durable.

Review checklist:

- [ ] The step artifact exists for the intended dossier and step.
- [ ] `process_complete: true` appears only when verification passed, review passed, and freshness is valid.
- [ ] Any blockers are explicit and accurate.
- [ ] The artifact’s `next_step` is sensible for the dossier’s current state.
- [ ] The final answer uses the artifact truth rather than wishful language.

### `contract-drift-audit`

Detect when dossier changes alter executable behavior without matching code/test/runtime follow-up.

Purpose:

- Prevent docs-only self-deception on mature features.
- Make “does this require code follow-up?” explicit and reproducible.

Run examples:

- `node scripts/contract-drift-audit.mjs --dossier docs/features/F-0001-foo.md`
- `node scripts/contract-drift-audit.mjs --dossier docs/features/F-0001-foo.md --base origin/main`

Review checklist:

- [ ] The baseline snapshot is correct for the comparison being made.
- [ ] Added/removed AC IDs and changed executable sections are reported accurately.
- [ ] Mature dossier states trigger the audit when executable contract changes.
- [ ] If code/test/runtime follow-up is missing, the report says so explicitly.
- [ ] The final answer does not call the change docs-only when the audit disagrees.

### `next-step`

Return a canonical answer to “what next?” across multiple state machines.

Purpose:

- Resolve ambiguity across backlog order, dossier maturity, blocking gates, review freshness, and dirty worktree state.

Run examples:

- `node scripts/next-step.mjs`
- `node scripts/next-step.mjs --dossier docs/features/F-0001-foo.md`
- `node scripts/next-step.mjs --json`

Expected output dimensions:

- `workflow_next`
- `target_dossier`
- `dossier_status`
- `blocking_gate`
- `backlog_next`
- `uncommitted_work`
- `review_freshness`
- `process_complete`

Review checklist:

- [ ] The answer distinguishes workflow next from backlog next.
- [ ] Blocking gates come from actual durable artifacts when available.
- [ ] Dirty worktree state is surfaced explicitly.
- [ ] Review freshness is reported against the current commit.
- [ ] The final answer does not collapse multiple state dimensions into one vague “next”.

## Examples

- Single Feature Dossier example:
  [references/EXAMPLE_FEATURE_DOSSIER.md](references/EXAMPLE_FEATURE_DOSSIER.md)
- Repository-level example:
  [assets/example-repo/AGENTS.md](assets/example-repo/AGENTS.md)
  with companion docs in `assets/example-repo/docs/*` and test stubs in `assets/example-repo/src/*`.

## Migration from sdd-engineer

See: [references/MIGRATION_FROM_SDD_ENGINEER.md](references/MIGRATION_FROM_SDD_ENGINEER.md)
