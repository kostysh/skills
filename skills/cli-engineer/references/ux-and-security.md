# CLI UX And Security

## Output Contract

CLI UX must stay human-first without breaking automation.

Default rules:

- `stdout` carries main output and machine-readable output
- `stderr` carries errors, warnings, prompts, and progress noise
- `--json` is for structured output
- `--plain` is a conditional escape hatch for script-safe text when rich formatting would otherwise break pipes
- `--quiet`, `--verbose`, and `--debug` should mean something stable
- if input/output is stream-oriented, support `-` for stdin/stdout

Do not mix decorative human output into machine-facing modes.

## Help And Discoverability

Every user-facing command should support `--help`.

Help should include:

- one-line purpose
- concise default help when required inputs are missing, unless the command is intentionally interactive-first and still offers a non-interactive path
- the shortest path to success
- 2-4 high-value examples
- important flags only
- references to config/env behavior when it matters
- support and documentation links where users can continue

Avoid turning help into a dump of every internal option with no prioritization.

For multi-command tools, prefer:

- `mytool help`
- `mytool help subcommand`
- `mytool subcommand --help`

For long-lived CLIs, also provide:

- versioned web docs
- terminal-discoverable docs via help output
- walkthroughs or tutorials when workflows are more important than individual flags
- man pages or offline docs only when the user environment and surface area justify them

## Shell Completion

For CLIs with many subcommands, flags, or dynamic operands, provide opt-in shell completion when it materially improves discovery.

- generate completion candidates from the same command, option, and value metadata used by parsing, validation, and help
- expose an explicit command such as `completion <shell>` and document each supported shell; Bash, Zsh, Fish, and PowerShell outputs are different contracts
- write only candidates or the requested completion script to `stdout`; write warnings and diagnostics to `stderr`
- keep setup explicit and reversible
- never modify `.bashrc`, `.zshrc`, PowerShell profiles, or other shell startup files from npm lifecycle scripts
- add contract tests that compare completion-visible commands and flags with the parser/help model

Do not add completion to a small command merely to satisfy a checklist.

Optional provenance: [Node.js CLI Apps Best Practices — shell completion](https://github.com/lirantal/nodejs-cli-apps-best-practices#37-provide-shell-completion).

## Interactive Rules

- prompts only when `stdin` is interactive
- `--no-input` should disable all prompts and interactive behavior
- TUI only when both the product need and terminal conditions justify it
- destructive actions should confirm unless a deliberate bypass flag is present
- interruption via Ctrl-C should exit cleanly and predictably
- spinners and live progress must degrade safely in non-TTY and CI environments
- if prompting is impossible in non-interactive mode, fail with a clear instruction about the required flag, file, or stdin path
- password prompts should disable echo

Interactive UI is an enhancement layer, not the only product surface.

## Protected Command Option Contracts

A command is protected when it can trigger deploy, rollback, release, infra mutation, an external executor or subprocess, network mutation, persistence mutation, or another comparable protected side effect.

For ordinary read, list, search, or inspect commands, an unknown flag is usually a command-contract and automation compatibility problem. For protected commands, an unknown flag, removed flag, or prohibited legacy flag is a side-effect safety problem.

Protected commands must:

- define an explicit per-action allowlist of accepted options
- reject unknown flags before work starts
- reject removed or prohibited legacy flags before work starts
- keep deprecated-but-supported flags only as explicit aliases with a warning, a migration path, and tests until removal
- fail before service calls, executor invocation, subprocess spawning, network mutation, filesystem mutation, or persistence mutation

This is a command contract, not a parser-library requirement. Implement it with the parser and architecture the target repo already uses, but make the fail-before-side-effects boundary testable.

A protected CLI without strict option allowlists and pre-side-effect validation tests is a blocker in review.

## Color And Formatting

- use color only when the terminal supports it
- on a compatible current Active LTS baseline, consider `node:util.styleText` before adding a color dependency; use a dependency only when the existing stack or richer requirement justifies it
- honor `NO_COLOR` and explicit no-color flags
- allow an explicit force-color path only when the renderer can handle it safely
- do not rely on color as the only signal for status
- keep table and line output readable in narrow terminals

## Telemetry And Updates

- new telemetry and analytics collection must be explicit opt-in
- any inherited opt-out telemetry must be transparent, documented, and easy to disable before it is preserved
- never block startup on analytics
- update notifications should be lazy, infrequent, and respectful of TTY
- do not surprise users with network traffic on every command invocation
- prefer docs instrumentation, download metrics, and direct user feedback before background telemetry

## Security Rules

### Secrets

- do not require secrets via argv when a provider-supported safer channel exists
- follow the provider's established safe convention first; standard environment variables or documented user config are valid when the ecosystem expects them
- prefer files with safe permissions, stdin, keychain, secret managers, or IPC when the provider and threat model support them better than environment variables
- document the leak surface of every supported secret source and reserve token flags for authorized one-off tests when no safer supported route exists
- when the CLI exposes `doctor --json` or equivalent health output, report whether auth is present and its source category without printing the secret value
- never echo secrets back to the terminal
- redact secrets from logs, error output, and debug traces

### Subprocess safety

- prefer structured argument APIs over shell-interpolated command strings
- never concatenate untrusted input into shell commands
- pass user-controlled operands after a `--` terminator when the child command supports it
- validate proxyable flags and subcommands with allowlists before invoking external tools
- allowlist external commands when the CLI proxies or shells out
- quote and escape only through well-understood APIs, not ad hoc string templates

### Filesystem safety

- treat user-provided paths as untrusted
- validate overwrite behavior for destructive commands
- use safe temp directories and deterministic cleanup
- guard against path traversal if the CLI writes files based on user input

### Plugin and extension safety

- plugins are a trust boundary, not a convenience detail
- define who may install or load plugins
- verify where plugins come from and how they are updated
- never imply sandboxing if there is none

### Supply chain

- keep dependency count low
- prefer maintained, well-understood packages
- review major upgrades intentionally
- lock dependency versions through the repo's package manager workflow
- prefer trusted publishing and provenance for releases

## Anti-patterns

- Rich TUI as the only way to access core operations
- Prompt-only UX with no flag or stdin fallback
- Catch-all implicit subcommands that block future expansion
- Prefix abbreviations that are convenient today but unstable tomorrow
- Printing progress bars or spinners into non-TTY pipelines
- Human prose mixed into `--json` output
- One generic exit code for every failure
- Startup network calls before command selection
- Update checks or telemetry that slow down every invocation
- Shelling out with unsanitized user input
- Letting unknown, removed, or prohibited legacy flags reach a protected side effect
- Logging raw tokens, credentials, or secret file contents
- Treating help text as an afterthought instead of a contract
