# Implementation Log 2026-04-30-3

## Task

Add a mandatory Body Completion Gate to `dossier-engineer`, with all new guidance in English.

## Capability vs Substrate

Observable behavior: an agent using `dossier-engineer` must treat runtime-created scaffolds as incomplete until relevant Markdown body sections contain project-specific human-readable interpretation. The gate must apply before stage close, handoff, PR preparation, changeset publication, and final response.

Substrate: adding prose to `SKILL.md`, `skill.yaml`, and a reference file does not create runtime lint enforcement. This change establishes the mandatory skill-level rule and review criteria; CLI enforcement would require a separate runtime change.

## Completed

- Added `Body Completion Gate` to the generated skill overview source.
- Added `references/body-completion.md` with unacceptable body states, artifact-specific minimums, existing-project onboarding body requirements, and a pre-handoff body completion check.
- Registered `ref-body-completion` as a required active reference in `skill.yaml`.
- Added body-completion checks to workflow validations for source/capability anchoring, stage closure, implementation closure, and handoff.
- Updated root `README.md` and `docs/README.md` in English.
- Regenerated `SKILL.md` and `docs/compile-report.md` from the source bundle.

## Verification

- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs regenerate .`
- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs check .`
- `pnpm run lint`
- `pnpm run format:check` (failed on pre-existing runtime formatting drift; see residual risk)
- `pnpm test`
- `git diff --check`
- Cyrillic search in new or edited English files
- Absolute local path search in active/generated files

## Instruction Quality Audit

PASS.

- The required outcome is explicit: scaffold-only body is forbidden before closure and handoff boundaries.
- The rule separates machine-readable frontmatter from human-readable body interpretation.
- The reference trigger is concrete and tied to artifact creation, material changes, stage close, handoff, PR preparation, and final response.
- Existing-project onboarding minimums are explicit and prevent code presence from being counted as observed capability.
- The change states its anti-claim: it does not add runtime lint enforcement.

## Residual Risk

`pnpm run format:check` is expected to fail on pre-existing runtime formatting drift unrelated to this instruction change unless that broader formatting issue is addressed separately.
