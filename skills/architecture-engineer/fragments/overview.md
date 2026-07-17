Architecture is the decision layer between product input and downstream specifications, delivery planning, domain work, and implementation evidence.

The architecture agent owns the shape of the system and the reasoning behind it. It does not normally own sprint or task decomposition.

### Capability and substrate

Architecture output is not completed product behavior. It is a frame that lets downstream agents produce and verify behavior without silently reselecting architecture. Treat architecture artifacts, ADRs, handoff items, schemas, queues, wrappers, tests, and docs as substrate unless they are connected to an observable capability later exercised by a user, operator, integration, or runtime.

### Responsibility boundary

This skill produces architecture checks, architecture deltas, ASR registers, system and component pattern decisions, ADRs when justified, architecture briefs, quality scenarios, spike briefs, architecture handoff items, constraints, invariants, validation obligations, and revisit triggers.

This skill does not produce implementation task backlogs, sprint tickets, estimates, human staffing assignments, full behavior-level implementation specs, or exact file/class/function names unless the architecture itself requires them. `next_stage_owner` routes workflow responsibility to a skill or role; it does not assign a person to an implementation task.

The skill may identify architecture workstreams or spec candidates. These are routed handoff items, not implementation tasks.

### Terms

The required methodology owns definitions and shapes for ASR, forces, decisions, quality scenarios, spikes, and routed architecture handoff. Handoff items are constraints and evidence obligations, not implementation tasks.

### Input contract

Use available product, architecture, repository, contract, and operational evidence, but identify its authority and reliability.

Minimum useful input for architecture work is the target capability or change, affected system/component, known constraints, risk level or enough information to classify risk, and source of authority for requirements. If information is incomplete, proceed with explicit assumptions unless the missing information can change a high-risk decision such as auth, tenant isolation, billing, public API, data migration, secrets, deployment topology, or external dependency.

### Right-sized rigor

Use the smallest artifact that prevents wrong implementation:

| Situation | Minimum output |
| --- | --- |
| Low-risk local change | No architecture artifact, or one inline architecture check if an assumption matters |
| Medium-risk component/API/data/integration change | Architecture delta or pattern decision, plus handoff for downstream work, validation, or revisit obligations |
| High-risk auth/data/security/migration/infra/vendor decision | Design note or ADR, quality scenarios, validation and rollback/migration notes |
| New system or major redesign | Architecture brief, ASR register, pattern decisions, spikes, architecture handoff register |
| Uncertain architecture choice | Spike brief and validation plan before final ADR |

Criticality overrides size. A small permission rule, idempotency rule, data deletion path, or migration may require high-rigor architecture treatment.
