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
5. Add coverage and CI guardrails if missing.

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
