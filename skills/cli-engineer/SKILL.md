---
name: cli-engineer
description: Design, review, implement, verify, package, and release
  production-grade TypeScript CLIs and TUIs on Node.js. Use for Vite builds,
  node:test, command/help/output/error contracts, prompts, terminal UI,
  installability, service-backed commands, and release readiness.
metadata:
  source-version: 0.2.1
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 11d5db9f414321af49bba1b5623efda81e15daabac81cb82f1bdf82a576dab5b
---

# cli-engineer

## Start here

1. Classify the request as design, review, implementation, release preparation, or authorized publication; review and release preparation do not authorize external mutation.
2. Define the representative user jobs, command/output/error contract, supported platforms, install boundary, service boundary, and side-effect class before selecting tools or claiming readiness.
3. Apply the Standard CLI toolchain policy to distinguish new setup or authorized replacement from an ordinary repair using existing tools.
4. Load only the optional active references whose triggers match the current task.
5. Match every completion claim to observed behavior through the built or installed command; files, scripts, mocks, and green checks alone are not the capability.

## When to use this skill

- Designing a new CLI package or restructuring an existing one
- Choosing between `node:util.parseArgs`, `commander`, `oclif`, `cac`, `clipanion`, prompt libraries, or Ink
- Standardizing help text, errors, stdout/stderr behavior, `--json`, conditional `--plain`, and exit codes
- Building interactive prompts or a terminal UI while preserving automation-safe behavior
- Setting up CLI testing, release preparation, packaging, explicitly authorized npm publishing, provenance, or optional standalone distribution
- Requiring modular CLI architecture for better testability or adding a missing repo quality gate
- Standardizing Vite-based CLI bundling and `node:test` process-level verification
- Reviewing a CLI for UX, scripting composability, cross-platform behavior, manifest/package contracts, or operational safety

## When NOT to use this skill

- General Node backend or service runtime work without a CLI surface; use `node-engineer`
- Type-level library API design that is not CLI-specific; use `typescript-engineer`
- Pure test-runner troubleshooting without CLI-specific behavior; use `typescript-test-engineer`
- Broad security review without CLI-specific attack surfaces; use `security-reviewer`
- Git commits, tags, pushes, or GitHub release operations as a standalone task; use `git-engineer` or `gh-utility`
- Maintaining a project-specific alternative CLI build system as a reusable standard; use that system's owning skill

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

## Workflow stages

### Workflow stage: Resolve mode, authority, and CLI contract

Establish the requested outcome, allowed side effects, standard-stack applicability, and evidence boundary before acting.

1. Classify the request as design, review, implementation, release preparation, or authorized publication.
2. Record the target repository, representative jobs, public command contract, supported platforms, install/distribution boundary, service boundary, and protected side effects.
3. Verify the current Active LTS from official Node.js sources before setting engines, CI, Vite targets, or TypeScript execution guidance.
4. Inspect existing build/test commands and their supported execution path; apply the Standard CLI toolchain policy before selecting or replacing tools.
5. Stop publication when package, registry, version, dist-tag, access/visibility, release target, or mutation authority is missing.

Validation:

- Mode, authority, inputs, supported boundary, and strongest honest output state are explicit.
- Review and release preparation remain non-mutating; publication has exact targets and authority.

### Workflow stage: Design, review, or implement the CLI contract

Produce the smallest compatible CLI change or an evidence-backed read-only assessment.

1. Design thin CLI, application, domain, and infrastructure boundaries; define non-interactive, stdout/stderr, exit-code, config, TTY, protected-option, and completion behavior before polish.
2. In design mode, return a decision-complete design without editing files; in review mode, inspect and report without remediation.
3. In implementation mode, preserve working repository scripts, runner, loader, and build unless changing them is necessary to fix the demonstrated cause or explicitly authorized.
4. When built-in type stripping is the selected execution path, keep directly executed TypeScript erasable and independent of tsconfig-only runtime transforms; verify any established loader path by its own contract.

Validation:

- The result preserves the requested mode and standard-stack boundary without unrelated migration.
- Protected commands reject invalid options before side effects, and every interactive job retains an automation-safe path.

### Workflow stage: Verify observable CLI capability

Prove the claimed user job through the same built or installed entrypoint consumers will use.

1. Run applicable repository typecheck, formatting, lint, unit/process/contract tests, build, and artifact checks through their declared commands; report missing required coverage without installing unrelated tooling.
2. Pack or install durable CLIs into an isolated platform-appropriate temporary location, invoke the exact bin outside the source tree, and verify help, version, a representative success path, and a representative failure path.
3. For service-backed jobs, exercise a real, sandbox, or authoritative contract-conformant boundary; label mock/stub-only evidence as partial and do not claim the real boundary was verified.
4. Record observed command, exit status, stdout/stderr, side effects, environment, and any unverified platform or boundary.

Validation:

- `verified` is used only when a representative job passes through the built or installed entrypoint and the claimed boundary.
- Build files, help-only smoke, mocks, stubs, and green structural checks cannot produce a stronger claim than they exercise.

### Workflow stage: Prepare or execute release safely

Keep release readiness separate from authorized external publication and verify every executed write.

1. For release preparation, inspect package identity and packed contents, run clean-install verification, and return release-ready evidence without publishing, tagging, pushing, or creating a release.
2. Publish only when the exact package, registry, version, dist-tag, access/visibility, release target, credentials path, and mutation authority are supplied and freshly confirmed.
3. Prefer trusted publishing and provenance when supported; route Git, tags, pushes, and GitHub releases to their owning skills.
4. After an authorized publish, freshly read registry metadata and install the published version from the target registry before reporting `published`.

Validation:

- Release preparation never implies publication authority or a published state.
- Every executed external mutation and its terminal readback are reported separately from proposed actions.

## Interop priority

- **Node.js runtime, current Active LTS evidence, ESM/CJS behavior, native type stripping, signals, and resources:** node-engineer. Supply exact bin, command, runtime range, and observed failure; consume the Node execution/module/resource contract only for the versions and paths it verifies.
- **TypeScript language, compiler, module-resolution, and tsconfig rules:** typescript-engineer. Supply the selected runtime and public consumers; consume compiler/config and type evidence without treating typecheck as installed-command proof.
- **Test mechanics, node:test diagnostics, coverage, hangs, and CI runner behavior:** typescript-test-engineer. Supply public success/failure, output, exit, and install scenarios; consume runner/test evidence from the established tooling, retaining any untested boundary.
- **Stable diff review, finding severity, and merge guidance:** code-reviewer. Supply a stable diff and exact CLI evidence; consume scoped findings and merge guidance only for that snapshot. Domain checks are not an independent review.
- **Authorized implementation scope and minimal remediation:** implementation-discipline. implementation-discipline owns mutation discipline; cli-engineer owns the required CLI behavior.
- **Threat modeling, secrets, plugins, subprocesses, supply chain, and bounded security assessment:** security-reviewer. Supply trust boundaries and concrete CLI safeguards/evidence; consume the bounded exploitability assessment without converting it into overall release approval.
- **Commits, tags, branches, and pushes:** git-engineer. Supply authorized release intent and exact source revision; consume verified refs and mutation readback only for authorized Git actions. Local release preparation grants no Git authority.
- **GitHub Actions, releases, repository settings, and remote readback:** gh-utility. Supply exact repository, workflow/release target, and existing authorization when GitHub work is requested; consume operation-specific remote readback, not local release readiness.
- **Reader-facing command instructions:** documentation. Supply exact package/version/bin, prerequisites, commands, output/errors, and installed evidence; consume an executable guide for that artifact without changing command semantics through prose.
- **Missing product requirements, behavioral contracts, and architectural trade-offs:** prd-engineer, spec-engineer, or architecture-engineer according to the unresolved decision. Supply the concrete gap and CLI constraints; consume the accepted requirement, contract, or architecture decision before dependent implementation, without turning a tooling default into product authority.
- **Execution breakdown and sequencing from accepted scope:** delivery-planner. Supply accepted CLI scope, dependencies, and evidence gaps; consume the executable plan when planning is requested. CLI design alone does not authorize a backlog or implementation.

## Gotchas

- **high** — A Vite build, package scripts, green tests, help output, mock, or stub proves only its exercised boundary; none alone proves the representative installed CLI job or real service integration.
- **high** — A request to prepare, review, configure, or make a CLI release-ready does not authorize npm publication, Git tags or pushes, GitHub releases, or trusted-publisher configuration.
- **high** — Never hardcode a remembered Node LTS major as this skill's permanent baseline; resolve the current Active LTS and version-specific TypeScript/Vite behavior from official sources when the task runs.
- **high** — An ordinary CLI fix is not a tooling migration. Do not replace a working test command or rewrite compatible syntax merely to satisfy a new-project default.
- **medium** — Do not present /tmp, command -v, POSIX signals, shell chaining, or executable-bit checks as universal cross-platform verification.

## Policies

### Standard CLI toolchain
For a new setup or explicitly authorized tooling replacement, use current Active LTS Node.js, TypeScript, Vite, node:test, and supported native type stripping; do not introduce tsx. An explicit user or authoritative project requirement can select another tool. For an existing project repair, preserve and run its supported build, runner, and loader, including existing tsx or Vitest. Adding a regression test does not authorize runner replacement. Change tools or rewrite syntax only when required by the demonstrated cause or authorized migration; explain that reason and verify the affected path.

### Mode and side-effect boundary
Design returns a decision-complete design; review is read-only; implementation changes the authorized project scope; release preparation may build, pack, and verify locally but does not publish or mutate Git/GitHub; publication requires exact targets and explicit mutation authority.

### Outcome and evidence states
Report design/draft, implemented, verified, release-ready, published, partial, or blocked according to observed evidence. `verified` requires a representative job through the built or installed entrypoint and claimed boundary; `release-ready` additionally requires packed-content and clean-install evidence; `published` requires authorized registry write plus fresh registry and install readback.

### Agent output contract
Report task mode, authoritative inputs, applicable toolchain and justified changes, changed or reviewed scope, observed commands and results, stdout/stderr and exit behavior when relevant, proposed versus executed side effects, strongest warranted state, evidence limits, and next owner or blocker.

### Publication safety
Before npm publication require and confirm package identity, registry, version, dist-tag, access/visibility, release target, credentials path, and exact authorization. Inspect packed contents before the write; after it, read registry metadata and clean-install the published version. Stop on ambiguous write results instead of retrying blindly.

### Unavailable owner
Route only the decision the task needs. When its specialist is unavailable, continue authorized CLI work using accepted sources and checks; identify the missing input or assessment and withhold only the dependent claim. Never invent an owner verdict or require every neighboring skill for an ordinary repair.

## Optional references
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
- Confirm every linked reference and copied eval fixture listed by SKILL.md or the source manifest exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/forward-tests/*`
- Supporting glob: `docs/logs/*`
