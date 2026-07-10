# Boundary Type Patterns

> **Load when:** Modeling typed success/failure states, unknown inputs, schema-derived types, or branded values without taking over runtime or domain policy.

These patterns describe TypeScript contracts. They do not choose application architecture, HTTP status codes, validation rules, persistence models, or user-visible errors.

## Typed success and failure

A discriminated union can make caller handling explicit when the accepted API contract returns values instead of throwing:

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function parseCount(input: string): Result<number, "not-a-number"> {
  const value = Number(input);
  return Number.isFinite(value)
    ? { ok: true, value }
    : { ok: false, error: "not-a-number" };
}
```

Do not introduce `Result` merely because TypeScript can express it. The framework or domain contract decides whether a boundary returns a union, throws, rejects, or uses another channel. Once that decision is authoritative, this skill checks exhaustiveness and type propagation.

## Unknown boundaries

Use `unknown` when TypeScript cannot trust the input. Narrow with a runtime check owned by the boundary:

```typescript
type UserRecord = { id: string; name: string };

function isUserRecord(value: unknown): value is UserRecord {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string" && typeof candidate.name === "string";
}
```

The local assertion exposes properties only after the preceding object/null check; the function's runtime conditions are the evidence for its predicate. For complex or security-sensitive data, use the repository's accepted validator and let the relevant owner define the rules.

## Schema-derived types

When a project already has an authoritative runtime schema, derive the TypeScript type through that library's supported API rather than maintaining a parallel interface. Confirm which side is authoritative and whether transforms, defaults, coercions, or refinements change input and output types.

Do not claim runtime validation because a derived type exists. Verify that the schema actually runs on the production boundary through the framework or validation owner.

## Branded values

A brand prevents accidental interchange inside the type system; it does not prove that a primitive was validated at runtime.

```typescript
declare const UserIdBrand: unique symbol;
type UserId = string & { readonly [UserIdBrand]: true };

function parseUserId(input: string): UserId | undefined {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input)
    ? (input as UserId)
    : undefined;
}
```

The assertion is isolated after the runtime predicate. Other code can still forge the brand with an assertion, so the guarantee is only as strong as the exposed constructors and review boundary. Prefer an accepted schema library's brand support when the project already uses it, but do not make that library a portable dependency of this skill.

## Exhaustive state handling

Use a discriminant and `never` to make missing cases a compile error:

```typescript
type LoadState =
  | { kind: "idle" }
  | { kind: "ready"; value: string }
  | { kind: "failed"; reason: string };

function describe(state: LoadState): string {
  switch (state.kind) {
    case "idle":
      return "idle";
    case "ready":
      return state.value;
    case "failed":
      return state.reason;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}
```

Compile-time exhaustiveness does not prove that runtime data contains a valid discriminant. Validate opaque inputs before relying on the union.

## Evidence

For a boundary-type change, report separately:

- compile evidence for accepted and rejected type cases;
- runtime validation evidence, if exercised by the owning framework or library;
- affected public consumers;
- any assertion or brand that still relies on an external invariant.
