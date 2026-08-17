---
name: delivery-planner
description: Turn accepted product scope and architecture handoff into
  right-sized executable work for AI agents. Use for project, feature, module,
  service, or integration planning, sequencing, risk-aware breakdown, and
  routing gaps to owning skills. Produce one Delivery Plan, not rigid workflow
  registers.
compatibility: Portable documentation-only skill. All mandatory
  delivery-planning guidance lives in this folder.
metadata:
  source-version: 0.2.11
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 59d1e9a9e19221666d4beb1b8e89e3b7009b3cb4c26f5df8959d87c0d1bbaa11
---

# delivery-planner

## Start here

1. Identify the requested planning scope before decomposing anything; support whole project, feature, module/service, integration, specific architecture handoff item, or backlog audit.
2. For every non-trivial creation, revision, or review, apply `implementation-discipline` before decomposition or process-depth decisions; capture the outcome or invariant, actor or consumer and claim boundary, source-authorized scope and non-goals, permitted planning output, simplest sufficient delivery path, and narrowest falsifier.
3. Verify product authority per the required methodology. Material product requirements trace past derived artifacts to an exact customer/contract statement or explicit customer decision. Preserve product and architecture handoff readiness; do not invent requirements or decisions.
4. For project/feature planning, create vertical slices around observable capabilities.
5. For module/service planning, create module increments around accepted responsibilities, boundaries, contracts, invariants, integrations, and verification hooks.
6. Treat the workflow as decision guidance, not a mandatory procedure; skip irrelevant detail when a compact plan is enough.
7. Disposition every in-scope product requirement and architecture handoff obligation to a task, specialist route, spike, or explicit not-applicable rationale; do not treat the handoff itself as a task list.
8. Before creating or recommending a persistent delivery plan, module delivery plan, task brief, or backlog audit artifact, check whether the current repository defines artifact conventions and follow them when present.
9. Produce one compact Markdown Delivery Plan by default; do not output YAML or multiple registers unless explicitly requested.
10. Route product gaps to prd-engineer, architecture gaps to architecture-engineer, and behavior/specification gaps to spec-engineer.
11. Sequence work to expose architectural, integration, migration, rollback, security, data, tenancy, and operability risk early.
12. Distinguish parallel implementation from independent acceptance; type dependency edges and require shared acceptance for same-record or shared-race evidence.
13. Reject tasks whose acceptance can pass through scaffold, metadata, docs, mocks, or wrappers without real observable or verifiable behavior.
14. Reject future-only support tasks unless they name the owner slice/module increment, the evidence they unlock, and the trigger that makes them necessary.

## When to use this skill

- Decomposing accepted architecture handoff into executable implementation tasks.
- Planning delivery for an entire project after product and architecture context are available.
- Planning one feature, epic, module, service, adapter, integration, subsystem, or architecture handoff item.
- Creating compact task briefs and sequencing for AI-agent implementation.
- Auditing an existing backlog for layer-only tasks, hidden risks, missing verification, poor granularity, or wrong sequencing.

## When NOT to use this skill

- Creating or normalizing product requirements, product scope, success metrics, or non-goals; use prd-engineer.
- Choosing architecture patterns, producing ASR records, writing ADRs, or changing architecture handoff; use architecture-engineer.
- Writing implementation-ready behavior specifications, edge cases, falsifiers, and verification maps; use spec-engineer.
- Implementing code, tests, migrations, or infrastructure directly.
- Producing heavyweight project management artifacts when a compact plan is enough.

## Overview

Delivery planning bridges accepted product/architecture context and executable implementation work.

The main purpose is architecture-to-task decomposition: take accepted architecture handoff items, constraints, boundaries, contracts, risks, and validation obligations, then produce right-sized tasks that downstream agents can safely execute.

The skill supports multiple planning scopes:

- whole project;
- feature or epic;
- module, service, bounded context, package, adapter, or subsystem;
- integration or provider flow;
- one architecture handoff item;
- backlog audit or repair.

Default output is one compact Markdown Delivery Plan. Heavy YAML registers are not the default path.

Treat the workflow as a small set of planning decisions, not a form the agent must fill in mechanically. A useful plan may be short when scope is narrow and authority is already clear.

The skill does not produce PRDs, architecture decisions, ADRs, ASR records, implementation-ready specs, code, CI changes, or merge decisions.

## Workflow stages

### Workflow stage: Define planning scope

Respect the requested target and avoid planning more than needed.

1. Capture the outcome, actor or consumer, claim boundary, source-authorized scope and non-goals, permitted output, direct delivery path, narrowest falsifier, and exact scope baseline; classify the delta as `unchanged`, `narrowed`, `expanded`, or `mixed`, then inventory every material change or addition with exact authority/customer disposition, consequences, and status or blocker.
2. Classify scope as project, feature, module/service, integration, handoff item, or backlog audit.
3. Identify included and excluded areas.
4. Select compact output mode unless a deeper mode is explicitly required.
5. Use explicit assumptions for non-blocking gaps instead of escalating every unknown.

Validation:

- Every scope delta has an inventory row with authority and consequences; every unauthorized addition is individually named and blocked, and risk, evidence, or planner-created artifacts have not expanded scope or process depth.

### Workflow stage: Intake and authority check

Identify authoritative product, architecture, spec, repository, and code inputs.

1. Load PRD or product brief when product scope matters.
2. Load architecture handoff when boundaries, contracts, data, security, deployment, or operations matter.
3. Load existing specs and repo instructions when available.
4. Verify product Authority and Handoff for the named planning consumer plus architecture handoff item status, blockers, next owner, and expected output; use repository-equivalent fields when names differ.
5. Treat same-session PRDs, architecture notes, specs, and plans as outputs, not higher-authority inputs that can authorize their own expansion.
6. Apply the required methodology's customer-coordination and bounded non-product-authority gates; a missing or conflicting chain blocks only dependent work.
7. Allow non-authoritative, draft, or blocked inputs to inform draft decomposition, but keep their dependent tasks draft or blocked.
8. Classify gaps as blocking or non-blocking and route blocking gaps to the responsible skill.

### Workflow stage: Convert architecture handoff into delivery work

Turn accepted architecture obligations into tasks without redesigning architecture.

1. Extract boundaries, contracts, data constraints, security constraints, operational obligations, integration points, validation obligations, risks, and revisit triggers.
2. Map every in-scope product requirement and architecture obligation, with source trace, to a vertical slice, module increment, support task, spike, specialist route, or explicit not-applicable rationale.
3. Trace every material planned item back to customer-coordinated product authority or bounded non-product authority; a missing reverse trace invalidates it.
4. For a ready planner-owned spike, produce only a bounded brief naming the executor, success and failure signals, evidence contract, and return route; do not claim empirical evidence.
5. Route unresolved architecture choices to architecture-engineer.

### Workflow stage: Create slices or module increments

Decompose around observable or verifiable outcomes.

1. Use vertical slices for project and feature planning.
2. Use module increments for module, service, adapter, or subsystem planning.
3. Tie substrate work to a named capability, module increment, validation obligation, or explicit developer-experience goal.
4. Merge or delete layer-only and future-only tasks when they cannot produce independent evidence of progress.
5. For valid support tasks, name the current source obligation or protected boundary, owner outcome, evidence unlocked, and why a direct task or existing verification contour is insufficient.

### Workflow stage: Create compact task briefs

Create executable planning-level tasks without writing full specs.

1. Give each task one primary goal.
2. Include item-level origin authority/customer coordination, scope, out-of-scope, dependencies, risk, handoff status, blockers, next owner, expected output or evidence, and unblock or evidence-return route.
3. Use `draft`, `blocked`, or `ready for <owner>`; use `ready for coding` only when accepted product and architecture inputs, sufficient behavior detail, ready dependencies, and concrete verification and review evidence let the coding owner act without source-owned decisions.
4. Split only when risk, dependency order, review path, or verification evidence requires it.
5. Route detailed behavior to spec-engineer instead of inventing it.
6. Record adjacent defects as findings, blockers, or follow-ups unless a current source includes their remediation; do not expand the original slice automatically.

### Workflow stage: Sequence and parallelize safely

Expose risk early and avoid parallel work on unstable assumptions.

1. Put source-required clarifications, bounded spikes, and accepted contract stabilization before dependent implementation; add a harness only when a current obligation needs it and existing verification is insufficient.
2. Type every material dependency as `start`, `merge`, `acceptance`, or `future-owner`; record source, target, gate or evidence, owner, and unblock or return route.
3. Parallelize when `start` edges are clear, contracts are stable, and write sets do not conflict; this does not imply independent acceptance.
4. Require shared `acceptance` evidence for same-record or shared-race invariants; add `merge` for integration order and `future-owner` for deferred ownership.

### Workflow stage: Planning audit

Ensure the plan is useful, compact, scope-respecting, and safe for downstream agents.

1. Check that architecture was not redesigned.
2. Check that no task is more ready than its product, architecture, specification, or dependency inputs.
3. Check that every in-scope requirement and architecture obligation has a task, route, spike, or explicit not-applicable rationale.
4. Check the exact-baseline scope inventory and item-level reverse authority trace; reject aggregate `findings`, missing consequences, or unnamed unauthorized additions.
5. Check that high-risk work is visible.
6. Check that acceptance cannot be satisfied by substrate-only work unless the task is explicitly substrate or developer-experience work.
7. Check that future scaffolds, wrappers, config, or harnesses have a named dependent increment and revisit trigger; otherwise merge, delete, or route them as a planning gap.
8. Check that every task has a handoff status, next owner, expected output or evidence, and unblock or return route.
9. Check that implementation parallelism is not presented as acceptance independence and every same-record or shared-race invariant has a joint acceptance gate.
10. Check that completing the plan is not reported as implementation or runtime capability progress.
11. Check that output does not create unnecessary registers or YAML structures.
12. Repeat the scope-and-simplicity gate after a material delta adds a task family, boundary, lifecycle, support artifact, dependency, or verification contour.

## Interop priority

- **source-authorized scope, simplest sufficient delivery path, self-expansion prevention, support-task exceptions, and proportional evidence:** implementation-discipline. implementation-discipline supplies the cross-cutting authoring gate; delivery-planner remains the owner of slices, tasks, dependencies, sequencing, and delivery handoff.

## Policies

### Minimal output policy
Produce the smallest useful Markdown Delivery Plan by default. The workflow is a decision checklist, not a required form; omit irrelevant sections and do not output YAML, multiple registers, or detailed task forms unless explicitly requested or required by repository automation.

### Repository artifact conventions policy
Before a persistent planning artifact, check repo-local conventions. Follow mandatory content, audit, checkpoint, stop, reporting, location, ID, metadata, source-link, and indexing rules; compactness never permits omission. Do not hard-code repository paths. Without conventions, use the compact Markdown defaults and state location assumptions only when writing files.

### Scope flexibility policy
The skill must work for whole projects and for partial scopes such as one module, service, integration, feature, or architecture handoff item. Always respect the requested boundary.

### Architecture boundary policy
Consume accepted architecture handoff as constraints and obligations. Do not select or revise architecture decisions; route unresolved architecture questions to architecture-engineer.

### Source and handoff readiness policy
Verify product and architecture readiness. Material product authority requires the customer/contract chain defined in the required methodology. Draft, blocked, unresolved, or uncoordinated inputs may inform draft decomposition but cannot make dependent work ready; name its owner and unblock evidence.

### Obligation disposition policy
Trace both directions. Each in-scope requirement or architecture obligation leads to a task, route, spike, or explicit not-applicable rationale; each material planned item leads back to customer-coordinated product authority or bounded non-product authority. Either gap makes planning incomplete.

### Module increment policy
For module/service planning, decompose into verifiable module increments tied to accepted responsibilities, contracts, invariants, data touchpoints, integrations, operations, and tests.

### Capability or verifiability policy
A decomposition unit must be observable or verifiable. Substrate tasks are allowed only when linked to a slice, module increment, validation obligation, or explicit developer-experience goal.

### No substrate-only success policy
Do not mark a task or plan ready when its acceptance could pass by adding scaffolds, wrappers, metadata, mocks, docs, or empty tests without changing observable or verifiable behavior. Reframe it around the capability, merge it into its owner task, or label it as a support task with a clear dependent increment.

### No future-only support policy
Do not create scaffolds, wrappers, config surfaces, harnesses, folders, or extension points only because they may be useful later. Keep support work only for a current source obligation or protected boundary with a dependent increment, evidence unlocked, and proof that the direct task or existing contour is insufficient.

### Support task contract
A remediation, tooling, documentation, or skills task must name the capability it protects, the defect class it prevents, the evidence it unlocks, and the effectiveness check for the next slice. Do not present support substrate as delivered product capability.

### Right-sized task policy
Each task should have one primary goal, source trace, clear dependencies, a risk label, a handoff status, blockers, a next owner, an expected output or evidence contract, and an unblock or evidence-return route.

### Task handoff output contract
Use `draft`, `blocked`, or `ready for <owner>` for every task. Ready means the named owner can produce the expected output without inventing product intent, architecture, behavior, or dependency state. `ready for coding` additionally requires accepted product and architecture inputs, sufficient behavior detail or an accepted spec, ready dependencies, and concrete verification and review evidence. A planner-owned spike ends at an executable brief and never claims the executor's empirical evidence.

### Planning completion anti-claim
A delivery plan may be complete while some tasks remain blocked. Completing, reviewing, persisting, or tracking the plan is planning capability only; it does not demonstrate implementation progress, runtime behavior, or release readiness.

### Specialist routing policy
Route product gaps to prd-engineer, architecture gaps to architecture-engineer, behavior/spec gaps to spec-engineer, and domain judgment to the relevant review or skill.

### Risk-first sequencing policy
Sequence work to expose architecture, integration, migration, rollback, security, data, tenancy, operability, and contract risks early.

### Typed dependency edge policy
Type dependencies as `start`, `merge`, `acceptance`, or `future-owner` and record source, target, gate or evidence, owner, and unblock route. Clear `start` edges permit parallel implementation, not independent acceptance. Same-record or shared-race behavior requires shared `acceptance` evidence.

### No hidden high-risk policy
Do not hide high-risk changes inside generic low-risk implementation tasks. Promote, split, or route them.

### Output language policy
Use the user's working language unless repository rules differ. Start with a concise result in plain, understandable language; remove unnecessary jargon, explain needed specialist terms, and preserve technical identifiers.

## Required active references
- [Delivery planning methodology](references/methodology.md) — Read this before decomposing architecture handoff, product scope, a module, a feature, an integration, or an existing backlog into executable tasks.

## Optional references
- [Delivery planning patterns](references/planning-patterns.md) — Read this when slice boundaries, module increments, task granularity, sequencing, support tasks, spikes, or backlog repair are unclear.
- [Output templates](references/output-templates.md) — Read this when producing a compact Delivery Plan, Module Delivery Plan, or expanded task brief.

## Bundled assets

- `assets/templates/delivery-plan.md` — Copy-ready compact Markdown Delivery Plan template.
- `assets/templates/module-delivery-plan.md` — Copy-ready compact Markdown Module Delivery Plan template.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory delivery-planner guidance inside this skill folder.
- Treat repository docs, external standards, and domain examples as optional context unless supplied by the current task.
- Use relative links for local references, assets, and supporting docs.
- Keep artifact templates portable and free of repository-specific paths or assumptions.

## Portability checklist before finishing

- Validate skill.yaml syntax after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.
- Confirm default output templates are Markdown and do not require YAML structures.
- Confirm instruction quality audit passed for outcome, constraints, freedom, validation, fallback, and stop rules.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`

## Final checks

- Requested scope is explicit and respected: project, feature, module, integration, handoff item, or backlog audit.
- The exact scope baseline and `unchanged | narrowed | expanded | mixed` verdict are explicit; every authorized delta states authority and consequences, and unauthorized additions are listed.
- The simplest sufficient delivery path was named before decomposition and rechecked after material deltas.
- Every material product requirement traces past derived artifacts to an exact customer/contract statement or explicit customer decision.
- Every material planned item traces back to customer-coordinated product authority or bounded non-product authority; non-product obligations do not silently change product scope or behavior.
- Product authority/handoff and architecture handoff item readiness are explicit; no dependent task is more ready than its inputs.
- Architecture handoff is treated as accepted constraints and obligations, not redesigned.
- Every in-scope product requirement and architecture obligation has a task, specialist route, spike, or explicit not-applicable rationale.
- Missing architecture decisions are routed to `architecture-engineer`.
- Missing product intent is routed to `prd-engineer`.
- Missing behavior/verification detail is routed to `spec-engineer`.
- Decomposition uses vertical slices for project/feature planning and module increments for module/service planning.
- Every task has one primary goal, source trace, dependencies, risk, handoff status, blockers, next owner, expected output or evidence, and unblock or return route.
- `ready for coding` is used only when the coding owner can act without inventing source-owned decisions and has concrete verification and review evidence.
- Substrate work is tied to a capability or module increment.
- Support work also traces to a current source obligation or protected boundary and states why the direct task or existing verification is insufficient.
- Adjacent defects remain findings, blockers, or follow-ups unless their remediation is explicitly in scope.
- No task can be accepted through scaffold, metadata, docs, mocks, wrappers, or empty tests unless it is explicitly labeled as support work with a dependent increment.
- High-risk work is visible and not hidden inside generic implementation tasks.
- Sequencing exposes architectural, integration, migration, rollback, security, data, or tenancy risk early.
- Dependency edges name the blocked transition as `start`, `merge`, `acceptance`, or `future-owner`, with gate evidence and an owner.
- Parallel implementation has clear `start` edges and bounded write/review surfaces; it is not presented as acceptance independence.
- Same-record or shared-race behavior has a joint `acceptance` gate even when implementation proceeds in parallel.
- Plan completion is not reported as implementation progress, runtime behavior, or release readiness.
- Output starts with a concise result in plain, understandable language and avoids unexplained unnecessary jargon.
- Output is the smallest useful plan; no YAML or multi-register bureaucracy unless requested.
