# Repository `AGENTS.md` template for dossier workflow

Use this as the minimal repo-root `AGENTS.md` content when bootstrapping `dossier-engineer`.

```md
# AGENTS.md

This repository uses `backlog-engineer` for backlog shaping and `dossier-engineer` for downstream dossier workflow.
This file contains repo-specific overlays only.

## Single sources of truth
- Global navigation index: `docs/ssot/index.md`
- Repo architecture overview: `docs/architecture/system.md`
- Per-feature canonical doc: `docs/features/F-*.md` (Feature Dossier)

## Backlog workflow
- Backlog shaping, task selection, readiness checks, gaps, attention, and lifecycle actualization use `backlog-engineer`.
- Read current backlog truth only through canonical `backlog-engineer` commands.
- Utility-owned internal backlog files are not an operator-facing source of truth.
- Use `queue -> items --item-keys ...` when full task cards are needed after `queue`.

## Repo-level engineering contracts
- Canonical toolchain and runtime notes: `README.md`
- Cross-cutting ADRs: `docs/adr/ADR-*.md`

## Repo-specific overlays
1) Before `feature-intake`, `spec-compact`, `plan-slice`, `implementation`, `change-proposal`, `dossier-verify`, or `next-step`, ingest this file and any referenced repo ADRs as workflow overlays.
2) Keep this file overlay-only. Default dossier workflow, review, and closure rules live in the `dossier-engineer` skill and should not be copied here unless the repo intentionally tightens them.
3) The common command examples below must match the actual repo commands. Replace the placeholders with the real formatter, linter, and test commands for this repository.
4) If bootstrap preserved repo-specific script names or paths, rewrite these lines instead of forcing canonical filenames.

## Common commands
Use the repository's actual dossier command surface after bootstrap.
If bootstrap created or preserved repo-local `scripts/dossier.mjs`, commands may look like this:
- Format code: `<repo format command>`
- Lint code: `<repo lint command>`
- Run tests: `<repo test command>`
- Refresh index: `node scripts/dossier.mjs index-refresh`
- Lint dossiers (read-only): `node scripts/dossier.mjs lint-dossiers`
- Audit coverage: `node scripts/dossier.mjs coverage-audit`
- Audit marker debt: `node scripts/dossier.mjs debt-audit`
- Verify one dossier step bundle: `node scripts/dossier.mjs dossier-verify --step implementation --dossier docs/features/F-0001-foo.md`
- Verify repo-scope changed set: `node scripts/dossier.mjs dossier-verify --step implementation --changed-only`
- Persist independent review: `node scripts/dossier.mjs review-artifact --dossier docs/features/F-0001-foo.md --step implementation --reviewer independent-reviewer --verdict PASS`
- Close step: `node scripts/dossier.mjs dossier-step-close --dossier docs/features/F-0001-foo.md --step implementation --verify-artifact ... --review-artifact ...`
- Resolve dossier-local next action: `node scripts/dossier.mjs next-step --dossier docs/features/F-0001-foo.md`

Review note:
- `review-artifact` only records an already obtained independent review verdict; it does not perform the review itself.
- Implementation close-out still requires the full audit stack defined by the skill process:
  - `spec-conformance` first;
  - `code-reviewer` and `security-reviewer` when the changed scope includes code;
  - a separate independent reviewer before `dossier-step-close`.
```
