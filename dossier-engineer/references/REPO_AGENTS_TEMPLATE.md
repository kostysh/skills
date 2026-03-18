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

## Common commands
- Run tests: `node --test`
- Sync index: `node scripts/sync-index.mjs`
- Lint dossiers: `node scripts/lint-dossiers.mjs`
- Audit coverage: `node scripts/coverage-audit.mjs`
```
