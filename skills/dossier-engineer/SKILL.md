---
name: dossier-engineer
description: Manage a source-traced, capability-oriented, merge-safe dossier
  workflow for software delivery. Use when registering requirement sources,
  mapping product capabilities, onboarding an existing project, deriving backlog
  work, separating capability from infrastructure, running delivery stages,
  verification, audits, closure, queue/status/attention checks, post-close
  hygiene, retrospective reporting with Markdown/YAML dossier artifacts, or
  explaining dossier-engineer capabilities and operator prompt patterns.
compatibility: Requires git, Markdown files, and the bundled dossier-engineer
  runtime under scripts/dossier-engineer.mjs or an equivalent dossier-engineer
  executable on PATH.
metadata:
  source-version: 2.6.0
  canonical_storage: markdown-yaml-frontmatter
  runtime: dossier-engineer
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 2c49cbb7227fc81ae9c66c5371d67bb0fe023a0552d3b450fceb40ef9552d49b
---

# dossier-engineer

## Start here

1. Confirm the task is about repository-local dossier control, capability governance, backlog/workflow execution, or maintaining this code-backed skill.
2. Run `dossier-engineer status --root .`, `dossier-engineer attention --root .`, and `dossier-engineer queue --root .` before starting dossier-managed delivery work when a dossier already exists.
3. Separate observable capability from support substrate before creating or closing work; do not accept infrastructure-only evidence for capability progress.
4. Use the runtime for all machine-owned frontmatter, IDs, timestamps, hashes, lifecycle states, source-review records, review records, verification records, guardrail states, and closure transitions.
5. Complete relevant body sections for created or materially changed dossier artifacts before stage close, handoff, PR preparation, or final response.
6. Follow `Next actions` from every mutating command unless a blocker makes the next action unsafe or impossible.
7. For source-bundle maintenance, edit `skill.yaml`, fragments, references, assets, runtime source, and tests first; regenerate `SKILL.md` instead of hand-editing it.

## When to use this skill

- Register durable requirement sources and track source hash changes.
- Map product, operator, integration, or system capabilities before creating work.
- Onboard an existing project through baseline capabilities and evidence.
- Create and execute capability, support, maintenance, or exploration work items with explicit gates.
- Run feature-intake, spec-compact, plan-slice, implementation, change-proposal, verification, review, closure, hygiene, changeset, report, or retrospective flows.
- Explain dossier-engineer capabilities, operator-facing workflows, and prompt patterns when the operator asks how to use this skill.
- Maintain the dossier-engineer skill source bundle or its bundled CLI runtime.

## When NOT to use this skill

- Chat-only planning that will not create or update durable dossier artifacts, unless the operator is asking about dossier-engineer capabilities or usage.
- Generic project management without source-to-capability traceability.
- Manual editing of machine-owned dossier frontmatter.
- Claiming capability completion from mocks, schemas, queues, tests, wrappers, reports, or scaffolding without a behavioral demonstration.
- Maintaining unrelated skills or runtime formats outside the dossier-engineer bundle.

## Overview

## Core objective

Deliver observable product capability, not merely infrastructure.

A work item that claims product progress must prove a user-, operator-, integration-, or system-observable behavior. Tables, APIs, lifecycle state, mocks, tests, scaffolding, schemas, queues, agents, prompts, model wrappers, and deployment plumbing are support assets until they enable a demonstrated capability.

## Three dossier layers

1. **Source layer** — durable concepts, architecture, specifications, contracts, policies, test plans, and external references.
2. **Capability layer** — what the product or system can do, should do, or already does, expressed as observable behavior.
3. **Work layer** — concrete work items that introduce, extend, support, maintain, verify, or retire capabilities.

Do not create work directly from vague implementation ideas. Anchor work to sources and capabilities first.

## Non-negotiable rules

1. Store canonical dossier state only in Markdown files with YAML frontmatter under `docs/dossier/`.
2. Use the `dossier-engineer` runtime to create, update, validate, and close dossier artifacts.
3. Do not create canonical JSON files, JSONL files, databases, hidden state stores, generated global state snapshots, committed mutable indexes, sequential counters, or committed/shared lock files as dossier state. Ephemeral runtime locks under `.dossier-runtime/` are runtime metadata only.
4. Do not manually create artifact IDs, timestamps, lifecycle values, delivery-kind values, capability statuses, stage states, source hashes, review freshness values, material-scope hashes, guardrail states, or other machine-owned frontmatter fields.
5. Edit artifact body sections only after the runtime creates the artifact scaffold.
6. After manual body edits that affect requirements, concept interpretation, capabilities, scope, acceptance, dependencies, risks, demonstrations, evidence, anti-claims, guardrails, or closure, run `dossier-engineer lint` on the changed artifact or repository.
7. Do not close a capability work item on infrastructure evidence alone.
8. Do not let a support work item imply product capability. Mark support work as support and link it to the capability or guardrail it enables.
9. Require a behavioral demonstration for every capability work item before implementation closure.
10. Require concept-conformance review for every capability work item before implementation closure.
11. Require anti-claims for every capability work item before spec-compact closure.
12. Challenge the work item before implementation. Record how the plan could become a stub, an infrastructure-only slice, an over-narrow implementation, or a self-deceptive test suite.
13. Treat every open source-review blocker as blocking readiness for linked work until it is explicitly resolved.
14. Treat every triggered guardrail as blocking new support work in the affected scope until it is resolved.
15. Treat `ready_for_close` as a checkpoint, not as closure.
16. Treat generated reports as derived views. Reports never override artifact frontmatter.
17. In parallel branches, edit only the records that belong to the active source, capability, work item, review, verification, hygiene, guardrail, baseline, or changeset scope.
18. Complete relevant body sections for every created or materially changed dossier artifact before stage close, handoff, PR preparation, or final response.

## Runtime contract

Run commands from the repository root unless `--root <path>` is provided. If the command is not installed on PATH, invoke the bundled runtime as `node scripts/dossier-engineer.mjs ...` from this skill folder.

Every mutating runtime command returns command result, artifacts created or modified, blockers or warnings, and `Next actions` with protocol-safe follow-up steps. Read `Next actions` after every mutating command and follow the first applicable action. Do not bypass blockers by editing frontmatter manually.

Use these baseline checks at the start of a task:

```bash
dossier-engineer status --root .
dossier-engineer attention --root .
dossier-engineer queue --root .
dossier-engineer capability check --root .
dossier-engineer guardrail check --root .
```

Use this validation before handoff, review, merge, or closure:

```bash
dossier-engineer lint --root .
dossier-engineer capability check --root .
dossier-engineer guardrail check --root .
```

## Artifact layout

The runtime manages these canonical records:

```text
docs/dossier/
├── project.md
├── sources/SRC-*.md
├── capabilities/CAP-*.md
├── baselines/BASE-*.md
├── guardrails/KILL-*.md
├── work-items/WI-*.md
├── source-reviews/SR-*.md
├── stages/WI-*/*.md
├── verification/WI-*/*.md
├── reviews/WI-*/*.md
├── hygiene/WI-*/*.md
├── changesets/CS-*.md
├── reports/*.md
└── retro/RETRO-*.md
```

Primary truth lives in source records, capability records, baseline records, guardrail records, work-item records, source-review records, review records, verification records, hygiene records, and changeset records. Reports and retro summaries are derived views and never override primary truth.

## Frontmatter ownership

The runtime owns artifact frontmatter. The agent owns semantic content in body sections.

## Body Completion Gate

Runtime scaffolding creates structurally valid dossier artifacts, not complete dossier artifacts.

After creating or materially changing any source, capability, baseline, guardrail, work item, review, verification, or changeset artifact, the agent MUST complete the relevant body sections before stage close, handoff, PR preparation, or final response.

Frontmatter is canonical machine-readable state. Body sections are canonical human-readable interpretation.

Scaffold-only body content is allowed only as transient working state during the same active task. It is not allowed at handoff.

## Dossier Language Policy

Maintain human-readable dossier content in the operator's working language.

Keep protocol mechanics in English: commands, flags, frontmatter keys, enum values, IDs, file paths, schema names, delivery kinds, statuses, and review class names.

Use the operator's language for source interpretation, capability claims, anti-claims, work item prose, acceptance criteria, demo scenarios, evidence interpretation, review rationale, verification notes, blocker explanations, guardrail rationale, changesets, retrospectives, and handoff summaries.

When the operator's working language is clear, use it for dossier semantic content unless the operator explicitly requests another language.

Use runtime commands for structured changes:

```bash
dossier-engineer source add --path <path> --kind concept --authority canonical --title "<title>"
dossier-engineer capability create --title "<capability>" --status intended --source <source-id>
dossier-engineer capability claim set --capability <capability-id> --actor "<actor>" --trigger "<trigger>" --behavior "<observable behavior>" --response "<system response>" --state-change "<state change>" --continuity "<later or restarted behavior>"
dossier-engineer work create --title "<title>" --type feature --delivery capability --capability <capability-id> --relation introduces --source <source-id> --area <area> --owner <owner>
dossier-engineer work acceptance add --work <work-id> --kind behavior --text "<criterion>" --source <source-id>#<anchor>
dossier-engineer work demo set --work <work-id> --name "<demo>" --scenario "<observable scenario>"
dossier-engineer work anti-claim add --work <work-id> --text "<explicit non-goal>"
dossier-engineer work challenge record --work <work-id> --summary "<why the plan may be wrong>"
```

Manual edits are allowed only in scaffolded body sections such as summary, rationale, analysis, implementation notes, demo details, reviewer notes, verification interpretation, and evidence details. After manual edits, validate with `dossier-engineer lint --path <artifact-path>`.

If frontmatter is missing, invalid, stale, or inconsistent, repair through the runtime:

```bash
dossier-engineer repair frontmatter --path <artifact-path> --type <artifact-type>
```

## Starting a new project

Initialize the dossier, register the product concept, create intended capabilities, then create work items from capabilities.

```bash
dossier-engineer init --root . --project-name "<project>"
dossier-engineer source add --path <path> --kind concept --authority canonical --title "<product concept>"
dossier-engineer capability create --title "<capability>" --status intended --source <concept-source-id>
dossier-engineer capability claim set --capability <capability-id> --actor "<actor>" --trigger "<trigger>" --behavior "<behavior>" --response "<response>" --state-change "<state change>" --continuity "<continuity>"
```

Create support work only after a capability or guardrail explains why the support is needed.

## Starting from an existing working project

Use existing-project onboarding when the repository already has implemented behavior.

```bash
dossier-engineer init --root . --project-name "<project>"
dossier-engineer source add --path <path> --kind concept --authority canonical --title "<current concept>"
dossier-engineer baseline create --title "Existing product baseline" --mode existing-project --source <concept-source-id>
dossier-engineer capability create --title "<existing capability>" --status existing --source <concept-source-id>
dossier-engineer capability claim set --capability <capability-id> --actor "<actor>" --trigger "<trigger>" --behavior "<current observable behavior>" --response "<system response>" --state-change "<state/effect>" --continuity "<current continuity>"
dossier-engineer capability demo record --capability <capability-id> --verdict pass --summary "<observed current behavior>" --evidence <path>
dossier-engineer baseline capability add --baseline <baseline-id> --capability <capability-id> --evidence <path> --status observed
dossier-engineer capability check --root .
```

Do not create artificial closed work items for work that happened before the dossier existed. Represent already working behavior as `capability` records with `status = existing` and baseline evidence. Represent uncertain behavior as `status = partial` or `status = unverified`; do not count it as proven capability.

## Capability classification

Every work item has a delivery kind:

- `capability` — delivers or changes an observable behavior.
- `support` — creates infrastructure, scaffolding, refactoring, test harnesses, data models, pipelines, or operational support for a named capability or guardrail.
- `maintenance` — preserves, restores, or corrects an existing observable behavior.
- `exploration` — answers a bounded question without claiming delivery.

Use `capability` only when the item can be demonstrated as behavior. Use `support` for tables, APIs, schemas, background jobs, abstractions, lifecycle handling, internal tools, or tests that do not by themselves create observable behavior.

A support item must link to a capability or active guardrail. A support item must not be counted as functional product progress unless a linked capability demonstration passes.

## Workflow stages

### Workflow stage: Inspect dossier health

Establish current blockers and readiness before changing dossier artifacts.

1. Run `dossier-engineer status --root .`, `dossier-engineer attention --root .`, `dossier-engineer queue --root .`, `dossier-engineer capability check --root .`, and `dossier-engineer guardrail check --root .` when a dossier exists.
2. Treat open source-review records, triggered guardrails, invalid artifacts, and missing capability gates as blockers.
3. Choose the next work item from `queue` only after blockers are understood.

Validation:

- The selected work is not source-review blocked.
- Triggered guardrails are either resolved or explicitly outside the selected scope.

### Workflow stage: Anchor sources and capabilities

Keep work tied to durable source material and observable capability.

1. Register or refresh sources with `source add`, `source refresh`, and `source impact`.
2. Create capability records before work records.
3. Complete capability claims with actor, trigger, observable behavior, response, state change, and continuity.
4. For existing projects, create baseline records instead of artificial historical closed work.

Validation:

- Capability records have source refs and complete claims unless retired.
- Existing capabilities have pass demo evidence or observed baseline membership before being treated as proven.
- Created or updated source, baseline, and capability bodies are completed before handoff, especially during existing-project onboarding.

### Workflow stage: Author capability-safe work

Prevent infrastructure work from masquerading as product progress.

1. Use `delivery=capability` only for work that can be behaviorally demonstrated.
2. Use `delivery=support` for scaffolding, refactoring, schemas, tests, pipelines, or operational support that does not itself create observable behavior.
3. Add behavioral acceptance, demonstration scenario, anti-claims, and pre-implementation challenge for capability work.
4. Add support reasons and capability or guardrail links for support work.

Validation:

- `dossier-engineer capability check --root .` reports no missing capability gates for the target work.
- Capability work has behavior criteria, demo scenario, anti-claims, and challenge before closure.

### Workflow stage: Run delivery stages

Move work through controlled stage transitions without bypassing closure gates.

1. Run stages in order: `feature-intake`, `spec-compact`, `plan-slice`, then `implementation`, unless `change-proposal` is required.
2. Use `stage start`, `stage ready`, and `stage close`; treat `ready_for_close` as a checkpoint.
3. Open `change-proposal` when implementation discovers material requirement, scope, concept, capability, contract, security, dependency, acceptance, anti-claim, or demo drift.

Validation:

- Previous required stages are closed before later stages advance.
- Material drift returns to the earliest affected stage.
- Created or materially changed dossier artifact bodies are completed before any stage close.

### Workflow stage: Verify, review, and close truthfully

Close implementation only with fresh evidence that proves the claimed capability.

1. Ask `verify required` and `review required` before implementation closure.
2. Use `verify run` for configured profiles or `verify record` for explicit manual/external evidence.
3. Record required reviews with immutable `review record` artifacts.
4. Close implementation only after fresh required verification and review evidence, then run `hygiene run`.

Validation:

- Capability work has fresh behavioral-demo verification.
- Capability work has fresh concept-conformance and spec-conformance reviews.
- Review and verification bodies explain verdict rationale, evidence inspected, and what was proven.
- Hygiene passes before handoff or closure reporting.

### Workflow stage: Produce handoff and retrospective evidence

Record branch-level and process evidence without turning derived reports into truth.

1. Use `changeset create` for branch or handoff summaries.
2. Use `report create` only for derived views requested by the user or process.
3. Use `retro create` for process-miss, capability drift, guardrail, review, verification, and skill-feedback analysis.

Validation:

- Reports are not cited as closure evidence.
- Changeset and affected dossier artifact bodies are complete before handoff.
- `lint`, `capability check`, and `guardrail check` pass before handoff.

## Interop priority

- **capability and dossier workflow truth:** dossier-engineer. This skill owns dossier artifact semantics, capability gates, stage transitions, and closure truth.
- **runtime code changes:** implementation-discipline with the relevant language or CLI skill. Dossier semantics decide what must be observable; implementation discipline and CLI engineering decide how runtime code is changed and verified.
- **external review content:** the named review skill. This skill records required review artifacts, while specialist review skills own findings and review standards.

## Runnable commands
### CLI command: `help`
**Use when:** Confirm the public command surface before invoking or documenting another command.

**Summary:** Show shipped help or command-local help.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Outputs:** Human-readable help text on stdout.; Exit code 0 on success.

**Tests:** `test/cli.test.ts`

**Examples:** node scripts/dossier-engineer.mjs help

### CLI command: `init`
**Use when:** Bootstrap a repository for dossier control.

**Summary:** Initialize `docs/dossier/project.md` and canonical directories.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Inputs:** --root <path>; --project-name <name>

**Outputs:** Project artifact and canonical directories.; Next actions for source registration and baseline onboarding.

**Tests:** `test/cli.test.ts`

**Examples:** dossier-engineer init --root . --project-name "<project>"

### CLI command: `status | attention | queue | next`
**Use when:** Inspect current state before work, handoff, review, or closure.

**Summary:** Derive readiness, blockers, executable work, and next safe action from Markdown/YAML artifacts.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Outputs:** Read-only derived summaries, findings, blockers, and next actions.

**Tests:** `test/cli.test.ts`

**Examples:** dossier-engineer status --root .; dossier-engineer attention --root .; dossier-engineer queue --root .; dossier-engineer next --work <work-id>

### CLI command: `lint | repair frontmatter`
**Use when:** Before handoff, after manual body edits, after source-bundle changes, or when invalid frontmatter is detected.

**Summary:** Validate schemas, refs, gates, forbidden state files, and safely repair inferable metadata.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Outputs:** Exit code 3 when lint finds errors.; No invented semantic fields during repair.

**Tests:** `test/cli.test.ts`

**Examples:** dossier-engineer lint --root .; dossier-engineer repair frontmatter --path <artifact-path> --type <artifact-type>

### CLI command: `source add | source list | source refresh | source impact | source review resolve`
**Use when:** Source material enters or changes in the dossier truth layer.

**Summary:** Register sources, compute hashes, open source reviews, inspect impact, and resolve source-review blockers.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** dossier-engineer source add --path <path> --kind concept --authority canonical --title "<title>"; dossier-engineer source refresh --root .

### CLI command: `capability create | capability claim set | capability anti-claim add | capability demo record | capability check`
**Use when:** Mapping product behavior, onboarding existing behavior, or checking infrastructure-masquerade risk.

**Summary:** Create capability records, complete observable claims, record demos, and check capability gates.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** dossier-engineer capability create --title "<capability>" --status intended --source <source-id>; dossier-engineer capability check --root .

### CLI command: `baseline create | baseline capability add`
**Use when:** Starting from an already working project or recording observed capability state.

**Summary:** Record existing-project, release, regression, or manual capability baselines.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** dossier-engineer baseline create --title "Existing product baseline" --mode existing-project --source <source-id>

### CLI command: `guardrail add | guardrail check | guardrail resolve`
**Use when:** Support accumulation, capability drift, or project-level kill criteria must block unsafe work.

**Summary:** Create, evaluate, trigger, and resolve stop conditions that protect capability truth.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** dossier-engineer guardrail check --root .

### CLI command: `work create | work acceptance add | work demo set | work anti-claim add | work challenge record | work support explain | work dependency add/remove | work blocker add/resolve | work risk set | work split | work retire`
**Use when:** Deriving concrete work from sources and capabilities.

**Summary:** Create and maintain capability-safe work items and their gates.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** dossier-engineer work create --title "<title>" --type feature --delivery capability --capability <capability-id> --relation introduces --source <source-id> --area <area> --owner <owner>

### CLI command: `stage start | stage ready | stage close | stage reopen | stage log`
**Use when:** Running feature-intake, spec-compact, plan-slice, implementation, or change-proposal.

**Summary:** Control delivery stage transitions and immutable stage events.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** dossier-engineer stage start --work <work-id> --stage feature-intake --session <session-id>

### CLI command: `verify required/run/record | review required/record | hygiene run`
**Use when:** Preparing implementation closure or handoff.

**Summary:** Determine required evidence, record verification and review artifacts, and validate post-close hygiene.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Tests:** `test/cli.test.ts`

**Examples:** dossier-engineer verify required --work <work-id> --stage implementation; dossier-engineer review record --work <work-id> --stage implementation --class concept-conformance-reviewer --verdict pass --reviewer <reviewer-id>

### CLI command: `changeset create | report create | retro create`
**Use when:** Preparing handoff, requested derived views, or retrospective process analysis.

**Summary:** Create branch evidence, derived reports, and retrospective reports without replacing primary truth.

**Runtime script:** `scripts/dossier-engineer.mjs`

**Examples:** dossier-engineer changeset create --scope current-branch --summary "<branch summary>"

## Gotchas

- **high** — A passing command, generated file, report, or test is not capability proof unless it demonstrates the claimed behavior.
- **high** — Never hand-edit machine-owned frontmatter to bypass a blocker; use a runtime command or leave the blocker open.
- **high** — Do not create JSON/JSONL/database canonical state or generated global indexes; `lint` treats forbidden state files as errors.
- **medium** — Reports and retrospectives are derived views and never closure evidence.
- **medium** — `ready_for_close` is a checkpoint; closure still requires the stage close command and relevant gates.
- **medium** — `SKILL.md` is generated in this source-bundle format; edit `skill.yaml`, fragments, and references instead.

## Policies

### Capability-first policy
Work that claims product progress must be traceable to a capability and proven by observable behavior, not by support substrate.

### Markdown/YAML truth policy
Canonical dossier state lives only in Markdown files with YAML frontmatter under `docs/dossier/`.

### Runtime-owned frontmatter policy
The runtime owns IDs, timestamps, hashes, lifecycle, stage state, delivery kind, status, material-scope hashes, review freshness, and guardrail state.

### Generated skill policy
`skill.yaml` is the source of truth for the instruction surface; `SKILL.md` and `docs/compile-report.md` are compiler-owned outputs.

### Parallel development policy
Prefer sharded immutable artifacts and scope-local edits over shared counters, locks, generated global status files, or mutable indexes.

## Required active references
- [Workflow protocol](references/workflow.md) — Read this when running stage procedure, existing-project onboarding, change-proposal, closure, or detailed command flow.
- [Capability governance](references/capability-governance.md) — Read this when separating observable capability from infrastructure, defining anti-claims, demonstrations, concept conformance, or guardrails.
- [Artifact contract](references/artifact-contract.md) — Read this when creating, validating, repairing, or reviewing dossier artifact schemas and runtime-owned frontmatter.
- [Runtime command guide](references/runtime-commands.md) — Read this when choosing a dossier-engineer command family, arguments, or expected operator flow.
- [Review and closure policy](references/review-and-closure.md) — Read this before implementation closure, verification, audit recording, freshness checks, or behavioral evidence review.
- [Body completion](references/body-completion.md) — Read this after creating or materially changing Markdown dossier artifacts and before stage close, handoff, PR preparation, changeset publication, or final response.

## Optional references
- [Parallel development rules](references/parallel-development.md) — Read this when working across branches, resolving merge conflicts, or creating changesets for handoff.
- [Retrospective protocol](references/retrospective.md) — Read this when creating retrospectives, process-miss records, skill feedback, changesets, or capability drift reports.
- [Operator capability reference](references/operator-capabilities.md) — Read this when the operator asks what dossier-engineer can do, how to ask an agent to use it, which workflow fits a delivery situation, or how to phrase capability-safe prompts.

## Bundled assets

- `assets/examples/baseline.md` — English example of a baseline artifact.
- `assets/examples/capability.md` — English example of a capability artifact.
- `assets/examples/changeset.md` — English example of a changeset artifact.
- `assets/examples/guardrail.md` — English example of a guardrail artifact.
- `assets/examples/review-concept.md` — English example of a concept review artifact.
- `assets/examples/source.md` — English example of a source artifact.
- `assets/examples/verification-behavioral.md` — English example of behavioral verification.
- `assets/examples/work-item-capability.md` — English example of capability work.
- `assets/examples/work-item-support.md` — English example of support work.

## Portability rules

- Do not reference machine-specific absolute paths in generated skill instructions.
- Keep required references, bundled assets, runtime scripts, runtime source, tests, and supporting historical files inside the skill folder.
- Use relative links and paths in generated guidance.
- Do not require hidden repository state outside Markdown/YAML artifacts and the bundled runtime.

## Portability checklist before finishing

- Run skill-source-compiler regenerate and check after changing the source bundle.
- Confirm every required reference exists under `references/`.
- Confirm Russian historical references remain under `docs/ru/references/`.
- Run `pnpm run lint`, `pnpm run format:check`, and `pnpm test` after runtime or source-bundle changes.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
- Supporting glob: `docs/ru/*`
- Supporting glob: `docs/ru/references/*`

## Final checks

Before reporting the skill ready after source-bundle changes:

- run the locally available `skill-source-compiler` runtime with `regenerate .` from the skill root;
- run the locally available `skill-source-compiler` runtime with `check .`;
- run the runtime package quality gate: `pnpm run lint`, `pnpm run format:check`, and `pnpm test`;
- confirm `SKILL.md` and `docs/compile-report.md` were generated from `skill.yaml`, not hand-edited.
