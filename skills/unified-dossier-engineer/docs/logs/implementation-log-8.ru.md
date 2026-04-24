# Package 10 Implementation Log

Дата: 2026-04-21

## Scope

`Package 10. Завершить canonical hardening, parity validation и cleanup`

Основная цель этого цикла: убрать из merged skill любые legacy split-model promises и довести shipped runtime/source bundle до canonical-only состояния.

## Что изменено

- из source bundle убраны migration/rollout references и compatibility launcher promises
- из runtime removed compatibility entrypoints and migration command family
- active references и utility spec выровнены под canonical unified contract
- CLI parity tests переписаны на no-legacy surface
- docs-contract suite теперь проверяет canonical-only invariants
- vendored runtime strings выровнены на `dossier-engineer`, без stale `backlog-engineer` / `node scripts/dossier.mjs`
- `next-step` больше не принимает и не возвращает stale non-canonical workflow stages
- blocking docs-contract checks ограничены active references, без превращения `docs/*` в normative runtime surface

## Canonical decisions materialized

- единственный public launcher: `dossier-engineer`
- единственный supported layout: `.dossier` + `docs/ssot`
- no `marker-audit`
- no `migrate-split-artifacts`
- no `rollout-readiness`
- no compatibility launchers for `dossier` / `backlog-engineer`

## Validation target

После этого пакета merged skill должен:

- не обещать split-model compatibility ни в runtime, ни в `SKILL.md`, ни в active references
- проходить runtime/tests/compiler parity как canonical-only skill
- оставаться простым: один launcher, один root contract, один shipped help surface
