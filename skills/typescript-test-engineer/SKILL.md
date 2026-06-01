---
name: typescript-test-engineer
description: Design, implement, and maintain robust tests for TypeScript
  projects (Node/React/edge) with focus on node:test, Vitest, mocking,
  determinism, and coverage.
metadata:
  source-version: 0.1.2
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 180e379e98c3b237cbdcc4d63652234a16f0f981909730a0794e0255ba6ea70d
---

# typescript-test-engineer

## Start here

1. Confirm the task is about TypeScript test design, implementation, maintenance, review, CI test behavior, or coverage.
2. Follow the repository test runner and existing conventions before applying defaults.
3. Keep tests deterministic, behavior-focused, isolated from real network calls, and warning-clean.
4. Run the relevant tests and inspect warnings, stderr, hangs, and coverage expectations before claiming completion.

## When to use this skill

- Designing, writing, reviewing, or fixing tests in TypeScript Node, edge, or React projects.
- Debugging node:test, Vitest, mocks, hanging tests, open handles, deprecations, coverage, or CI test behavior.
- Applying explicit TDD only when the user asks for it.

## When NOT to use this skill

- The task is pure TypeScript language work without test design or runner behavior.
- The task is browser interaction automation rather than test strategy; use agent-browser for that workflow.
- The task is security-sensitive CI permission or secret handling without a testing focus; pair with security-reviewer.

## Overview

Use this skill to make TypeScript test work prove observable behavior through the repository's existing runner, isolation patterns, and verification gates. The expected outcome is deterministic tests or review findings backed by exact validation commands, warning status, and any coverage or validation gaps.

## Scope
Applies to TypeScript projects, especially Node and edge backends, plus React apps. If the repo already uses a test runner or established conventions (Jest/Vitest/etc.), follow them and avoid conflicts.

## Non-negotiables (baseline)
- Prefer deterministic, order-agnostic tests; avoid shared mutable global state.
- Keep tests small and behavior-focused; assert on observable outcomes.
- When a spec, security/privacy contract, CI/CD gate, auth/RBAC rule, validation rule, redaction rule, environment boundary, or acceptance falsifier implies forbidden behavior, require negative tests that prove fail-closed behavior; for security-sensitive code, missing negative tests are a test gap.
- Use dependency injection or targeted mocks; avoid real network calls in unit/integration tests.
- When generating larger synthetic test-data sets, prefer `@faker-js/faker` over ad hoc random builders, and seed it when determinism matters.
- Use real systems or dedicated sandboxes in E2E; never use production credentials.
- For test-review or CI-review tasks, read the full touched diff before judging test adequacy; do not infer coverage from one failing or passing test alone.
- For event-driven tests, subscribe or create the `once(...)`/listener promise before triggering the action that emits the event.
- When tests hang or the process does not exit, isolate first, capture handles, patch teardown in the resource-creation scope, and verify repeated stability before calling the issue fixed.

## Quick workflow
1. Identify test level: unit vs integration vs E2E.
2. Confirm runner and TypeScript execution path (node:test + strip/build, or existing toolchain). For React, prefer Vitest + Testing Library.
3. For changed behavior, enumerate touched files and behaviors first; verify what existing tests cover and where coverage is missing.
4. For specified or implied forbidden behavior, plan negative/fail-closed tests from `references/testing.md`; for security-sensitive code, treat missing negative tests as a test gap.
5. For side-effecting/state-changing behavior, list applicable failure modes from the negative matrix in `references/testing.md`; mark irrelevant rows `N/A` with a reason in the test plan or review notes.
6. Design fixtures/mocks for isolation and determinism; when a test double replaces a production state-changing component, plan a shared contract suite for both implementations before relying on the double.
7. For replay/rate-limit regression tests, name the targeted risk or failure mode and make the exercised scenario or assertions prove that exact risk; a prose label alone is not coverage.
8. Implement tests with clear Arrange-Act-Assert.
9. When reviewing test quality, flag removed tests, weakened assertions, behavior changes without matching coverage, missing negative/fail-closed coverage for forbidden behavior, missing negative matrix consideration for relevant state-changing risks, and state-changing doubles without contract coverage.
10. Run relevant tests and inspect output for warnings (including stderr), not only failures.
11. Fix deprecation warnings immediately when they are introduced or detected in touched scope.
12. Run coverage checkpoints according to stage/task cadence.
13. Run final relevant tests; do not claim completion before they pass and warnings are resolved.
14. After any GitHub Actions workflow or CI YAML change, validate the touched YAML files locally before claiming completion (at minimum parse/syntax validation, and repo-standard workflow lint if available).
15. If the CI change also alters permissions, secret handling, or untrusted inputs, pair the task with `security-reviewer`.

## Multi-contour confidence model (default)

Always follow the target repository policy first. Do not invent extra contours if the repo has already defined them.

Default contour model when the repo does not define a different policy:

1. Local contour (fast loop):
   - run targeted or changed-only tests while developing;
   - prioritize short feedback loops over full-suite reruns.
2. PR contour (required checks):
   - run required quality gates for changed scopes;
   - keep deterministic runner settings for merge protection.
3. Release contour:
   - run full required gates + coverage checkpoints + smoke validation.

Optional contour:
- Stability/nightly contour exists only when the repository explicitly defines scheduled repeated/shuffled validation. Do not assume nightly, telemetry, or soak runs are part of the active strategy.

## CI check-only policy

- In CI, prefer check-only lint/format commands.
- Keep auto-fix commands for local development.
- If CI still uses auto-fix commands, flag this as technical debt and propose migration to check-only scripts.

## PR E2E policy decision tree

Repository policy wins:
- if the repo defines risk-based or path-based browser gating, follow that policy exactly;
- do not restore full PR E2E by default when the repository intentionally moved browser coverage to conditional PR gates plus release/manual verification.

When the repo does not define a policy:
1. start with the smallest browser gate that still protects the critical user journeys;
2. keep PR browser tests deterministic and scoped to merge-critical risk;
3. require explicit release/manual browser verification for flows removed from always-on PR coverage;
4. document exact trigger paths or decision rules in project docs/SDD artifacts.

## Flake threshold and rollback guard

Only apply this section when the repository explicitly uses repeated stability suites (for example nightly shuffle/soak runs).

For repeated stability suites:
- instability rate = failed runs / total repeated runs * 100.

Recommended baseline threshold (override when repo policy exists):
- instability rate < 2%.

If threshold is exceeded:
1. freeze parallelism increases;
2. revert to a safer deterministic profile (for example lower workers);
3. create follow-up tasks for isolation fixes;
4. restore the accelerated profile only after stability returns below threshold.

If the repository has no active stability contour:
- do not introduce nightly/telemetry thresholds on your own;
- use the repo's PR and release policy as the source of truth for risk management.

## Deprecated warnings gate (required)

- Treat framework/runtime deprecation warnings in test output as mandatory fixes, not informational noise.
- Do not stop at the single line shown in logs; search the entire affected package/scope for the deprecated API and migrate all occurrences in that scope in the same change.
- Re-run the relevant test command after migration and verify the specific deprecation warning is gone.
- If an immediate fix is impossible (for example blocked by upstream library constraints), explicitly document:
  - exact warning text,
  - why it cannot be fixed now,
  - concrete follow-up task/owner.

## Coverage cadence (required)

- If package has a coverage command (for example `test:coverage`), use it as the primary source of truth.
- Run coverage after major implementation waves in long tasks/stages.
- Run a final coverage checkpoint before closing stage-level implementation.
- Prefer source-only coverage metrics; exclude test files if the runner includes them.
- If there is no dedicated coverage script, run explicit runner coverage flags and record the exact command.

## Coverage failure triage

When normal tests pass but coverage run fails (or behaves differently):
- Re-run using the exact coverage command first.
- Compare runtime flags/environment between `test` and `test:coverage`.
- Isolate failing suite with coverage instrumentation enabled.
- Check for instrumentation-sensitive paths (timers, concurrency, unmocked network, module mocks order).
- If coverage appears to hang near completion (for example `N-1` files done), inspect recently added/changed tests first.
- Wrap local diagnostic runs with shell timeout to avoid blocked sessions while triaging (for example `timeout 900 <coverage-command>`).
- Follow `references/testing.md` runbook and record diagnosis in progress/handover.

## React/Vitest async stability checklist

When touching React Testing Library + Vitest tests:
- Do not leave unresolved promises in mocks (`new Promise(() => {})`) unless you also explicitly resolve/reject them in the test.
- Prefer a deferred helper and close pending async paths before test end.
- Avoid `waitFor(async () => ...)`; keep `waitFor` callbacks synchronous assertions.
- Before clicking submit/action controls, wait until prerequisites are complete and controls are enabled.
- If a legitimate integration scenario is slow only under coverage instrumentation, prefer adjusting the active Vitest config (`testTimeout`, `hookTimeout`, `teardownTimeout`) with rationale; use per-test timeout override only as a last resort.

## URL-state regression checklist (React SPAs)

When UI state is URL-backed (filters, locale, pagination, tabs):
- Verify URL param has highest priority over runtime/persisted state.
- Verify UI interaction updates URL first (or at least produces URL change observed by app state).
- Verify manual URL change (navigate/update search params) immediately updates rendered state.
- Verify no bounce-back/oscillation after change:
  - set state via UI or URL,
  - assert expected value,
  - wait briefly and assert value remains stable.
- Verify canonicalization for accepted variants (for example `IT` -> `it`) when contract requires normalized params.

Recommended assertions:
- assert both rendered value and `location.search` together.
- use `waitFor` for post-navigation stabilization checks.

## CI timeout budgeting for integration suites

- Do not leave integration suites on default timeout (`5000ms`) when real runtime is materially higher.
- For Vitest, set timeout policy in config files (`vitest.config.ts`, `vitest.integration.config.ts`) via `testTimeout`, `hookTimeout`, and `teardownTimeout` instead of scattering per-test overrides.
- For Node.js test runner (`node:test`), configure timeout policy via runner flags in scripts (for example `node --test --test-timeout=30000`) instead of per-test overrides.
- Use per-test timeout overrides only as an exception after root-cause analysis and add inline rationale.
- Practical baseline: choose timeout as at least `3x` local mean runtime of the slowest integration file, then validate in CI.
- If CI shows worker-termination timeouts or OOM, first check for unresolved async/mocks and accidental long polling before only increasing limits.

## Hanging tests and open handles (required on trigger)

Apply this workflow immediately when prompts or logs include any of:
- `node --test` hangs
- tests appear done but the process never exits
- CI times out after tests complete
- open handles / active handles
- passes in isolation but hangs in the full suite

Required sequence:
1. isolate to one file, then one test name;
2. rerun with an explicit reporter and timeout to get location context;
3. capture active handles if the runner is still stuck;
4. patch teardown in the same scope that created the resource, usually with `t.after(...)`;
5. stress-rerun the isolated repro, then rerun the full suite.

Do not mark the issue fixed until repeated isolated runs and a full suite run exit cleanly.

Use `references/testing.md` for the detailed runbook and command path.

## Event timing operational check (required for event-driven tests)

Apply this check when tests involve `EventEmitter`, streams, WebSocket/message events, child processes, or any `once()`/listener-based synchronization:
- create the listener or `once(...)` promise before the act step that may emit the event;
- keep subscription in Arrange and the emitting action in Act;
- avoid sleep-based workarounds for races that are actually caused by late subscription;
- if the event may fire synchronously during setup, change the test arrangement or production seam so the listener can exist first.

Use `references/testing.md` for examples and failure patterns.

## HTTP/SDK mock precision checklist

- Match mocks by `method + pathname (+ query)`, not only by path.
- Keep a strict fallback (`throw new Error("Unexpected request ...")`) to catch drift immediately.
- For SDK-driven auth/session flows, account for secondary requests (for example token refresh calls) that may not be obvious from service code.
- Avoid broad catch-all handlers that shadow other endpoints in the same path family.

## Optional TDD mode (only with explicit request)

Use TDD only when the user explicitly asks for it. If they do, follow this stricter flow and load `references/tdd.md` for the full guide.

### Core rule
No production code without a failing test first.

### Red-Green-Refactor loop
1. **RED**: Write a single, minimal test for one behavior.
2. **Verify RED**: Run the test and confirm it fails for the expected reason (feature missing, not a typo).
3. **GREEN**: Write the smallest code change to pass.
4. **Verify GREEN**: Re-run tests and confirm pass.
5. **REFACTOR**: Clean up while keeping tests green.

### TDD guardrails
- Tests must fail before code is written.
- Favor real behavior over heavy mocks.
- Keep tests small and behavior-focused (one assertion group per behavior).
- If a test passes immediately, fix the test; don't write more code.

### When to pause and ask
- The user requested TDD, but existing code already implements the behavior without tests.
- The user requested TDD, but the first failing test cannot be written without a design change.
- The request is ambiguous about whether to discard already-written production code to preserve strict TDD.

## Testing anti-patterns (reference)

When writing or changing tests, especially with mocks or test utilities, read `references/testing-anti-patterns.md` and follow it.

## When you need more detail
Read only the relevant reference file or skill:
- `references/testing.md` - patterns, examples, mocking, data handling, and coverage.
- `references/tdd.md` - full TDD workflow and rationale (only when explicitly requested).
- `references/testing-anti-patterns.md` - detailed anti-patterns and mock guardrails.
- `references/react-vitest.md` - React testing with Vitest + Testing Library (jsdom/happy-dom, setup, and patterns).
- `agent-browser` skill - UI E2E testing with agent-browser (workflow, snapshots, sessions, and debugging).

## Workflow stages

### Workflow stage: Run the testing workflow

Produce deterministic, behavior-focused tests and verify them through the relevant runner and coverage gates.

1. Identify test level, runner, TypeScript execution path, touched files, and changed behaviors.
2. For specified or implied forbidden behavior, plan negative/fail-closed tests from the contract source: spec, security/privacy contract, CI/CD gate, auth/RBAC, validation, redaction, environment isolation, or acceptance falsifier.
3. For side-effecting/state-changing behavior, list applicable negative matrix rows and mark irrelevant rows N/A with a reason.
4. Design isolated fixtures, mocks, and assertions that prove the named risk or behavior; use shared contract suites when test doubles replace production state-changing components.
5. Implement tests with clear Arrange-Act-Assert and event listeners registered before actions that emit events.
6. Run relevant tests, inspect output and warnings, resolve introduced deprecations, and run coverage checkpoints when required.
7. For CI workflow changes, validate touched YAML and pair with security-reviewer when permissions, secrets, or untrusted inputs change.

Validation:

- Tests assert observable behavior, covering the happy path and relevant negative/fail-closed cases instead of relying on happy-path coverage alone.
- For security-sensitive code, missing negative/fail-closed tests are reported as a test gap.
- Relevant side-effecting/state-changing risks are covered or explicitly marked N/A by relevance.
- Relevant tests pass, warnings are resolved or documented, and coverage policy is followed.

## Interop priority

- **TypeScript language and type-system rules:** typescript-engineer. This skill owns testing strategy and runner behavior, while TypeScript language semantics belong to typescript-engineer.
- **browser interaction and UI E2E automation workflow:** agent-browser. Use agent-browser for browser sessions, snapshots, and debugging workflows.
- **CI permissions, secrets, and untrusted inputs:** security-reviewer. Pair CI security-sensitive testing changes with security-reviewer.

## Policies

### Completion evidence
When reporting completion, name the relevant test, coverage, or CI validation commands that ran; state whether warnings and stderr were clean or documented; and call out any check that could not run with the exact blocker and next-best evidence. Do not imply completion while required validation is missing or still failing.

## Required active references
- [Agent Browser](references/agent-browser.md) — Read this when working with agent browser.
- [React Vitest](references/react-vitest.md) — Read this when you need React testing with Vitest + Testing Library (jsdom/happy-dom, setup, and patterns).
- [Tdd](references/tdd.md) — Read this when you need full TDD workflow and rationale (only when explicitly requested).
- [Testing Anti Patterns](references/testing-anti-patterns.md) — Read this when you need detailed anti-patterns and mock guardrails.
- [Testing](references/testing.md) — Read this when you need patterns, examples, mocking, data handling, and coverage.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory typescript-test-engineer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
