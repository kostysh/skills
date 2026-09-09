# Независимый review shadcn C1

**PASS — independent, bounded standalone shadcn review.** S-01 устранён; S-02 исправлен. Новых P1/P2 в рассмотренном skill package, его изменённом instruction contract и прямых стыках не установлено. Реальные add/composition/update и sampled browser evidence предоставлены. Ограничение быстрого ArrowRight воспроизведено и объяснено отдельной guided диагностикой; blanket keyboard correctness и исправление Radix не заявляются. Исходный live-C1 сохраняет свой `partial` browser status.

Этот verdict относится к самостоятельному shadcn: разработчик получает библиотечную реализацию в существующем проекте с сохранением конфигурации/локального кода, проверками и правдивым отчётом. Он не закрывает общий DESIGN-TOOLS-REV-v1, Pencil live/save/export или joint Pencil→handoff→shadcn→browser→fix/recheck. Для joint требуется собственное real-boundary evidence и независимая оценка.

## Основание, assurance и снимок

Режим `re-audit`: [baseline S-01/S-02](baseline-independent-review.md) → [remediation C1](remediation-c1.md) → source/generated delta → исходные failure paths и соседние regression boundaries. Reviewer `/root/shadcn_c1_review` не автор C1, не trial executor и не диагност. Назначен gpt-6-astra/high; independently observed serving identity отсутствует. Основание — первичный запрос оператора, принятый DESIGN-TOOLS-REV-v1, AGENTS.md, skill-standard, skill-reviewer methodology/forward-testing и implementation-discipline. Критерии зафиксированы до изменений в [criteria.md](criteria.md).

- Full B0/C1 packages: `/tmp/design-tools-rev-20260909/{baseline-full,candidate-full}/shadcn`. Пересчитаны все 19 файлов каждого; SHA-256 байтов по sorted skill-relative POSIX paths совпадает с [baseline-manifest.json](baseline-manifest.json) и [candidate-c1-manifest.json](candidate-c1-manifest.json), extras отсутствуют. C1 source-version 0.2.1; `SKILL.md` SHA-256 `c23fe9f979cc0c924e861447d004c63ff65868d46d0bf2625ea14eb72a8d8ee8`, source hash `d3b594fbad7df4b3be756d16d792b0821d39d107385479ed75ea0799306bb8b8`.
- Frozen live evidence: [manifest](live-evidence-manifest.json), SHA-256 file bytes по sorted run-relative POSIX paths. Все 97 B0 и 95 C1 файлов совпали; повторная проверка после диагностического handoff также без drift. Все 11 исходных файлов C1 `before.tar.gz` побайтово совпали с B0 `before/`.
- Отдельная [guided диагностика](keyboard-diagnostic/report.md): report SHA-256 `fed60a97dd083c14254dab20df5bf138c41615daeeaf6fe3eb72d8d27bbdab75`; commands.json `40e2f782d27d102fbde57afb753e5819fd848ea6b12af3dfd4b1313b0c51cfb7`; fast-after-arrow.json `2826f9ef3bbf36a2c692251608c3cc9ba8684a6cad4f3ccf8e07c99284c0625a`; held-after-arrow.json `500c6863bc494d177e36fe7b1efdd94e72af84ceff9495fda4bdfd5f421d75a6`. Это позднее evidence, не часть blind before/after superiority.

Reviewer выполнил только чтение, diff/hash/archive inspection, разбор сохранённых событий и просмотр screenshots; ни project/browser/MCP execution, ни remediation не выполнялись. Записаны только supporting review reports. Просмотрены source и emitted package, все шесть active references, metadata, baseline/correction/self-check/CI records, relevant raw trial outputs и frozen projects. Неизменённые части baseline и соседей не объявляются повторно полностью аудированными.

## Findings и closure mapping

| Finding / исходный failure path | Изменение и проверка | Disposition / P1 screen |
| --- | --- | --- |
| S-01 P2: достаточная app-задача упирается в отсутствующий skill compiler | Source checklist и generated `SKILL.md:214` явно ограничены editing/packaging самого skill. Project checks, upstream preview и preserve-local contract сохранены. Raw D0 одинаковый: B0 требует resolution blocked maintenance checklist, C1 завершает app-задачу без compiler/install/regeneration. Реальные maintenance checks выполнены автором; C1 app execution не требует skill maintenance. | **Closed.** Исходный P2 — лишняя dependency/false blocker. Путь к разрушению app или false runtime closure не установлен; новый trigger не ослабляет доказательство UI. |
| S-02 P3: UI metadata сужает поддержку до Base UI projects | `agents/openai.yml:3` говорит shadcn projects/components; root сохраняет precedence установленного source. Catalog+UI B0/C1: 8/8 корректных owner decisions; реальные B0/C1 используют Radix без миграции. | **Closed.** Systematic routing failure не установлен; severity исходно P3. Нет основания заявлять рост selection success rate или универсальную activation reliability. |

Новых material skill findings нет. P1 screen дополнительно проверяет false capability, invented authority, destructive replacement и wrong routing: C1 отказался от whole-file Button overwrite, сохранил unrelated source/config, не мигрировал primitives, сообщил lint/browser limits, а formal review и framework ownership оставил соответствующим владельцам. Открытое runtime-наблюдение ниже не скрыто и не превращено в безусловный working-UI claim.

## Сопоставимые evidence и их пределы

| Проверка | B0 → C1 / независимая оценка |
| --- | --- |
| D0 ordinary sufficient task | **FAIL → PASS** на фиксированном stipulated input: устранён лишний compiler gate. Это наблюдаемый output executor, не live project run. |
| D3 offline pinned CLI, D4 already-approved replacement, D4b read-only conflict, D5 unavailable browser | **4/4 PASS → 4/4 PASS** по raw answers: source fallback без upgrade, повторное разрешение не требуется, dependent ambiguity не разрешается самовольно, UI claim ограничен. |
| Catalog+UI S1–S8 | **8/8 PASS → 8/8 PASS**. Owned и adjacent requests маршрутизируются корректно. Catalog selection отделена от forced execution; native host activation не проверялась. |
| D1/D2 real add/composition/update | Оба run реально добавили семь official files, сохранили Radix Nova, ~ui aliases, Lucide/theme/lock и brand variant. Preview обнаружил upstream ring delta, он применён хирургически. В C1 Button source diff ровно `focus-visible:ring-3`; сохранение исходного export подтверждено archive/diff. Начальная divergence намеренно создана fixture author; исторический release upgrade не заявляется. |
| Project/static и repository gates | Declared typecheck/build обоих live run прошли. Два repository `test:ci` logs: пять owning test groups завершены, fail 0. Author compiler/check/isolated parity подтверждены [self-check](author-self-check-c1.md) и [parity/links](candidate-c1-parity-links.json); reviewer прочитал evidence, не запускал эти команды. |
| Browser sampled flows | Raw DOM/snapshots подтверждают empty/invalid email с associated error и запретом dialog, switch Space, disabled radios и Tab skip, dialog title/entry/Tab trap/Escape/focus restore, draft Cancel, confirm и видимый applied result. Desktop/mobile screenshots просмотрены; C1 mobile width 390, modal bounds внутри viewport. Ошибок страницы в сохранённых outputs нет. |
| Cleanup | B0/C1 и guided diagnostic records показывают закрытие только task sessions и прекращение их localhost listeners/process trees. Не делается вывод о любых других процессах хоста. |

Live-C1 дополнительно запустил lint: он падает на исходном `buttonVariants` export (`react-refresh/only-export-components`). Этот export есть в before и не изменён; репозиторий skills имеет собственный passing test:ci. C1 не утверждает lint PASS. Сопоставимый B0 lint запуск не предоставлен, поэтому сравнительный lint результат не выводится. Для заданного standalone skill review обязательные project build/typecheck и repository gates подтверждены; исправление существующего fixture lint не вводится как новая задача skill remediation.

[Trial registry](trial-registry.md) раскрывает fresh fork-none executors, assigned gpt-6-astra/high и общую filesystem с инструкционной изоляцией. Active trial copies исключают answer keys/history; full packages рассмотрены отдельно. Live-C1 получил процессное напоминание сохранить события/исследовать повторяющийся сбой либо обозначить предел; диагноз и ожидаемый код ему не передавались. Это ограничивает заявления о безусловной слепоте поздней live диагностики. D0 и catalog/stipulated pairs остаются отдельно. Не измерялись superiority, стоимость, latency или общая reliability.

## Keyboard: сохранённый отказ и guided объяснение

В исходных B0/C1 ранний ArrowRight переводил focus на Weekly без изменения checked. B0 затем выбрал через Space; C1 позднее получил успешные traced arrow trials. По этим поздним PASS нельзя объявлять ранний отказ исправленным. В C1 result он правильно сохранён как причина partial browser status.

Прочитаны полный diagnostic harness/init trace, 41 сохранённая browser-команда (все exit 0), before/after events и опубликованные installed package entrypoint excerpts. Две попытки идут по одному чистому пути до первого ArrowRight; passive trace одинаковая, app/library/skill source не менялся.

| Arm | Порядок после Daily selected/focused | Фактический итог |
| --- | --- | --- |
| `press ArrowRight` | keydown 644.4 → keyup 644.9 → focus Weekly 654.2 ms; selection-click отсутствует | Focus Weekly, selected Daily — исходный сбой воспроизведён |
| `keydown`, удержание, `keyup` | keydown 284.2 → focus/click Weekly 292.1 → keyup 388.4 ms | Focus и selected Weekly |

Installed radio-group source устанавливает arrow flag на keydown, сбрасывает на keyup и вызывает click при focus только пока flag true; roving-focus откладывает focus через setTimeout. Наблюдаемое click/no-click согласуется с обоими путями. Это source-grounded объяснение воспроизведённого отказа в установленной связке, хотя внутренний ref не инструментировался. Версии radio-group 1.4.7 / roving-focus 1.1.19 получены из lockfile; source разрешён через публичные entrypoints.

Диагностика поддерживает sampled keyboard capability с документированным keydown/keyup и объясняет исходный timing-sensitive путь. Она не исправляет быстрый press, не доказывает частоту, поведение любого пользователя/нагрузки или причину всех прошлых аномалий. Гипотеза о влиянии прежней тяжёлой трассировки не доказана. Переписывать app либо ослаблять критерий после этого не требовалось для данного skill verdict: факт отказа и ограничение остаются явными, а требуемое реальное keyboard действие дополнительно наблюдено без source patch. P1 false closure здесь не поддержан; blanket browser/accessibility PASS не выдаётся. Library/tool robustness investigation при требовании устранить fast path — отдельная задача владельца runtime.

## Прямые стыки и итоговый handoff

Source и selection/decision evidence согласуются с пятью соседями: frontend-design владеет визуальным решением; react-components-engineer — reusable runtime; react-spa-engineer — app state/form integration; web-ui-reviewer — formal UX/accessibility verdict; agent-browser — наблюдаемым browser выполнением. Shadcn сохраняет discovery/install/library composition и достаточную передачу контекста, diff и checks. Соседей не меняли; general React correctness, formal accessibility и E2E suite coverage не присваиваются этому review.

По ordered methodology для **указанного standalone skill scope**: stable snapshot и independent assurance установлены, S-01/S-02 закрыты, новых P1/P2 нет, применимые обязательные checks и proportionate source/behavior/live evidence присутствуют; результат **PASS**. Этот PASS не равен безусловному зелёному статусу демонстрационной app: lint failure и fast-press limitation сохранены выше. Прежний C1 `partial` не заменяется ретроспективно новым blind PASS.

Следующий владелец — root/исполнитель принятого плана: использовать этот bounded verdict в общем log и продолжить отдельные Pencil/joint gates. Приёмку всей задачи, изменение соседей или публикацию настоящий отчёт не разрешает. Изменение активного C1 package или material evidence interpretation потребует нового snapshot и затронутого delta review.
