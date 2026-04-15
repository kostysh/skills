# Предложение по улучшению 20260415-2: adversarial proof obligations для `spec-compact` и `plan-slice`

## Контекст

Поводом стала downstream-реализация feature dossier, где `spec-compact` и `plan-slice` в целом дали рабочий план, но не заставили заранее назвать несколько критичных adversarial proofs.

Поздний внешний review выявил два класса пробелов:

- idempotency была учтена как категория, но не была явно разделена на sequential replay, concurrent same-payload replay и concurrent conflicting replay;
- shutdown/admission semantics были учтены как категория, но план не заставил заранее доказать race window между уже начатой admission write и shutdown evidence snapshot.

Это не частная проблема одной фичи. Такой же разрыв может появиться в любом проекте, где есть side effects, durable state, lifecycle transitions, retries, shutdown/startup, queues/jobs, audit evidence или trust boundaries.

Затронутые поверхности `dossier-engineer`:

- `Workflow stage: spec-compact`
- `Workflow stage: plan-slice`
- `references/spec-and-plan-risk-patterns.md`
- `references/workflow-stage-spec-compact.md`
- `references/workflow-stage-plan-slice.md`
- stage exit checklists в `SKILL.md`

## Наблюдаемая проблема

Текущая методика уже содержит правильные риск-слова:

- duplicate/retry behavior;
- concurrency or mutation ordering;
- stale-state handling;
- failure modes;
- risk-first slices;
- verification artifacts.

Но эти правила сейчас работают как broad reminders. Агент может выполнить их формально, написав в плане что-то вроде:

- `idempotency tests`;
- `shutdown tests`;
- `boundary tests`;
- `failure handling tests`.

Такая формулировка не гарантирует, что план действительно содержит proof для опасного окна. В результате риск назван, но не превращен в конкретное доказательство.

## Корень проблемы

Методика недостаточно жестко связывает три уровня:

1. риск или edge case в спецификации;
2. конкретную adversarial semantics для этого риска;
3. named proof obligation в slice verification plan.

Сейчас `spec-compact` может остановиться на уровне "эта зона рискованная", а `plan-slice` может остановиться на уровне "будут tests". Между ними нет обязательной risk-to-proof матрицы.

## Предлагаемое изменение

### P1. Добавить `Adversarial semantics` trigger в `spec-compact`

В `workflow-stage-spec-compact.md` и `spec-and-plan-risk-patterns.md` добавить правило:

Если feature затрагивает side effects, durable state, lifecycle transitions, idempotency, retries, shutdown/startup, queues/jobs, transactions, audit evidence, canonical writer/read-only consumer boundary или trust boundary, `spec-compact` должен классифицировать следующие cases как specified или `N/A`:

- sequential success;
- invalid input;
- dependency failure / timeout;
- duplicate or replay after completion;
- concurrent duplicate or racing request;
- concurrent conflicting request;
- partial side effect / crash / restart;
- stale read / stale snapshot / late completion.

Для non-`N/A` cases спецификация должна назвать:

- participating operation(s);
- race window или ordering boundary;
- expected winner/loser result, если есть конкуренция;
- durable invariant;
- externally observable result или error;
- required proof type.

Ожидаемый эффект:

Агент перестанет считать "idempotency mentioned" достаточной спецификацией. Sequential replay и concurrent replay станут разными обязательствами.

### P2. Добавить mandatory `Risk-to-proof matrix` в `plan-slice`

В `workflow-stage-plan-slice.md` добавить правило:

Перед закрытием planning все non-`N/A` adversarial semantics из spec должны быть mapped в named proof obligation.

Минимальная форма:

```md
| Risk / edge case | Spec source | Required proof | Slice | Verification artifact | N/A rationale |
```

Правило для достаточности:

- generic label вроде `idempotency tests` или `shutdown tests` недостаточен;
- proof должен назвать competing operation(s), expected result и durable invariant;
- если proof сознательно не нужен, это должно быть explicit `N/A rationale`, а не молчаливый пропуск.

Примеры достаточных proof obligations:

- concurrent same-key same-payload lifecycle requests converge to one durable record;
- concurrent same-key different-payload lifecycle requests return one success and one conflict without duplicate records;
- shutdown waits for already-started admission write before emitting evidence snapshot;
- stale snapshot cannot report completion before in-flight canonical writer state is durable.

Ожидаемый эффект:

План будет проверять не только наличие slices, но и покрытие опасных режимов конкретными доказательствами.

### P3. Добавить `proof specificity smell pass` для `plan-slice`

В stage exit checklist для `plan-slice` добавить отдельный smell pass, который флагует слишком общие verification labels.

Формулировки, требующие уточнения:

- `idempotency tests`;
- `race tests`;
- `shutdown tests`;
- `boundary tests`;
- `failure tests`;
- `integration tests`;
- `coverage for edge cases`;
- `adversarial tests`.

Такие labels допустимы только если рядом указан concrete proof: operation pair, race window, expected observable result и durable invariant.

Ожидаемый эффект:

План не сможет выглядеть полным за счет абстрактных test categories.

### P4. Поднять часть implementation adversarial checklist в planning trigger

В `SKILL.md` уже есть implementation checklist для side-effecting code:

- timeout budget;
- late completion;
- abort/cancellation;
- partial side effects;
- idempotency / duplicate delivery;
- logging/audit append failures;
- crash/restart boundaries.

Нужно использовать этот список раньше:

- в `spec-compact` как trigger для adversarial semantics;
- в `plan-slice` как source для proof obligations.

Предлагаемый checklist для `plan-slice`:

```md
- [ ] For side-effecting or stateful behavior, the implementation adversarial checklist
      was translated into spec-level semantics or explicit N/A entries before implementation.
- [ ] Every non-N/A adversarial item has a named proof obligation in a slice.
```

Ожидаемый эффект:

Implementation-аудит перестанет быть первой точкой, где выявляются missing adversarial cases.

### P5. Добавить узкий pre-implementation audit prompt для high-risk plans

Для features с non-empty adversarial semantics добавить рекомендацию перед implementation запускать narrow spec/process review с фокусом:

```md
Find missing adversarial proof obligations in this spec and slicing plan.
Focus on concurrency, stale state, partial side effects, retry/replay, shutdown/startup,
ownership boundaries, durable evidence, and proof specificity.
```

Важно:

- review не заменяет risk-to-proof matrix;
- review не должен расширять scope реализации;
- review должен проверять missing proofs, а не переписывать план;
- audit-gate должен выполняться на модели, подходящей для process/spec audit, без weak/mini model для blocking audit decisions.

Ожидаемый эффект:

Дорогие spec gaps будут чаще выявляться до первого mutating implementation edit.

## Что не должно меняться

- Не превращать каждый простой prose-only dossier update в heavyweight planning exercise.
- Не требовать concurrency matrix для features без side effects, state transitions или boundary behavior.
- Не переносить обязанности `code-reviewer`, `security-reviewer` или `spec-conformance-reviewer` в `dossier-engineer`.
- Не требовать от `spec-compact` проектировать конкретную implementation architecture, если это implementation freedom.
- Не считать наличие внешнего review заменой явной risk-to-proof матрицы.
- Не делать таблицы обязательной формой, если тот же mapping выражен компактным списком с теми же полями.

## Acceptance criteria

- `spec-and-plan-risk-patterns.md` содержит отдельный раздел про adversarial proof obligations.
- `workflow-stage-spec-compact.md` требует классифицировать relevant adversarial cases как specified или `N/A` для side-effecting/stateful/boundary features.
- `workflow-stage-plan-slice.md` требует risk-to-proof mapping для всех non-`N/A` adversarial semantics.
- `SKILL.md` stage exit checklist для `spec-compact` проверяет, что high-risk semantics не остались broad labels.
- `SKILL.md` stage exit checklist для `plan-slice` проверяет, что каждый high-risk edge case имеет named proof obligation или explicit `N/A rationale`.
- Planning smell pass флагует generic verification labels без operation pair, race window, expected result и invariant.
- Guidance explicitly distinguishes sequential retry/replay from concurrent retry/replay when concurrency is possible.
- Guidance explicitly distinguishes closed admission from already-started in-flight operation handling when shutdown/startup/order semantics are specified.
- Pre-implementation audit guidance for high-risk plans includes a narrow missing-proof-obligations prompt.

## Preferred implementation order

1. Обновить `references/spec-and-plan-risk-patterns.md` разделом `Adversarial proof obligations`.
2. Обновить `references/workflow-stage-spec-compact.md` trigger и stage steps.
3. Обновить `references/workflow-stage-plan-slice.md` risk-to-proof mapping и proof specificity smell pass.
4. Обновить stage exit checklists в `SKILL.md`.
5. При наличии docs-contract tests обновить ожидания по ссылкам/checklists.
6. Провести narrow spec/process conformance review на измененных skill/process docs.
