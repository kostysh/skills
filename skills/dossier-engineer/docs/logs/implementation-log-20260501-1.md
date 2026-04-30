# Implementation Log 2026-05-01-1

## Task

Switch `dossier-engineer` package linting to include ESLint, following the `skill-source-compiler` package pattern.

## Capability vs Substrate

Observable behavior: `pnpm run lint` for `dossier-engineer` now runs Biome's existing lightweight lint pass, ESLint over TypeScript source/test/config files, and TypeScript typechecking.

Substrate: this does not redesign the shared ESLint configuration or add skill-specific ESLint rules. It adopts the workspace ESLint setup already used by the adjacent generated-skill package.

## Completed

- Added `lint:eslint` to the package scripts.
- Updated `lint` and `lint:fix` to run ESLint in addition to the existing Biome and TypeScript checks.
- Fixed ESLint findings by making frontmatter value rendering explicit, removing unnecessary async wrappers, and marking `node:test` registrations as intentionally unawaited.
- Rebuilt the bundled runtime and regenerated generated skill surfaces.

## Verification

- `pnpm run format`
- `pnpm run format:check`
- `pnpm run lint`
- `pnpm test`
- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs regenerate .`
- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs check .`
- `git diff --check`

## Instruction Quality Audit

PASS.

- The change updates the code-backed maintenance contract instead of only changing documentation.
- The runtime, built script, package scripts, tests, and generated bundle stay aligned.
- The anti-claim is explicit: this uses the shared workspace ESLint policy and does not introduce new local lint policy.

## Residual Risk

Future runtime files must continue to match the shared workspace ESLint config; there is no package-local override.
