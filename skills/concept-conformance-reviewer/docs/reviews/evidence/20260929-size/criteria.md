# Сохранение поведения при устранении повторов

Зафиксировано до edits ревизии 0.2.6. Основание — требование оператора устранить warning размера до нового аудита и не потерять функциональность. Порог 20 000 bytes остаётся прежним; новые reference, этапы, команды и зависимости не вводятся. Baseline — проверенная 0.2.5 из `../20260929-premises/candidate-snapshot.tar.gz` и соответствующего manifest.

Изменение ограничено удалением повторных policy summaries. Их нормативное содержание уже находится в root: основной workflow и `fragments/overview.md` сохраняются. Единственная формулировка, не повторённая дословно в полном output contract, переносится туда без изменения: `Start with a plain-language outcome.`

| Удаляемый повтор | Остающееся нормативное содержание |
| --- | --- |
| Capability-first policy | Overview; Frame the capability and claim boundary; Compare the target to the concept. Оценка по поведению относительно actor/claim, не по количеству артефактов. |
| Review basis and concept authority policy | Input contract and authority; Establish the review basis. Target/claim/concept обязательны, precedence применяется до blocked, lower-authority drift не блокирует, missing/equal-or-unknown authority не допускают classification/fake-risk. |
| Claim-relative classification policy | Полный Claim-relative classification и Frame the capability: все четыре класса, зависимость от actor/claim, различение интерфейса и полного flow. |
| Evidence integrity policy | Review modes/closure-time; Test acceptance and evidence integrity; Verdict calibration. Нужны current boundary evidence; simulated/intercepted/stale/partial/unreviewed evidence остаются gaps. |
| Acceptance integrity policy | Test acceptance and evidence integrity ищет критерии, допускающие отсутствие capability; Interop/spec-engineer сохраняет владельца ремонта спецификации. |
| Output completeness policy | Полный Output contract со всеми blocked/assessable полями; начальная фраза plain-language outcome переносится дословно. |

Архитектурные правила, re-audit, honest substrate, anti-claims, verdict ordering, gotchas и interop не меняются. Это author equivalence map, не независимая приёмка.

Структурные критерии: emitted `SKILL.md` меньше либо равен 20 000 bytes; lint/regenerate/check/isolated compile/check без warnings; emitted файлы совпадают; порог и description не изменены; source/generated согласованы. Экономия байтов не является доказательством сохранения поведения.

Поведенческие критерии для повторных candidate cases01/02/03b/04/05 берутся без изменений из `../20260929-premises/criteria.md` и `erratum-03b.md`. Для like-for-like baseline сравнения используются уже сохранённые raw outputs 0.2.5 на тех же входах. Независимый reviewer должен сверить применимость этих evidence и исходные ограничения, а не принять готовые оценки автора.

Дополнительные одинаковые baseline/candidate входы:

- Case06: отсутствует необходимая концептуальная основа. Обязательны `blocked / not assessable`, `request authority/evidence`, запрос владельцу концепции; запрещены выдуманная концепция, classification и fake-risk.
- Case07: честный подготовительный компонент с названной owner capability и достаточной приёмкой его узкой границы. Обязательны `substrate-ready`, `proceed as substrate`, отсутствие утверждения, что реализован полный runtime или уже выполнены тесты; нельзя блокировать работу только за то, что она substrate, либо требовать новый продуктовый scope.

Все новые исполнители получают свежие контексты, только соответствующий полный root и один input. Rubric, map, prior outputs, maintenance logs и история скрыты. Входы/outputs сохраняются побайтово; доступ ограничен инструкцией на общей FS, не hard sandbox. Assessor — отдельный reviewer, не автор candidate. Утверждения о natural activation, универсальной надёжности или внешнем runtime не делаются.
