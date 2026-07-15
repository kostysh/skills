# Журнал реализации: сквозная способность shadcn

- **Log ID:** implementation-log-20260716-1
- **Дата:** 2026-07-16
- **Статус:** INDEPENDENT PASS
- **Baseline snapshot:** `32c8301875fb0481731d1e26db032326f27b8bb1ab1a653ba34ef5bc9e14b803`
- **Baseline verdict:** independent `FAIL`
- **Capability snapshot:** `f6d4917a0867994c006bd16431599f3e4b2981280ca6b2ffafdc153a60a90f16` (17 файлов вне `docs/logs/*`)
- **Forward-test evidence SHA-256:** `1df3ad515b9d1cc77a779b7e3d058e4d1449465f9526efb80fe2a0e247bf3439`
- **Post-review supporting snapshot:** `c65d6ab1f9c76171bbcbaeabc57927020e817291ad8064e2a450b8571076b68b`

## Цель

Сделать документационный скил способным провести агента от реального project context через безопасное изменение shadcn-компонентов до честного отчёта с project и interaction evidence. Compiler output, Markdown, CLI exit и eval definitions не считаются доказательством работающего UI.

## Authority и границы

Применён приоритет: ограничения оператора → репозиторные инструкции → инспектированный проект и установленный source → текущие CLI help и официальная документация → локальные примеры.

Скил не владеет продуктовой art direction, React/framework runtime semantics, test strategy или формальным UX/accessibility verdict. Эти решения передаются профильным скилам через явный interop contract.

## Remediation matrix

| Baseline finding | Изменение | Evidence | Статус |
| --- | --- | --- | --- |
| P1: активный контракт нарушал operator-owned Base UI boundary | Удалена альтернативная primitive-library ветка из source, active, eval и supporting surfaces | Full-folder scan: 0 совпадений; independent re-audit | verified |
| P1: фиктивная automatically-injected context capability | Добавлен обязательный исполнимый `info --json`/fallback workflow и blocked state | Blind missing-context case и independent re-audit | verified |
| P2: устаревший CLI/preset contract | CLI reference переведён на `apply`, `preset`, live help и безопасный preview/approval workflow | CLI 4.13.0 help, preset forward-test и independent re-audit | verified |
| P2: отсутствовал interop/output contract | Добавлены owners для design, React, framework, TypeScript, tests и UI review; определён completion report | Boundary forward-test и independent re-audit | verified |
| P2: конфликтовали API examples и eval oracle | Согласованы form/control semantics, InputGroupButton и eval expectations | Official docs, form forward-test и independent re-audit | verified |
| P3: broken backlinks | Удалены ошибочные ссылки и добавлена package-level link verification | Package link checks и independent re-audit | verified |
| P2: forward-test summaries нельзя было независимо проверить | Добавлен portable evidence bundle с normalized raw prompts/outputs, fixture hashes, command/browser artifacts, rubrics и limits | Evidence SHA и independent re-audit | verified |

## Изменённая поверхность

- Source bundle и generated root contract.
- CLI, customization, composition, forms, icons и styling references.
- UI metadata и forward-test scenarios.
- Supporting navigation и этот implementation log.

Сравнительные policy/API references и недостижимая MCP-документация удалены вместо сохранения неактивного substrate. Package-local runtime и новый test framework не добавлялись: повторяемая детерминированная операция отсутствует.

## Author self-check

Статус `ready-to-regenerate`:

- outcome, success criteria, side-effect limits, evidence boundary и final output contract заданы явно;
- precedence, fallback и stop rules не оставляют скрытой injected-context или overwrite ветки;
- обязательные references имеют конкретные triggers и достижимы из `SKILL.md`;
- CLI workflow описывает только реально подтверждённые команды, а workflow stages не выданы за shipped commands;
- runtime не добавлен: у скила нет отдельной детерминированной машинной операции, которую следовало бы реализовать кодом;
- scaffold, generated source, CLI exit, compiler check и статический JSX прямо исключены как достаточные критерии UI-успеха.

Это author-side evidence, не независимый verdict.

## Structural и portability evidence

- `skill-source-compiler lint` — PASS.
- `skill-source-compiler check` — PASS.
- `quick_validate.py` — PASS.
- `jq empty evals/evals.json` — PASS.
- `git diff --check -- skills/shadcn` — PASS.
- Активные локальные Markdown-ссылки: PASS для `SKILL.md` и шести references.
- Полный поиск запрещённой оператором терминологии в `skills/shadcn`: 0 совпадений.
- Поиск machine-specific absolute paths: 0 совпадений.
- Изолированная компиляция во временный каталог, повторные `check` и `quick_validate.py`: PASS.

## Актуальность CLI и guidance

На текущем shadcn CLI `4.13.0` проверены live help и JSON surfaces для `info`, `docs`, `add`, `apply` и `preset`. Подтверждены preview-флаги `add --dry-run|--diff|--view`, preset subcommands `resolve|decode|url` и частичное применение `apply --only theme,font`.

Официальная документация использовалась как внешняя актуальная authority для Base UI default, CLI, Button, Input Group, Field и Toggle Group. В активных примерах сохранён fallback к inspected installed source при недоступности сети.

## Disposable-project evidence

В отдельном Vite-проекте выполнены:

- `shadcn init --template vite --preset nova --yes`;
- `shadcn info --json` и `shadcn docs button dialog --json`;
- `shadcn add dialog --dry-run`, затем реальное добавление;
- production build после интеграции Dialog;
- Chromium smoke: open, dialog role/title/description, Escape close, focus return, console errors = 0.

Эта проверка подтверждает один реальный init/add/compose/build/interaction path, но не все registry items или браузеры.

## Blind forward-tests

Агенты получили только тестовый prompt и fixture, без ожидаемого диагноза или исправления.

1. **Missing context — PASS.** Агент не придумал aliases, icons или paths, не изменил файлы, запросил project root и назвал необходимые build/interaction checks.
2. **Safe positive flow — PASS.** В Vite fixture агент выполнил `info`, `docs`, `add select --dry-run|--view`, сохранил existing source, добавил Theme Select и прошёл typecheck, build, lint изменённых файлов и browser smoke. Проверены Light/Dark/System, mouse и keyboard selection, persistence, focus return и 0 console errors. Общий lint остался красным только из-за заранее существовавшей ошибки в нетронутом `button.tsx`; это ограничение сообщено честно.
3. **Preset preservation — PASS.** На CLI 4.13.0 агент выполнил `info --json`, `preset resolve --json`, `preset decode a2r6bw`, `preset url` и `apply --help`; выбрал `apply a2r6bw --only theme`, не запускал mutation и подтвердил, что broad apply затронул бы лишние font/icon choices.
4. **Interop boundary — PASS.** Агент передал product-wide hierarchy/motion skill `frontend-design`, formal accessibility verdict — `web-ui-reviewer`, оставив `shadcn` владельцем library-specific implementation. Scaffold и token sheet не были выданы за готовый redesign.
5. **Form semantics — PASS.** На свежем fixture агент использовал current Field, Switch и Input Group contracts, проверил независимость трёх switches, invalid/valid email outcomes и embedded search action через build и browser smoke.

Normalized raw prompts/outputs, fixture manifest/file hashes, command readback, browser artifacts, rubrics, comparisons и evidence limits сохранены в [forward-test evidence](../forward-tests/forward-test-evidence-20260716-1.md).

## Независимый review

Read-only re-audit через `skill-reviewer` проверил snapshot `f6d4917a0867994c006bd16431599f3e4b2981280ca6b2ffafdc153a60a90f16` и evidence SHA-256 `1df3ad515b9d1cc77a779b7e3d058e4d1449465f9526efb80fe2a0e247bf3439`.

Вердикт: **PASS**, P1/P2/P3 findings отсутствуют. Reviewer независимо подтвердил source/generated parity, live CLI 4.13.0 contract, official-doc alignment, portability, all-package links, constraint scan, isolated compile, Markdown rendering, byte-identical evidence copy и применимость blind cases к reviewed instruction behavior. PASS не расширяет раскрытые browser, fixture, backend, preset-mutation или future-version limits.
