# Implementation Plan

## Language

План написан на русском языке.

## Plan ID

`implementation-plan-20260425-1`

## Related Issue

`TTE-01` — [issue-20260425-1.md](issue-20260425-1.md)

## Source Artifacts

- [issue-20260425-1.md](issue-20260425-1.md) — audited problem statement, acceptance criteria, required constraints, non-goals and risk notes.
- `AGENTS.md` — maintenance contract: source bundle first, then regenerate compiler-owned `SKILL.md` and `docs/compile-report.md`.
- `skill.yaml` — source-of-truth manifest for generated skill metadata, required references, workflow summaries and portability checklist.
- `fragments/overview.md` — current active quick workflow, baseline rules, replay/rate-limit regression guidance, test review guidance and reference map content rendered into `SKILL.md`.
- `references/testing.md` — active detailed testing guidance where the negative matrix should live or be linked from.
- `references/testing-anti-patterns.md` — active mock, fixture and test utility guardrails that must align with new test-double contract guidance.
- `test/docs-contract.test.mjs` — existing docs-contract tests for active guidance reachability and regression protection.
- `package.json` — skill-local test command for docs-contract tests.
- `SKILL.md` and `docs/compile-report.md` — generated outputs used for parity checks only, not authoritative edit targets.
- `docs/README.md` — supporting navigation for issues, implementation plans and implementation logs.

## Objective

Добавить в `typescript-test-engineer` переносимое TypeScript-test guidance для side-effecting/state-changing workflows: агент должен явно рассматривать negative test matrix по релевантности риска, помечать неприменимые строки как `N/A`, и требовать shared contract tests для fixtures/test doubles, которые заменяют production state-changing components. При этом skill не должен превращать matrix в обязательный полный набор тестов для каждого изменения, вводить TDD как default, привязываться к конкретному runner или копировать workflow-specific dossier правила.

## Assumptions

- Skill остается documentation-oriented generated skill; runtime CLI не добавляется.
- Authoritative edits выполняются в source bundle: `skill.yaml`, `fragments/*`, `references/*` и tests, затем generated output обновляется через `skill-source-compiler regenerate`.
- Основной detailed guidance достаточно разместить в существующем required reference `references/testing.md`; новый reference нужен только если implementation увидит, что раздел становится слишком большим или хуже читается.
- Matrix применяется только к side-effecting/state-changing behavior с состоянием, side effects, retries, replay, terminal states, external execution или partial persistence/evidence risk.
- Неприменимые matrix rows не требуют тестов; их нужно явно пометить как `N/A` в test plan, review notes или equivalent handover с короткой причиной.
- Contract suite нужен только когда fixture/model/test double заменяет production state-changing component. Простые value mocks, response builders и isolated pure stubs не должны автоматически получать contract suite.
- External retrospective artifacts, перечисленные в issue evidence, остаются historical context; implementation должна использовать audited issue summary and local active/source artifacts without adding project-specific prerequisites.

## Scope

Входит в scope:

- Обновить quick workflow и test-review guidance так, чтобы side-effecting/state-changing changes сначала перечисляли applicable failure modes из matrix.
- Добавить active guidance section `Side-effecting/state-changing workflow negative matrix`.
- Включить все минимальные matrix rows из issue:
  - duplicate request / repeated command;
  - concurrent request / parallel command;
  - state read failure;
  - state write failure;
  - completion conflict;
  - terminal replay / terminal overwrite attempt;
  - live running replay versus stale recovery;
  - external executor failure;
  - invalid, unknown или stale input;
  - partial evidence/state after failure;
  - retry after partial success.
- Уточнить, что matrix универсальна по risk relevance и не ограничена DB-backed code.
- Добавить fixture/test-double guidance для shared contract suites against production implementation and fixture/model.
- Согласовать новое guidance с `references/testing-anti-patterns.md`, чтобы оно не противоречило правилу "test real behavior, not mock behavior".
- Добавить docs-contract tests, защищающие reachability и ключевые wording/row invariants.
- Регенерировать `SKILL.md` и `docs/compile-report.md`.
- Обновить `docs/README.md`; during implementation создать `docs/logs/implementation-log-20260425-1.md`.

Не входит в scope:

- Изменение `unified-dossier-engineer`, dossier workflow, backlog workflow или `plan-slice` rules.
- Добавление project-specific CF-025/F-0026 examples в active guidance.
- Изменение coverage policy, CI gating semantics или runner defaults.
- Превращение optional matrix в mandatory exhaustive checklist for every trivial change.
- Введение обязательного TDD режима.

## Proposed Changes

- `fragments/overview.md`:
  - добавить quick workflow шаг: для side-effecting/state-changing behavior перечислить applicable matrix rows/failure modes before writing or reviewing tests;
  - уточнить fixtures/mocks step: если test double заменяет production state-changing component, спланировать shared contract suite;
  - уточнить review guidance: missing negative matrix consideration or missing fixture contract coverage is a test-design finding when the risk is relevant;
  - сохранить existing replay/rate-limit wording, сделав его частным случаем broader failure-mode coverage rather than a duplicate rule.
- `references/testing.md`:
  - добавить секцию `Side-effecting/state-changing workflow negative matrix`;
  - описать trigger, relevance rule, `N/A` marking rule and non-DB applicability;
  - добавить table or compact row catalog with the required matrix rows and expected assertion intent;
  - дать guidance по test-plan/review-note representation without requiring every row to become a test.
- `references/testing-anti-patterns.md`:
  - добавить раздел `State-changing test doubles without contract tests` или equivalent anti-pattern;
  - объяснить, что shared contract suite tests observable invariants against both production implementation and fixture/model, not mock internals;
  - для state machines указать common table dimensions: transitions, terminal states, conflicts and replay behavior.
- `skill.yaml`:
  - обновить workflow summary/validation wording so generated workflow sections stay aligned with new source guidance;
  - не добавлять runnable commands.
- `test/docs-contract.test.mjs`:
  - добавить contract tests, проверяющие presence/reachability of the negative matrix section;
  - проверить наличие all required matrix rows and `N/A` relevance wording;
  - проверить fixture/test-double shared contract wording in `references/testing-anti-patterns.md`;
  - проверить, что generated `SKILL.md` points agents toward this guidance through quick workflow or reference map wording.
- Generated output:
  - обновить only via `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/typescript-test-engineer`.
- Supporting docs:
  - обновить `docs/README.md` for this plan and, during implementation, the implementation log.

## Implementation Steps

1. Read the current source bundle and confirm no newer local changes exist in `skills/typescript-test-engineer` beyond this plan.
2. Patch `fragments/overview.md` with concise quick workflow and review guidance, avoiding duplication of the full matrix.
3. Patch `references/testing.md` with the detailed negative matrix section and risk-relevance/N/A rules.
4. Patch `references/testing-anti-patterns.md` with fixture/test-double contract guidance and align it with existing mock anti-pattern rules.
5. Patch `skill.yaml` workflow summary/validation only where needed for generated overview parity; do not introduce command surface.
6. Extend `test/docs-contract.test.mjs` with targeted assertions for matrix rows, N/A wording, fixture contract suite guidance and SKILL.md reachability.
7. Run `skill-source-compiler lint`, then `regenerate`, then inspect generated `SKILL.md` and `docs/compile-report.md`.
8. Run `skill-source-compiler check` and the skill-local docs-contract test command.
9. Create `docs/logs/implementation-log-20260425-1.md` with verification evidence and update `docs/README.md`.
10. Perform portability and workflow-specific terminology scans on active/generated surfaces and resolve unexpected hits.

## Verification Plan

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/typescript-test-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/typescript-test-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/typescript-test-engineer`
- `pnpm --filter @kostysh/typescript-test-engineer test`
- `git diff --check -- skills/typescript-test-engineer`
- Active-surface portability scan:
  - scan `SKILL.md`, `skill.yaml`, `fragments/*` and `references/*` for machine-specific absolute paths, Windows drive paths, and workflow-specific terms such as `plan-slice`, `unified-dossier`, `dossier`, or `backlog`.
- Manual parity checks:
  - `SKILL.md` points agents to the new matrix/fixture guidance through generated quick workflow and required references;
  - every required matrix row from issue appears in active guidance;
  - `N/A` wording makes non-applicable rows explicitly skippable by relevance;
  - wording does not limit matrix to DB-backed code;
  - fixture guidance requires shared contract suite only for production state-changing replacements;
  - no mandatory TDD language, no new runner default, no CI gating change and no workflow-specific dossier prerequisite are introduced.

## Risks and Side Effects

- Risk: matrix wording becomes a mandatory exhaustive checklist for every test change.
  - Mitigation: state the trigger and risk-relevance rule in quick workflow and detailed reference; require `N/A` marking instead of mandatory tests.
- Risk: fixture contract guidance conflicts with "do not test mock behavior".
  - Mitigation: frame contract suites around observable invariants exercised against both production implementation and fixture/model.
- Risk: guidance becomes too large in `SKILL.md`.
  - Mitigation: keep `fragments/overview.md` concise and put details in `references/testing.md` / `references/testing-anti-patterns.md`.
- Risk: generated output drifts from source bundle.
  - Mitigation: update source bundle first and use `skill-source-compiler regenerate/check`; do not hand-edit generated files.
- Risk: active guidance accidentally imports dossier-specific concepts from the retrospective evidence.
  - Mitigation: use generic TypeScript testing language and scan active/generated surfaces for workflow-specific terms.
- Destructive side effects: none expected; planned changes are localized docs, source bundle metadata, generated docs and docs-contract tests inside `skills/typescript-test-engineer`.

## Rollback Plan

Revert the files changed for this issue: `fragments/overview.md`, `references/testing.md`, `references/testing-anti-patterns.md`, `skill.yaml`, `test/docs-contract.test.mjs`, regenerated `SKILL.md`, `docs/compile-report.md`, `docs/README.md` and `docs/logs/implementation-log-20260425-1.md`. Then rerun `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/typescript-test-engineer` to confirm the generated skill is back in a consistent state.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agent `Pascal`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:
- Verdict: `PASS`.
- План покрывает `TTE-01`: все required matrix rows включены, `N/A` по relevance явно предусмотрен, contract tests для state-changing fixtures/test doubles описаны.
- Generated-skill workflow учтен: source bundle first, затем regenerate `SKILL.md` / `docs/compile-report.md`; generated outputs не являются authoritative edit targets.
- Verification покрывает compiler lint/regenerate/check, docs-contract tests, reachability/parity checks, portability/workflow-specific scans, README и implementation log.
- Non-blocking implementation note: сохранить явную reachability для fixture/test-double guidance, а не только presence в `references/testing-anti-patterns.md`.

Required corrections:
- None.

Final status: `PASS`
