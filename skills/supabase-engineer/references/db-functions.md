# Database Functions & Triggers

## Function template
```sql
create or replace function public.my_function(param_id bigint)
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result json;
begin
  select json_build_object('id', id, 'name', name)
  into result
  from public.my_table
  where id = my_function.param_id;

  return result;
end;
$$;
```

## Trigger template
```sql
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_update_timestamp
before update on public.my_table
for each row
execute function public.handle_updated_at();
```

## Rules
- Default to `security invoker`.
- Always set `search_path = ''`.
- Use fully qualified names (`schema.table`).
- Prefer `immutable` or `stable` when possible.
- Treat function `EXECUTE` privileges as part of the API contract; PostgreSQL grants new functions to `PUBLIC` by default.

## Security-definer RPCs

Use `security definer` only when the function intentionally needs elevated privileges. Treat it as a new trust boundary.

Prefer a non-exposed schema for privileged helpers. Revoke `EXECUTE` from `PUBLIC`, `anon`, and `authenticated`, then grant only the intended caller role or wrapper. Never add `security definer` merely to make a permission error disappear.

For RPC functions exposed to authenticated users:

- validate `auth.uid()` whenever caller identity matters;
- verify session/context claims when the operation depends on active session, active context, role, scope/tenant, status, or profile/readiness state;
- derive role/scope/tenant from trusted database/JWT state, not from request-body arguments alone;
- never derive authorization from user-editable `user_metadata`; account for stale `app_metadata` claims;
- keep dynamic table/function/column names out of caller-controlled arguments unless mapped through a strict allowlist;
- write required same-transaction audit/security evidence when the operation contract requires it;
- test both allow and deny paths with publishable key + user JWT when the RPC is reachable through PostgREST.
- run database advisors or the project's equivalent after changing privileged functions.
