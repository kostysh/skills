# Runtime-gate Deployed-path Review Fixture Examples

These are portable review examples for `references/runtime-gate-deployed-path.md`. They are not product requirements.

## Deployed Lifecycle Bypass Example

Changed behavior:

```ts
export function createRuntimeForTests() {
  const gate = new RuntimeGate(policyStore);
  return new RuntimeLifecycle({ gate, provider });
}

export function createProductionRuntime(config: RuntimeConfig) {
  return new RuntimeLifecycle({
    gate: new AllowAllGate(),
    provider: createProvider(config.provider),
  });
}

export class RuntimeLifecycle {
  async tick(input: TickInput) {
    await this.provider.invoke(input);
  }
}
```

Review conclusion:

- Finding: isolated tests construct `RuntimeLifecycle` with `RuntimeGate`, but production construction wires `AllowAllGate` and `tick` invokes the provider without observing a gate decision. The shipped construction path must wire the real gate and the tick path must call it before invocation.
- Not enough for a finding: test helpers use a different constructor, but production construction is also covered by a deployed-path test that verifies deny prevents provider invocation.
- Missing-test signal: tests assert `RuntimeGate.denies()` in isolation but no test creates the production runtime and executes `tick` through the shipped lifecycle.

## Invocation Boundary Example

Changed behavior:

```ts
async function handleRequest(request: RequestInput) {
  const invocation = provider.invoke(request.payload);
  const decision = await gate.decide(request);
  if (decision.kind === "deny") {
    return refusal(decision.reason);
  }
  return invocation;
}
```

Review conclusion:

- Finding: provider invocation starts before the gate decision, so a denied request can still execute the side effect. The invocation boundary must move after an allow decision.
- Not enough for a finding: a provider object is allocated before the decision, but no network call, enqueue, durable write, or other side effect can occur until after allow.
- Missing-test signal: tests cover denied response shape but do not assert that the provider was not invoked.

## Hard-coded Identity Example

Changed behavior:

```ts
export function createDeploymentClient(config: Config) {
  return new DeploymentClient({
    deploymentId: "default-deployment",
    cellId: "primary",
    endpoint: config.endpoint,
  });
}
```

Review conclusion:

- Finding: deployment and cell identity are hard-coded at the integration boundary, so non-default deployments can be routed or authorized as the default identity. Identity must come from canonical upstream evidence or explicit configuration passed through the deployed path, and mismatches must fail closed.
- Not enough for a finding: the default identity is hard-coded in a test fixture only, and production construction receives identity from configuration with mismatch tests.
- Missing-test signal: tests cover only the default deployment; there is no non-default identity, mismatch refusal, or no-silent-fallback coverage.

## Idempotency Lock Scope Example

Changed behavior:

```ts
async function runJob(job: JobInput) {
  const decision = await gate.decide(job);
  if (decision.kind === "deny") return;

  await idempotency.withLock(job.requestId, async () => {
    await provider.invoke(job.payload);
    await audit.write({ requestId: job.requestId, decision });
  });
}
```

Review conclusion:

- Finding: the idempotency lock starts after the gate decision and is keyed only by request id, so concurrent execution under different deployment/cell identity can make separate decisions and then serialize only the side effect. The lock scope must cover the runtime identity, gate decision, persistence, and side effect.
- Not enough for a finding: the lock key is assembled elsewhere from request id plus deployment identity, and the deployed-path test proves duplicate jobs cannot invoke twice after deny or identity mismatch.
- Missing-test signal: tests cover duplicate provider invocation but not concurrent decisions across non-default identity or mismatch paths.

## Expected Reviewer Behavior

- Report confirmed findings only for reachable deployed construction or execution paths.
- Treat isolated unit tests as insufficient when production wiring can change the gate outcome.
- Move uncertainty about deployment topology, identity source, or lock semantics to questions.
- Do not require this pass for unrelated diffs.
