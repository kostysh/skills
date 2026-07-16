# Cross-layer parity evidence

Read this reference before claiming parity or designing fixtures across two or more runtime contours.

## Define the claim

Name the exact contours instead of saying “full stack.” Examples include:

- canonical money-engine unit runtime;
- real PostgreSQL function or query;
- backend/domain integration;
- persistence round trip;
- built browser bundle;
- shipped application screen;
- external ledger adapter.

Only applicable contours belong in the claim. A one-layer change does not require inventing other layers, but it must preserve any existing shared contract.

## Fixture contract

Each fixed fixture should carry:

```text
id
authority/source reference and version when policy-bearing
operation
typed and unit-bearing inputs
rounding mode and fixation point
expected value or expected error as a fixed literal
applicable contours
```

Do not generate expected output with the implementation under test. Reuse the same fixture identity and literal expectation in each contour; copying formulas into separate test helpers is not independent parity evidence.

## Minimum risk matrix

Select cases relevant to the operation, including:

- ordinary exact examples;
- positive and negative half ties for every required rounding mode;
- zero amount and zero rate;
- refunds and reversals;
- integer-looking human input versus canonical cents DTOs;
- invalid separators, units, rates, denominators, and currency;
- int64 extrema, intermediate overflow, and output overflow;
- equal and weighted allocation, zero weights, and deterministic tie ordering;
- reverse VAT/scorporo and accepted residual-cent policy;
- global configuration reset and runtime isolation.

## Evidence matrix and closure

Record one row per contour:

| Contour | Fixture/source identity | Command or artifact | Observed result | Status |
| --- | --- | --- | --- | --- |
| Named real boundary | Exact ids/version | Reproducible command or runtime artifact | Values/errors observed | `verified`, `not-run`, `not-applicable`, or `blocked` |

Closure rules:

- `verified`: every applicable contour in the claim executed the fixtures and matched values and errors;
- `partial`: useful implementation or evidence exists, but at least one applicable contour is `not-run`;
- `blocked`: required authority, environment, compatibility, or runtime boundary is unavailable;
- `not-applicable`: justify why the contour is outside this claim; absence is not a pass.

Package unit tests prove the package runtime. Browser-bundle tests prove the built browser bundle. Neither proves application wiring, server authority, persistence, PostgreSQL, or an external ledger unless those boundaries actually execute.
