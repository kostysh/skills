# Implementation Log

## Log ID

`implementation-log-20260610-1`

## Related Issue

None.

## Related Plan

None.

## Operator Request

Обновить `pencil-dev` по урокам рабочей сессии: live `.pen` edits должны идти через Pencil MCP, CLI agent не должен заменять direct MCP, MCP-редактирование должно начинаться с editor state/schema, foundation/reference frames нужно убирать после использования, а многофреймовые mockup-файлы должны иметь README с назначением фреймов.

## Summary

Скилл получил более жесткие правила source-of-truth для live editor, запрет CLI agent edits при доступном direct MCP, explicit MCP setup order, fallback диагностику при `wrong .pen file`, cleanup copied reference frames, README/frame inventory handoff rule и напоминание, что Pencil mockups являются design substrate, а не runtime delivery gate.

## Changes Made

- `skill.yaml` — версия поднята до `0.1.3`; обновлены Start here, surface selection, open-file protection, review/report, gotchas и policies; добавлен workflow stage `Maintain design handoff clarity`.
- `fragments/overview.md` — сжаты и уточнены правила MCP vs CLI, direct MCP для live edits, saved-file CLI export, MCP schema load order и fallback диагностика.
- `SKILL.md` и `docs/compile-report.md` — регенерированы из source bundle.
- `docs/README.md` — добавлена ссылка на этот implementation log.

## Decisions

- Изменение сделано в source bundle, а не только в generated `SKILL.md`, чтобы следующая регенерация не стерла поведение.
- Правила оставлены в root skill без новых references, потому что пользователь просил короткие операционные правила, а не расширенную теорию Pencil.
- CLI export оставлен допустимым только после ясной saved-file boundary; CLI edit для live editor остается запрещенным без явного изменения source of truth пользователем.
- Mockup README описан как handoff artifact, но не как proof of runtime delivery.

## Verification Performed

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/pencil-dev` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/pencil-dev` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/pencil-dev` — PASS.
- `git diff --check` — PASS.
- Absolute-path portability search over `skills/pencil-dev` — PASS, machine-specific paths not found.
- Active `SKILL.md` grep check — PASS, live MCP, schema load, wrong-file fallback, cleanup, README, snapshot, and runtime-delivery rules are present.
- Instruction quality audit — PASS: rules are outcome-first, source-of-truth precedence is explicit, CLI fallback has stop conditions, validation gates are observable, and no warning remains in `docs/compile-report.md`.

## Deviations From Plan

First regenerate exceeded `recommended-skill-md-max-bytes`; overview text was shortened instead of raising the limit.

## Side Effects

Only `skills/pencil-dev` files were changed.

## Follow-up

If future Pencil MCP tool names or CLI behavior changes, update the MCP setup order and CLI fallback rules together.

## Final Status

PASS.
