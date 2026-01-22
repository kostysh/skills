---
name: supabase-engineer
description: Comprehensive Supabase engineering guidance for PostgreSQL schema design, RLS policies, auth, realtime, storage, Edge Functions, migrations/CLI, performance, observability, and troubleshooting. Use when building, refactoring, or debugging Supabase apps; designing schemas or policies; integrating auth/storage/realtime; writing Edge Functions; or setting up Supabase CI/ops workflows.
---

# Supabase Engineer

Build and operate Supabase-backed systems with strong security, performance, and reliability.

## Non-negotiables
- Keep service role keys server-side only; clients use anon/publishable keys.
- Validate auth on the server with `auth.getUser()` (not `getSession()`).
- Enable RLS on all public tables and storage; cache `auth.uid()` via `(select auth.uid())`.
- Use `getAll`/`setAll` cookie methods with `@supabase/ssr` (avoid deprecated `get/set/remove`).
- Prefer schema-first migrations: edit `supabase/schemas/*.sql`, then `supabase db diff`.
- For Edge Functions, use `Deno.serve()`, versioned imports, and write only to `/tmp`.

## Fast workflow
1. Clarify data ownership, access rules, and latency requirements.
2. Draft schema + RLS policies early; add indexes for RLS columns.
3. Pick architecture variant and client setup.
4. Implement auth + storage + realtime with typed clients.
5. Add retries/backoff/idempotency for writes; cache or batch hot reads.
6. Configure local dev, CI, and multi-env secrets.
7. Prepare production checklist and incident runbook.

## Database introspection (when tools are available)
Use MCP Supabase tools for safe schema discovery:
- `mcp__supabase__list_tables`
- `mcp__supabase__get_table_schema`
- `mcp__supabase__execute_sql` (read-only)

## Reference map
Read only what you need:
- Client setup: `references/client-setup.md`
- Auth flows + protected routes: `references/auth.md`
- Database CRUD, relationships, pagination: `references/database.md`
- RLS policies + storage RLS: `references/rls.md`
- Realtime + presence: `references/realtime.md`
- Storage operations: `references/storage.md`
- Edge Functions (Deno): `references/edge-functions.md`
- Vector embeddings (pgvector): `references/vector.md`
- Database functions + triggers: `references/db-functions.md`
- Migrations + CLI: `references/migrations-cli.md`
- Reliability, rate limits, performance: `references/operations-reliability.md`
- Observability + debug bundles: `references/operations-observability.md`
- CI, deploy, multi-env, upgrades, runbooks: `references/operations-release.md`
- Architecture variants: `references/architecture.md`
- Webhooks + signature verification: `references/webhooks.md`
- Common errors + fixes: `references/troubleshooting.md`
- PII, retention, redaction: `references/data-handling.md`
