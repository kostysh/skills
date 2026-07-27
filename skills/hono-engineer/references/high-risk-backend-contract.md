# High-risk backend contract matrix: Hono ownership

Read this reference for high-risk Hono routes involving a public API, Supabase-backed state, authorization, money, retries, external resources, or required audit evidence.

## Responsibility boundary

Consume the `HRB-*` matrix from the owning specification when one exists. `spec-engineer` owns the complete cross-layer handoff; this skill owns the HTTP/runtime integration. Preserve Supabase-owned decisions from `supabase-engineer` and do not invent database, product, security-verdict, or domain architecture rules.

For every applicable Hono-owned row, return the exact request/response behavior, middleware or lifecycle recheck point, safe mapping, and executable evidence. A route, schema, OpenAPI entry, `app.request()` test, or generated type does not close a stronger runtime or database boundary.

## Hono-owned checks

| Row | Required Hono contribution |
| --- | --- |
| `HRB-01` | Bind the accepted idempotency key and actor/target scope to the complete mutation; preserve replay status/body semantics and never mint a replacement key after an unknown outcome. |
| `HRB-02` | Preserve the database winner/loser contract as an exact public outcome; do not add handler-local locks or retries that change command ownership. |
| `HRB-03` | Name the request credential and client construction boundary; require direct data-boundary evidence from `supabase-engineer` instead of treating route denial as RLS proof. |
| `HRB-04` | State admission, phase-transition, stream/heartbeat, delivery, and readback rechecks required by the accepted auth/session/context contract. |
| `HRB-05` | Map validation, domain conflict, genuine retryable failure, persistence failure, audit failure, and unknown outcome to the exact approved public status/code/message without raw SQL/provider leakage. |
| `HRB-06` | Keep missing, forbidden-hidden, `null`, expired/revoked, transport loss, persistence loss, and outcome-verification-required responses distinct; name the allowed retry or reread path. |
| `HRB-07` | Define the canonical bigint/money JSON representation and exact currency/locale examples; reject unsafe implicit number conversion or formatter-selected semantics. |
| `HRB-08` | Apply the accepted Origin/CSRF, credential transport, raw-signature, replay-binding, content-type, and body-limit contract before parsing or side effects. |
| `HRB-09` | Preserve required evidence phase and failure semantics, bound logged/public fields, and prove that error handling neither drops required evidence nor leaks sensitive payloads. |
| `HRB-10` | Map every accepted resource lifecycle transition and actor to a real route/runtime path; preserve expiry, discard/finalize, cleanup, replay, and unavailable states without inventing endpoints. |
| `HRB-11` | Map executable domain rejection from the owning boundary without replacing it with handler-only prose validation. |
| `HRB-12` | Record exact methods, paths, request parts, statuses, headers, media types, bodies, DTOs, cursors/events, names, and compatibility behavior; unresolved fields remain owner-supplied or blocked. |

## Evidence gate

The generated test inventory must map each applicable row to the narrowest real boundary: pure tests for pure mapping, `app.request()` for Hono integration, runtime harness for adapter/lifecycle behavior, and direct Supabase evidence for RPC/RLS. Include negative admission, stale/revoked context, malformed and cross-site requests, exact error bodies, bigint/money serialization, commit/readback loss, and deliberate evidence failure when applicable.
