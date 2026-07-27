# Blind forward-test evidence after P1 remediation

## Basis

- Date: 2026-07-27.
- Candidate: uncommitted remediation after reviewed commit `5f00e00d5c648a2899a50f5bee52b4cc18f135f6`; exact commit/content identity was not captured, so this run is not closure evidence for a stable snapshot.
- Evaluator: fresh no-fork agent that did not perform the initial run or independent review.
- Read boundary: generated `SKILL.md`, `references/react-vitest.md`, and raw mutation fixture only.
- Prohibited inputs: `skill.yaml`, `evals/evals.json`, docs, Git diff/history, other skills, prior finding, prior output, and coordinator rubric.
- Side effects: design-only and read-only.

## Exact evaluator prompt

```text
Use $typescript-test-engineer from /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05/skills/typescript-test-engineer to design the smallest sufficient React test strategy for /home/kostysh/.codex/skills/custom/.worktrees/retro-0003-step-05/skills/typescript-test-engineer/evals/fixtures/mutation-lifetime-input.md. This is design-only and read-only; do not edit files or invent backend behavior.

You may read only:
- skills/typescript-test-engineer/SKILL.md
- skills/typescript-test-engineer/references/react-vitest.md
- the supplied mutation-lifetime-input.md fixture
Do not read skill.yaml, evals/evals.json, docs, Git diff/history, other skills, or any other repository file. Return the actual behavior-focused test plan with the required ownership/lifetime matrix, Arrange-Act-Assert, deterministic cleanup, and evidence limits, then a brief self-assessment.
```

The absolute paths record the executed local run and are not active portable dependencies.

## Complete observed output

```markdown
Design mode, read-only. The fixture describes a real client capability, not merely test substrate: operation status must survive drawer remount, authoritative reread must determine success, access contexts must be fenced, and stale completion must not supersede a newer attempt.

The proposed drawer-local ownership cannot satisfy that capability by construction: `isSaving` and `verificationError` disappear with the disposable drawer, while an uncancelled A timer and a “current cache” updater can cross into B. This plan proves that behavior without prescribing a production fix.

## Smallest sufficient contour

One React component-integration test in the existing simulated DOM Vitest contour, using:

- a real per-test `QueryClient`;
- the memory router;
- the production portal provider;
- Testing Library/user-event;
- fake timers;
- boundary-level deferred mutation and reread responses.

Suggested behavior-focused test name:

> keeps attempt state across drawer remount, treats accepted mutation plus failed reread as recoverable non-success, and fences a late A verification from B and a newer A attempt

A single combined scenario is necessary. Separate green cache, remount, timer, and context-switch tests could all pass while missing the actual lifetime race. The scenario includes the eventual successful path through attempt 2, so a separate happy-path test is not needed for this narrow risk.

## Ownership/lifetime matrix

Test labels such as `attempt-1`, `attempt-2`, `verification-1`, and `verification-2` are client-side test notation only. They must not be sent as backend idempotency keys or presented as a server contract.

| Element | Required identity and source | Required state owner/lifetime assumption | Survives drawer remount? | Context-loss disposition | Late-completion rule |
|---|---|---|---|---|---|
| Route | Workspace route/access transition A → B → A. Source: accepted behavior requires workspace-visible status and says switching to B must not expose A. Exact route path is not supplied. | The rendered test owner must be the smallest real workspace/router composition that persists beyond the drawer. The concrete component is not supplied. | Yes, for active attempt/verification state. | Leaving A may retain fenced A state or discard it while retaining a stale-generation fence; the fixture does not choose. It must not render A state in B. | Work started under an earlier route/access lifetime cannot update the currently visible route or confirm later work. |
| Access scope | Access context A versus B. Source: accepted behavior explicitly names both and forbids A data/status in B. | Query data and operation state must be partitioned by access identity at an owner above the portal child. A real per-test `QueryClient` participates, but the concrete operation-status owner is unspecified. | Yes. | A data/status must be absent from B presentation; internal retain-versus-cancel is not asserted. | An A response settling while B is active cannot populate B cache or B-visible status. |
| Entity | `case-17` within access context A. Source: accepted behavior. Identity is therefore at least `(access context, case-17)`, not bare `case-17`. | Detail cache and operation state belong to the access-scoped entity, not the drawer instance. | Yes. | A’s `case-17` data must not become B’s entity data. The fixture does not say whether B contains the same ID. | An old result for `(A, case-17)` cannot overwrite the entity state associated with a newer attempt. |
| Client attempt | Distinct test generations `attempt-1` and `attempt-2`. Source: accepted behavior says every submit is distinct. | A stable workspace/access/entity-scoped operation owner must distinguish attempts; drawer-local state is insufficient. | Yes. | It must be hidden from B. Whether it is retained or invalidated on switch is implementation freedom, provided stale work remains fenced. | Completion belonging to attempt 1 cannot settle, overwrite, or confirm attempt 2. |
| Outcome verification | `verification-1` under attempt 1 and `verification-2` under attempt 2. Source: accepted behavior separates accepted write from authoritative reread and gives each attempt its own verification sequence. | The same stable owner, or another owner with equivalent lifetime and identity fencing, must track verification independently of mutation transport state. | Yes. | Verification status/results from A cannot appear in B. | A late verification-1 response cannot confirm attempt 2; only verification-2 may produce attempt-2 terminal success. |

The design is limited on one implementation detail: no allowed source names the concrete stable state owner or exact accessible UI contract. The test must render the real smallest owner that fulfills this matrix; it must not fabricate a test-only global store.

## Arrange

1. Enable fake timers and configure `userEvent` with the runner’s fake-timer advancement hook.
2. Create a fresh real `QueryClient`, memory router initially in context A, and production portal provider.
3. Seed only the real A/`case-17` detail query with a valid existing production-shaped fixture carrying a recognizable A value. Do not invent a new schema field. Leave B unseeded unless an authoritative existing fixture provides B data.
4. Install controlled boundary responses:

   - attempt-1 mutation transport;
   - verification-1 initial reread, which will reject;
   - verification-1 timed retry, held pending;
   - attempt-2 mutation transport;
   - verification-2 authoritative reread.

5. Route responses by test-controlled call sequence/generation. Do not add attempt IDs to production requests.
6. Render the real workspace composition and open the portal drawer.

## Act and Assert

1. Submit attempt 1 and assert a user-visible pending operation state at workspace lifetime, not merely a disabled drawer button.
2. Close/unmount the drawer while the mutation is unresolved.

   - Assert pending status remains visible.
   - Reopen the drawer and assert the same active attempt is still represented; it has not reset to idle or terminal success.

3. Resolve the attempt-1 mutation transport successfully.

   - Assert transport acceptance alone does not show terminal success.
   - Assert the UI remains in a visible verification/pending state.

4. Reject the initial authoritative reread.

   - Assert a visible, recoverable non-success state.
   - Assert the pre-populated A cache is not interpreted as confirmation.
   - Close and reopen the drawer again and assert the verification failure remains represented.
   - Assert a later submit is available, because the accepted behavior permits another attempt after a recoverable result.

5. Switch to context B before the proposed five-second retry settles.

   - Assert no A case marker, A operation status, or A success state is visible in B.
   - Advance the controlled timer by the proposed delay only to start the pending verification-1 retry. The five-second value is implementation-proposal evidence, not a general backend retry contract.

6. Return to A and submit attempt 2 while the verification-1 retry remains unresolved.

   - Assert attempt 2 is the current pending attempt.
   - Assert it has its own verification lifetime and is not already confirmed by attempt 1’s cached/result state.

7. Switch to B again and resolve the late verification-1 retry with a valid but recognizably old A result.

   - Assert B still contains no A data or operation status.
   - Return to A.
   - Assert attempt 2 is still pending, no terminal success appeared, and the old verification-1 value did not overwrite the current entity presentation.

8. Resolve attempt-2 mutation transport successfully.

   - Again assert there is still no terminal success before its authoritative reread.

9. Resolve verification 2 with the valid new authoritative A result.

   - Only now assert terminal success for attempt 2.
   - Assert the new authoritative entity value is visible.
   - Assert the old attempt-1 value/status remains absent.

All UI assertions should use the existing accessible contract—visible text, `status`, `alert`, buttons, or headings—not component state, implementation callbacks, or newly invented test IDs. Exact Italian labels/roles must be taken from an authoritative UI source before implementation; they are absent from the fixture.

## Deterministic cleanup

Before the test finishes:

1. Resolve or reject every registered deferred response and flush resulting microtasks.
2. Advance or settle all intentionally started timer work.
3. Assert `vi.getTimerCount() === 0` before emergency cleanup; merely calling `clearAllTimers()` would hide a production cleanup defect.
4. Unmount the rendered workspace and flush teardown.
5. Assert that settling any already-controlled late callback cannot produce an update-after-unmount warning, unhandled rejection, or cache/status mutation.
6. Clear the per-test `QueryClient`.
7. In `afterEach`/`finally`, restore real timers, mocks, spies, and globals, and use a deferred registry safety cleanup so a failing assertion cannot leave unresolved promises or hang the worker.

No worker, storage, or separately registered listener is present in the supplied stack; those cleanup rows are `N/A` unless the real composition introduces them. Portal and Testing Library teardown remain applicable.

## Evidence limits and anti-claims

This test can prove client-visible ownership, remount persistence, access-context presentation fencing, ordering of transport versus verification, stale-generation rejection, and deterministic teardown within the real Query/router/portal composition.

It cannot prove:

- backend persistence or authoritative database state;
- backend retry policy or idempotency;
- server authorization, tenant isolation, RLS, or RPC behavior;
- real-network behavior;
- browser-native portal layout, focus, CSS, or browser API behavior;
- deployed-route behavior;
- exact route names, concrete state-owner component, or accessible copy absent from the fixture.

The proposed five-second timer is exercised as the supplied stale-work source; the test must not turn it into a broader backend retry requirement. B is asserted only not to expose A; no B case existence or backend response is invented.

Validation should use the repository-native targeted Vitest command and then its existing relevant client suite. Exact script and test path cannot be named from the permitted inputs and should not be fabricated. A passing simulated-DOM run is bounded client integration evidence, not browser-native or backend evidence.

Self-assessment: the plan is behavior-complete for the supplied mutation-lifetime risk and intentionally uses one combined falsifier with a final successful attempt. It is `limited`, not blocked: implementation still requires authoritative identification of the stable workspace owner and existing accessible UI labels, neither of which is present in the allowed sources.
```

## Coordinator-only rubric and verdict

The evaluator did not receive these expectations.

| Expected decision | Observed | Result |
| --- | --- | --- |
| Populate route/access/entity/client-attempt/verification-sequence identities, owners, remount lifetime, context-loss disposition, and late-completion rule. | All required rows and columns are explicit. | PASS |
| Keep test-local generations separate from backend idempotency. | Labels are explicitly test notation and never enter production requests. | PASS |
| Use one combined pre-populated-cache, remount, reread-failure, A→B switch, timer/late-response, and distinct-attempt scenario. | One scenario covers the entire sequence through successful attempt 2. | PASS |
| Prevent A→B leakage and stale attempt-1 completion from settling attempt 2. | Both are separately asserted before verification 2 may succeed. | PASS |
| Preserve visible recoverable reread failure and deterministic cleanup. | Failure/remount behavior, deferred registry, timers, QueryClient, globals, warnings, and teardown are explicit. | PASS |
| Avoid backend, browser, route, owner, and UI-copy invention. | Output is honestly `limited` and names every unverified boundary. | PASS |

Content verdict: `PASS`; stable-snapshot closure verdict: `INCONCLUSIVE`. The output covers the sampled P1 failure path, but the candidate identity is incomplete. This remains bounded design evidence rather than executed application behavior.
