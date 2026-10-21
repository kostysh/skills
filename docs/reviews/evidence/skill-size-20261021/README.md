# Сокращение размера двух скилов

Supporting evidence для прямого поручения оператора; не активные инструкции.

| Скил | До | После | Лимит | Экономия |
| --- | ---: | ---: | ---: | ---: |
| architecture-engineer | 26032 | 25977 | 26000 | 55 |
| delivery-planner | 23842 | 23493 | 23500 | 349 |

[Author self-check и точные replacements](author-self-check.json), [snapshot](snapshot.json), [structural commands](structural-commands.json), [checks](checks.json), [raw test:ci](candidate-tests.txt): все применимые локальные проверки прошли, предупреждений в двух compile reports нет. Source versions обновлены на patch; runtime и лимиты не менялись.

[Закреплённые inputs и rubric](inputs.json), [pre-edit hashes](input-manifest.json), [opaque run mapping](run-mapping.json). На каждый skill один одинаковый synthetic case в baseline/candidate: всего четыре отдельных свежих executor. Автор/root знает rubric; executors получают только свой raw case и active-only skill. Нет model/reasoning override; runtime model metadata независимо не собирались. Shared filesystem access ограничен инструкциями, не hard sandbox. Сравнение не доказывает natural discovery, доменную корректность всех сценариев или статистическое улучшение.

[Независимый skill-reviewer](independent-review.md): **PASS**, bounded change review; findings P1/P2/P3 отсутствуют. Reviewer самостоятельно подтвердил frozen hashes, сохранение требований трёх замен, source/generated parity и final emitted packages. [Собственные команды](independent-checks.json), [проверка snapshot/parity](independent-verification.json), [целостность trials](independent-trial-integrity.json) сохранены рядом с отчётом; их исходные `/tmp` paths в verbatim report — место выполнения.

[Полные outputs и execution records](results.json): delivery baseline/candidate — **PASS/PASS**; architecture baseline/candidate — **INCONCLUSIVE/INCONCLUSIVE** по неизменённой rubric. Architecture rubric требует draft/blocked handoff, тогда как owning source допускает ready для spec-owner при blocked implementation; оба outputs корректно разделяют эти границы. Это ограничивает trial score, не устанавливает регрессию и не превращено в «4/4 PASS». Прямое сопоставление требований и независимый bounded verdict сохранены отдельно от trial score.

Проверенный active/source snapshot не включает новые supporting statuses/reports. Следующий этап — разрешённые scoped commits, PR, exact-head CI, merge и local sync; review сам по себе не доказывает их выполнение.

## Дополнение: исправление архитектурного критерия

[Критерий v2 и новые пробы](architecture-criterion-rerun/README.md), [журнал](architecture-criterion-rerun/implementation-log-20261021-1.md), [независимая оценка](architecture-criterion-rerun/independent-review.md): baseline u61 — **PASS**, candidate z08 — **PASS**, independent re-audit — **PASS**. Это новые исполнения после исправления ошибочного критерия готовности следующего владельца. Исторические r17/k44 и их INCONCLUSIVE выше сохраняются; весь каталог skills/ неизменён.
