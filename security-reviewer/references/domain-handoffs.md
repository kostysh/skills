# Domain Handoffs

This skill owns security review method. Stop and hand off framework detail when you hit implementation-specific questions.

## Load `hono-engineer`

When the finding depends on:

- middleware order
- request body limits
- auth middleware shape
- Hono error mapping
- edge runtime request handling details

## Load `supabase-engineer`

When the finding depends on:

- exact RLS or storage policy design
- user vs service client construction
- Edge Function auth wiring
- migration strategy for grants, functions, or buckets

## Load `react-spa-engineer` or `react-components-engineer`

When the finding depends on:

- client auth state handling
- React rendering boundaries
- hydration or SSR behavior
- component-level data leak paths

## Load `node-engineer`

When the finding depends on:

- runtime config loading
- process environment handling
- stream or backpressure behavior
- shutdown or resource cleanup semantics
