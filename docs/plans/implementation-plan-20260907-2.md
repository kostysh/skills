# Ревизия десяти скилов

## Цель и основание

Проверить и исправить десять скилов так, чтобы их полномочия, результаты и передача работы между агентами были согласованы.

Основание: текущий запрос, `master` на `4ddcb69`, правила репозитория, принятые `skill-reviewer` и `skill-source-compiler`, [гайд GPT-6 Astra](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices). Особое внимание — приоритетам инструкций, необоснованным остановкам, делегированию, ясности ответов и соразмерности проверок.

**Scope delta: unchanged. Unauthorized additions: none.** Остальные скилы читаем только для проверки взаимодействий; их исправления требуют отдельного решения. Документы и компиляция — вспомогательные результаты: качество подтверждаем наблюдаемыми решениями агентов, без обещаний универсальной надёжности или экономии ресурсов.

## Последовательность и агенты

| Группа | Порядок ревизий и исправлений | Что должно стать согласованным |
|---|---|---|
| **1. Основа** | `implementation-discipline` | Границы задачи, ранее выданные полномочия, минимально достаточное исправление, частичная блокировка и доказательства результата. |
| **2. Безопасность и публикация** | `security-reviewer` **∥** `git-engineer` → `gh-utility` | Экспертная security-оценка, сохранность Git-состояния, переход Git → GitHub, CI, merge и завершение локальной работы. |
| **3. Подготовка реализации** | `architecture-engineer` → `spec-engineer` → `delivery-planner` | Продуктовое основание → архитектурные ограничения → проверяемое поведение → исполнимые задачи. |
| **4. Проверка результата** | `typescript-test-engineer` **∥** `concept-conformance-reviewer` → `spec-conformance-reviewer` | Достаточность тестов, фактическая capability, буквальное соответствие спецификации и границы security-выводов. Итоговая совместимость всех десяти скилов. |

Стрелка означает: исправления потребителя начинаются после стабильного **PASS** поставщика. Независимую предварительную инспекцию можно проводить раньше. Взаимные ссылки проверяем совместными сценариями; позднее изменение ранее проверенного контракта требует отдельного исправления его владельца и ограниченного повторного аудита.

**После каждой группы — ваша приёмка и остановка перед следующей.**

Параллельно работают максимум три агента плюс координатор:

- Каждый автор изменяет только закреплённую папку скила. При пересечении поверхностей работа становится последовательной.
- Только координатор управляет индексом Git, коммитами, общим планом и публикацией.
- Аудитор не является автором проверяемого исправления. Проверки используют зафиксированные версии зависимостей; изменяющиеся соседние файлы не дают основания для PASS.
- Слепые исполнители получают отдельный свежий контекст без диагноза, рубрики и соседних результатов.

## Цикл каждого скила

1. **Независимая baseline-ревизия через `skill-reviewer`.** Проверить source/generated, references, metadata, шаблоны, существующие тесты и межскильные контракты. Находки должны показывать конкретный путь к неправильному решению; длина текста сама по себе не дефект.

2. **Минимальные исправления.** Автор применяет `skill-creator`, `skill-source-compiler` и осмысленно `implementation-discipline`: правит исходный bundle и регенерирует производные файлы. Исправный скил не переписываем ради изменений. Проверяемый скил не устанавливает единолично критерии собственной приёмки.

3. **Проверки поведения.** До изменений зафиксировать baseline, исходные данные и независимые критерии. Для существенных изменений сравнить одинаковые задачи на baseline/candidate, включая достаточный правильный случай и отрицательный либо пограничный. Проверять:
   - разрешённую работу, реальные ограничения полномочий и неполные данные;
   - фактическую передачу результата одного скила следующему;
   - ложную готовность, ложный PASS/BLOCKED, выдуманные требования;
   - выбор скила по каталогу отдельно от принудительного применения.

   Сохранять реальные outputs, существенные tool events, изменения файлов, настройки и ограничения наблюдения. Симуляции не выдавать за live-проверку; внешние мутации ради испытаний не выполнять. Временные fixtures не являются дополнительными рабочими worktrees.

4. **Структура и тесты.** Author self-check, `lint`, `check`, изолированная компиляция и readback emitted package. Запускать существующие проверки затронутых пакетов и зависимых fixtures/metadata, включая compiler при необходимости. Не пропускать их только потому, что runtime не менялся.

5. **Независимый re-audit до PASS.** Открытых P1/P2 быть не должно; по P3 фиксировать решение. Повторный связанный FAIL требует RCA, нестабильный результат — проверки гипотезы. Изменение проверенной поверхности инвалидирует только затронутую часть вердикта.

6. **Отдельный коммит скила.** Включать его source/generated, тесты, журнал, evidence и навигацию. При отсутствии исправлений — только результаты ревизии. Никогда не смешивать два скила; дополнительные исправления взаимодействий также коммитить по владельцам. Общий план и сводки — отдельные служебные коммиты. Исходные архивы evidence сохранять без переформатирования.

Журналы и планы — на русском, активные инструкции — на существующем английском. Один общий план; отдельные issues/планы создавать только при необходимости отдельного решения, с предусмотренным аудитом.

## Worktree, приёмка и публикация

- После принятия плана создать **один** `.worktrees/skills-revision`, ветку `codex/skills-revision` от свежего `origin/master`. Проверить отсутствие коллизий и игнорирование каталога. Все новые документы писать уже внутри него.
- Зафиксировать исходные десять пакетов и версии методики, compiler и Astra-гайда. Сохранить принятый план в `docs/plans` с очередным свободным ID.
- На приёмке группы предъявлять отдельные коммиты, independent PASS, результаты взаимодействий, ограничения и краткое состояние для продолжения. Четвёртая приёмка включает итоговую проверку всех десяти скилов.
- После её принятия: полный `pnpm test:ci`, push, **один PR в `master`**, проверки точного SHA и отсутствие нерешённых обязательных замечаний. Merge-коммит **без squash**, чтобы сохранить разделение скилов. Падение CI исправлять минимально в той же ветке с проверкой соответствующего изменения.
- После merge проверить удалённый SHA и CI, синхронизировать основной checkout с сохранением чужих изменений. Удалить только созданные этой задачей worktree и ветку после проверки сохранности и отсутствия активной работы. Завершить проверкой чистоты локального состояния.

**Независимый аудит плана `TEN-SKILLS-PLAN-v1`: PASS.** Будущие ревизии и исправления этим вердиктом не приняты.

## Статус исполнения

ID: `implementation-plan-20260907-2`. План принят оператором 2026-09-07; группы1–2 приняты оператором, группа3 выполнена и ожидает приёмки. Основание: сообщение `01a07cbd-2716-79f1-9c93-a8c6acda8d37`, задача `01a07be0-5ad2-7c31-920e-81e048807c1a`. Worktree `codex/skills-revision`; исходный SHA `4ddcb698457a741028664ed9af441009c4838d23`.

[Независимый аудит плана](../reviews/audit-implementation-plan-20260907-2.md). Текущая граница: приёмка группы3; группа4 и публикация ожидают предусмотренных приёмок. Ниже сохранена хронология предыдущих checkpoints.

## Уточнение оператора и текущий прогресс

Оператор отменил дополнительное требование native planner после проверки документации. Правило удалено из candidate; испытания planner исключены из приёмки, уже полученные результаты сохраняются как withdrawn. Scope delta относительно принятого исходного плана: unchanged. Остальные границы и приёмки сохранены.

| Шаг группы 1 | Статус |
| --- | --- |
| Worktree, общий план, исходные версии | Завершено; служебный commit f6cebb0 |
| Независимая baseline-ревизия | Завершено: 2 P2, 1 P3; закрыты итоговым re-audit |
| Независимые критерии и сценарии | Исходные наборы зафиксированы до edits; planner withdrawn по решению оператора |
| Исправления и генерация | Завершены; итоговая версия без planner, lint/check/compile/readback PASS |
| Парные прогоны и независимый re-audit | 22 исполнения оценены независимо: 9/10 пар PASS, case04 частично INCONCLUSIVE; 2 consumer PASS. Формальный re-audit PASS; ограничения сохранены |
| Коммит скила и приёмка группы 1 | Скил commit 0e79520; independent PASS. Приёмка оператора ожидается |

Группы 2–4 не начаты. Push/PR/merge — после предусмотренной финальной приёмки.

## Приёмка группы 1

`implementation-discipline` 0.2.7: уточнены достаточное основание локальной коррекции, действующий владелец требований и conditional references. Отменённый planner отсутствует. [Журнал](../../skills/implementation-discipline/docs/logs/implementation-log-20260907-1.md), [независимый PASS](../../skills/implementation-discipline/docs/reviews/evidence/g1/final-audit.md), [оценка испытаний](../../skills/implementation-discipline/docs/reviews/assessment-20260907-1.md). Скил зафиксирован отдельным commit `0e795207540a7bfeba04b41e20084caa0fd88464`; общий статус фиксируется отдельно.

К приёмке предъявлены source-grounded исправления F1/F2/P3, structural parity и ограниченное наблюдаемое поведение. Capability — поддержанное локальное действие/ограниченный вывод и реальный handoff спецификатору. Substrate — инструкции, архив и проверки; anti-claims — нет доказанного преимущества над baseline, универсальной надёжности или настоящей editor/deployed capability. 9/10 пар PASS, case04 INCONCLUSIVE только для лишнего требования рубрики; 2 downstream consumer PASS. Аудитор признал этот неподдержанный claim несущественным для F1/F2, без заявления 10/10. Auxiliary compatibility reject сохранён; owning checks PASS.

`accepted now`: технический результат независимого re-audit в указанной границе; приёмка оператором ещё не получена. `not accepted`: группы 2–4, итоговая совместимость десяти скилов, production/native UI, push/PR/merge. `blocking decision`: приёмка группы 1 оператором. `next autonomous action`: none до явного принятия; затем только группа 2 по установленному порядку.

Ключевые решения: локальное доказательство отделено от deployed closure, чтобы не требовать недоступный replay для поддержанного исправления; owner берётся из действующего governance, чтобы не придумывать customer process и не обходить настоящий; условное чтение references сохранено, изменена классификация. Воздействие ограничено дисциплиной действий и handoff; соседние скилы не изменены. Неизменённые собственные формулировки customer chain в downstream delivery-planner проверяются в предусмотренной группе 3, текущий PASS не закрывает их автоматически.

### Состояние для продолжения

Снимок `2026-09-07 17:23:18 UTC`, после commit скила и до служебного commit этого статуса. Repo `skills/custom`, worktree `.worktrees/skills-revision`, branch `codex/skills-revision`; HEAD `0e795207540a7bfeba04b41e20084caa0fd88464`; base/upstream `origin/master` на локально сохранённом `4ddcb698457a741028664ed9af441009c4838d23`, ahead2/behind0. Индекс пуст, единственное unstaged — этот общий план, untracked нет. Служебный commit сменит HEAD, сохранив skill commit; его точный SHA сообщается в checkpoint report, текущее состояние нужно перечитать при возобновлении. Основной checkout и соседние worktrees сохранены.

Последнее принятое основание — исходный общий план, commit `f6cebb0b611559974c1ea55069b3ac531e398ab2`. Audited snapshot `G1-FINAL-NO-PLANNER-v1`, aggregate `b773d8218c2bdc38057b51e2e082374ef68558355a640e5f430a6d5bd328f054`. После аудита изменены только статусы/ссылки журнала и плана, добавлены точные report/readback/snapshot; остальные 130 reviewed files неизменны. Разрешённый administrative delta сохранён рядом с отчётом. Git index/diff проверены, скил содержит только свои 15 paths.

Внешние tracking/publication в этой группе не создавались. Push/PR/merge и вызванного ими CI нет; полный repository CI предусмотрен после принятия группы 4. Следующая автономная операция после фиксации этого статуса отсутствует до приёмки группы 1.

Stop: awaiting explicit approval to continue
Next autonomous action: none

## Продолжение: группа 2

Оператор принял группу 1 сообщением «Продолжай» и разрешил только группу 2. Возобновление: тот же worktree `codex/skills-revision`, HEAD `5982f982ba8b4d30a6a1f6c1e10fe50402d100d8`, чистое состояние подтверждено. Предыдущий hard stop группы 1 снят этим решением; следующая обязательная остановка — приёмка группы 2. Правило planner остаётся отменённым.

| Шаг группы 2 | Статус |
| --- | --- |
| Baseline security-reviewer и git-engineer | Независимые отчёты готовы; 3 P2 security, 1 P2 и 1 P3 Git |
| Критерии и реальные исходные fixtures | Наборы frozen до edits; paired executions и независимая оценка завершены |
| Исправления и проверки двух поставщиков | Security 0.1.13 и Git 0.2.1: owning checks и независимый re-audit PASS; отдельные commits |
| Ревизия gh-utility после стабильного Git PASS | 1.2.2: независимый bounded PASS, P3/D loading limit сохранён |
| Коммиты и приёмка группы 2 | Три отдельных commits готовы; ожидается приёмка оператора |

Source/emitted baseline всех трёх пакетов согласованы, owning lint/check/compile/readback PASS. Существующие 23 docs-contract теста security-reviewer прошли через тот же объявленный package script с npm: установленный pnpm падает до запуска даже на --version. Глобальная установка не менялась. Это обход наблюдаемого сбоя launcher, не установленная первопричина и не замена проверяемых assertions.

## Приёмка группы 2

Группа 2 выполнена в принятом порядке: стабильный Git PASS получен до ревизии gh-utility. Все три скила имеют независимый bounded PASS; открытых P1/P2 нет. Формальные verdicts не означают полной исполнительской надёжности.

| Скил / отдельный commit | Изменение и evidence |
| --- | --- |
| git-engineer 0.2.1 / `8bf1011` | Доступный CI implementation owner вместо обязательного отсутствующего specialist; точный handoff и conditional reference. [PASS](../../skills/git-engineer/docs/reviews/evidence/g2/final-audit.md), [assessment](../../skills/git-engineer/docs/reviews/assessment-20260907-1.md), [журнал](../../skills/git-engineer/docs/logs/implementation-log-20260907-1.md). 10/10 emitted parity; Git A/B/C, catalogue и четыре fresh consumers поддерживают bounded capability. |
| security-reviewer 0.1.13 / `f72ec92` | Общий HIGH gate, re-audit принятой коррекции и зависимый cross-layer scope. [PASS](../../skills/security-reviewer/docs/reviews/evidence/g2/final-audit.md), [assessment](../../skills/security-reviewer/docs/reviews/assessment-20260907-1.md), [delivery repeat](../../skills/security-reviewer/docs/reviews/assessment-delivery-20260907-1.md), [журнал](../../skills/security-reviewer/docs/logs/implementation-log-20260907-1.md). 24/24 package tests,17/17 emitted parity; D delivery gap закрыт полными повторными чтениями. |
| gh-utility 1.2.2 / `9fac71b` | Сохранённая authorization, policy-specific release и operation-specific Projects inputs, все применимые references. [PASS](../../skills/gh-utility/docs/reviews/evidence/g2/final-audit.md), [assessment](../../skills/gh-utility/docs/reviews/assessment-20260907-1.md), [журнал](../../skills/gh-utility/docs/logs/implementation-log-20260907-1.md). 29/29 emitted и24/24 active parity; реальные Git producer→два GH consumers,10 executor/catalogue contexts. |

Ограничения приёмки: Git и Security baseline дают эквивалентные наблюдённые решения; GH candidate улучшил loading B/C, но преимущества итоговых решений не установлено. Обе GH arms пропустили command-map в D: procedural FAIL/P3 сохранён. Аудитор не выявил потерянного уникального safety/input условия для конкретных команд, поэтому bounded PASS допускается без заявления полного instruction adherence. Не требуется новая правка или повтор ради зелёного результата.

Git C был повторён после исправления coordinator setup с обязательным SHA; Security F получил одинаковый frozen ledger во время исполнения. Исходные записи и ограничения сохранены. Security старый D INCONCLUSIVE/BLOCKED не переписан: отдельный повтор закрыл именно недоставленную часть инструкции. Полные GH trial traces не усечены; усечения иных readbacks и границы metadata отражены в отчётах.

Capability в этой группе — поддержанные решения, ограниченные действия на локальных fixtures и действительные agent-to-agent artifacts. Инструкции, compiler и архивы не доказывают live GitHub publication/CI, безопасность приложения, native activation, универсальную надёжность, экономию ресурсов или совместимость всех десяти скилов. Внешних GitHub mutations, push/PR/merge и вызванного ими CI нет. Полный repository test:ci остаётся после приёмки группы 4 по плану.

### Состояние для продолжения группы 2

Состояние перед служебным commit: branch `codex/skills-revision`, HEAD `9fac71b`, local upstream `origin/master` остаётся на `4ddcb698457a741028664ed9af441009c4838d23`; ahead6/behind0 относительно сохранённого ref. Три skill commits сохранены отдельно. Основной checkout и соседние worktrees не менялись. Служебный commit обновит HEAD; точный итоговый SHA сообщается оператору. Индекс перед административной записью пуст; незавершённых skill edits нет.

После независимых snapshot изменены только supporting статусы/ссылки и добавлены точные audit copies; административные delta скилов сохранены рядом с PASS, общий delta — в `docs/reviews/evidence/skills-revision/group2-administrative-delta.json`. Старые aggregates не заявляются хэшами последующих записей. Активные инструкции, исходные критерии, trials и их интерпретация не менялись после PASS.

`accepted now`: независимые технические результаты трёх re-audits в указанных границах. `not accepted`: приёмка группы2 оператором, группы3–4, итоговая совместимость, публикация. `blocking decision`: приёмка группы2. `next autonomous action`: none до явного продолжения; затем только группа3 принятого плана. Отменённый planner не восстановлен.

Stop: awaiting explicit approval to continue
Next autonomous action: none

## Продолжение: группа 3

Оператор принял группу2 сообщением «Продолжай». Состояние возобновления: чистый worktree codex/skills-revision, HEAD be557e915b03267df650b9ca5906ac59078110e9. Предыдущая остановка снята; разрешена группа3: architecture-engineer → spec-engineer → delivery-planner. Предварительная инспекция потребителей возможна параллельно; их исправления начинаются только после стабильного PASS поставщика. Следующая остановка — приёмка группы3. Planner rule остаётся отменённым; push/PR/merge не разрешены на этой стадии.

### Прогресс группы 3

- architecture-engineer 0.1.9: independent PASS, отдельный commit `c275017a062c1abb944d74909b017d7001a2c022`. F1/P2 и F2/P3 закрыты; source/emitted/active parity. Все 8 контекстов дали поддержанные решения, baseline B1 отдельно имеет procedural FAIL чтения reference. Два реальных spec consumers подтверждены. Ограничения dispatch/exposure/усечений сохранены в [отчёте](../../skills/architecture-engineer/docs/reviews/evidence/g3/final-audit.md).
- spec-engineer 0.2.14: independent PASS, отдельный commit `54c1bc94069e8206d23860e764178d654e3261f8`. Исправление выполнено после stable architecture PASS и freeze настоящего architecture packet.
- delivery-planner 0.2.13: independent bounded PASS, отдельный commit `9d4812a8f670a6a740d9659288b9896ef7af3b19`. Edits начаты после stable spec PASS и freeze настоящего spec packet.

Техническая работа группы3 завершена; приёмка оператором и переход в группу4 ещё не достигнуты.


## Приёмка группы 3

Группа выполнена в принятом порядке: стабильный provider PASS и настоящий packet зафиксированы до исправлений каждого потребителя. Три отдельных skill commits сохранены; у каждого независимый PASS в указанной границе, открытых P1/P2 нет.

| Скил / commit | Изменение, проверки и наблюдаемый результат |
| --- | --- |
| architecture-engineer 0.1.9 / `c275017` | Canonical stop predicate сохраняет действующую authorization и ограничивает зависимую часть; conditional references согласованы. Owning checks exit0, 25/25 emitted parity. Четыре producer tasks, два настоящих spec consumers и два catalogue contexts: поддержанные решения; baseline B1 отдельно не прочёл pattern catalog. [PASS](../../skills/architecture-engineer/docs/reviews/evidence/g3/final-audit.md), [журнал](../../skills/architecture-engineer/docs/logs/implementation-log-20260907-1.md). |
| spec-engineer 0.2.14 / `54c1bc9` | Conditional HRB retrieval, provider-only applicability и один подробный dependent-stop contract. Owning checks exit0, 27/27 emitted parity. Шесть spec tasks, два delivery consumers и 12 отдельных catalogue contexts проходят материальные критерии. Одинаковый actual architecture packet у обеих arms. [PASS](../../skills/spec-engineer/docs/reviews/evidence/g3/final-audit.md), [журнал](../../skills/spec-engineer/docs/logs/implementation-log-20260907-1.md). |
| delivery-planner 0.2.13 / `9d4812a` | Established owner/applicable customer governance, самостоятельный current outcome без future prerequisite, сохранён actual support contract. Source/reference/assets согласованы. Owning checks exit0, 21/21 emitted parity. Шесть material plans и 12 catalogue decisions в двух contexts проходят; обе A arms прочли одинаковый actual spec packet. [Bounded PASS](../../skills/delivery-planner/docs/reviews/evidence/g3/final-audit.md), [журнал](../../skills/delivery-planner/docs/logs/implementation-log-20260907-1.md). |

Исправления закрывают доказанные противоречия инструкций; baseline также выдаёт поддержанные конечные решения в этих примерах. Преимущество итоговых решений, универсальная надёжность или экономия ресурсов не доказаны. Реальная граница evidence — сохранённые решения и передача оригинальных agent-produced artifacts. Это не выполнение API, Notebook, импорта, customer workflow или deployed runtime. Native activation и совместимость всех десяти скилов остаются вне G3.

Ограничения не скрыты общим verdict: architecture baseline B1 имеет procedural FAIL, а dispatch/exposure/усечения с восстанавливающими чтениями ограничивают сравнение; spec candidate 01-02 нарушил первоначальный chunk limit, затем полностью перечитал root; delivery baseline A complete loading INCONCLUSIVE, baseline C пропустил patterns и template tail (procedural FAIL). Обязательные candidate material boundaries подтверждены. В delivery оставлено DP-F3/P3 по широкой формулировке patterns: explicit canonical methodology определяет standalone applicability; новый P2-путь не установлен, решение принять без правки записано ревьюером. Не заявляется «все процедурные проверки PASS».

Spec initial compiler anchor error исправлен до freeze; вспомогательный quick_validate одинаково отвергает существующий compatibility key, owning compiler schema его принимает. Architecture и delivery имеют advisory size warnings; это не mandatory gate failures. Три documentation-only пакета не имеют собственных runtime/test scripts; компиляция, source/emitted readback и фактические agent trials составляют применимый contour. Полный repository test:ci предусмотрен после приёмки группы4 и ещё не запускался на эту публикацию.

Исходные evidence archives сохранены без переписывания; 317 architecture, 365 spec и 330 delivery member files проверены побайтово по archive manifests. После независимых snapshots изменены только supporting статусы/ссылки и добавлены exact report/evidence copies. Персональные administrative-delta рядом с PASS и общий `docs/reviews/evidence/skills-revision/group3-administrative-delta.json` отделяют эти записи от проверенных hashes. Активная поверхность всех трёх пакетов неизменна после PASS.

### Состояние для продолжения группы 3

Снимок 2026-09-07 20:31:42 UTC до служебного commit статуса: worktree `.worktrees/skills-revision`, branch `codex/skills-revision`, HEAD `9d4812a8f670a6a740d9659288b9896ef7af3b19`. Local upstream `origin/master` — сохранённый `4ddcb698457a741028664ed9af441009c4838d23`, ahead10/behind0 относительно этого локального ref; remote не перечитывался для publication. Индекс после skill commit пуст, единственный residual — общий план, затем добавлен общий administrative record. Служебный commit изменит HEAD; точный итоговый SHA сообщается оператору. Основной checkout и соседние worktrees сохранены.

Внешние tracking/publication не создавались. Push/PR/merge и вызванного ими CI нет. Native planner rule остаётся отменённым. `accepted now`: независимые технические результаты G3 в описанных границах; `not accepted`: приёмка G3 оператором, G4, итоговая совместимость и публикация. `blocking decision`: приёмка группы3. `next autonomous action`: none до явного продолжения; затем только группа4 в порядке typescript-test-engineer ∥ concept-conformance-reviewer → spec-conformance-reviewer и итоговая совместимость всех десяти скилов.

Stop: awaiting explicit approval to continue
Next autonomous action: none
