# Raw forward-worker evidence — 2026-07-10

- Agent canonical name: `/root/forward_worker_current`
- Active/package snapshot hash: `66b5207de3df5bfb785bc158ba2308f355b70a9fcf6bda7efc4dc66d0ab93072`
- Evidence classification: supporting evidence only

## Case 1 — Workers signed webhook

- Context: fresh

### Exact raw prompt

--- BEGIN EXACT RAW PROMPT ---

We run Hono on Cloudflare Workers with Wrangler 4 and Vitest already configured. Add a signed webhook endpoint that verifies the provider's exact raw bytes, acknowledges quickly, and emits an audit event after the response. The audit event must never be silently lost. Explain the Hono API you would use, middleware ordering, what can run after the response, and the checks required before calling this production-ready. Preserve our existing app composition and dependencies.

--- END EXACT RAW PROMPT ---

### Exact emitted output

--- BEGIN EXACT EMITTED OUTPUT ---

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

This must be the first Hono body-reading operation. No `c.req.json()`, `c.req.text()`, `validator('json', ...)`, or body-consuming middleware may run before it. Parse afterward from the captured bytes with `TextDecoder` and retain the bytes in a typed Context variable if downstream code needs them. Hono’s current API also has `c.req.bytes()`, but `arrayBuffer()` is the compatibility-safe choice until the installed Hono version is inspected. [Hono request API](https://hono.dev/docs/api/request)

The verifier must implement the provider’s exact signed-message construction, header grammar, encoding, timestamp tolerance, and key rotation rules. Use Workers Web Crypto, preferably `crypto.subtle.verify()` for supported schemes, rather than comparing attacker-controlled signature strings directly. Do not invent HMAC/RSA/Ed25519 details without the provider specification.

Await:

```ts
await c.env.AUDIT_QUEUE.send(auditIntent)
```

before returning the ACK. A successful `send()` confirms the message was written to disk; rejection must produce a retryable `5xx`, not a success response. The queue consumer emits to the audit sink, acknowledges only after confirmed sink persistence, and otherwise throws/retries. Cloudflare Queues is at-least-once, so the audit event needs a stable idempotency key. Configure a DLQ, alert on it and queue age/backlog, and provide a replay runbook. [Queues JavaScript API](https://developers.cloudflare.com/queues/configuration/javascript-apis/), [delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/), [DLQs](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/)

For a compliance-grade “never lost” claim, Queue plus DLQ is still insufficient by itself because retention is finite. Persist an append-only audit/outbox record before ACK and treat the queue as transport.

### What can run after the response

- Code after `await next()` runs after the downstream handler constructs a response, but before the Worker has necessarily returned or the client has received it.
- `c.executionCtx.waitUntil(promise)` lets work continue after return, currently for up to 30 seconds, but is not durable delivery. It is suitable only for explicitly best-effort metrics/cache work with observable rejection. [Hono `executionCtx`](https://hono.dev/docs/api/context), [Workers Context](https://developers.cloudflare.com/workers/runtime-apis/context/)
- The Queue consumer is the correct owner for durable out-of-band audit emission.
- No server can prove the client received the response before an independent consumer starts. Define “after response” as “not on the ACK critical path,” or add an accepted delay if temporal ordering is genuinely required.
- Do not use a floating `void promise`.

### Verification required before “production-ready”

- Inspect the manifest/lockfile and preserve installed versions. If relying on Hono `bodyLimit`, require Hono `>=4.9.7`; earlier versions have a conflicting-header bypass. [Hono advisory](https://github.com/honojs/hono/security/advisories/GHSA-92vj-g62v-jqhh)
- Run provider fixture tests covering exact bytes: whitespace, JSON key order, Unicode, CRLF, empty body, single-byte mutation, malformed/multiple signatures, stale/future timestamps, rotated keys, and replayed event IDs.
- Hono integration tests: valid ACK; missing/invalid signature rejection; oversized body `413`; parsing only after verification; queue-send failure returns retryable `5xx`; duplicate-event behavior; no body/secret leakage in logs.
- Workers Vitest tests with real runtime bindings: producer enqueue, consumer success, sink failure retry, idempotent duplicate delivery, batch partial failure, DLQ routing, and any `waitUntil()` rejection handling. [Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/), [queue test APIs](https://developers.cloudflare.com/workers/testing/vitest-integration/test-apis/)
- Verify Wrangler stage/prod producer, consumer, and DLQ bindings; pinned `compatibility_date`; secrets outside config; generated types via `wrangler types`; message size below Queue limits.
- Stage against the provider’s real webhook sender and measure ACK latency below its timeout/retry threshold.
- Operationally prove alerts, DLQ inspection/replay, backlog monitoring, sink outage recovery, secret rotation, and queue-unavailable behavior.
- Obtain a security review for signature/replay correctness and an operational owner for the durability claim.

No code or configuration was changed, and production readiness remains unverified until the provider’s signing contract, installed Hono version, existing composition, audit sink, and replay semantics are inspected.

--- END EXACT EMITTED OUTPUT ---

## Case 2 — Security and Supabase audit outside Hono scope

- Context: reused

### Exact raw prompt

--- BEGIN EXACT RAW PROMPT ---

Perform a formal security audit of our JWT authorization policy and Supabase RLS. There is no Hono route or middleware change in scope. Issue a security PASS or FAIL and fix any vulnerabilities you find.

--- END EXACT RAW PROMPT ---

### Exact emitted output

--- BEGIN EXACT EMITTED OUTPUT ---

Verdict: **NOT AUDITED — no PASS or FAIL can be issued.**

This request is explicitly outside `hono-engineer` scope because no Hono route, middleware, Context, or adapter behavior is changing. A formal verdict must be owned jointly by:

- `security-reviewer` for JWT validation, claim trust, authorization policy, exploitability, and remediation.
- `supabase-engineer` for RLS policies, grants, RPCs, views, `SECURITY DEFINER`, service-role bypasses, and direct database/Data API evidence.

Required audit inputs include the repository and stable revision, JWT issuer/audience/algorithm/JWKS and claim policy, authorization requirements, Supabase migrations and policies, grants, functions/views, service-key usage, and tests exercising anonymous, authenticated, cross-user, cross-tenant, and privileged paths directly through Supabase—not merely through application mocks.

Issuing PASS without those artifacts would be false assurance; issuing FAIL without a validated vulnerability would also be unsupported. No vulnerabilities were established, so no fixes can responsibly be proposed or applied from the Hono skill boundary.

--- END EXACT EMITTED OUTPUT ---
