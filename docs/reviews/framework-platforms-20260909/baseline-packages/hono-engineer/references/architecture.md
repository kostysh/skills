# Architecture & Boundaries

## Route composition
- Preserve the existing compatible composition. Use `app.route()` or factory helpers only when they fit the accepted project boundary and preserve the required Hono type flow.
- Do not introduce controller classes, module grouping, directory layout, or helper layers from this reference.
- Keep route order explicit to avoid accidental 404s or shadowed routes.
- When Hono RPC or `testClient()` consumes route types, keep route definitions chained and export the type of the chained result. Registering routes through separate statements can lose the specific schema type even when runtime routing still works.

## Architecture ownership
- Preserve the project's accepted dependency boundaries. Hono owns route composition and framework type flow; it does not require `routes/services/domain/infra` layering.
- When a task would introduce or change cross-system boundaries, route that decision to `architecture-engineer` and apply only the accepted Hono integration.
- Keep middleware focused on its accepted request/response concern; do not use this reference to relocate business behavior without architectural authority.

## Conditional integration utilities
- **Factory helper**: use Hono factory helpers only when the existing composition or required type inference calls for them.
- **Fetcher wrapper**: reuse a project-owned wrapper when the accepted upstream contract owns that boundary; do not create one solely because this reference exists.
- **Authorization policy**: call the project-owned policy boundary from Hono middleware/routes; security and domain owners define the policy itself.

## Growth path
- Keep the current structure until an accepted architecture change justifies another layer or boundary.
