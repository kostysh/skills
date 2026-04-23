# Improvement Proposal: make external independent audit execution rules explicit

Issue ID: `ISS-01`

Primary owner skill: `unified-dossier-engineer`

## Problem

The active `unified-dossier-engineer` workflow requires external review before truthful stage closure, but it does not state operationally enough what counts as an actually independent external audit.

The current contract preserves:

- mandatory external review before closure;
- persisted review artifacts and review-policy checks;
- separation between stage-controller progress and truthful closure.

But it does not make explicit enough:

- that forked-context or full-history reviewer delegation is not an acceptable substitute for external independent review;
- that the runtime must not imply stronger independence guarantees than it can actually prove from recorded provenance;
- what exact execution pattern the agent must use when the workflow says `external independent audit`.

That ambiguity allowed a review cycle to start with a method that was later treated as invalid and had to be rerun.

## Why This Matters

This is not only a wording problem. If the method of independence is ambiguous:

- the workflow can produce a false sense of audit independence;
- blocking reviews may need reruns late in the cycle;
- retrospective analysis cannot tell whether the review method matched the declared policy;
- future agents may repeat the same mistake because the contract remains underspecified.

## Current Active Surface

Relevant active references:

- [Audit policy](../../references/audit-policy.md)
- [Delivery workflow layer](../../references/delivery-workflow-layer.md)
- [Commandized stage control](../../references/commandized-stage-control.md)
- [Telemetry and closure](../../references/telemetry-and-closure.md)

## Required Correction

Add an explicit execution rule for `external independent audit`.

The active contract should state, in effect:

- `external independent audit` requires a reviewer execution mode that does not inherit the authoring agent's full working context;
- forked-context or full-history reviewer delegation does not satisfy that requirement;
- provenance recorded by the runtime is evidence only for what it knows, not proof of deeper independence properties it cannot observe.

## What Must Change

### 1. Policy wording

Update the active review-policy guidance so that the required method of independence is operationally explicit, not left to inference.

The policy should distinguish:

- `external review` as a required workflow class;
- acceptable execution method for satisfying that class;
- unacceptable substitutes that look external but preserve authoring context too strongly.

### 2. Workflow wording

Update delivery workflow guidance so stage closure language cannot be read as "any external-looking reviewer run is sufficient".

The workflow should make clear:

- when a rerun is required because the method was invalid;
- that late discovery of an invalid review method is a process miss, not a valid pass.

### 3. Runtime and artifact boundary wording

Keep the runtime boundary honest.

The runtime and artifact contract may record review provenance that is actually observable, but it must not claim to algorithmically prove independence if that proof is outside the available signals.

## External Spec-Conformance Review

Status: reviewed

Verdict on initial draft: `sufficient`

Key review outcome:

- no material overreach was found;
- the only tightening requested was to bind the clarified rule to existing durable review-mode and closure-evidence surfaces, not only to generic docs coverage.

## Acceptance Criteria

This issue is fixed only when:

- the active review contract explicitly defines what satisfies `external independent audit`;
- the active guidance explicitly rejects forked/full-history reviewer delegation as a substitute for that requirement;
- workflow guidance explains that an invalid review method requires rerun rather than silent acceptance;
- runtime-facing wording does not promise automatic proof of reviewer independence beyond recorded provenance;
- the clarified rule is reflected in the durable review-mode / closure-evidence contract surfaces that govern truthful closure;
- docs-contract coverage protects those operative rule surfaces.

## Mandatory Planning And Implementation Constraint

Any future planning or implementation for this issue must stay tightly scoped to the independence-rule ambiguity described here.

Mandatory boundaries:

- make only the smallest documentation, contract, runtime-help, and test changes required to define and protect this rule;
- do not redesign the broader audit lifecycle;
- do not add unrelated review telemetry, artifact-schema expansion, or retrospective improvements under this issue;
- if implementation exposes a separate problem, record a new follow-up issue instead of widening this one.

## Non-Goals

- Do not add runtime session-trace scraping or hidden heuristics to prove reviewer independence.
- Do not redesign review artifact storage beyond what is required to document the rule correctly.
- Do not fold stage-log schema improvements or retrospective parser changes into this issue.
