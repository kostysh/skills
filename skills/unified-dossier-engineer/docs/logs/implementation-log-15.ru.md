# Implementation Log 15: explicit stage session provenance

## Scope

Реализован [issues/improvement-proposal-20260423-4.md](../issues/improvement-proposal-20260423-4.md).

Цель изменения:

- вернуть portable explicit contract для session provenance в stage artifacts;
- требовать `--session-id <id>` на stage-controller write paths;
- убрать silent fallback на runtime-specific session env;
- не добавлять Codex-specific session-store lookup или auto-discovery;
- сохранить backward-compatible чтение старых artifacts, но не генерировать новые contradictory `trace_locator_kind: session_id` + `session_id: null`.

## Runtime contract

Обновлены:

- [../src/delivery/stage-control.ts](../../src/delivery/stage-control.ts)
- [../src/unified-cli.ts](../../src/unified-cli.ts)
- [../scripts/dossier-engineer.mjs](../../scripts/dossier-engineer.mjs)

Решение:

- добавлен общий explicit parser `--session-id <id>` для stage-controller writes;
- `--trace-runtime <name>` оставлен optional explicit metadata без Codex-specific default;
- `feature-intake`, `spec-compact`, `plan-slice`, `implementation` и `change-proposal` fail-closed без `--session-id`;
- `feature-intake` проверяет provenance до vendored dossier creation, поэтому missing session id не создает dossier или stage log;
- stage metadata пишет `session_id` только из explicit input;
- `process.env.CODEX_SESSION_ID` больше не используется для stage artifact metadata.

## Lifecycle/session-index compatibility

Обновлен [../src/vendor/dossier-engineer/lib/lifecycle-telemetry.ts](../../src/vendor/dossier-engineer/lib/lifecycle-telemetry.ts).

Решение:

- lifecycle reader больше не подставляет `trace_runtime: codex` или `trace_locator_kind: session_id` по умолчанию;
- session index переносит explicit metadata как есть;
- старые artifacts с missing/null session fields остаются читаемыми через nullable fields.

## Active docs

Обновлены:

- [../SKILL.md](../../SKILL.md)
- [../fragments/overview.md](../../fragments/overview.md)
- [../skill.yaml](../../skill.yaml)
- [../references/commandized-stage-control.md](../../references/commandized-stage-control.md)
- [../references/runtime-and-command-boundary.md](../../references/runtime-and-command-boundary.md)
- [../references/telemetry-and-closure.md](../../references/telemetry-and-closure.md)
- [../references/unified-artifact-topology.md](../../references/unified-artifact-topology.md)
- [utility-spec.ru.md](../utility-spec.ru.md)

Решение:

- active guidance закрепляет agent-owned session resolution flow;
- stage-controller examples показывают `--session-id`;
- runtime-specific env/session-store inputs описаны только как возможный context для агента, а не portable CLI contract;
- utility spec запрещает новые stage-controller writes с `trace_locator_kind: session_id` и `session_id: null`.

## Tests

Обновлены:

- [../test/cli.test.ts](../../test/cli.test.ts)
- [../test/docs-contract.test.ts](../../test/docs-contract.test.ts)

Покрытие:

- help surface содержит `--session-id <id>` и optional `--trace-runtime <name>`;
- `feature-intake` без `--session-id` fail-closed до создания dossier/log;
- остальные stage-controller bootstrap paths без `--session-id` fail-closed без stage log writes;
- update path без `--session-id` fail-closed и не перезаписывает существующий stage log;
- stage log и helper-managed stage state получают одинаковый explicit `session_id`;
- docs-contract защищает portable explicit-input model и запрет runtime auto-discovery.

## Verification

Status: local checks and external audits passed

Выполнены проверки:

- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` — pass.
- `pnpm --filter @kostysh/unified-dossier-engineer test` — pass, 61 tests.
- `git diff --check` — pass.

Notes:

- Package test был запущен вне filesystem sandbox, потому что sandbox ломает nested `spawnSync` stdout/stderr capture, на котором основан `test/cli.test.ts`.

## External audit

Status: reviewed

Выполнены внешние аудиты:

- `spec-conformance-reviewer` — `PASS`
- `code-reviewer` — `PASS`
- `security-reviewer` — `PASS`

Ключевые результаты:

- `spec-conformance-reviewer` подтвердил соответствие `ISS-02/UDE-03`: explicit agent-owned `--session-id`, fail-closed behavior для shipped stage-controller write paths, отсутствие Codex-specific auto-discovery/env fallback, lifecycle/session-index compatibility и docs/runtime/test parity покрыты.
- `code-reviewer` не нашел regressions, missing tests или maintainability blockers; отдельно подтвердил feature-intake pre-write validation, отсутствие `CODEX_SESSION_ID` metadata fallback и nullable legacy handling.
- `security-reviewer` не нашел injection, path traversal, unsafe environment trust или misleading security claims; отметил ожидаемый residual risk, что `--session-id` является self-declared process metadata, not cryptographic provenance.
