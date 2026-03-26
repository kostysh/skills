---
name: cli-engineer
description: |
  Standardize and build production-grade command-line tools in Node.js and TypeScript.
  Use when designing or reviewing CLI/TUI utilities, choosing frameworks, structuring
  packages, defining help/output/error contracts, testing command behavior, handling
  prompts or terminal UI, and packaging or releasing command-line apps.
---

# CLI Engineer

## Scope

Applies to Node.js and TypeScript command-line software, from tiny single-command tools to plugin-capable CLIs and interactive TUI applications.

If the repository already has established CLI conventions, follow them unless they are the source of the problem.

## Default Tooling Baseline

Within this repository's convention, when the target repository does not already enforce a different choice:

- prefer Vite as the default bundler for TypeScript CLI builds
- prefer `node:test` as the default test runner for CLI packages
- configure Vite for a Node CLI entrypoint, preserved executable startup behavior, and artifact smoke tests after build
- treat the Vite choice as a repository standard, not as a claim that the broader CLI ecosystem has one universal bundler default

Do not force either tool when framework-specific or repo-specific constraints clearly require something else.

## Interop (Priority)

- This skill owns CLI architecture, command model, output/error contracts, prompts/TUI behavior, packaging, and CLI-specific DX.
- Defer low-level Node runtime behavior, module-resolution problems, and shutdown/resource issues to `node-engineer`.
- Defer TypeScript type-system design, advanced generics, and tsconfig policy to `typescript-engineer`.
- Defer broad test policy, runner mechanics, and CI test gating to `typescript-test-engineer`.
- Defer deep threat modeling, secrets review, and security sign-off to `security-reviewer`.
- If rules conflict, this skill owns the CLI contract; the other skills own their domain specialties.

## Non-negotiables

- Keep the CLI layer thin. Parsing, help, TTY detection, formatting, and exit codes belong in CLI code; business rules do not.
- Every interactive flow must have a non-interactive path through flags, args, stdin, config, or files.
- Use `stdout` for primary output and machine-readable output; use `stderr` for diagnostics, prompts, and errors.
- Treat `--help`, output shape, flag names, and exit codes as public API.
- Show concise help when required inputs are missing, unless the command is intentionally interactive-first and still exposes a non-interactive path; show full help on `-h` / `--help`.
- Define an explicit error taxonomy and exit-code mapping; do not scatter ad hoc `process.exit(1)`.
- Detect TTY before prompts, spinners, colors, or full-screen UI; respect CI and non-interactive shells.
- Keep CLI evolution additive where possible: prefer explicit aliases, avoid catch-all subcommands, and do not rely on ambiguous prefix abbreviations.
- Never require secrets on the command line when stdin, env, keychain, or config files are safer.
- Prefer the current Active LTS Node baseline for new CLI work, but verify the current release state before locking version advice into code or docs.

## When to Use This Skill

Use when:

- Designing a new CLI package or restructuring an existing one
- Choosing between `node:util.parseArgs`, `commander`, `oclif`, `cac`, `clipanion`, prompt libraries, or Ink
- Standardizing help text, errors, stdout/stderr behavior, `--json`, conditional `--plain`, and exit codes
- Building interactive prompts or a terminal UI while preserving automation-safe behavior
- Setting up CLI testing, release automation, packaging, npm publishing, provenance, or optional standalone distribution
- Standardizing Vite-based CLI bundling and `node:test` process-level verification
- Reviewing a CLI for UX, scripting composability, cross-platform behavior, or operational safety

## When NOT to Use This Skill

Do NOT use for:

- General Node backend or service runtime work without a CLI surface; use `node-engineer`
- Type-level library API design that is not CLI-specific; use `typescript-engineer`
- Pure test-runner troubleshooting without CLI-specific behavior; use `typescript-test-engineer`
- Broad security review without CLI-specific attack surfaces; use `security-reviewer`

## Quick Decision Matrix

| Situation | Default choice | Use when | Avoid when |
| --- | --- | --- | --- |
| Tiny one-shot CLI or internal utility | `node:util.parseArgs` | You want minimal dependencies and can own help/validation yourself | You need rich help, command trees, or plugin behavior |
| Small or medium production CLI | `commander` | You need a low-abstraction default with predictable help and wide ecosystem familiarity | You already know you need plugin infrastructure or full-screen UI |
| Performance-sensitive minimalist CLI | `cac` | You want a small ESM-first framework and low startup overhead | The repo cannot support the framework's current ESM/Node baseline |
| Complex CLI platform with plugins or multi-team lifecycle | `oclif` | You need plugins, generators, enterprise-style extensibility, and long-lived CLI tooling | The CLI is small enough that platform overhead becomes lock-in |
| Advanced command grammar and strict typed command model | `clipanion` | You specifically need nested commands, option proxying, or command-class discipline and accept its maturity tradeoffs | The team wants the most conservative, ecosystem-mainstream choice |
| Prompt-driven guided flow | thin parser + `@inquirer/prompts` | The interaction is still form-like, linear, and optional | The product needs persistent terminal UI state |
| Rich interactive TUI | thin parser + Ink | You need full-screen terminal rendering, live state, or dashboard-like behavior | The tool must stay primarily pipe-friendly and script-first |

## Quick Workflow

1. Classify the CLI before choosing tools: tiny utility, standard multi-command CLI, plugin platform, or rich TUI.
2. Decide the automation contract first: human-only, human-first but scriptable, or machine-first with human affordances.
3. Pick the thinnest framework that satisfies the real requirements.
4. Separate CLI/adapters from app/domain logic and define config precedence, output modes, and error codes.
5. Design non-interactive paths before prompts or TUI polish.
6. Build tests at three levels: behavior, process execution, and contract surface, with `node:test` as the default baseline unless the repo already dictates otherwise.
7. Package and release with reproducible builds, Vite artifact smoke tests, platform smoke tests, and provenance where supported.

## High-signal Triggers

- **Need a baseline command contract or design review standard**: read `references/clig-baseline.md` first.
- **Need plugins or a true multi-team CLI platform**: read `references/framework-selection.md` and bias toward `oclif`.
- **Need tiny dependency surface or frequent CI invocation**: read `references/framework-selection.md` and `references/architecture-and-layout.md` for `parseArgs` / `cac`.
- **Need bundling guidance or executable artifact rules**: read `references/architecture-and-layout.md` and `references/testing-and-release.md` for the Vite baseline.
- **Need interactive flows**: read `references/ux-and-security.md` before adding prompts or Ink. TUI is never the only path.
- **Need contract-safe testing or packaging**: read `references/testing-and-release.md` before finalizing command output or publish workflows.

## When You Need More Detail

Read only the smallest relevant reference file:

- [clig-baseline.md](references/clig-baseline.md) - adopted CLIG principles and how they map onto modern Node.js / TypeScript CLI work
- [framework-selection.md](references/framework-selection.md) - how to choose frameworks and stacks for simple, complex, and interactive CLI work
- [architecture-and-layout.md](references/architecture-and-layout.md) - package structure, command layering, config precedence, output model, and cross-platform design
- [testing-and-release.md](references/testing-and-release.md) - test pyramid, process-level integration, TUI/non-TTY testing, packaging, publishing, and release workflow
- [ux-and-security.md](references/ux-and-security.md) - help/output/error UX, prompts/TUI rules, secrets handling, command execution safety, telemetry, and anti-patterns

Use `rg` if you only need one section:

- `rg -n "Philosophy Baseline|Operational Rules|Node And TUI Adaptations" references/clig-baseline.md`
- `rg -n "Decision Matrix|Framework Notes" references/framework-selection.md`
- `rg -n "Simple CLI Blueprint|Complex CLI Blueprint|TUI Blueprint" references/architecture-and-layout.md`
- `rg -n "Runner Selection|Integration Tests|Release Baseline" references/testing-and-release.md`
- `rg -n "Output Contract|Interactive Rules|Security Rules|Anti-patterns" references/ux-and-security.md`
