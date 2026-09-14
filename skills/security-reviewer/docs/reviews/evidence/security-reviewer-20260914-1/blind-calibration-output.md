# Raw blind crash/calibration output

SHA-256 of the original result: `8345f7b00848db1c710b75aff6dbc80340e34faea3a2d569430dc0d86f904e5a`.

The supplied evidence does not confirm an exploitable crash or availability vulnerability; two concrete runtime questions remain unresolved.

Review basis: targeted, read-only review of exact supplied artifacts `case-b/README.md` (`ca59b1…b2def`) and `case-b/archive-route.ts` (`0cd0b4…5ecdb`). Scope covered the unauthenticated route, body admission, native-addon boundary, worker-pool context, and error mapping. Threat actor: unauthenticated external requester controlling the archive bytes.

Needs verification

- `case-b/archive-route.ts:12` buffers the complete attacker-controlled body before any visible size or rate control. Unknown: whether the proxy/runtime enforces a sufficiently small request limit and abuse isolation before this handler. Resolve: inspect deployed admission configuration and exercise an oversized request with resource telemetry. Owner: Node/runtime or platform owner.
- `case-b/archive-route.ts:15-18` sends arbitrary bytes to the native addon, but the report only says “parser crash.” Unknown: whether malformed input merely rejects the promise and returns 422, terminates one replaceable pool worker, or exits a wider process. Resolve: the native/runtime owner should inspect the addon and worker-pool failure contract, then reproduce with the original artifact under process-exit and memory telemetry. Do not infer RCE from the current report.

Result: no confirmed findings in reviewed scope.

Evidence limits: the native implementation, middleware/proxy limits, rate controls, worker-pool configuration, crash telemetry, stack trace, sanitizer evidence, and reproduction artifact were unavailable. Source inspection alone cannot establish production availability impact, RCE, or effective request-size protection. No database, browser, CI, secrets, or external-integration surfaces were present in scope.
