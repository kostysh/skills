# Test environment notes

Design a local correction for these tests. Do not edit files or change the
application contract. The repository uses Node.js 24.21.0 and `node:test`.

The contract accepts a token while `now < expiresAt`, including an operation
immediately before expiry; at expiry and after expiry it rejects. A separate
integration case must exercise the PostgreSQL function that decides validity
using `clock_timestamp()`. Its SQL and independent database connection must
remain real. The application already accepts a test-supplied `now` function for
the application-only validity check. Timestamp-bearing operation IDs must refer
to the same logical time as that check.

```ts
const issuedAt = Date.now();
const token = makeToken({ issuedAt, expiresAt: issuedAt + 2_000 });
await bootLocalServices(); // cold CI runs can take over 2 seconds
const operationId = makeTimestampId(Date.now());
await checkToken({ token, operationId });
```

Another test sets `Date.now` to `issuedAt`, calls the PostgreSQL function, and
labels the result as controlled database time. No database clock override exists.

The service also has an existing synchronous emitter interface:

```ts
function start(emitter: EventEmitter) {
  emitter.emit('ready', { status: 'ok' });
  emitter.emit('finished');
}

start(emitter);
const [ready] = await once(emitter, 'ready');
await once(emitter, 'finished');
assert.equal(ready.status, 'ok');
```

A proposed patch gives the token a day of validity, waits 50 milliseconds before
assertions, and adds two `flushPromises()` calls after `start`. Return the smallest
sufficient test design, retained assertions, cleanup, and the limits of its proof.
