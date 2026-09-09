# Row Level Security (RLS)

## Critical rules
- Enable RLS on every table in an exposed schema; `public` is exposed by default. Storage access is controlled through policies on `storage.objects`.
- Use `force row level security` only when table owners should be subject to policies. Superusers and roles with `BYPASSRLS`, including elevated Supabase paths, still bypass RLS.
- Cache `auth.uid()` via `(select auth.uid())` for performance.
- Add indexes on RLS-checked columns (e.g. `user_id`, `org_id`).
- Specify roles with `to authenticated`/`anon` where appropriate.
- Treat Data API grants as the reachability layer and RLS as the row layer; both must match the intended operation.
- Treat views as a separate boundary; prefer `security_invoker = true` for views exposed to end-user queries.
- For user-scoped capabilities, test direct PostgREST/RPC behavior with publishable key + user JWT; API-route tests alone do not prove RLS.
- Keep service-layer auth/RBAC gates and RLS/RPC helper gates aligned for session/context freshness, status, scope/tenant, role, and profile/readiness requirements.
- Never authorize from `user_metadata`. Use trusted database state or trusted claims such as `app_metadata`, and account for JWT staleness.

## Policy templates
```sql
-- Owner-only access
create policy "Owner access"
on public.documents
as permissive
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Public read, authenticated write
create policy "Public read"
on public.posts
for select
to anon, authenticated
using (true);

create policy "Authenticated write"
on public.posts
for insert
to authenticated
with check ((select auth.uid()) is not null);

-- Role-based access using a trusted application claim
create policy "Admin full access"
on public.documents
for all
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'app_role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'app_role') = 'admin');

-- Org membership
create policy "Org members can view"
on public.documents
for select
to authenticated
using (
  org_id in (
    select org_id
    from public.org_members
    where user_id = (select auth.uid())
  )
);
```

## Storage RLS
```sql
create policy "Users can upload own avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Public avatar access"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');
```

## Views
```sql
create view public.user_documents
with (security_invoker = true)
as
select *
from public.documents
where user_id = (select auth.uid());
```

Prefer `security_invoker = true` for views that should respect caller policies. Avoid exposing default-definer views to untrusted callers unless the bypass is deliberate and documented.

## Policy coverage matrix

For each table or storage surface, verify policy coverage explicitly:

| Surface | `select` | `insert` | `update` | `delete` | Roles |
|---------|----------|----------|----------|----------|-------|
| `public.documents` | owner/org policy | owner/org policy | owner/org policy | owner/org policy | `authenticated` |
| `storage.objects` (`avatars`) | public or scoped read | scoped upload | scoped update if allowed | scoped delete if allowed | `anon`, `authenticated` |

If an operation should be impossible, record that intentionally and keep the policy absent rather than assuming defaults are obvious.

## Review checklist
- Table has both `enable row level security` and, where needed, `force row level security`.
- Policies cover every intended operation and role explicitly.
- `update` has the required `select` policy plus `using` and `with check` predicates.
- Policy predicates match the actual ownership or membership model.
- Elevated paths (`service_role`, privileged functions, admin RPCs) are documented as intentional bypasses.
- User-scoped operations use user JWT/RLS or security-checked RPC instead of service-role bypass.
- Policies or helper functions reject stale or mismatched session id/version, active context id/version, role, scope/tenant, disabled/revoked status, and missing profile/readiness state when those claims protect the capability.
- RLS columns used in predicates are indexed.
- Views and functions do not accidentally bypass caller RLS semantics.
- Direct Data API grants for `anon` and `authenticated` are explicit and no broader legacy/default grant remains unnoticed.

## Database test matrix

For auth/RBAC-sensitive tables, storage policies, and RPCs, include allow and deny cases for:

- valid caller and expected role/scope/tenant;
- stale session or session version;
- stale active context or active context version;
- wrong role, scope, or tenant;
- revoked or disabled account/session/role status;
- missing profile/readiness state when permission depends on it;
- direct PostgREST/RPC behavior with publishable key + user JWT where the path is exposed.
- update visibility and post-update ownership checks;
- anonymous Supabase Auth users when they must differ from permanent authenticated users.

Do not rely only on server API or in-memory tests when RLS is the production permission boundary.

## Schema design rules
- Use `public.profiles` with FK to `auth.users(id)`; avoid exposing `auth.users` directly.
- Consider `on delete cascade` from `auth.users` to dependent tables.
