# AGENTS.md

This repository uses `backlog-engineer` for backlog shaping and `dossier-engineer` for downstream dossier workflow.
This file contains repo-specific overlays only.

## Single sources of truth
- Global navigation index: `docs/ssot/index.md`
- Repo architecture overview: `docs/architecture/system.md`
- Per-feature canonical doc: `docs/features/F-*.md` (Feature Dossier)

## Backlog workflow
- Backlog shaping, task selection, readiness checks, gaps, attention, and lifecycle actualization use `backlog-engineer`.

## Repo-level engineering contracts
- Canonical toolchain and runtime notes: `README.md`
- Cross-cutting ADRs: `docs/adr/ADR-*.md`

## Repo-specific overlays
1) Before `feature-intake`, `spec-compact`, `plan-slice`, `implementation`, `change-proposal`, or `next-step`, ingest this file and relevant repo ADRs as workflow overlays.
2) Keep this file overlay-only. Default dossier workflow, review, and closure rules live in the `dossier-engineer` skill and should not be copied here unless the repo intentionally tightens them.

## Common commands
Once the repository has been bootstrapped with repo-local dossier scripts:
- Run tests: `node --test`
- Refresh index: `node scripts/dossier.mjs index-refresh`
- Lint dossiers: `node scripts/dossier.mjs lint-dossiers`
- Audit coverage: `node scripts/dossier.mjs coverage-audit`
- Audit marker debt: `node scripts/dossier.mjs debt-audit`
- Verify step bundle: `node scripts/dossier.mjs dossier-verify --step implementation --dossier docs/features/F-0001-password-reset.md`
- Resolve dossier-local next action: `node scripts/dossier.mjs next-step`
