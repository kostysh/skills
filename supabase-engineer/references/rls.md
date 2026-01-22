# Row Level Security (RLS)

## Critical rules
- Enable RLS on all public tables and storage objects.
- Cache `auth.uid()` via `(select auth.uid())` for performance.
- Add indexes on RLS-checked columns (e.g. `user_id`, `org_id`).
- Specify roles with `to authenticated`/`anon` where appropriate.

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

## Schema design rules
- Use `public.profiles` with FK to `auth.users(id)`; avoid exposing `auth.users` directly.
- Consider `on delete cascade` from `auth.users` to dependent tables.
