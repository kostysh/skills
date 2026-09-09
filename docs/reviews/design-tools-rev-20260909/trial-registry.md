# Исполнения и exposure

Все перечисленные executors — отдельные fresh agents с fork_turns=none, назначены gpt-6-astra/high; фактическая serving model не раскрыта и не утверждается. Исполнители не получают rubric/diagnoses/ожидаемые answers; assessor/root их видит. Это instruction-level access isolation в общей файловой системе. Каждый trial получает readonly active copies, пользовательские inputs, необходимые соседние skills по роли. Full bundles отдельно оценивает reviewer. Неограниченный host autoactivation не заявляется.

| Run | Agent | Inputs | Выход / граница |
| --- | --- | --- | --- |
| Catalog B0 | selection_b0 | raw-selection-inputs.json | selection-b0.json; description-only8 cases |
| Catalog+UI B0 | selection_metadata_b0 | selection-catalog-b0.json, original8 requests | selection-result-metadata-b0.json |
| Catalog+UI C1 | selection_metadata_c1 | selection-catalog-c1.json, original8 requests | selection-result-metadata-c1.json |
| Decisions B0 | decisions_b0 | raw-decision-inputs.json13 stipulated cases, baseline-active | decisions-b0.md; не live tool evidence |
| Additional B0 | additional_b0 | raw-additional-inputs.json3 stipulated cases, baseline-active | additional-b0.md; не live tool evidence |
| Decisions C1 | decisions_c1 | те же13 inputs, candidate-active | complete; см. raw result files |
| Additional C1 | additional_c1 | те же3 inputs, candidate-active | complete; см. raw result files |
| Live B0 | live_b0 | raw-live-task.txt, initial fixture, baseline-active/shadcn и agent-browser | live-b0/result.md + raw project/browser evidence |
| Live C1 | live_c1 | тот же brief/initial fixture, candidate-active/shadcn и agent-browser | live-c1/result.md + raw project/browser evidence; process reminder раскрыт ниже |
| Keyboard diagnostic | live_c1 follow-up | guided event-order hypothesis после обоих blind runs, installed Radix source | отдельный bounded diagnostic; не blind comparison и не superiority evidence |

Catalog+UI pair добавлена после изменения metadata для проверки именно changed surface;8 исходных requests/owner criteria неизменны и зафиксированы до правки. Initial description-only B0 не смешивается с UI-metadata comparison. Stipulated B0 answered13 supported cases; additional D0 выявил лишний maintenance blocker, остальные2 сохранили требуемое поведение. Это author assessment до независимого verdict.

Shared fixture upstream delta намеренно создан удалением одного current upstream focus token; real registry add/update/tool execution подтверждается отдельно от synthetic initial source. Доказательство не выдаётся за миграцию между историческими официальными releases.


Дополнение по live-C1: после сообщения исполнителя о повторном arrow-key наблюдении root напомнил исследовать исходный путь/причину либо обозначить evidence limit, не повторять вслепую, не менять supplied skills и сохранить keys/focus/checked до/после. Причина, диагноз или ожидаемый код не передавались. Это дополнительное процессное сообщение раскрыто для оценки сопоставимости; оно не относится к blind D0 и остальным stipulated pairs. Live-C1 не используется для заявления измеренного superiority по keyboard behavior.

## Base UI / Pencil live продолжение

| Run | Agent | Inputs | Граница |
| --- | --- | --- | --- |
| Pencil B0 | pencil_live_b0 | raw-pencil-live-task.txt, baseline-active/pencil-dev, fixtureA | реальный MCP; дополнительное authority exposure после auto-review rejection |
| Base B0 | base_live_b0 | raw-live-task.txt, identical fixture-base copy, baseline-active/shadcn | real Base UI; environment-only pnpm escalation context |
| Base C2 | base_c2_trial | тот же raw brief и fixture-base, candidate-c2-active/shadcn | real Base UI; тот же environment context |

C2 raw literal brief совпадает с прежним live brief; новый fixture меняет technology coverage по явному уточнению оператора. Сравнивать Base B0↔C2, не Base↔старые реализации. Metadata C2 byte-equal B0, description unchanged; прежняя B0 catalog+UI выборка применима к восстановленному входу, новая версия root не каталоговый input. C2 source/authority delta отдельно оценён, final live verdict pending.

Pencil B0 получил первоначальный attachment и authority строки принятого плана после двух auto-review rejections: это дополнительное раскрытие scope, не диагнозов/expected verdict. Пользователь затем явно разрешил все тестовые изменения A/B. Не утверждать pristine blind isolation после этого вмешательства; task solution не выдавался. Иные subtrees ему читать запрещено. Actual raw outputs и модель/exposure оцениваются reviewer отдельно.

| Joint consumer | joint_consumer fresh6-astra/high | raw-joint-consumer-task.txt, candidate-c2-active/shadcn, joint-base-project initial copy, frozen pencil-c1-before-refresh handoff/exports | отдельный действительный producer→consumer путь; partial visual/save source limit передан явно |

Joint started while operator save/reopen pending. Consumer получает существующий handoff и actual exports, не другие UI trial solutions. Уточнение от независимого просмотра: четыре exports пустые; две Confirm картинки показывают скопированный Edit без нового modal. Он может реализовать supported contract по handoff/brief с обычными разрешёнными решениями; full visual/persistence и final chain claim остаются открытыми. Это не подтверждённый end-to-end результат на момент dispatch.

## Continuation после reopen

`pencil_resume` — новый continuation executor с прежней RCA/history, не blind comparator; только readback/screenshots/export, no mutation. A/B19roots и14PNG проверены, raw frozen в pencil-after-refresh. Операторское save/reopen подтверждение предшествует вызовам. Supplemental cleanup A/B использует отдельные supplied B0/C1 contexts, одинаковый raw-pencil-cleanup-task.txt и текущие IDs; literal prompt создан после C2, criteria P6e до изменения. Не подмешивать в initial blind results. Joint consumer получает final populated PNG для bounded сопоставления.

Supplemental executors `cleanup_b0` и `cleanup_c1` получили fork:none, одинаковый raw brief и только assigned A/B IDs + supplied baseline/candidate skills; модели наследованы, не повторная full blind trial. A создал x3vi7b/aTsAR, B QvbuR/QdkRW; оба удалили собственный scratch. Initial scratch rendering/clipping warnings сохранены, не superiority claim. Снимки cleanup-b0(1JSON с raw/images) и cleanup-c1(8files) frozen с manifests. Финальное общее read-only сравнение с persisted reopen выполняет continuation executor отдельно.

Итог: reopened read-only continuation и отдельные cleanup A/B завершены; final preservation сопоставлен с сохранённым состоянием. Independent pencil-joint-final-independent-review.md — PASS для принятого bounded scope. Старые pending/BLOCKED записи отражают момент dispatch; новое evidence заменяет текущий статус, не переписывает исходные trials.
