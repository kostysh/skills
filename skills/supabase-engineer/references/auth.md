# Auth

## Email/password
```ts
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password123",
  options: { data: { full_name: "John Doe" } },
});

// Sign in
const { data: signInData, error: signInError } =
  await supabase.auth.signInWithPassword({
    email: "user@example.com",
    password: "password123",
  });

// Sign out
await supabase.auth.signOut();
```

## Current user
```ts
// Server-side validation
const { data: { user } } = await supabase.auth.getUser();

// Client-only (no JWT validation)
const { data: { session } } = await supabase.auth.getSession();
```

## OAuth
```ts
// Start OAuth
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${origin}/auth/callback` },
});

// Callback handler
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
```

## Protected routes (server)
```ts
export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <Dashboard user={user} />;
}
```

## Admin operations (server-only)
Use `supabase.auth.admin.*` only with the service role key on the server.

## Auth data model rules
- Do not expose `auth.users` via API; create a `public.profiles` table.
- Use foreign keys to `auth.users(id)` and `on delete cascade` where appropriate.
