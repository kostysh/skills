# Refactoring plan 1: `dossier-engineer` under backlog-driven process

## Назначение

Этот документ задаёт stage-1 refactoring plan для `dossier-engineer`.

План строится не от legacy workflow, а от уже принятой process model:

- `backlog-engineer` — canonical backlog extraction layer;
- `dossier-engineer` — downstream dossier workflow layer;
- дублирования backlog-discovery функций быть не должно;
- оба skill-а работают в одном согласованном процессе, но сохраняют собственные артефакты.

## Источники истины для плана

- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- [backlog-harmonization-prep.ru.md](backlog-harmonization-prep.ru.md)
- [dossier-process-gap-analysis.ru.md](dossier-process-gap-analysis.ru.md)
- [backlog-process-gap-analysis.ru.md](backlog-process-gap-analysis.ru.md)

## Фиксированные решения

Эти решения уже приняты и в рамках этого плана не переоткрываются:

1. `backlog-engineer` остаётся единственным skill-ом, который materialize-ит backlog graph из architecture / ADR / technical decisions.
2. `dossier-engineer` больше не должен быть самостоятельным backlog-discovery skill-ом.
3. `candidate backlog` и `feature-candidates.md` должны быть удалены из новой версии `dossier-engineer` как process surface.
4. `feature-discovery` удаляется полностью и не остаётся ни в каком виде.
5. `feature-intake` должен стартовать от selected backlog work, а не от `CF-*`.
6. `next-step` в `dossier-engineer` должен стать strictly dossier-local.
7. После dossier-side shaping / planning / implementation backlog status должен актуализироваться через `backlog-engineer`.
8. Runtime coupling между двумя CLI не является задачей этого этапа.

## Цель stage 1

К концу stage 1 `dossier-engineer` должен:

- читатьcя как downstream workflow over selected backlog work;
- перестать обещать explicit backlog discovery как свою core функцию;
- перестать держать candidate backlog в skill-е как process surface вообще;
- перестать смешивать dossier-local `next-step` с backlog selection;
- получить новый workflow, state model, command semantics, runtime contract и test expectations, совместимые с backlog-driven process.

## Что не входит в stage 1

1. Прямое runtime чтение backlog-engineer artifacts из dossier CLI.
2. Shared artifact model между двумя utility.
3. Полная переработка `backlog-engineer`.
4. Полная унификация всех status enums между skill-ами.

Stage 1 должен закончиться на:

- чистом refactor `dossier-engineer`;
- явной process compatibility with `backlog-engineer`;
- ясном backlog-side checklist для stage 2.

## Target end state for `dossier-engineer`

После refactor expected picture должна быть такой:

- новый backlog создаётся только через `backlog-engineer`;
- selected work выбирается через backlog graph;
- `dossier-engineer` принимает selected work и ведёт её through intake -> spec -> plan -> implementation -> review -> closure;
- dossier artifacts не дублируют backlog graph;
- dossier-side discoveries возвращаются в backlog через explicit backlog actualization;
- в skill-е и utility больше нет `feature-discovery` и candidate-backlog surfaces;
- `next-step` отвечает только на dossier-local workflow question.

## Work packages

## Package 1. Textual refactor of the skill contract

### Goal

Полностью переписать текстовую часть `dossier-engineer` под backlog-driven process за один проход, без искусственной фазовости внутри docs.

### Files

- [../SKILL.md](../SKILL.md)
- [../references/WORKFLOW.md](../references/WORKFLOW.md)
- [../references/FEATURE_CANDIDATES_TEMPLATE.md](../references/FEATURE_CANDIDATES_TEMPLATE.md)
- [../references/REPO_AGENTS_TEMPLATE.md](../references/REPO_AGENTS_TEMPLATE.md)
- [README.md](README.md)
- [utility-architecture.md](utility-architecture.md)
- any examples/templates/docs that still reinforce candidate-first thinking

### Changes

#### A. Identity and top-level positioning

- переписать `description` и opening sections в `SKILL.md`;
- убрать wording уровня:
  - `explicit backlog discovery`
  - `candidate backlog` как любая допустимая process surface;
- зафиксировать:
  - backlog-driven intake
  - downstream-only role
  - отсутствие competing backlog model;
- привести `docs/README.md` и `utility-architecture.md` к тому же positioning.

#### B. Canonical workflow

- убрать canonical flow вида:
  - `feature-discovery -> candidate confirmed -> feature-intake`;
- ввести новый canonical flow:
  - selected backlog work -> `feature-intake` -> `spec-compact` -> `plan-slice` -> `implementation` -> verify/review/close;
- добавить explicit handoff from `backlog-engineer`;
- зафиксировать:
  - backlog selection precedes dossier workflow;
  - dossier workflow does not choose work from architecture on its own.

#### C. State model and status semantics

- вывести `candidate|confirmed|intaken|discarded` из core process model completely;
- оставить в центре только dossier/process states:
  - dossier maturity
  - coverage enforcement
  - review freshness
  - step closure
  - commit completeness;
- добавить explicit distinctions:
  - backlog `planned` vs dossier `planned`
  - backlog `implemented` vs dossier `done`
  - backlog `gaps` vs dossier-side blockers;
- ввести explicit backlog-status-actualization rules:
  - shaping/specification -> backlog `specified`
  - planning -> backlog `planned`
  - implementation/closure -> backlog `implemented`
  - new blockers/dependencies/context facts -> backlog update.

#### D. Command semantics at documentation level

- переопределить `feature-intake` как intake выбранной backlog work;
- переопределить `next-step` как dossier-local only;
- удалить `feature-discovery` из skill contract, docs, templates и quick paths completely;
- убрать candidate-driven behavior from normal command contract wording.

#### E. Removal of old candidate surfaces in docs/templates

- удалить `FEATURE_CANDIDATES_TEMPLATE.md` из новой версии skill-а;
- удалить candidate-backlog-first wording из repo templates;
- удалить examples/templates/docs, которые закрепляют old model;
- не оставлять legacy appendix, legacy quick path, или compatibility wording inside the new skill.

#### F. Stage-2 handoff note

- подготовить в close-out этого пакета чёткий backlog-side checklist для следующего шага harmonization.

### Acceptance

- top-level wording больше не обещает backlog extraction inside `dossier-engineer`;
- canonical workflow начинается от selected backlog work;
- state model больше не держит candidate state как core dimension;
- `feature-intake` больше не описывается как promotion from `CF-*`;
- `feature-discovery` больше не существует в новой версии skill-а;
- `next-step` больше не описывается как backlog-selection helper;
- dossier contract прямо требует returning to `backlog-engineer` after lifecycle-changing steps;
- candidate-backlog surfaces удалены из новой версии skill-а, а не оставлены как legacy;
- новый агент не получает candidate-first mental model ни из одного skill file;
- после завершения пакета есть явный backlog-side checklist for stage 2.

## Package 2. Utility/runtime refactor

### Goal

Привести CLI, utility spec, architecture doc и tests в полное соответствие с новым textual skill contract.

### Files

- [utility-spec.ru.md](utility-spec.ru.md)
- [utility-architecture.md](utility-architecture.md)
- `src/commands.ts`
- `src/core/workflow.ts`
- relevant helpers in `src/`
- relevant tests in `test/`

### Changes

#### A. Command contract rewrite

- убрать candidate-driven `next-step` logic;
- убрать candidate backlog from runtime contract entirely;
- переписать `feature-intake` contract in code;
- удалить `feature-discovery` command behavior;
- привести help semantics к новому command model.

#### B. Runtime behavior alignment

- сделать `next-step` dossier-local only;
- убрать backlog candidate selection from runtime path entirely;
- реализовать новый intake contract от selected backlog work;
- не добавлять runtime coupling с `backlog-engineer`, если это не требуется явно для current stage.

#### C. Spec and architecture sync

- обновить `utility-spec.ru.md` под новый workflow;
- обновить `utility-architecture.md`, чтобы workflow helpers и module roles не описывали старую candidate-driven модель.

#### D. Tests

- обновить CLI tests under the new workflow;
- удалить tests, которые нормализуют `feature-discovery -> candidate -> feature-intake` как canonical path;
- добавить tests на dossier-local `next-step` and new intake semantics.

### Acceptance

- runtime contract соответствует rewritten docs;
- `feature-intake` and `next-step` соответствуют новой модели, а `feature-discovery` удалён;
- tests encode backlog-driven process, not candidate-driven process;
- utility spec matches code after refactor.

## Recommended execution order

1. Package 1
2. Package 2

Причина такого порядка:

- сначала нужно целиком поменять skill contract и references;
- затем уже под этот новый contract переписывать utility/runtime and tests;
- это убирает искусственную фазовость и не заставляет поддерживать legacy-model внутри промежуточных пакетов.

## Acceptance gates for the whole stage

Stage 1 нельзя считать завершённым, пока одновременно не выполнено всё:

1. `dossier-engineer` больше не выглядит как backlog-discovery skill.
2. В skill contract нет candidate backlog как process surface вообще.
3. `feature-intake` стартует от selected backlog work.
4. `next-step` strictly dossier-local.
5. После shaping/planning/implementation dossier contract требует backlog actualization via `backlog-engineer`.
6. Candidate-state model больше не существует в новой process model skill-а.
7. `feature-discovery` удалён из skill contract, runtime contract, and tests.
8. Runtime/spec/tests соответствуют новому workflow.

## Review strategy

После подготовки реальных изменений stage 1 review надо вести так:

1. Сначала spec/process conformance against:
   - [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
   - [dossier-process-gap-analysis.ru.md](dossier-process-gap-analysis.ru.md)
2. Затем code review and security review for runtime changes.
3. Затем отдельная check pass на docs/examples/templates drift.

## Что этот план даёт на следующем шаге

После этого плана можно:

- либо сразу строить detailed execution plan;
- либо брать packages по порядку и рефакторить `dossier-engineer` без повторного открытия базовой process discussion.
