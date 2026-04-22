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
