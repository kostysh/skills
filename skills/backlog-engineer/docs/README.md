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
| [implementation-plan.ru.md](implementation-plan.ru.md) | Детальный инженерный план реализации. Описывает полный definition of done, порядок сборки системы по зависимостям модулей, work packages и критерии завершения без скрытых упрощений. | Читать перед началом кодирования и использовать как execution plan. |
| [implementation-log-1.ru.md](implementation-log-1.ru.md) | Исторический лог: базовая имплементация, ранний follow-up цикл и первые corrective changes. Фиксирует исходные work packages, ключевые инженерные решения, результаты внешнего ревью и связь с коммитами. | Читать при восстановлении контекста по основной истории реализации утилиты. |
| [implementation-log-2.ru.md](implementation-log-2.ru.md) | Отдельный лог текущего follow-up цикла. Фиксирует последние UX/runtime/doc улучшения и их review trail без смешивания со старой историей. | Читать при восстановлении контекста по последнему циклу доработок. |
| [ux-followup-plan.ru.md](ux-followup-plan.ru.md) | План follow-up изменений после real-world UX feedback. Фиксирует, какие проблемы нужно исправить в `SKILL.md`, runtime, references и нормативных документах, в каком порядке и по каким критериям закрытия. | Читать перед началом post-implementation UX/hardening цикла. |
| [ux-followup-implementation-plan.ru.md](ux-followup-implementation-plan.ru.md) | Детальный execution plan follow-up исправлений после real-world UX feedback. Разбивает remediation на конкретные пакеты изменений, файлы, acceptance и порядок выполнения. | Читать перед началом follow-up имплементации, если нужен уже не анализ, а пошаговый план изменений. |
| [utility-spec.ru.md](utility-spec.ru.md) | Полная спецификация утилиты. Описывает внутренние артефакты, алгоритмы команд, recovery/rebuild, derived state, error taxonomy и runtime behavior. | Читать после концепции, когда нужно проектировать реализацию. |
| [schemas-and-types.ru.md](schemas-and-types.ru.md) | Строгие схемы и exact types для `zod@v4` и TypeScript. Включает authored packet/patch, utility-owned artifacts, command DTOs и error payload. | Читать при реализации `schemas`, `errors`, DTO и parser/validator слоёв. |
| [module-interfaces.ru.md](module-interfaces.ru.md) | Контракты верхнеуровневых модулей и внутренних сервисов. Фиксирует `src/`-структуру, порты среды, ownership артефактов и test seams. | Читать перед проектированием модулей и unit-тестов. |
| [test-matrix.ru.md](test-matrix.ru.md) | Матрица тестов. Описывает обязательные уровни тестирования, набор фикстур, инварианты и минимальное покрытие по командам, модулям и recovery-сценариям. | Читать перед началом имплементации тестов и при проверке покрытия. |

## Рекомендуемый порядок чтения

### Если нужно понять, что это за утилита

1. [process-cli.ru.md](process-cli.ru.md)
2. [utility-spec.ru.md](utility-spec.ru.md)
3. [implementation-plan.ru.md](implementation-plan.ru.md)

### Если нужно проектировать код

1. [process-cli.ru.md](process-cli.ru.md)
2. [implementation-plan.ru.md](implementation-plan.ru.md)
3. [implementation-log-1.ru.md](implementation-log-1.ru.md)
4. [implementation-log-2.ru.md](implementation-log-2.ru.md)
4. [ux-followup-plan.ru.md](ux-followup-plan.ru.md)
5. [ux-followup-implementation-plan.ru.md](ux-followup-implementation-plan.ru.md)
6. [utility-spec.ru.md](utility-spec.ru.md)
7. [schemas-and-types.ru.md](schemas-and-types.ru.md)
8. [module-interfaces.ru.md](module-interfaces.ru.md)

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
- Ход базовой реализации и исходные work packages фиксируются в [implementation-log-1.ru.md](implementation-log-1.ru.md).
- Пост-имплементационные follow-up доработки фиксируются в [implementation-log-2.ru.md](implementation-log-2.ru.md).
- Изменение runtime behavior или артефактов должно отражаться в [utility-spec.ru.md](utility-spec.ru.md).
- Изменение shape данных должно отражаться в [schemas-and-types.ru.md](schemas-and-types.ru.md).
- Изменение модульной границы должно отражаться в [module-interfaces.ru.md](module-interfaces.ru.md).
- Изменение coverage expectations должно отражаться в [test-matrix.ru.md](test-matrix.ru.md).
