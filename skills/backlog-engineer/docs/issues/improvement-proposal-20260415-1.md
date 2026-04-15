# Предложение по улучшению 20260415-1: canonical patch artifact integrity и безопасное удержание артефактов

## Контекст

Поводом стал ретроанализ сессии `019d8db3`, где после backlog actualization выяснилось, что `.backlog/applied.json` ссылался на canonical hashed patch artifacts, которых не было на диске до восстановления.

Итоговый backlog был приведен в рабочее состояние, но само трение серьезное: canonical patch files выглядели для агента как дубликаты, а не как replay-critical artifacts.

## Главный вывод

У `backlog-engineer` уже есть хорошая модель immutable packet / patch application, но retention contract для canonical patch artifacts выражен слабее, чем для packets.

Если агент не понимает, что canonical hashed patch path является частью replay evidence, он может удалить или не закоммитить файл, а ошибка проявится позже как rebuild/replay failure.

## P1. Явно описать canonical patch artifact retention

Проблема:

После применения patch остается авторский input и canonical hashed copy. Без явного объяснения агент может принять hashed copy за технический дубль.

Предлагаемое изменение:

В `SKILL.md` и command reference для patch workflows добавить правило:

- successful real mutation writes a canonical patch artifact;
- `.backlog/applied.json` stores the canonical path;
- canonical patch artifact is immutable replay evidence;
- referenced canonical patch artifacts must be committed and retained;
- cleanup may remove drafts/scratch only after checking that no registry references them.

В output contract для `patch-item` и других patch commands добавить поля `authored_patch_path`, `canonical_patch_path`, `canonical_patch_purpose: immutable_replay_artifact`.

Прямой эффект:

Агент перестанет воспринимать canonical patch file как мусорный дубль.

Косвенный эффект:

В репозитории останется больше hashed artifacts, но это ожидаемая цена replay-safe backlog.

Риск:

Оператор может считать такие файлы шумом.

Смягчение:

Документация должна объяснять, что это не user-facing prose, а часть журналируемой истории применения backlog updates.

## P2. Добавить artifact integrity signal в status / refresh

Проблема:

Replay failure должен быть понятен до того, как агент или оператор решит, что backlog сломался от unrelated commit.

Предлагаемое изменение:

Расширить `status --refresh` или ближайшую status-команду сигналом:

- `artifact_integrity.applied_canonical_paths_exist`
- `artifact_integrity.missing_canonical_paths`

Если canonical path из applied registry отсутствует, команда должна возвращать non-pass состояние с кодом вроде `BE_CANONICAL_ARTIFACT_MISSING`.

Ошибка должна включать `canonical_path`, `artifact_kind`, `patch_id` или `packet_id`, `apply_index` / `sequence`, и краткий hint: восстановить canonical artifact или откатить некорректную registry reference через штатный workflow, не редактировать state вручную.

Прямой эффект:

Агент получит точную причину поломки и сможет объяснить оператору, какой replay artifact отсутствует.

Косвенный эффект:

`status --refresh` станет более строгим, но это корректно: отсутствие referenced canonical artifact означает нарушение replay safety.

Риск:

Старые backlog instances без canonical files могут начать показывать degraded status.

Смягчение:

Для legacy случаев можно добавить режим degraded warning с явным remediation hint, но для новых artifacts правило должно быть строгим.

## P3. Связать backlog integrity с dossier closure

Проблема:

В сессии фактическая проблема backlog integrity проявилась в процессе закрытия dossier work.

Предлагаемое изменение:

В cross-skill guidance добавить:

- после `dossier-engineer` lifecycle actualization агент запускает scoped backlog status / refresh;
- closure не считается clean, если applied registry ссылается на отсутствующие canonical artifacts;
- dossier log фиксирует результат backlog integrity check как external system state, а не как commit SHA validity.

Прямой эффект:

Backlog replay safety станет частью фактического completion gate для задач, которые меняют backlog.

Косвенный эффект:

Задачи без backlog mutation не будут платить эту цену, если scope check явно показывает, что backlog artifacts не менялись.

## P4. Уточнить cleanup hygiene

Проблема:

Агенту нужен безопасный критерий, какие backlog files можно удалять.

Предлагаемое изменение:

Добавить правило:

- before deleting any file under backlog artifacts, inspect whether it is referenced from applied registry, source registry, packet registry, dependency graph, or item metadata;
- referenced files are not cleanup candidates;
- drafts, temporary reports and failed authored inputs may be cleanup candidates only if no canonical registry references them.

Прямой эффект:

Снизится риск случайно удалить replay-critical file.

Косвенный эффект:

Агенты будут реже делать агрессивные cleanup-патчи внутри `.backlog`.

## Что не менять

- Не использовать commit SHA как критерий валидности backlog.
- Не считать отсутствие canonical artifact нормальным, если registry на него ссылается.
- Не предлагать ручное редактирование `.backlog/applied.json` как штатный путь исправления.

## Предпочтительный порядок реализации

1. Обновить command reference и `SKILL.md` по retention contract.
2. Добавить output fields для patch commands.
3. Добавить integrity signal в status / refresh.
4. Добавить тесты на missing canonical patch artifact.
5. Обновить cross-skill handoff с `dossier-engineer`.
