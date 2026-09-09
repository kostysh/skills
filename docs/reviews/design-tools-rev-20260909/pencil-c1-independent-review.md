# Pencil C1 — независимый re-audit

**Вердикт: BLOCKED, independent — для полного запрошенного Pencil claim.** Исходные P-01–P-03 исправлены на уровне активных инструкций и source/generated contract; в ограниченной поверхности re-audit новых P1/P2 не установлено. Реальная сохранность узлов/связей, edit/component/instance, structural/visual readback, PNG export, сохранение и совместный путь ещё не доказаны. Их отсутствие не переименовано в дефект скилла, но исключает полный PASS.

Режим `re-audit`, reviewer `/root/baseline_review`; reviewer не создавал C1 и не участвовал в его remediation. Author self-check и compiler success не используются как независимое одобрение. Проверка ограничена pencil-dev, исходными failure paths P-01–P-03, их delta и прямыми стыками. Standalone shadcn и неизменённые внутренности пяти соседей заново не оценивались.

## Снимок и проверенные действия

Candidate immutable: `/tmp/design-tools-rev-20260909/candidate-full/pencil-dev`, source-version `0.2.1`; [manifest C1](candidate-c1-manifest.json), SHA-256 файла manifest `812e7cd536e10460a799305a553e02f8bdbd89b9eac5380a80ff58b32e110a23`. Generated `SKILL.md` SHA-256: `6b8befc7446f6e2f499693a04c1819829677559ff416c5f33397b36ffe381123`.

Независимо пересчитаны все 22 candidate file hashes; immutable copy и рабочая папка skill совпадают с manifest. Diff против зафиксированного B0 содержит ровно `skill.yaml`, `SKILL.md`, `references/component-libraries.md`, `docs/compile-report.md`, `docs/README.md`. Последний добавляет supporting links и не повышен до active authority. Unified API, fragment и UI metadata не менялись. Это bounded remediation, не основание расширять аудит на всю группу.

Прочитаны [исходный review](baseline-independent-review.md), [mapping](remediation-c1.md), [author self-check](author-self-check-c1.md), [закрытые критерии](criteria.md), оба raw input JSON, оба B0/C1 decision records и additional records, provenance, trial registry, parity-links JSON и CI log. Source/current emitted delta сверены отдельно. Проверены 5 локальных links трёх active Markdown-файлов — broken targets нет. Все 85 file hashes пяти соседей совпадают с прежним UI final manifest; прямые interop-контракты поэтому сохраняют baseline-основание.

Reviewer не вызывал MCP/UI, не менял target, не запускал trials/новых агентов и не выполнял writing checks. Единственная запись — этот отчёт. Недоступность MCP основана на already observed disconnected responses из текущей сессии и provenance; новый connectivity check не заявляется.

## P-01–P-03: исходный путь → delta → evidence

| Finding и исходный риск | C1 и source locators | Независимая оценка evidence / disposition |
| --- | --- | --- |
| **P-01 / P1:** blanket removal скопированных references допускает удаление существующего или используемого state | `skill.yaml:209–212` → [SKILL.md:210](</tmp/design-tools-rev-20260909/candidate-full/pencil-dev/SKILL.md:210>): удаление только confirmed disposable task scaffolding либо явно authorized cleanup; pre-delete nodes/refs readback, сохранение outside-scope и unresolved nodes, post-delete inventory/affected instances | Конкретное небезопасное предписание устранено. `additional-c1.md / P6e` сохраняет existing origin/connected instance, проверяет scratch ownership и отсутствие consumers до удаления, затем inventory/ref resolution; `decisions-c1.md / P6c` сохраняет explicit outside-scope frames. **Instruction remediation подтверждена; реальный original preservation path не закрыт**, deferred до MCP. |
| **P-02 / P2:** inspection/origin-only принятие ошибочно требует consumer usage | `references/component-libraries.md:9–22` — canonical completion по inspection/origin-only/requested usage; `SKILL.md:143–150,233–234` и соответствующий source направляют к нему без независимого общего origins+usage условия | `P6a` завершает inventory без mutation/consumer/save; `P6b` завершает только заданный structurally+visually verified и saved origin; existing affected consumers всё ещё требуют scoped connection checks. `P6d` отделяет screenshot input, repository behavior authority и runtime gaps. **Source/decision path исправлен**; фактическое создание origin и использование instance этими stipulated answers не доказано. |
| **P-03 / P2:** mandatory library reference одновременно optional | `skill.yaml:21–26,54–58` выставляет required=true / requiredReferences; [SKILL.md:242–244](</tmp/design-tools-rev-20260909/candidate-full/pencil-dev/SKILL.md:242>) сохраняет task condition; compile-report добавляет library reference в Required | Классификация единообразна и trigger не расширен на каждую Pencil-задачу. `additional-c1.md / P6f` верно выбирает unified API для nonlibrary correction и оба references для library inventory. **Retrieval contract исправлен**. Это наблюдаемый текст решения, а не trace реальной выборочной загрузки файлов в двух отдельных активациях. |

P1 screens после remediation:

- **P-01:** C1 больше не разрешает удаление по одному названию/категории reference; ownership, scope и необходимые связи проверяются. Supported source path к опасной blanket deletion не остаётся. Это не утверждение, что реальная MCP deletion уже была безопасно исполнена.
- **P-02:** новый contract устраняет unnecessary consumer blocker и сохраняет connected-ref evidence для requested usage. Не обнаружено новой авторизации самовольного создания consumer или принятия duplicate shapes за instance.
- **P-03:** required classification не скрывает condition; не возникло обязательного чтения library reference для всех задач. Не установлены новый unsafe fallback, invented authority или false closure.

Новых material findings: **0** на описанной поверхности. Отсутствующие live proofs перечислены как evidence blockers ниже, без искусственной P1/P2-классификации. Неизменённые API/runtime paths не получают новый глобальный verdict из-за этой bounded проверки.

## Независимая оценка результатов до/после

Закрытые inputs совпадают для B0/C1. Рассмотрены 11 Pencil decision cases: P2, P2b, P3, P4, P5, P6a, P6b, P6c, P6d, P6e, P6f. На уровне **ответа по stipulated фактам** все 11 дают поддержанные решения в обеих версиях:

- P2/P2b: не переносят автоматически edit с A на B, запрашивают fresh target/readback, сохраняют точную editId repair shape без нового input и без выдуманных replacement strings.
- P3: продолжают разрешённый нейтральный prototype, не выдумывают production semantics и не блокируют routine spacing/type choices.
- P4/P5: disconnected MCP блокирует dependent mutation, но допускает работу с brief; structural/visual/export/save остаются отдельными claims.
- P6a/b/c/e: scope пользователя в B0 уже позволил executor обойти противоречивую blanket-инструкцию; C1 даёт тот же поддержанный outcome через согласованный contract.
- P6d: screenshot передаёт видимую структуру, repo — validation/save/theme authority; mobile и hidden/runtime behavior не объявляются доказанными.
- P6f: conditional load decision правильный в обоих ответах; C1 снимает прямо названное B0 противоречие optional/required.

Следовательно, для Pencil эти результаты доказывают **сохранение поддержанного решения и устранение source contradiction**, а не измеренный прирост success rate. B0 PASS на тщательно заданных inputs не отменяет исходный defective general instruction; C1 PASS на тех же inputs не доказывает universal reliability.

[Catalog+metadata B0](selection-result-metadata-b0.json) и [C1](selection-result-metadata-c1.json) согласуются с исходными восемью owner criteria. В Pencil-owned S2 выбран pencil-dev, в S8 разделены Pencil → frontend/shadcn → browser. Adjacent-only запросы отданы соответствующим владельцам. Это сопоставимое model-selection evidence, не native host activation. Pencil description/metadata не менялись, routing improvement не заявляется.

Exposure limits: trial registry указывает fresh agents `fork_turns=none`, assigned `gpt-6-astra/high`, отсутствие diagnosis/rubric у executors и инструкционную изоляцию общей filesystem. Фактическая serving model не раскрыта. Ревью видит сохранённые ответы и raw inputs, но не полный независимый tool transcript или file-read trace каждого executor; отсутствие запрещённых действий нельзя доказывать одним summary. Reasoning tasks сами запрещают реальные calls и mutations. P6f объединяет два load decisions в одном запросе, поэтому не является наблюдением двух независимых фактических activation/load cycles.

Registry всё ещё содержит `pending` для C1 decision rows, хотя названные C1 result files существуют и здесь прочитаны. Это административное отставание supporting index; вывод сделан по результатам, не по pending label. Перед итоговой передачей индекс стоит синхронизировать; повторять trials из-за этой записи не требуется.

## Структурные gates и стыки

[Parity-links C1](candidate-c1-parity-links.json) сообщает equality для четырёх Pencil active/UI surfaces и пять существующих local links. Reviewer independently сверил manifest, delta и наличие links; isolated compiler run не повторялся. Author self-check остаётся self-review.

[Candidate CI](candidate-c1-test-ci.txt) содержит запуск declared `pnpm test:ci` и пять завершённых package suites: 1 + 18 + 24 + 21 + 44 = **108 passed, 0 failed**. Это supplied command log, прочитанный reviewer, а не новый запуск. Suite проверяет repository contract/runtime packages; он не содержит исполнения Pencil editor. Его успешность не закрывает real-boundary критерии.

Стыки проверены в пределах producer/consumer responsibility:

- frontend-design сохраняет visual direction; Pencil — MCP artifact mechanics. C1 не переносит product/runtime authority на mockup.
- shadcn получает проектные и визуальные входы; React component/SPA владельцы сохраняют component runtime и application-flow decisions.
- web-ui-reviewer сохраняет formal read-only UX/accessibility verdict; browser owner собирает actual interaction evidence, Pencil browser import остаётся design input.
- Изменение origin-only completion не создаёт зависимости от нового consumer и одновременно сохраняет проверки уже затронутых связей. Cleanup correction защищает существующие данные для следующего владельца.

Прямого source-contract конфликта на этих стыках не найдено. Достаточность **реального** Pencil handoff следующему независимому consumer не проверена: P6d — решение по screenshot/repo stipulations, не создание и потребление нового MCP-артефакта.

## Точный blocker полного Pencil claim

В [criteria.md](criteria.md) P1 live и Joint J — обязательные границы принятой задачи. Они не становятся optional потому, что skill documentation-only. Одновременно сам по себе документационный формат не требует нового runtime package или постоянного harness.

Не предоставлены current real observations:

1. Fresh connected get_app_state в отдельном тестовом документе и успешный schema-backed edit.
2. Reusable origin и connected instance с текущими IDs, Get/resolveInstances, bounds/problems и визуальной инспекцией.
3. Исходный P-01 preservation path: existing reference/origin/instance сохраняются, удалён только task scratch, post-delete connections реально разрешаются.
4. Применимый PNG Export с возвращённым путём и проверенным результатом; material save с подтверждением фактического persistence/reopen-readback по принятым критериям.
5. Реальный design → достаточный handoff → shadcn/browser → finding/fix → original-path recheck. Новые отдельные shadcn trials не заменяют missing Pencil producer.

Минимальное условие продолжения: работающий Pencil MCP и fresh app state, подтверждающий intended отдельный test document/filePath. После этого выполнить уже предусмотренные живые проверки и передать raw calls, structural/visual results, export/save evidence и actual producer/consumer records на bounded assessment. Восстановление соединения само по себе не означает успешность этих проверок.

**Итоговый disposition:** source remediation P-01–P-03 supported; 11/11 stipulated decision outcomes и ограниченная catalogue comparison поддержаны; full requested Pencil capability и joint **не приняты, BLOCKED** до названного evidence. Нет оснований возвращать author к очередному point fix или расширять scope соседей только из-за disconnected MCP.

## Дополнение: подготовка live B0/C1 после восстановления MCP

Оператор восстановил MCP и обозначил отдельный test document `/tmp/design-tools-rev-20260909/pencil-live-test.pen`; live B0/C1 исполняются последовательно в областях A/B одного документа. Эта запись оценивает только подготовку и не заменяет последующий verdict по raw live results. Предыдущий disconnected status описывает состояние до восстановления; successful editor operations/save здесь ещё не оценены. Reviewer не читал raw `.pen`, не вызывал MCP/UI и не вмешивался в активного executor.

Прочитаны [pencil-fixture.json](pencil-fixture.json), SHA-256 `a9a297c88090af1a14743d76b2f6e3481d55ce94e184a6104b53d195703e4c5c`, и [raw-pencil-live-task.txt](raw-pencil-live-task.txt), SHA-256 `b980d8f52184e3612f9c96d4af04203243bb77ef316b9c6c90b91e39992aef46`.

**Сопоставимость setup:** fixture содержит два одинаковых reusable origins и два одинаковых overview с connected refs. Независимая нормализация исключила node IDs, сопоставила origin refs, удалила A/B prefixes и вычла базовое x; `originData` и `boardData` совпали. Рабочие области обе 7800×7000, y=400, x=1600 и x=10000; они не пересекаются. Равенство установлено для возвращённой структуры, не для невыведенных глобальных переменных, тем, resolved bounds или rendered appearances.

A/B в одном документе — допустимое ограниченное сравнение при раскрытой instruction-level isolation, но не эквивалент независимых чистых документов. Общие themes/variables и видимость B0-result могут влиять на C1; перед C1 нужен зафиксированный readback untouched B origin/overview/ref и релевантного глобального состояния. Различие x/ID/названия нормально; материальную разницу исходных tokens/layout/runtime надо отдельно объяснить. Блокировать уже идущий прогон или раскрывать ему rubric для этого не требуется.

**Покрытие:** raw task включает desktop1440/mobile390, reusable control/card и connected instance, email/switch/frequency, review/dialog/applied states, structural/visual verification, PNG и actual save status, достаточный implementation handoff. Existing reusable origin/consumer fixture делает проверяемым preservation-инвариант P-01. Однако начального disposable scratch нет и создание временной копии не является обязательным шагом raw task: если executor не создаст/не удалит такой узел, preservation будет наблюдено, а original deletion branch — нет. Не добавлять artificial mutation задним числом в уже blind run; учесть фактические actions и при необходимости отдельную bounded проверку с честно указанной exposure.

Raw prompt не гарантирует отрисовку invalid/disabled/pending и проверку keyboard/focus: эти закрытые Joint J критерии требуют downstream поведения и/или source-grounded handoff, а не вывода из наличия static prototype. Сохранённый PNG не доказывает reopen persistence. Для full claim по-прежнему нужны реальные Get/resolveInstances/bounds, просмотр visual output, actual Export return, operator/live save evidence и reopen/Get, а затем настоящий consumer→browser→fix→recheck. Здесь не требуются новый permanent harness, импорт внешней библиотеки или отдельный library lifecycle, которых данный same-document request не задаёт.
