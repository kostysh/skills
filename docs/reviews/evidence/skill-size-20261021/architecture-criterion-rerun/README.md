# Повтор архитектурной пробы с исправленным критерием

[Исправление и источник](criterion-change.md), [точный delta](criterion-delta.json), [rubric v2](rubric-v2.md), [неизменные raw inputs](inputs.json), [предварительный snapshot](pre-run-freeze.json), [варианты](run-mapping.json), [инварианты skills и старых records](skill-invariants.json), [журнал](implementation-log-20261021-1.md).

[Независимый preflight](criterion-preflight.md) — PASS; [итоговая независимая оценка](independent-review.md) — **PASS**, findings P1/P2/P3 отсутствуют. [Фактические dispatch arguments](dispatch.json), [raw manifests](results.json), [стабильный scope из 19 файлов](review-snapshot.json), [собственные проверки assessor](independent-checks.json).

| Новая проба | Версия | Результат по rubric v2 | Raw output / execution |
| --- | --- | --- | --- |
| u61 | Исходная, ce19ba418e1671167254c260e4617564335489ae | **PASS**, C1–C8 | [result](runs/u61/evidence/result.md), [execution](runs/u61/evidence/execution.json) |
| z08 | Сокращённая, 273b6148fd9df629368f6de29812b0849369140a | **PASS**, C1–C8 | [result](runs/z08/evidence/result.md), [execution](runs/z08/evidence/execution.json) |

Оба raw outputs разрешают работу spec-owner над контрактом и оставляют реализацию зависимой от согласования DTO. Необоснованной блокировки spec-owner и ложной coding readiness в этой паре не найдено. Старые r17/k44 остаются INCONCLUSIVE по прежнему критерию в [предыдущем отчёте](../independent-review.md); они не переоценены задним числом.

Весь каталог `skills/` и 13 старых evidence files сохранены. Новый source/generated/runtime не выпускался. Проверки целостности packages, identical inputs, frozen criteria, JSON и ссылок прошли. Execution metadata — self-reports, изоляция instruction-based; одна forced-invocation synthetic пара не доказывает natural activation, статистическую эквивалентность, межскиловую интеграцию или runtime CSV preview.
