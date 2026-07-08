---
name: architecture-engineer
description: "Design or revise software architecture for AI-agent-driven
  development. Use when a PRD, feature, specification, repository change,
  integration, data change, security concern, deployment change, or
  implementation finding requires architectural judgment: architecturally
  significant requirements, system/component pattern selection, boundaries,
  trade-offs, quality scenarios, spikes, ADRs, and architecture-to-specification
  handoff. This skill creates architectural frames and constraints, not
  implementation task backlogs."
compatibility: Portable documentation-only skill. It ships artifact templates
  but no runtime; all mandatory architecture guidance lives in this folder.
metadata:
  source-version: 0.1.3
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 1a067af385726509abbaf0555182dff87e6492d85e42f46596c375f5ec82c2ff
---

# architecture-engineer

## Start here

1. Determine whether the task actually needs architecture work; do not create architecture artifacts for trivial local implementation work.
2. Separate capability from substrate; architecture must enable observable behavior or clearly label itself as constraints and handoff, not completed capability.
3. Load the smallest sufficient context from PRD, specs, repository instructions, code, tests, migrations, infra, CI, docs, and existing ADRs.
4. Classify scope and risk before choosing patterns.
5. Separate product requirements from implementation choices.
6. Extract architecturally significant requirements and forces.
7. Select the simplest reversible pattern that satisfies current ASR and fits the existing system.
8. Validate high-risk decisions with quality scenarios or bounded spikes.
9. Record only decision rationale that will matter later.
10. Produce architecture-to-spec handoff items, not implementation tickets, and state revisit triggers.

## When to use this skill

- Creating initial architecture after a PRD or feature brief.
- Turning PRD requirements into architecturally significant requirements.
- Choosing system-level patterns such as modular monolith, service-based architecture, microservices, event-driven architecture, CQRS-lite, tenancy model, or deployment topology.
- Choosing component-level patterns for frontend, backend, data, integrations, security, privacy, observability, or delivery safety.
- Designing architecture for a vertical slice before implementation specs.
- Reviewing medium-risk or high-risk specs for architecture consistency.
- Writing pattern decisions, design notes, or ADRs.
- Planning spikes for uncertain architecture choices.
- Creating architecture-to-spec handoff items from architecture decisions.
- Handling implementation feedback that changes boundaries, contracts, data, auth, deployment, observability, or selected patterns.

## When NOT to use this skill

- Writing product requirements where the main issue is users, product scope, success metrics, or rollout; use `prd-engineer`.
- Writing implementation-ready behavior specs for a bounded task when architecture decisions are already known; use `spec-engineer`.
- Implementing code directly when the task is low-risk and unambiguous.
- Producing heavyweight architecture documentation when a short decision note is enough.
- Creating formal safety-critical, regulated, or legal architecture without domain-specific review.
- Making technology choices before requirements, constraints, and architectural forces are explicit.
- Decomposing architecture into implementation tickets, sprint backlog, estimates, or owner assignments.

## Overview

Architecture is a decision layer between PRD and implementation specifications.

```text
PRD / product brief
-> architecture-engineer
-> ASR register, pattern decisions, boundaries, constraints, quality scenarios, handoff items
-> spec-engineer
-> behavior specs, edge cases, verification map, implementation-ready requirements
-> planning / implementation
-> concrete tasks, code, tests, migrations, evidence
```

The architecture agent owns the shape of the system and the reasoning behind it. It does not normally own sprint or task decomposition.

### Capability and substrate

Architecture output is not completed product behavior. It is a frame that lets downstream agents produce and verify behavior without silently reselecting architecture. Treat architecture artifacts, ADRs, handoff items, schemas, queues, wrappers, tests, and docs as substrate unless they are connected to an observable capability later exercised by a user, operator, integration, or runtime.

### Responsibility boundary

This skill produces architecture checks, architecture deltas, ASR registers, system and component pattern decisions, ADRs when justified, architecture briefs, quality scenarios, spike briefs, architecture handoff items, constraints, invariants, validation obligations, and revisit triggers.

This skill does not produce implementation task backlogs, sprint tickets, estimates, owner assignments, full behavior-level implementation specs, or exact file/class/function names unless the architecture itself requires them.

Allowed exception: the skill may identify architecture workstreams or spec candidates such as "credential lifecycle/security spec", "OAuth callback idempotency spec", or "initial sync worker behavior spec". These are handoff items, not implementation tasks.

### Definitions

| Term | Meaning |
| --- | --- |
| PRD requirement | Product-level statement of intended user/system capability, outcome, constraint, success metric, or acceptance. |
| ASR | Architecturally Significant Requirement: a requirement that changes system structure, component boundaries, data, contracts, deployment, security, reliability, cost, or operations. |
| ASR register | Compact list of ASR. It is not a task backlog; it records architecture-shaping requirements, evidence, risk, confidence, and validation. |
| Force | Pressure that drives architecture choice: latency, throughput, consistency, coupling, volatility, failure mode, team topology, cost, security, privacy, or operability. |
| Pattern decision | Lightweight record of a selected system or component pattern and its trade-offs. |
| ADR | Architectural Decision Record for significant, hard-to-reverse, disputed, public, or long-lived decisions. |
| Architecture brief | Compact artifact that summarizes context, ASR, decisions, component architecture, quality scenarios, risks, and architecture handoff. |
| Architecture delta | Small note describing how a medium/high-risk task changes existing architecture. |
| Architecture handoff item | Architecture-to-spec item carrying intent, constraints, acceptance constraints, validation obligations, and non-prescribed details to the next stage. It is not an implementation task. |
| Quality scenario | Testable scenario for a quality attribute such as latency, availability, recoverability, security, privacy, or operability. |
| Spike | Bounded investigation that produces evidence for an uncertain architecture decision. |
| Implementation backlog | Downstream planning artifact created after architecture and specs. This skill may influence it but does not generate it. |

### Input contract

Use any available source material, but identify its authority and reliability. Acceptable inputs include PRD or product brief, issue/task description, existing spec, architecture docs or ADRs, repository code and tests, API/schema/migration files, CI/CD and infra configuration, production constraints or incident history, and user-provided design preferences or constraints.

Minimum useful input for architecture work is the target capability or change, affected system/component, known constraints, risk level or enough information to classify risk, and source of authority for requirements. If information is incomplete, proceed with explicit assumptions unless the missing information can change a high-risk decision such as auth, tenant isolation, billing, public API, data migration, secrets, deployment topology, or external dependency.

### Right-sized rigor

Use the smallest artifact that prevents wrong implementation:

| Situation | Minimum output |
| --- | --- |
| Low-risk local change | No architecture artifact, or one inline architecture check if an assumption matters |
| Medium-risk component/API/data/integration change | Architecture delta or pattern decision, plus architecture handoff item if specs are needed |
| High-risk auth/data/security/migration/infra/vendor decision | Design note or ADR, quality scenarios, validation and rollback/migration notes |
| New system or major redesign | Architecture brief, ASR register, pattern decisions, spikes, architecture handoff register |
| Uncertain architecture choice | Spike brief and validation plan before final ADR |

Criticality overrides size. A small permission rule, idempotency rule, data deletion path, or migration may require high-rigor architecture treatment.

## Workflow stages

### Workflow stage: Classify architecture need

Avoid both under-design and ceremony by identifying architectural impact, scope, risk, and the smallest useful output.

1. Identify whether the task changes component boundaries, public contracts, persistent data, auth/security, tenant isolation, integration topology, deployment, observability, cost, or operability.
2. Classify scope as code-level, component-level, container-level, system-level, or organization-level.
3. Classify risk as low, medium, or high; criticality overrides size.
4. Choose output depth from the right-sized rigor table in the methodology reference.

Validation:

- Low-risk tasks are not forced through architecture ceremony.
- Medium/high-risk tasks cannot proceed without architecture context.
- Small but critical tasks are escalated when blast radius is high.

### Workflow stage: Load context and evidence

Prevent architecture guesses by grounding claims in source material, repository conventions, or explicit assumptions.

1. For existing systems, inspect project instructions, relevant docs, existing ADRs, scripts, CI/CD, deployment, infra, schemas, migrations, API contracts, routes, tests, and affected code.
2. For greenfield work, inspect PRD or product brief, users, core scenarios, product metrics, non-goals, runtime, platform, team, cost, compliance, and delivery constraints.
3. Identify source authority, reliability, confidence, and missing evidence before selecting patterns.

Validation:

- Architecture claims are linked to evidence, source material, or explicit assumptions.
- Existing repo conventions are known before proposing new patterns.
- Missing context is labeled by confidence and validation method.

### Workflow stage: Normalize architecture-relevant requirements

Translate product or task input into architecture-ready requirements without rewriting the whole PRD.

1. Identify the product requirement or task capability.
2. Separate requirement from implementation choice; turn technology suggestions into the force they are meant to satisfy unless externally mandated.
3. Capture actor, trigger, main flow, edge cases, out of scope, acceptance, metric, priority, and source where they affect architecture.
4. Mark missing NFR targets as TBD instead of inventing them.

Validation:

- Each architecture-relevant requirement traces to PRD, spec, issue, code, policy, or explicit assumption.
- Requirements do not silently prescribe technology without rationale.
- Open questions are separated into blocking, non-blocking, and validation gaps.

### Workflow stage: Extract ASR and forces

Identify what actually shapes the system and what validation each force needs.

1. Extract ASR for performance, availability, recoverability, security, privacy, data consistency, integrations, evolvability, operations, cost, and delivery.
2. Map each ASR to concrete forces such as latency, throughput, consistency, coupling, volatility, failure mode, team topology, cost, security, privacy, or operability.
3. Estimate architectural risk and confidence.
4. Identify whether each ASR requires a spike, pattern decision, ADR, quality scenario, or only a handoff constraint.

Validation:

- ASR register is shorter than the full requirement list.
- Each ASR explains why architecture shape is affected.
- Forces are specific enough to guide pattern choice.
- ASR records do not prescribe tasks; they describe architecture-shaping requirements.

### Workflow stage: Generate, score, and select patterns

Compare credible options before selecting the simplest reversible pattern that satisfies the ASR.

1. Determine decision scope before comparing options; do not lift a local choice to system-level unless ASR forces it.
2. Create at least two candidates for significant decisions and include the simplest baseline unless it clearly cannot satisfy ASR.
3. Score significant decisions using ASR fit, simplicity, reversibility, codebase fit, team/ops fit, failure visibility, security/privacy fit, and cost fit.
4. Use tie-breakers: simpler option, more reversible option under uncertainty, more observable option when failures matter, and existing conventions unless they conflict with ASR.

Validation:

- Candidate set includes alternatives with different trade-offs.
- Candidate patterns are selected because of forces, not naming preference.
- Alternatives are not strawmen; selected pattern has rationale, consequences, confidence, and revisit triggers.

### Workflow stage: Validate with quality scenarios or spikes

Avoid false confidence for high-risk or weak-evidence decisions.

1. Use quality scenarios for known quality attributes such as latency, availability, recoverability, security, privacy, consistency, or operability.
2. Use spikes for unknown feasibility and keep each spike tied to a decision it will unblock.
3. Do not write a final ADR before a necessary spike produces evidence.

Validation:

- High-risk ASR has at least one scenario or explicit validation path.
- Spike has a bounded question, success criteria, and expected output.
- Validation focuses on the ASR that drove the pattern, not only generic CI success.

### Workflow stage: Record decisions and produce handoff

Preserve useful rationale and transfer constraints to `spec-engineer` without creating implementation tickets.

1. Choose decision record weight: inline note, pattern decision, or ADR.
2. Include alternatives, consequences, validation, migration or rollback considerations, confidence, and revisit triggers when the decision weight requires them.
3. Produce architecture handoff items for constraints, invariants, validation obligations, rollback/migration considerations, documentation obligations, or spec candidates.
4. Use `not_prescribed` when the architecture intentionally leaves implementation freedom.

Validation:

- ADR exists only when decision weight justifies it.
- Handoff items are clearly not implementation tasks.
- `spec-engineer` can write behavior-level specs without reselecting architecture patterns.

### Workflow stage: Review and revisit

Keep architecture current without rewriting docs unnecessarily.

1. Revisit architecture when spec changes boundaries, data, public contracts, auth, tenancy, deployment, or external dependencies.
2. Revisit when implementation reveals drift, a spike invalidates an assumption, an ASR quality gate fails, production incidents expose a wrong assumption, or an ADR revisit trigger fires.
3. Update only the artifact whose decision changed: PRD for product scope, ASR register or brief for new forces, pattern decision or ADR for decision change, spec for behavior change, architecture delta for invariant-preservation failure.

Validation:

- Architecture documents change only when decisions change.
- Stale ADRs are superseded or revisited when triggers fire.
- Retro output produces a concrete improvement or an explicit no-op rationale.

## Interop priority

- **product requirements, success metrics, scope, non-goals, rollout, and product-level acceptance:** prd-engineer. architecture-engineer consumes PRD material and extracts ASR; it does not own product discovery or product scope.
- **ASR extraction, architecture forces, pattern selection, boundaries, trade-offs, ADRs, design notes, and architecture-to-spec handoff:** architecture-engineer. this skill owns architecture frames and constraints before behavior-level specs are written.
- **behavior-level implementation specifications, atomic normative requirements, edge cases, falsifiers, and verification maps:** spec-engineer. architecture-engineer hands off constraints and obligations; spec-engineer turns them into implementation-ready behavior specs.
- **framework, security, data, ML, infrastructure, regulatory, or product-domain facts:** the relevant domain skill. domain skills own specialized technical facts; architecture-engineer uses them to choose patterns and constraints.
- **implementation backlog, sequencing, estimates, and ticket structure:** planning or implementation workflow stages. architecture-engineer may identify workstreams or spec candidates, but must not emit task backlogs.

## Gotchas

- **high** — Pattern name chasing selects microservices, CQRS, event sourcing, GraphQL, or edge runtime by popularity rather than ASR.
- **high** — Premature distribution splits services without team topology, scaling, reliability, or ownership reason.
- **high** — Do not treat unknown latency, throughput, provider behavior, data sensitivity, or team capacity as known.
- **high** — ADR theater means writing ADRs for every minor choice or writing final ADRs before evidence exists.
- **high** — Do not design data, API, or integration first and check auth, tenant isolation, secrets, or audit later.
- **high** — Async without idempotency adds queues or retries without dedupe, ordering, poison-message handling, observability, or DLQ.
- **high** — Caching without freshness adds cache without invalidation, consistency expectations, and freshness SLO.
- **high** — Handoff as task backlog writes implementation tickets under architecture output instead of constraints and spec candidates.
- **medium** — Do not let task specs choose a new data model or integration pattern without architecture delta.
- **medium** — One big architecture document that does not affect decisions, tests, or handoff obligations is noise.
- **medium** — Do not introduce new layering, framework, or naming style without checking existing code.
- **medium** — Quality gates are weak when CI passes but does not validate the scenario that drove the pattern.
- **medium** — Improving one component while violating system-level constraints is a local optimum, not good architecture.
- **high** — Treat route namespaces, privileged data paths, universal event-payload shape, service-role use, and cross-slice validation behavior as architecture-boundary decisions, not local implementation details.

## Policies

### Evidence-first policy
Do not present architecture assumptions as facts. Link claims to PRD, repository evidence, existing docs, code, tests, constraints, or explicit assumptions with confidence.

### Requirements-before-patterns policy
Do not select technology or architecture patterns until requirements, ASR, and forces are explicit enough to justify the choice.

### Minimum sufficient architecture policy
Prefer the smallest architecture artifact and simplest pattern that prevents material implementation mistakes and satisfies current ASR.

### Reversibility policy
When alternatives have similar ASR fit, choose the more reversible option. For hard-to-reverse choices, record consequences, migration path, and revisit triggers.

### Existing-system fit policy
Respect existing repository conventions unless they conflict with requirements or create unacceptable risk. Do not introduce a cleaner pattern that fragments the codebase without a requirement-driven reason.

### Repository artifact conventions policy
For persistent architecture artifacts, first discover repo-local conventions from AGENTS.md, README, CONTRIBUTING, or linked docs. Use them for location, IDs/prefixes, metadata, source/related links, and index updates; never hard-code repo paths. If none exist, use existing templates and state path assumptions only when writing files.

### Spike-before-commitment policy
When a high-risk decision depends on missing evidence, propose a bounded spike before writing a final ADR.

### Architecture-to-spec handoff policy
Every significant architecture decision must produce clear constraints, invariants, validation obligations, rollback/migration considerations, or documentation obligations for the next stage.

### Contract boundary note policy
When a design changes a public API route family, privileged persistence path, shared event/history model, or validation/data-quality boundary, create or update the narrowest architecture or contract note before downstream implementation.

### No task backlog policy
Do not emit implementation tickets from this skill. Use `architecture_handoff_item` for downstream spec candidates or obligations. Leave task decomposition to `spec-engineer`, planning, or implementation workflow stages.

### Lightweight traceability policy
Use short ID chains for medium/high-risk work: PRD requirement -> ASR -> pattern decision/ADR -> architecture handoff item -> spec requirement -> acceptance/verification.

### Output language policy
Use the user's working language unless repository conventions require another language. Keep stable technical identifiers in the repository language when needed.

### Stop or escalation rules
Ask one focused question or mark human review required when:

- product requirements conflict in a way that changes architecture;
- implementation would require choosing between incompatible security, privacy, compliance, data-loss, or compatibility outcomes;
- a public API, identity model, tenant isolation model, data model, migration strategy, secrets handling, or deployment topology would change;
- a new paid or operationally significant external dependency is introduced;
- a required external contract is missing and cannot be inferred safely;
- the architecture would weaken rollback, observability, audit, or security posture.

For non-blocking gaps, proceed with assumptions and validation steps.

### Output contract
For architecture work, return the smallest complete subset that fits the risk. A low-risk task may need only an architecture check; medium-risk work usually needs an architecture delta or pattern decision plus handoff; high-risk decisions need ASR, candidate comparison, quality scenarios or spikes, validation and rollback/migration notes, and an ADR only when justified.

## Required active references
- [Architecture methodology](references/methodology.md) — Read this before medium/high-risk architecture work, ASR extraction, pattern selection, decision records, quality scenarios, spikes, or architecture-to-spec handoff.

## Optional references
- [Artifact templates](references/artifact-templates.md) — Read this when producing an architecture check, delta, ASR register, pattern decision, ADR, quality scenario, spike brief, architecture brief, or handoff item/register.
- [Pattern catalog](references/pattern-catalog.md) — Read this when architecture forces require comparing system, frontend, backend, data, integration, security, privacy, observability, deployment, or delivery-safety patterns.

## Bundled assets

- `assets/templates/architecture-check.md` — Copy-ready template for a low-risk architecture check.
- `assets/templates/architecture-delta.md` — Copy-ready template for a medium-risk architecture delta.
- `assets/templates/architecture-brief.md` — Copy-ready template for a new-system or major-redesign architecture brief.
- `assets/templates/asr-record.yaml` — Copy-ready template for an architecturally significant requirement record.
- `assets/templates/pattern-decision.md` — Copy-ready template for a lightweight pattern decision.
- `assets/templates/adr.md` — Copy-ready template for an Architectural Decision Record.
- `assets/templates/quality-scenario.md` — Copy-ready template for a quality scenario.
- `assets/templates/spike-brief.md` — Copy-ready template for a bounded architecture spike.
- `assets/templates/architecture-handoff-item.yaml` — Copy-ready template for a single architecture-to-spec handoff item.
- `assets/templates/architecture-handoff-register.yaml` — Copy-ready template for multiple architecture-to-spec handoff items.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory architecture-engineer guidance inside this skill folder.
- Treat external standards, examples, and repository docs as optional context unless the current task supplies them.
- Use relative links for local references, assets, and supporting docs.
- Keep artifact templates portable and free of repository-specific paths or assumptions.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.
- Confirm the artifact templates listed as assets are present and usable without external files.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`

## Final checks

- Product requirements are separated from implementation choices.
- Capability and substrate are not conflated.
- ASR are explicit and linked to evidence.
- Scope and risk classification are stated.
- Candidate patterns were considered for significant decisions.
- Selected pattern is the simplest reversible option that satisfies ASR.
- Alternatives, consequences, confidence, and revisit triggers are visible.
- High-risk decisions have quality scenarios, spikes, or validation plan.
- Data, API, auth, tenant isolation, integration, deployment, and observability implications are covered when relevant.
- Decision weight is appropriate: inline note, pattern decision, or ADR.
- Architecture output produces architecture-to-spec handoff, not implementation task backlog.
- Handoff items use `architecture_handoff_item`, not task-backlog naming.
