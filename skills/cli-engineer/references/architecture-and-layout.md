# CLI Architecture And Layout

## Core Model

Use this separation by default:

- CLI layer: parse args, load config, detect TTY, render help/output, map errors to exit codes
- Application layer: use cases, orchestration, command handlers
- Domain layer: models, invariants, business rules
- Infrastructure layer: filesystem, HTTP, subprocesses, adapters

Keep command handlers thin. A command should translate input into a use-case call, not implement the product logic itself.

## Modularity And Testability

Prefer modular boundaries even for small CLIs. The goal is not abstraction for its own sake; the goal is testability and replaceability.

- keep parsing, orchestration, formatting, and side effects in separate modules
- structure commands so they assemble inputs and delegate to app/use-case modules
- keep domain rules and pure transformations isolated from process, filesystem, network, and terminal concerns
- inject or wrap side-effectful dependencies such as filesystem access, subprocess execution, clocks, randomness, and HTTP clients
- avoid command files that instantiate deep dependency graphs inline and then hide logic inside callbacks
- if a module is hard to unit test without spawning the CLI, the boundary is probably in the wrong place

Useful modular split inside a feature:

- `cli/commands/*`: argument parsing and command wiring
- `app/usecases/*`: command orchestration and workflow steps
- `domain/*`: rules, invariants, pure decisions
- `infra/*`: adapters for IO, HTTP, filesystem, subprocesses
- `cli/output/*`: renderers and serializers for human and machine output

## Config Precedence

Use deterministic precedence and document it:

1. flags / positional args
2. environment variables
3. project configuration
4. user configuration
5. system-wide configuration
6. built-in defaults

Never make precedence depend on load order accidents.

If configuration is complex enough to deserve files, keep the layer split explicit instead of overloading `.env` for everything.

Persist user state only when repeated invocations materially benefit from it. When a CLI writes user config, credentials, caches, logs, or generated defaults:

- use platform-appropriate, user-controlled config and state locations
- document what is written and which layer wins during config resolution
- keep secrets out of world-readable locations
- provide a documented cleanup or uninstall path for files created by the CLI
- do not silently create long-lived state for commands that can remain stateless

## Output Model

Default contract:

- human-readable output to `stdout`
- machine-readable output to `stdout`
- warnings, diagnostics, prompts, and errors to `stderr`
- success exit code `0`
- explicit non-zero codes for known failure modes

For automation-facing commands, prefer:

- `--json` for structured output
- `--plain` only when rich human formatting would otherwise break scripting
- `-` for stdin/stdout when stream workflows are a first-class use case

When output points users to URLs, docs, or source locations, prefer full terminal-clickable URLs and `path:line[:column]` style file references over opaque short links.

## Error Model

Define an application error type with at least:

- stable machine code
- mapped exit code
- user-facing message
- optional structured details for debug mode

Expected failures should produce actionable messages. Unexpected failures should produce a short summary plus a path to deeper debugging (`--debug`, log file, trace id, etc.).

For installable or user-facing CLIs, error and bug-report paths should include enough support context to identify the running build:

- command name and version
- stable error code
- debug or verbose path for deeper diagnostics
- issue/report URL only when it is maintained and prefilled without leaking secrets

## Command Grammar And Evolution

- keep flags and subcommands order-independent where practical
- use explicit, stable aliases instead of non-deterministic prefix abbreviations
- avoid catch-all implicit subcommands because they trap future command names
- for multi-level CLIs, keep noun/verb ordering consistent
- treat subcommands, flags, env vars, config keys, and machine-readable output as versioned interfaces
- prefer additive evolution; when breaking changes are unavoidable, emit deprecation warnings with a clear migration path

## Protected Option Validation Boundary

Per-action option allowlists for protected commands are CLI-layer contract validation. They must run before command handlers call app/use-case modules or infrastructure adapters.

Keep this separate from domain business rules. The CLI layer decides whether the requested flags are allowed for that action; the application and domain layers decide whether the valid request is meaningful for the product.

## Signals, Recovery, And Interruptions

- Ctrl-C and POSIX termination signals such as `SIGINT` and `SIGTERM` should interrupt promptly
- cleanup must not hang forever; bound it with timeouts
- if a second Ctrl-C changes behavior, say so explicitly
- design long-running work to be resumable, idempotent, or crash-only where possible
- never assume the previous run finished cleanup before the next invocation starts

## Repository Layout

### Simple CLI Blueprint

```text
my-cli/
├── package.json
├── tsconfig.json
├── src/
│   ├── cli.ts
│   └── runFoo.ts
├── test/
│   ├── cli.integration.test.ts
│   └── runFoo.test.ts
└── dist/
```

Use this when:

- the CLI is small
- there are one or two commands
- the product is not expected to become a platform

### Complex CLI Blueprint

```text
my-cli/
├── package.json
├── src/
│   ├── cli/
│   │   ├── index.ts
│   │   ├── commands/
│   │   ├── output/
│   │   ├── prompts/
│   │   └── tty/
│   ├── app/
│   │   ├── usecases/
│   │   ├── services/
│   │   └── errors/
│   ├── domain/
│   └── infra/
├── test/
│   ├── unit/
│   ├── integration/
│   └── contract/
└── dist/
```

Use this when:

- command count is growing
- output modes are non-trivial
- the CLI talks to real external systems
- you want framework migration to stay cheap

### TUI Blueprint

```text
my-cli/
├── package.json
├── src/
│   ├── cli/
│   │   ├── index.ts
│   │   └── commands/
│   ├── tui/
│   │   ├── app.tsx
│   │   ├── screens/
│   │   ├── components/
│   │   └── hooks/
│   ├── app/
│   ├── domain/
│   └── infra/
├── test/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   └── tui/
└── dist/
```

Use this when:

- terminal rendering is central to the product
- you need interactive state over time

Do not let `tui/` become the only way to access core functionality.

The blueprints above use `dist/` as the common default example. The actual build output directory should be agreed with the operator for the target repository and may instead be `bin/`, `scripts/`, or another repo-standard runtime folder.

## Packaging Structure

For package-based CLI work:

- source code lives in `src/` as TypeScript
- tests live in `test/` as TypeScript
- build output defaults to `dist/`, but the final output directory should be agreed with the operator and may be `dist/`, `bin/`, or `scripts/` depending on repo conventions
- `package.json#bin` points at the runtime entry inside the chosen output directory; for published CLIs, prefer an explicit object mapping command name to runtime entry
- `package.json#files` allowlists only the built runtime files and required assets
- `package.json#version` is the single source of truth for `--version` unless the repository has a stronger release metadata source
- `package.json#engines.node` states the supported Node baseline, and unsupported runtimes fail early with a clear message when practical
- tiny shell wrappers are acceptable, but do not bury real product logic in `bin/`
- Vite is the standard build bundler for new CLIs and when build tooling is selected or replaced
- for Vite-based CLI builds, set an explicit Node-oriented target and entry instead of relying on browser defaults
- set the bundler output directory explicitly so the runtime path matches the agreed package layout
- keep sourcemaps enabled for production debugging unless the distribution model has a strong reason not to
- executable entries should use an environment-based shebang such as `#!/usr/bin/env node`; never hardcode a machine-specific Node path

In a pnpm workspace:

- each CLI should be its own package
- shared libraries should be imported as libraries, not copy-pasted into each CLI
- one-off repo scripts should not quietly grow into unversioned pseudo-products

## Vite Build Standard

In this skill, Vite is the build standard for new TypeScript CLIs and for requested build migrations. Verify the installed Vite major and its current official build configuration before writing config; the contract below wins over a memorized option name.

When an existing project uses another build and migration is outside the request, preserve that build for the scoped change, verify its real artifact, and report the deviation. Do not introduce a second bundler or present the alternative as another standard.

Use Vite only when the configuration is clearly shaped around a Node CLI contract:

- use an explicit CLI entry file rather than any HTML- or browser-oriented entry assumptions
- target the supported Node runtime baseline explicitly instead of inheriting browser defaults
- preserve the executable entry behavior, including shebang expectations and startup semantics
- externalize Node built-ins and dependencies that must remain runtime-resolved, especially native addons, plugin hosts, and intentionally dynamic integrations
- keep sourcemaps for production debugging unless distribution requirements explicitly forbid them
- verify dynamic imports, assets, templates, and runtime-relative file access against the built artifact, not just source execution
- avoid browser polyfills, client-side globals, or bundler magic that obscures what will actually run under Node

Bundling is an implementation choice, not a license to hide the runtime contract. The built CLI still needs a predictable startup path, filesystem model, and subprocess model.

Minimal baseline shape:

```ts
import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'

const nodeTarget = 'node<active-lts-major>'
const builtinExternal = [
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`),
]

export default defineConfig({
  build: {
    target: nodeTarget,
    sourcemap: true,
    lib: {
      entry: 'src/cli.ts',
      formats: ['es'],
      fileName: () => 'cli.js',
    },
    rolldownOptions: {
      external: builtinExternal,
    },
  },
})
```

Apply the rest of the CLI contract around that baseline:

- replace `node<active-lts-major>` with the actual supported Node baseline for the package before shipping the config
- if the bundled output drops the shebang, restore `#!/usr/bin/env node` in a post-build step or tiny wrapper and verify the final `bin` target is executable
- externalize additional runtime-resolved packages when the CLI hosts plugins, uses native modules, or depends on filesystem-relative loading
- set `outDir` to the agreed runtime folder and point `package.json#bin` at the built entry there
- smoke test that exact runtime path after build
- if the CLI requires build behavior that the current Vite contract cannot safely express, stop and surface the incompatibility instead of silently replacing the standard; a separately scoped build-system skill may own that project

## Documentation Surface

- help text is not the only documentation surface
- long-lived CLIs should expose web docs or versioned docs
- command help should link to the next place a user can continue
- add walkthroughs or tutorials when the CLI supports workflows, not just isolated commands
- consider man pages or offline docs only when operational context or user environment justifies them

## Performance Rules

- keep the entrypoint small
- lazy-load rarely used commands, TUI code, and heavy integrations
- do not perform network calls, plugin discovery, or update checks before command selection
- treat startup time as a product concern for frequently executed tools
- print something quickly before long-running or network-heavy work so the tool does not feel hung

## Cross-platform Rules

- test Windows explicitly; do not assume POSIX shell behavior
- use structured subprocess APIs instead of shell-joined strings
- use `process.cwd()` for user-supplied relative paths and `import.meta.dirname` / module-relative resolution for files shipped with the CLI
- normalize paths and line endings where CLI contracts depend on them
- design for terminals that are narrow, non-color, or not fully interactive
- use standard env vars where helpful, for example `NO_COLOR`, `DEBUG`, proxy vars, `EDITOR`, `PAGER`, `LINES`, and `COLUMNS`

## Design Review Checklist

- Does the CLI layer stay thin?
- Are the module boundaries explicit enough that core behavior can be unit tested without spawning the full CLI?
- Is config precedence deterministic?
- Is the output contract explicit?
- Is command grammar future-proof enough to evolve safely?
- Can the same core operation run non-interactively?
- Are destructive commands idempotent or safely repeat-detectable?
- Does Ctrl-C behavior stay prompt and predictable?
- Can the business logic survive a parser/framework swap?
