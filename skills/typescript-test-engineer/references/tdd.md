# Test-Driven Development (TDD)

## Activation boundary

Load and apply this reference only when the user explicitly requests TDD or a test-first workflow. Do not convert ordinary implementation, regression-test, review, or diagnosis work into TDD by default.

TDD describes the order used for new behavior in the authorized scope:

1. write a focused test;
2. run it and confirm the expected failure;
3. implement the smallest behavior that makes it pass;
4. refactor while keeping the relevant suite green.

It does not authorize deleting, reverting, or rewriting existing production code. Destructive rework requires a separate explicit user decision.

## Readiness check

Before starting the loop:

- identify the authoritative expected behavior and its falsifier;
- confirm production implementation for that behavior has not already been written in the current work;
- confirm the request authorizes production changes, not only tests or review;
- identify the narrowest runner command that demonstrates RED and GREEN.

If expected behavior is missing or conflicting, inspect accepted specifications, acceptance criteria, repository contracts, and callers. Stop with a blocked result rather than writing an assertion from the current implementation.

If the behavior is already implemented:

- do not delete or hide the implementation to manufacture a RED step;
- add the requested regression or characterization test against authoritative behavior;
- report that the work is tests-after/regression coverage, not TDD;
- ask only when the user specifically requires strict historical test-first evidence and destructive rework would be needed.

## Red-Green-Refactor

### RED — specify one behavior

Write the smallest test that expresses one sourced behavior or falsifier. Prefer observable output, state, error, or side effect over implementation details.

Run the narrow test and confirm:

- it fails rather than crashes during setup;
- the failure message matches the missing behavior;
- it does not fail because of a typo, invalid fixture, unavailable dependency, or unrelated baseline defect.

If the test passes immediately, determine why:

- behavior already exists — classify the test as regression/characterization coverage;
- assertion does not exercise the behavior — repair the test;
- fixture or mock bypasses the real path — select a stronger boundary.

Do not change production code until the intended RED result is understood.

### GREEN — implement the smallest behavior

Change only what the failing test and accepted contract require. Avoid speculative options, abstractions, dependencies, or unrelated cleanup.

Run the narrow test, then the relevant surrounding suite. Fix production behavior when the test correctly represents the contract; fix the test when its setup or assertion is wrong.

### REFACTOR — preserve behavior

After GREEN:

- remove duplication introduced by the change;
- improve names or local structure only when it makes the behavior clearer;
- keep the relevant tests running during refactoring;
- do not introduce new behavior without a new RED case.

## Test-quality guardrails

- A watched RED step proves only that the test can detect that observed absence; it does not prove the full requirement or production boundary.
- A GREEN step proves only the scenario and boundary exercised.
- Use mocks only after understanding which production side effects and invariants the scenario needs.
- Add relevant negative/fail-closed scenarios for forbidden behavior.
- Use contract or real-boundary tests when an in-memory double cannot prove persistence, RLS, RPC, provider, or runtime behavior.
- For async and event-driven behavior, arrange subscriptions and controlled promises before triggering the action.

Read `references/testing-anti-patterns.md` when mocks, fixtures, test doubles, or test utilities are involved.

## Completion evidence

Report:

- the authoritative behavior source;
- the RED command and expected failure, or the reason the case was classified as already-implemented regression coverage;
- the GREEN command and result;
- relevant suite, typecheck, coverage, warning, and stderr status required by repository policy;
- production boundaries not exercised;
- any blocked or skipped TDD step.

Do not claim TDD when the test was written after the behavior. Do not claim the broader capability from a green unit test when a stronger boundary remains unverified.

## Stop rules

Stop before production changes when:

- the user requested only review, diagnosis, or test design;
- expected behavior cannot be sourced;
- the first test requires an unapproved interface or architecture change;
- strict TDD would require deleting or reverting existing work without explicit permission;
- the test can pass only through a mock or fixture that bypasses the named production risk.
