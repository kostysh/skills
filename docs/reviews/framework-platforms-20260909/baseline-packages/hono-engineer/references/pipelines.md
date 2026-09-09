# Middleware Pipelines (endpoint classes)

Preserve the compatible project-owned global chain. Add route-group middleware only for the accepted endpoint behavior; this reference illustrates ordering constraints, not a mandatory security or architecture policy.

## Hono ordering consequences after a concern is selected

| Accepted concern | Hono-specific consequence |
| --- | --- |
| CORS | Mount the selected CORS middleware where preflight can complete before protected business handlers; do not infer origins or credentials here. |
| Body limit | Put the owner-supplied bound before the body-reading operation it protects. |
| Signed webhook | Verify the provider's exact raw bytes before any JSON/form parsing when its signature contract requires it. |
| Authentication/authorization | Preserve the accepted admission order before the protected handler; this reference does not select guards, paths, or roles. |
| Validation | Run the project validator before consuming `c.req.valid(...)`; preserve its error mapping. |
| Timeout | Hono timeout middleware is not compatible with streaming responses; select another owner-approved lifecycle for streams. |
| Error handling | Register `app.onError()` and `app.notFound()` as Hono hooks, not positions in the middleware chain. |
| Protected long-lived response | Opening admission is insufficient only when the accepted security contract requires later permission changes to take effect; implement its revalidation/invalidation and abort cleanup. |
| Post-response work on Workers | `c.executionCtx.waitUntil()` is best-effort, not durable delivery; use the platform/architecture owner's accepted durable boundary when loss changes behavior. |

Do not synthesize a complete pipeline from this table. If the authoritative endpoint contract has not selected a concern, omit it or stop for the owning decision.
