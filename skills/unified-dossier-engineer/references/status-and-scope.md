# Status and scope

This skill is not the shipped merged runtime yet.

Current status:

- planning-stage generated scaffold
- source of truth rooted at `skill.yaml`
- no shipped authoritative unified CLI contract yet
- future runtime boundary design may exist in active references before code lands
- current production behavior still belongs to the shipped `backlog-engineer` and `dossier-engineer` skills

Use this skill for:

- merged architecture decisions
- source-bundle maintenance
- planning and migration work
- future runtime convergence design

Do not use this skill as proof that a merged runtime already exists.

## Non-negotiable scope invariants

- do not lose existing functionality during the merge
- keep `.dossier` for accounting and process artifacts
- keep `docs/ssot` for human-facing project SSOT
- keep `one feature = one backlog item`
- keep `coverage_gate` as a first-class state axis
- keep strict closure truth and lifecycle telemetry
