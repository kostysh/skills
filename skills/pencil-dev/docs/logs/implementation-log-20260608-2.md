# Implementation Log

## Log ID

`implementation-log-20260608-2`

## Related Issue

None.

## Related Plan

None.

## Operator Request

Изучить онлайн-документацию Pencil.dev и добавить в `pencil-dev` четкие правила выбора между Pencil MCP и CLI.

## Summary

Уточнена активная инструкция `pencil-dev`: выбор инструмента теперь основан на источнике истины. MCP используется для live canvas и точечных editor-backed операций; CLI используется для saved-file/headless/export/batch/automation сценариев.

## Changes Made

- `skill.yaml` — поднята версия до `0.1.1`, добавлены правила выбора MCP/CLI, стадия защиты open-file state, gotcha и policy для source-of-truth.
- `fragments/overview.md` — добавлен раздел `MCP vs CLI`.
- `docs/README.md` — будет обновлен навигацией на этот журнал.
- `SKILL.md` и `docs/compile-report.md` — будут перегенерированы через `skill-source-compiler`.

## Decisions

- Не делать MCP “всегда предпочтительным”: CLI официально поддерживает headless agent mode, export, batch и interactive shell, поэтому правильная граница — live canvas vs saved-file automation.
- Не добавлять официальную документацию как required reference, чтобы скил оставался переносимым; внешние docs зафиксированы как источник анализа, а не runtime dependency.
- Не смягчать запрет на raw `.pen` access в скиле: для агентского runtime скил продолжает требовать Pencil tools вместо чтения/патча файла напрямую.

## Verification Performed

- Изучены официальные страницы Pencil.dev:
  - `https://docs.pencil.dev/for-developers/pencil-cli`
  - `https://docs.pencil.dev/getting-started/ai-integration`
  - `https://docs.pencil.dev/getting-started/installation`
  - `https://docs.pencil.dev/getting-started/authentication`
  - `https://docs.pencil.dev/troubleshooting`
  - `https://docs.pencil.dev/core-concepts/pen-files`
  - `https://docs.pencil.dev/core-concepts/import-and-export`
- Ran `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/pencil-dev`.
- Ran `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/pencil-dev`.
- Searched `skills/pencil-dev` for common absolute path patterns.
- Performed instruction quality audit against `skill-source-compiler` workflow stage: outcome-first rules, clear MCP/CLI precedence, side-effect limits, validation gates, fallback behavior, stop rules, and portable active surface.

## Deviations From Plan

None.

## Side Effects

Изменены только файлы `skills/pencil-dev`.

## Follow-up

Пересматривать правила при изменениях Pencil MCP/CLI command surface.

## Final Status

PASS.
