# 1F1D Workflow (operational guide)

## Repository bootstrap (`init`)
Use `init` once per repository, after a repo-level architecture document already exists.

Expected output:
- Canonical architecture doc at `docs/architecture/system.md`
- Global index at `docs/ssot/index.md`
- Candidate backlog at `docs/backlog/feature-candidates.md`
- Feature dossier directory at `docs/features/`
- Repo-root `AGENTS.md` with dossier-protocol rules for future agents

Bootstrap rules:
- Do not start dossier protocol before architecture exists.
- Do not create placeholder feature dossiers during bootstrap.
- It is fine to create an empty candidate backlog file during bootstrap.
- The first real feature starts with `feature-intake`, not with `init`.
- Keep bootstrap deterministic: if architecture selection or safe normalization of `AGENTS.md` / `docs/ssot/index.md` is ambiguous, ask the user instead of guessing.

## Candidate backlog (`feature-discovery`)
Use `feature-discovery` to translate architecture into a simple backlog in `docs/backlog/feature-candidates.md`.

Rules:
- Candidate backlog entries use temporary `CF-*` IDs.
- Candidate backlog is non-SSoT and must not contain acceptance criteria text.
- `feature-intake` promotes one candidate into a real dossier and links `CF-* -> F-*`.
- `docs/ssot/index.md` must continue to list only real dossiers.
- Keep candidate statuses current: `candidate -> confirmed -> intaken`, or `discarded` if not pursued.

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
