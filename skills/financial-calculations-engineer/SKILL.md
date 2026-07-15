---
name: financial-calculations-engineer
description: Design and implement deterministic EUR financial calculations
  across PostgreSQL, backend, and browser. Use for VAT/IVA, discounts, rates,
  allocations, parsing and formatting, scorporo, ledger postings, and
  cross-layer parity tests. Enforce the project money library instead of ad hoc
  arithmetic.
metadata:
  source-version: 0.1.1
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: be36f805b13ced82de3f7df67f4a6a4e30985a9bf87848ae4d3fa16802b0112c
---

# financial-calculations-engineer

## Start here

1. Confirm the task matches financial-calculations-engineer's applicability criteria.
2. Use the preserved overview guidance as the normative workflow for this skill.
3. Load only the active references that match the current task.
4. Preserve existing project conventions unless the overview explicitly requires a stricter invariant.

## When to use this skill

- Building or reviewing deterministic EUR money calculations, VAT/IVA, discounts, rates, allocations, scorporo, ledger postings, parsing, or formatting.
- Implementing cross-layer SQL, backend, and browser parity for financial formulas.
- Enforcing correct use of the local money library instead of ad-hoc arithmetic.

## When NOT to use this skill

- The work has no monetary, tax, rate, allocation, or accounting calculation surface.
- The task is purely UI, framework, database, or TypeScript work without financial invariants.

## Overview

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

## Workflow stages

### Workflow stage: Apply financial-calculations-engineer guidance

Apply the preserved financial-calculations-engineer guidance without changing its domain behavior.

1. Match the request to the applicability criteria.
2. Follow the preserved overview sections for the concrete work.
3. Read the smallest relevant active reference before using detailed guidance from it.
4. Run the relevant verification from the overview or report why it could not be run.

Validation:

- The outcome follows the preserved skill guidance and any loaded reference constraints.

## Required active references
- [Browser](references/browser.md) — Read this when you need input/commit/formatting patterns for UI.
- [Database Sql](references/database-sql.md) — Read this when you need PostgreSQL storage and deterministic SQL formulas.
- [Money Library Usage](references/money-library-usage.md) — Read this when you need API mapping and anti-patterns.
- [Parity Testing](references/parity-testing.md) — Read this when you need golden tests for SQL/backend/browser parity.
- [Server Backend](references/server-backend.md) — Read this when you need backend/domain patterns and JSON boundaries.
- [Vat Iva](references/vat-iva.md) — Read this when you need forward/reverse VAT formulas and 0.01 scorporo caveat.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory financial-calculations-engineer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
