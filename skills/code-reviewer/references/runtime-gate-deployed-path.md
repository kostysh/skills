# Runtime-gate and External-contract Pass

Use this reference when changed behavior depends on external-contract assumptions or touches runtime gates that authorize execution through a shipped lifecycle.

This is a bounded code-review pass, not a full compliance audit or threat model. A green fixture can preserve the author's mistaken model; a gate can reject required work as well as admit forbidden work.

## Trigger Signals

Run the pass when the diff or linked intent includes any of these surfaces:

- external states, types, identity, or transitions whose interpretation can change the reviewed behavior
- gates that authorize provider calls, model calls, webhook dispatch, queue publishes, job enqueues, payments, notifications, background ticks, or other side effects
- production construction, app composition, dependency injection, service factories, lifecycle registration, route registration, worker boot, schedulers, or tick loops that wire a gate
- request, tick, job, queue, router, model, provider, or handler paths that should call a gate before invocation
- long-lived protected streams, SSE, subscription, or WebSocket-like handlers whose authorization can change after connection opening
- invocation boundaries after allow, deny, refusal, admission, or policy decisions
- idempotency, replay, request locks, singleton locks, active-scope locks, or lock keys around gated execution
- release, deployment, tenant, region, cell, environment, or runtime identity binding used by integration code
- tests that claim to prove runtime-gate enforcement

Do not run it for unrelated diffs just because the repository has an external integration or runtime gate elsewhere. For an external-contract change without a gate, apply the decision-model and evidence checks to the touched consumer; gate-specific probes apply only when triggered.

## Independently Check the Decision Model

Identify material assumptions about states, types, identity, and transitions before accepting the author's tests as evidence. Check those assumptions against the applicable primary contract or real-platform observations, including their version, input path, and capture limits. Author-written fixtures and assertions are not independent confirmation of the model, even when green.

For a touched gate, check both required refusals and a required admissible scenario through the changed path. Establish what must pass from the owning contract or demonstrated invariant; a platform-supported state is not automatically permitted by product policy. A proven rejection of required work is a regression even when no forbidden action can bypass the gate.

Separate platform facts, author assumptions, and missing evidence. Tie a concern to reachable changed behavior and its consequence; if the source or observation cannot establish that link, retain a question or evidence limit. A supported counterexample does not establish the cause of an unrecorded historical response.

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
| Long-lived revalidation | Protected streams or sockets revalidate authorization or consume an explicit invalidation mechanism during the connection lifetime. | Opening admission is correct, but stale/revoked/disabled/maintenance-denied changes can keep receiving protected events indefinitely. |

## Long-lived Protected Endpoint Checks

For SSE, stream, subscription, or WebSocket-like endpoints, opening auth is only the first gate when permissions can change while the connection remains open.

Check:

- the route-level guard protects the opening request;
- service/domain logic supports repeated authorization checks, heartbeat revalidation, or an explicit accepted invalidation mechanism;
- stale session, revoked account/session/role, wrong active context, wrong scope/tenant, disabled status, or maintenance denial reaches an observable blocked, closed, or denied state;
- stream loops handle cancellation/abort and do not leave floating promises;
- tests cover the lifecycle path, not only the initial handler response.

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

These criteria govern a standalone missing-test finding; they do not exclude a confirmed behavioral regression in the decision model.

A missing deployed-path test may block the merge when all of these are true:

- the diff changes a runtime gate or its deployed construction, lifecycle wiring, invocation boundary, idempotency lock scope, or identity binding
- production wiring can bypass, disable, mis-scope, or mis-bind the gate even though isolated logic passes
- no existing test executes the shipped construction or lifecycle path that would catch the bypass or identity mismatch
- the risk can affect an external invocation, durable allow decision, idempotency guarantee, audit trail, or merge-critical runtime invariant

Do not require broad end-to-end tests when a narrower integration test can exercise the deployed construction and execution path. Do not report a blocking test finding for dead code, unrelated refactors, or theoretical topology concerns with no reachable changed path.

## Evidence Standard

Before reporting a finding, confirm:

- the changed files or linked review intent trigger this pass
- the contract mismatch, improper refusal, bypass, miswire, early invocation, lock-scope gap, missing deployed-path test, or identity-binding problem is reachable through the shipped execution path
- surrounding construction code, guards, feature flags, dependency injection, locks, retries, and tests do not already mitigate it
- the impact is a real runtime issue: required work rejected or processed incorrectly, wrong side effect, denied work invoked, allowed work in the wrong identity, duplicate execution, missing audit, or gate bypass
- the fix direction is bounded to contract interpretation, gate decisions, deployed-path wiring, identity source, lock scope, or relevant test coverage

If any point cannot be verified, downgrade the concern to an open question or omit it.

## Interop Boundaries

- `code-reviewer` owns these non-security deployed-path runtime-gate probes and the plain-language outcome followed by findings.
- `policy-admission-merge-risk` remains the detailed pass for admission, replay, freshness, persistence, and active-scope policy risks.
- `security-reviewer` owns exploitability analysis, replay authority, credential handling, vulnerability classification, and security severity.
- `spec-conformance-reviewer` owns full requirement extraction, traceability matrices, compliance statuses, and implementation-versus-spec verdicts.
- Domain skills own framework, runtime, storage, queue, router, dependency injection, lock, and testing mechanics needed to confirm or clear the probe.

## Self-check Before Reporting

Ask:

1. Did the changed files or linked intent actually trigger an external-contract or runtime-gate check?
2. Is the finding grounded in the deployed construction or execution path, not only an architecture theory?
3. Have the applicable contract assumptions, guards, wiring, identity sources, and tests been checked independently of the author's model?
4. Would the issue matter at runtime as required work rejected or processed incorrectly, a gate bypass, invocation after deny, wrong deployment/cell identity, duplicate execution, missing audit, or missing deployed-path coverage?

If the answer is not yes for all four, do not emit it as a finding.
