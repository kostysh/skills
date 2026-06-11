# Domain Handoffs

This skill owns security review method. Stop and hand off framework detail when you hit implementation-specific questions.

Policy-governance admission reportability stays with `security-reviewer`: decide whether external invocation, executable approval capability, policy activation, active-scope selection, governance/audit persistence, fail-closed gates, replay/idempotency behavior, or admission-gate authority binding creates a security finding here. Hand off only the framework/runtime facts needed to prove exploitability or remediation.

## Stack Discovery

Before loading a domain skill, identify all relevant stacks and surfaces:

- frontend runtime or framework
- backend runtime or framework
- CI or automation context
- database or storage privilege boundary
- proxy, edge, or deployment assumptions that may change exploitability

If both frontend and backend exist, inspect both sides before finalizing a security conclusion.

## Load `hono-engineer`

When the finding depends on:

- middleware order
- request body limits
- route admission-boundary preservation
- auth middleware shape
- Hono error mapping
- edge runtime request handling details

Security questions to resolve:

- where request size, parser behavior, and middleware order are enforced
- whether trusted proxy or edge behavior changes attacker control
- whether auth context and route-specific body limits are attached before privileged handlers or expensive pre-auth work run
- whether a Hono route-admission change preserves the touched route's existing public/user/admin/webhook/service/operator boundary
- whether the question is Hono route admission; non-route policy-governance admission belongs in `references/policy-governance-admission.md`

## Load `supabase-engineer`

When the finding depends on:

- exact RLS or storage policy design
- user vs service client construction
- Edge Function auth wiring
- migration strategy for grants, functions, or buckets
- Supabase REST/PostgREST filter semantics, official client escaping, RPC argument behavior, or service-role data-access boundaries

Security questions to resolve:

- whether the real permission boundary lives in RLS, grants, storage policy, or server code
- whether a service-role path is intentionally narrow or accidentally broad
- whether later migrations or platform defaults change the reviewed risk
- whether an attacker-controlled identifier can change REST/PostgREST, SDK filter, RPC, or service-role data-access semantics

## Load `react-spa-engineer` or `react-components-engineer`

When the finding depends on:

- client auth state handling
- React rendering boundaries
- hydration or SSR behavior
- component-level data leak paths

Security questions to resolve:

- whether data crosses a server-client boundary or only exists in trusted server code
- whether rendering behavior can turn attacker content into HTML, navigation, or state leakage
- whether the suspect path is browser-reachable or only internal to tooling

## Load `node-engineer`

When the finding depends on:

- runtime config loading
- process environment handling
- stream or backpressure behavior
- shutdown or resource cleanup semantics

Security questions to resolve:

- whether runtime config or environment assumptions are actually attacker-influenced
- whether stream handling, body limits, or client timeouts change exploitability
- whether a process-level safeguard exists outside the reviewed file

## Handoff Rule

If exploitability depends on a stack-specific fact that this skill cannot confirm, keep the item in `needs verification` until the relevant domain skill resolves it.

Do not transfer non-route policy-governance security reportability to a domain skill. Domain skills can resolve transaction, runtime, middleware, queue, artifact provenance, deployment identity, provider timestamp, canonical evidence storage, or framework facts, but `security-reviewer` owns the final HIGH-confidence security finding decision.
