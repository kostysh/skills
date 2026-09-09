# Client Setup

Preserve the repository's framework adapter and package versions. The examples below illustrate current Next.js App Router boundaries; load the relevant framework skill for framework lifecycle details.

## Browser client

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

## Server client

Create it per request with the current `@supabase/ssr` cookie adapter. Use `getAll`/`setAll`; do not restore deprecated `get`/`set`/`remove`. Server Components cannot reliably write refreshed cookies, so the framework's request proxy/middleware boundary must perform refresh and response writes.

## Next.js Proxy boundary

- Use the current Next.js `proxy.ts` convention when supported by the installed framework version; do not blindly copy an older `middleware.ts` example.
- In the proxy, call `auth.getClaims()` to verify identity and refresh when needed.
- Copy refreshed cookies to both the request and response.
- In `@supabase/ssr` >=0.10, apply cache headers supplied as the second `setAll` argument so refreshed-token responses cannot be shared through a CDN. In 0.12.7 those headers are sent only on the first server-client callback; preserve them across later calls. For an older compatible SSR package, inspect its actual callback signature and preserve the project's explicit response-cache protection; do not silently upgrade or assume a second argument exists.
- Exclude static assets and routes that do not access Supabase using the project matcher convention.

## Request-scoped user client

Use the publishable key plus the incoming user's JWT. Construct the client for the request and never mutate a shared singleton's authorization header.

## Elevated backend client

```ts
import { createClient } from "@supabase/supabase-js";

export const adminSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
```

Secret keys are preferred for controlled backends; legacy `service_role` keys remain compatibility inputs. These credentials supply elevated access when the request has no overriding user access token. A signed-in user JWT makes that request run under the user's RLS policies even when the client was initialized with an elevated key. Inspect effective outgoing identity; isolate the admin client from user sign-in/session mutation. New opaque publishable/secret keys belong in the `apikey` channel and are not user JWTs for `Authorization: Bearer`.

## Verification

- Verify public, authenticated, expired/invalid, and elevated paths separately.
- Check cookies and cache headers on an actual SSR response when claiming refresh safety.
- A successful client constructor or mocked Auth response does not prove identity, cookie propagation, or RLS behavior.
