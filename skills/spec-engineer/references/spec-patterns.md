# Specification Patterns

Use these patterns to choose the smallest structure that fits the task. Do not paste every pattern into every spec. Criticality can require more rigor than the pattern minimum.

## Small feature

Minimum:

- goal or behavior statement;
- scope and out of scope;
- 3 to 7 atomic requirements;
- main flow;
- important alternate or negative case;
- acceptance criteria;
- anti-claims and gaps.

Best when the feature is user-visible but not state-heavy or interface-heavy.

Common falsifiers:

- the UI or API reports success but no durable effect exists after reload;
- an unsupported actor can perform the feature;
- a documented negative case still follows the happy path.

## API endpoint or integration

Minimum:

- purpose and actor/client;
- method, path, event, command, or message name;
- authentication and authorization expectations;
- request contract: fields, types, requiredness, formats, ranges, cross-field rules;
- response contract: success shape, status, side effects;
- error model: validation errors, permission errors, conflicts, rate limits, upstream failure;
- idempotency, retry, ordering, timeout, and consistency semantics when relevant;
- compatibility and versioning rules;
- positive and negative examples;
- acceptance and contract validation path.

Common falsifiers:

- successful response with missing durable side effect;
- duplicate side effects after retry;
- undocumented error shape;
- backward-incompatible response for an existing client.

## Validation rule

Minimum:

- object being validated;
- formal rule;
- decision table when more than two conditions interact;
- positive examples;
- negative examples;
- error output semantics;
- acceptance criteria.

Decision table shape:

| Case | Condition A | Condition B | Expected result |
| --- | --- | --- | --- |
| 1 | true | true | accept |
| 2 | true | false | reject with ... |

Common falsifiers:

- a negative example is accepted;
- a positive example is rejected;
- the error payload does not identify the violated rule;
- equivalent inputs are treated inconsistently without a stated reason.

## Workflow or state transition

Minimum:

- states;
- events;
- guards;
- transition effects;
- forbidden transitions;
- invariants;
- failure and recovery behavior;
- observability and audit behavior when relevant.

State table shape:

| Current state | Event | Guard | Next state | Effects |
| --- | --- | --- | --- | --- |
| Pending | Approve | actor has permission | Approved | record approval event |

Common falsifiers:

- transition succeeds from a forbidden state;
- state changes without required effect;
- effect occurs but state does not change;
- reload or restart loses the transition result.

## Migration behavior

Minimum:

- source state and target state;
- compatibility assumptions;
- sequencing;
- dry run or preview behavior when relevant;
- retry and rollback semantics;
- data invariants before and after;
- observability and failure reporting;
- acceptance criteria that prove migrated data remains usable.

Common falsifiers:

- migrated records violate target invariants;
- existing readers break without a compatibility statement;
- retry creates duplicates or loses data;
- rollback leaves mixed unsupported state.

## Non-functional constraint

Minimum:

- metric;
- threshold;
- object of measurement;
- measurement window;
- environment or load condition;
- verification method.

Weak:

```text
The service MUST be fast.
```

Better:

```text
Checkout API p95 server-side latency MUST NOT exceed 300 ms at 200 RPS over a
5-minute measurement window.
```

Common falsifiers:

- the metric is measured on the wrong object or side of the boundary;
- the threshold passes only outside the specified load/window;
- the implementation cannot expose the measurement needed to verify the constraint.

## Function-level specification

Minimum:

- purpose;
- input types and invalid inputs;
- output type;
- side effects, or explicit no-side-effects statement;
- deterministic behavior and invariants;
- edge cases;
- examples;
- acceptance tests or properties.

Common falsifiers:

- accepted invalid input;
- output violates invariant;
- hidden mutation occurs when function is specified as pure;
- edge case produces an undocumented result.

## UI behavior specification

Minimum:

- actor and task;
- visible state and controls;
- input behavior;
- loading, empty, error, disabled, and success states;
- persistence or URL state when relevant;
- accessibility behavior: focus management, keyboard navigation, screen reader announcements, contrast requirements when normative, and error-message association with fields;
- acceptance criteria based on observable UI behavior.

Common falsifiers:

- a keyboard-only user cannot complete the specified task;
- focus is lost or trapped after modal, validation, route, or async state changes;
- screen reader users do not receive required status or error announcements;
- a visible error is not programmatically associated with the field or control it explains.

Avoid specifying decorative implementation details unless the design system or user request makes them normative.
