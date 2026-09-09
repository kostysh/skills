# Migrations & CLI

## Discover before changing

1. Inspect `supabase/config.toml`, `supabase/schemas`, `supabase/migrations`, repository instructions, and CI/deploy workflows.
2. Run `supabase --version` and discover relevant commands with `supabase <group> <command> --help`.
3. Preserve the selected migration model unless the user explicitly accepts a migration-strategy change.

## Declarative schema model

- Edit the declared state under the project's configured schema paths, commonly `supabase/schemas/*.sql`.
- Select the generation command from the installed CLI's help, not merely from the existence of `supabase/schemas`. Keep the required local database running and verify which inputs the selected engine actually compares.
- In CLI `2.117.0`, ordinary `db diff` compares migration/shadow and database state; it is not proof that a change made only to a declarative file was read. The existing declarative workflow uses `supabase db schema declarative sync --no-apply --name <name>` to generate a reviewed migration without applying it. This command is experimental: use it only within the accepted declarative workflow, verify installed help, and do not silently opt a project into it.
- For an existing CLI `2.39.2` declarative project, the version's `supabase db diff --local -f <name>` path reads configured schema paths. Preserve that verified legacy branch instead of upgrading the CLI or rewriting the migration model. Other versions need their own installed-help/source check.
- When adopting an already accepted declarative model on an existing database, establish the complete platform/schema baseline and inspect a no-change diff before the task delta. Do not replace it with a table-only export that omits grants, extensions, policies, or other existing objects.
- Review the generated incremental migration; do not accept destructive or unrelated diff output blindly.
- Use explicit versioned migrations for changes the selected diff engine does not capture reliably, including relevant DML, grants, view attributes/ownership, policy alterations, publications, comments, partitions, and other documented caveats.

## Imperative migration model

- Create a migration with the current CLI command, commonly `supabase migration new <name>`.
- Edit the generated migration and keep it append-only once deployed.
- Do not replace an established imperative workflow with declarative schemas merely because both directories exist.

## Local verification

- Use the installed CLI's explicit local target, such as `supabase migration up --local`, to apply pending local migrations without resetting data.
- `supabase db reset --local` is destructive. Verify that existing authorization covers resetting this exact disposable database; ask only when that permission or target is missing.
- Before any reset, read back the intended delta and preservation of pre-existing rows and objects. Then replay from an authorized clean local baseline, run the applicable database checks, regenerate types where the project expects them, and inspect migration status. A clean replay cannot prove preservation of the original data.
- Deploy through the repository's reviewed CI/CD path; do not apply ad hoc cloud MCP writes.

## Completion boundary

A migration file or clean diff is not deployment or data-safety evidence. Report separately whether the change was generated, replayed locally, tested at the direct Data API/RLS boundary, deployed, and read back.
