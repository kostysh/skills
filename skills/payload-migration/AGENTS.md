---
skill-maintenance-type: generated
source-of-truth: skill.yaml
maintenance-mode: regenerate
preferred-maintainer-skill: skill-source-compiler
---

# AGENTS.md

This file is maintenance guidance for agents editing this skill. It is not part of the runtime skill contract.

## Skill Type

This is a generated documentation skill based on the upstream `payloadcms/skills` `cms-migration` guidance.

Primary source of truth:

- `skill.yaml`
- `fragments/*`
- `references/*`
- `assets/*`

Generated output:

- `SKILL.md`
- `docs/compile-report.md`

## Maintenance Rules

- Use the `skill-source-compiler` skill when maintaining this skill.
- Update the source bundle first and regenerate instead of hand-editing generated files.
- Keep the skill portable: no absolute paths and no required files outside this skill folder.
- Upstream source was imported from `payloadcms/skills` commit `b87f7a8f6c6fd59c9e99d254b0a53e2934437c0d`; upstream README declares MIT license but the cloned repo did not include a separate LICENSE file.
