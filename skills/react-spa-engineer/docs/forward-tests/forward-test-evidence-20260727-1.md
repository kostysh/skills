# Blind forward-test evidence

## Basis

- Date: 2026-07-27.
- Candidate: `react-spa-engineer` source-version `0.1.10`.
- Evaluator: fresh agent with no forked conversation turns.
- Read boundary: generated `SKILL.md`, four named active references, and raw mutation fixture only.
- Side effects: design-only and read-only.

## Exact evaluator prompt

```text
Use $react-spa-engineer from /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05/skills/react-spa-engineer to design the smallest production-compatible SPA state and verification contract for the mutation flow in /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05/skills/typescript-test-engineer/evals/fixtures/mutation-lifetime-input.md. This is design-only and read-only; do not edit files or invent backend behavior.

You may read only:
- skills/react-spa-engineer/SKILL.md
- skills/react-spa-engineer/references/data-fetching.md
- skills/react-spa-engineer/references/persistence-architecture.md
- skills/react-spa-engineer/references/state-management.md
- skills/react-spa-engineer/references/testing.md
- the supplied mutation-lifetime-input.md fixture
Do not read skill.yaml, evals/evals.json, docs, Git diff/history, other skills, or any other repository file. Return the actual design/handoff required by the skill, then a brief self-assessment.
```

The absolute paths record the local execution and are not active portable dependencies.

## Complete observed output

```markdown
## Design handoff: mutation lifetime for `case-17`

### Scope and status

- Mode: design-only, read-only.
- Observable capability: operation status survives drawer portal remount; mutation acceptance is not shown as success before an authoritative reread confirms the outcome; reread failure remains visible and recoverable; context A data/status never appears in context B.
- Status: design completed. No implementation or runtime verification was performed.
- Inspected surface: only the supplied fixture and the permitted `react-spa-engineer` instructions/references.

The proposed drawer-local `isSaving`, `verificationError`, timer, and current-context cache helper cannot satisfy the accepted behavior. They are substrate that can pass isolated drawer tests while losing status on remount and leaking a late A result into B.

### Smallest production-compatible ownership

Use a route/access-scoped operation coordinator mounted in the workspace shell above the disposable drawer portal. Local React state or `useReducer` is sufficient; Zustand and Dexie are not justified.

| Value/state | Identity | Single owner | Lifetime and context-loss rule |
|---|---|---|---|
| Form draft | drawer instance + `case-17` | Drawer-local form state | May disappear when the drawer closes; no draft persistence was accepted. |
| Write request and transport status | route, context A, `case-17`, client-only `attemptId` | TanStack Query mutation instantiated by the workspace coordinator | Survives drawer remount. It is fenced when A loses access context. `attemptId` is not a backend idempotency key. |
| Verification obligation | route, context A, `case-17`, `attemptId`, `verificationId` | Workspace coordinator reducer | Created only after mutation acceptance; survives drawer remount; hidden/reset on switch to B. |
| Authoritative reread | access-scoped detail Query key for A/`case-17`, plus `verificationId` and read-attempt generation | TanStack Query, orchestrated by the coordinator | Explicitly executed and awaited; invalidation alone is insufficient because closing the drawer can remove the only observer. |
| Verification failure/result presentation | same A/entity/attempt/verification identity | Workspace coordinator, rendered in the workspace shell outside the portal | Remains visible and recoverable across close/reopen. Never rendered in B. |
| Authoritative case data | context-scoped case-detail Query key | TanStack Query | A and B use distinct keys. A work is canceled/fenced and A cache removed on context loss. |
| Retry timer | N/A in the replacement contract | None | The proposed five-second automatic retry is rejected because no retry policy was accepted. |

The coordinator’s UI state machine is:

`idle → submitting → verifying → verified`

with non-success branches:

- `submissionFailed`: visible, not terminal success, and no automatic resubmission;
- `verificationFailed`: mutation was accepted, but the outcome is not confirmed; expose an explicit “retry verification” action that repeats only the authoritative read.

A retry increments the read-attempt generation under the same `verificationId`; it must not resubmit the mutation. Exact error copy and the domain predicate that constitutes “confirmed outcome” remain project-owned. The test should use an opaque fixture explicitly designated as the accepted confirming reread, not invent case fields.

### Required transition contract

1. Submit captures immutable context A, entity, route, and attempt identities. Async callbacks never derive their destination from the later “current context.”
2. While the mutation is pending, the workspace-level status is visible even if the drawer closes.
3. Mutation acceptance creates a verification obligation and begins an explicit authoritative detail reread for the captured A key.
4. Acceptance alone never enters `verified`.
5. A failed reread enters `verificationFailed`, preserving the accepted-write distinction and exposing manual verification retry.
6. Closing and reopening the portal reads the same coordinator state; it neither starts a new write nor loses the verification result.
7. On switch to B:
   - revoke/fence A’s coordinator generation before rendering B;
   - cancel abortable A reads and remove A-scoped Query data;
   - clear A presentation state;
   - ignore all later reducer events and cache writes carrying A’s revoked generation;
   - never use a cache helper that resolves the key from the current B context.
8. A late transport completion may settle, but cannot update B, reintroduce A cache, or render A status.

Client scoping and cleanup support isolation; they are not authorization controls.

## Behavior-focused test plan

Use the existing Vitest, Testing Library, fresh real QueryClient, memory router, production portal provider, controlled promises at the existing API/Query seam, and fake timers. Add no dependency or harness.

### Scenario 1: success is gated by authoritative reread

**Arrange**

- Create a fresh QueryClient with test retries disabled.
- Seed only the A/`case-17` detail key.
- Render workspace A, coordinator, router, and production portal provider.
- Control the mutation response and authoritative reread with separate deferred promises.

**Act**

1. Open the drawer, edit, and submit.
2. Keep the mutation pending; close and reopen the drawer.
3. Resolve the mutation as accepted, leaving the reread pending.
4. Close and reopen again.
5. Resolve the reread with the fixture designated as the confirming authoritative result.

**Assert**

- Workspace status is visible while submitting even with the drawer unmounted.
- Remount does not issue another mutation.
- After mutation acceptance, terminal success is absent and verification status is visible.
- Remount does not issue an extra reread or lose the same active operation.
- Terminal success appears only after the confirming reread.
- The verified result remains associated with A/`case-17` across drawer remount.
- Mutation request count remains exactly one.

### Scenario 2: combined remount, reread failure, retry, context switch, and late response

**Arrange**

- Fresh isolated QueryClient/router/provider.
- Seed A/`case-17`; optionally seed distinguishable B data to detect overwrites.
- Prepare:
  - one accepted mutation response;
  - first authoritative reread rejection;
  - second, manually triggered reread deferred past the context switch.
- Enable fake timers.

**Act**

1. Submit in A and observe workspace-level pending status.
2. Close/reopen the drawer while active.
3. Resolve mutation acceptance.
4. Reject the first reread.
5. Close/reopen the drawer.
6. Advance time beyond five seconds without clicking recovery.
7. Click the visible verification-retry control.
8. While the second A reread is pending, navigate/switch to B.
9. Resolve the late A reread even if the controlled promise ignores abort.
10. Flush microtasks and all controlled timers.

**Assert**

- Pending status survives the first portal remount.
- Accepted mutation never produces success by itself.
- Reread failure is a visible, recoverable non-success state outside the drawer.
- That failure/result survives portal remount.
- Advancing time triggers neither another read nor another mutation; there is no unsupported automatic retry timer.
- Manual retry increases only the reread count; mutation count stays one.
- Immediately after switching to B, no A case content or A operation status is visible.
- B data/status is unchanged after the late A response settles.
- The public QueryClient surface contains no repopulated A detail entry after cleanup/fencing.
- No stale A callback changes the current B presentation.
- No pending timer remains.

### Scenario 3: mutation acceptance remains distinct from submission failure

Use the project’s accepted typed mutation-error fixture if one exists.

**Assert**

- A rejected/failed write never begins authoritative verification.
- No terminal success is shown.
- No automatic mutation retry occurs.
- The UI does not claim whether the backend committed when the accepted error contract cannot establish that fact.

Do not invent a manual mutation-retry or idempotency rule in this test.

### Deterministic cleanup

For every test:

1. Settle or explicitly reject every deferred promise before teardown.
2. Cancel outstanding Query work, unmount the React tree, and dispose router subscriptions.
3. Clear the per-test QueryClient after late-response assertions.
4. Run Testing Library/portal cleanup and remove portal containers.
5. Assert no pending fake timers, then restore real timers.
6. Restore all stubs/mocks and ensure no unhandled rejection or post-unmount update warning occurred.
7. Do not introduce Zustand, Dexie, storage, listener, or worker cleanup because this smallest contract does not use them.

## Evidence limits and anti-claims

Passing these Testing Library tests would prove the exercised local DOM, portal-remount, workflow-state, scoped-cache, timer, and late-promise behavior against controlled client responses. It would not prove:

- real browser portal/focus behavior;
- real transport cancellation;
- backend authorization, idempotency, retry, or mutation semantics;
- that a successful real reread satisfies the domain’s confirmation predicate;
- end-to-end context isolation or production behavior.

A material business-data submission claim still requires real-browser coverage and the corresponding integrated service boundary. No such harness or execution was authorized here. Query keys, a reducer, invalidation, mocks, or green component tests are not themselves delivered production capability.

Next owner: `typescript-test-engineer` should map this behavior contract onto the repository’s existing test APIs and runner conventions; the SPA implementer should preserve the ownership and fencing contract without adding a global store or automatic retry policy.

### Self-assessment

High confidence in the lifetime ownership, removal of drawer-local status, explicit verification gate, and combined falsifier. The main unresolved inputs are intentionally exposed: installed library versions, typed API errors, the domain confirmation predicate, and any accepted retry/idempotency contract. No backend behavior was inferred and no files were changed.
```

## Coordinator-only rubric and verdict

| Expected decision | Observed | Result |
| --- | --- | --- |
| Separate route/access/entity/attempt/verification identities and owners. | Lifetime matrix names each and the context-loss rule. | PASS |
| Move observable operation lifetime above disposable portal child. | Workspace coordinator is the smallest proposed owner. | PASS |
| Separate transport success from authoritative reread. | State machine and positive scenario require reread confirmation. | PASS |
| Combine pre-populated cache, remount, reread failure, context switch, timers, and late response. | Scenario 2 combines all applicable dimensions; unsupported auto-retry is explicitly falsified. | PASS |
| Define deterministic teardown and honest evidence limits. | Promises, queries, portal, timers, mocks, warnings, browser/backend limits are covered. | PASS |

Aggregate blind verdict: `PASS`. The output is a design contract, not implementation or production evidence.
