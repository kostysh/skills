# Лог имплементации `ISS-10`

Issue: `../issues/issue-20260428-1.md`

Plan: `../issues/implementation-plan-20260428-1.md`

Status: implemented

## Scope

Реализовано explicit post-intake backlog state `intaken` для выбранного backlog item после `feature-intake`. Изменение закрывает gap между созданным feature dossier и backlog truth layer: item больше не остается неотличимым от not-yet-intaken `defined` work, но backlog mutation по-прежнему выполняется только через canonical `patch-item` / refresh+patch path.

## Что изменено

- Backlog `delivery_state` расширен до `defined < intaken < specified < planned < implemented`; schema validation, lifecycle comparator и dependency readiness ranking теперь знают `intaken`.
- `feature-intake` получил lifecycle target `intaken`; stage state/log/output фиксируют target/current/reconciled/verdict и unresolved `backlog-lifecycle-actualization`, если текущий backlog truth ниже `intaken`.
- `dossier-step-close --step feature-intake` теперь fail-closed с `UDE_BACKLOG_ACTUALIZATION_REQUIRED`, пока selected backlog item не достиг `intaken`; successful close принимает существующий `--backlog-actualization-artifact` evidence path.
- `status` получил deterministic `intaken_count`; ordinary `ready_for_next_step_count` и `queue` исключают `intaken` work из fresh intake candidates.
- `items`, `search`, `report` и CLI intake help/validation поддерживают `intaken` как first-class backlog state.
- Active references, `docs/utility-spec.ru.md`, generated `SKILL.md`, `docs/compile-report.md`, CLI tests и docs-contract tests обновлены под runtime/docs/test parity.
- `skill.yaml` повышен до `source-version: 0.2.4`, package manifest до `0.2.1`.

## Что сознательно не менялось

- `feature-intake` не мутирует backlog truth напрямую и не применяет patch сам.
- `intaken` не считается `specified`, implementation readiness или dossier maturity.
- Existing targets `spec-compact -> specified`, `plan-slice -> planned`, `implementation -> implemented` сохранены, кроме нового lower state в ordering.
- Review policy, verification artifacts, immutable review attempts, freshness checks, same-thread rejection, post-close hygiene и source-review gates не ослаблялись.
- Historical backlog items и existing dossiers не мигрировались задним числом.
- Broad queue redesign, score/ranking policy rewrite и auto-ack source-review behavior не добавлялись.

## Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer format` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer lint` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer test` — PASS, 97/97. Команда запускалась вне sandbox, потому что CLI suite использует child-process `spawnSync`; sandbox run failed with `EPERM` and empty child stdout.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/unified-dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/unified-dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer` — PASS.
- `git diff --check -- skills/unified-dossier-engineer` — PASS.
- Portable absolute-path scan for `skills/unified-dossier-engineer` — PASS: `/home`, `/tmp`, and `C:\` absent; `/code` scan found only ordinary `runtime/code` wording, not an absolute path.

## External Audits

- Plan external audit / external agent `Beauvoir` / `PASS`.
- Implementation external audit не запускался: оператор разрешил spawned agents для аудита плана, отдельного разрешения на implementation audit в текущей задаче не было.

## Follow-ups

- none.
