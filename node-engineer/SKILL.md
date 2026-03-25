---
name: node-engineer
description: |
  Node.js runtime engineering skill for modern server-side JavaScript and TypeScript.
  Use when designing or debugging Node-specific runtime concerns: built-in TypeScript
  execution and type stripping, ESM/CJS and module resolution, streams and backpressure,
  graceful shutdown, structured logging, profiling, dependency inspection, and process
  hangs caused by open handles or leaked resources.
---

# Node Engineer

## Scope

Applies to Node.js runtime and platform concerns. If the current project already has established runtime conventions, follow them unless they are the source of the bug.

## Interop (Priority)

- Defer TypeScript language design, advanced typing, and general tsconfig/toolchain policy to `typescript-engineer`.
- Defer test strategy, coverage policy, CI contours, and broad mocking guidance to `typescript-test-engineer`.
- Defer framework APIs and app architecture to framework skills such as `hono-engineer`.
- If rules conflict, this skill owns Node runtime behavior; the other skills own language, test policy, and framework-specific APIs in their domains.

## Non-negotiables

- Prefer built-in Node capabilities before adding runtime dependencies.
- Identify the actual runtime mode before changing imports or config: source `.ts` executed directly, emitted `.js`, or an explicit transform/bundler path.
- Keep import extensions aligned with the runtime path that actually executes: source-run `.ts` uses `.ts`; emitted JavaScript uses `.js`.
- Prefer `await pipeline(...)` or explicit backpressure-aware loops over chained `.pipe()` or fire-and-forget writes.
- Shutdown must be idempotent: mark unready, stop new work, drain in-flight work, close resources, then exit.
- Reuse the repo's logger if it already exists; otherwise structured logs with redaction are the default.
- When a Node process hangs, isolate first and close resources in the same scope that created them.

## When to Use This Skill

Use when:

- Running TypeScript directly in Node with built-in type stripping or `--experimental-transform-types`
- Resolving Node ESM/CJS issues, import extensions, or module resolution behavior
- Building or debugging stream pipelines, large-file processing, ETL, or backpressure
- Implementing graceful shutdown, signal handling, readiness/liveness behavior, or resource cleanup
- Standardizing structured logging, redaction, or debug namespaces in Node services
- Profiling CPU, heap, or HTTP throughput in a Node service
- Inspecting installed dependencies, exports, resolution paths, or package-manager-specific layout
- Debugging Node process hangs, leaked handles, or runtime resources outside the broader test-policy workflow

## When NOT to Use This Skill

Do NOT use for:

- Type-level API design, inference issues, or general TypeScript correctness work; use `typescript-engineer`
- Test policy, coverage cadence, runner selection, or CI gating; use `typescript-test-engineer`
- Framework-specific routing, middleware, or service architecture; use the framework skill
- Browser or bundler-only module behavior; use the relevant frontend skill

## Quick Workflow

1. Identify runtime mode and Node version from `package.json`, scripts, CI config, and the failing command.
2. Read only the smallest relevant reference file instead of loading all Node guidance.
3. Preserve existing runtime conventions unless the current setup is clearly broken or internally inconsistent.
4. Make the minimal runtime-safe change, then run the narrowest verification that proves the behavior.
5. If the process still hangs, switch to the handle/resource workflow immediately instead of only extending timeouts.

## Runtime Mode Quick Matrix

| Situation                                  | Runtime owner                                      | Import style            | Notes                                                          |
| ------------------------------------------ | -------------------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| Source `.ts` executed directly by Node     | Node built-in TS support                           | `.ts` / `.mts` / `.cts` | No tsconfig transforms at runtime                              |
| JavaScript emitted for runtime             | `tsc` / bundler / build step                       | `.js` in emitted output | Keep emit config and runtime path aligned                      |
| Non-erasable TS syntax required at runtime | transform step or `--experimental-transform-types` | depends on output       | Choose intentionally; do not blur this with erasable-only mode |

## High-signal triggers

- **CSV / ETL / large files / repeated async lookups**: use `pipeline()` + `async function*` + explicit cache choice.
- **Import extension mismatch / Node ESM bug / package exports confusion**: inspect actual runtime path and package resolution before editing many files.
- **SIGTERM / pod shutdown / process never exits**: apply the shutdown sequence and close resources in reverse order of initialization.
- **Slow endpoint / CPU spike / memory growth**: baseline first, profile second, optimize third.

## When You Need More Detail

Read only the relevant reference file:

- [runtime-typescript.md](references/runtime-typescript.md) - built-in TypeScript execution, type stripping, import extensions, and safe config boundaries
- [streams-caching.md](references/streams-caching.md) - `pipeline()`, async generators, backpressure, and cache selection
- [operations.md](references/operations.md) - graceful shutdown, logging defaults, redaction, and resource cleanup
- [debugging-profiling.md](references/debugging-profiling.md) - package inspection, module resolution, hang diagnosis, and performance workflow
