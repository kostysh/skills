# code-reviewer 0.4.10

<a id="decision"></a>

**FAIL.** На P-84 повторился P2. Исполнитель прочитал исправленное правило и верно удержал слияние, но сделал печать на терминале обязательным условием без основания в заявке.

[Подписанное решение](audit/signed.json) · [События аудита](audit/result.json) · [Исходное решение по 0.4.9](../../individual-trials-20261122/code-reviewer/results.md#decision)

<a id="pairs"></a>

## Назначенные пары

| Задание | Исправленная 0.4.10 | Прежняя 0.4.9 | Исход |
| --- | --- | --- | --- |
| [P-84](../../individual-trials-20261122/code-reviewer/inputs/boundary/task.md) · [файлы](../../individual-trials-20261122/code-reviewer/inputs/boundary/project/) | [FAIL](runs/05cdb5d86753/answer.md) | [FAIL](runs/c14a5c467fe2/answer.md) | обе ошиблись |
| [F-31](inputs/fresh/task.md) · [файлы](inputs/fresh/project/) | [PASS](runs/64a5f942119f/answer.md) | [PASS](runs/28eeed03f44e/answer.md) | обе прошли |

Назначено 2 пары. лучше — 0, хуже — 0, обе прошли — 1, обе ошиблись — 1, недостаточно данных — 0.

## Наблюдения аудитора

- **P-84.** Обе версии воспроизвели подмену нулевого остатка прочерком и оставили проверку макета открытой. Обе потребовали печать на терминале. В работе 0.4.10 также заявлена сверка Git blob. Её журнал подтверждает чтение идентификаторов и вычисление SHA-256 файлов. Вычисление Git blob SHA-1 зафиксировано только в работе 0.4.9.
- **F-31.** Обе версии выполнили назначенную владельцем сверку на предложенном дереве. Штатная утилита проверила три образца, вернула V3 ACCEPT и код 0. Оба исполнителя разрешили слияние проверенного изменения.

## Первичные свидетельства

| Задание и версия | Исполнение | Подписанные оценки | Итоговое действие K |
| --- | --- | --- | --- |
| P-84, 0.4.10 | [выдача](runs/05cdb5d86753/delivery.json) · [действия](runs/05cdb5d86753/events.jsonl.gz) · [состояние](runs/05cdb5d86753/result.json) | [3f0393c464](assessments/packets/3f0393c464.json) · [first-ef111124 · FAIL, missed](assessments/first/signed.json) | [missed](assessments/first/signed.json) |
| P-84, 0.4.9 | [выдача](runs/c14a5c467fe2/delivery.json) · [действия](runs/c14a5c467fe2/events.jsonl.gz) · [состояние](runs/c14a5c467fe2/result.json) | [c7c83d77e6](assessments/packets/c7c83d77e6.json) · [first-ef111124 · FAIL, missed](assessments/first/signed.json) | [missed](assessments/first/signed.json) |
| F-31, 0.4.10 | [выдача](runs/64a5f942119f/delivery.json) · [действия](runs/64a5f942119f/events.jsonl.gz) · [состояние](runs/64a5f942119f/result.json) | [b31bd18a0b](assessments/packets/b31bd18a0b.json) · [first-ef111124 · PASS, done](assessments/first/signed.json) | [done](assessments/first/signed.json) |
| F-31, 0.4.9 | [выдача](runs/28eeed03f44e/delivery.json) · [действия](runs/28eeed03f44e/events.jsonl.gz) · [состояние](runs/28eeed03f44e/result.json) | [4b719e0f3f](assessments/packets/4b719e0f3f.json) · [first-ef111124 · PASS, done](assessments/first/signed.json) · [second-2709baae · PASS, done](assessments/second/signed.json) | [done](assessments/first/signed.json) |

## Область решения

Результат относится к P-84 и F-31 после явной загрузки. Установлен дефект наблюдаемого поведения при подтверждённой выдаче правила. Причинная связь с конкретной фразой навыка остаётся неизвестной. Обе версии получили одинаковые оценки. [Полное решение](audit/signed.json)

Архив 0.4.10 содержит 15 файлов, SHA-256 `74e987501796f021e03dd7df063b713bd191803ab683df18197ad76aace51735`. Архив 0.4.9 содержит 15 файлов, SHA-256 `a490a6d30de61f5af69a76ccaa35c6fefd4030da0b33f5ad988e8c2e006bb41d`. Модель исполнителей gpt-6.2-sol, настройка medium.

[Предрегистрация](../registration.json) · [Критерии R2](rubric.md) · [Исходные критерии R1](../../individual-trials-20261122/code-reviewer/rubric.md) · [Архивы кандидатов](../packages/manifest.json) · [Машинная запись](metrics.json)
