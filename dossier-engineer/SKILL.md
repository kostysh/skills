---
name: dossier-engineer
description: Lightweight docs-as-code process for building large apps with AI coding agents. Uses one Feature Dossier per feature (SSoT), one global index, and a simple backlog discovery flow, with commands to init repos, discover features from architecture, intake features, compact specs, plan slices, log ADRs, audit dependency/coverage, and sync/lint docs to prevent drift and duplication.
license: Apache-2.0
compatibility: Designed for git repos. Optional scripts in scripts/ require Node.js >= 18.
---

# Dossier Engineer

This skill implements a **low-overhead, high-control** workflow for large projects with AI agents:

- **One Feature = One Dossier file** (canonical SSoT for requirements+design+plan+coverage).
- **One global index** answers “where is it?” and “what’s missing?”.
- **Traceability** is enforced with stable IDs and link-only references (no duplicated requirements text).
- **Automation** (lint + coverage audit + debt audit + dependency graph) replaces “more documents”.
- **Architecture coverage stays visible** so both user-facing capabilities and required platform seams have an explicit owner in the backlog.
- **Implementation starts from the canonical repo path** instead of rediscovering stack, runtime, or deployment assumptions feature by feature.

## Core artifacts (minimal set)

- `docs/features/F-XXXX-<slug>.md` — **Feature Dossier** (**SSoT for that feature**).
- `docs/ssot/index.md` — **Global index/registry** (**SSoT for navigation + dependency map**).
- `docs/backlog/feature-candidates.md` — **Candidate feature backlog** (**non-SSoT**, created by `feature-discovery`).
- `docs/architecture/system.md` — C4-lite architecture overview (**required before `init` can succeed**).
- `docs/adr/*.md` — optional; only for cross-cutting ADRs (otherwise keep ADR blocks inside the dossier).
- `AGENTS.md` — repo-level operating rules for agents (recommended; created or normalized by `init`).

Templates:

- Feature dossier template: [references/DOSSIER_TEMPLATE.md](references/DOSSIER_TEMPLATE.md)
- Index template: [references/SSOT_INDEX_TEMPLATE.md](references/SSOT_INDEX_TEMPLATE.md)
- Feature candidates backlog template: [references/FEATURE_CANDIDATES_TEMPLATE.md](references/FEATURE_CANDIDATES_TEMPLATE.md)
- ADR block template: [references/ADR_BLOCK_TEMPLATE.md](references/ADR_BLOCK_TEMPLATE.md)
- Repo `AGENTS.md` template: [references/REPO_AGENTS_TEMPLATE.md](references/REPO_AGENTS_TEMPLATE.md)

## Hard rules (must follow)

1. **No duplicated requirements.**
   Acceptance criteria text lives **only** in the Feature Dossier.
   Issues/tasks/PRs may reference AC IDs + links, but must not restate the AC text.

2. **Always start from the index.**
   To answer “where is X?”, open `docs/ssot/index.md` first, then follow links.

3. **Every behavior-changing PR must update docs.**
   If a PR implements `F-XXXX`, it must update the dossier’s:
   - Progress + links to PR/commits
   - Coverage map
   - Change log (if requirements changed)

4. **Traceability via IDs.**
   Use: `F-0001`, `AC-F0001-01`, `ADR-F0001-01`, `SL-F0001-01`, `T-F0001-01`.

5. **Candidate features are not dossiers.**
   `docs/backlog/feature-candidates.md` may use temporary `CF-001` IDs, but
   `docs/ssot/index.md` must list only real Feature Dossiers.

6. **Make architecture coverage explicit.**
   Candidate backlog work should make it easy to see which major architecture seams already have an owner and which still need one.

7. **Promote cross-cutting delivery assumptions early.**
   When stack, runtime, deployment, or verification decisions constrain multiple features, capture them in architecture or a repo-level ADR so later features can build on them directly.

8. **No technical debt by default.**
   Every completed workflow unit must include an explicit technical-debt review of the changed scope, a dependency/seam re-check to surface hidden debt, and a recorded resolution path for every finding before the unit is considered complete.

## Mandatory technical-debt review gate

In this workflow, a "step" means a completed command (`init`, `feature-discovery`, `feature-intake`, `spec-compact`, `plan-slice`, `implementation`, `change-proposal`, etc.) or a user-approved implementation increment when delivery is intentionally split.

Order of operations for every mutating step:

1. Finish the command's local work and run the command-specific checks.
2. Run a technical-debt review on the changed scope.
3. When repo-local dossier automation scripts exist, run `node scripts/debt-audit.mjs --changed-only` as a narrow guardrail before the manual dependency/seam re-check.
4. Re-check each debt item against dependencies, adjacent seams, delivered dossiers, architecture, and repo-level ADRs to surface hidden debt.
5. Resolve every item by one of these paths before the step can close:
   - eliminate it immediately in the same workstream;
   - realign the relevant dossier / backlog / ADR if it exposes a missing prerequisite seam or cross-cutting invariant;
   - record a user-approved follow-up in the canonical artifact for that debt class with stable references and explicit dependencies.
6. Only then run the mandatory independent review gate and close the step if no blocking findings remain.

Canonical follow-up artifacts:

- existing Feature Dossier, when the debt belongs to an intaken feature;
- `docs/backlog/feature-candidates.md`, when the debt exposes a not-yet-intaken seam;
- `docs/adr/ADR-*.md`, when the debt is cross-cutting.

Do not treat chat-only notes, TODO comments, or unlinked "known issues" as valid debt handling.

Use this quick debt-review method after each mutating step:

- Check the touched files and generated output for shortcuts, partial migrations, deferred verification, temporary compatibility shims, TODO-style placeholders, duplicated rules, or documentation drift.
- Run `node scripts/debt-audit.mjs --changed-only` when the repo provides the canonical script; treat it as a guardrail, never as a substitute for the manual review.
- Check outward from the changed scope into direct dependencies and adjacent seams: `depends_on` dossiers, the current architecture section, relevant repo-level ADRs, and the SSOT index/backlog entries that may inherit the change.
- Prefer the smallest durable fix that keeps the workflow honest. If the debt cannot be removed immediately, make the owner, artifact, dependency links, and next action explicit before moving on.

## Mandatory independent review gate

After completing any command, the authoring agent must run an independent review before reporting success.

Protocol:

1. Before the reviewer runs, complete the technical-debt review gate above and resolve or explicitly record every debt item.
2. Spawn a separate reviewer agent that did not produce the changes or answer.
3. Give the reviewer the command name, touched files, relevant command output, debt-review outcome, and the command-specific checklist below.
4. The reviewer must inspect actual repo state and generated output, not trust the authoring agent's summary.
5. The reviewer returns:
   - `PASS` or `FAIL`
   - `must-fix` findings
   - `should-fix` findings
   - concrete evidence (file path + section/anchor, and command output when relevant)
6. The authoring agent must resolve all `must-fix` findings, re-run relevant checks, repeat debt review if the fixes were material, and repeat review if needed.
7. Do not claim a command is complete while known blocking findings or unresolved debt items remain.
8. For read-only commands (`help`, `dependency-check`, `coverage-audit`, `lint-dossiers`), review the correctness and completeness of the output/report instead of expecting file mutations. Debt review still applies if the step produced a report that creates follow-up obligations.
9. When reviewer and author disagree, prefer the stricter interpretation unless architecture or an explicit user instruction clearly resolves the issue.
10. Once the reviewer agent has finished and all findings it raised have been resolved, stop the reviewer agent so resources are not wasted.

## Commands / modes

### `help`

Provide a short workflow summary for the user.

Output:

- Keep it brief and practical.
- Summarize the flow as:
  `init -> feature-discovery -> mark candidate confirmed -> feature-intake -> spec-compact -> plan-slice -> implementation -> checks`
- Briefly remind the user:
  - `docs/features/F-*.md` is the per-feature SSoT
  - `docs/ssot/index.md` lists only real dossiers
  - `docs/backlog/feature-candidates.md` is a non-SSoT candidate backlog
  - `confirmed` is a backlog state that records the user’s decision to promote a candidate toward intake

Review checklist:

- [ ] The reply is brief and practical.
- [ ] It includes the flow `init -> feature-discovery -> mark candidate confirmed -> feature-intake -> spec-compact -> plan-slice -> implementation -> checks`.
- [ ] It correctly states that `docs/features/F-*.md` is the per-feature SSoT.
- [ ] It correctly states that `docs/ssot/index.md` lists only real dossiers.
- [ ] It correctly states that `docs/backlog/feature-candidates.md` is a non-SSoT candidate backlog.
- [ ] It treats `confirmed` as a backlog state, not as a command.

### `init`

Bootstrap the dossier protocol in a repository that already has architecture.

Minimal requirement:

- A repo-level architecture document must already exist. If none exists, stop and tell the user that dossier initialization requires architecture first.

Determinism policy:

- `init` should proceed automatically only when the next action is unambiguous.
- If multiple plausible architecture documents exist and no canonical choice is obvious, ask the user which one should become canonical.
- If an existing repo-root `AGENTS.md` or `docs/ssot/index.md` contains custom structure that cannot be safely normalized without overwriting intent, ask the user before rewriting it.
- When in doubt, ask a short clarifying question instead of guessing.

Steps:

1. Check whether the canonical architecture file already exists at `docs/architecture/system.md`.
2. If it does not exist, search for plausible repo-level architecture docs.
   - Prefer Markdown files under `docs/` whose names contain `system`, `architecture`, or `arch`.
   - Ignore `docs/features/*`, `docs/adr/*`, `docs/ssot/*`, issue templates, PR templates, and obviously feature-local docs.
3. If no plausible architecture doc is found, stop and report that `init` cannot proceed until architecture exists.
4. If exactly one clear architecture candidate exists and it is not canonical, move or rename it to `docs/architecture/system.md`.
   - Preserve file content.
   - Prefer `git mv` in git repositories.
5. If multiple plausible architecture candidates exist:
   - Prefer an existing `docs/architecture/system.md`.
   - Otherwise choose a single repo-level document only if the canonical choice is obvious.
   - If the choice is not obvious, ask the user which document should become canonical instead of guessing.
6. Ensure `docs/features/` and `docs/backlog/` exist.
7. Provision canonical dossier automation scripts into repo `scripts/` when the repo does not already provide safe equivalents:
   - `sync-index.mjs`
   - `lint-dossiers.mjs`
   - `coverage-audit.mjs`
   - `dependency-graph.mjs`
   - `debt-audit.mjs`
   - Copy them from this skill's `scripts/` directory.
   - If the repo already has an equivalent script and safe normalization is not obvious, preserve it and report the divergence instead of overwriting blindly.
8. Create or normalize `docs/ssot/index.md`.
   - Prefer `node scripts/sync-index.mjs` after `docs/features/` exists.
   - If scripts are unavailable, create the index from [references/SSOT_INDEX_TEMPLATE.md](references/SSOT_INDEX_TEMPLATE.md).
   - If an existing index has custom content that cannot be preserved by safe block-level normalization, ask the user before replacing it.
9. Create or normalize `docs/backlog/feature-candidates.md` from [references/FEATURE_CANDIDATES_TEMPLATE.md](references/FEATURE_CANDIDATES_TEMPLATE.md).
10. Create or update repo-root `AGENTS.md` using [references/REPO_AGENTS_TEMPLATE.md](references/REPO_AGENTS_TEMPLATE.md).
   - If `AGENTS.md` already exists, preserve unrelated repo instructions and add or update only the dossier-protocol rules.
   - If bootstrap preserved repo-specific script names or paths instead of the canonical `scripts/*.mjs` filenames, rewrite the command lines in `AGENTS.md` to the actual repo commands instead of forcing the template defaults.
   - If safe merge is not obvious, ask the user before rewriting it.
11. Read the architecture once more and extract a short list of day-1 implementation invariants that later modes must preserve.

- Typical examples: canonical stack, runtime substrate, deployment boundary, required verification paths, or other repo-wide engineering contracts.
- If these invariants are already captured in architecture or ADRs, surface them in the report instead of duplicating them.
- If they are clear in architecture but not yet easy to find, recommend the smallest durable home for them (for example architecture cross-reference, repo-root `AGENTS.md`, or repo-level ADR).

12. Report what was created, moved, renamed, left untouched, and which implementation invariants future work should honor.

Rules:

- `init` is a one-time repository bootstrap step.
- `init` must not create placeholder feature dossiers. The first real feature later uses `feature-intake`.

Review checklist:

- [ ] If no architecture existed, the command stopped cleanly with an explicit message and without half-created bootstrap artifacts.
- [ ] If `init` proceeded, `docs/architecture/system.md`, `docs/features/`, `docs/backlog/feature-candidates.md`, and `docs/ssot/index.md` exist and follow the expected bootstrap structure.
- [ ] Canonical dossier automation scripts were provisioned into repo `scripts/` when safe, or any existing-script divergence was surfaced explicitly instead of being overwritten blindly.
- [ ] If the canonical architecture was chosen from non-canonical files, the choice was obvious; otherwise the user was asked instead of the agent guessing.
- [ ] Repo-root `AGENTS.md` includes dossier-protocol rules and preserves unrelated repo instructions.
- [ ] No placeholder `docs/features/F-*.md` dossiers were created.
- [ ] Existing custom index or `AGENTS.md` content was not overwritten without a safe merge or explicit user confirmation.
- [ ] The final report accurately distinguishes created, moved, renamed, normalized, and untouched artifacts.
- [ ] The final report surfaces repo-wide implementation invariants grounded in architecture/ADRs and does not invent unsupported ones.

### `feature-discovery`

Read architecture and refresh a simple candidate feature backlog.

Output:

- `docs/backlog/feature-candidates.md` with temporary `CF-*` entries.
- Each entry should be coarse, backlog-sized, and clearly tied either to a user-visible capability or to an architecture-mandated platform seam.
- When useful, include a short non-SSoT coverage note (`Backbone`, `Coverage watchpoints`, `Open questions`) so missing owners remain visible.

Steps:

1. Read canonical architecture from `docs/architecture/system.md`.
2. Read existing `docs/backlog/feature-candidates.md` if present.
3. Read existing dossiers and `docs/ssot/index.md` to avoid duplicating already-intaken features.
4. Extract a short list of candidate features from architecture.
   - Prefer user-visible workflows and bounded capabilities.
   - Also include platform or backbone seams when architecture treats them as explicit prerequisites for the runtime or for later capabilities.
5. Check coverage of major architecture areas.
   - Make sure the backlog shows an owner or watchpoint for each important runtime, platform, data, model, security, and observability seam that the architecture elevates.
6. Create or update `docs/backlog/feature-candidates.md` using [references/FEATURE_CANDIDATES_TEMPLATE.md](references/FEATURE_CANDIDATES_TEMPLATE.md).
   - Order candidates so prerequisites and backbone seams are visible early.
   - Add a small coverage note when it helps future intake work understand what is still missing.
7. If architecture is too vague to separate features confidently, ask the user instead of inventing a backlog.

Rules:

- `feature-discovery` creates or updates candidate backlog entries, not dossiers.
- Do not put acceptance criteria text in the backlog file.
- Use `CF-001`, `CF-002`, ... for candidate IDs.
- `confirmed` is a candidate status, not a separate command.
- Keep candidate status current:
  - `candidate` when first discovered
  - `confirmed` when the user decides it should become a dossier
  - `intaken` when `feature-intake` creates the dossier
  - `discarded` when the user decides not to pursue it

Review checklist:

- [ ] The backlog was refreshed from architecture, or architecture ambiguity was surfaced explicitly instead of inventing speculative candidates.
- [ ] If the backlog was updated, `docs/backlog/feature-candidates.md` uses only `CF-*` IDs with valid statuses.
- [ ] Each candidate is backlog-sized and traceable to a user-visible capability or architecture-mandated platform seam.
- [ ] Existing real dossiers were not duplicated as new candidates.
- [ ] The backlog does not contain acceptance criteria text or dossier-only detail.
- [ ] Candidate ordering makes prerequisites and backbone seams visible early.
- [ ] Major architecture seams that still lack an owner are called out via candidate entries or a coverage note.
- [ ] `docs/ssot/index.md` still lists only real dossiers, not `CF-*` entries.

### `feature-intake`

Create a new Feature Dossier and register it in the global index.

Steps:

1. Determine next available `F-XXXX` (scan existing dossiers).
2. Re-read the architecture and backlog context for the selected candidate and identify the current phase baseline for the feature.
   - Capture which runtime, deployment, data, model, or security seams the feature assumes are already delivered.
   - Identify which existing `F-XXXX` dossiers this feature depends on today.
3. Create `docs/features/F-XXXX-<slug>.md` from the dossier template:
   - Fill **Context**, **Scope**, **Constraints**, and a draft **Acceptance Criteria** list.
   - Fill frontmatter: id, title, status=`proposed`, area, impacts, depends_on.
   - Use `depends_on` for real delivered prerequisites, not for hoped-for future seams.
   - Record the current phase baseline and implementation assumptions in Context or Constraints so later implementation starts from the right substrate.
4. If intake reveals a missing prerequisite seam that does not yet have a clear backlog owner, refresh the candidate backlog first so the dependency becomes visible before coding starts.
5. If this feature came from `docs/backlog/feature-candidates.md`, update the matching `CF-*` entry with status `intaken` and add the dossier link.
6. Run `scripts/sync-index.mjs` (or update index manually if scripts are unavailable).
7. If the repo provides `coverage-audit`, interpret it according to the repo's severity policy instead of assuming every early dossier must fail immediately.
   - A status-aware audit may report missing AC references as informational for `proposed` / `shaped` dossiers while still blocking `planned` / `in_progress` / `done`.
   - Do not "fix" an intake by inventing fake test references or by weakening later-stage enforcement.

Review checklist:

- [ ] The new dossier uses the next free `F-XXXX` and a stable, readable slug.
- [ ] Frontmatter is valid and complete enough for lint: `id`, `title`, `status`, `owners`, `area`, `depends_on`, `impacts`, `created`, and `updated`.
- [ ] `status` is `proposed`, and acceptance criteria IDs are unique, testable, and match the dossier numeric ID.
- [ ] Context, scope, constraints, and intake assumptions are grounded in architecture/backlog rather than invented locally.
- [ ] `depends_on` contains only real delivered prerequisites, and the phase baseline/substrate assumptions are captured in the dossier.
- [ ] If intake exposed a missing prerequisite seam, backlog ownership was refreshed before implementation starts.
- [ ] The matching `CF-*` entry is marked `intaken` and links to the dossier.
- [ ] `docs/ssot/index.md` contains exactly one row for the new dossier and still lists only real dossiers.
- [ ] No acceptance criteria text was copied into the backlog or index.
- [ ] If the repo's coverage audit is status-aware, the intake result reports informational vs blocking gaps exactly as the tool defines them.

### `spec-compact`

Evolve the same dossier into a minimal implementable spec (still one file).

Steps:

1. Refine acceptance criteria (AC) to be testable.
2. Add compact design:
   - API surface (routes, DTOs)
   - runtime and deployment surface (entrypoints, services, startup assumptions, env contract) when relevant
   - data model changes
   - edge cases + failure modes
   - verification surface (unit, integration, smoke, operator/manual) when relevant
3. Check the feature against architecture and any repo-level ADRs that already constrain stack, runtime, or deployment shape.
4. Add Definition of Done (DoD) and initial coverage map plan.
   - Include non-test verification when runtime/process/container behavior matters.
5. If an architectural fork exists, run `adr-log`.
6. If the spec introduces or depends on a cross-cutting decision that multiple future features will inherit, promote that decision to a repo-level ADR or architecture update instead of leaving it implicit.

Review checklist:

- [ ] The same dossier was evolved in place; no shadow SSoT was created elsewhere.
- [ ] Acceptance criteria are specific enough to verify, and stable IDs were preserved unless a documented change required otherwise.
- [ ] The design covers API surface, runtime/deployment surface when relevant, data model changes, edge/failure modes, and verification surface.
- [ ] The spec aligns with canonical architecture and repo-level ADRs, or any fork is explicitly resolved.
- [ ] Definition of Done and an initial coverage map plan exist; non-test verification is included when runtime/process/container behavior matters.
- [ ] Any feature-local fork is captured in an ADR block, and any cross-cutting decision is promoted to repo-level ADR or architecture instead of staying implicit.
- [ ] Dossier status is consistent with spec maturity (`shaped` or a justified alternative).
- [ ] New cross-cutting assumptions were not left hidden inside a single dossier.

### `plan-slice`

Add an incremental slicing plan inside the dossier.

Steps:

1. Create 2–6 slices in delivery order.
   - Prefer substrate/alignment slices first, user-visible behavior next, expansion/polish last.
2. For each slice, state what it delivers and which AC IDs it covers.
3. For each slice, list the verification artifact that proves it (`unit`, `integration`, `smoke`, `manual`, or similar).
4. For each slice, list tasks that reference AC IDs or Slice IDs (no duplicate AC text).
5. If the feature requires realignment of an already-delivered dossier, make that realignment an explicit slice or linked task.
6. Produce suggested issue titles (optional) that link back to dossier anchors.

Review checklist:

- [ ] The dossier contains 2–6 slices in delivery order.
- [ ] Each slice states a concrete deliverable and cites the AC IDs it covers.
- [ ] Each slice names the verification artifact(s) that prove it.
- [ ] Tasks reference Slice IDs or AC IDs and do not restate acceptance criteria text.
- [ ] Any required realignment of previously delivered work is explicit as a slice or linked task.
- [ ] Optional issue titles, if present, point back to dossier anchors and match the slice/task plan.
- [ ] Dossier status is consistent with planning maturity (`planned` or a justified alternative).

### `implementation`

Implement the planned feature while keeping dossier, architecture, and delivered substrate aligned.

Steps:

1. Start from `docs/ssot/index.md`, then open the target dossier, dependent dossiers, relevant architecture sections, and any repo-level ADRs that shape the work.
2. Deliver on the repository’s canonical stack, runtime, and deployment path from the first commit.
   - Treat already-fixed repo engineering contracts as the default path for code, tests, and runtime execution.
3. Build verification alongside the implementation.
   - Add AC-linked tests.
   - Add process, startup, or container smoke verification when the feature changes runtime or deployment behavior.
4. When implementation reveals a missing prerequisite seam or a cross-cutting invariant, make it explicit immediately.
   - Refresh backlog ownership, add or realign the relevant dossier, or capture a repo-level ADR, then continue on the clarified path.
5. Update the target dossier in the same workstream.
   - Progress and links
   - Coverage map
   - Change log when behavior or assumptions changed
6. Run project checks plus `scripts/lint-dossiers.mjs`, `scripts/coverage-audit.mjs`, `scripts/debt-audit.mjs`, and `scripts/sync-index.mjs`.

Rules:

- Favor durable alignment that matches the architecture and repo contracts from day 1.
- Use `change-proposal` when newly delivered substrate changes the assumptions of an existing dossier.

Review checklist:

- [ ] Code changes follow the canonical stack, runtime, and deployment path defined by architecture/ADRs; no side-path was introduced silently.
- [ ] Delivered behavior maps back to planned slices/ACs or to an explicit approved change.
- [ ] Verification was added alongside code: AC-linked tests, plus smoke/startup/container checks when runtime or deployment behavior changed.
- [ ] Newly discovered prerequisites or cross-cutting invariants were externalized promptly through backlog refresh, dossier realignment, or ADR work.
- [ ] The target dossier was updated in the same workstream: progress, links, coverage map, and change log when behavior or assumptions changed.
- [ ] Dossier status is consistent with delivery maturity (`in_progress`, `done`, or a justified alternative).
- [ ] Project checks, `lint-dossiers`, `coverage-audit`, `debt-audit`, and `sync-index` were run on the final state and passed.
- [ ] If delivered substrate changed assumptions of an existing dossier, `change-proposal` or equivalent dossier realignment was applied.
- [ ] Final repo state keeps implementation, tests, dossiers, and index mutually consistent.

### `adr-log`

Record an architectural decision as an ADR block (default) or separate ADR file (rare).

Rules:

- Use ADR blocks **inside the dossier** for feature-local decisions.
- Create `docs/adr/ADR-YYYY-MM-DD-<slug>.md` only for cross-cutting decisions.

Template: [references/ADR_BLOCK_TEMPLATE.md](references/ADR_BLOCK_TEMPLATE.md)

Review checklist:

- [ ] The decision was recorded in the right place: dossier ADR block for feature-local, `docs/adr/ADR-YYYY-MM-DD-<slug>.md` only for cross-cutting work.
- [ ] The ADR has a stable ID, title, status, date, context, decision, alternatives, and consequences.
- [ ] The ADR captures a real architectural fork or durable constraint, not routine implementation trivia.
- [ ] Consequences and follow-ups are reflected in the affected dossier, architecture, or backlog where needed.
- [ ] The ADR is discoverable from the relevant dossier/index/architecture path, and it does not duplicate an already-settled decision.

### `dependency-check`

Validate and visualize dependencies.

Steps:

1. Read `depends_on` and `impacts` from dossier frontmatter.
2. Validate that all referenced `F-XXXX` exist.
3. Generate a Mermaid dependency graph (stdout) via `scripts/dependency-graph.mjs`.
4. Add/update the graph section in `docs/ssot/index.md`.

Review checklist:

- [ ] Every `depends_on` entry is formatted as `F-XXXX` and points to an existing dossier.
- [ ] The generated Mermaid graph matches current dossier frontmatter and includes all current dossiers.
- [ ] `docs/ssot/index.md` contains the refreshed dependency graph with no stale edges or missing nodes.
- [ ] Any invalid or missing dependency was reported explicitly instead of being silently omitted.
- [ ] The updated index remains metadata/link oriented and does not restate requirements text.

### `coverage-audit`

Check that every AC is covered by tests.

Contract:

- Each acceptance criterion ID must appear in tests (either in the test name or in a `// Covers: AC-...` comment).
- Some repos implement status-aware severity on top of this contract.
  - When they do, report the status policy exactly as the tool defines it.
  - Typical policy: `proposed` / `shaped` gaps may be informational, while `planned` / `in_progress` / `done` remain blocking.

Run: `node scripts/coverage-audit.mjs --dossier docs/features/F-XXXX-*.md`
Run: `node scripts/coverage-audit.mjs --changed-only --base origin/main`

Review checklist:

- [ ] The audit ran against the intended scope (`--dossier`, all dossiers, or `--changed-only` with the intended base).
- [ ] Every AC in the audited dossier(s) was checked against actual test files, and any missing IDs are listed explicitly.
- [ ] Orphan AC references in tests were surfaced when present.
- [ ] The reported pass/fail state matches the actual findings; no dossier with missing AC coverage is reported as passing.
- [ ] If the repo uses status-aware severity, the report clearly distinguishes informational gaps from blocking gaps and does not silently downgrade later-stage enforcement.
- [ ] If the audit passed, dossier coverage rows and test references are not obviously stale or contradictory.

### `debt-audit` (recommended)

Check for explicit unresolved debt markers.

Contract:

- This is a narrow automation guardrail for `TODO` / `FIXME` / `HACK` / `XXX` markers.
- It augments, but does not replace, the manual debt review and dependency/seam re-check.

Run: `node scripts/debt-audit.mjs`
Run: `node scripts/debt-audit.mjs --changed-only --base origin/main`

Review checklist:

- [ ] The audit ran against the intended scope (full repo, explicit paths, or `--changed-only` with the intended base).
- [ ] The reported pass/fail state matches the tool output; findings were not ignored or downplayed.
- [ ] Any findings were either removed immediately or surfaced as blocking until a canonical follow-up artifact exists.
- [ ] The final claim does not treat `debt-audit` as a substitute for the manual technical-debt review gate.

### `change-proposal`

Apply requirement changes safely.

Steps:

1. Add an entry to **Change log** (version bump + reason).
2. Modify only the AC list (SSoT).
3. Update slices/tasks/coverage map references.
4. Run `scripts/lint-dossiers.mjs` + `scripts/coverage-audit.mjs` + `scripts/debt-audit.mjs`.
5. Run `scripts/sync-index.mjs`.

Review checklist:

- [ ] The change log contains a new version/date/reason entry for this proposal.
- [ ] Requirement edits were applied in the dossier AC list only; no shadow requirement text was created elsewhere.
- [ ] Slices, tasks, and the coverage map were updated to match the changed AC set and references.
- [ ] Stale AC IDs were removed or renamed consistently across dossier text, tests, and linked tasks.
- [ ] `lint-dossiers`, `coverage-audit`, `debt-audit`, and `sync-index` were run after the change.
- [ ] If the change altered cross-cutting assumptions, the relevant ADR or architecture doc was updated or explicitly flagged.

### `sync-index`

Regenerate/refresh `docs/ssot/index.md` from dossier frontmatter.

Run: `node scripts/sync-index.mjs`

Review checklist:

- [ ] `docs/ssot/index.md` was regenerated from current dossier frontmatter rather than hand-maintained requirements text.
- [ ] The features table has one row per dossier, zero `CF-*` entries, and metadata that matches frontmatter.
- [ ] The dependency graph matches current dossiers and `depends_on` edges.
- [ ] Existing non-generated/custom sections were preserved, and generated blocks were refreshed cleanly.
- [ ] The last-sync marker changed, and no stale dossier path/title/status remains.

### `lint-dossiers` (recommended)

Validate structure, metadata, links, and duplication constraints.

Run: `node scripts/lint-dossiers.mjs`

Review checklist:

- [ ] Lint was run against the current repo state and its findings were captured faithfully.
- [ ] Any reported errors were fixed before claiming success, or were explicitly surfaced as unresolved blocking issues.
- [ ] Frontmatter, AC IDs, coverage map rows, dependency references, and index consistency were actually checked.
- [ ] If the index has a generated Red flags block, it was updated without clobbering other content.
- [ ] The final claim (`clean` vs `has findings`) matches the tool exit status and output.

## Examples

- Single Feature Dossier example:
  [references/EXAMPLE_FEATURE_DOSSIER.md](references/EXAMPLE_FEATURE_DOSSIER.md)
- Repository-level example:
  [assets/example-repo/AGENTS.md](assets/example-repo/AGENTS.md)
  with companion docs in `assets/example-repo/docs/*` and test stubs in
  `assets/example-repo/src/*`.

## Migration from sdd-engineer

See: [references/MIGRATION_FROM_SDD_ENGINEER.md](references/MIGRATION_FROM_SDD_ENGINEER.md)
