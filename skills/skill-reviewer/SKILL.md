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
  source-version: 0.2.2
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: f1477321c70f896f0f7e842450f39fdbff5ba59e7cf96fb6eb9d52a0c16008d1
---

# skill-reviewer

## Start here

1. Confirm the requested outcome is a review verdict, then read the required methodology and select baseline, change, or re-audit mode for a stable scope.
2. Frame the claimed capability, actor, consumer, anti-claims, and source precedence before judging artifacts or evidence.
3. Read the forward-testing reference for material behavior changes or any formal PASS that depends on realistic behavioral confidence.
4. Return an evidence-backed verdict and route remediation to the owning authoring or implementation skill.

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

Make the review reproducible and assessable.

1. Record mode, scope and exclusions, source precedence, snapshot identity, assurance, claimed capability, actor, consumer, and target-side effects.
2. Apply the reviewer action boundary before running checks.
3. Return BLOCKED only when a missing or moving basis or essential unavailable evidence prevents a defensible verdict; otherwise report the evidence limit.

Validation:

- Another reviewer can reconstruct the same review surface from the recorded identity and scope.
- Assurance and reviewer actions are explicit.

### Workflow stage: Audit capability and evidence

Determine whether the relevant instruction and evidence surfaces support the claimed behavior rather than substrate-only confidence.

1. Use the methodology to inspect every behavior-relevant surface and trace activation, authority, inputs, decisions, outputs, interop, fallback, validation, and stop rules.
2. Classify artifacts as capability, substrate, or evidence relative to the claim, and distinguish inspected facts from reviewer inference and unresolved source conflict.
3. Run proportionate structural and behavioral checks; use blind forward-tests when the forward-testing trigger applies.

Validation:

- Each material finding cites direct evidence, labels inference or conflict, and explains the observable failure or false-confidence path.
- Structural validity, instruction quality, domain correctness, and behavioral evidence remain separate claims.

### Workflow stage: Issue the skill-review verdict

Produce a traceable decision that downstream maintainers cannot mistake for broader proof.

1. Consolidate findings by root cause, assign severity, and map prior findings to current evidence when re-auditing; if the same or a related blocker survives remediation, require root-cause investigation before another point fix.
2. Choose the verdict from the methodology contract; self-review cannot PASS, and missing optional evidence blocks only when the requested claim depends on it.
3. Report the action boundary, findings and evidence bases, evidence limits, verdict, and next owner without performing remediation.

Validation:

- Verdict, findings, evidence limits, anti-claims, and next owner are mutually consistent.
- Any change to the reviewed surface invalidates the verdict until the changed snapshot is re-reviewed.

## Interop priority

- **skill authoring, structure, concise guidance, and UI metadata:** skill-creator. skill-creator owns creation and remediation of skill instructions; skill-reviewer owns the independent verdict on the resulting snapshot.
- **structured source bundles, generation, drift, structural parity, and compiler commands:** skill-source-compiler. skill-source-compiler owns compilation and local structural checks; skill-reviewer decides whether the emitted package reliably delivers its claimed agent behavior.
- **alignment to an established product or system concept and capability-versus-substrate classification at that broader boundary:** concept-conformance-reviewer. concept-conformance-reviewer owns the higher-level concept verdict; skill-reviewer owns the skill-package and instruction-behavior verdict.
- **framework, security, data, financial, regulatory, product, architecture, planning, specification, or other specialized facts:** the relevant domain skill. Domain skills own specialized correctness; skill-reviewer checks that the target routes to and faithfully consumes that authority.
- **implementing accepted code or runtime review corrections and maintaining their remediation matrix:** implementation-discipline. implementation-discipline applies only when remediation changes code or runtime behavior; skill-creator owns instruction and UI remediation, while skill-source-compiler owns structured-source regeneration. The independent reviewer remains read-only for the reviewed snapshot.
- **commit scope, history, worktrees, and delivery hygiene:** git-engineer. git-engineer owns repository mutations and commit policy; skill-reviewer only records snapshot identity and review scope.

## Gotchas

- **high** — Compiler, schema, link, and portability success prove package invariants, not that the skill makes correct decisions on realistic tasks.
- **high** — Do not call a forward-test blind when the evaluator received the suspected defect, expected answer, intended fix, or prior conclusions.
- **medium** — Inspect rendered or packaged readback when syntax, links, generated output, or markup can disappear despite structural validation.

## Policies

### Capability-first review
Judge the skill by the decisions, actions, artifacts, and handoffs it reliably produces for its declared actor or consumer, not by package completeness or instruction volume.

### Reviewer action boundary
Read and inspect in-scope local artifacts by default. Do not mutate the reviewed snapshot; use a disposable copy for checks that may write, and require separate authority for external, destructive, costly, or scope-expanding actions.

### Grounded findings
Attach each material claim to inspected evidence, label reviewer inference and source conflict, and report missing evidence without turning absence in the reviewed scope into a factual no.

### Review output contract
Report mode, assurance, snapshot, scope, capability and anti-claims, surface inventory, reviewer actions, findings with evidence basis and impact, structural and rendered/package readback, runtime/test and forward-test results, remediation status when applicable, verdict, and next owner.

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
