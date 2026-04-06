# CLI Testing And Release

## Language And Runner Baseline

For this skill, runtime code and tests are both TypeScript.

- execute tests with Node's built-in runner and native type stripping
- representative command: `node --experimental-strip-types --test test/*.test.ts`
- do not use the `tsx` runtime to execute tests
- keep test entrypoints and helpers compatible with direct Node execution

## Test Pyramid

Treat CLI quality as more than parser correctness.

### Unit tests

Unit tests are mandatory.

Test:

- use cases
- domain rules
- error mapping helpers
- pure formatters and parsers

Keep these free of real process spawning and real network I/O.

### Integration tests

Execute the CLI as a real process and assert on:

- exit code
- `stdout`
- `stderr`
- filesystem side effects
- environment-dependent behavior

Use temporary directories and isolated env vars. Prefer black-box assertions over internal mocking here.

### Contract tests

Lock down public CLI surface:

- `--help`
- concise help when required args are missing, unless the command is intentionally interactive-first and still exposes a non-interactive path
- `--json`
- `--plain` when the CLI explicitly supports a richer human view that needs a script-safe escape hatch
- stable exit-code mappings
- machine-readable schema for automation-facing commands
- deprecation warnings for interfaces scheduled to change

Be selective with snapshots. Snapshot only stable contract surfaces, not noisy debug output.

## Runner Selection

### `node:test`

Prefer when:

- the CLI is pure Node.js
- you want low dependency surface
- process-level integration is the main concern
- the repository does not already have a stronger established runner standard

Good fit:

- small and medium CLIs
- internal tools
- repositories already committed to Node-native execution

This is the required test baseline for this skill.

Use it to cover:

- pure unit tests for use cases and formatters
- spawned process tests for exit code, `stdout`, `stderr`, and filesystem effects
- contract tests for help, `--json`, deprecations, and non-interactive behavior
- smoke tests that execute the built artifact rather than only source-mode entrypoints

Use built-in mocking only where it meaningfully simplifies isolated tests. Keep published-command verification black-box and process-level.

Do not replace this with `tsx`-driven test execution. If the repo needs TypeScript test execution without precompilation, use Node's type-stripping path directly.

### Framework-specific helpers

Use them only when they materially reduce boilerplate.

- `@oclif/test` is useful for oclif command execution
- framework helpers do not replace `node:test` as the primary runner or process-level tests for published artifacts

## TUI And Interactive Testing

For prompts and TUI flows, always test both:

- TTY / interactive path
- non-TTY / piped / CI path

Verify:

- prompts do not appear when `stdin` is not interactive
- `--yes`, `--no-input`, or equivalent bypasses exist
- Ctrl-C and abort flows are handled cleanly
- color/spinner/progress behavior degrades safely in CI or non-TTY
- password prompts do not echo sensitive input

If the interactive framework offers test helpers, use them, but still keep at least one process-level smoke test for the real entrypoint.

## Quality Gate Baseline

If the target CLI repository does not already provide an equivalent gate, add one.

Minimum required quality checks before a CLI is considered ready:

1. typecheck
2. format check
3. lint
4. unit tests
5. integration tests
6. contract tests
7. build
8. artifact smoke test

Repository scripts should expose these checks clearly. Typical script names are:

- `typecheck`
- `format`
- `format:check`
- `lint`
- `lint:fix`
- `test`

The exact formatter or linter may vary by repo, but the gate itself should not be omitted just because the repository started without one.

## Release Baseline

Minimum baseline for a production CLI:

1. typecheck
2. unit tests
3. integration tests
4. contract tests
5. build
6. artifact smoke test
7. non-TTY / CI smoke path for interactive-capable commands

Do not publish a CLI because unit tests passed while the built artifact was never executed.

## Packaging Rules

For npm-distributed CLIs:

- define `bin`
- keep `files` tight
- publish only built runtime files and required assets
- set `engines.node` intentionally
- ensure shebang handling survives the build tool
- make uninstall straightforward and documented where install instructions are published
- for bundled TypeScript CLIs, prefer Vite as the default bundler baseline and configure it for a Node target rather than browser defaults
- choose the build output directory with the operator for the target repo; `dist/` is common, but `bin/` or `scripts/` may be the correct runtime folder in repos with established conventions
- verify the built executable entry through the real `bin` path after bundling, not only via direct source execution

For standalone distribution:

- use Node SEA only when the distribution requirement is real
- smoke test each target OS/arch artifact
- validate assets, dynamic imports, and runtime path assumptions before promising standalone support

For user-facing general-purpose tools, decide explicitly whether a standalone artifact materially improves installation and removal. For language-specific tooling, npm-only distribution is often enough.

## Supply-chain And Publish Safety

- commit lockfiles
- publish from CI, not from a laptop shell, when the product matters
- prefer trusted publishing where the registry supports it
- generate provenance/attestations when available
- rotate or eliminate long-lived publish tokens
- keep analytics and update checks out of the publish path unless they are deliberately tested and disclosed

## Release Workflow

Typical release flow:

1. run required checks
2. build CLI artifacts
3. smoke test built package and optional standalone artifacts
4. publish package
5. verify install and command startup from a clean environment
6. verify update path if the CLI has plugin or self-update behavior
7. verify uninstall or clean removal instructions still work

## Review Checklist

- Was the real built command executed in tests?
- Are stdout/stderr and exit codes asserted?
- Are non-interactive and CI paths covered?
- Are deprecation and migration surfaces tested when interfaces evolve?
- Are publish credentials and provenance handled safely?
- Are optional standalone artifacts treated as a separately verified contract?
