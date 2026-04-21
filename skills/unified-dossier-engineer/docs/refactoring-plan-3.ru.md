# План восстановления обязательной dossier audit policy

## Назначение

Этот план реализует [issue про деградацию implementation review policy](issues/improvement-proposal-20260422-1.md).

Цель:

- вернуть в active surface однозначную dossier-stage audit policy;
- восстановить обязательный blocking audit stack для кодового implementation scope;
- восстановить mandatory external review baseline для всех mutating dossier stages;
- убрать возможность трактовать self-review или частичный audit bundle как достаточный;
- не размыть границу между audit classes и helper persistence commands.

## Подтвержденная проблема

В текущем `unified-dossier-engineer` сохранилось только общее требование:

- `independent review in fail-closed mode`

Но active surface больше не фиксирует в явном виде:

- mandatory external review baseline для `feature-intake`, `spec-compact`, `plan-slice`, `implementation`, `change-proposal`;
- обязательный audit order `spec-conformance-reviewer -> code-reviewer -> security-reviewer`;
- обязательность `code-reviewer` и `security-reviewer` для code-bearing implementation scope;
- запрет на self-review как substitute for required external audits;
- early security seam checkpoint;
- launch policy для blocking audits;
- точную узкую роль `review-artifact`.

Это regression относительно последнего shipped `dossier-engineer`.

## Фиксированные решения

- Для каждого mutating dossier stage обязателен хотя бы один external independent audit.
- Для `feature-intake`, `spec-compact`, `plan-slice`, `change-proposal` baseline required audit class — `spec-conformance-reviewer`.
- `spec-conformance-reviewer`, `code-reviewer`, `security-reviewer` — это три audit classes implementation policy.
- External independence — обязательное свойство каждого required audit, а не “четвертый вид review”.
- Для любого code-bearing implementation scope обязательны оба:
  - `code-reviewer`
  - `security-reviewer`
- Self-review не может засчитываться ни как один required audit.
- `review-artifact` не performs review; он materialize-ит already obtained durable audit evidence/result.
- Blocking audits запускаются через external spawned agents с `fork_context: false` по умолчанию.
- Weak/mini model не может закрывать blocking audit.
- При редактировании prose/contract surface этого skill-а разрешено вносить только изменения, прямо входящие в scope данного плана.
- Запрещено попутно улучшать, переписывать, дополнять или “подчищать” другие части skill-а, если эти правки не были явно запланированы в этом плане.

## Package 1. Восстановить active audit policy reference

### Цель

Вернуть в merged skill:

- один first-class active reference `references/audit-policy.md`, который покрывает:
  - mutating-stage review baseline;
  - stronger implementation stack как отдельный section того же policy document.

### Что входит

- создать новый canonical active reference `references/audit-policy.md`
- добавить новый reference в `skill.yaml.references`
- добавить новый reference в `skill.yaml.surfaces.active.requiredReferences`
- регенерировать emitted `SKILL.md` и прогнать compiler parity
- зафиксировать в нем:
  - mandatory external review baseline for all mutating dossier stages
  - stage-to-audit-class mapping for non-code stages
  - три mandatory audit classes
  - mandatory audit order
  - external independence as a property of each required audit
  - self-review prohibition
  - weak/mini model prohibition for blocking audits
  - `fork_context: false` default
  - read-only reviewer rule
  - invalidation on repo mutation by reviewer
  - review freshness rules
  - early security seam checkpoint
- описать binary rule:
  - code-bearing scope -> `code-reviewer` + `security-reviewer` mandatory
  - genuinely non-code scope -> those two are not required by default

### Acceptance

- merged skill снова имеет один canonical active audit policy reference, который покрывает и stage-wide baseline, и stronger implementation policy
- new policy reference реально promoted into active surface через `skill.yaml`, а не существует только как prose рядом
- policy не размыта между historical docs, issue text и общими closure rules
- policy не оставляет места для трактовки “independent review” как vague single requirement

## Package 2. Привязать policy к active workflow surface

### Цель

Сделать implementation audit policy не скрытым приложением, а частью активной workflow semantics.

### Что входит

- обновить `references/delivery-workflow-layer.md`
- обновить `references/commandized-stage-control.md`
- обновить `references/runtime-and-command-boundary.md`
- обновить `references/telemetry-and-closure.md`
- обновить `SKILL.md`
- явно зафиксировать:
  - every mutating dossier stage requires required external review before truthful closure
  - `feature-intake`, `spec-compact`, `plan-slice`, `change-proposal` use the baseline stage audit policy
  - implementation close-out требует mandatory audit stack
  - `review-artifact` не заменяет audits
  - `dossier-step-close` не truthful without required audit bundle
  - self-review не может закрыть required external review obligation
  - stage-controller / helper boundary и runtime boundary согласованы с required audit bundle semantics

### Acceptance

- agent, читающий только active surface, получает один однозначный вывод:
  - для любого mutating dossier stage self-review недостаточен
  - для `feature-intake`, `spec-compact`, `plan-slice`, `change-proposal` required external review обязателен
  - при кодовом implementation scope обязательны `spec-conformance-reviewer`, `code-reviewer`, `security-reviewer`
  - все required audits внешние
- нигде в active refs не остается двусмысленности между audit class и persistence helper
- `commandized-stage-control` и `runtime-and-command-boundary` не оставляют старую single-review interpretation

## Package 3. Перепроектировать runtime/schema contract для review bundle

### Цель

Сделать mandatory audit bundle first-class частью shipped runtime/closure contract, а не doc-only policy.

### Что входит

- спроектировать explicit review-bundle contract:
  - stage
  - `audit_class`
  - reviewer provenance / identity
  - freshness / invalidation state
  - degraded-mode marker
  - security-trigger reason where applicable
- определить, как `review-artifact` materialize-ит durable evidence/result для каждого required audit
- определить, как `dossier-step-close` проверяет:
  - mandatory single audit for non-code mutating stages
  - mandatory audit bundle for code-bearing implementation
- определить, как closure truth зависит от required-vs-executed audit classes
- определить migration from current single-review runtime semantics to required audit-bundle semantics inside canonical runtime

### Acceptance

- shipped runtime contract больше не структурно single-review for mutating stages
- `review-artifact` и `dossier-step-close` поддерживают required audit bundle semantics
- closure truth больше нельзя получить:
  - без required external review for non-code mutating stages
  - через один generic review artifact, если policy требует implementation bundle

## Package 4. Выровнять utility-spec и shipped command semantics

### Цель

Убрать из maintainer-facing/runtime-facing surface все wording gaps, из-за которых агент может принять `review-artifact` за сам review stack.

### Что входит

- обновить `docs/utility-spec.ru.md`
- обновить help wording и runtime/help boundary docs в обязательном порядке
- обновить `review-artifact` command docs in generated `SKILL.md`
- зафиксировать:
  - `review-artifact` persists already obtained audit evidence/result
  - `review-artifact` не является audit class
  - `review-artifact` не отменяет mandatory spawned external audits

### Acceptance

- utility spec и active refs одинаково описывают роль `review-artifact`
- operator/agent-facing help surface не создает впечатления, что review stack сводится к `review-artifact`
- runtime/help/tests parity сохраняется

## Package 5. Восстановить observability review policy в telemetry/log contract

### Цель

Сделать обязательный audit stack видимым для operator и retrospective layer.

### Что входит

- обновить active telemetry/logging refs так, чтобы evidence для всех mutating dossier stages включала:
  - mutating dossier stage required review class
  - mutating dossier stage executed review class
  - reviewer skills
  - reviewer agent identity / provenance
  - freshness invalidation evidence
  - mutating dossier stage review pending/blocked signal
- отдельно для `implementation` включить дополнительные fields:
  - required audit classes
  - фактически запущенные audit classes
  - required/triggered security review flag
  - degraded mode flag
  - pending/blocked required external audits
- определить persisted schema для этих полей в review artifacts / logs / lifecycle layer
- обновить `lifecycle-refresh` aggregation contract так, чтобы bundle observability считалась mechanically

### Acceptance

- stage logs и/или review telemetry умеют показать, какой required external review обязателен для каждого mutating stage и что реально было выполнено
- stage logs и/или review telemetry умеют показать reviewer skills, reviewer provenance и freshness invalidation для каждого mutating stage
- implementation stage logs и/или review telemetry умеют показать, что именно из audit bundle было обязательным и что реально было выполнено
- retrospective не вынужден догадываться по narrative prose, запускался ли `security-reviewer`
- operator может увидеть missing review coverage из durable artifacts
- artifact model реально способен нести required-vs-executed audit semantics, а не только generic review timestamps

## Package 6. Закрыть policy tests и docs/runtime parity

### Цель

Защитить новую policy от повторной деградации.

### Что входит

- добавить docs-contract coverage для:
  - `skill.yaml`
  - `references/audit-policy.md`
  - `references/delivery-workflow-layer.md`
  - `references/commandized-stage-control.md`
  - `references/runtime-and-command-boundary.md`
  - `references/telemetry-and-closure.md`
  - `SKILL.md`
  - `docs/utility-spec.ru.md`
- добавить CLI/help tests
- добавить runtime closure tests на stage-wide required review baseline:
  - `feature-intake`
  - `spec-compact`
  - `plan-slice`
  - `change-proposal`
  - `implementation` in the non-code / single-audit baseline case
  - missing required external review
  - stale/invalidated required external review
  - self-review-substitute rejection
- добавить runtime closure tests на required implementation audit bundle
- проверить emitted `SKILL.md`
- обновить `docs/README.md`
- записать implementation log после выполнения

### Acceptance

- docs-contract падает, если:
  - исчезает mandatory external review baseline для mutating dossier stages
  - исчезает mandatory audit order
  - ослабляется `code-reviewer` / `security-reviewer` requirement for code-bearing scope
  - исчезает self-review prohibition
  - `review-artifact` снова начинает выглядеть как review stack substitute
- docs-contract падает, если new policy reference перестает быть active required reference
- runtime tests падают, если non-code mutating stages снова могут truthfully close without their required external review baseline
- runtime tests падают, если closure semantics снова позволяют single generic review artifact вместо required implementation audit bundle
- generated `SKILL.md` и active refs не расходятся

## Порядок реализации

1. Package 1
2. Package 2
3. Package 3
4. Package 4
5. Package 5
6. Package 6

Причина:

- сначала фиксируется canonical policy;
- затем она связывается с active workflow;
- затем runtime/schema contract перестает быть structurally single-review;
- потом выравнивается maintainer/runtime wording;
- затем policy делается observable;
- и только после этого ставятся parity guards.

## Основные риски

### 1. Снова смешать audit classes и helper commands

Риск:

в wording можно снова превратить `review-artifact` в псевдо-review.

Сдерживание:

- в каждом слое явно разделять:
  - audit classes
  - helper persistence
  - closure truth

### 2. Оставить policy частично в old mental model, а частично в merged refs

Риск:

policy будет формально восстановлена, но не станет единственным active source of truth.

Сдерживание:

- создать одну canonical active reference;
- заставить остальные active refs ссылаться именно на нее.

### 3. Ослабить security review через wording loopholes

Риск:

мягкие слова вроде `may`, `typically`, `when appropriate` снова создадут discretionary behavior.

Сдерживание:

- policy должна быть binary и explicit;
- для code-bearing scope использовать only mandatory wording.

## Validation

План считается выполненным, когда одновременно верны все условия:

- active merged skill снова имеет canonical audit policy reference;
- active merged skill снова имеет canonical dossier-stage review baseline;
- mandatory audit order зафиксирован явно;
- mandatory external review baseline зафиксирован для всех mutating dossier stages;
- для code-bearing implementation scope `code-reviewer` и `security-reviewer` обязательны без soft exceptions;
- self-review explicitly forbidden as substitute for required external audits;
- external independence закреплена как свойство required audits, а не как отдельный fictitious review type;
- `review-artifact` узко описан как persistence helper;
- shipped runtime contract поддерживает required audit bundle, а не single generic review;
- dossier-stage telemetry/log contract делает required external review observable across every mutating stage;
- implementation telemetry/log contract делает audit bundle observable;
- docs/runtime/tests parity защищает policy от повторной деградации.
