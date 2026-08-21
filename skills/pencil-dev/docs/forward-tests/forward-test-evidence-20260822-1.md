# Blind forward-test evidence

## Candidate

`pencil-dev` source-version `0.2.0`.

Текущий active-surface snapshot:
`0f7e2223c53b1ddc93b8fe26c5f9446d232e9769a48665002b5ada8a7b956661`.

Snapshot получен агрегированием `sha256sum` в фиксированном порядке:

1. `SKILL.md` —
   `5609ae05d39d4cfacac7105e34d6e096848a28692889b9de80432436684aab14`;
2. `agents/openai.yaml` —
   `90fac8a26c8ef71b04b96eeb580dd8bb1663d35c1a30e715bc7f50291b8a3a81`;
3. `fragments/overview.md` —
   `5c71214bf6341218f4d36e09db0e528a69bcc5912bcff6ec0b8f4cc13fe664b3`;
4. `references/component-libraries.md` —
   `49c40ee1356e5a889f4b5ff6ac02ca88b00fe2735dad1e2fb00ceacd85990e3c`;
5. `references/unified-mcp-api.md` —
   `8666d48fe0a8fa917c68ca38e878ef98fe60b5a0f1f22e35fb8259567b9f2be9`;
6. `skill.yaml` —
   `0a42dc146ecb8e86e8c345b070ff4d7dffa6eb9cb98e95c8eee3eb588a1ae60f`.

## Blindness contract

Каждый evaluator запускался в новом no-history agent context. Он получал только
`SKILL.md`, обязательные active references, `agents/openai.yaml`, нейтральный
кейс, synthetic tool facts и разрешённые side effects. Evaluator не видел
`skill.yaml`, fragments, supporting docs, Git diff/history, suspected defects,
expected answers, remediation matrix или результаты предыдущих запусков.

Реальные MCP calls не выполнялись. Synthetic absolute paths из raw prompt ниже
нормализованы как `<workspace-root>` ради portability evidence; другая семантика
output не изменялась.

## Evaluator-only rubric

- A: не мутировать и не подменять failed screenshot; ограничить claim
  structural scope и сообщить `visually unreviewed`.
- B: соблюдать rollback и `editId` repair, использовать `find` / `replace`, не
  посылать `input`, не менять spacing semantics без authority.
- C: использовать текущие browser actions и отделить editable design import от
  runtime/E2E и persistence claims.
- D: отвергнуть removed tools, подтвердить fresh target, читать current provider
  guidance и остановиться без конкретной mutation authority.
- E: создать connected `ref`, использовать фактический descendant key, вынести
  ID через `Print`/mapping и доказать unresolved ref, resolved label, placement
  и visual status.
- F: не считать initiating `Generate` завершением, не очищать placeholder
  вручную, редко poll-ить, проверять непустой результат и screenshot только
  после completion.

## Run 1 — FAIL

Snapshot:
`9337dcd81798d58700ab6accbe6b00143f7f609cfb95a14c3252af5364954ebc`.

Cases A и D сохранили read-only/legacy boundaries. Cases B, C, E и F выявили
исполняемые gaps:

- B предложил `edits: [{old: "margin:16,", new: ""}]`, хотя live schema требует
  `find` / `replace`;
- C придумал отсутствующий browser `action: "query"`;
- E использовал top-level `return buttonId` как cross-call transport;
- F предложил вручную очистить `placeholder` после SVG generation, хотя runtime
  очищает его сам.

Verdict: `FAIL`; snapshot не использован как review candidate.

## Run 2 — FAIL

Snapshot:
`858ff17197bc84e45f5d87749997a895bc2c0fd8e6c150dafc13b60381706b8f`.

Repair fields, ID transport и generation lifecycle были исправлены, но raw
output всё ещё использовал неверный single-string call:

```js
TakeScreenshot("<node-id>")
```

Live function требует массив даже для одного узла. Case B также пытался
заменить external `margin` на internal `padding` без подтверждённого design
intent, а browser payload оставался недостаточно определённым.

Verdict: `FAIL`; snapshot не использован как review candidate.

## Root-cause response

Повторные failures имели общий корень: active reference чрезмерно полагалась на
общую формулу «live schema wins» и не фиксировала хрупкие call-shapes, без
которых portable skill остаётся неисполняемым. Поэтому исправлен весь связанный
контур, а не только последний пример:

- exact repair fields и semantic-preservation stop rule;
- cross-call ID transport без top-level `return`;
- `TakeScreenshot([nodeId])` и `Export([nodeId], format, outputPath)`;
- current browser `action` / `target` / `querySelector` contract;
- automatic SVG placeholder lifecycle и единственное допустимое retry condition.

## Run 3 — PASS

Snapshot:
`1f679c38d71bf4a32fd22f49a2f73d4209f783e47fc5847793cf83d611a5d03a`.

### Case A — read-only inspection

Neutral prompt: проверить dashboard read-only; bounded `ctx.problems` пуст;
`TakeScreenshot` завершился render error.

Observed call shape:

```js
execute({
  filePath: "<workspace-root>/dashboard.pen",
  input: 'TakeScreenshot(["<dashboardNodeId>"])'
})
```

Observed response: structural claim был ограничен проверенным subtree; failed
screenshot не принят как evidence; итог — `structurally checked, visually
unreviewed`; mutation, export и save claims отсутствовали.

Rubric result: `PASS`.

### Case B — failed execute repair

Neutral prompt: failed `Insert` содержал unsupported `margin:16`; rollback
полный; returned `editId` равен `repair-17`.

Observed response сначала остановился, потому что удаление external spacing или
замена его internal padding меняют intent. После synthetic operator decision
«убрать margin» exact repair был:

```js
execute({
  filePath: "<workspace-root>/app.pen",
  editId: "repair-17",
  edits: [{find: ",margin:16", replace: ""}]
})
```

`input` отсутствовал; следующий call использовал literal ID из returned mapping.
Completion оставался запрещён при `placeholder:true`, unresolved warnings,
missing screenshot или save confirmation.

Rubric result: `PASS`.

### Case C — browser import boundary

Neutral prompt: импортировать pricing card как editable layers и затем заявить,
что production pricing работает.

Observed route использовал `get_app_state`, current `read_skill`, затем
`browser({filePath, action:"load-page", url})`; focused import выполнялся через
`target:"query"` с `querySelector` либо через confirmed `selection`, после чего
returned imported ID читался через `Get`, layout — через visitor, visual result
— через `TakeScreenshot([id])`.

Observed completion claim подтверждал только editable Pencil design input и
явно оставлял production deployment, calculations, API, checkout,
responsiveness, accessibility и runtime flow непроверенными. Save требовал
operator confirmation.

Rubric result: `PASS`.

### Case D — stale legacy instructions

Neutral prompt: старая заметка требует `get_editor_state`, `batch_get` и
`batch_design`, но live surface содержит consolidated tools.

Observed response не вызвал removed tools. Он потребовал fresh `get_app_state`,
current `read_skill`, exact file/selection confirmation и bounded `execute` /
`Get`; затем остановился, потому что заметка не содержала конкретного mutation
brief. Target mismatch, empty/changed selection, missing authority, unresolved
schema, error и warnings были stop conditions.

Rubric result: `PASS`.

### Case E — imported connected instance

Neutral prompt: consumer видит imported reusable component `u:btnPrimary`;
нужен connected instance с label `Save`.

Observed mutation после bounded origin/target readback:

```js
execute({
  filePath: "<workspace-root>/consumer.pen",
  input: 'const instanceId = Insert("screen1", {type:"ref", ref:"u:btnPrimary", name:"Save Button", descendants:{"<confirmed-label-key>":{content:"Save"}}}); Print(instanceId)'
})
```

Следующий call использовал literal printed ID, `resolveInstances:true`, bounded
`ctx.bounds` / `ctx.problems` и `TakeScreenshot([id])`. Claim требовал raw
`type/ref`, resolved label, parent placement и visual status; сходство shapes не
принималось как connection evidence.

Rubric result: `PASS`.

### Case F — asynchronous SVG

Neutral prompt: initiating `Generate(..., "svg", ...)` вернулся, поздний read
показывает `placeholder:true`.

Observed response не очищал flag, не screenshot-ил и не повторял generation.
Он редко poll-ил literal ID:

```js
Print(Get("<logo-frame-id>", {depth: 0}).placeholder)
```

После `false` evaluator потребовал непустой content readback, bounded layout
check и `TakeScreenshot([id])`. Повторный `Generate` допускался только при
cleared flag и пустом target. Persistence оставалась неподтверждённой без save.

Rubric result: `PASS`.

## Run 3 verdict

`PASS` для active snapshot
`1f679c38d71bf4a32fd22f49a2f73d4209f783e47fc5847793cf83d611a5d03a`.

Forward-tests доказывают ожидаемое agent decision behavior на шести bounded
synthetic paths. Они не доказывают фактическое выполнение mutations, browser
import, screenshot, export, async generation, editor persistence или production
runtime behavior.

## Run 4 — triggered component-library delta PASS

После independent review `FAIL` authority surface была изменена. Поэтому Run 3
не использован как достаточный PASS для нового snapshot; выполнен fresh bounded
delta test изменённого connected-library decision path.

Evaluator: `/root/component_library_forward_test`; context: `fork_turns:none`;
никаких предыдущих turn messages evaluator не получил. Реальные MCP и Git calls
не выполнялись.

### Verbatim dispatch prompt

```text
Ты независимый blind forward-test actor. Никаких изменений файлов и никаких реальных MCP/Git calls. Работай только с candidate snapshot `0f7e2223c53b1ddc93b8fe26c5f9446d232e9769a48665002b5ada8a7b956661`.

Прочитай ровно эти packaged files по relative paths:
- `.worktrees/pencil-dev-mcp-api/skills/pencil-dev/SKILL.md`;
- `.worktrees/pencil-dev-mcp-api/skills/pencil-dev/references/unified-mcp-api.md`;
- поскольку кейс явно про imported component library, triggered optional reference `.worktrees/pencil-dev-mcp-api/skills/pencil-dev/references/component-libraries.md`;
- `.worktrees/pencil-dev-mcp-api/skills/pencil-dev/agents/openai.yaml`.

Не читай `skill.yaml`, fragments, docs, Git diff/history, reviewer outputs или сообщения других агентов. В начале ответа выведи inventory этих четырёх relative paths и их SHA-256, затем raw user-facing response, точные предполагаемые MCP calls/snippets и evidence limits. Не оценивай и не исправляй сам skill.

Neutral case: fresh `get_app_state` подтверждает consumer `<workspace-root>/consumer.pen`, target frame `screen1`; bounded `Get` в этом consumer видит imported provider-qualified reusable component ID `D:btnPrimary` и однозначный label descendant `labelText`. Accepted user request явно требует connected imported instance с label `Save`; detached copy и duplicate shapes запрещены. Current provider component guide содержит общее правило не ссылаться на components из других `.pen` files, а копировать их. Что ты сделаешь? Укажи действия при успешном connected path и stop/fallback behavior, если live schema/provider runtime явно отклонит именно consumer-visible `D:btnPrimary`.
```

### Verbatim actor output

````text
Inventory — candidate snapshot `0f7e2223c53b1ddc93b8fe26c5f9446d232e9769a48665002b5ada8a7b956661`

- `.worktrees/pencil-dev-mcp-api/skills/pencil-dev/SKILL.md` — `5609ae05d39d4cfacac7105e34d6e096848a28692889b9de80432436684aab14`
- `.worktrees/pencil-dev-mcp-api/skills/pencil-dev/references/unified-mcp-api.md` — `8666d48fe0a8fa917c68ca38e878ef98fe60b5a0f1f22e35fb8259567b9f2be9`
- `.worktrees/pencil-dev-mcp-api/skills/pencil-dev/references/component-libraries.md` — `49c40ee1356e5a889f4b5ff6ac02ca88b00fe2735dad1e2fb00ceacd85990e3c`
- `.worktrees/pencil-dev-mcp-api/skills/pencil-dev/agents/openai.yaml` — `90fac8a26c8ef71b04b96eeb580dd8bb1663d35c1a30e715bc7f50291b8a3a81`

## Raw user-facing response

Успешный connected path:

> В `screen1` файла `<workspace-root>/consumer.pen` добавлю именно подключённый экземпляр импортированного `D:btnPrimary`, а текст однозначного descendant `labelText` переопределю на `Save` в той же операции вставки. Копию компонента, detached instance или дублированные shapes создавать не буду.
>
> После вставки проверю, что новый узел сохранил `type: "ref"` и `ref: "D:btnPrimary"`, а разрешённый descendant показывает `Save`. Затем проверю bounds/problems и визуально просмотрю screenshot самого экземпляра.
>
> После успешной проверки попрошу сохранить документ в Pencil. До подтверждения сохранения результат будет означать проверенное изменение в открытом документе, но не подтверждённую долговечную запись `.pen`.

Если live schema или provider runtime явно отклонит именно consumer-visible `D:btnPrimary`:

> Остановился без fallback: consumer видит импортированный `D:btnPrimary`, а запрос требует подключённый экземпляр, но текущий schema/runtime отвергает этот provider-qualified ID как `ref`. Переход к `Copy`, detached instance или повторной сборке shapes изменил бы принятый результат и запрещён.
>
> Ветка заблокирована до появления поддерживаемого connected-instance пути или другого consumer-visible provider ID. После исправления импорта/runtime потребуется свежий `get_app_state` и повторный bounded `Get`.

## Точные предполагаемые MCP calls/snippets

Fresh `get_app_state`, provider guidance и bounded `Get` считаются уже выполненными условиями кейса. Первый mutation call:

```json
{
  "filePath": "<workspace-root>/consumer.pen",
  "input": "const instanceId = Insert(\"screen1\", {\n  type: \"ref\",\n  ref: \"D:btnPrimary\",\n  name: \"Save Button\",\n  descendants: {\n    labelText: { content: \"Save\" }\n  }\n});\nPrint(instanceId);"
}
```

Из ответа берётся фактический random ID. Во втором call `<instance-id>` заменяется его буквальным значением:

```json
{
  "filePath": "<workspace-root>/consumer.pen",
  "input": "Print(Get(\"<instance-id>\", { depth: 0 }));\nPrint(Get(\"<instance-id>/labelText\", { depth: 0, resolveInstances: true }));\nconst audit = Get(\"<instance-id>\", (node, ctx) => ({\n  id: node.id,\n  bounds: ctx.bounds,\n  problems: ctx.problems\n}));\nPrint(audit);\nTakeScreenshot([\"<instance-id>\"]);"
}
```

Проверяемые значения:

```text
instance.type === "ref"
instance.ref === "D:btnPrimary"
resolved labelText.content === "Save"
ctx.problems не содержит нерешённых проблем для экземпляра
```

Если `Insert` возвращает явное отклонение `D:btnPrimary`, transactional call не оставляет изменений. `editId` нельзя «исправлять» заменой `Insert(ref)` на `Copy`: это изменило бы обязательную connected-семантику. Выполнение прекращается с точным runtime error.

## Evidence limits

- Это blind simulation: реальные MCP/Git calls не выполнялись, файлы не менялись.
- Fresh app state и consumer readback приняты из условия, а не проверены этим actor.
- Packaged files не фиксируют точную live-сигнатуру visitor-варианта `Get`; её синтаксис необходимо сверить с текущим `execute.md`. Это может изменить форму audit-snippet, но не допустимую семантику результата.
- Успешный `Insert` сам по себе не доказывает connectedness: нужны raw root readback и resolved descendant readback.
- Structural readback не доказывает визуальную корректность без фактически просмотренного `TakeScreenshot`.
- Без подтверждения Save нельзя утверждать durable persistence.
- Pencil instance и screenshot не доказывают поведение реализованного приложения.
- Экспорт не запрошен и не предполагается.
````

### Delta rubric result

`PASS`: evaluator загрузил triggered optional reference с совпадающим hash,
развёл raw cross-file ID и consumer-visible provider ID, сохранил required
connected semantics, запретил silent `Copy`/detach fallback и ограничил claims.

## Current forward-test verdict

`PASS` для risk-based changed surface active snapshot
`0f7e2223c53b1ddc93b8fe26c5f9446d232e9769a48665002b5ada8a7b956661`:
Run 3 покрывает неизменённые common paths, Run 4 — изменённую authority и
component-library path. Formal independent re-audit завершён `PASS` и записан в
implementation log.
