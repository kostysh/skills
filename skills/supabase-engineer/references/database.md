# Database Operations

The snippets illustrate operations on an already accepted schema and client boundary. Handle returned SDK errors before consuming data; propagation below is internal and must use the project's safe error mapping at a public boundary. An empty successful result is different from a failed query or a denied operation.

## CRUD
```ts
// Create
const { data: created, error: createError } = await supabase
  .from("posts")
  .insert({ title: "Hello", content: "World" })
  .select()
  .single();
if (createError) throw createError;
if (!created) throw new Error("Insert returned no row");

// Read + filter
const { data: posts, error: readError } = await supabase
  .from("posts")
  .select("id, title, author:profiles(name)")
  .eq("status", "published")
  .order("created_at", { ascending: false })
  .limit(10);
if (readError) throw readError;
if (posts === null) throw new Error("Read returned no result");

// Update
const { data: updated, error: updateError } = await supabase
  .from("posts")
  .update({ title: "Updated" })
  .eq("id", postId)
  .select()
  .single();
if (updateError) throw updateError;
if (!updated) throw new Error("Update returned no row");

// Delete
const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId);
if (deleteError) throw deleteError;

// Upsert
const { data: upserted, error: upsertError } = await supabase
  .from("posts")
  .upsert({ id: postId, title: "New or Updated" })
  .select()
  .single();
if (upsertError) throw upsertError;
if (!upserted) throw new Error("Upsert returned no row");
```

## Single vs maybeSingle
- Use `.single()` when you expect exactly 1 row.
- Use `.maybeSingle()` when 0 or 1 row is valid.
- Check `error` first. A successful `maybeSingle()` can have `data: null`; do not dereference it or treat an error as that valid absence. Mutations without returned rows do not prove a particular row changed; request an appropriate returning result or perform the required readback when that is the contract.

## Pagination (cursor)
Use the same unique total order in the cursor, comparison and `ORDER BY`. A `created_at > cursor` filter loses rows when timestamps tie at a page boundary. For an accepted `(created_at, numeric id)` order, this example uses a cursor copied from the last successful row:
```ts
let query = supabase
  .from("posts")
  .select("id, created_at, title")
  .order("created_at", { ascending: true })
  .order("id", { ascending: true })
  .limit(50);

if (cursor) {
  // Validate any externally supplied cursor before embedding raw PostgREST syntax.
  // Preserve timestamp precision instead of round-tripping through JS Date.
  const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!timestamp.test(cursor.created_at) || !Number.isSafeInteger(cursor.id)) {
    throw new Error("Invalid cursor");
  }
  query = query.or(
    `created_at.gt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.gt.${cursor.id})`
  );
}
const { data: page, error: pageError } = await query;
if (pageError) throw pageError;
if (page === null) throw new Error("Page returned no result");
// Advance only after success, from page.at(-1); an empty page ends this traversal.
```

Use the actual unique key/type and accepted sort direction for another schema; do not silently change the product order. A typed RPC with a tuple predicate is an alternative when the existing data boundary calls for it. Keyset ordering is not a snapshot guarantee under concurrent updates: preserve the accepted consistency contract. Verify the complete ID sequence with tied timestamps and multiple pages; a later page failure must not become a complete successful list.

## Count for pagination
```ts
const { count, error: countError } = await supabase
  .from("posts")
  .select("id", { count: "exact", head: true });
if (countError) throw countError;
if (count === null) throw new Error("Exact count unavailable");
```

## RPC (SQL function)
```ts
const { data, error } = await supabase.rpc("match_documents", {
  query_embedding: embedding,
  match_threshold: 0.78,
  match_count: 10,
});
if (error) throw error;
if (data === null) throw new Error("RPC returned no result");
```

## Query best practices
- Select only needed columns; avoid `select('*')`.
- Add indexes for frequent filters and RLS checks.
- Prefer cursor pagination over deep `offset`.
