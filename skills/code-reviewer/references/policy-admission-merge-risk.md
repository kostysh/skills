# Policy/admission Merge-risk Pass

Use this reference only when changed files or linked review intent touch policy gates, admission-before-side-effect flow, decision or audit persistence, active-scope activation, idempotency, replay, or freshness checks.

This pass is not a full compliance audit or threat model. It is a bounded code-review pass for concrete merge risks in changed behavior.

If the policy/admission decision is enforced through a shipped runtime lifecycle, also run the deployed-path pass from `references/runtime-gate-deployed-path.md`. Keep this reference focused on policy/admission risk; use the runtime-gate reference for production construction, dependency wiring, request/tick execution, invocation boundaries, idempotency lock scope, deployed-path tests, and deployment/cell identity binding.

## Trigger Signals

Run the pass when the diff or linked intent includes any of these surfaces:

- policy allow, deny, refusal, or admission decisions
- code that must decide before an external invocation, webhook, queue publish, job enqueue, notification, payment, model call, or other side effect
- decision logs, audit rows, replay records, request ids, idempotency keys, or conflict handling
- audit/security event capture, fallback, append-only storage, or failure behavior used as merge-critical evidence
- active-scope activation, singleton decisions, policy version activation, or replacement of the currently active record
- freshness controls such as evidence timestamps, `observedAt`, `collectedAt`, `expiresAt`, `maxEvidenceAgeMs`, or TTL checks
- tests that claim to cover policy/admission failure paths

Do not run it for unrelated diffs just because the repository has policy code elsewhere.

## Bounded Probes

For each touched surface, check only the reachable changed paths.

| Probe | What to verify | Merge-risk finding when |
| --- | --- | --- |
| No invocation after deny | Deny, refusal, invalid admission, and failed preconditions return before external invocation or durable side effect. | A denied or invalid path can still invoke the external action, enqueue work, or persist an allowed decision. |
| Replay and conflict handling | Duplicate request ids, idempotency keys, persistence conflicts, and replayed audit rows are resolved before side effects. | A replay can reuse stale success state, ignore a conflict, or perform the side effect before conflict resolution. |
| Freshness fail-closed | When age limits exist, missing or stale freshness metadata is rejected. | `maxEvidenceAgeMs` or equivalent exists, but absent `observedAt` or stale evidence silently passes through defaults. |
| Persistence fail-closed | Decision and audit persistence failures cannot produce an allowed action. | A write failure, partial write, or swallowed persistence error lets the operation continue as allowed. |
| Audit capture semantics | Required audit/security events have the promised capture path, durability, and failure behavior. | Code only names or logs an event, or silently best-effort writes it, while the contract requires fail-closed capture, durable fallback, or append-only evidence. |
| Active-scope concurrency | Active or singleton decisions use a transaction, lock, compare-and-swap, or uniqueness constraint that matches the data model. | Concurrent activations can admit two active policies or leave the active state ambiguous. |
| Append-only facts | Append-only fact or audit tables do not rely on uniqueness shortcuts that hide conflicting facts. | A shortcut treats the first or last row as authoritative without resolving conflict, replay, or freshness. |
| Risk-path tests | Tests exercise the actual policy/admission failure path. | Coverage only checks nearby happy paths while a merge-critical deny, replay, freshness, persistence, or active-scope path is changed. |
| Deployed enforcement path | When enforcement depends on runtime lifecycle wiring, the deployed-path pass is run. | Isolated policy/admission tests pass, but production construction or lifecycle wiring can bypass the gate. |

## Evidence Standard

Before reporting a finding, confirm:

- the path is reachable from the changed behavior under review
- surrounding code does not already fail closed, serialize access, or reject stale state
- the failure can affect a real action, persisted decision, audit trail, or merge-critical invariant
- the proposed fix direction is bounded to the reviewed behavior

If any point cannot be verified, downgrade the concern to an open question or omit it.

## Missing-test Findings

A missing test may block the merge when all of these are true:

- the diff changes a policy/admission path listed in this reference
- the path can allow, deny, persist, replay, or activate behavior incorrectly
- no existing test exercises the exact risk path after the change
- the risk is high enough that manual reasoning is not a stable guard

Do not report a blocking test finding for style-only cleanup, dead code, or a theoretical risk with no reachable changed path.

## Interop Boundaries

- `code-reviewer` owns these non-security merge-risk probes and the plain-language outcome followed by findings.
- `security-reviewer` owns exploitability analysis, vulnerability classification, and security severity.
- `spec-conformance-reviewer` owns full requirement extraction, traceability matrices, compliance statuses, and implementation-versus-spec verdicts.
- Domain skills own framework, runtime, storage, and testing mechanics needed to confirm or clear the probe.

## Self-check Before Reporting

Ask:

1. Did the changed files or linked intent actually trigger this pass?
2. Is the finding grounded in a reachable path, not an architecture theory?
3. Have nearby guards, transactions, constraints, retries, and tests been checked?
4. Would the issue matter at runtime as a wrong side effect, stale admission, corrupted decision, missing audit, replay conflict, or active-scope race?

If the answer is not yes for all four, do not emit it as a finding.
