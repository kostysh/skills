Apply accepted financial rules through exact arithmetic and real-boundary evidence.

## Capability boundary

Own:

- EUR amount representation through the accepted project contract;
- non-EUR amount representation when code and minor-unit scale are authoritative, using a verified API or an authorized local formula;
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

Use exact integer minor units with explicit currency, scale, amount/rate units, rounding/fixation, sign and allocation rules. Preserve the accepted API and DTO contract; profile examples are conditional. The workflow below owns implementation and verification requirements, including local formulas when no engine exists.

## Completion boundary

Report the applied authority, calculation contract, executed contours, and evidence gaps. Source, unit tests, SQL text, schemas, and mocks cannot prove an unexecuted runtime boundary.
