# Architecture Variants

## Monolith (<10K DAU)
```
my-app/
|-- src/
|   |-- supabase/
|   |   |-- client.ts
|   |   |-- types.ts
|   |   `-- middleware.ts
|   `-- routes/api/supabase.ts
`-- tests/supabase.test.ts
```

## Service Layer (10K-100K DAU)
```
my-app/
|-- src/
|   |-- services/supabase/
|   |   |-- client.ts
|   |   |-- service.ts
|   |   `-- repository.ts
|   |-- controllers/
|   |-- queue/supabase-processor.ts
|   `-- middleware/
`-- config/supabase/
```

## Microservice (100K+ DAU)
```
supabase-service/
|-- src/
|   |-- api/grpc/ & rest/
|   |-- domain/entities & services/
|   |-- infrastructure/supabase/
|   `-- queue/ & cache/
|-- k8s/
|   |-- deployment.yaml
|   `-- hpa.yaml
`-- config/
```
