---
skill-maintenance-type: documentation-generated
source-of-truth: skill.yaml
maintenance-mode: regenerate
preferred-maintainer-skill: skill-source-compiler
---

# gh-utility

This is a generated portable documentation skill for the installed GitHub CLI.

- Edit `skill.yaml`, `fragments/*`, and `references/*` first.
- Regenerate compiler-owned `SKILL.md` and `docs/compile-report.md`; do not hand-edit them.
- Keep the active surface limited to native `gh` commands and GitHub CLI use cases.
- Do not add wrappers, proxy CLIs, independent transport, authorization logic, redaction engines,
  state machines, or semantic verdicts.
- A helper script is allowed only when it transparently aggregates native `gh` reads or performs a
  simple explicit sequence of native `gh` calls. Keep it inspectable and behaviorally equivalent
  to the documented commands.
