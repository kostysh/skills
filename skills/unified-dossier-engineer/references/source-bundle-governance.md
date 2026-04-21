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

The merged skill is expected to accumulate a large amount of guidance. Because the compiler enforces a recommended maximum size for `SKILL.md`, the source bundle must be designed for progressive disclosure from the start.

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

## Runtime promotion rule

Do not add command documentation to `skill.yaml` until:

- runtime behavior exists under `src/` and emitted artifacts under `scripts/`
- tests exist under `test/`
- the help surface is stable enough to be contractual

It is acceptable to keep future runtime/help/module design in active `references/*` before code ships.

But:

- those references must stay explicit about planning-stage status;
- `skill.yaml` `commands` surface must remain empty until runtime behavior and tests actually exist.
