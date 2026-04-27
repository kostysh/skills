# Source bundle governance

Maintain this skill with `skill-source-compiler`.

## Source-of-truth rule

Edit these first:

- `skill.yaml`
- `fragments/*`
- `references/*`
- `assets/*`
- `src/*`
- `test/*`
- `package.json`

Do not hand-edit generated `SKILL.md` as the authoritative source.
`docs/*` remains a maintainer-only repository surface and must not become part of the emitted skill contract.

## Size rule

This skill is expected to accumulate a large amount of guidance. Because the compiler enforces a recommended maximum size for `SKILL.md`, the source bundle must be designed for progressive disclosure from the start.

Required behavior:

- keep the root `SKILL.md` for activation, workflow, guardrails, and navigation only
- move detailed active guidance, architecture, and long examples into `references/*` or `assets/*`
- treat compile size warnings as a signal to refactor the source bundle, not as a casual reason to raise the size ceiling

## No-loss de-noising rule

When adapting this skill for newer reasoning models or lower-noise instruction flow, preserve existing behavior first.

Allowed changes:

- reorder guidance so the stable scope and trigger-matched references are read first
- mark hard invariants separately from agent decision rules
- add stop conditions for tool-heavy, audit-heavy, and source-review-heavy work
- move bulky explanations into stable references when the emitted root grows too large

Forbidden changes:

- deleting commands, stages, helper boundaries, audit classes, artifact contracts, telemetry fields, source-review paths, pre-review checklist behavior, post-close hygiene, canonical layout, or no-legacy guarantees because they look verbose
- creating active reference filenames tied to a concrete current model number
- documenting runtime behavior that the shipped CLI, help, and tests do not support

Model-specific investigations may remain in dated `docs/*` reports. Durable active guidance must be model-agnostic.

## Regeneration workflow

1. update the source bundle files
2. run compiler `lint`
3. run compiler `compile`
4. run compiler `check`
5. inspect `docs/compile-report.md`

## Runtime promotion and maintenance rule

Command documentation in `skill.yaml` is allowed only when all of the following remain true:

- runtime behavior exists under `src/` and emitted artifacts under `scripts/`
- tests exist under `test/`
- the help surface is stable enough to be contractual

Once runtime promotion happened:

- `skill.yaml` command entries must stay aligned with the shipped launchers and help surface
- command additions, removals, renamed flags, and output-field changes must update runtime, tests, and source bundle in the same change set
- active references may describe future hardening work, but they must not imply unsupported layouts, extra launcher surfaces, or unshipped adaptation flows unless runtime and tests actually ship them
