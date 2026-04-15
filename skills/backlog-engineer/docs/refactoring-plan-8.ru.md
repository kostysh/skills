# Refactoring plan 8: canonical patch artifact integrity

Дата: `2026-04-15`
Компонент: `backlog-engineer`
Основание: [issues/improvement-proposal-20260415-1.md](issues/improvement-proposal-20260415-1.md)
Скоп: patch command contracts, applied registry integrity, status/refresh diagnostics, cleanup hygiene

## Цель

Сделать canonical patch artifacts очевидной и проверяемой частью replay-safe backlog.

После цикла агент должен понимать, что hashed canonical patch file не является мусорным дублем. Если `.backlog/applied.json` ссылается на canonical artifact, этот artifact должен существовать, быть сохранен в репозитории и участвовать в replay integrity.

## Нормативные источники

- [../SKILL.md](../SKILL.md)
- [../references/command-reference.md](../references/command-reference.md)
- [../references/packet-and-patch.md](../references/packet-and-patch.md)
- [utility-spec.ru.md](utility-spec.ru.md)
- [schemas-and-types.ru.md](schemas-and-types.ru.md)
- [test-matrix.ru.md](test-matrix.ru.md)
- [issues/improvement-proposal-20260415-1.md](issues/improvement-proposal-20260415-1.md)

## Не цели

- Не менять packet model.
- Не использовать commit SHA как критерий валидности backlog.
- Не вводить ручное редактирование `.backlog/applied.json` как штатное исправление.
- Не удалять существующие replay safeguards.

## Package 1. Normative retention contract

### Смысл

Docs должны буквально объяснять назначение canonical patch artifacts и отличие authored input от immutable replay artifact.

### Файлы

- `SKILL.md`
- `references/command-reference.md`
- `references/packet-and-patch.md`
- `docs/utility-spec.ru.md`
- `docs/schemas-and-types.ru.md`
- `docs/test-matrix.ru.md`
- docs-contract tests if present

### Изменения

1. В patch workflow добавить правило:
   - successful real mutation writes a canonical patch artifact;
   - applied registry stores the canonical path;
   - canonical patch artifact is immutable replay evidence;
   - referenced canonical patch artifacts must be committed and retained.
2. В cleanup guidance добавить запрет удалять files, referenced by applied registry, source registry, packet registry, dependency graph или item metadata.
3. В command docs для patch-producing commands добавить compact response fields:
   - `authored_patch_path`
   - `canonical_patch_path`
   - `canonical_patch_purpose`
4. Уточнить, что machine-facing paths may be absolute, но docs examples should stay portable.

### Acceptance

- Агенту не нужно догадываться, зачем существует hashed patch copy.
- Все command docs используют одинаковые термины.
- Cleanup policy защищает referenced canonical artifacts.

## Package 2. Command output contract and schemas

### Смысл

CLI output должен отдавать достаточно информации, чтобы агент мог объяснить оператору, какой artifact создан и зачем.

### Файлы

- `src/schemas/commands.ts`
- command implementations for patch-producing commands
- `src/commands/*patch*` или соответствующие modules
- CLI contract docs
- tests for command output snapshots

### Изменения

1. Добавить output fields для real mutation patch commands:
   - `authored_patch_path` when authored input exists;
   - `canonical_patch_path` when mutation produced canonical artifact;
   - `canonical_patch_purpose: immutable_replay_artifact`.
2. Для commands, которые не создают patch artifact, не добавлять фиктивные поля.
3. Обновить snapshots/goldens только там, где command output реально меняется.

### Acceptance

- `patch-item` и аналогичные mutation commands показывают canonical path.
- Dry-run не сообщает canonical artifact как созданный.
- Output остается deterministic and machine-plain.

## Package 3. Artifact integrity signal

### Смысл

Backlog должен fail или degrade with clear diagnostics, если applied registry ссылается на отсутствующий canonical artifact.

### Файлы

- status/refresh command implementation
- replay or rebuild diagnostics modules
- error codes
- schemas for status output
- tests for missing canonical artifact

### Изменения

1. Добавить integrity check для applied canonical paths.
2. В status/refresh output добавить:
   - `artifact_integrity.applied_canonical_paths_exist`
   - `artifact_integrity.missing_canonical_paths`
3. Добавить или переиспользовать error code `BE_CANONICAL_ARTIFACT_MISSING`.
4. Диагностика должна включать:
   - `canonical_path`
   - `artifact_kind`
   - `patch_id` или `packet_id`
   - `apply_index` / `sequence`
   - remediation hint без ручного state editing.
5. Если rebuild/replay падает из-за missing artifact, surfaced error должен указывать patch/op context, а не выглядеть как generic todo или commit issue.

### Acceptance

- Тест удаляет referenced canonical patch artifact и получает точный diagnostic.
- `status --refresh` показывает integrity state.
- Ошибка не ссылается на commit SHA как причину валидности.

## Package 4. Cross-skill closure handoff

### Смысл

Если dossier workflow меняет backlog truth, closure должен проверять backlog replay safety.

### Файлы

В этом плане меняется только `backlog-engineer`, но handoff должен стать видимым для downstream `dossier-engineer` через явный follow-up.

Backlog-side files:

- `SKILL.md`
- `references/command-reference.md`
- `references/packet-and-patch.md`

Required cross-skill follow-up surface in `dossier-engineer`:

- `references/workflow-stage-implementation.md`
- `references/workflow-stage-logging.md`
- `SKILL.md` if the active closure summary also mentions backlog actualization

### Изменения

1. Добавить backlog-side guidance: after dossier-side backlog actualization, run scoped backlog status / refresh when the dossier work changed backlog truth.
2. Уточнить, что missing canonical artifacts block clean closure.
3. Описать, что dossier log фиксирует integrity result как external backlog state.
4. Зафиксировать явный follow-up requirement: при реализации этого пакета открыть отдельный `dossier-engineer` patch или paired docs update, чтобы active implementation closure instructions требовали backlog artifact integrity check после lifecycle actualization.
5. Не оставлять cross-skill visibility как optional note; если paired dossier update не сделан в том же цикле, implementation должна считаться incomplete.

### Acceptance

- Cross-skill handoff говорит не только про lifecycle actualization, но и про artifact integrity.
- В плане есть точный `dossier-engineer` active surface для paired update, чтобы dossier agents реально увидели новое правило.
- Задачи без backlog mutation не получают лишний обязательный check.

## Проверки

- targeted unit tests for missing canonical artifact.
- command output snapshot tests.
- `pnpm --filter @kostysh/backlog-engineer-cli test`.
- `pnpm --filter @kostysh/backlog-engineer-cli lint` if available.
- `rg` на абсолютные локальные пути в измененных docs.
- `git diff --check`.

## Review plan

Перед имплементацией выполнить внешний spec-conformance/UX review этого плана против proposal. После правок добиться PASS на узком scope измененного plan doc.
