# Wrangler / Runtime Config (Cloudflare Workers)

- Preserve the project's config format and `compatibility_date`; review compatibility flags when an accepted runtime change modifies them.
- Run `wrangler types --env-interface <Name>` after binding changes when the project uses generated Hono bindings; commit the generated type surface only if the project tracks it.
- For Workers tests, preserve the project's current harness. Introduce or migrate to the current Workers Vitest integration only when the task authorizes that tooling change.
- Configure CPU limits only when the platform/operations owner supplies a budget and monitoring contract.
- Bindings, variables, and secrets are non-inheritable across Wrangler environments; define each accepted value/binding in every environment that uses it.
- Verify selected bindings against the project's Env surface without adding KV, D1, R2, Queues, Rate Limiting, or another product by default.
- Preserve the project secret-management boundary; Wrangler provides secret commands, but this reference does not choose storage or rotation policy.
- Enable `nodejs_compat` only when dependencies require Node built-ins and the compatibility date supports the needed APIs. Some modules are partial implementations or import-only stubs whose methods fail at runtime; verify the exact calls in a Workers runtime test.
- Configure Wrangler observability only when the project observability owner selects its fields, sampling, destination, and evidence requirements.
