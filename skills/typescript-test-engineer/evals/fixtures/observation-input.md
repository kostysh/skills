# Timer and observation tests

Design the smallest sufficient test changes; do not edit files. The repository
uses a pinned Vitest version whose installed API includes
`vi.advanceTimersByTimeAsync`, and DOM Testing Library with promise-returning
`waitFor` callbacks. Preserve these runners and the contracts below.

The unit under test is a local debounced action. It calls `persist` only after
100 milliseconds; the timer callback awaits a Promise before completing. The
test already has a Promise for that completion. There is no network or database
driver in this unit case.

```ts
vi.useFakeTimers();
scheduleSave();
vi.advanceTimersByTime(100);
expect(saved).toBe(true);
```

A separate integration case submits one job to a local external worker, then
observes job state. The worker supplies no completion event or Promise to this
client. `readState` is a side-effect-free asynchronous read. The accepted
contract forbids submitting a second job. The runner's real-time deadline is
independent of the application clock. This case keeps real timers and its real
worker connection.

```ts
await submitJob();
await waitFor(async () => {
  expect(await readState()).toEqual({ status: 'complete' });
}, { timeout: 2_000 });
```

One review comment asks to reject every async `waitFor` callback. Another asks to
move `submitJob()` inside the callback so a transient read error retries the
whole sequence. Explain which recommendations are warranted, how to observe
incomplete/rejected reads, and how to complete and clean up both cases.
