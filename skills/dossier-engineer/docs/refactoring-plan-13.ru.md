# План рефакторинга 13: обязательный pre-close / DoD readiness gate до final-like review

Дата: `2026-04-20`
Компонент: `dossier-engineer`
Основание: [issues/improvement-proposal-20260420-2.md](issues/improvement-proposal-20260420-2.md)
Скоп: `SKILL.md`, `references/workflow.md`, `references/workflow-stage-implementation.md`, новый active reference для pre-close readiness, `references/implementation-audit-policy.md`, `references/workflow-stage-logging.md`, docs-contract tests, `docs/README.md`

## Цель

Закрыть повторяющийся process gap из ретроанализа: implementation доходит до локально зелёного состояния и запускает final-like review слишком рано, поэтому review впервые ловит не product/risk defects, а late closure incompleteness.

После рефакторинга агент должен:

- явно различать implementation-only checkpoints `local_green`, `pre_close_ready` и `process_complete`;
- проходить обязательный `pre-close / DoD readiness gate` до первого final-like review;
- проверять closure readiness не через ad-hoc prose, а через нормализованный checklist с objective reason classes;
- оставлять оператору явный сигнал, был ли срыв в skill-методике closure discipline или в spec/code/security rigor;
- использовать CLI только как mechanical helper: читать/писать артефакты, валидировать shape, считать детерминированные поля, но не анализировать prose и не выносить semantic verdict.

## Нормативные источники

- [../SKILL.md](../SKILL.md)
- [../references/workflow.md](../references/workflow.md)
- [../references/workflow-stage-implementation.md](../references/workflow-stage-implementation.md)
- [../references/implementation-audit-policy.md](../references/implementation-audit-policy.md)
- [../references/workflow-stage-logging.md](../references/workflow-stage-logging.md)
- [issues/improvement-proposal-20260420-2.md](issues/improvement-proposal-20260420-2.md)
- [issues/improvement-proposal-20260420-1.md](issues/improvement-proposal-20260420-1.md)
- [issues/improvement-proposal-20260420-3.md](issues/improvement-proposal-20260420-3.md)
- [../../backlog-engineer/docs/issues/improvement-proposal-20260420-1.md](../../backlog-engineer/docs/issues/improvement-proposal-20260420-1.md)

## Не цели

- Не сохранять legacy wording или legacy sequencing только ради обратной совместимости docs; при конфликте выигрывает target model.
- Не превращать `pre-close` в новую top-level workflow stage.
- Не заменять `pre-close`-ом внешние reviews, `dossier-verify` или `dossier-step-close`.
- Не переносить backlog mutation logic в `dossier-engineer`; pre-close проверяет only readiness path, а не делает backlog actualization сам.
- Не вводить magical CLI behavior, semantic prose analysis или root-cause inference inside utility.
- Не считать зелёные локальные проверки достаточным substitute для truthful close-out.
- Не проектировать здесь полный logging redesign или весь будущий metrics surface; здесь нужен только узкий process contract и минимальные operator-facing signals.

## Базовые решения

1. `Pre-close / DoD readiness gate` — обязательная closure boundary внутри `Workflow stage: implementation`, а не optional polish step.
2. `local_green` и `pre_close_ready` в этом плане не являются новыми persisted states skill-а. Это transient implementation-only checkpoints для close-out sequencing; они не должны попадать в dossier frontmatter, заменять step state или появляться в `next-step` / `workflow_stage_next`.
3. Этот gate отделяет `локально зелено` от `можно начинать close-out review stack`.
4. `Final-like review` в этом плане означает close-out review stack, который потенциально может завершиться truthful step closure:
   - `spec-conformance`;
   - nested `code` / `security` reviews, когда они требуются;
   - independent review.
5. Early security seam checkpoint не является final-like review и не должен ждать pre-close gate; он остается ранним risk checkpoint.
6. Semantic verdict `pre_close_ready` принадлежит агенту. Utility может только:
   - проверять наличие required fields, paths, enums и artifact refs;
   - фиксировать structured result;
   - считать детерминированные derived flags.
7. Pre-close checklist должен давать оператору objective process signal. Для этого нужны нормализованные reason classes, по которым видно, где методика дала late leakage:
   - `backlog_readiness_unresolved`
   - `ac_proof_gap`
   - `usage_evidence_missing`
   - `closure_inputs_missing`
   - `freshness_boundary_unset`
   - `blocked_waiting_operator`
8. Pre-close не создает dossier-side backlog taxonomy. Он only confirms, что canonical backlog action already determined through `backlog-engineer` or that no backlog action is needed for the current closure target.
9. Gate должен иметь truthful blocked branch. Если close-out останавливается на `blocked_waiting_operator`, план обязан оставить durable blocked outcome instead of silently ending before artifacts.
10. Первая итерация не обязана добавлять новый CLI command. Сначала нормализуется normative contract. Mechanical helper допускается только после того, как contract станет стабильным и будет ясно, что он реально уменьшает ручную нагрузку.

## Ожидаемые эффекты и риски

Ожидаемые эффекты:

- final-like review чаще ловит реальные product/risk defects, а не предсказуемые process gaps;
- уменьшается число rerounds, вызванных late closure incompleteness;
- оператор получает более объективный сигнал, сломалась ли методика closure discipline или сама реализация;
- backlog actualization, AC-to-proof traceability и usage evidence перестают всплывать впервые в самом конце.

Основные риски и mitigation:

- риск превратить gate в бюрократический ритуал;
  mitigation: checklist ограничивается closure-critical dimensions и не дублирует dossier prose.
- риск смешать новый gate с logging redesign;
  mitigation: в этом плане только узкие structured hooks, без полного telemetry redesign.
- риск перегрузить utility semantic обязанностями;
  mitigation: mechanical-only contract фиксируется explicitly и защищается тестами.
- риск неявно начать требовать pre-close и для ранних review checkpoints;
  mitigation: final-like review определяется отдельно, early security checkpoint explicitly excluded.

## Package 1. Implementation-only closure checkpoint model

### Смысл

Нужно сделать целевую closure-модель literal в активной normative surface, чтобы агент не смешивал `локально зелено`, `готово к review` и `truthfully process-complete`, но при этом не ломал существующую persisted state model skill-а.

### Файлы

- `SKILL.md`
- `references/workflow.md`
- `test/docs-contract.test.ts`

### Изменения

1. В `SKILL.md` и `references/workflow.md` явно ввести три implementation-only close-out checkpoint:
   - `local_green`
   - `pre_close_ready`
   - `process_complete`
2. Явно записать, что эти checkpoint-ы действуют только внутри `Workflow stage: implementation` и не являются:
   - dossier frontmatter states;
   - `workflow_stage_next` values;
   - заменой `.dossier/steps/*` state model.
3. Зафиксировать, что `pre_close_ready` обязателен перед first final-like review.
4. Дать literal definition термина `final-like review`, чтобы он не включал early security seam checkpoint.
5. Уточнить, что backlog actualization остается частью stage closure, но pre-close only confirms one of the following coarse readiness states:
   - canonical backlog action already resolved;
   - canonical backlog action still needed before truthful closure;
   - blocked waiting on operator decision.
6. В `SKILL.md` stage exit checklist добавить checks на:
   - прохождение pre-close gate;
   - отсутствие запуска final-like review до gate;
   - explicit canonical backlog-action status;
   - explicit AC/proof and usage-evidence readiness.

### Acceptance

- Active docs literally различают `local_green`, `pre_close_ready` и `process_complete` как implementation-only checkpoints.
- `Final-like review` определен явно и не включает early security checkpoint.
- В active docs literally запрещено использовать эти checkpoint-ы как dossier frontmatter states или `workflow_stage_next`.
- В skill-wide contract виден rule: without pre-close readiness the close-out review stack must not start.

## Package 2. Dedicated active reference for pre-close readiness

### Смысл

Checklist слишком важен и слишком детален, чтобы держать его только как пару bullets внутри implementation steps. Нужен отдельный active reference с нормализованной semantic model.

### Файлы

- `references/implementation-pre-close-readiness.md` (новый)
- `SKILL.md`
- `references/workflow.md`
- `test/docs-contract.test.ts`

### Изменения

1. Создать `references/implementation-pre-close-readiness.md` как canonical reference для gate.
2. Зафиксировать в нем mandatory checklist dimensions:
   - `backlog_actualization_readiness`
   - `ac_proof_readiness`
   - `usage_evidence_readiness`
   - `closure_artifact_readiness`
   - `freshness_readiness`
3. Для каждой dimension определить:
   - что именно должен подтвердить агент;
   - какие objective fields/refs может проверить utility;
   - applicability semantics `required | not_applicable | deferred_by_policy`;
   - какие normalized not-ready reasons разрешены.
4. Для `backlog_actualization_readiness` explicitly avoid dossier-side mutation taxonomy:
   - reference only canonical `backlog-engineer` action/verdict surface when one exists;
   - otherwise record only coarse status `resolved | needs_backlog_action | blocked`;
   - do not invent local verdicts that override backlog-owned semantics.
5. Зафиксировать allowed gate outcomes:
   - `ready`
   - `not_ready`
   - `blocked_waiting_operator`
6. Для `usage_evidence_readiness` явно зафиксировать conditionality:
   - `required` only when the changed scope has meaningful operator-facing, agent-facing, or machine-facing behavior;
   - otherwise `not_applicable` is valid and must not block closure.
7. Зафиксировать explicit split ролей:
   - агент выносит semantic verdict;
   - utility only validates shape / presence / enums / refs;
   - utility never interprets dossier prose or “quality of evidence”.
8. Прямо записать, что reference описывает ideal target model и не обязан учитывать legacy wording существующей методики.

### Acceptance

- Новый reference reachable from `SKILL.md` и `workflow.md`.
- Все closure-critical dimensions перечислены literally.
- Not-ready reasons нормализованы и пригодны для operator-facing process signals.
- `usage_evidence_readiness` явно условная, а не универсально blocking.
- Backlog dimension explicitly avoids dossier-owned backlog taxonomy.
- Agent/utility split описан явно и не допускает magical NLP behavior в CLI.

## Package 3. Implementation-stage sequencing rewrite

### Смысл

Самый важный эффект должен появиться не в абстрактном reference, а в буквальной sequence `Workflow stage: implementation`.

### Файлы

- `references/workflow-stage-implementation.md`
- `SKILL.md`
- `test/docs-contract.test.ts`

### Изменения

1. Переписать close-out часть implementation stage так, чтобы sequence стала literal:
   - establish the intended final tree for implementation closure inputs;
   - project checks + `dossier-verify`;
   - agent-run `pre-close / DoD readiness gate` self-check, including explicit canonical backlog-action readiness verdict;
   - final-like review stack;
   - execute the canonical backlog action through `backlog-engineer` when backlog truth changed;
   - backlog-side clean confirmation / artifact-integrity confirmation;
   - `dossier-step-close`;
   - commit;
   - trace-only metadata backfill when allowed.
2. Добавить explicit fail-closed rule:
   - if pre-close outcome is `not_ready` or `blocked_waiting_operator`, do not start first final-like review.
3. Уточнить, что `completeness review` не является отдельным external review layer. Completeness checks fold into the agent-run pre-close self-check and do not create separate artifact semantics.
4. Уточнить reround semantics:
   - closure-readiness failures return work to pre-close corrections;
   - product/risk findings return work to normal corrective implementation loop;
   - any material corrective change after `pre_close_ready` invalidates that checkpoint and requires re-running pre-close before the next final-like review.
5. Добавить explicit blocked branch:
   - if the gate returns `blocked_waiting_operator`, the stage must leave a durable blocked outcome;
   - target model uses a blocked `dossier-step-close` artifact as the durable repo surface for pre-close blocked exits;
   - the blocked outcome must state whether backlog action is pending, not applicable, or itself blocked by operator decision.
6. Для blocked branch явно сохранить совместимость с существующей step state model:
   - blocked artifact stays within `open | blocked | closed`;
   - `blocked` must never imply `process_complete: true`;
   - blocked artifact wording must not be confusable with truthful closure.
7. Сохранить early security seam checkpoint как early risk control before later implementation growth, а не переносить его под pre-close.
8. В implementation stage exit checklist добавить literal checks на:
   - pre-close gate passed;
   - final-like review started only after gate;
   - any late closure-readiness finding was treated as process failure, not silently mixed with ordinary product review noise;
   - blocked pre-close exits leave a truthful durable artifact path instead of stopping in chat only.

### Acceptance

- `workflow-stage-implementation.md` содержит explicit pre-close boundary в close-out sequence.
- Без `pre_close_ready` first final-like review запрещен.
- Completeness checks are folded into pre-close self-check, not introduced as a second ambiguous review layer.
- Early security checkpoint остается ранним checkpoint и не зависит от pre-close gate.
- Material corrective changes after pre-close invalidate the checkpoint and force re-entry before the next final-like review.
- Blocked pre-close exits use a blocked `dossier-step-close` artifact as the durable repo surface.
- Blocked `dossier-step-close` artifact remains compatible with the existing `open | blocked | closed` model and never sets `process_complete: true`.
- Stage checklist фиксирует sequencing rule, blocked branch, and leakage handling rule.

## Package 4. Review finding taxonomy and operator-facing signals

### Смысл

Если final-like review все же находит late process gap, retrospective и оператор должны видеть, что это leakage pre-close discipline, а не обычный product defect.

### Файлы

- `references/implementation-audit-policy.md`
- `references/workflow-stage-logging.md`
- `test/docs-contract.test.ts`

### Изменения

1. В `implementation-audit-policy.md` добавить narrow classification rule for close-out findings:
   - `product_risk`
   - `closure_readiness`
   - `mixed`
2. Зафиксировать, что closure-readiness finding означает failure of pre-close discipline and must trigger return to pre-close correction path.
3. Зафиксировать, что authoritative minimal operator-facing signal for pre-close lives only in a durable repo artifact:
   - blocked/closed `dossier-step-close` artifact in the target model.
   The final step summary may mirror this state, but never substitutes for it.
4. В `workflow-stage-logging.md` добавить только supplementary structured hooks, без полного telemetry redesign и без зависимости на skip-path:
   - `pre_close_status`
   - `pre_close_decision_ts`
   - `pre_close_reasons`
   - `review_events[].finding_class`
5. Для `review_events[].finding_class` выбрать один canonical attempt-level enum:
   - `product_risk`
   - `closure_readiness`
   - `mixed`
   - `none`
   Derived booleans such as “pre-close leakage” должны выводиться из этого enum, а не жить как параллельное поле.
6. Явно записать, что эти поля являются agent-authored semantic labels, а utility может only validate their shape and enums.
7. Не расширять здесь metric formulas, aggregates или retrospective automation beyond these minimal hooks; richer telemetry remains in the logging redesign proposal.

### Acceptance

- Close-out reviews literally различают `product_risk` и `closure_readiness`.
- Blocked/closed `dossier-step-close` artifact retains a minimal pre-close verdict even when stage logging is skipped.
- Stage logging получает только supplementary structured hooks и не становится единственным источником operator-facing signal.
- Logging taxonomy uses one canonical attempt-level enum instead of parallel overlapping labels.
- Docs явно говорят, что semantic labels ставит агент, а utility only validates shape.
- План не расползается в full logging redesign.

## Package 5. Mechanical preflight support boundary

### Смысл

Нужно заранее ограничить роль CLI, чтобы future helper действительно снимал ручную нагрузку, а не становился псевдо-аналитиком.

### Файлы

- `references/implementation-pre-close-readiness.md`
- `references/workflow.md`
- `docs/utility-spec.ru.md`
- `test/docs-contract.test.ts`

### Изменения

1. Зафиксировать, что первая delivery of the process contract не требует нового CLI command.
2. Описать allowable mechanical helper surface only as future-compatible boundary:
   - validate referenced artifact existence;
   - validate enum values and required fields;
   - persist compact structured result when operator/agent explicitly requests it;
   - never inspect or score dossier prose semantically.
3. Зафиксировать negative rules:
   - utility cannot decide whether AC proof is substantively sufficient;
   - utility cannot infer backlog path from prose;
   - utility cannot decide whether usage evidence is convincing by meaning.
4. Если позже будет введен helper command or artifact, его contract должен следовать этим limits and may be implemented only after docs contract stabilizes.

### Acceptance

- Active docs clearly separate current normative gate from optional future helper.
- CLI role is constrained to deterministic checks and artifact operations.
- No text implies semantic readiness inference by utility.

## Package 6. Docs index and contract tests

### Смысл

Новый gate должен быть discoverable и protected from wording drift.

### Файлы

- `docs/README.md`
- `test/docs-contract.test.ts`

### Изменения

1. Добавить `refactoring-plan-13.ru.md` в `docs/README.md`.
2. Расширить docs-contract tests, чтобы защищать:
   - наличие new pre-close reference;
   - literal `local_green -> pre_close_ready -> process_complete` boundary model;
   - final-like review definition;
   - pre-close sequencing in implementation stage;
   - minimal stage-log hooks and finding classes;
   - explicit agent/utility split;
   - explicit ban on leaking `local_green` / `pre_close_ready` into dossier frontmatter, generic step state, or `workflow_stage_next`;
   - blocked `dossier-step-close` wording as a durable non-complete outcome.
3. Держать assertions narrow and phrase-based, без snapshot of whole paragraphs.
4. Если реализация затронет runtime or documented utility contract:
   - добавить targeted contract tests for blocked `dossier-step-close`;
   - проверить, что blocked/closed step artifact remains the authoritative operator-facing signal when stage log is skipped;
   - проверить, что stage log and final summary only mirror artifact truth and do not replace it.

### Acceptance

- Новый план и новый reference discoverable из `docs/README.md` / active surface.
- Tests падают, если pre-close contract silently исчезает или снова смешивается с generic close-out wording.
- Tests explicitly guard against checkpoint leakage into persisted state surfaces.
- If runtime changes are required, contract tests protect blocked artifact semantics and operator-facing source-of-truth priority.

## Recommended implementation order

1. Package 1: skill-wide boundary model.
2. Package 2: dedicated pre-close reference.
3. Package 3: implementation-stage sequencing rewrite.
4. Package 4: finding taxonomy and minimal operator-facing signals.
5. Package 6: docs index and contract tests.
6. Package 5: mechanical helper boundary, только после стабилизации wording остальных пакетов.

## Validation

- `node --experimental-strip-types --test skills/dossier-engineer/test/docs-contract.test.ts`
- targeted readback of `SKILL.md`, `references/workflow.md`, `references/workflow-stage-implementation.md`, `references/implementation-pre-close-readiness.md`, `references/implementation-audit-policy.md`, and `references/workflow-stage-logging.md`
- if runtime/docs utility surface changes, run targeted `dossier-step-close` contract tests covering:
  - blocked artifact creation;
  - blocked artifact never implying `process_complete: true`;
  - blocked/closed artifact remaining the authoritative operator-facing signal when stage logging is absent.

Поскольку план в первой итерации docs-first и не требует runtime changes, дополнительные CLI tests нужны только если реализация все-таки затронет `scripts/dossier.mjs` или documented utility contract глубже, чем здесь запланировано.
