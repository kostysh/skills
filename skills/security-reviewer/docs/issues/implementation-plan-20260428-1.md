# План реализации

## Язык

План написан на русском языке.

## Идентификатор плана

`implementation-plan-20260428-1`

## Связанная issue

`issue-20260428-1` — [issue-20260428-1.md](issue-20260428-1.md)

## Исходные артефакты

- [issue-20260428-1.md](issue-20260428-1.md) — прошедшее аудит описание проблемы, риска replay/capability, области authority binding, предлагаемого решения и ожидаемой проверки.
- `AGENTS.md` — правила репозитория для планов реализации, независимых аудитов, обслуживания generated skills, parity между документацией/runtime/tests, аудита качества инструкций и портативности.
- `docs/templates/IMPLEMENTATION_PLAN_TEMPLATE.md` — общий шаблон плана реализации.
- `skills/security-reviewer/AGENTS.md` — контракт обслуживания generated skill: source of truth находится в `skill.yaml`, `fragments/*`, `references/*` и `assets/*`; generated outputs — `SKILL.md` и `docs/compile-report.md`.
- `skills/security-reviewer/SKILL.md` — текущая generated active surface с Fast Workflow, policy-governance admission hook и картой required references.
- `skills/security-reviewer/skill.yaml` — source manifest для active references, required reference triggers, copied test/package files, source version и portability rules.
- `skills/security-reviewer/fragments/overview.md` — исходный prose-фрагмент для root workflow, scope classification, output rules и reference map.
- `skills/security-reviewer/references/policy-governance-admission.md` — текущий active checklist для policy/control-plane admission, stale allow replay, freshness, fail-closed gates и audit sufficiency.
- `skills/security-reviewer/references/methodology.md` — общий review standard, surface discovery, audit order, confidence gates и output formats.
- `skills/security-reviewer/references/api-auth-input.md` — route-specific auth-admission checklist, который должен остаться отдельным от non-route admission-gate guidance.
- `skills/security-reviewer/references/domain-handoffs.md` — правила handoff для framework/runtime facts при сохранении policy-governance reportability за `security-reviewer`.
- `skills/security-reviewer/references/github-actions.md` — guidance для release automation и supply-chain review, релевантный release, runtime artifact и deployment identity binding.
- `skills/security-reviewer/references/webhooks.md` — существующий словарь replay/freshness/idempotency для inbound integrations; полезен для согласованности, но не является canonical admission-gate checklist.
- `skills/security-reviewer/test/docs-contract.test.mjs` — текущие contract tests, защищающие active workflow и policy-governance admission guidance.
- `skills/security-reviewer/package.json` — package-local test command.
- `skills/security-reviewer/docs/compile-report.md` — generated supporting report, который должен обновляться после изменений source bundle.
- `skills/security-reviewer/docs/README.md` — supporting navigation для issues, plans и implementation logs.
- `skill-source-compiler` — maintainer skill и runtime для source-bundle lint, regeneration, drift checks и instruction quality audit.

## Цель

Усилить `security-reviewer`, чтобы review admission/approval gates явно ловил класс authorization bypass, где сохраненное решение `allowed`, выбранное вызывающей стороной evidence или replayed idempotency record трактуется как свежая executable authority. Active guidance должен различать historical/audit replay и текущую invocable capability, требовать fail-closed для conflict replay, проверять canonical authority для freshness и evidence identity, а также покрывать release/runtime artifact/deployment identity binding без зависимости от файлов исходного проекта.

## Предположения

- `security-reviewer` остается generated documentation skill с package-local docs-contract tests; shipped CLI у навыка нет.
- Будущая реализация должна сначала изменить source-bundle files, а затем регенерировать `SKILL.md` и `docs/compile-report.md`.
- `references/policy-governance-admission.md` является правильным canonical местом для этого checklist; работу нужно расширять там, а не создавать конкурирующий active reference, если только раздел не станет слишком большим для сканирования.
- Route auth-admission остается в `references/api-auth-input.md`; новое guidance применяется к admission/approval gates, где policy decisions могут создавать executable capability, а не к обычному review HTTP route middleware.
- Текущая дисциплина HIGH-confidence security reporting не меняется: findings требуют подтвержденный actor/control path, reachable admission path, missing or bypassed control и security impact.
- Release/deployment identity binding должен быть достаточно generic для deployment approvals, model invocation admission, protected-resource access, publish/rollback authorization и похожих workflow.
- Любое cross-skill alignment должно ссылаться на другие навыки только по имени; `security-reviewer` обязан сохранить standalone checklist внутри своей папки для портативности.

## Область работ

Входит в scope:

- Расширить active admission-gate guidance для различения historical replay и current executable capability.
- Добавить явные проверки, что replay возвращает только audit/history status, если fresh invocation не авторизован независимо.
- Требовать fail-closed для conflict replay с тем же idempotency key и другими security-relevant inputs.
- Требовать, чтобы idempotency scope связывал actor, operation, target/resource, scope, stage, policy version, evidence identity, release/runtime artifact и deployment identity там, где это релевантно.
- Добавить authority questions для источника freshness timestamp, evidence identity, caller-selected evidence/scope/stage/release refs, absent or stale evidence и release-to-runtime/deployment binding.
- Определить условия `FAIL` для executable capability из сохраненного `allowed`, unsafe conflict replay и caller-controlled authority без protective binding.
- Добавить docs-contract или fixture-style tests, которые защищают новые semantics и failure verdicts.
- Регенерировать compiler-owned output и обновить docs navigation.

Не входит в scope:

- Application-specific implementation advice для одного исходного проекта.
- Deployed-path или general merge-risk review, которым владеет `code-reviewer`.
- Spec traceability, которым владеет `spec-conformance-reviewer`.
- Framework-specific transaction, queue, storage или runtime design details, которыми владеют domain skills.
- Превращение policy-governance admission в широкий policy architecture review.
- Добавление shipped CLI commands или runtime behavior.

## Предлагаемые изменения

- Обновить `references/policy-governance-admission.md`:
  - добавить раздел `Admission replay semantics`, который определяет historical/audit replay, current invocable/executable capability и conflict replay;
  - зафиксировать, что replay предыдущей записи `allowed` должен возвращать только historical status, если fresh invocation не доказан безопасным текущей policy, текущим evidence и bound identity;
  - требовать fail-closed для conflict replay с тем же idempotency key, но другим actor, operation, target, scope, stage, policy, evidence, release/runtime artifact или deployment identity;
  - добавить проверки `Authority binding` для freshness timestamp authority, evidence identity authority, caller-selected scope/stage/evidence/release refs, absent or stale evidence, release-to-runtime artifact binding и deployment identity binding;
  - добавить явные `FAIL` gates для stored `allowed`, который выдает executable capability, conflict replay, который не fails closed, и caller-controlled authority без protective binding;
  - сохранить examples generic для payment approvals, deployment approvals, model invocation admission, protected-resource access и publish/rollback authorization.
- Обновить `fragments/overview.md` и `skill.yaml`:
  - сузить policy-governance admission workflow bullet так, чтобы root guidance указывал на replay semantics и authority binding без копирования полного checklist;
  - при необходимости уточнить active reference trigger, чтобы он упоминал approval/admission gates, которые могут производить executable capability;
  - повысить `skill.source-version`, потому что меняется instruction surface.
- Обновить `references/methodology.md`:
  - расширить wording surface discovery и audit order, чтобы при наличии trigger он включал historical replay versus executable capability, conflict replay и canonical authority binding.
- Обновить `references/api-auth-input.md`:
  - сохранить route-specific boundary и добавить только короткий cross-reference, что non-route executable-capability replay относится к `references/policy-governance-admission.md`.
- Обновить `references/domain-handoffs.md`:
  - уточнить, что domain skills могут подтверждать runtime facts вроде transaction isolation, queue ordering, artifact identity или deployment identity, а `security-reviewer` владеет финальным reportability decision для admission-gate authority binding.
- Обновить `references/github-actions.md` только если при реализации станет ясно, что release/deployment binding требует короткий cross-reference из release automation review; не дублировать там полный admission checklist.
- Обновить `test/docs-contract.test.mjs`:
  - проверить, что root workflow открывает replay semantics и authority binding через policy-governance trigger;
  - проверить, что active reference различает historical/audit replay и current executable capability;
  - проверить, что conflict replay fails closed;
  - проверить, что idempotency scope включает security-relevant identity dimensions;
  - проверить наличие authority questions для freshness timestamp, evidence identity, release/runtime artifact и deployment identity;
  - проверить наличие `FAIL` verdicts для stored `allowed`, который выдает executable capability, и caller-controlled freshness/evidence без binding.
- Добавить компактные fixture-style examples внутри active reference или как copied test fixtures:
  - allowed replay returns executable capability и получает `FAIL`;
  - caller-controlled freshness/evidence reference не имеет canonical binding и получает `FAIL`.
- Регенерировать compiler-owned outputs:
  - `SKILL.md`;
  - `docs/compile-report.md`.
- Обновить supporting docs во время реализации:
  - добавить или уточнить entries в `docs/README.md`;
  - создать `docs/logs/implementation-log-20260428-1.md` и связать его из `docs/README.md`.

## Шаги реализации

1. Сначала отредактировать `references/policy-governance-admission.md`, потому что это canonical active reference для non-route admission-gate review.
2. Добавить краткие root-surface hooks в `fragments/overview.md` и, при необходимости, в `skill.yaml`, чтобы агенты понимали, когда загружать расширенный reference.
3. Обновить methodology, route-boundary и domain-handoff references только там, где им нужен cross-reference или audit-order alignment.
4. Решить, где будут жить fixture examples: внутри `references/policy-governance-admission.md` или под `test/fixtures/`; если добавляется fixture file, зарегистрировать его в `skill.yaml` `copies`, чтобы packaged skill оставался portable.
5. Расширить docs-contract tests для новых replay, authority binding и `FAIL` verdict contracts.
6. Повысить `skill.source-version`; не менять `package.json` version, если не меняется test/runtime package surface.
7. Выполнить in-place regeneration для `skills/security-reviewer`.
8. Проверить regenerated `SKILL.md` и `docs/compile-report.md` на active-reference reachability, отсутствие duplication и generated-output parity.
9. Обновить `docs/README.md` и создать implementation log после начала реализации.
10. Запустить verification и проверить финальный diff на unrelated churn.

## План проверки

- `pnpm --filter @kostysh/security-reviewer test`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/security-reviewer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/security-reviewer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/security-reviewer`
- `rg -n "(/home/|/code/|C:\\\\|[A-Za-z]:\\\\)" skills/security-reviewer`
- Ручная проверка generated surface:
  - `SKILL.md` ссылается на расширенный policy-governance admission reference;
  - root workflow в `SKILL.md` упоминает replay semantics и authority binding только на уровне trigger;
  - `docs/compile-report.md` перечисляет измененный active reference и не содержит неожиданных warnings.
- Ручной instruction quality audit по workflow stage `Audit instruction quality` из `skill-source-compiler`:
  - outcome и success criteria explicit;
  - нет unresolved contradiction с route auth-admission или webhook replay guidance;
  - reference triggers concrete и поддерживают progressive disclosure;
  - `FAIL` gates и fallback `needs verification` explicit.
- Fixture или example review:
  - stored `allowed` replay, который выдает fresh executable capability, получает `FAIL`;
  - тот же idempotency key с другими security-relevant inputs fails closed;
  - caller-controlled freshness timestamp или evidence ref без canonical binding получает `FAIL`;
  - absent/stale evidence behavior explicit;
  - release, runtime artifact и deployment identity binding проверяются, когда релевантны.
- Documentation parity check:
  - `fragments/overview.md`, `skill.yaml`, `SKILL.md`, `references/policy-governance-admission.md`, `references/methodology.md`, `references/api-auth-input.md`, `references/domain-handoffs.md` и tests описывают один trigger boundary;
  - route auth-admission остается route-specific;
  - workflow stage не представлен как runnable CLI command;
  - supporting `docs/*` остаются non-normative, если явно не promoted.

## Риски и побочные эффекты

- Риск: расширенный checklist продублирует existing webhook replay или route auth-admission guidance.
  - Митигация: держать canonical wording в `references/policy-governance-admission.md`, а в остальных местах использовать только короткие cross-references.
- Риск: строгие `FAIL` gates приведут к over-reporting неоднозначного product behavior.
  - Митигация: сохранить HIGH-confidence reporting requirements и использовать `needs verification`, когда runtime authority, transaction, queue или deployment facts не видны.
- Риск: authority binding wording станет project-specific.
  - Митигация: использовать generic nouns: actor, operation, target/resource, scope, stage, policy, evidence, release, runtime artifact и deployment identity.
- Риск: examples создадут впечатление зависимости навыка от терминологии payments, deployments или model invocation.
  - Митигация: оформить examples как variants of pattern и сохранить checklist понятным без файлов исходного проекта.
- Риск: docs-contract tests станут brittle, если будут проверять длинные точные prose-фрагменты.
  - Митигация: проверять stable contract terms и failure semantics, а не целые paragraphs.
- Риск: fixture files без регистрации в `skill.yaml` снизят portable test coverage в compiled copies.
  - Митигация: либо встроить fixture examples в existing test file/reference, либо добавить fixture files в `copies`.
- Разрушительные побочные эффекты не ожидаются; планируемые изменения ограничены documentation, docs-contract или fixture tests и generated-output updates внутри той же папки навыка.

## План отката

Откатить файлы, измененные для этой issue: source-bundle prose, любые fixture files, docs-contract tests, `skill.yaml`, regenerated `SKILL.md`, `docs/compile-report.md`, docs navigation и implementation log. Затем повторно выполнить `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/security-reviewer` и `pnpm --filter @kostysh/security-reviewer test`, чтобы подтвердить, что skill вернулся в consistent generated и tested state.

## Независимый аудит

Статус аудита: `PASS`

Аудитор: spawned agent `Einstein`

Критерии аудита:
- Соответствие связанной issue.
- Покрытие всех source artifacts, описывающих проблему.
- Достаточность и безопасность proposed implementation.

Заметки аудита:

- План соответствует требованию языка оператора.
- План покрывает replay semantics, stored `allowed` versus executable capability, conflict replay, caller-controlled freshness/evidence refs, canonical authority binding, release/runtime/deployment identity.
- Generated-skill maintenance учтен: source bundle first, `skill.source-version`, regeneration `SKILL.md`/`docs/compile-report.md`, docs-contract tests, parity checks, instruction quality audit и portability.
- Route auth-admission boundary сохранен отдельно от non-route policy-governance admission.

Требуемые исправления:

- Нет после PASS-аудита.

Остаточные риски:

- Итоговая реализация должна не размыть `FAIL` gates через слишком мягкое wording.
- Если будут добавлены fixture files, их нужно зарегистрировать в `skill.yaml` `copies`.

Финальный статус: `PASS`
