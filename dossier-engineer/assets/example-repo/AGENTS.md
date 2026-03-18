# AGENTS.md

This repository uses a low-overhead docs-as-code workflow.

## Single sources of truth
- Global navigation index: `docs/ssot/index.md`
- Per-feature canonical doc: `docs/features/F-*.md` (Feature Dossier)

## Rules
1) Do not duplicate acceptance criteria text outside dossiers.
2) When implementing a feature, reference IDs:
   - Feature: `F-0001`
   - Acceptance criteria: `AC-F0001-01`
3) Tests must use `node:test` and include AC IDs in test names or `// Covers:` comments.

## Common commands
- Run tests: `node --test`
- Sync index: `node scripts/sync-index.mjs` (in the skill folder; copy into repo or run from there)
