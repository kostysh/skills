# Предложение по улучшению 20260420-1: dossier-side backlog actualization без процедурной хрупкости

## Контекст

Связанный план: [../refactoring-plan-9.ru.md](../refactoring-plan-9.ru.md)

Поводом стали несколько ретро-анализов downstream dossier workflow, где backlog actualization на closure регулярно оказывалась самой хрупкой частью уже почти завершённой фазы.

Повторяющийся паттерн:

- реализация или planning уже по сути готовы;
- backlog truth нужно честно actualize-ить через `backlog-engineer`;
- именно на этом шаге появляются procedural rerounds:
  - неверный `metadata.sequence`;
  - неочевидный patch shape;
  - смешение `patch-item` и `refresh`;
  - попытка закрыть `refresh`-managed review todo через patch semantics;
  - плохая операторская читаемость финального actualization recipe.

В результате проблема не в том, что backlog model неверна. Проблема в том, что dossier-side closeout слишком легко срывается на авторинге и choreography actualization.

Затронутые поверхности:

- `SKILL.md`
- `references/operator-workflows.md`
- `references/packet-and-patch.md`
- `references/data-model.md`
- `references/command-reference.md`
- cross-skill handoff с `dossier-engineer`

Связанные предложения:

- `dossier-engineer`: [improvement-proposal-20260420-2.md](../../../dossier-engineer/docs/issues/improvement-proposal-20260420-2.md) — pre-close / DoD readiness gate должен опираться на ясный backlog actualization path.
- `dossier-engineer`: [improvement-proposal-20260420-1.md](../../../dossier-engineer/docs/issues/improvement-proposal-20260420-1.md) — logging redesign и lifecycle metrics должны видеть backlog actualization как отдельный closure signal.

## Наблюдаемая проблема

У `backlog-engineer` уже есть правильные базовые инварианты:

- existing tasks меняются только через patch workflows;
- `refresh` не заменяет explicit patch для `delivery_state` и dossier-discovered truth;
- canonical patch artifacts удерживаются как replay evidence;
- closure после dossier work должна подтверждать backlog state и artifact integrity.

Но этого недостаточно на operator/agent workflow уровне.

Сейчас dossier-side actualization всё ещё требует от агента слишком много procedural assembly:

1. выбрать между `patch-item` и `refresh`;
2. не перепутать source-derived state и dossier-discovered truth;
3. корректно заполнить patch metadata;
4. не сломать monotonic `sequence`;
5. не попытаться закрыть не тот класс `todo`;
6. подтвердить clean final state.

Даже когда все отдельные правила есть в skill, суммарный actualization path остаётся cognitively expensive.

## Почему это проблема

Это не cosmetic UX issue.

Backlog actualization находится на границе truthful closure:

- dossier stage не должен считаться cleanly complete без actualized backlog truth;
- следовательно, любая процедурная хрупкость на этом шаге превращается в closeout instability;
- оператор видит “фаза почти закрыта, но опять procedural reround”, хотя сама feature уже по сути реализована.

Если этот path не упростить, он будет и дальше создавать ложное впечатление, что backlog actualization — это fragile cleanup, а не нормальная часть closure contract.

## Предлагаемое изменение

## P1. Зафиксировать один canonical dossier-side actualization recipe

В skill должен появиться один буквальный recipe для truth-changing dossier closure.

Нужный target workflow:

1. определить, требуется ли actualization patch, source refresh, или оба шага;
2. если меняется explicit backlog truth на уже известных items, начать с patch path;
3. если changed registered source может повлиять на source-derived state, сначала сделать scoped `refresh`;
4. после refresh выполнить explicit patch только там, где всё ещё меняется `delivery_state`, blockers, dependencies или context facts;
5. подтвердить clean state через scoped confirmation;
6. только после этого считать dossier-side closure чистой.

Важно:

- recipe должен быть коротким и буквальным;
- он должен жить не только как разрозненные правила в reference docs, а как operator-facing canonical path.

## P2. Добавить actualization preflight вместо semi-manual patch authoring

Основной источник трения — patch metadata и shape.

Нужен deterministic preflight для dossier-side actualization, который проверяет как минимум:

- что target item keys уже известны;
- что выбран правильный mutation path: `patch-item` vs `refresh` vs `refresh + patch`;
- что `metadata.sequence` валиден и monotonic;
- что patch не пытается закрыть `refresh`-managed review todo;
- что patch не используется для authoring brand-new work;
- что closure path не оставляет known impacted items в partial state.

Идеальный target state:

- агент не собирает эти проверки вручную по памяти;
- utility / command support помогает пройти preflight до real apply.

Это не требует NLP. Это чистая deterministic validation поверх уже структурированных inputs.

## P3. Развести mutation-managed и refresh-managed closure semantics ещё жёстче

Одна из самых дорогих когнитивных ловушек — неочевидность, что именно должен очистить `refresh`, а что должен менять explicit patch.

Нужное усиление:

- `mutation-managed` truth изменяется только patch/remove workflows;
- `refresh-managed` review/todo signals снимаются только соответствующим refresh path, когда observed cause исчез;
- documentation должна буквальным образом показывать, что попытка закрыть `refresh`-managed signal через patch — это workflow misuse, а не “ещё один допустимый вариант”.

Нужно, чтобы этот negative rule был виден в:

- command reference;
- packet/patch authoring reference;
- dossier-side operator workflow.

## P4. Добавить explicit “clean actualization confirmation” как обязательный финал

Сейчас agent после successful mutation всё ещё должен помнить, чем подтвердить clean state.

Нужно зафиксировать канонический финальный шаг actualization:

- `items` или scoped `status/refresh` подтверждают updated truth;
- artifact integrity чистая;
- нет dangling expected follow-up внутри actualization path.

То есть closure recipe должен заканчиваться не “patch applied”, а “actualized and confirmed clean”.

## P5. Сделать command support более операторо-понятным

Даже если текущая command surface уже достаточна функционально, skill should optimize for operator-facing clarity.

Нужны как минимум:

- единый reference block `dossier-side actualization`;
- явное сопоставление типовых кейсов:
  - `implemented` after implementation;
  - new blocker discovered in dossier work;
  - dependency clarified during planning;
  - source changed and derived truth must be refreshed;
  - stale refresh-managed review todo after evidence changed.

Если current CLI surface остаётся прежней, docs всё равно должны делать этот path почти безошибочным.

Если current CLI surface окажется слишком низкоуровневой даже после docs hardening, допустимо отдельно рассмотреть utility-level helper command или wrapper для dossier-side actualization. Но он должен работать только на structured inputs и не должен “понимать” prose dossier content.

## Что не должно меняться

- Не превращать `refresh` в неявную замену patch workflows.
- Не позволять patch workflows авторить brand-new backlog work вместо packet path.
- Не разрешать partial sync как допустимый clean closure outcome для shared-source / multi-item impact.
- Не размывать retention contract canonical patch artifacts.
- Не переносить dossier-local closure ownership в `backlog-engineer`; речь только о hardening backlog-side actualization path.

## Acceptance criteria

- В `backlog-engineer` есть один explicit canonical recipe для dossier-side actualization.
- Guidance ясно разводит `patch`, `refresh` и `refresh + patch`.
- Patch preflight явно проверяет sequence correctness, target scope, todo-management class и partial-sync misuse.
- Documentation явно запрещает закрывать `refresh`-managed review todo через patch semantics.
- Actualization recipe заканчивается explicit clean confirmation, а не только successful mutation output.
- Operator workflows содержат буквальные closure examples для dossier-side actualization after `spec-compact`, `plan-slice`, `implementation`.
- Если current CLI surface остаётся прежней, docs делают этот path deterministically reproducible.

## Preferred implementation order

1. Уточнить `operator-workflows.md` как canonical dossier-side actualization path.
2. Усилить `command-reference.md` по `patch-item`, `refresh` и final confirmation semantics.
3. Уточнить `packet-and-patch.md` и `data-model.md` по preflight expectations и todo-management boundaries.
4. При необходимости спроектировать utility-side preflight/helper support без prose analysis.
