# Refactoring plan 2: `dossier-engineer` UX corrective pass

## Назначение

Этот документ фиксирует короткий corrective pass после UX-аудита нового backlog-driven `dossier-engineer`.

Нормативный источник истины для этого pass:

- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)

Аудитные источники:

- operator UX audit
- agent UX audit

## Цель

Устранить дефекты, которые делают новый skill/operator contract неустойчивым на первом реальном использовании:

1. убрать смешение workflow stages и реально доступных CLI commands;
2. сделать backlog -> dossier handoff явным и durable;
3. встроить backlog re-actualization в step-local contracts;
4. убрать неоднозначность `sync-index` vs `index-refresh`;
5. сделать `next-step` безопасным для multi-dossier repo.

## Fixed decisions

Эти решения не переоткрываются в рамках данного pass:

1. Workflow stages (`spec-compact`, `plan-slice`, `implementation`, `adr-log`, `dependency-check`, `change-proposal`, repo bootstrap) не должны подаваться как runnable CLI commands, если их нет в shipped CLI.
2. `scripts/dossier.mjs` остаётся единственным canonical runtime entrypoint shipped inside the skill package.
3. `feature-intake` обязан сохранять durable backlog handoff, а не только свободный текст.
4. Если в repo несколько dossiers и `--dossier` не задан, `next-step` не должен молча выбирать “какой-то active dossier”.
5. `index-refresh` — canonical single-writer mutation path для generated index sections; `sync-index` — узкий refresh table/graph path.

## Package 1. Docs/process contract

### Scope

- [../SKILL.md](../SKILL.md)
- [../references/workflow.md](../references/workflow.md)
- [../references/DOSSIER_TEMPLATE.md](../references/DOSSIER_TEMPLATE.md)
- [README.md](README.md)

### Changes

1. Явно развести:
   - workflow stages;
   - actual CLI commands.
2. Убрать wording, который выглядит как `node scripts/dossier.mjs spec-compact`.
3. Зафиксировать minimum backlog handoff contract:
   - selected backlog item key;
   - backlog delivery state at intake;
   - source traceability;
   - known blockers / dependencies.
4. Добавить dedicated handoff representation в dossier template.
5. В `feature-intake`, `spec-compact`, `plan-slice`, `implementation` добавить step-local return-to-backlog rule.
6. Ограничить full closure protocol только реальными mutating delivery steps, а не housekeeping commands.
7. Сделать `index-refresh` canonical default when a step needs a full index refresh; `sync-index` описать как narrower path.
8. Уточнить `next-step`:
   - dossier-local only;
   - with multiple dossiers, explicit targeting is required;
   - command output is dossier-local and does not replace overlay ingestion.

### Acceptance

- ни один workflow stage не выглядит как shipped CLI command, если его нет в command registry;
- `feature-intake` docs and template define one canonical backlog handoff shape;
- step-local backlog sync obligation видна прямо в relevant sections;
- `sync-index` и `index-refresh` больше не описываются как interchangeable defaults;
- `next-step` docs no longer normalize bare invocation when it can be ambiguous.

## Package 2. Runtime alignment

### Scope

- [../src/commands.ts](../src/commands.ts)
- [../src/core/workflow.ts](../src/core/workflow.ts)
- [utility-spec.ru.md](utility-spec.ru.md)
- [../test/cli.test.ts](../test/cli.test.ts)
- other touched runtime/tests if needed

### Changes

1. `feature-intake`
   - заменить free-form selected-work-only intake на structured backlog handoff inputs;
   - записывать durable handoff block в generated dossier;
   - обновить JSON/text output accordingly.
2. `next-step`
   - if `--dossier` is omitted and more than one dossier exists, fail with explicit usage guidance instead of auto-selecting;
   - when no dossier exists, keep dossier-local blocker that points back to `backlog-engineer`;
   - make output clearly dossier-local.
3. Tests
   - add coverage for multi-dossier ambiguity;
   - add coverage for structured intake handoff;
   - update help/output expectations.

### Acceptance

- runtime no longer silently picks the wrong dossier for `next-step`;
- `feature-intake` persists durable backlog handoff, not only free text;
- docs/spec/runtime/test expectations match;
- `format`, `lint`, `test`, and `git diff --check -- skills/dossier-engineer` pass.

## Review order

1. spec/process conformance review against:
   - [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
   - this plan
2. if runtime changed and spec/process review is PASS:
   - code review
   - security review
