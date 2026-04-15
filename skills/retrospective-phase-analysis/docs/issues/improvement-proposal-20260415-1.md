# Предложение по улучшению 20260415-1: phase boundary, trace-confirmed extraction и privacy-safe output

## Контекст

Поводом стал ретроанализ сессии `019d8db3`.

Часть проблем относится к output UX:

- первый `scan` должен создавать canonical `run_dir`;
- последующие команды должны писать в тот же bundle;
- Markdown reports должны наследовать язык оператора;
- committed retrospective artifacts не должны раскрывать абсолютную структуру локального диска.

Более глубокие методические пробелы:

- scan может включить события самого ретроанализа, если анализ запускается из той же активной session trace;
- stage logs могли существовать, но не были связаны scan-ом как analyzed stage logs;
- report generation может выглядеть финальным даже при degraded evidence extraction.

## P0. Privacy-safe persisted output

Проблема:

Ретроотчеты и `scan-summary.json` могут фиксировать полные локальные абсолютные пути к session store, project root и skill store. Это раскрывает private runtime layout и может попасть в commit.

Корень проблемы:

CLI смешивал operational paths, нужные агенту для чтения и follow-up commands, с paths, которые безопасно сохранять в долговечных отчетах.

Предлагаемое изменение:

- Реальные пути остаются допустимыми только внутри runtime операций и compact stdout после `scan`.
- Persisted `scan-summary.json` и Markdown reports должны использовать display paths: `<project-root>/...`, `<skills-root>/...`, `<session-trace:<short-session-id>>`, `<absolute-path:redacted>/...`.
- Skill должен прямо запрещать копировать raw stdout в committed reports.
- Тесты должны проверять, что persisted artifacts не содержат локальные абсолютные prefixes.

Прямой эффект:

Новые ретроартефакты перестанут коммитить структуру локального диска.

Косвенный эффект:

`scan-summary.json` становится report artifact, а не source of truth для точных follow-up paths. Агент должен брать точный `run_dir` из stdout сразу после `scan`.

Риск:

Агент может попытаться использовать redacted path как CLI input.

Смягчение:

В `SKILL.md` и CLI reference явно указать: exact `run_dir` берется из stdout; persisted summary содержит display-safe paths.

## P1. Добавить phase boundary для active-session retrospective

Проблема:

Если оператор запускает ретроанализ в той же сессии, где велась работа, session trace содержит и анализируемую фазу, и сам ретроанализ. Без boundary агент рискует анализировать собственные шаги анализа как часть исходной работы.

Корень проблемы:

Skill описывает session-based trace reading, но не требует явно зафиксировать `phase_end` перед содержательным scan.

Предлагаемое изменение:

В `SKILL.md` добавить правило:

- если ретроанализ запущен в той же активной сессии, агент сначала определяет boundary анализируемой фазы;
- события после boundary считаются out-of-scope для primary retrospective;
- если boundary нельзя определить из operator request или trace, агент останавливается и уточняет у оператора.

В CLI добавить deterministic inputs `--until-line <n>` или `--until-ts <iso>`.

В `scan-summary.json` добавить `phase_boundary.mode`, `phase_boundary.until_line`, `phase_boundary.until_ts`, `phase_boundary.reason`.

Прямой эффект:

Ретроанализ перестанет загрязняться действиями самого ретроанализа.

Косвенный эффект:

Агенту придется сделать короткий preflight перед scan. Это оправдано только для active-session mode; для явного historical session id можно использовать весь trace.

Риск:

Неправильно выбранный boundary может исключить важные поздние события.

Смягчение:

Boundary должен фиксироваться в summary и быть проверяемым. При сомнении агент обязан отмечать ambiguity, а не молча резать trace.

## P2. Усилить trace-confirmed stage log extraction

Проблема:

Ретроанализ показал, что stage logs были релевантны, но scan не связал их как analyzed stage logs. Это снижает качество выводов и вынуждает агента дочитывать вручную.

Корень проблемы:

Scan слишком слаб в извлечении файлов, которые были созданы или изменены внутри session trace.

Предлагаемое изменение:

В `scan` добавить `candidate_stage_logs` с классификацией `path`, `evidence_kind`, `event_ref`, `included`, `reason`.

Поддерживаемые `evidence_kind`:

- `trace_write`
- `trace_patch_target`
- `trace_shell_write`
- `tool_output_path`
- `referenced_only`

Inclusion rule:

- в primary scope входят только logs, которые подтверждены trace-derived evidence;
- просто наличие файла в `.dossier/logs` не делает его in-scope;
- `referenced_only` должен быть candidate, но не automatically analyzed без дополнительной связи.

Прямой эффект:

Scan будет лучше строить scope из фактических действий агента.

Косвенный эффект:

Количество false positives из старых `.dossier/logs` снизится.

Риск:

Не все runtimes одинаково логируют file writes.

Смягчение:

Skill должен разрешать manual override с evidence, но не должен сканировать все логи без связи с trace.

## P3. Добавить controlled manual override для evidence gaps

Проблема:

Иногда агент видит, что stage log относится к фазе, но trace не содержит надежного machine-readable write event.

Предлагаемое изменение:

Добавить CLI параметры `--stage-log <path>`, `--review-artifact <path>`, `--verification-artifact <path>`, `--artifact-evidence <text>`.

Правило:

- manual override без `artifact-evidence` должен быть ошибкой;
- `scan-summary.json` должен отличать `auto_included` от `manual_included`;
- manual inclusion повышает coverage, но снижает confidence относительно trace-confirmed extraction.

Прямой эффект:

Агент сможет закрывать evidence gaps без широкого repo-wide чтения.

Косвенный эффект:

Отчеты станут честнее: пользователь увидит, какие источники были подтверждены trace, а какие добавлены агентом по обоснованию.

## P4. Явно разделить scaffold report и final retrospective report

Проблема:

Если `scan` degraded, но CLI генерирует Markdown, агент может принять scaffold за готовый финальный report.

Предлагаемое изменение:

Skill и CLI должны считать Markdown report черновиком, если:

- `data_quality` не `complete`;
- `stage_logs_analyzed = 0`, но trace содержит dossier activity;
- есть unresolved `scope_ambiguities`;
- использованы manual overrides;
- language detection не уверена;
- phase boundary ambiguous.

В таких случаях report должен содержать marker `Status: draft, requires agent validation`.

Прямой эффект:

Агент не будет выдавать degraded autogenerated report как финальный аналитический результат.

Косвенный эффект:

Финальный отчет станет более ручным и evidence-driven, но это правильно для ретроанализа процесса.

## Что не менять

- Не делать repo-wide reading стартовой точкой ретроанализа.
- Не включать все `.dossier/logs` только потому, что они лежат в стандартной директории.
- Не хардкодить русский язык. Язык отчета должен наследоваться от языка оператора или явного `--language`.
- Не стандартизировать layout session store для всех runtimes. Поиск session trace остается обязанностью агента; CLI работает с уже найденным trace или явно переданным session input.

## Предпочтительный порядок реализации

1. Зафиксировать privacy-safe persisted output и тесты на отсутствие абсолютных runtime paths.
2. Добавить phase boundary policy в `SKILL.md`.
3. Добавить `--until-line` / `--until-ts` в scan.
4. Усилить extraction candidate model для stage logs и связанных artifacts.
5. Добавить controlled manual overrides.
6. Добавить draft/final status rules для generated reports.
7. Добавить UX тесты на active-session retrospective и trace-confirmed stage log extraction.
