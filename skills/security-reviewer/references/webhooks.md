# Webhook Security Review

Use this file for inbound webhook handlers and background consumers triggered by third-party services.

## Required Checks

### Signature Verification

Check:

- signature is verified before side effects
- the exact raw body is used when the provider requires byte-exact validation
- secret lookup and algorithm selection are correct

### Replay Protection

Check:

- timestamp freshness window
- nonce or delivery ID deduplication where the provider offers it
- rejection of stale or duplicate deliveries

### Idempotency and Retries

Check:

- handler is safe under provider retries
- side effects are idempotent or protected by dedupe keys
- partial failures do not trigger duplicate writes or emails

### Trust Boundaries

Check:

- headers are not trusted without verification
- internal admin actions are not triggered directly from webhook payload values
- queue or job fan-out does not occur before authenticity is established

## High-Signal Findings

- parsed JSON verified instead of raw request body
- signature check after state change
- missing replay window
- no dedupe on retried deliveries with destructive writes
- payload-controlled routing to privileged operations

## Safe Patterns

Usually good signs:

- verify first, then parse and execute
- timestamp tolerance
- delivery ID or event ID dedupe
- minimal logged payload data
- secret rotation support
