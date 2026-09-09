# Vector Embeddings (pgvector)

## Establish the vector contract

Read the embedding producer's dimensions and metric, installed pgvector version, corpus size/distribution, filters and accepted recall/latency target. Do not invent an embedding model or migrate an existing index merely because a different index is available. Locate the extension's actual schema and preserve it.

## Setup and exact baseline

This schema example assumes an accepted 1536-dimensional producer and the extension already installed in `extensions`. Substitute the verified dimension/schema consistently in the column, RPC and client input; `1536` is not a default for every model. Extension installation is a separately authorized setup operation, not a side effect of a user query.
```sql
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding extensions.vector(1536)
);
```

Start with exact distance search as a correctness baseline; it may be sufficient for a small or selectively filtered corpus. Apply the accepted grants/RLS and verify calls with the real user identity. Creating this table alone does not authorize public reads or client writes.

## Approximate indexes

- Choose HNSW or IVFFlat only for the measured workload. Match the operator class to the distance metric, and compare retrieval against exact search under the same filters and user access.
- HNSW does not require IVFFlat's training step, but consumes build/query resources and has tuning trade-offs; it is not a mandatory replacement for a working index.
- Build IVFFlat only after loading enough representative data. Select `lists` from the actual corpus and tune query `probes` using measured recall/latency; do not create an empty-table index with an unexplained `lists = 100`.
- Reassess an index when the corpus or filtering changes. Check actual returned IDs/counts and query plans; an index definition or fast query does not prove the accepted recall. Keep any version-dependent scan/tuning settings tied to installed pgvector support.

## Similarity search RPC
```sql
create or replace function public.match_documents(
  query_embedding extensions.vector(1536),
  match_threshold float default 0.78,
  match_count int default 10
)
returns table (id uuid, content text, similarity float)
language sql stable security invoker
set search_path = ''
as $$
  select
    id,
    content,
    1 - (embedding operator(extensions.<=>) query_embedding) as similarity
  from public.documents
  where 1 - (embedding operator(extensions.<=>) query_embedding) > match_threshold
  order by embedding operator(extensions.<=>) query_embedding, id
  limit match_count;
$$;
```

The threshold and `match_count` above are illustrative API values, not a semantic-quality target. Preserve the accepted RPC contract, validate query dimensions and count at its owning boundary, and grant execution only to intended roles. A threshold may legitimately return fewer than `match_count`; distinguish that behavior from an approximate index missing qualifying neighbors.

## Usage
```ts
const { data, error } = await supabase.rpc("match_documents", {
  query_embedding: embedding,
  match_threshold: 0.78,
  match_count: 10,
});
if (error) throw error;
if (data === null) throw new Error("Vector search returned no result");
```

For verification, preserve the corpus/query fixtures and compare ID sets, metric values and ordering with exact search. Report workload size, filters/user scope, index/parameters, actual plans, recall and latency together. Small synthetic recall does not prove semantic quality, large-scale performance or a remote deployment.
