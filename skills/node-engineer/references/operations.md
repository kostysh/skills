# Operations: Shutdown, Logging, and Cleanup

## Graceful shutdown sequence

Treat shutdown as an ordered workflow:
1. mark the service unready;
2. stop accepting new work;
3. let in-flight requests/jobs drain;
4. close external resources in reverse order of initialization;
5. exit with the correct code.

Keep shutdown idempotent. A second signal should not start a second cleanup flow.

## `server.close()` rule

For `node:http` servers, `server.close()` is callback-based.

If you need a Promise:
- wrap `server.close()` in a Promise, or
- use `server[Symbol.asyncDispose]()` where the project and Node version intentionally rely on it.

Do not write `await server.close()` as if it were universally promise-based.

```ts
function closeServer(server: import("node:http").Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
```

## Library choice for shutdown

- If the repo already uses `close-with-grace` or an equivalent helper, stay consistent.
- If the repo does not, a small manual signal handler is often enough.
- Do not introduce a new shutdown dependency just to avoid writing a 10-line wrapper.
- Do not wrap shutdown in a generic lifecycle framework unless the app has multiple real lifecycle participants that use it now.

## Readiness and health

When the process is shutting down:
- readiness should usually fail immediately;
- liveness may still report the process as alive until cleanup completes.

This matters in containers and load-balanced deployments where traffic draining depends on readiness changing before the process exits.

## Logging defaults

Use the existing project logger first.

If there is no established logger:
- structured JSON logs are the default;
- Pino is a reasonable default in Node projects;
- keep log context explicit (`requestId`, operation, resource id, duration).

## Redaction rules

Never log:
- passwords
- tokens
- cookies
- authorization headers
- request or response bodies by default

Prefer logging safe identifiers, counts, durations, hashes, or sizes instead of raw payloads.

## `debug` vs application logs

Use `debug` or `util.debuglog()` for opt-in module tracing.
Use the structured application logger for operational logs.

Do not mix the two responsibilities into one noisy stream.

Prefer the existing project logger and built-in opt-in tracing before adding a new logging facade. Add a new logger only when the current project lacks structured redaction-capable operational logging.

## Resource cleanup checklist

When a Node process refuses to exit, inspect:
- HTTP servers
- database or cache clients
- timers or intervals
- worker threads or child processes
- file watchers
- readline interfaces
- fire-and-forget async work that never settles

Close the resource in the same scope that created it whenever possible.
