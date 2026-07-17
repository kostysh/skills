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

## SQLSTATE classification

Do not manually assign a class `40` SQLSTATE to an application outcome. Domain conflicts, validation or authorization failures, optimistic-version conflicts, and idempotency conflicts are not transaction rollbacks. This prohibition includes:

- `RAISE SQLSTATE '40001'`;
- `RAISE ... USING ERRCODE = '40001'` or another `40xxx` code;
- named conditions such as `serialization_failure`, `transaction_rollback`, and `deadlock_detected`.

Drivers and retry policies may interpret class `40` as a request to retry the whole transaction. Hiding a domain result behind that class therefore creates a false retry signal.

Use the project's documented non-`40xxx` application taxonomy instead. The project may use `P0001` or another application SQLSTATE; do not impose one universal code. Keep machine-readable messages and details stable only when the owning project defines that contract.

Preserve genuine PostgreSQL errors. A bare `RAISE;` in an exception handler may rethrow the original database-generated SQLSTATE unchanged. Do not translate a real `40001` or `40P01` into a domain error.

```sql
-- Forbidden: a domain conflict is not a serialization failure.
raise sqlstate '40001' using message = 'draft_version_conflict';

-- Forbidden for the same reason.
raise serialization_failure using message = 'draft_version_conflict';

-- Allowed: preserve the original database-generated SQLSTATE.
exception
  when others then
    raise;
```

When reviewing migrations, determine the effective function behavior rather than judging one historical file in isolation. Follow the `CREATE OR REPLACE` history and public/private call chain; use clean replay and `pg_get_functiondef(...)` when the conclusion depends on the deployed definition. Keep deployed migrations append-only. Report a historical mismatch as a finding, and leave any corrective migration to the owning project instead of introducing an automatic wrapper or retry framework.

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
