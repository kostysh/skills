# spec-conformance-reviewer 0.1.12

<a id="decision"></a>

**PASS.** Исходный P2 закрыт на K-17. Журнал подтверждает объект, результат и время заявленных сверок. В смежном случае G-64 кандидат правильно указал, кто выполнил каждую проверку.

[Подписанное решение](audit/signed.json) · [События аудита](audit/result.json) · [Исходное решение по 0.1.11](../../individual-trials-20261122/spec-conformance-reviewer/results.md#decision)

<a id="pairs"></a>

## Назначенные пары

| Задание | Исправленная 0.1.12 | Прежняя 0.1.11 | Исход |
| --- | --- | --- | --- |
| [K-17](../../individual-trials-20261122/spec-conformance-reviewer/inputs/ordinary/task.md) · [файлы](../../individual-trials-20261122/spec-conformance-reviewer/inputs/ordinary/project/) | [PASS](runs/9317c5c5bd0a/answer.md) | [PASS](runs/6c97cdc895f2/answer.md) | обе прошли |
| [G-64](inputs/fresh/task.md) · [файлы](inputs/fresh/project/) | [PASS](runs/f20af8f28dc8/answer.md) | [PASS](runs/d65a958ae83a/answer.md) | обе прошли |

Назначено 2 пары. лучше — 0, хуже — 0, обе прошли — 2, обе ошиблись — 0, недостаточно данных — 0.

## Наблюдения аудитора

- **K-17.** У обеих версий три вызова публичной команды дали Y, B и G с завершающим LF и кодом 0. Обе сверили три файла с манифестом до и после запуска. Версия 0.1.12 верно указала обе сверки в отчёте. Исходный FAIL версии 0.1.11 относится к другой работе R1.
- **G-64.** Обе версии проверили локальный профиль и приняли G2 по записи контролёра A429. Для G3 они различили три ограничения свидетельств: время до завершения сборки, другой экземпляр и наблюдатель из монтажной группы. Для полной приёмки обе запросили подходящую запись отдела приёмки.

## Первичные свидетельства

| Задание и версия | Исполнение | Подписанные оценки | Итоговое действие K |
| --- | --- | --- | --- |
| K-17, 0.1.12 | [выдача](runs/9317c5c5bd0a/delivery.json) · [действия](runs/9317c5c5bd0a/events.jsonl.gz) · [состояние](runs/9317c5c5bd0a/result.json) | [3f46798819](assessments/packets/3f46798819.json) · [first-5c533cfd · PASS, done](assessments/first/signed.json) · [second-39cb0654 · PASS, done](assessments/second/signed.json) | [done](assessments/first/signed.json) |
| K-17, 0.1.11 | [выдача](runs/6c97cdc895f2/delivery.json) · [действия](runs/6c97cdc895f2/events.jsonl.gz) · [состояние](runs/6c97cdc895f2/result.json) | [32ddbad622](assessments/packets/32ddbad622.json) · [first-5c533cfd · PASS, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| G-64, 0.1.12 | [выдача](runs/f20af8f28dc8/delivery.json) · [действия](runs/f20af8f28dc8/events.jsonl.gz) · [состояние](runs/f20af8f28dc8/result.json) | [a1b5c2b384](assessments/packets/a1b5c2b384.json) · [first-5c533cfd · PASS, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| G-64, 0.1.11 | [выдача](runs/d65a958ae83a/delivery.json) · [действия](runs/d65a958ae83a/events.jsonl.gz) · [состояние](runs/d65a958ae83a/result.json) | [405c863ff6](assessments/packets/405c863ff6.json) · [first-5c533cfd · PASS, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |

## Область решения

Решение относится к двум парам R2 после явной загрузки. Обе версии прошли обе задачи. Преимущество кандидата и причина прежней ошибки остались неустановленными. Физические действия в G-64 представлены синтетическими выписками. [Полное решение](audit/signed.json)

Архив 0.1.12 содержит 6 файлов, SHA-256 `e111920c6e6734e47eac6584a2765fff764228e0c27181395ba1b6474da86d77`. Архив 0.1.11 содержит 6 файлов, SHA-256 `292cad3bebc2b5e01fa6b97fa967ba1e0ed549e0f8fdb8dff9667c6bb3395a9b`. Модель исполнителей gpt-6.2-sol, настройка medium.

[Предрегистрация](../registration.json) · [Критерии R2](rubric.md) · [Исходные критерии R1](../../individual-trials-20261122/spec-conformance-reviewer/rubric.md) · [Архивы кандидатов](../packages/manifest.json) · [Машинная запись](metrics.json)
