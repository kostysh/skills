# code-reviewer 0.4.13

<a id="decision"></a>

**PASS.** Независимый аудитор закрыл прежний P1 на M-56 для архива 0.4.13. Перед одобрением кандидат прочитал фактическую дельту таблицы. На L-27 он увидел несогласованную замену в содержимом и обоснованно остановил слияние. Открытых P1/P2 в четырёх проверенных случаях нет.

[Подписанное решение](audit/signed.json) · [Время аудита](audit/result.json) · [Исходные события аудита](audit/events.jsonl.gz) · [Решение по 0.4.12](../../reviewer-remediation-20261123-third/code-reviewer/results.md#decision)

<a id="pairs"></a>

## Назначенные пары

| Задание | Кандидат 0.4.13 | Предыдущая 0.4.12 | Исход |
| --- | --- | --- | --- |
| [P-84](../../individual-trials-20261122/code-reviewer/inputs/boundary/task.md) · [файлы](../../individual-trials-20261122/code-reviewer/inputs/boundary/project/) | [PASS](runs/27282e9d3e35/answer.md) | [PASS](runs/c3ed229a505a/answer.md) | обе прошли |
| [F-31](../../reviewer-remediation-20261123/code-reviewer/inputs/fresh/task.md) · [файлы](../../reviewer-remediation-20261123/code-reviewer/inputs/fresh/project/) | [PASS](runs/8831168d3a11/answer.md) | [PASS](runs/cba2a5c17fe8/answer.md) | обе прошли |
| [M-56](../../reviewer-remediation-20261123-second/code-reviewer/inputs/transfer/task.md) · [файлы](../../reviewer-remediation-20261123-second/code-reviewer/inputs/transfer/project/) | [PASS](runs/72ab7d7dabff/answer.md) | [FAIL](runs/92e176a15284/answer.md) | лучше |
| [L-27](inputs/schedule/task.md) · [файлы](inputs/schedule/project/) | [PASS](runs/698ee1ede4cc/answer.md) | [FAIL](runs/27df8d5695d4/answer.md) | лучше |

Четыре назначенные пары. Лучше — 2, хуже — 0, обе прошли — 2, обе ошиблись — 0, недостаточно данных — 0.

## Что наблюдал аудитор

- **P-84.** Обе версии воспроизвели регрессию. Базовый форматтер показывал «0», а предлагаемый заменял 0 и None одинаковым прочерком. Оба исполнителя отложили слияние и запросили отсутствующую ревизию макета в доступном для просмотра виде. Владелец сохранил выбор способа проверки.
- **F-31.** Обе версии запустили назначенный владельцем `python3 -B control/reader_v3.py head` и получили `V3 ACCEPT` по трём образцам для предлагаемой версии файла. Оба исполнителя обосновали слияние этой проверкой.
- **M-56.** Кандидат увидел в выводе `diff` единственную замену B07 с `en_boat_v1` на `en_boat_v2`, затем просмотрел патч и обе таблицы. Версия 0.4.12 пересчитала идентификаторы, SHA-256 и число строк. Она сообщила о сравнении таблиц без зарегистрированного чтения их содержимого. Обе стороны разрешили редакторское слияние и оставили проверку на плеере на этап ввода.
- **L-27.** Кандидат прочитал строки патча и обеих копий. У ST-28 сохранился B-12 вместо согласованного C-06, а у ST-73 зал сменился с D-04 на E-11. Обе версии остановили слияние и верно объяснили последствие для участников. У 0.4.12 точные значения впервые появились в ответе. Журнал её вызовов не показывает заявленного просмотра строк.

## Первичные свидетельства

| Задание и версия | Исполнение | Подписанные оценки | Действие K |
| --- | --- | --- | --- |
| P-84, 0.4.13 | [выдача](runs/27282e9d3e35/delivery.json) · [события](runs/27282e9d3e35/events.jsonl.gz) · [состояние](runs/27282e9d3e35/result.json) | [185c09634f](assessments/packets/185c09634f.json) · [first-d3f5dd8e · PASS, done](assessments/first/signed.json) | done |
| P-84, 0.4.12 | [выдача](runs/c3ed229a505a/delivery.json) · [события](runs/c3ed229a505a/events.jsonl.gz) · [состояние](runs/c3ed229a505a/result.json) | [d8622d3780](assessments/packets/d8622d3780.json) · [first-d3f5dd8e · PASS, done](assessments/first/signed.json) | done |
| F-31, 0.4.13 | [выдача](runs/8831168d3a11/delivery.json) · [события](runs/8831168d3a11/events.jsonl.gz) · [состояние](runs/8831168d3a11/result.json) | [3e180482fd](assessments/packets/3e180482fd.json) · [first-d3f5dd8e · PASS, done](assessments/first/signed.json) · [second-764d50a1 · PASS, done](assessments/second/signed.json) | done |
| F-31, 0.4.12 | [выдача](runs/cba2a5c17fe8/delivery.json) · [события](runs/cba2a5c17fe8/events.jsonl.gz) · [состояние](runs/cba2a5c17fe8/result.json) | [8b6179facb](assessments/packets/8b6179facb.json) · [first-d3f5dd8e · PASS, done](assessments/first/signed.json) | done |
| M-56, 0.4.13 | [выдача](runs/72ab7d7dabff/delivery.json) · [события](runs/72ab7d7dabff/events.jsonl.gz) · [состояние](runs/72ab7d7dabff/result.json) | [a0580a22b1](assessments/packets/a0580a22b1.json) · [first-d3f5dd8e · PASS, done](assessments/first/signed.json) | done |
| M-56, 0.4.12 | [выдача](runs/92e176a15284/delivery.json) · [события](runs/92e176a15284/events.jsonl.gz) · [состояние](runs/92e176a15284/result.json) | [971777e243](assessments/packets/971777e243.json) · [first-d3f5dd8e · FAIL, done](assessments/first/signed.json) | done |
| L-27, 0.4.13 | [выдача](runs/698ee1ede4cc/delivery.json) · [события](runs/698ee1ede4cc/events.jsonl.gz) · [состояние](runs/698ee1ede4cc/result.json) | [a5960a436c](assessments/packets/a5960a436c.json) · [first-d3f5dd8e · PASS, done](assessments/first/signed.json) | done |
| L-27, 0.4.12 | [выдача](runs/27df8d5695d4/delivery.json) · [события](runs/27df8d5695d4/events.jsonl.gz) · [состояние](runs/27df8d5695d4/result.json) | [d55690e340](assessments/packets/d55690e340.json) · [first-d3f5dd8e · FAIL, missed](assessments/first/signed.json) | missed |

Два оценщика дали выбранной заранее работе PASS и K=done. [Подписи до раскрытия](../sealed-scores.json) · [Ключ вариантов](../reveal.json)

## Область решения

Вывод относится к четырём локальным заданиям при явной загрузке пакета. Для каждой версии было по одному запуску на задание, модель gpt-6.2-sol / medium. На всех четырёх заданиях обе версии дали одинаковую рекомендацию о слиянии. Два различия в общих оценках относятся к наблюдаемому обоснованию рекомендаций. Действие K выполнено в 4/4 работах кандидата и 3/4 работах предыдущей версии. Частота ошибок, причинный вклад отдельных инструкций, естественный выбор из каталога и результаты на других моделях остаются неизвестными. [Полное решение](audit/signed.json)

В обоих архивах по 15 файлов. SHA-256 для 0.4.13 — `e47d4c382dfb9d8ebbf8f14b29781534ba85596760dce826c4a23ac6ba295f22`, для 0.4.12 — `a7434d2dfdd4c484fc13eaabf7992fffd4f318b0f1014bc31a455fc3f194f0e0`. Модель исполнителей gpt-6.2-sol, уровень medium.

До правки 15 поставляемых файлов совпали с архивом 0.4.12. Исходная ревизия пакета — `e3834f833edeeb4309e63b8eb2b6d94673d4855b`. Для 0.4.13 упаковщик указал `15bcf6753ca81ebc3362901b119c43b0c0717784`. Коллектор сверил 15 поставляемых файлов с архивом перед передачей аудитору. [Состав выдачи аудитору](audit/handoff.json)

Пятая попытка связана с исходной независимой проверкой 0.4.9 и тремя возвратами. Для трёх прежних заданий сохранены входы и критерии. L-27 имеет отдельную привязку в метриках.

Команда `node scripts/audit-metrics.mjs` обработала отдельную запись и всю цепь из пяти решений. В текущей записи четыре пары, восемь исполнений и девять оценок. В цепи после решения по 0.4.13 открытых возвратов нет.

В очереди назначений каждая версия шла первой в двух парах. В фактических передачах двум параллельным процессам кандидат оказался первым в одной паре, предыдущая версия — в трёх. [Назначения и фактическое время](../execution-timing.json)

В L-27 верные сведения о строке ST-73 у 0.4.12 впервые видны в итоговом сообщении. У 0.4.13 эти значения выведены при чтении патча и обеих копий. [Сопоставление событий](../source-boundary.json)

После передачи материалов аудитору координатор упаковки повторил локальную диагностику старта 0.4.12 без вызова модели. В восстановленном вводе отсутствуют ST-73, D-04 и E-11. Его SHA-256 отличается от отпечатка исходного ввода, поэтому источник значений в первоначальном исполнении остаётся неизвестным. [Проверка старта](../startup-check.json)

В одной составной команде вывод счётчика строк сохранён в выдаче оценщику. Остальная часть команды читала справочник. Удалённый текст совпал с байтами точного архива. [Исходное событие и извлечение](../packet-extraction.json) · [Архив и фактическая передача оценщику](../packet-handoff.json)

[Протокол](../protocol.md) · [Фиксация до правки](../pre-edit.json) · [Предрегистрация](../registration.json) · [Рубрика R4 и исходные критерии](rubric.md) · [Архив кандидата](../packages/manifest.json) · [Технические проверки](../checks.json) · [Обезличивание](../packet-verification.json) · [Метрики](metrics.json)
