# Browser boundaries

Read this reference when browser input, preview, state, serialization, or formatting is in scope.

## State and input

- Keep the editing control as a raw human-input string.
- Parse only at an explicit commit boundary such as accepted blur or submit behavior.
- Store committed canonical values as bigint cents when the target browser/toolchain supports the verified money engine.
- Keep rate, amount, formatted output, validation error, and source/version metadata separate.
- Never calculate from localized formatted strings.

The human-input parser accepts only the syntax promised by the discovered engine. Do not infer locale grouping support from display formatting.

## Preview versus authority

Browser use of the canonical engine is valuable for immediate deterministic preview, but the browser is not persistence authority:

- submit unit-bearing canonical fields such as `amountCents` as decimal strings;
- submit the inputs and source/version needed for server verification when the contract requires them;
- let the server recompute or validate the authoritative amount;
- show an explicit error or stale-policy state when server authority rejects the preview.

Do not claim application wiring from a browser-bundle test alone. A real UI contour must demonstrate that the shipped screen loads the intended engine, commits input, displays the expected preview, sends the declared units, and handles server disagreement.

## Formatting

- Format only canonical cents.
- Keep locale and currency choices in presentation code.
- Do not compare localized output as a numeric value.
- Test stable semantic parts where exact spacing or currency placement varies by runtime locale data.

## Browser verification

Cover human input, invalid input, integer-looking input, negative and zero values, rounding-sensitive preview, serialization, server round trip, locale rendering, and a stale or rejected preview. Record browser-bundle evidence separately from application-screen evidence.
