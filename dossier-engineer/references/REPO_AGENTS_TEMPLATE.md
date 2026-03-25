# Repository `AGENTS.md` template for dossier protocol

Use this as the minimal repo-root `AGENTS.md` content when bootstrapping `dossier-engineer`.

```md
# AGENTS.md

This repository uses the `dossier-engineer` skill.
This file contains repo-specific overlays only.

## Single sources of truth
- Global navigation index: `docs/ssot/index.md`
- Repo architecture overview: `docs/architecture/system.md`
- Per-feature canonical doc: `docs/features/F-*.md` (Feature Dossier)

## Planning backlog
- Candidate feature backlog: `docs/backlog/feature-candidates.md` (non-SSoT)

## Repo-level engineering contracts
- Canonical toolchain and runtime notes: `README.md`
- Cross-cutting ADRs: `docs/adr/ADR-*.md`

## Repo-specific overlays
1) Before `spec-compact`, `plan-slice`, `implementation`, `change-proposal`, or `next-step`, ingest this file and any referenced repo ADRs as workflow overlays.
2) Keep this file overlay-only. Default dossier workflow, review, and closure rules live in the `dossier-engineer` skill and should not be copied here unless the repo intentionally tightens them.
3) The common command examples below must match the actual repo commands. If bootstrap preserved repo-specific script names or paths, rewrite these lines instead of forcing canonical filenames.

## Common commands
- Run tests: `node --test`
- Refresh index: `node scripts/index-refresh.mjs`
- Lint dossiers (read-only): `node scripts/lint-dossiers.mjs`
- Audit coverage: `node scripts/coverage-audit.mjs`
- Audit marker debt: `node scripts/debt-audit.mjs`
- Verify step bundle: `node scripts/dossier-verify.mjs --step implementation --changed-only`
- Persist review: `node scripts/review-artifact.mjs --dossier docs/features/F-0001-foo.md --step implementation --verdict PASS`
- Close step: `node scripts/dossier-step-close.mjs --dossier docs/features/F-0001-foo.md --step implementation --verify-artifact ... --review-artifact ...`
- Resolve next action: `node scripts/next-step.mjs`
```
