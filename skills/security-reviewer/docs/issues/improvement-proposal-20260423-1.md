# Improvement Proposal: сдвинуть security concerns для auth-admission раньше в skill stack

Issue ID: `ISS-05`

Primary owner skill: `security-reviewer`

Affected skills:

- `HONO engineer`
- `security-reviewer`
- `typescript-test-engineer`

## Проблема

Для auth-admission work важные security concerns проявлялись слишком поздно в cycle.

Сгруппированные проблемы намеренно объединены в один cross-skill issue:

- `HONO engineer` недостаточно рано поднимает компактный route-admission checklist;
- guidance `security-reviewer` сильна на этапе review, но недостаточно рано проталкивает свой threat model в planning или early implementation prompts для auth-admission slices;
- `typescript-test-engineer` не требует явного указания, какой именно replay/rate-limit risk должен lock down соответствующий regression test.

Вместе эти пробелы допускают позднее обнаружение:

- bounded body-read issues;
- quota-isolation issues;
- replay/availability semantics;
- тестов, которые покрывают что-то рядом, но не фиксируют нужный failure mode.

## Почему это важно

Это не запрос на построение большого security framework.

Проблема уже:

- auth-admission slices достаточно рискованные, чтобы отсутствие маленького checklist на раннем этапе создавало review churn позже;
- позднее обнаружение этих concerns увеличивает число rerounds рядом с `ready_for_close`;
- test coverage может выглядеть существующей, но все равно не фиксировать именно тот риск, который нужно было закрыть.

## Текущая активная поверхность

Релевантные active references внутри `security-reviewer`:

- [Methodology](../../references/methodology.md)
- [API auth input](../../references/api-auth-input.md)
- [Domain handoffs](../../references/domain-handoffs.md)

Этот issue также требует согласованных изменений в companion skills, перечисленных выше. Изменения в этих skill должны оставаться ограниченными auth-admission concern family, описанным здесь.

## Требуемое исправление

Добавить небольшой, явный early-stage checklist stack для auth-admission work.

Решение должно оставаться узким и role-aligned:

- `security-reviewer` владеет early threat checklist и timing guidance;
- `HONO engineer` владеет Hono route-admission/domain framing cues, нужными implementation agents;
- `typescript-test-engineer` владеет test-design cue, которая заставляет replay/rate-limit regression tests привязываться к конкретному риску.

Для границ этого issue `auth-admission` означает slices, которые меняют protected route admission, replay/idempotency controls, pre-auth resource consumption или closely related authorization-boundary handling для этих route.

## Что должно измениться

### 1. `security-reviewer`

Добавить explicit guidance, что auth-admission slices должны поднимать core threat checklist до поздних review loops.

Это правило должно находиться в early-use workflow surface skill, а не только в глубокой reference section.

Checklist как минимум должен покрывать:

- trust boundary route;
- pre-auth versus post-auth resource consumption;
- replay и idempotency expectations, когда они релевантны;
- bounded request-body handling на high-risk routes.

### 2. `HONO engineer`

Добавить компактный route-admission checklist или guardrail language для Hono-backed auth/admission work.

Это правило должно находиться в early-use guidance skill, а не только в малозаметной optional detail.

Guidance должна оставаться краткой и сфокусированной на выявленном семействе concerns:

- bounded body reads;
- quota isolation;
- replay behavior;
- preservation of the touched route's admission boundary.

### 3. `typescript-test-engineer`

Добавить узкое regression-test rule для replay/rate-limit style fixes:

- изменение теста должно явно показывать, какой конкретный риск или failure mode оно фиксирует;
- exercised scenario или assertions должны реально отражать этот named risk или failure mode, а не только nearby behavior или prose label.

Это не требует новой общей taxonomy для tests. Нужен только достаточный cue, чтобы near-miss coverage перестала считаться достаточной.

## Внешний Spec-Conformance Review

Status: reviewed

Verdict on initial draft: `mixed`

Ключевой результат review:

- cross-skill ownership split принят как bounded и в основном не избыточный;
- draft требовал более жестких timing/placement requirements, чтобы checklist появлялся в early-use workflow surfaces;
- test rule требовал связать named replay/rate-limit risk с exercised scenarios или assertions, а не только с prose;
- wording для Hono требовало narrowing, чтобы оставаться в рамках admission-boundary preservation, а не broad generic authorization scope.

## Acceptance Criteria

Issue считается исправленным только когда:

- `security-reviewer` явно требует более раннего surfacing auth-admission threats для ограниченного набора concerns этого issue и помещает это правило в early-use workflow surface;
- `HONO engineer` добавляет компактную auth-admission guidance для bounded body reads, quota isolation, replay behavior и preservation of the touched route's admission boundary, причем эта guidance видима в early-use workflow surface;
- `typescript-test-engineer` добавляет узкое правило, что replay/rate-limit regression tests должны указывать targeted risk или failure mode и отражать эту цель в exercised scenario или assertions;
- изменения остаются короткими и role-aligned, а не дублируют целые frameworks между тремя skills;
- docs-contract coverage защищает новую guidance там, где это применимо.

## Обязательное ограничение для последующего planning и implementation

Любой будущий planning или implementation по этому issue должен оставаться строго в границах auth-admission concern family, описанного здесь.

Обязательные границы:

- вносить только минимальные documentation и test-contract changes, нужные для введения этого early checklist stack;
- не расширять issue до full security rewrite затронутых skills;
- не дублировать большие sections одного skill внутри другого;
- не добавлять unrelated auth, webhook, CI или general testing methodology improvements в рамках этого issue;
- если implementation выявит отдельный concern вне этого bounded checklist family, заводить новый follow-up вместо расширения текущего issue.

## Non-Goals

- Не превращать `security-reviewer` в generic planning skill.
- Не дублировать полную Hono architecture или testing methodology в рамках этого issue.
- Не требовать, чтобы каждое изменение tests в skill несло новые metadata за пределами bounded replay/rate-limit regression cue, описанного здесь.

## План имплементации

Status: draft

Source row: `ISS-05` / `HONO-01`, `SEC-01`, `TTE-01`

### Рабочие допущения

- Это docs/contract change для трех skills, не security-framework rewrite.
- Новая guidance должна быть видна в early-use workflow surfaces, а детали могут жить в существующих references.
- Каждый skill сохраняет ownership: `security-reviewer` threat timing, `HONO engineer` route-admission framing, `typescript-test-engineer` regression-test adequacy cue.

### Шаги

1. Обновить `security-reviewer`:
   - в `SKILL.md` добавить короткий early auth-admission checkpoint в fast workflow / operating guidance;
   - checkpoint должен срабатывать для protected route admission, replay/idempotency controls, pre-auth resource consumption и closely related authorization-boundary handling;
   - в `references/api-auth-input.md` добавить компактный checklist: route trust boundary, pre-auth vs post-auth resource consumption, replay/idempotency expectations, bounded body handling, quota isolation;
   - в `references/domain-handoffs.md` уточнить, что Hono-specific body limits/middleware/admission-boundary facts нужно решать через `HONO engineer`.
2. Обновить `HONO engineer`:
   - в `SKILL.md` добавить early route-admission cue в `Workflow for adding endpoints` или ближайший early-use раздел;
   - guidance должна покрывать только bounded body reads, quota isolation, replay behavior и preservation of touched route admission boundary;
   - при необходимости добавить короткие supporting bullets в `references/auth.md`, `references/rate-limiting.md` и `references/perf-security.md`, без копирования security-reviewer methodology.
3. Обновить `typescript-test-engineer`:
   - в `SKILL.md` добавить narrow rule для replay/rate-limit regression tests: тест должен назвать targeted risk/failure mode и реально exercise/assert этот риск;
   - в `references/testing.md` добавить пример/anti-near-miss cue для случаев, где test label говорит про replay/rate-limit, но assertions проверяют nearby behavior.
4. Добавить docs-contract coverage where applicable:
   - если у affected docs-only skill еще нет package-local test harness, добавить минимальный package-local `node:test` docs-contract только для собственного active surface каждого skill;
   - tests должны проверять presence early-use guidance и отсутствие broad framework rewrite wording;
   - не добавлять cross-skill tests, которые делают отдельный skill folder непереносимым.
5. Проверить portability:
   - не добавлять absolute paths;
   - не ссылаться на repo-external required docs;
   - cross-skill references использовать только по имени skill.

### Проверки

- `pnpm test` или targeted package-local docs-contract tests для affected skills, если harness добавлен.
- Manual grep portability check по affected skill folders на absolute local paths.

### Scope guards

- Не превращать `security-reviewer` в planning skill.
- Не дублировать полные Hono/testing методологии между skills.
- Не расширять checklist на unrelated auth/webhook/CI/general testing topics.
- Не требовать metadata для всех tests; только bounded replay/rate-limit regression cue.

## Внешний Spec-Conformance Review плана

Status: reviewed

Reviewer: `spec-conformance-reviewer`

Model: top-tier, reasoning `high`, non-forked external review

Verdict: `PASS`

Ключевой результат review:

- plan coverage для `HONO-01`, `SEC-01`, `TTE-01` признан достаточным;
- early-use placement для `security-reviewer`, `HONO engineer` и `typescript-test-engineer` соответствует issue;
- docs-contract coverage запланирован минимально и portable, без cross-skill coupling или full framework rewrite.
