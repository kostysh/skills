# Worked Example Specification

Use this when you need a small input-to-output example of the expected final artifact.

## Input

```text
Add POST /coupon/validate. Clients send code and cartSubtotalCents. Return whether
the coupon can be applied. Codes are case-insensitive. EXPIRED and UNKNOWN should
be rejected. Do not create orders or reserve coupons.
```

## Output

# Coupon Validation Endpoint

## Scope

Specify `POST /coupon/validate` for checking whether a coupon code can be applied to a cart subtotal.

Out of scope:

- creating orders;
- reserving coupon usage;
- applying discounts to checkout state;
- admin coupon management.

Source context: user request.
Criticality: medium, because incorrect validation can affect pricing but does not itself move money or create an order.

## Behavior

Given a client has a cart subtotal and a coupon code, when the client calls `POST /coupon/validate`, the Coupon API MUST return whether the coupon is applicable without creating an order, reserving usage, or mutating checkout state.

## Requirements

| ID | Source | Requirement | Verification |
| --- | --- | --- | --- |
| R1 | user request | `POST /coupon/validate` MUST accept `code` and `cartSubtotalCents`. | Contract validation |
| R2 | user request | Coupon code matching MUST be case-insensitive. | Example-based test |
| R3 | user request | The API MUST reject `EXPIRED` and `UNKNOWN` coupons with an explicit reason. | Example-based test |
| R4 | user request | The endpoint MUST NOT create orders, reserve coupon usage, or mutate checkout state. | Inspection plus behavioral test |

Invariant:

- `INV1: Calling POST /coupon/validate MUST NOT change order count, coupon reservation count, or checkout state.`

## Edge Cases

| Case | Input | Expected result |
| --- | --- | --- |
| valid code | `SAVE10`, subtotal `5000` | applicable |
| case variant | `save10`, subtotal `5000` | same result as `SAVE10` |
| expired | `EXPIRED`, subtotal `5000` | rejected with reason `expired` |
| unknown | `UNKNOWN`, subtotal `5000` | rejected with reason `unknown` |
| missing code | no `code` | validation error |
| negative subtotal | subtotal `-1` | validation error |

## Acceptance

- Positive: A request with `SAVE10` and `cartSubtotalCents=5000` returns an applicable result.
- Negative: Requests for `EXPIRED` and `UNKNOWN` return rejected results with explicit reasons.
- Falsifier: If any validation request changes order count, coupon reservation count, or checkout state, the spec is not satisfied.

## Anti-Claims / Gaps

- This spec does not define coupon creation or management.
- This spec does not apply a coupon to an order.
- This spec assumes the coupon catalog already exists.
