# Storage

## Upload
```ts
const { data, error } = await supabase.storage
  .from("avatars")
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: "3600",
    upsert: true,
  });
```

## Public URL
```ts
const { data: { publicUrl } } = supabase.storage
  .from("avatars")
  .getPublicUrl("path/to/file.png");
```

## Signed URL (private buckets)
```ts
const { data: { signedUrl } } = await supabase.storage
  .from("private-docs")
  .createSignedUrl("path/to/file.pdf", 3600);
```

## Delete + list
```ts
await supabase.storage.from("avatars").remove(["path/to/file.png"]);

const { data: files } = await supabase.storage
  .from("avatars")
  .list(userId, { limit: 100 });
```

## Rules
- Apply RLS on `storage.objects` (see `rls.md`).
- Use private buckets + signed URLs for sensitive content.
- Validate content type and size on upload.
