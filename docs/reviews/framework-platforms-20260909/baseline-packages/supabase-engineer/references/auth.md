# Auth

Check the installed Auth/SSR packages and current official guidance before copying framework examples.

## Identity and session methods

| Method | Use | Do not claim |
| --- | --- | --- |
| `auth.getClaims()` | Verify JWT identity for protected pages and data; asymmetric projects can validate against cached JWKS | It does not fetch the freshest user record or prove server-side logout/revocation beyond token validity |
| `auth.getUser()` | Fetch a current user record from the Auth server when freshness or session-state confirmation matters | It is not the universal fast path for every protected render |
| `auth.getSession()` | Read raw access/refresh tokens and expiry when they must be forwarded or inspected | The embedded user object is not authorization evidence when storage is client-controlled |

## Email/password

```ts
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name: fullName } },
});

const { data: signInData, error: signInError } =
  await supabase.auth.signInWithPassword({ email, password });
```

Handle returned `error` values and preserve intentional anti-enumeration behavior without masking unrelated upstream failures.

## OAuth and PKCE

- Use the framework's current SSR/PKCE callback pattern and exact allow-listed redirect URL.
- Validate callback errors and the authorization code before exchange.
- Do not redirect to a protected destination as if authentication succeeded when exchange fails.

## Authorization claims

- Never authorize from `user_metadata` or `raw_user_meta_data`; users can modify it.
- Use trusted database state or `app_metadata`/custom claims populated by a trusted path.
- JWT claims can remain stale until refresh. For revocable or high-risk permissions, validate current session/account/context state at the database or Auth boundary.
- The JWT `role` claim normally selects the Postgres role; do not repurpose it as an application admin flag.

## Admin operations

Use `supabase.auth.admin.*` only from a controlled backend with a secret or legacy `service_role` key. Isolate the client, never expose it to public code, and verify authorization before each admin operation.

## Auth data model

- Do not expose `auth.users` through the Data API; use a public application profile table when needed.
- Add foreign keys and deletion behavior only after confirming the product retention and deletion contract.
- Auth success, a JWT, or a profile row does not by itself prove application readiness or authorization.
