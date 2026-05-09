# Discovery Techniques

Use these techniques when behavior inventory feels like a checklist instead of analysis, or when criticality is high.

## Equivalence partitioning

Use when validating inputs or classifying cases.

1. Group inputs that should behave the same.
2. Pick one representative per group.
3. Add one invalid group for each rejection class.
4. Verify the spec states the rule for the group, not just the example.

Output to add to the spec: partitions, accepted/rejected classes, representative examples, and error semantics.

## Boundary value analysis

Use when numbers, dates, counts, lengths, percentages, money, pagination, limits, or time windows appear.

Check just below, at, and just above each boundary. Include empty, max, overflow, timezone, precision, and rounding boundaries when relevant.

Output to add to the spec: boundary table and expected result for each edge.

## State-transition coverage

Use when entities have states or workflows.

1. List states.
2. List events.
3. For each state/event pair, define allowed transition, forbidden transition, guard, effect, and audit/observability result.
4. Add invariants that must hold in every state.

Output to add to the spec: state table plus forbidden transitions and invariants.

## Role and abuse-case review

Use when permissions, visibility, user-generated input, security, privacy, or admin/operator actions matter.

Check each behavior for:

- intended actor;
- unauthorized actor;
- privileged actor;
- external client;
- attacker or malformed client;
- operator/support actor.

Output to add to the spec: role matrix, forbidden behaviors, and security/privacy falsifiers.

## Fault analysis

Use when the behavior depends on external systems, network, queue, job, payment, storage, email, webhook, or browser/device state.

Ask what happens when:

- upstream times out;
- upstream returns success but later fails;
- duplicate event arrives;
- event arrives late or out of order;
- write succeeds but response fails;
- retry runs after partial side effect;
- downstream consumer is unavailable.

Output to add to the spec: failure semantics, retry policy, idempotency rule, and recovery expectation.

## Concurrency probe

Use when shared state can be touched by multiple requests, workers, tabs, users, or jobs.

Ask:

- what is the shared state?
- what is the linearization point?
- which races are allowed or forbidden?
- what happens when two valid operations happen at the same time?
- what happens when retry overlaps with the original request?
- what consistency can readers observe during and after the operation?

Output to add to the spec: concurrency invariant, ordering rule, and observable consistency model.

## Behavioral diff

Use when changing an existing system.

For each affected scenario, write:

| Scenario | Current behavior | Target behavior | Preserved behavior | Compatibility note |
| --- | --- | --- | --- | --- |

Output to add to the spec: behavioral diff, migration/coexistence rules, and rollback assumptions.

## NFR quantification

Use when the source says fast, reliable, available, secure, accessible, scalable, usable, or robust.

Replace adjectives with:

- metric;
- threshold;
- object of measurement;
- measurement window;
- environment/load condition;
- verification method.

Output to add to the spec: measurable non-functional constraint and falsifier.
