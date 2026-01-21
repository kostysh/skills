# Wrangler / Runtime Config (Cloudflare Workers)

- Pin `compatibility_date` and review compatibility flags during upgrades.
- Set CPU limits explicitly when available (e.g., `limits.cpu_ms`) and monitor cost/latency impact.
- Keep per-environment config isolated (`env.stage`, `env.prod`).
- Define bindings (KV/D1/R2/Queues/Rate Limiting) in config and mirror them in your env schema.
