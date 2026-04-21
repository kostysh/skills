---
name: unified-dossier-engineer
source-version: 0.1.0
description: Plan, scaffold, and maintain the future merged dossier/backlog
  skill that will replace the split between dossier-engineer and
  backlog-engineer. Use when working on the unified architecture, source bundle,
  migration plan, artifact model, or runtime convergence of that future skill.
compatibility: Planning-stage generated skill. The source bundle is maintained
  with skill-source-compiler. No unified runtime or CLI contract is shipped yet.
metadata:
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 8a7d469eb0bebf398a83a2c630b391ffbdd9c5cb559a4e5e4b6970648e3df8a4
---

# unified-dossier-engineer

## Start here

1. Confirm the task is about planning, scaffolding, or implementing the future merged dossier/backlog skill.
2. Read every required active reference before changing the source bundle.
3. Treat this skill as planning-stage only until the merged runtime and CLI contract are actually shipped.
4. Regenerate the emitted skill through `skill-source-compiler` after source-bundle edits.
5. Keep the root `SKILL.md` intentionally lean and move bulky active guidance into `references/*` or `assets/*`, not `docs/*`.

## When to use this skill

- Define or refine the merged architecture that combines backlog truth and dossier delivery workflow.
- Scaffold or maintain the generated source bundle for the future merged skill.
- Plan the migration from the split `backlog-engineer` + `dossier-engineer` model into one unified skill.

## When NOT to use this skill

- The task only changes the currently shipped `backlog-engineer` or `dossier-engineer` skill without touching the future merge.
- The task needs today's canonical runtime contract for backlog or dossier work; use the shipped skills directly.
- The task asks for a unified command surface that the merged runtime does not yet implement.

## Overview

This skill is the planning-stage home of the future merged `dossier-engineer`. Its job is to consolidate the architecture, artifact model, migration plan, and source-bundle discipline before the current split skills are replaced.

The merged target must preserve two distinct semantic layers inside one skill:

- `backlog truth layer` for backlog graph, source registry, packets, patches, and source-review discipline
- `delivery workflow layer` for intake, spec, planning, implementation, coverage, review, closure, and telemetry

The generated instruction surface should stay intentionally small. The merged skill is expected to become broad, so the source bundle must enforce progressive disclosure from day one.

## Workflow stages

### Workflow stage: Confirm planning-stage scope

Prevent the scaffold from pretending the merged skill is already shipped.

1. Verify whether the task changes planning documents, active references, source-bundle structure, or future runtime design.
2. Refuse to document runnable commands unless a shipped runtime and tests exist in this skill.
3. Keep the split-skill contract authoritative for current production behavior until the merge is implemented.

Validation:

- No speculative CLI contract appears in `SKILL.md`.
- The scaffold remains honest about planning-stage status.

### Workflow stage: Maintain the unified model

Keep the merged architecture deterministic and non-destructive.

1. Preserve the accounting versus project-SSOT artifact split.
2. Preserve the invariant `one feature = one backlog item`.
3. Keep `change-proposal`, `contract-drift-audit`, `backlog impact verdict`, `coverage_gate`, and strict closure semantics in scope.
4. Keep delivery workflow, telemetry identity, and closure truth explicit rather than collapsing them into backlog-only state or speculative command prose.
5. Preserve the commandized stage-control model: primary delivery stages become mechanical controllers, while closure and helper commands stay separate.

Validation:

- No tracked feature from either original skill disappears from the merged target model.
- `.dossier` and `docs/ssot` remain semantically distinct.
- Delivery state, `coverage_gate`, freshness, and closure remain separate axes.
- Stage-controller boundaries stop at `ready_for_close`; authoritative closure remains helper-driven.

### Workflow stage: Regenerate the generated skill

Keep source bundle and generated skill aligned.

1. Edit `skill.yaml`, `fragments/*`, `references/*`, or `assets/*` first when changing the skill contract.
2. Run compiler lint, compile, and check from the skill root.
3. Review compile warnings, especially `SKILL.md` size warnings, before finishing.

Validation:

- `SKILL.md` links every required active reference.

## Interop priority

- **current shipped backlog and dossier runtime behavior:** the existing `backlog-engineer` and `dossier-engineer` skills. Until the merged runtime is implemented, the split skills remain authoritative for active project work.
- **generated-skill maintenance and source-bundle discipline:** `skill-source-compiler`. The merged skill must be maintained as a generated source bundle rather than hand-edited prose.

## Gotchas

- **high** — Do not document runnable unified commands until the merged runtime and tests actually ship them.
- **high** — The merged skill will be large; keep `SKILL.md` small and push detail into `references/*` or compile will eventually drift beyond the recommended size ceiling.
- **high** — `.dossier` is for accounting and process artifacts, while `docs/ssot` remains the human-facing project SSOT.
- **high** — Source hash changes must open a source-review record first; they must not immediately flood linked items with `needs_attention`.
- **high** — Do not collapse backlog lifecycle, dossier maturity, `coverage_gate`, review freshness, and closure state into one flat status enum.
- **high** — Delivery closure remains step-close-backed and telemetry-backed; commit history or chat summaries are never enough.
- **high** — Future stage-controller commands are mechanical progress controllers only; they must stop at `ready_for_close` and must not duplicate `dossier-step-close` or `lifecycle-refresh`.

## Policies

### Active normative surface
The generated `SKILL.md` and required references are the only active default instruction surface for this planning-stage skill.

### No functionality loss
The merge must retain every essential behavior of both original skills, including backlog source tracking, `change-proposal`, `contract-drift-audit`, `coverage_gate`, lifecycle telemetry, and strict closure truth.

### Source-review before item flood
Refresh-driven source changes open source-review records and block linked-item readiness until review resolves; item-level escalation happens only after confirmed backlog mutation work.

### Stage controllers versus helper commands
Primary delivery stages may gain first-class commands, but closure truth, review persistence, verification artifacts, lifecycle aggregation, and dossier-local querying remain separate helper command families.

## Required active references
- [Status and scope](references/status-and-scope.md) — Read this first to understand what this skill currently is and is not.
- [Unified architecture outline](references/unified-architecture.md) — Read this when modifying the merged artifact model, workflow model, or runtime boundaries.
- [Source bundle governance](references/source-bundle-governance.md) — Read this when editing the scaffold, regenerating SKILL.md, or expanding the future runtime surface.
- [Unified artifact topology](references/unified-artifact-topology.md) — Read this when designing or validating `.dossier` layout, root discovery, or `docs/ssot` boundaries.
- [Backlog truth layer](references/backlog-truth-layer.md) — Read this when working on backlog graph truth, read models, actualization, or source-maintenance semantics in the merged skill.
- [Source-review contract](references/source-review-contract.md) — Read this when designing refresh/attention behavior or source-change review semantics.
- [Delivery workflow layer](references/delivery-workflow-layer.md) — Read this when designing feature intake, spec/planning/implementation flow, mature change path, coverage gate, or closure readiness in the merged skill.
- [Telemetry and closure](references/telemetry-and-closure.md) — Read this when designing lifecycle identity, logs, closure artifacts, retrospective signals, or truthful blocked/open/closed semantics.
- [Commandized stage control](references/commandized-stage-control.md) — Read this when designing future delivery-stage commands, stage transitions, or the boundary between stage controllers and closure/helper commands.

## Bundled assets

- `assets/README.md` — Placeholder for future bundled templates and static assets.

## Portability rules

- Do not emit absolute paths or machine-specific environment assumptions.
- Do not require repository files outside this skill folder to understand the merged design.
- Keep all mandatory guidance for the future merged skill inside this source bundle.
- Use only relative links inside the generated skill bundle.

## Portability checklist before finishing

- Search the skill folder for absolute paths and remove them.
- Confirm every required reference exists inside this skill folder.
- Confirm the copied skill remains understandable in isolation.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.

## Final checks

1. Confirm the source bundle and generated `SKILL.md` agree on current merged-skill status.
2. Confirm no active command surface is documented unless the merged runtime and tests actually ship it.
3. Confirm the root `SKILL.md` remains concise enough that adding more guidance should first prompt reference extraction, not root-file growth.
