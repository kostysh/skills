# Troubleshooting

## Common errors
| Error | Likely cause | Fix |
| --- | --- | --- |
| Invalid JWT | Token expired or malformed | Refresh session; use `getUser()` server-side |
| RLS policy violation | Policy blocking operation | Check `pg_policies` and RLS rules |
| Connection pool exhausted | Too many connections | Enable pooling (pgBouncer) |
| 429 Too Many Requests | Rate limited | Backoff + queue bursts |
| 401/403 Auth errors | Invalid/expired API key | Rotate and update keys |
| PGRST116 | No rows returned | Check filters or use `.maybeSingle()` |
| 23505 | Unique constraint violation | Handle duplicate keys gracefully |

## Triage checklist
- Check Supabase status page.
- Validate API keys and environment variables.
- Reproduce with minimal query and log response.
- Confirm RLS policies and user claims.
