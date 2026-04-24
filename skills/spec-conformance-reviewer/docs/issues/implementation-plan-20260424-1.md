# Implementation Plan

## Language

План написан на русском языке.

## Plan ID

`implementation-plan-20260424-1`

## Related Issue

`SCR-01` — [issue-20260424-1.md](issue-20260424-1.md)

## Source Artifacts

- [issue-20260424-1.md](issue-20260424-1.md) — problem statement, acceptance criteria, constraints, non-goals, external audit result.
- `SKILL.md` — текущая сгенерированная активная инструкция skill.
- `references/methodology.md` — текущие правила extraction workflow, traceability, ambiguity handling и edge/error path review.
- `references/reporting.md` — текущие статусы, severity, wording rules и verdict rules.
- `fragments/overview.md` — source bundle фрагмент, из которого генерируется обзорная часть `SKILL.md`.
- `skill.yaml` — source-of-truth manifest для generated skill, включая active/optional references и portability checklist.
- `AGENTS.md` — maintenance contract: менять source bundle и регенерировать generated output, а не править `SKILL.md` вручную.
- `docs/README.md` — navigation для issues, plans и implementation logs.

## Objective

Закрепить в `spec-conformance-reviewer` условную policy/admission edge-case matrix, которая включается только при наличии normative trigger в источниках и помогает reviewers не пропускать обязательные allow/deny/refusal/fail-closed ветки. Skill должен остаться requirement-first: reviewer сначала извлекает нормативные требования, затем проверяет implementation evidence, а ambiguous или недостаточно explicit требования классифицирует как `ambiguous_spec`, `cannot_determine` или verification gaps, не превращая их в invented obligations.

## Assumptions

- Skill остается documentation-only generated skill без runtime CLI.
- Изменения в `SKILL.md` и `docs/compile-report.md` должны появляться только через source bundle и in-place regeneration.
- Acceptance criterion про "Tests или review fixtures" можно удовлетворить portable review fixture внутри skill folder, потому текущий skill не имеет runtime/test harness.
- Policy/admission matrix не становится универсальным обязательным шагом для всех reviews; она активируется только когда normative sources упоминают policy decisions, admission gates, external consultant invocation, fail-closed behavior, activation decisions или refusal semantics.
- Security exploitability и general merge-risk findings остаются вне ownership этого skill и направляются в `security-reviewer` или `code-reviewer`, если они не следуют из normative requirement.

## Scope

Входит в scope:

- Методологическое правило для conditional policy/admission matrix.
- Явный bounded row set для allow, deny, missing/ambiguous evidence, stale freshness, unsupported или unhealthy downstream path, replay/idempotency, activation conflict и persistence failure только когда эти rows имеют normative basis.
- Reporting guidance для классификации missing explicit DENY/no-invocation path, missing matrix rows, ambiguous specs и verification gaps.
- Portable review fixture для consultant admission feature с explicit allow, explicit deny/no-invocation и stale/missing freshness evidence.
- Обновление source bundle, generated output и docs navigation.

Не входит в scope:

- Превращение skill в general code reviewer.
- Универсальная проверка replay, concurrency, persistence или security concerns без связи с normative requirement или contract.
- Runtime CLI, новые shipped commands или command semantics.
- Редактирование unrelated skills или исторических docs, не связанных с `SCR-01`.

## Proposed Changes

- Обновить `references/methodology.md`:
  - добавить секцию `Conditional Policy/Admission Matrix`;
  - перечислить normative triggers;
  - определить минимальные rows и правило, что каждая row должна быть tied to requirement basis;
  - указать, что missing row без explicit source становится ambiguity или verification gap, а не non-compliance;
  - встроить matrix step в extraction/traceability workflow только для triggered reviews.
- Обновить `references/reporting.md`:
  - добавить reporting rules для policy/admission findings;
  - закрепить, что missing explicit DENY/no-invocation path является spec non-compliance только когда spec requires explicit admission/refusal semantics;
  - закрепить, что missing matrix coverage по недостаточно explicit normative source report-ится как `ambiguous_spec`, `cannot_determine` или verification gap.
- Добавить `references/policy-admission-matrix.md` как optional active reference:
  - краткий trigger checklist;
  - bounded row catalog, включая unsupported или unhealthy downstream path;
  - reviewer self-check;
  - пример expected traceability classification.
- Добавить portable review fixture, например `assets/fixtures/consultant-admission-policy.md`:
  - mini normative source для consultant admission с explicit allow, explicit deny/no-invocation и stale evidence requirement;
  - sample implementation evidence;
  - expected extracted requirements, matrix rows и classification outcomes.
- Обновить `fragments/overview.md` и `skill.yaml`:
  - включить optional reference в manifest и Reference Map;
  - добавить краткое overview-правило без дублирования полного row catalog;
  - сохранить interop priority с `code-reviewer` и `security-reviewer`.
- Запустить in-place regeneration для generated files:
  - `SKILL.md`;
  - `docs/compile-report.md`.
- Обновить `docs/README.md`:
  - добавить ссылку на этот implementation plan;
  - после implementation добавить ссылку на implementation log.

## Implementation Steps

1. Подготовить изменения в source bundle: `references/methodology.md`, `references/reporting.md`, `fragments/overview.md`, `skill.yaml` и новый optional reference.
2. Создать portable review fixture under `assets/fixtures/` и добавить его в `skill.yaml` assets или supporting surface так, чтобы он сохранялся при copy/compile.
3. Сверить формулировки с issue constraints: conditional trigger, no invented obligations, requirement-first, no general code/security review expansion.
4. Запустить `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/spec-conformance-reviewer`.
5. Проверить generated output: `SKILL.md` должен ссылаться на optional matrix reference, required references должны остаться reachable, `docs/compile-report.md` должен перечислить новые source files без warnings.
6. Обновить `docs/README.md` и создать implementation log under `docs/logs/implementation-log-20260424-1.md`.
7. Выполнить verification commands и ручные checks из Verification Plan.

## Verification Plan

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/spec-conformance-reviewer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/spec-conformance-reviewer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/spec-conformance-reviewer`
- Run a portability scan for absolute local paths and Windows drive paths in `skills/spec-conformance-reviewer`.
- Manual fixture walk-through:
  - extract consultant admission requirements from the fixture;
  - verify explicit allow, explicit deny/no-invocation and stale/missing freshness rows appear;
  - verify unsupported or unhealthy downstream, replay, activation and persistence rows are marked only when fixture gives normative basis, otherwise ambiguity/gap/out-of-scope is explicit.
- Documentation parity check:
  - `SKILL.md`, `references/methodology.md`, `references/reporting.md`, optional reference and fixture do not contradict each other;
  - runnable commands are not introduced in prose;
  - generated files are not hand-edited.

## Risks and Side Effects

- Risk: matrix wording could over-expand spec review into general reliability/security review.
  - Mitigation: every row requires normative basis and non-goals are repeated in methodology/reporting.
- Risk: optional reference could become hidden mandatory guidance.
  - Mitigation: list it in `SKILL.md` Reference Map with a specific trigger and keep methodology as the primary instruction.
- Risk: fixture may be mistaken for universal product behavior.
  - Mitigation: label it as a review fixture, not a real product spec, and keep examples portable and generic.
- Risk: generated skill drift if `SKILL.md` is edited manually.
  - Mitigation: update source bundle first and use skill-source-compiler regenerate/check.
- Destructive side effects: none expected; changes are documentation, fixture and generated-output updates inside the same skill folder.

## Rollback Plan

Revert the files changed for this issue: methodology/reporting updates, optional matrix reference, fixture, `skill.yaml`, `fragments/overview.md`, regenerated `SKILL.md`, `docs/compile-report.md`, docs navigation and implementation log. Then rerun `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/spec-conformance-reviewer` to confirm the skill returns to a consistent generated state.

## Independent Audit

Audit status: `REVIEWED`

Auditor: `Goodall`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:
- Initial audit found one missing wording branch: `unsupported или unhealthy downstream path` was not represented consistently.
- The plan was corrected to include that row in scope, optional reference expectations and manual fixture verification.
- Re-audit verdict: plan covers all issue rows and acceptance criteria, preserves conditional triggers, requirement/evidence basis, generated-skill workflow and portability.

Required corrections:
- None remaining.

Final status: `PASS`
