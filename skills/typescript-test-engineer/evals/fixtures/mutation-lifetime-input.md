# Mutation flow evidence bundle

## Accepted behavior

An operator edits case `case-17` in workspace access context A. The form is
rendered in a drawer portal. After submit, the workspace must keep the operation
status visible until an authoritative case reread confirms the outcome. Closing
or reopening the drawer must not erase an active attempt or its verification
result. Switching to access context B must not expose case data or operation
status from A.

Each submit is a distinct client attempt with its own outcome-verification
sequence. If the operator returns to A and submits again after a recoverable
result, a late completion from the earlier attempt or verification sequence
must not settle, overwrite, or confirm the newer one. These client identities
do not define backend idempotency behavior.

A successful mutation response means only that the write request was accepted.
The required authoritative reread may fail and must produce a visible,
recoverable non-success state. The backend retry and idempotency behavior is not
specified beyond these statements and must not be invented.

## Proposed client behavior

- The QueryClient begins with detail data for `case-17` in context A.
- The drawer component owns its own `isSaving` and `verificationError` state.
- Submit resolves successfully, closes the drawer, and invalidates the detail
  query.
- If the reread fails, the drawer schedules a five-second retry timer.
- Reopening the drawer mounts a fresh component instance.
- A context switch to B replaces the visible route but does not explicitly
  cancel the timer or the outstanding A reread.
- A late A response can still call the current cache update helper.
- Returning to A can start a second submit while a completion from the first
  attempt is still controllable by the test.

## Available test stack

The repository already uses Vitest, Testing Library, a real QueryClient per
test, a memory router, and the production portal provider. Fake timers are
available. No new dependency or harness is authorized.

## Requested output

Return a behavior-focused test plan with ownership/lifetime assumptions,
an explicit route/access/entity/client-attempt/verification-sequence matrix,
Arrange-Act-Assert sequence, observable assertions, deterministic cleanup, and
evidence limits.
