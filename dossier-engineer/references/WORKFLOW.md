# 1F1D Workflow (operational guide)

## Status lifecycle
`proposed` → `shaped` → `planned` → `in_progress` → `done` (or `parked`)

Recommended meanings:
- **proposed:** intake created; AC draft exists; not committed to build yet.
- **shaped:** risks resolved; compact design chosen; ADR blocks added if needed.
- **planned:** slices and tasks ready; can start implementation.
- **in_progress:** at least one PR open.
- **done:** all AC covered by tests; links to PRs; runbook updated if needed.
- **parked:** intentionally paused; keep context and rationale.

## Minimal PR contract
If a PR references `F-XXXX`, it must:
- update `docs/features/F-XXXX-*.md` (Progress, Coverage map, Links),
- keep requirements only in the dossier (no duplication),
- include at least one test referencing AC IDs (when applicable).

## How to keep dossiers small
If a dossier exceeds ~800 lines or includes many unrelated decisions, split into sub-features:
- `F-0123-auth-reset`
- `F-0124-auth-reset-admin-tools`
and link them via `depends_on` and the index.

## Recommended automation
- Run `node scripts/sync-index.mjs` on CI or pre-commit.
- Run `node scripts/lint-dossiers.mjs` on CI (fail the build on errors).
- Run `node scripts/coverage-audit.mjs --changed-only --base origin/main` on CI for PRs.
- If chaining multiple script commands in one shell, use `set -e` or check each exit code explicitly so a later success does not mask an earlier failure.
