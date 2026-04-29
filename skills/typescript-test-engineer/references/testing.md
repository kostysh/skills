# Testing Notes

## Structure
- Unit: `test/unit/*.test.ts` (or your repo's equivalent)
- Integration: `test/integration/*.test.ts` (or your repo's equivalent)
- E2E: `test/e2e/*.test.ts` (or your repo's equivalent)

## Confidence contours (default)

Apply test execution by contour. If repo policy differs, follow repo policy exactly and document the deviation.

- Local: targeted/changed tests for fast feedback.
- PR: full required quality gates for merge safety.
- Release: full gates + coverage + smoke.

Optional stability/nightly contour exists only when the repository explicitly defines scheduled repeated/shuffled validation. Do not introduce nightly, telemetry, or soak runs from this guide alone.

## Changed-scope review for test adequacy

Use this when reviewing a diff, not only when writing new tests.

1. Read the full touched diff and list the changed files before judging coverage.
2. For each changed behavior, identify the expected test layer:
   - unit for pure branching and helpers,
   - integration for HTTP/service composition,
   - E2E for merge-critical user journeys.
3. Check whether tests were added, updated, removed, or silently weakened.
4. Flag any behavior change that lacks an assertion proving the new contract.
5. Record areas you could not verify instead of assuming they are safe.

Specific findings to look for:
- changed production behavior with no matching test updates;
- deleted tests without a replacement at another layer;
- weaker assertions (`toBeTruthy`, status-only checks, broad snapshots) replacing contract checks;
- mocks that bypass the real edge the change was supposed to exercise;
- CI or workflow changes that reduce which tests actually run.

## Side-effecting/state-changing workflow negative matrix

Use this matrix when the changed behavior can mutate state, produce side effects, retry work, replay commands/events, enter terminal states, call an external executor, or persist partial evidence/state. It applies by risk relevance across TypeScript systems; it is not limited to database-backed code.

Before writing or reviewing tests, list the applicable rows in the test plan, review notes, or handover. Rows that do not apply should be marked `N/A` with a short reason. `N/A` rows do not require tests; the point is to make the risk decision visible instead of silently skipping it.

| Row | Risk to consider | Coverage intent |
| --- | --- | --- |
| duplicate request / repeated command | same command, event, idempotency key, request ID, or operator action is submitted twice | prove duplicate handling is rejected, deduped, or idempotent according to the contract |
| concurrent request / parallel command | two actors or workers attempt the same transition or mutation in parallel | prove locking, conflict detection, or deterministic winning behavior |
| state read failure | current state cannot be loaded or decoded before deciding the transition | prove the workflow fails closed, surfaces the expected error, and does not continue from guessed state |
| state write failure | the final state, event, evidence, or side effect marker cannot be persisted | prove the workflow reports failure and does not claim completion without the write |
| completion conflict | completion races with another completion, cancellation, retry, or terminal transition | prove only the allowed terminal result wins and the loser is reported or ignored by contract |
| terminal replay / terminal overwrite attempt | an already terminal workflow is replayed or asked to move to another terminal state | prove terminal state is preserved and cannot be overwritten accidentally |
| live running replay versus stale recovery | replay finds an active in-flight run versus a stale run that should be recovered | prove live work is not duplicated while stale work follows the documented recovery path |
| external executor failure | external job, API, child process, queue worker, browser, model, or runtime executor fails | prove failure is captured, state/evidence remains consistent, and retry or terminal handling follows contract |
| invalid, unknown or stale input | input references unknown state, unsupported command, outdated version, stale token, or obsolete evidence | prove the workflow rejects or normalizes the input without corrupting state |
| partial evidence/state after failure | failure occurs after some evidence, events, files, rows, or side-effect markers were written | prove later reads, retries, and reviews see a coherent partial state or an explicit failure marker |
| retry after partial success | retry occurs after an earlier attempt completed only some writes or external side effects | prove retry resumes, dedupes, compensates, or rejects according to the contract without double-applying side effects |

Do not turn the matrix into a required test count. One test can cover multiple related rows when the scenario truly exercises them. A row can be covered by unit, integration, E2E, or contract tests depending on where the invariant lives.

## Replay and rate-limit regression tests

Use this only for replay, idempotency, quota, or rate-limit fixes.

Required cue:
- name the targeted risk or failure mode the test locks down;
- make the exercised scenario or assertions reflect that named risk;
- do not count a test name, comment, or nearby behavior as coverage when the scenario does not trigger the replay or rate-limit failure mode.

Good examples:
- a replay test sends the same idempotency key or event twice and asserts the second request is rejected, deduped, or produces the documented idempotent result;
- a quota-isolation test sends invalid credentials until the pre-auth limit is hit, then verifies a valid principal, client, tenant, or operator is not blocked by the invalid traffic's bucket;
- a rate-limit key test proves two tenants, clients, or principals do not share the bucket when the fix is about isolation.

Near miss:
- renaming a generic 429 test to mention replay or quota without changing the request sequence, key choice, or assertions that represent the risk.

## Runner
- For Node and edge projects without an existing runner policy, prefer `node:test` and a lightweight TS strip/transform (`node --experimental-strip-types` or similar).
- If the repo already uses Jest, Vitest, or another runner, follow existing conventions unless the task is to change the runner.
- Avoid `ts-node` as a default test execution path.
Notes:
- `--experimental-strip-types` has limitations (no TS emit transforms, decorators, or path-alias rewriting). If you need those, use a lightweight build step (e.g., `tsc --noEmit false` into `dist/` for tests) or a dedicated test build config.
- When running source `.ts` files directly with `node --experimental-strip-types`, ESM import specifiers must match the source extension (use `.ts`, not `.js`). If you build to `dist/`, use `.js` in emitted output.
- For timeout policy in `node:test`, prefer runner-level script flags (for example `node --test --test-timeout=30000`) over per-test timeout options.

## Naming
- File names: `<area>.test.ts` or `<area>.<behavior>.test.ts` (examples: `health.test.ts`, `users.create.test.ts`).
- Test blocks: prefer behavior-oriented names, not implementation details.
  - Good: `returns 400 when payload is invalid`
  - Good: `maps upstream timeout to 504`
  - Avoid: `calls validate()`, `uses zod`

## Patterns
- Unit tests: pure helpers (env parsing, redaction, small utilities).
- Unit tests for error-mapping helpers are mandatory when logic branches on status/problem codes (do not rely only on integration tests for these paths).
- Integration: use a local app factory or HTTP harness with mocked config/env and in-memory deps.
- E2E: runtime-specific harness (Cloudflare Workers: `wrangler unstable_dev`), keep concurrency low.
  - Validate the current recommended runtime workflow for E2E (the `unstable_dev` flow may change).

## Integration test specifics
- Scope: HTTP pipeline + middleware + routing + error mapping, without real network calls.
- Use a local app factory or server harness and provide explicit test env/config; avoid globals.
- Stub external IO via DI or module mocks; never hit real third-party services.
- If the project uses a standard error contract (Problem Details or similar), assert key fields (status, type, title, requestId).
- Keep data setup minimal and local; reset in-memory state between tests.
- Assume tests run in parallel; avoid shared global state and order dependencies.
- Prefer deterministic inputs (freeze time, seed RNG, and stabilize IDs when needed).
- For larger synthetic data sets, prefer `@faker-js/faker` over hand-rolled random object generation, and seed it when reproducibility matters.

## E2E test specifics
- Scope: runtime behavior in the real harness (Workers: `wrangler unstable_dev`).
- Treat it as a black box: assert only via HTTP and responses, not internal internals.
- Keep concurrency low and isolate ports/resources; clean up processes and temp data.
- Use test-only bindings/secrets; avoid production credentials.
- Prefer a small number of high-signal scenarios over many brittle ones.
- Avoid mocks in E2E; use real external systems or dedicated test instances/sandboxes with deterministic data.
- For edge runtimes, distinguish local dev harness behavior from deployed runtime; verify both when it matters.

## Writing tests (examples)
Use Arrange-Act-Assert and keep assertions focused on behavior.

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/index";

// Example assumes a fetch-like app interface (common in modern frameworks).
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
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/index";

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

## Result interpretation
- A failing test should point to the observable behavior that regressed. If the name is unclear, rename it.
- Assertion errors: read the expected vs actual diff first; fix the behavior or the assertion, not both.
- Timeouts/hangs: reduce shared global state, avoid real timers/IO, and tune runner-level timeout settings first (Vitest config or `node --test --test-timeout=...`); use per-test timeout overrides only as rare exceptions with rationale.
- Skips/TODOs: use sparingly; always leave a short reason in the test name or comment.

## Event timing operational check

Apply this check whenever a test waits on events from:
- `EventEmitter`
- streams
- child processes
- WebSocket/message APIs
- any helper built on `once()`, `on()`, or listener callbacks

Core rule:
- create the listener or `once(...)` promise **before** the act step that may emit the event.

Why this matters:
- events can fire synchronously or earlier than the test expects;
- if the listener is attached after the emission, the event is lost;
- the test may then hang or fail intermittently.

Correct pattern:

```ts
import { EventEmitter, once } from "node:events";
import { it } from "node:test";
import assert from "node:assert/strict";

it("waits for ready before asserting", async () => {
  const emitter = new EventEmitter();

  const readyPromise = once(emitter, "ready");

  startWorkThatEventuallyEmitsReady(emitter);

  const [payload] = await readyPromise;
  assert.equal(payload.status, "ok");
});
```

Broken pattern:

```ts
import { EventEmitter, once } from "node:events";

it("races the event emission", async () => {
  const emitter = new EventEmitter();

  startWorkThatEventuallyEmitsReady(emitter);

  const [payload] = await once(emitter, "ready");
});
```

Operational checklist:
1. Put the event subscription in Arrange, not after the action.
2. If the event may fire during constructor/setup code, expose a seam that lets the test subscribe first.
3. Do not paper over ordering bugs with `setTimeout(...)` sleeps.
4. When a hang appears around `once(...)`, inspect subscription order before increasing timeouts.

## CI lint/format policy

- Prefer check-only lint/format commands in CI.
- Keep auto-fix commands local.
- If CI still runs auto-fix, treat it as a migration candidate and document rationale.

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

## Runbook: hanging tests and open handles

Apply this runbook when:
- `node --test` hangs;
- the test runner appears finished but the process does not exit;
- CI times out after tests complete;
- logs mention open handles or active handles;
- a test passes alone but hangs in the full suite.

Definition of done:
- isolated repro passes repeatedly without hangs;
- the full suite exits cleanly;
- any handle-dump tool shows no unexpected leftovers in the touched scope.

### Required sequence

1. Isolate to one file, then one test name.
2. Rerun with explicit timeout and reporter output.
3. Capture active handles if the process still hangs.
4. Patch teardown in the same scope that created the resource.
5. Stress-rerun the isolated repro, then rerun the full suite.

Do not stop at "it passed once".

### Command path for `node:test`

Use the repo's exact command first if it wraps the Node runner. If there is no wrapper, use the direct runner path:

```bash
# 1) Reproduce with fail-fast context
node --test --test-reporter=spec --test-timeout=15000

# 2) Isolate file, then one test name
node --test --test-timeout=15000 path/to/file.test.ts
node --test --test-timeout=15000 --test-name-pattern="should close resources" path/to/file.test.ts

# 3) Dump active handles when the process is still alive
node --import why-is-node-running/include --test path/to/file.test.ts
# then send SIGUSR1 to the printed PID from another shell
kill -SIGUSR1 <pid>

# 4) Stress-rerun isolated repro
TIMEOUT_BIN="$(command -v timeout || command -v gtimeout)"
for i in {1..30}; do
  "$TIMEOUT_BIN" 30s node --test path/to/file.test.ts || { echo "failed on run $i"; break; }
done
```

Install note for diagnostics:
- modern ESM projects: `npm i -D why-is-node-running`
- older CommonJS projects may need `why-is-node-running@v2`

### High-probability root causes

- HTTP server started but never closed
- interval or timeout left running
- database, cache, queue, or SDK client not disconnected
- worker thread, child process, or message channel left alive
- file watcher or readline interface still open
- fire-and-forget async work still pending
- teardown hook throws before cleanup finishes

### Teardown rule

Close the resource in the same scope that created it.

Good:

```ts
import { once } from "node:events";
import { it } from "node:test";

it("serves requests without leaking handles", async (t) => {
  const server = await startServer({ port: 0 });
  const id = setInterval(() => {}, 1000);

  t.after(async () => {
    clearInterval(id);
    server.close();
    await once(server, "close");
  });

  // test body
});
```

Bad:

```ts
it("serves requests without deterministic teardown", async () => {
  const server = await startServer({ port: 0 });
  const id = setInterval(() => {}, 1000);

  // test body
  // no cleanup registered
});
```

### Extra triage notes

- If the suite hangs only under coverage, compare coverage flags and environment with the non-coverage run before changing the test itself.
- If the test hangs only in the full suite, inspect shared globals, singleton clients, and test-order assumptions.
- If the process exits locally but not in CI, inspect worker count, retries, long-polling mocks, and environment-specific timers.

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
  - Set up the mock before importing the module under test; use dynamic `import()` so the mock is in place.
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
- If coverage includes test files in your setup, add `--test-coverage-exclude=test/**` (or your test glob) to keep reports focused on source.
- For HTML reports, use an external converter (e.g., `lcov-viewer`).
- Coverage is a signal, not a goal by itself. Prefer fewer tests with strong assertions over superficial line coverage.
- In CI, consider a modest coverage threshold as a guardrail (but do not chase percentages at the expense of test quality).

## Coverage cadence

- Use project-native coverage command when available (for example `pnpm -C packages/server test:coverage`).
- Run at milestone boundaries in long implementations (after major waves).
- Run a final checkpoint before stage/release closure.
- Record command + summary so coverage decisions are traceable.

## Source-only coverage policy

Coverage KPI should measure production source, not test files.

- Node test runner:
  - add `--test-coverage-exclude=test/**` (or your actual test glob) when needed.
- Vitest:
  - keep `coverage.exclude` aligned (`**/test/**`, `**/*.test.*`, `**/*.spec.*` as needed).
- Verify report tables are source-focused before drawing conclusions.

## Runbook: tests pass, coverage fails

1. Re-run exact coverage command from package scripts (do not approximate flags).
2. Compare command flags and env vars between normal tests and coverage run.
3. Narrow failure to a single suite under coverage instrumentation.
4. Inspect instrumentation-sensitive paths:
   - fake timers / unflushed timers,
   - concurrency assumptions,
   - module mock initialization order,
   - hidden network or filesystem calls.
5. Fix root cause, then re-run full coverage command.
6. Record diagnosis and fix in progress/handover notes.
