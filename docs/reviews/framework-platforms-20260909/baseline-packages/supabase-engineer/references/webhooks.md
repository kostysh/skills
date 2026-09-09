# Webhooks and Auth Hooks

Identify the producer before choosing authentication. There is no universal `Supabase webhook signature` contract.

## Database Webhooks

Database Webhooks are asynchronous `pg_net` HTTP calls generated from table events. They do not automatically use a generic `timestamp.payload` HMAC verifier.

- Configure an explicit receiver-authentication contract, such as a controlled secret-key `apikey` header for a compatible Supabase endpoint or an application-owned shared secret/header verified by the receiver.
- Store database-side secrets in Vault and read them at call time; do not hardcode them in trigger SQL or dashboard configuration.
- Validate the documented INSERT/UPDATE/DELETE payload shape and apply authorization before processing.
- Inspect `net` schema delivery history when diagnosing transport failures.

## Auth HTTP Hooks

Auth HTTP Hooks use the current Standard Webhooks signing contract.

- Use the official Standard Webhooks library/verifier and the hook secret supplied by Supabase.
- Verify the raw body and required webhook headers before JSON parsing.
- Support the contract's versioned/base64 signatures and multiple signatures for key rotation; do not invent a hex HMAC format.
- Enforce timestamp tolerance in both past and future directions through the official verifier.
- Respect Auth Hook timeout and error-response contracts.

Postgres Auth Hooks have a different permission model: grant the Auth admin role only the required schema/function access and revoke execute from public application roles.

## External-provider webhooks

For Stripe, GitHub, Slack, or another producer, use that producer's official signature scheme, raw-body requirements, replay checks, and secret rotation behavior. Configure Edge Function auth so the provider can reach the endpoint, then authenticate the producer inside the handler before trusting the body.

## Delivery and idempotency

- Do not assume every producer supplies a stable event ID. Define the deduplication key from the producer contract and persist it transactionally with effects.
- Test valid, invalid, expired/future, rotated-key, duplicate, malformed, timeout, and retry cases applicable to the producer.
- A replayed `curl` request without a valid producer signature proves routing only, not authenticity or end-to-end delivery.
