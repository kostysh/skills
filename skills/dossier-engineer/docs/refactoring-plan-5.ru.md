# Refactoring plan 5: process hardening for `dossier-engineer`

## Назначение

Этот план задаёт следующий refactoring cycle для `dossier-engineer`.

Цель цикла:

- перенести лучший implementation experience из разработки `backlog-engineer` и `dossier-engineer` в сам skill contract;
- сделать это portable и reusable для будущих проектов, а не только для текущих skill refactor-ов;
- усилить три workflow stage:
  - `implementation`
  - `spec-compact`
  - `plan-slice`

Отдельный приоритет:

- управление аудитами (`spec-conformance`, `code`, `security`);
- logging contract и process metrics;
- явное различение normative requirements и реализационной свободы;
- раннее убийство contract-risk и drift-risk на уровне planning/spec, а не только после implementation.

## Нормативные источники истины

Для этого цикла источником истины считаются:

- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- [../SKILL.md](../SKILL.md)
- [../references/workflow.md](../references/workflow.md)

Дополнительные аналитические источники:

- внешний отчёт по логам implementation:
  `/code/projects/research/reports/backlog-dossier-log-analysis-2026-04-08.ru.md`
- локальные harmonization/process rules:
  [AGENTS.md](AGENTS.md)
- текущие logs и previous refactoring plans in `docs/`

## Почему этот цикл вообще нужен

Этот план не висит в воздухе. Он строится на двух слоях evidence:

1. Аналитика по implementation logs и corrective cycles:
   - `/code/projects/research/reports/backlog-dossier-log-analysis-2026-04-08.ru.md`
2. Текущее состояние самого `dossier-engineer` skill contract:
   - [../SKILL.md](../SKILL.md)
   - [../references/workflow.md](../references/workflow.md)

Ключевые мотивирующие findings из аналитики:

- operator/agent contract часто уточнялся слишком поздно, уже после expensive corrective cycles;
- review stack был полезен, но правила его запуска и follow-up rerounds были недоопределены;
- logs были полезны narratively, но слабы как structured process artifact;
- `spec-compact` и `plan-slice` недостаточно рано убивали contract-risk;
- docs/process/runtime drift ловился поздно, уже после real usage.

Этот цикл нужен именно для того, чтобы:

- превратить разовые harmonization rules в canonical skill contract;
- перенести лучшие process practices из refactoring experience в reusable project workflow;
- снизить зависимость от ручных corrective cycles в будущих проектах.

## Traceability: откуда взялись предложения

### 1. Audit management в `implementation`

Аналитическая мотивация:

- review stack полезен, но его нужно триггерить точнее;
- нужен стандартный review brief;
- initial verdict и final verdict надо различать явно.

Смотри в аналитике:

- раздел `3. Что улучшать в аудите и ревью`
- особенно:
  - `3.1. Review stack полезен, но его нужно триггерить точнее`
  - `3.2. Нужен стандартный review brief`
  - `3.3. Для manual logs полезно разделять "initial verdict" и "final verdict"`

Текущая слабая зона в skill:

- [../SKILL.md](../SKILL.md), `Workflow stage: implementation`
- stage описывает nested reviews и independent review, но не держит весь audit-management contract как единый reusable process layer.

### 2. Logging contract и metrics

Аналитическая мотивация:

- нужен обязательный capture старта до первого изменения;
- один package не должен содержать несколько closure targets;
- narrative полезен, но ему нужен structured metadata layer;
- нужен review event log;
- нужен `process misses` block;
- нужны metrics, пригодные для сравнения циклов.

Смотри в аналитике:

- раздел `4. Что улучшать в самом процессе разработки`
- раздел `Рекомендации по новой структуре лога`
- раздел `Какие метрики стоит собирать дальше`

Текущая слабая зона в skill:

- в canonical `SKILL.md` logging contract отсутствует;
- правила логирования живут только в [AGENTS.md](AGENTS.md), что недостаточно для reusable project workflow.

### 3. Hardening `spec-compact`

Аналитическая мотивация:

- operator/agent contract нужно фиксировать раньше и жёстче;
- safety semantics нужно фиксировать заранее;
- unresolved decisions нужно заранее triage-ить как:
  - `normative now`
  - `implementation freedom`
  - `temporary assumption`

Смотри в аналитике:

- раздел `1. Что улучшать в создании спецификаций`
- особенно:
  - `1.1. Нужно раньше и жёстче фиксировать operator/agent contract`
  - `1.3. В спецификациях недоставало явных разделов про safety semantics`
  - `1.4. Нужно различать "что обязано быть в спецификации" и "что можно оставить реализационной свободой"`

Текущая слабая зона в skill:

- [../SKILL.md](../SKILL.md), `Workflow stage: spec-compact`
- stage уже хорошо описывает compact spec authoring, но ещё не делает эти risk classes first-class obligations.

### 4. Hardening `plan-slice`

Аналитическая мотивация:

- refactoring plans недодерживали contract-risk block;
- real usage audit приходил слишком поздно;
- drift guard возникал как corrective work, а не как planned package.

Смотри в аналитике:

- раздел `2. Что улучшать в планах`
- особенно:
  - `2.1. Планам не хватало явного contract-risk блока`
  - `2.2. Плану нужен обязательный "real usage" stage-gate`
  - `2.3. Планам нужен явный drift-guard task, а не "потом посмотрим"`

Текущая слабая зона в skill:

- [../SKILL.md](../SKILL.md), `Workflow stage: plan-slice`
- stage хорошо описывает slicing, но ещё не планирует достаточно явно contract-risk cleanup и post-implementation real-usage hardening.

## Что уже решено и не переоткрывается

1. `dossier-engineer` работает downstream от `backlog-engineer`, а не конкурирует с ним за backlog extraction.
2. Внешние аудиты обязательны через spawned agents; self-review не заменяет required audit agent.
3. Для code changes нормальный audit order:
   1. `spec-conformance`
   2. `code`
   3. `security`
4. Follow-up re-audits выполняются только по реально изменённому scope и выбираются по классификатору класса внесённых правок, а не по одному грубому правилу.
5. CLI никогда не интерпретирует prose.
6. `attention` не входит в durable backlog -> dossier handoff.
7. Для truth-changing downstream stages backlog actualization входит в closure contract стадии.
8. Naming convention for skill files:
   - `SKILL.md` remains the special root file;
   - ordinary reference docs use lowercase kebab-case;
   - template files may remain uppercase to stay visually distinct.

## Основные пробелы, которые надо закрыть

### 1. `implementation` stage слишком слабо описывает audit stack

Сейчас в `implementation` есть:

- completeness review;
- nested `code-reviewer`;
- nested `security-reviewer`;
- independent review;

Но не хватает:

- обязательного `spec-conformance` как первого review layer;
- единой модели постановки audit task;
- правил classifier-based narrow re-audit;
- явного разведения:
  - internal stage gate
  - external audit
  - durable review artifacts

### 2. В skill нет нормального logging contract

Сейчас logging discipline была вынесена в локальный `docs/AGENTS.md`, но это временная мера для harmonization work.

Для будущих проектов нужен skill-owned logging contract:

- start before first edit;
- one package = one closure target;
- metadata block;
- review event log;
- process misses;
- classification of decisions beyond spec;
- useful metrics for retrospective analysis.

### 3. `spec-compact` и `plan-slice` недостаточно убивают contract-risk заранее

Из анализа логов видно, что дорогие corrective cycles часто рождались не в implementation, а раньше:

- operator/agent contract был недоопределён;
- path/root semantics были не зафиксированы;
- machine-facing output semantics были недостаточно буквальны;
- cross-skill handoffs не были выделены заранее;
- drift guard и real usage audit появлялись уже как corrective work.

Это значит:

- `spec-compact` должен раньше фиксировать operator/agent contract и safety semantics;
- `plan-slice` должен раньше планировать contract-risk cleanup, drift guard и real usage audit.

## Цель end state

После этого refactor `dossier-engineer` должен:

- иметь stage `implementation`, который задаёт полный, но компактный implementation protocol;
- иметь skill-owned refs для:
  - audit management
  - implementation logging
  - spec/plan risk patterns
- иметь `spec-compact` и `plan-slice`, которые заранее снижают вероятность later corrective cycles;
- иметь docs/tests, которые защищают новый process contract от drift.

## Package 1. `implementation` audit and logging contract

### Goal

Перенести audit management и logging contract из ad hoc harmonization rules в canonical skill process.

### Scope

- [../SKILL.md](../SKILL.md)
- [../references/workflow.md](../references/workflow.md)
- new reference:
  - `references/implementation-audit-policy.md`
- new reference:
  - `references/implementation-logging.md`
- [README.md](README.md)
- narrow docs-contract tests if needed

### Planned changes

#### A. Move audit management into skill-owned reference

Создать `references/implementation-audit-policy.md` и вынести туда:

- audit stack overview;
- role of `spec-conformance`, `code`, `security`;
- when code/security are required and when not;
- exact audit order;
- degraded-mode handling;
- classifier-based narrow re-audit rules;
- when a new narrow `spec-conformance` audit is required after follow-up fixes.

This classifier must at minimum distinguish:

- `normative/process/docs contract changes`
  - run narrow `spec-conformance`
- `runtime/code/trust-boundary changes`
  - run narrow `code` and `security`, and run narrow `spec-conformance` too if the follow-up could affect the normative contract
- `tests/typing/non-normative internal changes`
  - rerun only the audits still relevant to those changes; do not rerun `spec-conformance` automatically
- `docs polish with no normative impact`
  - no automatic external re-audit unless the change touches a normative/process surface

#### B. Add review brief template

В `implementation-audit-policy.md` явно зафиксировать стандартный audit brief:

- agent role;
- required skill (`spec-conformance-reviewer`, `code-reviewer`, `security-reviewer`);
- exact scope / boundaries;
- normative basis;
- changed files;
- explicit exclusions;
- already-known or already-fixed findings;
- specific review question;
- brevity mode expectation;
- attention to details and side effects;
- note that tables / matrices / executive summaries are requested only when explicitly needed.

#### C. Add expected audit output shape

Зафиксировать preferred narrow audit answer shape:

- verdict;
- findings only when present;
- each finding:
  - severity
  - concrete issue
  - evidence / file reference
  - why it matters
- no filler
- no tables/matrices unless explicitly requested

Это не должен быть verbose review report contract; это должен быть concise audit contract.

#### D. Add implementation log contract

Создать `references/implementation-logging.md` и зафиксировать:

- start log entry before first edit;
- package id / cycle id;
- `session_id`;
- one package = one closure target;
- mandatory metadata block;
- mandatory review event log;
- mandatory process misses block;
- final commit recording;
- exact duration recording when possible.

Recommended metadata block must include at minimum:

- `package_id`
- `cycle_id`
- `skill`
- `package_type`
- `change_kind`
- `normative_sources`
- `session_id`
- `start_ts`
- `ready_for_review_ts`
- `final_pass_ts`
- `commit_ts`
- `commit_sha`
- `review_policy`
- `review_rounds`
- `review_findings_total`
- `out_of_spec_decisions_total`
- `duration_minutes`
- `log_quality`

#### E. Add explicit decision classes for logging

`implementation-logging.md` must separate:

- `Spec gap decisions`
- `Implementation freedom decisions`
- `Temporary assumptions`

Это должно быть не просто рекомендацией, а explicit logging rule.

#### F. Add useful metrics, not only the template

В `implementation-logging.md` explicitly list recommended metrics to collect.

At minimum:

- package metrics:
  - `package_type`
  - `change_kind_count`
  - `scope_paths_count`
  - `duration_minutes`
  - `review_rounds_total`
  - `out_of_spec_decisions_total`
  - `process_misses_total`
  - `commit_recorded`
  - `duration_exact`
- review metrics:
  - initial verdict by review type
  - final verdict by review type
  - findings count by review type
  - findings count by severity
  - reround count
  - `ready_for_review -> first verdict` latency
  - `first non-pass -> final pass` latency
  - stale finding count
  - skipped review count and reason
- specification/process metrics:
  - `spec_gap_decisions_total`
  - `implementation_freedom_decisions_total`
  - `temporary_assumptions_total`
  - `cross_skill_boundary_changes_total`
  - `doc_runtime_drift_incidents_total`
  - `plan_corrective_cycles_after_main_plan`
  - `packages_triggered_by_real_usage_feedback`
- process metrics:
  - missing start timestamp packages
  - missing commit id packages
  - restored-after-start log incidents
  - packages without exact duration
  - operator clarification packages
  - packages where review brief quality caused rework
- operator/agent contract metrics:
  - ambiguity incidents in `SKILL.md`
  - help/discoverability defects
  - machine-field overload incidents
  - path/root semantics incidents
  - docs-only normative fixes count
  - docs-contract tests added/updated

#### G. Refactor `Workflow stage: implementation`

Keep `SKILL.md` compact.

In the `implementation` stage itself:

- add one compact paragraph that external audits are governed by `IMPLEMENTATION_AUDIT_POLICY.md`;
- add one compact paragraph that logging is governed by `IMPLEMENTATION_LOGGING.md`;
- keep only the stage-local summary in `SKILL.md`;
- do not duplicate the full templates there.

### Acceptance

- `implementation` stage clearly includes `spec-conformance` as the first required audit for implementation changes;
- audit order and reround policy are explicit and no longer live only in `docs/AGENTS.md`;
- implementation logging is described by the skill itself through local references;
- `session_id` is part of the mandatory logging metadata;
- recommended metrics are explicitly documented, not merely implied by the template;
- `SKILL.md` stays compact and points to the new refs instead of duplicating them;
- docs-contract tests protect the new wording where necessary.

## Package 2. `spec-compact` and `plan-slice` hardening

### Goal

Reduce later corrective cycles by making spec and planning stages kill contract-risk earlier.

### Scope

- [../SKILL.md](../SKILL.md)
- [../references/workflow.md](../references/workflow.md)
- new reference:
  - `references/spec-and-plan-risk-patterns.md`
- [README.md](README.md)
- narrow docs-contract tests if needed

### Planned changes

#### A. Harden `spec-compact`

`spec-compact` should explicitly tell the agent to identify and record when relevant:

- operator/agent contract;
- machine-facing output contract;
- ambiguity policy;
- path/root semantics;
- cross-skill handoff semantics;
- error interpretation rules;
- safety and boundary semantics:
  - path ownership
  - symlink policy
  - rollback
  - partial success
  - concurrency
  - stale state handling
  - provenance

Also add explicit triage for unresolved decisions:

- `normative now`
- `implementation freedom`
- `temporary assumption`

#### B. Harden `plan-slice`

`plan-slice` should explicitly force planning of:

- contract risks to kill before close-out;
- drift-guard work where the system has multiple normative layers;
- real usage audit after the main implementation flow for agent/operator-facing systems;
- corrective backlog categories for real usage findings:
  - docs-only
  - runtime
  - schema/help
  - cross-skill
  - audit-only

#### C. Keep this compact through a reference

Create `references/spec-and-plan-risk-patterns.md` with:

- risk classes to check during `spec-compact`;
- risk classes to plan during `plan-slice`;
- examples of contract-risk;
- examples of real-usage-stage findings;
- examples of drift-guard tasks.

Then keep `SKILL.md` concise and refer to this file.

### Acceptance

- `spec-compact` explicitly captures operator/agent contract and safety semantics when relevant;
- `spec-compact` explicitly classifies unresolved decisions instead of leaving them all as vague open items;
- `plan-slice` explicitly plans contract-risk cleanup, drift guard, and real usage audit when relevant;
- the new reference keeps detailed risk patterns out of the main skill text;
- docs-contract tests protect the critical wording where needed.

## Review order

This cycle is normative docs/process work, so every package must go through external spec/process review.

### Package 1

1. narrow `spec-conformance` / process review against:
   - [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
   - [../SKILL.md](../SKILL.md)
   - this plan

### Package 2

1. narrow `spec-conformance` / process review against:
   - [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
   - [../SKILL.md](../SKILL.md)
   - this plan

Do not run code/security review unless the package unexpectedly changes executable code or code-backed tests.

## Definition of done

This cycle is complete only when:

1. `implementation` stage no longer relies on harmonization-only `docs/AGENTS.md` as the primary place for audit/logging rules.
2. Audit management lives in a skill-owned local reference and includes `spec-conformance`, task briefing rules, and reround rules.
3. Implementation logging lives in a skill-owned local reference and includes `session_id`, metadata block, review events, process misses, and metrics.
4. `spec-compact` and `plan-slice` explicitly reduce contract-risk instead of leaving those issues to late corrective cycles.
5. The resulting contract is reusable for future projects, not tailored only to the current skills repository.
