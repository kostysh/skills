# Database Operations

## CRUD
```ts
// Create
const { data: created, error: createError } = await supabase
  .from("posts")
  .insert({ title: "Hello", content: "World" })
  .select()
  .single();

// Read + filter
const { data: posts } = await supabase
  .from("posts")
  .select("id, title, author:profiles(name)")
  .eq("status", "published")
  .order("created_at", { ascending: false })
  .limit(10);

// Update
const { data: updated } = await supabase
  .from("posts")
  .update({ title: "Updated" })
  .eq("id", postId)
  .select()
  .single();

// Delete
await supabase.from("posts").delete().eq("id", postId);

// Upsert
const { data: upserted } = await supabase
  .from("posts")
  .upsert({ id: postId, title: "New or Updated" })
  .select()
  .single();
```

## Single vs maybeSingle
- Use `.single()` when you expect exactly 1 row.
- Use `.maybeSingle()` when 0 or 1 row is valid.

## Pagination (cursor)
Prefer cursor pagination for large datasets.
```ts
const { data: page } = await supabase
  .from("posts")
  .select("id, created_at, title")
  .gt("created_at", cursor)
  .order("created_at", { ascending: true })
  .limit(50);
```

## Count for pagination
```ts
const { count } = await supabase
  .from("posts")
  .select("id", { count: "exact", head: true });
```

## RPC (SQL function)
```ts
const { data } = await supabase.rpc("match_documents", {
  query_embedding: embedding,
  match_threshold: 0.78,
  match_count: 10,
});
```

## Query best practices
- Select only needed columns; avoid `select('*')`.
- Add indexes for frequent filters and RLS checks.
- Prefer cursor pagination over deep `offset`.
