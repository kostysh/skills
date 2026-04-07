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
| [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md) | Детальный инженерный план базовой реализации. Описывает полный definition of done, порядок сборки системы по зависимостям модулей, work packages и критерии завершения без скрытых упрощений. | Читать перед началом основной имплементации и использовать как execution plan. |
| [implementation-log-1.ru.md](implementation-log-1.ru.md) | Исторический лог: базовая имплементация, ранний follow-up цикл и первые corrective changes. Фиксирует исходные work packages, ключевые инженерные решения, результаты внешнего ревью и связь с коммитами. | Читать при восстановлении контекста по основной истории реализации утилиты. |
| [implementation-log-2.ru.md](implementation-log-2.ru.md) | Лог основного follow-up цикла после базовой имплементации. Фиксирует UX/runtime/doc улучшения `S1-S4` без смешивания с базовой историей. | Читать при восстановлении контекста по основному follow-up циклу. |
| [implementation-log-3.ru.md](implementation-log-3.ru.md) | Лог финального corrective pass. Фиксирует последние doc-only доработки `S5-S6` после post-refactor review. | Читать при восстановлении контекста по самому последнему корректирующему циклу. |
| [implementation-log-4.ru.md](implementation-log-4.ru.md) | Лог corrective pass по source-set discovery. Фиксирует отдельный цикл `S8-S9`, который закрывает early packet authoring и обязательный архитектурный source set. | Читать при восстановлении контекста по source-set corrective cycle. |
| [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md) | План follow-up изменений после real-world UX feedback. Фиксирует, какие проблемы нужно исправить в `SKILL.md`, runtime, references и нормативных документах, в каком порядке и по каким критериям закрытия. | Читать перед началом post-implementation UX/hardening цикла. |
| [refactoring-plan-3.ru.md](refactoring-plan-3.ru.md) | Детальный execution plan follow-up исправлений после real-world UX feedback. Разбивает remediation на конкретные пакеты изменений, файлы, acceptance и порядок выполнения. | Читать перед началом follow-up имплементации, если нужен уже не анализ, а пошаговый план изменений. |
| [refactoring-plan-4.ru.md](refactoring-plan-4.ru.md) | Маленький corrective plan после post-refactor review. Закрывает два remaining first-run defects: local invocation contract и единый blocking preflight question. | Читать перед последним коротким doc-only corrective pass. |
| [refactoring-plan-5.ru.md](refactoring-plan-5.ru.md) | Маленький corrective plan на source-set discovery. Закрывает оставшийся defect, где агент может рано перейти к packet authoring и пропустить ADR, concept и другие обязательные архитектурные входы. | Читать перед корректировкой first-run source discovery contract. |
| [utility-spec.ru.md](utility-spec.ru.md) | Полная спецификация утилиты. Описывает внутренние артефакты, алгоритмы команд, recovery/rebuild, derived state, error taxonomy и runtime behavior. | Читать после концепции, когда нужно проектировать реализацию. |
| [schemas-and-types.ru.md](schemas-and-types.ru.md) | Строгие схемы и exact types для `zod@v4` и TypeScript. Включает authored packet/patch, utility-owned artifacts, command DTOs и error payload. | Читать при реализации `schemas`, `errors`, DTO и parser/validator слоёв. |
| [module-interfaces.ru.md](module-interfaces.ru.md) | Контракты верхнеуровневых модулей и внутренних сервисов. Фиксирует `src/`-структуру, порты среды, ownership артефактов и test seams. | Читать перед проектированием модулей и unit-тестов. |
| [test-matrix.ru.md](test-matrix.ru.md) | Матрица тестов. Описывает обязательные уровни тестирования, набор фикстур, инварианты и минимальное покрытие по командам, модулям и recovery-сценариям. | Читать перед началом имплементации тестов и при проверке покрытия. |

## Рекомендуемый порядок чтения

### Если нужно понять, что это за утилита

1. [process-cli.ru.md](process-cli.ru.md)
2. [utility-spec.ru.md](utility-spec.ru.md)
3. [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md)

### Если нужно проектировать код

1. [process-cli.ru.md](process-cli.ru.md)
2. [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md)
3. [implementation-log-1.ru.md](implementation-log-1.ru.md)
4. [implementation-log-2.ru.md](implementation-log-2.ru.md)
5. [implementation-log-3.ru.md](implementation-log-3.ru.md)
6. [implementation-log-4.ru.md](implementation-log-4.ru.md)
7. [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md)
8. [refactoring-plan-3.ru.md](refactoring-plan-3.ru.md)
9. [refactoring-plan-4.ru.md](refactoring-plan-4.ru.md)
10. [refactoring-plan-5.ru.md](refactoring-plan-5.ru.md)
11. [utility-spec.ru.md](utility-spec.ru.md)
12. [schemas-and-types.ru.md](schemas-and-types.ru.md)
13. [module-interfaces.ru.md](module-interfaces.ru.md)

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
- Основной post-implementation follow-up цикл фиксируется в [implementation-log-2.ru.md](implementation-log-2.ru.md).
- Последний corrective pass фиксируется в [implementation-log-3.ru.md](implementation-log-3.ru.md).
- Source-set corrective pass фиксируется в [implementation-log-4.ru.md](implementation-log-4.ru.md).
- Изменение runtime behavior или артефактов должно отражаться в [utility-spec.ru.md](utility-spec.ru.md).
- Изменение shape данных должно отражаться в [schemas-and-types.ru.md](schemas-and-types.ru.md).
- Изменение модульной границы должно отражаться в [module-interfaces.ru.md](module-interfaces.ru.md).
- Изменение coverage expectations должно отражаться в [test-matrix.ru.md](test-matrix.ru.md).
