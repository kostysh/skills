# Концепция объединённого skill-а `dossier-engineer`

Дата: 2026-04-20

## Назначение документа

Этот документ исследует возможность объединения двух текущих skill-ов:

- `backlog-engineer`
- `dossier-engineer`

Цель исследования:

- понять, стоит ли объединять их в один skill;
- определить, что именно должно войти в объединённый skill;
- спроектировать целевую process model;
- спроектировать unified artifact model, в котором учётные артефакты живут в `.dossier`, а проектные SSOT-артефакты живут в `docs/ssot`;
- зафиксировать ограничения, без которых такое объединение станет деструктивным.

Будущий объединённый skill в этой концепции всё равно называется `dossier-engineer`.

## Короткий вывод

Да, объединение выглядит оправданным и стратегически правильным.

Но объединять нужно не через смешение всех функций в одну плоскую методику, а через создание одного skill-а с двумя внутренними подсистемами:

- `backlog truth layer`
- `delivery workflow layer`

Иными словами:

- skill должен стать один;
- учётный artifact root должен стать один: `.dossier`;
- project SSOT root должен быть один: `docs/ssot`;
- vocabulary и process ownership должны стать едиными;
- но backlog state, dossier state, review state и closure state не должны быть слиты в один общий enum или один общий “универсальный статус”.

Если попытаться объединить skill-ы грубо, возникнут новые проблемы:

- backlog truth станет prose-driven и потеряет deterministic boundary;
- dossier workflow начнёт конкурировать с backlog graph за роль primary planning layer;
- state model станет неразличимой и будет давать ложные equivalence between `planned`, `implemented`, `done`, `ready_for_next_step`, `next-step`.

Правильная цель:

- один skill;
- один учётный root `.dossier`;
- один project SSOT root `docs/ssot`;
- одна сквозная process architecture;
- две чётко разделённые внутренние модели внутри одного skill-а.

## Почему текущее разделение создаёт системное трение

Текущая split model логична архитектурно, но дорога в сопровождении.

Основные проблемы:

1. Между skill-ами проходит один из самых частых переходов во всём процессе.
   После выбора работы, после `spec-compact`, после `plan-slice`, после `implementation`, после `change-proposal` агент должен заново пересекать skill boundary.

2. Ownership приходится поддерживать вручную.
   Агент постоянно должен помнить:
   что читать через backlog utility,
   что читать через dossier artifacts,
   где truth-changing mutation,
   где only process artifact.

3. Возникает методический drift.
   Даже при хороших docs два skill-а эволюционируют раздельно, а значит:
   одинаковые слова начинают означать разные вещи;
   появляются разъезды в sequencing;
   растёт цена cross-skill согласования.

4. Артефакты лежат в разных корнях.
   Сейчас backlog живёт как отдельный root contract, а dossier-процесс уже живёт в `.dossier/*`.
   Это делает process topology менее очевидной, чем она должна быть.

5. Ретро-анализу сложнее строить непрерывную картину.
   При split model труднее видеть feature lifecycle и backlog actualization как части одного системного контура.

6. Большая часть проблем уже не domain-specific, а interop-specific.
   То есть цена возникает не из-за сложности backlog graph или dossier workflow по отдельности, а из-за регулярного перехода между ними.

## Что обязательно нужно сохранить при объединении

Объединение skill-ов не должно уничтожить то сильное, что уже есть в обеих моделях.

Нужно сохранить:

- architecture-sourced backlog graph как отдельный truth layer;
- deterministic utility boundary для backlog state;
- packet/patch discipline;
- source registry и scoped refresh;
- feature dossier lifecycle как отдельный delivery layer;
- раздельность maturity, review freshness, closure и verification;
- mandatory review/verification/step-close artifacts;
- правило, что CLI не делает NLP и не принимает semantic decisions за агента.

Ключевой принцип:

объединяется governance и process ownership, но не смешиваются механические и семантические обязанности.

## Что именно надо считать объединением

Объединение в этой концепции означает:

- один skill `dossier-engineer`;
- одна активная нормативная поверхность;
- один набор references;
- один учётный/process root `.dossier`;
- один canonical project-doc root `docs/ssot`;
- одна сквозная process model от source registration до feature closure и backlog actualization;
- один operator-facing vocabulary.

Объединение не означает:

- один “универсальный статус” для всего;
- превращение backlog graph в section внутри prose dossier;
- отказ от packet/patch model;
- отказ от deterministic utility;
- обязательное немедленное слияние всех CLI-команд в один бинарь.

Последний пункт важен:

skill можно объединить раньше, чем runtime будет объединён физически.
На первом этапе один skill может легально содержать две механические command families, пока они принадлежат одной нормативной системе и одной artifact topology.

## Два типа артефактов

Это обязательная часть target model.

Объединённый skill должен явно различать два класса артефактов.

### 1. Учётные артефакты

Это operational / machine-facing / process-facing artifacts.

Их свойства:

- они поддерживают workflow и deterministic state;
- они могут быть utility-owned;
- они не обязаны быть primary human-facing product documentation;
- они могут быть derived, агрегированными, индексными или журналируемыми.

Все такие артефакты должны жить в `.dossier`.

Сюда относятся:

- backlog state;
- source registry;
- applied patch/packet state;
- packet and patch imports;
- reports;
- logs;
- verification artifacts;
- review artifacts;
- step-close artifacts;
- lifecycle telemetry;
- retro/session indexes;
- ops and drift artifacts.

### 2. Проектные SSOT-артефакты

Это human-facing project truth.

Их свойства:

- они объясняют проект, feature scope и delivery truth для людей;
- они входят в product/project documentation;
- они не должны растворяться в purely operational workspace.

Все такие артефакты должны жить в `docs/ssot`.

Сюда относятся:

- canonical feature dossier documents;
- global feature index;
- другие human-facing SSoT documents, если merged skill будет их materialize-ить.

Ключевое правило:

объединение skill-ов не означает, что все артефакты нужно переместить в `.dossier`.
В `.dossier` живёт учётная и process truth.
В `docs/ssot` живёт project-facing SSOT.

## Целевая модель объединённого skill-а

### 1. Внутренняя структура skill-а

Будущий `dossier-engineer` состоит из двух внутренних подсистем.

#### A. `Backlog truth layer`

Отвечает за:

- source registration;
- architecture / ADR / technical decision ingestion;
- backlog graph materialization;
- atomic work items;
- dependency graph;
- task lifecycle state;
- refresh and patch discipline;
- source-change review records and review acknowledgment flow;
- queue / attention / gaps / items / search;
- canonical backlog actualization after downstream changes.

#### B. `Delivery workflow layer`

Отвечает за:

- selected backlog work intake;
- feature dossier;
- `spec-compact`;
- `plan-slice`;
- `implementation`;
- `change-proposal`;
- `contract-drift-audit`;
- explicit `backlog impact verdict`;
- verification artifacts;
- review artifacts;
- step-close artifacts;
- coverage gate;
- lifecycle telemetry;
- retrospective discoverability.

### 2. Главный process contract

Объединённый skill отвечает на полный вопрос:

“Как работа появляется из architecture sources, как она выбирается, как проходит delivery lifecycle, и как truth о ней возвращается в backlog graph?”

Это важное отличие от текущего split model:

- сейчас этот вопрос проходит через два skill-а;
- в target model это один end-to-end skill contract.

## Целевой процесс end-to-end

### Этап 1. Materialize backlog graph

Агент использует backlog layer объединённого skill-а, чтобы:

- зарегистрировать sources;
- построить или обновить backlog graph;
- прочитать queue / gaps / attention / items;
- выбрать следующую работу.

### Этап 1a. Source-change review before item-level review

Это важная часть target model после merge.

Если `refresh` обнаруживает changed registered source, unified skill не должен сразу переводить все связанные backlog items в `needs_attention`.

Вместо этого открывается source-level review record.

Он должен содержать только deterministic structural facts:

- `source_id`
- `source_label`
- `previous_hash`
- `current_hash`
- `linked_item_keys`
- `linked_item_count`

После этого canonical agent flow такой:

1. агент читает changed source;
2. агент просматривает связанные backlog items;
3. агент выбирает outcome:
   - `no backlog change`
   - `patch existing item`
   - `create new backlog item`
   - `source maintenance`
4. после этого source-level review либо закрывается без item-level attention flood, либо materialize-ит already-confirmed backlog mutation work.

Ключевое правило:

hash change сам по себе не должен автоматически создавать массовый item-level `needs_attention`.
Сначала должен происходить source-level review.

Readiness rule:

- пока source-level review record остаётся `open`, все `linked_item_keys` считаются temporarily not ready for selection;
- такие items не должны попадать в `queue`;
- для них `ready_for_next_step` должен считаться `false` до truthful resolution source-review;
- `status` должен показывать отдельный signal:
  - `open_source_review_count`
  - `source_review_blocked_item_count`

Это и есть replacement safety signal вместо нынешнего массового item-level `needs_attention` flood.

### Этап 2. Start feature cycle

Агент создаёт или обновляет dossier artifact для выбранной работы.

Явная связь обязательна:

- dossier feature ID;
- один и только один `backlog_item_key`;
- source traceability;
- feature cycle telemetry anchors.

### Этап 3. Spec and plan

Агент проходит:

- `feature-intake`
- `spec-compact`
- `plan-slice`

Если на любом из этих шагов меняется backlog truth:

- статус item-а;
- blockers;
- dependencies;
- attention-needed facts;
- source-derived task semantics;

агент не “передаёт работу в другой skill”, а просто переходит внутри того же skill-а в backlog actualization branch.

### Этап 4. Implementation and closure

Агент проходит:

- `implementation`
- local verification
- debt review
- independent review stack
- review freshness validation
- `dossier-step-close`
- `lifecycle-refresh`

После closure, если capability truth реально изменилась:

- backlog item actualization становится частью closure contract того же skill-а.

### Этап 4a. Mature change path

Если работа касается уже mature capability и требует изменения требований, контракта или documented behavior, агент проходит отдельную first-class ветку:

- `change-proposal`
- `contract-drift-audit`
- explicit `backlog impact verdict`

Эта ветка не должна считаться побочной или optional.
После merge она остаётся обязательной частью unified lifecycle.

### Этап 5. Telemetry and retrospective support

Все process artifacts, stage logs, lifecycle snapshots и retro-discovery hints строятся в одном root `.dossier`.

Это даёт оператору одну непрерывную картину:

- от source-driven work discovery
- до delivered implementation
- и до post-change backlog truth.

## Commandized delivery workflows

Одно из важных целевых изменений после merge:

primary delivery workflows больше не должны существовать только как prose-only workflow names.

Нужна явная модель:

- каждый primary delivery workflow stage получает свой собственный mechanical stage-controller command;
- helper commands остаются отдельным семейством и не смешиваются с stage controllers.

### Какие workflow stages должны стать first-class commands

Минимальный целевой набор:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

Это означает:

- у агента больше не должно быть двусмысленности, является ли stage runnable command boundary или только названием методики;
- utility сможет честно фиксировать stage transitions и stage-local state без попытки выводить их из prose.

### Какие команды НЕ нужно смешивать с stage controllers

Это остаётся отдельным helper family:

- `contract-drift-audit`
- `dossier-verify`
- `review-artifact`
- `dossier-step-close`
- `lifecycle-refresh`
- `next-step`

То есть target model не “каждый шаг процесса превращается в свою команду”.

Target model такой:

- primary delivery stages получают свои commands;
- supporting verification / review / closure / query helpers остаются отдельными commands;
- semantic work по-прежнему делает агент, а не utility.

### Что должны делать stage-controller commands

Они должны выполнять только mechanical работу:

- открывать stage cycle;
- продолжать stage cycle;
- фиксировать blocked / resumed / ready-for-close transitions;
- создавать или обновлять stage log;
- валидировать наличие required structured prerequisites;
- materialize-ить machine-readable readiness and follow-up signals.

Их верхняя граница authority:

- они могут доводить stage только до truthful pre-close / `ready_for_close` boundary;
- они не должны сами materialize-ить authoritative `closed` state;
- они не должны писать closure timestamps как окончательную truth of record.

Они не должны:

- писать спецификацию вместо агента;
- писать план вместо агента;
- принимать semantic product decisions;
- анализировать prose как NLP engine.

### Как stage-controller commands должны участвовать в логировании

Это один из главных аргументов в пользу commandization.

С их появлением telemetry может опираться не только на “агент помнит, что он уже вошёл в stage”, а на явные command-level transitions.

Нужно зафиксировать:

- каждый stage-controller command становится canonical writer для stage entry/resume/block/ready transitions;
- stage log по-прежнему остаётся `.md` artifact с YAML frontmatter и narrative sections;
- но machine-readable часть stage log должна теперь дополнительно содержать bounded transition surface;
- `feature_cycle_id` остаётся общим identity key;
- stage-local `cycle_id` остаётся identity конкретного stage closure target.

Минимально needed machine-readable additions для target model:

- `stage_state`
- `entered_ts`
- `ready_for_close_ts`
- `transition_events[]`

Для `blocked` / `resumed` transitions authoritative event history должна жить в `transition_events[]`.

Если позже понадобятся summary fields, они должны быть явно derived и недвусмысленны, например `first_entered_ts` или `last_blocked_ts`.
Но target model не должен вводить ambiguous singleton fields вроде `blocked_ts` или `resumed_ts` без строго определённой semantics.

Эти поля не заменяют existing timestamps и bounded event arrays.
Они дают deterministic stage-transition evidence.

### Как stage-controller commands должны влиять на backlog truth

Здесь merge не должен размыть current truth boundary.

Stage-controller commands не должны мутировать backlog truth напрямую.

Вместо этого они должны:

- выставлять explicit machine-readable signal, что backlog follow-up required;
- фиксировать, какого типа follow-up ожидается;
- блокировать truthful stage closure, пока required backlog actualization не завершён.

Минимальный target surface:

- `backlog_followup_required: true|false`
- `backlog_followup_kind`
- `backlog_followup_resolved: true|false`

Для ordinary truth-changing stages expected kinds будут такими:

- `patch-item`
- `refresh+patch`

Для mature change path explicit truth selector остаётся stronger surface:

- `backlog impact verdict`

Allowed values:

- `no-op`
- `patch existing item`
- `source update`
- `new backlog item`

То есть после merge логика становится более ясной:

- workflow stage command materialize-ит deterministic signal;
- backlog mutation по-прежнему происходит через backlog truth layer;
- truthful stage closure невозможен, пока required backlog follow-up не закрыт.

Важно:

- это не создаёт второй closure authority surface;
- stage-controller command может only signal `ready_for_close`;
- authoritative `closed` state, closure timestamps и lifecycle truth остаются у `dossier-step-close` и последующего `lifecycle-refresh`.

### Почему это лучше текущей split-модели

Текущая проблема была в том, что часть delivery lifecycle уже имела commands, а часть была workflow-only surface.

Это создавало два recurring failure modes:

- агент путал runnable command и workflow stage;
- telemetry приходилось partially reconstruct-ить из narrative reasoning вместо явных transition anchors.

Commandized workflow boundary снимает обе проблемы, если его сделать механическим, а не “магическим”.

## Unified artifact model под `.dossier`

Это центральная часть концепции.

В target model backlog и dossier больше не живут в двух независимых operational roots.
Но при этом human-facing SSOT не переносится в `.dossier`.

### Общий принцип

`.dossier` становится единым учётным/process root для skill-а.

Рядом с ним существует отдельный canonical project-doc root:

- `docs/ssot`

Внутри `.dossier` живут bounded zones:

- `.dossier/backlog/*`
- `.dossier/logs/*`
- `.dossier/verification/*`
- `.dossier/reviews/*`
- `.dossier/steps/*`
- `.dossier/metrics/*`
- `.dossier/retro/*`
- `.dossier/ops/*`
- `.dossier/drift/*`

Пример целевого process layout:

```text
.dossier/
├── manifest.json
├── backlog/
│   ├── manifest.json
│   ├── .gitignore
│   ├── AGENTS.md
│   ├── state.json
│   ├── sources.json
│   ├── applied.json
│   ├── source-review/
│   ├── packets/
│   ├── patches/
│   ├── mutation.lock
│   └── reports/
├── logs/
│   ├── feature-intake/
│   ├── spec-compact/
│   ├── plan-slice/
│   └── implementation/
├── reviews/
├── verification/
├── steps/
├── metrics/
├── retro/
│   └── session-index.jsonl
├── ops/
└── drift/
```

Пример целевого project SSOT layout:

```text
docs/
└── ssot/
    ├── index.md
    └── features/
        ├── F-0001.md
        └── F-0002.md
```

### Что это означает practically

1. Текущий `.backlog.json` как backlog root marker заменяется на `.dossier/backlog/manifest.json`.
   Repo-level process discovery идёт через `.dossier/manifest.json`.

2. Текущие `packets/`, `patches/`, `reports/` должны переехать под `.dossier/backlog/`.

3. Source-change review records должны жить в `.dossier/backlog/source-review/`.
   Это учётные workflow artifacts, а не project SSOT.

4. Текущие dossier feature artifacts не должны жить в `.dossier`.
   Их canonical target layer должен быть `docs/ssot/features/F-*.md`.

5. Глобальный project-facing index должен жить в `docs/ssot/index.md`, а не в `.dossier`.

6. Utility-managed reinforcement artifact, если он нужен, может жить как `.dossier/backlog/AGENTS.md`.
   Repo-root `AGENTS.md` должен оставаться human-governed repository contract.

7. Backlog-local ignore contract не должен исчезнуть.
   Его replacement — `.dossier/backlog/.gitignore`.
   Repo-root `.gitignore` может дополнительно игнорировать точечные utility-owned files в `.dossier/**`, но это вторичный слой.

8. Architecture sources, ADR и product-facing docs не обязаны переезжать в `.dossier`.
   Они остаются внешними source documents.
   `.dossier` хранит учётную/process truth и derived artifacts.

### Migration rule for project SSOT

Так как текущий active contract использует `docs/features/F-*.md` и `docs/ssot/index.md`, merged concept должен избегать mixed truth.

Steady-state target model выбирается явно:

- canonical feature dossier path после merge должен быть `docs/ssot/features/F-*.md`;
- canonical global index должен быть `docs/ssot/index.md`.

Правило миграции должно быть таким:

- либо на переходной фазе canonical feature dossier остаётся в `docs/features/F-*.md`, пока не выполнен controlled migration;
- либо выполняется явный migration to `docs/ssot/features/F-*.md`, и только после этого старый путь перестаёт быть canonical;
- в любой момент времени должен существовать только один canonical path for feature dossier truth;
- `feature-intake`, PR update rules и navigation contract должны ссылаться именно на этот один canonical path;
- после завершения migration boundary `docs/features/F-*.md` больше не считается canonical target contract.

### Replacement backlog root contract

После merge нельзя просто “перекинуть backlog в `.dossier`”.
Нужен полный replacement текущего backlog root contract.

Рекомендуемая модель:

- repo process root discover-ится по `.dossier/manifest.json`;
- backlog subroot discover-ится по `.dossier/backlog/manifest.json`;
- utility-owned lock живёт в `.dossier/backlog/mutation.lock`;
- mutating backlog commands работают только последовательно, как и раньше;
- backlog-local ignore живёт в `.dossier/backlog/.gitignore`;
- reinforcement artifact, если он нужен runtime, живёт в `.dossier/backlog/AGENTS.md`;
- repo-root `AGENTS.md` не используется как utility-owned backlog artifact;
- canonical cwd contract должен позволять запуск команд из repo root или его поддиректорий, пока upward discovery находит `.dossier/manifest.json`;
- source paths нормализуются как POSIX paths относительно repo process root, а не относительно случайного текущего cwd;
- если source находится вне repo root, path может содержать `..`, но остаётся anchored to process root.

Без этого explicit replacement unified `.dossier` layout будет декларацией, а не рабочим deterministic contract.

### Source-change review contract

При merge skill-ов feature source tracking должна измениться сразу, а не отдельным поздним циклом.

Текущая модель:

- source hash changed;
- utility сразу поднимает `needs_attention` связанным items.

Целевая merged model:

- source hash changed;
- utility открывает source-level review record в `.dossier/backlog/source-review/`;
- utility не поднимает массовый item-level `needs_attention` только по самому факту hash change;
- агент сначала review-ит changed source и связанные backlog items;
- только после agent outcome materialize-ится нужная backlog mutation work или clean no-op closure.

Минимальный shape source-review record:

```json
{
  "source_review_id": "<uuid-or-stable-key>",
  "source_id": "<source_id>",
  "source_label": "docs/architecture/auth.md",
  "previous_hash": "<previous_hash>",
  "current_hash": "<current_hash>",
  "status": "open",
  "linked_item_keys": ["auth-core", "auth-session-timeout-enforcement"],
  "linked_item_count": 2,
  "opened_at": "<timestamp>",
  "closed_at": null,
  "resolved_at": null,
  "outcome": "pending",
  "resolution_kind": null,
  "resolution_ref": null
}
```

Canonical behavior:

- `refresh` creates or updates source-review records;
- `refresh` must return compact source-review scope, not generic item todo flood;
- `attention` should surface open source-review records before generic item-level review lists;
- source-review closure must support explicit `no backlog change` acknowledgment path;
- item-level `needs_attention` should appear only for already-confirmed backlog mutation work, not as automatic flood from hash change alone.

Minimal replacement command/read-model contract for first wave:

- `refresh --source-*` returns:
  - `changed_sources`
  - `source_reviews_created`
  - `source_reviews_updated`
  - `source_review_ids`
  - `next_commands`
- `next_commands` should point first to:
  - `attention`
  - and, when scope is small enough, `items --item-keys <linked_item_keys>`
- `attention` by default returns open source-review records ordered before generic item-level review entries;
- item-level review remains an explicit second read, not the first automatic effect of `refresh`.

Truthful closure rule:

- `status = open` means source review is unresolved and still blocks linked-item readiness;
- `outcome = pending` is the only allowed value while the record is open;
- closing the record requires one explicit resolved outcome:
  - `no_backlog_change`
  - `patched_existing_items`
  - `created_new_item`
  - `source_maintenance`
- `resolution_kind` must identify the closure path:
  - `ack`
  - `patch-item`
  - `packet`
  - `update-source-path`
  - `remove-source`
- `resolution_ref` must point to the relevant acknowledgment or mutation artifact/command result;
- `resolved_at` must be set only when the outcome is no longer `pending`;
- `closed_at` may mirror `resolved_at` if the runtime keeps separate open/closed bookkeeping.

Canonical no-op closure:

1. `refresh --source-*`
2. agent reads changed source and linked items
3. agent concludes `no backlog change`
4. explicit source-review acknowledgment closes the record with:
   - `outcome = no_backlog_change`
   - `resolution_kind = ack`
5. clean confirmation then comes from `status`, not from chat-only reasoning

Это изменение intentionally входит в первую волну реализации merge-а.
Его не надо откладывать на post-merge cleanup, потому что оно прямо снижает один из самых дорогих когнитивных costs текущего backlog workflow.

### Что не должно жить в `.dossier`

Не всё в проекте нужно загонять туда.

За пределами `.dossier` должны оставаться:

- architecture docs;
- ADR;
- PRD / concept docs;
- исходный код;
- project-facing SSOT documents under `docs/ssot`;
- repo-root human-governed `AGENTS.md`, если он нужен проекту.

`.dossier` в этой модели не заменяет проектовую документацию.
Он становится единым operational workspace для backlog + delivery process.

## Модель сущностей в объединённом skill-е

Нужна явная сущностная цепочка:

`Source document -> backlog item -> feature dossier -> implementation cycle -> lifecycle snapshot`

Это важнее, чем просто directory layout.

### `Source document`

Внешний документ, из которого materialize-ится backlog truth.

### `Backlog item`

Каноническая единица planning truth.

### `Feature dossier`

Операционная единица downstream work.
Обычно соответствует одному feature cycle.
И должна быть связана ровно с одним `backlog_item_key`.

Ключевое правило:

`одна фича = один элемент беклога`.

Если оператору нужен delivery cycle, который логически задевает несколько backlog items, это означает не “group dossier”, а то, что:

- либо item decomposition в backlog была недостаточно качественной;
- либо нужен explicit parent item / umbrella item;
- либо нужно выполнять несколько feature cycles, а не один.

### `Implementation cycle`

Конкретный lifecycle проход:

- intake
- spec
- plan
- implementation
- verify
- review
- close
- actualize backlog truth

### `Lifecycle snapshot`

Структурированный telemetry artifact для анализа процесса.

## Реалистичность telemetry layer

Unified `.dossier` layout имеет смысл только если telemetry после merge остаётся deterministic.

Для этого в концепции нужно сразу зафиксировать identity contract:

- у каждого feature cycle есть `feature_cycle_id`;
- у `feature-intake` log есть свой `cycle_id`, но он обязательно связан с тем же `feature_cycle_id`;
- у каждого stage log (`spec-compact`, `plan-slice`, `implementation`) есть stage-local `cycle_id` и ссылка на тот же `feature_cycle_id`;
- у lifecycle snapshot есть ключ `(feature_id, feature_cycle_id)`;
- session discoverability хранится в `.dossier/retro/session-index.jsonl`;
- session index обязан хранить session anchors, но не absolute runtime-only trace paths как universal truth;
- implementation closure timestamp не может materialize-иться без truthful `dossier-step-close` artifact;
- `lifecycle-refresh` читает intake log, stage logs и step artifacts как разные artifact families, а не как один слитый журнал.

Финальный telemetry log contract должен сохранять текущее полезное свойство:

- logs остаются human-readable и machine-checkable одновременно;
- intake/stage logs остаются `.md` файлами с YAML frontmatter и narrative sections;
- lifecycle snapshot и session index могут оставаться structured machine artifacts.

Рекомендуемый минимальный telemetry layout:

```text
.dossier/
├── logs/
│   ├── feature-intake/<feature-id>/<cycle-id>.md
│   ├── spec-compact/<feature-id>/<cycle-id>.md
│   ├── plan-slice/<feature-id>/<cycle-id>.md
│   └── implementation/<feature-id>/<cycle-id>.md
├── steps/
│   └── <feature-id>/implementation-<cycle-id>.json
├── metrics/
│   └── <feature-id>/<feature_cycle_id>.json
└── retro/
    └── session-index.jsonl
```

Если merged concept не сохраняет этот identity layer, telemetry станет красивой декларацией, но не рабочим deterministic mechanism.

## Что делать со статусами

Это один из самых важных вопросов.

### Главное правило

После объединения skill-а нельзя пытаться слить все состояния в одну общую шкалу.

Нужно сохранить как минимум пять разных измерений:

1. `backlog item lifecycle`
2. `feature dossier maturity`
3. `coverage_gate`
4. `review/verification freshness`
5. `step closure state`

### Рекомендуемая модель

#### `Backlog item lifecycle`

Остаётся coarse planning truth:

- `defined`
- `specified`
- `planned`
- `implemented`

#### `Feature dossier maturity`

Остаётся delivery-process truth:

- `proposed`
- `shaped`
- `planned`
- `in_progress`
- `done`
- `parked`

#### `Coverage gate`

Остаётся отдельной gating axis:

- `deferred`
- `strict`

#### `Review/verification freshness`

Остаётся отдельной quality-control axis.

#### `Step closure`

Остаётся отдельной closure axis:

- `open`
- `blocked`
- `closed`

### Что должно измениться

Нужен не единый enum, а explicit crosswalk between states.

Например:

- backlog `planned` не равен dossier `planned`, но dossier `plan-slice` обычно является доказательной базой для backlog actualization до `planned`;
- backlog `implemented` не равен dossier `done`, но successful implementation closure обычно является strongest evidence для transition к `implemented`;
- `ready_for_next_step` не равен dossier `next-step`, но должен иметь прозрачную связь.

Объединённый skill должен содержать этот crosswalk внутри себя, а не держать его как внешнее межскилловое знание.

## Closure truth contract

Важное уточнение:

в текущих исходных skill-ах closure contract уже жёсткий.
Слишком мягко он был описан именно в первой версии этой концепции.

В target model после merge нельзя потерять ни один из этих hard gates:

- coverage gate должен сохраняться как отдельная blocking axis;
- перед final claim обязательны local verification artifacts;
- обязателен debt review;
- обязателен independent review в fail-closed режиме с отдельным reviewer agent;
- обязателен контроль review freshness;
- `dossier-step-close` остаётся authoritative closure artifact;
- blocked close path должен оставаться truthful durable branch, а не chat-level summary;
- после `dossier-step-close` обязателен `lifecycle-refresh`, если feature claim зависит от lifecycle snapshot;
- feature не может считаться truthfully closed только по commit, chat summary или informal review pass.

Иными словами:

merge skill-ов не ослабляет closure discipline.
Наоборот, она должна стать явно встроенной частью единого end-to-end contract.

## Роль CLI и роль агента в target model

Объединение skill-а не должно размывать границу между agent-side reasoning и utility-side deterministic work.

### CLI должен уметь

- читать и обновлять structured artifacts;
- materialize backlog graph;
- регистрировать sources;
- выполнять packet/patch/refresh discipline;
- строить telemetry snapshots;
- индексировать session/discoverability artifacts;
- валидировать schema и required fields;
- делать deterministic aggregations.

### CLI не должен уметь

- анализировать prose;
- выводить root cause;
- решать, что именно является architectural obligation;
- решать, является ли finding “реальной проблемой”;
- приписывать проблему конкретному skill section без участия агента.

### Агент должен делать

- reading and interpretation of source docs;
- packet/patch authoring;
- scope shaping;
- specification;
- planning;
- implementation decisions;
- semantic retrospective analysis;
- final operator-facing interpretation.

После объединения skill-а это правило не ослабевает, а становится ещё важнее.

Иначе merged skill очень быстро деградирует в непрозрачный “магический workflow”.

## Как должна выглядеть нормативная поверхность объединённого skill-а

Текущий split между skill-ами нужно заменить на один skill с явной внутренней навигацией.

Рекомендуемая структура active references:

```text
skills/dossier-engineer/
├── SKILL.md
├── references/
│   ├── overview.md
│   ├── backlog/
│   │   ├── source-model.md
│   │   ├── packet-and-patch.md
│   │   ├── actualization.md
│   │   └── command-boundaries.md
│   ├── delivery/
│   │   ├── workflow.md
│   │   ├── feature-intake.md
│   │   ├── spec-compact.md
│   │   ├── plan-slice.md
│   │   ├── implementation.md
│   │   ├── change-proposal.md
│   │   ├── step-close.md
│   │   └── closure-contract.md
│   └── telemetry/
│       ├── lifecycle-telemetry.md
│       └── retrospective-discovery.md
```

Главная идея:

- backlog guidance больше не живёт в отдельном skill;
- delivery guidance больше не живёт как “параллельная система”;
- обе части входят в один normative tree;
- navigation в `SKILL.md` должна сразу показывать, что это один skill с двумя bounded domains.

## Обязательная модель разработки merged skill

Разработка будущего объединённого `dossier-engineer` должна с самого начала идти через `skill-source-compiler`.

Это не optional tooling preference, а обязательное engineering requirement.

Причина:

- merged skill будет большим, multi-file и code-backed;
- у него будет сложная active normative surface;
- у него будет shipped runtime/CLI surface;
- у него будет повышенный риск drift между `SKILL.md`, references, runtime, tests и supporting docs.

Для такого skill-а нельзя полагаться на hand-maintained prose-only workflow.

### Обязательные правила

1. Source of truth для структуры и контента merged skill-а должен быть source bundle:
   - `skill.yaml`
   - `fragments/`
   - `references/`
   - `assets/`
   - `src/`
   - `test/`
   - `package.json`

2. Generated `SKILL.md` не должен hand-edit-иться как primary source of truth.

3. `skill-source-compiler` вводит проверяемый recommended ceiling для размера `SKILL.md`, поэтому merged skill нужно с самого начала проектировать под progressive disclosure:
   - root `SKILL.md` только для activation / workflow / navigation
   - bulk active guidance выносится в `references/*`
   - templates и bundled static resources выносятся в `assets/*`, если это действительно assets
   - `docs/*` остаётся служебной maintainer-only папкой репозитория skill-а и не должен линковаться из emitted skill
   - compile warning по размеру — это сигнал к переразбиению source bundle, а не повод автоматически повышать лимит

4. Если skill ships runtime utility, его public command surface должен описываться только через реально shipped runtime, а не через prose guesses.

5. Supporting docs должны оставаться non-normative, если source bundle явно не промоутит их в active surface.

6. Все обязательные references, assets, scripts и tests должны входить в emitted skill folder и оставаться portable.

### Обязательный compile workflow

При разработке merged skill-а canonical workflow должен быть таким:

1. редактировать source bundle files;
2. запускать compiler lint:
   `node scripts/skill-source-compiler.mjs lint <source-dir>`;
3. собирать generated skill:
   `node scripts/skill-source-compiler.mjs compile <source-dir> --out-dir <skills-dir>`;
4. проверять emitted skill:
   `node scripts/skill-source-compiler.mjs check <compiled-skill-dir>`;
5. затем запускать lint/typecheck/tests уже для самого emitted skill/runtime.

### Что это означает practically

- merged `dossier-engineer` должен быть создан как generated skill, а не как manual rewrite текущих файлов;
- merge backlog + dossier references должен происходить на уровне source bundle semantics и conflict policy;
- compile report должен использоваться как traceability artifact при регенерации;
- если в source bundle остаются unresolved conflicts между legacy backlog и dossier guidance, compile должен fail-closed, а не silently guess.

## Что объединение даст оператору

1. Один process language вместо двух частично пересекающихся словарей.

2. Один accounting root и один понятный project SSOT root вместо разрозненных operational roots.

3. Один end-to-end skill для ретро-анализа.

4. Меньше ошибок sequencing.
   Не нужно постоянно помнить, когда формально надо “переключиться в другой skill”.

5. Меньше ownership ambiguity.
   Внутри skill-а есть inner boundary, но нет межскилловой дипломатии.

6. Проще развивать process improvements.
   Изменения `pre-close`, backlog actualization, telemetry, heavy-runtime discipline и closure semantics будут проектироваться внутри одной системы.

## Главные риски объединения

### Риск 1. Skill станет слишком большим

Да, это реальный риск.

Смягчение:

- жёсткое деление references на backlog / delivery / telemetry;
- очень короткий `SKILL.md` с clear navigation;
- compile size warning трактуется как настоящий design signal;
- no hidden mandatory rules outside active references.

### Риск 2. Backlog truth потеряет строгость

Если backlog layer растворится внутри prose workflow, это будет regress.

Смягчение:

- сохранить packet/patch/refresh as explicit bounded subsystem;
- сохранить utility-owned derived state;
- не разрешать agent-у мутировать canonical backlog truth напрямую через free-form dossier prose.

### Риск 3. Dossier workflow начнёт повторно становиться backlog-discovery системой

Это как раз то, от чего система уже уходила.

Смягчение:

- явно запретить candidate-backlog resurrection;
- backlog graph остаётся единственным canonical planning layer;
- dossier intake всегда стартует от selected backlog work.

### Риск 4. Состояния будут смешаны

Смягчение:

- explicit state crosswalk;
- разные state axes;
- запрет на “единый универсальный статус feature/task/process”.

### Риск 5. CLI начнёт обещать semantic automation, которой не умеет

Смягчение:

- отдельный documented rule: CLI only for deterministic artifact work;
- no NLP contract in utility;
- semantic conclusions always agent-authored.

## Рекомендуемая стратегия миграции

Я бы не делал объединение одним резким шагом.

### Фаза 1. Объединить skill-level governance

Сначала:

- один skill `dossier-engineer`;
- backlog references переносятся внутрь него;
- current `backlog-engineer` становится deprecated source, а не long-term peer skill;
- процесс описывается как единая сквозная модель;
- source-change review contract сразу меняется на source-level review records вместо automatic item-level attention flood.

На этом этапе runtime может ещё оставаться из двух механических surfaces.

### Фаза 2. Перенести artifact topology под `.dossier`

Затем:

- backlog root переносится из отдельного root contract в `.dossier/backlog/*`;
- process discovery root становится `.dossier/manifest.json`;
- feature dossiers и global feature index получают canonical target layer в `docs/ssot/*`;
- lifecycle telemetry и backlog accounting artifacts начинают жить в одной process tree under `.dossier`.

### Фаза 3. Ужесточить unified command boundaries

После этого:

- можно решать, нужен ли один бинарь с namespaces или достаточно одного skill-а с несколькими runtime surfaces;
- можно унифицировать discoverability, help surface, reports and operator workflows.

### Фаза 4. Удалить legacy split semantics

Только после успешной стабилизации:

- retire `backlog-engineer` как отдельный skill;
- retire old root-level backlog artifact assumptions;
- убрать legacy wording, где dossier workflow живёт как будто отдельно от backlog truth.

## Мой вывод и рекомендация

Объединять skill-ы стоит.

Но объединение должно быть сделано как:

- merge of governance;
- merge of accounting/process root;
- merge of operator-facing process model;
- сохранение внутренних bounded subsystems.

Я не рекомендую такую модель:

- один плоский skill без внутренних границ;
- один универсальный state enum;
- backlog graph как подпункт внутри dossier prose;
- обязательное слияние всего runtime в один monolithic CLI с самого начала.

Я рекомендую такую модель:

- один skill `dossier-engineer`;
- один accounting root `.dossier`;
- один project SSOT root `docs/ssot`;
- backlog и dossier как две зоны внутри одной process architecture;
- backlog graph остаётся canonical planning truth;
- feature dossier остаётся canonical delivery truth и живёт как project SSOT;
- source tracking остаётся, но работает через source-level review, а не через массовое auto-raising `needs_attention`;
- actualization перестаёт быть cross-skill handoff и становится internal branch одного skill-а.

Если коротко, правильная цель выглядит так:

`Один skill. Один accounting root. Один project SSOT root. Один end-to-end workflow. Две внутренние модели истины.`
