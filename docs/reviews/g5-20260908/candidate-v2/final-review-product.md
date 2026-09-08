# G5 — независимый итоговый review продуктовых навыков

**prd-engineer — PASS. requirements-approval — PASS.** Assurance: `independent`. Незакрытых P1/P2 на проверенной границе не установлено. Два baseline P2 закрыты; новых материальных findings нет.

Режим: re-audit PRD-BASE-1 / RA-BASE-1 плюс change assessment всех прямых контрактов двух пакетов в G5 delta. Reviewer не автор и не исправлял кандидат. Потребитель — владелец G5; способность — переносимые инструкции, позволяющие агенту подготовить полезный PRD или согласование, передать принадлежащие владельцам решения и честно ограничить readiness/closure. Это не сертификация продукта, native activation или внешних интеграций.

## Стабильная основа

- Baseline Git: `504b87331f22b3a5303875bef69163a40d4372d7`; исходные findings: `.worktrees/g5-methodology/docs/reviews/g5-20260908/baseline/baseline-product-review.md`.
- Установленный кандидат: `/tmp/g5-evidence-8z1wlw3e/candidate-v2/skills`; manifest identity `6ab6ffe4b3646630d01c775c629212fc6af57c7a4e6d5c64e18e305499f6ffbc`, 446 файлов с неизменными соседями.
- Source: `/tmp/g5-evidence-8z1wlw3e/candidate-v2-source/skills`; identity `14e896ffa04c5641919487e370f0331bf2c3c94a4a88822a0deb277afdfece37`, 88 файлов четырёх исходных пакетов.
- Exact delta: `/tmp/g5-evidence-8z1wlw3e/candidate-v2-diff.patch`; рассмотрены hunks только PRD/approval и непосредственно нужные неизменные стыки.
- Все перечисленные path/SHA256 проверены до и после чтений: несовпадений нет. Повторно вычислены identity как SHA256 упорядоченного compact JSON массива `{path,sha256}` с путями относительно корня снимка; обе совпали. Source/generated SKILL.md двух целей побайтно совпадают, overview fragments присутствуют, корневые Markdown links разрешаются.

Прочитаны repository AGENTS/skill-standard, skill-reviewer root/methodology/forward-testing, implementation-discipline, maintenance AGENTS целей, source delta YAML/fragments/template, emitted roots и UI metadata. Неизменные architecture/spec/delivery источники проверены только для потребления продуктового input: никакой передачи собственной authority через PRD-ready не возникает. Полный повторный аудит соседей, code-reviewer и retrospective-analysis исключён. Пакеты не редактировались; installs, compilation, тесты и внешние mutations reviewer не запускал.

## Закрытие замечаний и прямая регрессия

| Основание | Delta и canonical contract | Evidence и вывод |
| --- | --- | --- |
| PRD-BASE-1: обязательный недоступный implementation-discipline | `prd-engineer/SKILL.md`, Start here 2: локально достаточные outcome/actor/scope/output/simplicity/falsifier; доступный сосед применяется, недоступный раскрывается без блокировки draft или вымышленного gate | Fresh isolated P3 создал полезный draft, не потребовал установку и не заявил применение соседа. P1 с доступным соседом также сохранил ограничения. Закрыто. |
| RA-BASE-1: компиляция при обычном согласовании | `requirements-approval/SKILL.md`, Portability checklist: каждый maintenance шаг условен, обычная работа не требует compiler | A1 подготовил итальянский Q-17 при недоступных сервисах; A2/F сохранили полезный результат. Emitted root явно исключает runtime compilation. Закрыто. |
| Draft versus source completeness | PRD Reconcile sources и template разделяют полезный draft от completeness/ready; для сильного утверждения сохранены bounded universe, atoms, двусторонняя связь и блокирующие пропуски | P1/isolated P3 сохраняют строки/поля/порядок/фильтры, неизвестные метрики и draft authority без искусственного полного реестра. P2 отклоняет ready новой v3 и endpoint-only acceptance. Ослабления ready gate не найдено. |
| Authority и permission reuse | PRD current-version approval отделён от входов; approval повторно использует только действие/target в прежнем разрешении | P2 не переносит v2 approval на v3; A2 не превращает complete answer в approved PRD. A1/F не требуют лишних разрешений ради подготовки. Изменение не разрешает новые внешние действия. |
| Удалённые дубли PRD | Acceptance integrity осталось в Write testable requirements; source authority в Establish authority; readiness в Run PRD quality gate; architecture boundary в Add only needed modules/Interop; AI evaluation в validation соответствующего этапа | Удалены повторные формулировки, но не обязательства. Template сохраняет repository convention checklist и fallback, доступный через условный required trigger. |
| Удалённые дубли approval | Sender/authority/currentness и attachment fallback остались в Assess replies; public facts/preference в Triage; exact Project mapping/readback и substrate prohibition в Propagate; traceability в per-question output и durable route | Полный набор удалённых норм сопоставлен с оставшимися canonical местами; отдельный запрет complete→closure остаётся и после удаления повторной финальной строки. |
| Runtime/environment/narrower solution | Approval Triage проверяет применимость: factual answer может снять вопрос, наблюдаемое поведение не выбирает customer preference; reuse owning record сохранён | A1 не блокируется недоступными несвязанными сервисами и не изобретает техническую альтернативу. Existing-record dedup не удалён. |
| PRD ↔ approval и соседи | Approval выдаёт code/source/authority/obligation/gap; PRD явно принимает этот input, владеет изменением и approval текущей версии. Spec требует accepted inputs, architecture сохраняет решения, delivery не делает draft ready | A2 выдаёт употребимый Q-17 handoff с точным решением, новой версией/trace, допустимым follow-up и независимым Q-18. По inspection consumer не должен придумывать владельца или принимать чужую authority. |

P1 screen проверенной delta: потенциальные последствия — ложное ready, подмена customer preference, ложное closure, неразрешённая публикация. Для них сохранены явные канонические запреты и наблюдались отрицательные решения P2/A2. Поддержанных путей P1 не найдено. У прежних P2 эффект был лишний gate/блокировка, а не установленная опасная mutation; correction закрывает именно этот путь. Размер approval 15002 bytes против рекомендации 15000 — advisory, не нарушение mandatory gate; повышение лимита не использовалось, самостоятельный P3 без полезного поведенческого основания не выставляется.

## Поведенческие свидетельства и ограничения

Критерии зафиксированы до source edits: `.worktrees/g5-methodology/docs/reviews/g5-20260908/assessor-criteria.md`; raw tasks — соседний `case-inputs.md`. Прочитаны фактические outputs `/tmp/g5-evidence-8z1wlw3e/runs/candidate-product-trials.md` и `candidate-prd-isolated.md`.

| Case | Trial result | Наблюдение |
| --- | --- | --- |
| P1 | PASS | Полезный короткий draft, условия сохранены, TBD, без ready. |
| P2 | PASS | v3 non-authoritative/blocked, endpoint недостаточен, precise product-owner handoff. |
| P3 общий | INCONCLUSIVE для isolated claim | Executor ранее читал соседа; output годится только как guided simulation, не доказательство отсутствия зависимости. |
| P3 свежий isolated | PASS | Локальный PRD draft без соседа и без заявления о его gate; исправленный failure path проверен. |
| A1 | PASS | Итальянский Q-17, оба текущих варианта, draft без сервисного blocker. |
| A2 | PASS | Q-17 complete/partial workflow, Q-18 non-answer/partial, точная передача PRD без false verified. |
| F | PASS | Русский текст с сохранёнными кодом/вариантами, только подготовка. Static replay, не live steering. |

По сохранённому baseline и авторской оценке те же продуктовые случаи уже давали полезные ответы; это не измеренное улучшение success rate и не опровержение baseline source defects. Улучшение — устранённая неоднозначность обязательных инструкций с сохранёнными наблюдаемыми решениями. Baseline selection S1/S2 и соседние S5–S7 переиспользованы только для прежних names/descriptions: catalog-parity подтверждает неизменность; это ограниченный catalog sample, не native auto-loading.

Общий product executor — fresh `g5_candidate_product_trials`, но несколько cases в одном контексте; он ошибочно прочёл весь raw casebook, без assessor rubric/diagnoses. Эта экспозиция раскрыта и не названа физической изоляцией. Для isolated P3 координатор подтвердил `g5_candidate_prd_isolated`, `fork_turns=none`, assigned `gpt-6-astra`, reasoning inherited, только raw P1 и PRD active files, без rubric/diagnoses/соседних bodies. Полная независимо полученная runtime metadata и инструментальная telemetry отсутствуют. Предоставленные ответы — реальные ответы trial agents на синтетические факты; assertions об отсутствии внешних действий не превращены в доказательство полной внешней телеметрии. Hash readback подтверждает только неизменность снимков.

Readback packaging/diagnostic records подтверждает compiler check, compile и quick_validate двух целей: exit 0. Обязательный test:ci 108/108, exit 0 принят как наблюдение автора из implementation log (session 9450, chunks 8192df/ee455c), reviewer его не запускал и полного stdout не инспектировал. Повтор общих тестов без новой гипотезы не нужен. Эти проверки структурные, не behavioral approval.

Применён официальный [GPT-6 Astra prompting guidance](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices), непосредственно прочитанный reviewer: продолжение полезной авторизованной работы, ясная иерархия инструкций, конкретное объяснение настоящего blocker, соразмерная verification и concise output. Кандидат реализует это через локальный draft fallback, условные service checks и dedup; примеры permission/delegation из гайда не импортированы как authority.

Оба PASS относятся к указанной portable instruction/change границе при перечисленных пределах evidence. Не заявлены полная надёжность на всех задачах, Gmail/GitHub/Git integration, продуктовый runtime, автоматическая native activation, customer approval или публикация. Следующий владелец — координатор G5: сохранить итоговые evidence/log и пройти оставшийся принятый checkpoint; этот report не разрешает commit/push/merge.

## Дополнение: J1 — фактическое потребление передачи A2

**J1 trial — PASS; оба formal v2 PASS сохранены.** Это дополнительная проверка одного прямого handoff, без повторного аудита неизменных инструкций. Вход: `/tmp/g5-evidence-8z1wlw3e/joint-handoff-task.md`; критерии, зафиксированные до исполнения: `.worktrees/g5-methodology/docs/reviews/g5-20260908/joint-handoff-input.md`; фактический результат: `/tmp/g5-evidence-8z1wlw3e/runs/joint-execution.md`, только раздел J1. J2/J3 не оценивались этим дополнением.

PRD consumer отразил Q-17 как уведомление только в кабинете и отсутствие email, сохранил точный ответ-основание и исходную возможность получения отчёта. Q-18 остался TBD за заказчиком и не заблокировал независимое обновление Q-17. Локальная редакция J1-draft-1 явно non-authoritative/draft-only, без ложного утверждения о публикации или одобрении версии. Возврат в approval сохраняет Q-17 complete/partial и Q-18 non-answer/partial, общий partial: текст ответа не объявлен durable disposition. По всем предварительным критериям наблюдаемый ответ пригоден потребителю.

Exposure: fresh executor по сообщению координатора; в сохранённом отчёте заявлены разрешённые task inputs, active PRD/retro references и implementation-discipline, без criteria/reviews/baseline. Несколько разных задач выполнены одним executor, поэтому это не single-case физическая изоляция. Единственная заявленная запись — output; отсутствие внешних действий поддержано границей задания и отчётом, не полной независимой телеметрией. Это supplemental execution по синтетическим фактам, не baseline comparison, реальное customer approval, publication или runtime proof.

Повторная read-only сверка всех файлов этой пары с v2 manifests: installed 35/35 и source 41/41 без hash mismatch. Изменение unrelated retro не переносит и не отменяет verdict этой пары. Новых P1/P2 и оснований для remediation J1 не установлено.
