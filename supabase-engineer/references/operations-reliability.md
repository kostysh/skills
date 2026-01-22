# Reliability, Rate Limits, Performance

## Retry with exponential backoff + jitter
```ts
async function withBackoff<T>(
  operation: () => Promise<T>,
  config = { maxRetries: 5, baseDelayMs: 1000, maxDelayMs: 32000, jitterMs: 500 }
): Promise<T> {
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === config.maxRetries) throw error;
      const status = error?.status ?? error?.response?.status;
      if (status && status !== 429 && (status < 500 || status >= 600)) throw error;

      const exp = config.baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * config.jitterMs;
      const delay = Math.min(exp + jitter, config.maxDelayMs);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}
```

## Idempotency for writes
- Generate deterministic keys from inputs.
- Store keys server-side to dedupe retried requests.

## Circuit breaker + bulkhead
- Wrap Supabase calls with a circuit breaker.
- Separate queues by priority to avoid cascading failures.
- Route permanent failures to a dead-letter queue (DLQ).

## Rate limit handling
- Inspect `429` responses and `Retry-After` headers.
- Queue bursts to avoid thundering herds.

## Performance basics
- Cache hot reads (LRU/Redis) with TTL.
- Batch related reads (DataLoader pattern).
- Select only needed columns; index filtered fields.
- Use connection pooling (pgBouncer) for high-traffic apps.
