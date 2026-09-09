# Независимый review shadcn C2 — Base UI

**PASS — independent, bounded standalone Base UI scope.** S-01 закрыт; S-02 отозван как ошибочная интерпретация operator scope. Новых P1/P2 в рассмотренном C2 package и его подтверждённом standalone поведении не установлено. Fresh Base B0/C2 обеспечили реальные add/composition/update и browser evidence. Предсуществующий lint failure и наблюдения переходного фокуса раскрыты ниже.

Этот verdict относится к shadcn0.2.2 для разработчика Base UI проекта: получить проектный контекст, безопасно добавить/обновить и скомпоновать компоненты, сохранить локальный source/config, проверить требуемое взаимодействие и честно сообщить ограничения. Общий DESIGN-TOOLS-REV-v1 и joint Pencil→handoff→shadcn→browser→fix/recheck требуют отдельного evidence и verdict. Этот отчёт их не закрывает.

## Основание, independence и snapshot

Reviewer `/root/shadcn_c1_review` не автор C2 и не executor Base B0/C2. Режим `re-audit`: baseline S-01 → unchanged C1 correction → C2 authority/metadata delta → fresh целевой Base live evidence. Применены текущие указания оператора, принятый план, AGENTS.md, skill-standard, skill-reviewer methodology/forward-testing и ранее установленный implementation-discipline scope. Reviewer читал source, hashes/diffs, raw CLI/browser результаты и screenshots; не запускал UI, project checks, compiler, remediation или новых агентов. Записаны только review records.

- [C2 manifest](candidate-c2-manifest.json): SHA-256 bytes, sorted skill-relative POSIX paths. Повторно проверены все 19 shadcn files, mismatches 0. Source-version 0.2.2; root SHA-256 `7e04e100c6ba15df9841cbcd3113d58c4b39a46cd90dd00cbdaabaddf1d65502`; source hash `7180f90c3decbec46b70b43b576c5a7bae3ec9a6b64d3be09bb4d90b10c87293`.
- [Base B0 manifest](base-b0-manifest.json): 61 file hashes, все совпали. [Base C2 manifest](base-c2-manifest.json): 87 file hashes, все совпали. Конвенция — SHA-256 bytes, пути относительно соответствующего frozen evidence folder. B0 commands.log включён в manifest. C2 commands.md и numbered raw outputs включены отдельно.
- Все 11 файлов `before/`, включая package.json, pnpm-lock.yaml, components.json, исходный Button и App, побайтово одинаковы между Base B0/C2. Lockfile SHA-256 `103b09b27a9fe99c4a98fade0861ebf111d8b4e8802e58b1fb7307448c10f6f5`. Обе реализации использовали CLI4.21.0 / Base UI1.8.0, base-nova, Vite/React/TypeScript, Tailwind v4, Lucide и ~ui aliases.

Source/compiled/active parity уже независимо проверена в [C2 delta preparation](shadcn-c2-delta-preparation.md): десять runtime-facing files совпадают в source, isolated compile и active copy. C2 source с тех пор не изменился. Неизменённые references и пять прямых interop surfaces переиспользуются в их ранее проверенной границе, без нового полного аудита соседей.

## Findings, authority и P1 screens

| Пункт | Итог и закрывающие evidence |
| --- | --- |
| S-01 P2: ordinary app completion требует отсутствующий skill compiler | **Closed.** Source/generated root ограничивает maintenance checklist изменением/упаковкой самого skill. D0 raw B0 требует resolution лишнего gate, C1 завершает ordinary task; эта body-поверхность в C2 побайтово неизменна. Fresh C2 реальный app результат завершён без skill maintenance. Author maintenance checks при настоящем изменении package сохраняются. |
| S-02 P3: supposed слишком узкое Base metadata | **Withdrawn, не skill defect.** Текущее явное указание оператора сохраняет Base boundary; исходное short_description восстановлено. Исторический July log подтверждает ранее принятое направление, но supporting log не назначается новым источником полномочий. Прежний C1 verdict не применяется как final Base acceptance. |
| Новые material findings | **Нет.** Неподдержанные flags/props, потеря local edits, invented upgrade/authority, false UI completion и присвоение formal reviewer ownership не установлены в рассмотренном source/output. |

P1 screen S-01: первоначальный supported outcome — unnecessary dependency/false blocker, severity P2. Исправление не разрешает разрушительные изменения и не ослабляет required project/interaction evidence. P1 screen authority: C2 metadata соответствует текущему operator-owned scope; внешняя доступность иных технологий не разрешает его расширить. P1 screen execution/closure: оба исполнителя отказались от Button overwrite, сохранили unrelated changes и сообщили lint/verification limits; false capability или опасная mutation не установлены.

## Fresh Base comparison: фактические проверки

| Контур | Base B0 | Base C2 | Оценка |
| --- | --- | --- | --- |
| Discovery/docs/API | CLI info подтверждает base/base-nova; docs JSON возвращает Base URLs; source/types прочитаны | То же; недоступный radio API markdown404 заменён inspected installed wrapper/public types | **PASS / PASS**: нет выдуманной миграции или API из памяти |
| Registry add/composition | Реально добавлены input/switch/radio-group/field/dialog + label/separator, prompt overwrite отклонён | Те же семь новых wrappers; raw install prompt answered no | **PASS / PASS** |
| Customized Button update | Preview показывает отсутствующий ring и brand diff; final Button меняет только `focus-visible:ring-3` | Ровно тот же однотокенный final delta | **PASS / PASS**: brand сохранён, wholesale overwrite отсутствует |
| Config/unrelated preservation | Reviewer сравнил before/project bytes шести scoped invariant files | Те же шесть invariant files совпали | **PASS / PASS**: components/package/lock/theme CSS/provider/sentinel сохранены |
| Project checks | Declared typecheck/build успешны; lint fail исходного mixed export | Declared typecheck/build успешны; тот же lint fail | Build/typecheck **PASS / PASS**, lint **FAIL / FAIL**, без новой причины в changed source |
| Empty/invalid→valid flow | Associated alert/error, email focus и zero dialogs; valid input открывает dialog | Raw 11/12 дают тот же path | **PASS / PASS** |
| Switch/radio/disabled | Tab/Space toggle, ArrowDown selects Weekly после включения; disabled input не меняет выбор | ArrowRight selects Weekly; disabled ArrowLeft/Space/label click не меняют Weekly | **PASS / PASS** для заданных sampled controls |
| Dialog/focus/Cancel/Escape/Confirm | Entry Cancel, backward/forward wrap после settled focus, draft сохранён, Confirm показывает applied result | То же; explicit initialFocus/finalFocus, Cancel/Escape→Review, keyboard Confirm→weekly/on и mobile off | **PASS / PASS** по settled observations |
| Responsive/result/console | Desktop1440/mobile390, dialog bounds внутри viewport, result и dark screenshots, page errors пусты | Raw viewport/document width390; settled mobile light/dark dialog и applied-off; local asset requests, page errors пусты | **PASS / PASS**, sampled browser evidence |

Raw основы сравнения: B0 [commands.log](base-b0/commands.log), [source.diff](base-b0/source.diff), before/project; C2 [command index](base-c2/commands.md), [CLI/docs/preview](base-c2/01-cli-docs-preview.txt), [interactive install](base-c2/03-install-interactive.txt), [checks](base-c2/05-checks.txt), browser outputs11–19 и [preservation](base-c2/20-preservation.txt). Result summaries сверены с ними; они не использовались как единственное доказательство. Source C2 применяет установленный Dialog `initialFocus`/`finalFocus`, `DialogClose render`, controlled draft/applied state и documented wrappers.

Reviewer визуально просмотрел B0 desktop-result/mobile-dialog, C2 desktop-applied/mobile-applied и settled mobile light/dark dialogs. Эти screenshots согласуются с наличием controls/result и адаптивной композицией; клавиатура и runtime выводятся из raw interaction, не из изображений. Нет утверждения о всех браузерах, assistive technology, backend, email delivery или persistence across reload.

Исходная upstream divergence намеренно синтетическая — удалён текущий focus token; registry lookup, preview и merge реально выполнены. Это доказательство обновления локально изменённого компонента против текущего registry, а не исторического перехода между release.

## Timing, lint и независимость

Отключённые Base radios имеют aria-disabled и не изменяют выбор, но выбранный item остаётся focusable в Tab-порядке. Оба run наблюдают это прямо. Требование здесь — disabled frequency; требование убрать disabled item из Tab-порядка не было установлено, поэтому оно не изобретается reviewer как новый acceptance gate.

B0 ранний Tab→Enter до settled focus дал timeout; raw inspection затем нашла Cancel, condition wait и Enter завершили Cancel path. C2 ранние snapshots видели closing dialog/focus-guard; outputs15/19 показывают settled closure, нужный focus и screenshots. Эти ранние попытки сохраняются как неуспешные/переходные. Успешные condition-based действия подтверждают финальный path; механизм прежних испытаний в другом окружении на Base UI не переносится. Патч app для этой timing гипотезы не выполнялся.

Lint failure относится к `buttonVariants` export58:18. Оба run воспроизвели его на исходном Button через eslint stdin; before/project diff оставляет export неизменным. C2 raw checks и baseline-lint подтверждают одну и ту же ошибку, а отчёт её не скрывает. Required project build/typecheck и repository test:ci108/108 прошли; создание новой задачи по исходному fixture lint не требуется для этого skill verdict. Чистый lint проекта не заявляется.

Устранённые execution/setup проблемы сохранены: pnpm sandbox database error, остановка install на overwrite prompt, B0 stale ref, C2 initial dev port5173. Их наличие не заменяет final state: targeted cleanup records подтверждают остановку своих sessions/server generations и отсутствие своих listeners; соседние sessions не закрывались. C2 404 документации ограничен конкретной страницей и имеет source/type fallback.

[Trial registry](trial-registry.md) фиксирует fresh fork-none executors, assigned gpt-6-astra/high, одинаковые raw brief/fixture и environment-only pnpm escalation context. Actual serving model не наблюдалась независимо; shared filesystem обеспечивает инструкционную изоляцию, не hard sandbox. Автор не выдал rubric/diagnosis/ожидаемый результат. Reviewer видит критерии и raw outputs, как требуется assessor. Сравнивается Base B0↔C2; прежние реализации другого контура не используются для Base superiority.

## Source/checks, interop и verdict rationale

[Author self-check C2](author-self-check-c2.md) соответствует actual delta: metadata возвращена Base scope, S-01 неизменён, новых workflow/API/reference/runtime нет. Compiler/isolated checks, parity10 files и full-folder terminology scan0 выполнены автором и подтверждены delta inspection; [C2 CI](candidate-c2-test-ci.txt) содержит 108 tests, zero fail. Структурные проверки не выдаются за live success.

Unchanged D3/D4/D4b/D5 reasoning cases сохраняют offline fallback, reuse явного разрешения, read-only/conflict boundary и partial browser report; D0 **FAIL→PASS** остаётся единственным доказанным behavioral improvement от correction. C2 catalog description и restored UI metadata совпадают с B0 catalog input: прежние8/8 owner decisions применимы с этим ограничением; нет заявления о native host activation или отдельном tested rejection всех вне-scope запросов. Успех обоих Base live run не означает превосходство C2 на каждом interaction.

Прямые стыки сохраняются: frontend-design — visual direction, react-components-engineer — reusable runtime, react-spa-engineer — app integration, web-ui-reviewer — formal UI verdict, agent-browser — observed browser execution. Shadcn владеет Base component/library decisions и передаёт context/diff/evidence/limits. Соседи не изменялись; формальный accessibility verdict не присваивается этому skill review.

По ordered methodology: independent assurance и stable C2 установлены; S-01 закрыт, S-02 отозван, unresolved P1/P2 нет; mandatory applicable checks и proportionate source/decision/live evidence поддерживают указанную standalone Base capability. Итог — **PASS**. Next owner — root/исполнитель плана: включить verdict с этими пределами в общий log и завершить отдельные Pencil/joint gates. Общая приёмка и публикация этим отчётом не разрешаются. При material изменении C2 или evidence interpretation нужен затронутый delta review.
