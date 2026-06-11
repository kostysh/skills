# Data Access Injection

Use when reviewing backend code that constructs database, REST, PostgREST, storage, search, RPC, or SDK queries.

## Required Inventory

For backend/database audits, separately inventory:

- SQL migrations, RPC, RLS, and grants;
- server-side data-access code;
- REST/PostgREST query construction;
- SDK filter and query-builder calls;
- service-role and client trust boundaries;
- external identifiers that reach DB or API filters.

Do not claim a database security review is complete if server-side data-access construction was not inspected.

## High-Risk Sinks

- raw SQL strings and dynamic SQL fragments;
- PostgREST URLs such as `/rest/v1/...?...`;
- filter expressions such as `eq.${value}`, `in.(${value})`, `or=...`, and `select=...`;
- manually concatenated query strings;
- SDK filters fed by unconstrained user input;
- query-builder fragments, dynamic column paths, and filter operator strings;
- RPC args that drive dynamic SQL or privileged lookup;
- storage object keys, search expressions, provider filters, and table/function/column names assembled from attacker-controlled values;
- service-role reads or writes reachable from request paths.

## Detection Commands

Use `rg` for discovery only. Adjust roots to the repository under review.

```sh
rg -n "fetch\(|/rest/v1|/rpc/|eq\.\$|in\.\$|or=|select=|URLSearchParams|new URL\(" packages
rg -n "\$\{.*\}|\+ .*\+" packages/server/src
rg -n "service.?role|rpc\(|from\(|select\(|eq\(|filter\(" packages
```

Pattern matches are not findings. A finding requires the trace below.

## Required Trace

1. Entry point: request body/query/header/cookie or persisted user-controlled value.
2. Validation: exact schema constraints, not only `string().min(1)`.
3. Sink: SQL, REST/PostgREST, SDK, RPC, storage, search, query builder, provider filter, or dynamic identifier.
4. Neutralization: parameterization, allowlist, `URLSearchParams`, `encodeURIComponent`, typed query builder, UUID/enum/canonical schema, or a single approved helper.
5. Impact: widened read/write, bypassed filter, wrong row, data exposure, privilege use, DoS, or provider-side effect.

## Controlled Identifier Rule

Distinguish code-owned literals from user/provider-controlled values before reporting.

Usually safe:

- table, function, column, bucket, and select-list names fixed in source code;
- enum-mapped identifiers where unknown values fail closed before query construction.

Suspicious:

- request or persisted user data selecting table/function/column names, storage key prefixes, RPC function names, PostgREST `select` strings, or query-builder operators;
- provider-controlled identifiers replayed into data access without a local allowlist;
- service-role operations whose target table, key, or filter is partially caller-controlled.

## PostgREST-Specific Rule

Manual filter construction with attacker-controlled values is suspicious unless values are encoded by a single approved helper or built through an official query builder. Treat `id=eq.${value}` as suspicious even though it is not raw SQL.

Flag a PostgREST data-access injection finding only when attacker control, reachability, absent neutralization, and impact are all shown. For example, `challengeId = "x&select=*"` can change query semantics when it is interpolated into:

```ts
const challengeId = body.challengeId;
await fetch(`${baseUrl}/rest/v1/otp_challenges?id=eq.${challengeId}&select=*`);
```

Do not flag a URL-encoded construction pattern by default without another reachability or impact reason:

```ts
const params = new URLSearchParams();
params.append('id', `eq.${challengeId}`);
params.set('select', 'id');
await fetch(`${baseUrl}/rest/v1/otp_challenges?${params.toString()}`);
```

If exploitability depends on official Supabase/PostgREST escaping, RPC argument behavior, or service-role boundary details, load `supabase-engineer` through `references/domain-handoffs.md` and keep the item in `needs verification` until that fact is resolved.
