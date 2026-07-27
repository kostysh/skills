# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260727-1`

## Related Issue

[`issue-20260727-1`](./issue-20260727-1.md)

## Source Artifacts

- [`issue-20260727-1`](./issue-20260727-1.md)
- `Aequitas-ADR/app#264`
- `Aequitas-ADR/app/docs/validation/retrospectives/SL-02-retrospective.md`
- `Aequitas-ADR/app/docs/validation/retrospectives/SL-02-retrospective-matrix.json`
- Operator-approved implementation plan from `Aequitas-ADR/app#264`.

## Objective

Поставить переносимый documentation-only skill, который позволяет провести
пропорциональный доказательный ретроанализ, проверить прежние исправления,
получить согласованный report/matrix, подготовить исполнимый remediation plan и
безопасно передать одобренные шаги в task tracker.

## Assumptions

- `targeted` и `full evidentiary` используют одну причинную модель, но разный
  evidence perimeter.
- Инструменты анализа помогают находить evidence, но не выносят semantic verdict.
- Независимость review достигается отдельным no-fork агентом.
- В portable skill нет GitHub-, Codex- или Aequitas-specific обязательных paths.

## Scope

Включены:

- `skill.yaml`, generated `SKILL.md`, `agents/openai.yaml`;
- три active references;
- supporting issue, plan, implementation log и navigation;
- compiler/check evidence, blind forward-tests и independent audit.

Исключены CLI, scripts, dependencies, registry, project runtime и изменение
артефактов `RETRO-0003`.

## Proposed Changes

- Определить mode selection, capability/substrate/anti-claims и source-closure
  gates в root skill.
- Вынести evidence/causality/deduplication в отдельную reference.
- Вынести report/matrix/remediation-plan contract в отдельную reference.
- Вынести approval/task-routing/readback contract в отдельную reference.
- Добавить supporting docs и evidence выполненных проверок.

## Implementation Steps

1. Создать source bundle и active references без runtime surface.
2. Сгенерировать `SKILL.md`, выполнить portability и instruction-quality checks.
3. Провести четыре blind forward-tests на stable snapshot.
4. Передать stable snapshot независимому `skill-reviewer`.
5. Исправить только доказанные findings и повторить затронутые проверки.
6. Зафиксировать evidence и итоговый статус в implementation log.

## Verification Plan

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/retrospective-analysis`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/retrospective-analysis`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/retrospective-analysis`
- isolated compile в новый каталог `/tmp`;
- root `pnpm format:check`, `pnpm lint`, `pnpm test:ci`;
- blind scenarios:
  - большой cross-repository retrospective;
  - один локальный incident;
  - task-routing до и после approval с duplicate/readback conditions;
  - ошибочный или чрезмерный audit finding;
- independent `skill-reviewer` verdict `PASS`.

## Risks and Side Effects

- Перегруженный skill станет повторением удалённого package: ограничить active
  surface recurring decisions и progressive disclosure.
- Недостаточно строгий skill пропустит evidence/history gaps: защитить
  observation disposition и count reconciliation.
- Создание задач может стать новым generic workflow: task routing применять
  только при явном запросе и после operator approval.
- Blind tests могут превратиться в примеры ожидаемого ответа: передавать только
  scenario inputs и acceptance dimensions, не готовый diagnosis.

## Rollback Plan

Удалить новый skill folder и revert единственного skills commit. Runtime и
существующие skills не изменяются.

## Independent Audit

Audit status: `PASS`

Auditor: independent no-fork agent `retro_method_issue_plan_audit`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- План соответствует issue и source intent: evidence closure, причинность,
  дедупликация, history verification, independently assignable remediation,
  approval gate и idempotent readback.
- Acceptance не ограничена структурными compiler checks.
- Reviewed snapshot SHA-256:
  `85ee9486250e7d34266824bde6e897941610aae3d6bf8016de57c92ae95d47ee`.

Required corrections: отсутствуют.

Final status: `PASS`
