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

## Verification Questions

- Does the user-scoped path actually use a user JWT, not a service client?
- Does every privileged path document why bypass is allowed?
- Is there a policy for each relevant operation, not just `select`?
- Can ownership, foreign keys, or helper functions accidentally widen access?

## Safe Patterns

Usually good signs:

- explicit RLS enablement
- policy coverage per operation
- request-scoped user clients
- narrow, documented service-role islands
- append-only migrations for grants and policies
