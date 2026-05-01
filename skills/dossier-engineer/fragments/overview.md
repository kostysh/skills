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
