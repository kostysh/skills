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

This is a workflow stage, not a shipped `dossier.mjs` subcommand.

Use `init` once per repository, after a repo-level architecture document already exists.

Expected output:

- Canonical architecture doc at `docs/architecture/system.md`
- Global index at `docs/ssot/index.md`
- Feature dossier directory at `docs/features/`
- Process artifact directories under `.dossier/`
- Repo-local dossier automation scripts or wrappers in `scripts/` only when bootstrap explicitly provisions them
- Repo-root `AGENTS.md` with dossier rules and repo overlays

## CLI command: `feature-intake`

Use `feature-intake` only after `backlog-engineer` has already selected the work item.

Use [feature-intake-logging.md](feature-intake-logging.md) when intake logging triggers fire.

Rules:

- `feature-intake` creates a real dossier for selected backlog work.
- The selected work remains owned by the backlog graph; the dossier does not replace backlog state.
- Intake must preserve one durable backlog handoff:
  - backlog item key
  - backlog delivery state at intake
  - source traceability
  - known blockers / dependencies at intake time
- That handoff block is for human/agent continuity and traceability; `next-step` does not parse dossier prose or use it as machine-readable state.
- If intake discovers new blockers, missing dependencies, missing context, or lifecycle-changing facts, return to `backlog-engineer` and actualize backlog state before continuing.
- `index-refresh` is the canonical full refresh path after intake. Use `sync-index` only when you intentionally want table/graph refresh without a Red flags update.
- If `feature-intake --json` returns `partial_success: true`, the dossier was created but `index-refresh` failed; fix that before continuing.
- If an intake logging trigger fired, the required intake log is part of truthful command closure; do not treat intake as process-complete until the log is current, `index-refresh` is settled, and required backlog actualization is done.
- Keep the same intake-log cycle for operator rerounds, `index-refresh` reruns, and backlog actualization follow-ups while the literal closure target is unchanged.
- Open a new intake-log cycle only when the closure target changes literally: another backlog item, another canonical dossier target, or a new independent intake attempt.
- Ordinary intake stays in the intake log only. If intake turns into a cross-skill migration, repair, or backlog-recovery episode, keep the intake log as the primary command record and open a companion session-level ops log for the cross-skill boundary.
- `docs/ssot/index.md` lists only real dossiers.

## State dimensions

Keep these separate:

- Dossier maturity (`proposed|shaped|planned|in_progress|done|parked`)
- Coverage enforcement (`coverage_gate: deferred|strict`)
- Review freshness (`missing|pass|fail|stale`)
- Step closure (`process_complete: true|false` in `.dossier/steps/*`)
- Worktree cleanliness (`dirty|clean`)

Commit SHA is trace metadata only. It may identify which repository state was visible during an event, but it is not a validity or freshness gate.

Backlog lifecycle state remains outside this skill and belongs to `backlog-engineer`.

## Default dossier flow

`selected backlog work -> feature-intake -> spec-compact -> plan-slice -> implementation`

`spec-compact`, `plan-slice`, and `implementation` are workflow stages, not shipped `dossier.mjs` subcommands.

Each mutating step then closes through:

`dossier-verify -> review-artifact -> dossier-step-close`

Requirement changes on mature work use:

`change-proposal -> contract-drift-audit -> explicit backlog impact verdict -> backlog actualization if needed`

Detailed workflow-stage steps:

- `init`: [workflow-stage-init.md](workflow-stage-init.md)
- `spec-compact`: [workflow-stage-spec-compact.md](workflow-stage-spec-compact.md)
- `plan-slice`: [workflow-stage-plan-slice.md](workflow-stage-plan-slice.md)
- `implementation`: [workflow-stage-implementation.md](workflow-stage-implementation.md)
- `dependency-check`: [workflow-stage-dependency-check.md](workflow-stage-dependency-check.md)
- `change-proposal`: [workflow-stage-change-proposal.md](workflow-stage-change-proposal.md)

## Session-level ops log

Use [session-ops-log.md](session-ops-log.md) when the meaningful work sits outside one clean dossier stage and crosses skill or stage boundaries.

Open `.dossier/ops/<session>/<episode>.md` when:

- the main effort is migration, repair, cross-skill handoff recovery, or audit-infrastructure stabilization;
- stage-local logs would not explain the episode without replaying raw trace;
- the episode materially touches more than one skill or temporarily exits the normal dossier-stage flow.

Update the ops log when skill ownership, touched artifacts, or outcome changes materially.
Keep stage-local facts in stage logs; the session-level ops log records only the cross-skill or cross-stage episode boundary, linked artifacts, operator interventions, and outcome.

## Spec and planning risk hardening

Use [spec-and-plan-risk-patterns.md](spec-and-plan-risk-patterns.md) when:

- `spec-compact` needs explicit operator/agent contract or safety semantics;
- unresolved design decisions need triage as `normative now`, `implementation freedom`, or `temporary assumption`;
- `plan-slice` must explicitly plan contract-risk cleanup, drift-guard work, or a real usage audit after implementation.

## Backlog actualization rule

Return to `backlog-engineer` when dossier-side work changes backlog truth:

- shaping or specification makes the work `specified`;
- planning makes the work `planned`;
- implementation and closure make the work `implemented`;
- new blockers, dependencies, clarified context, or cross-cutting decisions must be reflected in backlog state.

Rules:

- for truth-changing stages, backlog actualization is part of stage closure, not an optional follow-up;
- use `patch-item` when dossier work made lifecycle, blocker, dependency, or context facts explicit for already known backlog items;
- use scoped `refresh` first only when updated source documents may have changed source-derived backlog state;
- `refresh` alone does not actualize `delivery_state` or dossier-discovered blockers, dependencies, or context facts that require an explicit patch.

During `change-proposal`, determine one explicit dossier-side `backlog impact verdict` before closure:

- `no-op`
- `patch existing item`
- `source update`
- `new backlog item`

If the verdict is not `no-op`, backlog actualization is mandatory before stage closure.

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

- if more than one dossier exists in the repo, pass `--dossier` explicitly;
- `next-step` reads only structured dossier state and durable artifacts; CLI never interprets dossier body prose;
- `next-step` output is dossier-local and does not replace repo overlay ingestion before acting;
- `workflow_stage_next` is either a real workflow stage name or `null`; it never uses shipped CLI command names or prose-derived labels.

## No-technical-debt policy

Apply this policy during `Workflow stage: implementation`, after the dossier was updated and before verification and step close-out.

Use it to ensure the changed scope does not leave hidden technical debt behind.

Required actions:

1. Perform explicit debt review of the changed scope.
2. Run `node scripts/dossier.mjs debt-audit --changed-only`.
3. Re-check dependencies and adjacent seams.
4. Resolve or explicitly record every debt item in a canonical artifact.

Notes:

- `debt-audit` is the canonical debt-detection command for this policy.
- `debt-audit` stays marker-only. It does not prove implementation completeness.
- This policy is about debt handling only. Verification, external audits, backlog actualization, and `dossier-step-close` are governed by `Workflow stage: implementation` and its dedicated references.
- A debt item may be closed only by:
  - fixing it now;
  - recording it explicitly in a canonical artifact as an approved limitation, follow-up, blocker, or dependency;
  - returning it to `backlog-engineer` when it changes backlog truth or requires backlog-level follow-up.
- Never leave debt implicit in chat-only reasoning or undocumented “later” intent.

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
- `node scripts/dossier.mjs dossier-verify --step implementation --dossier docs/features/F-0001-foo.md`
- `node scripts/dossier.mjs dossier-verify --step implementation --changed-only --base origin/main` for repo-scope audit of the current change set
- `node scripts/dossier.mjs review-artifact --dossier docs/features/F-0001-foo.md --step implementation --reviewer independent-reviewer --verdict PASS`
- `node scripts/dossier.mjs dossier-step-close --dossier docs/features/F-0001-foo.md --step implementation --verify-artifact ... --review-artifact ...`
- `node scripts/dossier.mjs next-step --dossier docs/features/F-0001-foo.md`
