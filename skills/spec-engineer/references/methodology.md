# Specification Methodology

Use this reference when drafting or materially revising a software specification.

## Method basis

This method combines a small set of specification traditions into one practical workflow:

- controlled normative language for required, forbidden, recommended, and optional behavior;
- falsifiable requirements, where important claims can be proven false by observation;
- contracts, preconditions, postconditions, and invariants for interface and state correctness;
- scenario-based behavior statements for user-, operator-, integration-, or system-observable behavior;
- risk-based testing, where rigor follows blast radius as well as scope size;
- failure and edge-case discovery techniques such as equivalence partitioning, boundary analysis, state-transition coverage, role/abuse-case review, and fault analysis.

The goal is not to cite a framework. The goal is to produce a compact spec that constrains implementation and verification enough for correct code.

## Intake: turn intent into an engineering target

Before writing requirements, extract the smallest useful target:

- **Parent intent:** product outcome, system capability, workflow, architecture constraint, or end-to-end flow this spec must advance or protect.
- **Object:** system, subsystem, module, endpoint, function, workflow, migration, rule, or public contract.
- **Actor or consumer:** user, operator, client, service, job, administrator, external system, or downstream code.
- **Precondition:** what must already be true for the behavior to be valid.
- **Trigger:** request, event, command, scheduled time, state transition, or data change.
- **Guard:** additional rule that decides whether the trigger is allowed.
- **Observable behavior:** what the system returns, emits, persists, rejects, calculates, or prevents.
- **Postcondition:** state/effect that must hold immediately after the behavior.
- **Continuity:** what remains true later, after reload, retry, restart, downstream consumption, migration, or time delay.
- **Boundaries:** what is included, excluded, delegated to existing behavior, or intentionally unspecified.
- **Sources:** issue, user request, product note, decision, code behavior, API contract, policy, domain rule, or external dependency.
- **Criticality:** worst observable consequence if the requirement is wrong.

If the parent intent is missing, record it as an assumption, gap, or blocking question according to risk. Do not invent product, system, workflow, or architecture intent just to make the spec feel complete.

If source material conflicts, do not silently average it. Choose the higher-authority source when that is clear; otherwise mark a blocking question or a non-blocking assumption.

## Capability reality checkpoint

State the primary capability in this shape:

```text
Given <precondition>, when <actor> does <trigger/action>, if <guard>,
the system MUST <observable response>, creating or preserving <state/effect>,
so that <continuity or later behavior> holds.
```

Capability is relative to the spec consumer. A public API contract is capability when API clients are the actors, but it is substrate when the claimed capability is an end-user checkout flow. Do not mechanically classify APIs, schemas, queues, or tests as substrate without asking who observes the behavior.

Then list:

- **Parent intent or supported capability:** the broader behavior this spec advances or protects.
- **Substrate needed:** infrastructure or internal artifacts that may be necessary.
- **Anti-claims:** behavior the spec does not promise.
- **Falsifiers:** observations that would prove the capability is not present.

Example anti-claims:

- This spec does not require a new persistence layer.
- This spec does not change authorization rules.
- This spec does not guarantee offline operation.
- This spec does not make generated documentation acceptance evidence for runtime behavior.
- This spec does not count mocked upstream success as proof that the real upstream integration works.
- This spec does not count schema presence as proof that users can complete the workflow.

## Criticality lens

Scope size is not enough. Ask:

```text
What is the worst observable consequence if this requirement is wrong?
```

Escalate rigor when the answer includes:

- money movement, billing, tax, or accounting impact;
- authentication, authorization, privacy, security, or audit impact;
- irreversible state, destructive operations, data loss, or migration risk;
- compliance, safety, legal, or user-trust risk;
- backward compatibility for existing clients or data;
- distributed concurrency, retries, ordering, or exactly-once claims.

For high-criticality scope, require:

- explicit invariants;
- at least one negative acceptance criterion and multiple falsifiers;
- source trace on every normative requirement;
- verification beyond happy-path examples;
- clear rollback, recovery, or compatibility semantics when applicable.

This override applies even when the object is a small function, rule, or endpoint.

## Project risk classification and spec depth

Risk level and criticality are related but not identical. Risk level describes process and coordination needs; criticality describes the consequence of a wrong requirement. Use both, and choose the higher rigor when they disagree.

| Risk | Spec depth |
| --- | --- |
| Low | Compact goal, behavior, acceptance, relevant tests/checks, and anti-claims are usually enough. Do not add architecture context unless a hidden architecture-impact trigger appears. |
| Medium | Include source context, behavior, edge cases, inherited constraints, architecture context when boundaries/contracts/data/security/deployment are affected, and a verification map. |
| High | Include explicit product and architecture sources, invariants, negative/falsifier coverage, rollback or compatibility semantics, security/privacy/observability constraints, strong quality gates, and post-merge validation expectations when relevant. |

Examples:

- A copy or styling fix can be low risk even when user-visible.
- A small authorization rule can be high rigor because the consequence of being wrong is high.
- A medium-risk slice may need architecture context because it touches a public contract, even if the behavior is simple.

## Select the minimum spec depth

Use this scale as a starting point, then override with criticality:

| Scope | Minimum useful detail |
| --- | --- |
| Function or pure rule | Inputs, outputs, invariants, edge cases, examples, acceptance |
| Validation or transformation | Object, formal rule, decision table if needed, positive/negative examples, error semantics |
| API or integration | Purpose, auth, request/response contracts, errors, idempotency, retries, ordering, compatibility |
| Stateful workflow | States, events, guards, effects, invariants, failure and recovery behavior |
| Migration | Source and target states, sequencing, compatibility, retry/rollback, data invariants |
| System slice | Actors, entry points, behavior inventory, contracts, NFRs, observability, verification map |

Do not add sections beyond the minimum unless they remove a concrete risk.

## Build the behavior inventory

Start with glossary. Define terms that repeat, carry roles, describe state, or commonly drift in meaning, such as user, active, pending, duplicate, valid, session, owner, admin, retry, and complete.

Then cover behavior by class, not by document length:

- main success flow;
- alternate flows;
- failure paths;
- invalid inputs;
- empty, missing, duplicate, stale, or out-of-range data;
- permission and role differences;
- timeouts, cancellation, retries, and partial failure;
- concurrency, shared state, race windows, and linearization point;
- ordering guarantees and out-of-order events;
- idempotency key, duplicate detection, retry cost, and side-effect policy;
- consistency model, read-after-write expectations, and stale reads;
- persistence, reload, restart, downstream use, and recovery;
- compatibility, migration, coexistence, rollback, and existing data;
- observability, audit, logging, metrics, and support implications when relevant.

Use `references/discovery-techniques.md` when this inventory feels like recall rather than analysis.

## Existing-system change discipline

When the work changes current behavior, specify the delta instead of writing as if greenfield:

- **Current behavior:** what the system does today and how it is known.
- **Target behavior:** what must change.
- **Preserved behavior:** what must continue working.
- **Behavioral diff:** old result -> new result for each affected scenario.
- **Compatibility:** existing clients, data, integrations, flags, and user expectations.
- **Migration/coexistence:** how old and new states behave during rollout.
- **Rollback/retry:** what happens if the change is interrupted or reverted.

Acceptance must prove both the new behavior and important preserved behavior.

## Architecture context and drift

Use this section only when the spec is medium/high risk or changes boundaries, public contracts, data model, security, tenancy, integration topology, deployment, observability, cost, operability, rollback, or a selected architecture pattern.

Architecture context is inherited input, not a place to make new architecture decisions.

```markdown
## Architecture Context
- Linked PRD requirements:
- Linked ASRs, architecture brief, pattern decisions, or ADRs:
- Delivery task brief or vertical slice:
- Existing conventions that MUST be preserved:
- Architecture constraints for this spec:
- Architecture drift triggers:
```

Stop and route a feedback note when the spec would require a new or changed architecture decision that is not already accepted. For lower-impact discoveries where implementation can safely proceed, record `Architecture delta needed` with owner, affected decision, and validation or revisit trigger.

Do not invent `ASR`, `PD`, or `ADR` identifiers. Cite existing ones. If no repo-local artifact or spec ID convention exists for spec-owned statements, suggested prefixes are `SPEC-R` for requirements, `INV` for invariants, and `AC` for acceptance criteria.

## Write atomic normative requirements

Prefer this shape:

```text
<Source> <Condition> <subject> MUST <action> <object> <constraint>.
```

Good:

```text
[ISSUE-42] When a client repeats POST /payments with the same Idempotency-Key,
Payment API MUST return the result of the original operation without creating a
second transaction.
```

Weak:

```text
Payment API should correctly handle duplicate payment requests.
```

Rules:

- one obligation per requirement;
- explicit source trace;
- explicit subject;
- explicit normative word;
- measurable constraint when quality or performance matters;
- no vague words such as "fast", "secure", "robust", "proper", "reasonable", "graceful", "appropriate", "as needed", or "if applicable" without a metric or observable condition;
- no hidden `and/or`; split alternatives or use a decision table;
- no implementation mechanism unless it is a real constraint.

Atomicity test:

- If the statement can produce two independently verifiable acceptance criteria, split it.
- If one half can pass while the other fails, split it.
- If the requirement says "validate and log", "save and notify", or "calculate and display", split it unless the joined behavior is the single observable effect.

Mechanism can be a requirement when it is externally mandated or behaviorally material, for example a regulatory cryptographic algorithm, compatibility-required identifier format, deterministic merge strategy, or data structure needed for a stated ordering guarantee. In that case, state why the mechanism is normative.

## Invariants first

If part of the spec can be stated as an invariant, prefer that before narrative requirements. Invariants prevent behavior from being correct at one point and wrong elsewhere.

Use invariants for:

- money, balance, inventory, quota, or authorization boundaries;
- state-machine safety;
- data consistency before and after migration;
- idempotency and duplicate side effects;
- privacy and logging guarantees;
- persisted relationships that must survive retries or restarts.

Shape:

```text
INV1: <property> MUST remain true <scope/time>, including <edge cases>.
```

Examples:

- `INV1: A successful retry with the same idempotency key MUST NOT create more than one payment transaction.`
- `INV2: Access tokens MUST NOT appear in application logs, audit payloads, or error responses.`

## Temporal semantics

Do not hide timing promises inside "continuity". Name the temporal operator:

| Term | Use when |
| --- | --- |
| Always | A property must remain true for the full scope |
| Eventually | A property may become true later; define the maximum delay or observation condition |
| Until | A property remains true until a named event |
| Leads-to | One event causally requires a later event |
| At-most-once | A side effect may occur zero or one time |
| At-least-once | A side effect must occur one or more times; duplicates are possible |
| Exactly-once | A side effect must occur once; define how retries and duplicates are handled |
| Within N | A property must become true within an explicit time bound |

Avoid claims such as "eventually idempotent" unless the exact temporal and side-effect semantics are defined.

## Choose representations by risk

| Risk | Best representation |
| --- | --- |
| Ambiguous terms | Glossary |
| Compound condition logic | Decision table |
| Lifecycle or stateful behavior | State table or state machine |
| Interface and data ambiguity | Schema, contract, examples |
| Always-true safety or consistency property | Invariant |
| User-visible flow | Scenario plus rules |
| Boundary interpretation | Positive and negative examples |
| Critical verification | Acceptance criteria plus falsifier |

Natural language is acceptable for intent and simple behavior. It is weak for combinations, state, interfaces, invariants, and measurable constraints.

Rules are normative. Examples are illustrative unless the spec explicitly labels an executable scenario as normative. If a rule and example conflict, the rule wins and the example must be corrected.

## BDD/Gherkin scenario fit

Use BDD/Gherkin-style scenarios only when they improve the specification by exposing actor-trigger-response behavior, guards, failure paths, continuity, or acceptance risk that plain requirements would hide.

Before adding a scenario, confirm:

- the actor or consumer, production trigger, precondition, and guard are real for the target system;
- `Then` states an observable response, state/effect, or continuity promise, not substrate such as a file, wrapper, mock, log line, schema, or test;
- the scenario is backed by atomic `MUST` or `MUST NOT` requirements, negative acceptance or a falsifier, and a verification method;
- another representation would not express the requirement more directly.

Prefer another representation when the requirement is mainly a pure rule, invariant, decision table, state model, API contract, schema, measurable NFR, or architecture decision. Do not add BDD ceremony for trivial, substrate-only, or already unambiguous scope.

## Repository artifact conventions

Before creating a persistent implementation-ready spec, API spec, workflow spec, migration spec, spike spec, or verification map in a repository, check whether repo-local artifact conventions exist through AGENTS.md, README, CONTRIBUTING, or docs linked from them.

If conventions exist, follow them for:

- spec path and stable spec ID;
- requirement, invariant, and acceptance ID prefixes;
- metadata or front matter;
- source context;
- related PRD, architecture, delivery, and decision IDs;
- module index updates.

Do not hard-code a repository-specific path in this methodology. If no repository convention exists, use the Markdown structure below and state any location assumption when writing files.

## Specification document structure

Use this as the default structure, collapsing sections when the task is small:

If the repository requires front matter or a different metadata block, use that convention and preserve the same implementation-ready meaning.

```markdown
# <Spec Title>

## Status And Scope
- Status:
- Scope:
- Out of scope:
- Source context:
- Criticality:
- Risk:

## Architecture Context
Add only when risk or affected boundaries make it useful for implementation correctness.

## Terms
| Term | Meaning |
| --- | --- |

## Capability / Behavior Statement
Given ..., when ..., if ..., the system MUST ..., creating/preserving ..., so that ...

## Assumptions
- ...

## Anti-Claims
- This spec does not ...

## Requirements
| ID | Source | Requirement | Verification |
| --- | --- | --- | --- |
| R1 | ... | ... MUST ... | test / demonstration / inspection / analysis / contract / schema |

## Rules, Contracts, Invariants, Or State Model
Add only the representations needed for this scope.

## Acceptance Criteria
- AC1:
- Negative:
- Falsifier:

## Non-Functional And Operational Constraints
Add measurable constraints only when relevant.

## Evolution
- New:
- Changed:
- Superseded:
- Deprecated:
- Removed:

## Open Questions And Gaps
- Blocking:
- Non-blocking:
- Validation gaps:
- Architecture delta needed:
```

For very small tasks, compress this to:

```markdown
# <Spec Title>

## Scope
## Behavior
## Requirements
## Edge Cases
## Acceptance
## Anti-Claims / Gaps
```

Use the compact structure for trivial scope unless criticality requires the fuller version.

## Acceptance criteria and falsifiers

Acceptance criteria must be objective. At least one criterion should prevent substrate-only success when capability is claimed.

Use three kinds:

- **Positive:** behavior that must be observed.
- **Negative:** behavior that must not occur.
- **Falsifier:** a condition that would prove the spec is not satisfied.

Examples:

- Positive: A valid checkout request creates exactly one order and returns the created order id.
- Negative: A repeated request with the same idempotency key MUST NOT create a second order.
- Falsifier: If a user can see a success response while no order exists after reload, the capability is not implemented.

## Verification map

Map each important requirement to the method that proves it most directly. Do not default to `test` when the claim is static, contractual, capacity-based, probabilistic, or interactional.

| Method | Use for |
| --- | --- |
| Demonstration | User/operator/integration observable flows |
| Inspection | Static properties, copy, schema presence, config, declared policy |
| Analysis | Performance, capacity, threat reasoning, migration risk |
| Contract validation | API shape, compatibility, request/response guarantees |
| Schema validation | Data structure constraints |
| Conformance suite | Protocol, standard, SDK, or compatibility obligations |
| Property-based test | Function invariants over broad input spaces |
| Example-based test | Deterministic behavior, known edge cases, regression checks |
| Fuzzing | Parser, validation, encoding, security, and robustness boundaries |
| Differential testing | New behavior compared to old behavior, reference implementation, or alternate engine |
| Golden/approval testing | Stable rendered output, generated artifacts, or serialization where human review owns changes |
| Fault injection / chaos | Retry, timeout, partial failure, recovery, and resilience semantics |
| Simulation | Scheduling, concurrency, distributed, queueing, or stochastic behavior |
| Formal model check | Small but high-criticality state machines, safety properties, and temporal guarantees |
| Executable scenario | End-to-end acceptance behavior |

If verification is not currently possible, say why and whether that blocks implementation.

## Quality gate mapping

Quality gates should follow the local repository and package rules first. Use this table to choose spec-level verification obligations when local gates are not already explicit:

| Requirement or risk | Typical gate |
| --- | --- |
| Type-level API or DTO change | typecheck, schema validation, compile-time contract check |
| Public API change | contract test, backward compatibility check, request/response examples |
| Data migration | migration dry run/check, rollback rehearsal, data invariant validation |
| Auth or security boundary | permission matrix check, abuse-case tests, SAST or security review when configured |
| External integration | sandbox or stubbed integration test, contract validation, retry/idempotency and failure tests |
| Critical workflow | executable scenario, e2e test, preserved-behavior regression |
| AI output quality | eval suite, regression set, human-review rubric, latency/cost monitoring plan |
| Operational or reliability claim | metrics/logs/traces inspection, fault injection, load or recovery analysis |

Do not list every possible gate. Name the gates that prove the specific requirements or risks in the spec.

## AI-agent failure controls

Because this skill is for agents that write code, the spec must reduce common agent failure modes:

- hallucinated APIs: list authoritative contracts and forbid invented interfaces;
- plausible but non-conforming code: require source-traced requirements and acceptance criteria;
- vague noun interpretation: define repeated or role-bearing terms in the glossary;
- happy-path completion bias: require negative cases and falsifiers;
- mock-driven confidence: distinguish mocked support evidence from runtime behavior;
- implementation drift: require the agent to revisit the spec when code reveals material ambiguity.

## Quality audit before finalizing

Check the specification itself:

- Can each important requirement be falsified?
- Does each requirement have one obligation?
- Does each requirement trace to a source or explicit assumption?
- Are all key terms defined once?
- Are main, alternate, failure, and invalid cases covered enough for the scope?
- Are time, retry, ordering, idempotency, permissions, consistency, concurrency, and compatibility addressed when relevant?
- Do examples match the rules?
- Do tables, schemas, state models, and prose agree?
- Are NFRs measurable with metric, threshold, object, and window?
- Are invariants stated where an always-true property matters?
- Are anti-claims strong enough to prevent scope inflation?
- Does criticality require more rigor than scope size suggests?
- Can implementation start without guessing through a blocking decision?
- Is any section present only because the template had it? If yes, remove or collapse it.

## Stop rules

Stop and ask the user when:

- source material contains a contradiction that changes behavior;
- implementation would require choosing between incompatible product, security, privacy, compliance, data-loss, or compatibility outcomes;
- the spec would make a capability claim that can only be proven by substrate evidence;
- the spec would require changing a public contract, data model, auth/security boundary, tenant isolation, integration topology, deployment model, rollback path, or selected architecture pattern not covered by accepted architecture context;
- a required external contract is missing and cannot be inferred safely.

Do not stop for minor unknowns. Record them as assumptions, non-blocking gaps, validation gaps, or architecture delta needed.
