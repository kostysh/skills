# 1F1D Workflow (operational guide)

## Repository bootstrap (`init`)
Use `init` once per repository, after a repo-level architecture document already exists.

Expected output:
- Canonical architecture doc at `docs/architecture/system.md`
- Global index at `docs/ssot/index.md`
- Candidate backlog at `docs/backlog/feature-candidates.md`
- Feature dossier directory at `docs/features/`
- Process artifact directories under `.dossier/`
- Repo-local dossier automation scripts in `scripts/`
- Repo-root `AGENTS.md` with dossier rules and repo overlays

## Candidate backlog (`feature-discovery`)
Use `feature-discovery` to translate architecture into a simple backlog in `docs/backlog/feature-candidates.md`.

Rules:
- Candidate entries use `CF-*` IDs.
- Candidate backlog is non-SSoT and must not contain acceptance criteria text.
- `feature-intake` promotes one candidate into a real dossier and links `CF-* -> F-*`.
- `docs/ssot/index.md` must continue to list only real dossiers.
- Keep candidate statuses current: `candidate -> confirmed -> intaken`, or `discarded`.

## State dimensions
Keep these separate:
- Candidate backlog state (`candidate|confirmed|intaken|discarded`)
- Dossier maturity (`proposed|shaped|planned|in_progress|done|parked`)
- Coverage enforcement (`coverage_gate: deferred|strict`)
- Review freshness (`missing|pass|fail|stale`)
- Step closure (`process_complete: true|false` in `.dossier/steps/*`)

## Default feature flow
`feature-intake -> spec-compact -> plan-slice -> implementation`

Each mutating step then closes through:
`dossier-verify -> review-artifact -> dossier-step-close`

Requirement changes on mature work use:
`change-proposal -> contract-drift-audit -> explicit follow-up decision`

## No-technical-debt policy
Before a mutating step can be considered complete:
1. Run the step’s local checks.
2. Perform explicit debt review of the changed scope.
3. Run `node scripts/debt-audit.mjs --changed-only` when available.
4. Re-check dependencies and adjacent seams.
5. Resolve or explicitly record every debt item in a canonical artifact.
6. Run `node scripts/dossier-verify.mjs ...`.
7. Run independent review with a separate reviewer agent whenever the `spawn_agent` tool exists. If session policy requires explicit user authorization before spawning, request it before continuing. Do not silently downgrade to self-review or `emulated-independent-review`; if a separate reviewer agent still cannot be used, leave the step blocked unless the user explicitly approves degraded review mode. Then persist the verdict with `node scripts/review-artifact.mjs ...`.
8. Close the step with `node scripts/dossier-step-close.mjs ...`.

Notes:
- `debt-audit` stays marker-only. It does not prove implementation completeness.
- After `implementation`, review must explicitly cover completeness against dossier/slices/approved changes, code review, and security review.

## Minimal PR contract
If a PR references `F-XXXX`, it must:
- update `docs/features/F-XXXX-*.md`;
- keep requirements only in the dossier;
- include AC-linked verification when applicable;
- leave a truthful process state (`Process-complete: yes|no`) for the step it claims to finish.

## Recommended automation
- `node scripts/index-refresh.mjs`
- `node scripts/lint-dossiers.mjs`
- `node scripts/coverage-audit.mjs --changed-only --base origin/main`
- `node scripts/debt-audit.mjs --changed-only --base origin/main`
- `node scripts/dossier-verify.mjs --step implementation --changed-only --base origin/main`
- `node scripts/next-step.mjs`
