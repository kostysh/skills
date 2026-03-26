---
name: financial-calculations-engineer
description: Design and implement deterministic EUR financial calculations across PostgreSQL, backend, and browser layers. Use when building or reviewing VAT/IVA, discounts, rates, allocations, parsing/formatting, scorporo, ledger postings, and cross-layer parity tests. Enforce correct usage of the local money library (`packages/money`) instead of ad-hoc arithmetic.
---

# Financial Calculations Engineer

Build finance-oriented features with reproducible money math that matches accounting expectations across all layers.

## Non-negotiables
- Keep canonical money as `MoneyCents` (`bigint` cents) in domain logic.
- Use `packages/money` as the first-choice engine for money operations.
- Never use floating point for canonical money (`number`, `real`, `double`).
- Keep money and rates separate. Represent rates as ppm (`22% = 220_000`).
- Round only at fixation points (tax amount, discount amount, allocation result, tariff total).
- Make rounding mode explicit and consistent across SQL, backend, and browser.
- Preserve correctness for negative amounts, zero rates, and reversals/refunds.
- Maintain golden tests for cross-layer determinism.
- Keep this skill portable: store required practices in this skill folder, not in external absolute-path docs.

## Fast workflow
1. Inspect existing financial rules and tests in `packages/money/docs` and `packages/money/test`.
2. Translate business rules into canonical cents formulas and identify fixation points.
3. Implement calculation logic with `money` APIs, not custom arithmetic.
4. Mirror the same formulas in SQL using identical rounding semantics.
5. Add/extend golden cases for VAT/IVA, scorporo, allocation, and negative flows.
6. Validate parity: SQL result == backend result == browser result.
7. Execute tests by contour: changed-focused local loop, full PR gates, nightly parity stability checks for flaky paths.

## Required `money` usage
Use these APIs by default:
- Input boundary: `parseEurToCents`
- Arithmetic: `add`, `sub`, `neg`, `abs`
- Rate math: `mulRatePpm`
- Division/rounding: `div`, `roundDiv`
- Allocation: `allocateEqual`, `allocateByWeights`
- Output boundary: `formatEurCents`
- Runtime safety: `setMathMode('safe')`, compatibility/resource limits when needed

If required behavior is missing:
1. Extend `packages/money` first.
2. Add unit tests in `packages/money/test`.
3. Consume the new API from application code.
4. Do not duplicate money math in feature modules.

## Layer coverage
For targeted guidance, read only the needed reference:
- `references/money-library-usage.md` - API mapping and anti-patterns.
- `references/server-backend.md` - backend/domain patterns and JSON boundaries.
- `references/browser.md` - input/commit/formatting patterns for UI.
- `references/database-sql.md` - PostgreSQL storage and deterministic SQL formulas.
- `references/vat-iva.md` - forward/reverse VAT formulas and 0.01 scorporo caveat.
- `references/parity-testing.md` - golden tests for SQL/backend/browser parity.

## Interop
- Use this skill for financial semantics and monetary invariants.
- Use `typescript-engineer` for advanced TypeScript design.
- Use `typescript-test-engineer` for broader testing methodology.
- Use framework skills (`hono-engineer`, `supabase-engineer`, etc.) for transport/integration concerns.
