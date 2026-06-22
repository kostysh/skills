---
name: delivery-planner
description: Decompose accepted product scope and architecture handoff into
  right-sized executable work for AI-agent implementation. Use for whole-project
  planning, feature planning, module/service planning, integration planning,
  architecture-handoff-item breakdown, sequencing, risk-aware task creation, and
  routing to prd-engineer, architecture-engineer, spec-engineer, domain review,
  or coding. Default output is one compact Markdown Delivery Plan, not a rigid
  workflow or set of YAML registers.
compatibility: Portable documentation-only skill. All mandatory
  delivery-planning guidance lives in this folder.
metadata:
  source-version: 0.2.4
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: a939d7d0ed83fa5e377387077d7eaa6c6de0a292b87f4a13da3187dc8c8ca6d2
---

# delivery-planner

## Start here

1. Identify the requested planning scope before decomposing anything; support whole project, feature, module/service, integration, specific architecture handoff item, or backlog audit.
2. Use accepted product scope and architecture handoff as source authority; do not invent requirements or architecture decisions.
3. For project/feature planning, create vertical slices around observable capabilities.
4. For module/service planning, create module increments around accepted responsibilities, boundaries, contracts, invariants, integrations, and verification hooks.
5. Treat the workflow as decision guidance, not a mandatory procedure; skip irrelevant detail when a compact plan is enough.
6. Convert architecture handoff obligations into tasks, support tasks, spikes, or specialist routes; do not treat the handoff itself as a task list.
7. Before creating or recommending a persistent delivery plan, module delivery plan, task brief, or backlog audit artifact, check whether the current repository defines artifact conventions and follow them when present.
8. Produce one compact Markdown Delivery Plan by default; do not output YAML or multiple registers unless explicitly requested.
9. Route product gaps to prd-engineer, architecture gaps to architecture-engineer, and behavior/specification gaps to spec-engineer.
10. Sequence work to expose architectural, integration, migration, rollback, security, data, tenancy, and operability risk early.
11. Reject tasks whose acceptance can pass through scaffold, metadata, docs, mocks, or wrappers without real observable or verifiable behavior.
12. Reject future-only support tasks unless they name the owner slice/module increment, the evidence they unlock, and the trigger that makes them necessary.

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

1. Classify scope as project, feature, module/service, integration, handoff item, or backlog audit.
2. Identify included and excluded areas.
3. Select compact output mode unless a deeper mode is explicitly required.
4. Use explicit assumptions for non-blocking gaps instead of escalating every unknown.

### Workflow stage: Intake and authority check

Identify authoritative product, architecture, spec, repository, and code inputs.

1. Load PRD or product brief when product scope matters.
2. Load architecture handoff when boundaries, contracts, data, security, deployment, or operations matter.
3. Load existing specs and repo instructions when available.
4. Classify gaps as blocking or non-blocking and route blocking gaps to the responsible skill.

### Workflow stage: Convert architecture handoff into delivery work

Turn accepted architecture obligations into tasks without redesigning architecture.

1. Extract boundaries, contracts, data constraints, security constraints, operational obligations, integration points, validation obligations, risks, and revisit triggers.
2. Map each obligation to a vertical slice, module increment, support task, spike, or specialist route.
3. Route unresolved architecture choices to architecture-engineer.

### Workflow stage: Create slices or module increments

Decompose around observable or verifiable outcomes.

1. Use vertical slices for project and feature planning.
2. Use module increments for module, service, adapter, or subsystem planning.
3. Tie substrate work to a named capability, module increment, validation obligation, or explicit developer-experience goal.
4. Merge or delete layer-only and future-only tasks when they cannot produce independent evidence of progress.
5. For valid support tasks, name the owner outcome and the evidence the substrate unlocks.

### Workflow stage: Create compact task briefs

Create executable planning-level tasks without writing full specs.

1. Give each task one primary goal.
2. Include scope, out-of-scope, dependencies, risk, next step, verification hint, and review hint.
3. Split only when risk, dependency order, review path, or verification evidence requires it.
4. Route detailed behavior to spec-engineer instead of inventing it.

### Workflow stage: Sequence and parallelize safely

Expose risk early and avoid parallel work on unstable assumptions.

1. Put clarifications, spikes, harnesses, and contract stabilization before dependent implementation.
2. Parallelize only tasks with stable dependencies and independent review paths.
3. Make blockers explicit.

### Workflow stage: Planning audit

Ensure the plan is useful, compact, scope-respecting, and safe for downstream agents.

1. Check that architecture was not redesigned.
2. Check that high-risk work is visible.
3. Check that acceptance cannot be satisfied by substrate-only work unless the task is explicitly substrate or developer-experience work.
4. Check that future scaffolds, wrappers, config, or harnesses have a named dependent increment and revisit trigger; otherwise merge, delete, or route them as a planning gap.
5. Check that every task has verification direction.
6. Check that output does not create unnecessary registers or YAML structures.

## Policies

### Minimal output policy
Produce the smallest useful Markdown Delivery Plan by default. The workflow is a decision checklist, not a required form; omit irrelevant sections and do not output YAML, multiple registers, or detailed task forms unless explicitly requested or required by repository automation.

### Repository artifact conventions policy
When producing or recommending a persistent delivery plan, module delivery plan, expanded task brief, or backlog audit in a repository, first check repo-local artifact conventions through AGENTS.md, README, CONTRIBUTING, or docs linked from them. If conventions exist, follow them for artifact location, delivery-plan and module-plan IDs, task-brief persistence rules, metadata/front matter, source links, related artifact links, and module index updates. Do not hard-code one repository's paths into this skill. If no conventions exist, use this skill's compact Markdown defaults and state any location assumption only when writing files.

### Scope flexibility policy
The skill must work for whole projects and for partial scopes such as one module, service, integration, feature, or architecture handoff item. Always respect the requested boundary.

### Architecture boundary policy
Consume accepted architecture handoff as constraints and obligations. Do not select or revise architecture decisions; route unresolved architecture questions to architecture-engineer.

### Module increment policy
For module/service planning, decompose into verifiable module increments tied to accepted responsibilities, contracts, invariants, data touchpoints, integrations, operations, and tests.

### Capability or verifiability policy
A decomposition unit must be observable or verifiable. Substrate tasks are allowed only when linked to a slice, module increment, validation obligation, or explicit developer-experience goal.

### No substrate-only success policy
Do not mark a task or plan ready when its acceptance could pass by adding scaffolds, wrappers, metadata, mocks, docs, or empty tests without changing observable or verifiable behavior. Reframe it around the capability, merge it into its owner task, or label it as a support task with a clear dependent increment.

### No future-only support policy
Do not create tasks for scaffolds, wrappers, config surfaces, harnesses, folders, or extension points only because they may be useful later. Keep them out, merge them into the owner increment, or label them as support work with a concrete dependent increment, evidence unlocked, and revisit trigger.

### Right-sized task policy
Each task should have one primary goal, clear dependencies, a risk label, a next step, a verification hint, and a review hint.

### Specialist routing policy
Route product gaps to prd-engineer, architecture gaps to architecture-engineer, behavior/spec gaps to spec-engineer, and domain judgment to the relevant review or skill.

### Risk-first sequencing policy
Sequence work to expose architecture, integration, migration, rollback, security, data, tenancy, operability, and contract risks early.

### No hidden high-risk policy
Do not hide high-risk changes inside generic low-risk implementation tasks. Promote, split, or route them.

### Output language policy
Use the user's working language unless repository conventions require another language. Keep stable IDs and file names in the repository language when needed.

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
- Architecture handoff is treated as accepted constraints and obligations, not redesigned.
- Missing architecture decisions are routed to `architecture-engineer`.
- Missing product intent is routed to `prd-engineer`.
- Missing behavior/verification detail is routed to `spec-engineer`.
- Decomposition uses vertical slices for project/feature planning and module increments for module/service planning.
- Every task has one primary goal, dependencies, risk, next step, verification hint, and review hint.
- Substrate work is tied to a capability or module increment.
- No task can be accepted through scaffold, metadata, docs, mocks, wrappers, or empty tests unless it is explicitly labeled as support work with a dependent increment.
- High-risk work is visible and not hidden inside generic implementation tasks.
- Sequencing exposes architectural, integration, migration, rollback, security, data, or tenancy risk early.
- Parallel work depends only on stable contracts and independent review paths.
- Output is the smallest useful plan; no YAML or multi-register bureaucracy unless requested.
