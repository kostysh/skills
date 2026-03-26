# Vector Embeddings (pgvector)

## Setup
```sql
create extension if not exists vector;

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(1536)
);

create index on public.documents
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
```

## Similarity search RPC
```sql
create or replace function public.match_documents(
  query_embedding vector(1536),
  match_threshold float default 0.78,
  match_count int default 10
)
returns table (id uuid, content text, similarity float)
language sql stable
as $$
  select
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from public.documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

## Usage
```ts
const { data } = await supabase.rpc("match_documents", {
  query_embedding: embedding,
  match_threshold: 0.78,
  match_count: 10,
});
```
