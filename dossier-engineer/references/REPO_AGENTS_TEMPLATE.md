# Repository `AGENTS.md` template for dossier protocol

Use this as the minimal repo-root `AGENTS.md` content when bootstrapping `dossier-engineer`.

```md
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
- Do not overload one field to mean multiple state machines.

## Rules
1) Do not duplicate acceptance criteria text outside dossiers.
2) Start navigation from `docs/ssot/index.md`, then follow links into dossiers.
3) When implementing a feature, reference stable IDs:
   - Feature: `F-0001`
   - Acceptance criteria: `AC-F0001-01`
   - ADR block: `ADR-F0001-01`
   - Slice: `SL-F0001-01`
   - Task: `T-F0001-01`
4) Any behavior-changing PR that implements `F-XXXX` must update the matching dossier:
   - Progress & links
   - Coverage map
   - Change log when requirements or assumptions changed
5) Tests must reference AC IDs in test names or `// Covers:` comments.
6) `docs/backlog/feature-candidates.md` may contain `CF-*` candidate entries, but `docs/ssot/index.md` must list only real dossiers.
7) Before `spec-compact`, `plan-slice`, `implementation`, `change-proposal`, or `next-step`, ingest this file and any referenced repo ADRs as workflow overlays.
8) No technical debt by default. For each mutating step: run local checks, run manual debt review, run `node scripts/debt-audit.mjs --changed-only` when the repo provides it, re-check dependencies and adjacent seams, then run `node scripts/dossier-verify.mjs`, then run independent review with a separate reviewer agent when the platform supports it, persist the verdict via `node scripts/review-artifact.mjs`, then close the step via `node scripts/dossier-step-close.mjs`.
9) After `implementation`, review must explicitly cover: completeness against dossier/slices/approved changes, code review, and security review. Marker debt audit does not replace these checks.
10) Do not claim a step is complete unless the matching `.dossier/steps/<feature>/<step>.json` artifact says `process_complete: true`.
11) If executable dossier sections change on a `planned`, `in_progress`, or `done` dossier, run `node scripts/contract-drift-audit.mjs` and explicitly decide whether code/test/runtime follow-up is required.
12) The common command examples below must match the actual repo commands. If bootstrap preserved repo-specific script names or paths, rewrite these lines instead of forcing canonical filenames.

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
