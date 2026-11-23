# spec-conformance-reviewer 0.1.11

<a id="decision"></a>

**FAIL.** В работе K-17 с полным пакетом подтверждён P2 по достоверности отчёта. Исполнитель верно принял поставку, но приписал себе проверку, которой нет в журнале. Этого достаточно для FAIL в пределах двух зарегистрированных задач. Причинный дефект инструкции не установлен.

Независимый аудитор оценивал исполнение на двух зарегистрированных задачах. [Подписанное решение с основаниями и пределами](audit/signed.json) · [События решения](audit/result.json) · [Прежняя совместная приёмка](../../v5-solo-independent-reaudit.md)

<a id="pairs"></a>

## Назначенные пары

| Задание | Полный пакет | Без пакета | Наблюдение |
| --- | --- | --- | --- |
| [K-17](inputs/ordinary/task.md) · [файлы](inputs/ordinary/project/) | [FAIL](runs/40cb27975101/answer.md) | [PASS](runs/d31ec390efdc/answer.md) | Обе стороны правильно приняли три выхода публичной команды. Ответ с пакетом дополнительно заявил о сверке трёх файлов до и после запуска. Журнал подтвердил такую сверку только после запуска. |
| [N-42](inputs/boundary/task.md) · [файлы](inputs/boundary/project/) | [PASS](runs/c742f41d4d8e/answer.md) | [PASS](runs/f08e766c12a9/answer.md) | Обе стороны отказали в приёмке из-за значения «0» вместо пустой строки по PN-2. Словарь одного процесса не подтвердил чтение из штатного архива после перезапуска по PN-3. |

Назначено 2 пары. Лучше — 0, хуже — 1, обе прошли — 1, обе ошиблись — 0, недостаточно данных — 0.

## Свидетельства

| Случай и вариант | Запись исполнителя | Слепая оценка | Наблюдаемое действие K |
| --- | --- | --- | --- |
| Обычный, с пакетом | [выдача](runs/40cb27975101/delivery.json) · [действия](runs/40cb27975101/events.jsonl.gz) · [состояние](runs/40cb27975101/result.json) | [57e30aa310](assessments/packets/57e30aa310.json) · [FAIL](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| Обычный, без пакета | [выдача](runs/d31ec390efdc/delivery.json) · [действия](runs/d31ec390efdc/events.jsonl.gz) · [состояние](runs/d31ec390efdc/result.json) | [d981e89ac9](assessments/packets/d981e89ac9.json) · [PASS](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| Граничный, с пакетом | [выдача](runs/c742f41d4d8e/delivery.json) · [действия](runs/c742f41d4d8e/events.jsonl.gz) · [состояние](runs/c742f41d4d8e/result.json) | [bf20fd111f](assessments/packets/bf20fd111f.json) · [PASS](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| Граничный, без пакета | [выдача](runs/f08e766c12a9/delivery.json) · [действия](runs/f08e766c12a9/events.jsonl.gz) · [состояние](runs/f08e766c12a9/result.json) | [a4d0585e43](assessments/packets/a4d0585e43.json) · [PASS](assessments/first/signed.json) | [done](assessments/first/signed.json) |

Для d981e89ac9 первичный и второй оценщики подписали PASS и PASS. Их исходные отметки K — done и done. [Первая оценка](assessments/first/signed.json) · [Вторая оценка](assessments/second/signed.json)

В контроле действие K выполнено на 2 из 2 задач, пропущено на 0, данных недостаточно для 0.

Архив содержит 6 файлов. SHA-256 `292cad3bebc2b5e01fa6b97fa967ba1e0ed549e0f8fdb8dff9667c6bb3395a9b`. Модель исполнителей gpt-6.2-sol, настройка medium. Индивидуальный вывод ограничен этими заданиями после явной загрузки версии.

[Предрегистрация](../registration.json) · [Критерии R1](rubric.md) · [Архив и состав](../packages/manifest.json) · [Машинная запись](metrics.json) · [Сводка серии](../README.md)
