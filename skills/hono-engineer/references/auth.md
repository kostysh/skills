# Authentication & Authorization

## General principles
- Separate **authentication** (who) from **authorization** (what they can do).
- Preserve the accepted credential source, claims, admission behavior, error envelope, and logging/redaction policy; route new security-policy decisions to `security-reviewer` or the project security owner.
- Keep auth error details within the project-approved client/logging boundary.

## API keys (machine-to-machine)
- Preserve the accepted API-key transport. When that contract uses Hono Bearer middleware, its documented wire shape is `Authorization: Bearer <key>`.
- Apply the accepted storage, comparison, scope, limit, rotation, and revocation policy; Hono's middleware does not define those controls.
- Hono’s Bearer middleware validates the configured token against its documented format and returns 400 when that configuration is malformed; credential mismatch behavior is a separate authentication path. Verify current official semantics for the installed version.
- Token format regex (for debugging): `/[A-Za-z0-9._~+/-]+=*/`.

## JWT (user auth)
- Configure issuer/audience and time-claim validation from the accepted token contract.
- Set an explicit allowed algorithm. Symmetric `jwt()` does not require `kid`; current `jwk()` requires a `kid` header and selects an asymmetric key by that value.
- Let current `jwk()` behavior and the accepted issuer contract govern JWKS caching/refresh; do not invent a cache policy here.
- Keep JWT validation fast; do authorization separately.
- JWT middleware reads `Authorization` by default; can use `cookie` or custom `headerName`.

API-shape example; the complete options contract and allowed algorithm are owner-supplied values. `ownerSuppliedHonoJwtOptions` must preserve the accepted secret source, issuer/audience/time-claim verification, credential transport, and every other selected JWT option; the explicit `alg` prevents an omitted algorithm. The result must be attached only through the accepted auth composition and scope. Do not export it or create a new module/public boundary unless the project already owns that seam:
```ts
import { jwt } from 'hono/jwt'

const projectJwtMiddleware = jwt({
  ...ownerSuppliedHonoJwtOptions,
  alg: acceptedJwtAlgorithm,
})
```

JWK API-shape example; `ownerSuppliedHonoJwkOptions` covers the complete accepted issuer/key-source contract, while `alg` remains explicit. This example creates middleware but does not choose where it is mounted:
```ts
import { jwk } from 'hono/jwk'

const projectJwkMiddleware = jwk({
  ...ownerSuppliedHonoJwkOptions,
  alg: acceptedJwkAlgorithms,
})
```

## mTLS / service auth
- Integrate mTLS or another service credential only when the accepted security/platform contract selects it.

## Cookies + CSRF (if browser auth is used)
- Use a CSRF control whose semantics match the browser authentication and mutation contract.
- Preserve the accepted browser/non-browser credential transport; Hono cookie support does not decide whether a public client uses cookies.

Hono's built-in `csrf()` checks Origin and `Sec-Fetch-Site` for its documented unsafe requests with form-capable content types, and allows the request when either validation passes. It does not implement synchronizer tokens or double-submit tokens and is not evidence that token-protected JSON mutations are covered. Old clients or proxies that omit these headers may require another accepted CSRF method. Verify the current middleware scope in official Hono documentation before using it as the project control.

If the accepted browser/security contract selects Hono `csrf()`, mount it only on that contract's route and content-type scope; this reference does not choose a global path.

### Conditional CSRF reissue integration

Apply this only when the accepted cookie-session contract already requires CSRF reissue after the client loses an in-memory token. Hono does not establish this recovery protocol.

Obtain the accepted cookie, origin, old-token, rotation, response, and pending/active-session behavior before implementing or testing reissue. Do not derive those decisions from Hono's built-in middleware.

The reissue contract is application behavior, not a feature supplied by Hono's built-in `csrf()` middleware. The normal unsafe mutation path still needs the project's token validation and Origin/CORS policy.

## Pending/onboarding sessions

If the accepted authentication model has a pending/onboarding session, integrate its narrower guard without weakening the normal protected API guard. Do not introduce a pending-session model from this reference.

## Authorization policies
- Call the project-owned authorization policy from middleware or routes; do not prescribe its internal shape from Hono guidance.
- Preserve accepted tenant boundaries explicitly rather than relying on route names or incidental filters.
- For auth-admission route changes, preserve the touched route's current public, user, admin, webhook, service, or operator admission boundary before changing handler behavior.
- If the route has owner or tenant gate semantics, keep the gate explicit and covered by integration tests rather than relying on route naming or UI-only checks.

## Long-lived protected endpoints

Use this for SSE, streaming responses, subscriptions, or WebSocket-like handlers that can outlive the initial request admission.

Rules:

- When the accepted stream security contract makes later permission changes effective, route-level opening admission is insufficient and the project-owned stream boundary must support its repeated checks or invalidation signal.
- Use periodic revalidation or another accepted invalidation mechanism only when the security/stream contract requires permission changes to take effect during the connection.
- Preserve the contract-defined observable blocked, closed, or denied behavior for the transitions it names; this reference does not create transition policy.
- Stream loops must observe request abort/cancellation, clean timers/listeners, and avoid floating promises.
- When lifecycle permission changes are in scope, test opening admission and each contract-relevant transition needed by the completion claim.

## Middleware composition (complex auth flows)
- Hono provides `some()` (any pass), `every()` (all pass), and `except()` (skip for matched paths). Select and scope them only from the accepted admission policy; path names do not establish public access.
