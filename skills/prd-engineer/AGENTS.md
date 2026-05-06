---
skill-maintenance-type: generated
source-of-truth: skill.yaml
maintenance-mode: regenerate
preferred-maintainer-skill: skill-source-compiler
---

# AGENTS.md

This file is maintenance guidance for agents editing this skill. It is not part of the runtime skill contract.

## Skill Type

This is a generated documentation skill.

Primary source of truth:

- `skill.yaml`
- `fragments/*`
- `references/*`

Generated output:

- `SKILL.md`
- `docs/compile-report.md`

## Maintenance Rules

- Use the `skill-source-compiler` skill when maintaining this skill.
- Update the source bundle first and regenerate instead of hand-editing generated files.
- Keep the skill portable: no absolute paths and no required files outside this skill folder.
