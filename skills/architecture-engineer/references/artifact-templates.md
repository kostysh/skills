# Artifact templates

Use these templates only for artifacts that the risk and scope justify. Prefer the copy-ready files under `assets/templates/` when writing a standalone artifact.

## Repository artifact conventions

Before creating a persistent architecture artifact in a repository, check whether repo-local artifact conventions exist through AGENTS.md, README, CONTRIBUTING, or docs linked from them.

If conventions exist, apply them to architecture checks, architecture deltas, architecture briefs, ASR records/registers, pattern decisions, ADRs, quality scenarios, spike briefs, and architecture handoff items/registers. Follow convention-defined artifact locations, stable IDs or ID prefixes, metadata/front matter, source links, related artifact IDs, and module index updates.

Do not hard-code a repository-specific path in these templates. If no repository convention exists, use the templates below and state path assumptions only when writing files.

## Output contract

For architecture work, return the smallest complete subset below.

For persistent artifacts, include or recommend convention-compliant path, ID, and metadata when repo-local conventions define them.

### Low-risk architecture check

Use when the result is "no architecture work needed" or risk is low.

```md
## Architecture check

- Risk: low
- Reason: local change; no boundary, data, contract, security, deployment or observability impact
- Assumptions:
  - Existing module boundary remains unchanged.
- Required follow-up: none
```

### Medium-risk architecture delta

Use for bounded changes to existing architecture.

```md
# Architecture delta: <change title>

## Scope
Affected modules, contracts, data and operations.

## Linked requirements
PRD and spec requirement IDs.

## Existing architecture
Current relevant behavior or convention.

## Proposed architectural change
Pattern and boundary change.

## Alternatives
Credible alternatives and why rejected.

## Constraints for spec
Behavior constraints that implementation must preserve.

## Validation obligations
Tests, contract checks, migration checks, observability and review.

## Architecture handoff
Architecture handoff items for `spec-engineer`.

## Revisit triggers
Signals that require architecture review.
```

### Pattern decision

Use before ADR when a decision has future relevance but is not heavy enough for a formal ADR.

```md
# Pattern decision: <decision title>

- Decision ID: PD-<number>
- Status: proposed | accepted | superseded
- Scope:
- Linked requirements:
- Linked ASR:
- Selected pattern:
- Alternatives considered:
- Rationale:
- Consequences:
- Validation:
- Revisit triggers:
```

### High-risk design note or ADR package

Include:

- context evidence;
- ASR register;
- candidate pattern comparison;
- selected decision;
- quality scenarios;
- security/privacy/migration/rollback considerations;
- validation plan;
- ADR draft if justified;
- architecture handoff;
- post-merge validation obligations.

### ADR

Use only for significant, hard-to-reverse, disputed, public, or long-lived decisions.

```md
# ADR-<number>: <decision title>

## Status
Proposed | Accepted | Superseded

## Context
Relevant evidence, ASR, forces, constraints, and assumptions.

## Decision
The selected architecture decision and its boundary.

## Alternatives considered
- <alternative>. Rejected because <reason>.
- <alternative>. Rejected because <reason>.

## Consequences
- Positive: <benefit>.
- Negative: <trade-off or cost>.

## Validation
- <quality scenario, inspection, contract check, test, spike, or operational check>.

## Migration and rollback
- <migration path, compatibility window, rollback constraint, or "not applicable" with reason>.

## Revisit triggers
- <signal that should reopen this decision>.
```

### New system architecture brief

Use for a new system, major redesign, or large vertical slice.

```md
# Architecture brief: <system or slice>

## Scope and non-goals

## Context summary

## Assumptions and confidence

## ASR register

## System pattern decision

## Component pattern decisions

## Views
- Frontend:
- Backend:
- Data:
- Integration:
- Security and privacy:
- Observability:
- Deployment:

## Quality scenarios

## Spike list

## Architecture handoff register

## Revisit triggers
```

### ASR record

```yaml
asr:
  id: ASR-<AREA>-<number>
  requirement: "<architecture-shaping requirement>"
  forces:
    - <force>
  architectural_risk: low | medium | high
  evidence: "<source requirement, code, policy, or assumption>"
  confidence: low | medium | high
  validation: "<scenario, spike, inspection, contract check, or test>"
```

### Quality scenario

```md
### Quality scenario: <scenario title>

- Source: <actor, system, failure source, load source, or policy source>
- Stimulus: <event or condition>
- Environment: <runtime context>
- Artifact: <system element under stress>
- Response: <required behavior>
- Response measure: <measurable threshold or observable evidence>
- Validation: <how this scenario will be checked>
```

### Spike brief

```md
# Spike: <question title>

## Question
<Decision-blocking question.>

## Scope
<Smallest investigation that can produce useful evidence.>

## Success criteria
<Measurable evidence that answers the question.>

## Output
Evidence, recommended pattern, rejected alternatives, and follow-up decision.
```

### Architecture handoff register

Use this when multiple handoff items are produced.

```yaml
architecture_handoff_register:
  - id: AHI-001
    kind: spec_candidate
    title: Credential lifecycle and token isolation
    linked_asr:
      - ASR-SEC-1
    next_stage_owner: spec-engineer
  - id: AHI-002
    kind: validation_obligation
    title: OAuth callback idempotency validation
    linked_asr:
      - ASR-INT-1
    next_stage_owner: spec-engineer
```

### Architecture handoff item

```yaml
architecture_handoff_item:
  id: AHI-<number>
  kind: spec_candidate | spike | validation_obligation | migration_constraint | security_constraint | observability_requirement | rollout_constraint | documentation_update | architecture_revisit_trigger
  title: "<handoff title>"
  linked_prd:
    - <PRD requirement ID>
  linked_asr:
    - <ASR ID>
  linked_decision:
    - <pattern decision or ADR ID>
  architectural_intent: >
    <Why this item exists and what downstream specs must preserve.>
  constraints:
    - <architecture constraint>
  acceptance_constraints:
    - <acceptance condition that protects architecture intent>
  required_validation:
    - <validation obligation>
  observability_requirements:
    - <metric, trace, log, dashboard, or runbook obligation>
  rollback_constraints:
    - <rollback or migration constraint>
  next_stage_owner: spec-engineer
  expected_next_output:
    - <expected downstream specification>
  not_prescribed:
    - exact table names
    - exact endpoint names
    - exact class/function names
    - exact queue implementation unless separately decided
```

Allowed `kind` values:

```yaml
kind:
  - spec_candidate
  - spike
  - validation_obligation
  - migration_constraint
  - security_constraint
  - observability_requirement
  - rollout_constraint
  - documentation_update
  - architecture_revisit_trigger
```

## Forbidden output style

Do not use task-backlog naming or implementation-task schemas inside architecture output. Use `architecture_handoff_item` for spec candidates, validation obligations, and other downstream architectural obligations. If the user explicitly asks for planning, create a separate `Downstream implementation planning` section after the architecture output.

Validation:

- Handoff items are clearly not implementation tasks.
- `spec-engineer` can write behavior-level specs without reselecting architecture patterns.
- Risky changes have validation, rollback, or migration obligations.
- `not_prescribed` is used when the architecture frame intentionally leaves implementation freedom.
- Exact table names, endpoint names, class names, or task sequencing are omitted unless they are architectural constraints.

## Asset map

| Asset | Use |
| --- | --- |
| `assets/templates/architecture-check.md` | Low-risk architecture check |
| `assets/templates/architecture-delta.md` | Medium-risk architecture delta |
| `assets/templates/architecture-brief.md` | New system or major redesign architecture brief |
| `assets/templates/asr-record.yaml` | ASR record |
| `assets/templates/pattern-decision.md` | Pattern decision |
| `assets/templates/adr.md` | ADR |
| `assets/templates/quality-scenario.md` | Quality scenario |
| `assets/templates/spike-brief.md` | Spike brief |
| `assets/templates/architecture-handoff-item.yaml` | Single handoff item |
| `assets/templates/architecture-handoff-register.yaml` | Handoff register |
