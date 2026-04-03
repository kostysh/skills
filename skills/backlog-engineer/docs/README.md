# Документы по утилите `@kostysh/backlog-engineer-cli`

Эта папка содержит рабочий комплект документов для проектирования и реализации утилиты `backlog-engineer`.

Документы расположены по слоям:

1. Концепция и UX
2. Полная спецификация поведения
3. Строгие схемы и типы
4. Интерфейсы модулей
5. Тестовый контракт

## Состав папки

| Файл | Назначение | Когда читать |
| --- | --- | --- |
| [process-cli.ru.md](process-cli.ru.md) | Базовая концепция утилиты и CLI UX. Описывает операторский и агентский workflow, команды, правила `packet` vs `patch`, модель backlog-директории и ожидаемое поведение без углубления во внутреннюю реализацию. | Читать первым. Это главный источник истины по продуктовой логике и UX. |
| [utility-spec.ru.md](utility-spec.ru.md) | Полная спецификация утилиты. Описывает внутренние артефакты, алгоритмы команд, recovery/rebuild, derived state, error taxonomy и runtime behavior. | Читать после концепции, когда нужно проектировать реализацию. |
| [schemas-and-types.ru.md](schemas-and-types.ru.md) | Строгие схемы и exact types для `zod@v4` и TypeScript. Включает authored packet/patch, utility-owned artifacts, command DTOs и error payload. | Читать при реализации `schemas`, `errors`, DTO и parser/validator слоёв. |
| [module-interfaces.ru.md](module-interfaces.ru.md) | Контракты верхнеуровневых модулей и внутренних сервисов. Фиксирует `src/`-структуру, порты среды, ownership артефактов и test seams. | Читать перед проектированием модулей и unit-тестов. |
| [test-matrix.ru.md](test-matrix.ru.md) | Матрица тестов. Описывает обязательные уровни тестирования, набор фикстур, инварианты и минимальное покрытие по командам, модулям и recovery-сценариям. | Читать перед началом имплементации тестов и при проверке покрытия. |

## Рекомендуемый порядок чтения

### Если нужно понять, что это за утилита

1. [process-cli.ru.md](process-cli.ru.md)
2. [utility-spec.ru.md](utility-spec.ru.md)

### Если нужно проектировать код

1. [process-cli.ru.md](process-cli.ru.md)
2. [utility-spec.ru.md](utility-spec.ru.md)
3. [schemas-and-types.ru.md](schemas-and-types.ru.md)
4. [module-interfaces.ru.md](module-interfaces.ru.md)

### Если нужно проектировать тесты

1. [test-matrix.ru.md](test-matrix.ru.md)
2. [schemas-and-types.ru.md](schemas-and-types.ru.md)
3. [module-interfaces.ru.md](module-interfaces.ru.md)

## Границы этой папки

- Здесь лежат именно документы по утилите.
- Канонический runtime contract для агента лежит в [SKILL.md](../SKILL.md).
- Примеры шаблонов и runtime assets лежат в [assets/](../assets/).
- Реальные test fixtures лежат в [test/fixtures/](../test/fixtures/README.md).

## Как поддерживать документы в актуальном состоянии

- Изменение CLI UX сначала отражается в [process-cli.ru.md](process-cli.ru.md), затем ниже по стеку.
- Изменение runtime behavior или артефактов должно отражаться в [utility-spec.ru.md](utility-spec.ru.md).
- Изменение shape данных должно отражаться в [schemas-and-types.ru.md](schemas-and-types.ru.md).
- Изменение модульной границы должно отражаться в [module-interfaces.ru.md](module-interfaces.ru.md).
- Изменение coverage expectations должно отражаться в [test-matrix.ru.md](test-matrix.ru.md).
