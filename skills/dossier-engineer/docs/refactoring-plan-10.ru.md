# План рефакторинга 10: adversarial proof obligations для specification и planning

Дата: `2026-04-15`
Компонент: `dossier-engineer`
Основание: [issues/improvement-proposal-20260415-2.md](issues/improvement-proposal-20260415-2.md)
Скоп: `spec-compact`, `plan-slice`, risk-pattern reference, workflow summary, stage exit checklists, docs-contract tests

## Цель

Закрыть process gap, при котором `spec-compact` и `plan-slice` могут назвать риск broad label-ом, но не заставляют заранее доказать опасную semantics.

После рефакторинга агент должен:

- отличать sequential retry/replay от concurrent retry/replay, когда concurrency возможна;
- отличать closed admission от уже начатой in-flight operation при shutdown/startup/order semantics;
- превращать high-risk edge cases в explicit adversarial semantics на `spec-compact`;
- переносить каждую non-`N/A` adversarial semantics в named proof obligation на `plan-slice`;
- флаговать generic verification labels без operation pair, race window, expected result и durable invariant.

План усиливает orchestration и proof discipline. Он не переносит обязанности `code-reviewer`, `security-reviewer` или `spec-conformance-reviewer` внутрь `dossier-engineer`.

## Нормативные источники

- [../SKILL.md](../SKILL.md)
- [../references/spec-and-plan-risk-patterns.md](../references/spec-and-plan-risk-patterns.md)
- [../references/workflow.md](../references/workflow.md)
- [../references/workflow-stage-spec-compact.md](../references/workflow-stage-spec-compact.md)
- [../references/workflow-stage-plan-slice.md](../references/workflow-stage-plan-slice.md)
- [../references/workflow-stage-implementation.md](../references/workflow-stage-implementation.md)
- [issues/improvement-proposal-20260415-2.md](issues/improvement-proposal-20260415-2.md)

## Не цели

- Не добавлять новые CLI commands.
- Не менять runtime behavior `scripts/dossier.mjs`, кроме возможной пересборки, если package scripts требуют build перед tests.
- Не делать heavyweight adversarial matrix обязательной для prose-only или stateless docs changes.
- Не требовать concurrency proofs для features без side effects, durable state, lifecycle transitions, retries, shutdown/startup, jobs, audit evidence или trust boundaries.
- Не превращать pre-implementation audit в замену явной risk-to-proof mapping.
- Не требовать таблицу как единственную форму, если компактный список содержит те же поля.
- Не проектировать implementation architecture внутри `spec-compact`, когда решение остается legitimate implementation freedom.

## Базовые решения

1. Нормативное ядро живет в `references/spec-and-plan-risk-patterns.md`; stage references и `SKILL.md` дают короткие triggers/checklists и ссылки на него.
2. `spec-compact` отвечает за классификацию adversarial cases как specified или explicit `N/A`.
3. `plan-slice` отвечает за mapping каждой non-`N/A` semantics в named proof obligation.
4. Generic labels вроде `idempotency tests` или `shutdown tests` допустимы только как заголовок рядом с конкретным proof.
5. Pre-implementation audit для high-risk plans является narrow missing-proof-obligations review guidance, а не заменой matrix и не способом расширить implementation scope.
6. Blocking audit decisions не должны выполняться weak/mini model.

## Package 1. Risk-pattern reference как единая семантическая база

### Смысл

`spec-and-plan-risk-patterns.md` должен перестать быть только списком broad reminders и стать местом, где описан минимальный proof contract для high-risk behavior.

### Файлы

- `references/spec-and-plan-risk-patterns.md`
- `references/workflow.md`
- `test/docs-contract.test.ts`

### Изменения

1. Добавить раздел `Adversarial proof obligations`.
2. Зафиксировать trigger: side effects, durable state, lifecycle transitions, idempotency, retries, shutdown/startup, queues/jobs, transactions, audit evidence, canonical writer/read-only consumer boundary или trust boundary.
3. Зафиксировать cases, которые нужно classified как specified или `N/A`:
   - sequential success;
   - invalid input;
   - dependency failure / timeout;
   - duplicate or replay after completion;
   - concurrent duplicate or racing request;
   - concurrent conflicting request;
   - partial side effect / crash / restart;
   - stale read / stale snapshot / late completion.
4. Для non-`N/A` cases требовать:
   - participating operation(s);
   - race window или ordering boundary;
   - expected winner/loser result, если есть competition;
   - durable invariant;
   - externally observable result или error;
   - required proof type.
5. Добавить examples достаточных proof obligations из proposal, включая:
   - same-key same-payload convergence;
   - same-key different-payload conflict without duplicate records;
   - shutdown waits for already-started admission write before evidence snapshot;
   - stale snapshot cannot report completion before canonical writer state is durable.
6. Обновить `workflow.md` summary в `Spec and planning risk hardening`, чтобы он указывал не только на broad contract-risk cleanup, но и на adversarial semantics / risk-to-proof obligations.

### Acceptance

- Reference явно отличает sequential replay от concurrent replay.
- Reference явно отличает closed admission от already-started in-flight operation.
- Reference не требует adversarial matrix для simple stateless changes.
- Workflow guide points to the strengthened risk-pattern reference without duplicating the full matrix.
- Docs-contract test защищает heading и ключевые trigger/case/proof terms.

## Package 2. `spec-compact` trigger и stage steps

### Смысл

На `spec-compact` агент должен не просто написать "idempotency relevant", а классифицировать конкретные adversarial semantics до planning.

### Файлы

- `references/workflow-stage-spec-compact.md`
- `SKILL.md`
- `test/docs-contract.test.ts`

### Изменения

1. В `workflow-stage-spec-compact.md` добавить шаг после safety/boundary semantics:
   - если adversarial trigger fired, добавить compact `Adversarial semantics` block или equivalent section in the dossier;
   - перечислить trigger cases как `specified` или explicit `N/A`;
   - для каждого `specified` case назвать participating operation(s), race window или ordering boundary, expected winner/loser result когда есть конкуренция, durable invariant, externally observable result/error и required proof type;
   - для каждого `N/A` case указать compact rationale;
   - если case невозможно классифицировать как `specified` или `N/A`, записать его как blocking `Open question` с `needed_by: before_planned`; такой case не засчитывается как выполненная adversarial semantics classification и блокирует выход из `spec-compact`.
2. В `SKILL.md` trigger summary для `spec-compact` добавить короткое правило:
   - high-risk stateful/side-effecting/boundary features require adversarial semantics classification before planning.
3. В `SKILL.md` stage exit checklist для `spec-compact` добавить проверки:
   - high-risk semantics не остались broad labels;
   - sequential replay и concurrent replay разделены, когда concurrency possible;
   - shutdown/startup/order semantics distinguish closed admission from already-started in-flight operation when relevant;
   - every triggered adversarial case is either `specified` with all required P1 proof fields or explicit `N/A` with rationale;
   - unresolved adversarial cases are blocking `Open question` entries with `needed_by: before_planned` and prevent stage exit.

### Acceptance

- `spec-compact` получает буквальный trigger и не может закрыться одной строкой `idempotency/shutdown considered`.
- `N/A` разрешен, но должен быть explicit.
- Non-`N/A` / `specified` cases include participating operation(s), race/order boundary, competition result when relevant, durable invariant, externally observable result/error, and required proof type.
- Unresolved adversarial cases are visible blockers, not satisfied checklist items.
- Stage checklist не требует implementation design beyond necessary semantics.

## Package 3. `plan-slice` risk-to-proof mapping

### Смысл

Planning должен доказывать coverage of dangerous modes, а не только наличие slices и generic tests.

### Файлы

- `references/workflow-stage-plan-slice.md`
- `SKILL.md`
- `test/docs-contract.test.ts`

### Изменения

1. В `workflow-stage-plan-slice.md` добавить шаг перед созданием/закрытием slices:
   - map every non-`N/A` adversarial semantics into named proof obligation.
2. Зафиксировать минимальные поля mapping:
   - `Risk / edge case`;
   - `Spec source`;
   - `Required proof`;
   - `Slice`;
   - `Verification artifact`;
   - `N/A rationale`.
3. Явно разрешить table или compact list, если все поля присутствуют.
4. Добавить sufficiency rule:
   - proof должен назвать operation pair или participating operation(s);
   - race window или ordering boundary;
   - expected observable result/error;
   - durable invariant.
5. Добавить proof specificity smell pass для labels:
   - `idempotency tests`;
   - `race tests`;
   - `shutdown tests`;
   - `boundary tests`;
   - `failure tests`;
   - `integration tests`;
   - `coverage for edge cases`;
   - `adversarial tests`.
6. В `SKILL.md` stage exit checklist для `plan-slice` добавить:
   - every high-risk edge case has named proof obligation or explicit `N/A rationale`;
   - generic verification labels were refined or paired with concrete proof details;
   - implementation adversarial checklist was translated into spec-level semantics or explicit `N/A` entries before implementation.

### Acceptance

- `plan-slice` cannot look complete through generic verification labels alone.
- Risk-to-proof mapping links spec semantics to slices and verification artifacts.
- Planning remains proportional for non-triggered features.

## Package 4. Pull implementation adversarial checklist earlier

### Смысл

Implementation checklist should not be the first place where missing retry/shutdown/crash semantics are discovered.

### Файлы

- `SKILL.md`
- `references/workflow-stage-spec-compact.md`
- `references/workflow-stage-plan-slice.md`
- `references/workflow-stage-implementation.md` only if cross-link wording needs clarification
- `test/docs-contract.test.ts`

### Изменения

1. Reuse the current side-effecting implementation checklist as upstream triggers:
   - timeout budget;
   - late completion;
   - abort/cancellation;
   - partial side effects;
   - idempotency / duplicate delivery;
   - logging/audit append failures;
   - crash/restart boundaries.
2. In `spec-compact`, use the list to decide whether adversarial semantics are required or explicitly `N/A`.
3. In `plan-slice`, use the list as a source for proof obligations.
4. Keep `implementation` checklist in place as final delivery audit; do not remove or weaken it.

### Acceptance

- The same risk vocabulary appears consistently across spec, plan, and implementation stages.
- The implementation checklist remains a final guard, not the first discovery point.

## Package 5. Narrow pre-implementation missing-proof audit guidance

### Смысл

For high-risk plans, an optional-but-recommended narrow review should catch missing proof obligations before mutating implementation edits.

### Файлы

- `references/workflow-stage-plan-slice.md`
- `SKILL.md` if the short stage summary needs a pointer
- `test/docs-contract.test.ts`

### Изменения

1. Add guidance: if adversarial semantics are non-empty, run or request a narrow pre-implementation process/spec review focused on missing proof obligations unless repo/operator context explicitly keeps planning lightweight.
2. Include the prompt:

   ```md
   Find missing adversarial proof obligations in this spec and slicing plan.
   Focus on concurrency, stale state, partial side effects, retry/replay, shutdown/startup,
   ownership boundaries, durable evidence, and proof specificity.
   ```

3. State boundaries:
   - review checks missing proofs;
   - review does not replace risk-to-proof matrix;
   - review does not expand implementation scope;
   - blocking audit decisions must not use weak/mini models.

### Acceptance

- High-risk plan guidance includes a reusable narrow review prompt.
- The review guidance is subordinate to explicit mapping and does not become a second planning SSoT.

## Package 6. Contract tests and verification

### Смысл

The new rules are active normative surface, so tests should protect exact key phrases across `SKILL.md` and references.

### Файлы

- `test/docs-contract.test.ts`

### Изменения

1. Extend the existing `spec-compact and plan-slice point to risk patterns and literal risk-killing duties` test.
2. Assert the workflow risk-hardening summary mentions adversarial semantics or risk-to-proof obligations.
3. Assert the new reference includes:
   - `Adversarial proof obligations`;
   - `sequential replay`;
   - `concurrent replay`;
   - `closed admission`;
   - `already-started in-flight operation`;
   - `Risk / edge case`;
   - `Required proof`;
   - `N/A rationale`;
   - `proof specificity smell pass`.
4. Assert `SKILL.md` stage sections mention:
   - adversarial semantics classification for `spec-compact`;
   - named proof obligation or explicit `N/A rationale` for `plan-slice`;
   - generic verification labels are insufficient without concrete proof details.
5. Assert `workflow-stage-spec-compact.md` mentions:
   - adversarial trigger conditions for stateful / side-effecting / boundary features;
   - `specified` / `N/A` classification;
   - participating operation(s), race window or ordering boundary, durable invariant, externally observable result/error, required proof type, and `N/A` rationale;
   - unresolved adversarial cases become blocking `Open question` entries with `needed_by: before_planned`.
6. Assert `workflow-stage-plan-slice.md` mentions:
   - risk-to-proof mapping for every non-`N/A` adversarial semantics;
   - `Risk / edge case`, `Spec source`, `Required proof`, `Slice`, `Verification artifact`, and `N/A rationale`;
   - proof sufficiency requires operation pair or participating operation(s), race/order boundary, expected observable result/error, and durable invariant;
   - proof specificity smell pass flags generic labels;
   - sequential replay vs concurrent replay and closed admission vs already-started in-flight operation distinctions.

### Verification commands

- `pnpm --filter @kostysh/dossier-engineer-cli test`
- `git diff --check`
- run a portability grep for absolute local paths in `skills/dossier-engineer`, excluding generated source maps

## Implementation order

1. Update `references/spec-and-plan-risk-patterns.md`.
2. Update `references/workflow.md` risk-hardening summary.
3. Update `references/workflow-stage-spec-compact.md`.
4. Update `references/workflow-stage-plan-slice.md`.
5. Update `SKILL.md` trigger summaries and stage exit checklists.
6. Update `test/docs-contract.test.ts`.
7. Run verification commands.
8. Run narrow external spec/process review against the proposal and changed active docs.
9. Fix all must-fix findings and rerun affected checks/review until PASS.

## Review plan

Before implementation, run external review on this plan against [issues/improvement-proposal-20260415-2.md](issues/improvement-proposal-20260415-2.md).

Reviewer brief:

```text
Review docs/refactoring-plan-10.ru.md against docs/issues/improvement-proposal-20260415-2.md.
Check whether the plan fully covers P1-P5 and all acceptance criteria, preserves proportionality,
keeps dossier-engineer focused on orchestration/proof obligations instead of replacing review skills,
and identifies the right active docs/tests to change.
Return MUST-FIX findings only, with file/section evidence and suggested correction.
PASS only if the plan is implementation-ready.
```

Plan is not ready to implement until the external review returns PASS or all must-fix findings are incorporated and re-reviewed.
