# code-reviewer 0.4.11

<a id="decision"></a>

**FAIL.** Независимый аудитор вернул 0.4.11 с замечанием P2. На P-84 кандидат сохранил нужную проверку макета и оставил выбор способа владельцу. На F-31 обе версии выполнили предписанную сверку. На M-56 кандидат обоснованно разрешил слияние, но сообщил о совпадении Git-хешей обеих таблиц без собственной проверки этих идентификаторов.

[Подписанное решение](audit/signed.json) · [События аудита](audit/result.json) · [Исходное решение по 0.4.10](../../reviewer-remediation-20261123/code-reviewer/results.md#decision)

<a id="pairs"></a>

## Назначенные пары

| Задание | Исправленная 0.4.11 | Прежняя 0.4.10 | Исход |
| --- | --- | --- | --- |
| [P-84](../../individual-trials-20261122/code-reviewer/inputs/boundary/task.md) · [файлы](../../individual-trials-20261122/code-reviewer/inputs/boundary/project/) | [PASS](runs/ba27531d2b45/answer.md) | [FAIL](runs/a35888a1626e/answer.md) | лучше |
| [F-31](../../reviewer-remediation-20261123/code-reviewer/inputs/fresh/task.md) · [файлы](../../reviewer-remediation-20261123/code-reviewer/inputs/fresh/project/) | [PASS](runs/8ba6aaf7e88a/answer.md) | [PASS](runs/b03d8a31b970/answer.md) | обе прошли |
| [M-56](inputs/transfer/task.md) · [файлы](inputs/transfer/project/) | [FAIL](runs/f93a6d71fd73/answer.md) | [PASS](runs/9a6024c00b74/answer.md) | хуже |

Все три пары завершены. Лучше — 1, хуже — 1, обе прошли — 1, обе ошиблись — 0, недостаточно данных — 0.

## Наблюдения аудитора

- **P-84.** Обе версии воспроизвели регрессию форматтера. Число 0 превратилось в тот же прочерк, что и None. Содержимого новой ревизии sheet.pmf в выдаче не было. Кандидат запросил доступную для просмотра ревизию и отложил слияние. Предыдущая версия потребовала подтверждение на терминале, хотя заявка оставляла способ оценки макета открытым.
- **F-31.** Для проверки ширины поля маршрута владелец назначил контрольный считыватель. Оба исполнителя запустили `python3 -B control/reader_v3.py head` и получили `V3 ACCEPT` для предложенного файла и трёх образцов. Оба разрешили слияние.
- **M-56.** Обе версии подтвердили единственное изменение поля audio строки B07 и разрешили включить таблицу в следующий пакет. Проверку плеера и акт ввода обе оставили на период после сборки. В журнале 0.4.11 видны чтение предоставленных Git blob SHA-1, сверка SHA-256 до и после проверки, а также побайтовое сопоставление патча. При этом автор ответа заявил о совпадении Git-хешей обеих копий. Исполнитель 0.4.10 пересчитал оба идентификатора командой `git hash-object --no-filters` и получил значения из описания.

## Первичные свидетельства

| Задание и версия | Исполнение | Подписанные оценки | Итоговое действие K |
| --- | --- | --- | --- |
| P-84, 0.4.11 | [выдача](runs/ba27531d2b45/delivery.json) · [действия](runs/ba27531d2b45/events.jsonl.gz) · [состояние](runs/ba27531d2b45/result.json) | [cfa48d88de](assessments/packets/cfa48d88de.json) · [first-c952ec1c · PASS, done](assessments/first/signed.json) · [second-aa3eef10 · PASS, done](assessments/second/signed.json) | [done](assessments/first/signed.json) |
| P-84, 0.4.10 | [выдача](runs/a35888a1626e/delivery.json) · [действия](runs/a35888a1626e/events.jsonl.gz) · [состояние](runs/a35888a1626e/result.json) | [9ec0ead849](assessments/packets/9ec0ead849.json) · [first-c952ec1c · FAIL, missed](assessments/first/signed.json) | [missed](assessments/first/signed.json) |
| F-31, 0.4.11 | [выдача](runs/8ba6aaf7e88a/delivery.json) · [действия](runs/8ba6aaf7e88a/events.jsonl.gz) · [состояние](runs/8ba6aaf7e88a/result.json) | [3b07ef188c](assessments/packets/3b07ef188c.json) · [first-c952ec1c · PASS, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| F-31, 0.4.10 | [выдача](runs/b03d8a31b970/delivery.json) · [действия](runs/b03d8a31b970/events.jsonl.gz) · [состояние](runs/b03d8a31b970/result.json) | [f19c89213c](assessments/packets/f19c89213c.json) · [first-c952ec1c · PASS, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| M-56, 0.4.11 | [выдача](runs/f93a6d71fd73/delivery.json) · [действия](runs/f93a6d71fd73/events.jsonl.gz) · [состояние](runs/f93a6d71fd73/result.json) | [9ebd8cb4aa](assessments/packets/9ebd8cb4aa.json) · [first-c952ec1c · FAIL, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| M-56, 0.4.10 | [выдача](runs/9a6024c00b74/delivery.json) · [действия](runs/9a6024c00b74/events.jsonl.gz) · [состояние](runs/9a6024c00b74/result.json) | [b003049d51](assessments/packets/b003049d51.json) · [first-c952ec1c · PASS, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |

На выбранной заранее работе оба оценщика выставили PASS и K=done. [Подписи до раскрытия](../sealed-scores.json) · [Ключ вариантов](../reveal.json)

## Область решения

Решение относится к явно переданным устанавливаемым пакетам и трём синтетическим заданиям. Каждая версия получила по одному запуску на задание. Действие K выполнено в 3/3 работах кандидата и 2/3 работах предыдущей версии. Причинная связь с конкретной фразой пакета, устойчивость результата и перенос на другие модели остаются неизвестными. Ввод оборудования в эксплуатацию выходит за рамки испытаний. [Полное решение](audit/signed.json)

Архив 0.4.11 содержит 15 файлов, SHA-256 `44d896dd7731c7e8730112b3729236feb6ab53dd9c069bd5781f5d643f6c45c0`. Архив 0.4.10 содержит 15 файлов, SHA-256 `74e987501796f021e03dd7df063b713bd191803ab683df18197ad76aace51735`. Модель исполнителей gpt-6.2-sol, настройка medium.

Утилита `node scripts/audit-metrics.mjs` обработала отдельную запись и общую цепь из трёх решений. В текущей записи шесть исполнений и семь оценок. Возврат имеет номер 3.

[Протокол](../protocol.md) · [Фиксация до правки](../pre-edit.json) · [Предрегистрация](../registration.json) · [Критерии R3](rubric.md) · [Сохранённые условия R2](../../reviewer-remediation-20261123/code-reviewer/rubric.md) · [Архив кандидата](../packages/manifest.json) · [Технические проверки и журналы](../checks.json) · [Обезличивание](../packet-verification.json) · [Машинная запись](metrics.json)
