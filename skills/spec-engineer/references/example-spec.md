# Worked Example Specification

Use this when you need a small input-to-output example of the expected final artifact.

## Input

```text
Approved sources:
- API-12 defines POST /coupon/validate and is ready for specification.
- AUTH-3 requires the existing cart-client authentication contract.
- API-ERR-1 defines the existing HTTP 400 ValidationError response.
- ARCH-HO-7 is ready for coding and defines read-only as no order creation,
  coupon reservation, checkout mutation, or coupon-catalog change.

Consumer: coding agent.

Request JSON:
- code: required non-empty ASCII string, 1..32 characters;
- cartSubtotalCents: required integer, 0..100000000.

Coupon catalog lookup already returns ACTIVE, EXPIRED, or UNKNOWN and is outside
this change. API-12 maps SAVE10 to ACTIVE, EXPIRED to EXPIRED, and MISSING to
UNKNOWN. API-12 requires ASCII case-insensitive matching and forbids every other
normalization.

Response:
- ACTIVE -> HTTP 200 { "applicable": true, "reason": null }
- EXPIRED -> HTTP 200 { "applicable": false, "reason": "expired" }
- UNKNOWN -> HTTP 200 { "applicable": false, "reason": "unknown" }
- invalid request -> HTTP 400 using API-ERR-1.

```

## Output

# Coupon Validation Endpoint

## Scope And Handoff

- Handoff status: `ready for coding`.
- Named consumer: coding agent.
- Scope: specify `POST /coupon/validate` for checking coupon applicability.
- Out of scope: coupon catalog behavior, discount application, orders, reservations, checkout mutation, and admin coupon management.
- Source authority and readiness: `API-12`, `AUTH-3`, and `API-ERR-1` are approved; `ARCH-HO-7` is ready for coding.
- Blockers: none.
- Criticality: medium because the result can affect later pricing decisions, although this endpoint does not move money or mutate checkout state.

## Behavior

Given an authenticated cart client has a candidate coupon code and cart subtotal, when the client calls `POST /coupon/validate`, the Coupon API MUST return the source-defined applicability result without creating an order, reserving a coupon, mutating checkout state, or changing the coupon catalog.

## Requirements

| ID | Source | Requirement | Verification |
| --- | --- | --- | --- |
| R1 | AUTH-3 | `POST /coupon/validate` MUST enforce the existing cart-client authentication contract. | Contract validation |
| R2 | API-12 | The request body MUST contain field `code`. | Schema validation plus missing-field test |
| R3 | API-12 | Request field `code` MUST be an ASCII string with length from 1 through 32 characters. | Schema validation plus boundary tests |
| R4 | API-12 | The request body MUST contain field `cartSubtotalCents`. | Schema validation plus missing-field test |
| R5 | API-12 | Request field `cartSubtotalCents` MUST be an integer from 0 through 100000000 inclusive. | Schema validation plus boundary tests |
| R6 | API-12 | Coupon code matching MUST compare ASCII letters case-insensitively without applying any other normalization. | Example-based test |
| R7 | API-12 | For catalog result `ACTIVE`, the API MUST return HTTP 200 with `{ "applicable": true, "reason": null }`. | Contract validation plus example-based test |
| R8 | API-12 | For catalog result `EXPIRED`, the API MUST return HTTP 200 with `{ "applicable": false, "reason": "expired" }`. | Contract validation plus example-based test |
| R9 | API-12 | For catalog result `UNKNOWN`, the API MUST return HTTP 200 with `{ "applicable": false, "reason": "unknown" }`. | Contract validation plus example-based test |
| R10 | API-ERR-1 | An invalid request MUST return HTTP 400 using the existing `ValidationError` contract. | Contract validation plus negative tests |
| R11 | ARCH-HO-7 | A validation request MUST NOT create an order. | Effect-observer test plus state inspection |
| R12 | ARCH-HO-7 | A validation request MUST NOT reserve a coupon. | Effect-observer test plus state inspection |
| R13 | ARCH-HO-7 | A validation request MUST NOT mutate checkout state. | Effect-observer test plus state inspection |
| R14 | ARCH-HO-7 | A validation request MUST NOT change the coupon catalog. | Effect-observer test plus state inspection |

Invariant:

- `INV1: While handling a validation request, the endpoint MUST NOT issue an order-creation command or write.`
- `INV2: While handling a validation request, the endpoint MUST NOT issue a coupon-reservation command or write.`
- `INV3: While handling a validation request, the endpoint MUST NOT issue a checkout-state mutation command or write.`
- `INV4: While handling a validation request, the endpoint MUST NOT issue a coupon-catalog mutation command or write.`

## Edge Cases

| Case | Input | Expected result |
| --- | --- | --- |
| active code | `SAVE10`, subtotal `5000` | source-defined `ACTIVE` response |
| case variant | `save10`, subtotal `5000` | same result as `SAVE10` |
| expired | `EXPIRED`, subtotal `5000` | source-defined `EXPIRED` response |
| unknown | `MISSING`, subtotal `5000` | source-defined `UNKNOWN` response |
| missing code | no `code`, subtotal `5000` | HTTP 400 using `API-ERR-1` |
| missing subtotal | `SAVE10`, no `cartSubtotalCents` | HTTP 400 using `API-ERR-1` |
| empty code | `""`, subtotal `5000` | HTTP 400 using `API-ERR-1` |
| code too long | 33 ASCII characters, subtotal `5000` | HTTP 400 using `API-ERR-1` |
| negative subtotal | `SAVE10`, subtotal `-1` | HTTP 400 using `API-ERR-1` |
| subtotal above maximum | `SAVE10`, subtotal `100000001` | HTTP 400 using `API-ERR-1` |

## Acceptance

- Positive: each catalog result produces its exact source-defined HTTP 200 response for valid input.
- Negative: a missing field, invalid field type, empty or oversized code, and out-of-range subtotal produce the existing `API-ERR-1` response.
- Negative: ASCII case variants resolve to the same catalog result without trimming or otherwise normalizing the code.
- Falsifier: if any validation request invokes a write or command forbidden by R11, R12, R13, or R14, the specification is not satisfied, even when the write is later rolled back or leaves the entity count unchanged.

## Anti-Claims / Gaps

- This specification does not define coupon catalog contents or lookup behavior.
- This specification does not apply a discount or guarantee checkout success.
- This specification does not add whitespace trimming, Unicode case folding, or another code-normalization rule.
- `ready for coding` certifies specification handoff only; it does not claim that the endpoint is implemented or verified in runtime.
