# Streams, Framing, Backpressure, and Local Caching

## Establish the data contract

Before implementing a transform, identify:

- byte encoding or binary format;
- record framing: newline, CSV grammar, length prefix, protocol frame, or no records;
- maximum record and buffer sizes;
- error, cancellation, partial-final-record, and output-commit behavior;
- whether the source and sink are classic Node streams, Web Streams, or generic iterables.

A stream chunk is an arbitrary transport unit. It is not necessarily a complete UTF-8 character, line, CSV row, JSON value, or application record.

## Prefer `pipeline()`

Prefer awaited `pipeline(...)` from `node:stream/promises` for multi-stage work. It propagates stream errors, manages backpressure, closes pipeline participants, and accepts an `AbortSignal`.

Do not use a happy-path `pipeline()` result as proof that application-level framing or output atomicity is correct. For an HTTP response, inspect the framework/response failure contract because pipeline failure may destroy the socket before an error body can be sent.

## UTF-8-safe newline framing

For newline-delimited UTF-8 text, preserve decoder and record state across chunks. This example deliberately normalizes non-empty records to `\n`; it is not a CSV parser.

```ts
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { StringDecoder } from "node:string_decoder";

async function* nonEmptyLines(
  source: AsyncIterable<Buffer>,
  { signal }: { signal: AbortSignal },
) {
  const decoder = new StringDecoder("utf8");
  let pending = "";

  for await (const chunk of source) {
    signal.throwIfAborted();
    pending += decoder.write(chunk);
    const records = pending.split(/\r?\n/);
    pending = records.pop() ?? "";

    for (const record of records) {
      if (record.trim()) yield `${record}\n`;
    }
  }

  pending += decoder.end();
  if (pending.trim()) yield `${pending}\n`;
}

const controller = new AbortController();

await pipeline(
  createReadStream("input.txt"),
  nonEmptyLines,
  createWriteStream("output.txt"),
  { signal: controller.signal },
);
```

For CSV, JSON streaming, or another grammar, use the repository's established streaming parser or a version-compatible parser selected with explicit dependency authority. Splitting on newlines is not valid CSV framing when quoted fields may contain newlines.

## Cancellation and failure semantics

- Pass the pipeline `signal` into long-running async lookups and transforms; checking only between chunks cannot cancel a stuck external operation.
- Decide whether a failed pipeline may leave a partial sink. Use a temporary/transactional destination when partial output is unacceptable.
- Ensure source, transform, lookup, and sink failures reject the awaited pipeline and reach the caller.
- Test abort while a transform is waiting, not only before the pipeline starts.
- Define whether a final unterminated record is accepted, rejected, or emitted; do not let the example decide product behavior silently.

## Manual writes

If manual writes are genuinely simpler than a pipeline:

- check the return value of `write()`;
- await `'drain'` when it returns `false`;
- handle `'error'`, premature `'close'`, cancellation, and final completion;
- do not call the operation complete until the writable has finished according to its contract.

Prefer `pipeline()` when these responsibilities would otherwise be recreated ad hoc.

## ETL shape

A safe ETL flow normally separates:

1. byte source;
2. encoding and record framing;
3. record transform and validation;
4. optional enrichment with bounded concurrency;
5. explicitly authorized local/distributed cache;
6. output sink with defined partial-write semantics;
7. awaited completion, cancellation, and failure reporting.

Do not hide unbounded concurrency or one remote lookup per record inside an async generator. Measure the bottleneck before adding parallelism or caching.

## Cache boundary

Use the repository's existing cache abstraction first. If no cache exists, establish the actual need, key scope, maximum size, TTL/staleness, invalidation, sensitive-data handling, process topology, and failure behavior before selecting a package.

- A process-local cache is per process and disappears on restart; it cannot satisfy cross-instance consistency.
- An unbounded `Map` is not an acceptable production cache default.
- In-flight request deduplication, value caching, and distributed caching are different contracts.
- Distributed cache topology, durability, consistency, and ownership belong to the accepted architecture/data boundary, not to this skill alone.
- Do not name or install a cache package until repository dependencies and authorization are known.

## Verification

For text or record transforms, exercise at least:

- a multibyte character split across byte chunks;
- delimiter or CRLF split across chunks;
- empty records and a final unterminated record;
- oversized or invalid input according to the accepted contract;
- source, transform, and sink failures;
- abort during pending work;
- backpressure or a deliberately slow sink;
- partial-output behavior.

Report the framing and output contract, exact cases run, and any parser, sink, or external lookup boundary not exercised.
