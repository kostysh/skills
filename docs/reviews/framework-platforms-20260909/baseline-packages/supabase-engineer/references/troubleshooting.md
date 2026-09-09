# Troubleshooting

## Classify before changing credentials or policies

| Symptom | Check first | Unsafe shortcut |
| --- | --- | --- |
| `Invalid JWT` | Whether `Authorization` contains a user JWT, its signing model/expiry, and whether an opaque API key was incorrectly used as Bearer | Rotating every API key |
| 401/403 | `apikey` presence/type, user JWT, function auth mode, audience/issuer, and caller identity | Treating every response as an expired project key |
| 42501 / permission denied | Exposed schema, actual `anon`/`authenticated` grants, then RLS/policies | Granting all privileges or adding `security definer` |
| Empty update/delete | Required `select` policy, filters, `using`, and caller visibility | Assuming success from a 2xx response |
| `PGRST116` | Cardinality, filters, RLS visibility, `.single()` vs `.maybeSingle()` | Concluding the row does not exist |
| 429 | Product-specific limit, `Retry-After`, idempotency, and bounded retry budget | Retrying every write immediately |
| Connection exhaustion | Connection source, pool mode, concurrency, leaks, and current limits | Adding a pooler without compatibility checks |

## Triage workflow

1. Capture exact status, error code, request boundary, environment, SDK/CLI version, and a redacted request ID.
2. Reproduce with the smallest real caller identity and path; distinguish SDK, Data API, RPC, Storage, Realtime, Edge Function, and direct Postgres failures.
3. Inspect relevant Supabase logs/advisors and current official troubleshooting guidance.
4. Change one bounded hypothesis and read back the result.
5. After two or three failed attempts, stop repeating the approach and re-evaluate the model or escalate with a redacted diagnostic bundle.

Do not claim resolution from a configuration edit alone. Re-run the original failing path and the adjacent negative authorization case.
