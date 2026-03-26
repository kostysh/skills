# Practices and Policies

> **Load when:** User asks about migration, common mistakes, or TypeScript suppression directives.

## @ts-expect-error policy
- Use `@ts-expect-error` with a short justification comment (ticket or reason).
- Do not use `@ts-ignore`.
- Prefer narrowing or explicit types first; suppression is a last resort.
- Remove the suppression when the underlying issue is fixed.

Example:
```ts
// @ts-expect-error - TODO(TS-123): upstream types are incorrect
callIntoLegacyApi(value);
```

## Common mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Using `any` liberally | Defeats type safety | Use `unknown` and narrow |
| Ignoring strict mode | Misses null/undefined bugs | Enable all strict options |
| Type assertions (`as`) | Can hide type errors | Use `satisfies` or guards |
| Enum for simple unions | Generates runtime code | Use literal unions instead |
| Not validating API data | Runtime type mismatches | Use Zod at boundaries |

## API contracts and boundaries
- Explicitly annotate return types for exported/public APIs to lock contracts.
- Accept `unknown` at boundaries (user input, APIs, storage) and validate before use.
- Prefer discriminated unions for state modeling instead of boolean flag combinations.

## Imports and code hygiene
- Use `import type` for type-only dependencies.
- Keep imports grouped: `node:` built-ins, external packages, internal modules.
- Keep the import graph acyclic; extract shared types into a lower-level module.
- Prefer guard clauses and early returns to reduce nesting and improve narrowing.

## Constants and literal types
- Use `as const` for immutable lookup arrays and config objects.
- Derive unions from const data: `type Role = typeof ROLES[number]`.
- Name constant collections consistently:
  - Source arrays: `PLURAL_NOUN`, add unit suffix when relevant (`BITRATES_KBPS`).
  - Derived options: `*_OPTIONS` for `{ value, label }` arrays.
  - IDs derived from options: `*_IDS`.
  - Label maps: `*_TO_LABEL` for `Record<Id, string>`.
  - Use `SCREAMING_SNAKE_CASE` for exported constants.

## Dependency hygiene
- Always commit the lockfile and keep it in sync with `package.json`.
- Add a single verify script (typecheck + lint + tests) and run it in CI/pre-commit.
- Delegate test tool details to `typescript-test-engineer`.

## Type assertions and inference
- Avoid `as` casts unless interfacing with untyped libraries; prefer narrowing, `satisfies`, or schema inference.
- In TS 5.5+, avoid manual type predicates in simple `.filter()` callbacks when inference already narrows.

## Migration strategies

### Incremental migration from JavaScript

**Phase 1: Enable TypeScript alongside JavaScript**
```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "strict": false,
    "noImplicitAny": false
  }
}
```

**Phase 2: Rename files gradually**
```bash
mv src/utils/helpers.js src/utils/helpers.ts
# Add minimal type annotations, fix errors, run tests
```

**Phase 3: Enable stricter checks incrementally**
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### JSDoc for gradual typing
```js
/**
 * @param {string} name
 * @param {number} age
 * @returns {User}
 */
function createUser(name, age) {
  return { name, age };
}

/**
 * @template T
 * @param {T[]} items
 * @returns {T | undefined}
 */
function first(items) {
  return items[0];
}
```
