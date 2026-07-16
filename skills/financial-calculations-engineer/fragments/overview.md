Guide finance-oriented work from accepted rules to reproducible integer minor-unit arithmetic and evidence at the real runtime boundaries.

## Capability boundary

Own:

- EUR amount representation through the built-in/default facade;
- non-EUR amount representation through a discovered immutable currency engine only when code and minor-unit scale are authoritative;
- rate encoding and arithmetic;
- rounding, fixation, allocation, and residual invariants;
- numeric conformance across the project money engine, PostgreSQL, backend, and browser when those contours are in scope.

Do not own:

- whether a tax or tariff applies;
- the authoritative rate or effective period;
- ISO 4217 validation, currency discovery, FX rates, or conversion policy;
- ledger accounts, debit/credit meaning, recognition, audit, or posting lifecycle;
- framework, transport, database deployment, or UI mechanics.

Those rules must come from an accepted source. A `22%` example cannot authorize a transaction rate. Accepting `[A-Z]{3}` and scale `0..20` validates structure, not a real currency or its current scale.

## Core invariants

- Represent canonical amounts as integer minor units in domain state and persistence unless an accepted contract explicitly names a different precision for a specific intermediate; cents are the EUR specialization.
- Keep EUR on its first-class compatible facade. For another currency, preserve the immutable engine's code and `minorUnitDigits` in every amount and boundary DTO.
- Keep amount, rate, percentage, weight, and display string as distinct types or schemas.
- Never use binary floating point for canonical financial arithmetic.
- Make rounding mode, precision, fixation point, sign behavior, and remainder ordering explicit.
- Treat negative amounts, refunds, reversals, zero values, bounds, overflow, and invalid inputs as first-class cases.
- Fail closed on currency or scale mismatch; never manually relabel an amount or imply FX conversion from formatting or engine construction.
- Convert and format only at authoritative named boundaries; never calculate from formatted output.
- Prefer the established project money engine after verifying its current public API.
- Require literal expected fixtures and real-contour evidence for parity claims.

## Completion boundary

Library source, package tests, a browser bundle, SQL text, migrations, DTO schemas, mocks, and fixture files may be necessary substrate. None proves application wiring, persistence, real PostgreSQL execution, or another broader runtime contour that did not execute.

A complete result states which financial authority was applied, what calculation contract was implemented, which contours actually ran, and what remains unverified or unavailable.
