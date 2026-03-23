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
   - Change log when requirements changed
5) Tests must reference AC IDs in test names or `// Covers:` comments.
6) `docs/backlog/feature-candidates.md` may contain `CF-*` candidate entries, but `docs/ssot/index.md` must list only real dossiers.
7) No technical debt by default. A "step" means any completed mutating dossier workflow unit (`init`, `feature-discovery`, `feature-intake`, `spec-compact`, `plan-slice`, `implementation`, `change-proposal`, etc.) or a user-approved implementation increment.
8) For each completed step: run local checks, then a technical-debt review of the changed scope, then `node scripts/debt-audit.mjs --changed-only` when the repo provides it, then a dependency/seam re-check, and only then the independent review gate.
9) If debt cannot be removed immediately, record the follow-up with stable references and explicit dependencies in the canonical artifact for that debt class: Feature Dossier for intaken feature debt, candidate backlog for not-yet-intaken seam debt, repo-level ADR for cross-cutting debt. Chat-only notes and TODO-only follow-ups do not count.
10) The common command examples below must match the actual repo commands. If bootstrap preserved repo-specific script names or paths, rewrite these lines instead of forcing the canonical `scripts/*.mjs` filenames.

## Common commands
- Run tests: `node --test`
- Audit repo debt markers: `node scripts/debt-audit.mjs`
- Audit changed-scope debt markers: `node scripts/debt-audit.mjs --changed-only`
- Sync index: `node scripts/sync-index.mjs`
- Lint dossiers: `node scripts/lint-dossiers.mjs`
- Audit coverage: `node scripts/coverage-audit.mjs`
```
