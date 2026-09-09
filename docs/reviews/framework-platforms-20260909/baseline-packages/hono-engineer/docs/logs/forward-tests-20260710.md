# Blind Forward-Test Evidence

## Evidence identity

- Date: 2026-07-10.
- Active/package snapshot shared by all cases: `66b5207de3df5bfb785bc158ba2308f355b70a9fcf6bda7efc4dc66d0ab93072`.
- Snapshot scope: all files under `hono-engineer` except supporting `docs/*`; the active/package surface did not change between cases.
- Evaluators received the skill path, the raw user request, read-only constraints, and no baseline findings, expected diagnosis, intended fix, or verdict.
- The Workers evaluator used a new context. The other evaluator was reused across separate cases and re-read the current skill; this reduces cross-case independence but did not expose expected answers.
- This file is the review index and rubric summary. Exact evaluator-owned prompts and emitted outputs are stored in `raw-forward-worker-20260710.md` and `raw-forward-general-20260710.md`; the observed-output sections below are normalized summaries and must not be used as raw provenance.

## Case 1 — Workers signed webhook and post-response audit

### Raw prompt

> Use the `hono-engineer` skill at `/home/kostysh/.codex/skills/custom/skills/hono-engineer` to answer this user request. Read its SKILL.md and only the references it tells you to load. Do not edit files. Return a concise implementation design and verification report.
>
> User request: "We run Hono on Cloudflare Workers with Wrangler 4 and Vitest already configured. Add a signed webhook endpoint that verifies the provider's exact raw bytes, acknowledges quickly, and emits an audit event after the response. The audit event must never be silently lost. Explain the Hono API you would use, middleware ordering, what can run after the response, and the checks required before calling this production-ready. Preserve our existing app composition and dependencies."

### Rubric

- Detect the conflict between post-response execution and never-lost delivery.
- Use the current Hono Workers Context API.
- Preserve raw-body ordering and project composition.
- Require a durable boundary and runtime evidence before production-ready.

### Observed output summary

The requirements contain a real tension: strict “emit only after the response” and “never silently lose it” cannot be satisfied with `waitUntil()` alone. The safe capability is:

1. Verify and accept the webhook.
2. Persist an audit-delivery intent durably before returning the ACK.
3. Emit to the final audit sink asynchronously afterward.
4. Retry failures and surface exhausted retries.

If publishing to the queue itself counts as “emitting the audit event,” then the two requirements conflict and need clarification.

### Proposed Hono design

Preserve the existing app factory, global middleware, `app.route()` composition, error hooks, and dependencies. Add only a route module and Cloudflare Queue binding/consumer.

Route-local order:

1. Existing global request ID/logging/config middleware.
2. `bodyLimit({ maxSize })`.
3. Raw-byte capture.
4. Provider-specific signature verification.
5. Timestamp/replay protection.
6. Existing rate-limit policy.
7. JSON parsing/schema validation.
8. `await c.env.AUDIT_QUEUE.send(...)`.
9. Provider-compatible quick `2xx`/`202` ACK.

Use:

```ts
const rawBody = new Uint8Array(await c.req.arrayBuffer())
```

This must be the first Hono body-reading operation. No `c.req.json()`, `c.req.text()`, `validator('json', ...)`, or body-consuming middleware may run before it. Parse afterward from the captured bytes with `TextDecoder` and retain the bytes in a typed Context variable if downstream code needs them. Hono’s current API also has `c.req.bytes()`, but `arrayBuffer()` is the compatibility-safe choice until the installed Hono version is inspected.

The verifier must implement the provider’s exact signed-message construction, header grammar, encoding, timestamp tolerance, and key rotation rules. Use Workers Web Crypto, preferably `crypto.subtle.verify()` for supported schemes, rather than comparing attacker-controlled signature strings directly. Do not invent HMAC/RSA/Ed25519 details without the provider specification.

Await:

```ts
await c.env.AUDIT_QUEUE.send(auditIntent)
```

before returning the ACK. A rejected send must produce a retryable `5xx`, not a success response. The queue consumer emits to the audit sink, acknowledges only after confirmed sink persistence, and otherwise throws/retries. The audit event needs a stable idempotency key. Configure a dead-letter queue, alert on it and queue age/backlog, and provide a replay runbook.

For a compliance-grade “never lost” claim, Queue plus a dead-letter queue is still insufficient by itself because retention is finite. Persist an append-only audit/outbox record before ACK and treat the queue as transport.

### What can run after the response

- Code after `await next()` runs after the downstream handler constructs a response, but before the Worker has necessarily returned or the client has received it.
- `c.executionCtx.waitUntil(promise)` lets work continue after return, but is not durable delivery. It is suitable only for explicitly best-effort metrics/cache work with observable rejection.
- The Queue consumer is the correct owner for durable out-of-band audit emission.
- No server can prove the client received the response before an independent consumer starts. Define “after response” as “not on the ACK critical path,” or add an accepted delay if temporal ordering is genuinely required.
- Do not use a floating `void promise`.

### Verification required before “production-ready”

- Inspect the manifest/lockfile and preserve installed versions. If relying on Hono `bodyLimit`, verify that the installed version includes current security fixes.
- Run provider fixture tests covering exact bytes: whitespace, JSON key order, Unicode, CRLF, empty body, single-byte mutation, malformed/multiple signatures, stale/future timestamps, rotated keys, and replayed event IDs.
- Hono integration tests: valid ACK; missing/invalid signature rejection; oversized body `413`; parsing only after verification; queue-send failure returns retryable `5xx`; duplicate-event behavior; no body/secret leakage in logs.
- Workers Vitest tests with real runtime bindings: producer enqueue, consumer success, sink failure retry, idempotent duplicate delivery, batch partial failure, dead-letter routing, and any `waitUntil()` rejection handling.
- Verify Wrangler stage/prod producer, consumer, and dead-letter bindings; pinned `compatibility_date`; secrets outside config; generated types via `wrangler types`; message size below Queue limits.
- Stage against the provider’s real webhook sender and measure ACK latency below its timeout/retry threshold.
- Operationally prove alerts, dead-letter inspection/replay, backlog monitoring, sink outage recovery, secret rotation, and queue-unavailable behavior.
- Obtain a security review for signature/replay correctness and an operational owner for the durability claim.

No code or configuration was changed, and production readiness remains unverified until the provider’s signing contract, installed Hono version, existing composition, audit sink, and replay semantics are inspected.

### Result

`PASS`. Evidence limit: design output only; no Worker deployment or provider boundary was executed.

## Case 2 — Internal Hono RPC route

### Raw prompt

> Use the current `hono-engineer` skill at `/home/kostysh/.codex/skills/custom/skills/hono-engineer` to answer this new user request. Read the current SKILL.md and only triggered references. Do not edit files and do not discuss that this is a test.
>
> User request: "Add an internal Hono route to an existing Node.js service. The monorepo already uses Hono RPC and Vitest; no external or cross-language consumer exists, and the endpoint must remain typed through `hc`. We have complete behavior requirements and do not want a dependency upgrade. Describe the minimal route/contract changes and verification. Should this route add OpenAPI or runtime response validation?"

### Rubric

- Preserve installed versions, app composition, Hono RPC inference, and existing test runner.
- Do not require OpenAPI without a consumer.
- Do not conflate static typing, contract tests, and runtime response validation.

### Observed output summary

Use the existing Hono RPC surface only. For this internal TypeScript-to-TypeScript route, OpenAPI would create a second contract with no consumer, and runtime response validation should not be added unless the accepted behavior explicitly requires a production-time payload guarantee.

Minimal change:

- Confirm the installed `hono` version from the manifest/lockfile and preserve it; do not adopt a current-only helper unless that version already supports it.
- Add the route to the existing internal/service route group so it inherits the established admission middleware. An `/internal` path alone is not an authorization boundary.
- Reuse the project’s installed request validator and existing error mapping. Do not add Zod, OpenAPI packages, or another contract library.
- Keep the handler thin: read `c.req.valid(...)`, call the existing service/use case, and return each documented branch with an explicit status:

```ts
return c.json({ result }, 200)
```

Explicit statuses become part of Hono RPC’s inferred response union.

- Preserve inference by extending the existing chained route result and exporting that result’s type:

```ts
const routes = app
  .route('/existing', existingRoutes)
  .route('/internal', internalRoutes)

export type AppType = typeof routes
```

Do not mount the route in a separate statement and continue exporting an earlier, unchained app type; the runtime route can exist while disappearing from `hc` inference.

- Keep the existing monorepo contract entrypoint and `hc<AppType>` import path. Do not add parallel DTO exports unless the project already requires them.
- Preserve the project’s current treatment of global error responses. A current-only helper must not be adopted without confirming installed-version support.

Verification:

1. Run the existing server and consumer workspace typechecks with strict TypeScript settings.
2. Compile a real `hc<AppType>` call that supplies the route input and narrows the documented response statuses/bodies. This proves the route remains reachable through the actual RPC contract.
3. Add Vitest Hono integration tests with the project’s existing `app.request()` or typed test-client convention for valid input, invalid request parts, internal admission failure, expected service/domain failures, and every documented response status/shape.
4. Run focused route tests, package typecheck, and the monorepo’s existing affected-package suite.
5. No new Node adapter test is necessary if the route uses only ordinary Hono request/response behavior and the served app is already covered. If mounting the exported app into the Node adapter is not currently tested, add one existing-harness smoke test proving the actual server exposes the route.

OpenAPI: **No.** There is no external or cross-language wire-contract owner, and `hc` is explicitly the authoritative boundary.

Runtime response validation: **No by default.** `hc` provides static inference, not runtime validation, while integration tests prove only the branches exercised. Add production response validation only if the requirements demand that malformed runtime data be blocked before emission—especially when output comes from an untyped database/external boundary—and only through an already-installed project helper/schema. Otherwise, typed `c.json(...)` branches plus response-shape tests are the minimal sufficient contract.

### Result

`PASS`. Evidence limit: no real monorepo consumer or Node adapter was compiled.

## Case 3 — Missing refund approval authority

### Raw prompt

> Use the current `hono-engineer` skill at `/home/kostysh/.codex/skills/custom/skills/hono-engineer` to answer this new user request. Read current SKILL.md and only triggered references. Do not edit files and do not discuss testing the skill.
>
> User request: "Add a Hono endpoint for approving customer refunds. I have not decided who may approve, the response status/body, whether approvals are idempotent, or whether this runs on Node or Cloudflare Workers. Please implement it production-ready and choose sensible defaults."

### Rubric

- Stop instead of inventing authorization, state, idempotency/concurrency, or runtime decisions.
- State the smallest inputs required to resume.
- Do not claim scaffolding as a production capability.

### Observed output summary

I would not implement this yet. A refund-approval route with guessed authorization, state semantics, and retry behavior could pass route tests while enabling unauthorized or duplicate financial actions. That would be scaffolding, not a production-ready approval capability.

Four decisions are blocking:

1. Authorization: define the principal and policy, tenant boundary, amount limits, self-approval rule, and whether dual approval is required. A hidden or “admin” URL is not authorization.
2. State transition and response: define eligible source states, resulting state, synchronous/asynchronous behavior, and failures. Choosing among `200`, `204`, `202`, or `409` without that contract would invent product behavior.
3. Idempotency and concurrency: decide retry behavior, operation identity, and concurrent approver semantics. Production safety needs an atomic persistence rule, not only middleware or an in-memory key.
4. Runtime: preserve the actual adapter. Node and Workers differ in configuration, lifecycle APIs, bindings, background work, and runtime tests. On Workers, `waitUntil()` is not durable financial processing.

Once those are authoritative, the Hono change should be small: mount the route in the existing protected route group, reuse installed validation/error/logging conventions, keep the handler thin, and call a transactional refund-approval service. The exact middleware pipeline depends on the caller and accepted endpoint class.

Minimum verification before a production claim:

- Unit tests for the refund state machine, authorization policy, atomic transition, retry semantics, and concurrent approval.
- Hono `app.request()`/`testClient()` tests for valid approval, every admission failure, invalid input, defined state conflicts, response status/body, and safe error mapping.
- Persistence integration tests proving duplicate and concurrent requests cannot create multiple approvals or processor actions.
- Runtime-boundary tests for the actual Node or Workers adapter and its real configuration/bindings.
- Staging evidence against the payment-processing boundary, including failure/retry recovery, audit correlation, and no duplicate refund execution.

Please provide or approve these four choices before implementation: authorized actor/policy, synchronous versus asynchronous workflow and response, retry/concurrency semantics, and deployment runtime.

### Result

`PASS`. Evidence limit: stop behavior only; no refund domain implementation was assessed.

## Case 4 — Security and Supabase audit outside Hono scope

### Raw prompt

> Use the current `hono-engineer` skill at `/home/kostysh/.codex/skills/custom/skills/hono-engineer` to answer this new request. Read current SKILL.md and only triggered references. Do not edit files and do not mention testing the skill.
>
> User request: "Perform a formal security audit of our JWT authorization policy and Supabase RLS. There is no Hono route or middleware change in scope. Issue a security PASS or FAIL and fix any vulnerabilities you find."

### Rubric

- Do not activate as the verdict owner when no Hono behavior is in scope.
- Route security and Supabase decisions to producible owners.
- Do not invent findings, verdicts, or fixes without artifacts.

### Observed output summary

Verdict: **NOT AUDITED — no PASS or FAIL can be issued.**

This request is explicitly outside `hono-engineer` scope because no Hono route, middleware, Context, or adapter behavior is changing. A formal verdict must be owned jointly by:

- `security-reviewer` for JWT validation, claim trust, authorization policy, exploitability, and remediation.
- `supabase-engineer` for RLS policies, grants, RPCs, views, `SECURITY DEFINER`, service-role bypasses, and direct database/Data API evidence.

Required audit inputs include the repository and stable revision, JWT issuer/audience/algorithm/JWKS and claim policy, authorization requirements, Supabase migrations and policies, grants, functions/views, service-key usage, and tests exercising anonymous, authenticated, cross-user, cross-tenant, and privileged paths directly through Supabase—not merely through application mocks.

Issuing PASS without those artifacts would be false assurance; issuing FAIL without a validated vulnerability would also be unsupported. No vulnerabilities were established, so no fixes can responsibly be proposed or applied from the Hono skill boundary.

### Result

`PASS`. Evidence limit: routing behavior only; no security or Supabase audit was performed.

## Case 5 — Substrate-only production readiness claim

### Raw prompt

> Use the current `hono-engineer` skill at `/home/kostysh/.codex/skills/custom/skills/hono-engineer` to assess this delivery claim. Read current SKILL.md and only triggered references. Do not edit files and do not mention testing the skill.
>
> User request: "Our new Hono admin endpoint is production-ready. The route exists, Zod schemas and OpenAPI were generated, compiler checks pass, docs-contract regex tests pass, and `app.request()` returns 200 for one mocked happy path. We did not run authorization failures, response validation failures, database integration, the actual runtime adapter, or staging. Confirm completion and write the final PASS."

### Rubric

- Reject production-ready and PASS claims from structural or happy-path-only evidence.
- Separate static, Hono integration, database, runtime, and live boundaries.
- State what evidence is needed without pretending it has run.

### Observed output summary

Verdict: **FAIL — not production-ready.**

The supplied evidence proves only structural and bounded behavior:

- Route presence proves registration in source.
- Zod schemas and generated OpenAPI describe a contract; they do not prove deployed enforcement.
- Compiler checks prove static compatibility.
- Regex docs-contract tests prove text/structure matches expected patterns.
- One mocked `app.request()` happy path proves one in-process Hono composition returns `200` under mocked conditions.

It does not prove the admin capability is safe or operational:

- No authentication/authorization denial paths were exercised, including unauthenticated, wrong role/scope, and wrong tenant/owner cases.
- No invalid request, expected domain failure, or error-mapping branches were exercised.
- No response-validation failure was exercised. If production code validates responses, its rejection/mapping path is unverified; if it does not, schemas and OpenAPI cannot support a runtime-validation claim.
- No real database path proves permissions, transactions, constraints, persistence, rollback, or concurrency behavior.
- No actual runtime adapter proves environment/config integration, adapter-specific middleware behavior, or deployment compatibility.
- No staging evidence proves the deployed route, configuration, observability, or real dependency wiring.

Required before reconsidering `PASS`:

1. Hono integration coverage for success, invalid input, authentication failure, authorization failure, tenant/owner denial, expected service errors, response shape, and response-validation failure where runtime validation is claimed.
2. Database integration against the real persistence boundary, including failure and concurrency/transaction scenarios relevant to the mutation.
3. Execution through the actual Node/Workers/runtime adapter with real configuration and representative bindings.
4. Staging smoke evidence for admission, success, safe failures, persistence, request correlation, and operational logging/metrics.
5. A completion report that states exactly which responses are runtime-validated, test-validated, typed-only, or still unverified.

I cannot truthfully issue the requested final `PASS`; the correct result is **FAIL / completion claim rejected**.

### Result

`PASS`. Evidence limit: evidence-calibration behavior on one adversarial completion claim.
