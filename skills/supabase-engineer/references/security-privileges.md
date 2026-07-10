# Data API Grants and Privileges

Grants and RLS are separate layers:

1. schema/table/sequence/function privileges decide whether a Postgres role may attempt an operation;
2. RLS decides which rows an allowed `anon` or `authenticated` operation can access.

New and existing projects can have different default privileges. Inspect actual grants and Data API settings; do not assume a table becomes reachable when it is created.

## Data API grant pattern

Grant only operations used by the application after RLS and policies are defined:

```sql
grant usage on schema public to authenticated;
grant select, insert, update on table public.orders to authenticated;
grant select on table public.products to anon, authenticated;
grant usage, select on sequence public.orders_id_seq to authenticated;
```

Do not grant `delete` merely because CRUD is convenient. Do not restore broad default privileges to fix one 42501 error.

## Custom roles

Creating `app_readonly` or `app_writer` does not make PostgREST use them. Use custom roles only when the authenticator/JWT role-switch contract, inheritance, grants, and connection path are explicitly designed and verified. For normal Supabase Auth/Data API traffic, build the matrix around the actual `anon` and `authenticated` roles.

## Functions and elevated access

- Revoke default function `EXECUTE` from `PUBLIC` and grant only the intended caller roles.
- Secret and legacy `service_role` keys map to an elevated `BYPASSRLS` path; isolate and document them.
- Keep elevated jobs/admin tools out of ordinary request handling.
- Required audit/history writes must have narrow append-only privileges and share the mutation transaction when the contract is fail-closed.

## Verification matrix

For each exposed table, sequence, view, and function, record intended operations for `anon`, `authenticated`, and elevated callers. Verify:

- actual privileges from catalog inspection;
- direct publishable-key requests without and with representative user JWTs;
- positive and negative RLS cases;
- absence of stale broad grants and unintended function execution;
- elevated bypass only at the documented internal boundary.

A role definition or GRANT statement is not proof that PostgREST assumes that role or that RLS restricts rows correctly.
