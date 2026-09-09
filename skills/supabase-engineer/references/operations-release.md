# CI, Deploy, Multi-Env, Upgrades

## CI integration
- Run tests with env-specific keys (use secrets, never hardcode).
- Use the accepted isolated CI environment and least-privileged credentials; a dedicated hosted test project is one option, not a requirement to create new topology.
- Run the repository's applicable checks for hardcoded keys and unsafe policies; add a guardrail only for the authorized change and demonstrated failure path.

## Multi-environment setup
- Preserve the accepted separation of development, staging and production, whether local stacks or separate projects. Route a change in isolation/topology to its owner rather than creating projects from this reference.
- Use the accepted per-environment secret storage and verify the selected target before mutations.
- Verify existing protections against development code writing to production; a missing control is a concrete finding for the owning deployment/security task.

## Authorized release checks
- Verify credential handling and the affected grants/RLS/Storage paths under the accepted deployment contract.
- Exercise the health/readiness checks and alerts that the project requires; do not create new public endpoints or monitoring services by default.
- Confirm the applicable rollback/recovery procedure and exact deployed target/readback. A local test or deployment command alone does not establish a healthy remote release.

## Upgrade workflow
- Review SDK changelog and migration notes.
- Upgrade only when requested or accepted; current documentation alone does not authorize changing a working project's dependencies.
- Follow the repository's branch/release workflow, preserve compatible version sets, and run the required checks plus regressions for the changed surface.
- Resolve breaking changes before the authorized release and report any unverified consumer/platform boundary.

## Load testing + scale
- Define the production-representative workload, SLO, environment, data safety, and stopping limits before load testing.
- Use an accepted project tool to measure the actual bottleneck; do not infer topology from DAU or synthetic throughput alone.
- Configure autoscaling, HPA, queues, or additional services only when measurements and the accepted architecture justify them. Route topology changes to `architecture-engineer`.

## Cost tuning
- Measure product-specific usage, storage growth, egress, compute, and request patterns before changing architecture.
- Add caching or batching only for an observed hot path with explicit authorization, invalidation, tenant isolation, consistency, and rollback behavior.
- Archive or delete cold data only under an accepted retention, recovery, privacy, and audit contract; storage age alone is not deletion authority.
