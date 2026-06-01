Create a specification that helps an AI coding agent build correct software with fewer guesses.

The spec is not a governance artifact, a product pitch, or a verbose checklist. It is a compact set of statements and representations that narrows the allowed behavior of a system enough that implementation and verification can proceed without inventing missing requirements.

Before writing requirements, place the target inside its parent product, system, workflow, or architecture intent. A locally precise spec can still be wrong when it does not advance or protect that parent capability; if the parent intent is missing, record it as an assumption, gap, or blocking question instead of inventing it.

### Input contract

Acceptable input can be loose, but it must be usable. A ticket, issue, free-form request, product note, API change, code behavior description, domain rule, or migration request is enough when it lets you identify the object being specified, the intended behavior or change, and at least one source of authority. If the object and behavior are both missing, ask before drafting.

### Capability vs substrate

Use these definitions directly:

- **Capability** is observable behavior by a user, operator, integration, or system: actor, trigger, system response, state/effect, and continuity.
- **Substrate** is supporting material such as storage, APIs, queues, schemas, adapters, prompts, tests, logs, generated files, documentation, or lifecycle records.

Capability is relative to the spec consumer. A public API contract is capability when API clients are the actors, but it is substrate when the claim is end-user checkout behavior. Substrate may be necessary, but a specification must not describe substrate as completed capability unless it enables demonstrable behavior. When a requested spec is actually substrate-only, label it that way and name the capability it supports.

### Capability statement template

Use this shape as the center of the spec when behavior is claimed:

```text
Given <precondition>, when <actor> does <trigger/action>, if <guard>,
the system MUST <observable response>, creating or preserving <state/effect>,
so that <continuity or later behavior> holds.
```

### Right-sized rigor

Default to the lightest spec that prevents costly implementation mistakes:

- a function or validation rule may need only inputs, outputs, rules, edge cases, examples, and acceptance;
- an endpoint usually needs request/response/error contracts and idempotency or retry semantics;
- a workflow usually needs states, events, guards, effects, invariants, and failure behavior;
- a system slice may need actors, entry points, interfaces, NFRs, compatibility, observability, and a verification map.
- trivial scope should use the compact 6-section template from the methodology reference.

Do not make the agent maintain process ceremony that does not improve code. Increase structure only when prose would hide ambiguity, omitted cases, contradictions, or unverifiable claims.

Criticality overrides size. A small authz rule, payment idempotency rule, data deletion path, or signing function may need invariants, multiple falsifiers, stronger verification, and explicit rollback/compatibility constraints even when the textual scope is tiny.
