Guide finance-oriented work from accepted rules to reproducible integer arithmetic and evidence at the real runtime boundaries.

## Capability boundary

Own:

- EUR amount representation and conversions;
- rate encoding and arithmetic;
- rounding, fixation, allocation, and residual invariants;
- numeric conformance across the project money engine, PostgreSQL, backend, and browser when those contours are in scope.

Do not own:

- whether a tax or tariff applies;
- the authoritative rate or effective period;
- ledger accounts, debit/credit meaning, recognition, audit, or posting lifecycle;
- framework, transport, database deployment, or UI mechanics.

Those rules must come from an accepted source. A library example can demonstrate `22%`; it cannot authorize using 22% for a transaction.

## Core invariants

- Represent canonical EUR amounts as integer cents in domain state and persistence unless an accepted contract explicitly names a different precision for a specific intermediate.
- Keep amount, rate, percentage, weight, and display string as distinct types or schemas.
- Never use binary floating point for canonical financial arithmetic.
- Make rounding mode, precision, fixation point, sign behavior, and remainder ordering explicit.
- Treat negative amounts, refunds, reversals, zero values, bounds, overflow, and invalid inputs as first-class cases.
- Convert and format only at named boundaries; never calculate from formatted output.
- Prefer the established project money engine after verifying its current public API.
- Require literal expected fixtures and real-contour evidence for parity claims.

## Completion boundary

Library source, tests, a browser bundle, SQL text, migrations, DTO schemas, mocks, and fixture files may be necessary substrate. None proves a broader runtime contour that did not execute.

A complete result states which financial authority was applied, what calculation contract was implemented, which contours actually ran, and what remains unverified or unavailable.
