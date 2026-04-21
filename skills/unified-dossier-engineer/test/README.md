# Tests

This directory contains runtime and docs-contract tests for the shipped merged `unified-dossier-engineer` skill.

Current test families:

- `cli.test.ts` for command behavior, canonical launcher surface, source-review flows, stage controllers, and closure/telemetry helpers
- `docs-contract.test.ts` for generated `SKILL.md`, active references, utility-spec parity, source bundle, and no-legacy invariants

Fixtures under `test/fixtures/` are runtime snapshots used to seed canonical unified repos during tests.
