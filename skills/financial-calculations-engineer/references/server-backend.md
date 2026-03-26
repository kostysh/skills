# Server and Backend Patterns

## Domain model
- Store and compute money as `MoneyCents = bigint`.
- Keep rates separate as integer ppm (`RatePpm`).
- Avoid decimal strings inside core domain logic.

## API boundaries
- Input DTO: accept money as string (for example `"1999"` cents or `"19.99"` user input string).
- Parse immediately using `BigInt(...)` for cents strings or `parseEurToCents(...)` for human-entered amounts.
- Output DTO: serialize cents as string (`BigInt` is not JSON-serializable by default).

## Typical flow
1. Validate request payload.
2. Parse amounts/rates.
3. Compute with `money` (`mulRatePpm`, `add`, `roundDiv`, allocation helpers).
4. Persist cents and rates.
5. Format only for response/UI-specific fields when needed.

## Guardrails
- Enable safe mode when runtime validation is required:
  - `setMathMode('safe')`
  - configure compatibility mode and resource limits per environment.
- Reset global money config in tests to avoid cross-test leakage.

## Negative values
- Treat negative amounts as first-class for refunds/storno.
- Keep same rounding policy for positive and negative paths.
- Add explicit tests for negative equivalents of every critical formula.
