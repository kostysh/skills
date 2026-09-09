# Supabase Integration

Use `supabase-engineer` to establish the accepted SDK/direct-HTTP path, credential boundary, RLS/RPC behavior, and direct data-path evidence. This reference owns only the Hono integration:

- for a Node target, record installed adapter, Supabase SDK and Node engines together; checked 2026-09-09, `@hono/node-server` 2.1.1 requires Node >=20 while `supabase-js` 2.116.0 requires Node >=22. The combined pair needs the higher floor. Preserve a compatible older SDK/adapter/runtime set; do not upgrade implicitly or apply a Node engine requirement as a Workers runtime test
- pass the accepted user/service identity to the selected Supabase boundary without inventing a stronger credential;
- keep secrets and service credentials inside the project-approved server/runtime boundary;
- map Supabase failures to the accepted Hono error contract without leaking internal details;
- when RLS/RPC is the production permission boundary, require the data owner’s direct-boundary evidence in addition to Hono `app.request()` coverage.
