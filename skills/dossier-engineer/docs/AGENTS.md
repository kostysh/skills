# AGENTS.md for `skills/dossier-engineer/docs`

## Purpose

This folder contains the planning, process-model, gap-analysis, and implementation-log documents used to refactor `dossier-engineer` toward the backlog-driven cross-skill process.

These rules exist so the planning/implementation workflow stays stable during refactoring.

## Normative source of truth

For this refactoring cycle, the normative process source of truth is:

- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)

Supporting planning sources:

- [backlog-harmonization-prep.ru.md](backlog-harmonization-prep.ru.md)
- [dossier-process-gap-analysis.ru.md](dossier-process-gap-analysis.ru.md)
- [backlog-process-gap-analysis.ru.md](backlog-process-gap-analysis.ru.md)
- [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md)
- [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md)
- [refactoring-plan-3.ru.md](refactoring-plan-3.ru.md)
- [refactoring-plan-4.ru.md](refactoring-plan-4.ru.md)

Important rule:

- if a design or implementation decision is explicitly covered by the cross-skill process model, follow that model;
- if a needed implementation decision is not explicitly covered by the model, record it in the implementation log as a decision/assumption beyond the current process specification.

## Package execution rules

1. Execute one work package at a time.
2. Do not mix Package 1 and Package 2 work in one implementation pass.
3. Do not preserve legacy candidate-backlog behavior just to ease intermediate transitions.
4. Prefer a direct rewrite to the new model over temporary compatibility shims.

## Acceptance rules

Before a package is considered done, verify all applicable acceptance conditions from the active refactoring plan for the current stage.

For docs/text packages:

- all touched docs must be internally consistent;
- quick paths, references, templates, and surrounding docs must not drift apart;
- no wording may reintroduce candidate-first or `feature-discovery` mental models.

For runtime packages:

- docs, runtime behavior, and tests must match;
- no removed legacy command or state model may remain in active code paths;
- applicable `format`, `lint`, `typecheck`, and tests must pass.

## Review rules

All audits must be run through spawned external agents. Never replace an external audit with self-review when the process requires an audit agent.

If spawning a required review agent needs explicit operator approval, ask the operator, stop, and wait for the answer.

When launching any audit agent:

- explicitly assign the audit role;
- explicitly define the audit scope and boundaries;
- provide the minimum necessary documentation links for that audit;
- instruct the agent to be concise: brief, precise, no filler;
- instruct the agent to watch for detail-level defects and possible side effects inside the audited scope;
- do not ask for tables, matrices, executive summaries, cleared-surfaces sections, or other expanded reporting formats unless they are explicitly needed for the current task or explicitly requested by the operator;
- if such expanded formats are genuinely needed for the audit, request them explicitly in the audit prompt instead of assuming them by default;
- close the agent immediately after it returns PASS and is no longer needed.

### How to launch spec/process conformance review

For spec/process conformance review, always:

- explicitly assign the agent the role of spec/process auditor;
- explicitly recommend the `spec-conformance-reviewer` skill;
- explicitly define the narrow audited scope;
- provide the normative documents for that scope.

Normative documents depend on what is being audited:

- when auditing code, use the relevant code specification, command contract, or utility spec;
- when auditing architecture, use the higher-level concept/process model;
- when auditing skill/process text, use the current process model and the active refactoring plan.

Recommended model effort:

- use `high` by default;
- use `xhigh` only for unusually broad or difficult spec/process audits.

### How to launch code review

For code review, always:

- explicitly assign the agent the role of code reviewer;
- explicitly recommend the `code-reviewer` skill;
- explicitly define the changed files and the intended boundaries of the review;
- provide the documentation links that define the expected behavior of the changed code.

Recommended model effort:

- use `medium` for small/simple deltas;
- use `high` for broader or riskier code changes.

### How to launch security review

For security review, always:

- explicitly assign the agent the role of security reviewer;
- explicitly recommend the `security-reviewer` skill;
- explicitly define the changed files and trust-boundary scope;
- provide the documentation links that define the expected security-sensitive behavior.

Recommended model effort:

- use `high` by default;
- use `xhigh` only for unusually broad or high-risk audits.

### Audit sequencing rules

The normal audit order is:

1. spec/process conformance review;
2. code review, if the audited changes include code rather than prose only;
3. security review, if the audited changes include code rather than prose only.

Do not start code review or security review before spec/process conformance reaches PASS.

If the changes are docs/text only, do not run code review or security review unless the package unexpectedly changed executable code.

### Package 1 (textual refactor)

Review in this order:

1. spec/process conformance review against:
   - [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
   - [dossier-process-gap-analysis.ru.md](dossier-process-gap-analysis.ru.md)
   - [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md)

Do not start runtime-focused reviews for Package 1 unless the package unexpectedly changes executable code.

### Package 2 (utility/runtime refactor)

Review in this order:

1. spec/process conformance review
2. code review
3. security review

### Findings handling rules

When an audit returns findings:

- if fixing the findings would require going beyond the current specification/process model, report that to the operator, ask for the decision, then stop and wait;
- if the findings can be fixed immediately within the current specification/process model, fix them and re-run only the audits that are still relevant to the narrow follow-up scope;
- continue this fix -> narrow re-audit cycle until the relevant audit returns PASS.

Choose follow-up re-audits by change classifier, not by one coarse rule:

- `normative/process/docs contract changes`
  - run narrow spec/process conformance review
- `runtime/code/trust-boundary changes`
  - run narrow code review and narrow security review, and also rerun narrow spec/process review if the follow-up could affect the normative contract
- `tests/typing/non-normative internal changes`
  - rerun only the audits still relevant to those changes; do not rerun spec/process review automatically
- `docs polish with no normative impact`
  - no automatic external re-audit unless the change touches a normative/process surface

## Logging rules

Maintain a dedicated implementation log for this refactoring cycle.

Log requirements:

- record package start;
- record local acceptance checks;
- record review rounds and final PASS;
- record final commit for the package;
- record total time to close the package from work start to commit.

Mandatory extra rule:

- if implementation requires a decision or assumption beyond the current cross-skill process model, write it explicitly in the log.

## Commit rules

1. Do not commit partial package work as if the package were complete.
2. After a package reaches acceptance and review PASS, commit it before moving to the next package.
3. Keep commit boundaries aligned with package boundaries whenever practical.
