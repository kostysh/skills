# Implementation Log

## Language

Русский.

## Log ID

`implementation-log-20260610-1`

## Related Issue

Нет отдельного issue; реализация выполнена по прямому запросу оператора.

## Related Plan

Нет отдельного плана в `docs/issues/`; использован текущий рабочий план в сессии.

## Operator Request

Оператор попросил модифицировать `skills/shadcn`, чтобы скилл ориентировал все проекты на Base UI/basecn, а не на старый Radix, и реализовать ранее предложенное направление.

## Summary

Скилл переведен на Base UI-first политику: новые shadcn UI-задачи должны проверять Base UI project context, использовать Base UI docs, останавливать добавление нового UI в Radix-проектах до решения о миграции/legacy maintenance и проверять измененные UI-файлы на Radix-следы.

## Changes Made

- `skill.yaml` — обновлены описание, версия `0.1.2`, workflow, gotchas, policies и активные references.
- `fragments/overview.md` — добавлен Base UI gate, команды `--base base`, `docs --base base --json`, Radix migration stop и сокращен root quick reference.
- `references/base-ui-policy.md` — добавлена новая активная политика Base UI invariant, basecn registry usage, migration gate и verification gate.
- `references/rules/base-vs-radix.md` — переписан из симметричного сравнения Base/Radix в Base UI API checks с legacy Radix markers.
- `references/cli.md` — обновлены `init --base`, `docs --base`, `info --json`, Base UI preset/migration guidance.
- `references/customization.md` — заменены Radix-примеры на Base UI и убран `asChild` из wrapper example.
- `references/rules/forms.md` — обновлена ссылка на актуальные Base UI API checks.
- `evals/evals.json` — добавлены проверки Base UI dialog, Radix migration gate и link-button через `buttonVariants`.
- `agents/openai.yml` — краткое описание уточнено как Base UI.
- `SKILL.md` и `docs/compile-report.md` — регенерированы через `skill-source-compiler`.
- `docs/README.md` и этот лог — добавлена supporting navigation/history.

## Decisions

- Base UI закреплен как invariant, а не как предпочтение в тексте. Это нужно, чтобы acceptance не мог пройти без реальных проверок config/docs/source.
- `basecn.dev` описан как optional registry для дополнительных компонентов, а не как замена официального shadcn Base UI режима.
- Radix не удален полностью из скилла, потому что агент должен распознавать legacy Radix проекты и корректно останавливать новые UI-правки до решения о миграции.
- Детальные API-различия сокращены и привязаны к `shadcn docs --base base --json`, потому что часть старых Base/Radix утверждений уже расходилась с текущими shadcn Base docs.

## Verification Performed

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/shadcn` — PASS.
- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs regenerate .` из `skills/shadcn` — PASS.
- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs check .` из `skills/shadcn` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/shadcn` — PASS.
- `npx shadcn@latest init --help` — подтвердил наличие `--base <base>`.
- `npx shadcn@latest docs button --base base --json` — подтвердил Base UI docs URL.
- Absolute-path portability search over `skills/shadcn` — PASS, machine-specific paths not found.
- `node -e "JSON.parse(...evals/evals.json...)"` — PASS.
- `git diff --check` — PASS.
- Diff review and instruction-quality audit — PASS: instructions are outcome-first, Base UI precedence is explicit, Radix has a stop/legacy path, references have concrete triggers, and validation gates are observable.

## Deviations From Plan

Во время первой регенерации `SKILL.md` превысил recommended max size. Вместо повышения лимита root overview был сокращен: подробные команды оставлены в `references/cli.md`, а дублирующий список references удален из fragment.

## Side Effects

- Скилл теперь будет чаще останавливать работу в Radix-проектах и запрашивать решение о миграции или explicit legacy maintenance.
- Старые ожидания eval для Radix dialog заменены на Base UI; это намеренное изменение продуктовой политики скилла.

## Follow-up

- При следующей реальной миграции проекта можно добавить отдельный migration playbook/reference, если текущего migration gate окажется недостаточно.
- Если shadcn CLI изменит `--base` или Base docs API, обновить `references/cli.md` и `references/rules/base-vs-radix.md` вместе.

## Final Status

PASS
