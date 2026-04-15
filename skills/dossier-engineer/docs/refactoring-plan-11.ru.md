# План рефакторинга 11: fail-closed audit launch gate

Дата: `2026-04-15`
Компонент: `dossier-engineer`
Основание: [issues/improvement-proposal-20260415-3.md](issues/improvement-proposal-20260415-3.md)
Скоп: implementation audit policy, independent review model, implementation stage steps, workflow-stage logging, docs-contract tests

## Цель

Закрыть критический process gap из ретроанализа F-0019: blocking external audits не должны стартовать на platform default или weak/mini model из-за того, что agent не указал model/reasoning явно.

После рефакторинга агент должен:

- выполнить `Audit launch gate` до каждого blocking `spawn_agent`;
- явно назвать audit class, required skill, scope, model, reasoning effort и allowed-model verdict;
- fail-closed остановиться, если model/reasoning не заданы или policy не разрешает модель;
- не принимать weak/mini audit verdict как review evidence;
- фиксировать invalid audit attempts только как telemetry/process-miss evidence;
- оставлять lightweight non-blocking helper agents допустимыми только при явном operator approval и без blocking verdict semantics.

## Нормативные источники

- [../SKILL.md](../SKILL.md)
- [../references/implementation-audit-policy.md](../references/implementation-audit-policy.md)
- [../references/workflow-stage-implementation.md](../references/workflow-stage-implementation.md)
- [../references/workflow-stage-logging.md](../references/workflow-stage-logging.md)
- [issues/improvement-proposal-20260415-3.md](issues/improvement-proposal-20260415-3.md)

## Не цели

- Не добавлять новые CLI commands.
- Не менять runtime behavior `scripts/dossier.mjs`, кроме возможной пересборки перед tests.
- Не hardcode-ить полный список будущих allowed models в skill.
- Не запрещать non-blocking helper agents, если operator явно разрешил degraded/helper mode и результат не используется как blocking audit verdict.
- Не требовать отдельный durable review artifact для invalid spawn attempts; stage log telemetry достаточно.
- Не переносить обязанности `code-reviewer`, `security-reviewer` или `spec-conformance-reviewer` в `dossier-engineer`.

## Базовые решения

1. Основная normative policy живет в `references/implementation-audit-policy.md`.
2. `SKILL.md` содержит короткие fail-closed правила в skill-wide independent review model и implementation checklist.
3. `workflow-stage-implementation.md` ставит gate непосредственно перед early checkpoint, spec-conformance, code/security и independent review launches.
4. `workflow-stage-logging.md` получает normalized telemetry fields для audit launch attempts.
5. Docs-contract tests защищают literal phrases, чтобы правило не деградировало обратно в broad "spawn reviewer" wording.

## Package 1. `Audit launch gate` в implementation audit policy

### Смысл

`implementation-audit-policy.md` должен явно разделить решение "audit нужен" и безопасный запуск audit agent.

### Файлы

- `references/implementation-audit-policy.md`
- `test/docs-contract.test.ts`

### Изменения

1. Добавить раздел `Audit launch gate` перед `Spawned agents only`.
2. Зафиксировать, что gate обязателен для всех blocking audits:
   - `spec-conformance`;
   - `code`;
   - `security`;
   - `independent-review`;
   - `early-security-checkpoint`;
   - any other named blocking audit.
3. Ввести минимальную форму:

   ```md
   Audit launch gate:
   - audit_class:
   - required_skill:
   - scope:
   - model:
   - reasoning_effort:
   - blocking: true | false
   - allowed_by_policy: true | false
   - disallowed_reason:
   ```

4. Зафиксировать fail-closed rules:
   - missing `model` blocks launch;
   - missing `reasoning_effort` blocks blocking audit launch;
   - weak/mini model class blocks blocking audit launch;
   - model disallowed by repo/operator policy blocks launch;
   - runtime inability to choose model explicitly blocks the step unless operator explicitly approves degraded mode.
5. Зафиксировать, что `allowed_by_policy: true` is required before spawn for blocking audits.
6. Зафиксировать `disallowed_reason` semantics:
   - if `allowed_by_policy: true`, `disallowed_reason` must be empty before spawn;
   - if `allowed_by_policy: false`, spawning is blocked and `disallowed_reason` must state why.

### Acceptance

- Policy has literal `Audit launch gate` section.
- Gate fields include audit class, required skill, scope, model, reasoning effort, blocking flag, allowed verdict, and disallowed reason.
- Missing model/reasoning fails closed for blocking audits.
- The policy says the gate must be completed before `spawn_agent`.
- `disallowed_reason` has explicit empty-for-launch and filled-for-stop semantics.

## Package 2. Weak/mini invalidation semantics

### Смысл

Если invalid launch все-таки случился, skill должен запретить использовать результат как review evidence.

### Файлы

- `references/implementation-audit-policy.md`
- `SKILL.md`
- `test/docs-contract.test.ts`

### Изменения

1. В policy добавить правило:
   - weak/mini models cannot produce blocking audit verdicts;
   - weak/mini results must be treated as invalidated;
   - invalidated attempts are telemetry/process-miss evidence only;
   - invalidated attempts must not be summarized as PASS/FAIL evidence.
2. Уточнить proportionality:
   - non-blocking helper agents may use lighter models only with explicit operator approval;
   - helper output cannot satisfy blocking audit requirements.
3. В `SKILL.md` independent review execution model добавить:
   - required independent review must declare model/reasoning when runtime supports those fields;
   - unmet model policy blocks the step unless operator explicitly approves degraded review mode;
   - degraded mode remains explicit and cannot be silently treated as normal independent review.

### Acceptance

- Weak/mini model verdicts cannot satisfy blocking audit requirements.
- Invalid attempts are visible process telemetry, not review evidence.
- `SKILL.md` skill-wide independent review model includes the fail-closed model policy rule.

## Package 3. Implementation stage integration

### Смысл

Detailed implementation stage steps must force the gate at the actual launch points, not only in a background policy.

### Файлы

- `references/workflow-stage-implementation.md`
- `SKILL.md`
- `test/docs-contract.test.ts`

### Изменения

1. In `workflow-stage-implementation.md`, add a step before any external audit:
   - run audit launch gate from `implementation-audit-policy.md`;
   - do not spawn if gate fails.
2. Apply it explicitly to:
   - early security seam checkpoint;
   - spec-conformance review;
   - nested code/security reviews;
   - independent review.
3. In `SKILL.md` implementation stage exit checklist add:

   ```md
   - [ ] Every blocking external audit launch declared model, reasoning effort, required skill, scope, and allowed-model verdict before spawning.
   - [ ] No blocking audit verdict from a weak/mini model was accepted as review evidence.
   ```

4. Keep implementation audit stack order unchanged.

### Acceptance

- Stage steps say the gate runs before the audit stack.
- Early security checkpoint also uses the gate.
- Implementation checklist has explicit model/reasoning/allowed-model checks.
- Review skill responsibilities stay external.

## Package 4. Workflow-stage logging telemetry for audit launches

### Смысл

Retrospective analysis should be able to distinguish usable review events from invalid launch attempts without reading prose.

### Файлы

- `references/workflow-stage-logging.md`
- `test/docs-contract.test.ts`

### Изменения

1. Extend metadata example and field descriptions for `review_events` or a nested audit-launch shape with:
   - `audit_launch_gate_checked: true | false`
   - `audit_class`
   - `required_skill`
   - `model`
   - `reasoning_effort`
   - `allowed_by_policy: true | false`
   - `disallowed_reason`
   - `invalidated: true | false`
   - `invalidated_reason`
   - `operator_intervention_required: true | false`
   - optional `operator_intervention_ref`
   - optional `replacement_event_ref`
2. State that invalidated attempts:
   - do not count as review evidence;
   - still count as orchestration cost/process miss;
   - record whether operator intervention was required;
   - must link to the replacement rerun when one exists.
3. Keep this required only when external review/audit events occur.

### Acceptance

- Logging contract contains normalized launch-gate fields.
- Invalid attempts can be represented without pretending they are PASS/FAIL reviews.
- Invalid attempts can record per-attempt operator intervention instead of relying only on aggregate counters.
- Logging stays proportional for stages without external audits.

## Package 5. Docs-contract tests

### Смысл

The new rule is active normative surface, so tests should protect both the policy and the two places agents actually read before acting: `SKILL.md` and workflow-stage steps.

### Файлы

- `test/docs-contract.test.ts`

### Изменения

1. Extend `skill-wide review sections stay distinct from implementation-specific audit policy` to assert:
   - `Audit launch gate`;
   - `model`;
   - `reasoning_effort`;
   - `allowed_by_policy`;
   - weak/mini verdict invalidation;
   - unmet model policy blocks the step unless operator approves degraded mode.
2. Extend `implementation stage points to audit and workflow-stage logging refs...` to assert:
   - implementation stage runs audit launch gate before external audits;
   - early security seam checkpoint uses the gate;
   - implementation checklist includes model/reasoning/allowed-model checks.
3. Extend logging contract assertions to include:
   - `audit_launch_gate_checked`;
   - `audit_class`;
   - `required_skill`;
   - `reasoning_effort`;
   - `allowed_by_policy`;
   - `disallowed_reason`;
   - `invalidated`;
   - `invalidated_reason`;
   - `operator_intervention_required`;
   - `operator_intervention_ref`.
4. Add assertions for launch/stop semantics:
   - `disallowed_reason` must be empty when `allowed_by_policy: true`;
   - `disallowed_reason` must be filled when `allowed_by_policy: false`.

### Verification commands

- `pnpm --filter @kostysh/dossier-engineer-cli test`
- `git diff --check`
- run a portability grep for absolute local paths in `skills/dossier-engineer`, excluding generated source maps

## Implementation order

1. Update `references/implementation-audit-policy.md`.
2. Update `SKILL.md` independent review model and implementation stage checklist.
3. Update `references/workflow-stage-implementation.md`.
4. Update `references/workflow-stage-logging.md`.
5. Update `test/docs-contract.test.ts`.
6. Run verification commands.
7. Run narrow external spec/process review against the proposal and changed active docs.
8. Fix all must-fix findings and rerun affected checks/review until PASS.

## Review plan

Before implementation, run external review on this plan against [issues/improvement-proposal-20260415-3.md](issues/improvement-proposal-20260415-3.md).

Reviewer brief:

```text
Review docs/refactoring-plan-11.ru.md against docs/issues/improvement-proposal-20260415-3.md.
Check whether the plan fully covers P1-P5 and all acceptance criteria, preserves proportionality,
keeps dossier-engineer focused on orchestration/model-gating rather than replacing review skills,
and identifies the right active docs/tests to change.
Return MUST-FIX findings only, with file/section evidence and suggested correction.
PASS only if the plan is implementation-ready.
```

Plan is not ready to implement until the external review returns PASS or all must-fix findings are incorporated and re-reviewed.
