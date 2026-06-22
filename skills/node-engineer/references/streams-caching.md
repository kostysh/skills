# Streams, Backpressure, and Caching

## Activation triggers

Use this reference when prompts mention:
- CSV
- ETL or ingestion pipelines
- large files
- streaming transforms
- backpressure
- repeated async lookups or hot keys

## Preferred stream composition

Prefer `await pipeline(...)` from `node:stream/promises` over chained `.pipe()` when composing streams.

Why:
- error propagation is cleaner;
- resource shutdown is easier to reason about;
- backpressure is handled correctly through the pipeline.

## Prefer explicit async-generator transforms

For non-trivial transforms, use `async function*` instead of hiding logic inside opaque `Transform` subclasses unless the repo already standardizes those.

Minimal pattern:

```ts
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";

async function* filterNonEmpty(source: AsyncIterable<Buffer>) {
  for await (const chunk of source) {
    const text = chunk.toString("utf8");
    if (text.trim()) {
      yield text;
    }
  }
}

await pipeline(
  createReadStream("input.txt"),
  filterNonEmpty,
  createWriteStream("output.txt")
);
```

## Manual backpressure rule

If you are writing to a `Writable` manually:
- check the return value of `write()`;
- when it returns `false`, wait for `'drain'` before continuing.

```ts
import { once } from "node:events";

async function writeAll(writable: NodeJS.WritableStream, chunks: string[]) {
  for (const chunk of chunks) {
    if (!writable.write(chunk)) {
      await once(writable, "drain");
    }
  }
}
```

## Cache selection quick guide

Use the first sufficient cache surface. If repeated work is not proven hot, do not add a cache. If a cache is needed, use the repo's existing cache abstraction first. If there is none:

| Need | Default choice | Why |
|------|----------------|-----|
| Bounded in-memory reuse in one process | `lru-cache` | Simple local cache with size and TTL limits |
| Deduplicate concurrent async requests by key | `async-cache-dedupe` | One in-flight request per key plus stale/revalidate support |
| Distributed cache across instances | Existing infra cache / Redis-backed abstraction | Keeps behavior explicit across processes |

## ETL pattern

For ETL-style tasks, prefer this structure:
1. `createReadStream(...)`
2. one or more `async function*` transforms
3. optional cached enrichment lookup
4. `await pipeline(...)` to the sink

## Cache safety rules

- Do not cache sensitive user data without explicit scoping and invalidation.
- Do not add an unbounded `Map` as a quick fix for performance.
- If staleness is allowed, define that contract explicitly instead of leaving it implicit.
- If repeated work is not actually hot, do not add a cache just because one might help.
