## Scope and outcome

Applies to TypeScript-only Node.js command-line software, from small commands to plugin-capable CLIs and interactive TUIs.

The outcome is a CLI whose documented user jobs work through the built or installed command on the claimed platforms and boundaries. A parser, package manifest, Vite build, generated help, green test suite, mock, or stub is substrate or bounded evidence; it is not the end-to-end capability by itself.

## Standard tooling baseline

For new CLI work and when selecting or replacing build/test tooling:

- resolve the current **Active LTS** Node.js line from official Node.js sources at task time; do not permanently encode a remembered major as this skill's default
- use TypeScript for runtime source and tests
- use Vite for the CLI build, with an explicit Node target and executable artifact contract
- use `node:test` for unit, process-level integration, and CLI contract tests
- run compatible TypeScript tests and scripts with the current Active LTS native type-stripping path and run a separate typecheck
- keep directly executed TypeScript erasable and independent of `tsconfig`-only runtime transforms
- never add or invoke `tsx`; rewrite the script to the supported profile or execute Vite-built JavaScript instead
- use Vitest only when the user or an authoritative project contract explicitly requires it

When an existing project uses another build system and migration is outside the request, work with that build without broad migration, report the deviation, and do not extend it into another recommended standard. This exception does not permit adding or invoking `tsx`.

## CLI contract non-negotiables

- Keep the CLI layer thin: parsing, help, TTY detection, formatting, option validation, and exit mapping stay at the boundary; business rules do not.
- Prefer the first sufficient parser surface: `node:util.parseArgs`, an established parser dependency, or the thinnest framework that meets the real command/help/plugin contract.
- Use conventional POSIX-style command and flag grammar, but implement and verify filesystem, subprocess, install, and terminal behavior across every claimed platform.
- Provide a non-interactive path for every prompt or TUI job through flags, args, stdin, config, or files.
- Write primary and machine-readable results to `stdout`; write diagnostics, prompts, progress, warnings, and errors to `stderr`.
- Treat command names, flags, config/env keys, `--help`, `--version`, structured output, and exit codes as versioned public API.
- Reject unknown, removed, or prohibited options for protected deploy, rollback, release, infrastructure, subprocess, network, filesystem, or persistence actions before any side effect.
- Define stable error codes and exit mappings instead of scattering ad hoc `process.exit(1)` calls.
- Detect TTY before prompts, color, spinners, progress, or full-screen UI; respect CI, `NO_COLOR`, and non-interactive shells.
- Keep config precedence deterministic. Persist state only when repeated use benefits, use platform-appropriate locations, and document cleanup.
- Never require secrets through argv when a provider-supported safer channel exists; never echo secrets or include them in debug output.
- Use structured subprocess APIs and explicit argument arrays; never interpolate untrusted input into a shell command.
- For complex CLIs with many commands, flags, or dynamic operands, consider opt-in shell completion generated from the same command metadata as parsing and help.

## Verification boundary

Unit tests are mandatory, followed by process-level integration and public-contract coverage. The repository quality gate should include typecheck, format check, lint, `node:test`, Vite build, and artifact smoke verification.

For durable or installable CLIs:

1. inspect the packed package contents;
2. install the package in an isolated, platform-appropriate temporary location;
3. invoke the exact `package.json#bin` command outside the source tree;
4. verify `--help`, `--version`, one representative success job, and one representative failure job;
5. observe exit status, `stdout`, `stderr`, and relevant side effects.

For service-backed jobs, use a real service, a sandbox, or an authoritative contract-conformant boundary. Mock/stub-only evidence must remain `partial` and cannot verify the real service boundary.

## Reference navigation

Read only the smallest matching optional reference:

- [clig-baseline.md](references/clig-baseline.md) — baseline command behavior and design-review questions
- [framework-selection.md](references/framework-selection.md) — parser, framework, prompt, and TUI selection
- [architecture-and-layout.md](references/architecture-and-layout.md) — modular boundaries, Vite artifact layout, config, output, and cross-platform design
- [service-backed-clis.md](references/service-backed-clis.md) — service command taxonomy, auth reporting, installability, and representative boundary verification
- [testing-and-release.md](references/testing-and-release.md) — `node:test`, native TypeScript execution, installed-command evidence, packaging, release preparation, and authorized publication
- [ux-and-security.md](references/ux-and-security.md) — help, prompts/TUI, completion, secrets, protected options, subprocesses, and telemetry

Load multiple references only when the task crosses those boundaries. Use `rg` inside the selected file when only one section is needed.
