# Browser boundaries

Read this reference when browser input, preview, state, serialization, or formatting is in scope.

## State and input

- Keep the editing control as a raw human-input string.
- Parse only at an explicit commit boundary such as accepted blur or submit behavior.
- Store committed canonical values as integer minor units with the accepted currency/scale semantics; preserve the project representation rather than introducing an example profile.
- Keep rate, amount, currency, scale, formatted output, validation error, and source/version metadata separate.
- Never calculate from localized formatted strings.

The human-input parser accepts only the syntax promised by the discovered engine. Do not infer locale grouping support from display formatting.

## Preview versus authority

Browser use of the canonical engine is valuable for immediate deterministic preview, but the browser is not persistence authority:

- submit the accepted strict DTO, preserving currency/scale and unit semantics through state and transport; the money-library reference shows conditional EUR and generic profile examples;
- submit the inputs and source/version needed for server verification when the contract requires them;
- let the server recompute or validate the authoritative amount;
- show an explicit error or stale-policy state when server authority rejects the preview.

Use the discovered public DTO serializer or explicitly validated accepted boundary contract; a unitless decimal string or bare `BigInt` call does not establish it. Reject missing, wrong, or conflicting currency/scale and never default a non-EUR scale to two digits.

Do not claim application wiring from a browser-bundle test alone. A real UI contour must demonstrate that the shipped screen loads the intended engine, commits input, displays the expected preview, sends the declared units, and handles server disagreement.

## Formatting

- Format canonical values through the verified public formatter for their accepted currency/scale; its option names are not prescribed by this guide.
- Presentation options must not change the amount's currency, scale, or numeric meaning.
- Reject attempts to show EUR cents as USD/JPY or another currency without a separately authorized and implemented FX conversion.
- Do not compare localized output as a numeric value.
- Test stable semantic parts where exact spacing or currency placement varies by runtime locale data.

## Browser verification

Cover human input, invalid input, integer-looking input, negative and zero values, rounding-sensitive preview, strict DTO serialization, wrong currency/scale discriminants, mixed currency/scale rejection, server round trip, locale rendering, forbidden relabeling, and a stale or rejected preview. Record browser-bundle evidence separately from application-screen evidence.
