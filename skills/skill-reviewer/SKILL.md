---
name: skill-reviewer
description: Independently review new or changed AI-agent skills for real
  capability, instruction quality, trigger and responsibility boundaries, input
  and output contracts, interop, active/supporting/runtime parity, portability,
  and evidence integrity. Use for baseline skill audits, scoped change reviews,
  remediation re-audits, or closure claims where compiler success,
  documentation, mocks, scaffolding, or self-review could be mistaken for a
  reliable skill capability. Produces evidence-backed P1/P2/P3 findings and a
  PASS, FAIL, BLOCKED, or PROVISIONAL verdict without editing the reviewed
  skill.
compatibility: Portable documentation-only review skill. It ships no runtime or
  test package and requires only access to the skill artifacts and available
  validation evidence.
metadata:
  source-version: 0.1.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 58853acfe6189e2c69d874dc2c39dd8831cdec420fa9736f4327850d4fe7a1aa
---

# skill-reviewer

## Start here

1. Confirm the requested outcome is a review verdict, not authoring, remediation, compilation, or implementation.
2. Select baseline for a whole current skill, change for a stable scoped diff plus affected unchanged guidance, or re-audit for a remediated snapshot and prior findings.
3. Establish reviewer independence, a stable snapshot identity, review scope, claimed capability, actor or consumer, and source precedence before judging quality.
4. Read the required methodology reference; read the forward-testing reference for material behavior changes or before issuing a formal PASS that depends on behavioral confidence.
5. Separate the skill's claimed agent behavior from its substrate, including files, metadata, templates, compiler output, runtime helpers, tests, mocks, and supporting logs.
6. Return findings and a verdict without editing the reviewed skill; route remediation to the owning authoring or implementation skill.

## When to use this skill

- Reviewing a new skill before it is accepted or published.
- Auditing an existing skill for purpose, triggers, responsibility boundaries, inputs, outputs, interop, guidance quality, portability, validation, or false capability claims.
- Reviewing a stable skill diff after material instruction, reference, runtime, test, tool, fallback, or output-contract changes.
- Re-auditing remediation against prior findings and checking for regressions before closure.
- Determining whether structural validation or self-review has been mistaken for evidence that realistic skill behavior works.

## When NOT to use this skill

- Creating or editing a skill; use skill-creator and, for structured bundles, skill-source-compiler.
- Compiling, regenerating, or structurally validating a source bundle without requesting an independent skill-capability verdict.
- Reviewing ordinary application code, specification conformance, security, or product concept alignment when skill-package behavior is not the target.
- Issuing an independent PASS from the same reviewer that authored or remediated the reviewed snapshot.

## Overview

Review whether an AI-agent skill reliably delivers its declared decision or action capability without confusing package structure, generated files, tests, mocks, or documentation with behavioral proof. Produce a read-only, evidence-backed verdict tied to a reproducible snapshot, and leave remediation to a separate owner.

## Workflow stages

### Workflow stage: Establish the review basis

Make the scope, authority, snapshot, and assurance level stable enough for a reproducible review.

1. Identify the target skill, review mode, included files or diff, excluded surfaces, and source-of-truth precedence.
2. Record snapshot identity using an immutable revision, aggregate content hash, or exact diff plus base revision.
3. Determine whether the reviewer is independent of authorship and remediation for this snapshot.
4. Identify the claimed skill capability, actor or consumer, allowed side effects, and completion claim from the highest-authority active source.
5. Return BLOCKED when the target, scope, source, or snapshot is missing or unstable enough to invalidate conclusions.

Validation:

- Another reviewer can reconstruct the same review surface from the recorded identity and scope.
- Review independence is explicit; self-review cannot produce PASS.
- Missing or conflicting authority is reported instead of being silently invented.

### Workflow stage: Map capability and instruction surfaces

Distinguish the agent behavior being claimed from the artifacts that enable or describe it.

1. State the actor, triggering request, expected decisions or actions, observable output, downstream consumer, and important anti-claims.
2. Inventory source-of-truth, generated, active normative, optional active, supporting, asset, runtime, test, and UI metadata surfaces that are in scope.
3. Trace every mandatory rule to a reachable active surface and every generated or runtime claim to its owner and verification path.
4. Classify files, commands, templates, tests, mocks, and logs as capability, enabling substrate, or evidence relative to the named claim boundary.

Validation:

- Artifact existence is not treated as proof that the skill makes correct decisions on realistic inputs.
- Supporting or historical material does not silently override active guidance.
- The anti-claims prevent a documentation-only or structurally valid package from implying runtime or domain capability it does not have.

### Workflow stage: Audit contracts and behavior

Find instruction defects that can cause wrong activation, decisions, handoffs, actions, or closure claims.

1. Review purpose and trigger precision, when-not-to-use boundaries, input authority and readiness, output and verdict contracts, stop rules, fallback behavior, and side-effect limits.
2. Review responsibility and interop ownership, including whether every requested upstream input and downstream artifact is producible by its named owner.
3. Check source and generated parity, active and supporting separation, docs/runtime/test parity, reference reachability, progressive disclosure, precedence, portability, and UI metadata alignment.
4. Search for contradictions, duplicated rules, vague modality, hidden mandatory guidance, invented domain facts, and acceptance that can pass with substrate alone.
5. Use the relevant domain or concept reviewer for specialized correctness without transferring this skill's ownership of the skill-package verdict.

Validation:

- Each material finding cites the reviewed artifact and explains the observable skill failure or false-confidence path.
- The review distinguishes structural validity, instruction quality, domain correctness, and behavioral evidence.
- Proposed corrections are the smallest changes that close the identified failure path and do not silently expand scope.

### Workflow stage: Test evidence integrity

Calibrate behavioral confidence without turning test scaffolding into proof of general capability.

1. Run available structural, generated-drift, runtime, test, portability, and rendered-readback checks appropriate to the package.
2. For material behavior changes or a formal capability claim, design risk-based blind forward-tests using the forward-testing reference.
3. Include should-trigger, should-not-trigger, missing or conflicting input, substrate-only or adversarial, interop-boundary, and positive success cases when applicable.
4. Record what each check proves and does not prove; mocks and fixtures support but do not close real-boundary claims by themselves.
5. If forward-testing is skipped, state the narrow reason and why the change cannot affect agent decisions, actions, handoff, validation, or reporting.

Validation:

- Evidence covers the claim at the boundary where PASS is requested.
- Blind evaluators receive raw artifacts and tasks without the expected diagnosis or fix.
- A compiler-valid or test-green package can still fail when realistic behavior remains misleading.

### Workflow stage: Issue the skill-review verdict

Produce a traceable decision that downstream maintainers cannot mistake for broader proof.

1. Assign P1, P2, or P3 to each finding using the methodology reference and consolidate duplicates by root cause.
2. Map each accepted prior finding to current change, evidence, and status during re-audit.
3. Choose PASS only for an independent stable-snapshot review with no unresolved P1 or P2 and sufficient behavioral evidence for material claims.
4. Choose FAIL when P1 or P2 findings remain, BLOCKED when the review basis or required evidence is unavailable, and PROVISIONAL for completed self-review that cannot claim independence.
5. Name the next owner and smallest required correction or evidence; do not perform remediation inside the independent review.

Validation:

- Verdict, findings, evidence limits, anti-claims, and next owner are mutually consistent.
- Any change to the reviewed surface invalidates the verdict until the changed snapshot is re-reviewed.
- P3-only observations do not block PASS and are not inflated into capability failures.

## Interop priority

- **skill authoring, structure, concise guidance, and UI metadata:** skill-creator. skill-creator owns creation and remediation of skill instructions; skill-reviewer owns the independent verdict on the resulting snapshot.
- **structured source bundles, generation, drift, structural parity, and compiler commands:** skill-source-compiler. skill-source-compiler owns compilation and local structural checks; skill-reviewer decides whether the emitted package reliably delivers its claimed agent behavior.
- **alignment to an established product or system concept and capability-versus-substrate classification at that broader boundary:** concept-conformance-reviewer. concept-conformance-reviewer owns the higher-level concept verdict; skill-reviewer owns the skill-package and instruction-behavior verdict.
- **framework, security, data, financial, regulatory, product, architecture, planning, specification, or other specialized facts:** the relevant domain skill. Domain skills own specialized correctness; skill-reviewer checks that the target routes to and faithfully consumes that authority.
- **implementing accepted code or runtime review corrections and maintaining their remediation matrix:** implementation-discipline. implementation-discipline applies only when remediation changes code or runtime behavior; skill-creator owns instruction and UI remediation, while skill-source-compiler owns structured-source regeneration. The independent reviewer remains read-only for the reviewed snapshot.
- **commit scope, history, worktrees, and delivery hygiene:** git-engineer. git-engineer owns repository mutations and commit policy; skill-reviewer only records snapshot identity and review scope.

## Gotchas

- **high** — Compiler, schema, link, and portability success prove package invariants, not that the skill makes correct decisions on realistic tasks.
- **high** — Do not issue PASS for a snapshot you authored or remediated; return PROVISIONAL until an independent reviewer examines the stable snapshot.
- **high** — A verdict belongs to the identified snapshot and scope; any material change makes the prior PASS stale.
- **high** — Do not call a forward-test blind when the evaluator received the suspected defect, expected answer, intended fix, or prior conclusions.
- **high** — Do not edit the target during its independent review; findings must be handed to a separate authoring or implementation pass.
- **medium** — Inspect rendered or packaged readback when syntax, links, generated output, or markup can disappear despite structural validation.

## Policies

### Capability-first review
Judge the skill by the decisions, actions, artifacts, and handoffs it reliably produces for its declared actor or consumer, not by package completeness or instruction volume.

### Stable snapshot
Every verdict is scoped to a reproducible snapshot; a changed review surface requires a new verdict or a clearly bounded delta re-audit.

### Independent PASS
PASS requires a reviewer that did not author or remediate the reviewed snapshot, no unresolved P1 or P2 findings, and evidence proportionate to the behavioral claim.

### Evidence calibration
State what each structural check, test, mock, example, forward-test, and boundary observation proves and what remains unverified.

### Minimal remediation guidance
Findings should name the smallest correction that closes the observed failure path without redesigning the target skill or taking over another skill's authority.

### Review output contract
Report mode, assurance, snapshot, scope, capability and anti-claims, surface inventory, findings with evidence and impact, structural and rendered/package readback, runtime/test and forward-test results, remediation status when applicable, verdict, and next owner.

## Required active references
- [Skill review methodology](references/methodology.md) — Read this before conducting or reporting any skill review.

## Optional references
- [Blind forward-testing](references/forward-testing.md) — Read this for a material behavior change, a formal PASS, or whenever realistic prompts are needed to test whether the skill generalizes.

## Portability rules

- Do not require repository-specific paths, session stores, or external local files to perform a review.
- Keep all mandatory review and verdict rules inside this skill folder.
- Treat repository commands and source precedence as discovered target context, not universal contracts.
- Keep runtime-specific discovery in the invoking agent's instructions unless the target skill explicitly owns that runtime.

## Portability checklist before finishing

- Confirm the package works when copied without repository history or the sessions that informed its design.
- Confirm every mandatory reference is reachable from SKILL.md.
- Confirm UI metadata matches the trigger and does not imply remediation ownership.
- Confirm no runtime, scripts, tests, metrics, or commands are claimed for this documentation-only skill.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
