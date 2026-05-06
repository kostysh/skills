# PRD template

Use this reference when the user needs a formal PRD artifact, not just a short chat answer.

## Choose the Right Size

| Mode | Use when | Shape |
| --- | --- | --- |
| One-pager | Discovery, pre-bet, early prototype, or unclear appetite | Problem, target user, outcome, hypothesis, appetite, biggest risks |
| Standard feature PRD | Normal product and engineering handoff | Core PRD sections with requirements, acceptance criteria, risks, rollout |
| Extended PRD | AI, platform, regulated, multi-team, migration-heavy, or security-sensitive work | Core PRD plus IDs, owners, traceability, optional modules, decision log |

## Core PRD Skeleton

```markdown
# PRD: <title>

## Metadata
prd_id:
status: draft | review | baselined | updated | archived
version:
owner:
reviewers:
created_at:
updated_at:
target_release:
product_area:
audience:
related_docs:
success_metrics:
guardrail_metrics:
security_review_required:
legal_review_required:
ai_feature:
outcome_review_date:

## Executive Summary
- Problem:
- Why now:
- Proposed solution:
- Success metrics:
- Guardrail metrics:

## Audience and Scenarios
- Target users / roles:
- Primary job or workflow:
- Current pain and evidence:
- Key edge cases:

## Scope
- In scope:
- Non-goals / out of scope:
- Anti-claims:
- Assumptions:

## Requirements
### Functional Requirements
- R1:
- R2:

### Non-Functional Requirements
- NFR1:
- NFR2:

## Acceptance Criteria
- AC1:
- AC2:

## Risks, Dependencies, and Open Questions
| Item | Type | Owner | Due / trigger | Notes |
| --- | --- | --- | --- | --- |
|  | Risk |  |  |  |

## Rollout and Learning
- Rollout stages:
- Instrumentation:
- Experiment or measurement plan:
- Outcome review date:

## Change Log
| Version | Date | Change | Owner |
| --- | --- | --- | --- |
| 0.1 |  | Initial draft |  |
```

## Minimal Lifecycle

For PRDs that guide delivery, track only what prevents drift:

- current status
- accountable owner
- next review or outcome checkpoint

Avoid elaborate stage diagrams unless the user asks for process documentation.

## Evidence and Related Work

Use this table when requirements depend on research, metrics, designs, prior decisions, or stakeholder input.

| Artifact | Link | What it supports | Open uncertainty |
| --- | --- | --- | --- |
|  |  |  |  |

## Requirement Quality Checklist

Each important requirement should be:

- clear: one likely interpretation for the target audience
- atomic: one requirement, not a bundle of unrelated behavior
- feasible: plausible within known constraints, or marked as a risk
- verifiable: testable through observable behavior, measurement, or review evidence
- prioritized: must, should, could, or explicitly deferred
- traced: linked to a problem, user need, metric, source, or decision when the work is high risk

For standard or extended PRDs, use attributes when engineering, QA, or later review will trace against the document:

| ID | Requirement | Source / evidence | Rationale | Priority | Acceptance / verification | Status |
| --- | --- | --- | --- | --- | --- | --- |
| R1 |  |  |  | must |  | draft |

Replace vague adjectives with thresholds, examples, or TBDs:

| Vague | Better |
| --- | --- |
| fast | p95 latency under a named threshold for a named workload |
| intuitive | task completion target, usability test criterion, or accessibility target |
| reliable | availability, error budget, retry, recovery, or data-loss criterion |
| high quality | eval metric, rubric, human review bar, or defect threshold |
| scalable | expected volume, growth assumption, and performance guardrail |

## Acceptance Criteria Test

For every acceptance criterion, ask:

- What observable behavior must happen?
- What evidence would prove it?
- Could this pass with only a mock, log line, file, ticket, documentation, or static field?
- What negative or edge case should fail if the implementation is wrong?
- Who can verify it?

If an acceptance criterion can pass without real user or system behavior, rewrite it.

## Optional Modules

### AI Feature Module

Use when behavior depends on a model, prompt, retrieval, ranking, classification, generation, or probabilistic output.

- Inputs and data sources:
- Model or service assumptions:
- Tool/API requirements:
- Prompt or policy constraints:
- Evaluation set:
- Quality metrics and pass bars:
- Latency and cost guardrails:
- Human review or escalation:
- Safety, abuse, privacy, and failure modes:
- Monitoring and regression checks:

### Security, Privacy, and Compliance Module

Use when the feature touches sensitive data, auth, permissions, payments, minors, enterprise controls, legal constraints, or regulated workflows.

- Data classes and retention:
- Permission model:
- Audit logging:
- Privacy constraints:
- Security review trigger:
- Compliance or legal review trigger:
- Abuse cases:

### Migration and Compatibility Module

Use when changing existing workflows, APIs, schemas, permissions, integrations, or user expectations.

- Backward compatibility:
- Migration steps:
- Rollback plan:
- Deprecation or communication:
- Data integrity checks:

### Review Routing

Route review only to functions whose decisions can change scope, acceptance, or risk.

| Reviewer | Trigger |
| --- | --- |
| Design | User flow, IA, usability, accessibility, or prototype decisions matter |
| Engineering | Architecture, feasibility, integration, migration, or NFR decisions matter |
| Data / ML | Metrics, experimentation, ranking, model quality, or eval design matters |
| Security / Legal | Sensitive data, auth, payments, compliance, or policy constraints matter |
| Support / GTM | Launch promises, docs, support load, beta criteria, or customer comms matter |

## Document Location

Choose the canonical location by collaboration need:

| Location | Use when |
| --- | --- |
| Repo Markdown | Code, API, platform, infrastructure, AI evals, or implementation traceability are central |
| Collaborative workspace | Cross-functional comments, embeds, and stakeholder review are central |
| Hybrid | Keep the PRD canonical in one place and link research, designs, issues, evals, and decisions |

## PRD Review Checklist

Mark blockers separately from improvements:

- problem and target user are explicit
- evidence or assumptions behind major claims are linked or named
- success metrics and guardrails are measurable
- scope and non-goals prevent common misunderstandings
- requirements are atomic and verifiable
- acceptance criteria require observable behavior
- important NFRs are not missing
- AI features have evals and quality bars
- risks, dependencies, and open questions have owners
- rollout, instrumentation, and outcome review are defined
- document status, owner, next review, links, and change history are visible when needed

## Anti-Pattern Check

- PRD exists but no decision, scope, acceptance, or risk changed.
- Solution details appear before the user problem and outcome.
- Vague words replace thresholds, examples, or TBDs.
- Non-goals are missing for scope-sensitive work.
- Implementation is over-specified where boundaries and acceptance criteria would be enough.
- NFRs are omitted for performance, security, privacy, accessibility, reliability, or operations risk.
- Claims lack evidence links or clearly labeled assumptions.
- Launch has no instrumentation or outcome review.
