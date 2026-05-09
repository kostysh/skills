# Self-Deception Anti-Patterns

Use this before finalizing a spec that might pass without delivering the claimed behavior.

## Substrate-only acceptance

Problem: acceptance can pass through schema, logs, mock, wrapper, generated docs, or tests without observable behavior.

Fix: add a behavioral acceptance criterion and a falsifier that checks the actor-visible result and durable state/effect.

## Tautological acceptance

Problem: "System returns X when it should return X."

Fix: state the input condition, rule, observable response, state/effect, and a falsifier.

## Mock-driven success

Problem: the spec claims an integration works because the mocked upstream returns success.

Fix: distinguish support tests from integration evidence. Add contract validation, failure semantics, and a demo or conformance path against the real boundary when required.

## Single-actor blindness

Problem: behavior is specified only for the happy actor.

Fix: include role/permission cases for intended actor, unauthorized actor, privileged actor, operator/support actor, and malformed client when relevant.

## Hidden retroactive scope

Problem: criteria silently apply to existing data, old clients, or in-flight workflows without saying so.

Fix: add compatibility and migration scope: new data only, existing data, mixed state, rollback, and deprecation behavior.

## Completion-bias scope

Problem: spec stops after happy path, treating edge cases as someone else's work.

Fix: require at least one alternate path, one invalid/negative case, and one falsifier for each important behavior.

## Vague slot words

Problem: words such as appropriate, if applicable, as needed, graceful, robust, secure, fast, and user-friendly create implementation freedom where a constraint is needed.

Fix: replace each with observable condition, metric, rule, or explicit non-goal.

## Example-as-rule

Problem: examples are treated as the only normative behavior.

Fix: write the general rule, then add positive and negative examples that illustrate it.

## Rule-example conflict

Problem: an example contradicts the normative rule.

Fix: the rule wins unless the author explicitly changes the rule. Correct the example and add a note if the boundary was ambiguous.

## Test-default verification

Problem: the spec says "test" for every requirement even when the claim is static, contractual, capacity-based, or operational.

Fix: choose the most direct method: inspection for static facts, contract/schema validation for interfaces, analysis for capacity/risk, conformance suite for standards, simulation/model checking for complex temporal/state behavior.
