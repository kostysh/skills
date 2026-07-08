# Architecture methodology

This reference is the active detailed method for `architecture-engineer`. Use it to preserve the original skill behavior while keeping `SKILL.md` short.

## Generated artifacts

Generate the smallest sufficient subset. Do not emit every artifact by default.

| Artifact | Purpose | Use when |
| --- | --- | --- |
| Architecture check | Confirms no architecture work is needed or that risk is low | Low-risk local change |
| Architecture delta | Describes a bounded change to existing architecture | Medium-risk component/API/data/integration change |
| ASR register | Lists requirements that shape architecture | Medium/high-risk changes or new systems |
| Pattern decision | Records selected pattern and alternatives | Meaningful pattern choice with future relevance |
| ADR | Records hard-to-reverse or disputed decision | Public API, data ownership, auth, tenancy, deployment, vendor, migration, security, or long-lived choice |
| Quality scenario | Makes a quality attribute testable | Reliability, performance, security, privacy, consistency, recoverability, or operability matters |
| Spike brief | Defines bounded investigation | Missing evidence blocks or weakens a decision |
| Architecture brief | Gives complete architecture frame | New system, major redesign, or large vertical slice |
| Architecture handoff item/register | Transfers constraints to downstream specs | Any non-trivial architecture decision |
| Revisit trigger list | Defines when to reopen a decision | Uncertain, evolving, or high-impact decisions |

## Workflow stage: Classify architecture need

Goal: avoid both under-design and ceremony.

1. Identify whether the task changes component boundaries, public contracts, persistent data, auth/security, tenant isolation, integration topology, deployment, observability, cost, or operability.
2. Classify scope: code-level, component-level, container-level, system-level, or organization-level.
3. Classify risk: low, medium, or high.
4. Choose output depth from the right-sized rigor table in `SKILL.md`.

Validation:

- Low-risk tasks are not forced through architecture ceremony.
- Medium/high-risk tasks cannot proceed without architecture context.
- Small but critical tasks are escalated when the blast radius is high.

## Workflow stage: Load context and evidence

Goal: prevent architecture guesses.

For an existing repository:

1. Read project instructions such as `AGENTS.md`.
2. Inspect relevant README, docs, architecture notes, and ADRs.
3. Inspect package scripts, CI/CD, deployment, and infra configuration when relevant.
4. Inspect schema, migrations, ORM models, API routes, contracts, and tests for affected components.
5. Identify existing conventions that the new design should preserve.

For greenfield:

1. Read PRD or product brief.
2. Identify users, core scenarios, product metrics, and non-goals.
3. Extract runtime, platform, team, cost, compliance, and delivery constraints.
4. Capture MVP/beta/GA scope when available.

Validation:

- Architecture claims are linked to evidence, source material, or explicit assumptions.
- Existing repo conventions are known before proposing new patterns.
- Missing context is labeled by confidence and validation method.

## Workflow stage: Normalize architecture-relevant requirements

Goal: translate product requirements into architecture-ready inputs without rewriting the whole PRD.

1. Identify the product requirement or task capability.
2. Separate requirement from implementation choice. For example, "use Kafka" becomes "asynchronous decoupling, throughput, auditability, or team ownership requirement" unless Kafka is externally mandated.
3. Capture actor, trigger, main flow, edge cases, out of scope, acceptance, metric, priority, and source where they affect architecture.
4. Mark missing NFR targets as TBD instead of inventing them.

Validation:

- Each architecture-relevant requirement can be traced to PRD, spec, issue, code, policy, or explicit assumption.
- Requirements do not silently prescribe technology without rationale.
- Open questions are separated into blocking, non-blocking, and validation gaps.

## Workflow stage: Extract ASR and forces

Goal: identify what actually shapes the system.

1. Extract ASR for performance, availability, recoverability, security, privacy, data consistency, integrations, evolvability, operations, cost, and delivery.
2. Map each ASR to forces.
3. Estimate architectural risk and confidence.
4. Identify whether the ASR requires a spike, pattern decision, or ADR.

Validation:

- ASR register is shorter than the full requirement list.
- Each ASR explains why architecture shape is affected.
- Forces are specific enough to guide pattern choice.
- ASR records do not prescribe tasks; they describe architecture-shaping requirements.

ASR record shape:

```yaml
asr:
  id: ASR-INT-1
  requirement: "External provider failures must not block unrelated workspace workflows"
  forces:
    - integration failure isolation
    - retry and idempotency
    - degraded mode
  architectural_risk: high
  evidence: "PRD-NFR2 and integration task"
  confidence: medium
  validation: "provider failure integration test and retry/idempotency spike"
```

Use the copy-ready file `assets/templates/asr-record.yaml` when the final output needs an ASR record.

## Workflow stage: Determine decision scope

Goal: choose the right architectural level.

| Scope | Use when | Example output |
| --- | --- | --- |
| Code-level | Function or local module behavior only | No architecture record unless high criticality |
| Component-level | Frontend module, backend module, adapter, repository, worker | Pattern decision or architecture delta |
| Container-level | Web app, API service, worker, database, cache, object storage | Architecture brief section, possibly ADR |
| System-level | Monolith/services, event-driven topology, tenancy, regional model | ADR/design note and quality scenarios |
| Organization-level | Ownership, on-call, platform capability, release model | Architecture/process decision with owner |

Validation:

- The decision is not lifted to system-level unless ASR forces it.
- Public API, data, auth, tenancy, and deployment decisions are not treated as local code choices.
- Route namespaces, privileged persistence paths, shared event/history models, service-role use, and cross-slice validation or data-quality boundaries are treated as architecture-boundary decisions.
- When a design changes a public route family, privileged persistence path, shared event model, or validation boundary, create or update the narrowest architecture or contract note before downstream implementation.

## Workflow stage: Generate candidate patterns

Goal: compare credible options before selecting a pattern.

1. Create at least two candidates for significant decisions.
2. Include the simplest baseline as one candidate unless it clearly cannot satisfy ASR.
3. Treat one-implementation interfaces, providers, wrappers, config layers, and adapters as suspect unless a current boundary, contract, validation obligation, migration path, plugin point, or second implementation justifies them.
4. Include future evolution path when choosing a simpler current pattern.
5. Reject fashionable patterns when the forces do not justify them.

Candidate pattern families:

| Force | Candidate patterns |
| --- | --- |
| Unstable domain boundaries | modular monolith, vertical slice architecture, hexagonal boundaries |
| Independent teams/releases | service-based architecture, microservices, API contracts, contract tests |
| High read load | caching, read models, materialized views, CQRS-lite |
| Async external workflow | queue, outbox, process manager, saga, event-driven integration |
| Strict audit/history | append-only audit log, event log, event sourcing when state reconstruction is required |
| Enterprise tenant isolation | RBAC/ABAC, tenant-scoped data access, schema-per-tenant, DB-per-tenant where justified |
| Low operations capacity | managed services, simple deploy topology, modular monolith |
| Edge latency | CDN, edge rendering, stateless edge functions, regional cache |
| Provider failures | retry, idempotency, circuit breaker, DLQ, degraded UX |
| Frequent UI change | design system, route-level composition, server-state separation, feature flags |

Read [Pattern catalog](pattern-catalog.md) when the force requires component-specific comparison.

Validation:

- Candidate set includes alternatives with different trade-offs.
- Candidate patterns are selected because of forces, not naming preference.
- Overly complex candidates are rejected with explicit rationale.
- Single-implementation abstractions are rejected, labeled `not_prescribed`, or justified by a current architecture force.

## Workflow stage: Score and select patterns

Goal: select a pattern using explicit trade-offs.

Use this matrix for significant decisions only:

| Criterion | Score 0 | Score 1 | Score 2 | Score 3 |
| --- | --- | --- | --- | --- |
| ASR fit | Does not satisfy ASR | Partially satisfies | Satisfies main ASR | Satisfies ASR with clear validation |
| Simplicity | Too many moving parts | High complexity | Moderate complexity | Simple and understandable |
| Reversibility | Hard to reverse | Costly migration | Reversible with planned migration | Easy to change later |
| Codebase fit | Conflicts with repo | Requires major rewrite | Fits with adjustments | Fits existing conventions |
| Team/ops fit | Team cannot operate | Requires major maturity increase | Realistic with effort | Matches current maturity |
| Failure visibility | Failures hidden | Requires new tooling | Observable with work | Naturally diagnosable |
| Security/privacy fit | Creates unacceptable risk | Requires complex mitigation | Risk manageable | Improves risk posture |
| Cost fit | Cost unacceptable | Cost unclear | Cost controllable | Cost well aligned |

Tie-breakers:

1. Prefer simpler option when ASR fit is similar.
2. Prefer more reversible option under uncertainty.
3. Prefer more observable option when failure modes matter.
4. Prefer existing conventions unless they conflict with ASR.
5. Use ADR for hard-to-reverse decisions.

Validation:

- Selected pattern has clear rationale and known consequences.
- Alternatives are not strawman options.
- Confidence and revisit triggers are explicit.

## Workflow stage: Validate with quality scenarios or spikes

Goal: avoid false confidence.

Use quality scenarios for known quality attributes. Use spikes for unknown feasibility.

Quality scenario shape:

```md
### Quality scenario: Provider outage during checkout

- Source: external payment provider
- Stimulus: provider returns 5xx for 10 minutes
- Environment: production, normal traffic
- Artifact: checkout API and payment worker
- Response: order enters retryable pending state; user receives non-fatal status; retry worker uses bounded backoff; exhausted attempts are visible
- Response measure: no lost orders, no duplicate payment transactions, alert appears within 5 minutes
- Validation: provider stub integration test, idempotency test, runbook review
```

Spike shape:

```md
# Spike: Search index freshness for dashboard queries

## Question
Can a materialized read model meet dashboard freshness requirements without introducing full CQRS/event-sourcing complexity?

## Scope
Build a minimal index update path for one dashboard metric and measure update delay under expected beta load.

## Success criteria
Freshness stays within the PRD target for 95% of updates and rollback to direct query path remains possible.

## Output
Evidence, recommended pattern, rejected alternatives, follow-up decision.
```

Use `assets/templates/quality-scenario.md` and `assets/templates/spike-brief.md` for copy-ready versions.

Validation:

- High-risk ASR has at least one scenario or explicit validation path.
- Spike has a bounded question and decision it will unblock.
- ADR is not written as final before a necessary spike produces evidence.

## Workflow stage: Record the decision

Goal: preserve rationale without creating bureaucracy.

| Level | Use when | Artifact |
| --- | --- | --- |
| Inline note | Local, reversible, low blast radius | PR/task note |
| Pattern decision | Component or multi-module pattern with future relevance | Architecture brief or pattern decision record |
| ADR | Hard-to-reverse, public, controversial, high-risk, or long-lived decision | ADR |

Pattern decision shape:

```md
# Pattern decision: Queued CRM initial sync worker

- Decision ID: PD-003
- Status: proposed
- Scope: integrations component
- Linked requirements: PRD-R7, PRD-NFR2
- Linked ASR: ASR-INT-1, ASR-SEC-1
- Selected pattern: adapter plus queued background worker
- Alternatives considered:
  - synchronous callback sync
  - full event-driven integration platform
- Rationale:
  - isolates provider failures;
  - gives retry and idempotency control;
  - fits existing integrations module;
  - preserves path to future integration platform.
- Consequences:
  - requires worker observability and retry policy;
  - callback no longer proves sync completion.
- Validation:
  - provider failure integration test;
  - duplicate callback idempotency test;
  - token redaction inspection.
- Revisit triggers:
  - multiple providers need shared routing;
  - sync volume exceeds worker capacity;
  - PRD introduces two-way sync.
```

ADR shape:

```md
# ADR-002: Store provider credentials in backend-owned encrypted records

## Status
Proposed

## Context
Workspace admins connect provider accounts through OAuth. Tokens are sensitive secrets. Frontend token exposure would expand the trust boundary and complicate redaction. Existing integrations module owns provider adapters.

## Decision
Provider access and refresh tokens will be stored only in backend-owned encrypted credential records. Frontend clients receive connection status and provider metadata, never token values.

## Alternatives considered
- Frontend-accessible token state. Rejected because it exposes secrets to client surface.
- Generic workspace settings storage. Rejected because ownership and redaction boundaries become unclear.

## Consequences
- Positive: narrow trust boundary, easier audit, simpler redaction guarantees.
- Negative: requires encryption key management and credential lifecycle operations.

## Validation
- API response inspection for token absence.
- Log, trace and analytics redaction checks.
- Integration tests for credential use inside integrations module only.

## Revisit triggers
- Enterprise customers require customer-managed keys.
- Provider token rotation rules require dedicated secret storage service.
```

Use `assets/templates/pattern-decision.md` or `assets/templates/adr.md` for copy-ready versions.

Validation:

- ADR exists only when decision weight justifies it.
- Decision record includes alternatives, consequences, validation, and revisit triggers.
- Pattern decision does not claim more certainty than evidence supports.

## Workflow stage: Produce architecture-to-spec handoff

Goal: make architecture usable by the next stage without turning it into task decomposition.

The handoff tells `spec-engineer` what must be preserved, validated, and clarified. It should not prescribe implementation tickets or exact code shape unless the architecture decision explicitly requires it.

Architecture handoff shape:

```yaml
architecture_handoff:
  linked_prd_requirements:
    - PRD-R7
  linked_asr:
    - ASR-INT-1
    - ASR-SEC-1
  decisions:
    - PD-003: adapter plus queued sync worker
    - ADR-002: encrypted backend-owned credential records
  constraints:
    - OAuth callback MUST be idempotent for duplicate provider redirects.
    - Frontend MUST NOT receive access or refresh tokens.
    - Provider 5xx MUST create retryable degraded state, not connected-success state.
  required_validation:
    - duplicate callback idempotency test
    - provider failure integration test
    - log/trace/error token redaction inspection
  next_stage_owner: spec-engineer
```

Architecture handoff item shape:

```yaml
architecture_handoff_item:
  id: AHI-001
  kind: spec_candidate
  title: Retry-safe CRM initial sync capability
  linked_prd:
    - PRD-R7
  linked_asr:
    - ASR-INT-1
    - ASR-SEC-1
  linked_decision:
    - PD-003
  architectural_intent: >
    Initial provider sync must be decoupled from OAuth callback completion
    so provider failures do not block the user flow or create false success states.
  constraints:
    - OAuth callback must be idempotent.
    - Credentials must be persisted before sync scheduling.
    - Provider 5xx must result in retryable degraded state.
    - Duplicate callbacks must not create duplicate credentials or duplicate sync jobs.
  acceptance_constraints:
    - Successful provider connection does not imply successful data sync.
    - Failed initial sync remains retryable and visible.
    - Duplicate callbacks preserve a single credential record and a single active sync request.
  required_validation:
    - duplicate callback idempotency test
    - provider 5xx integration test
    - sync retry observability check
  observability_requirements:
    - sync attempts must be measurable
    - failures must be distinguishable by provider and workspace
    - retry queue depth must be visible
  rollback_constraints:
    - sync scheduling can be disabled without deleting credentials
  next_stage_owner: spec-engineer
  expected_next_output:
    - OAuth callback behavior specification
    - credential lifecycle/security specification
    - initial sync worker behavior specification
    - provider failure and retry behavior specification
  not_prescribed:
    - exact table names
    - exact endpoint names
    - exact class/function names
    - exact queue implementation unless separately decided
```

Allowed `kind` values:

```yaml
kind:
  - spec_candidate
  - spike
  - validation_obligation
  - migration_constraint
  - security_constraint
  - observability_requirement
  - rollout_constraint
  - documentation_update
  - architecture_revisit_trigger
```

Forbidden architecture output style:

- Do not use task-backlog naming or implementation-task schemas inside architecture output.
- Use `architecture_handoff_item` for spec candidates, validation obligations, and other downstream architectural obligations.
- If the user explicitly asks for planning, create a separate `Downstream implementation planning` section after the architecture output.

Validation:

- Handoff items are clearly not implementation tasks.
- `spec-engineer` can write behavior-level specs without reselecting architecture patterns.
- Risky changes have validation, rollback, or migration obligations.
- `not_prescribed` is used when the architecture frame intentionally leaves implementation freedom.
- Exact table names, endpoint names, class names, or task sequencing are omitted unless they are architectural constraints.

Use `assets/templates/architecture-handoff-item.yaml` and `assets/templates/architecture-handoff-register.yaml` for copy-ready versions.

## Workflow stage: Review and revisit

Goal: keep architecture current without rewriting docs unnecessarily.

Review triggers:

- spec changes boundaries, data, public contracts, auth, tenancy, deployment, or external dependency;
- implementation reveals architecture drift;
- spike invalidates assumption;
- quality gate fails for ASR-related reason;
- production issue or high-risk retro identifies wrong architecture assumption;
- ADR revisit trigger fires.

Update rules:

| Signal | Update |
| --- | --- |
| Product scope or metric changed | PRD |
| New architectural force discovered | ASR register / architecture brief |
| Decision changed | Pattern decision / ADR |
| Task behavior changed | Spec |
| Repeat process failure | Workflow proposal / AGENTS.md rule |
| Implementation cannot preserve invariant | Architecture delta + spec update |

Validation:

- Architecture documents change only when decisions change.
- Stale ADRs are superseded or revisited when triggers fire.
- Retro output produces a concrete improvement or no-op rationale.

## Artifact selection guide

| Need | Artifact | Notes |
| --- | --- | --- |
| Prove architecture is not needed | Architecture check | Keep it short. |
| Show a bounded change to existing architecture | Architecture delta | Best default for medium-risk changes. |
| Record a selected pattern and trade-offs | Pattern decision | Use before ADR when decision is relevant but not heavy. |
| Preserve a major decision | ADR | Use only for significant or hard-to-reverse choices. |
| Frame a new system or major redesign | Architecture brief | Compact, not encyclopedic. |
| Validate NFR/quality attribute | Quality scenario | Make quality testable. |
| Resolve uncertainty | Spike brief | Bounded question, bounded output. |
| Pass architecture constraints to the next stage | Architecture handoff item/register | Not a task backlog. |

## Stop or escalation reminder

Ask one focused question or mark human review required when the missing or conflicting input would change architecture across product conflict, security, privacy, compliance, data-loss, compatibility, public API, identity, tenancy, data model, migration, secrets handling, deployment topology, paid/operational dependency, external contract, rollback, observability, audit, or security posture.

For non-blocking gaps, proceed with assumptions and validation steps.
