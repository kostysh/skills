# Testing Notes

## Structure
- Unit: `test/unit/*.test.ts` (or your repo's equivalent)
- Integration: `test/integration/*.test.ts` (or your repo's equivalent)
- E2E: `test/e2e/*.test.ts` (or your repo's equivalent)

## Runner
- Use `node:test` and a lightweight TS strip/transform (`node --experimental-strip-types` or similar).
- No ts-node.
Notes:
- `--experimental-strip-types` has limitations (no TS emit transforms, decorators, or path-alias rewriting). If you need those, use a lightweight build step (e.g., `tsc --noEmit false` into `dist/` for tests) or a dedicated test build config.

## Naming
- File names: `<area>.test.ts` or `<area>.<behavior>.test.ts` (examples: `health.test.ts`, `users.create.test.ts`).
- Test blocks: prefer behavior-oriented names, not implementation details.
  - Good: `returns 400 when payload is invalid`
  - Good: `maps upstream timeout to 504 Problem Details`
  - Avoid: `calls validate()`, `uses zod`

## Patterns
- Unit tests: pure helpers (env parsing, redaction, small utilities).
- Integration: `createApp().request()` with mocked config/env and in-memory deps.
- E2E: runtime-specific harness (Cloudflare Workers: `wrangler unstable_dev`), keep concurrency low.
  - Validate the current recommended Wrangler workflow for E2E (the `unstable_dev` flow may change).

## Integration test specifics
- Scope: HTTP pipeline + middleware + routing + error mapping, without real network calls.
- Use `createApp().request()` and provide explicit test env/config; avoid globals.
- Stub external IO via DI or module mocks; never hit real third-party services.
- Assert Problem Details for error paths (status, `type`, `title`, `requestId`).
- Keep data setup minimal and local; reset in-memory state between tests.
- Assume tests run in parallel; avoid shared global state and order dependencies.
- Prefer deterministic inputs (freeze time, seed RNG, and stabilize IDs when needed).

## E2E test specifics
- Scope: runtime behavior in the real harness (Workers: `wrangler unstable_dev`).
- Treat it as a black box: assert only via HTTP and responses, not internal internals.
- Keep concurrency low and isolate ports/resources; clean up processes and temp data.
- Use test-only bindings/secrets; avoid production credentials.
- Prefer a small number of high-signal scenarios over many brittle ones.
- Avoid mocks in E2E; use real external systems or dedicated test instances/sandboxes with deterministic data.
- For Workers, distinguish local dev harness behavior from edge runtime behavior; verify both when it matters.

## Writing tests (examples)
Use Arrange-Act-Assert and keep assertions focused on behavior.

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/index";

describe("GET /v1/health", () => {
  it("returns 200 with ok status", async () => {
    // Arrange
    const app = createApp({ env: { ENV: "test" } });

    // Act
    const res = await app.request("http://localhost/v1/health");
    const body = await res.json();

    // Assert
    assert.equal(res.status, 200);
    assert.deepEqual(body, { status: "ok" });
  });
});
```

```ts
describe("POST /v1/users", () => {
  it("returns 400 when payload is invalid", async () => {
    const app = createApp({ env: { ENV: "test" } });
    const res = await app.request("http://localhost/v1/users", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email" }),
      headers: { "content-type": "application/json" },
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.type, "VALIDATION_ERROR");
    assert.equal(body.title, "Validation error");
    assert.ok(body.requestId);
  });
});
```

## Result interpretation
- A failing test should point to the observable behavior that regressed. If the name is unclear, rename it.
- Assertion errors: read the expected vs actual diff first; fix the behavior or the assertion, not both.
- Timeouts/hangs: reduce shared global state, avoid real timers/IO, and set per-test timeouts only when needed.
- Skips/TODOs: use sparingly; always leave a short reason in the test name or comment.

## Test hooks (before/after)
Use hooks for shared setup/cleanup; avoid hiding behavior in hooks. Hooks can be async, so always `await` setup/teardown work.

- `before`: one-time setup for a suite (start a test server, seed shared fixtures).
- `after`: one-time teardown (stop server, close connections).
- `beforeEach`: per-test reset for mutable state (reset in-memory stores, clean temp dirs).
- `afterEach`: per-test cleanup if reset is easier after the test runs (remove files, reset mocks).

Prefer explicit setup inside a test when it improves clarity. If a hook grows beyond a few lines,
split into helper functions and keep the hook minimal.

Example (async hooks):
```ts
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/index";

describe("users", () => {
  let app: ReturnType<typeof createApp>;

  before(async () => {
    await warmUpTestDb();
    app = createApp({ env: { ENV: "test" } });
  });

  beforeEach(async () => {
    // Reset per-test mutable state
    await resetInMemoryStores();
  });

  afterEach(async () => {
    await resetTestMocks();
  });

  after(async () => {
    await closeTestResources();
  });

  it("returns 404 for unknown user", async () => {
    const res = await app.request("http://localhost/v1/users/does-not-exist");
    assert.equal(res.status, 404);
  });
});
```

## Databases in tests
If tests touch a database, design the tests so they leave no residue.

- Prefer a dedicated test database per run (or per worker) with a clean schema.
- Use transactions in `beforeEach` and roll back in `afterEach` when supported.
- If transactions are not possible, truncate or delete test rows by a per-test marker.
- Avoid sharing state across tests; make each test independent and order-agnostic.
- If using migrations/fixtures, keep them minimal and deterministic.

## Mocking (Node.js test runner)
Use the built-in `node:test` mocking APIs instead of ad-hoc stubs.

- Mocking guidance from Node.js:
  - **Own code**: mock in unit tests to isolate the unit; consider keeping real in integration tests to increase coverage.
  - **External code (npm deps)**: mock in unit tests; in integration tests, mock if heavy/fragile.
  - **External systems (DBs, HTTP APIs)**: mock for unit/integration to avoid flakiness; avoid mocking in E2E.

- `mock.fn()` creates spies/mocks for functions and provides call history.
- `mock.module()` replaces ESM/CJS/JSON/builtin modules.
  - Requires `--experimental-test-module-mocks`.
  - Set up the mock **before** importing the module under test; use dynamic `import()` so the mock is in place.
  - Keep non-mocked exports by re-exporting them from the original module.
  - References created before mocking are not affected, so mock early.
  - Usually no need to call `restore()` or `reset()` manually; the runner handles it.

Optional (for Node fetch): use `undici`'s `MockAgent` for HTTP stubbing; `undici` is shipped with Node but not exposed, so install it when needed.

Example (module mock with dynamic import):
```ts
import { before, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

describe("uses mocked dependency", () => {
  let handler: () => Promise<void>;
  let dep: ReturnType<typeof mock.fn>;

  before(async () => {
    dep = mock.fn();
    const named = await import("./dep.js").then(({ default: _, ...rest }) => rest);
    mock.module("./dep.js", { defaultExport: dep, namedExports: named });

    ({ handler } = await import("./handler.js"));
  });

  it("calls dependency once", async () => {
    await handler();

    assert.equal(dep.mock.callCount(), 1);
  });
});
```

Example (DI for external IO in integration tests):
```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/index";

describe("GET /v1/profile", () => {
  it("returns profile data from stubbed client", async () => {
    const app = createApp({
      env: { ENV: "test" },
      deps: {
        userClient: {
          getProfile: async () => ({ id: "u_123", name: "Test User" }),
        },
      },
    });

    const res = await app.request("http://localhost/v1/profile");
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.deepEqual(body, { id: "u_123", name: "Test User" });
  });
});
```

## Coverage
Use built-in Node coverage to verify tests exercise the code paths you care about.

```bash
node --test --experimental-test-coverage \
  --test-reporter=spec --test-reporter-destination=stdout \
  --test-reporter=lcov --test-reporter-destination=.coverage/lcov.info
```

Notes:
- Coverage includes lines/branches/functions. Favor covering error paths, input validation, and auth.
- By default, `node_modules` and test files are excluded. Override with:
  - `--test-coverage-include=<glob>`
  - `--test-coverage-exclude=<glob>`
- For HTML reports, use an external converter (e.g., `lcov-viewer`).
- Coverage is a signal, not a goal by itself. Prefer fewer tests with strong assertions over superficial line coverage.
- In CI, consider a modest coverage threshold as a guardrail (but don't chase percentages at the expense of test quality).
