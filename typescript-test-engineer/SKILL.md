`---
name: typescript-test-engineer
description: Design, implement, and maintain robust tests for TypeScript projects (Node/React/edge) with focus on node:test, Vitest, mocking, determinism, and coverage.
metadata:
  short-description: TypeScript testing engineering
---

# TypeScript Test Engineer

## Scope
Applies to TypeScript projects, especially Node and edge backends, plus React apps. If the repo already uses a test runner or established conventions (Jest/Vitest/AVA/etc.), follow them and avoid conflicts.

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

## When you need more detail
Read only the relevant reference file or skill:
- `references/testing.md` - patterns, examples, mocking, data handling, and coverage.
- `references/react-vitest.md` - React testing with Vitest + Testing Library (jsdom/happy-dom, setup, and patterns).
- `agent-browser` skill - UI E2E testing with agent-browser (workflow, snapshots, sessions, and debugging).
