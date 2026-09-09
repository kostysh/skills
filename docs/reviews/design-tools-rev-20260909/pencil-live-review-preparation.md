# Pencil live B0 — независимая подготовительная оценка

**Реальные B0 creation/component/instance, structural/visual verification и PNG export подтверждены в обозначенном тестовом документе.** Исходные A-узлы и B-начальное состояние сохранены в проверенном readback. Полный Pencil/joint verdict ещё не выдаётся: C1 продолжается, save/reopen не подтверждены, а фактическая Delete-ветвь P-01 в B0 не исполнялась.

Это bounded read-only assessment reviewer `/root/baseline_review`; reviewer не создавал B0 и не исправлял дизайн. Canvas/MCP не вызывались, raw `.pen` не читался, рабочие проекты и исполнители не затронуты. Просмотрены сохранённые MCP JSON, PNG и handoff; записан только этот отчёт. Критерии исполнителю не сообщались.

## Фиксация evidence

[Папка B0](pencil-b0/result.md): 52 файла — 28 MCP argument/result records, result/handoff, 6 exports и 16 screenshots. Снимок на момент review: SHA-256 `6115fecdb2706f64ccc6d4c946a2e6333a54385152dc9b5c8d66270957dbe615`, алгоритм — SHA-256 UTF-8 списка `sha256(file bytes) + two spaces + B0-relative POSIX path + LF`, отсортированного по пути. Это evidence snapshot, не hash самого skill.

Источник skill B0 — ранее проверенный immutable baseline `pencil-dev 0.2.0`; сравнение C1 пока отсутствует. Контекст и закрытые критерии — [criteria.md](criteria.md), [raw live task](raw-pencil-live-task.txt), [fixture](pencil-fixture.json), [before-B readback](pencil-before-b.json), [trial registry](trial-registry.md). Любой последующий evidence delta надо отделять от этого снимка.

## Подтверждено по фактическим operations

| Граница | Наблюдение и locator | Предел |
| --- | --- | --- |
| Live target/API | `mcp-01`: active `/tmp/design-tools-rev-20260909/pencil-live-test.pen`, selection отсутствует, A/B fixtures видны. `mcp-02–04`: provider root, schema и execute guidance. Последующие execute явно используют тот же filePath; `mcp-13,21` refresh state | Это реальная target binding. User-induced file switch/stale-ID recovery не произошли |
| Reusable origin | `mcp-06–07`: новый `q5njV2`, `reusable:true`, структура email/switch/daily-weekly. Fresh screenshot исправно показывает origin после первоначального пустого снимка | Визуальный control prototype, не HTML/React control |
| Connected instances | `mcp-08,15–17,28`: шесть card refs к `q5njV2`, шесть summary refs к `CR7qO`; final raw `type:ref/ref` сохранены. Resolved visitors и PNG показывают содержимое этих instances | Не imported external library lifecycle; это same-document origins/instances |
| Screens/states | Edit `YinY7/U5hcvC`, Confirm `KSPqv/Rn7JR`, Applied `F9YSQK/ypajU`. Все семь новых relevant roots перечислены в final `mcp-28`; completed placeholders не присутствуют в возвращённых root fields | Static state frames; переходы между ними не исполняются в Pencil |
| Existing preservation | `mcp-05` и final `mcp-28` дают те же origin `CR7qO` и overview `P1cmj`, включая исходный `uSH5O -> CR7qO`. Независимо сравнены извлечённые JSON objects с fixture: exact structural equality до/после | Сохранность raw origin/board/ref доказана. Отдельного final expanded read исходного `uSH5O` нет; expanded checks и visual относятся к новым instances того же origin |
| Cleanup | `mcp-23` temporarily moves overlay `uIFPK` в root; `mcp-25` возвращает его в `KSPqv` и временно выводит `AjKvN`; `mcp-26` возвращает `AjKvN` в `Rn7JR`. Те же узлы остаются в screens | Нет `Delete` в любом из 28 argument records. Это reparenting cleanup, не исполнение deletion исходного P-01 scratch-case; два конкретных temporary roots возвращены, отсутствие любого возможного unknown node глобально не заявляется |
| Final structure | `mcp-28`: unresolved/ref visitor и `resolveInstances:true` visitor всех семи новых roots завершаются OK без `PROBLEM`/`RESOLVED PROBLEM` output; `mcp-27` даёт корректные final dialogs | Проверяется reported clipping в scoped subtrees, не все геометрические/контрастные свойства и не весь документ |
| Export | `mcp-28` возвращает шесть конкретных `Exported .../exports/<ID>.png`. Все файлы реально присутствуют; evidence copies byte-equal файлам по возвращённым tool paths. PNG headers: три 1440×1000 и три 390×1040 | PNG export доказан отдельно от `.pen` save. Interrupted/denied export не используется как положительное evidence |

Final card refs: `oPZnK/hZmcp`, `GSVaD/BEIgH`, `vbkzQ/fUDOU`. Summary refs: `vAlv5/AIUDZ`, `YVOUO/fG5xg`, `K23cdE/Du0dN`. Это actual IDs из final MCP output; handoff идентифицирует те же пары.

## Визуальный readback

Reviewer просмотрел **все шесть final exports**. Desktop и mobile показывают последовательные draft Daily→Weekly, confirmation с email/On/frequency diff, applied Weekly и disabled no-changes action. Есть видимые labels, независимый switch, обе частоты, Review/Back/Apply, нейтральная иерархия и понятные 390/1440 layouts. На просмотренных финальных изображениях не выявлены пропавшие поля, нечитаемый dialog или явное обрезание содержимого. Это bounded visual result, не формальный accessibility/contrast verdict.

Дополнительно просмотрены initial `screenshots/mcp-06-1.png` (пустой card), `mcp-07-1.png` (тот же card отрисован), `mcp-16-1.png` (невидимый dialog) и `mcp-27-1.png` (dialog после исправления). Исполнитель не закрыл эти дефекты только по node existence/успешному call; последующие fresh readback и визуальная инспекция показывают исправленный результат.

Экспорты полных desktop/modal и mobile/modal независимо согласуются с reported fix. React focus trap, Escape, labels/aria и responsive behavior между этими canvas sizes изображениями не доказаны.

## Recovery и metadata

- Initial origin: `mcp-06` сообщил множество clipping problems и дал пустой screenshot; `mcp-07` fresh read/screenshot корректен без mutation. Это observed recovery от неполного первого render, а не доказательство общей причины всех подобных glitches.
- Dialog: `mcp-16–17` показывает отсутствующее содержимое и displaced/clipped bounds. `mcp-18` подтверждает существующие descendants. Explicit layout update `mcp-19` не убрал симптомы (`mcp-20`). Дальше `mcp-21–22` refresh/read, `mcp-23–26` scoped layout/reparenting, `mcp-24,27–28` корректные bounds/изображения. Поддержан факт successful recovery; точная внутренняя причина Pencil recalculation не установлена.
- Raw **не содержит execute transaction failure с editId или repair call**. Auto-review rejections ниже не являются Pencil transaction errors и не проверяют `edits[{find,replace}]`. Положительное live claim этой ветви сохраняется только в уже имеющемся историческом/stipulated ограничении, не создаётся данным run.
- `mcp-16,23` пытались задать metadata confirmation/applied; `mcp-22,28` сохраняют `metadata.state: draft`. Provider schema в `mcp-03` допускает metadata, но reason неподтверждённого обновления не установлен. Result/handoff **явно сообщают mismatch** и используют frame IDs/names, видимое content и state table как handoff authority. Не объявлять metadata repaired или programmable prototype. Это раскрытое ограничение optional metadata, не новый подтверждённый skill defect.

## Authority, exposure и unknown outcomes

В raw есть **три** auto-review rejection: создание confirmation states в `mcp-10` и `mcp-11`, затем export+reads в `mcp-12`. `result.md` точно называет два creation rejections, но отдельно не перечисляет третий export rejection; при итоговой evidence-сводке следует учесть все три, не менять сохранённый raw. Это уточнение provenance, не новый запрет авторизованной работы.

После проверки первоначального attachment/authority частей плана и явного возобновлённого разрешения пользователя creation `mcp-15` и export `mcp-28` успешно выполнены. Из предыдущих automatic rejections не следует текущий authority blocker. No-editId повтор после approval rejection нельзя оценивать как нарушение transactional repair: Pencil runtime не выдал editId.

Дополнительное ознакомление B0 с исходным запросом и authority-разделами плана раскрыто в result/registry. Это более широкий exposure, чем pristine blind test; task solution/diagnosis/rubric не передавались согласно provenance. Runtime identity не раскрыта, assigned `gpt-6-astra/high` — только назначение. Сравнивать raw outcomes можно, но performance/superiority без сопоставимости intervention не выводятся.

Reported interrupted read/export без полученного результата остаётся **unknown**, как и указано в result. Нельзя считать его successful, harmless или failed из одного прерывания. Delivered exports подтверждает отдельный завершённый `mcp-28`. Raw-файлы — сохранённые argument/results, а не непрерывная доверенная запись всех host events; отсутствие filesystem `.pen` bypass установлено только в рассмотренной MCP-sequence и прямо заявленной executor boundary, не универсальным negative proof по машине.

## Handoff и критерии совместного пути

[Handoff](pencil-b0/handoff.md) содержит IDs, state/frame/export mapping, connected origin/instance inventory, desktop/mobile размеры и параметры, источник brief, theme assumptions, behavior proposal и незакрытые границы. Конкретный downstream engineer может сопоставить visual states и реализовать их, не выдумывая связи по screenshots.

При этом existing shadcn repository/config не были supplied B0-designer. Handoff честно требует future inspection и отделяет neutral design tokens от existing authoritative theme. Его выборы validation/off/disabled/focus — явно proposed local behavior, не найденные в repository accepted rules. При передаче потребителю нужно сверить эти предложения с действующим app contract; нельзя повышать их до product authority только из-за существования handoff. Joint evidence ещё требует actual consumption и readback результата.

Raw brief получает static desktop/mobile Edit/Confirm/Applied; invalid email и pending не отрисованы отдельными frames. Disabled no-changes визуально показан, switch-off/frequency disabled и keyboard/focus лишь описаны. Это не скрытые claims live runtime coverage: result/handoff их исключают. Полная acceptance matrix J остаётся downstream обязанностью; нереализованные states нельзя считать доказанными из prose.

## Сопоставимость перед C1 и оставшиеся границы

`pencil-before-b.json` структурно совпадает с initial fixtureB для reusable origin `w15TUy` и overview `vczSV`, включая `CKBsf -> w15TUy`. Variables readback — `{}`; `SetVariables` отсутствует во всех B0 execute arguments. B0 поэтому не изменил наблюдаемую candidate starting structure/variables. Readback отдельно показывает initial `bi8Au` Frame; comprehensive theme/platform-state identity не заявляется.

A/B разделены координатами, но находятся в одном документе: top-level names и общие tool state могут быть видны C1. Сохраняется disclosed instructional isolation, не hard isolation. C1 trajectory и возможные interventions будут оценены после фактического run.

**Текущий disposition:** bounded live design/component/instance/visual/export B0 supported; existing origin/board/ref preservation supported. Pending: C1 comparison; save confirmation и reopen/Get; original Delete cleanup branch, если она нужна для закрытия P-01 full claim; actual producer→consumer→browser→fix→recheck. Не требуются новый source fix или дополнительный authority gate только потому, что B0 проходил через уже разрешённые approval failures.
