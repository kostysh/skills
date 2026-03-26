# Supabase Integration

- Prefer the official SDK for full features and RLS compatibility.
- **Never** expose `service_role` to clients; it bypasses RLS.
- User-facing flows: use anon key + user JWT so RLS stays effective.
- Admin/service flows: restrict access, audit every call, consider separate worker.
