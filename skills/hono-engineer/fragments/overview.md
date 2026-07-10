## Capability and scope

Guide Hono-specific routing, middleware, Context, contract integration, and verification decisions inside an existing or greenfield API. The capability is an observable HTTP or runtime behavior with evidence at the boundary claimed by the task.

This documentation does not ship a Hono runtime, make an endpoint production-ready by itself, or replace security, data, runtime, architecture, and testing authorities. Compiler success, route/schema presence, mocks, `app.request()`, and structural docs tests are substrate or bounded evidence, not universal runtime proof.

## Minimum inputs and readiness

Before implementation, derive or obtain:

- the authoritative request and externally observable behavior, including error and recovery behavior;
- the current app factory or entrypoint, route composition, middleware/error hooks, and project conventions;
- installed `hono`, companion package, adapter, and runtime/tooling versions;
- endpoint class and its auth, CSRF, tenancy, replay, payload, caching, streaming, or webhook contract;
- available unit, Hono integration, runtime integration, and live verification contours.

If an authoritative behavior is missing, equal-authority sources conflict, or a required runtime boundary cannot be exercised, provide bounded guidance or report the work blocked. Do not invent product behavior, security policy, migration authority, or production readiness.

## Latest framework currency

Recommendations track the latest official stable Hono guidance rather than a pinned version. For version-sensitive work, inspect the project's installed versions and read `references/framework-currency.md`. Preserve compatible installed behavior unless the request authorizes an upgrade; report any latest-versus-installed gap explicitly.

## Hono baseline decisions

- Preserve the existing compatible app composition. For greenfield composition, prefer typed factories and `app.route()`; capture chained route return types when Hono RPC or typed test clients consume them.
- Treat middleware order as behavior. Use one project-owned global chain and endpoint-specific additions; register `app.onError()` and `notFound()` as hooks, not middleware positions.
- Keep handlers thin: read validated input, call service/domain behavior, and produce the response contract.
- Keep request-scoped state in Hono Context or explicit parameters, never module-level mutable state.
- Validate configuration at its boundary and use the project's typed Context bindings or variables. On Workers, prefer current `wrangler types` output over handwritten binding casts.
- Use Problem Details, structured redacted logs, and request correlation when the project contract requires them. Do not invent a new error or logging standard during a narrow route change.
- Await work that affects the response. On Cloudflare Workers, use `c.executionCtx.waitUntil(promise)` only for work allowed to outlive the response; handle rejection observably. `waitUntil()` extends execution but does not provide durable delivery. Use a durable queue or equivalent when the accepted contract requires it.
- Do not use `void` merely to silence a floating Promise. Detached work needs an explicit lifecycle owner, failure handling, and evidence appropriate to its delivery claim.
- For protected SSE, streaming, subscription, or WebSocket-like endpoints, opening admission is insufficient when permissions can change. Require revalidation or an accepted invalidation mechanism, observable deny/close behavior, and abort-safe cleanup.
- For secrets and signatures, use runtime-compatible verified cryptographic primitives. Do not use `Math.random()` or plain string equality for attacker-controlled secret comparisons.

## Endpoint workflow

1. Classify the endpoint: public, pending/onboarding, user, admin, service/operator, webhook, or long-lived protected connection.
2. Preserve the route's current admission boundary and owner/tenant semantics. For auth admission, bound body reads before parsing, keep pre-auth and post-auth quotas isolated, and state replay behavior.
3. Select the endpoint middleware pipeline from the authoritative contract; for signed webhooks, verify the exact raw bytes before parsing when the provider requires it.
4. Define request validation, success responses, expected failures, and client-visible contract. Keep forbidden or computed fields outside writable schemas.
5. Choose contract publication deliberately: use OpenAPI when an external or project contract requires it; use Hono RPC/type exports when that is the project boundary; an internal route may document why neither public surface applies.
6. Distinguish runtime response validation from schema-based contract tests. Production validation requires code on the response path; contract tests prove only the branches they exercise.
7. Implement the smallest change that preserves app composition, error hooks, Context typing, logging/redaction, and request correlation.
8. Verify negative and lifecycle behavior at the narrowest real boundary required by the completion claim.

## Auth, CSRF, and client recovery boundaries

- Keep authentication, authorization, and route admission distinct. Route naming or hidden UI is not authorization evidence.
- Hono's built-in `csrf()` checks Origin and Fetch Metadata for its documented unsafe, form-capable request set. It is not a synchronizer-token or double-submit implementation and does not by itself prove token-protected JSON mutation behavior.
- If a cookie-session SPA needs CSRF token reissue after losing memory state, keep that project contract explicit: valid session cookie, allowed Origin/CORS boundary, no old-token requirement, atomic session-bound rotation, and a response containing only the new CSRF token.
- Pending/onboarding sessions use a narrower guard and cannot pass normal active-account protected routes.

## Verification contours

- Pure unit tests cover helpers and domain logic, not Hono or platform integration.
- `app.request()` or `testClient()` covers the Hono request/response composition actually exercised. Preserve the project's runner rather than imposing `node:test`, Vitest, or another runner.
- Runtime integration covers adapter APIs, bindings, ExecutionContext, streaming, caching, and platform behavior. For Cloudflare Workers, prefer the current Workers Vitest integration when the project uses it; migrate from `unstable_dev` only when the task authorizes that change.
- Live or staging evidence proves only the observed deployment, configuration, and scenario. Require it when the claim depends on provider delivery, edge configuration, or operational observability.

## Completion report

Report:

- delivered or proposed HTTP/runtime behavior and changed public contracts;
- installed-version compatibility and any latest-guidance delta;
- checks run and the exact boundary each proves;
- blocked, simulated, or unverified behavior;
- residual production, security, data, and operational risks owned elsewhere.
