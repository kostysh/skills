# Edge Runtime Constraints (Cloudflare Workers focus)

## Retrieval rule
- Workers APIs, config fields, and limits change over time. When details are runtime-sensitive, verify against current Cloudflare docs or the local Wrangler schema instead of relying on memory.

## Limits to design around
- CPU time is limited and varies by plan/runtime; verify current limits and apply a budget only when the platform/operations owner supplies one.
- CPU time limits apply to compute; consult platform docs for exact accounting.
- Subrequest limits can cap fan-out; verify the current limit and keep fan-out within the accepted upstream/concurrency contract.
- Cache APIs have platform-specific semantics; verify behavior for headers like `Set-Cookie`.

## Bindings and typing
- When the project uses Wrangler-generated binding types, regenerate them after binding changes. Otherwise preserve its accepted Env ownership instead of imposing a generation migration.
- Keep the accepted Wrangler bindings, config schema, and app config consistent. Flag observed mismatches without inventing bindings.
- Do not hide binding mismatches with `any` or `as unknown as T`; fix the boundary instead.

## Runtime model
- Avoid doing network `fetch()` in global scope; initialize clients lazily inside handlers.
- Await work that determines the response or accepted delivery contract.
- Use `c.executionCtx.waitUntil(promise)` for work allowed to continue after the response; observe rejection through the project's logging/metrics boundary. Do not destructure `waitUntil`.
- For HTTP-triggered Workers, all `waitUntil()` calls share at most 30 seconds after the response or disconnect; unsettled Promises are canceled. Verify current platform limits before relying on the window.
- `waitUntil()` extends the invocation lifetime but is not durable delivery. If loss or retry changes accepted behavior, await a durable enqueue and process it through a queue or equivalent selected by the platform/architecture owner.
- Do not use `void` merely to silence a floating Promise. Detached work needs an explicit lifecycle owner and failure handling.
- Stream large or unknown-size upstream responses; avoid `await response.text()` on unbounded payloads.
- For long-lived streams, wire abort/cancel handlers to clear timers, upstream subscriptions, and pending work; do not rely on one-time route admission for protected event delivery.

## Security-sensitive patterns
- `Math.random()` is not a cryptographic primitive. When generating security-sensitive values, use the runtime-compatible primitive and format selected by the security owner.
- Plain string equality is unsafe for attacker-controlled secret comparison. Use the runtime-compatible verification/comparison primitive selected by the accepted cryptographic contract.
- `ctx.passThroughOnException()` does not define an application error contract; preserve the project's accepted failure handling instead of treating it as a general Hono error mapper.

## Architecture patterns
- Never store request-scoped data in module-level mutable state.
- Offload work only through the accepted lifecycle/delivery mechanism; do not equate background execution with durable processing.
- Use service bindings or internal routing only when the accepted architecture selects that boundary.
