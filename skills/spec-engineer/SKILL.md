---
name: spec-engineer
description: Create concise, falsifiable software specs for AI coding agents.
  Use to turn ideas, tickets, APIs, domain rules, migrations, workflows, or
  function behavior into implementation-ready Markdown with observable
  requirements, acceptance evidence, anti-claims, source authority, and handoff
  readiness.
compatibility: Portable, self-contained documentation-only skill. It ships no
  runtime and keeps all method instructions required to create specifications
  inside this folder.
metadata:
  source-version: 0.2.12
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: ee76c819f80df3a9571bee33ec14e1649ba9a26141d10d05e73c66baf9e3125a
---

# spec-engineer

## Start here

1. Confirm the user needs a software specification, not a PRD, implementation plan, code review, or implementation patch.
2. For every non-trivial creation, revision, or review, apply `implementation-discipline` before adding normative scope or verification depth; capture the outcome or invariant, actor or consumer and claim boundary, source-authorized scope and non-goals, permitted specification output, simplest existing implementation or verification contour, and narrowest falsifier.
3. Distinguish draftable from handoff-ready input: readiness requires sufficient source authority, applicable accepted constraints, and a named downstream consumer.
4. Identify the parent product, system, workflow, or architecture intent the spec is meant to constrain, or label that intent as missing before drafting.
5. Inspect accepted product and architecture context, domain constraints, assumptions, criticality, and blocking ambiguity before drafting.
6. Separate observable capability from support substrate; do not let scaffolding, APIs, schemas, tests, logs, or documentation stand in for claimed behavior.
7. Do not require layers, scaffolds, config, wrappers, or future extension points unless they are necessary for the current capability or explicitly labeled substrate with a dependent capability.
8. For medium/high-risk or architecture-impacting work, inherit accepted architecture constraints and route missing or new architecture decisions instead of choosing them in the spec.
9. For high-risk backend work involving a public API, persistent state, authorization, money, retries, external resources, or required audit evidence, read High-risk backend contract matrix and require its complete row-by-row contract and test inventory before a `ready for coding` handoff.
10. Before creating or recommending a persistent implementation-ready spec, API spec, workflow spec, migration spec, spike spec, or verification map, check whether the current repository defines artifact conventions and follow them when present.
11. Choose the smallest specification depth that can guide correct implementation and verification for this task.

## When to use this skill

- Creating or revising a specification that will guide software implementation.
- Turning a feature request, ticket, issue, PRD section, domain rule, integration requirement, API change, migration, workflow, or function behavior into implementation-ready requirements.
- Compressing vague source material into a compact spec with scope, behavior, constraints, acceptance criteria, anti-claims, and verification intent.
- Right-sizing the spec for anything from a single function or endpoint to a subsystem or whole product slice.
- Creating vertical-slice specs or spike specs when implementation needs bounded behavior, evidence, or decision-unblocking criteria.
- Assessing or revising whether a specification is honestly ready for a named downstream consumer.

## When NOT to use this skill

- Writing a product PRD where product discovery, rollout, metrics, or business scope are the main concern instead of implementation-ready behavior; if available, route that work to prd-engineer.
- Checking code against an existing spec rather than authoring or revising the spec; if available, route that work to spec-conformance-reviewer.
- Reviewing whether an implementation delivers real capability instead of only substrate; if available, route that work to concept-conformance-reviewer.
- Implementing code directly when the user did not ask for a specification and the task is already unambiguous.
- Creating heavyweight governance, lifecycle records, project-management state, or delivery tracking artifacts instead of a specification document.
- Producing formal methods artifacts as the primary deliverable unless the user explicitly asks for that level of rigor.

## Overview

Create a specification that helps an AI coding agent build correct software with fewer guesses.

The spec is not a governance artifact, a product pitch, or a verbose checklist. It is a compact set of statements and representations that narrows the allowed behavior of a system enough that implementation and verification can proceed without inventing missing requirements.

Before writing requirements, place the target inside its parent product, system, workflow, or architecture intent. A locally precise spec can still be wrong when it does not advance or protect that parent capability; if the parent intent is missing, record it as an assumption, gap, or blocking question instead of inventing it.

### Input contract

Acceptable input can be loose, but it must be usable. A ticket, issue, free-form request, product note, API change, code behavior description, domain rule, or migration request can support a draft when it identifies the object, intended behavior, and source material. If the object and behavior are both missing, ask before drafting.

### Capability vs substrate

Capability is observable behavior for the named consumer across actor, trigger, response, state/effect, and continuity. Storage, APIs, queues, schemas, adapters, prompts, tests, logs, generated files, docs, and lifecycle records are substrate unless they are the direct consumer-facing contract. Label substrate-only scope and name the capability it supports.

### Right-sized rigor

Default to the lightest spec that prevents costly mistakes: compact inputs/rules/edges for local behavior, contracts for endpoints, state and failure semantics for workflows, and broader interfaces/NFRs/verification only for system slices. Use the methodology's compact six-section template for trivial scope.

Do not make the agent maintain process ceremony that does not improve code. Increase structure only when prose would hide ambiguity, omitted cases, contradictions, or unverifiable claims.

Criticality overrides size. A small authz rule, payment idempotency rule, data deletion path, or signing function may need invariants, multiple falsifiers, stronger verification, and explicit rollback/compatibility constraints even when the textual scope is tiny.

## Workflow stages

### Workflow stage: Frame the specification target

Turn vague intent into a bounded engineering target before writing requirements.

1. Identify the parent product, system, workflow, or architecture intent and state how this spec's behavior advances or protects it; if the spec is substrate-only, name the capability it supports.
2. Capture the source-authorized scope and non-goals, permitted specification output, simplest existing implementation or verification contour, and narrowest falsifier before adding normative requirements.
3. Identify the system, subsystem, function, interface, actor, trigger, and production entry point when known.
4. State the capability claim with precondition and guard when relevant: Given <precondition>, when <actor> does <trigger/action>, if <guard>, the system MUST <observable response>, creating or preserving <state/effect>, so that <continuity> holds.
5. Apply a criticality lens: ask what the worst observable consequence is if the requirement is wrong, then increase rigor for security, money, data loss, compliance, safety, privacy, compatibility, or irreversible state.
6. Classify risk as low, medium, or high when the source material provides or implies it, and use that classification with criticality to choose spec depth.
7. List source material, authority, approval/readiness, and the named downstream consumer; same-session PRDs, architecture notes, specs, or plans are outputs rather than higher authority for their own expansion.
8. For medium/high-risk or architecture-impacting specs, capture linked PRD requirements, architecture constraints, ADRs, ASRs, delivery task brief, and existing conventions when available.
9. When the high-risk backend trigger applies, load High-risk backend contract matrix, include every `HRB-*` row, and mark each row applicable or `not_applicable` with a source-backed reason.
10. Name substrate that may be needed but is not itself the capability for this spec consumer; remember that a public API contract is capability when the API consumer is the actor.
11. Reject future-only substrate such as layers, scaffolds, config knobs, wrappers, or extension points unless a current requirement, accepted architecture constraint, or dependent capability needs it.
12. For changes to an existing system, capture the behavioral delta from current to target behavior, including compatibility, migration, and coexistence constraints.
13. Add initial anti-claims that keep the spec from implying broader behavior than requested.

Validation:

- The spec target is tied to parent intent, or missing parent intent is recorded as an assumption, gap, or blocking question.
- The target can be described without relying on implementation-only terms.
- The spec scope says what is in, what is out, and what remains unknown.
- Risk depth and inherited product, architecture, delivery, and specification context are explicit when they affect implementation.
- Source authority, readiness, named consumer, and resulting handoff status are explicit; the spec is not more ready than its inputs.
- Acceptance cannot be satisfied only by substrate when the claim is behavioral.
- Future-only substrate is absent, deferred by trigger, or explicitly labeled as support work for a named dependent capability.
- Every material normative requirement and acceptance contour traces to a higher-authority source or is explicitly marked as an unapproved gap.
- High-criticality scope has explicit invariants, stronger falsifiers, and a verification path beyond happy-path examples.
- A high-risk backend spec cannot be handoff-ready while an applicable `HRB-*` row lacks authority, a normative contract, a falsifier, executable evidence, or a downstream owner.

### Workflow stage: Map behavior and constraints

Cover the behavior space before committing to normative statements.

1. Create a glossary before writing requirements for terms that repeat, carry roles, or are likely ambiguous.
2. Inventory only source-relevant main, alternate, failure, invalid-input, boundary, permission, timing, retry, concurrency, ordering, idempotency, consistency, compatibility, and observability concerns.
3. Use systematic discovery techniques when memory is not enough, especially equivalence partitions, boundary values, state transitions, fault analysis, role/abuse cases, and concurrency probes.
4. Identify domain terms, states, events, entities, inputs, outputs, side effects, invariants, assumptions, external dependencies, and temporal promises.
5. Decide which unknowns block implementation and which can be recorded as explicit assumptions or gaps.

Validation:

- The behavior inventory includes the important non-happy paths for the scope.
- Hidden assumptions about external systems, ordering, time, roles, or persistence are explicit.
- Important invariants and failure semantics are not buried inside examples.
- Concurrency, ordering, idempotency, and consistency are treated as separate concerns when any one of them matters.

### Workflow stage: Draft the compact specification

Produce a concise spec at an honest handoff status without becoming process-heavy.

1. Use the compact 6-section structure from the methodology reference for trivial scope; use the fuller structure only when the task needs it.
2. Include Architecture Context only when risk or affected boundaries make it useful for implementation correctness.
3. For spike specs, specify the question, hypothesis, validation harness, success/failure criteria, output evidence, and next decision instead of pretending the spike delivers product behavior.
4. Write a scope statement, parent intent or supported capability, glossary, capability or behavior statement, assumptions, and anti-claims.
5. Write atomic normative requirements with source trace, explicit subject, modality, action, object, condition, and measurable constraint where relevant.
6. Apply the methodology's semantic authority and removal-falsifier gate before accepting each new or changed material `MUST`; locators, downstream artifacts, observed code, tests, and later review are not proof by themselves.
7. Use the representation-fit table from the methodology reference; prefer invariants for always-true properties, and use contracts, tables, state models, NFRs, and examples only where they materially reduce ambiguity.
8. Add positive acceptance criteria, negative criteria, falsifiers, and a verification map for each important requirement.
9. For a triggered high-risk backend matrix, map every applicable `HRB-*` row to at least one executable test or real-boundary check that fails for the prohibited outcome.
10. Prefer the narrowest existing verification contour; do not require a runner, harness, orchestration layer, instrumentation, or production seam only to strengthen acceptance.
11. Define requirement lifecycle status when revising an existing spec: new, changed, superseded, deprecated, or removed.
12. Record open questions and gaps without letting non-blocking gaps stop useful specification work.

Validation:

- Every important requirement is falsifiable by demonstration, inspection, analysis, contract validation, schema validation, property-based checks, example-based tests, or another explicit method.
- A failed semantic derivation or removal falsifier leaves the material `MUST` unresolved and blocks a ready handoff.
- If a requirement can produce two independently verifiable acceptance criteria, it has been split.
- Acceptance criteria prove real behavior and include at least one negative or falsifier for self-deception risk.
- The high-risk backend test inventory covers every applicable matrix row without using happy-path, mock-only, schema-presence, generated-file, or self-authored evidence to close a stronger claim.
- Anti-claims prevent scope inflation and make clear what the spec does not promise.

### Workflow stage: Audit and right-size

Improve precision without adding ceremony that distracts from building correct code.

1. Run the Quality audit checklist from the methodology reference before reporting done.
2. Repeat the scope-and-simplicity gate when a material draft delta adds a requirement, boundary, lifecycle, output, edge-case family, or verification contour.
3. Check whether the spec discovered architecture drift; stop for blocking drift or record an architecture delta needed when implementation can safely proceed.
4. Scan for ambiguous terms, vague adjectives, compound requirements, hidden implementation decisions, duplicate rules, missing failure behavior, missing invalid inputs, and examples that contradict rules.
5. Check self-deception patterns such as tautological acceptance, mock-driven success, single-actor blindness, hidden retroactive scope, and completion bias.
6. When the high-risk backend trigger applies, reject readiness if any matrix row is omitted, marked `not_applicable` without source rationale, or lacks an exact negative oracle and evidence owner.
7. Remove sections, tables, or process language that do not constrain implementation or verification.
8. Strengthen under-specified NFRs with metric, threshold, measurement object, and measurement window.
9. Apply the Stop rules before finalizing.

Validation:

- The final spec is as small as possible while still reducing implementation guesses.
- The spec has no known contradictions between prose, rules, examples, tables, schemas, or state transitions.
- Architecture constraints are inherited or routed; they are not silently invented.
- Remaining risks are visible as assumptions, gaps, anti-claims, or open questions.
- If verification infrastructure would exceed the authorized behavior change, the claim or design was narrowed and any remaining edge is marked unproven rather than stabilized with invented runtime scope.

## Interop priority

- **source-authorized scope, simplest sufficient specification, self-expansion prevention, and proportional evidence:** implementation-discipline. implementation-discipline supplies the cross-cutting authoring gate; spec-engineer remains the owner of behavior, edge cases, falsifiers, and verification maps.
- **product scope, users, scenarios, success criteria, and product acceptance framing:** prd-engineer. prd-engineer owns product intent and gaps; this skill consumes accepted product basis when producing implementation-ready behavior.
- **architecture boundaries, ASRs, pattern decisions, ADRs, quality scenarios, and architecture drift:** architecture-engineer. architecture-engineer owns architecture decisions and handoff; this skill inherits those constraints and routes drift back instead of deciding architecture inside a spec.
- **vertical slices, task briefs, sequencing, dependencies, and risk routing:** delivery-planner. delivery-planner owns decomposition and sequencing; this skill may specify a slice or task but does not create the delivery plan.
- **checking implementation evidence against an existing spec:** spec-conformance-reviewer. spec-conformance-reviewer owns conformance review after a spec exists; this skill owns authoring or revising the spec.
- **independent design-time concept alignment and false-capability risk:** concept-conformance-reviewer. concept-conformance-reviewer owns the independent verdict; this skill owns repairing the specification requirements and acceptance criteria.
- **framework, security, data, financial, regulatory, infrastructure, or other specialized technical facts:** the relevant domain skill. domain skills own specialized facts and constraints; this skill records accepted facts without inventing them.

## Gotchas

- **high** — A spec is useful only if it constrains observable behavior; a template, section list, or artifact path is substrate until the requirements are precise and falsifiable.
- **high** — Do not let acceptance criteria pass through mocks, generated docs, schemas, wrappers, or tests alone when the claim is user-, operator-, integration-, or system-observable behavior.
- **high** — Do not make a locally precise spec that drifts from the parent product, system, workflow, or architecture intent without calling out the conflict.
- **high** — Do not force every section onto small tasks; use the smallest structure that removes implementation ambiguity.
- **high** — Do not specify layers, scaffolds, wrappers, config knobs, or extension points for future flexibility unless they are required by current behavior, accepted architecture, or an explicitly labeled substrate task with a dependent capability.
- **medium** — Examples and Gherkin/BDD scenarios clarify boundaries only when representation-fit justifies them; they do not replace normative rules unless the user explicitly wants executable specifications as the source of truth.
- **medium** — Do not specify implementation mechanisms such as a specific database, cache, queue, framework, or algorithm unless they are real constraints, externally visible compatibility requirements, or explicitly requested decisions.
- **high** — Do not turn missing architecture decisions into spec requirements; route public contracts, data model, security boundary, tenancy, integration topology, deployment, rollback, or selected pattern changes to architecture.
- **medium** — Do not use tests as the default verification answer when inspection, analysis, contract validation, simulation, or conformance suites prove the claim more directly.
- **high** — Do not introduce or preserve public routes, enum values, statuses, action names, or history events without an owning source, domain meaning, forbidden values, and falsifiers.

## Policies

### Lightweight-first policy
A one-page spec is better than a complete template when it captures the behavior, rules, edge cases, and verification path needed for correct code. Add structure only when it removes a concrete ambiguity or defect class.

### No future-substrate policy
A specification must not require scaffolding, wrappers, layers, config surfaces, or extension points only because they might be useful later. Keep them out, defer them by an explicit trigger, or label them as substrate tied to a named dependent capability.

### Parent intent policy
A specification constrains implementation in service of a parent product, system, workflow, or architecture intent. Local requirement precision is insufficient when the spec does not advance or protect that intent; record missing intent as an assumption, gap, or blocking question instead of inventing it.

### Repository artifact conventions policy
Before producing a persistent specification, check repository conventions for location, IDs, metadata, source links, and indexes. Follow them when present; otherwise use this skill's Markdown output contract. Never hard-code one repository's paths into this skill.

### Risk-depth policy
Low-risk specs can stay compact; medium-risk specs need enough behavior, edge cases, inherited constraints, and verification mapping for coordination; high-risk specs need explicit invariants, negative/falsifier coverage, rollback or compatibility semantics, stronger gates, and routed specialist review triggers.

### Architecture context policy
Include architecture context only when it constrains implementation or verification. Treat linked ASRs, ADRs, pattern decisions, and architecture handoff as inherited sources, not as decisions created by the spec.

### Normative language policy
Use uppercase MUST for required behavior, MUST NOT for forbidden behavior, SHOULD for recommended behavior with known exceptions, and MAY for optional behavior. Treat CAN as descriptive capability language, not normative modality, and do not mix normative and descriptive wording in the same sentence.

### Atomic requirement policy
Each normative requirement should express one obligation with an explicit subject, condition, action, object, and constraint. Split compound requirements before adding acceptance criteria.

### Event payload contract policy
Runtime history or audit events must define purpose, bounded result/status, safe payload fields, forbidden data, and consumer usefulness. Events that only say an action happened are incomplete unless their explicit purpose is access accountability.

### Representation-fit policy
The canonical representation-fit table lives in the methodology reference. In SKILL.md, remember the rule of thumb only: choose the lightest representation that removes the concrete ambiguity or defect class, and prefer invariants whenever a behavior can be stated as an always-true property.

### BDD fit policy
Use BDD/Gherkin only when scenarios materially clarify behavior, guards, failures, continuity, or acceptance risk. They must not replace atomic requirements, negative acceptance, falsifiers, or verification. Prefer a more direct representation and avoid BDD for trivial or substrate-only scope.

### Verification map policy
Every important requirement needs a verification path such as demonstration, inspection, analysis, contract validation, schema validation, property-based checks, example-based tests, or executable scenarios. For a material cross-layer claim, apply the lifecycle-map rule in the required methodology reference. If verification is not currently possible, the spec must say why.

### Stop rules
Stop and ask the user when:

- a behavior-changing source conflict remains unresolved after applying authority and readiness precedence;
- the requested spec scope conflicts with known parent product, system, workflow, or architecture intent in a behavior-changing way;
- implementation would require choosing between incompatible product, security, privacy, compliance, data-loss, or compatibility outcomes;
- the spec would make a capability claim that can only be proven by substrate evidence;
- the spec would require changing a public contract, data model, auth/security boundary, tenant isolation, integration topology, deployment model, rollback path, or selected architecture pattern not covered by accepted architecture context;
- a required external contract is missing and cannot be inferred safely.

Do not stop for minor unknowns. Record them as assumptions, non-blocking gaps, validation gaps, or architecture delta needed.

### Output language policy
Produce the specification in the user's working language unless the target repository, existing spec corpus, or user request clearly requires another language.

### Output contract
The deliverable is a Markdown specification. Include at minimum:

- title;
- handoff status: `draft`, `blocked`, or `ready for <consumer>`;
- named downstream consumer;
- scope;
- source context, authority, and readiness;
- parent intent or supported capability;
- risk or criticality;
- architecture context when medium/high risk or architecture-impacting scope requires it;
- terms;
- behavior or capability statement;
- assumptions;
- anti-claims;
- atomic requirements with source trace;
- acceptance criteria with negative or falsifier coverage;
- verification map;
- open questions, gaps, or architecture delta needed.

Omit or collapse sections only when the result remains clear and
falsifiable at its declared handoff status. Completing the specification
does not demonstrate implementation progress, runtime behavior, or
release readiness.

## Required active references
- [Specification methodology](references/methodology.md) — Read this when drafting or materially revising a software specification.

## Optional references
- [High-risk backend contract matrix](references/high-risk-backend-contract.md) — Read this before drafting, materially revising, or accepting a high-risk backend specification that touches a public API, persistent state, authorization, money, retries, external resources, or required audit evidence.
- [Specification patterns](references/spec-patterns.md) — Read this when choosing the minimal structure for a feature, vertical slice, spike, API endpoint, validation rule, workflow, migration, or non-functional constraint.
- [Discovery techniques](references/discovery-techniques.md) — Read this when behavior inventory feels checklist-driven, risk is high, or you need systematic edge-case discovery.
- [Self-deception anti-patterns](references/anti-patterns.md) — Read this before finalizing a spec with vague acceptance, mocks, substrate evidence, happy-path bias, or ambiguous terms.
- [Worked example specification](references/example-spec.md) — Read this when you need a small input-to-output example of the expected final specification artifact.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory spec-engineer guidance inside this skill folder.
- Use relative links for local references and supporting docs.
- Treat external standards or reports as optional background; do not make them required to use the skill.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.
