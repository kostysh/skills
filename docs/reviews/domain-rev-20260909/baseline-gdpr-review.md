# Независимый baseline-аудит gdpr-compliance

**FAIL — 2 P1, 2 P2.** Вывод основан на исходных инструкциях и прямых контрактах; поведенческая проверка ожидается отдельно. Это не полный behavioral PASS и не заключение о GDPR-соответствии какого-либо продукта.

## Основание и границы

- Режим: `baseline`; assurance: `independent`. Ревьюер не создавал и не исправлял проверенный snapshot.
- Репозиторий: `/home/kostysh/.codex/skills/custom/.worktrees/domain-rev-20260909`.
- Snapshot: Git `d89d66f2c99bf8b9e84e5b4def54fa60192856a5`, `gdpr-compliance` source-version `0.2.1`. До и после чтения HEAD совпал; `git diff --quiet HEAD -- skills/gdpr-compliance` завершился успешно. Generated metadata hash: `0562d00032bc984b29155b7fcd5dc5035d78a5e8fcc529cac3ed22f84585f481`; это прочитанный hash, не независимо пересчитанный compiler hash.
- Потребители: инженер, product/requirements owner, архитектор, автор спецификации, исполнитель исправлений и тестов, контролёр с legal/DPO support. Проверяемая capability: ограниченный GDPR engineering assessment с обоснованными controls, evidence gaps и пригодными handoffs.
- Включены: фактический `AGENTS.md`, `docs/skill-standard.md`, `skill-reviewer/SKILL.md`, methodology и forward-testing; полный declared target source (`skill.yaml`, оба fragments), emitted `SKILL.md`, три references, три templates, UI metadata. Supporting README/compile report и релевантные строки двух последних logs использованы только для происхождения прежних claims; их PASS не принят как текущая проверка.
- Соседи прочитаны только для прямых контрактов architecture/spec/requirements/testing и, детально в затронутой части, security-reviewer. Их изменения и отдельный аудит не выполнялись.
- Не выполнялись: runtime trials, erasure/export/consent действия, compiler regeneration/check, CI, авторская remediation, Git mutations, делегирование, публикация. В target не внесено изменений. Единственный созданный файл — этот отчёт в `/tmp`.

## GDPR-B01 — P1: примеры вводят безусловный analytics-consent контракт поверх условного правила

**Basis: conflicting, source-grounded; наблюдение поведения ещё отсутствует.**

Локаторы относительно snapshot:

- `skills/gdpr-compliance/fragments/overview.md:18` / emitted `SKILL.md:59`: capability сформулирована как отсутствие загрузки optional analytics до valid consent без условия применимости.
- `references/audit-methodology.md:185` объявляет P1 для analytics events до загрузки consent state; `:201` даёт готовое handoff-ограничение: `No analytics SDK or event dispatch may run until consent state permits that purpose.`
- `references/control-catalog.md:162` относит optional tracking/marketing/profiling без valid consent к P0/P1 без условия.
- При этом canonical C6 `references/control-catalog.md:145-156` правильно ограничивает consent gating случаями, где consent является basis либо требуется ePrivacy; methodology `:177` явно запрещает требовать consent для любого processing.

**Путь ошибки:** пользователь приносит ограниченный analytics assessment с документированным применимым основанием и подтверждённым национальным exemption, либо серверную аналитику без consent-dependent terminal access → агент использует готовый P1 пример или handoff → объявляет обязательный consent и блокирует/переписывает допустимый дизайн только из-за отсутствия consent state. Это не требование снять реальные safeguards: применимость exemption, basis и evidence всё равно подлежит проверке.

**P1 screen:** supported consequence — silent authority invention: готовый engineering constraint становится универсальной правовой обязанностью и основанием release BLOCK. Это сильнее неточности текста. Правильный C6 не устраняет конфликт на других активных поверхностях; источник не даёт единственного канонического правила, которое явно ограничивает примеры.

**Правовая опора:** EU GDPR Article 6 содержит несколько оснований, а не только consent. Официальная [публикация GDPR в EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?from=EN&qid=1543829083725&uri=CELEX%3A32016R0679) использована для этого ограниченного тезиса. Национальный контрпример: [CNIL, Cookies : solutions pour les outils de mesure d’audience](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience), публикация 04.07.2025, прочитана 09.09.2026, описывает условное освобождение audience measurement trackers от consent по французскому Article 82. Это Франция, а не автоматическое правило для всей EU/EEA; конкретную конфигурацию или организацию данный аудит не одобряет.

**Направление исправления:** сохранить conditional C6 как owner; привязать capability-примеры, P1 examples и handoff к установленной consent applicability/purpose, не добавляя универсальный consent gate.

**Closing falsifier:** одинаковый набор исходных фактов в двух свежих cases: (a) доказан consent-dependent analytics flow, отправляющий события до consent → корректный gap/BLOCK; (b) достаточное документированное основание и применимый exemption при выполненных controls → отсутствие придуманного consent blocker и отсутствие юридической сертификации. Проверить итоговый constraint, а не только название disposition.

## GDPR-B02 — P1: runtime probes не отделяют право аудита от разрешения менять и удалять данные

**Basis: direct missing side-effect contract plus inferred action path.**

- `references/implementation-evidence.md:24-26`: достаточным условием применения probes назван доступный runtime/test context.
- `:46-49`: `Create or identify a data subject`, затем `Execute erasure workflow or deletion trigger`; рассматриваются vendor deletion и secondary stores.
- `:59-61`: seed expired data, run retention workflow, verify deletion/irreversible anonymisation.
- `:32-36`, `:72`: changing consent и actual access request также перечислены как probes.
- Root, methodology и reference не устанавливают read-only baseline, отдельную action authority, disposable/synthetic test boundary или fallback к evidence/probe plan при недостаточных полномочиях. Это не пропуск команды: конкретные изменяющие действия уже предписаны.

**Путь ошибки:** обычный запрос «аудируй имеющуюся реализацию удаления» с рабочим runtime доступом → наличия контекста достаточно для guide → агент выбирает существующего субъекта и запускает erasure/retention, хотя разрешён только анализ. Удаление может затронуть vendors/secondary stores; тест фактически меняет объект оценки.

**P1 screen:** credible dangerous action — необратимое удаление/анонимизация либо внешнее распространение запроса без operation-specific authority. В этом аудите такого действия не совершалось. Высшие host rules могут остановить действие, но переносимый local method обязан сам определять границу своих предписанных probes; полагаться на неуказанный защитный контекст недостаточно по `docs/skill-standard.md` разделам Instruction quality и Portability.

**Направление исправления:** сделать review/readback default; разделить предлагаемый probe и его исполнение. Для изменяющего probe требовать уже имеющуюся авторизацию конкретного действия и известную тестовую границу/данные, учитывать внешние эффекты, продолжать анализ и отдавать воспроизводимый probe plan при отсутствии разрешения. Не вводить повторное согласование уже разрешённых проверок.

**Closing falsifier:** на audit-only request с доступным runtime агент не вызывает erase/retention/export/consent mutations, выдаёт подтверждённый analysis и bounded missing evidence; на явно авторизованном disposable synthetic case выполняет применимую проверку без лишнего запроса разрешения и явно ограничивает её доказательность. Оценивать tool events и state, а не только final summary.

## GDPR-B03 — P2: исправление уязвимостей передаётся read-only reviewer

**Basis: direct contract conflict.**

- `skill.yaml:197-200` / emitted `SKILL.md:202`: `security-reviewer owns detailed security analysis and vulnerability remediation`.
- Фактический `skills/security-reviewer/SKILL.md:17-19` требует bounded read-only review; `:28-31` исключает implementing a fix. Его description также исключает fixes.
- GDPR handoff root `:189`, methodology `:197-206` и report template предоставляют constraints/verification, но не исправляют эту ошибочную принадлежность remediation.

**Путь ошибки:** GDPR audit выявляет утечку персональных данных через logs/access control → следующий consumer должен исправить уязвимость → handoff отправляется `security-reviewer` с ожидаемым remediation → принимающий skill закономерно ограничивается review или возвращает работу, и необходимый implementation output не производится указанным owner.

**P1 screen:** подтверждённый исход здесь — материальный разрыв interop и задержка исправления. При соблюдении принимающим skill своего явного read-only контракта нет основания утверждать опасную mutation либо ложный PASS; поэтому P2, а не P1. Не считать security-reviewer исполнителем лишь по имени.

**Направление исправления:** оставить security-reviewer владельцем exploitability/threat evidence и re-audit; исправление направлять доступному implementation/domain owner с конкретными input/output/verification obligations. В рамках принятого общего outcome сделать прямые handoffs для product decision, architecture, spec, implementation, testing и GDPR re-audit по фактическому оставшемуся решению, без принудительного арх/spec обхода для каждого локального fix. Отсутствующий специалист ограничивает зависимый вывод, не весь локальный аудит.

**Closing falsifier:** на локальном logging fix handoff называет исполнителя, способного выдать patch/tests, а security-reviewer — только нужный review output; при готовом spec не требует ненужного нового architecture/spec документа. Consumer может действовать без переопределения privacy obligation.

## GDPR-B04 — P2: optional-метки конфликтуют с обязательными условиями загрузки/проверки

**Basis: direct/conflicting.**

- `skill.yaml:35-40` задаёт `required: false` для implementation-evidence и императивный `Read this when auditing ...`; `surfaces.optionalReferences` повторяет optional-классификацию.
- Emitted `SKILL.md:244-245` помещает тот же императив в `Optional references`; всегда читаемая methodology `:124-126` требует прочитать файл при code/config/tests/runtime audit.
- Смежный конфликт того же optional-contract: `skill.yaml:265` / root `:258` объявляет внешние GDPR guidance/regulator pages optional, если пользователь их не supplied. Одновременно source workflow / root `:127` и methodology `:25` требуют проверять official current status для volatile claims при наличии tools. Пользователь не обязан заранее supplied нужную страницу, чтобы возникло это условие.

**Путь ошибки:** executor/packager следует optional-классификации и при implementation audit пропускает reference с concrete evidence limits и probes; либо при transfer/current-law вопросе трактует не supplied official page как необязательную несмотря на возможность проверить currentness. Альтернативный executor следует императиву. Пакет не обеспечивает однозначный одинаковый contract. В частности, label `optional` не должен скрывать conditional mandatory guidance по normative skill standard.

**P1 screen:** доказана неоднозначность progressive disclosure/currentness contract, не наблюдавшийся false closure или конкретный неверный transfer verdict. Другие активные boundaries ограничивают claims, поэтому это P2; не приписывать runtime исход, которого ещё нет в trial evidence.

**Направление исправления:** явно обозначить conditionally required local reference и синхронизировать source/emitted categories. Отделить optional external background от обязательного official-source verification для текущего правового тезиса; при недоступности источника сохранять engineering analysis и ограничивать зависимый вывод. Не загружать все external/legal материалы для каждого narrow review.

**Closing falsifier:** при code/runtime audit executor читает evidence guide, при узком PRD-only assessment не обязан его читать; при волатильном legal/transfer вопросе проверяет доступный official status независимо от того, дал ли пользователь URL. При недоступном источнике не выдумывает currentness и не прекращает независимый engineering analysis.

## Что уже поддержано и что остаётся недоказанным

Root/методология различают accountable controller decision, legal interpretation, DPO advice, technical activation и observed control; candidate basis не разрешает activation. Coverage statuses не означают legal PASS. Map/template учитывают operational identities и разные environments, а access и portability имеют отдельные scopes. Это существенные полезные ограничения, которые требуется сохранить. Прицельное чтение source/emitted не выявило независимого semantic drift на описанных finding paths; compiler parity отдельно не исполнялась.

Количество текста само по себе не finding. Полный processing map, inventory полей и control catalog полезны для широкой оценки; narrow output уже допускается. Нет основания требовать runtime package или постоянный harness для documentation-only skill. Нет оснований переносить национальное exemption на всю EU/EEA или выдавать правовую сертификацию из данного review.

Исторические PASS относятся к прежним snapshots и отдельным claims. Текущий итог сохраняется как **independent source-grounded FAIL**, поведенческие trials, catalogue selection, фактическая package/compiler parity и реальные внешние control boundaries ещё не проверены. Следующий owner — автор remediation; этот reviewer не изменяет target. После фиксирования candidate следует проверить исходные failure paths и adjacent sufficient/correct cases по заранее установленным критериям, затем выполнить независимый bounded re-audit.

<oai-mem-citation>
<citation_entries>
MEMORY.md:28-30|note=[kept active instructions separate from Russian reports and preserved blind trial distinctions]
MEMORY.md:36-36|note=[kept source and emitted instruction surfaces distinct]
</citation_entries>
<rollout_ids>
01a07be0-5ad2-7c31-920e-81e048807c1a
</rollout_ids>
</oai-mem-citation>
