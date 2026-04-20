---
skill-maintenance-type: code-backed-generated
source-of-truth: skill.yaml
maintenance-mode: regenerate
preferred-maintainer-skill: skill-source-compiler
---

# AGENTS.md

This file is maintenance guidance for agents editing this skill.
It is not part of the runtime skill contract.

## Skill Type

This is a `code-backed-generated` skill.

Meaning:

- the authoritative source is the structured source bundle rooted at `skill.yaml`
- generated output and shipped runtime must stay aligned
- changes to documented CLI behavior require matching runtime and test changes

## Source Of Truth

Primary source of truth:

- `skill.yaml`
- `fragments/*`
- `references/*`
- `assets/*`
- `src/*`
- `test/*`
- `package.json`

Generated or derived output:

- `SKILL.md`
- `docs/compile-report.md`
- `scripts/skill-source-compiler.mjs`

Do not treat generated files as the authoritative place to edit behavior or policy.

## Maintenance Rules

- Prefer using the `skill-source-compiler` skill when maintaining this skill.
- If the compiler workflow is available, update the source bundle first and regenerate instead of hand-editing generated files.
- Keep two versions separate: `skill.yaml` `skill.source-version` for skill content, and `package.json` `version` for the shipped CLI/runtime package.
- Do not reintroduce duplicated shadow source trees such as `skillsrc/`.
- Keep the skill portable: no absolute paths, no required files outside this skill folder.

## Work Shortcuts

### Scenario: Update instructional prose

Edit the relevant source file under `skill.yaml`, `fragments/`, or `references/`, then regenerate `SKILL.md` and `docs/compile-report.md`.

### Scenario: Update CLI contract

Change the source bundle documentation, the runtime implementation in `src/`, and the tests in `test/` in the same change set.

### Scenario: Update generated runtime artifact

Edit `src/`, rebuild `scripts/skill-source-compiler.mjs`, and rerun the package tests.

### Scenario: Audit drift

Verify that:

- documented commands match the built CLI help surface
- command tests still cover the shipped command surface
- `SKILL.md` matches the current source bundle
- `docs/compile-report.md` reflects the current compile warnings

## Final Checks

Before finishing maintenance work:

- confirm `skill.yaml` and `package.json` versions were bumped in the correct scope
- confirm generated files were regenerated if source inputs changed
- confirm runtime, docs, and tests describe the same CLI contract
- confirm the skill remains understandable when copied by itself
