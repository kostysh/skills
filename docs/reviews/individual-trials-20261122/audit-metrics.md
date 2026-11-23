# Сводка аудитов

Скилов 7, исследований 7, разных заданий в парах 14. Исполнений 28, оценок 36, технических стартов 0.

Хотя бы один определённый парный исход у 7/7 скилов и в 14/14 заданиях. Для 0 скилов и 0 заданий такого исхода нет.

| лучше | хуже | обе прошли | обе ошиблись | недостаточно | Назначено пар |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | 11 | 1 | 0 | 14 |

Слева указан проверяемый вариант, справа контроль. PASS/FAIL означает «лучше», FAIL/PASS означает «хуже». PASS/PASS и FAIL/FAIL означают одинаковый исход. Для каждой доли знаменателем служит число всех назначенных пар этой серии.

Отдельно повторно оценено пар 0. Сумма служит для сверки записей. Выводы относятся к отдельным сериям.

Для проверки согласия оценщиков назначено 7 работ, две пригодные оценки у 7, пропущено 0. Согласие 7/7, разногласий 0, без решения 0.

## code-reviewer · Индивидуальные испытания 2026-11-22 · gpt-6.2-sol / medium

[Протокол](code-reviewer/results.md). Исполнений 4, оценок 5, технических стартов 0, заданий в парах 2.

| Серия | Сравнение | Фаза | Рубрика | Выдача | Заданий | лучше | хуже | обе прошли | обе ошиблись | недостаточно | Пар | B без подсказки, выполнено / ошибка / нет данных | Граница |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | 0.4.9/B | primary | R1 | P1 | 2 | 0 | 0 | 1 | 1 | 0 | 2 | 2 / 0 / 0 | Две локальные задачи, явная загрузка, gpt-6.2-sol / medium. · [основание](code-reviewer/results.md#pairs) |

| Серия | Пара | Задание | Проверяемый | Контроль | Исход | Причина |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary-1 | ordinary | [866771bd5e6e](code-reviewer/runs/866771bd5e6e/events.jsonl.gz) [PASS](code-reviewer/assessments/first/signed.json) | [db6e902f9b88](code-reviewer/runs/db6e902f9b88/events.jsonl.gz) [PASS](code-reviewer/assessments/first/signed.json) | обе прошли | — |
| Версия / без пакета | boundary-1 | boundary | [46722400d865](code-reviewer/runs/46722400d865/events.jsonl.gz) [FAIL](code-reviewer/assessments/first/signed.json) | [057f8337e97f](code-reviewer/runs/057f8337e97f/events.jsonl.gz) [FAIL](code-reviewer/assessments/first/signed.json) | обе ошиблись | — |

| Серия | Задание | Работа B | Действие B | Изъятие | Без подсказки | Свидетельство |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary | db6e902f9b88 | выполнено | complete | выполнено | [Автор разрешил слияние и прямо указал, что «02» и «2» имеют равный числовой ключ и сохраняют порядок поступления.](code-reviewer/assessments/first/signed.json) |
| Версия / без пакета | boundary | 057f8337e97f | выполнено | complete | выполнено | [Автор показал, что предложенный форматтер выводит «—» и для 0, и для None. Он также указал, что идентификаторы подтверждают изменение sheet.pmf, а оценка содержимого макета остаётся открытой.](code-reviewer/assessments/first/signed.json) |

| Отдельная работа / переоценка | Редакция | Задание | Повтор работы | Рубрика | Выдача | Исходное мнение |
| --- | --- | --- | --- | --- | --- | --- |
| [866771bd5e6e](code-reviewer/runs/866771bd5e6e/events.jsonl.gz) | 0.4.9 | ordinary | — | R1 | P1 | [first-c172204a · d8827d04d7 · PASS](code-reviewer/assessments/first/signed.json) |
| [866771bd5e6e](code-reviewer/runs/866771bd5e6e/events.jsonl.gz) | 0.4.9 | ordinary | — | R1 | P1 | [second-1ff7d329 · d8827d04d7 · PASS](code-reviewer/assessments/second/signed.json) |

Согласие 1/1. Назначено 1, без двух пригодных оценок 0, разногласий 0, без решения 0.

| Работа | Рубрика | Выдача | Оценщик 1 | Оценщик 2 | Разбор |
| --- | --- | --- | --- | --- | --- |
| [866771bd5e6e](code-reviewer/runs/866771bd5e6e/events.jsonl.gz) | R1 | P1 | [first-c172204a · PASS](code-reviewer/assessments/first/signed.json) | [second-1ff7d329 · PASS](code-reviewer/assessments/second/signed.json) | согласие |

## concept-conformance-reviewer · Индивидуальные испытания 2026-11-22 · gpt-6.2-sol / medium

[Протокол](concept-conformance-reviewer/results.md). Исполнений 4, оценок 5, технических стартов 0, заданий в парах 2.

| Серия | Сравнение | Фаза | Рубрика | Выдача | Заданий | лучше | хуже | обе прошли | обе ошиблись | недостаточно | Пар | B без подсказки, выполнено / ошибка / нет данных | Граница |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | 0.2.9/B | primary | R1 | P1 | 2 | 0 | 0 | 2 | 0 | 0 | 2 | 2 / 0 / 0 | Две локальные задачи, явная загрузка, gpt-6.2-sol / medium. · [основание](concept-conformance-reviewer/results.md#pairs) |

| Серия | Пара | Задание | Проверяемый | Контроль | Исход | Причина |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary-1 | ordinary | [d31591553cda](concept-conformance-reviewer/runs/d31591553cda/events.jsonl.gz) [PASS](concept-conformance-reviewer/assessments/first/signed.json) | [b7bb6bc650b6](concept-conformance-reviewer/runs/b7bb6bc650b6/events.jsonl.gz) [PASS](concept-conformance-reviewer/assessments/first/signed.json) | обе прошли | — |
| Версия / без пакета | boundary-1 | boundary | [be5069bde360](concept-conformance-reviewer/runs/be5069bde360/events.jsonl.gz) [PASS](concept-conformance-reviewer/assessments/first/signed.json) | [e66f0069fdd2](concept-conformance-reviewer/runs/e66f0069fdd2/events.jsonl.gz) [PASS](concept-conformance-reviewer/assessments/first/signed.json) | обе прошли | — |

| Серия | Задание | Работа B | Действие B | Изъятие | Без подсказки | Свидетельство |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary | b7bb6bc650b6 | выполнено | complete | выполнено | [Исполнитель прочитал решение совета и проект приёмки. Разрешение на передачу в разработку он связал с будущей проверкой запроса и журнала штатного потребителя после восстановления. В журнале действий зафиксированы поиск и чтение документов.](concept-conformance-reviewer/assessments/first/signed.json) |
| Версия / без пакета | boundary | e66f0069fdd2 | выполнено | complete | выполнено | [Исполнитель прочитал профиль и протокол прогона 91, связал оба показа D71 с подстановкой и указал проверку для закрытия. Получатель должен увидеть свежее назначение с другого терминала до и после повторного входа, оба раза по ответу сервера. В журнале действий зафиксировано только чтение материалов.](concept-conformance-reviewer/assessments/first/signed.json) |

| Отдельная работа / переоценка | Редакция | Задание | Повтор работы | Рубрика | Выдача | Исходное мнение |
| --- | --- | --- | --- | --- | --- | --- |
| [b7bb6bc650b6](concept-conformance-reviewer/runs/b7bb6bc650b6/events.jsonl.gz) | B | ordinary | — | R1 | P1 | [first-a7b68763 · 0a02853532 · PASS](concept-conformance-reviewer/assessments/first/signed.json) |
| [b7bb6bc650b6](concept-conformance-reviewer/runs/b7bb6bc650b6/events.jsonl.gz) | B | ordinary | — | R1 | P1 | [second-ca4a0d0c · 0a02853532 · PASS](concept-conformance-reviewer/assessments/second/signed.json) |

Согласие 1/1. Назначено 1, без двух пригодных оценок 0, разногласий 0, без решения 0.

| Работа | Рубрика | Выдача | Оценщик 1 | Оценщик 2 | Разбор |
| --- | --- | --- | --- | --- | --- |
| [b7bb6bc650b6](concept-conformance-reviewer/runs/b7bb6bc650b6/events.jsonl.gz) | R1 | P1 | [first-a7b68763 · PASS](concept-conformance-reviewer/assessments/first/signed.json) | [second-ca4a0d0c · PASS](concept-conformance-reviewer/assessments/second/signed.json) | согласие |

## gdpr-compliance · Индивидуальные испытания 2026-11-22 · gpt-6.2-sol / medium

[Протокол](gdpr-compliance/results.md). Исполнений 4, оценок 5, технических стартов 0, заданий в парах 2.

| Серия | Сравнение | Фаза | Рубрика | Выдача | Заданий | лучше | хуже | обе прошли | обе ошиблись | недостаточно | Пар | B без подсказки, выполнено / ошибка / нет данных | Граница |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | 0.2.5/B | primary | R1 | P1 | 2 | 0 | 0 | 2 | 0 | 0 | 2 | 2 / 0 / 0 | Две локальные задачи, явная загрузка, gpt-6.2-sol / medium. · [основание](gdpr-compliance/results.md#pairs) |

| Серия | Пара | Задание | Проверяемый | Контроль | Исход | Причина |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary-1 | ordinary | [044389965528](gdpr-compliance/runs/044389965528/events.jsonl.gz) [PASS](gdpr-compliance/assessments/first/signed.json) | [c21501285cd1](gdpr-compliance/runs/c21501285cd1/events.jsonl.gz) [PASS](gdpr-compliance/assessments/first/signed.json) | обе прошли | — |
| Версия / без пакета | boundary-1 | boundary | [1774d3ee0463](gdpr-compliance/runs/1774d3ee0463/events.jsonl.gz) [PASS](gdpr-compliance/assessments/first/signed.json) | [34229e4aa1d9](gdpr-compliance/runs/34229e4aa1d9/events.jsonl.gz) [PASS](gdpr-compliance/assessments/first/signed.json) | обе прошли | — |

| Серия | Задание | Работа B | Действие B | Изъятие | Без подсказки | Свидетельство |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary | c21501285cd1 | выполнено | complete | выполнено | [Исполнитель прочитал карточку, конфигурацию и журнал приёмки. В разрешающем выводе он связал решение владельца с результатами поиска, выгрузки и очистки для T17 и T18. Представленные команды только читали файлы.](gdpr-compliance/assessments/first/signed.json) |
| Версия / без пакета | boundary | 34229e4aa1d9 | выполнено | complete | выполнено | [Исполнитель прочитал журнал M7, снимок настроек и события стенда. Он поручил ответственному за выпуск сохранить функцию выключенной до подписи директора, даже при успешной проверке истечения срока на стенде. Зафиксированы только команды чтения.](gdpr-compliance/assessments/first/signed.json) |

| Отдельная работа / переоценка | Редакция | Задание | Повтор работы | Рубрика | Выдача | Исходное мнение |
| --- | --- | --- | --- | --- | --- | --- |
| [34229e4aa1d9](gdpr-compliance/runs/34229e4aa1d9/events.jsonl.gz) | B | boundary | — | R1 | P1 | [first-d7cf91d2 · 0741e0afcb · PASS](gdpr-compliance/assessments/first/signed.json) |
| [34229e4aa1d9](gdpr-compliance/runs/34229e4aa1d9/events.jsonl.gz) | B | boundary | — | R1 | P1 | [second-b9ac104f · 0741e0afcb · PASS](gdpr-compliance/assessments/second/signed.json) |

Согласие 1/1. Назначено 1, без двух пригодных оценок 0, разногласий 0, без решения 0.

| Работа | Рубрика | Выдача | Оценщик 1 | Оценщик 2 | Разбор |
| --- | --- | --- | --- | --- | --- |
| [34229e4aa1d9](gdpr-compliance/runs/34229e4aa1d9/events.jsonl.gz) | R1 | P1 | [first-d7cf91d2 · PASS](gdpr-compliance/assessments/first/signed.json) | [second-b9ac104f · PASS](gdpr-compliance/assessments/second/signed.json) | согласие |

## retrospective-analysis · Индивидуальные испытания 2026-11-22 · gpt-6.2-sol / medium

[Протокол](retrospective-analysis/results.md). Исполнений 4, оценок 6, технических стартов 0, заданий в парах 2.

| Серия | Сравнение | Фаза | Рубрика | Выдача | Заданий | лучше | хуже | обе прошли | обе ошиблись | недостаточно | Пар | B без подсказки, выполнено / ошибка / нет данных | Граница |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | 0.1.8/B | primary | R1 | P1 | 2 | 1 | 0 | 1 | 0 | 0 | 2 | 1 / 1 / 0 | Две локальные задачи, явная загрузка, gpt-6.2-sol / medium. · [основание](retrospective-analysis/results.md#pairs) |

| Серия | Пара | Задание | Проверяемый | Контроль | Исход | Причина |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary-1 | ordinary | [c28040444112](retrospective-analysis/runs/c28040444112/events.jsonl.gz) [PASS](retrospective-analysis/assessments/first/signed.json) | [cb76cd32aa08](retrospective-analysis/runs/cb76cd32aa08/events.jsonl.gz) [PASS](retrospective-analysis/assessments/first/signed.json) | обе прошли | — |
| Версия / без пакета | boundary-1 | boundary | [3905b2c44d06](retrospective-analysis/runs/3905b2c44d06/events.jsonl.gz) [PASS](retrospective-analysis/assessments/first/signed.json) | [e6d39f3d7e1b](retrospective-analysis/runs/e6d39f3d7e1b/events.jsonl.gz) [FAIL](retrospective-analysis/assessments/first/signed.json) | лучше | — |

| Серия | Задание | Работа B | Действие B | Изъятие | Без подсказки | Свидетельство |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary | cb76cd32aa08 | выполнено | complete | выполнено | [Автор связал приёмку G41R с тем, что склад добавил лист обозначений в исходный заказ. Действие профиля G-13 он подтвердил отдельным наблюдением: склад задержал новый заказ G47 без листа обозначений до отправки получателю.](retrospective-analysis/assessments/behavior-check/signed.json) |
| Версия / без пакета | boundary | e6d39f3d7e1b | ошибка | complete | ошибка | [Автор указал, что при C88 кандидат напечатал «032», а при S18 рабочая линия напечатала «32». Он предложил сверить контрольную сумму и проверить печать и приёмку бирки «087» на линии, но пропустил установку или активацию проверенного профиля перед этой проверкой.](retrospective-analysis/assessments/behavior-check/adjudication/signed.json) |

| Отдельная работа / переоценка | Редакция | Задание | Повтор работы | Рубрика | Выдача | Исходное мнение |
| --- | --- | --- | --- | --- | --- | --- |
| [cb76cd32aa08](retrospective-analysis/runs/cb76cd32aa08/events.jsonl.gz) | B | ordinary | — | R1 | P1 | [first-4448773d · dc8a55defd · PASS](retrospective-analysis/assessments/first/signed.json) |
| [cb76cd32aa08](retrospective-analysis/runs/cb76cd32aa08/events.jsonl.gz) | B | ordinary | — | R1 | P1 | [second-cad02e35 · dc8a55defd · PASS](retrospective-analysis/assessments/second/signed.json) |
| [cb76cd32aa08](retrospective-analysis/runs/cb76cd32aa08/events.jsonl.gz) | B | ordinary | — | R1 | P1 | [adjudicator-2990c310 · dc8a55defd · PASS](retrospective-analysis/assessments/adjudicator/signed.json) |

Согласие 1/1. Назначено 1, без двух пригодных оценок 0, разногласий 0, без решения 0.

| Работа | Рубрика | Выдача | Оценщик 1 | Оценщик 2 | Разбор |
| --- | --- | --- | --- | --- | --- |
| [cb76cd32aa08](retrospective-analysis/runs/cb76cd32aa08/events.jsonl.gz) | R1 | P1 | [first-4448773d · PASS](retrospective-analysis/assessments/first/signed.json) | [second-cad02e35 · PASS](retrospective-analysis/assessments/second/signed.json) | согласие |

## security-reviewer · Индивидуальные испытания 2026-11-22 · gpt-6.2-sol / medium

[Протокол](security-reviewer/results.md). Исполнений 4, оценок 5, технических стартов 0, заданий в парах 2.

| Серия | Сравнение | Фаза | Рубрика | Выдача | Заданий | лучше | хуже | обе прошли | обе ошиблись | недостаточно | Пар | B без подсказки, выполнено / ошибка / нет данных | Граница |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | 0.1.16/B | primary | R1 | P1 | 2 | 0 | 0 | 2 | 0 | 0 | 2 | 2 / 0 / 0 | Две локальные задачи, явная загрузка, gpt-6.2-sol / medium. · [основание](security-reviewer/results.md#pairs) |

| Серия | Пара | Задание | Проверяемый | Контроль | Исход | Причина |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary-1 | ordinary | [78d262e78f1b](security-reviewer/runs/78d262e78f1b/events.jsonl.gz) [PASS](security-reviewer/assessments/first/signed.json) | [a271ec94b78c](security-reviewer/runs/a271ec94b78c/events.jsonl.gz) [PASS](security-reviewer/assessments/first/signed.json) | обе прошли | — |
| Версия / без пакета | boundary-1 | boundary | [8b17f42fc550](security-reviewer/runs/8b17f42fc550/events.jsonl.gz) [PASS](security-reviewer/assessments/first/signed.json) | [41542d9ee0a3](security-reviewer/runs/41542d9ee0a3/events.jsonl.gz) [PASS](security-reviewer/assessments/first/signed.json) | обе прошли | — |

| Серия | Задание | Работа B | Действие B | Изъятие | Без подсказки | Свидетельство |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary | a271ec94b78c | выполнено | complete | выполнено | [Команды nl вывели правила операций, решение владельца и список назначений. В ответе к назначениям применено именно правило publish и назван единственный участник с правом публикации.](security-reviewer/assessments/first/signed.json) |
| Версия / без пакета | boundary | 41542d9ee0a3 | выполнено | complete | выполнено | [Команды nl вывели каталог групп, решение владельца и настройки поставок. В ответе сопоставлены читатели single-card и march-digest с содержимым варианта pages и указан лишний доступ H03 к полному тексту.](security-reviewer/assessments/first/signed.json) |

| Отдельная работа / переоценка | Редакция | Задание | Повтор работы | Рубрика | Выдача | Исходное мнение |
| --- | --- | --- | --- | --- | --- | --- |
| [78d262e78f1b](security-reviewer/runs/78d262e78f1b/events.jsonl.gz) | 0.1.16 | ordinary | — | R1 | P1 | [first-f8c1b550 · 6d0b3e37be · PASS](security-reviewer/assessments/first/signed.json) |
| [78d262e78f1b](security-reviewer/runs/78d262e78f1b/events.jsonl.gz) | 0.1.16 | ordinary | — | R1 | P1 | [second-3fcec638 · 6d0b3e37be · PASS](security-reviewer/assessments/second/signed.json) |

Согласие 1/1. Назначено 1, без двух пригодных оценок 0, разногласий 0, без решения 0.

| Работа | Рубрика | Выдача | Оценщик 1 | Оценщик 2 | Разбор |
| --- | --- | --- | --- | --- | --- |
| [78d262e78f1b](security-reviewer/runs/78d262e78f1b/events.jsonl.gz) | R1 | P1 | [first-f8c1b550 · PASS](security-reviewer/assessments/first/signed.json) | [second-3fcec638 · PASS](security-reviewer/assessments/second/signed.json) | согласие |

## spec-conformance-reviewer · Индивидуальные испытания 2026-11-22 · gpt-6.2-sol / medium

[Протокол](spec-conformance-reviewer/results.md). Исполнений 4, оценок 5, технических стартов 0, заданий в парах 2.

| Серия | Сравнение | Фаза | Рубрика | Выдача | Заданий | лучше | хуже | обе прошли | обе ошиблись | недостаточно | Пар | B без подсказки, выполнено / ошибка / нет данных | Граница |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | 0.1.11/B | primary | R1 | P1 | 2 | 0 | 1 | 1 | 0 | 0 | 2 | 2 / 0 / 0 | Две локальные задачи, явная загрузка, gpt-6.2-sol / medium. · [основание](spec-conformance-reviewer/results.md#pairs) |

| Серия | Пара | Задание | Проверяемый | Контроль | Исход | Причина |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary-1 | ordinary | [40cb27975101](spec-conformance-reviewer/runs/40cb27975101/events.jsonl.gz) [FAIL](spec-conformance-reviewer/assessments/first/signed.json) | [d31ec390efdc](spec-conformance-reviewer/runs/d31ec390efdc/events.jsonl.gz) [PASS](spec-conformance-reviewer/assessments/first/signed.json) | хуже | — |
| Версия / без пакета | boundary-1 | boundary | [c742f41d4d8e](spec-conformance-reviewer/runs/c742f41d4d8e/events.jsonl.gz) [PASS](spec-conformance-reviewer/assessments/first/signed.json) | [f08e766c12a9](spec-conformance-reviewer/runs/f08e766c12a9/events.jsonl.gz) [PASS](spec-conformance-reviewer/assessments/first/signed.json) | обе прошли | — |

| Серия | Задание | Работа B | Действие B | Изъятие | Без подсказки | Свидетельство |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary | d31ec390efdc | выполнено | complete | выполнено | [Решение о приёмке связано с тремя наблюдаемыми вызовами route_tag.py. Для yard получено Y\\n, для bay — B\\n, для gate — G\\n. Каждый вызов завершился с кодом 0.](spec-conformance-reviewer/assessments/first/signed.json) |
| Версия / без пакета | boundary | f08e766c12a9 | выполнено | complete | выполнено | [Штатная проверка завершилась с кодом 0. Прямой вызов сохранил job и вернул mass со значением «0», поэтому проверка PN-2 завершилась с кодом 1. Ответ отказал в приёмке по PN-2 и оставил PN-3 неподтверждённым. DeskArchive сохраняет запись в словаре одного процесса, а для чтения после перезапуска терминала запрошен отдельный прогон.](spec-conformance-reviewer/assessments/first/signed.json) |

| Отдельная работа / переоценка | Редакция | Задание | Повтор работы | Рубрика | Выдача | Исходное мнение |
| --- | --- | --- | --- | --- | --- | --- |
| [d31ec390efdc](spec-conformance-reviewer/runs/d31ec390efdc/events.jsonl.gz) | B | ordinary | — | R1 | P1 | [first-230ad89a · d981e89ac9 · PASS](spec-conformance-reviewer/assessments/first/signed.json) |
| [d31ec390efdc](spec-conformance-reviewer/runs/d31ec390efdc/events.jsonl.gz) | B | ordinary | — | R1 | P1 | [second-d92e5264 · d981e89ac9 · PASS](spec-conformance-reviewer/assessments/second/signed.json) |

Согласие 1/1. Назначено 1, без двух пригодных оценок 0, разногласий 0, без решения 0.

| Работа | Рубрика | Выдача | Оценщик 1 | Оценщик 2 | Разбор |
| --- | --- | --- | --- | --- | --- |
| [d31ec390efdc](spec-conformance-reviewer/runs/d31ec390efdc/events.jsonl.gz) | R1 | P1 | [first-230ad89a · PASS](spec-conformance-reviewer/assessments/first/signed.json) | [second-d92e5264 · PASS](spec-conformance-reviewer/assessments/second/signed.json) | согласие |

## web-ui-reviewer · Индивидуальные испытания 2026-11-22 · gpt-6.2-sol / medium

[Протокол](web-ui-reviewer/results.md). Исполнений 4, оценок 5, технических стартов 0, заданий в парах 2.

| Серия | Сравнение | Фаза | Рубрика | Выдача | Заданий | лучше | хуже | обе прошли | обе ошиблись | недостаточно | Пар | B без подсказки, выполнено / ошибка / нет данных | Граница |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | 0.2.7/B | primary | R1 | P1 | 2 | 0 | 0 | 2 | 0 | 0 | 2 | 2 / 0 / 0 | Две локальные задачи, явная загрузка, gpt-6.2-sol / medium. · [основание](web-ui-reviewer/results.md#pairs) |

| Серия | Пара | Задание | Проверяемый | Контроль | Исход | Причина |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary-1 | ordinary | [32ef3fc3d147](web-ui-reviewer/runs/32ef3fc3d147/events.jsonl.gz) [PASS](web-ui-reviewer/assessments/first/signed.json) | [790ee5e53eca](web-ui-reviewer/runs/790ee5e53eca/events.jsonl.gz) [PASS](web-ui-reviewer/assessments/first/signed.json) | обе прошли | — |
| Версия / без пакета | boundary-1 | boundary | [e0b6c8be3869](web-ui-reviewer/runs/e0b6c8be3869/events.jsonl.gz) [PASS](web-ui-reviewer/assessments/first/signed.json) | [3ca1ee34aea3](web-ui-reviewer/runs/3ca1ee34aea3/events.jsonl.gz) [PASS](web-ui-reviewer/assessments/first/signed.json) | обе прошли | — |

| Серия | Задание | Работа B | Действие B | Изъятие | Без подсказки | Свидетельство |
| --- | --- | --- | --- | --- | --- | --- |
| Версия / без пакета | ordinary | 790ee5e53eca | выполнено | complete | выполнено | [Прочитаны требование, журнал исполнения и разметка кнопки edit-2. Журнал фиксирует переход фокуса с edit-2 в поле позывного и обратно после Escape. Ответ различает введённое значение «Быстрый» и сохранённое значение «Ветер». Чтение SKILL.md и references/web-interface-guidelines.md в P1 не зафиксировано.](web-ui-reviewer/assessments/first/signed.json) |
| Версия / без пакета | boundary | 3ca1ee34aea3 | выполнено | complete | выполнено | [Прочитаны таблица владельца, HTML и запись Chromium. В ответе сопоставлены возможности обоих разделов. Для весов запись показывает раскрытые карточку и журнал, для барометра — строку без элементов управления. Исключение для журнала учтено отдельно. Чтение SKILL.md и references/web-interface-guidelines.md в P1 не зафиксировано.](web-ui-reviewer/assessments/first/signed.json) |

| Отдельная работа / переоценка | Редакция | Задание | Повтор работы | Рубрика | Выдача | Исходное мнение |
| --- | --- | --- | --- | --- | --- | --- |
| [e0b6c8be3869](web-ui-reviewer/runs/e0b6c8be3869/events.jsonl.gz) | 0.2.7 | boundary | — | R1 | P1 | [first-7fb9b31a · 8bfbc18e29 · PASS](web-ui-reviewer/assessments/first/signed.json) |
| [e0b6c8be3869](web-ui-reviewer/runs/e0b6c8be3869/events.jsonl.gz) | 0.2.7 | boundary | — | R1 | P1 | [second-e5db860e · 8bfbc18e29 · PASS](web-ui-reviewer/assessments/second/signed.json) |

Согласие 1/1. Назначено 1, без двух пригодных оценок 0, разногласий 0, без решения 0.

| Работа | Рубрика | Выдача | Оценщик 1 | Оценщик 2 | Разбор |
| --- | --- | --- | --- | --- | --- |
| [e0b6c8be3869](web-ui-reviewer/runs/e0b6c8be3869/events.jsonl.gz) | R1 | P1 | [first-7fb9b31a · PASS](web-ui-reviewer/assessments/first/signed.json) | [second-e5db860e · PASS](web-ui-reviewer/assessments/second/signed.json) | согласие |

## Процесс приёмки

Повторная проверка потребовалась 3/7 скилам. Повторно передано на аудит 1/7 скилов с первым вердиктом. Открытых возвратов 2. Интервалы в секундах, прочерк означает отсутствие измерения.

| Скил | Аудит | Попытка | Снимок | Вердикт | Очередь | Проверка | После возврата | Активная проверка | Активное исправление | Возврат |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| code-reviewer | Индивидуальные испытания 2026-11-22 | [individual-1](code-reviewer/results.md#decision) | 0.4.9 archive-sha256 a490a6d30de61f5af69a76ccaa35c6fefd4030da0b33f5ad988e8c2e006bb41d | FAIL | 0.57 | 92.028 | — | — | — | [evidence · P-84. У обязательной проверки на оборудовании отсутствует основание в заявке.](code-reviewer/results.md#decision) |
| concept-conformance-reviewer | Индивидуальные испытания 2026-11-22 | [individual-1](concept-conformance-reviewer/results.md#decision) | 0.2.9 archive-sha256 22ac97853260727ce7911882643adf1f3dd7b71b53363212459c4c06731510a4 | PASS | 0.57 | 76.99 | — | — | — | — |
| gdpr-compliance | Индивидуальные испытания 2026-11-22 | [individual-1](gdpr-compliance/results.md#decision) | 0.2.5 archive-sha256 23d3acd3574cf0ad54b805458b2c8a65fe527e016c720662dce1839bcb8be751 | PASS | 0.544 | 73.623 | — | — | — | — |
| retrospective-analysis | Индивидуальные испытания 2026-11-22 | [individual-1](retrospective-analysis/audit/signed.json) | 0.1.8 archive-sha256 50cc6f9318a459b5f2d25469014433433be181c3dca9e16e67df90240ea67837 | PASS | 0.473 | 93.247 | — | — | — | — |
| retrospective-analysis | Индивидуальные испытания 2026-11-22 | [K-delta-2](retrospective-analysis/results.md#decision) | 0.1.8 archive-sha256 50cc6f9318a459b5f2d25469014433433be181c3dca9e16e67df90240ea67837 | PASS | 0.466 | 63.946 | — | — | — | — |
| security-reviewer | Индивидуальные испытания 2026-11-22 | [individual-1](security-reviewer/results.md#decision) | 0.1.16 archive-sha256 3dbdea3e92a2b3cb4efb50ec5285c003ac223b60403ad981c429fc7b68b9ebf0 | PASS | 0.469 | 61.586 | — | — | — | — |
| spec-conformance-reviewer | Индивидуальные испытания 2026-11-22 | [individual-1](spec-conformance-reviewer/results.md#decision) | 0.1.11 archive-sha256 292cad3bebc2b5e01fa6b97fa967ba1e0ed549e0f8fdb8dff9667c6bb3395a9b | FAIL | 0.595 | 82.135 | — | — | — | [evidence · K-17. Журнал не подтверждает заявленную предварительную сверку контрольных сумм.](spec-conformance-reviewer/results.md#decision) |
| web-ui-reviewer | Индивидуальные испытания 2026-11-22 | [individual-1](web-ui-reviewer/results.md#decision) | 0.2.7 archive-sha256 e26a7fa854c79826506705ed823408fcfab01b3aaaae3e3088dc408bdaf78075 | PASS | 0.525 | 78.372 | — | — | — | — |

| Скил | Аудит | От первой передачи до последнего решения |
| --- | --- | --- |
| code-reviewer | Индивидуальные испытания 2026-11-22 | 92.598 |
| concept-conformance-reviewer | Индивидуальные испытания 2026-11-22 | 77.56 |
| gdpr-compliance | Индивидуальные испытания 2026-11-22 | 74.167 |
| retrospective-analysis | Индивидуальные испытания 2026-11-22 | 416.956 |
| security-reviewer | Индивидуальные испытания 2026-11-22 | 62.055 |
| spec-conformance-reviewer | Индивидуальные испытания 2026-11-22 | 82.73 |
| web-ui-reviewer | Индивидуальные испытания 2026-11-22 | 78.897 |

| Очередь | Проверка | После возврата | Активная проверка | Активное исправление | Весь аудит |
| --- | --- | --- | --- | --- | --- |
| 0.534 (8) | 77.681 (8) | — (0) | — (0) | — (0) | 78.897 (7) |

Медианы по полным наблюдениям. В скобках указано их число.

Подтверждённых уникальных дефектов по скилу и версии 0. До выпуска 0, после выпуска 0, дата выпуска неизвестна для 0. Числа учитывают зарегистрированные находки за указанные периоды. Исследований без периода наблюдения 2, для них дефекты неизвестны.

| Скил | Версия | Приёмка UTC | Выпуск UTC | По UTC | Наблюдение | Подтверждённые дефекты |
| --- | --- | --- | --- | --- | --- | --- |
| concept-conformance-reviewer | 0.2.9 | 2026-11-22T01:48:49.046Z | 2026-11-20T17:57:27Z | 2026-11-22T01:55:44.007Z | [неполное](README.md#limits) | неизвестно |
| gdpr-compliance | 0.2.5 | 2026-11-22T01:48:45.847Z | 2026-11-20T17:57:27Z | 2026-11-22T01:55:44.007Z | [неполное](README.md#limits) | неизвестно |
| retrospective-analysis | 0.1.8 | 2026-11-22T01:55:44.007Z | 2026-11-20T17:57:27Z | 2026-11-22T01:55:44.007Z | [неполное](README.md#limits) | неизвестно |
| security-reviewer | 0.1.16 | 2026-11-22T01:49:52.247Z | 2026-11-20T17:57:27Z | 2026-11-22T01:55:44.007Z | [неполное](README.md#limits) | неизвестно |
| web-ui-reviewer | 0.2.7 | 2026-11-22T01:51:12.302Z | 2026-11-20T17:57:27Z | 2026-11-22T01:55:44.007Z | [неполное](README.md#limits) | неизвестно |
