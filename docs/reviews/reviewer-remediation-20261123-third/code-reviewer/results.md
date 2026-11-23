# code-reviewer 0.4.12

<a id="decision"></a>

**FAIL.** Аудитор подтвердил P1 на M-56. Версия 0.4.12 правильно вычислила оба Git blob SHA-1, но сообщила о сравнении единственного изменённого файла и одобрила слияние. В журнале есть сверка идентификаторов и размеров файлов. Содержимое таблиц и патча исполнитель не прочитал. Аудитор вернул работу владельцу навыка для разбора основания каждого существенного утверждения в рекомендации.

[Подписанное решение](audit/signed.json) · [События аудита](audit/result.json) · [Исходное решение по 0.4.11](../../reviewer-remediation-20261123-second/code-reviewer/results.md#decision)

<a id="pairs"></a>

## Назначенные пары

| Задание | Исправленная 0.4.12 | Прежняя 0.4.11 | Исход |
| --- | --- | --- | --- |
| [P-84](../../individual-trials-20261122/code-reviewer/inputs/boundary/task.md) · [файлы](../../individual-trials-20261122/code-reviewer/inputs/boundary/project/) | [PASS](runs/ba5423ff0f71/answer.md) | [PASS](runs/4eed92a1723f/answer.md) | обе прошли |
| [F-31](../../reviewer-remediation-20261123/code-reviewer/inputs/fresh/task.md) · [файлы](../../reviewer-remediation-20261123/code-reviewer/inputs/fresh/project/) | [PASS](runs/6539f39eab03/answer.md) | [PASS](runs/7362c181fb08/answer.md) | обе прошли |
| [M-56](../../reviewer-remediation-20261123-second/code-reviewer/inputs/transfer/task.md) · [файлы](../../reviewer-remediation-20261123-second/code-reviewer/inputs/transfer/project/) | [FAIL](runs/bcbd25d84b5e/answer.md) | [PASS](runs/26e55f7e3229/answer.md) | хуже |

Назначено три пары. Лучше — 0, хуже — 1, обе прошли — 2, обе ошиблись — 0, недостаточно данных — 0.

## Наблюдения аудитора

- **P-84.** Обе версии воспроизвели замену нуля на тире, отложили слияние и запросили проверяемую ревизию макета. Способ проверки оставили на выбор владельца.
- **F-31.** Обе версии вызвали предписанный `python3 -B control/reader_v3.py head`, получили `V3 ACCEPT` для трёх образцов и одобрили изменение.
- **M-56.** Обе версии разрешили редакторское слияние и оставили проверку плеера после сборки. Версия 0.4.11 сверила патч с обеими таблицами и установила единственную замену B07/audio. Версия 0.4.12 заявила тот же результат. Её команды подтвердили SHA-256, Git blob SHA-1 и размеры файлов. Эти операции не устанавливают, какие поля изменились и сохранился ли порядок строк.

## Первичные свидетельства

| Задание и версия | Исполнение | Подписанные оценки | Итоговое действие K |
| --- | --- | --- | --- |
| P-84, 0.4.12 | [выдача](runs/ba5423ff0f71/delivery.json) · [действия](runs/ba5423ff0f71/events.jsonl.gz) · [состояние](runs/ba5423ff0f71/result.json) | [6593d040f3](assessments/packets/6593d040f3.json) · [first-c5de0474 · PASS, done](assessments/first/signed.json) · [second-e225207b · PASS, done](assessments/second/signed.json) | [done](assessments/first/signed.json) |
| P-84, 0.4.11 | [выдача](runs/4eed92a1723f/delivery.json) · [действия](runs/4eed92a1723f/events.jsonl.gz) · [состояние](runs/4eed92a1723f/result.json) | [1939367830](assessments/packets/1939367830.json) · [first-c5de0474 · PASS, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| F-31, 0.4.12 | [выдача](runs/6539f39eab03/delivery.json) · [действия](runs/6539f39eab03/events.jsonl.gz) · [состояние](runs/6539f39eab03/result.json) | [2297805f68](assessments/packets/2297805f68.json) · [first-c5de0474 · PASS, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| F-31, 0.4.11 | [выдача](runs/7362c181fb08/delivery.json) · [действия](runs/7362c181fb08/events.jsonl.gz) · [состояние](runs/7362c181fb08/result.json) | [2a0b5b7af3](assessments/packets/2a0b5b7af3.json) · [first-c5de0474 · PASS, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| M-56, 0.4.12 | [выдача](runs/bcbd25d84b5e/delivery.json) · [действия](runs/bcbd25d84b5e/events.jsonl.gz) · [состояние](runs/bcbd25d84b5e/result.json) | [69d1906c58](assessments/packets/69d1906c58.json) · [first-c5de0474 · FAIL, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| M-56, 0.4.11 | [выдача](runs/26e55f7e3229/delivery.json) · [действия](runs/26e55f7e3229/events.jsonl.gz) · [состояние](runs/26e55f7e3229/result.json) | [e04399632c](assessments/packets/e04399632c.json) · [first-c5de0474 · PASS, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |

На выбранной заранее работе оба оценщика выставили PASS и K=done. [Подписи до раскрытия](../sealed-scores.json) · [Ключ вариантов](../reveal.json)

## Область решения

На каждом задании было по одному исполнению каждой версии. Обе выполнили действие K в 3/3 случаях. На M-56 K измеряет границу между слиянием и вводом плеера в работу. Итоговая R3 также учитывает достоверность заявленных действий. Результаты относятся к трём заданиям в явном режиме загрузки пакета. Частота сбоя и вклад отдельной инструкции неизвестны. Естественный выбор навыка, публикация в npm и реальный плеер остались вне проверки. [Полное решение](audit/signed.json)

Архив 0.4.12 содержит 15 файлов, SHA-256 `a7434d2dfdd4c484fc13eaabf7992fffd4f318b0f1014bc31a455fc3f194f0e0`. Архив 0.4.11 содержит 15 файлов, SHA-256 `44d896dd7731c7e8730112b3729236feb6ab53dd9c069bd5781f5d643f6c45c0`. Модель исполнителей gpt-6.2-sol, настройка medium.

Четвёртая попытка связана с исходной независимой проверкой 0.4.9 и двумя последующими возвратами.

[Протокол](../protocol.md) · [Фиксация до правки](../pre-edit.json) · [Предрегистрация](../registration.json) · [Критерии R3](rubric.md) · [Сохранённые условия R2](../../reviewer-remediation-20261123/code-reviewer/rubric.md) · [Архив кандидата](../packages/manifest.json) · [Технические проверки и журналы](../checks.json) · [Обезличивание](../packet-verification.json) · [Машинная запись](metrics.json)
