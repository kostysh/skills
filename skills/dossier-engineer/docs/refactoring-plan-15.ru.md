# План рефакторинга 15: mandatory lifecycle logging и metric contract для непрерывного улучшения

Дата: `2026-04-20`
Компонент: `dossier-engineer`
Основание: [issues/improvement-proposal-20260420-1.md](issues/improvement-proposal-20260420-1.md)
Скоп: `SKILL.md`, `references/feature-intake-logging.md`, `references/workflow-stage-logging.md`, новый active reference для lifecycle telemetry / metric contract, `references/workflow.md`, step-closure wording, logging-related utility spec / runtime command wrappers / artifact writers, docs-contract and runtime tests, `docs/README.md`

## Цель

Перевести logging contract `dossier-engineer` от trigger-based optional telemetry к mandatory, thin, machine-readable lifecycle telemetry, на которой retrospective может строить objective process signals и сравнимые метрики без narrative reconstruction.

После рефакторинга skill должен:

- всегда оставлять lifecycle telemetry for `feature-intake`, `spec-compact`, `plan-slice`, and `implementation`;
- связывать lifecycle artifacts через один canonical `feature_cycle_id`;
- фиксировать symmetric lifecycle timestamps instead of forcing retrospective to infer ends from prose;
- писать bounded event records instead of требовать от агента live semantic analysis;
- строить core metrics v1 из canonical fields and events;
- оставлять агенту retrospective-layer interpretation, а CLI — только mechanical logging / validation / aggregation;
- давать repo-local anchors от feature/stage к `session_id`, не сохраняя absolute runtime trace paths.

Этот план описывает ideal target model. Legacy skip-path, field shape или historical wording не являются ограничением сами по себе.

## Нормативные источники

- [../SKILL.md](../SKILL.md)
- [../references/feature-intake-logging.md](../references/feature-intake-logging.md)
- [../references/workflow-stage-logging.md](../references/workflow-stage-logging.md)
- [../references/workflow.md](../references/workflow.md)
- [issues/improvement-proposal-20260420-1.md](issues/improvement-proposal-20260420-1.md)

## Связанный контекст и external dependencies

Эти материалы важны для совместимости и sequencing, но не являются нормативным основанием самой logging method:

- [issues/improvement-proposal-20260420-2.md](issues/improvement-proposal-20260420-2.md)
- [issues/improvement-proposal-20260420-3.md](issues/improvement-proposal-20260420-3.md)
- [../../../backlog-engineer/docs/issues/improvement-proposal-20260420-1.md](../../../backlog-engineer/docs/issues/improvement-proposal-20260420-1.md)
- `retrospective-phase-analysis` skill, который должен уметь resolve-ить trace from `session_id` / repo-local session anchors

Важная граница:

- этот план владеет dossier-side lifecycle telemetry, metric contract, lifecycle snapshot artifact, и repo-local session anchors;
- runtime-aware trace lookup by `session_id` inside retrospective tooling — внешний cross-skill dependency, который нельзя скрывать внутри `dossier-engineer` как будто он уже существует.

## Не цели

- Не сохранять optional skip-path только ради совместимости со старой методикой.
- Не превращать stage logs или intake log во второй Feature Dossier.
- Не делать commit SHA lifecycle gate.
- Не заставлять агента live-дедуплицировать findings, оценивать weighted operator cost или делать root-cause attribution во время основной работы.
- Не приписывать CLI/NLP-функции: utility не анализирует prose, не определяет skill-gap из свободного текста и не выполняет semantic incident grouping.
- Не проектировать здесь full retrospective UX of another skill; dossier-side plan only leaves reliable anchors and deterministic artifacts.
- Не делать broad `incident_rate`, exact cross-review `audit_yield`, или weighted `operator effort cost` обязательным live logging burden в v1.

## Базовые решения

1. Lifecycle logging обязателен для полного feature lifecycle:
   - `feature-intake`
   - `spec-compact`
   - `plan-slice`
   - `implementation`
2. Mandatory logging должен стать thinner, а не prose-heavier:
   - metadata-first;
   - bounded events;
   - short narrative sections;
   - automatic append where command/runtime already owns the signal.
3. Новый canonical home для telemetry semantics и metric contract нужен отдельно от stage-specific logging refs.
   Предлагаемый active reference: `references/lifecycle-telemetry.md`.
4. `feature-intake.start_ts` — canonical full feature-cycle start.
5. `implementation.process_complete_ts` — canonical primary end of the engineering feature cycle only when it is emitted by successful `dossier-step-close` for the same closure target with `process_complete: true`.
   `step_close_ts` records step-artifact creation/update time; `final_commit_ts` remains trace metadata only.
6. `feature_cycle_id` groups one end-to-end feature run and supplements, but never replaces, per-command/per-stage `cycle_id`.
   `cycle_id` remains the closure-target key for intake and stage logs.
7. Event arrays are the primary machine-readable source of friction metrics.
   Summary counters may remain only as derived or convenience fields; they are not the authoritative authored source when equivalent events exist.
8. CLI / wrappers are mechanical helpers only:
   - append deterministic records;
   - validate schema and required fields;
   - compute numeric aggregates;
   - build machine-readable snapshot artifacts.
9. Agent-authored retrospective remains the owner of:
   - prose interpretation;
   - root-cause analysis;
   - skill-gap attribution;
   - semantic grouping of findings across review artifacts.
10. Repo-local session discoverability must never store absolute local session-store paths.
11. In runtimes where reliable `session_id` exists, omission of `session_id` is no longer a normal outcome for mandatory lifecycle logs.
12. Mandatory telemetry intentionally adds a narrow process-side effect:
   ordinary cycles no longer skip logging; they produce thin lifecycle records instead.
13. Ordinary smooth cycle work must have a concrete minimal path:
   - metadata block;
   - empty or `none` narrative sections;
   - zero/empty bounded event arrays where nothing happened;
   - durable closure markers and artifact links only where the workflow actually reached them.
14. Intake settlement blockers remain explicit in the mandatory model:
   unresolved `index-refresh`, unresolved required backlog actualization, or stale intake close-out fields still block truthful `feature-intake` completion even after skip-path removal.
15. Legacy fields that only expressed conditional log existence, such as `log_required` / `log_required_reason`, cannot survive unchanged in the always-on model:
   they must be retired from the active contract unless a new bounded meaning is defined explicitly.

## Package 1. Canonical lifecycle telemetry reference

### Смысл

Current logging semantics are split between intake and stage refs, and the metric contract lives only in the proposal. A new active reference is needed to own the target model explicitly.

### Файлы

- `references/lifecycle-telemetry.md` (new)
- `SKILL.md`
- `references/workflow.md`
- `docs/README.md`
- `test/docs-contract.test.ts`

### Изменения

1. Создать `references/lifecycle-telemetry.md` как canonical active reference for:
   - lifecycle identity;
   - timestamp semantics;
   - bounded event arrays;
   - core metrics v1;
   - lifecycle snapshot artifact;
   - agent/CLI role split;
   - repo-local session anchors.
2. В этом reference explicitly define the three-layer model:
   - structured lifecycle telemetry;
   - mechanical utility support;
   - agent-authored retrospective analysis.
3. Зафиксировать core metrics v1 as contract, not as “best effort retrospective convenience”.
4. Явно отделить:
   - live-captured core metrics;
   - retrospective-derived signals;
   - excluded-from-live-burden metrics.
5. В `SKILL.md` и `workflow.md` сделать этот reference discoverable from the main workflow surface.

### Acceptance

- A new active reference owns lifecycle telemetry semantics instead of scattering them only across proposal prose.
- `SKILL.md` and `workflow.md` point to the new reference explicitly.
- The active surface clearly separates telemetry capture, utility mechanics, and retrospective interpretation.

## Package 2. Mandatory thin logging across the full lifecycle

### Смысл

Continuous improvement cannot rely on trigger-dependent telemetry density. The logging contract must become always-on for the lifecycle it claims to measure.

### Файлы

- `references/feature-intake-logging.md`
- `references/workflow-stage-logging.md`
- `SKILL.md`
- `references/workflow.md`
- `test/docs-contract.test.ts`

### Изменения

1. Remove optional skip-path semantics from `feature-intake-logging.md`.
2. Remove optional skip-path semantics from `workflow-stage-logging.md`.
3. Replace “when logging is required” language with always-on lifecycle wording for the stages/command this plan owns.
4. Retire machine fields whose only meaning was conditional log existence:
   - remove `log_required` / `log_required_reason` from the required active metadata surface;
   - do not keep them as tautological `true`-only fields;
   - only introduce a replacement if it has a new bounded semantic meaning unrelated to log existence.
5. Preserve low overhead not through skipping logs, but through a thin mandatory record:
   - metadata block always present;
   - short narrative sections may contain `none` or similarly bounded values when nothing notable happened;
   - zero/empty event arrays are valid for an ordinary smooth cycle;
   - no duplication of dossier truth.
6. Update timing rules so the intake log and stage logs open before the first substantive mutation of their stage/command.
7. Update `SKILL.md` command/stage checklists and step-closure wording so missing required lifecycle log blocks truthful `process_complete`.
8. Explicitly preserve intake settlement blockers in the mandatory model:
   - unresolved `index-refresh` outcome still blocks truthful `feature-intake` completion;
   - unresolved required backlog actualization still blocks truthful `feature-intake` completion;
   - stale intake close-out fields still block truthful intake closure.
9. Keep the boundary explicit:
   - intake remains command-level telemetry;
   - `spec-compact`, `plan-slice`, `implementation` remain workflow-stage telemetry;
   - session-level ops log remains for cross-skill/cross-stage episodes only.

### Acceptance

- `feature-intake`, `spec-compact`, `plan-slice`, and `implementation` no longer rely on an optional skip path.
- Legacy `log_required` / `log_required_reason` semantics are either retired or explicitly redefined with a new bounded meaning.
- Ordinary cycles are represented by thin logs, not by log absence.
- The ordinary smooth cycle minimal path is concrete rather than implied.
- Active closure guidance says missing lifecycle telemetry blocks truthful completion.
- Active intake guidance still carries forward unresolved-`index-refresh` and unresolved-backlog-actualization blockers.

## Package 3. Canonical lifecycle identity, timestamps, and bounded event schemas

### Смысл

If timestamps and event classes are asymmetric or ad hoc, the metric contract remains narrative-dependent. This package makes the machine-readable backbone explicit.

### Файлы

- `references/lifecycle-telemetry.md`
- `references/feature-intake-logging.md`
- `references/workflow-stage-logging.md`
- `SKILL.md`
- `test/docs-contract.test.ts`

### Изменения

1. Add `feature_cycle_id` to:
   - intake log metadata;
   - stage log metadata;
   - lifecycle snapshot artifact.
2. Explicitly preserve `cycle_id` as the per-command/per-stage closure-target identity and define `feature_cycle_id` as the wider end-to-end grouping id.
3. Add canonical lifecycle timestamps:
   - intake: `intake_process_complete_ts`
   - stages: `local_gates_green_ts`, `process_complete_ts`, `step_close_ts`
   - optional additional trace marker: `final_commit_ts`
4. Explicitly define timestamp semantics and ordering expectations.
   `intake_process_complete_ts` is emitted only by truthful `feature-intake` closure for the same closure target, after required review/closure-side obligations of intake are actually complete; it is not a marker of earlier command-local progress.
5. Introduce or normalize bounded event arrays:
   - `review_events[]`
   - `verification_events[]`
   - `backlog_events[]`
   - `operator_interventions[]`
   - `process_miss_events[]`
   - optional bounded `hard_incident_events[]`
6. Make event arrays authoritative over equivalent summary counters.
   Existing counters may remain only as derived summaries when useful for quick reading.
7. Define bounded vocabularies for:
   - verification gate classes and failure classes;
   - backlog event classes and failure classes;
   - operator intervention classes;
   - hard incident classes for v1.
8. Add explicit metric inclusion rules for `review_events[]`:
   - evidence-based review metrics ignore attempts with `invalidated: true`;
   - evidence-based review metrics ignore attempts with `allowed_by_policy: false`;
   - those attempts still count toward friction/process-miss/orchestration telemetry.
9. In runtimes with reliable session identity, require `session_id` for mandatory lifecycle logs instead of treating omission as normal.

### Acceptance

- `feature_cycle_id` and the new canonical timestamps are named in the active telemetry contract.
- The contract explicitly preserves `cycle_id` alongside `feature_cycle_id`.
- `intake_process_complete_ts` has an explicit truthful-closure writer/emit rule instead of an implied progress meaning.
- Event arrays and their bounded taxonomies are explicit and machine-readable.
- The active contract says canonical metrics derive from events/timestamps, not from narrative prose.
- Evidence-based review metrics explicitly exclude invalidated or policy-disallowed attempts.
- `session_id` semantics are fail-closed when the runtime can provide a reliable value.

## Package 4. Core metric contract and lifecycle snapshot artifact

### Смысл

Metrics need one canonical machine-readable surface instead of being recomputed differently by each retrospective.

### Файлы

- `references/lifecycle-telemetry.md`
- `references/feature-intake-logging.md`
- `references/workflow-stage-logging.md`
- `docs/utility-spec.ru.md`
- logging-related runtime artifact writers / wrappers
- `test/cli.test.ts`
- `test/workflow.test.ts`
- `test/docs-contract.test.ts`

### Изменения

1. Define a cycle-safe lifecycle snapshot artifact, for example:
   - `.dossier/metrics/<feature-id>/<feature_cycle_id>.json`
   and allow an optional per-feature index only as a secondary discoverability surface.
2. Record at minimum:
   - lifecycle identity;
   - intake/stage process-complete timestamps;
   - key derived metrics such as `feature_cycle_time`, `phase_cycle_time`, `review_loop_time`, `rerounds_per_feature`, `closure_latency`, `verification_failures_total`, `backlog_actualization_failures_total`, `operator_interventions_total`.
3. Define which metrics are primary derived outputs of the artifact and which remain retrospective-layer only.
4. State explicitly that the artifact is built mechanically from canonical telemetry rather than manually authored by the agent.
5. Update utility-spec/runtime contract so the command layer that owns closure/appending can build or refresh lifecycle snapshot artifacts deterministically.
6. Tie the primary feature end marker to durable closure:
   - the snapshot uses `implementation.process_complete_ts` only when it comes from successful `dossier-step-close` for the same closure target;
   - `step_close_ts` remains the durable trace companion and must not drift from the closure artifact it represents.
7. Keep commit metadata trace-only inside this model; do not reintroduce commit as a lifecycle gate.

### Acceptance

- The active contract defines one cycle-safe lifecycle snapshot artifact and its minimum content.
- Primary feature-cycle end is tied to durable `dossier-step-close` closure semantics, not commit.
- Runtime/utility contract is expected to build the snapshot mechanically from structured telemetry.

## Package 5. Mechanical wrapper responsibilities and explicit CLI boundary

### Смысл

Mandatory logging will fail in practice if it remains mostly manual. At the same time, the utility must not be allowed to fake semantic reasoning.

### Файлы

- `references/lifecycle-telemetry.md`
- `docs/utility-spec.ru.md`
- logging-related runtime command wrappers / artifact writers
- `test/cli.test.ts`
- `test/workflow.test.ts`
- `test/docs-contract.test.ts`

### Изменения

1. Assign concrete writer ownership explicitly:
   - truthful `feature-intake` closure/update owns the intake fields and markers it can deterministically prove, including `intake_process_complete_ts` only when the same closure target has actually reached truthful intake completion;
   - `review-artifact` or an equivalent review-artifact writer owns the review-event append it can deterministically prove;
   - `dossier-verify` or an equivalent verification writer owns the verification-event append it can deterministically prove;
   - `dossier-step-close` owns `process_complete_ts`, `step_close_ts`, and lifecycle-closure refresh for the same closure target.
2. For workflow-only stages (`spec-compact`, `plan-slice`, `implementation`) do not assume hidden auto-open or auto-append magic:
   - until a shipped helper exists, bounded stage-log open/update remains an agent responsibility;
   - the plan may later add a concrete helper, but it must be named explicitly rather than implied.
3. Define backlog-event capture as an explicit integration boundary:
   - dossier-side telemetry contract expects `backlog_events[]`;
   - actual command-side append may depend on backlog-engineer or a thin integration wrapper;
   - until that integration exists, the plan must not pretend dossier runtime already owns backlog-event emission.
4. State the negative utility boundary literally:
   - no prose interpretation;
   - no root-cause inference;
   - no semantic deduplication of findings;
   - no skill-blame attribution.
5. Allow wrappers to compute deterministic counters and lifecycle durations from already structured fields only.

### Acceptance

- The plan names which kinds of records the mechanical layer is expected to append.
- Concrete writer ownership and manual fallback behavior are explicit instead of hidden in “wrapper magic”.
- Intake and implementation process-complete markers are both tied to truthful closure-time writers rather than informal progress updates.
- The active contract explicitly excludes NLP-like CLI behavior.
- Backlog-event capture is treated as an explicit integration dependency, not an implicit promise.

## Package 6. Repo-local session discoverability surface

### Смысл

Retrospective should not start with manual session-store archaeology when lifecycle telemetry already knows which session produced the feature/stage.

### Файлы

- `references/lifecycle-telemetry.md`
- `references/feature-intake-logging.md`
- `references/workflow-stage-logging.md`
- `docs/utility-spec.ru.md`
- logging-related runtime artifact writers
- `test/cli.test.ts`
- `test/docs-contract.test.ts`

### Изменения

1. Define a repo-local session discoverability artifact, for example:
   - `.dossier/retro/session-index.jsonl`
2. Minimum record should include:
   - `feature_cycle_id`
   - `feature_id`
   - `backlog_item_key`
   - `stage`
   - `session_id`
   - `trace_runtime`
   - `trace_locator_kind`
   - `stage_log_path`
   - lifecycle start/end markers useful for lookup
3. Explicitly forbid absolute local trace-file paths inside durable repo artifacts.
4. Define the artifact as a hint/index surface, not as authoritative trace resolution by itself.
   - multiple records may exist for the same `feature_cycle_id`;
   - one `feature_cycle_id` may span multiple `session_id` values;
   - records are append-only observations, not proof that one unique trace exists.
4. Clarify ownership boundary:
   - `dossier-engineer` owns the repo-local anchor surface;
   - retrospective tooling owns runtime-aware resolution from `session_id` or current session.
5. Name a concrete writer/update strategy:
   - session-index records are built mechanically from lifecycle logs or closure-time artifact updates;
   - they are not manually authored narrative entries.
6. Make `session_id` omission non-normal in runtimes that can provide it for mandatory lifecycle logs.

### Acceptance

- The active contract defines one repo-local session discoverability surface.
- The surface is explicitly a hint/index and supports multi-session feature cycles.
- Durable artifacts store stable ids and cross-links, not absolute local paths.
- The dossier-side plan makes the retrospective tooling dependency explicit instead of pretending trace resolution already belongs to dossier logging.

## Package 7. Contract protection and migration-safe validation

### Смысл

This is a large normative shift. The plan is not credible unless tests and utility-spec assertions protect the new always-on lifecycle contract.

### Файлы

- `test/docs-contract.test.ts`
- `test/cli.test.ts`
- `test/workflow.test.ts`
- `docs/README.md`

### Изменения

1. Extend docs-contract tests to guard:
   - no optional lifecycle skip path for `feature-intake`, `spec-compact`, `plan-slice`, `implementation`;
   - retirement or explicit bounded redefinition of legacy `log_required` / `log_required_reason` fields;
   - presence of `feature_cycle_id` and new canonical timestamps;
   - continued presence of per-log `cycle_id` semantics alongside `feature_cycle_id`;
   - explicit primary feature end marker semantics;
   - explicit truthful-closure semantics for `intake_process_complete_ts`;
   - durable tie between `process_complete_ts` and successful step-close closure;
   - review-metric exclusion rules for invalidated / policy-disallowed attempts;
   - bounded event arrays and role split wording;
   - repo-local session-index surface and no-absolute-path rule.
2. Add runtime/CLI-facing assertions where the utility contract is expected to expose:
   - lifecycle snapshot artifact writing/updating;
   - structured event append expectations;
   - session-anchor artifact behavior.
3. Add this plan to `docs/README.md`.
4. Keep tests phrase-based and contract-focused rather than snapshotting whole paragraphs.

### Acceptance

- Docs-contract tests fail if always-on lifecycle logging or canonical field names drift out of the active surface.
- Runtime/CLI tests protect the machine-readable artifact expectations that this plan introduces.
- `docs/README.md` makes the plan discoverable.

## Recommended implementation order

1. Package 1 — new canonical lifecycle telemetry reference.
2. Package 2 — mandatory thin logging across the lifecycle.
3. Package 3 — lifecycle identity, timestamps, and bounded event schemas.
4. Package 4 — core metric contract and lifecycle snapshot artifact.
5. Package 5 — mechanical wrapper responsibilities and CLI boundary.
6. Package 6 — repo-local session discoverability surface.
7. Package 7 — contract tests, runtime assertions, docs index.

## Validation

- Verify that active logging refs no longer rely on skip-path semantics for the owned lifecycle.
- Verify that `feature-intake.start_ts` and `implementation.process_complete_ts` remain the primary full-cycle markers.
- Verify that event arrays, not prose summaries, are the authoritative metric source.
- Verify that the utility contract stays mechanical and does not imply prose/NLP analysis.
- Verify that repo-local session anchors never store absolute local trace paths.
- Run docs-contract tests and the relevant runtime/CLI tests after implementation changes.

## Follow-up scope absorbed from package 14 residual risks

This plan is the correct place to absorb stronger mechanization that package 14 intentionally left as documentation-and-process discipline only.

### 1. From phrase-based heavy-runtime guidance to machine-facing protection when warranted

Package 14 intentionally accepts phrase-based docs-contract coverage because it changes active method guidance, not a machine-facing runtime contract.

What this plan may strengthen:

- if lifecycle telemetry or machine-facing helper surfaces start exposing heavy-runtime-specific fields, help output, or artifact contracts, add targeted runtime/help/schema tests here instead of leaving the protection phrase-only;
- keep docs-contract assertions narrow and section-local, but add runtime/CLI assertions whenever package 15 introduces machine-readable heavy-runtime-related telemetry or artifact-writing behavior.

What this plan still must not do:

- do not introduce snapshot-heavy generic doc testing just because package 14 was phrase-based;
- do not imply that CLI understands prose semantics unless a bounded machine-facing contract is actually being added in this cycle.

### 2. `heavy-runtime-misuse:` may graduate from documented convention to bounded telemetry

Package 14 intentionally leaves `heavy-runtime-misuse:` as a documented convention on the existing `process miss` surface.

If stronger mechanization is desired, this plan may absorb it by:

- defining a bounded machine-facing representation for heavy-runtime misuse inside the new lifecycle/process-miss event model;
- validating that representation mechanically in utility-facing schema, artifact-writing, and tests;
- keeping the authoring/decision burden on the agent while making the durable artifact shape machine-readable.

Constraints:

- do not add magical auto-detection of heavy-runtime misuse from prose or from CLI heuristics;
- if a machine-facing representation is added, it must be derived from explicit agent-authored structured fields or bounded event entries, not inferred by NLP.

### 3. Broader runtime/CLI protection only when package 15 actually widens the runtime surface

Package 14 intentionally does not expand into shipped CLI help/runtime changes.

This plan may pick up stronger end-to-end protection only when package 15 itself introduces:

- new lifecycle telemetry artifacts;
- new bounded event arrays or process-miss event schemas;
- new session-anchor or snapshot-writing behaviors;
- new machine-facing validation around logging completeness or metric-source fields.

Rule:

- if package 15 changes shipped CLI/help/artifact behavior, add matching runtime/CLI tests and review scope here;
- if package 15 stays purely documentation-level on a given concern, do not widen runtime scope artificially.

### Acceptance boundary for these follow-ups

It is acceptable for package 15 to leave a concern documentation-guarded only when all conditions are true:

- no new machine-facing contract was introduced for that concern;
- stronger enforcement would require unrelated CLI/runtime scope growth;
- active logging refs, utility boundary wording, and tests already keep the non-magical contract explicit.

If package 15 does introduce a new machine-facing telemetry contract for one of these concerns, then runtime/schema/test protection becomes part of this plan rather than a later optional improvement.
