# Privileges and Permission Model

RLS is not a substitute for privilege design. Treat grants and policies as two layers:

1. privileges decide which operations a role may attempt;
2. RLS decides which rows are visible or writable for allowed operations.

## Critical rules
- Revoke broad default access from `public` where the schema should not be world-readable.
- Grant only the minimum table, sequence, and schema privileges required by each application role.
- Keep read, write, and admin capabilities separated; do not collapse everything into one role.
- Document where `service_role` or other bypass-RLS access is allowed and why.
- Use service-role credentials for internal/admin/secret-bearing boundaries, not ordinary user-scoped reads or mutations that should be authorized by user JWT, RLS, or security-checked RPC.

## Minimal grant pattern

```sql
revoke all on schema public from public;
revoke all on all tables in schema public from public;

create role app_readonly nologin;
grant usage on schema public to app_readonly;
grant select on public.products, public.categories to app_readonly;

create role app_writer nologin;
grant usage on schema public to app_writer;
grant select, insert, update on public.orders to app_writer;
grant usage on sequence public.orders_id_seq to app_writer;
```

## Review checklist
- Which roles can `select`, `insert`, `update`, `delete`, `execute`, and use sequences?
- Does any role have `all privileges` where a narrower grant would work?
- Are privileged database functions or jobs using dedicated roles instead of reusing the application role?
- Are bypass paths (`service_role`, background jobs, admin tools) isolated from normal request handling?
- Are ordinary user reads/writes prevented from silently taking a service-role path?
- Do required audit or fallback tables have append-only behavior, narrow privileges, and no inappropriate user read/update/delete grants?
- Are schema-level and sequence privileges granted explicitly where required, not accidentally through broad grants?

## Common mistakes
- Assuming RLS makes broad table grants harmless.
- Granting write access on all tables to simplify migrations or local development.
- Forgetting sequence privileges for insert paths, then compensating with broader grants than necessary.
- Exposing views or functions that run with elevated privileges without documenting the trust boundary.
- Treating an audit/security event name as enough without verifying durable insert permissions, fail-closed behavior where required, and append-only constraints.
