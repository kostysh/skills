# Test Fixtures

Этот каталог содержит три слоя фикстур для `@kostysh/backlog-engineer-cli`:

- `sources/` — реальные source documents для `register-source`, `refresh` и hash-based тестов;
- `authored/` — agent-authored packet/patch inputs, в том числе негативные кейсы;
- `backlogs/` — backlog root snapshots с `.backlog.json`, `.backlog/`, `packets/`, `patches/`, `reports/` и `AGENTS.md`.

## Source fixtures

- `sources/docs/modules/auth.v1.md` и `auth.v2.md` — одна и та же logical source file до и после изменения;
- `sources/docs/modules/billing.md` — второй независимый модуль;
- `sources/docs/modules/session-ui.md` — downstream source относительно auth;
- `sources/docs/modules/legacy-auth-ui.md` — источник для remove-item / cleanup сценариев.
- `sources/source-path-cases.json` — meta-fixture для missing path и path-normalization cases.

## Authored fixtures

Папка `authored/packets/` содержит:

- валидные packet-файлы для auth, billing, session-ui, legacy-auth-ui и ordering;
- invalid packets:
  - duplicate `item_key`;
  - glossary conflict;
  - immutable context conflict;
  - dangling dependency;
  - self-dependency.

Папка `authored/patches/` содержит:

- валидный multi-item `patch-item`;
- валидный `remove-item`;
- invalid patches:
  - `patch-item` с `remove_item`;
  - `remove-item` с incomplete coverage;
  - duplicate `patch_id`;
  - non-monotonic `sequence`;
  - invalid `remove_todo` ownership.

## Backlog root fixtures

Основные backlog snapshots:

- `empty-backlog`
- `single-branch-backlog`
- `multi-branch-backlog`
- `context-heavy-backlog`
- `refreshable-backlog`
- `corrupted-state-backlog`
- `stale-state-backlog`
- `broken-registry-backlog-invalid-sources`
- `broken-registry-backlog-missing-sources`
- `broken-registry-backlog-invalid-applied`
- `broken-registry-backlog-missing-applied`
- `missing-canonical-artifact-backlog`
- `missing-canonical-patch-backlog`
- `invalid-canonical-packet-backlog`
- `invalid-canonical-patch-backlog`
- `ordering-tiebreak-backlog`
- `todo-dedup-backlog`
- `context-linked-cleanup-backlog`

## Path equivalence cases

Для source-path normalization tests использовать `sources/docs/modules/auth.v1.md` с такими эквивалентными CLI inputs:

- `skills/backlog-engineer/test/fixtures/sources/docs/modules/auth.v1.md`
- `./skills/backlog-engineer/test/fixtures/sources/docs/modules/../modules/auth.v1.md`

Оба варианта должны нормализоваться в один и тот же backlog-relative path.
