# Rate Limiting

## Strategy
- Apply a coarse pre-auth limit (IP/ASN/path) and a precise post-auth limit (principal/client/tenant).
- Return 429 with Problem Details and `requestId`.
- For auth-admission routes, keep quota isolation explicit: invalid credentials, unknown tokens, or unauthenticated probes must not consume the same post-auth quota bucket used by a valid principal, client, tenant, or operator.
- When replay behavior is part of admission, test the exact duplicate or retry scenario that the limit is meant to control.

## Key choice
- Prefer stable client identifiers over IP (IP is noisy for mobile/proxies).
- Separate limits by environment and endpoint class.

## Edge/WAF rules
- Use edge/WAF rules for brute-force and volumetric protection.
- Keep application-level limits for business rules and fairness.

## Consistency notes
- Some platform rate-limit APIs are location-scoped/eventually consistent; design limits accordingly.
