# Source language

A source bundle starts with `skill.yaml` and may include local fragment files, active references, assets, runtime files, and supporting docs.

## Required top-level fields

- `apiVersion`
- `kind`
- `skill`
- `skill.source-version`
- `skill.recommended-skill-md-max-bytes`
- `surfaces`
- `sections`

## Core authoring rule

Encode **semantics** in the manifest and use fragment files only for focused prose that belongs in the generated output. Keep reusable rules, applicability, workflow stages, gotchas, and portability constraints in structured fields so the compiler can validate them deterministically.

## File kinds

- `references`: active or optional linked docs inside `references/`
- `assets`: templates and static resources inside `assets/`
- `copies`: additional emitted files such as runtime scripts or tests when a skill is code-backed
- `supporting`: non-normative docs, usually under `docs/`

## Version model

- `skill.source-version` is the version of the skill content and generated instruction surface
- `package.json` `version` is the version of the shipped CLI or runtime package for code-backed skills
- do not reuse `package.json` `version` as the skill content version unless you intentionally want every skill-prose change to force a runtime rebuild

## Size guidance

- `skill.recommended-skill-md-max-bytes` defines the recommended maximum UTF-8 size for the generated `SKILL.md`
- compile should emit a warning, not a hard error, when the generated `SKILL.md` exceeds this limit
- the default `20000` bytes is an approximate stand-in for the public recommendation to keep `SKILL.md` around `5000` tokens and under `500` lines
- raise the limit only when progressive disclosure through `references/*` cannot reasonably reduce the size

## Runtime utility location

If the skill ships a utility, document and invoke it from `<skill-root>/scripts`. Do not assume the executable is globally installed.

## Code-backed bundles

When the skill ships a CLI or other runtime artifact, prefer rooting `skill.yaml` in the actual skill folder instead of a duplicated shadow tree. That lets the source bundle reference the same `references/`, `assets/`, `scripts/`, and smoke-test files that the packaged skill really ships, which reduces drift between source, emitted output, runtime, and tests.

## Rendering model

The compiler renders `SKILL.md` from structured sections, then copies the declared files into their emitted targets.
