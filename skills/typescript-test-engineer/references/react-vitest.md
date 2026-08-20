# React Testing with Vitest (Vite apps)

> **Load when:** User asks about testing React UI, Vite + Vitest, Testing Library, jsdom/happy-dom, or frontend test setup.

**Mode boundary:** Any instruction here to edit, install, patch, tune configuration, or change policy is executable only in explicitly authorized implementation/fix mode. In design, review, or diagnose mode, keep repository files and external state unchanged and report the step as a plan or recommendation; safe diagnostic commands may still run within the user's stated boundary.

## Core stack (recommended)
- Builder: Vite (assumed for React apps in this guide).
- Runner: Vitest (paired with Vite).
- DOM env: `jsdom` (or `happy-dom` for speed).
- UI testing: `@testing-library/react` + `@testing-library/user-event`.
- Matchers: `@testing-library/jest-dom`.

If the repo already uses a different runner (Jest/RTL config), follow existing conventions.

## Vitest configuration (best practices)
Based on the shared toolchain guidance for Vite projects:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.d.ts', '**/*.config.*', '**/test/**', '**/*.test.*', '**/*.spec.*']
    },
    typecheck: {
      enabled: true
    }
  }
});
```

Notes:
- Keep `globals: true` if your repo prefers global `describe/it/expect`; otherwise disable and import explicitly.
- Use `vite-tsconfig-paths` when TS path aliases exist.
- Prefer timeout policy in Vitest config (`testTimeout`, `hookTimeout`, `teardownTimeout`) or contour-specific configs, not in individual test cases.
- `typecheck.enabled` remains an experimental Vitest surface. Follow the repository's pinned Vitest version and keep a separate project typecheck when its contract covers more than Vitest type tests.

## Setup file
```ts
// test/setup.ts
import '@testing-library/jest-dom/vitest';
```

## Testing patterns
- Prefer user-visible behavior over implementation details.
- Use `render` + `screen` queries from Testing Library.
- Use `userEvent` for interactions; avoid direct DOM mutations.
- Prefer `findBy*`/`waitFor` for async UI updates.

## Async stability checklist
- Prefer synchronous observable assertions inside `waitFor` because their retry semantics are easier to read.
- Async `waitFor` callbacks are supported when the condition itself requires an async read; they are retried only after the returned promise rejects. Do not perform repeated side effects inside either sync or async callbacks.
- Do not use never-settling mock promises (`new Promise(() => {})`) without explicit resolve/reject path.
- For loading-state tests, use deferred promises and settle them before test end.
- Before clicking async-dependent actions, wait for actionable state (`toBeEnabled`).
- Prefer async locators such as `findBy*` when an element must appear; use `waitFor` only around a causal observable, not as a generic retry wrapper.
- Wait for the observable caused by the action: the intended UI or router state, the specific request/response, or the relevant Query/cache state. Do not substitute an unrelated HTTP call, spinner, or visual change.
- When a valid cache hit performs no HTTP request, assert the no-request branch together with the cached state and its consumer-visible result; do not wait for traffic that the contract forbids.
- In deterministic teardown, unmount or clean the rendered DOM, clear or dispose the test-owned Query cache/client, remove listeners, restore real timers and stubbed globals, and resolve or reject every deferred promise.
- Do not use `sleep`, arbitrary retry, or a longer timeout to compensate for missing ownership or cleanup.

```ts
const deferred = createDeferred<TermsResponse>();
api.getCurrent.mockImplementation(() => deferred.promise);

render(<OnboardingWizardPage />);
const submit = screen.getByRole('button', { name: 'Complete onboarding' });
await waitFor(() => expect(submit).toBeDisabled());

deferred.resolve(mockTerms);
await waitFor(() => expect(submit).toBeEnabled());
await user.click(submit);
```

## Example tests
```ts
// src/components/Counter.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('increments on click', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
```

```ts
// src/features/profile/Profile.test.tsx
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Profile } from './Profile';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Profile', () => {
  it('renders user name from API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ name: 'Ada' })
      })
    );

    render(<Profile />);

    expect(await screen.findByText('Ada')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/profile');
  });
});
```

## Mocking and timers
- Use `vi.fn()` / `vi.spyOn()` for mocks and spies.
- Use `vi.stubGlobal()` for global APIs such as `fetch` and restore them with `vi.unstubAllGlobals()` in `afterEach`, or enable the repository's `unstubGlobals` policy.
- Use `vi.useFakeTimers()` + `vi.setSystemTime()` for time-based UI; always `vi.useRealTimers()` after.
- Prefer mocking at the boundary (API clients, fetch) rather than internal component functions.

## Combined mutation-lifetime falsifier

When a React mutation's required status or outcome verification can outlive a
child, portal, route, entity, or access context, derive the test from the
sourced lifetime matrix. Before writing Arrange-Act-Assert, populate these rows:

| Element | Required identity | Owner and lifetime question |
| --- | --- | --- |
| Route | route or workspace transition identity | Which mounted owner survives the disposable child, and what ends the route lifetime? |
| Access scope | tenant, workspace, role, or other accepted access-context identity | Which owner fences data and presentation when access context changes? |
| Entity | accepted domain entity identity | Which Query/cache and UI state belong only to this entity? |
| Client attempt | a test-visible attempt ID or generation | Which owner distinguishes a newer submit from a late completion of an earlier submit? |
| Outcome verification | a verification ID or generation under the client attempt | Which owner prevents an older reread/retry from confirming a newer attempt? |

For every row, record the authoritative source, state owner, whether it survives
the child/portal remount, its context-loss disposition, and its late-completion
rule. Test-local attempt or verification labels may distinguish controlled
client events when the source does not define backend identifiers; state that
they are test notation, not an invented idempotency or server contract. Return
`limited` or `blocked` instead of omitting a material identity or owner.

Then exercise one combined sequence:

1. pre-populate Query or approved durable cache for access context A;
2. begin the mutation and assert the required pending presentation;
3. unmount and remount the disposable child or close and reopen its portal;
4. resolve the mutation transport but reject the required authoritative reread;
5. assert a visible recoverable non-success state rather than stale cache or a
   false terminal success;
6. switch to context B while a retry timer or late A response from the first
   attempt or verification sequence is controlled;
7. where the accepted flow allows a later submit, return to A, begin a distinct
   client attempt and verification sequence, then settle the older completion;
8. settle or advance every deferred response and timer, then assert that A data
   and status cannot repopulate B and an older attempt cannot settle or overwrite
   a newer attempt or verification sequence;
9. unmount and verify cleanup of timers, listeners, workers, storage, global
   stubs, and every deferred promise so the worker can terminate.

Use the repository's real Query, router, portal, and provider composition at the
smallest level that owns the behavior. Mark an element `N/A` with a sourced
reason when the flow genuinely lacks that boundary; do not add a portal, timer,
or durable store only to satisfy the checklist. Separate mutation transport
success from outcome-verification success in both the assertions and test name.

## Simulated DOM, Browser Mode, and browser smoke

- Use `jsdom` or `happy-dom` for fast component behavior that does not depend on a real browser engine.
- Use Vitest Browser Mode when the repository requires browser-native DOM, CSS, layout-adjacent, or browser API behavior inside the formal test suite.
- Use `agent-browser` when available for sampled interaction smoke and diagnostics. Its session evidence does not replace the repository's Vitest Browser Mode, Playwright, or other formal E2E gate.
- Report which environment actually ran; do not describe simulated DOM results as browser-native evidence.

## Coverage hang triage (Vitest + RTL)
If `test:coverage` hangs while normal tests pass:
- Run exact package coverage command with a shell timeout (example: `timeout 900 pnpm -C packages/client test:coverage`).
- Isolate suspect suites under coverage config (not unit-only config).
- Check recently changed tests for unresolved promises, async-in-`waitFor`, and actions fired before controls are enabled.
- In diagnose mode, report the proven cause and recommend any timeout/configuration change without applying it. Only when fixes are explicitly authorized may implementation tune the active Vitest config (`testTimeout`, and when needed `hookTimeout`/`teardownTimeout`); keep values centralized.
- Use explicit per-test timeout only as a rare exception with a documented rationale.

## Coverage
- Prefer `provider: 'v8'` with `reporter: ['text', 'json', 'html']`.
- Keep source-only metrics by excluding test files (`**/test/**`, `**/*.test.*`, `**/*.spec.*`).
- When the repository or user defines a coverage command or closure gate, run that exact contour at the required checkpoints. Do not invent a coverage gate for a repository that deliberately has none.
- Treat coverage as a signal; prioritize meaningful assertions and edge cases.
