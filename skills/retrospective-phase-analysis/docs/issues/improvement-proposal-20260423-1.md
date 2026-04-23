# Improvement Proposal: усилить retrospective automation вокруг artifact-driven evidence

Issue ID: `ISS-04`

Primary owner skill: `retrospective-phase-analysis`

## Проблема

Текущее retrospective tooling дает полезный human analysis, но все еще слишком сильно зависит от manual overrides и слабых fallback-механизмов, когда evidence linkage неполный.

Сгруппированные проблемы образуют один automation-hardening issue:

- artifact discovery все еще требует ручных `--stage-log`, `--review-artifact` и `--verification-artifact` overrides в кейсах, которые должны быть рутинными;
- phase boundaries в рамках той же session могут требовать ручных line cutoffs;
- scope narrowing слишком шумный и может подтягивать unrelated features или backlog items;
- parser metrics все еще откатываются к brittle prose heuristics и могут завышать или неверно классифицировать инциденты.

## Почему это важно

Skill уже фиксирует, что агент сам resolve-ит `session_id` и canonical trace lookup перед вызовом CLI. Эта граница хорошая и должна сохраниться.

Оставшаяся проблема находится внутри retrospective automation:

- даже при правильном trace scan path недостаточно low-friction;
- качество output все еще зависит от ручной чистки оператором;
- generated drafts могут содержать шумный scope или misleading metrics;
- tool еще не умеет опираться на declared artifact state настолько сильно, насколько должен.

## Текущая активная поверхность

Релевантные active references:

- [CLI](../../references/CLI.md)
- [PROJECT-ADAPTATION](../../references/PROJECT-ADAPTATION.md)
- [REFERENCE](../../references/REFERENCE.md)
- [SKILL-AUDIT-TEMPLATE](../../references/SKILL-AUDIT-TEMPLATE.md)

## Требуемое исправление

Улучшить retrospective automation так, чтобы она предпочитала artifact-linked evidence, сужала scope консервативно и использовала legacy prose parsing только как fallback, а не как primary signal.

Этот issue должен стать retrospective-side counterpart к более сильным contracts stage artifacts, не нарушая явную границу, что `session_id` разрешает агент, а не CLI.

## Что должно измениться

### 1. Artifact-driven discovery

Когда machine-complete stage artifacts доступны, retrospective workflow должен находить релевантный bundle stage/review/verification/close-out без routine manual overrides.

Discovery contract должен оставаться консервативным:

- слабо связанные artifacts остаются candidates, пока более сильное evidence или explicit operator input не разрешит неоднозначность;
- одного feature-id matching недостаточно, чтобы auto-include review или verification artifacts;
- manual overrides остаются evidence-justified exceptions, а не сигналом, что broad auto-inclusion допустим.

### 2. Более надежные phase boundaries

Retrospective внутри той же session должна перестать зависеть от произвольных ручных line cutoffs, когда доступно более сильное phase evidence.

Решение должно оставаться evidence-driven и bounded. Оно не должно зависеть от runtime-specific session-store discovery, которая принадлежит agent side.

Если boundaries внутри той же session остаются ambiguous после анализа доступного evidence, workflow должен fail-closed: требовать explicit operator boundary или завершаться с явной ambiguity note. Heuristic widening scope здесь недопустим.

### 3. Консервативное scope narrowing

Построение scope должно предпочитать explicit artifact-linked identity вместо broad trace mention extraction.

Если scope остается ambiguous, scan должен деградировать консервативно, а не расширяться на unrelated work.

### 4. Structured metrics first

Метрики и incident inference должны предпочитать structured fields из artifacts.

Legacy prose parsing может сохраниться как fallback compatibility, но structured values должны выигрывать при конфликте, а prose fallback не должен раздувать totals или дублировать incidents, когда structured evidence уже существует.

## Внешний Spec-Conformance Review

Status: reviewed

Verdict on initial draft: `mixed`

Ключевой результат review:

- общее направление принято;
- draft требовал явного conservative fallback для unresolved phase ambiguity;
- раздел discovery требовал более жестких artifact-gating rules, чтобы manual overrides уменьшались за счет лучшего linkage, а не за счет widening;
- structured metrics требовали явного precedence над prose, когда доступны оба источника.

## Acceptance Criteria

Issue считается исправленным только когда:

- retrospective scan использует artifact-linked discovery для рутинного случая без обязательных manual artifact overrides;
- слабо связанные artifacts остаются только candidates до тех пор, пока более сильное evidence или explicit operator input не разрешит их;
- same-session boundaries больше не зависят от произвольных line cutoffs, когда доступно более сильное evidence;
- если evidence для same-session boundary остается ambiguous, workflow требует explicit operator boundary или останавливается с явным ambiguity result вместо heuristic widening;
- scope narrowing предпочитает explicit artifact identity и деградирует консервативно, если ambiguity сохраняется;
- metrics и candidate incidents предпочитают structured artifact fields вместо prose heuristics при наличии structured fields, причем structured values выигрывают при конфликте и не допускается prose-driven double counting;
- active docs и tests защищают artifact-link gating, conservative ambiguity handling, structured-over-prose precedence и явную границу, что session resolution остается agent-owned.

## Обязательное ограничение для последующего planning и implementation

Любой будущий planning или implementation по этому issue должен оставаться строго в границах качества retrospective automation для перечисленных выше проблем.

Обязательные границы:

- менять только discovery, boundary, scope, metrics, rendering и tests, которые нужны, чтобы решить эти слабости retrospective tooling;
- разрешать rendering changes только если они строго incidental к discovery, ambiguity handling или metrics correctness этого issue;
- сохранять explicit contract, что агент resolve-ит `session_id` до вызова CLI;
- не расширять этот issue до stage-controller schema work, которая принадлежит `unified-dossier-engineer`;
- если при решении issue обнаружится недостающее поле stage artifact, фиксировать это как отдельную dependency или follow-up, а не тихо расширять текущий issue.

## Non-Goals

- Не переносить `session_id` resolution внутрь CLI.
- Не добавлять Codex-specific session-store scraping в этот skill.
- Не redesign-ить full report style или narrative templates больше, чем это нужно для устранения перечисленных automation weaknesses.
