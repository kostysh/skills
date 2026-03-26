# Webhooks

## Signature verification
```ts
import crypto from "crypto";

function verifySupabaseSignature(
  payload: Buffer,
  signature: string,
  timestamp: string
): boolean {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET!;

  // Reject old timestamps (replay protection)
  const ageMs = Date.now() - Number(timestamp) * 1000;
  if (ageMs > 5 * 60 * 1000) return false;

  const signedPayload = `${timestamp}.${payload.toString()}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

## Idempotency
- Store processed event IDs to prevent duplicate handling.
- Treat webhook handlers as at-least-once.

## Local testing
- Use ngrok or similar to expose localhost.
- Replay events with `curl` for validation.
