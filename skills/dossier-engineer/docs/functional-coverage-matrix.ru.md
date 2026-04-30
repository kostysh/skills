# Матрица покрытия функций исходного процесса

Документ не является частью активной методики скила. Он фиксирует проектное решение: какие функции исходного `unified-dossier-engineer` сохранены, изменены или удалены в `dossier-engineer`, а также какие функции добавлены для защиты продуктовой способности.

Обозначения:

- `Да` — функция сохранена.
- `Изменено` — смысл сохранён, механизм изменён.
- `Нет` — функция удалена.
- `Добавлено` — новая функция.

## 1. Source of truth и source governance

| Функция | В новом скиле | Обоснование |
|---|---:|---|
| Source registry | Изменено | Central JSON заменён отдельными `SRC-*.md` artifacts. |
| Source ID | Да | Stable source linking сохранён. |
| Source path tracking | Да | `source_path` хранится в source artifact. |
| Source kind/authority | Да | Enums сохранены и расширены. |
| Source hash tracking | Да | `source refresh` пересчитывает hashes. |
| Source-review при изменении источника | Да | `SR-*.md` blocks affected readiness. |
| Source impact | Да | Теперь impact включает capabilities and work items. |
| Automatic mass mutation of linked items | Нет | Derived impact безопаснее для parallel branches. |

## 2. Capability governance

| Функция | В новом скиле | Обоснование |
|---|---:|---|
| Capability layer | Добавлено | Отделяет продуктовую способность от задач и инфраструктуры. |
| Capability records `CAP-*.md` | Добавлено | Позволяют фиксировать observable behavior независимо от work items. |
| Capability claim | Добавлено | Прямо задаёт actor, trigger, response, state/effect, continuity. |
| Delivery kind | Добавлено | Разделяет `capability`, `support`, `maintenance`, `exploration`. |
| Anti-claims | Добавлено | Снижает риск implicit overclaiming and self-deception. |
| Behavioral demo gate | Добавлено | Capability work cannot close on infrastructure evidence only. |
| Concept-conformance review | Добавлено | Проверяет корректность самой задачи относительно концепции. |
| Pre-implementation challenge | Добавлено | Агент обязан до реализации зафиксировать, как план может быть неверным. |
| Infrastructure masquerade detection | Добавлено | `capability check` flags support-only progress disguised as feature. |
| Guardrails / kill criteria | Добавлено | Останавливает накопление support work без product behavior. |

## 3. Existing project onboarding

| Функция | В новом скиле | Обоснование |
|---|---:|---|
| Start from already working project | Добавлено | Позволяет использовать досье для развития существующего продукта. |
| Baseline artifacts `BASE-*.md` | Добавлено | Фиксируют observed/assumed/unverified existing capabilities. |
| Existing capability evidence | Добавлено | `existing` capability требует demo/baseline evidence. |
| Artificial closed work items for historical work | Нет | Историческая работа не должна подделывать workflow. |
| Maintenance linked to existing capability | Добавлено | Fix/refactor work сохраняет связь с рабочим поведением. |

## 4. Backlog, work items and dependency graph

| Функция | В новом скиле | Обоснование |
|---|---:|---|
| Backlog truth layer | Да | Work items remain canonical `WI-*.md`. |
| Central backlog `state.json` | Нет | Главный источник merge conflicts. |
| Work item creation from sources | Изменено | Work derives from source + capability, not from source alone. |
| Dependencies | Да | `dependencies` в work item. |
| Reverse blocks | Изменено | Prefer derived reverse graph. |
| Queue computation | Да | Dependency-aware and capability-aware. |
| Attention list | Да | Includes guardrails and capability drift. |
| JSON packet/patch workflow | Нет | Runtime commands mutate Markdown/YAML artifacts directly. |
| Applied mutation registry | Нет | Removed to avoid central conflict surface. |
| Mutation lock | Нет | Parallel safety achieved through sharded artifacts. |

## 5. Dossier workflow stages

| Функция | В новом скиле | Обоснование |
|---|---:|---|
| `feature-intake` | Да | Now validates source + capability relation. |
| `spec-compact` | Да | Now requires behavior criteria/demo/anti-claims for capability work. |
| `plan-slice` | Да | Now requires pre-implementation challenge. |
| `implementation` | Да | Now requires behavioral evidence where applicable. |
| `change-proposal` | Да | Now also covers concept/capability drift. |
| Separate command per stage | Нет | Generic `stage start/ready/close` is simpler. |
| Mandatory micro-logging | Нет | Replaced by significant stage events. |
| Next-step resolver | Да | `next --work` preserved. |

## 6. Verification, audit and closure

| Функция | В новом скиле | Обоснование |
|---|---:|---|
| Coverage gate | Да | Still required. |
| Verification artifact | Да | `VER-*.md` preserved. |
| Review artifact | Да | `REV-*.md` preserved. |
| Spec conformance review | Да | Preserved. |
| Code review | Да | Preserved for code-bearing work. |
| Security review | Да | Preserved for risk-bearing work. |
| Concept-conformance review | Добавлено | Required for capability closure. |
| Behavioral verification | Добавлено | Required for capability/maintenance behavior. |
| Review freshness | Да | Based on material scope hash, now includes capability fields. |
| Post-close hygiene | Да | Includes capability and guardrail checks. |
| Mandatory external audit for every mutation | Изменено | Risk-weighted by default, strict mode available. |

## 7. Runtime and artifact mechanics

| Функция | В новом скиле | Обоснование |
|---|---:|---|
| Runtime-created artifacts | Да | Frontmatter is runtime-owned. |
| Manual frontmatter writing | Нет | Prevents protocol breakage. |
| Frontmatter lint | Да | `lint`. |
| Frontmatter repair | Да | `repair frontmatter`. |
| Markdown/YAML canonical storage | Да | Required. |
| JSON canonical storage | Нет | Removed. |
| Non-sequential IDs | Да | Required for parallel branches. |
| CLI next actions | Да | Required for every mutating command. |

## 8. Parallel development

| Функция | В новом скиле | Обоснование |
|---|---:|---|
| Parallel branch safety | Да | Core design. |
| Global lock file | Нет | Blocks parallel work. |
| Per-branch changeset | Да | `CS-*.md`. |
| Capability conflict resolution | Добавлено | Same capability conflicts are semantic product conflicts. |
| Baseline conflict handling | Добавлено | Existing-project onboarding can be parallelized safely by separate baselines. |
| Generated report commits by default | Нет | Avoid stale derived state. |

## 9. Retrospective analysis

| Функция | В новом скиле | Обоснование |
|---|---:|---|
| Session index JSONL | Нет | Removed. |
| Lifecycle telemetry | Изменено | Derived from artifacts. |
| Process misses | Да | Preserved. |
| Skill feedback | Да | Preserved. |
| Capability drift metrics | Добавлено | Tracks infrastructure masquerade and weak demos. |
| Support-to-capability ratio | Добавлено | Quantifies support accumulation risk. |
| Retrospective reports | Да | `retro create`. |

## 10. Удалённые функции

| Удалённая функция | Обоснование |
|---|---|
| JSON packet/patch workflow | Runtime commands are simpler and safer. |
| Central state snapshots | Conflict-prone and stale. |
| Mandatory micro-step logging | Too much overhead; significant events are enough. |
| Global mutation lock | Contradicts parallel development. |
| Global generated index as required artifact | Creates conflicts and stale truth. |
| Lifecycle refresh as separate required command | Runtime transitions and lint/status derivation are enough. |
