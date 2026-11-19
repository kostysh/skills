# Сводка аудитов

Скилов 1, исследований 1, разных заданий в парах 2. Исполнений 7, оценок 11, технических стартов 0.

Хотя бы один определённый парный исход у 1/1 скилов и в 2/2 заданиях. Для 0 скилов и 0 заданий такого исхода нет.

| лучше | хуже | обе прошли | обе ошиблись | недостаточно | Назначено пар |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | 1 | 0 | 1 | 3 |

Слева указан проверяемый вариант, справа контроль. PASS/FAIL означает «лучше», FAIL/PASS означает «хуже». PASS/PASS и FAIL/FAIL означают одинаковый исход. Для каждой доли знаменателем служит число всех назначенных пар этой серии.

Отдельно повторно оценено пар 0. Сумма служит для сверки записей. Выводы относятся к отдельным сериям.

Для проверки согласия оценщиков назначено 4 работ, две пригодные оценки у 4, пропущено 0. Согласие 4/4, разногласий 0, без решения 0.

## error-fixer · 20261119-second-look · gpt-6.2-sol / medium

[Протокол](assessment.md). Исполнений 7, оценок 11, технических стартов 0, заданий в парах 2.

| Серия | Сравнение | Фаза | Рубрика | Выдача | Заданий | лучше | хуже | обе прошли | обе ошиблись | недостаточно | Пар | B без подсказки, выполнено / ошибка / нет данных | Граница |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| first | C/A | primary | criteria.md@074a5da0f54c | assigned-evidence-v1 | 2 | 0 | 0 | 1 | 0 | 1 | 2 | — | Синтетические случаи, принудительное применение скила. Исполнитель V24 увидел вывод по прежнему несвязанному исследованию. Повтор на k83 отдельно зафиксирован. · [основание](assessment.md) |
| repeat-boundary | C/A | confirmation | criteria.md@074a5da0f54c | assigned-evidence-v1 | 1 | 1 | 0 | 0 | 0 | 0 | 1 | — | Проверка при явно исключённой навигации по статусам других сессий. · [основание](assessment.md) |

| Серия | Пара | Задание | Проверяемый | Контроль | Исход | Причина |
| --- | --- | --- | --- | --- | --- | --- |
| first | p34 | p34 | [n58](evidence.tar.gz) [PASS](assessment.md) | [h27](evidence.tar.gz) [PASS](assessment.md) | обе прошли | — |
| first | k83 | k83 | [p61](evidence.tar.gz) [PASS](assessment.md) | [c46](evidence.tar.gz) [FAIL](assessment.md) | недостаточно | V24 увидел прежнюю чужую оценку. Первичная пара исключена из строгого сравнения при изоляции от других сессий. |
| repeat-boundary | k83-clean | k83 | [s93](evidence.tar.gz) [PASS](assessment.md) | [d72](evidence.tar.gz) [FAIL](assessment.md) | лучше | — |

| Отдельная работа / переоценка | Редакция | Задание | Повтор работы | Рубрика | Выдача | Исходное мнение |
| --- | --- | --- | --- | --- | --- | --- |
| [c46](evidence.tar.gz) | A | k83 | — | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_sorrel · P35 · FAIL](assessment.md) |
| [c46](evidence.tar.gz) | A | k83 | — | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_amber · P35 · FAIL](assessment.md) |
| [p61](evidence.tar.gz) | C | k83 | — | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_sorrel · V24 · PASS](assessment.md) |
| [p61](evidence.tar.gz) | C | k83 | — | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_amber · V24 · PASS](assessment.md) |
| [t84](evidence.tar.gz) | C | v19 | — | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_sorrel · K63 · PASS](assessment.md) |
| [s93](evidence.tar.gz) | C | k83 | p61 | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_sorrel · J57 · PASS](assessment.md) |
| [s93](evidence.tar.gz) | C | k83 | p61 | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_amber · J57 · PASS](assessment.md) |
| [d72](evidence.tar.gz) | A | k83 | c46 | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_sorrel · A82 · FAIL](assessment.md) |
| [d72](evidence.tar.gz) | A | k83 | c46 | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_amber · A82 · FAIL](assessment.md) |

Согласие 4/4. Назначено 4, без двух пригодных оценок 0, разногласий 0, без решения 0.

| Работа | Рубрика | Выдача | Оценщик 1 | Оценщик 2 | Разбор |
| --- | --- | --- | --- | --- | --- |
| [c46](evidence.tar.gz) | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_sorrel · FAIL](assessment.md) | [judge_amber · FAIL](assessment.md) | согласие |
| [p61](evidence.tar.gz) | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_sorrel · PASS](assessment.md) | [judge_amber · PASS](assessment.md) | согласие |
| [s93](evidence.tar.gz) | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_sorrel · PASS](assessment.md) | [judge_amber · PASS](assessment.md) | согласие |
| [d72](evidence.tar.gz) | criteria.md@074a5da0f54c | assigned-evidence-v1 | [judge_sorrel · FAIL](assessment.md) | [judge_amber · FAIL](assessment.md) | согласие |

## Процесс приёмки

Повторная проверка потребовалась 0/1 скилам. Повторно передано на аудит 0/1 скилов с первым вердиктом. Открытых возвратов 0. Интервалы в секундах, прочерк означает отсутствие измерения.

| Скил | Аудит | Попытка | Снимок | Вердикт | Очередь | Проверка | После возврата | Активная проверка | Активное исправление | Возврат |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| error-fixer | 0.1.2-second-look | [review-1](independent-review.md) | 0199758451ce | PASS | 11.84 | 225.401 | — | — | — | — |

| Скил | Аудит | От первой передачи до последнего решения |
| --- | --- | --- |
| error-fixer | 0.1.2-second-look | 237.241 |

| Очередь | Проверка | После возврата | Активная проверка | Активное исправление | Весь аудит |
| --- | --- | --- | --- | --- | --- |
| 11.84 (1) | 225.401 (1) | — (0) | — (0) | — (0) | 237.241 (1) |

Медианы по полным наблюдениям. В скобках указано их число.

Подтверждённых уникальных дефектов по скилу и версии 0. До выпуска 0, после выпуска 0, дата выпуска неизвестна для 0. Числа учитывают зарегистрированные находки за указанные периоды. Исследований без периода наблюдения 0, для них дефекты неизвестны.

| Скил | Версия | Приёмка UTC | Выпуск UTC | По UTC | Наблюдение | Подтверждённые дефекты |
| --- | --- | --- | --- | --- | --- | --- |
| error-fixer | 0.1.2 | 2026-11-19T19:29:05.401Z | не выпущена к концу периода | 2026-11-19T19:29:05.401Z | [неполное](independent-review.md) | неизвестно |
