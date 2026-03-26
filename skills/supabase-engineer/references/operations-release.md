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
- Use k6 or similar for baseline load tests.
- Configure autoscaling (e.g., HPA) for stateless services.

## Cost tuning
- Monitor usage and storage growth.
- Cache hot paths and batch writes.
- Archive or delete cold data.
