---
name: spec-engineer
description: Create concise, falsifiable software specifications for AI coding
  agents. Use when turning feature requests, tickets, product ideas,
  API/interface changes, domain rules, migrations, workflows, or function-level
  behavior into a Markdown spec that guides implementation without process
  overhead. Emphasizes observable behavior, capability/substrate separation,
  atomic requirements, acceptance criteria, anti-claims, verification mapping,
  parent-intent alignment, architecture-context handoff, risk-based depth, and
  right-sized detail.
compatibility: Portable, self-contained documentation-only skill. It ships no
  runtime and keeps all method instructions required to create specifications
  inside this folder.
metadata:
  source-version: 0.2.3
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 55a7e03d0e838b649976fb3c9ff0bfeba574a6977db3378c76d2454f65aba792
---

# spec-engineer

## Start here

1. Confirm the user needs a software specification, not a PRD, implementation plan, code review, or implementation patch.
2. Confirm the input is sufficient or salvageable: at minimum, identify the requested object, intended behavior, and source material; if these are absent, ask for them.
3. Identify the parent product, system, workflow, or architecture intent the spec is meant to constrain, or label that intent as missing before drafting.
4. Inspect the available source material and state assumptions, constraints, criticality, and any blocking ambiguity before drafting.
5. Separate observable capability from support substrate; do not let scaffolding, APIs, schemas, tests, logs, or documentation stand in for claimed behavior.
6. For medium/high-risk or architecture-impacting work, inherit accepted architecture constraints and route missing or new architecture decisions instead of choosing them in the spec.
7. Before creating or recommending a persistent implementation-ready spec, API spec, workflow spec, migration spec, spike spec, or verification map, check whether the current repository defines artifact conventions and follow them when present.
8. Choose the smallest specification depth that can guide correct implementation and verification for this task.

## When to use this skill

- Creating or revising a specification that will guide software implementation.
- Turning a feature request, ticket, issue, PRD section, domain rule, integration requirement, API change, migration, workflow, or function behavior into implementation-ready requirements.
- Compressing vague source material into a compact spec with scope, behavior, constraints, acceptance criteria, anti-claims, and verification intent.
- Right-sizing the spec for anything from a single function or endpoint to a subsystem or whole product slice.
- Creating vertical-slice specs or spike specs when implementation needs bounded behavior, evidence, or decision-unblocking criteria.

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

Acceptable input can be loose, but it must be usable. A ticket, issue, free-form request, product note, API change, code behavior description, domain rule, or migration request is enough when it lets you identify the object being specified, the intended behavior or change, and at least one source of authority. If the object and behavior are both missing, ask before drafting.

### Capability vs substrate

Use these definitions directly:

- **Capability** is observable behavior by a user, operator, integration, or system: actor, trigger, system response, state/effect, and continuity.
- **Substrate** is supporting material such as storage, APIs, queues, schemas, adapters, prompts, tests, logs, generated files, documentation, or lifecycle records.

Capability is relative to the spec consumer. A public API contract is capability when API clients are the actors, but it is substrate when the claim is end-user checkout behavior. Substrate may be necessary, but a specification must not describe substrate as completed capability unless it enables demonstrable behavior. When a requested spec is actually substrate-only, label it that way and name the capability it supports.

### Capability statement template

Use this shape as the center of the spec when behavior is claimed:

```text
Given <precondition>, when <actor> does <trigger/action>, if <guard>,
the system MUST <observable response>, creating or preserving <state/effect>,
so that <continuity or later behavior> holds.
```

### Right-sized rigor

Default to the lightest spec that prevents costly implementation mistakes:

- a function or validation rule may need only inputs, outputs, rules, edge cases, examples, and acceptance;
- an endpoint usually needs request/response/error contracts and idempotency or retry semantics;
- a workflow usually needs states, events, guards, effects, invariants, and failure behavior;
- a system slice may need actors, entry points, interfaces, NFRs, compatibility, observability, and a verification map.
- trivial scope should use the compact 6-section template from the methodology reference.

Do not make the agent maintain process ceremony that does not improve code. Increase structure only when prose would hide ambiguity, omitted cases, contradictions, or unverifiable claims.

Criticality overrides size. A small authz rule, payment idempotency rule, data deletion path, or signing function may need invariants, multiple falsifiers, stronger verification, and explicit rollback/compatibility constraints even when the textual scope is tiny.

## Workflow stages

### Workflow stage: Frame the specification target

Turn vague intent into a bounded engineering target before writing requirements.

1. Identify the parent product, system, workflow, or architecture intent and state how this spec's behavior advances or protects it; if the spec is substrate-only, name the capability it supports.
2. Identify the system, subsystem, function, interface, actor, trigger, and production entry point when known.
3. State the capability claim with precondition and guard when relevant: Given <precondition>, when <actor> does <trigger/action>, if <guard>, the system MUST <observable response>, creating or preserving <state/effect>, so that <continuity> holds.
4. Apply a criticality lens: ask what the worst observable consequence is if the requirement is wrong, then increase rigor for security, money, data loss, compliance, safety, privacy, compatibility, or irreversible state.
5. Classify risk as low, medium, or high when the source material provides or implies it, and use that classification with criticality to choose spec depth.
6. List source material and authority levels when there are multiple inputs; resolve conflicts or mark them as open questions.
7. For medium/high-risk or architecture-impacting specs, capture linked PRD requirements, architecture constraints, ADRs, ASRs, delivery task brief, and existing conventions when available.
8. Name substrate that may be needed but is not itself the capability for this spec consumer; remember that a public API contract is capability when the API consumer is the actor.
9. For changes to an existing system, capture the behavioral delta from current to target behavior, including compatibility, migration, and coexistence constraints.
10. Add initial anti-claims that keep the spec from implying broader behavior than requested.

Validation:

- The spec target is tied to parent intent, or missing parent intent is recorded as an assumption, gap, or blocking question.
- The target can be described without relying on implementation-only terms.
- The spec scope says what is in, what is out, and what remains unknown.
- Risk depth and inherited product, architecture, delivery, and specification context are explicit when they affect implementation.
- Acceptance cannot be satisfied only by substrate when the claim is behavioral.
- High-criticality scope has explicit invariants, stronger falsifiers, and a verification path beyond happy-path examples.

### Workflow stage: Map behavior and constraints

Cover the behavior space before committing to normative statements.

1. Create a glossary before writing requirements for terms that repeat, carry roles, or are likely ambiguous.
2. Inventory main flows, alternate flows, failure paths, invalid inputs, boundary cases, permission cases, timing, retries, concurrency, ordering, idempotency, consistency, compatibility, and observability concerns that matter for the task.
3. Use systematic discovery techniques when memory is not enough, especially equivalence partitions, boundary values, state transitions, fault analysis, role/abuse cases, and concurrency probes.
4. Identify domain terms, states, events, entities, inputs, outputs, side effects, invariants, assumptions, external dependencies, and temporal promises.
5. Decide which unknowns block implementation and which can be recorded as explicit assumptions or gaps.

Validation:

- The behavior inventory includes the important non-happy paths for the scope.
- Hidden assumptions about external systems, ordering, time, roles, or persistence are explicit.
- Important invariants and failure semantics are not buried inside examples.
- Concurrency, ordering, idempotency, and consistency are treated as separate concerns when any one of them matters.

### Workflow stage: Draft the compact specification

Produce a concise spec that is implementation-ready without becoming process-heavy.

1. Use the compact 6-section structure from the methodology reference for trivial scope; use the fuller structure only when the task needs it.
2. Include Architecture Context only when risk or affected boundaries make it useful for implementation correctness.
3. For spike specs, specify the question, hypothesis, validation harness, success/failure criteria, output evidence, and next decision instead of pretending the spike delivers product behavior.
4. Write a scope statement, parent intent or supported capability, glossary, capability or behavior statement, assumptions, and anti-claims.
5. Write atomic normative requirements with source trace, explicit subject, modality, action, object, condition, and measurable constraint where relevant.
6. Use the representation-fit table from the methodology reference; prefer invariants for always-true properties, and use contracts, tables, state models, NFRs, and examples only where they materially reduce ambiguity.
7. Add positive acceptance criteria, negative criteria, falsifiers, and a verification map for each important requirement.
8. Define requirement lifecycle status when revising an existing spec: new, changed, superseded, deprecated, or removed.
9. Record open questions and gaps without letting non-blocking gaps stop useful specification work.

Validation:

- Every important requirement is falsifiable by demonstration, inspection, analysis, contract validation, schema validation, property-based checks, example-based tests, or another explicit method.
- If a requirement can produce two independently verifiable acceptance criteria, it has been split.
- Acceptance criteria prove real behavior and include at least one negative or falsifier for self-deception risk.
- Anti-claims prevent scope inflation and make clear what the spec does not promise.

### Workflow stage: Audit and right-size

Improve precision without adding ceremony that distracts from building correct code.

1. Run the Quality audit checklist from the methodology reference before reporting done.
2. Check whether the spec discovered architecture drift; stop for blocking drift or record an architecture delta needed when implementation can safely proceed.
3. Scan for ambiguous terms, vague adjectives, compound requirements, hidden implementation decisions, duplicate rules, missing failure behavior, missing invalid inputs, and examples that contradict rules.
4. Check self-deception patterns such as tautological acceptance, mock-driven success, single-actor blindness, hidden retroactive scope, and completion bias.
5. Remove sections, tables, or process language that do not constrain implementation or verification.
6. Strengthen under-specified NFRs with metric, threshold, measurement object, and measurement window.
7. Apply the Stop rules before finalizing.

Validation:

- The final spec is as small as possible while still reducing implementation guesses.
- The spec has no known contradictions between prose, rules, examples, tables, schemas, or state transitions.
- Architecture constraints are inherited or routed; they are not silently invented.
- Remaining risks are visible as assumptions, gaps, anti-claims, or open questions.

## Interop priority

- **product scope, users, scenarios, success criteria, and product acceptance framing:** prd-engineer. prd-engineer owns product intent and gaps; this skill consumes accepted product basis when producing implementation-ready behavior.
- **architecture boundaries, ASRs, pattern decisions, ADRs, quality scenarios, and architecture drift:** architecture-engineer. architecture-engineer owns architecture decisions and handoff; this skill inherits those constraints and routes drift back instead of deciding architecture inside a spec.
- **vertical slices, task briefs, sequencing, dependencies, and risk routing:** delivery-planner. delivery-planner owns decomposition and sequencing; this skill may specify a slice or task but does not create the delivery plan.
- **checking implementation evidence against an existing spec:** spec-conformance-reviewer. spec-conformance-reviewer owns conformance review after a spec exists; this skill owns authoring or revising the spec.

## Gotchas

- **high** — A spec is useful only if it constrains observable behavior; a template, section list, or artifact path is substrate until the requirements are precise and falsifiable.
- **high** — Do not let acceptance criteria pass through mocks, generated docs, schemas, wrappers, or tests alone when the claim is user-, operator-, integration-, or system-observable behavior.
- **high** — Do not make a locally precise spec that drifts from the parent product, system, workflow, or architecture intent without calling out the conflict.
- **high** — Do not force every section onto small tasks; use the smallest structure that removes implementation ambiguity.
- **medium** — Examples and Gherkin scenarios clarify boundaries but do not replace normative rules unless the user explicitly wants executable specifications as the source of truth.
- **medium** — Do not specify implementation mechanisms such as a specific database, cache, queue, framework, or algorithm unless they are real constraints, externally visible compatibility requirements, or explicitly requested decisions.
- **high** — Do not turn missing architecture decisions into spec requirements; route public contracts, data model, security boundary, tenancy, integration topology, deployment, rollback, or selected pattern changes to architecture.
- **medium** — Do not use tests as the default verification answer when inspection, analysis, contract validation, simulation, or conformance suites prove the claim more directly.

## Policies

### Lightweight-first policy
A one-page spec is better than a complete template when it captures the behavior, rules, edge cases, and verification path needed for correct code. Add structure only when it removes a concrete ambiguity or defect class.

### Parent intent policy
A specification constrains implementation in service of a parent product, system, workflow, or architecture intent. Local requirement precision is insufficient when the spec does not advance or protect that intent; record missing intent as an assumption, gap, or blocking question instead of inventing it.

### Repository artifact conventions policy
When producing or recommending a persistent implementation-ready spec, API spec, workflow spec, migration spec, spike spec, or verification map in a repository, first check repo-local artifact conventions through AGENTS.md, README, CONTRIBUTING, or docs linked from them. If conventions exist, follow them for artifact location, stable spec IDs, requirement and acceptance ID prefixes, metadata/front matter, source context, related PRD/architecture/delivery IDs, and module index updates. Do not hard-code one repository's paths into this skill. If no conventions exist, use this skill's Markdown spec output contract and state any location assumption only when writing files.

### Risk-depth policy
Low-risk specs can stay compact; medium-risk specs need enough behavior, edge cases, inherited constraints, and verification mapping for coordination; high-risk specs need explicit invariants, negative/falsifier coverage, rollback or compatibility semantics, stronger gates, and routed specialist review triggers.

### Architecture context policy
Include architecture context only when it constrains implementation or verification. Treat linked ASRs, ADRs, pattern decisions, and architecture handoff as inherited sources, not as decisions created by the spec.

### Normative language policy
Use MUST for required behavior, MUST NOT for forbidden behavior, SHOULD for recommended behavior with known exceptions, MAY for optional behavior, and CAN for capability statements. Avoid mixing normative and descriptive wording in the same sentence.

### Atomic requirement policy
Each normative requirement should express one obligation with an explicit subject, condition, action, object, and constraint. Split compound requirements before adding acceptance criteria.

### Representation-fit policy
The canonical representation-fit table lives in the methodology reference. In SKILL.md, remember the rule of thumb only: choose the lightest representation that removes the concrete ambiguity or defect class, and prefer invariants whenever a behavior can be stated as an always-true property.

### Verification map policy
Every important requirement needs a verification path such as demonstration, inspection, analysis, contract validation, schema validation, property-based checks, example-based tests, or executable scenarios. If verification is not currently possible, the spec must say why.

### Stop rules
Stop and ask the user when:

- source material contains a contradiction that changes behavior;
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
- status or scope;
- source context;
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

Omit or collapse sections only when the resulting spec remains clear, falsifiable, and implementation-ready.

## Required active references
- [Specification methodology](references/methodology.md) — Read this when drafting or materially revising a software specification.

## Optional references
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
