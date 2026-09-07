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
- Missing information or authority stops the dependent decision or action. Complete useful independent work already authorized; do not invent the missing input or claim the blocked part is complete.
- When a rule causes a pause, permission request, or change of direction, identify the exact file and instruction, quote the relevant clause, explain its applicability, and state the smallest missing fact or permission. Separate explicit requirements from interpretation.
- Agent delegation requires explicit operator permission for the current task. Once given, reuse it within its scope. If an independent gate needs an agent and permission is absent, finish authorized preparation, request that permission, and stop before the gate. Never substitute an opaque process or author self-review for the requested agent-level independence.
- Unresolved same-authority conflicts block only the affected work. Name both sources and the decision owner; do not resolve a conflict by silently promoting an example or historical note.
- Changes to these rules do not authorize their own execution. Until the operator accepts a proposed change to permissions or checkpoints, use the previously accepted rules for the work introducing it.

## Instruction quality gate

After substantial changes to a skill, perform the author self-check from the `Audit instruction quality` workflow stage in `skill-source-compiler`, then obtain an independent `skill-reviewer` assessment against a stable snapshot. Apply the standard's criteria; compiler success and author self-check are not independent behavioral `PASS`.

A change is substantial when it can alter agent decisions or the instruction contract, including:

- new or materially rewritten root sections, workflow, policies, commands, or output contracts;
- new active references or changes to their loading conditions;
- active/supporting boundaries, interop ownership, tool triggers, validation, fallback, stop rules, or reporting;
- structured-source changes that affect emitted instructions or runtime behavior.

Use risk-based blind forward-tests for material behavior changes. A demonstrably non-behavioral change may omit them only with a recorded rationale; the owning review methodology determines whether the evidence supports the requested claim. Do not require a runtime or a permanent test harness merely because a skill is documentation-only.

Fix review findings and repeat the independent review until `PASS`. If the same or a related blocker survives remediation, investigate the root cause and original failure path before another point fix. Record the stable scope/snapshot, results, limits, and remediation evidence in the implementation log. Material changes invalidate the prior verdict for the changed surface and require renewed review or a justified bounded delta audit.

Changes to repository-wide instruction policy require an independent source-grounded review and proportionate behavioral checks before acceptance. Keep authority for the change separate from the candidate rules being tested; final compatibility with dependent skills must follow the accepted implementation plan.

## Issues, plans, and implementation records

Use the existing templates; they record evidence and do not introduce additional rules. Write operator-facing issues, plans, logs, and review reports in the operator's language. Preserve technical identifiers and the existing language of active instructions unless the operator requests a change.

| Artifact | Default location / template |
| --- | --- |
| Skill issue | `skills/<name>/docs/issues/issue-<YYYYMMDD>-<N>.md`; [issue template](docs/templates/ISSUE_TEMPLATE.md) |
| Skill issue implementation plan | Same directory, matching `implementation-plan-<YYYYMMDD>-<N>.md`; [plan template](docs/templates/IMPLEMENTATION_PLAN_TEMPLATE.md) |
| Skill implementation log | `skills/<name>/docs/logs/implementation-log-<YYYYMMDD>-<N>.md`; [log template](docs/templates/IMPLEMENTATION_LOG_TEMPLATE.md) |
| Repository-wide report or plan | Operator-specified location; current navigation is in [README.md](README.md) |

Every created issue requires an independent audit for problem completeness, sufficiency of proposed resolutions, and destructive side effects. Every created plan requires an independent audit against its issue, when present, and the owning problem sources. Correct findings and repeat until `PASS`; identify the reviewed snapshot and evidence. Creating a plan from a direct operator request does not require manufacturing a separate issue.

Keep an implementation log for every implementation. For repository-wide work, use the operator's location or a supporting record linked from the plan; do not assign common-rule work to an unrelated skill. Maintain each affected skill's `docs/README.md` when creating or changing its issues, plans, or logs. Group related fields and link evidence to keep records compact without omitting applicable requirements.

## Verification and handoff

Use declared repository/package commands, not internal dependency paths. Choose checks that can detect the changed failure path; complete mandatory gates. After they pass, broaden or repeat checks only for new changes, failures, or a concrete unresolved concern. The standard distinguishes structural checks, behavioral trials, and real-boundary evidence.

Return the outcome first, then material findings or changes, checks and evidence limits, unresolved decisions, and the next authorized action. Use the owning review skill's verdict contract when a formal verdict is requested. Do not turn implementation status, a compiler result, or a self-check into an independent audit verdict. Accepted checkpoint and publication boundaries remain binding.
