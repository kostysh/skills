# Webhook Security Review

Use this file for inbound webhook handlers and background consumers triggered by third-party services.

## Required Checks

### Signature Verification

Check:

- signature is verified before side effects
- the exact raw body is used when the provider requires byte-exact validation
- secret lookup and algorithm selection are correct

Detection hints:

- search for provider SDK verification helpers, manual HMAC code, and body parsers that may consume or normalize the payload first
- compare the verified payload source with the parsed payload source used for side effects

### Replay Protection

Check:

- timestamp freshness window
- nonce or delivery ID deduplication where the provider offers it
- rejection of stale or duplicate deliveries

Detection hints:

- search for provider timestamps, delivery IDs, event IDs, or dedupe storage
- inspect whether retries can reach destructive code paths with no freshness or uniqueness check

### Idempotency and Retries

Check:

- handler is safe under provider retries
- side effects are idempotent or protected by dedupe keys
- partial failures do not trigger duplicate writes or emails

Detection hints:

- inspect job fan-out, database writes, and email or billing calls for repeat-safety
- check whether error handling can acknowledge the webhook too early or retry after partial success

### Trust Boundaries

Check:

- headers are not trusted without verification
- internal admin actions are not triggered directly from webhook payload values
- queue or job fan-out does not occur before authenticity is established

What to verify before reporting:

- whether the provider actually requires raw-body verification or signs a canonical representation
- whether dedupe or replay controls live in a downstream consumer rather than the ingress handler
- whether a privileged action triggered from webhook data still requires an independent authorization check later

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
