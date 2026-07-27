---
name: prd-engineer
description: Create, refine, and review PRDs, product specs, feature and AI
  requirements. Turn ideas into testable scope, non-goals, acceptance, rollout,
  and metrics; establish source authority and handoff readiness; address AI
  evaluation; or audit ambiguity, missing evidence, weak acceptance, and scope
  risk.
metadata:
  source-version: 0.1.7
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 86a19aa50d71a78ee5374c3a99ed4feba851cbfbebdea291e34a2ca10d1faa7a
---

# prd-engineer

## Start here

1. Confirm whether the task is a new PRD, refinement, or review; name the downstream consumer when handoff matters.
2. For every non-trivial creation, revision, or review, apply `implementation-discipline` before choosing PRD depth or expanding scope; capture the observable outcome, actor or consumer and claim boundary, source-authorized scope and non-goals, permitted product output, simplest sufficient user capability, and narrowest falsifier.
3. Resolve source precedence; separately verify approval of the current PRD version, and do not let risk, completeness, checklists, or same-session artifacts create product authority.
4. Separate the observable product capability from substrate such as documentation, tickets, mocks, logs, or implementation scaffolding.
5. Choose the lightest PRD mode that fits the risk; do not expand a one-pager into a heavyweight template by default.
6. Before creating or recommending a persistent PRD, product brief, or PRD review artifact, check whether the current repository defines artifact conventions and follow them when present.
7. If the PRD feeds architecture, delivery planning, or implementation specs, surface architecture-relevant constraints and questions without choosing architecture patterns.
8. Ask only focused discovery questions that would change users, scope, metrics, acceptance, constraints, or handoff readiness; otherwise draft with explicit assumptions and TBDs.

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
- Issuing an independent concept-conformance or fake-risk verdict against an established higher-level concept; use `concept-conformance-reviewer`.
- Creating formal safety-critical, procurement, legal, or regulated specifications without a domain-specific template or reviewer.

## Overview

Create PRDs that are problem-first, scope-aware, and testable enough for product, design, engineering, QA, and stakeholders to share the same understanding.

This skill favors concise documents with strong requirements over heavyweight templates. Use it to turn product intent into observable behavior, acceptance criteria, risks, rollout, and learning loops. A PRD does not prove market demand, technical feasibility, or implementation correctness by itself; it makes those claims explicit enough to test.

## Default Output Shape

For a new PRD, include:

- authority/handoff: source precedence, current-version approval, consumer, status, blockers, and owned gaps;
- problem/outcome: why now, users, scenarios, metrics, and guardrails;
- scope: current behavior, non-goals, anti-claims, risks, and dependencies;
- requirements/acceptance: traceable functional and non-functional requirements with observable checks;
- rollout/learning: phases, instrumentation, owners, and outcome review.

For a PRD review, lead with `Authority`; include target handoff and readiness when assessed. Then list blockers, evidence gaps, substrate-only acceptance defects, anti-claims, concrete rewrites, and the next owner.

## Reference triggers

Open only the relevant part of [PRD template](references/prd-template.md):

- skeleton, metadata, authority, handoff, location, or lifecycle;
- evidence, metrics, guardrails, requirement quality, or acceptance tests;
- architecture handoff, AI/security/privacy/compliance/migration modules, or review routing;
- existing-PRD quality and anti-pattern review.

## Workflow stages

### Workflow stage: Gate scope and select PRD mode

Establish the source-authorized product boundary before fitting document size to uncertainty, risk, and audience.

1. Capture the observable outcome, actor or consumer and claim boundary, source-authorized scope and non-goals, permitted product output, simplest sufficient user capability, and narrowest falsifier.
2. Treat adjacent defects or future ideas as findings or follow-ups unless a current source places them in scope; a draft created in this session cannot authorize its own expansion.
3. Use a one-pager for early discovery, pre-bet, or prototype framing.
4. Use a standard feature PRD for ordinary product and engineering handoff.
5. Use an extended PRD when the work is AI-driven, platform-level, regulated, multi-team, migration-heavy, security-sensitive, or hard to verify.

Validation:

- Risk and document completeness change rigor, not product scope, actors, lifecycle, platform, configuration, integrations, or flexibility.
- The selected mode is stated or obvious from the output.
- Document size matches the risk.

### Workflow stage: Establish authority and handoff target

Prevent a polished draft from masquerading as authoritative product input.

1. Separate product-source precedence from approval or canonical status of the current PRD version.
2. Apply known precedence; block handoff when equal or unknown authority conflicts could change users, scope, metrics, acceptance, constraints, or the target handoff.
3. Use `authoritative` only when the operator or repository process approves or canonicalizes the current content and version; input authority or prior approval does not transfer.
4. Keep generated or materially refined output `non-authoritative` until that resulting version is explicitly authorized.
5. Treat outcome- or handoff-changing gaps as blockers; give other assumptions or TBDs an owner or decision trigger.

Validation:

- `Authority` is explicitly `authoritative` or `non-authoritative` whenever readiness is assessed.
- An unresolved equal- or unknown-authority conflict cannot produce a ready handoff.
- Input authority, prior approval, or status metadata cannot authorize newly generated or materially changed PRD content.

### Workflow stage: Reconcile the closed source universe

Prevent summaries or polished synthesis from hiding omitted source obligations.

1. Bound the applicable source universe through the established authority and currentness rules.
2. Atomize prose clauses, table rows and notes, email decisions, and mockup annotations while preserving modality, conditions, exceptions, values, and locators.
3. Map every atom to a PRD requirement or source-authorized disposition, and every material requirement back to its atoms.
4. Treat summaries and derived registers as navigation, never disposition evidence.
5. Block completeness and ready handoff for any unavailable, unmapped, ambiguously merged, or unauthorizedly dismissed in-scope atom.

Validation:

- Every bounded atom has a verifiable mapping or authorized disposition, with its qualifying details intact.
- An omitted clause, table entry, email decision, or mockup annotation blocks completeness even when a summary exists.

### Workflow stage: Run discovery checkpoint

Prevent a PRD from becoming a polished guess.

1. Identify the core problem, target users, why now, current evidence, desired outcome, constraints, and success metrics.
2. Separate product success metrics from quality guardrails when reliability, performance, cost, security, or operations could affect later architecture or acceptance.
3. Ask the fewest concise questions needed when missing answers would materially change the PRD.
4. If the user asks for an immediate draft, proceed with labeled assumptions, TBDs, and open questions; use `Authority: non-authoritative` and `Handoff: draft-only` when handoff is named, otherwise `Handoff: not-assessed`.

Validation:

- Missing problem, user, scope, metric, or constraint information is either answered, marked TBD, or listed as an open question.
- No constraint, metric, user research, data source, or technical dependency is hallucinated.

### Workflow stage: Frame capability and scope

Make the intended observable product behavior explicit before listing requirements.

1. State the product outcome in user terms before describing the solution.
2. For each material capability, identify the actor or consumer, trigger, observable response, state or effect, feedback, and applicable failure, continuity, or recovery expectation.
3. Separate in-scope behavior from substrate and supporting artifacts.
4. Define non-goals and anti-claims: what this PRD or release will not make possible.
5. Capture important assumptions, dependencies, risks, owners, and decision points.
6. Separate current required behavior from adjacent defects, possible extensions, and future releases; route rather than silently promote them.

Validation:

- The PRD cannot be mistaken for a promise to deliver behavior that is only researched, mocked, documented, or deferred.
- Material capability claims can be traced across actor, trigger, response, effect, feedback, and applicable failure or continuity behavior.
- Non-goals and open questions protect scope instead of hiding uncertainty.

### Workflow stage: Write testable requirements

Convert intent into buildable and reviewable requirements.

1. Write requirements as atomic, clear, feasible, prioritized, and verifiable statements.
2. Prefer IDs for standard or extended PRDs, especially when engineering, QA, architecture, or implementation review will trace against them.
3. Add owner and release phase attributes when requirement ownership, MVP/beta/GA scope, or deferred behavior could change downstream decisions.
4. Pair user stories or capabilities with acceptance criteria that force observable behavior.
5. For each material acceptance criterion, find the least-real passing implementation; rewrite it if an endpoint, file, config, log, mock, test, or other substrate could pass without the claimed behavior.
6. Keep product acceptance at the product boundary; do not require a new technical harness, runtime seam, or platform when existing downstream verification can prove the behavior.
7. Include non-functional requirements for performance, reliability, accessibility, security, privacy, cost, and operations when they affect success.

Validation:

- Vague words such as fast, easy, intuitive, robust, scalable, or modern are replaced by thresholds, examples, guardrails, or TBDs.
- Acceptance criteria cannot pass only through mocks, metadata, logs, documentation, or static existence checks.
- Important failure or negative behavior is represented where happy-path acceptance alone could create false confidence.

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
2. Repeat the scope-and-simplicity gate when a material draft delta adds an actor, capability, lifecycle, platform surface, integration, acceptance contour, or verification obligation.
3. Mark blockers separately from polish.
4. Use `Handoff: not-assessed` without a readiness request or consumer; otherwise use `draft-only`, `blocked`, or `ready for <architecture | specification | delivery-planning>`.
5. If readiness is requested without a consumer, ask once or leave readiness unassessed; continue the PRD review.
6. Use `ready` only when authority is explicit and no unresolved product decision can change that consumer's input; assign an owner or trigger to every remaining non-blocking TBD.
7. For reviews, return authority, assessed handoff, blockers, evidence gaps, substrate-only acceptance defects, anti-claims, remediation, and next owner.

Validation:

- The final output names important assumptions, unresolved questions, and verification gaps.
- `Authority: non-authoritative` or any product blocker prevents a ready verdict.
- Ready certifies only product input for the named consumer, not architecture, specification, planning, implementation, or release readiness.
- The named downstream consumer can use the product input without hidden product decisions.

## Interop priority

- **source-authorized scope, simplest sufficient capability, self-expansion prevention, and proportional evidence:** implementation-discipline. implementation-discipline supplies the cross-cutting authoring gate; prd-engineer remains the owner of product intent, users, scope, metrics, and product acceptance.
- **product intent, users, scope, non-goals, success metrics, and product-level acceptance:** prd-engineer. prd-engineer owns product-source revisions and product-input readiness; it does not own architecture, implementation-ready behavior, or delivery decomposition.
- **independent concept drift and fake-risk review:** concept-conformance-reviewer. concept-conformance-reviewer owns the independent verdict when acceptance or plans may pass without the established capability; prd-engineer remains the owner of product-source revisions.
- **implementation against PRD:** spec-conformance-reviewer. spec-conformance-reviewer owns checking code or implementation evidence against an approved PRD.
- **architecture-significant requirements, pattern decisions, and ADRs:** architecture-engineer. architecture-engineer owns translating product requirements into architecture decisions, constraints, quality scenarios, architecture handoff, and architecture drift handling.
- **implementation-ready behavior, atomic normative requirements, negative cases, falsifiers, and verification maps:** spec-engineer. spec-engineer consumes accepted product input and owns implementation-ready behavior; prd-engineer owns product intent and product-level acceptance only.
- **vertical slices, module increments, tasks, dependencies, and sequencing:** delivery-planner. delivery-planner consumes accepted product scope and applicable architecture handoff to decompose work; prd-engineer must not create the backlog or sequence implementation.
- **technical feasibility and domain-specific requirements:** the relevant domain skill. Domain skills own framework, security, data, ML, infrastructure, regulatory, or product-domain facts.
- **documentation architecture:** documentation. documentation owns Diataxis and docs IA; this skill owns PRD content and requirements quality.

## Gotchas

- **high** — A summary or register cannot disposition the underlying source atoms.
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
Acceptance criteria must require observable product behavior or measurable evidence. Rewrite criteria that pass through substrate alone, but do not invent technical harnesses, runtime seams, or platform work when existing downstream verification can prove the claim.

### Product source authority policy
Separate source precedence from artifact authority. Only the operator or repository process can approve the current PRD version; generated or materially changed content stays non-authoritative until then.

### Product-input handoff readiness policy
Report `Authority` separately from `Handoff`. Use `not-assessed` without a requested consumer. Ready requires current-version authority and no product blocker; it covers product input only.

### Light traceability policy
Use requirement IDs, owners, source links, statuses, and change notes when multiple people or later implementation review will depend on the PRD.

### Repository artifact conventions policy
When producing or recommending a persistent PRD, product brief, or PRD review in a repository, first check repo-local artifact conventions through AGENTS.md, README, CONTRIBUTING, or docs linked from them. If conventions exist, follow them for canonical location, stable PRD or product-brief IDs, metadata/front matter, requirement and acceptance ID prefixes, source links, related artifact links, and module index updates. Do not hard-code one repository's paths into this skill. If no repository convention exists, use this skill's default PRD shape and state any location assumption when writing files. Repository conventions override generic PRD location defaults when the artifact is canonical in the repo.

### Architecture handoff policy
PRDs may surface architecture-relevant product constraints, quality guardrails, external systems, data sensitivity, release phases, and blocking questions, but architecture-engineer owns ASR extraction and architecture decisions.

### Brevity policy
In chat, keep outputs concise unless the user asks for a formal artifact; use the reference template for full documents.

## Optional references
- [PRD template](references/prd-template.md) — Read this when creating a formal PRD artifact, expanding an existing PRD, adding authority or handoff-readiness metadata, evidence, traceability, review routing, AI/security/rollout modules, or running a detailed PRD quality check.

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
