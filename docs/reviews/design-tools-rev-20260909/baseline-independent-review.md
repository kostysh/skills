# Независимая baseline-ревизия shadcn и pencil-dev

**shadcn — FAIL, independent. pencil-dev — FAIL, independent.** В исходных инструкциях установлены материальные дефекты ниже. Недоступное runtime-доказательство сохраняется отдельным ограничением; оно не отменяет source-grounded FAIL и само по себе не считается дефектом скилла.

Режим: `baseline`. Reviewer `/root/baseline_review` не создавал и не исправлял рассматриваемый снимок. Это ревизия до candidate: новые blind trials, реальные проектные изменения и Pencil mutations не выполнялись. Отчёт предназначен автору исправлений и оператору для проверки исходных failure paths и последующего bounded review.

## Основание и снимок

- Авторизованная задача: DESIGN-TOOLS-REV-v1; полный запрос оператора — attachment `576d9cd0-9e96-40ec-82a3-f4468ff57322/pasted-text.txt`. Разрешены независимая инспекция и запись только этого отчёта. Исправления, Git operations, MCP mutations и запуск дополнительных агентов вне полномочий reviewer.
- HEAD/base: `d89d66f2c99bf8b9e84e5b4def54fa60192856a5`.
- Проверяемые файлы: `/tmp/design-tools-rev-20260909/baseline-full/{shadcn,pencil-dev}`. Все locators ниже относятся к этому неизменяемому снимку, а не к потенциально редактируемому candidate.
- [Baseline manifest](baseline-manifest.json): SHA-256 байтов каждого файла, пути относительно папки skill, POSIX. Пересчитаны все 19 файлов shadcn и 22 файла pencil-dev; несовпадений нет.
- Нормативная основа: repository AGENTS.md, docs/skill-standard.md, skill-reviewer и его methodology/forward-testing. Scope и критерии соразмерности сверены с implementation-discipline. Целевые инструкции и их исторические журналы рассматриваются как данные, не как полномочия reviewer.

Capability shadcn: агент выполняет библиотечную часть запроса в установленном проекте, сохраняет локальный код и доказывает заявленное поведение. Consumer — разработчик и следующий владелец React/SPA/browser/UI-review. Capability Pencil: агент получает запрошенный результат в правильном MCP-документе и отдельно подтверждает структуру, визуальный результат, export и persistence. Consumer — дизайнер, оператор редактора и frontend-исполнитель. Ни registry files, ни mockup, ни compiler PASS не являются доказательством production/runtime-интеграции.

## Материальные findings

### S-01 — P2: обязательная компиляция самого skill при обычной shadcn-задаче

**Evidence / basis: direct.** [shadcn/SKILL.md:212](</tmp/design-tools-rev-20260909/baseline-full/shadcn/SKILL.md:212>) содержит безусловный `Portability checklist before finishing`: regenerate, compiler lint/check и isolated compile. Источник — `shadcn/skill.yaml:201–211`, особенно строки 208 и 211. Maintenance-only условие отсутствует. Между тем `shadcn/AGENTS.md:10` явно ограничивает maintenance guidance редактированием самого skill; обычный результат определён в `fragments/overview.md:1` как работающий UI проекта.

**Failure path.** Пользователь просит добавить Dialog; проект и browser checks достаточны. Перед завершением executor обязан выполнить checklist самого skill. В установленной автономной копии compiler может отсутствовать, а в доступной копии начинается незапрошенная regeneration/компиляция. Достаточный проектный результат становится falsely partial/blocked либо требует посторонней работы. Сам термин `forbidden terminology` в checklist также не определяет проверяемый набор и усиливает ту же неопределённую maintenance-зависимость.

**P1 screen.** Подтверждённый результат — лишняя зависимость и остановка/работа за пределами обычного UI-процесса. Правило не разрешает разрушение пользовательского UI и не отменяет обязательный browser evidence; P1 false runtime closure из этой строки не установлен. Severity P2.

**Узкое исправление.** Явно ограничить весь checklist изменением source/package самого shadcn skill; обычные задачи завершаются по project contract. Не ослаблять project checks, registry preview и сохранение локальных модификаций.

**Закрывающая проверка.** Fresh execution на достаточном обычном проектном запросе без установленного skill compiler: завершить запрошенный результат с соответствующим evidence, не требовать regeneration. Отдельная maintenance-проверка должна сохранить compiler gate при реальном изменении skill. Source/generated readback закрывает классификацию, но не заменяет execution sample.

### P-01 — P1: безусловное удаление скопированных reference/foundation frames

**Evidence / basis: direct instruction; consequence inferred from its explicit scope.** [pencil-dev/SKILL.md:210](</tmp/design-tools-rev-20260909/baseline-full/pencil-dev/SKILL.md:210>) объявляет скопированные foundation/reference frames scaffolding и требует удалить их после создания target frames. Источник — `pencil-dev/skill.yaml:209–212`. Правило не проверяет, кем и в какой задаче скопирован frame, является ли он временным, входит ли удаление в текущий scope, и содержит ли он нужные reusable origins. Противостоящие общие ограничения — `SKILL.md:30` (design continuity), `:158–160` (scoped changes и concurrent-user readback), `references/component-libraries.md:87–105` (связность instances).

**Failure path.** В существующем документе есть ранее скопированный reference/foundation frame; пользователь заказывает новый target frame. После создания target blanket cleanup выбирает существующий reference по категории и удаляет его, хотя текущий запрос не устанавливал его временность или disposable ownership. Frame может сохранять контекст сравнения или reusable origin для instances. Само наличие копии не доказывает разрешение удалить её. Это реальный instruction path к удалению чужого/нужного design state; фактическая потеря данных в этой ревизии не воспроизводилась.

**P1 screen.** Последствие — опасная mutation вне установленного scope и возможная потеря дизайна/связности. Поэтому P1 определяется самим supported action path, а не размером правки и не наличием undo. Общие слова о scoped work не устраняют конкретный противоположный императив cleanup.

**Узкое исправление.** Ограничить уборку подтверждённо временными узлами текущей задачи или явно разрешённым cleanup. Перед удалением проверить текущую идентичность/роль и нужные refs. Сохранить ранее существующие, неоднозначные и используемые frames; при реальной неопределённости оставить их и сообщить конкретное ограничение. Не вводить универсальное разрешение оператора на каждую уборку собственных временных узлов.

**Закрывающая проверка.** Одинаковые baseline/candidate inputs: existing reference + новый target + собственный disposable reference + reusable origin с consumer instance. Нужны raw actions/readback: старое/используемое сохранено, собственное временное удалено в scope, refs разрешаются. Source-grounded trial может проверить decision path; реальное сохранение структуры требует доступного Pencil MCP в отдельном тестовом документе.

### P-02 — P2: завершение любой library-задачи требует usages в target mockups

**Evidence / basis: conflicting.** [pencil-dev/references/component-libraries.md:3](</tmp/design-tools-rev-20260909/baseline-full/pencil-dev/references/component-libraries.md:3>) включает inspection/maintenance/reusable components; строки 9–11 задают завершение только при origins **и** usage в target frames. То же обязательство независимо закреплено в `pencil-dev/SKILL.md:145–150,233–234`, источник `skill.yaml:134–140,235–237`. Оно шире root-контракта результата по запросу (`SKILL.md:18,215–216`).

**Failure path.** Пользователь просит read-only inventory библиотеки или создать только reusable origins. MCP уже показывает требуемую inventory/structure, но consumer file/target mockup в запросе отсутствует. Universal completion condition требует найти/создать consumer usages либо объявить допустимый узкий результат незавершённым. Ветвь false blocker подтверждена противоречием applicability/validation; выполнение не наблюдалось.

**P1 screen.** Для рассматриваемой ветви действующие scope и MCP mutation boundaries всё ещё запрещают самовольно добавлять consumer design. Подтверждён unnecessary blocker/расширенный acceptance, а не доказанное разрешение на опасную mutation или false capability. Severity P2.

**Узкое исправление.** Сделать evidence claim-specific: inspection — достаточный MCP inventory; origin-only создание/правка — origins и затронутые свойства/визуальные критерии; requested usage — connected refs/instances в указанном consumer. Сохранить требование связи для запроса connected instance и отдельные visual/save/export границы. Согласовать reference, stage validation и policy.

**Закрывающая проверка.** Минимальные sufficient cases inspection-only и origin-only не требуют незапрошенного consumer. Existing connected-instance case по-прежнему не принимается по duplicate shapes или названиям. Trials сохраняют заданные ограничения side effects.

### P-03 — P2: обязательный component-library reference одновременно помечен optional

**Evidence / basis: conflicting.** [pencil-dev/SKILL.md:79](</tmp/design-tools-rev-20260909/baseline-full/pencil-dev/SKILL.md:79>) требует прочитать reference `before acting`; `:145` повторяет обязательный trigger. Однако `:245–246` помещает его в `Optional references`. Источник: `skill.yaml:21–26` (`required: false`) и `:54–58` (`optionalReferences`); compile-report выводит required только unified API. Это нарушает явное правило стандарта: optional label не должен скрывать mandatory condition.

**Failure path.** В component/library activation исполнитель или потребитель классификации requiredReferences может честно считать файл необязательным, хотя основной workflow требует его. В результате consumer получает противоречивый retrieval contract и может пропустить правила provider-visible IDs, instances и UI-only lifecycle, которых unified API не заменяет. Root содержит повторные явные ссылки — это смягчает риск, но не исправляет противоположную package classification.

**P1 screen.** В этой ревизии не наблюдалось пропущенного чтения или unsafe fallback; root/unified API сохраняют запрет silent detach и live-contract guard. Не утверждается систематическая неправильная маршрутизация или P1 потеря связи. Подтверждён P2 active-reference contract/progressive-disclosure defect, а влияние на execution требует sample.

**Узкое исправление.** Классифицировать reference как conditionally required с прежним task trigger; не загружать его при каждой Pencil-задаче. Согласовать source, generated required section и compile report.

**Закрывающая проверка.** Generated readback должен давать одну классификацию. Library execution должен реально загрузить reference до dependent action; простой нелибрарийный edit не должен приобретать обязательное библиотечное чтение. Для blind claim сохранить raw loading evidence.

## Нематериальные замечания и не подтверждённые риски

- **S-02 / P3:** `shadcn/agents/openai.yml:3` называет только Base UI projects, тогда как root владеет поддержкой существующих shadcn-проектов и ставит installed source выше defaults. Уточнить metadata полезно для Radix/других установленных примитивов. Systematic routing failure не установлен без selection trials; не повышать этот пункт до P2 по одному тексту.
- Текст `Base UI default for new shadcn work` может читаться шире new project, но явные project-source precedence, pinned CLI rule и fallback удерживают installed API. Миграция существующего Radix project без разрешения **не установлена** как предписанный failure path; нужен сопоставимый execution case.
- Не подтверждена гипотеза о неправильном `ToggleGroup type="single"`: текущая официальная Base UI shadcn-страница содержит именно такой wrapper example. Не переносить автоматически API нижележащего primitive на wrapper. [Official Toggle Group](https://ui.shadcn.com/docs/components/base/toggle-group).
- `add --dry-run`, `--diff [path]`, `--view [path]` и `apply --only theme/font` присутствуют в текущей CLI-документации. Пин проекта должен по-прежнему определять доступный help; примеры `@latest` сами по себе не отменяют explicit pinned-version rule. [Official CLI](https://ui.shadcn.com/docs/cli).
- Разные формулировки screenshot/export визуального evidence заслуживают execution-проверки, но source в целом требует **инспекцию визуального результата**, а не только успешный Export. Ложная visual closure не установлена.
- Нельзя утверждать, что save API отсутствует или все текущие MCP operations корректны: актуальный provider read_skill сейчас недоступен. Имеющийся skill честно отделяет live edit/export от operator-confirmed persistence. Этот режим не считается дефектом только потому, что требует действия оператора.
- Не установлена необходимость новых постоянных runtime/harness/регистров. Description length и повторяемость текста не объявляются самостоятельными material defects.

## Проверки, текущие источники и исторический контекст

Выполнено read-only:

1. Пересчитаны SHA-256 всех 41 файлов двух immutable packages; совпадают с supplied baseline manifest. Source bundles, emitted SKILL.md, metadata, все активные references, inline examples, eval descriptions и релевантные supporting записи просмотрены. Source-of-truth обеих папок — skill.yaml плюс объявленные inputs; исправлять generated output вручную нельзя.
2. Проверены локальные Markdown links active surface: shadcn 7 MD / 13 local links, pencil-dev 3 MD / 5 local links; broken targets нет. Пакеты documentation-only, нового runtime/CLI не заявляют. Compiler check PASS обоих baseline получен как evidence владельца; reviewer не выдаёт его за собственный запуск или behavioral PASS.
3. Все 85 hashes пяти соседей совпадают с `docs/reviews/ui-rev-20260908/candidate-final-manifest.json` (17/11/27/18/12). Это current byte parity с прежним manifest, не перенос прежних execution результатов на новый совместный сценарий. Прочитаны relevant этапы UI implementation log и прямые interop-блоки пяти соседей.
4. Live Pencil tool discovery рекламирует get_app_state, execute, browser, get_style, read_skill. Live execute signature сохраняет `filePath`, `input` или пару `editId`/`edits[{find,replace,all?}]`; это согласуется с baseline. Реальный read-only `read_skill({})` завершился: `Mcp error: -32603 ... transport not connected to app: desktop` после трёх внутренних retries. Других MCP calls reviewer не делал; mutation/export/save не исполнялись.
5. Исторический Pencil log `docs/logs/implementation-log-20260822-1.md:99–117,177–200` прямо ограничивает canary discovery/rollback/repair/readback. Он не доказывает текущие mutations, screenshots, import, export, generation или save. Supporting forward-test record содержит synthetic decision paths; они не являются новым live proof.
6. Историческое shadcn evidence `docs/forward-tests/forward-test-evidence-20260716-1.md` описывает limited missing-context и local fixture observations, включая UI checks и pre-existing lint failure. Это context к старому срезу, а не текущий baseline/candidate comparison. `evals/evals.json` содержит критерии, не результаты исполнения.
7. Прочитаны current official shadcn CLI/Toggle Group страницы и обязательный [Astra prompting guide](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices), 2026-09-09. Руководство использовано для проверки лишних остановок и пропорциональности; оно не отменяет repository permissions, независимый gate и операторские checkpoints. Новых делегаций reviewer не запускал.

## Прямые стыки и пределы вердиктов

| Поверхность | Поддержанный вывод | Что не доказано |
| --- | --- | --- |
| shadcn selection | Root имеет owned/adjacent exclusions; P3 metadata narrowing | Natural catalogue/host activation, baseline/candidate selection rate |
| shadcn execution | Project discovery, installed source precedence, preview/merge, forms/overlay/browser evidence прописаны; S-01 нарушает ordinary completion | Новый add/compose/update run, сохранение локальной variant в живом проекте, browser behavior |
| pencil-dev selection | MCP `.pen` ownership и исключение bitmap/code-only ясны в root/metadata | Native activation; effect optional classification на выбор/load |
| pencil-dev execution | Intended target refresh, MCP-only, transaction repair, instances, visual/save split поддержаны source | Работа реальных mutations, concurrent/stale recovery, component instance, export/save при текущем provider |
| frontend-design | Взаимно согласованы visual direction → Pencil mechanics и shadcn component-system mechanics | Достаточность конкретного нового handoff для реализации |
| react-components-engineer / react-spa-engineer | shadcn отдаёт reusable runtime и app-flow decisions их владельцам; границы соседей совместимы | Runtime correctness новой составной реализации |
| web-ui-reviewer | Formal UX/accessibility verdict остаётся у read-only reviewer, authorized fix у implementation owner | Независимый formal verdict для несуществующего текущего UI результата |
| agent-browser | Browser smoke/diagnostics — execution evidence, не замена formal suite; Pencil import не E2E | Новый сквозной требование → Pencil → shadcn → browser → fix → recheck |

Новый полный **PASS** ни для одного skill или группы не выносится: есть S-01 и P-01/P-02/P-03, а требуемые пользователем реальные проверки ещё не предоставлены. Последовательность verdict methodology даёт `FAIL` прежде `BLOCKED`; disconnected MCP отмечен как блокировка зависимого доказательства, не как дефект самого skill.

Следующий владелец — автор candidate. Исправлять только подтверждённые поверхности двух skills через source → regeneration, закрепить новый snapshot и дать независимому reviewer exact delta, исходные failure paths и actual comparison evidence. Source-only закрытие P-01 не заменяет проверку preservation реальных узлов, когда заявляется полноценная Pencil capability. Повторный полный аудит уже проверенных соседей и постоянный harness для prose skills не требуются.
