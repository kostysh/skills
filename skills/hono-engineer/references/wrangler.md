# Wrangler / Runtime Config (Cloudflare Workers)

- Preserve the project's config format and `compatibility_date`; review compatibility flags when an accepted runtime change modifies them.
- Run `wrangler types --env-interface <Name>` after binding changes when the project uses generated Hono bindings; commit the generated type surface only if the project tracks it.
- For Workers tests, preserve the project's current harness. Introduce or migrate to the current Workers Vitest integration only when the task authorizes that tooling change.
- Configure CPU limits only when the platform/operations owner supplies a budget and monitoring contract.
- Bindings, variables, and secrets are non-inheritable across Wrangler environments; define each accepted value/binding in every environment that uses it.
- Verify selected bindings against the project's Env surface without adding KV, D1, R2, Queues, Rate Limiting, or another product by default.
- Preserve the project secret-management boundary; Wrangler provides secret commands, but this reference does not choose storage or rotation policy.
- Determine effective Node compatibility from both `compatibility_date` and positive/negative flags; absence of an explicit positive flag does not always disable Node APIs. Before `2026-08-04`, enable the needed supported mode explicitly when the accepted dependency requires it. From `2026-08-04`, both `nodejs_compat` and `nodejs_compat_v2` are enabled by default. To disable them, remove explicit positive flags and set both `no_nodejs_compat` and `no_nodejs_compat_v2`. Preserve the accepted date rather than advancing it as a workaround; verify the [current compatibility contract](https://developers.cloudflare.com/workers/configuration/compatibility-flags/).
- Some Node modules are partial implementations or import-only stubs whose methods fail at runtime; verify the exact calls in a Workers runtime test. A successful bundle or a replacement using Web APIs does not prove Node APIs are enabled or disabled; use a separate unchanged Node-API probe when that distinction is the claim. Local workerd evidence is not Cloudflare production evidence.
- Configure Wrangler observability only when the project observability owner selects its fields, sampling, destination, and evidence requirements.
