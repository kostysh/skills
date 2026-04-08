# Dossier Workflow (operational guide)

## Role in the cross-skill process

`dossier-engineer` is the downstream workflow layer.

It does **not** extract backlog from architecture and does **not** maintain a local candidate backlog.

Use `backlog-engineer` first to:

- create the backlog graph from architecture, ADRs, and technical decisions;
- choose the next backlog work item;
- confirm backlog readiness and blockers;
- actualize backlog state after dossier-side lifecycle changes.

Use `dossier-engineer` after work has already been selected.

## Workflow stage: repository bootstrap (`init`)

Use `init` once per repository, after a repo-level architecture document already exists.

Expected output:

- Canonical architecture doc at `docs/architecture/system.md`
- Global index at `docs/ssot/index.md`
- Feature dossier directory at `docs/features/`
- Process artifact directories under `.dossier/`
- Repo-local dossier automation scripts in `scripts/`
- Repo-root `AGENTS.md` with dossier rules and repo overlays

## CLI command: `feature-intake`

Use `feature-intake` only after `backlog-engineer` has already selected the work item.

Rules:

- `feature-intake` creates a real dossier for selected backlog work.
- The selected work remains owned by the backlog graph; the dossier does not replace backlog state.
- Intake must preserve one durable backlog handoff:
  - backlog item key
  - backlog delivery state at intake
  - source traceability
  - known blockers / dependencies at intake time
- If intake discovers new blockers, missing dependencies, missing context, or lifecycle-changing facts, return to `backlog-engineer` and actualize backlog state before continuing.
- `index-refresh` is the canonical full refresh path after intake. Use `sync-index` only when you intentionally want table/graph refresh without a Red flags update.
- `docs/ssot/index.md` lists only real dossiers.

## State dimensions

Keep these separate:

- Dossier maturity (`proposed|shaped|planned|in_progress|done|parked`)
- Coverage enforcement (`coverage_gate: deferred|strict`)
- Review freshness (`missing|pass|fail|stale`)
- Step closure (`process_complete: true|false` in `.dossier/steps/*`)
- Commit completeness (`dirty|clean-unreviewed|clean-reviewed|clean-but-stale-review`)

Backlog lifecycle state remains outside this skill and belongs to `backlog-engineer`.

## Default dossier flow

`selected backlog work -> feature-intake -> spec-compact -> plan-slice -> implementation`

Each mutating step then closes through:

`dossier-verify -> review-artifact -> dossier-step-close`

Requirement changes on mature work use:

`change-proposal -> contract-drift-audit -> explicit follow-up decision`

## Backlog actualization rule

Return to `backlog-engineer` when dossier-side work changes backlog truth:

- shaping or specification makes the work `specified`;
- planning makes the work `planned`;
- implementation and closure make the work `implemented`;
- new blockers, dependencies, clarified context, or cross-cutting decisions must be reflected in backlog state.

## CLI command: `next-step`

`next-step` is dossier-local only.

It answers:

- what is the next dossier workflow step for the currently selected work;
- which local blocker or stale artifact is stopping progress.

It does **not** answer:

- which backlog item to pick next;
- whether backlog gaps or attention items should be cleared first;
- whether another task has higher project priority.

Those questions belong to `backlog-engineer`.

Important:

- if multiple dossiers are active, pass `--dossier` explicitly;
- `next-step` output is dossier-local and does not replace repo overlay ingestion before acting.

## No-technical-debt policy

Before a mutating step can be considered complete:

1. Run the step’s local checks.
2. Perform explicit debt review of the changed scope.
3. Run `node scripts/dossier.mjs debt-audit --changed-only` when available.
4. Re-check dependencies and adjacent seams.
5. Resolve or explicitly record every debt item in a canonical artifact.
6. Run `node scripts/dossier.mjs dossier-verify ...`.
7. Run independent review with a separate reviewer agent whenever the `spawn_agent` tool exists. If session policy requires explicit user authorization before spawning, request it before continuing. Do not silently downgrade to self-review or `emulated-independent-review`; if a separate reviewer agent still cannot be used, leave the step blocked unless the user explicitly approves degraded review mode. Then persist the verdict with `node scripts/dossier.mjs review-artifact ...`.
8. Close the step with `node scripts/dossier.mjs dossier-step-close ...`.

Notes:

- `debt-audit` stays marker-only. It does not prove implementation completeness.
- After `implementation`, review must explicitly cover completeness against dossier/slices/approved changes, code review, and security review.

## Minimal PR contract

If a PR references `F-XXXX`, it must:

- update `docs/features/F-XXXX-*.md`;
- keep requirements only in the dossier;
- include AC-linked verification when applicable;
- leave a truthful process state (`Process-complete: yes|no`) for the step it claims to finish;
- return to `backlog-engineer` if the change updates backlog lifecycle truth or reveals new blockers.

## Recommended automation

- `node scripts/dossier.mjs index-refresh`
- `node scripts/dossier.mjs lint-dossiers`
- `node scripts/dossier.mjs coverage-audit --changed-only --base origin/main`
- `node scripts/dossier.mjs debt-audit --changed-only --base origin/main`
- `node scripts/dossier.mjs dossier-verify --step implementation --changed-only --base origin/main`
- `node scripts/dossier.mjs next-step --dossier docs/features/F-0001-foo.md`
