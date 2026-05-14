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
