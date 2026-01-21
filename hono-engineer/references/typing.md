# Typing Context Variables

Hono supports two approaches for typing context variables:

## 1) Generics on `Hono`
Use this when you want explicit typing on the app instance.

```ts
import { Hono } from 'hono'

type Env = {
  Variables: {
    requestId: string
  }
}

const app = new Hono<Env>()

app.get('/', (c) => c.text(c.var.requestId))
```

## 2) Module augmentation (ContextVariableMap)
Use this when you want global typing without threading generics everywhere.

```ts
declare module 'hono' {
  interface ContextVariableMap {
    requestId: string
  }
}
```

Then you can use `c.var.requestId` anywhere after setting it:

```ts
app.use(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})
```

Notes:
- `c.var` is a typed shortcut for context variables set via `c.set()`.
- Use `c.get()` when you need dynamic keys; use `c.var` for typed access.
