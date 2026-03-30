# Реестр проблемных изменений `architecture-backlog-engineer`

Дата фиксации: 2026-03-30

Этот документ фиксирует текущую классификацию всех незакоммиченных изменений относительно `HEAD` в репозитории `/home/kostysh/.codex/skills/custom`.

Статусы:

- `wrong` — изменение противоречит исходной методике, роли утилиты или operator/runtime contract.
- `suspicious` — изменение потенциально может быть полезным, но сейчас не может считаться доверенным без повторной проверки от исходной методики.
- `safe` — подтверждённо корректное изменение. На текущем шаге таких файлов не зафиксировано.

## Рабочие правила до очистки

До отдельного решения по каждому изменению действуют следующие правила:

1. Все файлы со статусом `wrong` считаются недоверенным слоем и не используются как источник истины.
2. Текущие `SKILL.md`, `references/standard.md`, `docs/operator-use-cases.ru.md`, `docs/operator-ux-remediation-spec.ru.md`, `docs/operator-ux-remediation-implementation-plan.ru.md` и `test/cli.test.mjs` не используются как основание для интерпретации методики или роли CLI.
3. Источником исходной методики и исходной роли утилиты считается только `HEAD` до незакоммиченных правок.

## Сводка

| Статус | Количество |
| --- | ---: |
| `wrong` | 6 |
| `suspicious` | 18 |
| `safe` | 0 |

## Реестр

| Файл | Статус | Основание |
| --- | --- | --- |
| `SKILL.md` | `wrong` | Встроен ложный operator contract, раздут help/workflow surface и искажена граница между агентом и CLI. |
| `references/standard.md` | `wrong` | В нормативную методику внесён выдуманный extraction/edit contract, включая `source-only discovery` и packet CRUD semantics. |
| `docs/operator-use-cases.ru.md` | `wrong` | Новый operator-facing help закрепляет ложную модель create/edit workflows как будто `discover` напрямую обслуживает prose-источники. |
| `docs/operator-ux-remediation-spec.ru.md` | `wrong` | Спецификация построена поверх ошибочной extraction-модели и ложного operator-facing contract. |
| `docs/operator-ux-remediation-implementation-plan.ru.md` | `wrong` | План реализует ту же ложную модель и не может считаться надёжным источником дальнейших изменений. |
| `test/cli.test.mjs` | `wrong` | Тестовый слой закрепляет ложный contract и синхронизирует help/docs/runtime wording вокруг неверной модели. |
| `references/artifact-model.md` | `suspicious` | Auto-render и journal-lineage additions могут быть полезны, но не проверены отдельно от ошибочного contract layer. |
| `scripts/architecture-backlog.mjs` | `suspicious` | Generated artifact собран из подозрительного source tree и не может рассматриваться как источник истины. |
| `scripts/architecture-backlog.mjs.map` | `suspicious` | Производный build artifact от подозрительного runtime. |
| `src/cli.ts` | `suspicious` | Здесь смешаны потенциально полезные UX-изменения и contract-layer сдвиги; доверять без повторной базировки нельзя. |
| `src/discovery/bundle-repair.ts` | `suspicious` | Новые manifest-поля и repair-surface завязаны на новую drift model, которая пока не подтверждена. |
| `src/discovery/common.ts` | `suspicious` | Schema расширен под fixed stats, readiness и stale reviews; изменения могут быть верными, но сейчас не верифицированы от исходного метода. |
| `src/discovery/delta-run.ts` | `suspicious` | Human-readable delta и baseline projection выглядят осмысленно, но пришли из уже искажённого contract layer. |
| `src/discovery/discover-run.ts` | `suspicious` | Command lifecycle и auto-render changes сами по себе не доказывают ложь, но теперь завязаны на новые assumptions. |
| `src/discovery/drift-state.ts` | `suspicious` | Новая модель linkage/drift требует отдельной переоценки относительно исходной методики. |
| `src/discovery/init-run.ts` | `suspicious` | Изменён lifecycle init; пока не подтверждено, что он соответствует исходной роли утилиты. |
| `src/discovery/rebaseline-run.ts` | `suspicious` | Readiness, lineage и baseline semantics могут быть ценными, но пока не очищены от ложного contract pressure. |
| `src/discovery/render-views.ts` | `suspicious` | Новый read model может быть полезен частично, но он downstream от ошибочного operator spec. |
| `src/discovery/repair-run.ts` | `suspicious` | Lifecycle/output changes нуждаются в повторной верификации от исходной модели. |
| `src/discovery/roadmap-matrix.ts` | `suspicious` | Файл затронут в контексте нового operator/report contract и ещё не проверен отдельно. |
| `src/discovery/source-runtime.ts` | `suspicious` | Базовый packet parser существовал и раньше, но новые provenance/source_id restrictions опираются на ошибочно зафиксированную contract-модель. |
| `src/discovery/status-run.ts` | `suspicious` | Новый block order и metrics surface выглядят разумно, но не очищены от ложного contract pressure. |
| `src/discovery/validate-run.ts` | `suspicious` | Крупнейший слой новой логики; сейчас недоверенный из-за опоры на remediation contract. |
| `src/discovery/command-lineage.ts` | `suspicious` | Полностью новый subsystem; без повторного разбора считать корректным нельзя. |

## Важное замечание

На этом шаге не зафиксировано ни одного файла со статусом `safe`.

Это не означает, что все кодовые изменения обязательно неверны. Это означает только то, что после искажения operator/runtime contract ни одно изменение нельзя считать доверенным без повторной проверки относительно исходной методики и исходной роли CLI.
