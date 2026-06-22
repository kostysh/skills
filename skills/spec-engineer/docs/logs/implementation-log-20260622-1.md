# Implementation Log

## Language

Russian.

## Log ID

`implementation-log-20260622-1`

## Related Issue

Нет отдельного issue; изменение выполнено по прямому запросу оператора применить матрицу `.temp/ponytail-skill-matrix-20260622.md`.

## Related Plan

Нет отдельного implementation plan.

## Operator Request

Последовательно применить предложения из временного отчета по использованию ponytail-подходов без переноса оригинальных ponytail skills.

## Summary

В `spec-engineer` добавлен guard против future-only substrate: спецификации не должны требовать scaffolds, wrappers, config surfaces или extension points без текущего поведения, принятой архитектуры или named dependent capability.

## Changes Made

- `skill.yaml`: добавлен no-future-substrate guidance и source version bump.
- `references/methodology.md`: добавлен future-substrate checkpoint и AI-agent failure control.
- `references/anti-patterns.md`: добавлен anti-pattern `Future-substrate requirements`.
- `SKILL.md`, `docs/compile-report.md`: будут обновлены регенерацией.
- `docs/README.md`: добавлена ссылка на этот лог.

## Decisions

- Не добавлять новый template или отдельную reference file, потому что правило является уточнением уже существующего capability/substrate workflow.
- Не запрещать честный substrate: он допустим, если явно связан с dependent capability или принятой архитектурой.

## Verification Performed

Выполнено:

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/spec-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/spec-engineer`

## Deviations From Plan

Нет.

## Side Effects

Ожидаемый побочный эффект: агенты будут чаще отклонять specs, которые создают implementation substrate "на будущее". Риск чрезмерного отказа ограничен исключениями для текущего поведения, принятой архитектуры и явно связанного support scope.

## Follow-up

После всех skill commits будет выполнен отдельный no-fork audit на риск деструктивного влияния на процессы и цели целевого приложения Aequitas ADR.

## Final Status

PASS после успешной регенерации и проверки.
