# Code Review Methodology

Use this file when the review scope is broad, the diff is large, or you need a disciplined pass order.

## Input Gathering

Before writing findings:

1. Read `references/diff-completeness.md`, resolve the authoritative target/base/scope, and record a starting snapshot identity. Keep the review read-only.
2. Identify the review target:
   - current branch
   - explicit file list
   - commit range
   - PR diff
3. Read the full diff.
4. List the changed files and explicit exclusions.
5. Flag high-risk files early without assigning severity from file class alone:
   - migrations
   - auth or permission code
   - RBAC/session/context code and direct data-access paths
   - runtime config
   - background work
   - CI workflows
   - tests removed or weakened
   - policy gates, admission flow, decision or audit persistence, active-scope activation, idempotency, replay, or freshness checks
   - runtime gates in shipped lifecycle paths, production construction, deployed dependency wiring, request or tick execution, invocation boundaries, idempotency locks, or deployment/cell identity binding
   - long-lived protected streams, subscriptions, SSE, or WebSocket-like endpoints
6. If a linked issue, acceptance criteria, contract, ADR, or other normative source exists, run the lightweight pass from `references/spec-pass.md` before finalizing findings.
7. If changed files or linked intent touch policy/admission surfaces, run the bounded pass from `references/policy-admission-merge-risk.md`.
8. If changed files or linked intent touch runtime gates in a shipped lifecycle, run the deployed-path pass from `references/runtime-gate-deployed-path.md`.

If any diff output is truncated, read the touched files directly until every changed hunk is seen.

## Conditional Policy/admission Merge-risk Pass

Use this pass only when the changed files or linked review intent touch policy gates, admission before external side effects, decision or audit persistence, active-scope activation, idempotency, replay, or freshness checks. For detailed probes, load `references/policy-admission-merge-risk.md`.

Ask:

- Do deny and refusal paths terminate before any external invocation or durable side effect?
- Are duplicate request ids, persistence conflicts, replayed admissions, and stale audit rows resolved before side effects?
- When an age limit such as `maxEvidenceAgeMs` exists, does missing or stale freshness metadata fail closed?
- Can persistence failure, audit-write failure, or decision-write failure produce an allowed action?
- Do active-scope or singleton decisions use a transaction, lock, or constraint model that matches the data model?
- Do append-only fact tables avoid uniqueness shortcuts that hide conflicting facts?
- Do tests exercise the actual policy/admission risk path instead of only a nearby happy path?

Only report findings grounded in reachable changed behavior and surrounding code. If the concern is theoretical or the mitigation cannot be verified, move it to questions or omit it.

## Conditional Runtime-gate Deployed-path Pass

Use this pass only when the changed files or linked review intent touch runtime gates that authorize execution through a shipped lifecycle. For detailed probes, load `references/runtime-gate-deployed-path.md`.

Ask:

- Does the production construction path instantiate the gated component with the gate enabled and wired to the expected policy or admission dependency?
- Does the actual request, tick, job, or lifecycle path call the gate before provider invocation, enqueue, external side effect, or durable allow decision?
- Does the invocation boundary remain after the policy/admission decision rather than bypassing it through a parallel route, fallback, or default dependency?
- Does the idempotency or lock scope cover the gate, decision persistence, and side effect at the same runtime identity and request scope?
- Do tests execute the deployed path or construction path that ships, not only isolated service/router units?
- Is release/deployment/cell identity derived from canonical upstream evidence or explicit configuration passed through the deployed path?
- Do tests cover non-default identity, mismatch refusal, and no silent fallback to a hard-coded default identity?

Isolated unit tests are insufficient when production construction, lifecycle wiring, or integration identity can bypass or mis-bind the gate. Only report findings grounded in reachable changed behavior and deployed-path evidence gaps.

## Four Review Passes

### Pass 1: Correctness

Ask:

- What behavior is explicitly required by the linked issue, acceptance criteria, or contract, and does the diff align with it?
- Can this produce the wrong value or wrong side effect?
- Does the control flow still hold under empty, null, duplicate, reordered, or partial input?
- Is the new invariant actually enforced?
- Does async work race, retry incorrectly, or ignore cancellation?

### Pass 2: Design

Ask:

- Does the change fit the repo's architecture?
- Is complexity justified by the problem size?
- Are responsibilities clearer or more entangled?
- Did the change quietly widen a public contract?

### Pass 3: Tests and Operability

Ask:

- What behavior changed, and where is it tested?
- Are edge cases and failure paths covered?
- Do tests exercise the production data path that can actually fail, such as persistence, RLS, RPC, provider gate, or service-role boundary, rather than only a mock or in-memory path?
- Do fixtures satisfy production authorization invariants, including session row/version, active context id/version, role, scope/tenant, account/session/role status, and profile/readiness gates?
- For auth/RBAC/session/context changes, are negative tests present for stale session, stale active context, wrong role, wrong scope/tenant, disabled/revoked status, and missing readiness when relevant?
- For long-lived protected streams or sockets, is there evidence that stale/revoked/disabled/maintenance-denied transitions produce an observable blocked/closed/denied state?
- For required audit or durable behavior, are fallback and write-failure paths tested instead of swallowed as silent best effort?
- Are logs, metrics, retries, and rollout concerns handled?
- Would a rollback or emergency fix be obvious?

### Pass 4: Performance and Compatibility

Ask:

- Did the change add new work on hot paths?
- Can user-controlled input grow time, memory, or query count?
- Are there runtime, browser, schema, or API compatibility hazards?
- Does caching still stay coherent after writes?

## Evidence Standard

Do not report a finding until you can explain:

- the exact code path
- why the issue is real in the changed scope
- why nearby guards or tests do not already cover it
- what outcome can break in production

If you cannot support one of those points, downgrade it to a question or assumption.

## Completeness Audit

Before finalizing, quickly check:

- every changed file was reviewed
- every high-risk file class received at least one explicit pass
- deleted or rewritten tests were inspected, not just counted
- findings are ordered by severity, not by file order
- no finding is just a style preference in disguise
- the ending snapshot identity matches the starting identity
- the report names target/base/snapshot, scope, evidence, limits, and exactly one recommendation status

If the snapshot changed, mark the result stale and do not approve until a fresh or bounded delta review completes. If incomplete scope or unavailable specialized authority prevents a clean recommendation, return `limited`; if the review basis cannot be established reproducibly, return `blocked`.

## Large Diff Handling

For very large diffs:

- identify the highest-risk slices first
- say explicitly where confidence is reduced
- prefer "review reliability is limited because X" over fake completeness

Large size is not itself a bug, but it is a reviewability risk worth mentioning when it affects confidence.
