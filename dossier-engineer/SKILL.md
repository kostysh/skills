---
name: dossier-engineer
description: Lightweight docs-as-code process for building large apps with AI coding agents. Uses one Feature Dossier per feature (SSoT) and one global index, with commands to intake, compact specs, plan slices, log ADRs, audit dependency/coverage, and sync/lint docs to prevent drift and duplication.
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
- `docs/architecture/system.md` — C4-lite architecture overview (recommended).
- `docs/adr/*.md` — optional; only for cross-cutting ADRs (otherwise keep ADR blocks inside the dossier).

Templates:

- Feature dossier template: [references/DOSSIER_TEMPLATE.md](references/DOSSIER_TEMPLATE.md)
- Index template: [references/SSOT_INDEX_TEMPLATE.md](references/SSOT_INDEX_TEMPLATE.md)
- ADR block template: [references/ADR_BLOCK_TEMPLATE.md](references/ADR_BLOCK_TEMPLATE.md)

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

## Commands / modes

### `feature-intake`

Create a new Feature Dossier and register it in the global index.

Steps:

1. Determine next available `F-XXXX` (scan existing dossiers).
2. Create `docs/features/F-XXXX-<slug>.md` from the dossier template:
   - Fill only **Context**, **Scope**, and a draft **Acceptance Criteria** list.
   - Fill frontmatter: id, title, status=`proposed`, area, impacts, depends_on.
3. Run `scripts/sync-index.mjs` (or update index manually if scripts are unavailable).

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
