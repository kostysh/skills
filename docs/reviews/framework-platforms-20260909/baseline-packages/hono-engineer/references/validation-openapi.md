# Validation & API Contracts

## Project-owned validation
- Preserve the project's accepted validator and wire-error contract. Hono's built-in `validator()` and companion validators such as Zod or Valibot are integration choices, not mandatory migrations.
- Preserve the project's schema location and publication boundary; this reference does not introduce a directory layout.
- Map validation errors to the existing safe client contract; use Problem Details only when that contract already owns it.

## New route contract checklist

Before implementing a requested route, obtain the consumed request parts, success/failure wire behavior, admission contract, real consumers, and required evidence. Validate only the untrusted parts the accepted contract consumes. If a public schema, status/body, admission policy, or publication surface is not owned, use a placeholder or stop rather than completing the route with a conventional default.

The placeholder must cover the complete unresolved boundary. If the consumed request part is unknown, do not select `json`, `form`, or another validator target. If the success status, media type, or body is unknown, do not show `c.json()`, `c.text()`, `c.body()`, or an executable partial route and hide only one argument behind a placeholder. Stop for the missing contract or delegate the whole boundary to an opaque owner-supplied handler such as `projectRouteHandler`. Do not show even opaque handler/router wiring when the existing app composition seam is unknown: choosing `app.route()`, a mount path, or chained route layout would itself assign architecture.

Do not require Zod, OpenAPI, and Hono RPC simultaneously. Preserve the project's chosen contract mechanism unless the request changes it.

## How to validate in Hono (request data)
- Hono’s built-in `validator()` supports `json`, `query`, `param`, `header`, `cookie`, and `form`.
- Use the project's existing companion validator; `@hono/zod-validator` is one option when the project already uses Zod.
- Read validated values via `c.req.valid('<part>')`.
- You can chain multiple validators on the same route (param + query + body).
- For `json`/`form`, a missing or incompatible `Content-Type` means Hono does not parse the body and the validator callback receives `{}`. Explicitly reject that value when the accepted contract requires a media-type or body error; do not rely on an automatic parse failure.
- If the accepted contract does not define the rejection status, media type, and body, do not infer `400`, `415`, text, or a JSON envelope. Show an owner-supplied failure placeholder and report that contract authority is missing.
- For `header`, use lowercase header names.

Built-in validator API-shape example:
```ts
import { validator } from 'hono/validator'

const projectJsonValidator = validator('json', (value, c) => {
  if (!projectAcceptsJsonValue(value)) return projectValidationFailure(c)
  return projectValidatedJson(value)
})
```

The three `project*` symbols are owner-supplied placeholders; the example defines no route, schema library, status, media type, or response body. Use this API-shape example only after the accepted contract has selected the `json` request part. When it has not, keep even the validator target behind an owner-supplied integration boundary.

## OpenAPI integration
- When OpenAPI is the accepted contract, use helpers compatible with the project's validator/schema stack to derive or maintain the specification.
- Add a docs UI only when a project-owned consumer and exposure policy require it; preserve the accepted tool and path.
- Treat OpenAPI as the wire-contract source of truth only when the project has chosen it for external integrations. Otherwise preserve the authoritative contract mechanism.

## Edge schema validation (optional)
- If the platform/security owners select edge schema enforcement, integrate the Hono contract with their rollout and verification plan.

## Response contract evidence

Choose the guarantee required by the accepted contract:

- **Runtime response validation**: production code validates the actual payload before emission, using a response helper or per-route middleware. Test both success and validation-failure behavior. This can support a runtime-validation claim for the covered path.
- **Contract-test coverage**: integration or runtime tests validate observed responses with the shared schema. This proves only the exercised branches and conditions; it is not runtime validation for unexecuted responses.
- **Static typing only**: TypeScript checks producer code but does not validate runtime values from databases, RPCs, or other untyped boundaries.

Do not say "all responses are validated" from selective tests or schema existence. State which routes/statuses are runtime-validated, test-validated, typed-only, or unverified.

## Output validation integration
- Add production response validation only when the accepted contract requires it and through the project's selected schema/helper boundary.
- Keep streaming and non-JSON responses outside JSON-only validation helpers.
- Companion request validators do not automatically provide response validation; contract tests provide bounded evidence, not the same guarantee.
