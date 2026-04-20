# План рефакторинга 14: heavy-runtime discipline — runtime envelope upfront и smoke только как final gate

Дата: `2026-04-20`
Компонент: `dossier-engineer`
Основание: [issues/improvement-proposal-20260420-3.md](issues/improvement-proposal-20260420-3.md)
Скоп: `SKILL.md`, `references/workflow.md`, `references/workflow-stage-spec-compact.md`, `references/workflow-stage-plan-slice.md`, `references/workflow-stage-implementation.md`, `references/DOSSIER_TEMPLATE.md`, `references/workflow-stage-logging.md`, docs-contract tests, `docs/README.md`

## Цель

Закрыть повторяющийся process gap из ретроанализа: heavy-runtime feature попадает в implementation без явного runtime envelope и без verification ladder, поэтому дорогостоящий smoke становится default working loop вместо targeted probes и отдельного final gate.

После рефакторинга агент должен:

- заранее отличать ordinary feature от heavy-runtime / expensive-runtime feature;
- фиксировать compact runtime envelope уже на `spec-compact`, когда heavy-runtime trigger реально сработал;
- превращать verification plan на `plan-slice` в literal ladder, а не в broad label вроде `smoke` или `runtime test`;
- различать `debug probe` и `final smoke gate` как разные методические роли;
- считать repeated heavy smoke / repeated cold-start / repeated cache-download reruns process smell, а не нейтральным ходом работы;
- использовать utility только как mechanical helper и не ожидать от CLI semantic анализа runtime pain, prose или root cause.

План усиливает spec/planning/implementation discipline. Он не проектирует полноценную runtime-observability систему и не переносит в `dossier-engineer` ops/runbook обязанности.

## Нормативные источники

- [../SKILL.md](../SKILL.md)
- [../references/workflow.md](../references/workflow.md)
- [../references/workflow-stage-spec-compact.md](../references/workflow-stage-spec-compact.md)
- [../references/workflow-stage-plan-slice.md](../references/workflow-stage-plan-slice.md)
- [../references/workflow-stage-implementation.md](../references/workflow-stage-implementation.md)
- [../references/DOSSIER_TEMPLATE.md](../references/DOSSIER_TEMPLATE.md)
- [../references/workflow-stage-logging.md](../references/workflow-stage-logging.md)
- [issues/improvement-proposal-20260420-3.md](issues/improvement-proposal-20260420-3.md)

## Связанный контекст и compatibility notes

Эти материалы важны для sequencing и совместимости, но не являются нормативным основанием этого плана:

- [issues/improvement-proposal-20260420-2.md](issues/improvement-proposal-20260420-2.md)
- [issues/improvement-proposal-20260420-1.md](issues/improvement-proposal-20260420-1.md)
- [refactoring-plan-13.ru.md](refactoring-plan-13.ru.md)

## Не цели

- Не запрещать heavy smoke вообще.
- Не требовать runtime envelope для trivial / docs-only / lightweight features без expensive runtime path.
- Не превращать `spec-compact` в низкоуровневый ops runbook, capacity plan или perf benchmark spreadsheet.
- Не вводить новые CLI commands или magical CLI behavior; CLI здесь only reads/writes artifacts, validates shape, and computes deterministic fields.
- Не делать logging redesign, metric engine, runtime profiler, или automatic smell detector в этом плане.
- Не подменять targeted probes, когда единственным честным proof seam остается end-to-end smoke path.
- Не дублировать `pre-close / DoD readiness gate`; этот план задает proof discipline upstream и сочетается с [refactoring-plan-13.ru.md](refactoring-plan-13.ru.md), но не встраивает его заново.

## Базовые решения

1. Heavy-runtime discipline является trigger-based, а не universal-by-default.
2. `Spec-compact` владеет runtime envelope: какие expensive runtime assumptions вообще допустимы до implementation.
3. `Plan-slice` владеет verification ladder: какой proof должен идти cheap-first и что остается для final smoke gate.
4. `Implementation` владеет negative rule: heavy smoke не является default debug loop.
5. `Debug probe` и `final smoke gate` — разные методические понятия:
   - `debug probe` локализует одну гипотезу или небольшой seam cheapest adequate way;
   - `final smoke gate` подтверждает closure target или allowed-stop-point behavior на реальном expensive path.
6. Repeated heavy smoke reruns, repeated cold-start reruns, repeated cache/download reruns, and repeated multi-runtime bootstrap loops are process smell unless they are explicitly justified by the only-observable-seam rule or by operator choice.
7. Первый релиз должен использовать уже существующий operator-facing signal surface:
   - literal wording в active workflow docs;
   - existing stage-log contract for `spec-compact`, `plan-slice`, and `implementation`.
   Heavy-runtime misuse is an implementation-specific `process miss`; because a process miss already triggers log creation/update in the current contract, этот план intentionally adds a narrow logging/process-side effect without introducing a new telemetry schema.
8. When the heavy-runtime branch is active, retrospective telemetry is reasonably expected for the affected stage:
   - `spec-compact` and `plan-slice` therefore should not use the trivial skip path;
   - durable stage-log evidence for trigger/envelope/ladder decisions is part of the intended method.
9. Runtime envelope должен быть compact и decision-oriented. Он фиксирует engineering contract, а не полную эксплуатационную инструкцию.
10. Если heavy smoke is the only honest observable seam, это должно быть spelled out explicitly in dossier method instead of being inferred ad hoc during implementation.
11. Default skill trigger model is a floor, not a ceiling:
   - repo overlays may add stricter heavy-runtime triggers;
   - repo overlays may require stronger proof or smoke discipline than the default skill.

## Package 1. Shared heavy-runtime trigger model и vocabulary

### Смысл

Нужно сначала зафиксировать в active normative surface, когда вообще включается expensive-runtime discipline и какими терминами агент обязан мыслить. Без этого downstream stage rules будут читаться как бюрократический overreach.

### Файлы

- `SKILL.md`
- `references/workflow.md`
- `test/docs-contract.test.ts`

### Изменения

1. Добавить literal trigger model для `heavy-runtime` / `expensive-runtime` features.
2. Зафиксировать, что trigger fires only when changed scope includes one or more of:
   - expensive model/runtime startup;
   - large cache or download bootstrap;
   - containerized or multi-process serving with meaningful startup/runtime pressure;
   - warm/cold path divergence that materially changes proof strategy.
3. Ввести short shared vocabulary with compact definitions:
   - `runtime envelope`;
   - `targeted runtime probe`;
   - `final smoke gate`;
   - `warm path`;
   - `cold path`;
   - `resource / pressure class`.
4. Явно записать proportionality rule:
   - if the trigger does not fire, ordinary verification guidance remains sufficient;
   - if the trigger fires, upstream runtime/proof discipline becomes mandatory before implementation can be treated as well-shaped.
5. Явно записать overlay rule:
   - the default trigger model is the minimum skill-level floor;
   - repo overlays may tighten the trigger or require stronger proof discipline for repo-specific runtime surfaces.
6. Зафиксировать utility boundary:
   - CLI may persist structured fields or validate required sections later if runtime exposes them;
   - CLI does not infer whether a feature is heavy-runtime from prose and does not judge whether a smoke rerun was “wise”.

### Acceptance

- Active docs literally say heavy-runtime discipline is trigger-based rather than universal.
- Active docs literally say the trigger model is a default floor and that repo overlays may tighten it.
- Trigger vocabulary is concrete enough that an agent can decide whether the branch applies without inventing repo-local folklore.
- Utility boundary stays mechanical and does not imply NLP or semantic runtime analysis.

## Package 2. `spec-compact` owns a compact runtime envelope

### Смысл

Если runtime envelope не задан на shaping этапе, implementation почти гарантированно начнет уточнять его через expensive reruns. Этот пакет переносит нужные runtime assumptions upstream, но сохраняет их compact and engineering-facing.

### Файлы

- `references/workflow-stage-spec-compact.md`
- `references/DOSSIER_TEMPLATE.md`
- `SKILL.md`
- `test/docs-contract.test.ts`

### Изменения

1. В `workflow-stage-spec-compact.md` после trigger detection добавить literal rule:
   - when heavy-runtime trigger fires, the dossier must contain a compact runtime envelope before planning is treated as shaped enough.
2. Зафиксировать minimal runtime-envelope fields:
   - expected runtime instance shape;
   - warm/cold assumptions;
   - cache/download policy;
   - timeout budget;
   - retry budget or retry posture;
   - allowed resource / pressure class;
   - operator-visible constraints or risks when relevant.
3. Явно разрешить compact prose/list form; не требовать perf numbers, if only a coarse contract is what the current decision actually needs.
4. Зафиксировать boundary rule:
   - runtime envelope captures implementation-shaping constraints and proof-relevant assumptions;
   - it does not become a low-level deployment runbook or substitute for repo ops documentation;
   - it supplements and never replaces adversarial semantics, edge cases, or failure-mode obligations.
5. Явно записать composition rule:
   - timeout/retry/partial-side-effect/crash-restart behavior semantics still belong in `Adversarial semantics` and `Edge cases and failure modes` when those existing contracts are triggered;
   - runtime envelope records the runtime assumptions, budgets, and pressure posture that shape proof strategy and implementation cost.
6. В `DOSSIER_TEMPLATE.md` уточнить section `5.2 Runtime / deployment surface`, чтобы heavy-runtime envelope был easy to place in the dossier without ad hoc formatting.
7. В `SKILL.md` summary/checklist for `spec-compact` добавить literal check:
   - heavy-runtime feature cannot leave runtime envelope implicit or defer it to implementation notes.

### Acceptance

- `spec-compact` literally requires a compact runtime envelope when the trigger fires.
- Required runtime-envelope fields are named in active docs.
- Template gives the agent a clear place to record the envelope without bloating the dossier for ordinary features.
- The contract remains compact and does not drift into an ops manual.
- Active docs explicitly say runtime envelope supplements and never satisfies adversarial-semantics / failure-mode obligations by itself.

## Package 3. `plan-slice` owns the verification ladder

### Смысл

Runtime envelope без proof ladder все равно оставляет implementation в режиме “угадай через expensive run”. Planning must force cheap-first proof sequencing and explicit smoke scope.

### Файлы

- `references/workflow-stage-plan-slice.md`
- `references/DOSSIER_TEMPLATE.md`
- `SKILL.md`
- `test/docs-contract.test.ts`

### Изменения

1. В `workflow-stage-plan-slice.md` добавить literal heavy-runtime planning rule:
   - if the trigger fires, the verification plan must be expressed as a ladder rather than a single broad verification label.
2. Зафиксировать minimum ladder layers:
   - lightweight local checks;
   - targeted runtime probes;
   - integration checks when relevant;
   - final smoke gate.
3. Добавить sufficiency rule:
   - each meaningful runtime hypothesis should be mapped to the cheapest adequate proof before the plan resorts to a final smoke rerun.
4. Добавить smell pass rule:
   - `smoke`, `runtime test`, `end-to-end verification`, or similar broad labels are insufficient unless adjacent text names what stays for the final smoke and what gets killed earlier by probes.
5. Добавить exception rule:
   - if the only honest observable seam is the expensive smoke path, the plan must say so explicitly and explain why cheaper probes would not prove the relevant behavior.
6. Уточнить, что at least one early slice should prove the highest-risk expensive assumption or boundary behavior before the final closure-oriented smoke gate, instead of deferring all expensive truth to the last step.
7. В `DOSSIER_TEMPLATE.md` уточнить `5.5 Verification surface / initial verification plan`, чтобы ladder читалась как first-class structure for heavy-runtime features.
8. В `SKILL.md` checklist for `plan-slice` добавить literal checks on:
   - cheap-first proof sequencing;
   - explicit final smoke scope;
   - no broad `smoke`-only plan when heavy-runtime trigger fired.

### Acceptance

- `plan-slice` cannot look complete through a single broad `smoke` label when heavy-runtime trigger fired.
- Heavy-runtime plans distinguish targeted probes from final smoke scope.
- Only-observable-seam exceptions are explicit instead of being rediscovered mid-implementation.
- Planning remains proportional for non-triggered features.

## Package 4. `implementation` negative rule: heavy smoke is not the default debug loop

### Смысл

The main behavioral change must become literal where the pain actually happens: in implementation guidance. The agent needs a direct negative rule plus a bounded list of legitimate exceptions.

### Файлы

- `references/workflow-stage-implementation.md`
- `references/workflow.md`
- `SKILL.md`
- `test/docs-contract.test.ts`

### Изменения

1. Добавить literal negative rule:
   - heavy smoke is a final gate or allowed-stop-point / closure-target confirmation, not the default working loop for ordinary debugging.
2. Зафиксировать working-loop discipline before a repeated heavy smoke rerun:
   - localize the hypothesis;
   - choose the narrowest adequate probe or cheaper verification step;
   - rerun expensive smoke only when the remaining uncertainty actually lives on that path.
3. Добавить explicit exception set:
   - smoke-path is the only honest observable seam;
   - repo overlay explicitly requires smoke-first discipline;
   - operator explicitly chooses the expensive rerun as a conscious trade-off.
4. Уточнить, что repeated heavy-runtime cost by itself is not proof of correctness; it is only valid when attached to a named proof purpose.
5. Добавить literal `debug probes vs final smoke` wording into implementation guidance and workflow summary, so the distinction is visible in the main method surface instead of hidden in one stage doc.
6. Сохранить compatibility with `refactoring-plan-13.ru.md`:
   - this package strengthens the proof discipline that should exist before final close-out;
   - it does not redefine the separate pre-close gate or final-like review sequence.

### Acceptance

- `workflow-stage-implementation.md` literally forbids heavy smoke as the default debug loop.
- The docs name a bounded exception set instead of implying a universal ban.
- `debug probe` and `final smoke gate` are visible concepts in the active workflow surface.
- The package does not duplicate or override the separate pre-close / DoD gate model.

## Package 5. Minimal operator-facing smell signal without full logging redesign

### Смысл

Proposal P5 требует, чтобы expensive verification pain было видно как process signal. Это нужно сделать узко и без магии: через existing process-miss surface и literal retrospective guidance, not through a new analytics subsystem.

### Файлы

- `references/workflow-stage-implementation.md`
- `references/workflow-stage-logging.md`
- `SKILL.md`
- `test/docs-contract.test.ts`
- `docs/README.md`

### Изменения

1. В `workflow-stage-implementation.md` explicitly state that repeated heavy smoke / repeated cold-start / repeated cache-download reruns should be treated as process smell for retrospective purposes unless an explicit exception applied.
2. В `workflow-stage-logging.md` добавить stage-specific durable-evidence guidance, still without changing the telemetry schema:
   - explicitly state that when the heavy-runtime trigger fires, retrospective telemetry is reasonably expected and the trivial skip path should not be used for that stage;
   - for `spec-compact`, record that the heavy-runtime trigger fired and where the runtime envelope lives;
   - for `plan-slice`, record that the verification ladder was defined, and whether any only-observable-seam exception was used;
   - for `implementation`, record heavy-runtime misuse as an implementation-specific `process miss`.
3. Для implementation-side smell explicitly state:
   - heavy-runtime misuse is itself an implementation-specific `process miss`, so it triggers log creation/update under the existing `a process miss occurs` rule;
   - the signal must live in the `Process misses` section and use the existing structured `process_miss_refs` anchors;
   - the narrative miss entry must use the fixed prefix `heavy-runtime-misuse:` so operator-facing retrospective can distinguish this smell without adding a new schema field;
   - keep related rationale or hypothesis shifts in `Decisions / reclassifications`, but never use that section as a substitute for the process signal itself.
4. Explicitly name the side effect:
   - this package intentionally expands required stage-log content in a narrow way when the heavy-runtime branch is active or when misuse occurs;
   - this is accepted process overhead because retrospective durability is part of the goal.
5. Не добавлять новую mandatory metric field, classifier, or auto-detection rule in this plan.
6. В `SKILL.md` short method summary добавить operator-facing outcome:
   - retrospective should be able to distinguish legitimate final verification cost from method failure caused by missing runtime envelope or missing verification ladder.
7. В `docs/README.md` добавить ссылку на новый refactoring plan как active planning material for heavy-runtime discipline.

### Acceptance

- Active docs literally treat repeated heavy-runtime misuse as a process smell rather than neutral work.
- Active docs define a narrow but explicit stage-log side effect for heavy-runtime evidence and misuse.
- The logging reference is changed only narrowly and does not become a second logging-redesign plan.
- No new magical telemetry contract or CLI inference is introduced.

## Recommended implementation order

1. Package 1 — shared trigger model and vocabulary.
2. Package 2 — `spec-compact` runtime envelope.
3. Package 3 — `plan-slice` verification ladder.
4. Package 4 — `implementation` negative rule and exception set.
5. Package 5 — minimal smell signal, tests, and docs index.

## Validation

- Update docs-contract tests so they protect:
  - trigger-based heavy-runtime discipline;
  - runtime envelope fields and their compact/non-runbook boundary;
  - verification ladder layers and the insufficiency of broad `smoke` labels;
  - literal negative rule against heavy smoke as default debug loop;
  - bounded exceptions for only-observable-seam / repo-overlay / operator-selected reruns;
  - runtime-envelope composition with existing adversarial-semantics / failure-mode obligations;
  - narrow logging/process-smell wording without schema overreach, including the fixed `heavy-runtime-misuse:` convention, and without changing `coverage_gate` semantics.
- Verify that active docs still keep the boundary between:
  - ordinary features and heavy-runtime features;
  - debug probes and final smoke gates;
  - default skill floors and stricter repo-overlay rules;
  - method discipline and logging redesign;
  - dossier method and ops/runbook documentation.
- Run the dossier docs-contract test suite after implementation changes.
