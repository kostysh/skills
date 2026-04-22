# Status and scope

This skill ships the canonical dossier/backlog runtime.

Current status:

- code-backed skill
- authoritative CLI contract exists under `scripts/dossier-engineer.mjs`
- only the canonical `.dossier` + `docs/ssot` layout is supported
- only the `dossier-engineer` launcher is shipped

Use this skill for:

- architecture decisions
- runtime/CLI maintenance inside this skill
- canonical `.dossier` + `docs/ssot` behavior

Do not use this skill:

- as proof that unsupported repository layouts can be adapted automatically
- as a compatibility layer for unsupported launchers or alternate root conventions
- for repository operations outside the canonical `.dossier` + `docs/ssot` layout

## Non-negotiable scope invariants

- do not lose existing unified functionality while keeping the canonical model strict
- keep `.dossier` for accounting and process artifacts
- keep `docs/ssot` for human-facing project SSOT
- keep `one feature = one backlog item`
- keep `coverage_gate` as a first-class state axis
- keep strict closure truth and lifecycle telemetry
