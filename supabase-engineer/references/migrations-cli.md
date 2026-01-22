# Migrations & CLI

## Local dev commands
```bash
supabase start
supabase stop
supabase status
```

## Migration workflow
```bash
# Check local status
supabase status

# Apply migrations (preserves data)
supabase migration up

# Reset database (destroys data)
supabase db reset

# Generate migration from schema diff
supabase stop
supabase db diff -f migration_name
```

## Type generation
```bash
supabase gen types typescript --local > src/types/database.ts
```

## Schema management rules
- Edit `supabase/schemas/*.sql` (not `supabase/migrations/`).
- Generate migrations with `supabase db diff`.
- Keep schema and migrations in version control.

## Not tracked by schema diff (use versioned migrations)
- DML statements (insert/update/delete)
- View ownership and grants
- `security_invoker` on views
- Materialized views
- Comments and partitions
