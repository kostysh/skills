# Rate Limiting

## Strategy
- Apply a coarse pre-auth limit (IP/ASN/path) and a precise post-auth limit (principal/client/tenant).
- Return 429 with Problem Details and `requestId`.

## Key choice
- Prefer stable client identifiers over IP (IP is noisy for mobile/proxies).
- Separate limits by environment and endpoint class.

## Edge/WAF rules
- Use edge/WAF rules for brute-force and volumetric protection.
- Keep application-level limits for business rules and fairness.

## Consistency notes
- Some platform rate-limit APIs are location-scoped/eventually consistent; design limits accordingly.
