# Аудит `unified-dossier-engineer` против рекомендаций GPT-5.5

Дата: 2026-04-27

## Цель и рамки

Цель аудита — сопоставить активную поверхность скила `unified-dossier-engineer` с официальными рекомендациями OpenAI по промптингу GPT-5.5 и выявить места, где текущая методика может ухудшать работу модели: провоцировать избыточное планирование, механическое следование процессу, лишние tool loops, слабые stop rules или неверную оркестрацию внешних аудитов.

Аудировались только активные и обслуживающие поверхности скила:

- `SKILL.md` как скомпилированная активная поверхность.
- `skill.yaml`, `fragments/overview.md` и `references/*` как source bundle и активные нормативные ссылки.
- help surface runtime: `dossier-engineer help`, `help implementation`, `help review-artifact`, `help dossier-step-close`.

`docs/issues/*`, `docs/logs/*` и исторические планы не трактовались как нормативные, кроме проверки навигации и текущего контекста.

## Источники OpenAI

Использован `openai-docs`: `latest-model.md` подтвердил `gpt-5.5`, `upgrading-to-gpt-5p5.md` и `prompt-guidance.md` как актуальные guide URLs. Локальный resolver вернул:

```json
{
  "model": "gpt-5.5",
  "modelSlug": "gpt-5p5",
  "migrationGuideUrl": "https://developers.openai.com/api/docs/guides/upgrading-to-gpt-5p5.md",
  "promptingGuideUrl": "https://developers.openai.com/api/docs/guides/prompt-guidance.md"
}
```

Официальные источники:

- OpenAI, [Using GPT-5.5](https://developers.openai.com/api/docs/guides/latest-model)
- OpenAI, [Upgrading to GPT-5.5](https://developers.openai.com/api/docs/guides/upgrading-to-gpt-5p5.md)
- OpenAI, [Prompt guidance for GPT-5.5](https://developers.openai.com/api/docs/guides/prompt-guidance?model=gpt-5.5)

Ключевые рекомендации, примененные к аудиту:

- GPT-5.5 лучше работает с короткими outcome-first инструкциями, где явно заданы результат, критерии успеха, ограничения, доступный контекст и форма ответа.
- Не стоит переносить весь legacy prompt stack: избыточные process-heavy инструкции могут добавлять шум, сужать пространство поиска и делать ответы слишком механическими.
- `ALWAYS`, `NEVER`, `must`, `only` стоит оставлять для настоящих инвариантов; для judgment calls лучше давать decision rules.
- Нужны явные stop conditions, особенно для tool-heavy, evidence-gathering и long-running workflows.
- Reasoning effort по умолчанию `medium`; `high`/`xhigh` не являются автоматическим улучшением и должны оправдываться evals/измеримой выгодой.
- Для coding agents нужно явно задавать reuse, delegation, tests, acceptance criteria и когда продолжать, а когда просить помощь.
- Для tool-heavy Responses workflows важны preambles, assistant-item replay и сохранение API-level `phase`.
- Если формат должен быть машинно-валидируемым, Structured Outputs предпочтительнее описания схемы в промпте; для CLI/runtime контрактов это означает опору на валидаторы и helper-команды, а не на free-form JSON от модели.

## Общий вердикт

Прямого конфликта с GPT-5.5 нет. Напротив, скил уже хорошо совпадает с сильными сторонами модели: строгие критерии закрытия, явные verification artifacts, audit bundles, fail-closed правила, разделение runtime-механики и agent-owned семантики.

Главный риск не в отсутствии дисциплины, а в ее форме. Активная поверхность местами выглядит как legacy process-heavy prompt stack: много абсолютов, длинные последовательности, подробные схемы и обязательные audit rituals. Для GPT-5.5 это нужно сохранить как runtime/closure инварианты, но переоформить agent-facing части в outcome-first decision rules: что считается успешным результатом, какая минимальная достаточная проверка нужна, когда остановиться, когда блокировать, когда просить разрешение на delegation.

## Что уже хорошо совпадает с GPT-5.5

| Область | Где в скиле | Почему совпадает |
| --- | --- | --- |
| Outcome/contract focus | `SKILL.md` lines 16-54; `references/status-and-scope.md` lines 24-31 | Есть четкий canonical scope, `.dossier`/`docs/ssot`, one feature = one backlog item, closure truth. |
| Verification-first workflow | `references/delivery-workflow-layer.md` lines 188-213; `references/runtime-and-command-boundary.md` lines 79-117 | Закрытие требует verification, review artifacts, lifecycle reconciliation и post-close hygiene. |
| Tool/runtime boundary | `references/commandized-stage-control.md` lines 54-82 | Runtime не подменяет agent-owned семантику и не делает скрытых решений. |
| Audit evidence durability | `references/audit-policy.md` lines 165-195; `references/telemetry-and-closure.md` lines 39-52 | Review attempts, freshness, invalidation и immutable artifacts явно сохраняются. |
| Structured coordination | `references/telemetry-and-closure.md` lines 91-105 | Machine fields отделены от prose; это снижает зависимость от свободного текста модели. |
| Prompt-size discipline | `references/source-bundle-governance.md` lines 20-28 | Уже есть progressive disclosure и запрет раздувать root `SKILL.md`. |

## Матрица точек напряжения

| ID | Приоритет | Рекомендация GPT-5.5 | Место в скиле | Текущая формулировка / поведение | Напряжение | Предложение |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | High | Короткий outcome-first prompt вместо переноса всего legacy stack | `skill.yaml` lines 31-85, 154-166; `SKILL.md` lines 395-409; `references/source-bundle-governance.md` lines 20-28 | 12 ссылок помечены required, root `SKILL.md` содержит большой command catalog. | Агент может читать слишком много активной поверхности и переусложнять задачу до первого действия. | Ввести model-agnostic `Start here` profile: всегда читать `status-and-scope`, затем только references по изменяемой поверхности. В `SKILL.md` явно сказать: required references are required when their trigger applies, not always all upfront. |
| T2 | High | Абсолюты оставлять только для истинных инвариантов; judgment calls оформлять decision rules | `SKILL.md` lines 39-45, 350-369; `references/audit-policy.md` lines 45-49, 115-128; `references/delivery-workflow-layer.md` lines 111-121 | Много `must`, `must not`, fail-closed, rerun, never replace. | Большая часть абсолютов оправдана, но они смешаны с agent-owned judgment areas и могут провоцировать механическое выполнение без оценки достаточности. | Разделить в active references блоки `Hard invariants` и `Agent decision rules`. Сохранять hard gates жесткими, но для поиска, чтения, refresh, pre-close rehearsal и review rerun добавить decision/stop rules. |
| T3 | High | Явные stop conditions для tool-heavy workflows | `references/source-review-contract.md` lines 13-19, 91-105; `references/delivery-workflow-layer.md` lines 107-121; `references/commandized-stage-control.md` lines 238-254 | Есть канонические последовательности, но мало критериев "достаточно, можно остановиться". | GPT-5.5 может продолжать refresh/status/attention/queue или audit loops сверх нужного, особенно при high reasoning. | Добавить компактные stop rules по стадиям: minimum sufficient evidence, max useful loop, when to answer/close/block, when to rerun verification/audits. |
| T4 | High | Для coding agents явно задавать delegation и когда просить помощь | `SKILL.md` line 39; `references/audit-policy.md` lines 117-130; `references/audit-handoff-recipes.md` lines 18-23 | Blocking audits require spawned external reviewer agents without forked/full-history context. | Скил не говорит, что делать, если текущий runtime требует явного разрешения оператора на spawned agents или delegation недоступна. | В `audit-policy.md` добавить stop rule: если среда требует operator permission для external reviewer execution, агент просит разрешение и не закрывает stage до ответа. Если delegation недоступна, closure остается blocked. |
| T5 | High | Handoff prompts лучше строить как goal/success/constraints/output/stop | `references/audit-handoff-recipes.md` lines 24-59 | Handoff skeleton в основном field list + команды после review. | Для GPT-5.5 это работает, но выглядит как process-heavy form. Не хватает явных success criteria и stop rules для PASS/FAIL. | Переписать skeleton в outcome-first структуру: Goal, Success criteria, Inputs, Constraints, Review focus, Output, Stop rules, Review-artifact recording. Содержимое не менять, только форму и критерии. |
| T6 | Medium | Reasoning effort: `medium` default, `high/xhigh` только при измеримой выгоде; verbosity задавать отдельно | Нет явного места; косвенно `SKILL.md` lines 91-100 и runtime verification commands | Скил не дает модели или оператору workload profile для reasoning/verbosity. | Для long-running/audit задач модель может сама эскалировать усилие или переобъяснять; для простых read-model команд может быть избыточной. | Не добавлять model-numbered reference. Вместо этого добавить model-agnostic раздел в `status-and-scope.md` или стабильный `references/agent-operating-profile.md`: balanced/default reasoning for normal work, lighter posture for simple read/help/report tasks, heavier effort only for risk/eval-justified work, concise output через explicit length/format. |
| T7 | Medium | Схемы лучше валидировать машинно, а не описывать как prompt output | `references/source-review-contract.md` lines 21-40; `references/commandized-stage-control.md` lines 97-171; `references/implementation-pre-review-checklists.md` lines 34-67 | В refs много JSON/DSL schema text. | Это не model-output schema, а runtime contract. Но модель может начать hand-author JSON/DSL там, где нужно использовать CLI/template/validator. | Явно пометить такие блоки как `Runtime artifact contract, not free-form model output`. Для будущих API integrations: use Structured Outputs/Zod/parser validation; для CLI: use templates/helper commands. |
| T8 | Medium | Tool-specific guidance лучше держать в tool descriptions; prompts должны содержать только cross-tool policy | `SKILL.md` command catalog lines 110-347; `references/runtime-and-command-boundary.md` lines 203-219 | Root skill повторяет все команды, runtime help тоже их описывает. | Дублирование может увеличивать prompt surface и риск drift, хотя docs-contract tests частично защищают. | Сохранить command catalog как contract, но добавить правило: при сомнении подтверждать `dossier-engineer help <command>` перед использованием/документированием опций. В будущей MCP/tool экспозиции перенести details в tool descriptions. |
| T9 | Medium | API-level `phase` важен для Responses replay | `references/commandized-stage-control.md` line 123; `references/telemetry-and-closure.md` line 95 | Скил использует поле `phase_scope`. | Возможна путаница между dossier `phase_scope` и OpenAI assistant-item `phase` (`commentary`/`final_answer`). | Добавить примечание: `phase_scope` — dossier workflow scope, не Responses API `phase`. Если host вручную replays assistant items, API `phase` сохраняется отдельно и неизменно. |
| T10 | Medium | Preambles улучшают tool-heavy UX | В активной поверхности скила прямого правила нет; global agent rules могут покрывать Codex | Скил не предписывает короткое operator update перед длинными stage/audit/tool workflows. | В portable skill при использовании другими рантаймами это может потеряться. | В `Start here` или `delivery-workflow-layer.md` добавить portable правило: если среда поддерживает user-visible progress updates, перед multi-step tool/audit workflow дать 1-2 предложения о первом шаге; не превращать это в stage evidence. |
| T11 | Medium | Coding workflows need acceptance criteria, tests, continue vs ask | `references/delivery-workflow-layer.md` lines 68-82, 92-121; `references/telemetry-and-closure.md` lines 148-158 | `plan-slice` требует target/completion recognition/boundaries, но нет единой таблицы "ask/block/continue". | GPT-5.5 лучше работает, когда ambiguity handling явно задан. | Добавить таблицу stage-level decision rules: continue, ask operator, block stage, perform backlog actualization, launch audit, rerun verification. |
| T12 | Low | Prompt caching: static first, dynamic last | `references/source-bundle-governance.md` lines 20-28; `SKILL.md` required reference map lines 395-409 | Progressive disclosure есть, но не привязана к GPT-5.5 caching. | Низкий риск: skill loading уже статичен, но длинные refs могут попасть в контекст раньше динамических данных. | Добавить в maintainer guidance: держать стабильные правила в `SKILL.md`/refs, а task-specific data вводить позже; не копировать project-specific dynamic context в skill. |
| T13 | Low | Current date не нужно добавлять в system prompts, кроме business timezone/policy date | Активный скил не добавляет дату как prompt instruction; runtime timestamps являются данными | Конфликта нет. | Не менять. В будущих docs не добавлять "current date" как generic skill instruction; timestamps должны быть artifact data. |
| T14 | Low | Higher reasoning is not automatically better; avoid ambiguous model-tier rules | `references/audit-policy.md` line 125 | "weak or mini models do not satisfy blocking audit requirements". | Правило полезно, но "weak" и "mini" не определены и может вступать в конфликт с eval-backed routing. | Уточнить как policy: blocking audits require an approved reviewer-grade model/profile; smaller models may run non-blocking triage only unless project evals explicitly certify them for that audit class. |

## Детальные наблюдения

### 1. Скил почти готов к GPT-5.5, но нуждается в "de-noising"

OpenAI прямо рекомендует не переносить legacy prompt stack в GPT-5.5 целиком. В `unified-dossier-engineer` значительная часть подробности является не legacy noise, а реальными runtime/closure инвариантами. Поэтому правильная доработка — не удалить строгость, а маркировать уровни строгости:

- `Hard invariants`: canonical layout, closure truth, audit bundle, no forked review context, no source-review auto-ack, no semantic runtime inference.
- `Decision rules`: когда читать дополнительные references, когда запускать refresh, когда делать pre-close rehearsal, когда rerun audits, когда просить оператора.
- `Examples/templates`: handoff skeletons, command examples, JSON/DSL snippets.

Так модель будет понимать, где нельзя импровизировать, а где нужно выбирать минимально достаточный путь.

### 2. External audit policy сильная, но не хватает permission stop rule

Скил требует spawned external reviewer agents (`references/audit-policy.md` lines 117-128). Это соответствует рекомендации GPT-5.5 быть явными насчет delegation. Но в portable context не всякий runtime разрешает delegation без отдельного operator consent. Сейчас активный скил говорит, что audit должен быть launched correctly, но не фиксирует stop rule для отсутствия разрешения.

Нужная доработка: перед external review добавить fail-closed ветку:

- если runtime поддерживает independent reviewer execution и разрешение уже есть — launch external review;
- если runtime требует explicit operator permission — спросить разрешение и остановить closure workflow до ответа;
- если independent execution недоступна — записать blocker/process miss, не закрывать stage.

### 3. Audit handoff skeleton стоит переписать под outcome-first

Текущий skeleton полезен, но field-heavy. GPT-5.5 лучше управляется короткой структурой, где сначала видно outcome. Предлагаемая форма:

```text
Goal:
Review this dossier stage and return PASS only if the checked scope satisfies the stated requirements and closure policy. Do not implement fixes.

Success criteria:
- required source materials were checked
- material scope matches the stage objective
- verification/review evidence is fresh for the checked scope
- no required blocker remains unresolved
- verdict is recorded through review-artifact

Constraints:
- read-only audit analysis
- do not change product/source/test/backlog truth files
- do not change HEAD
- record only the managed review-artifact accounting write after deciding PASS/FAIL

Inputs:
...

Reviewer focus:
...

Stop rules:
- PASS when no blocking finding remains for this audit class
- FAIL when a must-fix issue blocks truthful closure
- If required evidence is missing, FAIL with the smallest missing evidence list
```

Это не меняет политику, но снижает вероятность механического заполнения формы без суждения о достаточности.

### 4. `phase_scope` нужно отделить от Responses API `phase`

OpenAI отдельно предупреждает про assistant-item `phase` в long-running/tool-heavy Responses workflows. В скиле есть `phase_scope`, но это dossier-local поле для workflow scope. Сейчас нет явного предупреждения, что это разные понятия. Для GPT-5.5 это важно, потому что агент может ошибочно считать, что запись `phase_scope` в stage state покрывает API-level replay semantics.

Предложение: добавить короткое примечание в `commandized-stage-control.md` и `telemetry-and-closure.md`:

- `phase_scope` belongs to dossier workflow accounting.
- It is not the OpenAI Responses assistant-item `phase`.
- If a host manually replays Responses output items, preserve API `phase` unchanged outside the dossier schema.

### 5. Runtime schema text допустим, но должен быть явно "не промпт-схемой"

Официальная рекомендация "не описывать schema in prompt, use Structured Outputs" не конфликтует напрямую со скилом: здесь схемы — runtime contracts, backed by CLI, tests, Zod/TypeScript, JSON artifacts. Но это стоит назвать явно, чтобы будущие редакторы не добавляли новые free-form output schemas в prompt surface.

Предложение: в `runtime-and-command-boundary.md` или `source-bundle-governance.md` добавить правило:

- schema snippets in references describe persisted runtime artifacts and CLI DSLs;
- agents should prefer `template`, helper commands, runtime validation, tests, and docs-contract checks;
- do not ask the model to hand-author machine JSON when a runtime command can generate or validate it.

## Предложение по доработке

### Пакет 1: Model-agnostic agent operating profile

Не создавать `references/gpt-5.5-operating-profile.md`. Активный скил не должен зашивать номер текущей модели в постоянную структуру: при выходе GPT-5.6 или следующей модели это создаст искусственную миграционную задолженность.

Вместо этого:

- preferred path: добавить короткий model-agnostic раздел в `references/status-and-scope.md` или `references/source-bundle-governance.md`;
- if a separate file is justified by size: назвать его стабильно, например `references/agent-operating-profile.md`, без model slug;
- GPT-5.5 оставить только как источник этого аудита, а не как имя активного skill contract.

Содержимое:

- outcome-first operating posture for reasoning-model agents;
- reasoning effort guidance by workload class without naming one model version;
- verbosity/formatting guidance for reports, audits, and final operator updates;
- stop rules for tool-heavy stage work;
- note that skill instructions are context, not a standalone prompt to paste into another prompt;
- model-specific guidance belongs in dated audit/migration reports, not in durable reference filenames.

Минимальная таблица workload profile:

| Workload | Recommended posture |
| --- | --- |
| `help`, `status`, `items`, simple docs lookup | concise, low/medium reasoning, stop after direct answer |
| source-review triage | medium, bounded evidence, stop after canonical resolution path is known |
| plan/spec/implementation maintenance | balanced/default reasoning, explicit acceptance/verification, escalate only for complex ambiguity |
| final audit/closure decisions | project-approved reviewer-grade profile; heavier effort only when evals or risk justify |
| broad architecture redesign | operator-approved deeper reasoning when scope warrants it; require explicit success criteria |

### Пакет 2: Start-here progressive disclosure

Изменить source bundle, а не hand-edit `SKILL.md`:

- `skill.yaml`: уточнить startHere:
  - read `status-and-scope` first;
  - read only references whose trigger matches the current contract surface;
  - if uncertain, build a short reference plan before opening many files.
- `references/source-bundle-governance.md`: добавить model-agnostic de-noising rule for reasoning-model migrations.

### Пакет 3: Outcome-first audit handoff recipes

Переписать `references/audit-handoff-recipes.md`:

- сохранить все поля и review-artifact commands;
- добавить Goal, Success criteria, Constraints, Inputs, Reviewer focus, Output, Stop rules;
- добавить explicit missing-evidence behavior: FAIL with smallest missing evidence set.

### Пакет 4: Delegation permission / unavailable external review stop rule

Изменить:

- `references/audit-policy.md`
- `references/audit-handoff-recipes.md`
- `references/delivery-workflow-layer.md`

Добавить:

- if current runtime requires explicit permission to spawn/delegate independent reviewers, ask operator permission before launch;
- if permission is denied or unavailable, stage remains blocked/open;
- do not substitute self-review or same-thread review.

### Пакет 5: Stage-level decision rules

В `references/delivery-workflow-layer.md` добавить компактную таблицу:

| Stage | Continue when | Ask operator when | Block when | Stop when |
| --- | --- | --- | --- | --- |
| `feature-intake` | selected backlog item and source trace are clear | item identity/scope materially ambiguous | unsupported layout or missing required source | durable intake log/state exists and audit path is known |
| `spec-compact` | requirements/AC can be framed from sources | AC conflict materially changes scope | selected item cannot reach `specified` truth | spec is sufficient for planning and backlog truth reconciles |
| `plan-slice` | target, completion recognition, boundaries are explicit | implementation objective ambiguous | future agent would need prior chat to rediscover goal | plan can be executed without hidden context |
| `implementation` | scope, verification, audit bundle, backlog target are clear | protected side-effect/risk family needs operator decision | verification/audit/backlog reconciliation fails | step-close and post-close hygiene evidence are durable |

### Пакет 6: `phase_scope` clarification

Изменить `references/commandized-stage-control.md` и `references/telemetry-and-closure.md`:

- define `phase_scope` as dossier workflow accounting field;
- explicitly state it is not OpenAI Responses `phase`;
- mention API-level `phase` preservation only as host integration guidance, not runtime artifact proof.

### Пакет 7: Contract tests / docs parity

После изменения source bundle:

- regenerate generated `SKILL.md` and `docs/compile-report.md` with the skill-source compiler;
- run docs-contract and runtime tests;
- inspect help output if any command wording changes;
- avoid changing runtime behavior unless a proposed docs change promises a new command/flag/output field.

## Рекомендуемый порядок реализации

1. Пакеты 2, 4, 6: самые маленькие и самые важные для GPT-5.5 orchestration safety.
2. Пакет 3: audit handoff recipe rewrite, потому что это наиболее prompt-facing часть скила.
3. Пакет 5: stage decision rules, чтобы снизить overthinking и зависимость от prior chat.
4. Пакет 1: model-agnostic operating profile как сводный reference/раздел после того, как локальные правила стабилизированы.
5. Пакет 7: parity/tests обязательны для любого изменения active source bundle.

## Проверки, выполненные для этого отчета

- Получены актуальные OpenAI docs через `openai-docs` MCP и resolver.
- Официальный `prompt-guidance?model=gpt-5.5` открыт на `developers.openai.com`.
- Прочитаны `SKILL.md`, `skill.yaml`, `fragments/overview.md`, все active `references/*`.
- Проверена runtime help surface для top-level, `implementation`, `review-artifact`, `dossier-step-close`.
- Изменения runtime/source bundle не выполнялись; отчет является supporting maintainer doc и не меняет активный skill contract.
