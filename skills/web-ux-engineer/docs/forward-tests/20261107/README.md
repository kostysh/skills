# Свидетельства WEB-UX-20261107

Материалы ненормативны и не входят в архив скила. [Критерии](criteria.md) зафиксированы до авторинга; [exposure](exposure.json) описывает роли, допуск к файлам, ограничения и поздние delta-проверки. Изоляция исполнителей инструктивная на общей ФС, не OS sandbox. Модель/настройки наследовались без override; сопоставимых runtime token/time измерений нет.

- [Baseline SHA-256](baseline.json), [ранний candidate trial snapshot](candidate-active.json).
- Входы: [выбор](selection.md), [A–H](tasks.md), [реализация](live.md).
- Каталоги: [baseline](baseline-catalog.json), [candidate](candidate-catalog.json); ответы выбора: [baseline](baseline-selection-output.md), [candidate](candidate-selection-output.md).
- Письменные ответы: [baseline](baseline-tasks/tasks-output.md), [candidate](candidate-tasks/tasks-output.md); [контроль побочных изменений](task-side-effects.json).
- [Самостоятельный новый пакет A–E](standalone/output.md), [React reference delta](reference-delta/output.md).
- Живой baseline: [результат](baseline-live/result.md), [сырые команды](baseline-live/commands.jsonl), [diff](baseline-live/final.diff).
- Живой candidate: [результат](candidate-live/summary.md), [сырые команды](candidate-live/commands.json), [preview](candidate-live/supplemental-commands.json), [diff](candidate-live/final.diff).
- [Контроль live-изменений](live-side-effects.json), [авторская оценка проб](assessment.md).
- [Compiler 1](compiler-1.json), [compiler 2](compiler-2.json), [quick validate](quick-validate.txt), [упаковка/readback](package-readback.json), [контракты соседей](neighbor-invariants.json).

Screenshots сохраняют промежуточные неуспешные состояния. Для текущего целевого шрифта использовать baseline 19/20 и candidate screenshots 09/10; ранние dev-снимки отражают fallback font. В отчётах исполнителей исходные абсолютные /tmp-ссылки сохранены как часть raw output; соответствующие записи и изображения лежат рядом с копиями отчётов. JSON-журналы — канонические raw tool records; большие дублирующие Markdown-экспорты и установленное CLI-руководство оставлены во временной рабочей области. Вспомогательный код baseline сохранён только как неисполняемый текст свидетельств. Постоянный harness, backend и приложение в пакет не добавлены.

Сборка и локальный lint App.tsx прошли. Общий lint учебного примера падает на ранее существующем ui/button.tsx; это не скрывается и не считается дефектом скила. Наблюдения относятся к синтетическому локальному интерфейсу, не к аудитории, реальному backend, конверсии или всему WCAG. Независимое заключение и окончательный снимок связаны из [общего журнала](../../logs/implementation-log-20261107-1.md).
