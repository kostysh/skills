Use this skill to turn an authoritative behavior contract into deterministic TypeScript test design, implemented tests, review findings, or a bounded diagnosis. The result must identify what was actually exercised and must not present green tooling, coverage, fixtures, or mocks as proof of a broader production capability.

## Scope and capability boundary

Apply this skill to TypeScript test strategy and runner behavior for Node, React, and edge projects. Repository runner policy and existing conventions win over defaults.

This skill can:

- select proportionate unit, integration, contract, E2E, or smoke evidence;
- design or implement tests when the selected mode authorizes it;
- review changed behavior against test evidence;
- diagnose runner failures, hangs, warnings, coverage differences, and flaky async behavior.

This skill does not define framework, platform, security, money, persistence, or product behavior. Consume those rules from accepted sources and the relevant domain owner. Browser smoke evidence does not satisfy a formal repository E2E gate unless the repository contract says it does.

## Core testing rules

- Prefer deterministic, order-agnostic tests and avoid shared mutable global state.
- Assert observable outcomes, state transitions, errors, and side effects instead of internal call shape unless the call is itself the contract.
- For low-risk helpers, use the smallest runnable check that fails on the targeted behavior regression.
- Do not downshift security, privacy, money, data-loss, auth, accessibility, release, persistence, RLS, RPC, provider, or production-wiring verification to a tiny self-check.
- When a sourced contract forbids behavior, add negative or fail-closed coverage; for security-sensitive code, missing negative coverage is a test gap.
- Use dependency injection or targeted mocks for isolation. Unit and integration tests must not make uncontrolled real network calls.
- Test doubles must be local or test-only and impossible to select in stage or production runtime.
- Fixtures must preserve relevant production invariants rather than invent convenient roles, sessions, tenants, profiles, readiness, or status combinations.
- In-memory stores and mocks can prove API flow but cannot prove persistence, RLS, RPC, provider authorization, service-role safety, or other unexercised boundaries.
- For state-changing doubles, use a shared contract suite when the double reimplements production state transitions or authorization behavior.
- For event-driven tests, subscribe or create the listener promise before triggering the action that may emit the event.
- For hanging tests in diagnose mode, isolate the repro, inspect handles, identify the cause and evidence limits, and recommend remediation without editing. Only when fixes are explicitly authorized may implementation repair teardown where the resource is created, stress-rerun the isolated case, and run the full relevant suite.

## Test-evidence selection

1. Identify the named behavior, falsifier, risk, runner, TypeScript execution path, and downstream consumer.
2. Select the evidence layer that owns the invariant:
   - unit for pure local input/output and branching;
   - integration for service, HTTP, middleware, adapter, and composition behavior;
   - contract for shared producer/consumer or production/double invariants;
   - runtime or database boundary tests for RLS, RPC, bindings, persistence, or provider behavior;
   - formal E2E for repository-defined user journeys and deployed boundaries;
   - browser smoke only for sampled interaction evidence and diagnostics.
3. For specified or implied forbidden behavior, plan negative/fail-closed tests from `references/testing.md`; for security-sensitive code, treat missing negative tests as a test gap.
4. For side-effecting/state-changing behavior, list applicable failure modes from the negative matrix in `references/testing.md`; mark irrelevant rows `N/A` with a reason in the design or review notes.
5. For replay/rate-limit regression tests, name the targeted risk or failure mode and make the exercised scenario or assertions prove that exact risk; a prose label alone is not coverage.
6. Use clear Arrange-Act-Assert and deterministic time, random, IDs, ports, data, and cleanup where relevant.
7. Run repository-native checks for the selected contour and inspect failures, warnings, stderr, skips, hangs, and coverage differences.

## Confidence contours

Repository policy wins. When no policy exists, use:

- local: targeted tests for fast feedback;
- PR: required deterministic gates for merge risk;
- release: full repository-required gates and documented smoke or E2E evidence where the accepted behavior or release policy requires it; coverage only when an accepted coverage contour exists.

Add repeated shuffle, soak, or nightly stability contours only when the repository defines them. Do not invent telemetry, thresholds, or scheduled jobs from this skill alone.

## Runner and environment selection

- Follow the existing runner. Do not migrate Jest, Vitest, or `node:test` unless runner migration is the task.
- For modern supported Node versions, built-in TypeScript type stripping can execute erasable `.ts` syntax, but it does not type-check, read `tsconfig.json`, transform path aliases, or support syntax that requires JavaScript emit. Read the Node section of `references/testing.md` before choosing direct execution, a build path, or a third-party loader.
- For React, read `references/react-vitest.md`; distinguish simulated DOM tests from Vitest Browser Mode and external browser smoke.
- For Cloudflare Workers without a repository-specific harness, use the current Workers Vitest integration for local runtime unit and integration tests. Treat `unstable_dev` as a legacy migration case, not the default.
- For formal E2E, follow the repository contract and use dedicated test or sandbox credentials. Never use production credentials or real payment instruments.

## Warning and coverage boundaries

- Fix warnings introduced by the current change. For pre-existing or upstream-blocked warnings, record the exact warning, ownership, blocker, and next evidence instead of silently broadening the mutation scope.
- Use the repository coverage command when it exists. Coverage is a signal about exercised code, not proof of assertion quality or real-boundary behavior.
- When normal tests pass but coverage fails, diagnose by rerunning the exact coverage command, comparing flags and environment, and isolating under instrumentation. Recommend the root-cause fix without editing; only an explicitly authorized implementation may apply it before changing thresholds or timeouts.
- When timeout changes are explicitly authorized and justified, centralize integration timeouts in runner configuration or repository scripts; never use increases to hide unresolved async work, open handles, or long polling.

## TDD opt-in

Use TDD only when the user explicitly requests it. Then read `references/tdd.md`. A regression test added after an already-implemented fix is valid test work but is not represented as test-first TDD. Never delete or rewrite existing production code merely to recreate a TDD sequence without separate destructive-change authorization.

## Conditional references

- `references/testing.md` — read the relevant section for Node, edge, integration, E2E, databases, coverage, events, mocks, or hanging tests.
- `references/testing-anti-patterns.md` — read when writing or reviewing mocks, fixtures, test doubles, or test utilities.
- `references/react-vitest.md` — read for React, Vitest, Testing Library, DOM environments, Browser Mode, and async UI tests.
- `references/tdd.md` — read only after explicit TDD opt-in.

If an interop skill such as `agent-browser`, `code-reviewer`, or a domain owner is unavailable, preserve its boundary: provide the test strategy or limited finding that this skill owns and report the unperformed browser, formal-review, or domain judgment instead of inventing evidence.
