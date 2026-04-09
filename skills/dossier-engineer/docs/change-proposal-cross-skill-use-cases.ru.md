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
- этот verdict уже может задаваться как stage-level rule; runtime/tool output для него остаётся полезным усилением, но не обязательной предпосылкой для чтения матрицы;
- `source update` в матрице нужно читать не как один mutation, а как family of two terminal paths:
  - `source update / existing-items-only`
  - `source update / delta-scope`

## Матрица юзкейсов

| Юзкейс оператора и literal selector | Воркфлоу агента на стороне `dossier-engineer` | Воркфлоу агента на стороне `backlog-engineer` | Operator-visible terminal outcome | Поддерживается ли сейчас | Что изменить в `dossier-engineer` для покрытия | Что изменить в `backlog-engineer` для покрытия |
| --- | --- | --- | --- | --- | --- | --- |
| Изменение затрагивает только wording/AC dossier; не появились backlog-relevant blockers/dependencies/source; executable follow-up не нужен | `change-proposal` -> обновить AC и dossier sections -> обновить `Change log` -> dossier-side checks -> выставить `backlog impact verdict = no-op` | Нет backlog mutation; backlog-side no-op допустим только при явном dossier-side verdict `no-op` | Dossier stage закрыт; агент явно сообщает: backlog unchanged, new backlog work not created | `Да` | Ничего обязательного; сохранить буквальные критерии `no-op` и не размывать их prose-рассуждением | Ничего обязательного; сохранить правило, что backlog-side no-op не выводится через самостоятельную rediscovery |
| Изменение добавило blocker/dependency/context fact для уже выбранной work; canonical source не менялся; отдельная новая work unit не возникла | `change-proposal` -> обновить `depends_on` / assumptions / slices / rollout notes -> если нужен drift check, прогнать `contract-drift-audit` -> выставить `backlog impact verdict = patch existing item` | `template patch` -> `patch-item` для blocker/dependency/context facts; `delivery_state` не двигается автоматически | Existing backlog item actualized; updated blockers/dependencies видны в backlog; dossier stage закрыт | `Да` | Ничего обязательного; сохранить акцент, что classifier смотрит на backlog truth, а не на “нужен ли код” | Ничего обязательного; сохранить отдельное правило, что такой patch не обязан двигать `delivery_state` |
| Изменение меняет executable contract текущей незавершённой work; canonical source не менялся; отдельная новая work unit не возникла | `change-proposal` -> обновить AC/executable sections -> `contract-drift-audit` -> сделать follow-up explicit в dossier -> выставить `backlog impact verdict = patch existing item` | `template patch` -> `patch-item` для changed blockers/dependencies/context facts и lifecycle actualization только если evidence реально изменился | Existing backlog item stays the same work unit and is actualized instead of being split; dossier stage закрыт | `Да` | Ничего обязательного; сохранить буквальную границу между docs-only change и same-item executable follow-up | Ничего обязательного; сохранить rule, что backlog side не invents new item without dossier-side verdict `new backlog item` |
| `source update / existing-items-only`: `change-proposal` создаёт новый canonical source или меняет уже зарегистрированный source, но после source sync отдельный delta scope не появляется | `change-proposal` -> если нужен новый ADR, выполнить `adr-log` -> обновить dossier links/assumptions/change log -> выставить `backlog impact verdict = source update` | Если source новый: `register-source`; если source уже зарегистрирован и changed: scoped `refresh`; затем `patch-item` для всех known impacted items | Source registered/refreshed; all known impacted items actualized; new backlog item not created; dossier stage закрыт | `Да` | Ничего обязательного; сохранить rule, что dossier verdict opens `source update`, а row selector уже фиксирует terminal subtype `existing-items-only` | Ничего обязательного; сохранить literal split `new source -> register-source`, `changed registered source -> refresh`, then patch impacted items only |
| `source update / delta-scope`: `change-proposal` создаёт новый canonical source или меняет уже зарегистрированный source, и после source sync появляется отдельный delta scope | `change-proposal` -> `adr-log`, если нужен новый ADR -> обновить dossier executable sections and rationale -> выставить `backlog impact verdict = source update` | Если source новый: `register-source`; если source уже зарегистрирован и changed: scoped `refresh`; затем patch already known impacted items; затем `template packet` -> `packet` для нового delta scope | Source registered/refreshed; old impacted items actualized; separate new backlog item created and linked; dossier stage закрыт | `Да` | Ничего обязательного; сохранить distinction между `source update / existing-items-only` и `source update / delta-scope` как literal matrix outcomes | Ничего обязательного; сохранить literal bundled sequence for `source update` so agent does not guess between patch and new item |
| Affected capability уже реализована, и оператор просит отдельный delta, не переоткрывая историю; separate delta scope виден явно | `change-proposal` -> зафиксировать change в dossier -> `contract-drift-audit` -> сделать новый delta/follow-up explicit -> выставить `backlog impact verdict = new backlog item` | Старую backlog item оставить `implemented`; новую delta work добавить через `template packet` -> `packet`; при необходимости `patch-item` только для links/context | Old delivered history preserved; new backlog item created for delta work; dossier stage закрыт | `Да` | Ничего обязательного; сохранить explicit verdict `new backlog item` для delta-over-implemented path | Ничего обязательного; сохранить hard rule `implemented item stays implemented; later delta work becomes new backlog item` |
| Changed registered source или новый shared ADR затрагивает несколько dossier/items under one shared rule | Повторить `change-proposal` по каждому затронутому dossier; общий source/ADR зафиксировать один раз; в каждом dossier явно показать локальный impact и shared origin | `register-source`/`refresh` для shared source; затем patch all known impacted items; при необходимости отдельный shared remediation `packet`; partial sync запрещён | Shared source synchronized; all known impacted items actualized or split into new work; dossier stages закрываются только после полного backlog sync | `Частично` | Добавить в skill явный multi-dossier `change-proposal` orchestration contract, чтобы агент не выводил batching order из общих правил | Добавить более буквальный multi-item batching workflow с operator-visible completion signal для shared remediation |
| Mature dossier получает чисто редакционное пояснение; `contract-drift-audit` подтверждает no executable follow-up; не появились backlog-relevant blockers/dependencies/source | `change-proposal` -> обновить wording и `Change log` -> `contract-drift-audit` подтверждает no executable follow-up -> выставить `backlog impact verdict = no-op` | Нет backlog mutation | Mature dossier updated; backlog explicitly unchanged; dossier stage закрыт | `Да` | Ничего обязательного; сохранить explicit `no-op` outcome и не подменять его просто фразой `no executable follow-up` | Ничего обязательного; сохранить rule that editor-only mature fixes do not force backlog touch without explicit non-`no-op` verdict |

## Что видно из матрицы

- `dossier-engineer` и `backlog-engineer` уже закрывают большинство single-dossier сценариев `change-proposal` буквальным workflow.
- Главный ещё незакрытый сценарий — shared-source / multi-dossier change, где всё ещё нужен более жёсткий batching contract.
- `source update` должен читаться не как один mutation, а как bundled backlog sequence с двумя terminal subtypes:
  - source sync first;
  - then existing-item actualization;
  - then either:
    - `existing-items-only`
    - or `delta-scope`, если после source sync действительно появился отдельный delta scope.
- Уже реализованная capability не должна переоткрываться: later delta work живёт как новая backlog item.

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
- `source update` не является single mutation и не отменяет последующие backlog mutations;
- backlog-side bundled sequence для `source update` должна читаться буквально:
  - если canonical source новый -> `register-source`;
  - если canonical source уже зарегистрирован и changed -> scoped `refresh`;
  - затем:
    - если changed truth касается только already known impacted items -> terminal subtype `source update / existing-items-only` -> `patch-item`;
    - если после source sync появился отдельный delta scope -> terminal subtype `source update / delta-scope` -> `template packet` -> `packet` для новой backlog item.

Operator-visible outcomes по verdict-ам должны читаться так:

- `no-op` -> stage может закрыться без backlog mutation, и это должно быть сказано буквально;
- `patch existing item` -> stage не закрывается, пока existing backlog item не actualized;
- `source update / existing-items-only` -> stage не закрывается, пока source не registered/refreshed и affected items не updated;
- `source update / delta-scope` -> stage не закрывается, пока source не registered/refreshed, affected items не updated и новая backlog item не создана;
- `new backlog item` -> stage не закрывается, пока новая backlog item не создана и не связана с исходной историей.

## Наиболее важные серые зоны для следующего цикла

1. Multi-dossier/shared-source orchestration contract на dossier side.
2. Более буквальный batching order и completion signal для shared remediation на backlog side.
3. Если позже понадобится runtime support, он должен лишь подтверждать уже существующий process verdict, а не подменять его.
