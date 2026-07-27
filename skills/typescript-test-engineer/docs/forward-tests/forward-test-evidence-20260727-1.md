# Blind forward-test evidence

## Basis

- Date: 2026-07-27.
- Candidate: `typescript-test-engineer` source-version `0.1.8`; package version unchanged.
- Evaluator: fresh agent with no forked conversation turns.
- Read boundary: generated `SKILL.md`, triggered `references/react-vitest.md`, and raw mutation fixture only.
- Side effects: design-only and read-only.

## Exact evaluator prompt

```text
Use $typescript-test-engineer from /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05/skills/typescript-test-engineer to design the smallest sufficient React test strategy for /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05/skills/typescript-test-engineer/evals/fixtures/mutation-lifetime-input.md. This is design-only and read-only; do not edit files or invent backend behavior.

You may read only:
- skills/typescript-test-engineer/SKILL.md
- skills/typescript-test-engineer/references/react-vitest.md
- the supplied mutation-lifetime-input.md fixture
Do not read skill.yaml, evals/evals.json, docs, Git diff/history, other skills, or any other repository file. Return the actual behavior-focused test plan with ownership/lifetime assumptions, Arrange-Act-Assert, deterministic cleanup, and evidence limits, then a brief self-assessment.
```

The absolute paths record the local execution and are not active portable dependencies.

## Complete observed output

```text
Mode: design-only, read-only. No files changed and no tests run.

## Capability and anti-claims

The capability is not “the drawer submits successfully.” It is that a case-edit attempt and its authoritative verification have a lifetime longer than the disposable drawer, while remaining strictly scoped to access context A.

The proposed drawer-local `isSaving` and `verificationError` are substrate and are expected to fail this contract after remount. Separate green tests for submit, cache invalidation, remount, timer, or route switch would not prove the combined lifetime behavior.

## Ownership and lifetime assumptions

- The drawer is disposable; it must not own the authoritative operation lifetime.
- The logical attempt is scoped by at least `(access context A, case-17)`.
- Mutation acceptance and authoritative reread confirmation are distinct observable phases.
- Pre-populated cache data cannot itself confirm the new write.
- Retry work and late responses retain their originating context A; they cannot update the currently visible context B.
- Exact implementation ownership—provider, query state, route owner, or another coordinator—is intentionally not asserted. The test only requires ownership above the drawer instance.
- Backend retry, idempotency, persistence, and authorization behavior remain unspecified and are not test oracles.

## Smallest sufficient contour

Use two React integration tests in the existing Vitest DOM environment. Mount the smallest production composition containing:

- a real per-test `QueryClient`;
- memory router with access-context routes;
- production portal provider;
- the workspace-level owner and real drawer;
- a deterministic transport boundary mock with deferred mutation/reread responses.

No new dependency or harness is needed.

### 1. Positive lifetime test

Test intent: “keeps an accepted edit unconfirmed across drawer remount until the same-context authoritative reread succeeds.”

**Arrange**

- Pre-populate context A’s `case-17` detail with an unmistakable old value.
- Prepare separate deferred promises for mutation acceptance and authoritative reread.
- Render context A, open the drawer, edit the field, and use production semantic roles/names rather than invented copy.

**Act and Assert**

1. Submit.
2. Assert the workspace exposes an active operation state while mutation transport is pending.
3. Resolve mutation acceptance.
4. Assert no terminal confirmation is shown merely because the mutation resolved or old cache exists.
5. Let the drawer close/unmount, then reopen it before the reread resolves.
6. Assert the active/verification-pending operation remains observable after the fresh drawer instance mounts.
7. Resolve the authoritative reread with the updated A value.
8. Assert the authoritative value is visible and the UI no longer presents the operation as pending or unverified.

This focused positive test proves the “until confirmed” transition without diluting the combined failure falsifier.

### 2. Mandatory combined lifetime falsifier

Test intent: “preserves failed verification across portal remount and prevents a timed late A reread from contaminating B.”

**Arrange**

- Enable fake timers before render.
- Pre-populate `case-17` in A and a distinguishable permissible value in B.
- Prepare deferred mutation acceptance.
- Make the first authoritative A reread reject.
- Make the five-second retry reread a deferred response containing a unique late-A value.
- Render context A through the real Query/router/portal composition.

**Act and Assert**

1. Submit the edit and assert visible pending status.
2. Resolve mutation acceptance; assert the drawer closes but the workspace still shows verification in progress, not terminal success.
3. Reopen the drawer and assert the active attempt survived remount.
4. Reject the first authoritative reread.
5. Assert a visible, recoverable non-success state:
   - mutation acceptance is not reported as confirmed;
   - old cached A data is not treated as verification;
   - the verification result survives another close/reopen.
6. Advance exactly the application’s controlled five-second timer to start the A retry; do not use real time.
7. While that A reread is outstanding, navigate to context B.
8. Assert B shows only B data and no operation status, verification error, or success state from A.
9. Resolve the late A reread with its unique value and flush resulting microtasks.
10. Reassert that B remains unchanged and exposes neither A data nor A operation status.
11. Unmount the complete composition and verify no timers or unsettled async work remain.

This single scenario must stay combined. Splitting cache, remount, reread failure, timer, late response, and context switch into independent tests would allow the actual lifetime defect to escape.

## Deterministic cleanup

- Use deferred helpers that record settlement; never use permanently pending promises.
- Settle or reject every mutation and reread deferred before test completion.
- Drive fake timers through the repository-compatible `userEvent`/Vitest timer integration.
- Flush only expected timers and microtasks; assert no pending timer remains.
- Unmount/RTL-cleanup the portal tree.
- Cancel outstanding queries and clear the per-test `QueryClient` using its repository-supported lifecycle.
- Restore mocks/globals and call `vi.useRealTimers()` in `afterEach`/`finally`.
- Require warning-clean execution with no unhandled rejection or post-unmount update.
- Run the repository’s existing targeted Vitest command; its exact script is unknown under the authorized read boundary.

## Evidence limits

These tests would prove client-side lifetime, remount survival, stale-cache resistance, and context isolation within the mounted React/Query/router/portal composition. They would not prove backend persistence, idempotency, authorization, RLS/RPC, production retry semantics, deployed routing, or browser-native portal/layout/focus behavior. A simulated-DOM result must not be called browser or E2E evidence.

Self-assessment: two tests are the smallest sufficient set—one positive confirmation transition and one mandatory combined failure/isolation falsifier. The plan is decision-complete at the behavior level, but exact UI queries, query keys, mount helper, and command cannot be named without reading repository files that were explicitly out of scope.
```

## Coordinator-only rubric and verdict

| Expected decision | Observed | Result |
| --- | --- | --- |
| Define the logical lifetime above the disposable portal child. | Ownership assumptions require a workspace-level owner. | PASS |
| Separate route/access/entity/attempt/verification-sequence identities and owners. | The output scopes only context A and `case-17`, declines exact ownership, and provides no matrix or distinct attempt/verification identities. | FAIL |
| Include one combined pre-populated-cache, remount, reread-failure, context-switch, timer, and late-response falsifier. | Scenario 2 contains the complete sequence. | PASS |
| Prevent A state/data leakage into B and keep failure visible/recoverable. | Both are explicit assertions. | PASS |
| Settle deferred work and restore timers/globals. | Cleanup contract is deterministic and warning-clean. | PASS |
| Avoid invented backend or browser claims. | Backend, RLS/RPC, routing, and browser limits are explicit. | PASS |

Aggregate blind verdict: `FAIL`. The combined scenario and cleanup are useful, but they do not close the required identity/owner matrix or stale cross-attempt completion path. This remains test-design evidence, not executed app-test evidence.
