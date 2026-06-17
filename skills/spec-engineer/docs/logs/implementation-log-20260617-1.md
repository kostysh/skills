# Implementation Log

## Language

Русский.

## Log ID

`implementation-log-20260617-1`

## Related Issue

Нет отдельного issue. Запрос оператора был прямой правкой скила.

## Related Plan

Нет отдельного плана.

## Operator Request

Оператор согласовал лаконичное предложение: BDD должен использоваться при разработке спецификаций только тогда, когда это полностью обосновано и эффективно. Требование: внести изменение, закоммитить и запушить.

## Summary

В `spec-engineer` добавлено правило выбора BDD/Gherkin как условной формы представления поведения, а не обязательного ритуала. Методология уточняет, когда сценарии усиливают спецификацию и когда вместо них нужно выбрать invariants, decision tables, state models, contracts, schemas или measurable constraints.

## Changes Made

- `skill.yaml` - поднята `source-version` до `0.2.4`, добавлена `BDD fit policy`, усилен gotcha про Gherkin/BDD scenarios, добавлен этот log в supporting surface.
- `references/methodology.md` - добавлен раздел `BDD/Gherkin scenario fit` с условиями применения и запретами на substrate-only сценарии.
- `SKILL.md` - регенерирован из source bundle.
- `docs/compile-report.md` - регенерирован компилятором.
- `docs/README.md` - добавлена ссылка на этот implementation log.

## Decisions

- Не добавлять отдельную BDD-reference: изменение достаточно короткое и относится к representation-fit правилам.
- Не делать BDD обязательным шаблоном: сценарии должны использоваться только когда они уточняют actor-trigger-response behavior, guards, failure paths, continuity или acceptance risk.
- Сохранить приоритет atomic normative requirements, negative acceptance, falsifiers и verification map над примерами и Gherkin-формой.

## Verification Performed

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/spec-engineer` - PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/spec-engineer` - PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/spec-engineer` - PASS.
- Portability grep for common local absolute path prefixes - PASS, совпадений нет.
- `git diff --check` - PASS.
- Instruction quality audit against `skill-source-compiler` audit stage - PASS: правило outcome-first, не дублирует существующие sections, не создает hidden mandatory reference, сохраняет validation/stop-rule discipline и right-sized freedom.

## Deviations From Plan

Нет.

## Side Effects

Изменение затрагивает только `spec-engineer` documentation/source bundle и generated compiler-owned files. Runtime или CLI behavior не менялись.

## Follow-up

Нет обязательного follow-up.

## Final Status

PASS.
