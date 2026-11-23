# gdpr-compliance 0.2.5

<a id="decision"></a>

**PASS.** Версия прошла обе зарегистрированные задачи. Контроль без пакета принял те же решения. По двум первичным парам полный пакет лучше в 0, хуже в 0, обе стороны прошли в 2, обе ошиблись в 0, данных недостаточно в 0. Преимущество пакета по критериям R1 не выявлено. Дефект инструкции уровня P1 или P2 в проверенных границах не установлен.

Независимый аудитор оценивал исполнение на двух зарегистрированных задачах. [Подписанное решение с основаниями и пределами](audit/signed.json) · [События решения](audit/result.json) · [Прежняя совместная приёмка](../../implementation-log-20261119-2.md)

<a id="pairs"></a>

## Назначенные пары

| Задание | Полный пакет | Без пакета | Наблюдение |
| --- | --- | --- | --- |
| [C14](inputs/ordinary/task.md) · [файлы](inputs/ordinary/project/) | [PASS](runs/044389965528/answer.md) | [PASS](runs/c21501285cd1/answer.md) | Обе стороны разрешили ограниченный переход для зала S, опираясь на решение владельца, проверку прав и прекращение выдачи талона через 24 часа. |
| [M7](inputs/boundary/task.md) · [файлы](inputs/boundary/project/) | [PASS](runs/1774d3ee0463/answer.md) | [PASS](runs/34229e4aa1d9/answer.md) | Обе стороны удержали запуск факультативной аналитики до отдельного решения директора. Стендовая проверка подтвердила только поведение стенда. |

Назначено 2 пары. Лучше — 0, хуже — 0, обе прошли — 2, обе ошиблись — 0, недостаточно данных — 0.

## Свидетельства

| Случай и вариант | Запись исполнителя | Слепая оценка | Наблюдаемое действие K |
| --- | --- | --- | --- |
| Обычный, с пакетом | [выдача](runs/044389965528/delivery.json) · [действия](runs/044389965528/events.jsonl.gz) · [состояние](runs/044389965528/result.json) | [40193e2be0](assessments/packets/40193e2be0.json) · [PASS](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| Обычный, без пакета | [выдача](runs/c21501285cd1/delivery.json) · [действия](runs/c21501285cd1/events.jsonl.gz) · [состояние](runs/c21501285cd1/result.json) | [a940d61cc2](assessments/packets/a940d61cc2.json) · [PASS](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| Граничный, с пакетом | [выдача](runs/1774d3ee0463/delivery.json) · [действия](runs/1774d3ee0463/events.jsonl.gz) · [состояние](runs/1774d3ee0463/result.json) | [30526fe2ba](assessments/packets/30526fe2ba.json) · [PASS](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| Граничный, без пакета | [выдача](runs/34229e4aa1d9/delivery.json) · [действия](runs/34229e4aa1d9/events.jsonl.gz) · [состояние](runs/34229e4aa1d9/result.json) | [0741e0afcb](assessments/packets/0741e0afcb.json) · [PASS](assessments/first/signed.json) | [done](assessments/first/signed.json) |

Для 0741e0afcb первичный и второй оценщики подписали PASS и PASS. Их исходные отметки K — done и done. [Первая оценка](assessments/first/signed.json) · [Вторая оценка](assessments/second/signed.json)

В контроле действие K выполнено на 2 из 2 задач, пропущено на 0, данных недостаточно для 0.

Архив содержит 8 файлов. SHA-256 `23d3acd3574cf0ad54b805458b2c8a65fe527e016c720662dce1839bcb8be751`. Модель исполнителей gpt-6.2-sol, настройка medium. Индивидуальный вывод ограничен этими заданиями после явной загрузки версии.

[Предрегистрация](../registration.json) · [Критерии R1](rubric.md) · [Архив и состав](../packages/manifest.json) · [Машинная запись](metrics.json) · [Сводка серии](../README.md)
