# Предложение по улучшению 20260420-3: heavy-runtime discipline — runtime envelope upfront и smoke только как final gate

Связанный план: [../refactoring-plan-14.ru.md](../refactoring-plan-14.ru.md)

## Контекст

Поводом стали retrospective findings по heavy-runtime features, где основная цена цикла возникала не из-за business logic, а из-за неправильной методики работы с тяжелым execution path.

Два связанных симптома:

1. heavy-runtime verification использовалась как рабочий debug loop вместо targeted probes и отдельного final smoke gate;
2. runtime/resource contract не был достаточно явно зафиксирован ещё на `spec-compact` / `plan-slice`, из-за чего implementation открывала системные риски уже по ходу отладки.

Эти симптомы стоит рассматривать вместе, а не отдельно:

- если upfront runtime envelope не задан, агент начинает исследовать его через дорогостоящие прогоны;
- если smoke не отделён от targeted probes, тяжёлый runtime path становится основным циклом разработки.

Затронутые поверхности:

- `SKILL.md`
- `references/workflow-stage-spec-compact.md`
- `references/workflow-stage-plan-slice.md`
- `references/workflow-stage-implementation.md`
- dossier template sections around verification / rollout / runtime assumptions

Связанные предложения:

- [improvement-proposal-20260420-2.md](improvement-proposal-20260420-2.md) — pre-close / DoD readiness gate должен использовать heavy-runtime verification ladder как часть closure discipline.
- [improvement-proposal-20260420-1.md](improvement-proposal-20260420-1.md) — logging redesign и metric contract должны уметь отделять targeted probes от final smoke gate и считать heavy-runtime friction без prose reconstruction.

## Наблюдаемая проблема

Сейчас методика уже упоминает:

- runtime/deployment surface;
- verification plan;
- smoke when relevant;
- approval path for shared runtime surfaces.

Но этого недостаточно.

В текущем виде skill ещё не заставляет явно оформить:

- сколько тяжёлых runtime instances допустимо;
- что считается warm/cold path;
- каков cache/download policy;
- какой retry/timeout/resource envelope допустим;
- какая verification ladder используется до финального smoke.

Из-за этого implementation легко скатывается в паттерн:

`непонятный runtime seam -> полный heavy smoke -> runtime pain -> новая гипотеза -> ещё один heavy smoke`

## Почему это проблема

Это дорого не только по времени.

Такой цикл создаёт:

- operator-facing friction;
- host/resource instability;
- смешение debugging и final validation;
- плохой signal-to-noise ratio в retrospective, потому что verification path сам начинает быть главной проблемой feature.

Методически это означает, что skill недостаточно хорошо задаёт discipline для heavy-runtime work.

## Предлагаемое изменение

## P1. Ввести обязательный `runtime envelope` уже на `spec-compact`

Для features, которые затрагивают тяжёлый runtime, containerized serving, expensive model/runtime startup, large caches/downloads или заметный resource pressure, `spec-compact` должен явно фиксировать:

- expected runtime instances;
- warm/cold assumptions;
- cache/download policy;
- timeout budget;
- retry budget;
- allowed resource envelope / pressure class;
- operator-visible constraints or risks.

Это не implementation detail ради detail.

Это часть engineering contract, без которого downstream implementation почти гарантированно начнёт уточнять систему через дорогие прогоны.

## P2. В `plan-slice` ввести обязательную verification ladder

План должен отличать:

- lightweight local checks;
- targeted runtime probes;
- integration checks;
- final smoke gate.

Нужное правило:

- если heavy-runtime path релевантен, план не может ограничиться broad label вроде `smoke` или `runtime test`;
- он должен явно показать, какие гипотезы проверяются лёгкими probes, а что оставляется на финальный smoke.

Это позволит retrospective позже видеть, что expensive verification была использована по назначению или не по назначению.

## P3. Запретить использовать heavy smoke как основной debug loop

В implementation guidance нужно закрепить буквальный negative rule:

- heavy smoke — это final gate или milestone confirmation;
- heavy smoke не должен быть default working loop при обычной отладке.

Прежде чем запускать дорогой smoke повторно, агент должен:

- локализовать гипотезу;
- выбрать targeted probe;
- пройти более дешёвую verification ступень.

Допустимые исключения:

- когда именно smoke-path и есть единственный наблюдаемый seam;
- когда repo overlay прямо требует smoke-first discipline;
- когда оператор явно выбирает дорогой rerun как осознанную ставку.

## P4. Добавить explicit `debug probes vs final smoke` language в dossier method

Это различие должно быть видно не только в implementation prose, но и в dossier surfaces:

- в verification plan;
- в rollout / runtime notes;
- в review expectations для heavy-runtime features.

Иначе agent снова будет интерпретировать “smoke when relevant” как допуск использовать его на любой debugging итерации.

## P5. Сделать expensive verification видимой как process signal

Даже без logging redesign здесь важно методически зафиксировать:

- repeated heavy smoke runs — это smell;
- repeated cold-start / repeated download / repeated multi-runtime startup — это smell;
- retrospective должна трактовать их как сигнал того, что spec/plan/runtime method была слабой, а не как нейтральный “обычный ход работы”.

Это нужно не для наказания агента, а чтобы operator мог видеть:

- проблема в конкретной feature;
- или проблема в самом skill contract для heavy-runtime work.

## Что не должно меняться

- Не запрещать heavy smoke вообще.
- Не подменять smoke targeted probes там, где нужен реальный end-to-end gate.
- Не превращать `spec-compact` в низкоуровневый ops runbook.
- Не требовать одинаковый runtime envelope для простых features без heavy-runtime path.

## Acceptance criteria

- `spec-compact` явно требует runtime envelope для heavy-runtime / expensive-runtime features.
- `plan-slice` явно требует verification ladder с разделением на targeted probes и final smoke gate.
- `implementation` содержит literal negative rule: heavy smoke не используется как default debug loop.
- Dossier method ясно различает `debug probes` и `final smoke`.
- Retrospective по heavy-runtime features после изменения может отличать method failure от нормального final verification cost.

## Preferred implementation order

1. Обновить `workflow-stage-spec-compact.md` runtime-envelope trigger и required fields.
2. Обновить `workflow-stage-plan-slice.md` verification ladder expectations.
3. Обновить `workflow-stage-implementation.md` negative rule и working-loop discipline.
4. При необходимости уточнить dossier template around verification / rollout / runtime assumptions.
