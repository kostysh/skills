# CLIG Baseline

This reference adapts the most useful parts of the Command Line Interface Guidelines to modern Node.js and TypeScript CLI work.

Use it when you need a baseline contract for CLI behavior, especially before discussing frameworks or implementation details.

## Philosophy Baseline

Adopt these principles by default:

- human-first design
- simple parts that work together
- consistency across programs
- saying just enough
- ease of discovery
- robustness
- empathy

A production CLI should feel pleasant for humans and predictable inside scripts. These goals are not in conflict.

## Operational Rules

### Basics

- use a real argument parsing library or a well-scoped built-in parser
- return `0` on success and stable non-zero codes on meaningful failure classes
- send primary and machine-readable output to `stdout`
- send errors, diagnostics, prompts, and log-style messaging to `stderr`

### Help

- support `-h` and `--help` everywhere
- show concise help when a command is invoked without required inputs, unless that command is intentionally interactive-first and still offers a non-interactive path
- put examples near the top of help output
- expose a support path or docs link from top-level help
- for `git`-like CLIs, support `help` subcommands where it improves discoverability

### Output

- treat human-readable output and scriptability as dual requirements
- provide `--plain` only when the default human view would otherwise break pipelines
- keep structured output stable through `--json`
- base color and terminal effects on TTY detection and standard env vars such as `NO_COLOR`

### Errors

- rewrite expected failures into actionable messages
- do not dump raw stack traces by default for user errors
- make the next corrective action obvious

### Arguments, Flags, And Input

- prefer flags over positional arguments for optional behavior
- keep flags and subcommands order-independent where practical
- use explicit, stable aliases instead of ambiguous prefix abbreviations
- support `-` for stdin/stdout where stream-based workflows make sense
- do not read secrets directly from flags

### Interactivity

- only prompt when `stdin` is interactive
- support `--no-input` or equivalent
- if non-interactive mode lacks required data, fail with a clear instruction about which flag or file to use
- preserve Ctrl-C and escape paths

### Subcommands

- choose subcommands only when they reduce complexity
- keep naming and verbs consistent across subcommands
- avoid ambiguous subcommand names
- do not add catch-all implicit subcommands that block future expansion

### Robustness

- validate input early
- print something quickly before long work or network I/O
- show progress only when it helps and can be rendered clearly
- make long-running operations time out
- design for resumability, idempotence, or crash-only recovery where possible

### Future-proofing

- treat flags, env vars, subcommands, and machine-readable output as versioned interfaces
- prefer additive changes
- warn before breaking changes and tell users how to migrate
- do not make unstable human output the only interface scripts can depend on

### Signals And Control Characters

- respond to Ctrl-C immediately
- bound cleanup with timeouts
- if a second Ctrl-C changes behavior, tell the user exactly what it does
- design startup so the program can recover even when prior cleanup did not run

### Configuration And Environment

- document config precedence clearly
- default precedence:
  - flags
  - environment variables
  - project config
  - user config
  - system config
  - built-in defaults
- use XDG-aware config locations where a user-level config file is justified
- use standard env vars where they already exist: `NO_COLOR`, `DEBUG`, `EDITOR`, proxy vars, `TMPDIR`, `PAGER`, `LINES`, `COLUMNS`
- do not use `.env` as a universal substitute for real configuration

### Naming

- choose a short, memorable, lowercase command name
- avoid generic names that collide with system tools or other ecosystems
- optimize for repeated typing, not branding flourish

### Distribution And Analytics

- for general-user tools, consider whether a standalone distribution materially improves installation and removal
- for language-specific developer tools, standard package-manager distribution is acceptable
- analytics should be opt-in when possible, or at minimum explicitly disclosed and easy to disable
- prefer docs instrumentation, download metrics, and direct user feedback over opaque background telemetry

### Documentation

- ship web documentation for long-lived CLIs
- make documentation reachable from the terminal through help output and command-level help
- add tutorials or walkthroughs when the CLI has higher-level workflows, not just flags
- consider man pages or offline docs only when the CLI has enough surface area or operational context to justify them

## Node And TUI Adaptations

CLIG is an excellent baseline, but adapt it carefully for this repository domain:

- CLIG does not focus on full-screen terminal programs. Use it for the command contract around a TUI, not as the sole guidance for persistent terminal UI design.
- For Node.js, standalone distribution is a decision, not an absolute rule. npm distribution remains a sound default for interpreter-native or developer-facing tools; use SEA or installers only when distribution requirements justify the extra contract.
- CLIG is stricter than many ecosystems about secret environment variables. For new designs, prefer files, stdin, keychain integration, secret managers, or IPC over env vars. If an existing ecosystem already depends on env-based secrets, document the risk and keep the interface explicit.
- This repository standard uses Vite as the default CLI bundler and `node:test` as the default test baseline unless a repo or framework has a stronger established standard. Treat that as a local convention layered on top of CLIG, not as a universal ecosystem default.

## What To Pull Into Reviews

When reviewing or designing a CLI, ask:

- Is it human-first without breaking pipes and scripts?
- Is the help discoverable, example-led, and concise by default?
- Is the automation-safe output surface explicit?
- Can prompts, TUI, and progress rendering be bypassed cleanly?
- Is the command grammar stable enough to evolve without trapping future versions?
- Are config and env rules documented and unsurprising?
