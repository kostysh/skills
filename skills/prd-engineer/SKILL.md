---
name: prd-engineer
description: Create, refine, and review Product Requirements Documents (PRDs),
  product specs, feature requirements, and AI feature requirements. Use when
  asked to write a PRD, turn a vague product idea into testable requirements,
  define scope and non-goals, create acceptance criteria, add rollout or success
  metrics, prepare product input for architecture or specification handoff,
  handle AI evaluation requirements, or audit a PRD for ambiguity, missing
  evidence, weak acceptance criteria, or scope risk.
metadata:
  source-version: 0.1.3
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 7139f7d658ad078497c0634549a569acc80d4d717b226e7c9f8b06420bd67fb6
---

# prd-engineer

## Start here

1. Confirm whether the user needs a new PRD, a refinement, or a review of an existing PRD.
2. Separate the observable product capability from substrate such as documentation, tickets, mocks, logs, or implementation scaffolding.
3. Choose the lightest PRD mode that fits the risk; do not expand a one-pager into a heavyweight template by default.
4. Before creating or recommending a persistent PRD, product brief, or PRD review artifact, check whether the current repository defines artifact conventions and follow them when present.
5. If the PRD feeds architecture, delivery planning, or implementation specs, surface architecture-relevant constraints and questions without choosing architecture patterns.
6. Ask only focused discovery questions that would change scope, metrics, or acceptance; otherwise draft with explicit assumptions and TBDs.

## When to use this skill

- Writing a PRD, product requirements document, feature spec, product spec, or requirements doc.
- Turning a vague product idea, stakeholder request, or AI feature idea into problem-first, testable requirements.
- Defining scope, non-goals, user stories, acceptance criteria, success metrics, rollout, risks, or open questions.
- Reviewing an existing PRD for ambiguity, missing evidence, unverifiable requirements, weak acceptance criteria, hidden scope, or missing AI evaluation.
- Creating a compact one-pager, standard feature PRD, or extended PRD for high-risk, AI, platform, regulated, or multi-team work.
- Preparing product-stage input for architecture, delivery planning, or implementation specification in a risk-adaptive development workflow.

## When NOT to use this skill

- Writing marketing copy, launch announcements, sales enablement, or public-facing positioning without requirements work.
- Implementing the feature described by a PRD; use implementation and domain skills instead.
- Reviewing code against an existing PRD; use `spec-conformance-reviewer`.
- Checking whether a task only creates substrate while claiming a product capability; use `concept-conformance-reviewer`.
- Creating formal safety-critical, procurement, legal, or regulated specifications without a domain-specific template or reviewer.

## Overview

Create PRDs that are problem-first, scope-aware, and testable enough for product, design, engineering, QA, and stakeholders to share the same understanding.

This skill favors concise documents with strong requirements over heavyweight templates. Use it to turn product intent into observable behavior, acceptance criteria, risks, rollout, and learning loops. A PRD does not prove market demand, technical feasibility, or implementation correctness by itself; it makes those claims explicit enough to test.

## Default Output Shape

For a new PRD, include:

- executive summary: problem, why now, solution, success metrics, guardrails
- audience and scenarios: users, jobs, primary flow, key edge cases
- scope: in scope, non-goals, anti-claims
- requirements: functional and non-functional requirements, preferably with IDs for handoff
- acceptance criteria: observable checks per story, requirement, or capability
- risks and dependencies: owners, open questions, decisions needed
- rollout and learning: phases, instrumentation, outcome review

For a PRD review, lead with the gaps most likely to cause wrong implementation, false acceptance, or scope drift. Then provide concrete rewrites or section-level fixes.

## Reference Map

Read [PRD template](references/prd-template.md) when creating a formal PRD artifact, expanding a draft, adding architecture handoff, AI/security/rollout modules, or running a detailed quality check.

## Contextual Reference Triggers

Open only the block that matches the task:

- **Formal PRD skeleton, metadata, or minimal lifecycle:** use [PRD template](references/prd-template.md) sections `Core PRD Skeleton` and `Minimal Lifecycle`.
- **Claims that depend on research, metrics, designs, or decisions:** use [PRD template](references/prd-template.md) section `Evidence and Related Work`.
- **Product metrics, quality guardrails, release phases, or owner attributes:** use [PRD template](references/prd-template.md) sections `Metrics and Quality Guardrails` and `Requirement Quality Checklist`.
- **Architecture handoff, external systems, or data classification:** use [PRD template](references/prd-template.md) section `Architecture Handoff Module`.
- **Handoff to engineering, QA, or later conformance review:** use [PRD template](references/prd-template.md) section `Requirement Quality Checklist` for requirement attributes and traceability.
- **Acceptance criteria review:** use [PRD template](references/prd-template.md) section `Acceptance Criteria Test`.
- **AI, security, privacy, compliance, migration, or compatibility risk:** use [PRD template](references/prd-template.md) section `Optional Modules`.
- **Cross-functional review planning:** use [PRD template](references/prd-template.md) section `Review Routing`.
- **Choosing where the PRD should live:** use [PRD template](references/prd-template.md) section `Document Location`.
- **Reviewing an existing PRD:** use [PRD template](references/prd-template.md) sections `PRD Review Checklist` and `Anti-Pattern Check`.

## Workflow stages

### Workflow stage: Select PRD mode

Fit the document size to uncertainty, risk, and audience.

1. Use a one-pager for early discovery, pre-bet, or prototype framing.
2. Use a standard feature PRD for ordinary product and engineering handoff.
3. Use an extended PRD when the work is AI-driven, platform-level, regulated, multi-team, migration-heavy, security-sensitive, or hard to verify.

Validation:

- The selected mode is stated or obvious from the output.
- The document is no larger than the risk justifies.

### Workflow stage: Run discovery checkpoint

Prevent a PRD from becoming a polished guess.

1. Identify the core problem, target users, why now, current evidence, desired outcome, constraints, and success metrics.
2. Separate product success metrics from quality guardrails when reliability, performance, cost, security, or operations could affect later architecture or acceptance.
3. Ask the fewest concise questions needed when missing answers would materially change the PRD.
4. If the user asks for an immediate draft, proceed with clearly labeled assumptions, TBDs, and open questions instead of inventing facts.

Validation:

- Missing problem, user, scope, metric, or constraint information is either answered, marked TBD, or listed as an open question.
- No constraint, metric, user research, data source, or technical dependency is hallucinated.

### Workflow stage: Frame capability and scope

Make the intended observable product behavior explicit before listing requirements.

1. State the product outcome in user terms before describing the solution.
2. Separate in-scope behavior from substrate and supporting artifacts.
3. Define non-goals and anti-claims: what this PRD or release will not make possible.
4. Capture important assumptions, dependencies, risks, owners, and decision points.

Validation:

- The PRD cannot be mistaken for a promise to deliver behavior that is only researched, mocked, documented, or deferred.
- Non-goals and open questions protect scope instead of hiding uncertainty.

### Workflow stage: Write testable requirements

Convert intent into buildable and reviewable requirements.

1. Write requirements as atomic, clear, feasible, prioritized, and verifiable statements.
2. Prefer IDs for standard or extended PRDs, especially when engineering, QA, architecture, or implementation review will trace against them.
3. Add owner and release phase attributes when requirement ownership, MVP/beta/GA scope, or deferred behavior could change downstream decisions.
4. Pair user stories or capabilities with acceptance criteria that force observable behavior.
5. Include non-functional requirements for performance, reliability, accessibility, security, privacy, cost, and operations when they affect success.

Validation:

- Vague words such as fast, easy, intuitive, robust, scalable, or modern are replaced by thresholds, examples, guardrails, or TBDs.
- Acceptance criteria cannot pass only through mocks, metadata, logs, documentation, or static existence checks.

### Workflow stage: Add only needed modules

Cover risk-specific requirements without turning every PRD into a master document.

1. Add an AI module when outputs are probabilistic, model-driven, prompt-driven, retrieval-based, or evaluated by quality rather than deterministic logic.
2. Add security, privacy, compliance, migration, GTM, support, or alternatives modules only when those topics affect scope, approval, delivery, or acceptance.
3. Add architecture handoff inputs when the PRD may affect boundaries, contracts, data, security, tenancy, integration, deployment, observability, cost, operability, rollback, or long-term constraints.
4. Link to existing research, designs, epics, issues, experiments, and decisions instead of copying bulky context.

Validation:

- Optional modules are justified by risk or decision value.
- Architecture handoff content names product constraints and questions; it does not select architecture patterns, ASRs, ADRs, or deployment designs.
- AI PRDs include evaluation strategy, quality thresholds, latency or cost guardrails, and failure handling.

### Workflow stage: Run PRD quality gate

Make the final artifact usable for shared understanding, delivery, and later review.

1. Check the PRD against problem-first framing, measurable success, scope/non-goals, testable requirements, risks, owners, rollout, instrumentation, and outcome review.
2. Mark blockers separately from polish.
3. When reviewing a PRD, lead with gaps that would cause wrong implementation, false acceptance, or scope drift.

Validation:

- The final output names important assumptions, unresolved questions, and verification gaps.
- The PRD can be used by product, design, engineering, QA, and stakeholders without relying on hidden context.

## Interop priority

- **capability versus substrate:** concept-conformance-reviewer. concept-conformance-reviewer owns fake-risk analysis when acceptance criteria or plans can pass without delivering the claimed capability.
- **implementation against PRD:** spec-conformance-reviewer. spec-conformance-reviewer owns checking code or implementation evidence against an approved PRD.
- **architecture-significant requirements, pattern decisions, and ADRs:** architecture-engineer. architecture-engineer owns translating product requirements into architecture decisions, constraints, quality scenarios, architecture handoff, and architecture drift handling.
- **technical feasibility and domain-specific requirements:** the relevant domain skill. Domain skills own framework, security, data, ML, infrastructure, regulatory, or product-domain facts.
- **documentation architecture:** documentation. documentation owns Diataxis and docs IA; this skill owns PRD content and requirements quality.

## Gotchas

- **high** — A complete PRD template with vague content is still a bad PRD.
- **high** — Do not fabricate users, research, metrics, constraints, or technical decisions; mark them as assumptions, TBDs, or open questions.
- **medium** — Do not over-prescribe implementation details when acceptance criteria and boundaries are enough.
- **high** — AI feature PRDs need evaluation strategy and quality bars; a demo or prompt description is not enough.
- **high** — Do not present candidate architecture-significant inputs as accepted ASRs, pattern decisions, ADRs, or implementation designs.
- **medium** — For delivery PRDs, keep lifecycle tracking minimal but visible; status, owner, and next review are usually enough.

## Policies

### Problem-first policy
Start from user problem, outcome, and evidence before solution details.

### Just-enough detail policy
Include a section only when it changes a decision, reduces risk, clarifies scope, or supports acceptance.

### Acceptance integrity policy
Acceptance criteria must require observable behavior or measurable evidence, not only the existence of files, mocks, logs, or tickets.

### Light traceability policy
Use requirement IDs, owners, source links, statuses, and change notes when multiple people or later implementation review will depend on the PRD.

### Repository artifact conventions policy
When producing or recommending a persistent PRD, product brief, or PRD review in a repository, first check repo-local artifact conventions through AGENTS.md, README, CONTRIBUTING, or docs linked from them. If conventions exist, follow them for canonical location, stable PRD or product-brief IDs, metadata/front matter, requirement and acceptance ID prefixes, source links, related artifact links, and module index updates. Do not hard-code one repository's paths into this skill. If no repository convention exists, use this skill's default PRD shape and state any location assumption when writing files. Repository conventions override generic PRD location defaults when the artifact is canonical in the repo.

### Architecture handoff policy
PRDs may surface architecture-relevant product constraints, quality guardrails, external systems, data sensitivity, release phases, and blocking questions, but architecture-engineer owns ASR extraction and architecture decisions.

### Brevity policy
In chat, keep outputs concise unless the user asks for a formal artifact; use the reference template for full documents.

## Optional references
- [PRD template](references/prd-template.md) — Read this when creating a formal PRD artifact, expanding an existing PRD, adding metadata, evidence, traceability, review routing, AI/security/rollout modules, or running a detailed PRD quality check.

## Portability rules

- Do not reference machine-specific paths or files outside this skill folder.
- Keep all mandatory PRD guidance inside this skill folder.
- Treat external examples and standards as optional background, not runtime dependencies.
- Use relative links for local references and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm the optional PRD template reference is reachable from the generated SKILL.md.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
