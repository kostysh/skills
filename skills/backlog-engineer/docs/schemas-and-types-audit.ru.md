# Внешний аудит `schemas-and-types.ru.md`

Статус: PASS

Проверяемый документ: `skills/backlog-engineer/docs/schemas-and-types.ru.md`

Source of truth по intent и scope:

- `skills/backlog-engineer/docs/process-cli.ru.md`
- `skills/backlog-engineer/docs/utility-spec.ru.md`

Итог: документ в текущей ревизии implementation-ready. Blocking issues не обнаружены.

## Blocking findings

Нет.

## Non-blocking findings

### N1. `PacketContext` фиксирует `target_system` и `as_built` как обязательные поля, хотя `process-cli.ru.md` описывает их как опциональные

Где:

- `schemas-and-types.ru.md:297-301`
- `process-cli.ru.md:235-236`

Почему это non-blocking:

- examples packet shape в source docs всё равно показывают эти поля присутствующими как пустые массивы;
- packet template и canonical shape могут безопасно продолжать materialize-ить их всегда;
- но если реализация захочет принимать authored packet без этих полей, текущий type/schema contract окажется чуть строже source prose.

Что улучшить:

- либо явно зафиксировать, что authored packet normalizes missing `target_system` / `as_built` в пустые массивы до exact validation;
- либо развести authored-input schema и canonicalized internal packet type.

### N2. Правило синхронного порядка `attention_reason_codes` / `attention_reasons` явно зафиксировано для `StateItem`, но не повторено для внешних DTO, которые возвращают те же пары массивов

Где:

- `schemas-and-types.ru.md:622-626`
- `schemas-and-types.ru.md:722-730`
- `schemas-and-types.ru.md:968-978`
- `schemas-and-types.ru.md:1023-1029`
- `process-cli.ru.md:813-827`
- `process-cli.ru.md:1109-1113`
- `utility-spec.ru.md:911-928`

Почему это non-blocking:

- target doc уже фиксирует правильное правило для state layer;
- shapes внешних DTO согласованы с source of truth;
- implementer с высокой вероятностью унаследует то же правило во всех read-моделях.

Что улучшить:

- добавить короткое общее правило рядом с `ItemComputedState` или в разделе common response helpers:
  `attention_reason_codes` и `attention_reasons` всегда должны иметь одинаковую длину и одинаковый порядок.
