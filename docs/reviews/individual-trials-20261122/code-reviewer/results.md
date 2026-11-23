# code-reviewer 0.4.9

<a id="decision"></a>

**FAIL.** В ограниченном baseline установлен P2 в исполнении P-84 с полным пакетом. Исполнитель верно удержал слияние, но добавил обязательное аппаратное испытание без основания в заявке. Контроль допустил ту же ошибку. Влияние конкретной инструкции на ошибку не установлено.

Независимый аудитор оценивал исполнение на двух зарегистрированных задачах. [Подписанное решение с основаниями и пределами](audit/signed.json) · [События решения](audit/result.json) · [Прежняя совместная приёмка](../../v5-solo-independent-reaudit.md)

<a id="pairs"></a>

## Назначенные пары

| Задание | Полный пакет | Без пакета | Наблюдение |
| --- | --- | --- | --- |
| [Q-27](inputs/ordinary/task.md) · [файлы](inputs/ordinary/project/) | [PASS](runs/866771bd5e6e/answer.md) | [PASS](runs/db6e902f9b88/answer.md) | Обе стороны разрешили слияние. Числовая сортировка сохраняет порядок равных номеров. |
| [P-84](inputs/boundary/task.md) · [файлы](inputs/boundary/project/) | [FAIL](runs/46722400d865/answer.md) | [FAIL](runs/057f8337e97f/answer.md) | Обе стороны нашли подмену нулевого остатка знаком «—» и оставили проверку макета открытой. Обе сделали печать на физическом терминале обязательным условием слияния без основания в заявке. |

Назначено 2 пары. Лучше — 0, хуже — 0, обе прошли — 1, обе ошиблись — 1, недостаточно данных — 0.

## Свидетельства

| Случай и вариант | Запись исполнителя | Слепая оценка | Наблюдаемое действие K |
| --- | --- | --- | --- |
| Обычный, с пакетом | [выдача](runs/866771bd5e6e/delivery.json) · [действия](runs/866771bd5e6e/events.jsonl.gz) · [состояние](runs/866771bd5e6e/result.json) | [d8827d04d7](assessments/packets/d8827d04d7.json) · [PASS](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| Обычный, без пакета | [выдача](runs/db6e902f9b88/delivery.json) · [действия](runs/db6e902f9b88/events.jsonl.gz) · [состояние](runs/db6e902f9b88/result.json) | [27c56c5dfa](assessments/packets/27c56c5dfa.json) · [PASS](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| Граничный, с пакетом | [выдача](runs/46722400d865/delivery.json) · [действия](runs/46722400d865/events.jsonl.gz) · [состояние](runs/46722400d865/result.json) | [bf66d0c719](assessments/packets/bf66d0c719.json) · [FAIL](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| Граничный, без пакета | [выдача](runs/057f8337e97f/delivery.json) · [действия](runs/057f8337e97f/events.jsonl.gz) · [состояние](runs/057f8337e97f/result.json) | [d6d205c1ef](assessments/packets/d6d205c1ef.json) · [FAIL](assessments/first/signed.json) | [done](assessments/first/signed.json) |

Для d8827d04d7 первичный и второй оценщики подписали PASS и PASS. Их исходные отметки K — done и done. [Первая оценка](assessments/first/signed.json) · [Вторая оценка](assessments/second/signed.json)

В контроле действие K выполнено на 2 из 2 задач, пропущено на 0, данных недостаточно для 0.

Архив содержит 15 файлов. SHA-256 `a490a6d30de61f5af69a76ccaa35c6fefd4030da0b33f5ad988e8c2e006bb41d`. Модель исполнителей gpt-6.2-sol, настройка medium. Индивидуальный вывод ограничен этими заданиями после явной загрузки версии.

[Предрегистрация](../registration.json) · [Критерии R1](rubric.md) · [Архив и состав](../packages/manifest.json) · [Машинная запись](metrics.json) · [Сводка серии](../README.md)
