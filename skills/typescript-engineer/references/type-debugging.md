# Type Debugging and Error Diagnosis

> **Load when:** User asks about TypeScript compiler errors, assignability issues, inference failures, invalid indexing, or overload mismatches.

Use a repeatable debugging loop instead of patching errors with casts.

## Contents

- [Workflow](#workflow)
- [Reading Errors](#reading-errors)
- [Isolating the Root Cause](#isolating-the-root-cause)
- [Common Error Shapes](#common-error-shapes)
- [Type Regression Checks](#type-regression-checks)

---

## Workflow

Prefer the repo's existing typecheck script. If none exists, use:

```bash
pnpm tsc --noEmit
```

Recommended loop:
1. Capture the current error output before editing types.
2. Find the first actionable root cause, not just the topmost symptom.
3. Apply the narrowest sound fix.
4. Re-run typecheck.
5. Add type regression checks for tricky behavior.

For monorepos, use the package or workspace entrypoint that matches the affected codepath.

---

## Reading Errors

### Read bottom-up

TypeScript often prints context first and the real mismatch last:

```text
Type '{ name: string; }' is not assignable to type 'User'.
  Types of property 'email' are incompatible.
    Type 'undefined' is not assignable to type 'string'.
```

Start from the deepest incompatible property or constraint failure.

### Check inferred types directly

Name intermediate types and values:

```typescript
type Step1 = SomeComplexType<Input>;
type Step2 = Step1[keyof Step1];
type Step3 = Step2[number];
```

Break long expressions into aliases until the mismatch becomes obvious.

### Inspect source definitions

For library types, check the actual declaration:
- overload order
- generic constraints
- fallback signatures
- inferred default type parameters

Do not assume the docs match the installed types.

---

## Isolating the Root Cause

Common root-cause categories:

| Symptom | Likely root cause | Typical fix |
|---------|-------------------|-------------|
| Literal widened to `string` | Missing `as const` or `const` type parameter | Derive from runtime literals |
| `string` cannot index `T` | Key is unconstrained | Use `K extends keyof T` |
| Property missing on `unknown` | Boundary data not narrowed | Add guard, assertion, or schema validation |
| `any` leaking through API | Untyped boundary or wrapper | Replace with `unknown`, generics, or schema-derived types |
| Unexpected union distribution | Distributive conditional type | Wrap in tuple to stop distribution |
| No overload matches | Signature order or wrong abstraction | Add overloads or switch to union/options object |

Prefer these fixes over broad casts:
- `unknown` plus narrowing
- generic constraints
- `satisfies`
- runtime-derived types
- overloads when return type depends on input

---

## Common Error Shapes

### "Type 'X' is not assignable to type 'Y'"

Check:
- missing properties
- incompatible property types
- literal vs widened mismatch
- readonly vs mutable mismatch

### "Property 'X' does not exist on type 'Y'"

Usually one of:
- value is `unknown`
- union was not narrowed
- wrong overload selected
- optional property was not checked

### "Type 'X' cannot be used to index type 'Y'"

Usually means the key type is too broad:

```typescript
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### "No overload matches this call"

Check:
- overload order
- literal widening before call
- optional parameters that changed inference
- whether a union signature is simpler than overloads

---

## Type Regression Checks

For tricky type-level behavior, add compile-time checks.

### Negative assertions

```typescript
declare function setStatus(status: "draft" | "published"): void;

setStatus("draft");

// @ts-expect-error - invalid status must stay rejected
setStatus("archived");
```

### Positive shape checks

If the repo already uses Vitest:

```typescript
import { expectTypeOf, test } from "vitest";

test("route config preserves literal methods", () => {
  expectTypeOf(routes.home.method).toEqualTypeOf<"GET">();
});
```

If the repo uses dedicated type-test tooling such as `tsd`, follow the local convention instead of adding a new tool.

### Before broad refactors

When removing `any` or tightening public APIs:
- check all affected call sites
- verify autocomplete still exposes the intended literals
- confirm the new type does not force callers into unnecessary casts
