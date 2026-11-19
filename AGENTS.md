# Repository instructions

This repository maintains portable AI-agent skills under `skills/` in a pnpm workspace.

## Start here

- For skill creation, maintenance, review, or changes to maintenance templates, read the normative [Skill standard](docs/skill-standard.md). This file owns the repository workflow; the standard owns skill quality requirements.
- Read the target's applicable `AGENTS.md` and declared source of truth before editing. Use `skill-creator` for skill authoring and `skill-source-compiler` for structured-source maintenance; do not edit generated output as source.
- Apply `implementation-discipline` to non-trivial skill or rule changes, plans, and code implementation/review. Establish the requested outcome, actor/consumer, authorized scope, and smallest meaningful verification before changing files.
- Load only the skills and references needed for the current task. Read-only inspection does not initiate implementation or an unrelated review workflow.

See [README.md](README.md) for layout and maintenance navigation.

## Authority, autonomy, and stops

Apply higher-priority platform and environment instructions first, then explicit user instructions, applicable repository policy, and skill guidance. A more specific repository rule refines a general rule within its own scope; it cannot grant additional user or environment authority.

- Carry forward permissions already given for the current task. Do authorized inspection, preparation, and reversible work without asking for the same permission again.
- A request to implement does not implicitly waive an accepted checkpoint or authorize commit, push, publication, external messages, or merge. Follow the operation-specific user and repository boundaries; use `git-engineer` for Git decisions.
- A review request authorizes inspection and reporting, not remediation. Keep the reviewed snapshot unchanged; use a disposable copy for checks that may write locally. Determine command side effects before running it.
- Complete what the available facts and authority support. Report any blocked part.
- When a rule causes a pause, permission request, or change of direction, identify the exact file and instruction, quote the relevant clause, explain its applicability, and state the smallest missing fact or permission. Separate explicit requirements from interpretation.
- Agent delegation requires explicit operator permission for the current task. Once given, reuse it within its scope. If an independent gate needs an agent and permission is absent, finish authorized preparation, request that permission, and stop before the gate. Never substitute an opaque process or author self-review for the requested agent-level independence.
- Unresolved same-authority conflicts block only the affected work. Name both sources and the decision owner; do not resolve a conflict by silently promoting an example or historical note.
- Changes to these rules do not authorize their own execution. Until the operator accepts a proposed change to permissions or checkpoints, use the previously accepted rules for the work introducing it.

## Instruction quality gate

Choose the shortest route that covers the change and every applicable mandatory check.

- **Editorial.** Record the exact diff, why decisions and outputs stay the same, and a narrow check that could catch an error. This rationale can justify omitting behavioral trials.
- **Behavioral.** Treat changes to authority, activation, required reading, workflow, commands, interop, outputs or other decisions as substantial, including changes through structured sources. Perform the `skill-source-compiler` author self-check, then obtain an independent `skill-reviewer` assessment of the stable package. Use blind trials with an ordinary correct case and one that can expose the error. Exercise a neighboring skill's handoff when its contract changes.
- **Remediation.** Preserve the initial result. Verify the original failure and affected adjacent decisions on the corrected snapshot. Fix findings and repeat the independent review until `PASS`. A recurring material defect requires investigation of its cause and original failure path before another correction.

Link prior evidence with its snapshot, rubric and scope when the relevant behavior, inputs and exposure are comparable. A rerun needs a specific reason such as a behavior change, fixture fault, exposed key, disagreement or hypothesis. Stop when mandatory checks and the claimed scope have sufficient evidence. A material change requires fresh review of the affected surface or a justified bounded delta audit. The skill standard and the reviewer govern evidence strength.

Changes to repository-wide instruction policy require an independent source-grounded review and proportionate behavioral checks before acceptance. Keep authority for the change separate from the candidate rules being tested; final compatibility with dependent skills must follow the accepted implementation plan.

## Issues, plans, and implementation records

Use the existing templates; they record evidence and do not introduce additional rules. Write operator-facing issues, plans, logs, and review reports in the operator's language. Preserve technical identifiers and the existing language of active instructions unless the operator requests a change.

| Artifact | Default location / template |
| --- | --- |
| Skill issue | `skills/<name>/docs/issues/issue-<YYYYMMDD>-<N>.md`; [issue template](docs/templates/ISSUE_TEMPLATE.md) |
| Skill issue implementation plan | Same directory, matching `implementation-plan-<YYYYMMDD>-<N>.md`; [plan template](docs/templates/IMPLEMENTATION_PLAN_TEMPLATE.md) |
| Skill implementation log | `skills/<name>/docs/logs/implementation-log-<YYYYMMDD>-<N>.md`; [log template](docs/templates/IMPLEMENTATION_LOG_TEMPLATE.md) |
| Repository-wide report or plan | Operator-specified location; current navigation is in [README.md](README.md) |

Use a sufficient direct operator request as the basis for a plan. An issue records the problem and observable signs of correction. A plan owns the sequence and acceptance criteria. Independently audit every created issue for problem completeness, proposed resolution and destructive effects, and every created plan against its issue (if present) and owning problem sources for sufficiency and safety. If both snapshots are ready and no intervening decision is required, one independent auditor may review them in one handoff. Record a separate verdict for each snapshot. Keep a required issue decision ahead of the dependent plan review. Audit stays pending until the auditor decides. Correct findings and repeat until each passes.

Keep an implementation log for every implementation. Record actual results, deviations, decisions and limits. Store the verdict, snapshot and evidence together once and link them from related records. For repository-wide work, use the operator's location or a supporting record linked from the plan. Update the affected skill's `docs/README.md` when its issues, plans or logs change.

For a skill audit, the orchestrator records assigned pairs and actual review events in the existing audit evidence. Use the [paired comparison method](skills/skill-reviewer/references/forward-testing.md) when it applies. A documentary audit needs only its process events and the reason behavioral measures do not apply. The repository's [summary script](scripts/audit-metrics.mjs) uses the same records for a single-skill report or an agreed catalog sample.

- Record UTC handoff, review start and verdict per attempt. Link a return to the snapshot, finding and primary cause (skill, rubric, fixture or missing evidence), retaining other causes. Report queue, review and return-to-next-handoff intervals, first-handoff-to-last-decision elapsed time, and active effort only from measured work intervals excluding pauses. For a catalog give medians with complete-observation counts, skills needing re-audit out of those with a first verdict, and open returns.
- From acceptance of each version, record each confirmed later defect once in its existing issue or log, with evidence, affected rule and whether the audit covered the scenario. Give release date and observation cutoff, separate pre-release and post-release findings, and mark unsystematic follow-up unknown.

## Verification and handoff

Use declared repository/package commands, not internal dependency paths. Choose checks that can detect the changed failure path; complete mandatory gates. After they pass, broaden or repeat checks only for new changes, failures, or a concrete unresolved concern. The standard distinguishes structural checks, behavioral trials, and real-boundary evidence.

Return the outcome first, then material findings or changes, checks and evidence limits, unresolved decisions, and the next authorized action. Use the owning review skill's verdict contract when a formal verdict is requested. Do not turn implementation status, a compiler result, or a self-check into an independent audit verdict. Accepted checkpoint and publication boundaries remain binding.
