# Debugging, Resolution, Hangs, and Profiling

## Inspection basis

Before choosing commands, inspect the repository package manager, scripts, module system, workspace layout, exact Node versions, failing working directory, and mutation/side-effect authority. Prefer repository-native commands and already-installed tools.

Do not prescribe npm/pnpm/yarn, `npx`, a version manager, or a globally installed executable without evidence that it is the accepted local surface. A command that downloads a package, starts a process, writes a profile, or sends load is not read-only merely because it is diagnostic.

## Dependency and package inspection

Use the confirmed package manager's equivalent of `why`/dependency-tree inspection to learn why a package is present. Then inspect the package instance actually resolved from the failing consumer, including:

- its `package.json`, `type`, `main`, `module`, `exports`, and `imports` fields;
- the installed version and physical/symlinked location;
- relevant type declarations or README for that installed version;
- workspace and package-manager layout that affects reachability.

Do not assume a transitive package exists at root `node_modules/<pkg>` or scan the entire filesystem when resolution from the failing package gives a narrower path.

## Module-resolution probes

Use a probe matching the real consumer and working directory.

CommonJS:

```bash
node -p "require.resolve('package-name')"
node -p "require.resolve.paths('package-name')"
```

ESM:

```bash
node --input-type=module -e "console.log(import.meta.resolve('package-name'))"
```

Interpret the result with package exports and conditions. A successful `require.resolve()` does not prove an ESM import works, and `import.meta.resolve()` does not execute or validate the target's runtime format. Reproduce the actual import/require path after inspection.

For relative ESM imports, verify explicit extensions, URL semantics, package `type`, and the executed source-versus-output artifact. Route TypeScript compiler configuration to `typescript-engineer` after the Node runtime path is established.

## Process-hang workflow

For a process that does not exit:

1. reproduce with the narrowest real command and record expected exit behavior;
2. compare active resource types before and after the operation with `process.getActiveResourcesInfo()` when the Node version supports it;
3. correlate resources with recently initialized servers, clients, timers, workers, children, watchers, readline, streams, log transports, and background work;
4. close each resource in the scope that created it and rerun the exact command;
5. verify clean exit without extending timeouts or forcing success.

Resource-type output is diagnostic evidence, not ownership proof. If the hang is inside a test runner, `typescript-test-engineer` owns runner lifecycle, isolation, timeouts, and test cleanup; `node-engineer` supplies Node resource semantics.

## Profiling workflow

Do not optimize from intuition:

1. define the user-visible performance symptom and baseline conditions;
2. choose CPU, heap/allocation, event-loop, I/O, or request-throughput evidence;
3. capture one profile under representative and authorized conditions;
4. identify a specific hot path or retention path;
5. change one cause;
6. rerun the same baseline and compare results.

Useful built-in surfaces include:

- `node --cpu-prof <entry>` for V8 CPU profiles;
- `node --heap-prof <entry>` for allocation profiles;
- `node --inspect <entry>` for an explicitly authorized inspector session;
- diagnostic reports for fatal errors, selected signals, or programmatic snapshots when their potentially sensitive contents and output location are acceptable.

These commands execute the application and may write artifacts containing code paths, environment details, URLs, resource data, or other sensitive context. Choose an approved output directory, avoid production by default, and define retention/cleanup before capture.

## Benchmark boundary

Use an existing repository benchmark or installed load tool first. Add or download a benchmark tool only when the task authorizes dependency/network changes.

Before sending HTTP load, confirm:

- the target is a local, test, or otherwise explicitly authorized environment;
- rate, concurrency, duration, credentials, and data are safe;
- the test cannot mutate production data or trigger paid/external side effects;
- baseline and post-change conditions are comparable.

Never point a generic example at a live host. Report exact conditions, samples, errors, warmup, and variance; one faster run is not verified improvement.

## Completion evidence

Report:

- actual package/runtime/module basis;
- exact reproduction or baseline;
- commands and their process/file/network side effects;
- observed resolution, active resources, profile evidence, or benchmark comparison;
- change and post-change result when authorized;
- unexecuted versions/environments and status as `verified`, `partial`, or `blocked`.
