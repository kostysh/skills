# Browser boundaries

Read this reference when browser input, preview, state, serialization, or formatting is in scope.

## State and input

- Keep the editing control as a raw human-input string.
- Parse only at an explicit commit boundary such as accepted blur or submit behavior.
- Store committed canonical values as integer minor units through the verified profile: bigint cents for the EUR facade or a tagged generic amount with engine-owned currency and scale.
- Keep rate, amount, currency, scale, formatted output, validation error, and source/version metadata separate.
- Never calculate from localized formatted strings.

The human-input parser accepts only the syntax promised by the discovered engine. Do not infer locale grouping support from display formatting.

## Preview versus authority

Browser use of the canonical engine is valuable for immediate deterministic preview, but the browser is not persistence authority:

- for EUR, submit the strict `{ currency: 'EUR', amountCents }` contract;
- for a generic engine, submit `{ currency, minorUnitDigits, amountMinorUnits }` and preserve both discriminants through browser state and transport;
- submit the inputs and source/version needed for server verification when the contract requires them;
- let the server recompute or validate the authoritative amount;
- show an explicit error or stale-policy state when server authority rejects the preview.

Use the discovered public DTO serializer rather than constructing a generic decimal string or calling `BigInt` on untrusted boundary data. Reject missing, wrong, or conflicting currency/scale and never default a non-EUR scale to two digits.

Do not claim application wiring from a browser-bundle test alone. A real UI contour must demonstrate that the shipped screen loads the intended engine, commits input, displays the expected preview, sends the declared units, and handles server disagreement.

## Formatting

- Format only canonical tagged amounts: use `formatEurCents` for EUR cents or the matching immutable engine's `format` method for another currency.
- Pass only locale as a formatting option; currency and scale come from the selected facade or engine definition.
- Reject attempts to show EUR cents as USD/JPY or another currency without a separately authorized and implemented FX conversion.
- Do not compare localized output as a numeric value.
- Test stable semantic parts where exact spacing or currency placement varies by runtime locale data.

## Browser verification

Cover human input, invalid input, integer-looking input, negative and zero values, rounding-sensitive preview, strict DTO serialization, wrong currency/scale discriminants, mixed currency/scale rejection, server round trip, locale rendering, forbidden relabeling, and a stale or rejected preview. Record browser-bundle evidence separately from application-screen evidence.
