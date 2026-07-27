# Exact-snapshot blind forward-test evidence

## Basis

- Date: 2026-07-27.
- Exact candidate commit: `7cc9a07a09bb6cb5712e4da66710cd057b8414a7`; tree `af2414295a66c2bf81503773e12ea223ace3f8e9`.
- Evaluator independently confirmed the supplied HEAD and empty `git status --porcelain` before reading.
- Allowed-file SHA-256 at that commit:
  - `SKILL.md`: `bd461178cbbb087e9db52d50e231aef36203e374610e27ad9600499c61874560`;
  - `references/react-vitest.md`: `ecee5e6c82724b9f6e40f11c51529a7d4d92cefd997bfbeb4e58241b9ec4bc99`;
  - `evals/fixtures/mutation-lifetime-input.md`: `e77be1de41b434a8e0602a075cadf3c209eb9ca1b7da11d5575b9b898fd3aac4`.
- Evaluator: fresh no-fork agent that did not perform either previous TS blind run or any independent review.
- Read boundary: the three hashed files plus read-only `git rev-parse/status` for snapshot confirmation.
- Prohibited inputs: `skill.yaml`, `evals/evals.json`, docs, Git diff/history, other skills, prior findings/outputs, and coordinator rubric.
- Side effects: design-only and read-only; no files or external state changed.

## Exact evaluator prompt

```text
Stable snapshot identity for this read-only run: repository /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05 at exact commit 7cc9a07a09bb6cb5712e4da66710cd057b8414a7. Before reading, confirm HEAD equals that commit and status is clean; if not, stop as blocked.

Use $typescript-test-engineer from this snapshot to design the smallest sufficient React test strategy for skills/typescript-test-engineer/evals/fixtures/mutation-lifetime-input.md. This is design-only and read-only; do not edit files or invent backend behavior.

You may read only:
- skills/typescript-test-engineer/SKILL.md
- skills/typescript-test-engineer/references/react-vitest.md
- skills/typescript-test-engineer/evals/fixtures/mutation-lifetime-input.md
- read-only git rev-parse/status solely to confirm the supplied snapshot
Do not read skill.yaml, evals/evals.json, docs, Git diff/history, other skills, or any other repository file. Return snapshot confirmation, then the actual behavior-focused test plan with the required ownership/lifetime matrix, Arrange-Act-Assert, deterministic cleanup, and evidence limits, followed by a brief self-assessment.
```

The absolute path records the executed local run and is not an active portable dependency.

## Complete observed output

```markdown
## Snapshot confirmation

Confirmed read-only snapshot:

- Worktree: `/home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05`
- `HEAD`: `7cc9a07a09bb6cb5712e4da66710cd057b8414a7`
- `git status --porcelain`: empty
- Check exited successfully. The shell emitted harmless stream-FD warnings, but Git returned the expected commit and clean status.

Mode: design-only, read-only. No files changed and no tests run.

## Capability challenge

The capability is continuous, access-fenced operation status and authoritative outcome verification across portal remounts and asynchronous races.

The available QueryClient, router, portal provider, fake timers, mocks, and a green Vitest result are only substrate. They prove nothing unless one scenario exercises their combined lifetime.

The proposed drawer-local ownership is incompatible with the accepted capability: closing the drawer destroys `isSaving` and `verificationError`. An unfenced timer/current-cache helper also permits an A response to affect B or a newer A attempt.

Anti-claims:

- Mutation transport success is not outcome confirmation.
- Cached `case-17` data is not an authoritative reread.
- Client attempt labels are not backend idempotency keys.
- The test must not require backend retry, cancellation, or idempotency behavior absent from the accepted behavior.

## Smallest sufficient strategy

Add one React integration test using the existing Vitest/Testing Library stack, a real per-test QueryClient, memory router, and production portal provider. Mock only the API-client boundary with explicitly controlled deferred responses.

Suggested behavior-oriented name:

> keeps verification access-scoped across drawer remount and rejects late confirmation from an older attempt

One combined test is preferable to isolated cache, remount, timer, or context-switch tests because the defect exists in their interaction. The scenario ends with attempt 2 successfully verified, so it covers both the negative path and eventual happy path.

## Ownership/lifetime matrix

`attempt-1`, `attempt-2`, `verification-1`, and `verification-2` below are test notation only. They must not be sent to or asserted against the backend unless another authoritative contract defines such fields.

| Element | Required identity | Authority | Required state owner and lifetime | Survives drawer remount | Context-loss disposition | Late-completion rule |
|---|---|---|---|---|---|---|
| Route | Workspace/access route generation, e.g. A → B → A | Accepted context-switch behavior; memory router is test substrate | Workspace route composition owns visible presentation; drawer is disposable | Yes, while the workspace route remains active | Leaving A removes all A presentation from the active B route | Completion associated with an earlier route generation cannot mutate the current route presentation |
| Access scope | A or B | Explicit accepted behavior | Query and operation state must be fenced by access identity at or above the drawer | Yes | A state may be retained only as A-scoped state; it must be hidden and unable to populate B | Late A work may affect only valid A-scoped state, never B cache or status |
| Entity | `(access=A, case-17)` | Explicit accepted case and access identities | Detail cache belongs to the composite access/entity identity; operation status is keyed consistently | Yes | A’s `case-17` data is not readable as B’s entity state | A response cannot update an unscoped “current case” target or another access/entity |
| Client attempt | Test labels `attempt-1`, `attempt-2` | Accepted behavior says every submit is distinct | Workspace-level operation-lifecycle owner above the drawer distinguishes generations | Yes | It may remain controllable while hidden, but cannot appear in B; cancellation is unspecified | `attempt-1` cannot settle, overwrite, or confirm `attempt-2` |
| Outcome verification | Test labels `verification-1`, `verification-2`, each nested under its attempt | Accepted behavior says every attempt has its own verification sequence | Same durable operation owner, with verification generation subordinate to attempt generation | Yes | Verification for A cannot confirm anything in B | An older reread/retry cannot confirm a newer attempt or verification sequence |

The exact component/store implementing the durable owner is intentionally unspecified. The contract only requires ownership above the disposable drawer and proper access/entity/generation fencing.

## Arrange–Act–Assert

### Arrange

1. Enable fake timers and fixed system time.
2. Create a fresh real QueryClient using repository-standard test settings.
3. Pre-populate A’s detail cache for `case-17` with recognizable stale data.
4. Give B distinct sentinel state or no case data, so A leakage is observable.
5. Render the smallest production composition containing:

   - QueryClient provider
   - memory router
   - workspace-level operation presentation
   - production portal provider
   - case drawer/form

6. Prepare controllable deferred boundaries:

   - attempt 1 mutation transport
   - attempt 1 initial authoritative reread
   - attempt 1 timed retry reread
   - attempt 2 mutation transport
   - attempt 2 authoritative reread

7. Route responses by controlled call sequence and captured access/entity arguments. Do not add client-attempt fields to backend requests.

### Act and assert

1. In A, open `case-17`, edit it, and submit attempt 1.
2. While mutation transport is pending, assert a user-visible workspace operation status.
3. Close the drawer, then reopen it.

   Assert:

   - the active operation remains visible;
   - reopening does not create a new attempt;
   - the fresh drawer instance does not reset the operation to idle or success.

4. Resolve attempt 1’s mutation transport as accepted.

   Assert that terminal success is still absent: transport acceptance only starts/continues verification.

5. Reject attempt 1’s authoritative reread.

   Assert:

   - a visible recoverable non-success state appears;
   - stale pre-populated cache is not presented as confirmation;
   - no terminal-success presentation appears;
   - closing/reopening the drawer preserves the recoverable result.

6. Advance the controlled five-second fixture timer only far enough to start attempt 1’s retry reread; leave that reread pending. The five-second value drives this fixture and is not claimed as a product timing contract.
7. Navigate to B.

   Assert:

   - no A case details are visible;
   - no A operation status or verification error is visible;
   - B’s sentinel/cache state is unchanged.

8. Return to A and submit attempt 2 after the recoverable result. Resolve its mutation transport as accepted, but leave verification 2 pending.

   Assert the visible status belongs to the current attempt and remains non-terminal.

9. Resolve the older attempt 1 retry with authoritative-looking A data.

   Assert:

   - attempt 2 remains pending/verifying;
   - attempt 1 cannot produce success for attempt 2;
   - attempt 1 data cannot overwrite attempt 2’s current presentation or entity state.

10. Navigate to B again.

    Assert again that the settled late A response did not populate B data or status.

11. Return to A and resolve verification 2 with authoritative attempt-2 data.

    Assert only now:

    - terminal success is visible;
    - the displayed/cached A entity reflects verification 2;
    - neither stale initial data nor attempt-1 data won the race.

Use role/name/status queries and observable content. Do not assert hook calls, local state variables, or exact cache-update helper invocation unless such a call is independently contractual.

## Deterministic cleanup

Use `try/finally` or equivalent suite hooks so cleanup also occurs after assertion failure:

1. Resolve or reject every created deferred promise; never leave a never-settling mock.
2. Flush the final React/microtask turn with the runner’s supported `act` pattern.
3. Unmount the rendered tree.
4. Verify no application retry timer remains. Then clear any test-runner timers defensively.
5. Clear the per-test QueryClient after unmount.
6. Let Testing Library remove portal DOM.
7. Restore mocked globals/spies and real timers.
8. Inspect the run for React `act` warnings, unhandled rejections, stderr, and open-worker symptoms; none should be silently suppressed.

## Intended validation

Run the repository-native targeted Vitest command for the new suite, then the repository-defined client test contour if implementation is authorized. The exact command cannot be named from the allowed files because package scripts and Vitest configuration were deliberately outside this review boundary.

## Evidence limits

This test would prove only the React client’s observable ownership and race-fencing behavior under the configured test DOM and mocked API boundary. It would not prove:

- backend persistence, retry, cancellation, or idempotency;
- production authorization or access enforcement;
- real-network ordering;
- browser-native portal/layout behavior;
- deployment wiring;
- exact route paths, query keys, UI copy, or component names not supplied by the fixture.

Cancellation of outstanding A work on context switch is permitted but not required by this plan; the required result is that no completion can leak or overwrite across identities.

## Self-assessment

This is the smallest sufficient strategy because one integration scenario covers transport acceptance, authoritative reread failure, portal remount, recoverability, timer-driven late work, A/B isolation, newer-attempt fencing, eventual confirmation, and teardown. It is behavior-complete at the supplied contract level, but implementation mapping and executable command selection remain intentionally limited by the read boundary.
```

## Coordinator-only rubric and verdict

The evaluator did not receive these expectations, prior findings, or prior outputs.

| Expected decision | Observed | Result |
| --- | --- | --- |
| Confirm the supplied immutable candidate before reading. | Exact commit and clean status are reported. | PASS |
| Populate all required identity/owner/lifetime fields. | Route, access, entity, attempt, and verification rows include authority, owner, remount, context-loss, and late-completion columns. | PASS |
| Keep client generations separate from backend idempotency. | Labels remain test-only and never enter backend requests. | PASS |
| Exercise one combined cache/remount/reread-failure/context-switch/timer/late-response/cross-attempt path. | One A→B→A scenario ends only after verification 2. | PASS |
| Reject A→B leakage and attempt-1→attempt-2 false settlement. | Both are observable assertions. | PASS |
| Provide deterministic cleanup and bounded claims. | Deferreds, timers, unmount, QueryClient, globals, warnings, and backend/browser limits are explicit. | PASS |

Aggregate exact-snapshot blind verdict: `PASS`. This is sampled test-design behavior, not executed application or production evidence.
