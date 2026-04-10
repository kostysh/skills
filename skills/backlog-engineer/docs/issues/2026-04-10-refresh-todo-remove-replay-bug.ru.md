# Bug Report: `remove_todo` для refresh-generated todo ломает replay/query path

Дата: `2026-04-10`
Компонент: `@kostysh/backlog-engineer-cli`
Область: `patch-item`, `status`, `attention`, `queue`, runtime state rebuild
Серьезность: высокая
Статус: resolved

## Кратко

Если:

1. выполнить `refresh`, чтобы утилита создала `review_source_change` / `review_dependency_change` todo;
2. прочитать актуальные `todo_id` из live state;
3. закрыть эти todo через `patch-item` с операцией `remove_todo`;

то `patch-item` может успешно отработать, но последующие query-команды (`status`, `attention`, `queue`) начинают падать с `BE_TODO_NOT_FOUND`.

Проблема не в том, что agent выдумал несуществующие `todo_id`. Эти `todo_id` реально существовали в persisted runtime state после `refresh`. Ошибка в том, что они не replay-safe для canonical rebuild path.

## Решение

Принят вариант `B` с recovery-guard для уже записанной истории:

- новые `patch-item remove_todo` операции для `managed_by = refresh` todo теперь fail-closed с `BE_TODO_REFRESH_MANAGED`;
- operator/agent получает hint: refresh-managed review todo очищаются повторным scoped `refresh`, когда их source/dependency cause больше не наблюдается;
- canonical rebuild стал tolerant к legacy patch history, где старый `remove_todo` уже ссылается на отсутствующий runtime todo, чтобы query-команды не падали на ранее повреждённых backlog root.

Покрытие:

- live `patch-item` reject для refresh-managed todo;
- hidden rebuild recovery для legacy bad patch.

## Operator / agent workflow rule

После этого бага agent должен различать `todo.managed_by` перед закрытием todo.

Правила:

- если `items` / `attention` показывает `todo.managed_by = "refresh"`, не закрывать такой todo через `patch-item remove_todo`;
- refresh-managed todo являются runtime review signals от `refresh`;
- после review такие todo очищаются повторным scoped `refresh`, когда причина больше не наблюдается;
- если review показал, что изменилась backlog truth, использовать `patch-item` только для фактической актуализации задачи: `delivery_state`, blockers/gaps, dependencies, context/source links и другие task fields;
- `patch-item remove_todo` допустим только для `managed_by = "mutation"` todo;
- если команда вернула `BE_TODO_REFRESH_MANAGED`, объяснить operator-у: этот todo создан `refresh`, поэтому закрывается не patch-ем, а повторным scoped `refresh` после проверки source/dependency cause;
- не редактировать вручную `.backlog/state.json` или `.backlog/applied.json`.

Практический flow:

1. Прочитать affected item через `items`.
2. Проверить `managed_by` у каждого todo.
3. Для `managed_by = "refresh"`: выполнить review, затем повторный scoped `refresh --source-id ...` / `refresh --source-path ...` / `refresh --item-key ...`.
4. Для `managed_by = "mutation"`: можно использовать `template patch` -> `patch-item` с `remove_todo`.
5. После этого проверить `status`, `attention` или `items`.

## Симптом

После успешного `patch-item` для `remove_todo`:

```json
{
  "error": {
    "code": "BE_TODO_NOT_FOUND",
    "message": "Todo was not found.",
    "details": {
      "item_key": "CF-001",
      "todo_id": "5d045dec-d70e-4896-ae84-d6a86975126e"
    }
  }
}
```

При этом в persisted `state.json` у item уже может быть:

- `open_todo_ids: []`
- `needs_attention: false`

То есть persisted snapshot выглядит очищенным, а query path ломается именно на rebuild/replay.

## Почему `todo_id` были валидными

Важно зафиксировать источник путаницы.

Эти `todo_id`:

- не были придуманы вручную;
- не были взяты из старого диффа;
- не были вытащены из authored patch;

а были созданы самой утилитой командой `refresh` и затем считаны из текущего live state через `items` / `attention`.

Иными словами:

1. `refresh` создал runtime `todo`;
2. agent прочитал их реальные `todo_id`;
3. `patch-item remove_todo` принял эти `todo_id` как существующие;
4. позднее query-команда на canonical rebuild не смогла replay-ить такой patch.

## Минимальный сценарий воспроизведения

### 1. Создать refresh-managed todo

В backlog root:

```bash
node <skill-root>/scripts/backlog-engineer.mjs refresh --source-id <source-id>
```

Ожидаемо:

- появляются `review_source_change` todo;
- `attention` и `items` показывают конкретные `todo_id`.

### 2. Прочитать реальные `todo_id`

Например:

```bash
node <skill-root>/scripts/backlog-engineer.mjs items --item-keys CF-001
```

Ожидаемо видно:

- `todo[].todo_id`
- `managed_by: "refresh"`

### 3. Закрыть эти todo через `patch-item`

Пример patch:

```json
{
  "metadata": {
    "patch_id": "repro-remove-refresh-todo",
    "created_at": "2026-04-10T11:15:00Z",
    "sequence": 999,
    "target_item_keys": ["CF-001"]
  },
  "operations": [
    {
      "item_key": "CF-001",
      "action": "remove_todo",
      "todo_ids": ["<real refresh todo id from items output>"]
    }
  ]
}
```

Применение:

```bash
node <skill-root>/scripts/backlog-engineer.mjs patch-item --patch <patch-path>
```

Ожидаемо сейчас:

- команда может вернуть success;
- `state.json` обновляется так, как будто todo закрыт.

### 4. Запустить query-команду

```bash
node <skill-root>/scripts/backlog-engineer.mjs status
```

Фактический результат:

- `BE_TODO_NOT_FOUND`

## Вероятная причина

Проблема выглядит как рассинхронизация между:

- persisted runtime state;
- canonical replay из packet/patch artifacts;
- и моделью refresh-managed todo.

Ключевой момент:

### `refresh`-todo живут как runtime metadata

В `rebuild-state.ts` runtime `todo` из текущего state не replay-ятся из canonical patch history. Они ретейнятся позже через `preserveRuntimeMetadata(...)`, если проходят `shouldRetainRuntimeTodo(...)`.

Релевантные места:

- `src/runtime/rebuild-state.ts`
- `preserveRuntimeMetadata(...)`
- `shouldRetainRuntimeTodo(...)`

### `patch-item remove_todo` replay-ится раньше

Canonical patch с `remove_todo` применяется во время rebuild раньше, чем runtime `refresh` todo возвращаются через `preserveRuntimeMetadata(...)`.

Релевантные места:

- `src/runtime/rebuild-state.ts`
- `applyPatchReplay(...)`
- `src/core/todo-service.ts#removeTodos`

### Следствие

Во время replay patch пытается удалить `todo_id`, которых в replay-state еще нет.

Именно поэтому:

- в live mutation path patch проходит;
- в последующем rebuild/query path тот же patch падает.

## Почему это опасно

Это не просто cosmetic issue.

Последствия:

- query-команды backlog root становятся неработоспособными;
- operator получает corrupted-looking backlog после формально успешного `patch-item`;
- persisted `state.json` и rebuild path расходятся по работоспособности;
- закрытие review-todo становится небезопасной операцией для refresh-managed state.

## Фактический кейс, на котором всплыло

Реальное воспроизведение произошло в backlog проекта `yaagi`:

- после `refresh` по `system.md`;
- после cleanup patch, закрывающего 72 review todo;
- canonical patch был записан успешно;
- далее `status`, `attention`, `queue` начали падать на `BE_TODO_NOT_FOUND`.

## Ожидаемое поведение

Нужно одно из согласованных поведений:

### Вариант A

`remove_todo` должен быть replay-safe и работать одинаково:

- и на live mutation path;
- и на canonical rebuild path.

### Вариант B

Если refresh-managed todo по модели утилиты не считаются canonical replay inputs, тогда `patch-item` должен reject-ить попытку закрыть их через `remove_todo` сразу на mutation path с явной ошибкой и подсказкой про supported workflow.

Главное:

- нельзя принимать patch как успешный, если потом query path становится невалидным.

## Гипотезы по исправлению

Ниже не готовое решение, а возможные направления.

### 1. Развести типы todo по поддержанным lifecycle path

Если `managed_by: "refresh"` не должны закрываться через canonical patch history, это должно быть жестко запрещено в semantic validation `patch-item`.

### 2. Сделать `remove_todo` replay-aware

Если такие todo должны закрываться patch-ом, тогда rebuild path должен материализовать релевантные runtime todo до replay `remove_todo`, либо иначе обеспечивать их наличие в canonical replay model.

### 3. Добавить отдельную operator command

Например, отдельный `ack-attention` / `review-items` workflow, который:

- работает не как generic canonical patch;
- а как осознанное подтверждение review для utility-managed todo.

## Что важно покрыть тестами

Нужны recovery/state-transition tests на сценарий:

1. `refresh` создает `managed_by: "refresh"` todo;
2. agent читает реальные `todo_id`;
3. `patch-item remove_todo` закрывает эти todo;
4. `status`, `attention`, `queue` продолжают работать;
5. hidden maintenance rebuild дает то же состояние без `BE_TODO_NOT_FOUND`.

Отдельно нужен negative test, если поддерживаемое поведение будет не `A`, а `B`:

- `patch-item` должен fail-closed на попытке закрыть replay-unsafe refresh todo.

## Non-goal

Этот issue не про ручную правку `state.json` / `applied.json`.

Наоборот, кейс важен именно потому, что operator/agent действовал только через поддержанные команды утилиты:

- `refresh`
- `items`
- `patch-item`
- `status`

и все равно получил сломанный query path.
