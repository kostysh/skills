# Независимый baseline: code-reviewer и retrospective-analysis

Оба навыка: **FAIL**, mode `baseline`, assurance `independent`. Установлены P2 на доступной активной поверхности. P1 не установлен. Авторство/ремедиация snapshot отсутствуют; изменений навыков и новых агентов не было.

Snapshot: git `504b87331f22b3a5303875bef69163a40d4372d7`, `/tmp/g5-evidence-8z1wlw3e/baseline/skills`; общий manifest identity `bb7039d80648b4e9ddb2052f71b4c1f14355ee4c562da1e98dd2e3946de8a618` (SHA-256 ordered compact JSON path/sha256 rows). Все пути ниже относительно этой skills-директории. Итоговая проверка всех manifest entries: 0 несовпадений, 0 дополнительных файлов.

Потребитель code-reviewer — автор/maintainer, получающий подтверждённые merge risks и воспроизводимую рекомендацию. Потребитель retrospective-analysis — оператор, получающий причинный разбор завершённой работы и при разрешении передачу остаточных задач. Отчёт не доказывает production correctness, effectiveness или универсальное поведение агента.

## Полный набор материальных findings

### CR-1 — P2: принятое исправление поведения принудительно расширяет переаудит

**Основание direct/conflicting:** `code-reviewer/references/diff-completeness.md:30-34`: сначала ограничивает проверку original failure path и adjacent surface, затем требует fresh review при изменении `public behavior` без исключения для самого принятого исправления. Изменение поведения является обычным результатом исправления.

**Путь:** оператор просит проверить только исправление неверного HTTP status на стабильном snapshot, прошлый объём уже проверен → изменение публичного status удовлетворяет widening trigger → повтор полного ревью неизменённых областей, выход за согласованный bounded scope.

**P1 screen:** подтверждён лишний объём/повтор и конфликт процедуры; ложное разрешение merge или опасная операция не установлены, поэтому P2.

**Bounded remedy:** widening только при выходе за accepted remediation boundary, изменении внешних зависимых контрактов, несвязанных изменениях или неограниченном blast radius. Сохранить original-path regression proof.

**Falsifier:** accepted behavioral fix остаётся bounded; парный случай с несвязанным public API change требует расширения/уточнения scope.

### CR-2 — P2: probe присваивает audit persistence безусловную fail-closed семантику

**Основание conflicting:** `code-reviewer/references/policy-admission-merge-risk.md:15-16,32-33,41-46`: triggers включают любые audit rows; строка 32 запрещает allow после любой ошибки audit persistence, соседняя строка 33 связывает audit semantics с обещанным контрактом. `references/methodology.md`, Conditional Policy/admission Pass повторяет безусловный вопрос об audit-write failure. При этом root Interop и `references/domain-routing.md` оставляют специализированную корректность domain owner, vulnerability — security-reviewer; spec-pass требует нормативную основу.

**Путь:** изменяется наблюдательный audit sink с допустимым best-effort failure, admission от него не зависит → буквальный probe считает продолжение allow дефектом → необоснованный merge blocker/предложение изменить доступность. Это конкретный конфликт собственной conditional semantics, а не утверждение, что любой best-effort audit безопасен.

**P1 screen:** на inspected surface подтверждена неоднозначная материальная проверка и возможный false positive; общие evidence/domain guards оставляют путь корректного отклонения finding. Не утверждаю наблюдавшуюся silent authority invention или security breach; P2.

**Bounded remedy:** сначала установить owning contract и роль persistence в admission; требовать fail-closed там, где это защищённый инвариант/обязательство. Сохранить actual fail-open findings для обязательной durability и routing exploitability к security-reviewer.

**Falsifier:** пара best-effort observational sink / mandatory durable admission record: первый не получает invented blocker, второй получает finding по реальному failure path. Отдельно отсутствие contract остаётся вопросом/ограничением, не новым правилом продукта.

### CR-3 — P2: частично доступный стабильный scope одновременно допускает limited и запрещает завершить findings

**Основание conflicting:** `code-reviewer/references/diff-completeness.md:14` разрешает `limited` для частично inspectable valid target; `:52-54` требует перед finalization увидеть каждый changed file. `references/findings-format.md:47-51` требует полезные findings плюс limited при incomplete evidence/scope.

**Путь:** target/base/hash известны, в доступном изменённом файле подтверждён bug, другой изменённый файл недоступен → рекомендация limited допустима, но pre-conclusion запрещает завершение findings до чтения недоступного файла → пользователь теряет полезный подтверждённый результат или получает лишний stop.

**P1 screen:** partial findings suppression/ненужная блокировка; нет основания утверждать ложный approve. P2.

**Bounded remedy:** отделить accounted scope от fully inspected scope; запрещать clean approval, но сохранять подтверждённые findings на стабильной доступной части с exclusions.

**Falsifier:** partial stable input с известным багом возвращает finding и honest limited; неизвестный target/base не превращается в approve.

### RA-1 — P2: full-mode требования протекают в targeted output и handoff

**Основание conflicting:** `retrospective-analysis/SKILL.md:49-51,164` ограничивает machine-readable/independent полноту full-режимом и запрещает targeted task hierarchy. Но `:114,174` требует numbered plan и загружает report-reference даже для recommendation set. `references/report-and-remediation-plan.md:3-18,45-77` без условия full требует полный report/matrix contract. `references/task-routing.md:8-24,79-80` требует machine matrix и parent+children при любом approved handoff. Independent audit здесь назван required; его applicability для targeted тоже не объяснена.

**Путь:** один завершённый bounded incident → narrow recommendations → общая ссылка/план активирует full report structure. Затем разрешённый handoff одной residual action требует matrix и hierarchy вместо узкой задачи либо блокируется отсутствием full artifacts.

**P1 screen:** подтверждён контрактный конфликт глубины и передачи; реальная внешняя мутация не наблюдалась, explicit approval guard сохранён. P2, не утверждение несанкционированного tracker write.

**Bounded remedy:** единый явный mode split в выходе, conditional loading и handoff. Full сохраняет completeness/matrix/independence; targeted сохраняет source-backed narrow report/recommendation и пропорциональную native task shape. Обязательные approvals проекта сохранить и переиспользовать имеющуюся authority.

**Falsifier:** targeted incident → рекомендация → уже разрешённая одна задача обходится без full matrix/hierarchy; full case всё ещё требует полного reconciliation и independent completeness evidence.

### RA-2 — P2: runtime ретроспективы требует компиляцию собственного skill package

**Основание direct/conflicting:** `retrospective-analysis/SKILL.md:184-188` в `Portability checklist before finishing` требует `Compile to an isolated directory...`; source `skill.yaml:238` содержит то же. Compatibility `SKILL.md:7-10` обещает отсутствие required CLI/runtime/repository layout. В portable executor package ни compiler, ни source repository не гарантированы; этот этап относится к maintenance.

**Путь:** пользователь просит read-only ретро и предоставляет достаточные primary evidence, установлен только runnable skill → до завершения требуется посторонняя compilation/tool discovery либо stop на отсутствии compiler → полезный отчёт зависит от неотносящегося к задаче maintenance tooling.

**P1 screen:** portability/process defect, а не установленная порча данных; источник не задаёт опасного compile command. P2.

**Bounded remedy:** вынести author/package verification из исполнительского root или явно ограничить maintenance activation; сохранить source/package parity checks при authoring.

**Falsifier:** standalone installed skill без compiler/source repo завершает evidence-backed targeted/full-supported отчёт без compile attempts; maintenance проверка пакета остаётся у владельца.

### RA-3 — P2: total task count не учитывает обязательный navigation parent

**Основание direct:** `retrospective-analysis/references/task-routing.md:23-24,79-84` создаёт один parent и N children, но требует `total task count equals the accepted active-step count` (= N).

**Путь:** корректно созданы parent + один child для одного active step → direct readback даёт 2 tasks → final reconciliation требует 1 → правильный handoff не может пройти буквальный final check.

**P1 screen:** false reconciliation failure, не доказанная лишняя мутация/ложная closure. P2.

**Bounded remedy:** отдельно считать navigation items и actionable children, назвать total = parent count + active step count для выбранной full shape; согласовать с RA-1 mode split.

**Falsifier:** N=1 и N=2 правильные наборы проходят; duplicate child и missing child остаются failure.

## Поверхности и проверки

Прочитаны оба root, source manifests, code-reviewer maintenance AGENTS и exact overview fragment, все активные references, UI metadata, template/checklist/fixtures, package test. Проверены relevant supporting compile/navigation и retrospective implementation evidence; historical PASS — только заявленная история, не независимое доказательство текущих спорных путей. Direct interop сверён по scope/authority clauses implementation-discipline, delivery-planner, spec-conformance-reviewer, security-reviewer; их специализация не присвоена этому ревью. Более широкие domain claims и вся историческая достоверность logs не входят в вывод.

- Exact inclusion code-reviewer overview fragment в emitted root: true.
- Broken root/reference Markdown links: 0 у обоих.
- Declared `node --test test/docs-contract.test.mjs`: 1/1 PASS, только structural template contract.
- Обёртка `pnpm --dir ... test` неожиданно инициировала dependency auto-install и завершилась ERR_SQLITE_ERROR до теста. Повтор установки не делался; package-declared node command выполнен непосредственно. После этого сверены все frozen manifest hashes и дополнительные файлы: snapshot unchanged.
- Compiler regeneration/check не выполнялись: baseline read-only review, source parity проверена readback, не заявляется полный compiler drift PASS.
- Behavioral/selection trials здесь не выполнялись и чужие текущие результаты не получены. Статические findings достаточны для FAIL; поведенческий PASS, universal reliability и host activation не заявляются.

Внешний источник: https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices, прочитан текущий GPT-6 Astra раздел. Он рекомендует устранять конфликтующие skill instructions, лишние approval pauses и непропорциональную проверку. Это подтверждает актуальность проверки, но не заменяет локальные authority и доказательство дефекта.

Формальные verdicts: **code-reviewer FAIL (independent baseline; CR-1–CR-3)**; **retrospective-analysis FAIL (independent baseline; RA-1–RA-3)**. Следующий владелец — автор G5: bounded source remediation и blind paired cases, затем независимый re-audit stable delta. Никакие рекомендации не реализованы этим reviewer.
