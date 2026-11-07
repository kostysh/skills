# Reservation test notes

Review the following test designs and recommend a sufficient local scenario.
Do not edit files. The accepted contract permits either caller to reserve the
last item: exactly one succeeds, the other receives a conflict, and the stored
remaining count is zero. The integration test must exercise the real transaction
and row lock on separate connections.

Current design:

```ts
const results = await Promise.all([reserve('A'), reserve('B')]);
assert.equal(results.filter(r => r.status === 'reserved').length, 1);
```

Proposed design uses an existing test adapter phase callback:

```ts
async function reserve(actor: string) {
  return withIndependentTransaction(async tx => {
    await tx.lockInventoryRow();
    await bothActorsArrived.arriveAndWait();
    return tx.reserveIfAvailable(actor);
  });
}
```

The adapter can instead pause immediately before asking for the row lock. The
production SQL and transaction code remain the same. Existing per-test teardown
can release that pause and cancel database queries. The runner has a real-time
test deadline. No production test hook, new runner, or scheduling library is
requested. Identify useful orderings, observations, and the strongest supported
conclusion. Include failure/teardown considerations.
