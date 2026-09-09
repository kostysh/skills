# CI, Deploy, Multi-Env, Upgrades

## CI integration
- Run tests with env-specific keys (use secrets, never hardcode).
- Use a dedicated test project/key for CI.
- Add lint/guardrails to block hardcoded keys and unsafe policies.

## Multi-environment setup
- Use separate Supabase projects for dev/staging/prod.
- Store per-env keys in a secrets manager.
- Add guards to prevent dev code from writing to prod.

## Deploy checklist (minimum)
- Production keys stored securely.
- RLS validated for all tables + storage.
- Health checks and alerts enabled.
- Rollback procedure documented.

## Upgrade workflow
- Review SDK changelog and migration notes.
- Create a branch, upgrade SDK, run full test suite.
- Fix breaking changes before release.

## Load testing + scale
- Define the production-representative workload, SLO, environment, data safety, and stopping limits before load testing.
- Use an accepted project tool to measure the actual bottleneck; do not infer topology from DAU or synthetic throughput alone.
- Configure autoscaling, HPA, queues, or additional services only when measurements and the accepted architecture justify them. Route topology changes to `architecture-engineer`.

## Cost tuning
- Measure product-specific usage, storage growth, egress, compute, and request patterns before changing architecture.
- Add caching or batching only for an observed hot path with explicit authorization, invalidation, tenant isolation, consistency, and rollback behavior.
- Archive or delete cold data only under an accepted retention, recovery, privacy, and audit contract; storage age alone is not deletion authority.
