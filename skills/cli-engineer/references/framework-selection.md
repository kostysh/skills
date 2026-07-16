# CLI Framework Selection

## Baseline Rules

- Do not pick a framework before classifying the CLI:
  - tiny utility
  - standard multi-command CLI
  - plugin platform
  - rich TUI
- Default to the lowest abstraction that still solves the real problem.
- Before adding a new framework or library, check the first sufficient rung: built-in `node:util.parseArgs`, native shell/stdin/stdout behavior, a dependency already present in the project, then one small local adapter. Add a new CLI framework only when those rungs cannot meet the command, help, validation, extensibility, or TTY contract.
- Verify the current Active LTS Node version and the current framework major before hardcoding version guidance into project files or docs.
- For new CLI work and when build/test tooling is selected or replaced, use Vite and `node:test`. Never add or invoke `tsx`; use the current Active LTS native type-stripping path for compatible TypeScript.
- Use Vitest only when the user or an authoritative project contract explicitly requires it.
- Preserve an existing non-Vite build when migration is outside the request, verify its actual artifact, and report the deviation instead of expanding the alternative into another standard.
- Preserve an existing framework unless it is the source of the problem or clearly blocks the required capability.

## Decision Matrix

| Need | Preferred choice | Good alternative | Why |
| --- | --- | --- | --- |
| Tiny parser with minimal deps | `node:util.parseArgs` | `cac` | Built-in option when you can own help, validation, and command routing yourself |
| Small/medium production CLI | `commander` | `yargs` or `cac` | Good default with low lock-in and clear mental model |
| Plugin-capable platform | `oclif` | custom layering on `commander` only if plugins are light | Built for extensibility, generators, and long-lived CLI products |
| Advanced command grammar | `clipanion` | `yargs` | Strong fit for nested commands, proxying, and command-class discipline when the team accepts its maturity tradeoffs |
| Linear guided prompts | `@inquirer/prompts` on top of your parser | `inquirer` in repos already using it | Keep prompts optional and thin |
| Full-screen TUI | Ink + thin parser | lower-level terminal libs only when React is a bad fit | Rich interactive terminal UI without inventing your own rendering model |

## Default Recommendations

### `commander`

Choose by default for new general-purpose CLIs when:

- the tool is not a plugin platform
- you want a predictable command/flag/help model
- the team values readability and low abstraction over framework magic

Good fit:

- internal devtools
- multi-command CLIs without runtime plugin installation
- tools that need clean help and output contracts

Watch for:

- if the ecosystem moves its baseline Node or module strategy, update your package baseline intentionally rather than carrying compatibility shims forever
- commander is a framework for commands and flags, not a complete CLI platform; own your architecture and testing strategy

### `node:util.parseArgs`

Choose when:

- the CLI is tiny
- startup cost matters
- you want almost no framework surface

Good fit:

- small internal utilities
- CI helpers
- wrappers over one or two operations

Avoid when:

- you need rich help generation
- command trees are deep
- the team will keep reinventing parser ergonomics around it

### `cac`

Choose when:

- you want a lightweight framework but not raw `parseArgs`
- you are comfortable with the current module/runtime baseline it expects
- performance and dependency surface matter

Good fit:

- developer tooling
- build/test wrappers
- small package CLIs with a few commands

Avoid when:

- the project needs the most conservative ecosystem default
- the repository cannot support the framework's current ESM-first trajectory

### `oclif`

Choose when:

- plugins are a first-class requirement
- the CLI is a long-lived product, not just a wrapper script
- you want generators, command scaffolding, and ecosystem-specific tooling

Good fit:

- enterprise CLIs
- vendor tooling
- multi-team plugin ecosystems

Avoid when:

- the CLI is small and simple
- you do not need runtime extensibility
- the extra platform conventions would just become lock-in

Do not treat standalone packaging, installability, or updater decisions as automatic reasons to adopt `oclif`. Those are separate distribution concerns.

### `clipanion`

Choose when:

- command classes fit the mental model
- nested command behavior is central
- you need advanced option handling or proxying semantics

Good fit:

- deep command trees
- tools that proxy options to other executables
- CLIs where command typing and parsing discipline matter more than ecosystem familiarity

Avoid when:

- the team wants the most mainstream, low-risk default
- the extra abstraction is not buying anything concrete
- the current maturity status of the line you would adopt is a concern for a conservative long-lived product

### Prompt Libraries and TUI

Choose `@inquirer/prompts` when:

- the interaction is linear and form-like
- prompts are optional and easy to bypass
- the CLI remains primarily command-driven

Choose Ink when:

- the tool truly benefits from persistent terminal UI
- you need live state, progress views, dashboards, or richer guided flows
- the team can support TTY and non-TTY dual behavior

Do not default to a TUI just because it looks modern. Prefer prompts over full-screen UI unless persistent interactive state materially improves the product.

## Stack Templates

### Simple CLI

- Parser: `node:util.parseArgs` or `commander`
- Validation: runtime schema validation at the CLI boundary
- Bundling: Vite
- Tests: `node:test`
- Packaging: standard npm package with a `bin` entry

### Standard Production CLI

- Parser: `commander`
- Prompts: `@inquirer/prompts` only where needed
- Validation: runtime schema validation
- Bundling: Vite as the default bundler choice
- Tests: `node:test` plus process-level integration and contract tests by default
- Packaging: npm by default; optional standalone artifacts later

### Enterprise / Platform CLI

- Framework: `oclif`
- Architecture: commands + app/domain services; plugins treated as a trust boundary
- Tests: command execution, plugin lifecycle, artifact smoke tests
- Bundling: Vite for new work; preserve an existing framework build only when migration is outside scope
- Packaging: npm plus installers/tarballs only when the distribution model truly needs them

### Rich Interactive CLI / TUI

- Router: `commander`, `cac`, or `oclif`
- UI: Ink
- Bundling: Vite; stop on an unresolved incompatibility instead of silently replacing the standard
- Rules: must still expose a non-interactive path, stable exit codes, and machine-readable fallback output

## Framework Notes

- `yargs` remains viable when the repo already uses it or needs its parser/completion ecosystem. Do not force a migration just for fashion.
- `meow` is useful for single-command CLIs, but it is not the default for larger, long-lived tools.
- `nest-commander` is appropriate only in repositories that already depend on Nest-style DI and module structure.
- Avoid archived or clearly stagnant foundations for new CLI products unless you explicitly accept the maintenance cost.
