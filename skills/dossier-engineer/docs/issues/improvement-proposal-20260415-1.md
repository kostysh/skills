# Предложение по улучшению 20260415-1: completion guard, ранние security seams и freshness closure

## Контекст

Поводом стал ретроанализ сессии `019d8db3`, в которой выполнялась работа по `F-0018` / `CF-024`.

Затронутые поверхности `dossier-engineer`:

- `Workflow stage: implementation`
- `Workflow stage: plan-slice`
- `references/implementation-audit-policy.md`
- `references/workflow-stage-logging.md`
- step-close / review / verification artifacts

Главный вывод ретроанализа: итоговая реализация была доведена до приемлемого состояния, но процесс допустил несколько сильных трений:

- агент преждевременно остановился после первого зеленого implementation increment, хотя весь план еще не был завершен;
- security review был полезен, но сработал поздно для trust-boundary изменений;
- closure artifacts несколько раз пересоздавались и дообновлялись из-за неясной freshness-модели;
- process misses и review orchestration были восстановимы человеком, но недостаточно машинно связаны с исходными событиями.

## P1. Разделить implementation checkpoint и completion

Проблема:

Агент смог интерпретировать успешный частичный increment как достаточное основание для ответа оператору, хотя план работ содержал несколько slices и задача не была полностью закрыта.

Корень проблемы:

`implementation` описывает последовательность действий и аудитов, но не задает жесткий completion guard: когда агент имеет право сказать, что stage завершен, а когда это только checkpoint.

Предлагаемое изменение:

- В `Workflow stage: plan-slice` добавить явный блок `allowed_stop_points`.
- В `Workflow stage: implementation` добавить правило: final answer оператору после implementation stage допустим только если выполнено одно из условий: все planned slices завершены, достигнут заранее зафиксированный `allowed_stop_point`, найден blocker, который нельзя устранить без решения оператора, или оператор явно попросил остановиться на checkpoint.
- В implementation log добавить обязательные поля `planned_slices`, `slice_status`, `current_checkpoint`, `completion_decision`.

Прямой эффект:

Агент перестанет путать зеленую промежуточную проверку с завершением всей stage.

Косвенный эффект:

Ответы оператора станут реже, но плотнее: агент будет дольше доводить задачу до конца, если нет blocker. Это соответствует цели стабильного процесса, но требует хорошего логирования progress checkpoints.

Риск:

Агент может слишком долго продолжать работу, если план слишком большой.

Смягчение:

`plan-slice` должен фиксировать реалистичные `allowed_stop_points`, а `implementation` должен останавливаться при blocker или выходе за рамки спецификации.

## P2. Добавить ранний security seam checkpoint

Проблема:

Security-аудит выявил важную корректировку поздно: публичные high-risk routes должны быть explicitly unavailable до соответствующей backlog-задачи, а `trusted_ingress` fail-closed logic нужно отделять от внутреннего bypass.

Корень проблемы:

Финальный security review есть, но нет правила запускать узкий security checkpoint сразу после изменения trust-boundary seams.

Предлагаемое изменение:

В `implementation-audit-policy.md` добавить early security seam checkpoint для code changes, которые затрагивают:

- public route exposure или reserved route behavior;
- auth/admission gate;
- trusted ingress или internal bypass;
- secret material, redaction, export controls;
- failure semantics для security-sensitive paths.

Правило:

- ранний checkpoint не заменяет финальный security audit;
- scope checkpoint должен быть узким и привязанным к измененному seam;
- если checkpoint находит проблему за пределами спецификации, агент останавливается и запрашивает решение оператора.

Прямой эффект:

Security-корректировки будут выявляться до того, как агент построит вокруг ошибочной модели тесты, логи и closure artifacts.

Косвенный эффект:

Увеличится число аудитов в задачах с security-sensitive кодом. Это приемлемо, потому что триггеры узкие и должны срабатывать только на trust-boundary изменениях.

Риск:

Агент может запускать security checkpoint слишком широко.

Смягчение:

В policy нужно прямо указать, что обычные refactors, formatting, prose и non-security business logic не запускают early security checkpoint.

## P3. Уточнить freshness closure model

Проблема:

В сессии появились pre-final и final verification/review artifacts, затем часть артефактов дообновлялась после commit. Формально это было восстановлено, но процесс выглядел неоднозначно.

Корень проблемы:

Skill говорит о step closure, но не фиксирует каноническую последовательность для artifact freshness.

Предлагаемое изменение:

В `Workflow stage: implementation` и step closure contract добавить порядок:

1. Сформировать intended final tree.
2. Запустить verification на intended final tree.
3. Запустить нужные external audits.
4. Сгенерировать review / verification / step-close artifacts.
5. Выполнить commit.
6. Если commit metadata требуется в артефакте, сделать только trace-only metadata backfill без изменения технического содержания.

В logging / artifact schema добавить опциональные поля `canonical_for_commit`, `supersedes`, `generated_after_commit`, `freshness_basis`.

Прямой эффект:

Агент сможет отличать canonical closure artifact от устаревшего draft.

Косвенный эффект:

Ретроанализ и последующие проверки смогут отсекать pre-final артефакты без ручной реконструкции.

Риск:

Если поля станут обязательными слишком рано, агент начнет избыточно переписывать старые артефакты.

Смягчение:

Сначала сделать поля обязательными только для новых step-close / implementation closure artifacts.

## P4. Усилить trace anchors для process misses и review telemetry

Проблема:

Ретроанализ смог восстановить process misses, но не получил стабильных ссылок на операторские команды и review events.

Корень проблемы:

Логирование уже содержит полезные метрики, но не требует machine-readable связи между missed decision и конкретным событием в session trace.

Предлагаемое изменение:

В `workflow-stage-logging.md` добавить поля `operator_command_refs`, `process_miss_refs`, `review_events`.

Для `process_miss_refs` требовать `miss_id`, `severity`, `operator_command_ref`, `stage_log_ref`, `decision_ref`, `resolution_ref`.

Для `review_events` требовать минимально `agent_id`, `role`, `model`, `requested_ts`, `verdict_ts`, `verdict`, `rerun_reason`, `scope`.

Прямой эффект:

Ретроанализ сможет находить не только факт проблемы, но и точку процесса, где она возникла.

Косвенный эффект:

Логи станут чуть подробнее. Это оправдано только для implementation stage и review-bearing stages; не нужно переносить этот объем на простые prose-only операции.

## Что не менять

- Не переносить обязанности `code-reviewer`, `security-reviewer` или `spec-conformance-reviewer` в `dossier-engineer`.
- Не превращать `implementation` в review skill.
- Не требовать security audit для prose-only изменений.
- Не делать commit SHA критерием валидности артефактов. Commit может быть только trace link к состоянию репозитория.

## Предпочтительный порядок реализации

1. Добавить completion guard и `allowed_stop_points`.
2. Добавить поля логирования для slices, completion и trace anchors.
3. Добавить early security seam checkpoint.
4. Уточнить freshness closure model.
5. Запустить UX аудит по роли агента на изменениях `implementation` и `plan-slice`.
