# Function Overloads

> **Load when:** User asks about input-dependent return types, overloaded APIs, preserving inference in wrappers, or overloads vs unions.

Use overloads when the caller experience changes based on the input shape.

## Contents

- [When to Use Overloads](#when-to-use-overloads)
- [Basic Pattern](#basic-pattern)
- [Overload Order](#overload-order)
- [Overloads vs Unions](#overloads-vs-unions)
- [Wrapping Existing APIs](#wrapping-existing-apis)
- [Pitfalls](#pitfalls)

---

## When to Use Overloads

Prefer overloads when:
- return type depends on input type
- different argument shapes should produce different IntelliSense
- you are mirroring an existing overloaded API

Prefer a union parameter when:
- the return type is the same for all inputs
- branching is implementation detail only
- an options object would be clearer than many signatures

---

## Basic Pattern

Write overload signatures first, then one compatible implementation:

```typescript
function parse(input: string): object;
function parse(input: object): string;
function parse(input: string | object): object | string {
  if (typeof input === "string") {
    return JSON.parse(input);
  }
  return JSON.stringify(input);
}
```

The implementation signature must accept every overload case.

---

## Overload Order

TypeScript checks overloads from top to bottom and picks the first match.

Put more specific overloads before broader fallbacks:

```typescript
function query<K extends keyof HTMLElementTagNameMap>(
  selector: K
): HTMLElementTagNameMap[K] | null;
function query(selector: string): Element | null;
function query(selector: string): Element | null {
  return document.querySelector(selector);
}
```

If the broad overload comes first, the specific one may never be selected.

---

## Overloads vs Unions

Use this decision rule:

| Situation | Prefer |
|----------|--------|
| Return type changes with input | Overloads |
| Same return type for every input | Union parameter |
| Too many combinations | Options object |

Example where a union is simpler:

```typescript
function formatId(input: string | number): string {
  return String(input);
}
```

Example where overloads are better:

```typescript
function first(items: string[]): string | undefined;
function first(items: number[]): number | undefined;
function first(items: Array<string | number>) {
  return items[0];
}
```

---

## Wrapping Existing APIs

When wrapping an overloaded API, mirror the source overloads or you will lose inference:

```typescript
export function nonNullQuerySelector<K extends keyof HTMLElementTagNameMap>(
  selector: K
): HTMLElementTagNameMap[K];
export function nonNullQuerySelector(selector: string): Element;
export function nonNullQuerySelector(selector: string): Element {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}
```

This preserves the useful narrow result for `"body"`, `"input"`, and other known selectors.

Apply the same rule to wrappers around:
- Node or browser APIs
- query builders
- event emitters
- SDK helpers that expose literal-driven behavior

---

## Pitfalls

### Broad implementation, narrow caller contract

The implementation usually needs unions or optional params, but callers should only see the overloads.

### Overloads that differ only superficially

If signatures only shuffle optional parameters or all return the same type, overloads may add noise without improving the API.

### Losing literals before overload resolution

```typescript
const method = "GET";
request(method);
```

If `method` widened to `string`, the specific overload may not match. Preserve literals with `as const`, `satisfies`, or `const` type parameters where appropriate.

### Missing fallback overload

If you support custom strings as well as known literals, keep an explicit fallback overload last.
