# Сводка аудитов

Скилов 1, исследований 1, разных заданий в парах 2. Исполнений 8, оценок 12, технических стартов 0.

Хотя бы один определённый парный исход у 1/1 скилов и в 2/2 заданиях. Для 0 скилов и 0 заданий такого исхода нет.

| лучше | хуже | обе прошли | обе ошиблись | недостаточно | Назначено пар |
| --- | --- | --- | --- | --- | --- |
| 0 | 0 | 3 | 1 | 0 | 4 |

Слева указан проверяемый вариант, справа контроль. PASS/FAIL означает «лучше», FAIL/PASS означает «хуже». PASS/PASS и FAIL/FAIL означают одинаковый исход. Для каждой доли знаменателем служит число всех назначенных пар этой серии.

Отдельно повторно оценено пар 0. Сумма служит для сверки записей. Выводы относятся к отдельным сериям.

Для проверки согласия оценщиков назначено 4 работ, две пригодные оценки у 4, пропущено 0. Согласие 4/4, разногласий 0, без решения 0.

## frontend-design · живые формы 2026-11-19 · gpt-6.2-sol / medium

[Протокол](protocol.md). Исполнений 8, оценок 12, технических стартов 0, заданий в парах 2.

| Серия | Сравнение | Фаза | Рубрика | Выдача | Заданий | лучше | хуже | обе прошли | обе ошиблись | недостаточно | Пар | B без подсказки, выполнено / ошибка / нет данных | Граница |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| package/none-primary | package/none | primary | form-v1-P | form-observations-v1 | 2 | 0 | 0 | 2 | 0 | 0 | 2 | — | Два варианта формы North Quay; вывод ограничен этими заданиями. · [основание](registration.json) |
| A/B-primary | A/B | primary | form-v1-I | form-observations-v1 | 2 | 0 | 0 | 1 | 1 | 0 | 2 | 1 / 1 / 0 | Два варианта формы North Quay; вывод ограничен этими заданиями. · [основание](registration.json) |

| Серия | Пара | Задание | Проверяемый | Контроль | Исход | Причина |
| --- | --- | --- | --- | --- | --- | --- |
| package/none-primary | 70e1a47371 | ordinary | [da9846753d](runs/da9846753d/events.jsonl) [PASS](assessments/primary/first/signed.json) | [5245e74360](runs/5245e74360/events.jsonl) [PASS](assessments/primary/first/signed.json) | обе прошли | — |
| package/none-primary | 6ac99a2ee0 | discriminating | [f600cb1c35](runs/f600cb1c35/events.jsonl) [PASS](assessments/primary/first/signed.json) | [e6ce811126](runs/e6ce811126/events.jsonl) [PASS](assessments/primary/first/signed.json) | обе прошли | — |
| A/B-primary | dfb4b05880 | ordinary | [4c74465cab](runs/4c74465cab/events.jsonl) [PASS](assessments/primary/first/signed.json) | [727eda3aea](runs/727eda3aea/events.jsonl) [PASS](assessments/primary/first/signed.json) | обе прошли | — |
| A/B-primary | 6ad52bc38a | discriminating | [4376820b4c](runs/4376820b4c/events.jsonl) [FAIL](assessments/primary/first/signed.json) | [feac56a170](runs/feac56a170/events.jsonl) [FAIL](assessments/primary/first/signed.json) | обе ошиблись | — |

| Серия | Задание | Работа B | Действие B | Изъятие | Без подсказки | Свидетельство |
| --- | --- | --- | --- | --- | --- | --- |
| A/B-primary | ordinary | 727eda3aea | выполнено | complete | выполнено | [На обеих ширинах основная кнопка соответствует образцу, Clear отличается, фокус виден. Сохранение данных, подтверждение и очистка прошли. В строке 23 Tab перевёл фокус на #send в обычном состоянии. Загруженная ревизия совпадает с app_revision. Журнал действий, строки 23.](runs/727eda3aea/browser.jsonl#L23) |
| A/B-primary | discriminating | feac56a170 | ошибка | complete | ошибка | [Финальный прогон подтверждает стиль и видимую рамку после ошибки на обеих ширинах, сохранение данных, подтверждение и очистку. Tab вернул фокус на #send после ошибки только в строке 8, где loaded и disk отличаются от app_revision. На финальной ревизии Tab дошёл до #send до пустой отправки. Журнал действий, строки 8, 18.](runs/feac56a170/browser.jsonl#L18) |

| Отдельная работа / переоценка | Редакция | Задание | Повтор работы | Рубрика | Выдача | Исходное мнение |
| --- | --- | --- | --- | --- | --- | --- |
| [da9846753d](runs/da9846753d/events.jsonl) | package | ordinary | — | form-v1-P | form-observations-v1 | [01a1f4ed-47e1-7480-9db2-0b56ad71c9cf · first · PASS](assessments/primary/first/signed.json) |
| [da9846753d](runs/da9846753d/events.jsonl) | package | ordinary | — | form-v1-P | form-observations-v1 | [01a1f4ed-47e1-7520-9c55-fb843a1f8d35 · second · PASS](assessments/primary/second/signed.json) |
| [727eda3aea](runs/727eda3aea/events.jsonl) | B | ordinary | — | form-v1-I | form-observations-v1 | [01a1f4ed-47e1-7480-9db2-0b56ad71c9cf · first · PASS](assessments/primary/first/signed.json) |
| [727eda3aea](runs/727eda3aea/events.jsonl) | B | ordinary | — | form-v1-I | form-observations-v1 | [01a1f4ed-47e1-7520-9c55-fb843a1f8d35 · second · PASS](assessments/primary/second/signed.json) |
| [e6ce811126](runs/e6ce811126/events.jsonl) | none | discriminating | — | form-v1-P | form-observations-v1 | [01a1f4ed-47e1-7480-9db2-0b56ad71c9cf · first · PASS](assessments/primary/first/signed.json) |
| [e6ce811126](runs/e6ce811126/events.jsonl) | none | discriminating | — | form-v1-P | form-observations-v1 | [01a1f4ed-47e1-7520-9c55-fb843a1f8d35 · second · PASS](assessments/primary/second/signed.json) |
| [4376820b4c](runs/4376820b4c/events.jsonl) | A | discriminating | — | form-v1-I | form-observations-v1 | [01a1f4ed-47e1-7480-9db2-0b56ad71c9cf · first · FAIL](assessments/primary/first/signed.json) |
| [4376820b4c](runs/4376820b4c/events.jsonl) | A | discriminating | — | form-v1-I | form-observations-v1 | [01a1f4ed-47e1-7520-9c55-fb843a1f8d35 · second · FAIL](assessments/primary/second/signed.json) |

Согласие 4/4. Назначено 4, без двух пригодных оценок 0, разногласий 0, без решения 0.

| Работа | Рубрика | Выдача | Оценщик 1 | Оценщик 2 | Разбор |
| --- | --- | --- | --- | --- | --- |
| [da9846753d](runs/da9846753d/events.jsonl) | form-v1-P | form-observations-v1 | [01a1f4ed-47e1-7480-9db2-0b56ad71c9cf · PASS](assessments/primary/first/signed.json) | [01a1f4ed-47e1-7520-9c55-fb843a1f8d35 · PASS](assessments/primary/second/signed.json) | согласие |
| [727eda3aea](runs/727eda3aea/events.jsonl) | form-v1-I | form-observations-v1 | [01a1f4ed-47e1-7480-9db2-0b56ad71c9cf · PASS](assessments/primary/first/signed.json) | [01a1f4ed-47e1-7520-9c55-fb843a1f8d35 · PASS](assessments/primary/second/signed.json) | согласие |
| [e6ce811126](runs/e6ce811126/events.jsonl) | form-v1-P | form-observations-v1 | [01a1f4ed-47e1-7480-9db2-0b56ad71c9cf · PASS](assessments/primary/first/signed.json) | [01a1f4ed-47e1-7520-9c55-fb843a1f8d35 · PASS](assessments/primary/second/signed.json) | согласие |
| [4376820b4c](runs/4376820b4c/events.jsonl) | form-v1-I | form-observations-v1 | [01a1f4ed-47e1-7480-9db2-0b56ad71c9cf · FAIL](assessments/primary/first/signed.json) | [01a1f4ed-47e1-7520-9c55-fb843a1f8d35 · FAIL](assessments/primary/second/signed.json) | согласие |

## Процесс приёмки

Повторная проверка потребовалась 0/1 скилам. Повторно передано на аудит 0/1 скилов с первым вердиктом. Открытых возвратов 0. Интервалы в секундах, прочерк означает отсутствие измерения.

| Скил | Аудит | Попытка | Снимок | Вердикт | Очередь | Проверка | После возврата | Активная проверка | Активное исправление | Возврат |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| frontend-design | живые формы 2026-11-19 | [frontend-pilot-1](independent-audit.md) | 2a28e6a5a89164f14eb63cfbc4775e34f66de865efb701195c557b106bc704ef | PASS | 24.995 | 274 | — | — | — | — |

| Скил | Аудит | От первой передачи до последнего решения |
| --- | --- | --- |
| frontend-design | живые формы 2026-11-19 | 298.995 |

| Очередь | Проверка | После возврата | Активная проверка | Активное исправление | Весь аудит |
| --- | --- | --- | --- | --- | --- |
| 24.995 (1) | 274 (1) | — (0) | — (0) | — (0) | 298.995 (1) |

Медианы по полным наблюдениям. В скобках указано их число.

Дефекты после приёмки неизвестны. Периоды наблюдения отсутствуют.
