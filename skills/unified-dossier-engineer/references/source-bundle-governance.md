# Source bundle governance

Maintain this skill with `skill-source-compiler`.

## Source-of-truth rule

Edit these first:

- `skill.yaml`
- `fragments/*`
- `references/*`
- `docs/*`
- `src/*`
- `test/*`
- `package.json`

Do not hand-edit generated `SKILL.md` as the authoritative source.

## Size rule

The merged skill is expected to accumulate a large amount of guidance. Because the compiler enforces a recommended maximum size for `SKILL.md`, the source bundle must be designed for progressive disclosure from the start.

Required behavior:

- keep the root `SKILL.md` for activation, workflow, guardrails, and navigation only
- move detailed architecture, migration reasoning, and long examples into `references/*` or supporting docs
- treat compile size warnings as a signal to refactor the source bundle, not as a casual reason to raise the size ceiling

## Regeneration workflow

1. update the source bundle files
2. run compiler `lint`
3. run compiler `compile`
4. run compiler `check`
5. inspect `docs/compile-report.md`

## Runtime promotion rule

Do not add command documentation to `skill.yaml` until:

- runtime behavior exists under `src/` and emitted artifacts under `scripts/`
- tests exist under `test/`
- the help surface is stable enough to be contractual
