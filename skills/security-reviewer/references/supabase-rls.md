# Supabase RLS and Privilege Review

Use this file when reviewing SQL migrations, policies, RPC, storage policies, or server code that crosses Supabase trust boundaries.

## API Path Vs Direct Data Path

For auth/RBAC/RLS changes, inspect both layers:

- HTTP/API route admission and service logic;
- direct Supabase/PostgREST/RPC/RLS/storage behavior with the caller identity that production uses.

Do not treat a secured handler as proof that the direct data path is safe. If a user JWT can still reach stale, mismatched, or over-broad RLS/RPC/storage behavior, report the direct-path weakness.

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
- RPC or helper functions trust request-body role/scope/context values instead of deriving caller identity and authorization from trusted database/JWT state
- RLS helpers and RPC functions omit freshness checks that the service layer relies on for the same protected capability

### Grant and Role Problems

Flag when:

- broad grants replace operation-specific grants
- default `public` privileges stay wider than intended
- privileged roles are reused for ordinary request paths

### Stale Claim or Context Drift

When permissions depend on session or active context state, compare the service-layer checks with RLS helper/RPC/storage-policy checks.

Flag when direct data access accepts mismatched or stale:

- session id;
- session version;
- active context id;
- active context version;
- active role;
- active scope or tenant;
- account, session, or role status;
- profile/readiness state when permissions require a completed profile or similar gate.

### Service-role Misuse

Flag when ordinary user-scoped reads or writes use service-role credentials and rely only on application code for authorization.

Do not collapse all privileged reads into the same risk. Internal/admin/secret-bearing boundaries may require service-role access, but they need a documented trust boundary, narrow caller path, and audit/authorization checks separate from user-scoped mutations.

### Audit and Security Event Capture

If a required audit/security event is part of the authorization or mutation contract, verify the capture path, not just the event name.

Flag when:

- critical same-transaction events can fail silently while the protected operation succeeds;
- lower-criticality but required events have neither a durable fallback nor an explicitly accepted fail-closed design;
- append-only audit or fallback tables allow inappropriate user reads, updates, deletes, or broad grants;
- tests do not cover capture failure for required fail-closed or fallback behavior.

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
- Do RLS helpers/RPC/storage policies enforce the same session/context/status/readiness gates as the API path when they protect the same capability?
- Can ownership, foreign keys, or helper functions accidentally widen access?
- Are required audit/security events durably captured with the promised failure behavior?
- Is the risky SQL or grant still current, or was it narrowed by a later migration in the same repo?

## Safe Patterns

Usually good signs:

- explicit RLS enablement
- policy coverage per operation
- request-scoped user clients
- narrow, documented service-role islands
- append-only migrations for grants and policies
