# Supabase Integration

- Prefer the official SDK for full features and RLS compatibility.
- **Never** expose `service_role` to clients; it bypasses RLS.
- User-facing flows: use anon key + user JWT so RLS stays effective.
- Admin/service flows: restrict access, audit every call, consider separate worker.
- Ordinary user reads/writes should not use service-role clients unless a documented internal/admin/secret boundary requires it; prefer user JWT/RLS or a security-checked RPC.
- For auth/RBAC-sensitive routes, test direct Supabase behavior with publishable key + user JWT when RLS/RPC is the production permission boundary.
