---
name: concept-conformance-reviewer
description: Review feature ideas, backlog items, specifications, plans,
  acceptance criteria, implementations, or closure claims against an established
  product or system concept. Use for design-time or closure-time checks when
  work may deliver scaffolding, APIs, mocks, tests, evidence, or documentation
  while overclaiming an observable capability; when capability and substrate
  must be classified relative to the claimed actor or consumer; or when weak
  acceptance could create false confidence. Do not use as a substitute for
  ordinary specification compliance, code review, security review, or domain
  correctness.
compatibility: Portable documentation-only review skill. Use before
  specification, planning, implementation, or closure when concept alignment and
  real capability are more important than local artifact compliance.
metadata:
  source-version: 0.2.1
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 957c8385bf1860926eef931faf2ad158024a85992e17c153fcd61777b0aeda20
---

# concept-conformance-reviewer

## Start here

1. Select design-time mode for an idea, backlog item, specification, plan, or proposed acceptance; select closure-time mode for an implementation or completion claim.
2. Identify the review target, the capability being claimed, and the established concept authority before evaluating local acceptance or evidence.
3. Apply source precedence, then return blocked / not assessable without classification or fake-risk when the target or claim is missing, the concept is insufficient, or authority remains unresolved; do not invent the target or concept.
4. Define the claim boundary and actor or consumer before classifying delivered behavior, capability-preserving invariants, enabling substrate, and verification evidence.
5. Test whether acceptance or closure evidence forces the claimed behavior instead of merely proving artifacts exist.
6. Issue the calibrated verdict and route the next correction to the owning authoring, planning, implementation, review, security, or domain skill.

## When to use this skill

- Reviewing feature ideas, backlog items, specifications, plans, implementation proposals, acceptance criteria, implementations, or closure claims against an established higher-level concept.
- The work claims a capability for a user, operator, integration, agent, runtime, platform, workflow, product, or system.
- Acceptance or closure may be satisfied through scaffolding, APIs, mocks, metadata, tests, evidence files, or documentation without proving the claimed behavior.
- A task is intentionally substrate or capability-preserving work and needs an honest claim boundary, owner capability, and non-misleading closure decision.

## When NOT to use this skill

- The task is a small mechanical change with no capability or concept claim.
- The user only needs implementation-versus-written-specification compliance; use spec-conformance-reviewer.
- The user asks for general bugs, maintainability, or merge risk without a higher-level concept claim; use code-reviewer.
- The user asks for vulnerability discovery, exploitability, or security severity without a concept-alignment question; use security-reviewer.
- The work is explicitly substrate-only, makes no broader capability claim, and the user is not asking whether it advances or protects a concept.

## Overview

Review whether work advances an established product or system concept without confusing artifact completion with capability. Return a concept-conformance decision; leave product intent, architecture, planning, specification, implementation, and vulnerability validation to their owners.

### Review modes

- **Design-time:** decide whether an idea, plan, specification, or proposed acceptance would force the capability and expose important failure paths. Do not claim future behavior already exists.
- **Closure-time:** decide whether current production-shaped evidence demonstrates an implementation or completion claim. Planned acceptance and artifact existence are insufficient.

### Input contract and authority

Require the review target, capability or completion claim, and established concept source. Missing design-time acceptance is a gap; closure-time completion requires behavioral evidence.

Resolve authority from explicit user direction and repository-defined precedence. A reviewed artifact cannot establish its own higher-level concept. Apply precedence first: lower-authority disagreement is drift to review, not an authority blocker. Return `blocked / not assessable` only when a required input is missing, the concept source cannot define the claim boundary, or competing sources remain unresolved because authority is equal or unknown. Stop without classification or fake-risk.

### Claim-relative classification

Classify each material output relative to the named actor or consumer and the exact claim boundary:

- **Delivered behavior:** the actor can exercise the claimed response, state or effect, and continuity.
- **Capability-preserving invariant:** the work demonstrably protects required correctness, safety, security, durability, or continuity of an existing capability.
- **Enabling substrate:** an implementation or coordination artifact needed by a capability but not sufficient to close that capability.
- **Verification evidence:** proof about behavior or an invariant, not the behavior itself or automatic proof of a broader claim.

The classification is contextual. A public API can be capability for its API consumer and substrate for an end-user workflow. Documentation can be the observable output of a documentation or review capability while remaining substrate for a product-runtime claim.

### Verdict calibration

Set assessment status before fake-risk:

- `assessable` — concept authority, claim, and relevant acceptance or evidence are sufficient for a verdict;
- `limited` — the concept and claim are clear, but material acceptance or evidence gaps constrain the verdict;
- `blocked / not assessable` — a required input is missing or insufficient, or authority remains unresolved after precedence; do not assign fake-risk.

For assessable or limited reviews:

- `low` — acceptance and available evidence force the claimed behavior at the declared boundary; remaining gaps do not permit false closure;
- `medium` — the capability is partially protected or evidenced, but ambiguity or a material gap still permits misleading implementation or closure;
- `high` — acceptance can pass without the reviewed claim, a broader capability or invariant closure relies on substrate that does not prove it, evidence is insufficient for that broader claim, or the target contradicts the concept.

Choose the first matching primary decision: `request authority/evidence` for blocked review basis; `reject` for concept contradiction or no legitimate contribution; `split` for mixed substrate and capability closure; `downscope` when only a narrower claim is supportable; `rewrite` for remaining repairable acceptance/spec defects; `request authority/evidence` when the remaining blocker is closure evidence alone; `proceed as substrate` for honest support scope; otherwise `proceed` only for assessable + low with no required correction. Report lower-priority defects as secondary findings.

Also return exactly one mode outcome:

- design-time: use `design-ready` for a new capability, `invariant-ready` for capability preservation, or `substrate-ready` for `proceed as substrate`; each requires `assessable + low`, otherwise use `claim-not-ready` or `blocked`;
- closure-time: use `capability-demonstrated`, `invariant-demonstrated`, or `substrate-demonstrated` at the matching claim boundary; each requires `assessable + low` and current boundary evidence, otherwise use `claim-not-demonstrated` or `blocked`.

`Claim-not-ready` and `claim-not-demonstrated` refer only to the reviewed claim boundary. `Proceed` covers capability and invariant claims; `proceed as substrate` covers substrate. Design-time proceed authorizes work, not completion. Invariant and substrate outcomes never claim a new or owner capability.

### Output contract

For `blocked / not assessable`, return only the attempted mode, blocked status and outcome, missing, insufficient, or unresolved review-basis input, primary decision `request authority/evidence`, and next owner or artifact. Do not add classification or fake-risk.

Otherwise return the smallest useful review containing:

1. review mode, assessment status, mode outcome, scope, and concept source;
2. the claimed capability and actor or consumer;
3. the claim-relative behavior, invariant, substrate, and evidence map;
4. exploitable criteria in design-time mode or evidence gaps in closure-time mode;
5. anti-claims;
6. fake-risk when assessable or limited;
7. one primary decision, the next owner, and the smallest required artifact, decision, or evidence.

Every material conclusion must trace to the concept source, reviewed target, acceptance criterion, or evidence supplied. Keep the review concise unless the user requests a formal report.

## Workflow stages

### Workflow stage: Establish the review basis

Select the correct mode and establish enough authority to review without inventing product intent.

1. Identify the review target, claimed completion boundary, and whether the request is design-time or closure-time.
2. Identify the authoritative concept source using user-provided or repository-defined source precedence; treat lower-authority disagreement as drift in that source, not as an authority blocker.
3. Record the acceptance criteria available in design-time mode and the current behavioral evidence available in closure-time mode.
4. If the target or claim is missing, the concept source cannot define the claim boundary, or competing sources remain unresolved after precedence because authority is equal or unknown, return blocked / not assessable with decision request authority/evidence and stop before classification or fake-risk.

Validation:

- The mode, scope, claim, and concept authority are explicit.
- Lower-authority drift and unresolved equal- or unknown-authority conflict are distinguished explicitly.
- A blocked review contains no invented target, claim boundary, classification, or fake-risk rating.

### Workflow stage: Frame the capability and claim boundary

Define the behavior at the level and for the actor the work actually claims to serve.

1. State the actor or consumer, trigger, observable response, durable state or effect, feedback, and continuity or recovery expectation when applicable.
2. State the exact release, slice, task, implementation, or closure claim being evaluated.
3. Classify outputs relative to that claim as delivered behavior, capability-preserving invariant, enabling substrate, or verification evidence.
4. Identify anti-claims that prevent a narrow task or artifact from implying a broader product or runtime capability.

Validation:

- Classification is relative to the named actor and claim boundary, not to a fixed list of technologies or artifacts.
- A public interface can be capability for its direct consumer and substrate for a broader user flow.
- Honest support work is not rejected merely because it is substrate.

### Workflow stage: Compare the target to the concept

Detect concept drift, missing behavior, and misleading completion claims.

1. Map each claimed behavior or preserved invariant to the higher-level concept outcome it advances or protects.
2. Separate real behavior from enabling artifacts and separate proof from the behavior it proves.
3. Identify behavior that remains simulated, manually mediated, unintegrated, non-durable, unprotected, or outside the reviewed evidence scope.
4. Check whether local correctness or artifact completeness can coexist with failure of the higher-level capability.

Validation:

- Every material alignment or drift conclusion points to the concept, reviewed artifact, acceptance, or evidence that supports it.
- Evidence is not called capability, and substrate is not dismissed when it has an explicit owner capability or invariant.

### Workflow stage: Test acceptance and evidence integrity

Determine whether the claimed capability is forced at design time or demonstrated at closure time.

1. In design-time mode, find the least-real implementation that could satisfy each criterion and propose behavior-level replacements for exploitable criteria.
2. In closure-time mode, trace the claimed actor, entry point, behavior, state or effect, feedback, and continuity through current production-shaped evidence.
3. Treat mocks, snapshots, schemas, routes, files, tests, logs, and screenshots according to what they prove; none proves a broader runtime claim by existence alone.
4. Record missing, stale, intercepted, simulated, partial, or out-of-scope evidence as an evidence gap rather than assuming success.

Validation:

- Design-time conclusions do not claim that unimplemented behavior already exists.
- Closure-time completion is not granted from planned acceptance or stale evidence.
- Each exploitable criterion or evidence gap states the observable proof needed to close it.

### Workflow stage: Issue the concept-conformance verdict

Produce a deterministic decision that prevents false confidence without overreaching into another skill's ownership.

1. Set assessment status to assessable, limited, or blocked; use blocked / not assessable only when a required input is missing or insufficient, or authority remains unresolved after precedence.
2. For assessable or limited reviews, assign low, medium, or high fake-risk using the calibrated definitions in the output contract.
3. Set one mode outcome: design-ready, invariant-ready, substrate-ready, claim-not-ready, capability-demonstrated, invariant-demonstrated, substrate-demonstrated, claim-not-demonstrated, or blocked, using the claim- and mode-specific rules in the output contract.
4. Choose exactly one primary decision from proceed, proceed as substrate, rewrite, split, downscope, reject, or request authority/evidence.
5. Name the next owner and needed artifact or decision; for the same or a materially related blocker surviving remediation, require root-cause analysis before more fixes. Do not rewrite product scope, architecture, backlog, specification, code, or security findings.

Validation:

- The assessment status, mode outcome, risk, decision, evidence gaps, and next owner are mutually consistent.
- Capability and invariant ready or demonstrated outcomes require assessable + low + proceed; substrate outcomes require assessable + low + proceed as substrate; closure-time outcomes also require current boundary evidence.
- The final answer contains the fields required by the output contract for its assessment status.

## Interop priority

- **product intent, users, scope, success metrics, non-goals, and product acceptance:** prd-engineer. This skill identifies concept drift or false acceptance; prd-engineer owns product-source revisions.
- **architecture-significant requirements, boundaries, patterns, trade-offs, and ADRs:** architecture-engineer. This skill may detect an unsupported claim; architecture-engineer owns decisions and handoff.
- **vertical slices, module increments, task decomposition, dependencies, and sequencing:** delivery-planner. This skill identifies misleading task boundaries; delivery-planner owns decomposition and sequencing.
- **implementation-ready behavior, atomic requirements, acceptance criteria, falsifiers, and verification maps:** spec-engineer. This skill identifies defective requirements; spec-engineer owns specification revisions.
- **implementation discipline:** implementation-discipline. After concept alignment, implementation-discipline owns changes, verification, and reporting.
- **written specification compliance:** spec-conformance-reviewer. It owns normative compliance; this skill owns higher-level concept alignment.
- **general code defects, regressions, maintainability, and merge risk:** code-reviewer. It owns non-concept defects and merge-risk reporting.
- **threat modeling, exploitability, vulnerability confidence, and security severity:** security-reviewer. This skill may expose a gap; security-reviewer owns vulnerability validation and classification.
- **technical feasibility and domain semantics:** the relevant domain skill. Domain skills own specialized technical facts.

## Gotchas

- **high** — Do not mechanically label APIs, schemas, queues, documentation, or tools as substrate without first naming the actor and claim boundary.
- **high** — An implementation can conform to a defective specification and still fail the concept; route the specification repair without confusing concept review with conformance review.
- **high** — Design-time acceptance can make future capability falsifiable, but it cannot prove that the capability already exists.

## Policies

### Capability-first policy
Judge completion by behavior at the declared actor and boundary, not artifact volume.

### Review basis and concept authority policy
Require a review target, capability claim, and concept source sufficient to define the claim boundary. Apply supplied or repository-defined precedence first; lower-authority disagreement is drift, while a missing or insufficient input or an unresolved equal- or unknown-authority conflict requires blocked / not assessable without classification or fake-risk.

### Claim-relative classification policy
Classify delivered behavior, capability-preserving invariants, enabling substrate, and verification evidence relative to the named actor and claim boundary. The same artifact may be capability at one boundary and substrate at another.

### Honest substrate policy
Substrate may proceed when its claim is limited, its owner capability or invariant is named, and acceptance does not imply broader completion.

### Evidence integrity policy
Closure requires current boundary evidence; record simulated, intercepted, stale, partial, or unreviewed paths as gaps.

### Anti-claims policy
Every non-trivial review must state the important behavior that remains unavailable, simulated, manually mediated, outside scope, or only weakly evidenced.

### Acceptance integrity policy
Acceptance passing without claimed capability is defective; route behavior-level proof to spec-engineer.

### Output completeness policy
For blocked reviews return only attempted mode, blocked status and outcome, missing, insufficient, or unresolved input, decision request authority/evidence, and next owner or artifact. Otherwise return mode, status, outcome, concept source, claim, classification, exploitable criteria or evidence gaps, anti-claims, fake-risk, decision, and next owner or artifact.

## Portability rules

- Do not reference machine-specific paths or external repository state.
- Keep all mandatory concept-conformance-reviewer guidance inside this skill folder.
- Use this skill as a review discipline; it does not prescribe framework-specific implementation or replace owning authoring, planning, review, security, or domain skills.

## Portability checklist before finishing

- Confirm the generated description triggers both design-time and closure-time concept review without absorbing ordinary conformance, code, or security review.
- Confirm input authority, blocked behavior, claim-relative classification, verdict calibration, output contract, and interop ownership are present and consistent.
- Confirm the generated skill contains no placeholder commands, runtime, references, metrics, or configuration surfaces.
- Confirm all supporting material remains non-normative and no absolute paths appear in the emitted skill.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
