# Contract Types Export

Use this when you need to expose API request/response types to other apps without creating a separate package.

Choose the contract boundary already owned by the project:

- Hono RPC: export the type of a chained route/app result and keep server and client TypeScript settings compatible with current Hono guidance; monorepo client and server configurations require `strict: true` for reliable inference.
- OpenAPI/runtime schemas: publish them when external or cross-language consumers need a wire contract.
- Type-only exports: use them when consumers share TypeScript types but do not need runtime validation.

Do not create all three surfaces by default. A type-only export is not runtime validation, and an OpenAPI document is not evidence that the deployed response conforms.

## Hono RPC global responses

Hono RPC does not automatically infer responses produced by global `app.onError()` handlers or global middleware. If the typed client must model those responses, apply the current `ApplyGlobalResponse` helper to the exported app type and enumerate only the global status/body contracts that the server actually returns. Test the resulting success and error unions from a real client type fixture.

Do not add a global response union merely to silence an unknown type. First confirm the runtime handler, status, body, and project error contract; static RPC typing does not prove runtime conformance.

Latest official stable shape at use time (verify it from official Hono docs and reconcile it with the installed project version):

```ts
import type { ApplyGlobalResponse } from 'hono/client'

type ProjectGlobalResponses = Record<
  ProjectGlobalStatus,
  { json: ProjectGlobalBody }
>

type AppWithErrors = ApplyGlobalResponse<
  typeof app,
  ProjectGlobalResponses
>
```

`ProjectGlobalStatus` and `ProjectGlobalBody` are owner-supplied aliases. The second parameter is a status-keyed response map, not a `{ status, body, format }` descriptor. Keep only statuses and JSON shapes already produced by the project-owned global handler.

## Notes
- Preserve the project's existing module, package-export, schema, and versioning layout; this reference does not create a contract package or directory convention.
- Use type-only imports/exports when the accepted TypeScript boundary must not create a runtime dependency.
- If Hono RPC is used, capture the type of the project's existing chained registration result and export that type; exporting the original unchained app can lose route inference. Do not introduce a new `app.route()` composition merely to obtain the type.
