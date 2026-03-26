# Edge Functions (Deno)

## Basic function
```ts
// supabase/functions/hello/index.ts
Deno.serve(async (req: Request) => {
  const { name } = await req.json();
  return new Response(JSON.stringify({ message: `Hello ${name}!` }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## With Supabase client
```ts
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization") ?? "";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user?.id);

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## Rules
- Use `npm:` prefix for npm packages and `node:` for built-ins.
- Always version external imports.
- Use `Deno.serve()` (not deprecated `serve`).
- For background work: `EdgeRuntime.waitUntil(promise)`.
- File writes are allowed only in `/tmp`.
