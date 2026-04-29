# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260429-1`

## Related Issue

`issue-20260429-1` - `docs/issues/issue-20260429-1.md`.

## Source Artifacts

- `docs/issues/issue-20260429-1.md`.
- `AGENTS.md`.
- `skill.yaml`.
- Generated `SKILL.md`.
- `references/core-principles.md`.
- `references/verification-loop.md`.

## Objective

Добавить в independent `implementation-discipline` короткую portable heuristic: когда repeated independent validation signals указывают на один defect class, verification расширяется с конкретного symptom на adjacent observable cases before reporting done.

## Assumptions

- `skill.yaml` является source of truth; generated `SKILL.md` не редактируется как primary source.
- Change is behavioral instruction only: no runtime, no templates, no logs, no new reporting fields.
- Heuristic должна работать в разных окружениях: failing tests, reviewer feedback, runtime failure, user-reported reproduction, CI failure.
- Heuristic не должна вводить dossier, audit artifact, stage log, external-review или process runtime dependency.

## Scope

Входит в scope:

- одна concise instruction в `skill.yaml` workflow item `stage-verify`;
- regeneration emitted `SKILL.md`;
- source/generated parity check;
- instruction-quality audit for active guidance change.

Не входит в scope:

- dossier-specific rerun behavior;
- внешние audit workflow rules;
- новые artifacts, templates, checklists, logs, CLI commands или reporting fields;
- изменения references unless regeneration or audit shows the root wording needs supporting clarification.

## Proposed Changes

1. В `skill.yaml` under `sections.workflow[id=stage-verify].steps` добавить step рядом с fixed-bug coverage rule:

   When repeated independent validation signals point to one defect class, expand verification from the specific symptom to adjacent observable cases before reporting done.

2. Если wording в `SKILL.md` после regeneration становится слишком плотным или нечитабельным, скорректировать только source wording в `skill.yaml`, сохраняя смысл и краткость.
3. Не добавлять mandatory artifact or checklist language.
4. Не добавлять cross-skill references; если examples нужны, оставить их generic и environment-neutral.

## Implementation Steps

1. Update `skill.yaml` in `stage-verify` with the repeated-validation heuristic.
2. Run `skill-source-compiler regenerate` for `skills/implementation-discipline`.
3. Review generated `SKILL.md` and `docs/compile-report.md` if compiler updates it.
4. Run source/generated parity checks.
5. Run instruction-quality audit from `skill-source-compiler`.
6. Update this plan or issue only if implementation reveals a materially different source surface.
7. Commit implementation together with generated outputs and any compiler-managed metadata/hash changes.

## Verification Plan

- `skill-source-compiler regenerate` for `skills/implementation-discipline`.
- `skill-source-compiler check` for `skills/implementation-discipline`.
- Text check: `skill.yaml` contains `repeated independent validation signals`, `defect class`, and `adjacent observable cases` in `stage-verify`.
- Text check: generated `SKILL.md` reflects the same heuristic in `Workflow stage: Verify and report with evidence`.
- Portability check: no absolute paths and no dependency on dossier, audit artifact, stage log, external-review, process runtime, or one repository's commands.
- Instruction-quality audit from `skill-source-compiler` confirms outcome-first guidance, no contradiction with smallest sufficient change, and no hidden artifact requirement.

## Risks and Side Effects

- Heuristic can encourage over-broad verification. Mitigation: wording requires repeated independent validation signals and adjacent observable cases in the same defect class.
- Heuristic can conflict with smallest sufficient change. Mitigation: place it in verification stage only and keep implementation-scope rules unchanged.
- Heuristic can be read as a mandatory checklist. Mitigation: do not introduce artifact/reporting fields or checklist language.
- Generated output can drift from source. Mitigation: use `skill.yaml` source-first edit, regeneration, and compiler check.

## Rollback Plan

Revert the implementation commit touching `skill.yaml`, generated `SKILL.md`, `docs/compile-report.md`, and any compiler-managed metadata. Because the change is instruction-only, rollback has no data migration or runtime compatibility step.

## Independent Audit

Audit status: `PASS`

Auditor: Bernoulli, external agent audit, `gpt-5.5` medium.

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes: Проверены root `AGENTS.md`, skill-local `AGENTS.md`, issue, implementation plan, `skill.yaml`, generated `SKILL.md`, `references/core-principles.md`, `references/verification-loop.md` и root implementation plan template. План соответствует issue, идет source-first через `skill.yaml`, предусматривает regeneration generated `SKILL.md`, parity checks, instruction-quality audit, and does not introduce dossier/process runtime dependency or extra artifacts/templates/checklists/logs/fields.

Required corrections: Нет.

Final status: `PASS`
