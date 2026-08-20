# Testing Anti-Patterns

**Load this reference when:** writing or changing tests, adding mocks, or tempted to add test-only methods to production code.

**Mode boundary:** Examples labelled as fixes authorize no mutation by themselves. Apply them only in explicitly authorized implementation/fix mode; in design, review, or diagnose mode, report the recommended correction without editing files or external state.

## Overview

Tests must verify real behavior, not mock behavior. Mocks are a means to isolate, not the thing being tested.

**Core principle:** Test what the code does, not what the mocks do.

If the user explicitly requests TDD, its strict fail-first loop helps prevent these anti-patterns. Otherwise, use the gates below without switching the task into TDD mode.

## The Iron Laws

```
1. NEVER test mock behavior
2. NEVER add test-only methods to production classes
3. NEVER mock without understanding dependencies
```

## Anti-Pattern 1: Testing Mock Behavior

**The violation:**
```typescript
// X BAD: Testing that the mock exists
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**Why this is wrong:**
- You're verifying the mock works, not that the component works
- Test passes when mock is present, fails when it's not
- Tells you nothing about real behavior

**your human partner's correction:** "Are we testing the behavior of a mock?"

**The fix:**
```typescript
// OK GOOD: Test real component or don't mock it
test('renders sidebar', () => {
  render(<Page />);  // Don't mock sidebar
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

// OR if sidebar must be mocked for isolation:
// Don't assert on the mock - test Page's behavior with sidebar present
```

### Gate Function

```
BEFORE asserting on any mock element:
  Ask: "Am I testing real component behavior or just mock existence?"

  IF testing mock existence:
    STOP - Delete the assertion or unmock the component

  Test real behavior instead
```

## Anti-Pattern 2: Test-Only Methods in Production

**The violation:**
```typescript
// X BAD: destroy() only used in tests
class Session {
  async destroy() {  // Looks like production API!
    await this._workspaceManager?.destroyWorkspace(this.id);
    // ... cleanup
  }
}

// In tests
afterEach(() => session.destroy());
```

**Why this is wrong:**
- Production class polluted with test-only code
- Dangerous if accidentally called in production
- Violates YAGNI and separation of concerns
- Confuses object lifecycle with entity lifecycle

**The fix:**
```typescript
// OK GOOD: Test utilities handle test cleanup
// Session has no destroy() - it's stateless in production

// In test-utils/
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
}

// In tests
afterEach(() => cleanupSession(session));
```

### Gate Function

```
BEFORE adding any method to production class:
  Ask: "Is this only used by tests?"

  IF yes:
    STOP - Don't add it
    Put it in test utilities instead

  Ask: "Does this class own this resource's lifecycle?"

  IF no:
    STOP - Wrong class for this method
```

## Anti-Pattern 3: Mocking Without Understanding

**The violation:**
```typescript
// X BAD: Mock breaks test logic
test('detects duplicate server', () => {
  // Mock prevents config write that test depends on!
  vi.mock('ToolCatalog', () => ({
    discoverAndCacheTools: vi.fn().mockResolvedValue(undefined)
  }));

  await addServer(config);
  await addServer(config);  // Should throw - but won't!
});
```

**Why this is wrong:**
- Mocked method had side effect test depended on (writing config)
- Over-mocking to "be safe" breaks actual behavior
- Test passes for wrong reason or fails mysteriously

**The fix:**
```typescript
// OK GOOD: Mock at correct level
test('detects duplicate server', () => {
  // Mock the slow part, preserve behavior test needs
  vi.mock('MCPServerManager'); // Just mock slow server startup

  await addServer(config);  // Config written
  await addServer(config);  // Duplicate detected OK
});
```

### Gate Function

```
BEFORE mocking any method:
  STOP - Don't mock yet

  1. Ask: "What side effects does the real method have?"
  2. Ask: "Does this test depend on any of those side effects?"
  3. Ask: "Do I fully understand what this test needs?"

  IF depends on side effects:
    Mock at lower level (the actual slow/external operation)
    OR use test doubles that preserve necessary behavior
    NOT the high-level method the test depends on

  IF unsure what test depends on:
    Run test with real implementation FIRST
    Observe what actually needs to happen
    THEN add minimal mocking at the right level

  Red flags:
    - "I'll mock this to be safe"
    - "This might be slow, better mock it"
    - Mocking without understanding the dependency chain
```

## Anti-Pattern 4: Incomplete Mocks

**The violation:**
```typescript
// X BAD: Partial mock - only fields you think you need
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' }
  // Missing: metadata that downstream code uses
};

// Later: breaks when code accesses response.metadata.requestId
```

**Why this is wrong:**
- **Partial mocks hide structural assumptions** - You only mocked fields you know about
- **Downstream code may depend on fields you didn't include** - Silent failures
- **Tests pass but integration fails** - Mock incomplete, real API complete
- **False confidence** - Test proves nothing about real behavior

**The rule:** Derive the mock from the authoritative contract and include every field that the exercised producer/consumer path can observe. Do not guess undocumented fields or require irrelevant payload expansion merely to make a fixture look complete.

**The fix:**
```typescript
// OK GOOD: Contract-aligned fixture for the exercised consumer
const mockResponse: ProfileResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 }
};
```

### Gate Function

```
BEFORE creating mock responses:
  Check: "Which authoritative schema or producer contract owns this shape?"

  Actions:
    1. Inspect the exported type/schema or documented producer contract
    2. Include every field observable on the exercised path
    3. Validate with a shared builder, schema parse, `satisfies`, or typed fixture when available

  Critical:
    A cast such as `as unknown as Response` does not establish conformance
    A fixture that omits an observed field or invents an impossible state can create false confidence

  If uncertain: inspect the producer or report the contract gap instead of guessing
```

## Anti-Pattern 5: State-Changing Test Doubles Without Contract Tests

**The violation:**
```typescript
// X BAD: in-memory model has its own state machine, but only production code is tested
const store = new InMemoryWorkflowStore();

await store.complete("run-1");
await store.complete("run-1"); // fixture accidentally allows terminal overwrite
```

**Why this is wrong:**
- A fixture, model, or test double that replaces a production state-changing component can repeat the same defect as production code.
- Tests then confirm the fake's behavior instead of protecting the invariant shared with production.
- State machines are especially vulnerable when transitions, terminal states, conflicts, or replay behavior are duplicated in helpers.

**The fix:**
```typescript
// OK GOOD: one contract suite runs against both implementations
runWorkflowStoreContract("production store", createProductionStore);
runWorkflowStoreContract("in-memory store", createInMemoryStore);
```

The shared contract suite should assert observable invariants against both implementations. It is not testing mock internals; it is proving that the double preserves the same externally visible contract as production.

For state machines, the contract table usually covers:
- allowed transitions;
- terminal states;
- conflict behavior;
- replay behavior.

Do this only when the fixture/model/test double replaces a production state-changing component. Simple value builders, static response objects, and pure stubs do not need a contract suite unless they encode state-changing behavior.

### Gate Function

```
BEFORE trusting a state-changing test double:
  Ask: "Does this double replace production state-changing behavior?"

  IF yes:
    Extract the shared invariants into a contract suite
    Run the suite against production and the double

  IF no:
    Keep the double minimal and avoid testing its internals
```

## Backend Evidence Anti-Pattern: Fake-Green Production Boundaries

**The violation:**
```typescript
// X BAD: API test proves route flow but not production RLS/provider behavior
const app = createApp({ store: new InMemoryUserStore() });
const res = await app.request("/documents");
assert.equal(res.status, 200);
```

**Why this is wrong:**
- The test can prove middleware, routing, and service orchestration while the real persistence, RLS, RPC, provider gate, or service-role boundary remains untested.
- In-memory fixtures can accidentally allow impossible roles, stale sessions, wrong tenants, or incomplete profiles that production would reject.
- A mocked provider can hide that stage/prod selects a different credential, policy, or authorization path.

**The fix:**
Use layered evidence:

- API/service tests for HTTP behavior;
- contract tests for store/adapters when an in-memory double replaces production behavior;
- database/RLS/RPC allow/deny tests with the caller identity production uses;
- negative tests for stale session, stale active context, wrong role, wrong scope/tenant, revoked/disabled status, and missing readiness when relevant;
- provider-boundary tests proving the double is test-only and cannot be selected in stage/prod.

### Gate Function

```
BEFORE accepting backend tests as production evidence:
  Ask: "Which production boundary does this test actually exercise?"

  IF the answer is only route/service + mock/in-memory store:
    Report a production-boundary evidence gap

  IF fixtures bypass auth/RBAC/session/context/profile/status invariants:
    Replace them with production-valid fixtures or make rejection explicit
```

## Fixture provenance and skipped upstream behavior

Every fixture that starts inside a value or state pipeline must name its
provenance: the authoritative producer or contract it represents and the
upstream steps it bypasses. State the skipped-upstream anti-claim explicitly;
the fixture cannot prove a producer, normalization, authorization, persistence,
or reload transition that it did not execute.

When the claim crosses boundaries, use a vertical contour from the earliest
affected producer through the write, authoritative reread, and reload. First
show the exact actor/input witness failing on that contour, then repeat the same
contour after the fix. A mid-chain fixture may still isolate a consumer, but it
cannot turn its green result into evidence for the skipped producer. Keep a
genuinely single-layer test proportional instead of inventing upstream work.

## Anti-Pattern 6: Integration Tests as Afterthought

**The violation:**
```
OK Implementation complete
X No tests written
"Ready for testing"
```

**Why this is wrong:**
- Testing is part of implementation, not optional follow-up
- A test-first loop would have caught this, and normal implementation still cannot claim completion without relevant tests
- Can't claim complete without tests

**The fix:**
```
Minimum completion gate:
1. Add or repair the behavior test that proves the change
2. Run the relevant test command
3. Resolve warnings or document the blocker
4. THEN claim complete
```

## Anti-Pattern 7: Skipping a Required Coverage Checkpoint

**The violation:**
```
OK Tests are green
X The repository-required coverage gate was not run after final changes
"Stage complete"
```

**Why this is wrong:**
- Instrumentation can reveal issues hidden in normal test runs
- You lose visibility into untested branches/error paths
- A declared coverage regression or release gate may be discovered too late

**The fix:**
```
1. If repository or user policy defines a coverage gate, run that exact command
2. Ensure report focuses on source files, not tests
3. Fix high-risk uncovered paths
4. Record checkpoint result before closure
```

If no coverage command or closure gate exists, do not invent one. Report that coverage was not part of the accepted contour and rely on the repository-required tests and behavior evidence.

## Anti-Pattern 8: Never-Resolving Promises in Tests

**The violation:**
```typescript
// X BAD: Promise never settles, test leaves pending async work
apiMock.getCurrent.mockImplementation(() => new Promise(() => undefined));
```

**Why this is wrong:**
- Leaves pending async work after test assertions
- Can stall coverage runs or produce late flaky failures
- Hides real UI lifecycle behavior

**The fix:**
```typescript
// OK GOOD: controlled deferred promise
const deferred = createDeferred<TermsResponse>();
apiMock.getCurrent.mockImplementation(() => deferred.promise);

// ...assert loading state...
deferred.resolve(mockTerms);
await waitFor(() => expect(submitButton).toBeEnabled());
```

### Gate Function

```
BEFORE using a pending promise in test mocks:
  Ask: "How will this promise settle in this test?"

  IF no explicit resolve/reject path:
    STOP - add deferred + explicit settle path
```

## Anti-Pattern 9: Repeated Side Effects or Opaque Async Work Inside waitFor

**The violation:**
```typescript
// X BAD: a retried callback can submit more than once
await waitFor(async () => {
  await submitDraft(scope);
  const draft = await readDraft(scope);
  expect(draft).toBeNull();
});
```

**Why this is wrong:**
- Testing Library supports promise-returning callbacks, but a rejected promise causes a retry after it settles.
- A side effect inside the callback may therefore execute multiple times and hide idempotency or race defects.
- Mixing the action and assertion obscures which operation is allowed to repeat.

**The fix:**
```typescript
// OK GOOD: perform the action once; retry only the side-effect-free observation
await submitDraft(scope);
await waitFor(async () => {
  const draft = await readDraft(scope);
  expect(draft).toBeNull();
});
```

Prefer a synchronous observable assertion when one exists. Use an async callback when the observation itself is asynchronous, ensure it rejects until the condition is satisfied, and keep retryable callbacks free of mutations or other repeated side effects.

## Anti-Pattern 10: Acting Before UI Is Ready

**The violation:**
```typescript
// X BAD: click before async prerequisites enable the action
await user.click(screen.getByRole('button', { name: 'Complete onboarding' }));
```

**Why this is wrong:**
- Click can be ignored because control is still disabled
- Produces flaky assertions ("sometimes validation didn't run")

**The fix:**
```typescript
// OK GOOD: wait until actionable
const submit = screen.getByRole('button', { name: 'Complete onboarding' });
await waitFor(() => expect(submit).toBeEnabled());
await user.click(submit);
```

## When Mocks Become Too Complex

**Warning signs:**
- Mock setup longer than test logic
- Mocking everything to make test pass
- Mocks missing methods real components have
- Test breaks when mock changes

**your human partner's question:** "Do we need to be using a mock here?"

**Consider:** Integration tests with real components often simpler than complex mocks

## TDD Context

When TDD is explicitly requested, it helps prevent these anti-patterns:
1. **Write test first** -> Forces you to think about what you're actually testing
2. **Watch it fail** -> Confirms test tests real behavior, not mocks
3. **Minimal implementation** -> No test-only methods creep in
4. **Real dependencies** -> You see what the test actually needs before mocking

If TDD is not explicitly requested, use the gate functions and normal validation workflow instead of converting the task to TDD.

## Quick Reference

| Anti-Pattern | Fix |
|--------------|-----|
| Assert on mock elements | Test real component or unmock it |
| Test-only methods in production | Move to test utilities |
| Mock without understanding | Understand dependencies first, mock minimally |
| Contract-drifting mocks | Derive typed fixtures from the authoritative producer/schema contract |
| State-changing double without contract tests | Run shared contract suite against production and the double |
| Fake-green production boundary tests | Add real boundary, contract, or allow/deny tests |
| Mid-chain fixture claims upstream behavior | Record fixture provenance and skipped-upstream anti-claim; use a vertical contour for cross-boundary claims |
| Tests as afterthought | Add behavior tests before claiming completion; use TDD only if requested |
| Skipped required coverage checkpoint | Run and record the repository/user-defined coverage gate before closure |
| Never-settled promises in test mocks | Use deferred and always resolve/reject |
| Side effects inside `waitFor` | Perform the action once; retry only a side-effect-free sync or async observation |
| Click while control is disabled/loading | Wait until actionable (`toBeEnabled`) before action |
| Over-complex mocks | Consider integration tests |

## Red Flags

- Assertion checks for `*-mock` test IDs
- Methods only called in test files
- Mock setup is >50% of test
- Test fails when you remove mock
- Can't explain why mock is needed
- Mocking "just to be safe"
- State-changing fixture/model has no shared contract suite with production
- API tests with mock/in-memory stores are treated as proof for persistence/RLS/RPC/provider behavior
- Fixtures seed impossible auth/RBAC/session/context/profile/status states
- Fixture provenance or skipped-upstream behavior is unstated while a broader claim is made
- Test doubles can be selected outside test runtime
- A repository/user-required coverage checkpoint was skipped at milestone/final closure
- Pending mock promises without explicit settle path
- `waitFor` callback repeats writes, submissions, navigation, or other side effects
- User actions fired before UI control is enabled

## The Bottom Line

**Mocks are tools to isolate, not things to test.**

If a test only verifies mock behavior, the test has gone wrong.

Fix: Test real behavior or question why you're mocking at all.
