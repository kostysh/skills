# Edge Runtime Constraints (Cloudflare Workers focus)

## Limits to design around
- CPU time is limited and varies by plan/runtime; verify current limits and set explicit budgets where supported.
- CPU time limits apply to compute; consult platform docs for exact accounting.
- Subrequest limits can cap fan-out; avoid large parallel fetches per request (legacy models may be lower).
- Cache APIs have platform-specific semantics; verify behavior for headers like `Set-Cookie`.

## Runtime model
- Avoid doing network `fetch()` in global scope; initialize clients lazily inside handlers (Workers disallow `fetch()` outside request handlers).
- Use `ctx.waitUntil()` for non-critical async work (logs, metrics, audit) to avoid blocking responses.
- `waitUntil` runs after the response is sent, but within a limited execution window—keep tasks short.

## Architecture patterns
- Offload heavy/slow work to queues or background tasks.
- Use service bindings (or internal routing) to split large APIs into smaller services and avoid public network hops.
