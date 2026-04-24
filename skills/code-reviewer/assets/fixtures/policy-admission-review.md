# Policy/admission Review Fixture Examples

These are portable review examples for `references/policy-admission-merge-risk.md`. They are not product requirements.

## Replay Conflict Example

Changed behavior:

```ts
const previous = await auditStore.findByRequestId(requestId);
if (previous?.decision === "allow") {
  await invokeProvider(payload);
  return previous;
}

const decision = await admission.decide(payload);
await invokeProvider(payload);
await auditStore.insert({ requestId, decision });
return decision;
```

Review conclusion:

- Finding: a duplicate request can reuse a stale allow audit row and invoke the provider before resolving whether the replayed request conflicts with current evidence. The conflict or idempotency check must complete before invocation.
- Not enough for a finding: the table name contains `audit`, but the changed path does not read or write replay state.
- Missing-test signal: tests only cover first-time allow; no test covers duplicate request id with changed payload or stale audit state.

## Freshness Gap Example

Changed behavior:

```ts
if (policy.maxEvidenceAgeMs !== undefined) {
  const ageMs = now - (evidence.observedAt ?? now);
  if (ageMs > policy.maxEvidenceAgeMs) {
    return deny("stale_evidence");
  }
}
return allow();
```

Review conclusion:

- Finding: when `maxEvidenceAgeMs` exists and `observedAt` is absent, the default to `now` makes unknown freshness look fresh. Missing freshness metadata must fail closed before allow.
- Not enough for a finding: `observedAt` is optional in a type, but every changed caller supplies it and the reviewed path rejects missing values before this branch.
- Missing-test signal: tests cover stale timestamps but not absent `observedAt` with `maxEvidenceAgeMs` set.

## Expected Reviewer Behavior

- Report confirmed findings only for reachable changed paths.
- Move uncertainty about product intent, data model constraints, or unavailable transaction semantics to questions.
- Do not require this pass for unrelated diffs.
