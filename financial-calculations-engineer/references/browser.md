# Browser Patterns

## State and input model
- Keep input controls as raw strings while editing.
- On commit (`blur`/`submit`), parse with `parseEurToCents`.
- Keep canonical state as `bigint` cents after parsing.

## Rendering
- Render amounts from canonical cents with `formatEurCents`.
- Do not run business calculations on formatted strings.
- Keep locale concerns in presentation layer only.

## Browser-safe calculation rule
- Reuse `packages/money` APIs in browser code as in backend.
- Do not duplicate VAT/allocation formulas in UI components.
- Use the same rounding mode constants used by backend and SQL parity tests.

## Typical UI flow
1. User types amount string.
2. Commit parser -> cents.
3. Compute tax/total with `money` functions.
4. Show formatted amounts.
5. Submit canonical cents values (usually as strings in JSON).
