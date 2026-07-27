---
name: retrospective-analysis
description: Conduct evidence-backed retrospectives of completed work. Use
  targeted mode for one incident and full evidentiary mode for slices, projects,
  major sessions, or incidents; verify causality, deduplication, prior fixes,
  remediation plans, and approved task handoff.
compatibility: Portable documentation-only skill. It consumes available evidence
  and project rules; it has no required CLI, tracker, runtime, or repository
  layout.
metadata:
  source-version: 0.1.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 676464b9c7ddd706d029c244841374bba69a0ba3a0221c2a3a2bbb71ede295ba
---

# retrospective-analysis

## Start here

1. Confirm the work or bounded phase is complete enough to have retrospective evidence; use diagnosis, review, or planning skills when the primary goal is to change active work rather than learn from completed work.
2. State the retrospective capability, substrate, and anti-claims; a report, issue count, or green audit cannot by itself prove that the underlying process improved.
3. Select `targeted` for one bounded incident, review loop, or failure class, and `full evidentiary` for a slice, project, major session, systemic incident, or explicit exhaustive request.
4. Establish the phase boundary, authority order, allowed evidence locations, mutation authority, intended outputs, and unavailable-source policy before drawing conclusions.
5. For `full evidentiary`, read the evidence/causality and report/remediation references in full before analysis. Read task-routing only after task creation is requested and approved.
6. Prefer existing evidence and narrow read-only aids. Do not add a registry, script, harness, or workflow unless a named repeated risk cannot be checked sufficiently with existing means and its maintenance cost is lower than recurrence.

## When to use this skill

- Retrospective or postmortem of a completed slice, project, phase, implementation session, audit cycle, or incident.
- Root-cause and process analysis that must reconcile session evidence, repository history, audits, and current controls.
- Review of whether historical problems and their systemic prevention have actually been implemented.
- Preparation of a remediation plan or approved task handoff from accepted retrospective findings.

## When NOT to use this skill

- Forward planning before retrospective evidence exists.
- Ordinary code, security, specification, or skill review of a current diff.
- Live incident diagnosis whose immediate containment or repair is not complete.
- Process opinion that has no evidence boundary and does not request an evidence-backed retrospective.

## Workflow stages

### Workflow stage: Bound the retrospective and choose depth

Make the claim, evidence perimeter, side effects, and proportional process explicit.

1. Define the analyzed outcome or invariant, start and end boundary, actors or systems, repositories and environments, requested audience, output location, and strongest honest completion claim.
2. Name included and excluded work and distinguish a product or process problem from supporting artifacts used to inspect it.
3. Use targeted mode only when one bounded problem can be evaluated without claiming program-wide completeness; otherwise use full evidentiary mode.
4. In targeted mode, inspect the direct evidence, causal chain, adjacent falsifier, current control, and narrow remediation; do not generate a project-wide source register or task hierarchy.
5. In full mode, require closed source disposition, all relevant failed reviews, count reconciliation, independent completeness review, and machine-readable output.

Validation:

- Mode and completeness claim match the scope.
- Missing evidence cannot be hidden by narrowing the claim after analysis begins.
- Substrate cannot pass as demonstrated process improvement.

### Workflow stage: Close and classify the evidence perimeter

Know what was inspected, unavailable, excluded, and authoritative before causal findings are accepted.

1. Inventory available primary evidence such as session messages and traces, tool calls and outputs, errors and retries, repository artifacts and history, tests and runtime logs, CI, tracker state, applicable rules and skills, and every failed audit within scope.
2. Record each source with stable local identity, type, authority, time or revision, relevance, availability, and any integrity or truncation limit.
3. Treat analyzers and summaries as navigation aids; verify semantic conclusions against primary artifacts.
4. Mark unavailable or inaccessible source classes explicitly and reduce or block the completeness claim when they could change the verdict.
5. In full mode, give every discovered source or atomic observation an explicit disposition; do not leave silent samples or undispositioned evidence.

Validation:

- The source universe is closed for the stated scope or the result is explicitly limited.
- Every failed audit in scope is listed.
- No tool-generated count is treated as a semantic finding without primary evidence.

### Workflow stage: Extract observations and establish causality

Turn evidence into falsifiable problems rather than anecdotes or audit transcription.

1. Extract atomic observations with exact evidence pointers and separate fact, inference, and uncertainty.
2. For each accepted problem, trace symptom, immediate cause, systemic root cause, prevention failure, late-detection reason, and consequence.
3. Verify every audit finding against the primary artifact; classify false positives, weak criteria, or overly broad prescriptions as audit-method findings instead of artifact defects.
4. Classify contributing owners such as skill weakness, method ambiguity, skill misuse, missing project rule, missing automated check, implementation or test defect, document-code drift, tool limit, or audit defect only when evidence supports that link.
5. Reject the inference that every repeated symptom has one root cause or that every audit finding implies a skill change.

Validation:

- Symptoms and consequences are not presented as root causes.
- Each root cause explains its occurrences and prevention gap.
- Rejected observations retain a reason and evidence.

### Workflow stage: Verify prior fixes and deduplicate root problems

Avoid reopening completed work while preserving unresolved systemic prevention.

1. Search every repository that owns a claimed fix, including separate skill or infrastructure repositories when applicable.
2. Use commit messages only as locators; inspect the actual diff, current target state, tests, audit evidence, and runtime evidence proportional to the claim.
3. Give the historical occurrence and the systemic prevention separate statuses such as implemented, partial, not started, superseded, or not applicable.
4. Deduplicate by systemic root cause and required prevention mechanism; keep multiple occurrences under one problem only when the same corrective control prevents them.
5. Split superficially similar symptoms when they need different owners or prevention, and run a second pass for missed and over-merged problems.

Validation:

- Fixed historical problems remain visible without producing duplicate work.
- No commit subject, issue state, or document claim alone proves implementation.
- Final problem rows have distinct causes and prevention mechanisms.

### Workflow stage: Produce the report, matrix, and remediation plan

Deliver a human-readable account and machine-readable mapping whose counts, statuses, and actions agree.

1. For full mode, read the report/remediation reference and produce the required report, matrix, appendices, reconciled counts, and statistics.
2. Tie each active recommendation to evidence-backed root problems and distinguish project rules, skills or methods, tests or tools, runtime or domain work, and audit-method changes.
3. Apply the complexity gate before recommending automation or a new workflow.
4. Turn active recommendations into a strictly numbered independently assignable plan; record explicit dispositions for already implemented, cancelled, rejected, superseded, or not-applicable recommendations.
5. Keep task creation outside report acceptance and stop for separate operator approval.

Validation:

- Observation, problem, recommendation, and plan-step mappings reconcile.
- Every critical or high problem has concrete prevention or an explicit blocker.
- The plan contains only residual work and can be assigned by step number.

### Workflow stage: Independently review and define effectiveness

Protect completeness and causality without mistaking documents or tasks for changed behavior.

1. Run an independent review of the stable full-retro snapshot when the runtime and operator permit it; give the reviewer explicit source hierarchy and full scoped artifact set without prior conversational conclusions.
2. If independent delegation is required but not authorized or available, stop before an accepted completeness verdict and request the missing authority; do not simulate independence.
3. Correct substantive findings and repeat only the affected audit surface unless root-cause, scope, or mappings changed materially.
4. Define a future effectiveness check on the next comparable work; issue creation, rule text, script presence, and audit PASS are implementation evidence, not effectiveness by themselves.

Validation:

- The stable snapshot has an honest independent verdict or is explicitly blocked.
- Later mutations that change scope, concepts, mappings, or recommendations make the prior verdict stale.
- Effectiveness has an observable recurrence or prevention measure.

## Interop priority

- **product intent, architecture decisions, specifications, security, privacy, runtime, and domain facts used as evidence:** The relevant owning project artifact and specialist skill. retrospective-analysis evaluates process and causality but cannot invent or revise domain truth.
- **source-authorized scope, complexity exceptions, substrate claims, and proportional verification:** implementation-discipline. implementation-discipline supplies the cross-cutting simplicity and evidence gate; retrospective-analysis owns retrospective method and outputs.
- **whether a skill change provides real agent capability and instruction quality:** skill-reviewer. retrospective-analysis may identify a skill-related root cause, but independent skill-reviewer owns formal skill verdicts.
- **delivery decomposition, dependencies, readiness, and executable task briefs:** delivery-planner. retrospective-analysis owns the accepted recommendation-to-step mapping; delivery-planner owns project task semantics without changing retrospective truth.
- **tracker API, project fields, parent-child links, issue creation, and readback:** The tracker-specific project skill or tool. retrospective-analysis defines safety and approval gates; the project-specific owner performs and verifies external mutations.

## Gotchas

- **high** — Do not claim a full evidentiary retrospective from a convenient sample, summaries, search hits, or only the most visible failed audits.
- **high** — Do not copy failed-audit findings into the matrix without verifying the primary artifact, criterion quality, and actual causal chain.
- **high** — A commit subject, closed issue, or updated rule is a locator or substrate, not proof that the defect and systemic prevention are implemented.
- **high** — Do not merge problems merely because symptoms, files, or audit wording look similar when different controls are required.
- **high** — Do not create a registry, script, harness, workflow, or task hierarchy for its own sake; apply the complexity gate and keep targeted mode narrow.
- **high** — Do not create remediation tasks before the report is stable, independently accepted when required, and separately approved by the operator.

## Policies

### Primary-evidence policy
Semantic claims must be verified against primary artifacts; analyzers, reports, issue states, and commit subjects may locate evidence but cannot replace it.

### Historical-fix policy
Track the status of the historical occurrence separately from the status of the systemic prevention so completed work is neither reopened nor overstated.

### Proportionality policy
Use targeted mode for one bounded problem and reserve closed-universe, machine-readable, independently reviewed full retrospectives for broad or systemic claims.

### Task-separation policy
Accepting a retrospective report and approving creation of remediation tasks are separate operator decisions.

### Effectiveness policy
Documents, rules, skills, scripts, tasks, and green CI show implemented substrate; only comparable future behavior can demonstrate prevention effectiveness.

## Optional references
- [Evidence, causality, and deduplication](references/evidence-and-causality.md) — Read this for every full evidentiary retrospective and whenever source closure, audit-finding causality, prior-fix verification, or deduplication is material.
- [Report, matrix, and remediation plan](references/report-and-remediation-plan.md) — Read this before producing a full report, machine-readable matrix, recommendation set, or independently assignable remediation plan.
- [Approved task handoff](references/task-routing.md) — Read this only when the operator requests or approves creation of tracker tasks from an accepted retrospective plan.

## Portability rules

- Do not depend on a specific agent runtime, session-store layout, repository path, branch name, tracker, or CI provider.
- Keep all mandatory retrospective guidance inside this skill folder.
- Use relative links for active references and supporting files.
- Treat runtime-specific discovery commands and project tools as optional local adapters, not portable requirements.

## Portability checklist before finishing

- Confirm the generated SKILL links all three active references with explicit load triggers.
- Confirm no absolute path, project issue ID, tracker field, or repository name appears in the active surface.
- Compile to an isolated directory and verify that the emitted skill remains complete without the source repository.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/issues/*`
- Supporting glob: `docs/logs/*`
