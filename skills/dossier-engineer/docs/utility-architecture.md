# Dossier Utility Technical Documentation

## Purpose

The `dossier-engineer` utility is a Node.js CLI that supports the skill's docs-as-code workflow.
It operates on feature dossiers, generated process artifacts, coverage traces, and repository state.
The utility is intentionally file-oriented and local-first: the repository is the source of truth, and each command derives its result from markdown files, frontmatter, git state, and generated JSON artifacts.

Under the backlog-driven cross-skill model, this utility is the downstream dossier workflow layer. It should operate on already selected backlog work and should not own backlog extraction or a local candidate-backlog surface.

This document describes the current utility architecture, the role of each module, and the testing principles that keep the tool safe to evolve.

## Runtime Model

The utility is distributed as a built runtime artifact:

- Runtime entrypoint: [`scripts/dossier.mjs`](../scripts/dossier.mjs)
- Source entrypoint: [`src/cli.ts`](../src/cli.ts)
- Main command implementation: [`src/commands.ts`](../src/commands.ts)

The runtime is built with Vite from TypeScript source. Source files are authored in `src/`, while `scripts/dossier.mjs` is the generated executable that the skill references.

## High-Level Architecture

The utility is organized into four layers:

1. CLI entrypoint
2. Command orchestration
3. Pure core logic
4. Infrastructure helpers

### 1. CLI Entrypoint

[`src/cli.ts`](../src/cli.ts) is intentionally thin.
It is responsible for:

- parsing top-level CLI intent such as `--help`, `help`, and `--version`
- locating a command definition
- delegating execution to command handlers
- wiring stdout/stderr via the `CliIo` interface

It should stay free of domain logic.

### 2. Command Orchestration

[`src/commands.ts`](../src/commands.ts) is the orchestration layer.
It owns:

- command definitions and aliases
- command-specific argument parsing
- repository-level workflows
- formatting CLI output
- reading and writing process artifacts
- combining pure analysis with filesystem and git effects

This file is still the largest module in the utility. After the recent refactor, its job is narrower: it coordinates commands and side effects, while reusable analysis logic lives in dedicated core modules.

### 3. Pure Core Logic

The `src/core/` directory contains logic that should remain deterministic and side-effect free.
These modules are the primary targets for unit tests.

#### Markdown Analysis

[`src/core/markdown.ts`](../src/core/markdown.ts) contains dossier markdown parsing and pattern matching helpers.
It is responsible for:

- extracting top-level `##` sections
- normalizing executable sections
- extracting acceptance-criteria statements
- detecting executable-section drift
- hosting trigger and lint regexes used by planning/spec quality checks

This module does not read files or invoke git. It only transforms strings into structured signals.

#### Workflow Helpers

[`src/core/workflow.ts`](../src/core/workflow.ts) contains compact workflow decisions.
It is responsible for:

- translating dossier status into the next workflow step
- selecting the active dossier among existing dossiers
- providing dossier-local `next-step` transitions

This module encodes workflow policy in a testable form.

Important boundary:

- dossier CLI may emit supporting signals for workflow reasoning;
- authoritative `backlog impact verdict` for `Workflow stage: change-proposal` remains stage-owned process logic;
- session-level ops logs remain process-owned markdown artifacts outside the current shipped CLI surface;
- do not move that verdict into dossier-local runtime heuristics unless the skill contract is explicitly expanded first.

#### Dossier Lint Analysis

[`src/core/lint-dossiers.ts`](../src/core/lint-dossiers.ts) contains dossier-quality analysis logic.
It is responsible for:

- validating frontmatter requirements
- validating AC and coverage-map consistency
- emitting compact-spec and planning nudges
- rendering summary and red-flag blocks for generated index content

The key design rule is that dossier linting is now split into:

- a pure analyzer: `analyzeDossiers(...)`
- small render helpers for CLI/index output

This separation makes rule evolution safer and more testable.

### 4. Infrastructure Helpers

The `src/lib/` directory contains reusable helpers that interact with external systems or represent low-level domain utilities.

#### Dossier Helpers

[`src/lib/dossier-utils.ts`](../src/lib/dossier-utils.ts) contains dossier-level utility functions and shared types.
It is responsible for:

- `DossierRecord`
- dossier file discovery
- AC and coverage-map ID extraction
- coverage-gate resolution
- reading all dossiers into normalized records

This module sits between pure analysis and repository I/O.

#### Frontmatter Parsing

[`src/lib/frontmatter.ts`](../src/lib/frontmatter.ts) parses dossier frontmatter.
It uses YAML first, then falls back to a constrained parser for resilience.
This is important because the utility must be tolerant of partially edited markdown during authoring.

#### Filesystem Helpers

[`src/lib/fs-utils.ts`](../src/lib/fs-utils.ts) provides repository-local file primitives such as:

- text reads
- atomic text/json writes
- recursive walking with ignored-directory rules

Atomic writes are important because many commands rewrite generated index files and process artifacts.

#### Git Helpers

[`src/lib/git-utils.ts`](../src/lib/git-utils.ts) wraps git access and path normalization.
It is responsible for:

- resolving base refs and merge bases
- changed-file discovery
- dirty-worktree checks
- diff retrieval
- normalization between repo-relative and absolute paths

This keeps git-specific behavior out of the pure analysis layer.

## Data Flow

Most commands follow the same execution shape:

1. Parse CLI arguments in [`src/commands.ts`](../src/commands.ts).
2. Resolve repository paths and, when needed, git baselines.
3. Read dossier markdown or generated artifacts through `src/lib/`.
4. Convert raw inputs into `DossierRecord` objects or plain strings.
5. Pass those values into pure analysis helpers in `src/core/`.
6. Format human-readable output and write artifacts or generated markdown back to disk.

This model is deliberate:

- pure logic stays reusable and unit-testable
- I/O and git behavior stay centralized
- command handlers remain the only place where workflow operations touch the outside world

## Build and Distribution

The package is defined in [`package.json`](../package.json) and built with [`vite.config.ts`](../vite.config.ts).

Current lifecycle:

1. Author source in `src/`
2. Build with `pnpm run build`
3. Produce `scripts/dossier.mjs`
4. Execute the runtime with `node scripts/dossier.mjs <command>`

The generated runtime should be treated as a build artifact, not as the primary maintenance surface.

## Testing Architecture

The utility now uses a two-layer testing strategy:

1. unit tests for pure modules
2. CLI smoke tests for end-to-end command behavior

### Test Runner

Tests are authored in TypeScript and run with Node's built-in test runner:

```bash
node --experimental-strip-types --test test/*.test.ts
```

The package script wraps this as:

```bash
pnpm test
```

This keeps the test environment close to the actual runtime and avoids introducing a heavier test framework where it is not needed.

### Unit Tests

Unit tests live in `test/*.test.ts` and target deterministic modules:

- [`test/frontmatter.test.ts`](../test/frontmatter.test.ts)
- [`test/markdown.test.ts`](../test/markdown.test.ts)
- [`test/workflow.test.ts`](../test/workflow.test.ts)
- [`test/lint-dossiers.test.ts`](../test/lint-dossiers.test.ts)

These tests focus on:

- pure input/output behavior
- edge cases in parsing and normalization
- dossier-local workflow policy transitions
- lint-rule behavior and rendering

Unit tests should avoid:

- touching git unless the behavior itself is git-specific
- depending on the built runtime
- requiring repository fixtures larger than the assertion needs

### CLI Smoke Tests

[`test/cli.test.ts`](../test/cli.test.ts) exercises the built CLI as an external process.
It creates temporary repositories, writes minimal dossier fixtures, and verifies command behavior such as:

- feature intake
- help output
- index generation
- coverage audit
- dossier-local next-step resolution
- lint output
- verification/review/step-close artifact flow

These tests validate orchestration and integration boundaries that unit tests cannot cover.

## Testing Principles

The utility should continue to follow these testing principles.

### Prefer Pure Functions for Policy

If a rule can be expressed as a pure transformation, it should live in `src/core/` or a pure helper in `src/lib/`.
This makes the rule:

- easier to test
- easier to reason about
- less coupled to CLI and repository state

### Test Behavior, Not Implementation Shape

Unit tests should assert externally meaningful behavior:

- returned sections
- selected next step
- emitted lint findings
- rendered summaries

They should not lock the code to internal refactor details such as helper count or exact loop structure.

### Keep CLI Tests Few but High-Value

CLI tests are slower and more expensive than unit tests because they:

- build the runtime
- spawn a separate Node process
- often create git-backed temporary repositories

They should cover:

- critical end-to-end command flows
- artifact generation
- integration between pure logic and I/O

They should not become the only safety net.

### Use Minimal Fixtures

A dossier fixture should contain only the sections needed for the scenario being tested.
Minimal fixtures make failures easier to read and reduce accidental coupling to unrelated workflow rules.

### Preserve Stable Contracts

Tests should protect these contracts especially carefully:

- feature and AC ID normalization
- coverage-gate behavior
- dossier-local next-step decisions
- lint warning semantics
- generated artifact locations and JSON shape
- the boundary where `contract-drift-audit` stays a support signal and does not become the authoritative `backlog impact verdict`

These behaviors are consumed by the skill workflow, so accidental drift here creates operational debt quickly.

## Refactoring Guidelines

Future refactoring should preserve the same architectural direction.

Preferred direction:

- keep `src/cli.ts` thin
- continue shrinking `src/commands.ts` by extracting deterministic logic
- keep `src/core/` pure and test-driven
- keep `src/lib/` focused on infrastructure and low-level shared utilities

Avoid:

- moving git or filesystem effects into `src/core/`
- hiding command behavior behind large opaque abstractions
- creating wrappers that make tests harder to understand
- relying on the generated `scripts/dossier.mjs` as an editing surface

The utility is most maintainable when each layer has a clear reason to exist and the majority of workflow policy remains executable as small, deterministic functions.

## Recommended Maintenance Workflow

When changing the utility:

1. Update or add pure helpers first when the change is a policy or parsing rule.
2. Add or update unit tests for the affected pure module.
3. Touch `src/commands.ts` only to integrate the change into command execution.
4. Add or update a CLI smoke test only when the change affects orchestration or artifact flow.
5. Run the standard verification sequence in this order:

```bash
pnpm run format
pnpm run typecheck
pnpm run lint
pnpm run test
```

This sequence keeps code style, type safety, lint rules, and behavior checks aligned with the utility's intended architecture.
