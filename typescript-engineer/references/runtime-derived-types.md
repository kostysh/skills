# Runtime-Derived Types

> **Load when:** User asks about `as const`, `typeof`, literal inference, `[number]` indexed access, `satisfies`, or `const` type parameters.

Derive types from runtime data instead of duplicating shape by hand.

## Contents

- [Single Source of Truth](#single-source-of-truth)
- [`as const` and `typeof`](#as-const-and-typeof)
- [Arrays and `[number]`](#arrays-and-number)
- [`satisfies` Without Widening](#satisfies-without-widening)
- [`const` Type Parameters](#const-type-parameters)
- [Pitfalls](#pitfalls)

---

## Single Source of Truth

Prefer one runtime definition that also drives types:

```typescript
const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const;

type HttpMethodKey = keyof typeof HTTP_METHODS;
type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];
```

This removes drift between runtime constants and handwritten unions.

---

## `as const` and `typeof`

Use `as const` when values should stay literal and readonly:

```typescript
const STATUS = {
  draft: "draft",
  published: "published",
  archived: "archived",
} as const;

type Status = typeof STATUS[keyof typeof STATUS];
// "draft" | "published" | "archived"
```

Use indexed access for subsets:

```typescript
type PublicStatus = typeof STATUS["draft" | "published"];
// "draft" | "published"
```

Prefer this over string enums when runtime code generation is unnecessary.

---

## Arrays and `[number]`

Use `[number]` to turn a tuple or readonly array into a union of element types:

```typescript
const ROLES = ["user", "admin", "anonymous"] as const;

type Role = typeof ROLES[number];
// "user" | "admin" | "anonymous"
```

This also works with nested structures:

```typescript
const accessModel = {
  user: ["view"],
  admin: ["view", "edit", "delete"],
} as const;

type AccessRole = keyof typeof accessModel;
type AccessAction = typeof accessModel[AccessRole][number];
// "view" | "edit" | "delete"
```

You can derive unions from function parameter tuples too:

```typescript
function formatValue(input: string, radix: number, upper: boolean): string {
  return upper ? input.toUpperCase() : input;
}

type FormatArgs = Parameters<typeof formatValue>;
type FormatArg = FormatArgs[number];
// string | number | boolean
```

Tuple vs array matters:

```typescript
const tuple = ["a", "b"] as const;
type TupleElement = typeof tuple[number];
// "a" | "b"

const array: string[] = ["a", "b"];
type ArrayElement = typeof array[number];
// string
```

---

## `satisfies` Without Widening

Use `satisfies` when you need shape validation but want to keep property literals:

```typescript
type RouteConfig = {
  path: `/${string}`;
  method: "GET" | "POST";
};

const routes = {
  home: { path: "/", method: "GET" },
  login: { path: "/login", method: "POST" },
} satisfies Record<string, RouteConfig>;

routes.home.method;
// "GET"
```

Combine `as const` and `satisfies` when the definition should be both literal and validated:

```typescript
const EVENTS = {
  click: "click",
  submit: "submit",
} as const satisfies Record<string, string>;
```

Use `satisfies` instead of `as SomeBroadType` when you want validation without throwing away inference.

---

## `const` Type Parameters

When you are designing APIs, prefer `const` type parameters over asking callers to remember `as const`:

```typescript
function defineRoutes<const TRoutes extends Record<string, { path: string }>>(
  routes: TRoutes
) {
  return routes;
}

const routes = defineRoutes({
  home: { path: "/" },
  user: { path: "/users/:id" },
});

type RouteName = keyof typeof routes;
// "home" | "user"
```

Use this when literal preservation is part of the API contract:
- route definitions
- feature flags
- event maps
- config-driven DSLs
- lookup tables used to derive unions

Prefer `const` type parameters first. Reach for third-party deep-narrow helpers only when the built-in behavior is insufficient.

---

## Pitfalls

### Forgetting `as const`

```typescript
const colors = ["red", "green", "blue"];
type Color = typeof colors[number];
// string, not the literal union
```

### Overusing `as const`

`as const` makes data deeply readonly. Use it when immutability is intended, not as a reflex.

### Using broad assertions instead of derived types

```typescript
const config = {
  mode: "prod",
} as Record<string, string>;
```

This validates nothing and throws away literal precision. Prefer `satisfies`.

### Readonly array mismatch in `.includes()`

```typescript
const roles = ["user", "admin"] as const;
type Role = typeof roles[number];

function isRole(value: string): value is Role {
  return (roles as readonly string[]).includes(value);
}
```

When the caller input is wider than the readonly tuple, write a guard or widen the array view deliberately.
