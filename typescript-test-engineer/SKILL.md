---
name: typescript-test-engineer
description: Design, implement, and maintain robust tests for TypeScript projects (Node/React/edge) with focus on node:test, Vitest, mocking, determinism, and coverage.
---

# TypeScript Test Engineer

## Scope
Applies to TypeScript projects, especially Node and edge backends, plus React apps. If the repo already uses a test runner or established conventions (Jest/Vitest/etc.), follow them and avoid conflicts.

## Non-negotiables (baseline)
- Prefer deterministic, order-agnostic tests; avoid shared mutable global state.
- Keep tests small and behavior-focused; assert on observable outcomes.
- Use dependency injection or targeted mocks; avoid real network calls in unit/integration tests.
- Use real systems or dedicated sandboxes in E2E; never use production credentials.

## Quick workflow
1. Identify test level: unit vs integration vs E2E.
2. Confirm runner and TypeScript execution path (node:test + strip/build, or existing toolchain). For React, prefer Vitest + Testing Library.
3. Design fixtures/mocks for isolation and determinism.
4. Implement tests with clear Arrange-Act-Assert.
5. Run relevant tests and inspect output for warnings (including stderr), not only failures.
6. Fix deprecation warnings immediately when they are introduced or detected in touched scope.
7. Run coverage checkpoints according to stage/task cadence.
8. Run final relevant tests; do not claim completion before they pass and warnings are resolved.
9. After any GitHub Actions workflow or CI YAML change, validate the touched YAML files locally before claiming completion (at minimum parse/syntax validation, and repo-standard workflow lint if available).

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
- Existing code already implemented without tests.
- Tests are hard to write (may indicate design issues).
- The user did not ask for TDD explicitly.

## Testing anti-patterns (reference)

When writing or changing tests, especially with mocks or test utilities, read `references/testing-anti-patterns.md` and follow it.

## When you need more detail
Read only the relevant reference file or skill:
- `references/testing.md` - patterns, examples, mocking, data handling, and coverage.
- `references/tdd.md` - full TDD workflow and rationale (only when explicitly requested).
- `references/testing-anti-patterns.md` - detailed anti-patterns and mock guardrails.
- `references/react-vitest.md` - React testing with Vitest + Testing Library (jsdom/happy-dom, setup, and patterns).
- `agent-browser` skill - UI E2E testing with agent-browser (workflow, snapshots, sessions, and debugging).
