# Rate Limiting

## Strategy
- Preserve the project-owned quota model. A coarse pre-auth and principal/client/tenant post-auth split is one option when the accepted abuse and fairness requirements call for it.
- Preserve the accepted rejection status, body, and rate-limit headers; do not infer `429`, Problem Details, or a `requestId` field when the project contract has not defined them.
- When the accepted auth-admission model has pre-auth and post-auth buckets, keep their isolation explicit: invalid credentials, unknown tokens, or unauthenticated probes must not consume the valid principal, client, tenant, or operator bucket.
- When replay behavior is part of admission, test the exact duplicate or retry scenario that the limit is meant to control.

## Key choice
- Choose keys, environments, and endpoint classes from the accepted threat/fairness model; IP may be noisy for mobile and proxy traffic.

## Edge/WAF rules
- Integrate edge/WAF and application limits only when the security/platform owners select them and define their respective responsibilities.

## Consistency notes
- Some platform rate-limit APIs may be location-scoped or eventually consistent. Treat that as version-sensitive: verify the selected runtime's current official semantics before integrating an accepted quota design.
