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
