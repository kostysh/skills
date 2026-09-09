# Supabase Integration

Use `supabase-engineer` to establish the accepted SDK/direct-HTTP path, credential boundary, RLS/RPC behavior, and direct data-path evidence. This reference owns only the Hono integration:

- pass the accepted user/service identity to the selected Supabase boundary without inventing a stronger credential;
- keep secrets and service credentials inside the project-approved server/runtime boundary;
- map Supabase failures to the accepted Hono error contract without leaking internal details;
- when RLS/RPC is the production permission boundary, require the data owner’s direct-boundary evidence in addition to Hono `app.request()` coverage.
