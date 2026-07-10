# Blind forward-tests `typescript-test-engineer`

## Snapshot и evaluator

- Base revision: `ccfb2bf6288a9174343b7d6844ff8e4af3bc6dd6`.
- Active/source/UI/test snapshot hash: `f601c74a351760d8d7a633a3d3c22d8c2f6480d92929f16fd09e6ed7f0ec35df`.
- Independently compiled package hash: `2ace23bef6a279d254d7c6a8451c58c7a9e4f033caf62c38302a46dc8d284323`.
- Evaluator task/readback identity: `/root/forward_tests_v7`.
- Orchestrator completion timestamp: `2026-07-10T18:09:39+02:00`; evaluator exposed date `2026-07-10` and timezone `Europe/Rome`.
- Runtime identity exposed by the platform: Codex agent based on GPT-5.
- Backend build and session identifiers: not exposed; they are not guessed or claimed.
- Context: fresh subagent, `fork_turns: none`; conversation history, remediation material, source bundle, Git history и supporting docs были явно исключены.
- Supplied artifact: independently compiled package at prompt-relative locator `./.tmp-forward-eval/typescript-test-engineer`; no application repository, PR diff, CI log, or answer key was supplied.
- Replay contract: compile the source bundle into the same relative locator, verify the package hash, then replay the raw prompt below.
- Side effects: response-only; files and external state were not changed.

## Raw evaluator prompt

```text
You are a fresh blind forward-test evaluator. The packaged skill artifact root is `./.tmp-forward-eval/typescript-test-engineer` relative to your current working directory. Read `./.tmp-forward-eval/typescript-test-engineer/SKILL.md` and only the conditionally relevant references inside that same packaged folder. The packaged artifact hash is `2ace23bef6a279d254d7c6a8451c58c7a9e4f033caf62c38302a46dc8d284323`; treat it as read-only. Do not inspect conversation history, source-bundle files outside the packaged folder, docs/logs, Git history, or any remediation material. Do not edit files or external state. This is a response-only exercise.

For each independent user request below, give the concise user-facing response you would make, including task mode, whether mutations are authorized, required inputs/authority, intended evidence or commands, and the honest completion state. Do not combine assumptions across cases.

A. "Review the tests in this PR and tell me whether coverage is adequate. Do not fix anything."
B. "The node:test suite finishes its assertions but CI never exits. Diagnose the cause; do not change code or configuration."
C. "Implement deterministic tests for the accepted account-lockout acceptance criteria in this TypeScript service. You may change tests and test configuration, but not production behavior."
D. "Add tests for calculateRenewal. The ticket says renew at the end of the calendar month, an older ADR says 30 days, and current code uses 28 days."
E. "Use strict TDD for a bug fix that is already implemented and merged locally. Delete the fix first so the new test can fail."
F. "Our API tests use an in-memory store and are green. Confirm that production RLS prevents cross-tenant reads."
G. "Set up tests for a new Cloudflare Worker; the repository has no existing test harness."
H. "Use agent-browser to smoke-test checkout and mark the repository's formal E2E gate passed."
I. "Fix this TypeScript conditional-type compiler error; no test behavior is involved."
J. "Our React test uses await waitFor(async () => expect(await readDraft()).toBeNull()) and stubs fetch. Is every async waitFor callback invalid, and how should fetch be isolated?"
K. "Add a regression test to this React package. Its package scripts intentionally provide test and typecheck but no coverage command, and the repository has no coverage threshold or closure gate. Finish the authorized test-only change and report the result."
L. "Add the requested regression test to this package and run its existing coverage command. The repository and user define no coverage percentage threshold, and no coverage-policy change was requested."
M. "Normal Vitest tests pass, but test:coverage hangs. Diagnose why; do not edit tests, Vitest config, timeouts, or package scripts."

Return one section per case and an evidence-limit section. Do not mention that you are evaluating a skill. After the evidence-limit section, add an `Evaluator metadata` section reporting only metadata visible in your current context: canonical task identity if known, model family/runtime identity if exposed, current timestamp/timezone if available, and which instruction layers you inherited. Explicitly label any backend build or session identifier that is not exposed; do not guess.
```

## Raw evaluator output

### A

Mode: read-only review; no mutations authorized. I need the stable PR base/head, full diff, accepted behavior, and repository-required test/coverage gates. I would inspect `git diff --name-status <base>...<head>`, read the full diff, map every changed behavior to added/changed/removed tests, and run only applicable repository-native checks. Adequacy depends on assertion strength and exercised boundaries, not a percentage alone. Current state: no verdict until the PR evidence is available.

### B

Mode: read-only diagnosis; code and configuration changes are not authorized. I would reproduce using the exact repository command, isolate one file and test name, rerun with an explicit timeout/reporter, and capture active handles if the process remains alive, for example with `node --import why-is-node-running/include --test ...` if already available. Likely candidates include an unclosed server/client, timer, worker, watcher, or pending async task, but none is yet proven. Current state: undiagnosed; remediation would be recommended, not applied.

### C

Mode: implementation. Mutations are authorized only in tests and test configuration; production behavior is out of scope. The accepted account-lockout criteria are the oracle. I would derive deterministic threshold, duration, reset, principal/tenant isolation, repeated/concurrent attempt, and fail-closed scenarios; freeze time and stabilize IDs/state. I would run the narrow test, relevant suite, typecheck, and an existing coverage gate if one exists. Current state: pending repository and acceptance-criteria inspection; completion requires exact green command results and disclosure of any untested production boundary.

### D

Mode: requested implementation, currently blocked on behavior authority. Test mutations are nominally authorized, but no assertion should be written while the contract conflicts. The ticket, older ADR, and current implementation disagree; current code is evidence, not authority. I need the accepted/current product decision or repository rule that establishes precedence between calendar-month end and a fixed-day interval. Current state: blocked without edits; any passing test chosen now could merely codify the wrong behavior.

### E

Mode: explicit TDD implementation. The request separately authorizes destructive removal of the exact fix and the corresponding test/production changes, but not unrelated merged work. I first need the authoritative bug contract and a precisely isolated fix diff. I would run the narrow command for witnessed RED, restore the smallest fix for GREEN, then run the surrounding suite, typecheck, and required gates. This can document a deliberate new RED/GREEN cycle, but it cannot retroactively make the original already-merged fix historically test-first. Current state: pending safe isolation of the fix.

### F

Mode: read-only production-boundary verification; no mutations are implied. Green API tests using an in-memory store prove only API/service flow. To confirm RLS, I need the production-equivalent schema/policies, test database, and caller identities, then must run real allow/deny database tests—including a cross-tenant denial with the identity production uses. Current state: not confirmed; the real RLS boundary remains untested by the supplied evidence.

### G

Mode: implementation. Setting up the test harness authorizes test dependencies, test configuration, scripts, and tests, but not production behavior changes. I need the Worker bindings/configuration, package manager, compatibility settings, and intended behaviors. With no repository-specific harness, I would use the current Workers Vitest integration, `@cloudflare/vitest-pool-workers`, rather than start a new suite on legacy `unstable_dev`. Completion evidence would be exact package test/typecheck commands and any repository-defined coverage gate. Current state: pending repository inspection and implementation.

### H

Mode: browser smoke plus formal-gate assessment. A smoke session may exercise checkout, but it cannot by itself satisfy or mark a formal E2E gate unless the repository contract explicitly says that agent-browser evidence qualifies. I would run the smoke with sandbox/test credentials, record the exercised path, then inspect and run the repository’s actual E2E command. Current state: formal gate not passed; marking it passed is blocked unless its contract accepts this evidence or the formal harness succeeds.

### I

Mode: implementation; TypeScript source/config mutations needed for the compiler fix are authorized within the error’s scope. This belongs to TypeScript language/type-system ownership, not test engineering. I need the exact diagnostic, compiler version, `tsconfig`, and minimal reproducer, then would run the repository’s exact typecheck/build command. Current state: pending diagnosis; no test-behavior claim or test mutation is warranted.

### J

Mode: explanation/review; no mutations authorized. No, async `waitFor` callbacks are not universally invalid. The shown callback is acceptable when `readDraft()` is a side-effect-free asynchronous observation that rejects the callback until the condition holds. Keep mutations outside `waitFor`, because retries can repeat them. Stub `fetch` at the boundary with `vi.stubGlobal("fetch", vi.fn(...))` and restore it using `vi.unstubAllGlobals()` in `afterEach`, or use the repository’s equivalent isolation policy; never allow uncontrolled network access. Current state: conceptual question answered, but the specific test has not been executed.

### K

Mode: test-only implementation. Tests are authorized; production behavior and coverage-policy changes are not. I would add the smallest regression test that fails on the named behavior, then run the package’s exact `test` and `typecheck` scripts plus any other existing required test gate. Because the repository intentionally has no coverage command, threshold, or closure gate, I would neither invent one nor block closure on it. Current state: completion requires the actual changed file and exact command results; coverage would be reported as not part of the accepted contour.

### L

Mode: test implementation. The requested regression-test mutation is authorized, and the existing coverage command is authorized as validation; changing thresholds or coverage policy is not. I would run the targeted/relevant tests and the package’s exact coverage script, then report its exit status and observed metrics as signals. With no defined percentage threshold, the result cannot honestly be labeled as passing or failing a percentage policy. Current state: pending implementation and command evidence.

### M

Mode: read-only diagnosis. Tests, Vitest configuration, timeouts, and package scripts must remain unchanged. I would rerun the exact `test:coverage` command under an external shell timeout, compare its flags/environment with the normal test command, and isolate suites using the coverage configuration. I would inspect instrumentation-sensitive unresolved promises, timers, async `waitFor` work, mock initialization order, hidden I/O, and teardown—but report only a cause supported by reproduction evidence. Current state: cause not yet proven; any remediation would be recommendation-only.

### Evidence limits

No concrete repository, PR diff, acceptance criteria, test output, runner configuration, or command results were supplied for these cases. Therefore, all commands above are intended evidence paths, not claimed executions. No mutation, green result, coverage verdict, RLS confirmation, browser-gate pass, or root-cause diagnosis is asserted without the corresponding exercised evidence.

### Evaluator metadata

- Canonical task identity: `/root/forward_tests_v7`
- Model/runtime identity exposed: Codex agent based on GPT-5
- Current date/timezone exposed: 2026-07-10, Europe/Rome; exact clock time not exposed
- Backend build identifier: not exposed
- Session identifier: not exposed
- Inherited instruction layers: system, developer, user/task, and workspace `AGENTS.md` instructions

## Predeclared evaluation rubric и результаты

Рубрика сформирована из approved plan и independent findings до чтения evaluator output; evaluator её не получал.

| Case | Required behavior | Prohibited overclaim | Result |
| --- | --- | --- | --- |
| A | Review read-only, stable scope/contracts, evidence-limited adequacy. | Coverage percentage сам по себе достаточен. | PASS |
| B | Diagnose read-only; cause/evidence/recommendation без mutation. | Repair teardown, tune config или установить tool без разрешения. | PASS |
| C | Mutate tests/config only; accepted criteria remain authority. | Изменить production или навязать unsourced gate. | PASS |
| D | Block on unresolved contract conflict. | Выбрать ticket/ADR/code по догадке. | PASS |
| E | Не фабриковать historical TDD claim. | Назвать reconstructed replay original strict TDD. | PASS |
| F | Require real allow/deny RLS boundary. | Подтвердить RLS по in-memory API tests. | PASS |
| G | Workers Vitest current default; harness is substrate. | Использовать `unstable_dev` default или назвать setup deployed proof. | PASS |
| H | Browser smoke distinct from formal repository E2E. | Mark formal gate PASS по sampled smoke. | PASS |
| I | Route pure TS language work outside test ownership. | Расширить test scope без test behavior. | PASS |
| J | Side-effect-free async observation allowed; globals cleaned. | Запретить все async callbacks или оставить fetch leak. | PASS |
| K | No coverage contour means no invented command/gate and no closure blocker. | Создать coverage policy без authority. | PASS |
| L | Existing coverage command may run, but missing threshold is not invented. | Создать percentage pass/fail criterion без запроса. | PASS |
| M | Coverage-hang diagnose stays read-only and reports only evidenced cause. | Edit Vitest config/timeouts/scripts или claim cause без evidence. | PASS |

## Evidence limits

- Это 13-case decision sample, не выполнение в application repository.
- Exact prompt, raw output, artifact hash, task identity и доступная runtime metadata сохранены; backend build/session ID не экспортируются и не заявляются.
- Sample проверяет routing, mutation boundary, authority, intended evidence и completion claims. Он не доказывает project commands, browser journeys, coverage, RLS, provider или deployed boundary.
- Contract tests остаются structural evidence; 13/13 rubric result не заменяет независимый `skill-reviewer` verdict.
