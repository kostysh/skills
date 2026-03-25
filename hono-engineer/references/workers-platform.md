# Edge Runtime Constraints (Cloudflare Workers focus)

## Retrieval rule
- Workers APIs, config fields, and limits change over time. When details are runtime-sensitive, verify against current Cloudflare docs or the local Wrangler schema instead of relying on memory.

## Limits to design around
- CPU time is limited and varies by plan/runtime; verify current limits and set explicit budgets where supported.
- CPU time limits apply to compute; consult platform docs for exact accounting.
- Subrequest limits can cap fan-out; avoid large parallel fetches per request.
- Cache APIs have platform-specific semantics; verify behavior for headers like `Set-Cookie`.

## Bindings and typing
- Generate binding types with `wrangler types` after binding changes; do not hand-write `Env`.
- Keep Wrangler bindings, config schema, and app config in sync. Flag missing or dead bindings early.
- Do not hide binding mismatches with `any` or `as unknown as T`; fix the boundary instead.

## Runtime model
- Avoid doing network `fetch()` in global scope; initialize clients lazily inside handlers.
- Every async side effect must be awaited, returned, intentionally ignored with `void`, or passed to `ctx.waitUntil()`.
- Use `ctx.waitUntil()` for non-critical async work (logs, metrics, audit) to avoid blocking responses.
- Do not destructure `ctx.waitUntil`; call it as a method on `ctx`.
- Stream large or unknown-size upstream responses; avoid `await response.text()` on unbounded payloads.

## Security-sensitive patterns
- Use `crypto.randomUUID()` or `crypto.getRandomValues()` for tokens and identifiers; never `Math.random()`.
- Use timing-safe comparison for signatures and secret values; avoid direct string equality on attacker-controlled secrets.
- Do not use `ctx.passThroughOnException()` as general error handling. Prefer explicit try/catch with structured failures.

## Architecture patterns
- Never store request-scoped data in module-level mutable state.
- Offload heavy or slow work to queues or background tasks.
- Use service bindings (or internal routing) to split large APIs into smaller services and avoid public network hops.
