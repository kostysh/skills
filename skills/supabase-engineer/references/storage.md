# Storage

Use the accepted bucket, key and caller identity; example paths and TTLs do not create an authorization or retention policy. Handle SDK errors before reading returned fields and translate failures through the project's public error boundary. Do not expose signed URLs or credentials in diagnostic evidence.

## Upload
```ts
const { data, error } = await supabase.storage
  .from("avatars")
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: "3600",
    upsert: true,
  });
if (error) throw error;
if (!data) throw new Error("Upload returned no object");
```

## Public URL
```ts
const { data: { publicUrl } } = supabase.storage
  .from("avatars")
  .getPublicUrl("path/to/file.png");
```

`getPublicUrl` constructs a URL; it does not check object existence or grant access to a private bucket. A public-read claim requires a real GET and content check under the intended bucket policy.

## Signed URL (private buckets)
```ts
const { data: signed, error: signError } = await supabase.storage
  .from("private-docs")
  .createSignedUrl("path/to/file.pdf", 3600);
if (signError) throw signError;
if (!signed) throw new Error("Signed URL unavailable");
const signedUrl = signed.signedUrl;
```

## Delete + list
```ts
const { error: removeError } = await supabase.storage.from("avatars").remove(["path/to/file.png"]);
if (removeError) throw removeError;

const { data: files, error: listError } = await supabase.storage
  .from("avatars")
  .list(userId, { limit: 100 });
if (listError) throw listError;
if (files === null) throw new Error("Listing unavailable");
```

For complete listings, traverse all required pages in the accepted deterministic order. An empty policy-filtered listing can be valid; it does not prove that no other owner's objects exist. For private downloads, check the SDK result before reading the Blob. For signed access, verify the actual GET and intended lifetime; merely obtaining a string is not download or expiry evidence.

## Rules
- Apply RLS on `storage.objects` (see `rls.md`).
- Use private buckets + signed URLs for sensitive content.
- Validate content type and size on upload.
- Storage upsert requires policies permitting `insert`, `select`, and `update`; verify replacement separately from first upload.
- Treat storage object keys and prefixes as authorization inputs. Derive user/tenant prefixes from trusted identity where possible, and allowlist or canonicalize any caller-provided path segments.
- For user-scoped storage, verify direct storage policy behavior with user JWT and deny stale/wrong session, context, role, scope/tenant, status, or readiness claims when those gates apply.
- Verify list, download/signed URL, upload, replace, move/copy when used, and delete as separate operations. A successful upload mock does not prove object-key authorization or later reads.
