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

- Preserve the existing compatible app composition. In greenfield work, do not select structure without authority; use typed factories or `app.route()` only when the accepted composition needs them. Capture chained route return types when Hono RPC or typed test clients consume them.
- Treat middleware order as behavior. Preserve the compatible project-owned global and route-group composition; register `app.onError()` and `notFound()` as hooks, not middleware positions.
- Keep route handlers focused on the accepted HTTP boundary when that fits the project architecture; do not introduce a new service/domain layering scheme during a narrow Hono change.
- Keep request-scoped state in Hono Context or explicit parameters, never module-level mutable state.
- Validate configuration at its accepted boundary and preserve the project's typed Context bindings or variables. On Workers, use current `wrangler types` output only when the project owns generated bindings; do not impose that migration over a different accepted Env boundary.
- Use Problem Details, structured redacted logs, and request correlation when the project contract requires them. Do not invent a new error or logging standard during a narrow route change.
- Await work that affects the response. On Cloudflare Workers, use `c.executionCtx.waitUntil(promise)` only for work allowed to outlive the response; handle rejection observably. `waitUntil()` extends execution but does not provide durable delivery. Use a durable queue or equivalent when the accepted contract requires it.
- Do not use `void` merely to silence a floating Promise. Detached work needs an explicit lifecycle owner, failure handling, and evidence appropriate to its delivery claim.
- For protected SSE, streaming, subscription, or WebSocket-like endpoints, opening admission is insufficient only when the accepted security contract makes later permission changes effective. Implement that contract's revalidation/invalidation, observable deny/close behavior, and abort-safe cleanup.
- For secrets and signatures, implement only the accepted cryptographic contract with runtime-compatible verified primitives. `Math.random()` and plain string equality do not establish security for attacker-controlled secret material.

## Endpoint workflow

1. Classify the endpoint using the project-owned admission model; public, pending/onboarding, user, admin, service/operator, webhook, and long-lived protected connection are examples, not roles this skill creates.
2. Preserve the route's current admission boundary and owner/tenant semantics. When the accepted auth contract defines a body bound, apply that owner-supplied limit before parsing; preserve accepted quota isolation and replay behavior.
3. Select the endpoint middleware pipeline from the authoritative contract; for signed webhooks, verify the exact raw bytes before parsing when the provider requires it.
4. Define request validation, success responses, expected failures, and client-visible contract. Keep forbidden or computed fields outside writable schemas.
5. Choose contract publication deliberately: use OpenAPI when an external or project contract requires it; use Hono RPC/type exports when that is the project boundary; an internal route may document why neither public surface applies.
6. Distinguish runtime response validation from schema-based contract tests. Production validation requires code on the response path; contract tests prove only the branches they exercise.
7. Implement the smallest change that preserves app composition, error hooks, Context typing, logging/redaction, and request correlation.
8. Verify negative and lifecycle behavior at the narrowest real boundary required by the completion claim.

## Auth, CSRF, and client recovery boundaries

- Keep authentication, authorization, and route admission distinct. Route naming or hidden UI is not authorization evidence.
- Hono's built-in `csrf()` allows a request when either its Origin check or Fetch Metadata check passes for the documented unsafe, form-capable request set. It is not a synchronizer-token or double-submit implementation and does not by itself prove token-protected JSON mutation behavior.
- If the accepted cookie-session contract includes CSRF token reissue after losing memory state, preserve that project-owned recovery contract; do not introduce one as a Hono default.
- If the accepted authentication model includes pending/onboarding sessions, preserve their narrower guard and prevent them from passing normal active-account protected routes.

## Verification contours

- Pure unit tests cover helpers and domain logic, not Hono or platform integration.
- `app.request()` or `testClient()` covers the Hono request/response composition actually exercised. Preserve the project's runner rather than imposing `node:test`, Vitest, or another runner.
- Runtime integration covers adapter APIs, bindings, ExecutionContext, streaming, caching, and platform behavior. Preserve the project's Workers harness; introduce or migrate to the current Workers Vitest integration only when the task authorizes that tooling decision.
- Live or staging evidence proves only the observed deployment, configuration, and scenario. Require it when the claim depends on provider delivery, edge configuration, or operational observability.

## Completion report

Report:

- delivered or proposed HTTP/runtime behavior and changed public contracts;
- installed-version compatibility and any latest-guidance delta;
- checks run and the exact boundary each proves;
- blocked, simulated, or unverified behavior;
- residual production, security, data, and operational risks owned elsewhere.
