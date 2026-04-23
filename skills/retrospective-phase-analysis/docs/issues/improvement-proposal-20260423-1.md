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

## План имплементации

Status: draft

Source row: `ISS-04` / `RPA-01`, `RPA-02`, `RPA-03`, `RPA-04`

### Рабочие допущения

- Агент по-прежнему resolve-ит `session_id` и передает canonical trace path через `--session`.
- Retrospective CLI может читать только artifacts, найденные из trace, explicit operator inputs или strong artifact links.
- Stage artifact schema из `unified-dossier-engineer` может быть не полностью развернута, поэтому implementation должен поддержать structured-first behavior с legacy fallback.

### Шаги

1. Ввести artifact metadata reader:
   - читать stage log frontmatter и, когда path доступен через trace, explicit operator input или strong artifact link, helper-managed `.dossier/stages/*`;
   - распознавать explicit fields: `review_artifacts`, `verification_artifacts`, `step_artifact`, `primary_feature_id`, `primary_backlog_item_key`, `phase_scope`, `process_misses`, `skills_used`;
   - считать эти fields strong evidence только когда path существует и metadata scope совпадает.
   - не добавлять broad directory scan новых evidence roots вроде `.dossier/stages/*`; helper/stage artifacts можно читать только по bounded paths, полученным из trace, explicit input или strong artifact linkage.
2. Перестроить discovery flow в `buildScanSummary`:
   - сначала сделать trace pre-scan для project root и high-confidence stage-log candidates;
   - затем enrich scope через explicit artifact links из stage artifacts;
   - review/verification/step artifacts без explicit linkage оставлять candidates, а не auto-include по одному feature-id matching;
   - manual overrides оставить controlled exception с `--artifact-evidence`.
3. Ужесточить phase boundary handling:
   - если full trace already unambiguous, сохранить `full_trace`;
   - если analyzed phase является prefix и оператор дал `--until-line` или `--until-ts`, сохранить текущее поведение;
   - если same-session scope можно вывести из strong stage artifact timestamps / close-out evidence, добавить artifact-derived boundary mode и применить его before final scope/metrics extraction;
   - если same-session boundary остается ambiguous, fail-closed: вернуть usage/error с требованием explicit operator boundary (`--until-line`, `--until-ts` или будущий явно boundary-specific input), вместо heuristic widening;
   - manual artifact override может включить evidence artifact, но не является заменой boundary resolution.
4. Сделать scope narrowing conservative:
   - explicit artifact identity (`primary_feature_id`, `primary_backlog_item_key`, `phase_scope`) имеет приоритет над broad trace mentions;
   - multiple feature/backlog mentions без strong artifact identity сохраняются ambiguity и не расширяют included artifacts;
   - reportStatus должен явно объяснять unresolved ambiguity.
5. Перевести metrics на structured-first:
   - `summarizeLogs` считает `processMissesTotal` из structured `process_misses` when present;
   - prose `Process misses` используется только если structured field отсутствует;
   - `skillsReferenced` использует structured `skills_used` when present, иначе legacy skill field/trace summary;
   - `inferCandidateIncidents` не double-count structured и prose evidence.
   - `scan-summary` должен различать metrics source/quality: structured, validated fallback и unresolved/unvalidated fallback;
   - unvalidated fallback-derived metrics не должны делать reportStatus misleading `ready_for_agent_finalization`; они должны добавлять reason для agent validation.
6. Обновить rendering ровно в нужных местах:
   - в `report-markdown` и `logging-review-markdown` показывать source/quality для structured vs fallback metrics;
   - не менять общий narrative template вне ambiguity/metrics explanation.
7. Защитить docs/tests:
   - обновить `references/CLI.md`, `REFERENCE.md`, `PROJECT-ADAPTATION.md` и `SKILL.md` с conservative artifact-gating rules;
   - добавить/обновить fixtures для artifact-linked discovery, weak candidate gating, ambiguous same-session fail-closed, structured-over-prose metrics precedence;
   - добавить fixtures/assertions, что manual artifact override не разрешает ambiguous phase boundary и что unvalidated fallback metrics держат отчет в validation-required состоянии;
   - обновить CLI/help snapshots только при изменении public help.

### Проверки

- `pnpm --filter @kostysh/retrospective-phase-analysis-cli test`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli typecheck`
- Targeted fixtures: one routine artifact-linked scan without manual overrides, one ambiguous same-session scan that fails closed.

### Scope guards

- Не переносить session lookup внутрь CLI.
- Не добавлять Codex-specific session-store scraping.
- Не расширять UDE stage schema в этом skill; missing upstream fields фиксировать как dependency/follow-up.
- Не redesign-ить full report style.

## Внешний Spec-Conformance Review плана

Status: reviewed

Reviewer: `spec-conformance-reviewer`

Model: top-tier, reasoning `high`, non-forked external review

Verdict: `PASS`

Ключевой результат review:

- initial review нашел три обязательных пропуска: manual artifact override не должен заменять boundary resolution, `.dossier/stages/*` нельзя читать broad scan-ом, fallback-derived metrics нельзя публиковать как reliable без validation;
- план доработан: boundary ambiguity теперь требует explicit operator boundary или fail-closed, helper/stage artifacts читаются только по bounded paths, fallback metrics получают source/quality и validation-required status;
- повторный review подтвердил достаточность покрытия `RPA-01`, `RPA-02`, `RPA-03`, `RPA-04`.
