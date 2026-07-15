---
name: node-engineer
description: Explain, design, review, diagnose, and implement Node.js runtime
  behavior using repo and version evidence. Use for TypeScript execution,
  ESM/CJS, streams, backpressure, shutdown, logging, profiling, dependencies,
  hangs, and open resources; keep diagnosis read-only unless fixes are
  requested.
metadata:
  source-version: 0.1.3
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: e18095a69fdb0d2ce38e338d2c9793ff257ce6c1ff0d5de8a49b8a001c0d9d6f
---

# node-engineer

## Start here

1. Classify the request as explain/design, review/diagnose, or authorized change; review and diagnosis are read-only unless the operator explicitly requests remediation.
2. Establish the actual Node versions and runtime path from repository scripts, package metadata, CI/deployment configuration, the failing command, and a narrow reproduction before recommending flags, imports, dependencies, or code changes.
3. Apply source precedence in this order: explicit operator requirements; compatible repository policy and installed/deployed behavior; current official documentation matching the relevant versions; then this skill's portable defaults.
4. Load only the reference triggered by the current runtime problem and route language, test-runner, framework, CLI, architecture, or formal-review decisions to their owning skills.
5. Define the observable runtime result and evidence boundary before implementation; generated files, types, mocks, logs, and compiler success do not prove application runtime behavior.

## When to use this skill

- Explaining, designing, reviewing, diagnosing, or changing Node.js runtime and process behavior.
- Running TypeScript directly in Node, selecting a transform/build path, or resolving runtime import extensions.
- Resolving Node ESM/CJS, package exports, or module-resolution behavior.
- Building or debugging stream pipelines, text/record framing, large-file processing, ETL, cancellation, or backpressure.
- Implementing or diagnosing signals, bounded graceful shutdown, readiness handoff, logging, or resource cleanup.
- Profiling CPU, heap, event-loop, or HTTP behavior and diagnosing process hangs or leaked resources.
- Inspecting installed dependencies, exports, resolution paths, or package-manager-specific layout.

## When NOT to use this skill

- Type-level API design, inference, general compiler diagnostics, or TypeScript correctness without a Node runtime decision; use `typescript-engineer`.
- Test strategy, runner configuration, coverage, fixtures, or CI gating; use `typescript-test-engineer`.
- Framework-specific routing, middleware, adapters, readiness endpoints, or service architecture; use the framework skill.
- CLI command models, help, stdout/stderr contracts, packaging, or release UX; use `cli-engineer`.
- Browser or bundler-only behavior with no Node runtime boundary; use the relevant frontend or bundler skill.

## Capability and anti-claims

Use repository and installed-version evidence to establish the Node runtime contract, diagnose the first runtime cause, design or apply only an authorized change, and report what the selected checks actually proved. The result should let the operator or routed owner act without guessing the executed source, emitted artifact, module system, process lifecycle, compatibility range, or remaining evidence gap.

This documentation does not execute, typecheck, profile, benchmark, or deploy an application by itself. A generated skill, valid config, successful compiler/typecheck, mock, log, profile file, benchmark command, or happy-path snippet is substrate or bounded evidence; none proves a broader runtime claim unless it exercises the named behavior and relevant failure path.

## Minimum inputs and source precedence

Derive or obtain the expected behavior, task mode and mutation authority, repository instructions, package manager and scripts, actual installed and deployed Node versions, package module markers and exports, TypeScript source-versus-emit path when applicable, the failing command and diagnostics, affected consumers or resources, and the narrowest meaningful reproduction.

Apply authority in this order:

1. explicit operator requirements for the authorized task;
2. compatible repository policy and actual installed/deployed behavior;
3. current official documentation matching every supported Node version;
4. portable defaults in this skill.

If equal-authority inputs conflict, the runtime path or compatibility range cannot be established, or the required check would cross an unauthorized process, network, benchmark, profile, or external-system boundary, return `blocked` or bounded guidance instead of inventing the missing contract.

## Runtime-mode matrix

| Executed artifact | Runtime owner | Relative import contract | Required evidence |
| --- | --- | --- | --- |
| Source `.ts` executed directly | Node built-in stripping or an explicit loader | Match source files (`.ts`, `.mts`, `.cts`) | Exact Node version, command, supported syntax, and runtime smoke |
| Emitted JavaScript | TypeScript compiler or build/bundle step | Valid emitted `.js`, `.mjs`, or `.cjs` specifiers | Build output inspection plus execution of the emitted entry |
| Non-erasable TypeScript | Version-supported transform path, third-party loader, or build | Determined by the selected output path | Version compatibility and a real non-erasable syntax case |

Do not collapse these modes into one tsconfig or import rule. `node-engineer` establishes which artifact Node executes; `typescript-engineer` configures compiler behavior consistently with that decision.

## Completion contract

Use `verified` only when current evidence exercises the targeted Node runtime behavior, supported version range, and relevant failure case. Use `partial` when the diagnosis or authorized change is useful but a required runtime contour remains unexecuted. Use `blocked` when missing authority, conflicting constraints, unavailable runtime versions, or an unsafe validation boundary prevents a sound result.

The final response states the outcome or root cause, authoritative inputs and assumptions, Node/runtime mode and compatibility range, changed or proposed runtime contract, exact checks and failure cases, routed owner boundaries, remaining risk, and status.

## Workflow stages

### Workflow stage: Establish the runtime basis

Make the requested outcome, authority, runtime path, compatibility range, and mutation boundary reconstructable.

1. Record the task mode and whether code, configuration, dependencies, processes, profiles, benchmarks, or external targets may be changed or exercised.
2. Inspect repository instructions, package manager and scripts, package type/exports, installed and deployed Node versions, TypeScript execution or emit path, failing command and diagnostics, and the smallest relevant call sites or resources.
3. Define the expected observable behavior, affected consumer, compatibility range, and the narrowest runtime check that could prove or falsify the result.
4. Stop with `blocked` or bounded guidance when required authority is missing, equal-authority sources conflict, the runtime path cannot be identified, or the requested check would cross an unauthorized boundary.

Validation:

- Task mode, allowed side effects, sources, Node/runtime mode, target behavior, consumer, and verification boundary are explicit.
- No flag, package manager, version manager, dependency, or execution path is assumed merely because it is common elsewhere.

### Workflow stage: Diagnose and choose the first sufficient runtime path

Identify the first runtime cause and smallest compatible solution without inventing adjacent language, framework, test, or architecture policy.

1. Reproduce or inspect the narrowest failing behavior, then distinguish Node runtime semantics from TypeScript language/toolchain, framework, runner, CLI, data, and architecture concerns.
2. Prefer a supported built-in `node:` API, repository-standard helper, installed dependency, or small local adapter in that order; add a dependency or new abstraction only after the simpler surfaces fail for a concrete reason.
3. Check current official documentation for every version-sensitive Node API or flag and reconcile it with all supported installed/deployed versions.
4. In explain/design or review/diagnose mode, return the bounded result without editing; in change mode, define the exact authorized runtime contract before implementation.

Validation:

- The root cause or bounded hypothesis, owner boundary, compatibility constraints, rejected simpler options, and evidence limit are explicit.

### Workflow stage: Apply only the authorized runtime change

Implement the smallest Node-runtime change that delivers the accepted observable behavior.

1. Change only the accepted runtime scope and preserve repository module, lifecycle, logging, and dependency conventions unless they are the demonstrated cause.
2. Keep module imports aligned with the path that actually executes, stream transforms encoding- and backpressure-safe, and shutdown idempotent and bounded.
3. Coordinate compiler configuration, runner behavior, framework hooks, CLI contracts, or architectural cache decisions with the owning skill instead of silently taking them over.

Validation:

- Every changed hunk and dependency traces to the accepted runtime behavior and compatibility range.
- No mutation occurs in explain/design or review/diagnose mode.

### Workflow stage: Verify and report at the claimed boundary

Prove the targeted Node behavior without treating substrate checks as runtime completion.

1. Run the exact reproduction and the narrowest repository-native runtime, integration, process, or benchmark check that exercises the changed boundary; add typecheck or runner evidence only through the owning toolchain.
2. Exercise relevant failure behavior such as unsupported versions, cancellation, stream errors, split records, held requests, shutdown deadlines, forced fallback, or leaked resources.
3. Report the outcome or root cause, authoritative inputs and assumptions, runtime contract or change, exact checks, interop handoffs, unverified boundaries, remaining risk, and status as `verified`, `partial`, or `blocked`.

Validation:

- `verified` requires current evidence for the claimed runtime boundary and compatibility range.
- Generated prose, compiler/typecheck success, mocks, a clean process start, or a happy-path example cannot by themselves establish runtime completion.

## Interop priority

- **Implementation scope, minimal diffs, and evidence discipline:** implementation-discipline. node-engineer owns Node runtime semantics; implementation-discipline owns capability reality, surgical changes, and completion evidence for authorized implementation.
- **TypeScript language, type-system, and compiler configuration:** typescript-engineer. node-engineer establishes the executed source or emitted-JavaScript runtime contract; typescript-engineer configures and checks TypeScript consistently with that contract.
- **Test strategy, runner behavior, coverage, mocks, and CI contours:** typescript-test-engineer. typescript-test-engineer owns the test workflow; node-engineer owns Node process, module, stream, and resource-lifecycle mechanics that may underlie a test hang.
- **Framework adapters, lifecycle hooks, routing, middleware, and readiness endpoints:** the relevant framework skill. the framework owner implements framework APIs; node-engineer owns signal, process, server, stream, and resource semantics beneath that integration.
- **CLI command model, help, output/error contract, packaging, and release UX:** cli-engineer. cli-engineer owns the public CLI surface; node-engineer owns low-level Node execution, module resolution, streams, signals, and process behavior.
- **Distributed cache topology, cross-service lifecycle, and architecturally significant runtime trade-offs:** architecture-engineer. node-engineer may implement an accepted local runtime mechanism but does not invent distributed ownership, consistency, durability, or cross-system policy.
- **Formal code-review scope, severity, findings, and merge guidance:** code-reviewer. node-engineer supplies Node-specific analysis; code-reviewer owns the formal review verdict and merge-risk synthesis.

## Gotchas

- **high** — Never treat arbitrary byte chunks as UTF-8 strings or logical records; preserve decoder state and apply explicit framing before record-level transforms.
- **high** — Do not call a shutdown graceful merely because `server.close()` ran; bound the drain, close every owned resource, flush the logger, and reserve `process.exit()` for an observable non-success forced fallback because it can truncate pending I/O.
- **high** — Do not recommend Node flags or APIs from a generic latest-version memory; inspect the actual compatibility range and version-matched official documentation.
- **medium** — Do not prescribe `npx`, npm, pnpm, nvm, Volta, `./node_modules/.bin/...`, a profiler, benchmark package, cache package, or external target until repository tooling, layout, installation state, network behavior, and side-effect authority are known.
- **high** — Do not claim runtime success from generated guidance, typecheck/compiler success, mocks, logs, or a happy-path snippet that does not exercise the named runtime boundary and failure path.

## Policies

### Source and compatibility precedence
Explicit operator requirements govern the authorized task; compatible repository policy and actual installed/deployed behavior govern execution; current official version-matched documentation resolves Node facts; portable defaults apply only when stronger sources are absent. Equal-authority conflicts block the strongest claim.

### Mutation and side-effect boundary
Explain/design and review/diagnose requests are read-only. Code, configuration, dependency, process, profiling, benchmark, network, and external-target effects require authorization from the task and repository context.

### Runtime evidence boundary
Match proof to the claim. Static and compiler checks prove only inspected structure; process and integration checks prove only exercised runtime paths; benchmarks prove only recorded conditions; deployed evidence proves only the observed environment.

### First sufficient runtime surface
Prefer supported Node built-ins, repository helpers, installed dependencies, and small local adapters before new runtime dependencies or generic lifecycle, logging, stream, cache, or profiling wrappers.

### Output contract
Report the outcome or root cause, source basis and assumptions, Node/runtime mode and compatibility range, changed or proposed runtime contract, exact checks and failure cases, interop handoffs, unverified boundaries, remaining risk, and `verified`, `partial`, or `blocked` status.

## Required active references
- [Debugging and profiling](references/debugging-profiling.md) — Read this for dependency or module-resolution inspection, process-hang diagnosis, profiling, or benchmarking.
- [Operations](references/operations.md) — Read this for signals, graceful shutdown, health/readiness handoff, logging, redaction, or resource cleanup.
- [Runtime TypeScript](references/runtime-typescript.md) — Read this for built-in TypeScript execution, type stripping, Node-version compatibility, import extensions, or build-path decisions.
- [Streams and caching](references/streams-caching.md) — Read this for stream pipelines, text or record framing, backpressure, cancellation, ETL, or local cache mechanics.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory node-engineer guidance inside this skill folder and treat repository commands as discovered context, not universal requirements.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside the copied skill folder.
- Confirm UI metadata, active references, generated output, and supporting evidence preserve the same capability and evidence limits.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
- Supporting glob: `docs/reviews/*`
