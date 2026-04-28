# Runtime-gate Deployed-path Pass

Use this reference when changed files or linked review intent touch runtime gates that authorize execution through a shipped lifecycle.

This pass is not a full compliance audit or threat model. It is a bounded code-review pass for concrete merge risks where isolated gate logic can look correct while the deployed runtime path bypasses the gate or binds the wrong runtime identity.

## Trigger Signals

Run the pass when the diff or linked intent includes any of these surfaces:

- gates that authorize provider calls, model calls, webhook dispatch, queue publishes, job enqueues, payments, notifications, background ticks, or other side effects
- production construction, app composition, dependency injection, service factories, lifecycle registration, route registration, worker boot, schedulers, or tick loops that wire a gate
- request, tick, job, queue, router, model, provider, or handler paths that should call a gate before invocation
- invocation boundaries after allow, deny, refusal, admission, or policy decisions
- idempotency, replay, request locks, singleton locks, active-scope locks, or lock keys around gated execution
- release, deployment, tenant, region, cell, environment, or runtime identity binding used by integration code
- tests that claim to prove runtime-gate enforcement

Do not run it for unrelated diffs just because the repository has a runtime gate elsewhere.

## Required Review Block: Tested Path Equals Deployed Path

For each touched runtime gate, identify the path that actually ships:

1. Production construction path: where the runtime component, router, worker, scheduler, or lifecycle is instantiated.
2. Deployed dependency wiring: which policy, admission, identity, config, lock, persistence, and invocation dependencies are passed into that construction path.
3. Actual execution path: the request, tick, job, or lifecycle path that reaches the side effect.
4. Invocation boundary: the exact call site that performs the provider call, enqueue, external side effect, or durable allow decision.
5. Test path: the test or fixture path that exercises the same construction and execution path.

If tests only cover an isolated service, router, or helper while the shipped lifecycle is wired elsewhere, treat the evidence as incomplete. Report a finding only when the gap maps to reachable changed behavior or a merge-critical invariant.

## Bounded Probes

For each triggered surface, check only the reachable changed paths.

| Probe | What to verify | Merge-risk finding when |
| --- | --- | --- |
| Production construction path | The shipped lifecycle constructs the gated component with the gate enabled. | A production factory, router, worker, scheduler, or lifecycle path omits the gate or uses an ungated fallback. |
| Dependency wiring | The deployed path passes the same policy/admission, identity, config, lock, persistence, and invocation dependencies that the gate requires. | Isolated code uses the correct gate dependency, but production wiring injects a bypass, no-op, stale config, or default dependency. |
| Request/tick execution path | The real request, tick, job, or handler path reaches the gate before invocation. | A parallel route, background loop, retry path, or fallback invokes the side effect without passing through the gate. |
| Invocation boundary | Provider calls, enqueues, durable allow decisions, or other side effects occur only after the gate returns allow. | A side effect can occur before the decision, after deny/refusal, or in a branch that does not observe the decision. |
| Idempotency lock scope | Lock keys and lock lifetime cover the same runtime identity, request scope, gate decision, persistence, and side effect. | Duplicate or concurrent execution can bypass the gate because the lock is scoped only around isolated logic, a different identity, or the side effect alone. |
| Deployed-path tests | Tests execute the shipped construction or lifecycle path when wiring can bypass the gate. | Coverage proves only an isolated unit while production construction, lifecycle wiring, or integration identity can change the outcome. |
| Identity binding | Release, deployment, cell, tenant, region, or runtime identity comes from canonical upstream evidence or explicit configuration passed through the deployed path. | Integration code hard-codes identity, silently falls back to a default identity, or ignores identity mismatch unless a normative source explicitly requires that behavior. |

## Identity-binding Checks

When release, deployment, cell, tenant, region, environment, or runtime identity affects gate behavior, verify:

- the identity source is explicit and passed through the deployed construction or execution path
- hard-coded identity is rejected unless a linked normative source explicitly requires it
- missing identity does not silently fall back to a default that can admit work in the wrong deployment or cell
- mismatch between upstream evidence and configured identity refuses or fails closed before invocation
- tests cover at least one non-default identity
- tests cover identity mismatch refusal
- tests cover absence of silent fallback to default identity

Do not classify identity binding as a security vulnerability unless `security-reviewer` confirms exploitability and severity. It can still be a blocking code-review finding when the wrong deployed identity can authorize the wrong runtime path.

## Missing-test Findings

A missing deployed-path test may block the merge when all of these are true:

- the diff changes a runtime gate or its deployed construction, lifecycle wiring, invocation boundary, idempotency lock scope, or identity binding
- production wiring can bypass, disable, mis-scope, or mis-bind the gate even though isolated logic passes
- no existing test executes the shipped construction or lifecycle path that would catch the bypass or identity mismatch
- the risk can affect an external invocation, durable allow decision, idempotency guarantee, audit trail, or merge-critical runtime invariant

Do not require broad end-to-end tests when a narrower integration test can exercise the deployed construction and execution path. Do not report a blocking test finding for dead code, unrelated refactors, or theoretical topology concerns with no reachable changed path.

## Evidence Standard

Before reporting a finding, confirm:

- the changed files or linked review intent trigger this pass
- the bypass, miswire, early invocation, lock-scope gap, missing deployed-path test, or identity-binding problem is reachable through the shipped lifecycle
- surrounding construction code, guards, feature flags, dependency injection, locks, retries, and tests do not already mitigate it
- the impact is a real runtime issue: wrong side effect, denied work invoked, allowed work in the wrong identity, duplicate execution, missing audit, or gate bypass
- the fix direction is bounded to deployed-path wiring, gate placement, identity source, lock scope, or test coverage

If any point cannot be verified, downgrade the concern to an open question or omit it.

## Interop Boundaries

- `code-reviewer` owns these non-security deployed-path runtime-gate probes and findings-first output.
- `policy-admission-merge-risk` remains the detailed pass for admission, replay, freshness, persistence, and active-scope policy risks.
- `security-reviewer` owns exploitability analysis, replay authority, credential handling, vulnerability classification, and security severity.
- `spec-conformance-reviewer` owns full requirement extraction, traceability matrices, compliance statuses, and implementation-versus-spec verdicts.
- Domain skills own framework, runtime, storage, queue, router, dependency injection, lock, and testing mechanics needed to confirm or clear the probe.

## Self-check Before Reporting

Ask:

1. Did the changed files or linked intent actually touch a runtime gate in a shipped lifecycle?
2. Is the finding grounded in the deployed construction or execution path, not only an architecture theory?
3. Have production wiring, invocation boundaries, idempotency locks, identity sources, and deployed-path tests been checked?
4. Would the issue matter at runtime as a gate bypass, invocation after deny, wrong deployment/cell identity, duplicate execution, missing audit, or missing deployed-path coverage?

If the answer is not yes for all four, do not emit it as a finding.
