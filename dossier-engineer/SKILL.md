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
- **Automation** (lint + coverage audit + dependency graph) replaces “more documents”.

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

## Commands / modes

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
7. Create or normalize `docs/ssot/index.md`.
   - Prefer `node scripts/sync-index.mjs` after `docs/features/` exists.
   - If scripts are unavailable, create the index from [references/SSOT_INDEX_TEMPLATE.md](references/SSOT_INDEX_TEMPLATE.md).
   - If an existing index has custom content that cannot be preserved by safe block-level normalization, ask the user before replacing it.
8. Create or normalize `docs/backlog/feature-candidates.md` from [references/FEATURE_CANDIDATES_TEMPLATE.md](references/FEATURE_CANDIDATES_TEMPLATE.md).
9. Create or update repo-root `AGENTS.md` using [references/REPO_AGENTS_TEMPLATE.md](references/REPO_AGENTS_TEMPLATE.md).
   - If `AGENTS.md` already exists, preserve unrelated repo instructions and add or update only the dossier-protocol rules.
   - If safe merge is not obvious, ask the user before rewriting it.
10. Report what was created, moved, renamed, or left untouched.

Rules:

- `init` is a one-time repository bootstrap step.
- `init` must not create placeholder feature dossiers. The first real feature later uses `feature-intake`.

### `feature-discovery`

Read architecture and refresh a simple candidate feature backlog.

Output:

- `docs/backlog/feature-candidates.md` with temporary `CF-*` entries.
- Each entry should be coarse, user-visible, and backlog-sized.

Steps:

1. Read canonical architecture from `docs/architecture/system.md`.
2. Read existing `docs/backlog/feature-candidates.md` if present.
3. Read existing dossiers and `docs/ssot/index.md` to avoid duplicating already-intaken features.
4. Extract a short list of candidate features from architecture.
   - Prefer user-visible workflows or bounded capabilities.
   - Avoid infrastructure layers, modules, and speculative sub-features unless architecture clearly separates them.
5. Create or update `docs/backlog/feature-candidates.md` using [references/FEATURE_CANDIDATES_TEMPLATE.md](references/FEATURE_CANDIDATES_TEMPLATE.md).
6. If architecture is too vague to separate features confidently, ask the user instead of inventing a backlog.

Rules:

- `feature-discovery` creates or updates candidate backlog entries, not dossiers.
- Do not put acceptance criteria text in the backlog file.
- Use `CF-001`, `CF-002`, ... for candidate IDs.
- Keep candidate status current:
  - `candidate` when first discovered
  - `confirmed` when the user decides it should become a dossier
  - `intaken` when `feature-intake` creates the dossier
  - `discarded` when the user decides not to pursue it

### `feature-intake`

Create a new Feature Dossier and register it in the global index.

Steps:

1. Determine next available `F-XXXX` (scan existing dossiers).
2. Create `docs/features/F-XXXX-<slug>.md` from the dossier template:
   - Fill only **Context**, **Scope**, and a draft **Acceptance Criteria** list.
   - Fill frontmatter: id, title, status=`proposed`, area, impacts, depends_on.
3. If this feature came from `docs/backlog/feature-candidates.md`, update the matching `CF-*` entry with status `intaken` and add the dossier link.
4. Run `scripts/sync-index.mjs` (or update index manually if scripts are unavailable).

### `spec-compact`

Evolve the same dossier into a minimal implementable spec (still one file).

Steps:

1. Refine acceptance criteria (AC) to be testable.
2. Add compact design:
   - API surface (routes, DTOs)
   - data model changes
   - edge cases + failure modes
3. Add Definition of Done (DoD) and initial coverage map plan.
4. If an architectural fork exists, run `adr-log`.

### `plan-slice`

Add an incremental slicing plan inside the dossier.

Steps:

1. Create 2–6 slices (each delivers a testable increment).
2. For each slice, list tasks that reference AC IDs (no duplicate AC text).
3. Produce suggested issue titles (optional) that link back to dossier anchors.

### `adr-log`

Record an architectural decision as an ADR block (default) or separate ADR file (rare).

Rules:

- Use ADR blocks **inside the dossier** for feature-local decisions.
- Create `docs/adr/ADR-YYYY-MM-DD-<slug>.md` only for cross-cutting decisions.

Template: [references/ADR_BLOCK_TEMPLATE.md](references/ADR_BLOCK_TEMPLATE.md)

### `dependency-check`

Validate and visualize dependencies.

Steps:

1. Read `depends_on` and `impacts` from dossier frontmatter.
2. Validate that all referenced `F-XXXX` exist.
3. Generate a Mermaid dependency graph (stdout) via `scripts/dependency-graph.mjs`.
4. Add/update the graph section in `docs/ssot/index.md`.

### `coverage-audit`

Check that every AC is covered by tests.

Contract:

- Each acceptance criterion ID must appear in tests (either in the test name or in a `// Covers: AC-...` comment).

Run: `node scripts/coverage-audit.mjs --dossier docs/features/F-XXXX-*.md`
Run: `node scripts/coverage-audit.mjs --changed-only --base origin/main`

### `change-proposal`

Apply requirement changes safely.

Steps:

1. Add an entry to **Change log** (version bump + reason).
2. Modify only the AC list (SSoT).
3. Update slices/tasks/coverage map references.
4. Run `scripts/lint-dossiers.mjs` + `scripts/coverage-audit.mjs`.
5. Run `scripts/sync-index.mjs`.

### `sync-index`

Regenerate/refresh `docs/ssot/index.md` from dossier frontmatter.

Run: `node scripts/sync-index.mjs`

### `lint-dossiers` (recommended)

Validate structure, metadata, links, and duplication constraints.

Run: `node scripts/lint-dossiers.mjs`

## Examples

- Single Feature Dossier example:
  [references/EXAMPLE_FEATURE_DOSSIER.md](references/EXAMPLE_FEATURE_DOSSIER.md)
- Repository-level example:
  [assets/example-repo/AGENTS.md](assets/example-repo/AGENTS.md)
  with companion docs in `assets/example-repo/docs/*` and test stubs in
  `assets/example-repo/src/*`.

## Migration from sdd-engineer

See: [references/MIGRATION_FROM_SDD_ENGINEER.md](references/MIGRATION_FROM_SDD_ENGINEER.md)
