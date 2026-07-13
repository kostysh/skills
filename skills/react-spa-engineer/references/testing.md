# Testing React SPA

Use Vitest and Testing Library for local React behavior and Playwright for real
browser flows in the fixed stack. Repository commands and installed versions win
over generic setup examples. Use `typescript-test-engineer` for runner,
determinism, fixtures, mocks, and CI test-contour decisions.

Unless a block is explicitly labeled copyable, code blocks in this reference
are conceptual and omit project imports, fixtures, configuration, and cleanup.

## Evidence levels

| Evidence | Proves | Does not prove |
| --- | --- | --- |
| Typecheck/lint/build | The exercised compiler, lint, and bundler contours | User behavior or backend integration |
| Vitest pure/unit | The invoked functions and branches | Browser layout, focus, navigation, or real IO |
| Testing Library in jsdom | Local rendered DOM and simulated interaction | Full browser or accessibility behavior |
| Vitest Browser Mode | Behavior in its configured browser/test harness | Production backend/provider behavior |
| Playwright with intercepted network | Local browser UI contract against fixtures | Real API, session, provider, or persistence boundary |
| Playwright against integrated test services | The named browser/service scenarios | Untested browsers, data, environments, or production |
| Browser walkthrough | The observed scenario and environment | Repeatable regression coverage by itself |

Select the level from the completion claim. Do not upgrade mock-level evidence by
calling it end-to-end.

## Testing Library

Query by user-visible semantics:

1. `getByRole` with accessible name;
2. `getByLabelText` for labelled form controls;
3. visible text/value/alt text where appropriate;
4. `getByTestId` only when no semantic query can represent the accepted UI.

Create `userEvent` in the test and await user interactions:

```tsx
test('submits the accepted form values', async () => {
  const user = userEvent.setup();
  render(<ProfileForm />);

  await user.clear(screen.getByRole('textbox', { name: /display name/i }));
  await user.type(
    screen.getByRole('textbox', { name: /display name/i }),
    'Ada',
  );
  await user.click(screen.getByRole('button', { name: /save/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/saved/i);
});
```

Use `findBy*` for an element expected to appear asynchronously and `waitFor` for
an assertion that must eventually become true. Use `queryBy*` for absence. Do not
put side effects into `waitFor` callbacks.

## Test providers and isolation

Create a fresh QueryClient, router/history, Zustand state, and approved Dexie
database scope per test or test worker. Restore global stubs and mocks after each
test.

- Disable or control Query retries and timers explicitly in local tests.
- Clear IndexedDB tables, localStorage, and sessionStorage created by the test.
- Do not share logged-in identities, tenant keys, service workers, or browser
  storage across parallel cases.
- Treat source-grep assertions as smoke checks, not behavioral enforcement.
- Use executable import rules for architecture boundaries.

## Network doubles

MSW or Playwright interception can model typed client responses and failure
states. Fixtures must conform to the accepted API schemas and preserve important
security/error shapes.

Cover applicable negative paths: timeout/cancellation, typed validation errors,
unauthorized or forbidden responses, CSRF recovery, retry ceiling, stale cache,
context switch, duplicate submission, and partial failure.

Do not include realistic-looking tokens or credentials in fixtures, logs, traces,
or screenshots.

## Playwright setup

First inspect whether the repository already has `@playwright/test`, a config,
browser installation, web server command, projects, and CI policy. Reuse them.

For a greenfield project, follow the current official installer rather than a
bare `playwright` package invocation:

```bash
pnpm create playwright
```

Official installation: <https://playwright.dev/docs/intro>

If the package is installed without browser binaries, run the repository's
approved Playwright browser-install command in the appropriate development or CI
environment. Installing dependencies or browsers is a side effect and requires
the task's implementation authority.

An illustrative Vite config must still be adapted to repository commands,
ports, workers, retries, trace retention, authentication fixtures, and CI
resources:

```ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

This is conceptual: it does not define the project's CI parallelism, environment,
secrets, database isolation, or service readiness.

## Material interactive flow gate

For auth, onboarding, profile editing, business-data submission, protected
navigation, destructive confirmation, checkout, or a multi-step wizard, a
`completed` interactive claim requires:

1. Playwright scenarios for the affected happy path and meaningful failure/edge
   states;
2. a successful run of the command that covers those scenarios;
3. real browser automation of the affected flow;
4. a handoff naming scenarios, environment, command/result, browser result, and
   evidence limits.

When the claim includes a real cookie session, CSRF recovery, server
authorization, provider, or durable data boundary, run against the corresponding
integrated test service. Intercepted network proves only local browser behavior.

If the necessary environment is unavailable, report `partial` or `blocked`
according to whether useful implementation evidence exists. Do not substitute a
route, screenshot, fixture, mock, config file, or unexecuted test.

For a small isolated interaction, component tests plus browser walkthrough may
support a deliberately narrower local claim. State that boundary explicitly.

## Persistence scenarios

When URL/Dexie/context behavior changes, cover applicable cases:

- direct link and manual URL edit;
- reload and back/forward navigation;
- expired and stale records;
- prior-version migration with representative stored data;
- storage unavailable/quota failure when relevant;
- logout and tenant/user switch without old-context repopulation;
- Query/Dexie invalidation after mutation.

## Accessibility scenarios

Test accessible names, keyboard sequences, focus entry/return, error/status
announcements, and route-navigation focus. For custom composite widgets, cover
the full selected APG interaction model in a real browser. An axe-style ruleset
or semantic query is useful but not a complete accessibility verdict.

## Reporting

Report the behavior contract, scenarios, commands, results, environment, real or
mocked boundaries, and untested risk. Green tests prove only what they executed;
coverage percentage, snapshots, fixtures, and configuration remain substrate
unless tied to a falsifiable behavior.
