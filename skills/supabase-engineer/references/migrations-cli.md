# Migrations & CLI

## Discover before changing

1. Inspect `supabase/config.toml`, `supabase/schemas`, `supabase/migrations`, repository instructions, and CI/deploy workflows.
2. Run `supabase --version` and discover relevant commands with `supabase <group> <command> --help`.
3. Preserve the selected migration model unless the user explicitly accepts a migration-strategy change.

## Declarative schema model

- Edit the declared state under the project's configured schema paths, commonly `supabase/schemas/*.sql`.
- Keep the local stack running when generating a local `supabase db diff -f <name>`.
- Review the generated incremental migration; do not accept destructive or unrelated diff output blindly.
- Use explicit versioned migrations for changes the selected diff engine does not capture reliably, including relevant DML, grants, view attributes/ownership, policy alterations, publications, comments, partitions, and other documented caveats.

## Imperative migration model

- Create a migration with the current CLI command, commonly `supabase migration new <name>`.
- Edit the generated migration and keep it append-only once deployed.
- Do not replace an established imperative workflow with declarative schemas merely because both directories exist.

## Local verification

- `supabase migration up` applies pending local migrations without resetting data.
- `supabase db reset` is destructive and requires confirmation that disposable local data is intended.
- Replay from a clean local baseline, run database tests/advisors, regenerate types where the project expects them, and inspect migration status.
- Deploy through the repository's reviewed CI/CD path; do not apply ad hoc cloud MCP writes.

## Completion boundary

A migration file or clean diff is not deployment or data-safety evidence. Report separately whether the change was generated, replayed locally, tested at the direct Data API/RLS boundary, deployed, and read back.
