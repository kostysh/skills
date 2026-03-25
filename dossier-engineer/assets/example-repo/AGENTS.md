# AGENTS.md

This repository uses the dossier protocol.

## Single sources of truth
- Global navigation index: `docs/ssot/index.md`
- Repo architecture overview: `docs/architecture/system.md`
- Per-feature canonical doc: `docs/features/F-*.md` (Feature Dossier)

## Planning backlog
- Candidate feature backlog: `docs/backlog/feature-candidates.md` (non-SSoT)

## State model
- Dossier workflow maturity lives in dossier frontmatter `status`.
- Coverage enforcement lives in dossier frontmatter `coverage_gate`.
- Review freshness and step closure live in `.dossier/reviews/*` and `.dossier/steps/*`.

## Rules
1) Do not duplicate acceptance criteria text outside dossiers.
2) Start navigation from `docs/ssot/index.md`, then follow links into dossiers.
3) When implementing a feature, reference IDs:
   - Feature: `F-0001`
   - Acceptance criteria: `AC-F0001-01`
   - ADR block: `ADR-F0001-01`
   - Slice: `SL-F0001-01`
   - Task: `T-F0001-01`
4) Any behavior-changing PR that implements `F-XXXX` must update the matching dossier:
   - Progress & links
   - Coverage map
   - Change log when requirements or assumptions changed
5) Tests must use `node:test` and include AC IDs in test names or `// Covers:` comments.
6) `docs/backlog/feature-candidates.md` may contain `CF-*` candidate entries, but `docs/ssot/index.md` must list only real dossiers.
7) Before `spec-compact`, `plan-slice`, `implementation`, `change-proposal`, or `next-step`, ingest this file and relevant repo ADRs as workflow overlays.
8) For each mutating step: run local checks, manual debt review, `node scripts/debt-audit.mjs --changed-only` when git context exists, then `node scripts/dossier-verify.mjs`, then persist review with `node scripts/review-artifact.mjs`, then close the step with `node scripts/dossier-step-close.mjs`.
9) Do not claim a step is complete unless the corresponding step artifact says `process_complete: true`.
10) If executable dossier sections change on a mature dossier, run `node scripts/contract-drift-audit.mjs`.

## Common commands
Once the repository has been bootstrapped with repo-local dossier scripts:
- Run tests: `node --test`
- Refresh index: `node scripts/index-refresh.mjs`
- Lint dossiers: `node scripts/lint-dossiers.mjs`
- Audit coverage: `node scripts/coverage-audit.mjs`
- Audit marker debt: `node scripts/debt-audit.mjs`
- Verify step bundle: `node scripts/dossier-verify.mjs --step implementation --dossier docs/features/F-0001-password-reset.md`
- Resolve next action: `node scripts/next-step.mjs`
