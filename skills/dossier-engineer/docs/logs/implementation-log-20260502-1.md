# Implementation Log

## Log ID

`implementation-log-20260502-1`

## Related Issue

`issue-20260501-2` — `docs/issues/issue-20260501-2.md`

## Related Plan

`implementation-plan-20260501-2` — `docs/issues/implementation-plan-20260501-2.md`

## Operator Request

Оператор задал порядок реализации roadmap и попросил начать с Phase 2: write lock, atomic writes и mutation envelope для runtime `dossier-engineer`.

## Summary

Реализована single-writer защита для mutating runtime commands: ephemeral lock под `.dossier-runtime/write.lock/`, fail-fast diagnostics, post-write validation, stale artifact rejection и split-lock поведение для `verify run`.

## Changes Made

- `.gitignore` — добавлен ignore для `.dossier-runtime/` в skill repository.
- `skills/dossier-engineer/src/infra.ts` — добавлены lock helpers, holder metadata, conflict error и temp+rename atomic writes.
- `skills/dossier-engineer/src/app.ts` — добавлены mutation classification, common mutation envelope, lock-conflict result, post-write validation, stale write detection в `updateArtifact`, split-lock record phase для `verify run`.
- `skills/dossier-engineer/test/cli.test.ts` — добавлены tests для fail-fast lock conflict, read-only command under lock, `verify run` external phase outside lock, stale material scope rejection и cleanup.
- `skills/dossier-engineer/test/infra.test.ts` — добавлен fault-injection test для cleanup после сбоя записи lock metadata.
- `skills/dossier-engineer/references/runtime-commands.md` — зафиксирован runtime lock contract, fail-fast policy, read-only mixed-view caveat и `verify run` split behavior.
- `skills/dossier-engineer/references/parallel-development.md` — уточнено различие между запрещёнными committed/shared lock files и допустимым ephemeral runtime lock.
- `skills/dossier-engineer/fragments/overview.md` — устранена двусмысленность между запретом canonical/shared lock state и допустимым ephemeral runtime lock.
- `skills/dossier-engineer/skill.yaml` — обновлена версия source bundle и добавлен этот implementation log в supporting surface.
- `skills/dossier-engineer/scripts/dossier-engineer.mjs` и `.map` — пересобраны runtime artifacts.
- `skills/dossier-engineer/SKILL.md` — regenerated from source bundle.

## Decisions

- Lock path выбран строго `.dossier-runtime/write.lock/` под dossier root; runtime не использует `.git`, чтобы не зависеть от linked worktree/submodule layout.
- Lock conflict не ждёт автоматически: команда возвращает blocked result с holder metadata и Next actions.
- `init` создаёт или обновляет `.gitignore`, чтобы `.dossier-runtime/` не попадал в changesets целевого repository.
- Read-only commands не берут lock; mutating commands перечитывают artifacts после lock acquisition через существующие handlers.
- `verify run` запускает внешние команды без lock и записывает результат только после re-read под lock. Если material scope или profile commands изменились, результат не записывается.
- Stale write detection добавлена на `updateArtifact`: runtime сравнивает текущий artifact с прочитанной ранее версией и блокирует перезапись при расхождении.
- Atomic write реализован temp+rename в той же директории artifact, чтобы не оставлять half-written Markdown file.

## Verification Performed

- `cd skills/dossier-engineer && pnpm run typecheck` — PASS до изменений.
- `cd skills/dossier-engineer && pnpm test` — PASS после runtime/test изменений.
- `cd skills/dossier-engineer && pnpm run typecheck` — PASS после runtime/test изменений.
- `cd skills/dossier-engineer && pnpm run lint` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/dossier-engineer` — PASS.
- Instruction quality audit from `skill-source-compiler` — PASS: active guidance now states outcome, side-effect limits, fail-fast behavior, split-lock `verify run`, validation expectations, and avoids the earlier `shared lock files` ambiguity.
- Independent implementation audit found cleanup/matrix/gitignore gaps; fixes were applied before final verification.

## Deviations From Plan

- Отдельные `lock status` / `lock break` commands не добавлялись, потому что план оставлял их optional. Phase 2 закрыта через обязательный lock-conflict diagnostic output и safe-removal guidance в Next actions.
- Runtime не добавляет отдельные `lock status` / `lock break` команды; диагностика stale/held lock остаётся частью blocked output mutating command.

## Side Effects

- Mutating commands теперь создают ephemeral `.dossier-runtime/` directory while running.
- Concurrent mutating command under lock now fails fast with exit code `2` instead of racing writes.
- `verify run` may return blocked after successful external commands if work material scope or profile commands changed before record phase.

## Follow-up

- Phase 1 должна использовать этот mutation envelope при изменении queue, stage gates и terminal lifecycle.
- Phase 3 должна расширить evidence semantics поверх уже защищённой record phase.
- Phase 4 должна использовать material freshness semantics без добавления нового storage family.

## Final Status

PASS
