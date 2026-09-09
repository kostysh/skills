# Typing Context Variables

Keep the type guarantee aligned with where the middleware actually runs. Type declarations do not execute middleware or prove that a value exists at runtime.

## Scoped variables: prefer generics and middleware inference

Use `Variables` generics or `createMiddleware<Env>()` when only a route group or subset of handlers receives the value. Keep the consuming handlers inside that typed composition. First inspect the existing registration seam; this reference does not choose a new app, router, mount, path, or handler layout.

```ts
import { createMiddleware } from 'hono/factory'

const projectScopedMiddleware = createMiddleware<ProjectScopedEnv>(
  projectScopedMiddlewareHandler
)
```

`ProjectScopedEnv` and `projectScopedMiddlewareHandler` are owner-supplied whole-boundary placeholders. The handler must set the declared value before `next()` or complete the accepted failure response without calling `next()`. The example demonstrates only the generic API shape; attach it through the already accepted scoped composition so Hono inference reaches only downstream consumers.

## App-wide variables: conditional module augmentation

Use `ContextVariableMap` only when the setter middleware is guaranteed to run app-wide before every consumer. Module augmentation types every Context globally, including routes where the setter did not run; an unqualified declaration can therefore hide `undefined` at runtime.

```ts
declare module 'hono' {
  interface ContextVariableMap {
    projectValue: ProjectValue
  }
}
```

`projectValue` and `ProjectValue` stand for a project-owned key and type. Register the project-owned setter through the existing global composition before every consumer; do not add `app.use()`, a new root app, or route wiring until that composition seam is authoritative.

Notes:
- `c.get()` and `c.var` both rely on the declared Context variable types; neither proves that the setter ran.
- If global application is not guaranteed, keep the value scoped through generics or model it as optional and perform an explicit runtime check before use.
- For scoped middleware, test a consumer inside the scope and a route outside it. For app-wide augmentation, test representative consumers and the registration order that establishes the global guarantee.
