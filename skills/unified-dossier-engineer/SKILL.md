---
name: unified-dossier-engineer
source-version: 0.2.0
description: Build and maintain the merged dossier/backlog skill and its
  canonical unified CLI runtime. Use when working on the merged architecture,
  source bundle, artifact model, command surface, or canonical unified workflow.
compatibility: Canonical merged runtime shipped. The source bundle is maintained
  with skill-source-compiler. No split-model migration or compatibility surface
  is part of this skill.
metadata:
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 3a84c8a7ff30681ad0808093bf305b012d7d4d1bac8e870a654a6a7e2851bd40
---

# unified-dossier-engineer

## Start here

1. Confirm the task is about maintaining or extending the canonical merged dossier/backlog skill.
2. Read every required active reference before changing the source bundle.
3. Treat this skill as a shipped canonical runtime; do not reintroduce split-model compatibility promises.
4. Regenerate the emitted skill through `skill-source-compiler` after source-bundle edits.
5. Keep the root `SKILL.md` intentionally lean and move bulky active guidance into `references/*` or `assets/*`, not `docs/*`.

## When to use this skill

- Define or refine the merged architecture that combines backlog truth and dossier delivery workflow.
- Maintain the generated source bundle and the shipped canonical merged runtime.
- Implement or review unified CLI behavior, source-review flows, stage controllers, or canonical help/runtime contracts.

## When NOT to use this skill

- The task only changes the split `backlog-engineer` or `dossier-engineer` skill without affecting the merged skill.
- The task depends on split roots, split launchers, or migration tooling; this skill does not support that surface.

## Overview

This skill is the code-backed home of the merged `dossier-engineer`. Its job is to maintain the unified architecture, artifact model, runtime boundary, and canonical unified CLI for the merged skill.

The shipped runtime serves only the canonical unified model: `.dossier` for accounting/process truth and `docs/ssot` for project-facing SSOT. It does not ship split-model migration, rollout checks, or compatibility launchers.

The merged target must preserve two distinct semantic layers inside one skill:

- `backlog truth layer` for backlog graph, source registry, packets, patches, and source-review discipline
- `delivery workflow layer` for intake, spec, planning, implementation, coverage, review, closure, and telemetry

The generated instruction surface should stay intentionally small. The merged skill is broad and will keep growing, so the source bundle must enforce progressive disclosure and command-surface honesty.

## Workflow stages

### Workflow stage: Confirm shipped-runtime scope

Prevent the source bundle from overclaiming what the merged runtime actually ships today.

1. Verify whether the task changes runtime code, tests, active references, or source-bundle structure.
2. Refuse to document runnable commands unless a shipped runtime and tests exist in this skill.
3. Remove split-model compatibility promises instead of preserving them as transitional wording.

Validation:

- No speculative CLI contract appears in `SKILL.md`.
- The source bundle remains honest about canonical shipped scope.

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

### Workflow stage: Apply implementation discipline to runtime changes

Keep merged runtime changes simple, local, and explicitly verified.

1. When the task changes runtime code or code-backed tests, also use the `implementation-discipline` skill.
2. Prefer the smallest runtime change that satisfies the requirement instead of adding speculative abstractions.
3. Keep the diff surgical and tie validation to concrete command behavior, type checks, or docs-contract checks.

Validation:

- Runtime/code changes stay narrowly scoped and explicitly verified.
- Implementation or review work does not silently bypass `implementation-discipline`.

## Interop priority

- **shipped merged runtime behavior:** `unified-dossier-engineer`. The merged skill owns its active command surface and canonical unified artifact contract.
- **generated-skill maintenance and source-bundle discipline:** `skill-source-compiler`. The merged skill must be maintained as a generated source bundle rather than hand-edited prose.
- **implementation behavior and code-review hygiene for merged runtime work:** `implementation-discipline`. Use it together with this skill whenever runtime code or code-backed tests change so merged-runtime work stays simple, surgical, and explicitly verified.

## Runnable commands
### CLI command: `help`
**Use when:** Confirm the public merged CLI contract before invoking or documenting another command.

**Summary:** Show the shipped unified help surface or command-local help.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs help; node scripts/dossier-engineer.mjs help feature-intake

### CLI command: `init`
**Use when:** Bootstrap a repository for the merged runtime.

**Summary:** Initialize the unified process root, backlog subroot, and SSOT skeleton.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs init --path <repo>

### CLI command: `register-source`
**Use when:** New durable source material must enter the backlog truth layer.

**Summary:** Register a source document and obtain a source ID.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs register-source --path <path> --kind spec --authority repo

### CLI command: `list-sources`
**Use when:** You need the canonical registry view before refresh, source maintenance, or source-linked patching.

**Summary:** List registered sources and source metadata.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs list-sources

### CLI command: `update-source-path`
**Use when:** A source file moved and the registry must be kept truthful.

**Summary:** Update the registered path of an existing source.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs update-source-path --source-id <source_id> --new-path <path>

### CLI command: `remove-source`
**Use when:** A source is retired and its registry entry must be removed cleanly.

**Summary:** Remove a source after durable cleanup of backlog references.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs remove-source --source-id <source_id>

### CLI command: `refresh`
**Use when:** Registered source documents may have changed and source-review truth must be refreshed.

**Summary:** Refresh source hashes and open or update source-review records.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs refresh

### CLI command: `ack-source-review`
**Use when:** A changed source was reviewed and no backlog mutation is required.

**Summary:** Close an open source-review record as an explicit no-op.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs ack-source-review --source-id <source_id>

### CLI command: `status`
**Use when:** You need a compact readiness summary for the current process root.

**Summary:** Show merged backlog readiness signals including source-review blocking counts.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs status

### CLI command: `items`
**Use when:** Specific backlog items are already known and full item cards are needed.

**Summary:** Return backlog item cards with source-review readiness overlays.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs items --item-keys <item_key_1>,<item_key_2>

### CLI command: `search`
**Use when:** You need filtered backlog discovery while preserving source-review blocking signals.

**Summary:** Search backlog items with source-review readiness overlays.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs search --status defined

### CLI command: `queue`
**Use when:** You need execution-ready chains rather than a flat item list.

**Summary:** Return queue chains after excluding source-review blocked items.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs queue

### CLI command: `gaps`
**Use when:** You need a deterministic view of declared blockers before starting work.

**Summary:** List explicit blockers and unresolved backlog gaps.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs gaps

### CLI command: `attention`
**Use when:** You need the next deterministic review targets after refresh or mutation work.

**Summary:** Surface open source-review records before generic item-level attention entries.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs attention

### CLI command: `template`
**Use when:** New backlog-authoring work needs a canonical template instead of ad hoc JSON.

**Summary:** Generate packet or patch templates.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs template packet --out <path>

### CLI command: `packet`
**Use when:** Source review or planned delivery work requires new backlog items.

**Summary:** Apply a packet that adds new backlog tasks.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs packet --path <packet.json>

### CLI command: `patch-item`
**Use when:** Existing backlog truth must be corrected without creating a new packet.

**Summary:** Apply a patch that updates existing backlog tasks.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs patch-item --patch <patch.json>

### CLI command: `remove-item`
**Use when:** Confirmed obsolete work must be removed from backlog truth.

**Summary:** Apply a patch that removes obsolete backlog tasks.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs remove-item --patch <patch.json>

### CLI command: `report`
**Use when:** Operator-facing backlog reporting is needed without manually reading JSON read models.

**Summary:** Generate a human-readable backlog report on disk.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs report

### CLI command: `feature-intake`
**Use when:** Selected backlog work is being turned into a new dossier-controlled feature.

**Summary:** Create a new feature dossier and open a feature lifecycle.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs feature-intake --title <title> --backlog-item-key <key> --backlog-delivery-state <state> --backlog-source <source> --area <area> --owner <owner> --impact <impact>

### CLI command: `spec-compact`
**Use when:** The feature moves into or through compact specification work.

**Summary:** Mechanical controller for the spec-compact stage.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs spec-compact --feature-id <id>

### CLI command: `plan-slice`
**Use when:** The feature moves into or through planning work.

**Summary:** Mechanical controller for the plan-slice stage.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs plan-slice --feature-id <id>

### CLI command: `implementation`
**Use when:** The feature moves into or through implementation work.

**Summary:** Mechanical controller for the implementation stage.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs implementation --feature-id <id>

### CLI command: `change-proposal`
**Use when:** The feature enters an explicit change-proposal branch that may affect backlog truth.

**Summary:** Mechanical controller for the mature change path.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs change-proposal --feature-id <id>

### CLI command: `contract-drift-audit`
**Use when:** Mature change work needs a deterministic contract-drift check.

**Summary:** Detect executable contract drift without follow-up changes.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs contract-drift-audit --dossier <path>

### CLI command: `coverage-audit`
**Use when:** Coverage-gate evidence must be refreshed against current dossier state.

**Summary:** Check AC references in tests and report orphans.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs coverage-audit --dossier <path>

### CLI command: `debt-audit`
**Use when:** Closure readiness requires a deterministic debt pass.

**Summary:** Scan for explicit TODO/FIXME/HACK/XXX debt markers.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs debt-audit --dossier <path>

### CLI command: `dependency-graph`
**Use when:** You need a machine-generated view of dossier dependencies.

**Summary:** Print the dossier dependency graph as Mermaid.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs dependency-graph --dossier <path>

### CLI command: `sync-index`
**Use when:** The global SSOT index needs deterministic block refresh without broader red-flag recomputation.

**Summary:** Refresh generated dossier table and graph blocks only.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs sync-index --root <repo>

### CLI command: `index-refresh`
**Use when:** The global SSOT index needs a full generated refresh.

**Summary:** Run sync-index and refresh the generated Red flags block.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs index-refresh --root <repo>

### CLI command: `lint-dossiers`
**Use when:** Dossier integrity must be checked across the current process root.

**Summary:** Validate feature dossiers and optionally update Red flags.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs lint-dossiers --root <repo>

### CLI command: `dossier-verify`
**Use when:** Local gates are green and deterministic verification evidence must be materialized.

**Summary:** Run the canonical verification bundle and persist its artifact.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs dossier-verify --dossier <path>

### CLI command: `review-artifact`
**Use when:** Independent review evidence already exists and must be recorded durably.

**Summary:** Persist an already obtained independent review artifact.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs review-artifact --dossier <path> --step implementation --verdict PASS --reviewer independent

### CLI command: `dossier-step-close`
**Use when:** Verification and review evidence are complete and the step is ready to close.

**Summary:** Persist the authoritative step-close artifact and update stage-log closure truth.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs dossier-step-close --dossier <path> --step <step>

### CLI command: `next-step`
**Use when:** You need the deterministic next step for one dossier without inference from chat prose.

**Summary:** Resolve the dossier-local next workflow stage from structured state.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs next-step --dossier <path>

### CLI command: `lifecycle-refresh`
**Use when:** Step-close or lifecycle telemetry changed and lifecycle snapshots must be refreshed.

**Summary:** Rebuild lifecycle metrics and session anchors from structured telemetry.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs lifecycle-refresh --feature-id <id>

## Gotchas

- **high** — Do not document commands, flags, or output fields unless the merged runtime and tests actually ship them.
- **high** — The merged skill will be large; keep `SKILL.md` small and push detail into `references/*` or compile will eventually drift beyond the recommended size ceiling.
- **high** — `.dossier` is for accounting and process artifacts, while `docs/ssot` remains the human-facing project SSOT.
- **high** — Source hash changes must open a source-review record first; they must not immediately flood linked items with `needs_attention`.
- **high** — Do not collapse backlog lifecycle, dossier maturity, `coverage_gate`, review freshness, and closure state into one flat status enum.
- **high** — Delivery closure remains step-close-backed and telemetry-backed; commit history or chat summaries are never enough.
- **high** — Stage-controller commands are mechanical progress controllers only; they must stop at `ready_for_close` and must not duplicate `dossier-step-close` or `lifecycle-refresh`.

## Policies

### Active normative surface
The generated `SKILL.md`, required references, and shipped runtime/help/tests are the active default instruction surface for this merged skill.

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
- [Runtime and command boundary](references/runtime-and-command-boundary.md) — Read this when designing or maintaining merged runtime modules, help surface, or command-family boundaries.

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
