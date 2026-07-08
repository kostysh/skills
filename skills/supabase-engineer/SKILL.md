---
name: supabase-engineer
description: Comprehensive Supabase engineering guidance for PostgreSQL schema
  design, RLS policies, auth, realtime, storage, Edge Functions, migrations/CLI,
  performance, observability, and troubleshooting. Use when building,
  refactoring, or debugging Supabase apps; designing schemas or policies;
  integrating auth/storage/realtime; writing Edge Functions; or setting up
  Supabase CI/ops workflows.
metadata:
  source-version: 0.1.2
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: f830f70bc36af4c10cb6956045e2ec7095e4348d59af64865c0b95e24fa95a5e
---

# supabase-engineer

## Start here

1. Confirm the task matches supabase-engineer's applicability criteria.
2. Use the preserved overview guidance as the normative workflow for this skill.
3. Load only the active references that match the current task.
4. Preserve existing project conventions unless the overview explicitly requires a stricter invariant.

## When to use this skill

- Building, refactoring, reviewing, or debugging Supabase-backed applications.
- Designing PostgreSQL schemas, RLS policies, auth flows, storage, realtime, Edge Functions, migrations, performance, observability, or operations workflows.
- Using Supabase CLI, local development, MCP discovery, or cloud-safe Supabase inspection.

## When NOT to use this skill

- The task has no Supabase, PostgreSQL, RLS, auth, storage, realtime, Edge Function, or Supabase operations surface.
- The task is purely frontend, framework, or TypeScript work without Supabase-specific behavior.

## Overview

Build and operate Supabase-backed systems with strong security, performance, and reliability.

## Non-negotiables
- Keep service role keys server-side only; clients use anon/publishable keys.
- Respect project SDK policy: when a repo mandates `@supabase/supabase-js` only, do not mix direct REST/PostgREST calls or alternative SDKs in runtime code.
- Validate auth on the server with `auth.getUser()` (not `getSession()`).
- Enable RLS on all public tables and storage; cache `auth.uid()` via `(select auth.uid())`.
- Treat grants/privileges and RLS as separate controls: least-privilege grants still matter even when RLS is enabled.
- Use `getAll`/`setAll` cookie methods with `@supabase/ssr` (avoid deprecated `get/set/remove`).
- Prefer schema-first migrations: edit `supabase/schemas/*.sql`, then `supabase db diff`.
- Separate Supabase clients by trust boundary (`anon`, `user`, `service`) and document where bypass-RLS access is allowed.
- Build user-scoped clients per request and inject user JWT via request headers during client creation (avoid shared mutable auth state in server runtimes).
- For ordinary user reads/writes, prefer user JWT + RLS or a security-checked RPC; reserve service-role clients for documented internal/admin/secret-bearing boundaries.
- For auth/RBAC work, verify direct PostgREST/RPC behavior with publishable key + user JWT, not only server API behavior.
- RLS helpers, storage policies, and RPC functions that protect the same capability as service code must enforce the same session/context freshness, status, scope/tenant, role, and profile/readiness gates.
- Use `security_invoker = true` on exposed views that must obey caller RLS semantics.
- Default storage bucket provisioning to idempotent SQL migrations (not manual dashboard/runtime auto-create) unless the project explicitly chooses another ops model.
- For Edge Functions, use `Deno.serve()`, versioned imports, and write only to `/tmp`.
- For cloud databases via MCP (stage/prod/remote), enforce read-only mode only: MCP writes are forbidden. Use `read_only=true` and do not run mutating tools/queries.

## Auth email/recovery troubleshooting checklist
- If signup/recovery returns generic server errors, inspect Supabase Auth logs first (`/signup`, `/recover`, `/verify` paths).
- Verify SMTP sender/domain constraints (for example provider domain verification requirements).
- Verify Auth URL configuration:
  - `Site URL`,
  - allow-listed redirect URLs include exact recovery/reset path.
- Treat email template redirect behavior as runtime-sensitive:
  - `RedirectTo` can fallback unexpectedly in some setups,
  - deterministic links via `SiteURL` + recovery params are often more reliable.
- Do not silence all 4xx errors from upstream auth in server APIs; mask only anti-enumeration cases intentionally.

## Fast workflow
1. Clarify data ownership, access rules, and latency requirements.
2. Draft schema, grants, and RLS policies early; add indexes for RLS columns.
3. Pick architecture variant and client setup.
4. Implement auth + storage + realtime with typed clients.
5. Verify user-scoped direct data paths: PostgREST/RPC with publishable key + user JWT, RLS allow/deny behavior, and stale/wrong claim denial where relevant.
6. Add retries/backoff/idempotency for writes; cache or batch hot reads.
7. Configure local dev, CI, and multi-env secrets.
8. Prepare production checklist and incident runbook.
9. Align database/app test execution with project contours (local fast loop, PR required gates, nightly stability).

## Local deterministic bootstrapping (dev-only)

For local integration environments where reproducibility is more important than preserving local data:
1. Start local Supabase services.
2. Reset DB from migrations (`supabase db reset`) to known baseline.
3. Start application server runtime.
4. Run one-time app bootstrap endpoint (for example ROOT/admin bootstrap) from trusted local automation.
5. Start client app.

Critical reminders:
- `db reset` alone does not necessarily create interactive admin/root accounts; often it only sets baseline flags/data.
- Treat bootstrap endpoint as idempotent in automation (`200 created` and `409 already initialized` are both acceptable outcomes).
- Bootstrap credentials/tokens must come from local env files/secrets; never hardcode in scripts.
- Keep bootstrap scripts local-only and refuse non-local target origins/hosts.

## Client model (anon / user / service)

- `anon` client: publishable key without JWT; use only for endpoints intentionally exposed by RLS to unauthenticated reads.
- `user` client: publishable key + end-user JWT from the incoming request (cookie/header) for RLS-scoped operations.
- `service` client: service role key for internal/admin/secret-bearing tasks only; never pass through from browser/client code and do not use it for ordinary user-scoped reads or mutations unless the bypass is explicitly documented and separately authorized.
- Prefer request-scoped client factories to avoid cross-request auth leakage in long-lived runtimes.
- For each endpoint, define expected trust level first, then choose the matching client type.

## Storage bucket provisioning

- Treat bucket config as infrastructure and manage it via migrations.
- Use idempotent statements (`ON CONFLICT` updates) so stage/prod rollout is repeatable.
- Keep bucket identifiers stable across environments unless there is an explicit isolation requirement.
- Apply policy/config changes via append-only migrations and avoid dashboard-only drift.

## Database introspection (MCP workflow)
Use this exact sequence for schema discovery:
1. `mcp__supabase__list_projects` (if account-scoped access is available) — identify project.
2. `mcp__supabase__list_tables` — fetch schema, columns, PKs, and FKs.
3. `mcp__supabase__execute_sql` — read-only inspection queries only (SELECT).

Cloud safety rule:
- Allowed on cloud DBs: read-only tools and `SELECT` queries only.
- Forbidden on cloud DBs: `apply_migration`, branch lifecycle writes (`create_branch`, `merge_branch`, `reset_branch`, `rebase_branch`, `delete_branch`), `deploy_edge_function`, and any `execute_sql` with DDL/DML (`insert`, `update`, `delete`, `alter`, `drop`, `create`, `truncate`, `grant`, `revoke`).
- Schema/data changes for cloud environments must go through repository migrations and CI/CD, not direct MCP writes.

Additional tools when needed:
- `mcp__supabase__list_extensions` — enabled Postgres extensions.
- `mcp__supabase__list_migrations` — applied migrations/versions.
- `mcp__supabase__get_advisors` — security/perf advisories.
- `mcp__supabase__get_project` — project metadata (region, Postgres version).

For MCP transport behavior, endpoint constraints, and error-handling rules, see `Supabase MCP API behavior (critical)` below.

## Supabase MCP API behavior (critical)

Supabase MCP is a **remote MCP endpoint**, not a REST API. Treat it as MCP Streamable HTTP/JSON-RPC transport:

- Endpoint shape: `https://mcp.supabase.com/mcp` (optionally with query params).
- Query options are transport-level server config:
  - `project_ref=<id>`: scope to one project.
  - `read_only=true`: force read-only DB execution.
  - `features=...`: enable selected tool groups.
- Client-to-server MCP messages are JSON-RPC over **HTTP POST**.
- Raw HTTP `GET` to the MCP endpoint is not a valid generic tool call pattern and often returns `405 Method not allowed`.
- Do not manually craft ad-hoc HTTP calls to MCP endpoints when MCP tools are available in the runtime.

Practical rules for agents:

1. Prefer runtime MCP tools (`mcp__<server>__*`) instead of direct `curl`/REST probing.
2. Do not infer capability by probing random paths; use actual tool calls and handle tool errors.
3. If project-scoped (`project_ref` set), expect account-level tools (e.g., `list_projects`) to be unavailable by design.
4. In CI/non-interactive setups, PAT auth via `Authorization: Bearer ...` is supported; browser OAuth/dynamic registration is default for interactive clients.
5. For cloud DBs, treat MCP as strictly read-only even if write tools are visible in the runtime.

References (official):
- Supabase MCP docs: https://supabase.com/docs/guides/getting-started/mcp
- Supabase MCP server README: https://github.com/supabase-community/supabase-mcp
- MCP transport spec (Streamable HTTP): https://modelcontextprotocol.io/specification/2025-06-18/basic/transports

## Reference map
Read only what you need:
- Client setup: `references/client-setup.md`
- Auth flows + protected routes: `references/auth.md`
- Database CRUD, relationships, pagination: `references/database.md`
- RLS policies + storage RLS: `references/rls.md`
- Grants, privileges, and permission modeling: `references/security-privileges.md`
- Realtime + presence: `references/realtime.md`
- Storage operations: `references/storage.md`
- Edge Functions (Deno): `references/edge-functions.md`
- Vector embeddings (pgvector): `references/vector.md`
- Database functions, triggers, security-definer RPCs, and helper authorization: `references/db-functions.md`
- Migrations + CLI: `references/migrations-cli.md`
- Reliability, rate limits, performance: `references/operations-reliability.md`
- Observability + debug bundles: `references/operations-observability.md`
- CI, deploy, multi-env, upgrades, runbooks: `references/operations-release.md`
- Architecture variants: `references/architecture.md`
- Webhooks + signature verification: `references/webhooks.md`
- Common errors + fixes: `references/troubleshooting.md`
- PII, retention, redaction: `references/data-handling.md`

## Workflow stages

### Workflow stage: Apply supabase-engineer guidance

Apply the preserved supabase-engineer guidance without changing its domain behavior.

1. Match the request to the applicability criteria.
2. Follow the preserved overview sections for the concrete work.
3. Read the smallest relevant active reference before using detailed guidance from it.
4. Run the relevant verification from the overview or report why it could not be run.

Validation:

- The outcome follows the preserved skill guidance and any loaded reference constraints.

## Gotchas

- **high** — Do not treat memory-store tests, mocked API tests, or direct table reads as evidence for a production Supabase/RLS path that is supposed to be RPC-first.
- **high** — Do not allow domain mutations to succeed when required audit/history evidence is missing, unsafe, or only written outside the transaction.

## Policies

### SQL/API design output policy
For Supabase-backed API work, design notes must name tables, RPCs, grants/RLS, service-role exceptions, direct table paths, validation/constraint mapping, audit/history payload profile, and tests before migration application.

## Required active references
- [Architecture](references/architecture.md) — Read this when you need Architecture variants.
- [Auth](references/auth.md) — Read this when you need Auth flows + protected routes.
- [Client Setup](references/client-setup.md) — Read this when you need Client setup.
- [Data Handling](references/data-handling.md) — Read this when you need PII, retention, redaction.
- [Database](references/database.md) — Read this when you need Database CRUD, relationships, pagination.
- [Db Functions](references/db-functions.md) — Read this when you need database functions, triggers, security-definer RPCs, and helper-function authorization.
- [Edge Functions](references/edge-functions.md) — Read this when you need Edge Functions (Deno).
- [Migrations Cli](references/migrations-cli.md) — Read this when you need Migrations + CLI.
- [Operations Observability](references/operations-observability.md) — Read this when you need Observability + debug bundles.
- [Operations Release](references/operations-release.md) — Read this when you need CI, deploy, multi-env, upgrades, runbooks.
- [Operations Reliability](references/operations-reliability.md) — Read this when you need Reliability, rate limits, performance.
- [Realtime](references/realtime.md) — Read this when you need Realtime + presence.
- [Rls](references/rls.md) — Read this when you need RLS policies + storage RLS.
- [Security Privileges](references/security-privileges.md) — Read this when you need Grants, privileges, and permission modeling.
- [Storage](references/storage.md) — Read this when you need Storage operations.
- [Troubleshooting](references/troubleshooting.md) — Read this when you need Common errors + fixes.
- [Vector](references/vector.md) — Read this when you need Vector embeddings (pgvector).
- [Webhooks](references/webhooks.md) — Read this when you need Webhooks + signature verification.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory supabase-engineer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
