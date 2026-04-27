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

## Hard invariants

- do not lose existing unified functionality while keeping the canonical model strict
- keep `.dossier` for accounting and process artifacts
- keep `docs/ssot` for human-facing project SSOT
- keep `one feature = one backlog item`
- keep `coverage_gate` as a first-class state axis
- keep strict closure truth and lifecycle telemetry
- keep the shipped `dossier-engineer` command families, delivery stages, helper commands, audit classes, artifact families, parity-protected stage fields, source-review flow, implementation pre-review checklists, post-close backlog hygiene, canonical layout, and no-legacy guarantees in scope
- do not treat existing workflow protections as removable noise; de-noising means ordering, labeling, or adding decision/stop rules without reducing behavior

## Model-agnostic operating posture

Use the lightest sufficient reasoning posture that preserves correctness:

- direct read/help/report work can stay concise once the current command surface is confirmed
- normal maintenance should gather the minimum relevant reference set and move to a concrete edit or verdict
- deeper analysis is reserved for ambiguous scope, runtime behavior, closure truth, audit policy, security, destructive side effects, or explicit operator request

This is behavioral guidance for agents. It is not API/client configuration and is not tied to one model number.

## Agent decision rules

- Start with this file, then read only the active references whose trigger applies to the current surface.
- Continue when the canonical scope, required evidence, and next command or edit target are clear.
- Ask the operator when the requested scope, permission to launch an independent reviewer, or destructive side effect is ambiguous and cannot be inferred from repo artifacts.
- Leave the stage open or blocked when required evidence, external review, source-review resolution, lifecycle reconciliation, or verification freshness is missing.
- Stop expanding context when the loaded evidence is sufficient to make the next safe decision; do not turn progressive disclosure into an upfront full-reference read.
