# Удаление compatibility из исходников скилов

Запрос оператора от 2026-10-21: удалить поле из всех скилов репозитория через исходники, сохранить остальные инструкции, перегенерировать, проверить и довести до интеграции. Отдельные issue и plan не создавались: scope и публикация заданы прямым поручением. Разрешение на независимых агентов из текущей задачи сохраняется для обязательного аудита.

Baseline: `01c662e836f5bdf2adecbd7e56e6dd043f01f3f8`. Worktree: `.worktrees/remove-compatibility`; ветка `codex/remove-skill-compatibility`. Основной checkout и чужие worktrees не используются для реализации.

## Причина, scope и сохранённый контракт

Системный `skill-creator/scripts/quick_validate.py` не допускает top-level `compatibility`. До изменения он отклоняет 14 из 37 скилов; остальные 23 проходят. Компилятор допускает optional metadata и поэтому выдавал пакеты, несовместимые с этим validator. [Все исходные результаты](evidence/remove-compatibility-20261021/baseline-validation.json).

У всех 14 целей есть `skill.yaml`. Текст `skill.compatibility` без изменения содержания перенесён первым пунктом в существующий `sections.portability.rules`; поле удалено. Остальные поля, зависимости, active references, runtime, workflows, triggers и инструкции сохраняются. Skill content versions увеличены на patch; runtime/package version не меняется. Схема и runtime компилятора не меняются: задача касается использования поля в существующих скилах, а не удаления поддержки optional field из языка компилятора. Исторические evidence не переписываются.

[Точный перечень, прежний текст, версии, hashes и source inventory](evidence/remove-compatibility-20261021/source-transformation.json). Перечень охватывает все 37 непосредственных skill roots в `skills/`; системные и plugin skills вне этого репозитория не входят в scope.

## Авторская проверка перед генерацией

Результат: `ready-to-regenerate` для всех 14 целей. Consumer — загрузчик/validator пакета и агент, читающий инструкции. Проверяемый результат — отсутствие ключа в source/emitted frontmatter при сохранении прежних инструкций и объявленных требований среды. Требования сохранены внутри папки скила; новых references, triggers, gates, команд, runtime или зависимостей нет.

Parsed source comparison разрешает только удаление поля, точный перенос текста и patch version. После генерации отдельное сравнение должно восстановить прежнее тело SKILL.md побайтово после удаления перенесённого пункта. Проверки: creator validation для всех 37 целей; compiler lint/regenerate/check для изменённых 14; isolated compile/readback, сохранность всех остальных файлов и общая обязательная suite.

Слепые поведенческие пробы не повторяются: перенос не вводит новых решений или требований; текст и прежнее тело сохраняются точно. Это обоснование относится только к metadata relocation, не заявляет новую способность, natural activation или универсальную корректность скилов. Независимый `skill-reviewer` должен оценить сохранность и достаточность такой границы.

## Выполнение, проверки и независимая оценка

Генерация выполнена для всех 14 целей. Все 37 `SKILL.md` проходят `quick_validate.py`; ключ отсутствует во всех 37 `skill.yaml` и frontmatter. Для каждой изменённой цели успешно выполнены `lint → regenerate → check`, isolated compile и check/creator validation отдельного пакета. Все declared package files совпали с источниками; emitted compiler CLI выполняет help и проверяет свой отдельный пакет, его runtime и package.json не менялись.

[Raw команды, stdout/stderr и exit codes](evidence/remove-compatibility-20261021/commands.json), [проверка сохранности](evidence/remove-compatibility-20261021/preservation.json). После исключения единственного перенесённого пункта прежнее тело каждого SKILL.md совпадает побайтово. Parsed source сравнен независимо от форматирования; кроме удаления поля, переноса текста и patch версии изменений нет.

Обязательный `pnpm test:ci`: **110/110**, exit 0, fail 0. [Полный вывод](evidence/remove-compatibility-20261021/candidate-tests.txt) и [параметры запуска](evidence/remove-compatibility-20261021/test-result.json). Node 24.15.0 локально; GitHub workflow использует Node 22 и проверяется отдельно перед merge. Fresh worktree установлен с frozen lockfile; pnpm 10.28.2 использовал временные task-specific cache/store, предупреждение ignored esbuild script не потребовало смены настроек.

В generated compile reports сохранены прежние advisory size warnings у architecture-engineer и delivery-planner; число байтов уменьшилось, размерные пороги не менялись. Это warnings, не FAIL; они не связаны с удалённым ключом и не дают основания менять остальные инструкции.

[Стабильный snapshot](evidence/remove-compatibility-20261021/snapshot.json): 168 active/source/generated-report файлов, SHA-256 `4e7e3ab707b2529316f90ae13f10c78e43edddcc2aa3b971f402ca7c17dfa76b`. Supporting журналы, navigation и новые reports не входят в snapshot. После freeze active/source не меняется. [Независимый change review](evidence/remove-compatibility-20261021/independent-review.md): **PASS**, assurance `independent`, P1/P2/P3 findings отсутствуют. Аудитор `/root/audit_compatibility_removal` не участвовал в авторстве, сам повторил baseline/candidate/emitted creator validation, восстановил прежнее тело 14 SKILL.md и сверил все 222 emitted файла. Он подтвердил обоснованность пропуска новых blind trials в ограниченной metadata relocation. Общая способность скилов, natural activation и все host loaders этим verdict не подтверждаются. Файл отчёта и финализация supporting записей не входят в frozen active/source hash. Root подтвердил baseline по Git и неизменность 168 candidate файлов после получения отчёта; findings для remediation не возникли.

[Проверка navigation](evidence/remove-compatibility-20261021/navigation-check.json): все 50 добавленных локальных ссылок разрешаются. Две прежние broken links в payload/docs/README.md и payload-migration/docs/README.md подтверждены в baseline и сохранены: они не входят в metadata delta и не меняют проверенный пакет.

## Побочные эффекты и интеграция

Отклонений от прямого scope нет. Производственные системы, runtime и зависимости не изменяются. Откат ограничивается коммитом этой миграции. Commit/push/PR, CI на точном head, merge и локальная синхронизация разрешены поручением; выполняются после обязательных проверок и независимого verdict. Промежуточный статус реализации не означает завершение интеграции.

## Итог реализации

Удаление поля и сохранность инструкций проверены; независимая приёмка завершена. Следующий разрешённый шаг — коммит одной атомарной миграции, публикация PR, CI на точном head, merge и local sync. Состояние доставки подтверждается отдельными GitHub/Git readback, не этим pre-merge record.
