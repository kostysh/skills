# Operator Capability Reference

Use this reference when an operator asks what `dossier-engineer` can do, how to ask an agent to use it, or which workflow fits a delivery situation.

## Interaction Model

The operator owns product intent, priorities, and constraints. The agent owns dossier execution: runtime commands, artifact updates, checks, evidence capture, and truthful reporting.

The operator should not need to hand-author frontmatter, invent IDs, update lifecycle states, maintain YAML schemas, or decide which machine-owned fields to change. Those are runtime responsibilities.

Preferred operator framing:

```text
Use dossier-engineer. First define the capability: what observable behavior should appear, how it will be demonstrated, and which anti-claims apply. Then create the work item and implementation plan.
```

Weak framing:

```text
Build the API, tables, lifecycle, and tests.
```

That phrasing may produce infrastructure without proving a user-, operator-, integration-, or system-observable capability.

## Core Capabilities

| Operator need | What dossier-engineer provides | Agent responsibility |
|---|---|---|
| Start a new project | Initialize `docs/dossier/`, register canonical sources, create intended capabilities | Anchor work to source and capability before creating work items |
| Onboard an existing project | Record an existing-product baseline with observed, partial, and unverified capabilities | Avoid retroactive closed work items for pre-dossier work |
| See current project state | Derive status, attention, queue, capability gates, and guardrail blockers | Run read-only checks and explain the next safest step |
| Plan a feature | Define capability claims, anti-claims, demo scenarios, and capability work | Separate observable behavior from implementation substrate |
| Execute delivery | Run feature-intake, spec-compact, plan-slice, implementation, review, verification, closure, and hygiene stages | Use runtime transitions and preserve closure gates |
| Track support work | Represent infrastructure as support work linked to a capability or guardrail | Never count support work as product capability by itself |
| Fix regressions | Create maintenance work tied to the capability being restored | Prove the existing observable behavior works again |
| Run exploration | Create bounded research work without claiming delivery | Close exploration with answer, evidence, and follow-up decision |
| Handle changed sources | Refresh source hashes and show impacted capabilities and work items | Do not mutate scope automatically before operator decision |
| Handle implementation drift | Open change-proposal and return to the earliest affected stage | Do not absorb requirement drift silently |
| Coordinate parallel work | Use scope-local records and branch changesets | Avoid shared mutable global state and cross-scope edits |
| Prepare handoff or merge | Create changesets and run consistency checks | Report blockers, stale reviews, failed verification, and affected capabilities |
| Review process quality | Create retrospectives over capability drift, support accumulation, weak evidence, and workflow overhead | Keep retrospective reports derived, not primary truth |

## Operator Prompt Patterns

### Ask what to do next

```text
Use dossier-engineer.
Run status, attention, queue, capability check, and guardrail check.
Tell me the next safest step and why.
```

Expected agent behavior:

```bash
dossier-engineer status --root .
dossier-engineer attention --root .
dossier-engineer queue --root .
dossier-engineer capability check --root .
dossier-engineer guardrail check --root .
```

The answer should distinguish proven capabilities, claimed but unproven capabilities, support work, source changes, guardrails, and executable work.

### Start a new project

```text
Use dossier-engineer.
Initialize a dossier for the new project <name>.
The canonical concept source is <path>.
Register the source first, then identify initial capabilities.
Do not create work items until capability claims, demo scenarios, and anti-claims are stated.
```

Expected agent behavior:

```bash
dossier-engineer init --root . --project-name "<project>"
dossier-engineer source add --path <path> --kind concept --authority canonical --title "<concept>"
dossier-engineer capability create ...
dossier-engineer capability claim set ...
dossier-engineer capability check --root .
```

Good operator follow-up:

```text
Show me the capability map and explain what observable behavior each capability will add.
```

### Onboard an existing project

```text
Use dossier-engineer in existing-project onboarding mode.
The project already has working behavior. Do not create artificial closed work items.
First record a baseline of existing capabilities with evidence.
Separate observed, partial, and unverified capabilities.
```

Expected agent behavior:

```bash
dossier-engineer init --root . --project-name "<project>"
dossier-engineer source add --path <path> --kind concept --authority canonical --title "<current concept>"
dossier-engineer baseline create --title "Existing product baseline" --mode existing-project --source <source-id>
dossier-engineer capability create --title "<existing capability>" --status existing --source <source-id>
dossier-engineer capability claim set ...
dossier-engineer capability demo record ...
dossier-engineer baseline capability add ...
dossier-engineer capability check --root .
```

Existing code is not proof by itself. A capability is proven only when observed behavior and evidence are recorded.

### Create a product feature without self-deception

```text
Use dossier-engineer.
For feature <description>, first create or update the capability.
State observable behavior, demo scenario, and anti-claims.
Challenge the plan before implementation.
Do not close the work item without behavioral evidence and concept-conformance review.
```

Expected agent behavior:

```bash
dossier-engineer capability create ...
dossier-engineer capability claim set ...
dossier-engineer capability anti-claim add ...
dossier-engineer work create --delivery capability ...
dossier-engineer work acceptance add --kind behavior ...
dossier-engineer work demo set ...
dossier-engineer work anti-claim add ...
dossier-engineer capability check --work <work-id>
```

Operator quality criterion:

```text
I should understand exactly what a user, operator, integration, or system can do after implementation, and how that will be proven.
```

### Run full delivery workflow

```text
Take work item <WI-id> through the full dossier workflow:
feature-intake -> spec-compact -> plan-slice -> implementation.
At plan-slice, challenge the work first: where it could become infrastructure-only, what self-deception is possible, and which implied expectations are missing.
Do not close implementation without behavioral verification and concept-conformance review.
```

Expected stage flow:

```bash
dossier-engineer stage start --work <work-id> --stage feature-intake --session <session-id>
dossier-engineer stage ready --work <work-id> --stage feature-intake --summary "<summary>"
dossier-engineer stage close --work <work-id> --stage feature-intake

dossier-engineer stage start --work <work-id> --stage spec-compact --session <session-id>
dossier-engineer stage ready --work <work-id> --stage spec-compact --summary "<summary>"
dossier-engineer stage close --work <work-id> --stage spec-compact

dossier-engineer stage start --work <work-id> --stage plan-slice --session <session-id>
dossier-engineer work challenge record --work <work-id> --summary "<challenge>"
dossier-engineer stage ready --work <work-id> --stage plan-slice --summary "<summary>"
dossier-engineer stage close --work <work-id> --stage plan-slice

dossier-engineer stage start --work <work-id> --stage implementation --session <session-id>
```

Before implementation closure:

```bash
dossier-engineer verify required --work <work-id> --stage implementation
dossier-engineer verify record --work <work-id> --stage implementation --profile behavioral-demo --evidence-class behavioral --verdict pass --summary "<observed behavior>" --evidence <path>

dossier-engineer review required --work <work-id> --stage implementation
dossier-engineer review record --work <work-id> --stage implementation --class concept-conformance-reviewer --verdict pass --reviewer <reviewer-id>
dossier-engineer review record --work <work-id> --stage implementation --class spec-conformance-reviewer --verdict pass --reviewer <reviewer-id>

dossier-engineer stage ready --work <work-id> --stage implementation --summary "<implemented result>"
dossier-engineer stage close --work <work-id> --stage implementation
dossier-engineer hygiene run --work <work-id> --stage implementation
```

### Create infrastructure work correctly

```text
Create a support work item for <infrastructure task>.
Link it to capability <CAP-id> or guardrail <KILL-id>.
Explain why this support work is needed now and which capability it unlocks.
Do not count it as product functionality.
```

Expected agent behavior:

```bash
dossier-engineer work create --delivery support ...
dossier-engineer work support explain --work <work-id> --summary "<why needed now>"
dossier-engineer capability check --work <work-id>
```

Good operator follow-up:

```text
Which capability remains impossible if we skip this support work?
```

If the agent cannot answer, the support work is probably premature or misframed.

### Fix a bug or regression

```text
Fix bug <description>.
First identify the capability that the bug breaks.
Create a maintenance work item, record the regression demo, then implement the fix.
Close only after proving the existing capability is restored.
```

Expected agent behavior:

```bash
dossier-engineer work create --delivery maintenance --relation maintains ...
dossier-engineer work demo set --work <work-id> --name "<regression demo>" --scenario "<behavior restored>"
```

The goal is not merely to patch code. The goal is to restore an observable system capability.

### Run research or exploration

```text
Create an exploration work item for this question: <question>.
Do not present the result as product capability.
Close exploration only after recording the answer, evidence, and decision to create or not create follow-up work.
```

Expected agent behavior:

```bash
dossier-engineer work create --delivery exploration --type research ...
```

Exploration must not quietly become "we delivered the feature."

### Handle source or concept changes

```text
Source <path/source-id> changed.
Refresh the source hash and show impacted capabilities and work items.
Do not change tasks automatically. Show source impact first and propose options.
```

Expected agent behavior:

```bash
dossier-engineer source refresh --source <source-id>
dossier-engineer source impact --source <source-id>
```

The operator then decides whether to open change-proposal, update scope, or resolve the source review with no backlog change.

### Handle drift discovered during implementation

```text
Stop the current implementation stage.
Open change-proposal for <WI-id>.
Describe what changed: concept, capability claim, acceptance, demo, or scope.
After the change is accepted, return the work to the earliest affected stage.
```

Expected agent behavior:

```bash
dossier-engineer stage start --work <work-id> --stage change-proposal --session <session-id>
dossier-engineer work amend --work <work-id> --from-change-proposal --summary "<accepted change>"
dossier-engineer stage ready --work <work-id> --stage change-proposal --summary "<verdict>"
dossier-engineer stage close --work <work-id> --stage change-proposal
```

Drift should not be fixed invisibly "while coding."

### Coordinate parallel work

```text
Work only in the scope of your work item or capability.
Do not edit other agents' dossier records.
Before handoff, create a changeset for the current branch and run lint, capability check, and guardrail check.
```

Expected agent behavior:

```bash
dossier-engineer changeset create --scope current-branch --summary "<branch summary>"
dossier-engineer lint --root .
dossier-engineer capability check --root .
dossier-engineer guardrail check --root .
```

Each agent should work in a bounded work/capability scope, not in a shared global state file.

### Prepare merge or handoff

```text
Prepare handoff for the current branch.
Create a changeset, check dossier consistency, and show blockers, stale reviews, failed verification, and affected capabilities.
Do not hide unclosed risks.
```

The answer should include changed records, affected capabilities, closed work items, evidence, fresh reviews, remaining blockers, and guardrails.

### Run a process retrospective

```text
Create a retrospective report for <date/ref>.
Find support work without capability progress, spec drift from concept, stale reviews, failed or weak behavioral evidence, repeated blockers, and workflow overhead.
Recommend process improvements.
```

Expected agent behavior:

```bash
dossier-engineer retro create --since <date-or-ref> --until <date-or-ref>
```

Retrospectives are derived views. They can guide process improvement, but they do not replace primary dossier truth.

## Quality Signals

Strong agent answers include:

- source or concept reference;
- capability claim;
- behavioral acceptance;
- demo scenario;
- anti-claims;
- pre-implementation challenge;
- explicit capability/support/maintenance/exploration classification;
- runtime commands or command results;
- blockers and next actions;
- evidence before closure.

Weak agent answers include:

- table, API, queue, test, or lifecycle plans without observable behavior;
- "feature complete" claims where the demo shows only internal state;
- passing tests with no demonstrated user, operator, integration, or system scenario;
- support work accumulating without end-to-end capability progress;
- manual frontmatter edits;
- work item closure without concept-conformance review.

The operator's recurring control question:

```text
After this work closes, what new or restored system capability will observably work, and what proves it?
```
