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

## Color And Formatting

- use color only when the terminal supports it
- honor `NO_COLOR` and explicit no-color flags
- allow an explicit force-color path only when the renderer can handle it safely
- do not rely on color as the only signal for status
- keep table and line output readable in narrow terminals

## Telemetry And Updates

- telemetry must be transparent, documented, and easy to disable
- opt-in is preferred; opt-out requires explicit disclosure and a frictionless disable path
- never block startup on analytics
- update notifications should be lazy, infrequent, and respectful of TTY
- do not surprise users with network traffic on every command invocation
- prefer docs instrumentation, download metrics, and direct user feedback before background telemetry

## Security Rules

### Secrets

- do not require secrets via argv when stdin, env, config files, or keychain integration is safer
- for new designs, prefer files, stdin, keychain, secret managers, or other IPC over environment variables for secrets
- if env-based secrets are required for ecosystem compatibility, document the leak surface explicitly
- for service-backed CLIs, prefer env vars or documented user config for normal auth and reserve token flags for explicit one-off tests
- when the CLI exposes `doctor --json` or equivalent health output, report whether auth is present and its source category without printing the secret value
- never echo secrets back to the terminal
- redact secrets from logs, error output, and debug traces

### Subprocess safety

- prefer structured argument APIs over shell-interpolated command strings
- never concatenate untrusted input into shell commands
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
- Logging raw tokens, credentials, or secret file contents
- Treating help text as an afterthought instead of a contract
