# Лог имплементации `improvement-proposal-20260424-1`

Issue: `../issues/improvement-proposal-20260424-1.md`

Plan: `../issues/implementation-plan-20260424-1.md`

Status: implemented

## Scope

Реализован lifecycle reconciliation gate для selected backlog item перед truthful closure стадий `spec-compact`, `plan-slice` и `implementation`.

Изменение остается в границах issue: runtime валидирует current backlog truth и записывает reconciliation telemetry, но не мутирует backlog truth из delivery-stage команд или `dossier-step-close`.

## Что изменено

- Добавлен `src/shared/lifecycle-reconciliation.ts` с target mapping, delivery-state comparator, selected item resolution, managed actualization artifact validation и read-model drift detection.
- `dossier-step-close` теперь fail-closed до vendored close-out и до записи step artifact, если current selected backlog item ниже target.
- Добавлен error contract `UDE_BACKLOG_ACTUALIZATION_REQUIRED` с current state, target state, selected item key, actualization verdict и next command guidance.
- Stage-controller commands записывают lifecycle reconciliation fields и поднимают unresolved backlog follow-up, если selected item отстает от target.
- Stage-state/frontmatter parity расширена полями `backlog_lifecycle_target`, `backlog_lifecycle_current`, `backlog_lifecycle_reconciled`, `backlog_actualization_artifacts`, `backlog_actualization_verdict`.
- `status` показывает lifecycle reconciliation drift count/details, а `queue` исключает drift-blocked item keys и возвращает warning вместо silent ready work.
- Runtime help добавил `--backlog-actualization-artifact <path>` для `dossier-step-close`.
- Active references, utility spec и docs-contract tests обновлены под closure gate, read-model drift visibility и запрет direct backlog mutation из stage-controller layer.
- CLI tests добавили regression coverage для planned->implemented actualization, no-op reconciliation, `spec-compact`/`plan-slice` targets, status/queue drift и successful close linkage.

## Что сознательно не менялось

- Stage-controller commands не мутируют backlog truth напрямую.
- `dossier-step-close` не применяет patch и не считает actualization artifact достаточным без current-state validation.
- Historical dossiers, historical step artifacts и stale stage states не переписывались.
- Queue ranking не переработан; добавлены только drift exclusion/warning на wrapper layer.
- Dependency attention и automatic downstream review resolution не менялись.

## Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer format` — passed.
- `pnpm --filter @kostysh/unified-dossier-engineer lint` — passed.
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` — passed.
- `pnpm --filter @kostysh/unified-dossier-engineer test` — passed, 74/74.
- `git diff --check -- skills/unified-dossier-engineer` — passed.
- Portability grep for machine-local absolute path patterns inside `skills/unified-dossier-engineer` — no matches.

## External Audits

- Plan audit: external agent `Feynman`, verdict `PASS`, artifact: `../issues/implementation-plan-20260424-1.md`.
- Implementation-specific external audit: none; issue workflow requires implementation log, and the audited plan did not require a separate implementation audit.

## Follow-ups

- none
