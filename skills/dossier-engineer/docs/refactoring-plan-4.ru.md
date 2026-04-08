# Refactoring plan 4: `backlog-engineer` cross-skill harmonization

## Назначение

Этот документ задаёт stage-2 refactoring plan для `backlog-engineer`.

План строится от уже принятой кросс-скил модели:

- `backlog-engineer` — единственный canonical backlog extraction layer;
- `dossier-engineer` — downstream dossier workflow layer;
- оба skill-а работают в одном согласованном процессе;
- дублирования backlog-discovery и task-selection функций между skill-ами быть не должно.

## Источники истины для плана

- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- [backlog-process-gap-analysis.ru.md](backlog-process-gap-analysis.ru.md)
- [dossier-process-gap-analysis.ru.md](dossier-process-gap-analysis.ru.md)
- текущий `backlog-engineer` skill contract and references

## Фиксированные решения

Эти решения уже приняты и в рамках этого плана не переоткрываются:

1. `backlog-engineer` остаётся единственным skill-ом, который materialize-ит backlog graph из architecture / ADR / technical decisions.
2. `dossier-engineer` не должен конкурировать с `backlog-engineer` за extraction из архитектуры и выбор backlog work.
3. Кросс-скил harmonization не вводит shared runtime dependency между двумя CLI.
4. `backlog-engineer` не должен читать dossier prose и не должен зависеть от dossier body как от runtime input.
5. Никакие новые backlog commands, dossier commands, shared artifacts, или coupled state stores не добавляются как часть этого stage.
6. Переход не растягивается в долгую transitional модель: цель — прямой refactor к согласованному процессу, а не coexistence старой и новой схем.

## Цель stage 2

К концу stage 2 `backlog-engineer` должен:

- явно объяснять handoff от backlog selection к dossier workflow;
- явно требовать backlog status actualization после dossier-side shaping / planning / implementation;
- буквально разводить backlog `next` и dossier-local `next-step`;
- признавать dossier artifacts как supporting evidence для backlog sync, не подменяя ими architecture / ADR;
- иметь references/examples/operator workflows, которые показывают реальный cross-skill process, а не isolated backlog-only usage.

## Что не входит в stage 2

1. Новые команды для прямого orchestration `dossier-engineer` из `backlog-engineer`.
2. Shared artifact format между `.backlog/` и `.dossier/`.
3. Runtime parsing dossier markdown body.
4. Полная унификация всех status enums между двумя skill-ами.
5. Новая backlog model или пересмотр core packet/patch architecture.

## Open decision to resolve during implementation

Эта точка пока не закрыта и должна быть явно решена во время имплементации, прежде чем фиксировать final handoff contract:

1. Входит ли `attention` в минимальный backlog -> dossier handoff как durable signal, или он остаётся только backlog-side read model и не копируется в dossier handoff?

Пока решения нет, все остальные изменения stage 2 можно готовить, но exact handoff wording должен оставаться совместимым с будущим ответом на этот вопрос.

## Target end state for `backlog-engineer`

После refactor expected picture должна быть такой:

- `backlog-engineer` creates, refreshes, patches, and reads the backlog graph;
- `backlog-engineer` chooses the next work item and determines whether that work is ready to move;
- после выбора work агент переходит в `dossier-engineer` для local workflow (`feature-intake -> spec-compact -> plan-slice -> implementation -> dossier-verify -> review-artifact -> dossier-step-close`);
- после dossier-side lifecycle changes агент возвращается в `backlog-engineer` и явно actualize-ит backlog truth;
- backlog references and examples показывают этот handoff и return path буквально, без скрытых ментальных допущений.

## Package 1. Textual/process contract

### Goal

Полностью переписать text/reference contract `backlog-engineer` под согласованный cross-skill process за один проход, без искусственной фазовости внутри docs.

### Scope

- [../SKILL.md](../../backlog-engineer/SKILL.md)
- [../../backlog-engineer/references/operator-workflows.md](../../backlog-engineer/references/operator-workflows.md)
- [../../backlog-engineer/references/command-reference.md](../../backlog-engineer/references/command-reference.md)
- [../../backlog-engineer/references/examples-and-templates.md](../../backlog-engineer/references/examples-and-templates.md)
- [../../backlog-engineer/references/cli-contract.md](../../backlog-engineer/references/cli-contract.md)
- [../../backlog-engineer/references/first-backlog-walkthrough.md](../../backlog-engineer/references/first-backlog-walkthrough.md)
- [../../backlog-engineer/references/document-to-packet-workflow.md](../../backlog-engineer/references/document-to-packet-workflow.md) where needed for cross-skill consistency

### Changes

#### A. Explicit interop positioning

- добавить в `SKILL.md` отдельный interop block:
  - `backlog-engineer` selects work and determines readiness;
  - `dossier-engineer` owns the local lifecycle of the selected work;
  - backlog selection and backlog readiness always precede dossier-local `next-step`.
- буквально зафиксировать, что dossier workflow is the normal downstream continuation for selected backlog work.

#### B. Backlog -> dossier handoff contract

- описать minimal backlog -> dossier handoff as explicit process step;
- зафиксировать mandatory handoff dimensions:
  - selected backlog item key;
  - current backlog delivery state;
  - relevant source traceability;
  - known blockers / dependencies;
  - optional `attention`, depending on the unresolved decision above.
- явно развести:
  - `anchor source` / architecture truth;
  - dossier handoff as downstream working context.

#### C. Backlog actualization after dossier work

- в `SKILL.md` добавить буквальные cross-skill rules:
  - shaping/specification evidence -> actualize to `specified`;
  - planning evidence -> actualize to `planned`;
  - implementation + closure evidence -> actualize to `implemented`;
  - new blockers / dependencies / context facts / cross-cutting decisions -> patch backlog state before continuing.
- отдельно записать:
  - dossier `done` не равен backlog `implemented`;
  - dossier `planned` не равен backlog `planned`;
  - одинаковые слова в двух skill-ах не означают одинаковый state layer.

#### D. Boundary between backlog `next` and dossier `next-step`

- в `SKILL.md` и `cli-contract.md` жёстко развести:
  - backlog `queue` / `status` / `gaps` / `attention` / `ready_for_next_step`
  - dossier-local `next-step`
- добавить literal rule:
  - backlog layer answers whether the work can move;
  - dossier layer answers how the selected work moves locally.
- убрать wording, который позволяет воспринимать dossier `next-step` как replacement for backlog `queue`.

#### E. Operator workflows

- в `operator-workflows.md` добавить canonical workflows:
  - choose next backlog work -> handoff to `dossier-engineer`;
  - after `spec-compact` -> return and actualize backlog to `specified`;
  - after `plan-slice` -> return and actualize backlog to `planned`;
  - after implementation + closure -> return and actualize backlog to `implemented`;
  - dossier discovered blocker/dependency/context fact -> patch backlog before resuming dossier work.
- в `first-backlog-walkthrough.md` добавить one-line continuation note:
  - after selected work is chosen, continue in `dossier-engineer`, not in backlog authoring mode.

#### F. Command interpretation and examples

- в `command-reference.md` добавить cross-skill interpretation notes for:
  - `status`
  - `queue`
  - `gaps`
  - `attention`
  - `patch-item`
  - `refresh`
- в `examples-and-templates.md` добавить dossier-driven patch examples:
  - actualize to `specified`
  - actualize to `planned`
  - actualize to `implemented`
  - add blockers/dependencies/context discovered in dossier work
- в `cli-contract.md` явно зафиксировать, что dossier artifacts may be supporting evidence for backlog sync, but they do not replace architecture/ADR as canonical upstream truth.

### Acceptance

- `backlog-engineer` text contract больше не выглядит backlog-only in isolation; dossier handoff visible and literal;
- backlog `next` vs dossier `next-step` boundary сформулирована без двусмысленности;
- backlog status actualization after dossier steps записана явно и consistently;
- examples and operator workflows показывают return-to-backlog path after dossier steps;
- нигде не появляется новая shared runtime model, coupled CLI orchestration, или duplicated backlog-discovery wording;
- `git diff --check -- skills/backlog-engineer` passes.

## Package 2. Normative/runtime/test alignment

### Goal

Выровнять backlog-side normative docs, examples, and any affected runtime/help/test expectations с новым cross-skill contract, не меняя core backlog model без необходимости.

### Scope

- [../../backlog-engineer/docs/process-cli.ru.md](../../backlog-engineer/docs/process-cli.ru.md)
- [../../backlog-engineer/docs/utility-spec.ru.md](../../backlog-engineer/docs/utility-spec.ru.md)
- [../../backlog-engineer/docs/README.md](../../backlog-engineer/docs/README.md)
- relevant `backlog-engineer` runtime/help/tests only if the textual refactor reveals real shipped-contract drift
- built runtime artifact under `skills/backlog-engineer/scripts/` only if help/output text changes require rebuild

### Changes

#### A. Process/spec sync

- синхронизировать `process-cli.ru.md` и `utility-spec.ru.md` с interop rules:
  - explicit backlog -> dossier handoff;
  - explicit status actualization after dossier steps;
  - supporting-evidence role of dossier artifacts;
  - explicit backlog `next` vs dossier `next-step` boundary.
- if `attention` handoff decision is resolved during implementation, reflect it in both normative docs.

#### B. Runtime/help alignment only where needed

- проверить, нет ли shipped help/output drift, который contradicts the new interop contract;
- если drift есть, править only the affected help/output wording;
- не добавлять new commands, combined commands, or shared runtime orchestration.

#### C. Examples/tests/docs guards

- update backlog-side docs index if new cross-skill material appears;
- add/update narrow docs-contract or CLI tests only where they protect the new cross-skill contract from drift;
- if help/output wording changes, update corresponding tests.

### Acceptance

- backlog-side normative docs, references, and any affected runtime/help all describe the same cross-skill contract;
- no new command surface or shared artifact model is introduced;
- dossier artifacts are treated only as supporting evidence, not as replacement canonical truth;
- if runtime/help changed:
  - `pnpm --dir skills/backlog-engineer run format` — PASS
  - `pnpm --dir skills/backlog-engineer run lint` — PASS
  - `pnpm --dir skills/backlog-engineer run test` — PASS
- `git diff --check -- skills/backlog-engineer` passes.

## Review order

### Package 1

1. spec/process conformance review against:
   - [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
   - [backlog-process-gap-analysis.ru.md](backlog-process-gap-analysis.ru.md)
   - this plan

Do not start runtime-focused reviews for Package 1 unless the package unexpectedly changes executable code.

### Package 2

1. spec/process conformance review
2. if runtime/help/test behavior changed and spec/process review is PASS:
   - code review
   - security review

Important:

- only run code/security review after spec/process conformance reaches PASS;
- if later fixes only adjust tests, typing, or non-normative internals without changing process/spec alignment, do not rerun spec review;
- once a review agent returns PASS and is no longer needed, close it immediately.

## Definition of done

Stage 2 is complete only when all of the following are true:

1. `backlog-engineer` explicitly participates in the agreed cross-skill process instead of describing itself as an isolated planning utility.
2. Handoff from backlog selection to dossier workflow is explicit in skill docs and operator workflows.
3. Return-to-backlog actualization after dossier-side shaping / planning / implementation is explicit and example-backed.
4. Backlog `next` vs dossier `next-step` boundary is stated literally and consistently across docs/spec/help.
5. Dossier artifacts are acknowledged as supporting backlog-sync evidence without introducing coupled runtime behavior.
6. Applicable acceptance checks and reviews for both packages are green.
