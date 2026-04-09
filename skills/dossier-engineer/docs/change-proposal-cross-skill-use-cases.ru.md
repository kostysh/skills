# Кросс-скилл юзкейсы для `change-proposal`

Этот документ фиксирует реальные operator-facing сценарии, в которых может потребоваться `Workflow stage: change-proposal`, и показывает, как такой сценарий сейчас проходит через `dossier-engineer` и `backlog-engineer`.

Цель:

- понять, что уже поддержано текущими skill-ами;
- увидеть серые зоны именно в cross-skill choreography;
- отделить dossier-local requirement editing от backlog-level truth actualization.

Легенда статуса поддержки:

- `Да` — сценарий явно и достаточно последовательно поддержан текущими skill-ами.
- `Частично` — сценарий можно провести через текущие общие правила, но нет достаточно жёсткого end-to-end change-proposal workflow.
- `Нет` — в текущих skill-ах отсутствует нормативный путь или ключевой переход.

Важная оговорка для чтения матрицы:

- backlog-side `ничего не делать` допустимо только после явного dossier-side `backlog impact verdict`, что `change-proposal` не изменила backlog truth;
- этот verdict может задаваться как stage-level rule и, когда в сценарии используется dossier CLI, должен по возможности поддерживаться tool output, а не только неявным рассуждением агента;
- пока такого classifier-а нет в достаточно жёсткой форме, даже простые no-op сценарии остаются покрыты лишь частично.

## Матрица юзкейсов

| Юзкейс оператора | Воркфлоу агента на стороне `dossier-engineer` | Воркфлоу агента на стороне `backlog-engineer` | Поддерживается ли сейчас | Что изменить в `dossier-engineer` для покрытия | Что изменить в `backlog-engineer` для покрытия |
| --- | --- | --- | --- | --- | --- |
| Оператор уточняет wording/AC до implementation, но не меняет executable truth | `change-proposal` -> обновить AC и затронутые dossier sections -> обновить `Change log` -> прогнать dossier-side checks -> явно сообщить, что executable follow-up не требуется | Ничего не делать только после явного dossier-side `backlog impact verdict`, что backlog truth не изменилась | `Частично` | Добавить в `change-proposal` явный classifier `backlog impact verdict`: `no-op` / `patch existing item` / `source update` / `new backlog item`; сделать `no-op` explicit outcome с буквальными критериями: нет новых blockers/dependencies, нет нового source, нет executable follow-up. Акцент: агенту нужен простой критерий no-op, иначе он либо тронет backlog зря, либо пропустит нужную actualization | Закрепить, что backlog-side no-op допустим только при явном dossier-side verdict-е `no-op`; запретить backlog-side повторное “додумывание” no-op через самостоятельную rediscovery логику |
| Во время planning выяснилась новая dependency или blocker | `change-proposal` -> обновить `depends_on` / assumptions / slices / rollout notes -> если dossier mature или executable sections changed, прогнать `contract-drift-audit` -> не закрывать stage, пока follow-up facts не выражены явно | `patch-item` для выбранной backlog item: dependency / blocker / context facts; при source-derived изменении сначала scoped `refresh`, затем `patch-item` | `Частично` | Явно зафиксировать в `change-proposal`, что новые blockers/dependencies требуют backlog actualization до step close, и что `backlog impact verdict` должен возвращать `patch existing item`. Акцент: агент должен мыслить не “нужен ли код”, а “изменилась ли backlog truth по dependency/blocker layer”. Сайд-эффект, который надо убить: dossier updated, а backlog всё ещё показывает старую readiness картину | Добавить явный `change-proposal` follow-up branch: `patch-item` для blockers/dependencies/context facts; отдельно проговорить, что такой patch не должен автоматически двигать `delivery_state` |
| На `planned` / `in_progress` dossier оператор меняет executable contract, и по этой же работе нужен дополнительный implementation follow-up | `change-proposal` -> обновить AC/executable sections -> `contract-drift-audit` -> сделать follow-up явным в dossier (slice/task/change log) -> не объявлять шаг docs-only complete | Актуализировать существующую backlog item через `patch-item`, если изменились blockers/dependencies/context; при необходимости оставить `delivery_state` без искусственного движения | `Частично` | Жёстче развести `docs-only change` и `same-item executable follow-up` внутри `change-proposal`; `backlog impact verdict` должен явно выводить `patch existing item`, а не оставлять это на догадку. Акцент: агенту нужно понять, что это продолжение той же work unit, а не автоматический повод заводить новую backlog item. Сайд-эффект для контроля: не допустить ложного раздвоения работы между dossier и backlog | Закрепить decision path для patch existing item без ложного lifecycle downgrade; явно описать, что backlog side не создаёт новый item, пока dossier-side verdict не говорит `new backlog item` |
| В ходе `change-proposal` возник новый feature-local или cross-cutting ADR | `change-proposal` -> `adr-log` -> обновить dossier links / assumptions / approval path / change log | Если ADR новый: `register-source`; если ADR изменён: scoped `refresh`; затем `patch-item` для зависимых backlog items; при необходимости добавить новую backlog work | `Частично` | Явно записать, что новый ADR из `change-proposal` должен передаваться в backlog как canonical source, а `backlog impact verdict` должен уметь выводить `source update`. Акцент: агенту нужно видеть границу между dossier-local decision log и новым upstream source. Сайд-эффект, который надо учесть: без source registration backlog потеряет traceability и зависимые items останутся без source links | Добавить нормативный ADR branch: `register-source` / `refresh` + patch dependent items + optional new packet; явно потребовать relink зависимых items, а не только refresh source set |
| Оператор меняет требования у уже реализованной capability и просит запланировать отдельный delta, не “переоткрывая историю” | `change-proposal` -> зафиксировать change в dossier -> `contract-drift-audit` -> сделать новый delta/follow-up explicit вместо ложного “docs-only update” | Старую backlog item оставить `implemented`; новую delta-работу добавить отдельной backlog item через `template packet` -> `packet`; обновить связи/контекст у существующих items через `patch-item` | `Частично` | Явно описать `delta over implemented work` как supported `change-proposal` path; `backlog impact verdict` должен уметь выводить `new backlog item`, а не только `follow-up required`. Акцент: агент должен сохранить историю delivered work неизменной. Сайд-эффект для контроля: не переоткрывать старую item и не разрушать already-implemented traceability | Закрепить правило `implemented item stays implemented; new delta becomes new item`; добавить обязательный link old->new, чтобы delta не потерялась как disconnected task |
| Upstream architecture doc или repo ADR изменился, и оператор просит привести активный dossier в соответствие | `change-proposal` -> перечитать overlays/architecture/ADR -> обновить dossier executable sections, slices, DoD, dependencies -> `contract-drift-audit`, если зрелый dossier или executable sections changed | Сначала scoped `refresh` по изменённому source; затем `patch-item` для выбранной work и связанных facts; если из source следует новая отдельная работа, добавить её через `packet` | `Частично` | Явно сослаться на source-driven `change-proposal` path и на обязанность перечитать upstream source set; `backlog impact verdict` должен различать `source update + patch` и `source update + new item`. Акцент: агенту нужен порядок `source first, local edits second, backlog verdict third`. Сайд-эффект для контроля: не делать dossier-only resync, когда upstream source уже изменил backlog graph | Добавить явный source-changed workflow: `refresh` first, then `patch-item` / `packet`; запретить путь `patch-item without refresh`, если решение derives from changed registered source |
| Изменение затронуло несколько dossier и shared cross-cutting rule | Повторить `change-proposal` по каждому затронутому dossier; общий ADR/architecture update фиксировать один раз; в каждом dossier явно показать локальный impact | `register-source`/`refresh` для shared source; затем scoped `patch-item` по затронутым backlog items; при необходимости отдельный `packet` для shared remediation work | `Частично` | Добавить multi-dossier `change-proposal` scenario с общим source и локальными dossier deltas; `backlog impact verdict` должен поддерживать `shared source update` и `multi-item impact`. Акцент: агент не должен терять общую причину изменения при локальных правках dossier. Сайд-эффект для контроля: избежать частичного resync, когда один dossier обновлён, а соседние и backlog graph остались в старом состоянии | Добавить multi-item actualization path и правило для shared remediation packet; явно описать batching order, чтобы не получить случайный partial sync |
| Оператор вносит чисто редакционное пояснение в mature dossier, и `contract-drift-audit` подтверждает отсутствие executable follow-up | `change-proposal` -> обновить wording и `Change log` -> `contract-drift-audit` подтверждает no executable follow-up -> dossier-side checks | Ничего не делать только после явного dossier-side `backlog impact verdict`, что backlog truth не изменилась | `Частично` | Добавить explicit `no backlog impact` outcome для mature-docs-only scenario; не полагаться только на `no executable follow-up`. Акцент: mature dossier сам по себе не означает backlog impact. Сайд-эффект для контроля: не создавать лишний backlog churn из-за чисто редакционного изменения mature artifact | Закрепить, что backlog-side no-op допустим только при явном dossier-side verdict-е `no-op`; не требовать manual backlog touch для editor-only mature fixes |

## Что видно из матрицы

- `dossier-engineer` уже неплохо покрывает dossier-local сторону `change-proposal`.
- Основной пробел лежит в cross-skill ветке после `change-proposal`:
  - как получить явный `backlog impact verdict`;
  - когда достаточно `patch-item`;
  - когда нужен `refresh`;
  - когда надо заводить новую backlog item вместо patch существующей.
- Новый ADR, рождённый в `change-proposal`, должен считаться backlog-relevant source, а не dossier-local detail.
- Requirement change на mature work уже сейчас не должен завершаться фразой `docs-only complete`, если audit показал реальный executable follow-up.

## Каким должен быть dossier-side classifier `backlog impact verdict`

Чтобы агент не догадывался о backlog-side ветке вручную, `change-proposal` должен выводить один из явных verdict-ов:

- `no-op`
  Применяется только когда изменение не добавило backlog-relevant blockers/dependencies, не создало и не изменило canonical source, и не потребовало executable follow-up.
- `patch existing item`
  Применяется, когда меняется truth текущей выбранной work unit, но не возникает новая самостоятельная backlog item.
- `source update`
  Применяется, когда change породил новый ADR или изменил уже зарегистрированный canonical source.
- `new backlog item`
  Применяется, когда change создаёт новый delta scope, который нельзя честно спрятать в patch existing item.

Этот classifier нужен не ради красивого output, а чтобы:

- у dossier-side workflow появился буквальный decision point;
- backlog-side workflow мог опираться на явный handoff, а не на повторную интерпретацию;
- agent/operator могли видеть expected next step без лишней rediscovery работы.

Правило при смешанных cases:

- если `change-proposal` одновременно изменила canonical source и truth текущей work unit, primary verdict = `source update`;
- после `source update` backlog-side workflow может потребовать ещё и dependent-item patching или создание новой backlog item;
- то есть `source update` выигрывает у plain `patch existing item`, но не отменяет последующие backlog mutations.

Operator-visible outcomes по verdict-ам должны читаться так:

- `no-op` -> stage может закрыться без backlog mutation, и это должно быть сказано буквально;
- `patch existing item` -> stage не закрывается, пока existing backlog item не actualized;
- `source update` -> stage не закрывается, пока source не registered/refreshed и affected items не updated;
- `new backlog item` -> stage не закрывается, пока новая backlog item не создана и не связана с исходной историей.

## Наиболее важные серые зоны для следующего цикла

1. Явный dossier-side classifier `backlog impact verdict` для `change-proposal`.
2. Явный cross-skill workflow для `change-proposal` в `backlog-engineer`.
3. Правило `patch existing item` vs `create new backlog item`.
4. Явное правило для ADR, созданного внутри `change-proposal`:
   - `adr-log` на dossier side;
   - `register-source` / `refresh` / dependent-item patching на backlog side.
