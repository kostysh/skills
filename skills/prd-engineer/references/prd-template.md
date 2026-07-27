# PRD template

Use this reference when the user needs a formal PRD artifact, not just a short chat answer.

## Repository Artifact Conventions

Before creating a persistent PRD, product brief, or PRD review in a repository, check whether repo-local artifact conventions exist through AGENTS.md, README, CONTRIBUTING, or docs linked from them.

If conventions exist, follow them for:

- canonical PRD/product brief location;
- stable artifact ID and ID prefix;
- metadata or front matter;
- requirement and acceptance ID prefixes;
- source links and related artifact IDs;
- module index updates.

Do not hard-code a repository-specific path in this template. If no repository convention exists, use the default shape below and state any location assumption when writing files.

## Choose the Right Size

| Mode | Use when | Shape |
| --- | --- | --- |
| One-pager | Discovery, pre-bet, early prototype, or unclear appetite | Problem, target user, outcome, hypothesis, appetite, biggest risks |
| Standard feature PRD | Normal product and engineering handoff | Core PRD sections with requirements, acceptance criteria, risks, rollout |
| Extended PRD | AI, platform, regulated, multi-team, migration-heavy, or security-sensitive work | Core PRD plus IDs, owners, traceability, optional modules, decision log |

## Core PRD Skeleton

If the repository requires front matter or a different metadata block, use that convention and preserve the same product meaning.

```markdown
# PRD: <title>

## Metadata
prd_id:
status: draft | review | baselined | updated | archived
version:
owner:
reviewers:
product_intent_sources_and_precedence:
current_version_approval_evidence:
intended_handoff: architecture | specification | delivery-planning | none
authority: authoritative | non-authoritative
handoff: not-assessed | draft-only | blocked | ready for <named consumer>
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
architecture_review_required:
ai_feature:
outcome_review_date:

## Authority and Handoff
- Product-intent sources and precedence:
- Current content/version approval or canonicalization evidence:
- Authority: authoritative | non-authoritative
- Intended downstream consumer:
- Handoff: not-assessed | draft-only | blocked | ready for <architecture | specification | delivery-planning>
- Blocking product decisions:
- Non-blocking gaps, owners, and decision triggers:

## Source Universe Reconciliation
| Source and locator | Kind | Atomic statement with conditions, exceptions, modality, and values | Requirement mapping or source-authorized disposition | Unresolved gap / owner |
| --- | --- | --- | --- | --- |
|  | prose clause / table row or note / email decision / mockup annotation |  |  |  |

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
| Item | Type | Blocking / non-blocking / validation gap | Owner | Due / trigger | Notes |
| --- | --- | --- | --- | --- | --- |
|  | Risk |  |  |  |  |

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

Resolve authority of product-intent sources separately from authority of the current PRD artifact. Generated or materially refined content remains `non-authoritative` until explicit operator evidence or the repository process approves or canonicalizes that content and version. Input authority, stale approval, or a `review` / `baselined` label does not transfer authority automatically.

Use `Handoff: not-assessed` when readiness was not requested or no consumer is named. If readiness is requested without a consumer, ask for it or leave only readiness unassessed while continuing the underlying PRD review. Use `ready` only when current-version authority is explicit and no unresolved product decision can change the named consumer's input. Remaining TBDs must be non-blocking and have an owner or decision trigger.

`Ready for <consumer>` certifies only the PRD's product input. It does not certify architecture, specification, delivery plan, implementation, or release readiness.

Avoid elaborate stage diagrams unless the user asks for process documentation.

## Evidence and Related Work

Use this table when requirements depend on research, metrics, designs, prior decisions, or stakeholder input.

| Artifact | Link | What it supports | Open uncertainty |
| --- | --- | --- | --- |
|  |  |  |  |

## Metrics and Quality Guardrails

Keep product success metrics separate from architecture or operational quality targets:

| Type | Example | Owner |
| --- | --- | --- |
| Product success metric | 40% of active workspaces connect a CRM within 30 days | Product |
| Quality guardrail | CRM callback p95 server-side latency stays under 500 ms at expected beta load | Engineering / Architecture |
| Operational guardrail | CRM sync failures do not increase workspace page error rate above the agreed threshold | Engineering / Operations |

Use quality guardrails when a product promise depends on performance, reliability, cost, security, privacy, operability, accessibility, or integration behavior. If the target is unknown, mark it TBD instead of inventing a number.

## Requirement Quality Checklist

Each important requirement should be:

- clear: one likely interpretation for the target audience
- atomic: one requirement, not a bundle of unrelated behavior
- feasible: plausible within known constraints, or marked as a risk
- verifiable: testable through observable behavior, measurement, or review evidence
- prioritized: must, should, could, or explicitly deferred
- traced: linked to a problem, user need, metric, source, or decision when the work is high risk

Before claiming source completeness:

- bound the source universe and applicable versions using repository authority rules;
- atomize prose clauses, table rows and notes, email decisions, and mockup annotations;
- preserve modality, conditions, exceptions, values, and locators rather than flattening them into a summary;
- map every source atom to a requirement or explicit source-authorized disposition;
- trace every material requirement back to its source atoms;
- block readiness for unavailable, unmapped, ambiguously merged, or unauthorizedly dismissed atoms.

A summary, derived register, or synthesized requirement list is navigation, not a disposition of the underlying source. It cannot make an omitted atom complete.

Use the existing product corpus or repo artifact convention when one exists. If no convention exists, suggested prefixes are `PRD-R` for functional requirements, `PRD-NFR` for non-functional requirements, and `AC` for acceptance criteria. Reference `ASR`, `PD`, or `ADR` identifiers only when those architecture artifacts already exist; do not mint accepted architecture IDs from a PRD.

For standard or extended PRDs, use attributes when engineering, QA, or later review will trace against the document:

| ID | Requirement | Source / evidence | Rationale | Priority | Release phase | Owner | Acceptance / verification | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRD-R1 |  |  |  | must | MVP |  |  | draft |

Use `Release phase` only when MVP, beta, GA, future, or deferred scope changes delivery, architecture, support, or acceptance decisions.

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

- Which actor or consumer triggers the behavior?
- What observable response, state or effect, and feedback must occur?
- What failure, continuity, or recovery behavior matters at this boundary?
- What evidence would prove it?
- What is the least-real implementation that could pass this criterion?
- Could this pass with only an endpoint, config value, mock, test, log line, file, ticket, documentation, static field, or other substrate?
- What negative or edge case should fail if the implementation is wrong?
- Who can verify it?

If an acceptance criterion can pass without the claimed user or system behavior across the declared boundary, rewrite it.

## Optional Modules

### Architecture Handoff Module

Use when the PRD will feed architecture, delivery planning, or implementation specs and the work may affect boundaries, public contracts, data model, security, tenancy, integration, deployment, observability, cost, operability, rollback, or long-term constraints.

The PRD may surface candidate architecture-relevant inputs. It must not choose patterns, define accepted ASRs, write ADRs, or make deployment decisions unless those decisions already exist and are cited.

This module supplies product constraints and blocking questions only. `architecture-engineer` owns ASR extraction and architecture decisions, `spec-engineer` owns implementation-ready behavior and verification maps, and `delivery-planner` owns slices, tasks, dependencies, and sequencing.

#### Linked Product Requirements

| Requirement | Why architecture may care | Source / evidence |
| --- | --- | --- |
|  |  |  |

#### Candidate Architecture-Relevant Inputs

| Requirement | Category | Known target or constraint | Confidence | Blocking? | Notes |
| --- | --- | --- | --- | --- | --- |
| PRD-R1 | Integration / data / security / reliability / cost / operations |  | low / medium / high | yes / no |  |

Confidence labels:

- `low`: likely to change architecture or implementation if wrong;
- `medium`: plausible but should be validated before high-risk commitment;
- `high`: supported by source evidence or existing system behavior.

#### Architecture-Relevant Constraints

- Platform/runtime constraints:
- External systems:
- Security/privacy constraints:
- Data retention, residency, deletion, or audit constraints:
- Performance, availability, recoverability, or workload targets:
- Cost guardrails:
- Team, operations, support, or rollout constraints:

#### External Systems and Constraints

| System | Role | Protocol / API | Auth | Rate limits | Failure impact | Owner | Open questions |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |

#### Lightweight Data Classification

- Data touched: public / internal / confidential / personal / sensitive / regulated / TBD
- Retention and deletion expectations:
- Residency constraints:
- Audit requirements:

#### Architecture Questions and Assumptions

| Item | Type | Why it matters | Decision it could change | Owner | Validation |
| --- | --- | --- | --- | --- | --- |
|  | blocking question / non-blocking assumption / validation gap |  |  |  |  |

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
| Architecture | Boundaries, public contracts, data model, security, tenancy, integration topology, deployment, observability, cost, rollback, or long-term constraints matter |
| Engineering | Feasibility, implementation constraints, integration, migration, or NFR feasibility matter |
| Data / ML | Metrics, experimentation, ranking, model quality, or eval design matters |
| Security / Legal | Sensitive data, auth, payments, compliance, or policy constraints matter |
| Support / GTM | Launch promises, docs, support load, beta criteria, or customer comms matter |

## Document Location

Choose the canonical location by collaboration need:

Repo-local artifact conventions override these generic defaults when the PRD is canonical in the repository. Apply the convention's location, ID, metadata/front matter, source-link, related-artifact, and module-index rules before writing or recommending a persistent PRD path.

| Location | Use when |
| --- | --- |
| Repo Markdown | Code, API, platform, infrastructure, AI evals, or implementation traceability are central |
| Collaborative workspace | Cross-functional comments, embeds, and stakeholder review are central |
| Hybrid | Keep the PRD canonical in one place and link research, designs, issues, evals, and decisions |

## PRD Review Checklist

Mark blockers separately from improvements:

- product-source precedence is separate from approval or canonical status of the current PRD version
- generated or materially refined content is non-authoritative until the resulting version is explicitly authorized
- the intended downstream consumer and readiness are explicit when handoff is assessed; otherwise handoff is `not-assessed`
- a non-authoritative PRD or unresolved product blocker is not marked ready
- remaining non-blocking TBDs have an owner or decision trigger
- problem and target user are explicit
- evidence or assumptions behind major claims are linked or named
- success metrics and guardrails are measurable
- scope and non-goals prevent common misunderstandings
- requirements are atomic and verifiable
- material capabilities identify actor or consumer, trigger, response, state or effect, feedback, and applicable failure or continuity behavior
- acceptance criteria require observable behavior and reject the least-real substrate-only implementation
- important NFRs are not missing
- architecture-relevant constraints, external systems, data sensitivity, and blocking questions are surfaced when the PRD feeds architecture or high-risk delivery
- AI features have evals and quality bars
- risks, dependencies, and open questions have owners
- rollout, instrumentation, and outcome review are defined
- document status, owner, next review, links, and change history are visible when needed

## Anti-Pattern Check

- PRD exists but no decision, scope, acceptance, or risk changed.
- Authority of input sources, stale approval, document status, or polish is treated as approval of generated or materially changed PRD content.
- A generic PRD review invents a downstream consumer instead of leaving handoff `not-assessed`.
- Handoff is marked ready while authority is missing or a product blocker can still change the named consumer's input.
- Product-input readiness is presented as architecture, specification, delivery, implementation, or release readiness.
- Solution details appear before the user problem and outcome.
- Vague words replace thresholds, examples, or TBDs.
- Non-goals are missing for scope-sensitive work.
- Implementation is over-specified where boundaries and acceptance criteria would be enough.
- Candidate ASRs, pattern decisions, ADRs, or deployment choices are presented as accepted architecture without an architecture source.
- PRD requirements are expanded into implementation-ready behavior, verification maps, task backlogs, or sequencing instead of routing them to the owning downstream skill.
- NFRs are omitted for performance, security, privacy, accessibility, reliability, or operations risk.
- Claims lack evidence links or clearly labeled assumptions.
- Launch has no instrumentation or outcome review.
