# Решение по восстановлению `architecture-backlog-engineer`

Дата фиксации: 2026-03-30

Этот документ фиксирует шаг 4 recovery-процедуры:

- для каждого блока из [suspicious-code-block-audit.ru.md](./suspicious-code-block-audit.ru.md)
  принято решение `keep / rewrite / drop`;
- решение опирается на сравнение с `HEAD`, а не на текущий недоверенный operator-facing contract;
- цель решения не “сохранить как можно больше”, а безопасно вернуть системе проверяемую границу истины.

## Принципы решения

1. Если блок превращает спорные assumptions в machine-checked truth, базовое решение — `drop`.
2. Если блок расширяет реальную роль CLI, но смешивает её с ложным нормативным смыслом, базовое решение — `rewrite`.
3. `keep` разрешён только там, где изменение можно защитить напрямую от исходного поведения в `HEAD` без опоры на новые docs/spec/tests.
4. Generated artifacts от недоверенного source tree не считаются источником истины и подлежат удалению или пересборке после очистки.

## Решения по блокам

| Блок | Решение | Почему |
| --- | --- | --- |
| `A. Source runtime и discover ingestion` | `rewrite` | Блок растёт из реальной старой роли CLI — packet parsing, source ingest, deterministic merge. Но поверх этого наложены новые provenance/source-id/merge-mode semantics, зафиксированные уже после искажения contract layer. |
| `B. Shared schema, validation и drift` | `drop` | Это крупнейший semantic gate. Он кодирует новую stale/readiness/delivery-source модель как машинную истину. Пока исходная методика не восстановлена, держать этот слой нельзя. |
| `C. CLI output и generated read model` | `drop` | Это operator-facing поверхность, напрямую обслуживающая уже признанный ложным contract. Даже полезные UX-идеи здесь встроены в недостоверную модель поведения. |
| `D. Lifecycle, repair, rebaseline и lineage` | `drop` | Это новый lifecycle/journal subsystem, тесно сцепленный с блоками `B` и `C`. Пока stale/readiness/render lineage не переобоснованы от `HEAD`, безопаснее убрать его полностью. |

## Обоснование по блокам

### A. Source runtime и discover ingestion -> `rewrite`

### Что подтверждено от `HEAD`

- В `HEAD` CLI уже умела:
  - читать source refs;
  - извлекать только machine-readable payload;
  - парсить JSON packet или fenced packet blocks;
  - merge-ить packets в `backlog.json`.
- Это подтверждается исходным поведением в:
  - `src/discovery/source-runtime.ts`
  - `src/discovery/discover-run.ts`

### Что добавлено поверх этого

- `packet_provenance`;
- `merge_mode`;
- жёсткая canonicalization `packet.source.source_id`;
- ограничение `replace_sections`;
- derived `source_id`/source-authority identity logic;
- `commandRunId` plumbing в discover path.

### Почему не `keep`

- Эти additions уже не просто “укрепляют parser”.
- Они навязывают новую packet governance model, которая была придумана уже после ложного раздувания роли CLI.
- Значит текущую реализацию нельзя принять как достоверную без переавторинга.

### Почему не `drop`

- В этом блоке лежит реальное ядро существующей утилиты.
- Полный откат блока к `HEAD` без повторного отбора приведёт к потере и genuine hardening, и фактического понимания того, как CLI работает с packets.

### Практическое решение

- Переписать блок от `HEAD` вверх.
- Оставить только то, что можно защитить от истинной роли CLI:
  - packet parsing;
  - source ingest;
  - deterministic merge;
  - безопасные integrity checks, если они нужны именно packet workflow, а не ложному operator contract.

## B. Shared schema, validation и drift -> `drop`

### Что видно по diff

- `common.ts`, `validate-run.ts`, `drift-state.ts` получили массивный semantic слой:
  - fixed `assessment.stats`;
  - `stale_review_artifacts`;
  - `rebaseline_readiness`;
  - issue-item linkage snapshots;
  - delivery evidence source constraints;
  - negative-scope restrictions;
  - new delta drift invalidation logic.

### Почему это нельзя сохранять сейчас

- Именно этот слой превращает assumptions в validator-enforced truth.
- Если assumptions ошибочны, система начинает “строго доказывать” ложь.
- Размер и сцепленность diff слишком велики для безопасного salvage-in-place.

### Почему решение именно `drop`, а не `rewrite`

- Для `rewrite` нужно уже знать, какая из новой семантики действительно соответствует исходной методике.
- Сейчас такой уверенности нет.
- Следовательно, минимально безопасный путь — удалить весь этот semantic gate до состояния `HEAD`, а затем возвращать нужные invariants отдельно и по одному.

### Практическое решение

- Откатить блок `B` к `HEAD`.
- После этого заново решить отдельными изменениями:
  - нужны ли fixed stats;
  - нужна ли stale review model;
  - нужна ли readiness model;
  - нужна ли issue-item linkage drift invalidation.

## C. CLI output и generated read model -> `drop`

### Что видно по diff

- Новый CLI output surface:
  - `Summary metrics`
  - `Rebaseline readiness`
  - `New stale since last change`
  - `Human-readable diff`
- Новый `report.md` shape:
  - `Item Summary Index`
  - `Item Detail Sections`
  - `Rebaseline Readiness`
  - `New Stale Since Last Change`
- Изменены help texts и render semantics.

### Почему это нельзя сохранять сейчас

- Это не нейтральный presentation layer.
- Он отвечает именно на тот набор operator questions, который уже зафиксирован ошибочно.
- Пока неверен сам contract, улучшенный output только делает ложную модель убедительнее.

### Почему решение именно `drop`

- Здесь нет необходимости salvage-ить слой “как есть”.
- После восстановления истинного operator contract этот output можно спроектировать заново, уже под реальные вопросы и реальные invariants.

### Практическое решение

- Откатить блок `C` к `HEAD`.
- Любые полезные элементы UI/read model возвращать только после очистки блока `B` и прояснения реальной роли CLI.

## D. Lifecycle, repair, rebaseline и lineage -> `drop`

### Что видно по diff

- Добавлены:
  - `commandRunId`;
  - `command-lineage.ts`;
  - baseline projection journaling;
  - stale snapshot lineage;
  - новые manifest fields для issue-item linkage;
  - новый journal contract вокруг mutating/recovery render.

### Почему это нельзя сохранять сейчас

- Этот блок не самостоятельный.
- Он обслуживает именно новую stale/readiness/render semantics из блоков `B` и `C`.
- Если `B` и `C` откатываются, текущий lifecycle/lineage слой теряет подтверждённый смысл.

### Почему решение именно `drop`

- Здесь нет устойчивого подмножества, которое можно принять без немедленного риска.
- Новая subsystem не существовала в `HEAD`, а её необходимость не доказана независимо от ошибочной remediation-модели.

### Практическое решение

- Откатить блок `D` к `HEAD`.
- Если потом действительно понадобится command grouping или lineage, вводить это отдельным, заново обоснованным change set.

## Отдельные файлы вне блочного решения

| Файл | Решение | Почему |
| --- | --- | --- |
| `scripts/architecture-backlog.mjs` | `drop` | Это generated artifact от недоверенного source tree. |
| `scripts/architecture-backlog.mjs.map` | `drop` | Производный build artifact, не подлежит ручному спасению. |
| `references/artifact-model.md` | `rewrite` | Может содержать полезные идеи, но сейчас зависит от тех же lifecycle/render assumptions, что и блоки `C/D`. |

## Итоговое решение

Консервативный путь восстановления:

1. `wrong`-слой не чинить, а считать подлежащим удалению/переписыванию от `HEAD`.
2. По `suspicious` code-surface принять следующий план:
   - блок `A` — `rewrite`;
   - блок `B` — `drop`;
   - блок `C` — `drop`;
   - блок `D` — `drop`.
3. Generated artifacts удалить и пересобирать только после очистки source tree.

Это решение специально выбрано как минимально рискованное.
Оно жертвует частью потенциально полезных изменений, но возвращает проверяемую основу: сначала восстановить истинную роль CLI, затем заново вводить только те улучшения, которые можно защитить от `HEAD` и от реального workflow.
