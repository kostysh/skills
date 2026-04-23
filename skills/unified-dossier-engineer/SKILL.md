---
name: unified-dossier-engineer
description: Build and maintain the canonical dossier/backlog skill and its CLI
  runtime. Use when working on the architecture, artifact model, command
  surface, or canonical workflow.
compatibility: Canonical runtime shipped. Only the canonical `.dossier` +
  `docs/ssot` layout and the `dossier-engineer` launcher are part of this skill.
metadata:
  source-version: 0.2.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 22744ae8f61e79ebc0740c0b68198500d5e189f59acf6f20fe4f2616a9039511
---

# unified-dossier-engineer

## Start here

1. Confirm the task is about maintaining or extending this dossier/backlog skill.
2. Read the required active references relevant to the contract you are changing.
3. Treat this skill as a shipped runtime with one supported `.dossier` + `docs/ssot` layout and one supported launcher.

## When to use this skill

- Define or refine the architecture that combines backlog truth and dossier delivery workflow.
- Maintain the skill artifact model, command surface, or runtime behavior.
- Implement or review CLI behavior, source-review flows, stage controllers, or help/runtime contracts.

## When NOT to use this skill

- The task belongs only to a different skill and does not affect this skill or its runtime.
- The task depends on an unsupported repository layout or launcher outside the canonical `.dossier` + `docs/ssot` model.

## Overview

This skill is the code-backed home of the canonical dossier/backlog runtime. Its job is to maintain the architecture, artifact model, runtime boundary, and canonical CLI.

The shipped runtime serves one canonical model: `.dossier` for accounting/process truth and `docs/ssot` for project-facing SSOT. Only that layout and the `dossier-engineer` launcher are supported.

Every mutating dossier stage requires external review before truthful closure. Blocking external reviews must be launched as separate reviewer executions without forked/full-history authoring context. In Codex this means `fork_context: false`; in other runtimes use the equivalent no-full-context-inheritance mode. If an audit was launched with forked/full-history context, discard it and rerun it correctly.

`review-artifact` records one already obtained audit result for one audit class. `dossier-step-close` validates the policy-required audit bundle before truthful closure. These helpers record and validate only observable durable provenance; they do not prove reviewer launch-mode independence.

This skill preserves two distinct semantic layers inside one runtime:

- `backlog truth layer` for backlog graph, source registry, packets, patches, and source-review discipline
- `delivery workflow layer` for intake, spec, planning, implementation, coverage, review, closure, and telemetry

For stage-controller writes, session provenance is agent-owned explicit input. The agent determines the session id before invoking the runtime and passes it with `--session-id`; the runtime must not discover session ids from runtime-private stores or silently fall back to environment variables.

For machine-complete stage artifacts, helper-managed `.dossier/stages/*` is the authoritative structured coordination and validation surface. Stage log frontmatter mirrors bounded machine fields such as artifact links, backlog follow-up state, explicit skill annotations, structured `process_misses`, scope identity, and optional commit trace links.

## Workflow stages

### Workflow stage: Confirm shipped-runtime scope

Prevent the active instructions from overclaiming what the shipped runtime actually supports today.

1. Verify whether the task changes runtime code, tests, active references, or other skill files.
2. Refuse to document runnable commands unless a shipped runtime and tests exist in this skill.
3. Remove unsupported layout or launcher claims instead of preserving transition-era wording.

Validation:

- No speculative CLI contract appears in the active instructions.
- The active instructions remain honest about canonical shipped scope.

### Workflow stage: Maintain the model

Keep the architecture deterministic and non-destructive.

1. Preserve the accounting versus project-SSOT artifact split.
2. Preserve the invariant `one feature = one backlog item`.
3. Keep `change-proposal`, `contract-drift-audit`, `backlog impact verdict`, `coverage_gate`, and strict closure semantics in scope.
4. Keep delivery workflow, telemetry identity, and closure truth explicit rather than collapsing them into backlog-only state or speculative command prose.
5. Preserve the commandized stage-control model: primary delivery stages become mechanical controllers, while closure and helper commands stay separate.

Validation:

- No tracked feature disappears from the current canonical model.
- `.dossier` and `docs/ssot` remain semantically distinct.
- Delivery state, `coverage_gate`, freshness, and closure remain separate axes.
- Stage-controller boundaries stop at `ready_for_close`; authoritative closure remains helper-driven.

### Workflow stage: Apply implementation discipline to runtime changes

Keep runtime changes simple, local, and explicitly verified.

1. When the task changes runtime code or code-backed tests, also use the `implementation-discipline` skill.
2. Prefer the smallest runtime change that satisfies the requirement instead of adding speculative abstractions.
3. Keep the diff surgical and tie validation to concrete command behavior, type checks, or docs-contract checks.

Validation:

- Runtime/code changes stay narrowly scoped and explicitly verified.
- Implementation or review work does not silently bypass `implementation-discipline`.

## Interop priority

- **shipped runtime behavior:** `unified-dossier-engineer`. This skill owns its active command surface and canonical artifact contract.
- **implementation behavior and code-review hygiene for runtime work:** `implementation-discipline`. Use it together with this skill whenever runtime code or code-backed tests change so runtime work stays simple, surgical, and explicitly verified.

## Runnable commands
### CLI command: `help`
**Use when:** Confirm the public CLI contract before invoking or documenting another command.

**Summary:** Show the shipped help surface or command-local help.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs help; node scripts/dossier-engineer.mjs help feature-intake

### CLI command: `init`
**Use when:** Bootstrap a repository for the runtime.

**Summary:** Initialize the process root, backlog subroot, and SSOT skeleton.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs init --path <repo>

### CLI command: `register-source`
**Use when:** New durable source material must enter the backlog truth layer.

**Summary:** Register a source document and obtain a source ID.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs register-source --path <path> --kind spec --authority repo

### CLI command: `list-sources`
**Use when:** You need the canonical registry view before refresh, source maintenance, or source-linked patching.

**Summary:** List registered sources and source metadata.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs list-sources

### CLI command: `update-source-path`
**Use when:** A source file moved and the registry must be kept truthful.

**Summary:** Update the registered path of an existing source.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs update-source-path --source-id <source_id> --new-path <path>

### CLI command: `remove-source`
**Use when:** A source is retired and its registry entry must be removed cleanly.

**Summary:** Remove a source after durable cleanup of backlog references.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs remove-source --source-id <source_id>

### CLI command: `refresh`
**Use when:** Registered source documents may have changed and source-review truth must be refreshed.

**Summary:** Refresh source hashes and open or update source-review records.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs refresh

### CLI command: `ack-source-review`
**Use when:** A changed source was reviewed and no backlog mutation is required.

**Summary:** Close an open source-review record as an explicit no-op.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs ack-source-review --source-id <source_id>

### CLI command: `status`
**Use when:** You need a compact readiness summary for the current process root.

**Summary:** Show backlog readiness signals including source-review blocking counts.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs status

### CLI command: `items`
**Use when:** Specific backlog items are already known and full item cards are needed.

**Summary:** Return backlog item cards with source-review readiness overlays.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs items --item-keys <item_key_1>,<item_key_2>

### CLI command: `search`
**Use when:** You need filtered backlog discovery while preserving source-review blocking signals.

**Summary:** Search backlog items with source-review readiness overlays.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs search --status defined

### CLI command: `queue`
**Use when:** You need execution-ready chains rather than a flat item list.

**Summary:** Return queue chains after excluding source-review blocked items.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs queue

### CLI command: `gaps`
**Use when:** You need a deterministic view of declared blockers before starting work.

**Summary:** List explicit blockers and unresolved backlog gaps.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs gaps

### CLI command: `attention`
**Use when:** You need the next deterministic review targets after refresh or mutation work.

**Summary:** Surface open source-review records before generic item-level attention entries.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs attention

### CLI command: `template`
**Use when:** New backlog-authoring work needs a canonical template instead of ad hoc JSON.

**Summary:** Generate packet or patch templates.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs template packet --out <path>

### CLI command: `packet`
**Use when:** Source review or planned delivery work requires new backlog items.

**Summary:** Apply a packet that adds new backlog tasks.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs packet --path <packet.json>

### CLI command: `patch-item`
**Use when:** Existing backlog truth must be corrected without creating a new packet.

**Summary:** Apply a patch that updates existing backlog tasks.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs patch-item --patch <patch.json>

### CLI command: `remove-item`
**Use when:** Confirmed obsolete work must be removed from backlog truth.

**Summary:** Apply a patch that removes obsolete backlog tasks.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs remove-item --patch <patch.json>

### CLI command: `report`
**Use when:** Operator-facing backlog reporting is needed without manually reading JSON read models.

**Summary:** Generate a human-readable backlog report on disk.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs report

### CLI command: `feature-intake`
**Use when:** Selected backlog work is being turned into a new dossier-controlled feature.

**Summary:** Create a new feature dossier and open a feature lifecycle.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs feature-intake --title <title> --backlog-item-key <key> --backlog-delivery-state <state> --backlog-source <source> --area <area> --owner <owner> --impact <impact> --session-id <id>

### CLI command: `spec-compact`
**Use when:** The feature moves into or through compact specification work.

**Summary:** Mechanical controller for the spec-compact stage.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs spec-compact --feature-id <id> --session-id <id>

### CLI command: `plan-slice`
**Use when:** The feature moves into or through planning work.

**Summary:** Mechanical controller for the plan-slice stage.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs plan-slice --feature-id <id> --session-id <id>

### CLI command: `implementation`
**Use when:** The feature moves into or through implementation work.

**Summary:** Mechanical controller for the implementation stage.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs implementation --feature-id <id> --session-id <id>

### CLI command: `change-proposal`
**Use when:** The feature enters an explicit change-proposal branch that may affect backlog truth.

**Summary:** Mechanical controller for the mature change path.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs change-proposal --feature-id <id> --session-id <id>

### CLI command: `contract-drift-audit`
**Use when:** Mature change work needs a deterministic contract-drift check.

**Summary:** Detect executable contract drift without follow-up changes.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs contract-drift-audit --dossier <path>

### CLI command: `coverage-audit`
**Use when:** Coverage-gate evidence must be refreshed against current dossier state.

**Summary:** Check AC references in tests and report orphans.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs coverage-audit --dossier <path>

### CLI command: `debt-audit`
**Use when:** Closure readiness requires a deterministic debt pass.

**Summary:** Scan for explicit TODO/FIXME/HACK/XXX debt markers.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs debt-audit --dossier <path>

### CLI command: `dependency-graph`
**Use when:** You need a machine-generated view of dossier dependencies.

**Summary:** Print the dossier dependency graph as Mermaid.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs dependency-graph --dossier <path>

### CLI command: `sync-index`
**Use when:** The global SSOT index needs deterministic block refresh without broader red-flag recomputation.

**Summary:** Refresh generated dossier table and graph blocks only.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs sync-index --root <repo>

### CLI command: `index-refresh`
**Use when:** The global SSOT index needs a full generated refresh.

**Summary:** Run sync-index and refresh the generated Red flags block.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs index-refresh --root <repo>

### CLI command: `lint-dossiers`
**Use when:** Dossier integrity must be checked across the current process root.

**Summary:** Validate feature dossiers and optionally update Red flags.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs lint-dossiers --root <repo>

### CLI command: `dossier-verify`
**Use when:** Local gates are green and deterministic verification evidence must be materialized.

**Summary:** Run the canonical verification bundle and persist its artifact.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs dossier-verify --dossier <path>

### CLI command: `review-artifact`
**Use when:** Required external audit evidence already exists and one audit-class result must be recorded durably.

**Summary:** Persist one already obtained audit result for one audit class.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs review-artifact --dossier <path> --step implementation --audit-class spec-conformance-reviewer --verdict PASS --reviewer independent

### CLI command: `dossier-step-close`
**Use when:** Verification is complete and the policy-required external audit bundle for the stage is ready for truthful close-out.

**Summary:** Persist the authoritative step-close artifact after validating the required audit bundle.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs dossier-step-close --dossier <path> --step implementation --verify-artifact <path> --review-artifact <spec.json> --review-artifact <code.json> --review-artifact <security.json>

### CLI command: `next-step`
**Use when:** You need the deterministic next step for one dossier without inference from chat prose.

**Summary:** Resolve the dossier-local next workflow stage from structured state.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs next-step --dossier <path>

### CLI command: `lifecycle-refresh`
**Use when:** Step-close or lifecycle telemetry changed and lifecycle snapshots must be refreshed.

**Summary:** Rebuild lifecycle metrics and session anchors from structured telemetry.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** node scripts/dossier-engineer.mjs lifecycle-refresh --feature-id <id>

## Gotchas

- **high** — Do not document commands, flags, or output fields unless the runtime and tests actually ship them.
- **high** — `.dossier` is for accounting and process artifacts, while `docs/ssot` remains the human-facing project SSOT.
- **high** — Source hash changes must open a source-review record first; they must not immediately flood linked items with `needs_attention`.
- **high** — Do not collapse backlog lifecycle, dossier maturity, `coverage_gate`, review freshness, and closure state into one flat status enum.
- **high** — Delivery closure remains step-close-backed and telemetry-backed; commit history or chat summaries are never enough.
- **high** — Stage-controller commands are mechanical progress controllers only; they must stop at `ready_for_close` and must not duplicate `dossier-step-close` or `lifecycle-refresh`.

## Policies

### No functionality loss
This skill must retain every essential behavior in its canonical scope, including backlog source tracking, `change-proposal`, `contract-drift-audit`, `coverage_gate`, lifecycle telemetry, and strict closure truth.

### Source-review before item flood
Refresh-driven source changes open source-review records and block linked-item readiness until review resolves; item-level escalation happens only after confirmed backlog mutation work.

### Stage controllers versus helper commands
Primary delivery stages may gain first-class commands, but closure truth, review persistence, verification artifacts, lifecycle aggregation, and dossier-local querying remain separate helper command families.

## Required active references
- [Status and scope](references/status-and-scope.md) — Read this first to understand what this skill currently is and is not.
- [Unified architecture outline](references/unified-architecture.md) — Read this when modifying the unified artifact model, workflow model, or runtime boundaries.
- [Unified artifact topology](references/unified-artifact-topology.md) — Read this when designing or validating `.dossier` layout, root discovery, or `docs/ssot` boundaries.
- [Backlog truth layer](references/backlog-truth-layer.md) — Read this when working on backlog graph truth, read models, actualization, or source-maintenance semantics in this skill.
- [Source-review contract](references/source-review-contract.md) — Read this when designing refresh/attention behavior or source-change review semantics.
- [Delivery workflow layer](references/delivery-workflow-layer.md) — Read this when designing feature intake, spec/planning/implementation flow, mature change path, coverage gate, or closure readiness in this skill.
- [Audit policy](references/audit-policy.md) — Read this when changing mutating-stage review policy, review bundles, review freshness, or truthful close-out rules.
- [Telemetry and closure](references/telemetry-and-closure.md) — Read this when designing lifecycle identity, logs, closure artifacts, retrospective signals, or truthful blocked/open/closed semantics.
- [Commandized stage control](references/commandized-stage-control.md) — Read this when designing future delivery-stage commands, stage transitions, or the boundary between stage controllers and closure/helper commands.
- [Runtime and command boundary](references/runtime-and-command-boundary.md) — Read this when designing or maintaining canonical runtime modules, help surface, or command-family boundaries.

## Bundled assets

- `assets/README.md` — Placeholder for future bundled templates and static assets.

## Portability rules

- Do not emit absolute paths or machine-specific environment assumptions.
- Do not require repository files outside this skill folder to understand this design.
- Keep all mandatory guidance for this skill inside this skill folder.
- Use only relative links inside the skill bundle.

## Portability checklist before finishing

- Search the skill folder for absolute paths and remove them.
- Confirm every required reference exists inside this skill folder.
- Confirm the copied skill remains understandable in isolation.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
