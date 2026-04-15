# Предложение по улучшению 20260415-3: fail-closed запуск blocking audit agents

## Контекст

Поводом стал ретроанализ implementation-сессии `019d919b` для `F-0019` / `CF-018`.

Implementation был закрыт успешно, но один процессный сбой имеет критический уровень: обязательные external audits сначала были запущены без явного model control и ушли на `gpt-5.4-mini`. Оператор прервал выполнение, результаты mini-аудитов были инвалидированы, агенты закрыты, а проверки перезапущены на `gpt-5.4` с высоким reasoning.

Это не частная проблема одной сессии. Любой blocking audit gate теряет смысл, если агент может случайно запустить reviewer на weak/mini model и принять или даже временно учитывать его verdict.

Затронутые поверхности `dossier-engineer`:

- `Workflow stage: implementation`
- `Independent review execution model` в `SKILL.md`
- `references/implementation-audit-policy.md`
- `references/workflow-stage-implementation.md`
- `references/workflow-stage-logging.md`
- stage exit checklists в `SKILL.md`
- docs-contract tests

## Наблюдаемая проблема

Текущая методика требует spawned external agents и external audits, но не заставляет перед запуском доказать, что audit launch соответствует model policy.

Агент может формально выполнить правило "spawn reviewer", но не указать:

- model;
- reasoning effort;
- required review skill;
- blocking/non-blocking характер audit;
- whether the model is allowed for that audit class.

В результате platform default может выбрать weak/mini model. Даже если результат потом инвалидирован, процесс уже потерял время и доверие.

## Корень проблемы

Методика смешивает два разных этапа:

1. решение, что audit нужен;
2. безопасный запуск audit agent с валидной моделью и scope.

Сейчас второй этап не является явным gate. `spawn_agent` остается слишком свободной операцией: если agent role и scope указаны, но model/reasoning не указаны, процесс не блокирует запуск.

## Предлагаемое изменение

### P1. Добавить `Audit launch gate` в implementation audit policy

В `references/implementation-audit-policy.md` добавить обязательный pre-spawn gate для всех blocking audits.

Перед `spawn_agent` агент должен явно зафиксировать:

- audit class: `spec-conformance`, `code`, `security`, `independent-review`, `early-security-checkpoint` или другой named blocking audit;
- required skill;
- scope;
- model;
- reasoning effort;
- whether the audit is blocking;
- allowed/disallowed model class verdict.

Fail-closed правило:

- если model не указана, audit не запускается;
- если reasoning effort не указан для blocking audit, audit не запускается;
- если model принадлежит weak/mini class или запрещена repo/operator policy, audit не запускается;
- если agent runtime не позволяет выбрать модель явно, агент должен остановиться и запросить operator decision вместо degraded review mode.

Ожидаемый эффект:

Blocking audits не смогут случайно стартовать на platform default или mini model.

### P2. Зафиксировать disallowed weak/mini model rule

В policy добавить явное правило:

- weak/mini models cannot produce blocking audit verdicts;
- results from weak/mini audit attempts must be treated as invalidated;
- invalidated attempts must not be summarized as PASS/FAIL evidence;
- they may be recorded only as orchestration telemetry and process miss evidence.

Важно:

- это правило не запрещает lightweight helper agents для non-blocking exploration, если operator явно разрешил такой режим;
- оно запрещает использовать weak/mini verdict для blocking audit decisions.

Ожидаемый эффект:

Даже если invalid launch произошел, skill не позволит принять результат как review evidence.

### P3. Добавить audit-launch checklist в `SKILL.md`

В implementation stage checklist добавить literal gate:

```md
- [ ] Every blocking external audit launch declared model, reasoning effort, required skill, scope, and allowed-model verdict before spawning.
- [ ] No blocking audit verdict from a weak/mini model was accepted as review evidence.
```

В independent review execution model добавить short rule:

- required independent review must be launched with explicit model and reasoning when the runtime supports those fields;
- if model policy cannot be satisfied, step remains blocked unless operator explicitly approves degraded mode.

Ожидаемый эффект:

Агент получает visible self-check до любых closure claims.

### P4. Нормализовать logging для audit launch attempts

В `workflow-stage-logging.md` добавить machine-readable fields для review/audit events:

- `audit_launch_gate_checked: true | false`
- `audit_class`
- `required_skill`
- `model`
- `reasoning_effort`
- `allowed_by_policy: true | false`
- `invalidated: true | false`
- `invalidated_reason`

Для invalid попыток лог должен фиксировать:

- что attempt не является review evidence;
- была ли нужна operator intervention;
- какой rerun заменил invalid attempt.

Ожидаемый эффект:

Ретроанализ сможет отличить настоящий audit reround от invalid orchestration attempt без ручного чтения narrative text.

### P5. Добавить preflight prompt / spawn template

В `implementation-audit-policy.md` добавить короткий reusable preflight template:

```md
Audit launch gate:
- audit_class:
- required_skill:
- scope:
- model:
- reasoning_effort:
- blocking: true | false
- allowed_by_policy: true | false
- disallowed_reason:
```

Правило:

- gate должен быть заполнен до `spawn_agent`;
- для blocking audits `allowed_by_policy` должен быть `true`;
- `disallowed_reason` должен быть пустым для запуска и заполненным для остановки.

Ожидаемый эффект:

У агента появится простой механический чек перед risky tool call.

## Что не должно меняться

- Не переносить обязанности `code-reviewer`, `security-reviewer` или `spec-conformance-reviewer` в `dossier-engineer`.
- Не запрещать lightweight non-blocking helper agents, когда operator явно разрешил их и результат не используется как blocking audit verdict.
- Не требовать отдельного durable artifact для каждого failed spawn attempt; stage log telemetry достаточно.
- Не делать model policy repo-specific hardcode с конкретным списком всех будущих моделей. Skill должен описывать классы и fail-closed поведение, а repo/operator policy может уточнять allowed list.
- Не считать self-review заменой external review, если model gate не может быть satisfied.

## Acceptance criteria

- `implementation-audit-policy.md` содержит отдельный раздел `Audit launch gate`.
- Blocking audits require explicit model, reasoning effort, required skill, scope, and allowed-model verdict before spawn.
- Policy explicitly says weak/mini model verdicts cannot satisfy blocking audit requirements.
- Policy defines invalidated audit attempts as telemetry/process-miss evidence, not review evidence.
- `SKILL.md` implementation checklist includes model/reasoning/allowed-model launch checks.
- `SKILL.md` independent review model says unmet model policy blocks the step unless operator explicitly approves degraded mode.
- `workflow-stage-logging.md` includes normalized fields for audit launch attempts: model, reasoning, allowed_by_policy, invalidated, invalidated_reason.
- Guidance preserves proportionality for non-blocking helper agents and prose-only changes.
- Docs-contract tests protect the new audit-launch gate and weak/mini invalidation rules.

## Preferred implementation order

1. Обновить `references/implementation-audit-policy.md` разделом `Audit launch gate`.
2. Обновить `SKILL.md` independent review model и implementation stage exit checklist.
3. Обновить `references/workflow-stage-implementation.md`, если detailed stage steps должны явно выполнить gate перед audit stack.
4. Обновить `references/workflow-stage-logging.md` normalized telemetry fields.
5. Обновить docs-contract tests.
6. Провести narrow spec/process review измененной активной поверхности.
