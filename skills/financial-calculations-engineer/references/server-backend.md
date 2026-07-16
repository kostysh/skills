# Server and backend boundaries

Read this reference when DTOs, JSON serialization, server calculation, persistence, or backend configuration is in scope.

## Keep units unambiguous

Use different fields and parsers for different units. For example:

```ts
type CanonicalAmountDto = { amountCents: string; currency: 'EUR' };
type HumanAmountDto = { amountInput: string; currency: 'EUR' };
```

- Parse `amountCents` only as a signed base-10 integer string and then validate its accepted range.
- Parse `amountInput` only with the accepted human-input parser.
- Never use a generic `amount: string` when either cents or euros could reach the same boundary.
- Serialize canonical bigint cents as strings because JSON does not encode bigint.

Required round-trip invariant:

```text
canonical cents -> DTO string -> validated bigint == original canonical cents
```

An integer-looking token such as `"1999"` is ambiguous without the field/unit contract: it can mean 1,999 cents or 1,999 euros to different parsers.

## Server authority

- Validate currency, unit, rate bounds, source version, and all discriminants before calculation.
- Recompute authoritative totals from accepted server inputs or validate a submitted canonical total against the same contract.
- Treat browser previews as advisory; do not persist them merely because they match a client-side library.
- Persist canonical cents and integer rates, not localized strings or floating-point values.
- Return formatted values only as separate presentation fields when the API contract needs them.

## Bootstrap and concurrency

Configure a process-global money engine once during application startup. Do not switch math mode, compatibility range, resource limits, or locale inside request handlers. Tests that change global configuration must restore it after each case and must not run such mutations concurrently without isolation.

## Boundary verification

Cover at least:

- canonical cents serialization and round trip;
- human input versus canonical cents parser selection;
- integer-looking tokens, negatives, zero, invalid separators, and over-range values;
- authoritative server recomputation or validation of browser-submitted values;
- persistence read/write without unit changes;
- stable error behavior for invalid units, currency, rates, and ranges.

Mocked DTO or query-builder tests prove only their local contract. Use backend integration and persistence evidence for the corresponding runtime claims.
