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

Important rule:

- if a design or implementation decision is explicitly covered by the cross-skill process model, follow that model;
- if a needed implementation decision is not explicitly covered by the model, record it in the implementation log as a decision/assumption beyond the current process specification.

## Package execution rules

1. Execute one work package at a time.
2. Do not mix Package 1 and Package 2 work in one implementation pass.
3. Do not preserve legacy candidate-backlog behavior just to ease intermediate transitions.
4. Prefer a direct rewrite to the new model over temporary compatibility shims.

## Acceptance rules

Before a package is considered done, verify all applicable acceptance conditions from [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md).

For docs/text packages:

- all touched docs must be internally consistent;
- quick paths, references, templates, and surrounding docs must not drift apart;
- no wording may reintroduce candidate-first or `feature-discovery` mental models.

For runtime packages:

- docs, runtime behavior, and tests must match;
- no removed legacy command or state model may remain in active code paths;
- applicable `format`, `lint`, `typecheck`, and tests must pass.

## Review rules

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

Important:

- only run code/security review after spec/process conformance reaches PASS;
- if later fixes only adjust tests, typing, or non-normative internals without changing process/spec alignment, do not rerun spec review;
- once a review agent returns PASS and is no longer needed, close it immediately.

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
