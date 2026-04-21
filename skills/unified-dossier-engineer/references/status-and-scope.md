# Status and scope

This skill ships the canonical merged runtime for `unified-dossier-engineer`.

Current status:

- code-backed generated skill
- source of truth rooted at `skill.yaml`
- authoritative unified CLI contract exists under `scripts/dossier-engineer.mjs`
- only the canonical unified layout is supported
- no split-model migration tooling, rollout-readiness checks, or compatibility launchers are shipped

Use this skill for:

- merged architecture decisions
- source-bundle maintenance
- runtime/CLI maintenance inside the merged skill
- canonical unified `.dossier` + `docs/ssot` behavior

Do not use this skill:

- as proof that split repositories can be migrated automatically
- as a compatibility layer for old `backlog-engineer` or `dossier` launchers
- for legacy split-root operations outside the canonical unified layout

## Non-negotiable scope invariants

- do not lose existing merged functionality while removing legacy support
- keep `.dossier` for accounting and process artifacts
- keep `docs/ssot` for human-facing project SSOT
- keep `one feature = one backlog item`
- keep `coverage_gate` as a first-class state axis
- keep strict closure truth and lifecycle telemetry
