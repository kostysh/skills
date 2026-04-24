---
skill-maintenance-type: code-backed-generated
source-of-truth: skill.yaml
maintenance-mode: regenerate
preferred-maintainer-skill: skill-source-compiler
---

# AGENTS.md

This file is maintenance guidance for agents editing this skill. It is not part of the runtime skill contract.

## Skill Type

This is a code-backed generated skill.

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
- `scripts/*`

## Maintenance Rules

- Use the `skill-source-compiler` skill when maintaining this skill.
- Update the source bundle first and regenerate instead of hand-editing generated files.
- Keep documented CLI behavior aligned with runtime code and tests in the same change set.
- Keep the skill portable: no absolute paths and no required files outside this skill folder.
