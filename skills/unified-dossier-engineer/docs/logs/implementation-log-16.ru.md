# Implementation Log 16: machine-complete stage artifact schema

## Scope

Реализован [issues/improvement-proposal-20260423-5.md](../issues/improvement-proposal-20260423-5.md).

Цель изменения:

- сделать `.dossier/stages/*` authoritative structured coordination/validation surface для stage artifacts;
- держать stage log frontmatter как bounded mirror machine-facing fields;
- добавить explicit artifact links для review/verification/step outputs;
- добавить agent-supplied skill annotations без trace scraping;
- добавить structured `process_misses` через простой repeatable DSL;
- добавить explicit scope identity fields;
- сохранить commit anchors как optional trace links, not required closure evidence.

## Runtime contract

Обновлены:

- [../src/shared/stage-state.ts](../../src/shared/stage-state.ts)
- [../src/delivery/stage-control.ts](../../src/delivery/stage-control.ts)
- [../src/unified-cli.ts](../../src/unified-cli.ts)
- [../scripts/dossier-engineer.mjs](../../scripts/dossier-engineer.mjs)

Решение:

- stage state теперь нормализует и хранит parity-protected fields: backlog follow-up state, artifact links, optional commit anchors, explicit skill annotations, structured `process_misses`, primary backlog/feature identity и `phase_scope`;
- stage log frontmatter формируется как bounded mirror через общий normalization/parity layer;
- stage-controller write paths принимают repeatable `--skill-used`, `--skill-issue`, `--skill-followup`, `--process-miss <dsl>` и optional `--phase-scope`;
- malformed `--process-miss` entries reject до записи stage artifacts;
- `process_misses` рендерятся как structured mirror, а старые human notes сохраняются отдельно как `Unstructured notes`;
- `review-artifact`, `dossier-verify` и `dossier-step-close` обновляют явные artifact link arrays в stage log и stage state;
- `final_delivery_commit` и `final_closure_commit` остаются optional trace links и не используются как closure evidence.

## Active docs

Обновлены:

- [../SKILL.md](../../SKILL.md)
- [../fragments/overview.md](../../fragments/overview.md)
- [../references/commandized-stage-control.md](../../references/commandized-stage-control.md)
- [../references/delivery-workflow-layer.md](../../references/delivery-workflow-layer.md)
- [../references/telemetry-and-closure.md](../../references/telemetry-and-closure.md)
- [../references/unified-artifact-topology.md](../../references/unified-artifact-topology.md)
- [utility-spec.ru.md](../utility-spec.ru.md)

Решение:

- active guidance фиксирует authority boundary `.dossier/stages/*` vs stage log frontmatter mirror;
- utility spec перечисляет parity-protected fields и CLI inputs;
- docs-contract защищает запрет trace/prose scraping для skill/process fields;
- docs явно отделяют optional commit trace links от truthful closure evidence.

## Tests

Обновлены:

- [../test/cli.test.ts](../../test/cli.test.ts)
- [../test/docs-contract.test.ts](../../test/docs-contract.test.ts)

Покрытие:

- schema annotations и `process_misses` mirror в stage state и stage log frontmatter;
- malformed process-miss DSL fails before writing stage artifacts;
- `dossier-verify` materializes `verification_artifacts` in stage log and stage state;
- `review-artifact` и `dossier-step-close` materialize `review_artifacts`, `verification_artifacts`, and `step_artifact`;
- artifact helper linkage fails closed with `UDE_STAGE_LINKAGE_FAILED` when stage log/state linkage cannot be materialized after an artifact write;
- stage re-entry clears stale review/verification evidence and optional commit anchors from the current cycle;
- docs-contract protects machine-complete schema, optional commit anchors, and no trace-scraping policy;
- legacy process-miss prose is preserved as explicit unstructured notes.

## Verification

Status: local checks passed, external audits pending

Выполнены проверки:

- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` — pass.
- `pnpm --filter @kostysh/unified-dossier-engineer build` — pass.
- `pnpm --filter @kostysh/unified-dossier-engineer test` — pass, 68 tests.

Notes:

- Package test был запущен вне filesystem sandbox, потому что sandbox блокирует nested `spawnSync` для child `node`/`git` процессов.

## External audit

Status: reviewed

Выполнены внешние аудиты:

- `spec-conformance-reviewer` — `PASS`.
- `code-reviewer` — `PASS`.
- `security-reviewer` — `PASS`.

Ключевые результаты:

- Первый `spec-conformance-reviewer` аудит нашел blocker: post-artifact linkage был best-effort. Исправлено: `review-artifact`, `dossier-verify` и `dossier-step-close` теперь fail-closed через `UDE_STAGE_LINKAGE_FAILED`, если stage log/state linkage нельзя materialize после artifact write.
- Первый `code-reviewer` аудит нашел blocker: stage re-entry сохранял stale `verification_artifacts` и optional commit anchors. Исправлено: non-ready transitions сбрасывают review/verification evidence и optional commit anchors текущего цикла.
- Повторные `spec-conformance-reviewer`, `code-reviewer` и `security-reviewer` аудиты подтвердили `PASS`.
