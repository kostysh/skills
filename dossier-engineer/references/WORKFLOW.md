# 1F1D Workflow (operational guide)

## Repository bootstrap (`init`)
Use `init` once per repository, after a repo-level architecture document already exists.

Expected output:
- Canonical architecture doc at `docs/architecture/system.md`
- Global index at `docs/ssot/index.md`
- Candidate backlog at `docs/backlog/feature-candidates.md`
- Feature dossier directory at `docs/features/`
- Repo-local dossier automation scripts in `scripts/` when the repo does not already provide safe equivalents
- Repo-root `AGENTS.md` with dossier-protocol rules for future agents

Bootstrap rules:
- Do not start dossier protocol before architecture exists.
- Do not create placeholder feature dossiers during bootstrap.
- It is fine to create an empty candidate backlog file during bootstrap.
- The first real feature starts with `feature-intake`, not with `init`.
- Provision the canonical automation scripts from this skill into repo `scripts/` when safe; do not overwrite custom equivalents blindly.
- If bootstrap preserves repo-specific equivalents, rewrite the generated `AGENTS.md` command lines to the actual repo commands instead of forcing canonical filenames.
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

## No-technical-debt policy

This workflow assumes no technical debt by default.

Here, a "step" means:

- a completed dossier command such as `feature-intake`, `spec-compact`, `plan-slice`, `implementation`, or `change-proposal`;
- or a user-approved implementation increment when work is intentionally split.

Before a step can be considered complete:

1. Run the step's local checks.
2. Perform an explicit debt review of the changed scope.
3. When repo-local dossier scripts exist, run `node scripts/debt-audit.mjs --changed-only` as a narrow guardrail.
4. Re-check any detected debt against dependencies and adjacent seams:
   - dependent or depended-on dossiers,
   - `docs/architecture/system.md`,
   - relevant repo-level ADRs,
   - `docs/ssot/index.md` and `docs/backlog/feature-candidates.md` when ownership may shift.
5. Resolve every item by one of these paths:
   - eliminate it immediately;
   - realign dossier / backlog / ADR artifacts;
   - record a user-approved follow-up in the canonical artifact for that debt class.
6. Then run the independent review gate.

Canonical artifacts for follow-up:

- Feature Dossier for debt belonging to an intaken feature
- Candidate backlog for a newly exposed but not-yet-intaken seam
- Repo-level ADR for cross-cutting debt

Not sufficient:

- chat-only notes
- unlinked TODO comments
- "known issue" text without owner and dependency links

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
- During `init`, provision `sync-index.mjs`, `lint-dossiers.mjs`, `coverage-audit.mjs`, `dependency-graph.mjs`, and `debt-audit.mjs` from this skill into repo `scripts/` when the repo does not already have safe equivalents.
- Run `node scripts/sync-index.mjs` on CI or pre-commit.
- Run `node scripts/lint-dossiers.mjs` on CI (fail the build on errors).
- Run `node scripts/coverage-audit.mjs --changed-only --base origin/main` on CI for PRs.
- Run `node scripts/debt-audit.mjs --changed-only --base origin/main` before closing any mutating step or on CI when the repo wants a narrow debt-marker guardrail.
- If chaining multiple script commands in one shell, use `set -e` or check each exit code explicitly so a later success does not mask an earlier failure.
