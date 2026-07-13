# Operations: Bounded Shutdown, Logging, and Cleanup

## Define the shutdown contract before coding

Establish:

- signal sources and platform/orchestrator behavior;
- total termination budget and an internal deadline shorter than it;
- how the framework exposes readiness and stops new admission;
- in-flight work that may drain, must cancel, or is safe to abandon;
- every owned resource and its close/flush API;
- logger/transport completion semantics;
- success, cleanup-failure, deadline, and repeated-signal exit behavior.

Framework skills own readiness endpoints and lifecycle hooks. `node-engineer` owns signal, process, server, stream, timer, worker, child-process, and resource semantics beneath them.

## Bounded graceful-shutdown sequence

Use one idempotent shutdown promise and an explicit phase order:

1. on the first supported signal, atomically enter `draining` and record the deadline;
2. ask the framework/adapter to report unready before traffic draining begins;
3. stop accepting new requests, jobs, IPC messages, and background scheduling;
4. drain or cancel in-flight work according to the accepted policy and remaining budget;
5. close external resources in reverse initialization order;
6. stop and flush the logger or transport using its documented completion API;
7. set `process.exitCode` from the result and allow the event loop to end naturally.

A second signal must not start another cleanup flow. Route it through the documented repeated-signal policy, normally an observable non-success forced fallback.

## Deadline and forced fallback

Graceful shutdown must finish inside the external termination budget. Use an internal deadline that leaves time for diagnostics and the orchestrator's own termination path.

At deadline:

- record the incomplete phase and resources before forcing termination when possible;
- abort or force-close only resources covered by the accepted policy;
- use a non-success exit status;
- report the run as forced/partial, never graceful or verified;
- do not hide the cause by merely increasing the orchestrator timeout.

`process.exit()` terminates synchronously and can truncate pending stdout/stderr or logger writes. Do not use it on the normal path. Reserve it for the bounded forced fallback after the non-success state and evidence have been made observable as far as the remaining budget permits.

## HTTP server behavior

`node:http` `server.close()` is callback-based. It stops new connections and waits for remaining active work according to the Node version, but it does not close databases, caches, workers, timers, watchers, or log transports and does not impose the application deadline.

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

Use `server[Symbol.asyncDispose]()` only when every supported Node version provides the required stability and the repository intentionally adopts that API. Do not write `await server.close()` as if it were promise-based.

Force-closing active connections can interrupt valid requests. `closeAllConnections()` or equivalent framework APIs therefore belong only in the accepted deadline/fallback policy, not the default graceful path.

## Logging and redaction

Use the repository logger first. If none exists and logging setup is part of the authorized task, choose structured operational logging with explicit context and redaction; do not add a facade or dependency merely to avoid a small adapter.

Never log passwords, tokens, cookies, authorization headers, secret environment values, or request/response bodies by default. Prefer safe identifiers, counts, durations, hashes, sizes, phase names, and resource types.

Treat logger completion as a real resource boundary:

- identify whether output is direct stdout/stderr, a stream, worker/thread transport, file, or network sink;
- use the logger's documented flush/end callback or promise;
- wait for completion before the natural exit path;
- distinguish an accepted flush from merely enqueueing the last record.

Use `debug` or `util.debuglog()` for opt-in module tracing and the application logger for operational events. Neither is a substitute for durable audit/event delivery when the product requires that separate capability.

## Resource inventory

Track resources where they are created and close them in the owning scope. Common event-loop keepers include:

- HTTP/network servers and sockets;
- database, message, and cache clients;
- timers and intervals;
- worker threads and child processes;
- file watchers and readline interfaces;
- open streams and logger transports;
- scheduled or fire-and-forget work.

Use `process.getActiveResourcesInfo()` on supported Node versions as a bounded diagnostic signal. It returns resource types, not ownership or proof that each resource is leaked; correlate it with initialization, phase timestamps, and close evidence.

## Verification

Exercise the real process boundary when the claim is graceful shutdown:

- normal signal with no in-flight work;
- held or slow request/job that completes inside the budget;
- work that exceeds the budget and triggers the documented forced fallback;
- pending logger output or deliberate stream backpressure;
- cleanup rejection from one resource;
- leaked timer, worker, watcher, client, or stream;
- repeated signal during drain.

Success evidence includes phase ordering, readiness handoff, admitted/in-flight counts where available, resource close results, logger completion, exit code, elapsed time below the budget, and absence of orchestrator hard-kill. A unit mock of `server.close()` cannot establish this process-level claim.
