# Лог имплементации `ISS-06`

Issue: `../issues/issue-20260424-3.md`

Plan: `../issues/implementation-plan-20260424-3.md`

Status: implemented

## Scope

Реализован immutable per-round review artifact contract для `review-artifact`, `dossier-step-close`, helper-managed stage state, lifecycle reround metrics и активной документации `unified-dossier-engineer`.

## Что изменено

- `review-artifact` теперь пишет authoritative immutable attempt JSON с `review_attempt_id`, `review_round_id`, `review_round_number`, `artifact_role: "immutable_attempt"` и bounded default filename.
- После immutable write создаётся full JSON latest compatibility copy с `artifact_role: "latest_copy"` и `immutable_artifact_path`; также сохраняется legacy stable copy для старых consumers.
- `review_events[]` и `review_artifacts` в `.dossier/stages/*` сохраняют immutable paths для всех попыток, включая FAIL и PASS.
- `dossier-step-close` принимает immutable paths напрямую, а latest-copy inputs резолвит обратно в managed immutable attempt перед validation и step artifact output.
- Lifecycle reround metrics считают rerounds из structured `review_events[]` по `review_round_number` per audit class.
- Active references, `docs/utility-spec.ru.md`, source fragment, generated `SKILL.md`, `docs/compile-report.md`, docs-contract tests и CLI regression tests синхронизированы с новым контрактом.

## Что сознательно не менялось

- Historical migration для уже overwritten artifacts не выполнялась.
- Policy external independent audits не ослаблялась и не заменялась runtime attestation.
- Reviewer output schema за пределами уже поддержанных `--must-fix`, `--should-fix`, `--evidence`, `--notes` не менялась.
- Step-close artifact остаётся selected final PASS bundle; full reround history живёт в stage state.

## Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer format` — pass.
- `pnpm --filter @kostysh/unified-dossier-engineer lint` — pass.
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` — pass.
- `pnpm --filter @kostysh/unified-dossier-engineer test` — pass, 77/77; выполнено escalated, потому что sandbox блокирует `spawnSync(process.execPath)` в CLI process-level tests.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer` — pass.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>` — pass.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer` — pass.
- common absolute-local-path scan for the skill folder — pass, no machine-specific paths found.
- `git diff --check -- skills/unified-dossier-engineer` — pass.

## External Audits

- План `implementation-plan-20260424-3.md` уже имел external audit `PASS` от `Averroes`.
- Отдельный implementation audit не запускался: текущая задача не получила явного разрешения оператора на spawned/delegated external reviewer для этого turn.

## Follow-ups

- `none`.
