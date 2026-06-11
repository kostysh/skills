# Supabase RLS and Privilege Review

Use this file when reviewing SQL migrations, policies, RPC, storage policies, or server code that crosses Supabase trust boundaries.

## Review Matrix

For each table or bucket, check:

- who can `select`
- who can `insert`
- who can `update`
- who can `delete`
- whether RLS is enabled
- whether RLS is forced where owner bypass matters

If any operation is implicitly trusted by application code alone, treat that as suspicious.

## High-Signal Findings

### Missing or Incomplete RLS

Flag when:

- public tables lack RLS
- only some operations have policies
- tenant isolation depends on app-side filtering alone

### Privileged Function or RPC Drift

Flag when:

- `SECURITY DEFINER` functions run with broad privileges and accept attacker-controlled identifiers
- RPC endpoints bypass RLS without narrow checks
- service-role usage is exposed to code paths that should be user-scoped

### Grant and Role Problems

Flag when:

- broad grants replace operation-specific grants
- default `public` privileges stay wider than intended
- privileged roles are reused for ordinary request paths

## PostgREST And Supabase REST Query Construction

When server code uses Supabase REST/PostgREST directly, review it as part of the database security boundary.

Flag when:

- request-controlled values are interpolated into `/rest/v1` query strings;
- filter values are assembled as `eq.${value}` without approved encoding;
- `select`, `or`, `order`, `limit`, or table names can be influenced by request data;
- service-role PostgREST calls are reachable from user request paths without narrow validation and ownership/authorization checks.

Safe patterns:

- official Supabase query builder with constrained values;
- a single typed helper using `URLSearchParams` for filters;
- enum/UUID/canonical schemas before data access;
- table/column/select names as code-owned literals, not request data.

## Detection Hints

- search migrations and SQL for `enable row level security`, `force row level security`, `create policy`, `grant`, `revoke`, and `security definer`
- inspect server code for service-role clients, admin clients, and RPC calls that cross user-scoped trust boundaries
- compare application assumptions with actual policy coverage per operation

## Verification Questions

- Does the user-scoped path actually use a user JWT, not a service client?
- Does every privileged path document why bypass is allowed?
- Is there a policy for each relevant operation, not just `select`?
- Can ownership, foreign keys, or helper functions accidentally widen access?
- Is the risky SQL or grant still current, or was it narrowed by a later migration in the same repo?

## Safe Patterns

Usually good signs:

- explicit RLS enablement
- policy coverage per operation
- request-scoped user clients
- narrow, documented service-role islands
- append-only migrations for grants and policies
