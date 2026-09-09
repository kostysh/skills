# Pencil rendering — подготовка RCA до refresh

**Disposition: BLOCKED для полного visual/export claim C1; внутренняя причина не установлена.** В frozen C1 подтверждён неполный visual output: Edit и Applied пустые, Confirm показывает скопированный Edit без нового backdrop/dialog. Это наблюдаемая непригодность текущих exports для передачи как завершённых экранов. Причинная связь с изменением скилла, ошибкой authored layout или внутренним дефектом provider пока не доказана.

Read-only assessment `/root/baseline_review`; reviewed snapshot — [pencil-c1-before-refresh](pencil-c1-before-refresh/result.md), [manifest](pencil-c1-before-refresh-manifest.json), SHA-256 manifest `ff0eca096a24fbcde0bf8ccdc8cfaf1e6a51b9443adc18f085aaf2c57b13cada`. Независимо пересчитаны все 20 file hashes: совпадают. Прочитаны raw arguments/results C1 и соответствующие B0 failure/recovery calls, сохранённый provider contract, предшествующие review/delta records; визуально просмотрены семь frozen PNG. MCP, Canvas и `.pen` filesystem не использовались; executor не получил диагностику. Единственная запись — этот supporting report.

## Наблюдения, которые ограничивают вывод

| Evidence | Что подтверждено |
| --- | --- |
| C1 `diagnostic/jYGGQ.png` | Новый reusable card экспортирован пустым. |
| C1 `exports/z2Por.png`, `snDqf.png` | Новые desktop/mobile Edit имеют фон, но без видимого содержимого. |
| C1 `exports/F9YG0.png`, `E58XP.png` | Confirm **не пусты**: видно скопированное Edit-содержимое, включая connected card. Новые backdrop, review dialog и его actions отсутствуют. Формулировка «все PNG пусты» была бы неточной. |
| C1 `exports/P6Voh.png`, `D8GhR.png` | Новые desktop/mobile Applied имеют фон без содержимого. |
| C1 `15-final-readback-export.json`, `16-component-evidence.json` | Nodes/children, `reusable:true`, actual `ref` IDs и resolved mobile instance content существуют. Это подтверждает populated structure/connections; корректную отрисовку не заменяет. |
| C1 `07`, `10`, `15` | У новых descendants повторяется +50 px в visitor bounds и clipping. Existing library `w15TUy` имеет нормальную geometry и её screenshot показывает содержимое. |
| C1 `08` → `09` | Diagnostic добавил `x:0,y:0` flex children, получил ignored-coordinate warnings и не исправил проблему; следующий call удалил эти свойства. Симптом существовал **до** диагностики, поэтому она не объясняет первоначальный отказ. |

В `13-confirmation-screens.json` `Copy` создаёт Confirm из Edit, затем `Insert` добавляет overlay с `layoutPosition:"absolute",x:0,y:0,width:w,height:960` и dialog. `15` возвращает overlay bounds `y:50` при authored `y:0`. В том же финальном export скопированное содержимое видно, новые dialog descendants — нет. Таким образом, простая гипотеза «всё содержимое отсутствует в документе» опровергнута; observed split связан с историей создания/копирования/отрисовки, но сам по себе не локализует модуль или механизм.

## Сопоставление с B0 и provider contract

Сохранённые provider root instructions, schema и execute docs C1 `raw-tools.json[1..3]` побайтно совпадают по text content с B0 `mcp-02..04.json`. Документы допускают vertical/horizontal flex, frames с default `horizontal` и `fit_content`, explicit absolute child positioning, connected refs и чтение resolved bounds. Они запрещают полагаться на `x/y` обычных flex children. C1 начальный authored card и screens используют эти поддержанные конструкции; у flex descendants исходно нет требуемого ими собственного `y:50`. Defaults у frame nodes без explicit `layout` не являются сами по себе неизвестным или неподдержанным layout.

Первоначальный B0 card screenshot тоже был пустым; fresh read/screenshot `mcp-07` показал нормальные descendants bounds и card. B0 Confirm затем имел тот же +50 px/clipping pattern: после layout update `mcp-19` он сохранялся в `mcp-20` и `mcp-22`. В `mcp-22` overlay readback содержит `x:0,y:0`, тогда как visitor в `mcp-20` даёт `y:50`. Далее B0 меняет layout overlay на `none`, задаёт dialog coordinates и переносит overlay наружу/назад (`mcp-23..26`); bounds и rendering исправляются в `mcp-24,27..28`. Этот исход уже независимо рассмотрен в [B0 live preparation](pencil-live-review-preparation.md).

Recovery B0 содержит несколько вмешательств вместе. Он доказывает успешное восстановление после этой последовательности; не доказывает, что один конкретный `Move`, `layout:none`, refresh, elapsed time или viewport condition был необходим и достаточен. C1 пока не прошёл сопоставимый завершённый recovery. Нельзя сравнивать финальный B0 после исправлений с промежуточным C1 как контролируемый A/B выигрыш или проигрыш.

Изменение source B0→C1 ограничено cleanup scope, library completion и reference-loading consistency, как установлено в [C1 review](pencil-c1-independent-review.md). Оно не меняет schema/API или инструкцию расчёта geometry. Исполнители выбрали разные авторские композиции, размеры и последовательности. Поэтому наблюдаемая неудача C1 сама по себе не выделяет skill delta как причину, а аналогичный baseline failure дополнительно ослабляет эту атрибуцию.

## Гипотезы и их проверяемые пределы

1. **Несогласованное вычисление layout/render state вновь созданных узлов — поддержанная рабочая гипотеза.** Её поддерживают +50 px при отличающемся authored state, normal old library, видимое copied content и аналогичный B0 recovery. Сохранённые данные не дают внутреннего runtime trace; называть это доказанным provider bug преждевременно.
2. **Влияние layout nesting/absolute overlay или последовательности изменений — остаётся возможным.** B0 recovery менял nesting/layout, а не только повторял screenshot. Но C1 неудача затрагивает и обычные новые flex roots без overlay. Данные не поддерживают объяснение только modal layout и не доказывают конкретный invalid authored property.
3. **Viewport/offscreen initialization, cache или timing — неразделённые варианты.** Новые C1 roots находятся вне текущего viewport; однако existing B library и copied Confirm content на удалённых координатах видны. Одних координат недостаточно для объяснения. Нужен контролируемый before/after; provider contract не обещает специального refresh workaround.
4. **Author diagnostic как первоначальная причина — исключается последовательностью.** Blank/+50 зафиксированы раньше попытки explicit-coordinate repair. Эта попытка была неэффективной и removed; её наличие не оправдывает visual PASS.

Не найдено достаточного основания для нового skill-level remediation по одному rendering incident. При этом отсутствие установленной причины **не снимает** visual/export blocker и не превращает populated structure в корректный дизайн.

## Следующая разделяющая проверка после операторского save/reopen

Сохранить исходные raw/exports и использовать новые имена для результатов. Сначала подтвердить active file; без новых Canvas mutations прочитать прежние IDs, authored tree/ref connections и geometry, затем получить screenshots и exports тех же семи roots. Сопоставить content/refs и обнаружить реальные изменения дерева отдельно от geometry/render changes.

Если неизменённые nodes после reopen отрисуются правильно, это поддержит зависимость отказа от состояния сессии/пересчёта и ослабит гипотезу устойчивой ошибки authored structure. Это всё ещё не уникальное доказательство внутреннего модуля. Если отказ сохранится, гипотеза простого refresh окажется недостаточной; зависимое вмешательство следует выбирать по конкретному сохранившемуся расхождению, с pre/post evidence, без очередного случайного coordinate patch.

Operator save confirmation плюс successful reopen/readback нужны отдельно для persistence. Final visual claim требует видимых Edit, Confirm с диалогом и Applied на обоих размерах, сохранённых connections и инспекции refreshed exports. До этого данный отчёт остаётся подготовкой RCA; full live/joint assessment не завершён.
