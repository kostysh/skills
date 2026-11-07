# Testing Notes

**Mode boundary:** Any instruction here to edit, install, patch, tune configuration, or change policy is executable only in explicitly authorized implementation/fix mode. In design, review, or diagnose mode, keep repository files and external state unchanged and report the step as a plan or recommendation; safe diagnostic commands may still run within the user's stated boundary.

## Navigation

- [Async completion, time, concurrency, and cleanup](#async-completion-time-concurrency-and-cleanup): required for async/time/concurrency decisions, including polling and diagnosis.
- Runner, integration, E2E, databases, and mocking: use the relevant sections for the exercised boundary and pinned runtime.
- Hanging tests and coverage runbooks: diagnose the cause before proposing timeout or runner changes.

## Structure
- Unit: `test/unit/*.test.ts` (or your repo's equivalent)
- Integration: `test/integration/*.test.ts` (or your repo's equivalent)
- E2E: `test/e2e/*.test.ts` (or your repo's equivalent)

## Confidence contours (default)

Apply test execution by contour. If repo policy differs, follow repo policy exactly and document the deviation.

- Local: targeted/changed tests for fast feedback.
- PR: full required quality gates for merge safety.
- Release: full repository-required gates, plus coverage and smoke only when the accepted repository/user contour requires them.

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
- mocked or in-memory paths accepted as proof for production persistence/RLS/RPC/provider behavior;
- fixtures that create impossible auth/RBAC/session/context/profile/readiness/status states;
- security-sensitive behavior without negative/fail-closed tests for forbidden paths;
- CI or workflow changes that reduce which tests actually run.

## Smallest sufficient check

For low-risk helper logic, use the smallest runnable check that would fail on the targeted behavior regression. This often covers:

- pure branches;
- loops and collection transforms;
- parsers and formatters;
- small validators with local input/output behavior;
- deterministic utility functions.

The check can be a focused unit test, a smoke command, or a repo-conventional self-check, but it must assert observable behavior rather than merely execute the file.

Do not use this rule to downshift high-risk verification. Security, privacy, money, data-loss, auth, accessibility, release, persistence/RLS/RPC/provider, service-role, and production-wiring paths need the stronger project or domain evidence that exercises the real boundary.

## Negative/fail-closed coverage

Do not treat happy-path tests as enough when the source contract forbids behavior. If a specification, security/privacy contract, CI/CD gate, auth/RBAC rule, validation rule, redaction rule, environment isolation boundary, or acceptance falsifier defines an invalid or forbidden path, the test plan must include a negative case that proves fail-closed behavior.

Coverage intent:
- reject, deny, redact, isolate, or abort according to the contract;
- prove the forbidden action does not partially succeed or leak protected data;
- assert the observable error/status/audit behavior the contract requires.

For security-sensitive code, missing negative/fail-closed tests are a test gap. Do not inflate this into a fixed test count: one scenario can cover multiple forbidden paths when it truly exercises them, and irrelevant paths can be marked `N/A` with a short reason.

## Backend production-boundary evidence

Use this when backend behavior depends on auth/RBAC, sessions, active context, persistence, RLS, RPC, provider gates, or service-role boundaries.

Mocks and in-memory stores can prove API flow, validation, routing, and service branching. They do not prove production persistence, RLS/RPC, provider authorization, service-role safety, or security semantics unless the same boundary is exercised or a shared contract suite covers it.

Prefer a layered strategy:

- service/API behavior tests for request/response, validation, error mapping, and orchestration;
- adapter/store contract tests for shared behavior across production and in-memory implementations;
- database/RLS/RPC allow and deny tests with the caller identity that production uses;
- negative cases for stale session, stale active context, wrong role, wrong scope/tenant, revoked/disabled status, and missing profile/readiness when relevant;
- provider test-double boundary tests that prove the double is test-only and stage/prod cannot select it.

Fixtures should model production invariants. Do not seed convenient roles, sessions, profiles, statuses, or scopes that production authorization, RLS, readiness gates, or status rules would reject unless the test is explicitly proving rejection of that impossible state.

When only mock or in-memory evidence exists for a production boundary, report the gap directly:

```text
API-flow tests pass, but the real RLS/RPC/provider boundary is untested.
```

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
- For Node projects without an existing runner policy, prefer `node:test` and first inspect the pinned Node version and TypeScript syntax used by the tests.
- If the repo already uses Jest, Vitest, or another runner, follow existing conventions unless the task is to change the runner.
- Avoid `ts-node` as a default test execution path.
Notes:
- Current supported Node releases can execute erasable `.ts` syntax with built-in type stripping; do not add `--experimental-strip-types` by default when the pinned runtime already enables it.
- Built-in stripping does not type-check, read `tsconfig.json`, rewrite path aliases, transform syntax that requires JavaScript emit, or support `.tsx`. Keep a separate typecheck and use the repository build, `tsx`, or another existing loader when those features are required.
- For direct `.ts` execution, use explicit type-only imports and runtime-compatible relative specifiers. If the project builds tests to JavaScript, follow its emitted extension and module policy instead.
- Prefer the repository timeout wrapper. On Node versions that support it, a runner-level script flag such as `node --test --test-timeout=30000` centralizes policy; otherwise use the programmatic runner or sourced test/hook timeout options.

## Naming
- File names: `<area>.test.ts` or `<area>.<behavior>.test.ts` (examples: `health.test.ts`, `users.create.test.ts`).
- Test blocks: prefer behavior-oriented names, not implementation details.
  - Good: `returns 400 when payload is invalid`
  - Good: `maps upstream timeout to 504`
  - Avoid: `calls validate()`, `uses zod`

## Patterns
- Unit tests: pure helpers (env parsing, redaction, small utilities).
- Unit tests for error-mapping helpers are mandatory when logic branches on status/problem codes (do not rely only on integration tests for these paths).
- Integration: for API flow, use a local app factory or HTTP harness with test config and isolated deps; retain the real boundary when its invariant is the claim.
- Edge runtime tests: use the repository harness. For Cloudflare Workers without one, prefer the current Workers Vitest integration for local runtime unit and integration tests.
- Formal E2E: use the repository-defined deployed or black-box harness; do not relabel a local runtime integration test as deployed E2E.

## Integration test specifics
- Scope: HTTP pipeline + middleware + routing + error mapping, without uncontrolled network calls. When the claim is a database, locking, security, or provider invariant, retain that real boundary in a dedicated test environment; a stub cannot establish it.
- Use a local app factory or server harness and provide explicit test env/config; avoid globals.
- Stub unrelated external IO via DI or module mocks; use authorized test instances/sandboxes for an external boundary under test.
- If the project uses a standard error contract (Problem Details or similar), assert key fields (status, type, title, requestId).
- Keep data setup minimal and local; reset in-memory state between tests.
- Assume tests run in parallel; avoid shared global state and order dependencies.
- Prefer deterministic inputs (control the relevant time source as below, seed RNG, and stabilize IDs when needed).
- For larger synthetic data sets, prefer `@faker-js/faker` over hand-rolled random object generation, and seed it when reproducibility matters.

## E2E test specifics
- Scope: runtime or deployed behavior in the repository's formal harness.
- Treat it as a black box: assert only via HTTP and responses, not internal internals.
- Keep concurrency low and isolate ports/resources; clean up processes and temp data.
- Use test-only bindings/secrets; avoid production credentials.
- Prefer a small number of high-signal scenarios over many brittle ones.
- Avoid mocks in E2E; use real external systems or dedicated test instances/sandboxes with deterministic data.
- For edge runtimes, distinguish local dev harness behavior from deployed runtime; verify both when it matters.
- For Cloudflare Workers, use `@cloudflare/vitest-pool-workers` for current local runtime unit/integration coverage when repository policy does not select another harness. Treat `unstable_dev` only as a legacy migration case and follow current Cloudflare migration guidance rather than starting new suites on it.

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
- Timeouts/hangs: first inspect missed completion signals, subscription order, lock/barrier cycles, frozen deadlines, shared state, and leaked resources. Preserve timers/IO that own the tested invariant. Only after diagnosis may an authorized environment-based adjustment centralize runner-level timeouts; a larger timeout or retry does not fix a race or leak. Use per-test overrides only as rare exceptions with rationale.
- Skips/TODOs: use sparingly; always leave a short reason in the test name or comment.

## Async completion, time, concurrency, and cleanup

Read this section before choosing or assessing an async/time/concurrency technique.
Its goal is control of the significant conditions of a scenario, not control of
every OS schedule. The mode boundary above still applies: a recommended fix
does not authorize editing code, the runner, timeouts, or the tested contract.

### Completion and causal order

- Await or return the Promises for work and assertions on which the test depends,
  including setup, hooks, async matchers, and teardown. A fire-and-forget assertion
  can run after the test has already passed.
- For events from emitters, streams, child processes, or message APIs, create
  listener Promises **before** the action that can emit. Register all relevant
  waits before the first await when multiple events can arrive in one turn.
  If emission happens during construction, inspect existing subscription seams;
  do not invent a production test hook without authority.
- Do not infer readiness from arbitrary `sleep`, a fixed number of event-loop
  turns, or a longer pause. `flushPromises` may settle known local Promise work;
  it does not prove completion of external I/O. A blind retry is not a fix.
- Prefer an existing condition-aware wait. If no direct completion signal exists,
  bounded polling of a side-effect-free observation is valid. Execute the command
  once outside the retried callback. For Testing Library `waitFor`, a throw or
  rejection requests another attempt; returning `false` does not. An async
  callback is supported: it is not called again while its Promise is pending,
  and is retried only after rejection, within the wait's timeout. Await the wait
  itself and keep a functioning outer deadline if a read can stay pending.

This standalone Node example covers synchronous events and cancellation of
waits when startup throws. The failure case is intentional; it proves listener
cleanup, not an application or external-process guarantee. Use APIs supported by
the target's pinned Node version.

```ts
import assert from "node:assert/strict";
import { EventEmitter, once } from "node:events";
import { it } from "node:test";

for (const failStart of [false, true]) {
  it(`settles event waits when failStart=${failStart}`, async () => {
    const emitter = new EventEmitter();
    const controller = new AbortController();
    const ready = once(emitter, "ready", { signal: controller.signal });
    const finished = once(emitter, "finished", { signal: controller.signal });
    // Attach rejection handlers before startup or cancellation can fail.
    const settled = Promise.allSettled([ready, finished]);
    try {
      if (failStart) throw new Error("startup failed");
      emitter.emit("ready", { status: "ok" });
      emitter.emit("finished");
      const [payload] = await ready;
      await finished;
      assert.equal(payload.status, "ok");
    } catch (error) {
      if (!failStart) throw error;
      assert.match(String(error), /startup failed/);
    } finally {
      controller.abort();
      const outcomes = await settled;
      assert.deepEqual(outcomes.map(r => r.status),
        failStart ? ["rejected", "rejected"] : ["fulfilled", "fulfilled"]);
      assert.equal(emitter.listenerCount("ready"), 0);
      assert.equal(emitter.listenerCount("finished"), 0);
      assert.equal(emitter.listenerCount("error"), 0);
    }
  });
}
```

### Choose the time source

Distinguish these sources before mocking:

| Source | What to control or preserve |
| --- | --- |
| Business clock | Use the existing test seam or narrowly mock the date API actually consumed by the decision. |
| Execution timers | Control timers when retry, debounce, timeout, or scheduling behavior is the subject. Keep driver and network timers real by default. |
| Database/external-process clock | JavaScript date mocks do not control PostgreSQL `clock_timestamp()` or another process. Exercise that real source when its behavior is claimed, or explicitly leave the guarantee unproven. |

Use one coherent reference time for fixtures, the operation, and timestamp-bearing
identifiers where their relationship matters. Preserve before/at/after boundary
assertions according to the contract, including equality semantics. Advance the
relevant source or supply boundary data; do not wait out a real TTL or enlarge a
fixture's validity margin to postpone aging. When the clock itself is the tested
external boundary, keep it real and test the contract through that source; a
stubbed application-clock result cannot close the external-clock claim.

Mock the minimum source needed. Do not freeze the whole timer system for a date
comparison, impose a universal Clock API, or add a library/production hook just
for test convenience. Check runner APIs against the installed version before
using them. For retry/debounce with Promise work in timer callbacks, use supported
asynchronous advancement (for example, await Vitest `vi.advanceTimersByTimeAsync`)
and await the resulting observable completion. Setting system time is not timer
advancement; ticking synchronously is not proof that async effects finished.

### Select reachable concurrent phases

`Promise.all` awaits results but does not establish a significant overlap. If the
claim depends on a race, name the relevant phases and use an existing event,
controlled deferred, or local barrier to reach them. Select important orders by
risk; exhaustive permutations are not required.

For atomicity or serialization claims, keep real independent operations and
transactions, separate database connections, and the actual guard/row lock.
A mock that serializes requests for the system cannot prove its protection.
Check the wait graph before using a barrier: every participant must be able to
arrive without a resource held by a waiting participant. If A holds the row lock
while waiting for B at a barrier, and B needs that lock to arrive, the test has
created a cycle. Move synchronization to a reachable phase, such as before lock
acquisition, while keeping the real guard. If the existing boundary cannot expose
the needed phase, report that evidence limit rather than adding sleep or silently
serializing the test.

Example scenario, not a universal harness: both independent requests reach a
pre-lock phase; release them to compete for the last resource; await their public
outcomes and read authoritative final state. Assert the contract's success and
conflict counts and stored remaining count. Allow either permitted winner unless
identity is a contract condition. Report which phase/order was controlled: one
schedule does not cover all races.

### Bound waiting and clean up on every exit

Use the runner deadline or a suitable existing bounded helper with useful phase
or participant diagnostics. It must still expire under business-clock mocking;
do not use a frozen timer or `Date.now()` loop as the only watchdog. A new timeout
wrapper around every await is unnecessary. A timeout reports missing completion,
not readiness, and does not itself stop work.

Register owned cleanup before fallible actions, using hooks or `try/finally`.
Handle participant rejections promptly. On success, failure, or cancellation,
release barriers and request cancellation through supported APIs, including
resource closure if that is how the resource stops work. Await all started work
and finish disposing its clients, servers, connections, or processes in the
resource's supported lifecycle order.
`Promise.all` with early rejection and `Promise.race` do not cancel other
participants; `Promise.allSettled` observes them but cannot unblock a deferred.
Settle or cancel every owned deferred and listener wait so it can terminate;
do not leave hidden unhandled rejections. Restore clocks, mocks, listeners and
globals even if assertions fail. Keep shared clock/global replacements away from
parallel tests, using scoped injection or the runner's isolation/serial policy.
If work cannot be cancelled or joined, retain the independent deadline and
report the cleanup limitation instead of claiming a clean exit.

For UI-specific DOM/cache disposal use [React Vitest](react-vitest.md#async-stability-checklist).
For mock-specific examples see [Testing Anti-Patterns](testing-anti-patterns.md#anti-pattern-8-never-resolving-promises-in-tests).

### API provenance and compatibility

The method above is local and usable without network access. These primary
sources explain patterns or APIs; verify compatibility with the target's pinned
version when selecting a concrete API. If matching evidence is unavailable,
retain the local method and state the unverified API limit rather than migrating
the runner or inventing compatibility.

- [Fowler: asynchronous behavior, time, resource leaks](https://martinfowler.com/articles/nonDeterminism.html).
- [Playwright: waitForTimeout](https://playwright.dev/docs/api/class-page#page-wait-for-timeout).
- [Node 24.21.0: awaiting multiple events](https://nodejs.org/download/release/v24.21.0/docs/api/events.html#caveats-when-awaiting-multiple-events).
- [Vitest dates](https://vitest.dev/guide/mocking/dates), [timers](https://vitest.dev/guide/mocking/timers), [async advancement](https://vitest.dev/api/vi.html#vi-advancetimersbytimeasync).
- [Testing Library: waitFor](https://testing-library.com/docs/dom-testing-library/api-async/#waitfor).
- [PostgreSQL: concurrent isolation tests and blocking steps](https://raw.githubusercontent.com/postgres/postgres/master/src/test/isolation/README).

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

Diagnosis completion in read-only `diagnose` mode:
- the hang is reproduced or narrowed as far as available evidence permits;
- the likely or proven handle/cause and evidence limits are reported;
- the smallest remediation is recommended but not applied.

Post-fix definition of done, only when fixes are explicitly authorized:
- isolated repro passes repeatedly without hangs;
- the full suite exits cleanly;
- any handle-dump tool shows no unexpected leftovers in the touched scope.

### Required sequence

1. Isolate to one file, then one test name.
2. Rerun with explicit timeout and reporter output.
3. Capture active handles if the process still hangs.
4. In `diagnose`, stop at cause/evidence/recommendation without editing.
5. Only in explicitly authorized implementation/fix mode, patch teardown in the same scope that created the resource, stress-rerun the isolated repro, then rerun the full suite.

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
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { it } from "node:test";

it("serves requests without leaking handles", async (t) => {
  const server = createServer((_req, res) => res.end("ok"));
  const id = setInterval(() => {}, 1000);

  t.after(async () => {
    clearInterval(id);
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
    }
  });

  const listening = once(server, "listening");
  server.listen(0, "127.0.0.1");
  await listening;
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const response = await fetch(`http://127.0.0.1:${address.port}`);
  assert.equal(await response.text(), "ok");
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
- For concurrency/serialization tests, keep independent participant connections and transactions; a shared outer rollback must not collapse or serialize the race. Follow the async section's reachable-phase and cleanup rules.
- If transactions are not possible, truncate or delete test rows by a per-test marker.
- Avoid sharing state across tests; make each test independent and order-agnostic.
- If using migrations/fixtures, keep them minimal and deterministic.

## Mocking (Node.js test runner)
Use the built-in `node:test` mocking APIs instead of ad-hoc stubs.

- Mocking guidance from Node.js:
  - **Own code**: mock in unit tests to isolate the unit; consider keeping real in integration tests to increase coverage.
  - **External code (npm deps)**: mock in unit tests; in integration tests, mock if heavy/fragile.
  - **External systems (DBs, HTTP APIs)**: mock unrelated boundaries in unit/integration tests; keep a real dedicated test boundary when its persistence, clock, authorization, atomicity, or serialization is the claim. Avoid mocking the claimed boundary in E2E.

- `mock.fn()` creates spies/mocks for functions and provides call history.
- `mock.module()` replaces ESM/CJS/JSON/builtin modules.
  - Requires `--experimental-test-module-mocks`.
  - Set up the mock before importing the module under test; use dynamic `import()` so the mock is in place.
  - Choose module-mock options from the official versioned documentation for the project's pinned Node runtime. Use `exports` only when that runtime supports it; where its documentation deprecates `defaultExport`/`namedExports`, prefer `exports`. Older runtimes such as [Node 22.22.0](https://nodejs.org/download/release/v22.22.0/docs/api/test.html#mockmodulespecifier-options) use `defaultExport` and `namedExports`; preserve that supported form rather than inferring deprecation from the [current API](https://nodejs.org/api/test.html#mockmodulespecifier-options). Do not combine the two option forms or migrate the runtime/runner to fit an example. If matching API evidence is unavailable, report the compatibility limit instead of guessing.
  - Keep non-mocked exports by re-exporting them from the original module.
  - References created before mocking are not affected, so mock early.
  - Prefer `t.mock` for test-scoped mocks because the test context resets them automatically. When using the global `mock` tracker, call `mock.reset()` in deterministic teardown.

Optional (for Node fetch): use `undici`'s `MockAgent` for HTTP stubbing; `undici` is shipped with Node but not exposed, so install it when needed.

Example (module mock with dynamic import, for a pinned runtime whose API supports `exports`):
```ts
import { after, before, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

describe("uses mocked dependency", () => {
  let handler: () => Promise<void>;
  let dep: ReturnType<typeof mock.fn>;

  before(async () => {
    dep = mock.fn();
    const named = await import("./dep.js").then(({ default: _, ...rest }) => rest);
    mock.module("./dep.js", { exports: { default: dep, ...named } });

    ({ handler } = await import("./handler.js"));
  });

  after(() => mock.reset());

  it("calls dependency once", async () => {
    await handler();

    assert.equal(dep.mock.callCount(), 1);
  });
});
```

For Node 22.22.0, use the same setup and cleanup with this module-mock call instead:

```ts
mock.module("./dep.js", { defaultExport: dep, namedExports: named });
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
- A coverage command does not authorize inventing a CI threshold. Add or change a threshold only when the repository or user explicitly requires that policy decision, and report the chosen basis separately from test evidence.

## Coverage cadence

- Use the project-native coverage command when repository or user policy provides one (for example `pnpm -C packages/server test:coverage`).
- Run it at the checkpoints required by that accepted policy, including a final checkpoint only when the policy makes it a closure gate.
- Record command + summary so coverage decisions are traceable.
- If the repository deliberately has no coverage command or gate, do not invent an equivalent or block closure on unsourced coverage work; report that limit and run the accepted test contour.

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
