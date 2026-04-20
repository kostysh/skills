# План разработки skill-а `unified-dossier-engineer`

## Назначение

Этот план переводит [концепцию объединённого skill-а](issues/unified-dossier-engineer-concept-2026-04-20.md) в исполнимую программу разработки нового `unified-dossier-engineer`.

План намеренно проектирует **полную замену split-модели** `backlog-engineer` + `dossier-engineer`, а не мягкий interop layer поверх старых границ.

## Фиксированные решения

Ниже перечислены решения, которые в этом плане считаются уже принятыми:

- новый skill разрабатывается как `code-backed-generated` skill через `skill-source-compiler`
- source of truth нового skill-а: `skill.yaml`, `fragments/*`, `references/*`, `src/*`, `test/*`, `package.json`
- `SKILL.md` не редактируется вручную как главный источник истины
- учётные и process artifacts живут в `.dossier`
- project-facing SSOT живёт в `docs/ssot`
- одна фича соответствует ровно одному backlog item
- merge не должен терять функционал `backlog-engineer` или `dossier-engineer`
- `change-proposal`, `contract-drift-audit`, `backlog impact verdict`, `coverage_gate`, strict closure truth и lifecycle telemetry должны сохраниться
- source-change review должен перейти от массового item-level flood к source-level review record model

## Главные ограничения

### 1. Ограничение на размер `SKILL.md`

`skill-source-compiler` вводит проверяемый recommended ceiling для корневого `SKILL.md`. Для merged skill это не косметическое ограничение, а structural constraint.

Следствия:

- root `SKILL.md` должен оставаться thin orchestration surface
- детальная методика должна жить в `references/*`
- крупные объяснения, концепции, миграционные reasoning docs и issue papers должны жить в `docs/*`
- если compile начинает предупреждать про размер, сначала надо переразбить source bundle, а не повышать лимит

### 2. Нельзя проектировать speculative runtime contract

Новый skill может документировать runnable commands только после того, как:

- реализован merged runtime
- help surface стабилизирован
- tests защищают документируемый command contract

### 3. Нельзя смешивать semantic interpretation и mechanical CLI work

CLI нового skill-а должен:

- читать и писать артефакты
- валидировать schema and invariants
- считать deterministic aggregates

CLI нового skill-а не должен:

- анализировать прозу источников
- делать NLP-классификацию изменения
- принимать semantic verdict вместо агента

## Work packages

## Package 1. Стабилизировать source bundle и emitted instruction surface

### Цель

Создать устойчивую generated-skill основу, которая выдержит рост merged skill без деградации `SKILL.md`.

### Что входит

- оформить canonical `skill.yaml`
- определить минимальный набор active references
- отделить active references от supporting planning docs
- зафиксировать compiler-first maintenance model
- установить explicit rule, что root `SKILL.md` содержит только activation, workflow, guardrails и navigation

### Acceptance

- `skill-source-compiler lint` проходит
- generated `SKILL.md` остаётся concise и не требует искусственного поднятия size ceiling
- каждый required reference reachable из `SKILL.md`
- generated output не обещает runtime surface, которого ещё нет

## Package 2. Спроектировать unified artifact topology

### Цель

Собрать backlog artifacts и dossier artifacts под одним `.dossier`, не разрушив project-facing SSOT.

### Что входит

- определить canonical tree `.dossier/backlog/*`
- определить canonical accounting/process zones `.dossier/logs/*`, `.dossier/reviews/*`, `.dossier/verification/*`, `.dossier/steps/*`, `.dossier/metrics/*`, `.dossier/retro/*`, `.dossier/ops/*`, `.dossier/drift/*`
- зафиксировать marker/discovery/root contract merged utility
- определить migration path from `.backlog/*` and current dossier-owned artifacts
- сохранить `docs/ssot/index.md` и `docs/ssot/features/F-*.md` как canonical human-facing project SSOT layer

### Acceptance

- новый `.dossier` layout покрывает только accounting/process truth для backlog и feature workflow, не подменяя project-facing SSOT
- replacement root contract описан достаточно строго для будущего CLI
- `docs/ssot` не теряет статус project-facing SSoT
- в любой момент времени существует ровно один canonical path для feature dossier truth

## Package 3. Перенести backlog truth layer без потери функционала

### Цель

Собрать backlog-side capabilities в merged skill как first-class subsystem, а не как degraded appendix.

### Что входит

- source registry
- items, dependencies, packets, patches
- deterministic backlog read-model family: `queue`, `status`, `gaps`, `attention`, `search`, `report`
- readiness and selection signals, включая `ready_for_next_step`
- canonical actualization branches
- source maintenance flows
- deterministic clean-confirmation rules

### Acceptance

- merged design сохраняет все essential backlog workflows
- merged design сохраняет backlog read surfaces и readiness signals, а не только mutation workflows
- dossier-side closure actualization продолжает опираться на canonical backlog truth
- новый skill не теряет source-traceability discipline

## Package 4. Перенести delivery workflow layer без потери строгих gate-ов

### Цель

Собрать dossier-side workflow inside the merged skill without regressions in closure/readiness discipline.

### Что входит

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- mature change path: `change-proposal`, `contract-drift-audit`, `backlog impact verdict`
- `coverage_gate`
- review freshness
- verification freshness
- pre-close / DoD readiness
- strict step closure truth

### Acceptance

- merged design сохраняет hard closure gates current dossier workflow
- `coverage_gate` остаётся отдельной axis, а не растворяется в общем status
- `one feature = one backlog item` enforced в model и workflow
- mature change path остаётся first-class delivery branch, а не деградирует в backlog appendix

## Package 5. Перепроектировать source-change review contract

### Цель

Снять массовую неопределённость после source refresh без потери safety signal.

### Что входит

- заменить immediate item-level `needs_attention` flood на `source-review record`
- определить record shape: `source_id`, linked items, outcome, resolution kind, resolution ref, resolved_at
- сделать open source review blocking signal для readiness
- определить `refresh` / `attention` replacement contract
- сохранить explicit no-op closure path

### Acceptance

- refresh больше не создает массовый item-level flood только по факту hash change
- у агента появляется deterministic next step после source change
- item-level escalation возникает только после подтвержденной backlog mutation work

## Package 6. Объединить telemetry, closure artifacts и retrospective support

### Цель

Сделать merged skill наблюдаемым и пригодным для retrospective-driven improvement без magical CLI semantics.

### Что входит

- `feature_cycle_id` и stage-local cycle IDs
- human-readable + machine-checkable intake/stage logs
- lifecycle snapshots
- session anchors
- source-review readiness signals
- closure artifacts
- separate artifact families for logs, reviews, verification, steps, and metrics
- metric contract for retrospective layer

### Acceptance

- telemetry layer реалистична и не опирается на NLP
- retrospective может строить objective signals по unified artifacts
- blocked/open/closed semantics остаются truthful
- intake/stage logs остаются `.md` artifacts with YAML frontmatter and stable machine-readable fields
- `feature_cycle_id` и stage-local identity ties позволяют deterministically связать logs, steps и lifecycle snapshots
- implementation closure truth опирается на step-close-backed evidence, а не на chat-only or speculative signals

## Package 7. Спроектировать merged runtime and command boundary

### Цель

Собрать один будущий runtime surface without command ambiguity and without premature collapse.

### Что входит

- определить future command families
- определить, что сохраняется literally, что renames, что merges
- развести workflow stages и runnable commands
- описать migration of old command entry points
- определить deprecation strategy for split skills

### Acceptance

- merged runtime surface не теряет существующие capability families
- никакая workflow stage не документируется как команда без shipped runtime
- future command boundary остаётся deterministic и testable

## Package 8. Реализовать validation, parity tests и migration rollout

### Цель

Сделать merge безопасным и обратимо-проверяемым.

### Что входит

- docs/runtime/test parity suite
- contract-style checks for generated `SKILL.md`
- migration fixtures for backlog and dossier artifacts
- transitional compatibility checks
- rollout criteria for switching operator guidance to merged skill

### Acceptance

- merge не требует верить только prose reasoning
- parity tests доказывают, что важные contracts сохранены
- split skills не объявляются legacy, пока merged skill не покрывает equivalent behavior

## Порядок реализации

Рекомендуемая последовательность:

1. Package 1
2. Package 2
3. Package 3
4. Package 4
5. Package 5
6. Package 6
7. Package 7
8. Package 8

Причина такого порядка:

- сначала фиксируется generated-skill skeleton и size discipline
- затем стабилизируется artifact topology
- затем по отдельности переносятся backlog truth и delivery workflow truth
- только после этого стоит собирать unified runtime boundary
- migration rollout должен идти последним, когда contract уже стабилен

## Главные риски имплементации

### Риск 1. Root `SKILL.md` распухнет и перестанет быть usable

Mitigation:

- aggressive reference extraction
- explicit section budget
- compile warning treated as real design signal

### Риск 2. Merge случайно потеряет backlog-side строгость

Mitigation:

- backlog truth layer переносится как отдельный package
- dossier workflow не получает права заново изобретать backlog semantics

### Риск 3. Merge случайно потеряет dossier-side closure discipline

Mitigation:

- отдельный package на workflow and closure truth
- explicit preservation of `coverage_gate`, readiness gates, and `dossier-step-close` style semantics

### Риск 4. Unified runtime начнёт обещать semantic automation

Mitigation:

- CLI/agent boundary фиксируется отдельно
- source-review redesign explicitly forbids prose classification by utility

## Validation before implementation start

Перед началом реальной имплементации merged skill должно быть истинно следующее:

- concept document remains accepted
- this plan reaches external audit `PASS`
- source bundle scaffold compiles cleanly
- no contradictory assumption remains about `.dossier` vs `docs/ssot`
- no contradictory assumption remains about `one feature = one backlog item`

## Audit status

Status: external audit PASS.

Accepted audit focus:

- no functionality loss across merged backlog and dossier domains
- no destructive artifact-topology or sequencing regressions
- compiler-first development model and `SKILL.md` size discipline
- no speculative runtime/CLI promises
- strict preservation of SSOT split, `one feature = one backlog item`, source-review redesign, `coverage_gate`, closure truth, and telemetry realism
