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
- merged runtime/CLI должен проектироваться только на основе отдельной utility specification, а не ad hoc по ходу реализации

## Главные ограничения

### 1. Ограничение на размер `SKILL.md`

`skill-source-compiler` вводит проверяемый recommended ceiling для корневого `SKILL.md`. Для merged skill это не косметическое ограничение, а structural constraint.

Следствия:

- root `SKILL.md` должен оставаться thin orchestration surface
- детальная методика должна жить в `references/*`
- тяжёлая active guidance должна жить в `references/*` и, если это шаблоны или bundled resources, в `assets/*`
- `docs/*` остаётся служебной maintainer-only папкой репозитория skill-а и не должен линковаться из emitted `SKILL.md`
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
- отделить active references and assets от maintainer-only `docs/*`
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

## Package 6.1. Зафиксировать commandized delivery workflow model

### Цель

До utility specification явно определить, что primary delivery workflows будущего merged skill-а получают собственные mechanical stage-controller commands.

### Что входит

- определить canonical delivery-stage command set:
  - `feature-intake`
  - `spec-compact`
  - `plan-slice`
  - `implementation`
  - `change-proposal`
- явно развести stage-controller commands и helper commands:
  - `contract-drift-audit`
  - `dossier-verify`
  - `review-artifact`
  - `dossier-step-close`
  - `lifecycle-refresh`
  - `next-step`
- определить mechanical role stage-controller command:
  - open / resume / block / ready-for-close transition control
  - stage-log bootstrap/update
  - prerequisite validation
  - machine-readable readiness/follow-up signals
  - explicit limit: stage-controller command authority ends at `ready_for_close`, not at authoritative `closed`
- определить minimal command-driven transition surface for logging:
  - `stage_state`
  - `entered_ts`
  - `ready_for_close_ts`
  - `transition_events[]`
  - with block/resume history kept authoritatively in `transition_events[]`, not in ambiguous singleton timestamps
- определить backlog interaction rule:
  - stage-controller commands не мутируют backlog truth напрямую
  - они materialize-ят explicit backlog follow-up requirement
  - truthful stage closure блокируется, пока required backlog actualization не завершён

### Acceptance

- не остаётся двусмысленности, какие primary delivery workflows являются first-class commands, а какие остаются helper surface
- stage-controller commands описаны как mechanical controllers, а не как semantic automation
- logging model получает deterministic transition anchors от command invocations, а не только из narrative reconstruction
- backlog effects explicit и fail-closed:
  - ordinary truth-changing stages materialize-ят backlog follow-up requirement
  - mature change path сохраняет explicit `backlog impact verdict`
- `dossier-step-close` и `lifecycle-refresh` не заменяются stage commands и остаются отдельными truthful closure / telemetry helpers
- authoritative `closed` state и lifecycle closure timestamps не дублируются на уровне stage-controller commands

## Package 7. Разработать спецификацию объединённой утилиты

### Цель

Сначала спроектировать unified utility contract как отдельный maintainer-facing specification artifact, и только после этого переходить к runtime/CLI.

### Что входит

- создать `docs/utility-spec.ru.md` как canonical maintainer-facing spec для будущей unified utility
- использовать Package 6.1 как обязательный upstream input для command/state/logging model
- определить command families, read models и mutating flows
- определить artifact contracts, root discovery, path normalization и lock semantics
- определить output contract, error contract и truthful closure/telemetry contract
- определить, какие current backlog/dossier commands сохраняются literally, а какие merge/rename/deprecate
- зафиксировать explicit boundary: utility mechanical only, no NLP or prose classification

### Acceptance

- существует единая utility specification, достаточная для runtime design без угадывания поведения “по ходу”
- spec покрывает backlog truth, delivery workflow, source-review, telemetry, closure contracts и commandized stage-control model
- spec не обещает semantic automation beyond mechanical artifact work
- implementation/runtime planning downstream ссылается на utility spec как на обязательный input

## Package 8. Спроектировать merged runtime and command boundary

### Цель

Собрать один будущий runtime surface without command ambiguity and without premature collapse, опираясь на зафиксированную utility specification.

### Что входит

- определить future command families
- определить, что сохраняется literally, что renames, что merges
- развести workflow stages и runnable commands
- описать migration of old command entry points
- определить deprecation strategy for split skills
- отразить utility spec в runtime module boundaries и help surface contract

### Acceptance

- merged runtime surface не теряет существующие capability families
- никакая workflow stage не документируется как команда без shipped runtime
- future command boundary остаётся deterministic и testable
- runtime boundary derives from approved utility spec, not ad hoc implementation choices

## Package 9. Реализовать merged runtime, help surface и compatibility launchers

### Цель

Материализовать approved utility spec и runtime-boundary design в реальный code-backed runtime, не теряя planning-stage discipline до момента фактического runtime promotion.

### Что входит

- реализовать shared runtime skeleton under `src/*`
- реализовать shipped launcher surface under `scripts/*`
- реализовать command families, определённые в utility spec и runtime-boundary package
- реализовать compatibility launchers / wrappers для split entry points, если они нужны для безопасного rollout
- реализовать help surface, JSON envelopes, symbolic error codes и lock/root behavior
- реализовать command behavior tests для shipped runtime
- выполнить runtime promotion в source bundle:
  - заполнить `skill.yaml` command surface только реально shipped commands
  - выровнять generated `SKILL.md` с реальным help/runtime contract
  - сохранить explicit separation между shipped commands и workflow prose

### Acceptance

- существует реальный merged runtime, а не только design package
- shipped help surface соответствует utility spec и runtime-boundary package
- command behavior защищён tests, а не только prose
- compatibility launchers, если они нужны, остаются явно transitional и не образуют второй неявный public contract
- generated skill перестаёт быть purely planning-stage там, где реально появился shipped runtime

## Package 10. Реализовать migration tooling, parity validation и rollout

### Цель

Сделать merge безопасным, обратимо-проверяемым и выполнимым на реальных split artifacts/operators workflows.

### Что входит

- docs/runtime/test parity suite
- contract-style checks for generated `SKILL.md`
- migration tooling для split backlog/dossier artifacts -> unified `.dossier`
- migration fixtures for backlog and dossier artifacts
- transitional compatibility checks
- rollout criteria for switching operator guidance to merged skill
- rollback / abort criteria, если migration или parity оказываются неполными

### Acceptance

- merge не требует верить только prose reasoning
- migration tooling позволяет реально перевести split artifacts в unified layout, а не только описывает это на словах
- parity tests доказывают, что важные contracts сохранены
- split skills не объявляются legacy, пока merged skill не покрывает equivalent behavior
- rollout criteria опираются на реальные runtime/help/tests/migration results, а не только на design completeness

## Package 11. Завершить replacement split skills и убрать legacy semantics

### Цель

После успешного rollout довести merge до реальной полной замены split-модели, а не оставить её в вечном transitional state.

### Что входит

- retire `backlog-engineer` как отдельный active skill после подтверждённого parity/rollout success
- retire legacy split wording в unified skill и связанных maintainers docs
- убрать old root-level backlog artifact assumptions, если migration tooling и rollout подтвердили переход на unified `.dossier`
- сузить compatibility launchers до окончательного поддерживаемого набора или удалить их, если rollout criteria допускают removal
- обновить operator guidance, чтобы unified `dossier-engineer` стал единственным canonical path

### Acceptance

- split-модель реально заменена, а не просто объявлена deprecated
- ownership unified process model больше не размыт между тремя слоями: old backlog skill, old dossier skill, new merged skill
- legacy wording и obsolete artifact assumptions убраны после подтверждённого rollout success
- compatibility surface после cleanup остаётся минимальной и намеренной, а не случайно накопленной

## Порядок реализации

Рекомендуемая последовательность:

1. Package 1
2. Package 2
3. Package 3
4. Package 4
5. Package 5
6. Package 6
7. Package 6.1
8. Package 7
9. Package 8
10. Package 9
11. Package 10
12. Package 11

Причина такого порядка:

- сначала фиксируется generated-skill skeleton и size discipline
- затем стабилизируется artifact topology
- затем по отдельности переносятся backlog truth и delivery workflow truth
- затем отдельно фиксируется commandized stage-control model для delivery workflows
- затем фиксируется utility specification как отдельный engineering contract
- затем фиксируется runtime/help/module boundary
- затем отдельно реализуется сам merged runtime, compatibility launchers и help surface
- migration tooling, parity validation и rollout должны идти последними, когда runtime уже реально существует
- только после подтверждённого rollout success можно retire-ить split skills и окончательно убрать legacy semantics

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

### Риск 4. План останется design-heavy и пропустит реальную разработку утилиты

Mitigation:

- отдельный package на runtime implementation между runtime-boundary design и rollout
- runtime promotion в `skill.yaml` только после появления реального code/help/tests surface
- parity и migration не начинаются до появления working merged runtime

### Риск 5. Merge зависнет в perpetual transitional mode

Mitigation:

- отдельный post-rollout package на retirement split skills и cleanup legacy semantics
- compatibility launchers и old wording удаляются только после rollout success, но не оставляются бесконечно “на потом”

### Риск 4. Unified runtime начнёт обещать semantic automation

Mitigation:

- CLI/agent boundary фиксируется отдельно
- source-review redesign explicitly forbids prose classification by utility

### Риск 5. Merge сохранит старую путаницу между workflow stage и command

Mitigation:

- primary delivery workflows получают explicit stage-controller commands отдельным package до utility spec
- helper commands остаются отдельным explicit family
- logging contract опирается на command-driven transition anchors, а не на implicit prose reconstruction

## Validation before implementation start

Перед началом реальной имплементации merged skill должно быть истинно следующее:

- concept document remains accepted
- this plan reaches external audit `PASS`
- source bundle scaffold compiles cleanly
- no contradictory assumption remains about `.dossier` vs `docs/ssot`
- no contradictory assumption remains about `one feature = one backlog item`
- no contradictory assumption remains about which delivery stages become first-class commands and how they interact with closure/logging/backlog follow-up

## Audit status

Status: external audit PASS.

Accepted audit focus:

- no functionality loss across merged backlog and dossier domains
- no destructive artifact-topology or sequencing regressions
- compiler-first development model and `SKILL.md` size discipline
- no speculative runtime/CLI promises
- strict preservation of SSOT split, `one feature = one backlog item`, source-review redesign, `coverage_gate`, closure truth, and telemetry realism
- explicit design of commandized delivery stages before utility-spec/runtime work
