Create a specification that helps an AI coding agent build correct software with fewer guesses.

The spec is not a governance artifact, a product pitch, or a verbose checklist. It is a compact set of statements and representations that narrows the allowed behavior of a system enough that implementation and verification can proceed without inventing missing requirements.

Before writing requirements, place the target inside its parent product, system, workflow, or architecture intent. A locally precise spec can still be wrong when it does not advance or protect that parent capability; if the parent intent is missing, record it as an assumption, gap, or blocking question instead of inventing it.

### Input contract

Acceptable input can be loose, but it must be usable. A ticket, issue, free-form request, product note, API change, code behavior description, domain rule, or migration request can support a draft when it identifies the object, intended behavior, and source material. If the object and behavior are both missing, ask before drafting.

### Capability vs substrate

Capability is observable behavior for the named consumer across actor, trigger, response, state/effect, and continuity. Storage, APIs, queues, schemas, adapters, prompts, tests, logs, generated files, docs, and lifecycle records are substrate unless they are the direct consumer-facing contract. Label substrate-only scope and name the capability it supports.

### Right-sized rigor

Default to the lightest spec that prevents costly mistakes: compact inputs/rules/edges for local behavior, contracts for endpoints, state and failure semantics for workflows, and broader interfaces/NFRs/verification only for system slices. Use the methodology's compact six-section template for trivial scope.

Do not make the agent maintain process ceremony that does not improve code. Increase structure only when prose would hide ambiguity, omitted cases, contradictions, or unverifiable claims.

Criticality overrides size. A small authz rule, payment idempotency rule, data deletion path, or signing function may need invariants, multiple falsifiers, stronger verification, and explicit rollback/compatibility constraints even when the textual scope is tiny.
