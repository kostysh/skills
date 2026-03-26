# Row Level Security (RLS)

## Critical rules
- Enable RLS on all public tables and storage objects.
- Force RLS on tables that owners or elevated roles might otherwise bypass unintentionally.
- Cache `auth.uid()` via `(select auth.uid())` for performance.
- Add indexes on RLS-checked columns (e.g. `user_id`, `org_id`).
- Specify roles with `to authenticated`/`anon` where appropriate.
- Treat views as a separate boundary; prefer `security_invoker = true` for views exposed to end-user queries.

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

-- Role-based access
create policy "Admin full access"
on public.documents
for all
to authenticated
using ((select auth.jwt() ->> 'role') = 'admin');

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
- Policy predicates match the actual ownership or membership model.
- Elevated paths (`service_role`, privileged functions, admin RPCs) are documented as intentional bypasses.
- RLS columns used in predicates are indexed.
- Views and functions do not accidentally bypass caller RLS semantics.

## Schema design rules
- Use `public.profiles` with FK to `auth.users(id)`; avoid exposing `auth.users` directly.
- Consider `on delete cascade` from `auth.users` to dependent tables.
