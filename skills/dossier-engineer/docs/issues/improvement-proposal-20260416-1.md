# Предложение по улучшению 20260416-1: fail-closed canonical backlog reads в cross-skill workflow

## Контекст

Поводом стала реальная операторская сессия в репозитории, где одновременно действовали `backlog-engineer` и `dossier-engineer`.

Оператор задал простой вопрос по текущему состоянию бэклога: что сейчас в очереди и что брать следующим. Агент корректно начал с `backlog-engineer` и выполнил:

- `status`
- `queue`
- `attention`

`queue` вернул ожидаемый по контракту результат: ordered chains с ключами задач и `ordering_rule`, а не полные task cards. Вместо канонического следующего шага `queue -> items --item-keys ...` агент срезал путь и дочитал внутренний utility state через `.backlog/state.json`, чтобы развернуть ключи в заголовки и статусы.

Фактически ответ оказался близким к truth, но workflow был нарушен: агент использовал внутренние backlog artifacts как read surface для операторского вопроса о текущем backlog truth.

Это важно не как частная ошибка одной сессии, а как системный cross-skill gap. В репозиториях, где одновременно включены `backlog-engineer` и `dossier-engineer`, downstream skill уже фиксирует, что backlog truth принадлежит `backlog-engineer`, но не делает fail-closed вывод: читать backlog следует только через canonical CLI read commands, а не через `.backlog/*`.

Затронутые поверхности `dossier-engineer`:

- `SKILL.md`
- `references/workflow.md`
- `references/REPO_AGENTS_TEMPLATE.md`
- cross-skill guidance around backlog handoff / backlog truth ownership
- docs-contract tests, если они проверяют обязательные guidance blocks

## Наблюдаемая проблема

Текущий текст `dossier-engineer` достаточно хорошо говорит, что:

- backlog shaping/selection/readiness принадлежат `backlog-engineer`;
- backlog actualization должна возвращаться в `backlog-engineer`;
- dossier-local `next-step` не заменяет backlog-side decisions.

Но этого недостаточно, чтобы удержать агента от следующего shortcut:

1. вызвать правильный backlog command;
2. получить compact output;
3. решить, что для user-facing ответа допустимо обогатить результат чтением `.backlog/state.json` или других utility-managed файлов.

Сейчас skill не формулирует явного fail-closed правила:

- внутренние backlog artifacts не являются допустимой read surface для ответов оператору о текущем backlog truth;
- если `queue` даёт только chains, поля beyond chain structure должны добираться через `items`;
- если canonical read surface не даёт нужной информации, агент должен остановиться и честно сказать, что canonical output недостаточен, а не компенсировать это raw file inspection.

## Почему это проблема

Проблема не в том, что `.backlog/state.json` обязательно содержит ложные данные. Проблема в том, что такой путь ломает сам operational contract между skill-ами.

Если shortcut допускается, то размывается сразу несколько инвариантов:

- оператор перестаёт понимать, какие ответы получены через canonical CLI, а какие через внутренние utility artifacts;
- downstream skill фактически нормализует чтение implementation details чужой утилиты;
- agent может случайно обойти intended `queue -> items` choreography и начать опираться на поля, которые есть во внутреннем state, но не обещаны как stable read contract;
- future refactors backlog utility становятся riskier, потому что агенты могли silently начать зависеть от `.backlog/*` структуры;
- возникает ложное ощущение, что "если ответ фактически верный, то workflow неважен", хотя для skill contracts это как раз важно.

Иными словами: это process correctness issue, а не только formatting issue.

## Корень проблемы

Корень не в слабом `backlog-engineer` контракте. У `backlog-engineer` контракт здесь как раз корректный:

- `queue` отвечает на вопрос "what can be taken next";
- `queue` возвращает ordered chains, а не full cards;
- `items --item-keys ...` предназначен для получения полных task cards по известным ключам.

Проблема в downstream/cross-skill guidance:

1. `dossier-engineer` говорит, что backlog truth lives in `backlog-engineer`, но не закрепляет, что читать backlog truth надо только через canonical read commands этой утилиты.
2. Нет явного negative rule, запрещающего отвечать на backlog вопросы через `.backlog/*`, packet/patch drafts, или другие internal artifacts.
3. Нет literal choreography rule `queue -> items` для случаев, когда после выбора work item нужны titles, delivery state, blockers, sources или другие full-card поля.
4. Нет violation framing: прямое чтение internal backlog files не объявлено workflow violation even when the factual answer looks correct.

## Предлагаемое изменение

### P1. Добавить в `SKILL.md` явный раздел `Canonical backlog access`

Нужен короткий, жёсткий блок с формулировкой примерно такого класса:

- for any question about current backlog truth, use only canonical `backlog-engineer` read commands;
- authoritative read surface is `status`, `queue`, `items`, `attention`, `gaps`, `search`, `list-sources`;
- internal backlog files are not an acceptable substitute for canonical command output.

Важно:

- это должно быть именно explicit policy block, а не рассеянные намёки по разным разделам;
- блок должен находиться рядом с уже существующими cross-skill statements про backlog ownership.

Ожидаемый эффект:

Агент получает literal rule, что backlog truth читается только через backlog utility, а не через repo file inspection.

### P2. Зафиксировать обязательный choreography rule `queue -> items`

В `SKILL.md` и/или `references/workflow.md` нужно добавить правило:

- `queue` используется для ответа "what can be taken next";
- если после `queue` нужны fields beyond chain structure, агент обязан вызвать `items --item-keys ...`;
- enrich `queue` results from `.backlog/state.json` or similar files is not allowed.

Ожидаемый эффект:

Компактный output `queue` перестанет провоцировать самодельные enrichments.

### P3. Добавить explicit negative rule для `.backlog/*` и raw artifacts

Нужна буквальная формулировка:

- do not read or parse `.backlog/state.json`, `.backlog/sources.json`, `.backlog/applied.json`, packet files, patch files, or drafts to answer operator questions about current backlog truth;
- such files may be inspected only when debugging the backlog utility itself or when the operator explicitly asks for raw artifact inspection.

Важно:

- это правило должно жить в `dossier-engineer`, даже если сами файлы принадлежат `backlog-engineer`;
- причина в том, что downstream skill orchestrates cross-skill behavior in repos where both skills are active.

Ожидаемый эффект:

Agent-level shortcut через internal artifacts становится явно запрещённым, а не просто "непредпочтительным".

### P4. Добавить fail-closed fallback rule

Если canonical `backlog-engineer` commands:

- не доступны в `PATH`, использовать только canonical installed fallback runtime;
- дают недостаточно полей для ответа, агент должен сказать, что canonical output insufficient, вместо raw file parsing.

Нужная логика:

- fallback разрешён только как замена command prefix;
- fallback не разрешает заменить canonical CLI semantics ad hoc file inspection;
- inability to answer from canonical output should surface as an explicit limitation, not as a reason to inspect `.backlog/*`.

Ожидаемый эффект:

Агент не сможет оправдать shortcut тем, что ему "не хватило полей" или "CLI output был слишком компактным".

### P5. Усилить `REPO_AGENTS_TEMPLATE.md`

В шаблон репозиторного `AGENTS.md` стоит добавить overlay-ready блок для проектов, где используются оба skill-а:

- backlog questions must be answered only through `backlog-engineer` canonical commands;
- utility-owned internal backlog files are not an operator-facing source of truth;
- `queue -> items` is the required path when full task cards are needed.

Важно:

- это не должно заменять правило в самом skill;
- template нужен как repo-side reinforcement для mixed-skill repositories.

Ожидаемый эффект:

Репозитории, которые включают оба skill-а, будут получать этот guardrail сразу при bootstrap или обновлении шаблона.

## Что не должно меняться

- Не переносить backlog read semantics из `backlog-engineer` в `dossier-engineer`.
- Не дублировать полный command reference `backlog-engineer` внутри `dossier-engineer`.
- Не запрещать raw artifact inspection для debugging backlog utility или когда оператор явно просит показать/разобрать внутренние backlog files.
- Не превращать `dossier-engineer` в ещё одну backlog orchestration CLI; речь только о stricter interop guidance.
- Не считать фактически correct answer достаточным, если он был получен через неканонический backlog read path.

## Acceptance criteria

- `SKILL.md` содержит отдельный explicit block про canonical backlog access.
- Guidance literally says that current backlog truth must be read only through canonical `backlog-engineer` commands.
- Guidance explicitly forbids answering backlog status/queue/attention/blocker questions by parsing `.backlog/*`, packets, patches, or drafts.
- Guidance explicitly prescribes `queue -> items --item-keys ...` when fields beyond chain structure are needed.
- Guidance explicitly says that insufficient canonical CLI output is not a reason to inspect internal backlog files.
- `references/workflow.md` reinforces the same cross-skill rule without creating a second competing interpretation.
- `references/REPO_AGENTS_TEMPLATE.md` includes a repo-overlay-ready version of this guardrail for mixed-skill repositories.
- Docs-contract tests are added or updated so this rule is hard to regress silently.

## Preferred implementation order

1. Обновить `SKILL.md` новым compact section `Canonical backlog access`.
2. Обновить `references/workflow.md`, чтобы `backlog-engineer` ownership означал не только lifecycle ownership, но и canonical read surface.
3. Обновить `references/REPO_AGENTS_TEMPLATE.md` минимальным repo-side reinforcement block.
4. Обновить docs-contract tests или equivalent doc assertions.
5. Провести narrow cross-skill review, чтобы новые формулировки не дублировали `backlog-engineer`, а только fail-close interop behavior.
