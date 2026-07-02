---
name: cli-engineer
description: >-
  Standardize and build production-grade TypeScript command-line tools on
  Node.js.

  Use when designing or reviewing CLI/TUI utilities, choosing frameworks,
  structuring

  packages, enforcing modular architecture, defining help/output/error
  contracts,

  testing command behavior, setting up quality gates, handling prompts or
  terminal

  UI, and packaging or releasing command-line apps.
metadata:
  source-version: 0.1.3
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 5deceebb91d13d2eb03f7c1081907d6deebf7b8a1a7efa35a1cb7159c40c8d96
---

# cli-engineer

## Start here

1. Confirm the task matches cli-engineer's applicability criteria.
2. Use the preserved overview guidance as the normative workflow for this skill.
3. Load only the active references that match the current task.
4. Before adding a CLI framework, parser helper, prompt layer, or TUI library, check whether `node:util.parseArgs`, native shell behavior, an existing project dependency, or a thinner wrapper already satisfies the command contract.
5. Preserve existing project conventions unless the overview explicitly requires a stricter invariant.

## When to use this skill

- Designing a new CLI package or restructuring an existing one
- Choosing between `node:util.parseArgs`, `commander`, `oclif`, `cac`, `clipanion`, prompt libraries, or Ink
- Standardizing help text, errors, stdout/stderr behavior, `--json`, conditional `--plain`, and exit codes
- Building interactive prompts or a terminal UI while preserving automation-safe behavior
- Setting up CLI testing, release automation, packaging, npm publishing, provenance, or optional standalone distribution
- Requiring modular CLI architecture for better testability or adding a missing repo quality gate
- Standardizing Vite-based CLI bundling and `node:test` process-level verification
- Reviewing a CLI for UX, scripting composability, cross-platform behavior, manifest/package contracts, or operational safety

## When NOT to use this skill

- General Node backend or service runtime work without a CLI surface; use `node-engineer`
- Type-level library API design that is not CLI-specific; use `typescript-engineer`
- Pure test-runner troubleshooting without CLI-specific behavior; use `typescript-test-engineer`
- Broad security review without CLI-specific attack surfaces; use `security-reviewer`

## Scope

Applies to TypeScript-only Node.js command-line software, from tiny single-command tools to plugin-capable CLIs and interactive TUI applications.

If the repository already has established CLI conventions, follow them unless they are the source of the problem.

## Default Tooling Baseline

Within this repository's convention, when the target repository does not already enforce a different choice:

- prefer Vite as the default bundler for TypeScript CLI builds
- use `node:test` as the test runner for CLI packages
- write CLI code and tests in TypeScript
- execute TypeScript tests with Node's built-in runner and native type stripping, for example `node --experimental-strip-types --test test/*.test.ts`
- do not use the `tsx` runtime for CLI execution or test execution
- configure Vite for a Node CLI entrypoint, preserved executable startup behavior, and artifact smoke tests after build
- treat the Vite choice as a repository standard, not as a claim that the broader CLI ecosystem has one universal bundler default

Do not force Vite when bundling is unnecessary or repo-specific constraints clearly require something else. The `node:test` plus native type-stripping baseline remains the test execution standard for this skill.

## Interop (Priority)

- This skill owns CLI architecture, command model, output/error contracts, prompts/TUI behavior, packaging, and CLI-specific DX.
- Defer low-level Node runtime behavior, module-resolution problems, and shutdown/resource issues to `node-engineer`.
- Defer TypeScript type-system design, advanced generics, and tsconfig policy to `typescript-engineer`.
- Defer broad test policy, runner mechanics, and CI test gating to `typescript-test-engineer`, except for the CLI-specific requirements in this skill around mandatory unit coverage and Node-native TypeScript test execution.
- Defer deep threat modeling, secrets review, and security sign-off to `security-reviewer`.
- If rules conflict, this skill owns the CLI contract; the other skills own their domain specialties.

## Non-negotiables

- Keep the CLI layer thin. Parsing, help, TTY detection, formatting, and exit codes belong in CLI code; business rules do not.
- Use the first sufficient CLI surface: built-in `node:util.parseArgs`, native shell/stdin/stdout behavior, and existing project dependencies come before a new parser framework, prompt layer, TUI library, or wrapper.
- Use conventional POSIX-style flag syntax unless the product has an explicit, documented reason to do otherwise; do not invent custom option grammars that make shell use, help, and completion harder.
- Design the utility as modular layers and modules with explicit boundaries so commands, use cases, formatters, and adapters stay independently testable.
- For service-backed CLIs, prefer an explicit command family over vague catch-all verbs: health/setup (`doctor`, optional `init`), discovery, resolve/ID lookup, read/list/search, narrow write actions, and a clearly named raw escape hatch when one is justified.
- Every interactive flow must have a non-interactive path through flags, args, stdin, config, or files.
- Use `stdout` for primary output and machine-readable output; use `stderr` for diagnostics, prompts, and errors.
- Treat `--help`, output shape, flag names, and exit codes as public API.
- For installable or user-facing CLIs, expose `--version` / `-V`, derive it from the package version source of truth, and include version context in supportable error or bug-report paths.
- For protected deploy, rollback, release, infra mutation, external executor, or comparable side-effecting commands, validate the per-action option contract before any side effect.
- Show concise help when required inputs are missing, unless the command is intentionally interactive-first and still exposes a non-interactive path; show full help on `-h` / `--help`.
- Define an explicit error taxonomy and exit-code mapping; do not scatter ad hoc `process.exit(1)`.
- Detect TTY before prompts, spinners, colors, or full-screen UI; respect CI and non-interactive shells.
- Persist CLI state only when it materially improves repeated use; use user-controlled config/state locations, document precedence, and provide a cleanup or uninstall path for files the CLI creates.
- Keep CLI evolution additive where possible: prefer explicit aliases, avoid catch-all subcommands, and do not rely on ambiguous prefix abbreviations.
- Never require secrets on the command line when stdin, env, keychain, or config files are safer.
- Unit tests are mandatory. Do not treat integration or smoke coverage as a substitute for unit coverage of core behavior.
- Use TypeScript for both utility code and tests.
- Run tests with Node's test runner and native type stripping; do not use the `tsx` runtime. A representative command is `node --experimental-strip-types --test test/*.test.ts`.
- If the target repository does not already provide an equivalent quality gate, add and enforce one before considering the CLI ready. At minimum the package must expose and use `typecheck`, `format`, `format:check`, `lint`, `lint:fix`, and `test`; when the repo uses split formatter/linter tooling, also expose the narrower scripts such as `lint:biome` and `lint:eslint`.
- Before declaring a CLI task ready, run the gate rather than only isolated commands: use `format` or `lint:fix` while iterating, then finish with the package-level `lint` and `test` scripts.
- Prefer the current Active LTS Node baseline for new CLI work, but verify the current release state before locking version advice into code or docs.
- If the CLI is meant to run outside its source repository, verify the installed command name early, publish a real install path, and smoke test from another working directory such as `/tmp`, not only through source-mode wrappers.

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

1. Classify the CLI before choosing tools: tiny utility, standard multi-command CLI, plugin platform, rich TUI, or service-backed operator CLI.
2. Decide the automation contract first: human-only, human-first but scriptable, or machine-first with human affordances.
3. Identify whether any command is protected because it can trigger deploy, rollback, release, infra mutation, an external executor, or another side effect.
4. For durable or installable CLIs, pin the binary name, source material, and first concrete jobs before coding; check whether the proposed command already exists with `command -v <tool-name>`.
5. Check the first sufficient surface before adding tooling: `node:util.parseArgs`, native shell/stdin/stdout behavior, existing parser dependencies, and one small local adapter.
6. Pick the thinnest framework that satisfies the real requirements.
7. Separate CLI/adapters from app/domain logic into modular, testable boundaries and define config precedence, output modes, and error codes.
8. Design non-interactive paths before prompts or TUI polish.
9. Make unit tests mandatory, then add process execution and contract-surface coverage, with `node:test` and `node --experimental-strip-types --test` as the required baseline.
10. Lock the package contract for durable CLIs: `bin`, `files`, `engines.node`, `--version`, changelog/release notes, and install/uninstall behavior.
11. Ensure the repo has a package-level quality gate with explicit scripts for `typecheck`, `format`, `format:check`, `lint`, `lint:fix`, and `test`; if the repo splits formatter and linter, expose the narrower scripts too.
12. Package and release with reproducible builds, Vite artifact smoke tests, platform smoke tests, install-path verification, and provenance where supported.

## High-signal Triggers

- **Need a baseline command contract or design review standard**: read `references/clig-baseline.md` first.
- **Need a service-backed command surface that future agent threads can safely reuse**: read `references/service-backed-clis.md` for naming, `doctor --json`, discovery/resolve/read/write taxonomy, auth reporting, and installability checks.
- **Need plugins or a true multi-team CLI platform**: read `references/framework-selection.md` and bias toward `oclif`.
- **Need tiny dependency surface or frequent CI invocation**: read `references/framework-selection.md` and `references/architecture-and-layout.md` for `parseArgs` / `cac`.
- **Need bundling guidance or executable artifact rules**: read `references/architecture-and-layout.md` and `references/testing-and-release.md` for the Vite baseline.
- **Need interactive flows**: read `references/ux-and-security.md` before adding prompts or Ink. TUI is never the only path.
- **Need contract-safe testing or packaging**: read `references/testing-and-release.md` before finalizing command output or publish workflows.
- **Need modular boundaries or mandatory quality gates**: read `references/architecture-and-layout.md` and `references/testing-and-release.md`.
- **Need protected deploy, rollback, release, infra mutation, or external executor behavior**: read `references/ux-and-security.md`, `references/testing-and-release.md`, and `references/architecture-and-layout.md` for protected option contracts, tests, and pre-side-effect boundaries.

## When You Need More Detail

Read only the smallest relevant reference file:

- [clig-baseline.md](references/clig-baseline.md) - adopted CLIG principles and how they map onto modern Node.js / TypeScript CLI work
- [service-backed-clis.md](references/service-backed-clis.md) - command taxonomy, auth/reporting, install-path behavior, and smoke-test rules for CLIs that wrap external systems
- [framework-selection.md](references/framework-selection.md) - how to choose frameworks and stacks for simple, complex, and interactive CLI work
- [architecture-and-layout.md](references/architecture-and-layout.md) - package structure, command layering, config precedence, output model, and cross-platform design
- [testing-and-release.md](references/testing-and-release.md) - test pyramid, process-level integration, TUI/non-TTY testing, packaging, publishing, and release workflow
- [ux-and-security.md](references/ux-and-security.md) - help/output/error UX, prompts/TUI rules, secrets handling, command execution safety, telemetry, and anti-patterns

Use `rg` if you only need one section:

- `rg -n "Philosophy Baseline|Operational Rules|Node And TUI Adaptations" references/clig-baseline.md`
- `rg -n "Preflight|Command Taxonomy|Auth And Config|Installability" references/service-backed-clis.md`
- `rg -n "Decision Matrix|Framework Notes" references/framework-selection.md`
- `rg -n "Simple CLI Blueprint|Complex CLI Blueprint|TUI Blueprint" references/architecture-and-layout.md`
- `rg -n "Runner Selection|Integration Tests|Protected Command|Release Baseline" references/testing-and-release.md`
- `rg -n "Output Contract|Interactive Rules|Protected Command|Security Rules|Anti-patterns" references/ux-and-security.md`

## Workflow stages

### Workflow stage: Apply cli-engineer guidance

Apply the preserved cli-engineer guidance without changing its domain behavior.

1. Match the request to the applicability criteria.
2. Follow the preserved overview sections for the concrete work.
3. Read the smallest relevant active reference before using detailed guidance from it.
4. Run the relevant verification from the overview or report why it could not be run.

Validation:

- The outcome follows the preserved skill guidance and any loaded reference constraints.

## Required active references
- [architecture-and-layout.md](references/architecture-and-layout.md) — Read this when you need package structure, command layering, config precedence, output model, and cross-platform design.
- [clig-baseline.md](references/clig-baseline.md) — Read this when you need adopted CLIG principles and how they map onto modern Node.js / TypeScript CLI work.
- [framework-selection.md](references/framework-selection.md) — Read this when you need how to choose frameworks and stacks for simple, complex, and interactive CLI work.
- [service-backed-clis.md](references/service-backed-clis.md) — Read this when you need command taxonomy, auth/reporting, install-path behavior, and smoke-test rules for CLIs that wrap external systems.
- [testing-and-release.md](references/testing-and-release.md) — Read this when you need test pyramid, process-level integration, TUI/non-TTY testing, packaging, publishing, and release workflow.
- [ux-and-security.md](references/ux-and-security.md) — Read this when you need help/output/error UX, prompts/TUI rules, secrets handling, command execution safety, telemetry, and anti-patterns.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory cli-engineer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
