# Проверки implementation-discipline: 2026-10-21

Supporting evidence для прямого задания оператора. Это не активные инструкции скила.

- [Snapshot](snapshot.json): baseline `0bd4d8d92a9488e5595faa2045353733ec0b5fca`, candidate SHA-256 `592310e51cc434562345535fe63748e9bfaed853a28d8d29d1c4fe55329d51ba`, 5 файлов. Алгоритм и relative-path inventory указаны внутри.
- [Закрытые критерии](rubric.md) и [исходные задания/файлы](inputs.json): закреплены до candidate edits. JSON сохраняет relative paths, полные тексты и SHA-256; это raw inputs, а не пересказ.
- [Результаты](results.json): фактические ответы, сохранённые stdout/stderr/exit codes, проверки, начальные hashes и diff каждого изменённого файла. Evidence вспомогательных команд лежит в том же архиве; их stdout не означает live-service verification.
- [Общая проверка репозитория](../../../../../docs/reviews/evidence/skill-repairs-20261021/checks.json): frozen install и `pnpm test:ci` после фиксации всех active candidates; [raw log](../../../../../docs/reviews/evidence/skill-repairs-20261021/candidate-tests.log).

Автор candidate и fixtures: `/root/repair_skills`. Критерии видел автор и root; task inputs были подготовлены до правок и критерии не подгонялись под результаты. Каждый исполнитель — отдельный агент с `fork_turns=none`, без model/reasoning override, с единственным case и копией active skill. Исходная пользовательская диагностика, rubrics, авторские QA и соседние случаи исключены из его задания. Это ограничение доступа инструкциями на общей файловой системе, не hard sandbox. Фактические runtime metadata модели отдельно не собирались.

Копия для trials содержит `SKILL.md`, имеющиеся `references/`, `assets/`, `agents/`. Исключены maintenance source, AGENTS, supporting history, package/test поверхности; полный source/package отдельно проверяется independent reviewer. [Snapshot](snapshot.json) перечисляет точные включённые и исключённые поверхности. Исходники skill не менялись после freeze; пробные исправления ограничены disposable проектами.

Все случаи синтетические. Пробы проверяют решения после принудительного вызова скила; они не доказывают natural discovery, работу реального облака, частоту ошибок или универсальную надёжность. Baseline сохранён для сравнения diff, отдельного количественного baseline/candidate benchmark не заявлено.

Независимый `skill-reviewer` выдаёт отдельный verdict по стабильному snapshot после оценки raw outputs. Авторская компиляция, QA fixtures и этот индекс не являются independent PASS.

[Независимый аудит](independent-review.md): **PASS**, `change / independent`, 4/4 случаев, P1/P2/P3 = 0. Аудитор: `/root/audit_repairs`. Supporting additions не входят в active/source snapshot.
