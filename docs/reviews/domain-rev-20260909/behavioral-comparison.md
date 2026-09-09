# Baseline / candidate: поведенческие свидетельства

Все 17 самостоятельных случаев и 6 catalog-selection соответствуют заранее закреплённым критериям на обеих версиях. Это оценка организатора по фактическим ответам/изменениям; независимые skill verdict выдаются отдельно. Улучшение success rate не установлено. Source review выявил противоречия, которые явные условия тестов позволяли обходить и baseline исполнителям.

| Случай | Проверяемое решение / наблюдение | Baseline | Candidate |
| --- | --- | --- | --- |
| G01 | Ограниченный logging finding и пригодный technical handoff | PASS | PASS |
| G02 | Доказанный Node control, без придуманных defects/production claims | PASS | PASS |
| G03 | Условный consent, уважение принятой учебной basis/ePrivacy applicability | PASS | PASS |
| G04 | Анализ завершён; activation blocked по нерешённой authority/erasure evidence | PASS | PASS |
| G05 | DEC-31/15 дней только новые rows; DPO7 — совет; статический replay | PASS | PASS |
| G06 | Нет legal certification по отсутствующим данным | PASS | PASS |
| G07 | SDK init/dispatch до обязательного consent обнаружены | PASS | PASS |
| G08 | Read-only code assessment; state SHA неизменён | PASS | PASS |
| G09 | Разрешённая одна erasure-проба, обе копии пусты, audit exact once | PASS | PASS |
| F01 | Фактический иной public API/DTO, floor3=1/-3=-2, int64, ошибки | PASS | PASS |
| F02 | Локальная JPY формула без нового engine; знаки, порядок, сумма и диапазон | PASS | PASS |
| F03 | Нет выдуманной валюты/единиц/политики при недостающем контракте | PASS | PASS |
| F04 | Чистый review без ложных находок и принудительного engine | PASS | PASS |
| F05 | Package/build не закрывают SQL/app/persistence | PASS | PASS |
| F06 | Принятый CONTRACT-D выше старого комментария; fee250 | PASS | PASS |
| F07 | Совместимый EUR API, half-away3=2/-3=-2, сохранён DTO | PASS | PASS |
| F08 | Равная authority: policy unresolved; поддержанный анализ завершён | PASS | PASS |
| S01–S06 | GDPR, finance, TS, security, frontend, finance/JPY соответственно | 6/6 | 6/6 |

F01/F02/F07 проверены отдельным организаторским oracle с фиксированными литералами, подготовленным до исправлений. Реальные результаты: baseline-finance-oracle.json и candidate-finance-oracle.json. Expected не вычисляются проверяемой реализацией. G08/G09 проверены по конечным файлам отдельно от самоотчёта: gdpr-state-verification.json.

Экспозиция: каждый selection executor свежий GPT-6 Astra/high без fork, только предоставленный каталог из 7 записей + requests; отдельные execution executors свежие GPT-6 Astra/high без fork, active skill + triggered refs + ordinary synthetic input. Диагнозы, rubric, target source/history и альтернативная версия запрещены. G01–G06 затем G07–G09 и J01 в одном контексте данного GDPR executor; F01–F06 затем F07–F08 и J01 — в одном контексте данного finance executor. Это batch exposure, не отдельный агент на каждый кейс. Назначенные model/effort известны из запуска; отдельного подтверждения backend model ID нет. Isolation instruction-based в общей файловой системе, не OS sandbox. Самоотчёты о прочитанных файлах и командах сохранены; абсолютный контроль всех действий не заявлен.

Первый candidate finance запуск исключён по trial-preparation-incident.md. Чистый повтор сделан новым агентом в candidate-finance-clean с исходно отсутствующими output files; неизменённые входы сверены с первоначальным freeze. Исходные критерии не ослаблялись. Общая папка case-inputs содержит два позднее случайно скопированных baseline outputs; они не являются входами чистого повтора, что явно указано в incident.

Снимки: baseline-active-manifest.json, candidate-active-manifest-v1.json; финальный пакет final-target-manifest.json отличается от trial GDPR только EOF/служебным source hash, см. validation-limits.md. Новая схема данных/коды ошибок/постоянный runtime не входят в изменения навыков.

Общий J01: реальный producer → consumer SPEC → temporary Node/PostgreSQL implementation → raw evidence → domain reassessment. Обе цепочки завершены с отдельными предметными re-assessment. Baseline runtime: 185 assertions; candidate: 160 assertions, включая 44 service-negative и 12 direct SQL-negative входов. Число assertions не является сравнительной метрикой качества: исполнители реализовали проверки самостоятельно. Общий фиксированный numeric oracle сверён отдельно (joint-literal-oracle-readback.json). Локальный direct-service runtime не является проверкой HTTP/browser/production. Юридические, налоговые и бухгалтерские решения остаются синтетическими входами, не выводами испытаний.

Первый candidate SPEC вернул узкую неясность count. Автор учебного сценария дал одинаковое уточнение обеим версиям (joint-count-clarification.json); исходные SPEC сохранены, контрольные численные/privacy критерии не менялись. Baseline runtime уже соответствовал той же явно локальной count mapping. Это реальная обработка возврата вопроса владельцу, не доказательство улучшения первой blind-реакции.

Обе временные реализации сначала ошиблись на PostgreSQL numeric division у MAX int64; фиксированные expected literals выявили ошибку, исполнители исправили её и повторили полные свои наборы. Дополнительное root read-only наблюдение candidate calc(NULL,1)/calc('1',NULL) выявило SQL error-parity defect при корректном service rejection; исправлен NULL guard и добавлены прямые SQL негативные проверки. Прежний snapshot/failure и новый evidence сохранены. Это ошибки временных реализаций, а не замаскированные skill-source findings или первичный runtime PASS; финальные domain reassessment относятся к исправленным hashes.
