# Delivery planning methodology

## Purpose

`delivery-planner` converts accepted product scope and architecture handoff into executable work for AI-agent implementation.

It is especially useful when an agent needs to decompose architecture into tasks without becoming the architect.

It answers:

```text
What exactly should be delivered in this planning scope?
How do accepted architecture constraints become implementation work?
What should be a vertical slice, module increment, support task, spike, or spec task?
What can be implemented now, what needs spec-engineer, and what must return to architecture-engineer?
What order exposes risk early and enables safe parallelization?
```

It does not answer:

```text
What should the product be?
Which architecture should be selected?
What exact behavior and edge cases should be specified?
What code should be written?
```

Those belong to `prd-engineer`, `architecture-engineer`, `spec-engineer`, and coding workflow.

## Operating posture

Use this methodology as a decision aid, not a mandatory ceremony. The plan is successful when a downstream agent can pick up the next task without inventing product intent, architecture choices, or behavior details.

Keep the plan as small as the scope allows:

- if authority is clear, proceed with explicit assumptions instead of asking for more documents;
- if scope is narrow, keep the plan narrow;
- if a section would only restate known context, shorten or omit it;
- if exact behavior is missing, route to `spec-engineer` instead of writing a disguised spec;
- if an architecture choice is missing, route to `architecture-engineer` instead of planning around a guess.

---

## 1. Start with planning scope

Always determine planning scope before decomposing.

```text
Scope type: project | feature | module | service | integration | handoff item | backlog audit
Included: what the plan covers
Excluded: what the plan intentionally does not cover
Source authority: PRD/product brief, architecture handoff, accepted specs, repo instructions, existing code
Output mode: compact by default
```

Do not plan the entire project when the requested target is a module. Do not create module internals when the requested target is only a product-level delivery roadmap.

### Scope-specific behavior

| Scope | Planning behavior |
| --- | --- |
| Project | Identify product capabilities, vertical slices, cross-cutting dependencies, risk-first sequence. |
| Feature / epic | Break one feature into independently verifiable increments and required support tasks. |
| Module / service | Break accepted module responsibilities and architecture obligations into module increments and implementation tasks. |
| Integration | Expose contract, auth, idempotency, retries, rate limits, test harness, degraded path, and observability tasks. |
| Handoff item | Plan only the tasks needed to satisfy and validate the specific architecture obligation. |
| Backlog audit | Detect layer-only tasks, hidden risk, missing verification, wrong sequencing, and unowned gaps. |

---

## 2. Intake and authority

Use inputs according to their authority:

- PRD/product brief defines product scope and intended outcomes;
- architecture handoff defines accepted constraints, boundaries, decisions, risks, validation obligations, and revisit triggers;
- existing specs define accepted behavior details;
- repository instructions define local workflow rules;
- code/tests show existing implementation boundaries and integration seams.

Classify gaps:

```text
Blocking gap: can change slice boundaries, module boundaries, risk, architecture constraints, acceptance, sequencing, or verification.
Non-blocking gap: can be carried as an explicit assumption without invalidating near-term planning.
```

Do not escalate every unknown. Escalate only when the answer can change boundaries, task order, risk, verification, or ownership. Carry smaller unknowns as assumptions.

Route blocking gaps:

| Gap type | Route to |
| --- | --- |
| Product intent, user, scope, metric, non-goal | `prd-engineer` |
| Architecture boundary, contract, data, auth, tenancy, deployment, rollback, provider, observability obligation | `architecture-engineer` |
| Behavior, edge cases, normative requirements, acceptance criteria, verification map | `spec-engineer` |
| Framework, infrastructure, security, ML, regulatory, or domain-specific fact | relevant domain skill/reviewer |

---

## 3. Architecture-to-task decomposition

Architecture handoff is not a backlog. It is a set of constraints and obligations that must shape the backlog.

Read the handoff and extract planning-relevant obligations:

```text
Boundaries: modules, bounded contexts, services, packages, ownership seams.
Contracts: API, events, schemas, SDKs, callbacks, CLI, UI boundary, domain interfaces.
Data: source of truth, persistence, migration, retention, deletion, consistency.
Security: authn, authz, tenant isolation, secrets, audit, abuse controls.
Operations: deployment, rollback, feature flags, observability, latency, cost, reliability.
Integration: providers, retries, idempotency, ordering, rate limits, degraded path.
Validation: tests, probes, metrics, audit evidence, spike results, post-merge checks.
Risks: unresolved assumptions, revisit triggers, trade-offs, known failure modes.
```

Then convert obligations into delivery work:

```text
Accepted contract -> task to implement/adapt it + contract tests.
Source-of-truth decision -> tasks for persistence, invariants, migration, rollback, validation.
Security boundary -> tasks for enforcement, audit events, abuse/failure cases, review routing.
Provider integration -> tasks for adapter, auth, retries, idempotency, sandbox/harness, observability.
Observability obligation -> tasks for metrics/logs/traces/dashboard/alerts linked to a capability.
Known risk -> spike or early validation task.
```

If an obligation only creates substrate, attach it to the capability or module increment it enables. If no dependent outcome exists, either delete it from the plan or label it as an unresolved scope problem.

Do not select a new architecture pattern. If decomposition requires choosing architecture, stop and route to `architecture-engineer`.

---

## 4. Decomposition units

### Vertical slice

Use for project and feature planning.

A vertical slice is valid when it:

- maps to an observable user, operator, integration, runtime, support, or audit capability;
- has source authority from PRD/product scope and relevant architecture handoff;
- crosses enough boundaries to validate the path;
- has a validation direction;
- does not hide high-risk architecture work.

Example:

```text
Weak: Create billing tables.
Better: Admin can create a billing profile; the system persists it, exposes it through the admin API, and emits an audit event.
```

### Module increment

Use for module/service/subsystem planning.

A module increment is valid when it creates a verifiable capability inside the target module or across its public boundary.

Examples:

```text
- Module exposes accepted public contract with contract tests.
- Module enforces tenant isolation invariant on reads and writes.
- Module supports idempotent provider callback handling.
- Module emits required audit event for state transition.
- Module handles degraded external-provider response path.
```

A module increment does not need to be end-user-visible, but it must be observable through tests, contracts, logs, metrics, audit evidence, or integration behavior.

### Support task

Use for substrate work that enables a slice or module increment.

Valid support tasks:

```text
- test harness for provider adapter used by MI-02;
- migration scaffold needed by VS-04;
- contract fixture needed by MI-01;
- feature flag needed to safely roll out VS-05.
```

Invalid support task:

```text
Create helper folder.
```

Unless it is tied to a concrete capability, validation obligation, or module increment.

### Spike

Use when a task cannot be planned safely without bounded evidence.

A spike should have:

```text
question
scope boundary
validation method
success/failure signal
output needed for planning
route after spike
```

---

## 5. Task creation

A task brief is planning-level. It should be compact.

Default fields:

```text
Task ID
Title
Slice / module increment
Goal
Scope / out of scope
Dependencies
Risk: low | medium | high
Next step: spec-engineer | architecture-engineer | coding | domain review | spike
Verification hint
Review hint
```

Use expanded task details only when risk or ambiguity justifies it.

### Task size rules

A task is too large when:

- review requires unrelated expertise;
- it changes multiple contracts without clear sequencing;
- it mixes migration, public API, UI behavior, security rule, and rollout in one unit;
- acceptance covers multiple unrelated capabilities;
- rollback or verification cannot be reasoned about locally.

A task is too small when:

- it creates only an empty scaffold, mock, wrapper, or unused file;
- no useful progress can be verified;
- it has no source link or verification hint;
- it exists only because of technical layering;
- its acceptance can pass without observable or verifiable behavior.

Substrate can be a valid task only when it has an owner outcome, such as a slice, module increment, validation obligation, or explicit developer-experience goal.

A task is ready for coding only when:

```text
source authority is clear;
architecture basis is accepted or irrelevant;
dependencies are known;
risk is explicit;
verification path is known;
behavior details are sufficient or spec-engineer has produced them;
coding agent does not need to infer product intent or architecture decisions.
```

---

## 6. Risk classification

Risk is provisional. It is used to pick planning depth and downstream routing.

### Low

Use when change is local, reversible, has small blast radius, and requires no specialist decision.

Examples:

```text
minor UI copy change;
local bugfix inside accepted behavior;
test-only change;
small refactor with no public contract/data/security impact.
```

### Medium

Use when change crosses modules or affects behavior, API usage, persistence usage, integration behavior, or non-trivial validation, but within accepted architecture.

Examples:

```text
implement accepted internal module contract;
add provider adapter using existing pattern;
add business behavior across two modules;
add observability for accepted flow;
change non-breaking API behavior.
```

### High

Use when change is hard to reverse, public, security/data/ops-sensitive, migration-sensitive, or expensive to fail.

Triggers:

```text
authentication, authorization, permissions;
tenant isolation;
secrets handling;
public API, SDK, event schema, or external contract;
persistent data model, migration, retention, deletion, export;
provider/model choice with cost, safety, latency, or quality impact;
async retry, idempotency, ordering, or rate-limit behavior;
deployment topology, rollback path, feature-flag migration;
security boundary, audit, abuse control;
observability or incident-response guarantee weakening.
```

High-risk work should not be routed directly to coding unless architecture and spec basis are accepted.

---

## 7. Sequencing and parallelization

Sequence work to expose uncertainty and stabilize dependencies early.

Common waves:

```text
Wave 0: blocking clarifications, spikes, test harnesses, accepted contract confirmation.
Wave 1: minimal backbone or first verifiable module increment.
Wave 2: capability expansion and dependent tasks.
Wave 3: hardening, observability, rollout, documentation, post-merge validation prep.
```

For module planning, a useful sequence is often:

```text
1. Public/internal contract and verification harness.
2. Core state/invariant behavior.
3. Integration adapters and failure modes.
4. Observability, rollout, and operational hardening.
```

Parallelize only when:

- contracts are stable;
- dependencies are explicit;
- tasks can be reviewed independently;
- failure of one branch does not invalidate large parallel work;
- no unresolved architecture decision can change the work.

---

## 8. Output modes

### Compact mode

Default. Use one Markdown Delivery Plan.

Recommended structure:

```text
Planning scope
Assumptions and gaps
Decomposition
Task table
Sequencing
Routing and risks
Audit summary
```

### Standard mode

Use for broad or multi-module planning. Add dependency map, risk exposure notes, support tasks, and handoff notes.

### Deep mode

Use only when explicitly requested or required by repository automation. May include expanded task briefs or machine-readable backlog.

Rule: if the plan is understandable and executable in compact mode, do not expand it.

The default templates are examples, not mandatory forms. Use fewer rows or shorter sections when that is enough to preserve scope, dependencies, risks, routing, and verification direction.

---

## 9. Planning audit

Before finalizing, verify:

```text
The plan matches the requested scope.
The architecture handoff is consumed but not redesigned.
Missing architecture decisions are routed.
Missing product intent is routed.
Missing behavior detail is routed.
Slices or module increments are observable/verifiable.
Support tasks are tied to capabilities or module increments.
Acceptance cannot pass through substrate-only work unless explicitly labeled as support or developer-experience work.
High-risk work is visible.
Task sizes are reviewable.
Dependencies and blockers are explicit.
Sequencing exposes risk early.
Parallel work is safe.
Every task has a verification hint.
The output is compact enough to be useful.
```
