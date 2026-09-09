# Независимый CHANGE review: исходные инструкции finance

Материальных P1/P2 замечаний в проверенной исходной и установленной поверхности financial-calculations-engineer 0.3.1 не установлено. Это промежуточный source/evidence результат, не окончательный verdict: совместная J01 цепочка ещё ожидается.

Режим change, assurance independent. Base d89d66f2c99bf8b9e84e5b4def54fa60192856a5. Snapshot: docs/reviews/domain-rev-20260909/final-target-manifest.json; SHA256 по относительным путям, все 16 финансовых файлов сверены, расхождений нет. SKILL.md SHA256 a8b86fa481a66d016020bb1eecd951ebe04f29a5d2a2ae9182dc0d4eb42f1688. Reviewer не автор/исполнитель исправления, target не изменял, writing checks не запускал; только этот /tmp отчёт.

Прочитаны repository/target AGENTS, skill-standard, skill-reviewer с methodology и forward-testing, implementation-discipline, declared skill.yaml, emitted SKILL.md, fragment, все шесть активных references, UI metadata; baseline findings, фиксированные критерии и реальные F01–F08 ответы, код F01/F02/F07, raw run report, structural/isolated evidence и self-check. Прямые неизменённые product/architecture/spec/code-review owner boundaries проверены для интерпретации нового handoff; это не аудит соседних скилов.

F-FIN-01 закрыт текстом: root и references делают API/DTO/config условным примером; действующий API и local no-engine formula явно разрешены. F01 сохраняет unit/value и readMinor/mulDivMinor, F02 создаёт локальную JPY функцию без engine, F07 сохраняет совместимый EUR API/DTO. Код соответствует заявленным значениям и переданным контрактам. F03 оставляет currency/units/rate authority неизвестными.

F-FIN-02 закрыт: precedence-resolved discrepancy ведёт к authorized correction/review, stop ограничен unresolved зависимостью. F06 считает 250 по CONTRACT-D; F08 сохраняет нерешённую rounding policy, завершив независимые поля и отмечая совпадение лишь конкретного примера.

F-FIN-03 закрыт: symmetry явно зависит от режима и операции, reversal отделён от нового negative calculation. F01 получает floor 3→1 и −3→−2; F07 сохраняет half-away ±0.03→±2. F04 не придумывает дефект корректного распределения.

Условия загрузки mandatory references доступны из root и соответствуют source. Локальный метод переносим; профильные детали не требуют внешнего package/history. Authority, integer units, scale, range, widened intermediate и запреты FX/налогового/бухгалтерского вымысла согласованы. F05 корректно оставляет SQL/application/persistence not-run; browser build не выдан за исполнение экрана. Формальное правило verified не позволяет закрыть отсутствующий runtime.

F01–F08 по фиксированным execution criteria: PASS в пределах этих синтетических standalone задач. Первый contaminated candidate finance run исключён; учитывается только candidate-finance-clean. Изоляция instruction-only, не аппаратный sandbox; raw report содержит команды/stdout, проверен фактический implementation. Эти samples не доказывают универсальность, реальную налоговую применимость, production integration, улучшение относительно baseline или host selection. Собственные runtime проверки reviewer не повторял: повтор уже успешных writing checks запрещён задачей, а код и применимая существующая evidence доступны.

Source regeneration/structural evidence не заменяют independent behavioral verdict. J01 остаётся ожидаемым evidence input, не дефектом target и не завершённой capability. После его доставки нужны readback consumer/runtime/reassessment и повторная проверка неизменности snapshot, затем окончательный verdict.
