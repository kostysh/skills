# Status and scope

This skill ships the first-wave merged runtime.

Current status:

- code-backed generated skill
- source of truth rooted at `skill.yaml`
- first-wave authoritative unified CLI contract exists under `scripts/`
- migration tooling, split-skill parity hardening, and retirement are still pending
- split `backlog-engineer` and `dossier-engineer` remain parity references until Packages 10-11 complete

Use this skill for:

- merged architecture decisions
- source-bundle maintenance
- runtime/CLI maintenance inside the merged skill
- migration and retirement planning work

Do not use this skill as proof that split-skill migration or retirement is already complete.

## Non-negotiable scope invariants

- do not lose existing functionality during the merge
- keep `.dossier` for accounting and process artifacts
- keep `docs/ssot` for human-facing project SSOT
- keep `one feature = one backlog item`
- keep `coverage_gate` as a first-class state axis
- keep strict closure truth and lifecycle telemetry
