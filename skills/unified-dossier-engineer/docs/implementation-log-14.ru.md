# Implementation Log 14: external independent audit launch contract

## Scope

Реализован [issues/improvement-proposal-20260423-3.md](issues/improvement-proposal-20260423-3.md).

Цель изменения:

- явно закрепить, что blocking external audits запускаются без forked/full-history authoring context;
- сделать `fork_context: false` Codex-specific примером общего no-full-context-inheritance правила;
- зафиксировать rerun при обнаружении invalid fork/full-history review launch method;
- сохранить честную границу runtime: helpers записывают и проверяют observable provenance, но не доказывают launch-mode independence;
- защитить правило docs-contract и help-surface tests.

## Измененные active surfaces

### Generated skill overview

Обновлены:

- [../SKILL.md](../SKILL.md)
- [../fragments/overview.md](../fragments/overview.md)
- [../skill.yaml](../skill.yaml)

Решение:

- добавлено launch-time правило для blocking external reviews;
- `review-artifact` и `dossier-step-close` описаны как helpers, которые не доказывают reviewer launch-mode independence;
- source manifest получил gotcha для external audit launch boundary.

### Audit policy

Обновлен [references/audit-policy.md](../references/audit-policy.md):

- blocking audits must not inherit authoring agent full working context or full conversation history;
- Codex `fork_context: false` описан как runtime-specific realization общего правила;
- forked/full-history delegation explicitly does not satisfy external independent audit requirements;
- invalid launch method invalidates the audit and requires rerun;
- runtime/artifact state must not claim proof beyond observable provenance.

### Delivery workflow and stage control

Обновлены:

- [references/delivery-workflow-layer.md](../references/delivery-workflow-layer.md)
- [references/commandized-stage-control.md](../references/commandized-stage-control.md)

Решение:

- invalid review launch method blocks truthful closure and cannot be accepted as quiet PASS;
- `ready_for_close` вводит стадию в non-forked/no-full-history external-review flow, but does not prove reviewer launch mode.

### Runtime-facing boundary and telemetry

Обновлены:

- [references/runtime-and-command-boundary.md](../references/runtime-and-command-boundary.md)
- [references/telemetry-and-closure.md](../references/telemetry-and-closure.md)
- [utility-spec.ru.md](utility-spec.ru.md)

Решение:

- `review-artifact` и `dossier-step-close` validate only observable durable provenance;
- helpers must not claim proof for `fork_context`, full-history inheritance, prompt mutability, or model tier;
- utility spec now states that forked/full-history reviewer delegation does not satisfy `external independent audit`.

## Runtime/help surface

Обновлены:

- [../src/vendor/dossier-engineer/commands.ts](../src/vendor/dossier-engineer/commands.ts)
- [../scripts/dossier-engineer.mjs](../scripts/dossier-engineer.mjs)

Решение:

- `review-artifact --help` теперь предупреждает, что artifact records observable provenance only and does not prove launch-mode facts;
- `dossier-step-close --help` теперь предупреждает, что closure validates observable durable review bundle only and forked/full-history audits must be rerun.

Runtime behavior, artifact schema и audit bundle mapping не менялись.

## Tests

Обновлены:

- [../test/docs-contract.test.ts](../test/docs-contract.test.ts)
- [../test/cli.test.ts](../test/cli.test.ts)

Покрытие:

- active contract содержит no forked/full-history launch rule;
- invalid fork/full-history audit requires rerun;
- helpers do not claim proof of launch-mode independence;
- help output содержит same boundary wording.

## Verification

Status: local checks passed; external audits pending

Выполнены проверки:

- `pnpm --filter @kostysh/unified-dossier-engineer test` — pass, 58 tests.
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` — pass.
- `git diff --check` — pass.

Notes:

- Package test был запущен вне filesystem sandbox, потому что sandbox ломал nested `spawnSync` stdout/stderr capture, на котором основан `test/cli.test.ts`.

## External audit

Status: reviewed

Выполнены внешние аудиты:

- `spec-conformance-reviewer` — `PASS`
- `code-reviewer` — `PASS`
- `security-reviewer` — `PASS`

Ключевые результаты:

- `spec-conformance-reviewer` подтвердил соответствие `ISS-01/UDE-01`: launch-time rule, policy rerun rule, workflow blocked/not quiet PASS, runtime/provenance non-proof boundary и help/source surfaces покрыты.
- `code-reviewer` не нашел regressions, missing tests или maintainability blockers.
- `security-reviewer` не нашел security regressions или misleading security guarantees; helper boundary теперь явно не overclaim-ит independence proof.
