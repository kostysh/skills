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

## Database introspection (Use MCP Supabase - verified path)
Use this exact sequence so you don't guess or probe unsupported endpoints:
1. `mcp__supabase__list_projects` — confirm access and get the `project_id`.
2. `mcp__supabase__list_tables` — fetch schema; this already includes columns, PKs, and FKs.
3. `mcp__supabase__execute_sql` — read-only queries only (e.g., SELECTs) for deeper inspection.

Additional introspection tools (use when relevant):
- `mcp__supabase__list_extensions` — enabled Postgres extensions.
- `mcp__supabase__list_migrations` — applied migrations/versions.
- `mcp__supabase__get_advisors` — security/perf advisories and recommendations.
- `mcp__supabase__get_project` — project details (region, Postgres version).

Notes:
- Do **not** call `resources/list` for Supabase MCP; it is not supported here.
- If any MCP call fails, stop and ask the user to confirm auth/connection for Supabase MCP.

## Finding other MCP Supabase tools (fast path)
If you need a tool outside this list, use the tool registry (not MCP resources):
1. Scan the available `mcp__supabase__*` tools in the current session.
2. Prefer the most specific tool first (e.g., list/get over execute SQL).
3. If unsure, ask the user which operation they want (schema, data, functions, logs, etc.).

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
