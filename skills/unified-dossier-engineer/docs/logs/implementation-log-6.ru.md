# Лог реализации `Package 8`

Дата: 2026-04-21

## Что реализовано

В этой волне source bundle `unified-dossier-engineer` получил новый active reference:

- `references/runtime-and-command-boundary.md`

Также были обновлены:

- `skill.yaml`
- `references/unified-architecture.md`
- `references/source-bundle-governance.md`
- `references/status-and-scope.md`
- `docs/README.md`
- generated `SKILL.md`
- generated `docs/compile-report.md`

## Что зафиксировано

### Primary public runtime contract

Будущая merged utility закреплена как один semantic public utility contract:

- `dossier-engineer <command> [options]`

При этом документ отдельно фиксирует:

- это public boundary, а не требование немедленно свести всё к одному monolithic binary;
- на первой merged wave допускаются compatibility launchers, если они не создают второй долгоживущий public contract.

### Future command families

Runtime boundary теперь группирует future help surface по семействам:

- bootstrap / root-management
- backlog truth family
- delivery stage-controller family
- delivery helper / integrity / closure family

Это переводит utility spec в help-surface-ready taxonomy, не обещая пока shipped commands в planning-stage skill.

### Runtime module boundaries

Зафиксирован рекомендуемый internal split для будущего runtime:

- `src/shared/`
- `src/backlog/`
- `src/delivery/stages/`
- `src/delivery/helpers/`
- `src/telemetry/`
- `src/compat/`

Тем самым `Package 8` не только описывает public command families, но и задаёт implementation-oriented internal modularity.

### Compatibility launchers and migration

Отдельно зафиксированы:

- compatibility launcher strategy для `backlog-engineer`
- preservation literal helper names on dossier side
- запрет на fake compatibility shims для prose-only stage names до реального shipped runtime
- deprecation order, при котором split launchers не retire-ятся до parity

### Source-bundle governance alignment

В governance явно закреплено:

- design-time runtime/help/module references допустимы в active `references/*`
- но `skill.yaml` `commands` surface по-прежнему остаётся пустым до появления реального runtime code и tests

Это удерживает planning-stage skill от ложного сигнала “команды уже shipped”.

## Что сознательно НЕ делалось

В этой волне не реализовывались:

- actual runtime modules under `src/`
- emitted launchers under `scripts/`
- command help snapshots
- command behavior tests
- compatibility wrappers as executable code

Причина:

- это scope следующих implementation waves
- `Package 8` должен сначала сделать runtime boundary deterministic, а не симулировать shipped CLI

## Валидация

После правок должны проходить:

- `skill-source-compiler lint`
- compile в temp output и перенос generated `SKILL.md` + `docs/compile-report.md` обратно в source bundle
- `skill-source-compiler check` против temp compiled bundle
- `git diff --check`

Внешний audit для этой волны:

- `spec-conformance-reviewer` против:
  - `docs/issues/unified-dossier-engineer-concept-2026-04-20.md`
  - `docs/refactoring-plan-1.ru.md`
- `code-reviewer` и `security-reviewer` допустимо маркировать как `N/A`, если wave остаётся docs-only и не меняет runtime/code surface
