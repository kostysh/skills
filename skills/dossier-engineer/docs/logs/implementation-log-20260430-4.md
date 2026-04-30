# Implementation Log 2026-04-30-4

## Task

Add Dossier Language Policy to `dossier-engineer`.

## Capability vs Substrate

Observable behavior: agents using `dossier-engineer` must write human-readable dossier semantic content in the operator's working language while preserving protocol mechanics in English.

Substrate: this is a skill-instruction policy and body-completion criterion. It does not add runtime language detection or automated lint enforcement.

## Placement

The policy is placed in two surfaces:

- `fragments/overview.md` so generated `SKILL.md` exposes it as a hard policy near the Body Completion Gate.
- `references/body-completion.md` because language correctness directly affects whether a body is complete.

## Completed

- Added `Dossier Language Policy` to the generated overview source.
- Added language-specific completion criteria to `references/body-completion.md`.
- Updated root `README.md` key rules.
- Registered this implementation log in `skill.yaml`.
- Regenerated `SKILL.md` and `docs/compile-report.md`.

## Verification

- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs regenerate .`
- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs check .`
- `pnpm run lint`
- `pnpm test`
- `git diff --check`
- Absolute local path search in active/generated files

## Instruction Quality Audit

PASS.

- The policy has a clear outcome: dossier semantic body text follows the operator's working language.
- It distinguishes protocol mechanics from human-readable interpretation.
- It is connected to Body Completion Gate so wrong-language scaffold/template text cannot satisfy handoff readiness.
- The anti-claim is explicit: no runtime language linting is added.

## Residual Risk

`pnpm run format:check` is expected to fail on pre-existing runtime formatting drift unrelated to this instruction change unless that broader formatting issue is addressed separately.
