# Спецификация устранения UX-проблем `architecture-backlog-engineer`

## 1. Назначение

Этот документ переводит решения, зафиксированные в [operator-use-cases.ru.md](./operator-use-cases.ru.md), в детальную спецификацию для методики, CLI, канонической модели, generated views и operator-facing документации.

Цель изменений: сделать operator-facing слой скила предсказуемым, самодокументируемым и пригодным для machine-check без необходимости читать код утилиты.

## 2. Источники истины для этой спецификации

- operator-facing сценарии и gap-анализ: `docs/operator-use-cases.ru.md`
- контракт скила: `SKILL.md`
- нормативная методика: `references/standard.md`
- модель артефактов run: `references/artifact-model.md`
- текущая CLI и каноническая модель:
  - `src/cli.ts`
  - `src/discovery/common.ts`
  - `src/discovery/source-runtime.ts`
  - `src/discovery/drift-state.ts`
  - `src/discovery/validate-run.ts`
  - `src/discovery/render-views.ts`
  - `src/discovery/discover-run.ts`
  - `src/discovery/delta-run.ts`
  - `src/discovery/rebaseline-run.ts`

## 3. Границы решения

В scope входят:

- operator-facing help и prompt workflows;
- agent-facing правила извлечения данных из источников и packet-authoring;
- CLI-контракт для `discover`, `repair`, `validate`, `delta`, `rebaseline`, `status`, `render`;
- изменения канонической модели, которые действительно нужны для новых operator-facing ответов;
- изменения `report.md`;
- тестовые критерии для новых сценариев.

Вне scope:

- изменение самой архитектурной методики скила за пределами перечисленных UX-проблем;
- отдельный sprint/task breakdown для реализации;
- новая файловая иерархия run сверх существующего compact bundle, если ту же задачу можно решить текущими четырьмя canonical файлами и `journal.ndjson`.

## 4. Неподвижные инварианты

1. Оператор по-прежнему работает только промптом к агенту; прямое редактирование `backlog.json` не становится допустимым operator workflow.
2. Каноническая истина остаётся в `manifest.json`, `backlog.json`, `assessment.json`, `journal.ndjson`; `report.md` остаётся восстанавливаемым generated artifact.
3. Любое изменение run, которое меняет operator-facing состояние, должно оставлять `report.md` актуальным без дополнительного ручного шага агента.
4. Новые operator-facing формулировки не должны вводить новый доменный словарь поверх уже существующей canonical vocabulary.
5. Новые поля добавляются в canonical модель только там, где operator-facing ответ нельзя надёжно вывести из уже существующих данных.
6. Для operator edits агент продолжает работать через updated inputs или explicit `source packet`, а не через ручное переписывание canonical артефактов.

## 5. Целевые workstreams

| Workstream | Назначение | Покрываемые задачи |
| --- | --- | --- |
| `WS-01` | Официальный operator help и prompt workflows | `METH-02`, `UC-01`–`UC-29` |
| `WS-02` | Extraction contract и explicit `source packet` workflow | `METH-01`, `UC-01`, `UC-02`, `UC-03`, `UC-13`–`UC-22`, `UC-29` |
| `WS-03` | Read model для audit/query use cases | `UC-05`–`UC-12`, `UC-23`, `UC-24`, `UC-27`, `UC-28` |
| `WS-04` | Edit semantics и guardrails | `UC-13`–`UC-22` |
| `WS-05` | Drift, `stale review artifacts`, readiness и freshness | `METH-03`, `CLI-02`, `UC-25`, `UC-26`, `UC-27`, `UC-28` |
| `WS-06` | Единый render contract для mutating commands | `CLI-01`, `UC-05`–`UC-29` |

## 6. Спецификация по workstream

## 6.1. `WS-01` — официальный operator-facing help

### Решение

Официальным operator-facing help-референсом становится текущий файл `docs/operator-use-cases.ru.md`. Отдельный help-файл не создаётся, чтобы не дублировать матрицу сценариев и не расколоть источник истины.

### Обязательные изменения

1. В `SKILL.md` должен появиться раздел `Help`.
2. В разделе `Help` должна быть прямая ссылка на `docs/operator-use-cases.ru.md`.
3. `SKILL.md` должен явно зафиксировать, что агент умеет:
   - показать общий список возможностей скила;
   - объяснить допустимые входы для create/audit/edit сценариев;
   - раскрыть конкретный `UC-*` по коду, названию или описанию.
4. В `SKILL.md` должен появиться раздел `Prompt workflows` со следующими верхнеуровневыми группами:
   - `Create backlog`
   - `Audit backlog`
   - `Audit one item`
   - `Edit backlog`
5. Для каждого `UC-*`, где в матрице уже предложено documentation change, должен появиться одноимённый workflow subsection.

### Дополнительные правила

- `report.md` сохраняет текущие английские названия секций (`Run Summary`, `Source Authority`, `Feature Candidates`, `Roadmap`, `Roadmap Matrix`, `Graph Relations`, `Review Governance`, `Lifecycle And Drift`, `Final Operating Questions`) ради совместимости с текущими тестами и CLI-output.
- `SKILL.md` обязан явно маппить operator-facing запросы на эти секции, чтобы агенту не приходилось выводить соответствие из кода.

### Зависимости

- Названия workflow subsection зависят от решений `WS-02`, `WS-03`, `WS-04`, `WS-05`.
- Официальный help нельзя финализировать до фиксации итогового render/status contract.

## 6.2. `WS-02` — extraction contract и `source packet` workflow

### Решение

В методике должен быть описан детерминированный путь от прочитанных источников к `discover`, без необходимости читать `source-runtime.ts`.

### Новый `Extraction Checklist`

В `references/standard.md` должен появиться обязательный checklist:

1. Классифицировать каждый вход как `architecture_doc`, `adr`, `runtime_evidence`, `deployment_contract`, `delivered_dossier_ssot`, `code_evidence`, `operational_evidence` или `backlog_text`.
2. Назначить authority: `authoritative_target_truth`, `authoritative_current_truth`, `historical_context_only`, `superseded_excluded`, `planning_only`.
3. Определить режим работы:
   - `source-only discovery`
   - `source-driven discovery with embedded packets`
   - `explicit packet edit`
4. Определить, какие секции `backlog.json` затрагиваются.
5. Решить, допустим ли explicit `source packet`, или нужен обновлённый authoritative source.
6. После merge operator edit агент обязан прогнать `discover`; по CLI-контракту `discover` сам выполняет refresh/repair/validate/render. Для прямых `validate`, `delta` и `rebaseline` применяется их собственный auto-render contract, а не ручная последовательность `... -> render`.

### Decision table: `source-only discovery` vs explicit packet

| Сценарий | Разрешённый путь | Что нельзя делать |
| --- | --- | --- |
| Создать новый backlog из архитектуры/ADR/runtime | `source-only discovery` или чтение embedded packet block из источника | вручную собирать canonical файлы без `discover` |
| Дообогатить run новым `current truth` | новый authoritative-current source (`runtime_evidence`, `deployment_contract`, `delivered_dossier_ssot`, `code_evidence`, `operational_evidence`) и повторный `discover` | менять `delivery_state` напрямую без evidence |
| Изменить owner / `depends_on` / roadmap / общие planning-поля item | explicit packet c planning overlay | переписывать `backlog.json` вручную |
| Изменить `Gap` / `Unknown` / создать `Spike` | explicit packet | менять unrelated section через общий edit-scenario |
| Изменить `delivery_state` | только evidence-backed authoritative-current input (`runtime_evidence`, `deployment_contract`, `delivered_dossier_ssot`, `code_evidence`, `operational_evidence`) + `discover` | прямой packet-edit `delivery_state` без current truth |
| Пометить claim как `deferred`, `optional`, `negative scope` | explicit packet c planning decision overlay, меняющий только commitment-related поля | переписывать identity/class/source trace claim-а planning-only оверлеем |

### Mapping: operator request -> packet sections

| Operator intent | Секции пакета | authority/kind по умолчанию | Merge policy |
| --- | --- | --- | --- |
| Create backlog from architecture | `id_strategy`, `glossary`, `aliases`, `target_system`, `value_streams`, `tracks`, `claims`, `negative_scope`, `quality_attributes`, `policy_decisions`, `contracts`, `data_domains` | `architecture_doc` + `authoritative_target_truth` | upsert или replace на уровне источника |
| Add current truth | `as_built`, `track_gates`, `track_journeys`, `unknowns`, `uncertainty_to_spike`, `delivered_lineage_notes`, `items`, `relations`, `proofs`, `track_proofs`, `reviews`, `waivers` | любой authoritative-current source: `runtime_evidence` / `deployment_contract` / `delivered_dossier_ssot` / `code_evidence` / `operational_evidence` | upsert |
| Change general item data | `items` | `backlog_text` + `planning_only` | upsert targeted item only |
| Change linked Spike question | `items` для `spike_discovery`, при необходимости `uncertainty_to_spike` | `backlog_text` + `planning_only` | upsert |
| Change Gap | `gaps` | `backlog_text` + `planning_only` | upsert |
| Change Unknown | `unknowns` | `backlog_text` + `planning_only` | upsert |
| Create timeboxed Spike | `items`, `relations`, `uncertainty_to_spike`, при необходимости `roadmap_matrix` | `backlog_text` + `planning_only` | upsert |
| Change owner | `items` | `backlog_text` + `planning_only` | upsert |
| Change `depends_on` | `relations`, при необходимости `roadmap_matrix` | `backlog_text` + `planning_only` | upsert |
| Update `delivery_state` from current truth | `items` и/или `as_built` через evidence-backed source | любой authoritative-current source: `runtime_evidence` / `deployment_contract` / `delivered_dossier_ssot` / `code_evidence` / `operational_evidence` | upsert |
| Mark claim as `deferred` / `optional` / `negative scope` | `claims`, `negative_scope` | planning decision overlay | upsert only commitment-related fields |

### Ограничения explicit packet

1. `replace_sections` запрещён для точечных operator edits. Он разрешён только для полного source-driven refresh section-а.
2. Planning overlay не может менять immutable identity поля:
   - `claim_id`, `claim_class`
   - `contract_id`
   - `domain_id`
   - identity source-authority ledger
3. Для `UC-21` planning overlay может менять только:
   - `claim.commitment`
   - `claim.revisit_trigger`
   - `negative_scope` записи и их связи
4. `source_refs` в packet-authored entries должны оставаться системно трассируемыми, а не произвольной ручной строкой.
5. Для explicit packet edit `packet.source` обязателен и должен содержать как минимум `ref`, `kind`, `authority`; если packet продолжает уже известный source, указывается стабильный `source_id`, иначе CLI обязан создать/обновить соответствующий `source_authority` entry до merge section-данных.
6. Во избежание двусмысленности: внутри `packet.source` каноническое имя поля всегда `source_id` в snake_case. CamelCase `sourceId` может оставаться только внутренним именем в CLI/runtime для `SourceInputSpec`, но не считается допустимым canonical packet key в operator-facing contract.
7. Каждый explicit packet обязан нести `packet.packet_provenance.merge_mode` со значением `planning_overlay` или `source_driven_refresh`. Runtime обязан cross-check-ить эту metadata против resolved `source.authority` / `source.kind` semantics и отклонять mismatch; он может обогащать metadata, но не может молча угадывать или подменять режим merge для canonical explicit packet-а.
8. Machine-check правила для `replace_sections`, immutable identity, evidence-based `delivery_state` и packet-authored `source_refs` должны опираться на явную provenance metadata packet-а. Спецификация не допускает скрытого режима, где validator должен угадывать `source-driven refresh` против `planning overlay` по косвенным признакам.

## 6.3. `WS-03` — operator read model

### Решение

Большинство audit/query use cases должны закрываться не новыми артефактами, а:

- расширением `assessment.json`;
- детерминированным `status` output;
- несколькими новыми секциями в существующем `report.md`.

### Расширение `assessment.stats`

Поле `assessment.stats` перестаёт быть произвольным набором чисел и получает фиксированный минимальный контракт:

- `sources_total`
- `claims_total`
- `contracts_total`
- `data_domains_total`
- `items_total`
- `items_delivered`
- `items_partially_delivered`
- `items_not_started`
- `gaps_total`
- `unknowns_total`
- `contradictions_total`
- `stale_claims_total`
- `stale_items_total`
- `stale_proofs_total`
- `stale_review_artifacts_total`
- `warnings_total`
- `hard_fails_total`
- `dor_ready_total`
- `review_artifacts_total`
- `waivers_total`

Эти ключи используются как единый источник для `UC-06`.

Дополнительные правила:

- каждый ключ из минимального контракта обязателен;
- при отсутствии соответствующих сущностей значение равно `0`, а не пропускается;
- агрегаты считаются по deduplicated/sorted наборам сущностей, чтобы `status`, `assessment.json` и `report.md` использовали один и тот же детерминированный счётчик.

### Новые секции `report.md`

В `render-views.ts` должны быть добавлены секции:

1. `## Item Summary Index`
2. `## Item Detail Sections`
3. `## Rebaseline Readiness`
4. `## New Stale Since Last Change`

И должна быть расширена секция:

- `## Lifecycle And Drift`
  - добавить `Stale review artifacts`

### Контракт `Item Summary Index`

Для каждого `item_id` должен выводиться компактный блок со стабильным явным якорем формата `item-summary-<item_id>`, содержащий:

- `item_id`
- `title`
- `item_class`
- `summary_label`
- `delivery_state`
- `track_id`
- owners
- ключевые `depends_on`
- краткий список основных проблем:
  - `Gap`
  - `Unknown`
  - `Contradiction`
  - `stale proof`
  - `stale review`

Якорь должен эмититься явно (`id`/HTML-anchor), а не полагаться на renderer-specific slugification markdown-заголовков.

### Контракт `Item Detail Sections`

Для каждого `item_id` должен выводиться подробный блок со стабильным явным якорем формата `item-detail-<item_id>`, содержащий:

- весь состав краткой карточки;
- `origin_ref`;
- `claim_refs`;
- `proof_refs`;
- `review refs`, разрешённые через relation `reviewed_by` от item к review artifact;
- связанные relations `touches_contract` / `touches_data_domain`;
- readiness / done / rollout / recovery contract;
- связанные `Gap`, `Unknown`, `Spike`.

### `status` output

`status` должен печатать блоки в фиксированном порядке:

1. Core run status.
2. Summary metrics.
3. Drift and stale diagnostics.
4. Rebaseline readiness.
5. New stale since last change.
6. Hard-fails and next actions.

### Human-readable `delta`

Для `UC-23` CLI должен выдавать не только changed hashes/counters, но и человекочитаемый diff по:

- item adds/removals;
- item state changes (`delivery_state`, `readiness_state`, `closure_state`, `summary_label`);
- relation adds/removals;
- claim commitment changes;
- roadmap order changes.

### Ключевая зависимость для `UC-23`

Текущий `manifest.json` хранит только baseline hashes и не позволяет восстановить прошлое human-readable состояние run. Поэтому для `UC-23` требуется не новый canonical file, а baseline snapshot в `journal.ndjson`.

### Решение по snapshot-ам

При каждом `rebaseline`, который действительно устанавливает новую baseline, в `journal.ndjson` должен сохраняться `baseline_projection`:

- проекция items (`item_id`, `title`, `delivery_state`, `readiness_state`, `closure_state`, `summary_label`, `track_id`, `dependency_item_ids`);
- проекция relations (`relation_type`, `from.kind`, `from.id`, `to.kind`, `to.id`);
- проекция claim commitments (`claim_id`, `commitment`, `revisit_trigger`);
- проекция roadmap rows (`row_id`, `item_id`, `track_id`, `topology_rank`, `safety_rank`, `economic_rank`).

Дополнительные правила:

- `baseline_projection` не записывается при `init`, пока baseline формально не установлена;
- каждая коллекция внутри `baseline_projection` хранится в deduplicated/sorted порядке по стабильным ключам.

`delta` должен сравнивать current projection с последним `baseline_projection`. Если `baseline_projection` ещё нет, `delta` должен явно отвечать `baseline_established=false` и не притворяться, что human-readable diff относительно baseline доступен.

## 6.4. `WS-04` — edit semantics и guardrails

### Общий операторский контракт

1. Любой edit-сценарий должен заканчиваться пересчётом run через `discover`, а не локальным патчем canonical файлов; по CLI-контракту `discover` сам выполняет refresh/repair/validate/render.
2. Агент обязан показать compact diff в чате и ссылку на обновлённый `report.md`.
3. Общий edit-сценарий `UC-13` не может использоваться для специальных случаев `UC-14`–`UC-22`.

### Разграничение сценариев

| Сценарий | Допустимая область изменения | Специальные ограничения |
| --- | --- | --- |
| `UC-13` general item edit | planning-поля item, не перечисленные в специальных сценариях | нельзя трогать `Gap`, `Unknown`, `Spike`, `delivery_state`, `depends_on`, claim coverage |
| `UC-14` linked Spike question | только `question` у `spike_discovery` | если spikes несколько, сначала disambiguation list |
| `UC-15` Gap edit | `title`, `severity`, `owner_implications`, `related_claim_refs`, `related_item_refs`, `fail_closed_category`, `resolution_state`, `downgraded_severity`, `resolution_note` | `source_refs` системно поддерживаются, не редактируются произвольно |
| `UC-16` Unknown edit | те же resolution-поля + severity/links | должна соблюдаться существующая модель `open/resolved/downgraded` |
| `UC-17` create Spike | новый `spike_discovery` item + linkage к `Unknown` | нельзя прятать implementation work внутрь Spike |
| `UC-18` owner edit | `owners.*` | пересчитываются review applicability и ownership drift-sensitive checks |
| `UC-19` depends_on edit | directed relation `depends_on` | агент обязан явно повторить направление связи |
| `UC-20` delivery state edit | evidence-backed `delivery_state` | без `current truth` изменение запрещено |
| `UC-21` claim commitment edit | `claim.commitment`, `claim.revisit_trigger`, `negative_scope` | operator-facing `negative scope` маппится на canonical `out_of_scope`/`negative_scope` representation |
| `UC-22` roadmap order fix | `roadmap_matrix` и/или relations | порядок не может нарушать `depends_on` |

### Каноническое правило для `UC-21`

Operator-facing запрос `negative scope` не должен оставаться двусмысленным. Каноническое представление для такого решения:

- у соответствующего claim выставляется `claim.commitment=out_of_scope`;
- создаётся или обновляется запись в реестре `negative_scope` как минимум с полями `negative_scope_id`, `title`, `negative_scope_class`, `source_refs`, `owner_implications`, `related_claim_refs`, `related_item_refs`, `revisit_trigger`;
- если выбранный `negative_scope_class` относится к manual/synthetic closure semantics, дополнительно обязательны `critical_path_item_refs` и `owner_seam_item_refs`;
- если оператор просит только `deferred` или `optional`, обновляется лишь `claim.commitment`/`claim.revisit_trigger` без создания `negative_scope`, пока явно не принято решение именно о выводе в negative scope.

### Transition rules для `Gap` и `Unknown`

В `references/standard.md` должен быть зафиксирован одинаковый state machine для `Gap` и `Unknown`:

- `open -> resolved`
  - обязателен `resolution_note`
- `open -> downgraded`
  - обязательны `resolution_note` и `downgraded_severity`
- `downgraded -> resolved`
  - обязателен новый `resolution_note`
- `resolved -> open`
  - допускается только при появлении нового authoritative input или drift-переоценке

`validate` должен machine-check-ить эти переходы для `Gap` и `Unknown`.

### Evidence-based `delivery_state`

В `references/standard.md` должен быть описан контракт:

- `delivery_state=delivered` и `partially_delivered` допускаются только при наличии current-truth evidence;
- evidence должен приходить из authoritative-current source: `runtime_evidence`, `deployment_contract`, `delivered_dossier_ssot`, `code_evidence` или `operational_evidence`;
- planning-only packet не может сам по себе переводить item в `partially_delivered` или `delivered`.

`validate` должен hard-fail-ить произвольный status flip без evidence-backed source.

### Правило для `Spike`

Минимально обязательные поля нового `spike_discovery`:

- `item_id`
- `title`
- `item_class=spike_discovery`
- `track_id`
- `uncertainty_class`
- `question`
- `validation_method`
- `expected_artifact`
- `max_duration`
- `kill_criteria`
- `exit_criteria`
- `follow_on_item_refs`

Допускается автонаследование из parent item:

- `track_id`
- owners
- related `Unknown`
- базовые `origin_ref`

Автонаследование допустимо только если parent item и/или связанный `Unknown` определены однозначно; иначе агент сначала делает disambiguation.

Это требование должно быть синхронизировано с `references/standard.md` Appendix A.1 и validator contract в `src/discovery/validate-run.ts`: workflow не может объявлять меньший обязательный набор, чем реальный machine-check.

Если обязательных данных не хватает, агент сначала возвращает список недостающих полей и не создаёт Spike.

## 6.5. `WS-05` — drift, `stale review artifacts`, readiness и freshness

### Решение

`UC-25`, `UC-27` и `UC-28` нельзя надёжно закрыть без расширения computed assessment model.

### Изменения в `AssessmentFile`

В `src/discovery/common.ts` должны быть добавлены:

- `stale_review_artifacts: string[]`
- `rebaseline_readiness: { status: 'allowed' | 'blocked' | 'not_needed'; reasons: string[] }`

В `DeltaSummary` должно быть добавлено:

- `stale_review_artifact_ids: string[]`

### Определение `stale review artifact`

Review считается `stale`, если выполняется хотя бы одно условие:

1. `review_scope=run` и `reviewed_at < last_rebaseline_at`.
2. `review_scope=item` и reviewed item находится в `stale_items`.
3. `review_scope=track_proof` и соответствующий `track_proof` зависит от `stale_proofs` или требует recalculation по `track_gate_ids_to_recalculate`.
4. `review_scope=run` и после `reviewed_at` появился любой dirty flag, который меняет acceptance/closure picture run.
5. reviewed scope перестал удовлетворять review applicability matrix:
   - роль стала required, но текущий artifact больше не покрывает актуальную поверхность изменения;
   - waiver стал invalid;
   - изменился closure-critical scope reviewed объекта.

### Правило после `rebaseline`

`rebaseline` снимает drift относительно baseline, но не “омолаживает” review автоматически.

После `rebaseline` stale становятся:

- все `run`-scope review, выпущенные до `last_rebaseline_at`, потому что принята новая baseline всего run;
- `item` и `track_proof` review только если их scope попал в `stale_items` / `stale_proofs` / recalculation surfaces или applicability matrix изменилась.

Сам по себе факт `reviewed_at < last_rebaseline_at` не должен автоматически инвалидировать любой review вне его scope. Это намеренно согласовано с моделью `stale_proofs`: `rebaseline` инвалидирует только те review surfaces, которые реально затронуты drift/rebaseline causes.

### `Rebaseline Readiness`

`rebaseline_readiness.status` вычисляется так:

- `allowed`
  - `assessment.status=pass`
  - `rebaseline_required=true`
  - нет `hard_fails`
  - нет `stale_items`
  - нет `stale_proofs`
  - нет `stale_review_artifacts`
  - нет `missing_review_roles`
  - нет `pending_track_proof_reviews`
  - нет `track_gate_failures`
- `not_needed`
  - `rebaseline_required=false`
- `blocked`
  - любой другой случай

`reasons` должен содержать детализированный список блокеров или причину `not_needed`.

### `New Stale Since Last Change`

Для `UC-28` нужен детерминированный способ ответить, что стало stale после последнего изменения run.

Решение:

- после каждой mutating команды в `journal.ndjson` должен появляться ровно один канонический `stale_snapshot` командного уровня, привязанный к canonical command-outcome событию этой mutating команды;
  - `claims`
  - `items`
  - `proofs`
  - `reviews`
- отдельный recovery-`render` не создаёт `stale_snapshot` командного уровня и не считается “последним изменением” для `UC-28`;
- промежуточные фазовые события внутри одной команды могут хранить собственные diagnostics, но не участвуют в сравнении `New Stale Since Last Change`;
- каждая коллекция в `stale_snapshot` хранится в deduplicated/sorted порядке по ID, чтобы `status` и `render` сравнивали стабильные снимки, а не зависели от порядка обхода;
- `status` и `render` сравнивают два последних snapshot-а командного уровня от mutating-команд и выводят только новые ID.

Canonical outcome event определяется так:

- для любой mutating команды canonical outcome event это `report_rendered` с `render_reason=mutating_command`;
- события `run_initialized`, `sources_discovered`, `canonical_repaired`, `run_validated`, `delta_computed`, `rebaseline_completed` могут нести тот же `command_run_id`, но сами по себе не становятся точкой сравнения для `UC-28`;
- standalone `render` всегда выпускает только `report_rendered` с `render_reason=recovery_render`.

Если предыдущего snapshot нет, оператору показывается `Unknown`, а не `None`, и причина `first recorded snapshot; no previous stale snapshot to diff`.

## 6.6. `WS-06` — единый render contract

### Решение

Все команды, которые меняют canonical или operator-significant состояние run, обязаны автоматически завершаться render-проходом.

### Mutating command set

Auto-render обязателен для:

- `init`
- `discover`
- `repair`
- `validate`
- `delta`
- `rebaseline`

Не mutating:

- `status`
- `help`

Не меняют canonical run-state, но могут переписать generated/operator-facing файлы:

- `render`

### Конкретные изменения

1. После `init` автоматически вызывать `render`, чтобы новый run сразу имел operator-facing report.
2. Удалить `--no-render` из `discover`.
3. Удалить `--no-render` из `repair`.
4. После `validate` автоматически вызывать `render`.
5. После `delta` автоматически вызывать `render`.
6. После `rebaseline` автоматически вызывать `render`.
7. `render` оставить recovery-командой для случаев:
   - lost generated file;
   - damaged report;
   - manual recovery after bundle repair.

### Инвариант

После любой mutating команды:

- `assessment.json` актуален;
- `report.md` актуален;
- `manifest.last_render_at` обновлён;
- в `journal.ndjson` есть событие `report_rendered`.

Дополнительные правила:

- `report_rendered` должен нести `render_reason: mutating_command | recovery_render`;
- только `render_reason=mutating_command` может быть финальным render-outcome событием mutating команды;
- `render_reason=recovery_render` не меняет stale-diff lineage и не влияет на `New Stale Since Last Change`.

## 7. Изменения канонической модели и журналирования

### Обязательные изменения в `common.ts`

- `AssessmentFile.stale_review_artifacts`
- `AssessmentFile.rebaseline_readiness`
- `DeltaSummary.stale_review_artifact_ids`
- фиксированный contract для `AssessmentFile.stats`

### Обязательные изменения в `journal.ndjson`

События `run_initialized`, `sources_discovered`, `canonical_repaired`, `run_validated`, `delta_computed`, `rebaseline_completed`, `report_rendered` должны получать `command_run_id`, чтобы journal сохранял принадлежность фазовых событий к одной mutating команде или recovery-render проходу.

Событие `report_rendered` должно получать:

- `render_reason: mutating_command | recovery_render`
- `stale_snapshot` и при необходимости `new_stale_snapshot` только когда `render_reason=mutating_command`

Событие `rebaseline_completed` дополнительно должно получать:

- `baseline_projection`

Дополнительные правила:

- только snapshot-ы командного уровня от mutating-команд участвуют в вычислении `New Stale Since Last Change`;
- standalone recovery-`render` не может сдвигать точку сравнения для `UC-28`.
- `command_run_id` создаётся заново для каждого top-level CLI invocation;
- auto-render, который завершает mutating команду, использует тот же `command_run_id`, что и предшествующие фазовые события этой команды;
- повторный запуск той же команды после ошибки или retry получает новый `command_run_id` и не переиспользует lineage предыдущей неуспешной попытки.

### Почему journal, а не новый файл

- компактная модель run не разрастается новым canonical artifact;
- baseline/history остаются append-only;
- `delta` и `status` получают исторический контекст, которого сейчас нет в `manifest.json`.

## 8. Изменения в CLI-output

### `discover`

Должен печатать:

- resolved sources;
- applied packets;
- applied repairs;
- assessment summary;
- path to rendered report.

Опционально может печатать блок `New Stale`, если изменения сразу породили stale entities.

### `status`

Должен печатать:

- core run/assessment block;
- summary metrics block;
- stale claims/items/proofs/reviews;
- rebaseline readiness;
- new stale since last change;
- hard-fail details;
- next actions.

### `delta`

Должен печатать:

- core assessment summary;
- changed sources/claims/gates;
- human-readable diff by items/relations/statuses;
- stale items/proofs/reviews;
- new stale since last change;
- path to rendered report.

### `rebaseline`

Должен печатать:

- rebaseline completed timestamp;
- causes;
- updated readiness result (`not_needed`);
- stale proofs/reviews, если они остались stale после rebaseline;
- path to rendered report.

## 9. Изменения в `report.md`

### Existing sections, которые остаются основой operator UX

- `Run Summary`
- `Source Authority`
- `Feature Candidates`
- `Roadmap`
- `Roadmap Matrix`
- `Graph Relations`
- `Review Governance`
- `Lifecycle And Drift`
- `Final Operating Questions`

### New sections

- `Item Summary Index`
- `Item Detail Sections`
- `Rebaseline Readiness`
- `New Stale Since Last Change`

### Extended sections

- `Lifecycle And Drift`
  - добавить `stale_review_artifacts`
  - добавить явную ссылку на dirty flags и track-gate recalculation

## 10. Зависимости и порядок реализации

1. Сначала `WS-02`, потому что без extraction contract нельзя корректно описать edit workflows.
2. Затем `WS-05`, потому что `stale_review_artifacts`, readiness и new-stale влияют на assessment model, status и report.
3. Затем `WS-06`, потому что все operator-facing file/section contracts зависят от гарантии свежего `report.md`.
4. Затем `WS-03`, потому что item views, delta и new-stale уже зависят от model/journal contract.
5. Затем `WS-01`, потому что `SKILL.md` должен ссылаться на окончательные workflow names и output contracts.
6. `WS-04` можно реализовывать параллельно с `WS-02`, но validation guardrails для `Gap`, `Unknown` и `delivery_state` зависят от нормативных решений `standard.md`.

## 11. Acceptance criteria

### Документация

- `SKILL.md` содержит `Help` и `Prompt workflows`.
- `references/standard.md` содержит extraction checklist, edit boundaries, explicit-packet provenance contract, каноническое правило `UC-21` для `negative scope`, `Gap`/`Unknown` transitions, evidence-based `delivery_state`, stale-review rules, rebaseline readiness и синхронизированный `Spike` authoring contract.
- `references/artifact-model.md` описывает auto-render contract, canonical outcome event, `command_run_id`/`render_reason` semantics и использование journal snapshot-ов.

### Каноническая модель

- `assessment.json` содержит `stale_review_artifacts` и `rebaseline_readiness`.
- `delta_summary` содержит `stale_review_artifact_ids`.
- `stats` содержит фиксированный operator-facing metric set, все ключи обязательны и отсутствующие сущности дают `0`.

### CLI

- `init`, `discover`, `repair`, `validate`, `delta`, `rebaseline` всегда обновляют `report.md`.
- `discover` и `repair` больше не принимают `--no-render`.
- `status` и `delta` показывают `stale review artifacts`, `rebaseline readiness`, `new stale`.
- recovery-`render` не меняет `New Stale Since Last Change` lineage.

### Generated views

- `report.md` содержит `Item Summary Index`, `Item Detail Sections`, `Rebaseline Readiness`, `New Stale Since Last Change`.
- `Lifecycle And Drift` показывает `stale_review_artifacts`.

### Drift and freshness

- отдельный список `stale_review_artifacts` вычисляется и хранится канонически;
- после `rebaseline` stale reviews не “омолаживаются” автоматически;
- `delta` умеет показать human-readable diff относительно baseline за счёт `baseline_projection`.
- `New Stale Since Last Change` сравнивает только snapshot-ы командного уровня, а не промежуточные фазовые события одной и той же команды.
- `command_run_id` и `render_reason` однозначно отделяют mutating-command lineage от recovery-`render`.

## 12. Риски и специальные замечания

1. `UC-23` нельзя закрыть только текущими baseline hashes; без `baseline_projection` human-readable diff будет недостоверным.
2. `UC-28` нельзя сделать устойчивым только на текущем `assessment.json`; нужен исторический snapshot в journal.
3. `UC-21` конфликтует с правилом “backlog text never overrides architecture”, если не зафиксировать ограничение, что planning overlay меняет только commitment-related representation claim-а, а не его identity.
4. Auto-render нужно применять и к `validate`, иначе generated views всё ещё будут устаревать после чисто assessment-level изменений.

## 13. Практический результат после внедрения

После внедрения этой спецификации оператор должен получать:

- понятный общий help без чтения кода;
- детерминированный create/audit/edit workflow по одному промпту;
- единый и всегда свежий `report.md`;
- machine-check-имые ответы на вопросы про `stale reviews`, readiness к `rebaseline`, новые stale-артефакты и diff относительно baseline;
- ясную границу между source truth, current truth и planning overlay.
