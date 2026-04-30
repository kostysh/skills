# Workflow protocol

Документ описывает активную методику работы агента с досье. Все structured artifacts создаются и изменяются runtime-командами `dossier-engineer`. Агент редактирует только body sections, созданные runtime scaffold.

## 1. Основной принцип

Работа считается полезной только тогда, когда она сохраняет связь:

```text
source -> capability -> work item -> demonstration -> review -> closure
```

Если work item не может быть связан с capability, guardrail или существующим поведением, его нельзя начинать как delivery work.

## 2. Старт нового проекта

Последовательность:

```bash
dossier-engineer init --root . --project-name "<project>"
dossier-engineer source add --path <concept-path> --kind concept --authority canonical --title "<product concept>"
dossier-engineer capability create --title "<capability>" --status intended --source <concept-source-id>
dossier-engineer capability claim set --capability <capability-id> --actor "<actor>" --trigger "<trigger>" --behavior "<observable behavior>" --response "<system response>" --state-change "<state/effect>" --continuity "<later/restarted behavior>"
dossier-engineer capability check --root .
```

Правила:

- сначала создать или зарегистрировать concept source;
- затем создать capability map;
- затем создавать work items;
- support work создавать только при наличии capability или guardrail, который объясняет необходимость support slice.

## 3. Старт существующего рабочего проекта

Цель onboarding существующего проекта — зафиксировать уже реализованные способности без создания искусственных закрытых work items.

Последовательность:

```bash
dossier-engineer init --root . --project-name "<project>"
dossier-engineer source add --path <concept-or-readme-path> --kind concept --authority canonical --title "<current product concept>"
dossier-engineer baseline create --title "Existing product baseline" --mode existing-project --source <concept-source-id>
```

Для каждой уже работающей способности:

```bash
dossier-engineer capability create --title "<existing capability>" --status existing --source <concept-source-id>
dossier-engineer capability claim set --capability <capability-id> --actor "<actor>" --trigger "<trigger>" --behavior "<current observable behavior>" --response "<system response>" --state-change "<state/effect>" --continuity "<continuity>"
dossier-engineer capability demo record --capability <capability-id> --verdict pass --summary "<observed current behavior>" --evidence <path>
dossier-engineer baseline capability add --baseline <baseline-id> --capability <capability-id> --evidence <path> --status observed
```

Если способность предполагается, но не доказана:

```bash
dossier-engineer capability create --title "<uncertain capability>" --status unverified --source <concept-source-id>
dossier-engineer baseline capability add --baseline <baseline-id> --capability <capability-id> --status unverified --evidence <path>
```

Правила:

1. Уже реализованная работа не превращается в closed work items.
2. Доказанное существующее поведение фиксируется как `capability.status = existing` plus baseline evidence.
3. Недоказанное поведение фиксируется как `unverified` или `partial`.
4. Новые work items должны ссылаться на capability relation: `introduces`, `extends`, `supports`, `maintains`, `verifies`, or `retires`.
5. Maintenance work обязано ссылаться на existing capability.
6. Refactoring/support work обязано объяснять, какую capability оно сохраняет, разблокирует или улучшает.

## 4. Source registration and refresh

Register durable sources before deriving capabilities or work:

```bash
dossier-engineer source add --path <path> --kind concept --authority canonical --title "<title>"
dossier-engineer source add --path <path> --kind architecture --authority canonical --title "<title>"
dossier-engineer source add --path <path> --kind specification --authority supporting --title "<title>"
```

Refresh registered sources when sources may have changed:

```bash
dossier-engineer source refresh --root .
dossier-engineer source impact --source <source-id>
```

If a source-review is opened:

```bash
dossier-engineer source review resolve --review <source-review-id> --verdict <verdict> --summary "<summary>"
```

Open source-review blocks readiness for affected capabilities and work items.

## 5. Capability mapping

Capability is an observable system ability.

Required capability claim:

```text
actor performs trigger X -> system responds Y -> state/effect Z is produced -> later/restarted system preserves or uses W
```

Create and complete a capability:

```bash
dossier-engineer capability create --title "<capability>" --status intended --source <source-id>
dossier-engineer capability claim set --capability <capability-id> --actor "<actor>" --trigger "<trigger>" --behavior "<observable behavior>" --response "<system response>" --state-change "<state/effect>" --continuity "<continuity>"
dossier-engineer capability anti-claim add --capability <capability-id> --text "<explicit non-goal>"
```

Use capability status accurately:

- `intended` — planned but not implemented;
- `existing` — currently working and demonstrated;
- `partial` — partially working or only some scenarios are proven;
- `unverified` — claimed or implied but not demonstrated;
- `retired` — intentionally no longer supported.

## 6. Work item creation

### Capability work

```bash
dossier-engineer work create --title "<title>" --type feature --delivery capability --capability <capability-id> --relation introduces --source <source-id> --area <area> --owner <owner>
dossier-engineer work acceptance add --work <work-id> --kind behavior --text "<behavioral criterion>" --source <source-id>#<anchor>
dossier-engineer work demo set --work <work-id> --name "<demo name>" --scenario "<actor does X; system returns Y; state Z persists; later W holds>"
dossier-engineer work anti-claim add --work <work-id> --text "<this item does not implement ...>"
```

Capability work cannot close unless it proves observable behavior.

### Support work

```bash
dossier-engineer work create --title "<title>" --type refactor --delivery support --capability <capability-id> --relation supports --source <source-id> --area <area> --owner <owner>
dossier-engineer work support explain --work <work-id> --reason "<why this support is necessary now>"
```

Support work cannot claim functional product progress by itself.

### Maintenance work

```bash
dossier-engineer work create --title "<title>" --type fix --delivery maintenance --capability <existing-capability-id> --relation maintains --source <source-id> --area <area> --owner <owner>
dossier-engineer work demo set --work <work-id> --name "<regression demo>" --scenario "<existing behavior remains/restores>"
```

Maintenance closure proves preservation or restoration of existing behavior.

### Exploration work

```bash
dossier-engineer work create --title "<title>" --type research --delivery exploration --source <source-id> --area <area> --owner <owner>
```

Exploration closure records the answer and creates follow-up work or explicitly declines follow-up.

## 7. Stage protocol

Required stage order:

```text
feature-intake -> spec-compact -> plan-slice -> implementation
```

Use the same stage controller for all delivery kinds:

```bash
dossier-engineer stage start --work <work-id> --stage <stage> --session <session-id>
dossier-engineer stage ready --work <work-id> --stage <stage> --summary "<summary>"
dossier-engineer stage close --work <work-id> --stage <stage>
```

### 7.1 feature-intake

Purpose:

- confirm source refs;
- confirm capability relation;
- reject infrastructure disguised as capability;
- identify missing concept or requirement anchors;
- create blockers for unresolved product questions.

Closure gates:

- valid source refs;
- valid capability ref for `capability`, `support`, and `maintenance` work;
- delivery kind selected;
- no unresolved intake blockers.

### 7.2 spec-compact

Purpose:

- express the work as a compact, testable slice;
- define behavioral acceptance criteria;
- define anti-claims;
- define demo scenario;
- separate support facts from capability evidence.

Closure gates for capability work:

- behavior acceptance criterion exists;
- demo scenario exists;
- anti-claim exists;
- capability claim is complete or inherited from referenced capability;
- no open source-review affects the capability.

Closure gates for support work:

- support reason exists;
- linked capability or guardrail exists;
- no claim that support work itself delivers user-facing behavior.

### 7.3 plan-slice

Purpose:

- choose the smallest reliable implementation slice;
- identify risks and review classes;
- record why the plan may be wrong;
- define verification profile.

Required command:

```bash
dossier-engineer work challenge record --work <work-id> --summary "<how this plan can fail, become a stub, or hide missing behavior>"
```

Closure gates:

- challenge recorded;
- implementation risks set;
- verification plan exists;
- required review classes known;
- support chain does not violate guardrails.

### 7.4 implementation

Purpose:

- implement the planned slice;
- verify behavior or support correctness;
- record review evidence;
- avoid scope drift.

Implementation can continue only while the plan still matches concept, capability claim, anti-claims, and demo scenario.

If the implementation finds material drift, open change-proposal.

## 8. Change-proposal

Open change-proposal when any material fact changes:

- concept interpretation;
- capability claim;
- capability relation;
- demo scenario;
- anti-claim;
- acceptance criterion;
- dependency;
- risk class;
- source interpretation;
- implementation approach that turns capability work into support-only work.

Commands:

```bash
dossier-engineer stage start --work <work-id> --stage change-proposal --session <session-id>
dossier-engineer work amend --work <work-id> --from-change-proposal --summary "<accepted change>"
dossier-engineer stage ready --work <work-id> --stage change-proposal --summary "<verdict>"
dossier-engineer stage close --work <work-id> --stage change-proposal
```

After accepted material change, return to the earliest affected stage.

## 9. Verification and review

Ask required evidence before attempting closure:

```bash
dossier-engineer verify required --work <work-id> --stage implementation
dossier-engineer review required --work <work-id> --stage implementation
```

For capability work:

```bash
dossier-engineer verify run --work <work-id> --stage implementation --profile behavioral-demo
dossier-engineer review record --work <work-id> --stage implementation --class concept-conformance-reviewer --verdict pass --reviewer <reviewer-id>
dossier-engineer review record --work <work-id> --stage implementation --class spec-conformance-reviewer --verdict pass --reviewer <reviewer-id>
```

For support work:

```bash
dossier-engineer verify run --work <work-id> --stage implementation --profile default
```

Support work requires concept-conformance review when it is foundational, unblocks many items, consumes guardrail budget, or risks being mistaken for capability.

## 10. Closure

Implementation close:

```bash
dossier-engineer stage ready --work <work-id> --stage implementation --summary "<implemented result>"
dossier-engineer stage close --work <work-id> --stage implementation
dossier-engineer hygiene run --work <work-id> --stage implementation
```

Closure must fail closed if:

- behavioral demo is missing for capability work;
- concept-conformance review is missing or stale;
- support work has no support explanation;
- guardrail is triggered;
- source-review is open;
- material scope changed after review;
- coverage gate is not green or not applicable;
- blockers remain open.

## 11. Guardrails and kill criteria

Add guardrails when a project can accumulate infrastructure without product behavior:

```bash
dossier-engineer guardrail add --title "<criterion>" --condition "<trigger condition>" --action "<required action>"
dossier-engineer guardrail check --root .
```

Examples:

- if five closed support items have no recent behavioral demo, stop new support work;
- if no end-to-end scenario exists by milestone, stop adding infrastructure and revisit decomposition;
- if a capability remains `unverified` after dependent support work is closed, open change-proposal.

Resolve only with evidence or explicit project decision:

```bash
dossier-engineer guardrail resolve --guardrail <guardrail-id> --summary "<resolution>"
```

## 12. Handoff and branch summary

Before PR or handoff:

```bash
dossier-engineer status --root .
dossier-engineer attention --root .
dossier-engineer queue --root .
dossier-engineer capability check --root .
dossier-engineer guardrail check --root .
dossier-engineer changeset create --scope current-branch --summary "<branch summary>"
dossier-engineer lint --root .
```

Do not commit generated status, queue, or attention reports unless explicitly requested.
