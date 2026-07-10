# Wrangler / Runtime Config (Cloudflare Workers)

- Pin `compatibility_date` and review compatibility flags during upgrades.
- Prefer `wrangler.jsonc` for non-secret config and keep per-environment sections explicit.
- Run `wrangler types` after binding changes and commit the generated type surface if the project tracks it.
- For Workers tests, preserve the project's current harness. Prefer the current Workers Vitest integration for new or migrated coverage; do not introduce or migrate from `unstable_dev` unless the task authorizes the tooling change.
- Set CPU limits explicitly when available (e.g., `limits.cpu_ms`) and monitor cost/latency impact.
- Keep per-environment config isolated (`env.stage`, `env.prod`).
- Define bindings (KV/D1/R2/Queues/Rate Limiting) in config and mirror them in your env schema.
- Keep secrets out of config files; use `wrangler secret put` for secret material.
- Enable `nodejs_compat` only when dependencies require Node built-ins; do not turn it on by default without need.
- Enable structured `observability` settings when the deployment model supports them.
