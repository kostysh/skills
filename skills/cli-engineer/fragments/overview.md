## Scope and outcome

Applies to TypeScript-only Node.js command-line software, from small commands to plugin-capable CLIs and interactive TUIs.

The outcome is a CLI whose documented user jobs work through the built or installed command on the claimed platforms and boundaries. A parser, package manifest, Vite build, generated help, green test suite, mock, or stub is substrate or bounded evidence; it is not the end-to-end capability by itself.

## Tooling applicability

Apply the [Standard CLI toolchain policy](#standard-cli-toolchain) before choosing tools. Inspect and run existing supported repository commands for an ordinary fix; use the new-setup defaults only when that setup or replacement is in scope.

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

Verify the changed behavior with unit, process, and public-contract coverage as applicable, plus the repository's required checks. New setup or authorized quality-gate hardening supplies missing gates; an ordinary repair uses existing supported tooling and reports material coverage gaps.

For durable or installable CLIs:

1. inspect the packed package contents;
2. install the package in an isolated, platform-appropriate temporary location;
3. invoke the exact `package.json#bin` command outside the source tree;
4. verify `--help`, `--version`, one representative success job, and one representative failure job;
5. observe exit status, `stdout`, `stderr`, and relevant side effects.

For service-backed jobs, use a real service, a sandbox, or an authoritative contract-conformant boundary. Mock/stub-only evidence must remain `partial` and cannot verify the real service boundary.
