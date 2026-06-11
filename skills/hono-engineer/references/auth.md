# Authentication & Authorization

## General principles
- Separate **authentication** (who) from **authorization** (what they can do).
- Treat auth errors as security-sensitive: keep client responses generic, log details server-side.
- Always attach `requestId` to auth errors and logs.

## API keys (machine-to-machine)
- Use `Authorization: Bearer <key>`.
- Store keys hashed; compare in constant time.
- Include scopes/permissions and per-key limits.
- Support rotation and soft revocation.
- Hono’s Bearer middleware validates token format; non‑matching tokens return 400.
- Token format regex (for debugging): `/[A-Za-z0-9._~+/-]+=*/`.

Minimal example (Bearer token middleware):
```ts
import { bearerAuth } from 'hono/bearer-auth'

app.use('/api/*', bearerAuth({ token: 'replace-with-secret' }))
```

## JWT (user auth)
- Validate `iss`, `aud`, `exp`, `nbf`, and `kid`.
- Enforce allowed algorithms (no `none`, no unexpected algs).
- Cache JWKS and refresh on `kid` miss.
- Keep JWT validation fast; do authorization separately.
- JWT middleware reads `Authorization` by default; can use `cookie` or custom `headerName`.

Minimal example (JWT middleware):
```ts
import { jwt } from 'hono/jwt'

app.use('/api/*', jwt({ secret: 'replace-with-secret' }))
```

Minimal example (JWKS):
```ts
import { jwk } from 'hono/jwk'

app.use('/api/*', jwk({ jwks_uri: 'https://issuer/.well-known/jwks.json' }))
```

## mTLS / service auth
- For high-trust clients, prefer mTLS at the edge (or platform equivalent).
- Keep service-to-service endpoints isolated and audited.

## Cookies + CSRF (if browser auth is used)
- Use CSRF protection for unsafe methods.
- Don’t rely on cookies for public API clients unless required.

Minimal example (CSRF middleware):
```ts
import { csrf } from 'hono/csrf'

app.use('*', csrf())
```

## Authorization policies
- Keep policy checks in pure functions (`can(principal, action, resource)`), called by middleware or routes.
- Enforce tenant boundaries explicitly (do not rely on incidental filters).
- For auth-admission route changes, preserve the touched route's current public, user, admin, webhook, service, or operator admission boundary before changing handler behavior.
- If the route has owner or tenant gate semantics, keep the gate explicit and covered by integration tests rather than relying on route naming or UI-only checks.

## Long-lived protected endpoints

Use this for SSE, streaming responses, subscriptions, or WebSocket-like handlers that can outlive the initial request admission.

Rules:

- Route-level guard protects the opening request, but service/domain logic must support repeated authorization checks during the connection lifecycle.
- Require periodic revalidation or another explicit accepted invalidation mechanism when session, account, role, scope/tenant, active context, maintenance mode, or profile/readiness state can change while connected.
- Stale, revoked, disabled, wrong-context, wrong-scope, or maintenance-denied transitions should produce an observable blocked, closed, or denied state.
- Stream loops must observe request abort/cancellation, clean timers/listeners, and avoid floating promises.
- Tests should cover at least opening admission plus one permission-change transition when the endpoint carries protected data.

## Middleware composition (complex auth flows)
- Use `combine` helpers: `some()` (any pass), `every()` (all pass), `except()` (skip for matched paths).

Minimal example (skip auth for public routes):
```ts
import { except } from 'hono/combine'
import { bearerAuth } from 'hono/bearer-auth'

app.use('/api/*', except('/api/public/*', bearerAuth({ token })))
```
