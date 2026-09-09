# Server and backend boundaries

Read this reference when DTOs, JSON serialization, server calculation, persistence, or backend configuration is in scope.

## Keep units unambiguous

Keep the EUR facade and generic engine DTOs distinct:

```ts
type EurCentsDto = { currency: 'EUR'; amountCents: string };
type CurrencyAmountDto<TCode extends string> = {
  currency: TCode;
  minorUnitDigits: number;
  amountMinorUnits: string;
};
type HumanAmountDto = { amountInput: string; currency: 'EUR' };
```

- Parse EUR through the public strict EUR DTO parser and serialize through its matching serializer when available.
- Parse a generic DTO only through the selected immutable engine's public `parseDto`, and serialize it through `serializeDto`, so currency, scale, exact keys, canonical decimal syntax, and range are validated together.
- Do not replace strict boundary parsing with `BigInt(untrustedString)`.
- Parse `amountCents` or `amountMinorUnits` only as canonical signed base-10 integer strings under the selected DTO contract.
- Parse `amountInput` only with the accepted human-input parser.
- Never use a generic `amount: string` when either integer minor units or human-entered major units could reach the same boundary.
- Serialize canonical bigint minor units as strings because JSON does not encode bigint.
- Preserve generic `currency` and `minorUnitDigits` through browser, server, persistence, and integration contracts; missing or conflicting scale is blocked, not defaulted.
- Reject mixed currency, mixed scale, wrong DTO discriminants, and wrong minor-unit scale before arithmetic.

Required round-trip invariant:

```text
canonical tagged amount -> strict DTO -> parsed tagged amount == original currency + scale + minor units
```

An integer-looking token such as `"1999"` is ambiguous without the field/unit contract: it can mean 1,999 minor units or 1,999 major units to different parsers.

## Server authority

- Validate currency, minor-unit scale, unit, rate bounds, source version, and all discriminants before calculation.
- Recompute authoritative totals from accepted server inputs or validate a submitted canonical total against the same contract.
- Treat browser previews as advisory; do not persist them merely because they match a client-side library.
- Persist canonical integer minor units, currency/scale discriminants where generic amounts are allowed, and integer rates; never persist localized strings or floating-point values as calculation authority.
- Return formatted values only as separate presentation fields when the API contract needs them.
- Use the EUR formatter only for EUR cents and a matching engine formatter for another currency. `FormatOptions` carries locale only; relabeling is not conversion.

## Bootstrap and concurrency

Configure process-global math mode, compatibility range, resource limits, and default locale once during application startup. Do not switch them inside request handlers. Each currency engine's immutable code/scale definition is separate from those globals and is selected explicitly. Tests that change global configuration must restore it after each case and must not run such mutations concurrently without isolation.

DTO range validation remains mandatory when the discovered engine promises it, even if calculation math mode is `unsafe`. A `postgresql` or `nodejs` preset may allow the full signed int64 range; it does not prove persistence or SQL integration.

## Boundary verification

Cover at least:

- EUR DTO and generic DTO serialization round trips;
- human input versus canonical integer-minor-unit parser selection;
- integer-looking tokens, negatives, zero, invalid separators, and over-range values;
- missing, wrong, or conflicting currency/scale discriminants and mixed-contract arithmetic;
- authoritative server recomputation or validation of browser-submitted values;
- persistence read/write without currency, scale, or unit changes;
- stable error behavior for invalid units, currency, rates, and ranges.

Mocked DTO or query-builder tests prove only their local contract. Use backend integration and persistence evidence for the corresponding runtime claims.
