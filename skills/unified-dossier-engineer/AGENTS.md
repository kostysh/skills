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

This is a `code-backed-generated` skill in planning-stage development.

Meaning:

- the authoritative source is the structured source bundle rooted at `skill.yaml`
- generated output and future shipped runtime must stay aligned
- until a unified runtime exists, this skill must not document speculative commands

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

Supporting planning surface:

- `docs/README.md`
- `docs/issues/*`
- `docs/refactoring-plan-*.ru.md`

## Maintenance Rules

- Prefer using the `skill-source-compiler` skill when maintaining this skill.
- Update the source bundle first and regenerate instead of hand-editing generated files.
- Keep `SKILL.md` intentionally small; push bulky active guidance into `references/*` and `assets/*`.
- Do not document a unified CLI contract until the merged runtime actually ships it.
- Keep the merged artifact split stable: accounting artifacts in `.dossier`, project SSOT in `docs/ssot`.
- Preserve the invariant `one feature = one backlog item`.

## Work Shortcuts

### Scenario: Update merged-skill concept or architecture

Edit `docs/issues/*`, update any affected active references, then regenerate `SKILL.md` and `docs/compile-report.md`.

### Scenario: Update the generated instruction surface

Edit `skill.yaml`, `fragments/*`, or `references/*`, then rerun compiler lint/compile/check.

### Scenario: Start runtime work

Add or update implementation under `src/`, tests under `test/`, runtime artifacts under `scripts/`, and only then promote runnable commands into `skill.yaml`.

## Final Checks

Before finishing maintenance work:

- confirm `skill.yaml` and `package.json` versions were bumped in the correct scope
- confirm generated files were regenerated if source inputs changed
- confirm no speculative command surface was introduced
- confirm the skill remains understandable when copied by itself
