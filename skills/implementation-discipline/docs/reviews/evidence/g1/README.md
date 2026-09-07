# Evidence группы 1

[Исходный архив](raw-evidence.tar.gz), SHA-256 `9e8679938627d84341a016e7c833a7380289f3a14466875bb4bf88426ba959c4`. [Manifest](archive-file-manifest.json) содержит 594 файлов до включения самого manifest. Архив сохраняет исходные байты inputs, outputs, snapshots и raw public events; отчёты отдельно: [baseline](../../baseline-20260907-1.md), [assessment](../../assessment-20260907-1.md). Это source-only supporting evidence, не часть обязательного emitted-пакета.

## Навигация внутри архива

- `operator-messages.json`: принятый план, дополнительное требование и его явная отмена из публичного readback.
- `baseline/`, `baseline-emitted/`, `final-source/`, `final-emitted/`: исходные/итоговые source и реально emitted packages. Source snapshot предшествует финальному административному обновлению журнала; active bytes совпадают с проверяемым пакетом.
- `cases/`, `private-criteria/`: оригинальные задания, frozen criteria и initial inventories. Оригинальные manifests не менялись. Критерий case04 требует больше, чем C-1: точный nullish claim этим кейсом не принят.
- `runs/`: реальные конечные файлы; `public-traces/`: actual event readbacks и точные копии final_answer. Reasoning исключено; stdout truncation явно отражено в events и readback. Реальных trial-report файлов исполнителям не навязывали.
- `execution-context.json`, `coordinator-readback.json`, `criteria-readback.json`: назначения, проверенные inventory, доступность и ограничения наблюдения.
- `*-structural-checks.json`, `*-parity.json`, `final-auxiliary-validation.json`, `author-readback.json`, `author-self-check.md`, `source-diff.patch`: структурные проверки, source/generated и авторское основание.
- `assessment.md`: независимая оценка реальных действий/файлов. Не является формальным skill PASS.

## Какие запуски учитываются

Baseline `01–06,09–12` сравнивается с final-candidate `27–36` по порядку; actual consumers `25/37` используют реальные producer outputs `06/32`. Всего 22 учитываемых исполнения: 10 пар и два потребителя. Девять пар PASS, одна INCONCLUSIVE в неподдержанной исходником части; оба потребителя PASS. Baseline тоже выполнил проверяемое поведение; преимущество candidate не доказано.

Baseline07/08 и intermediate candidate13–19 — девять фактических, но withdrawn/superseded запусков. Итого архив содержит 31 завершённый запуск. Подготовленные20–24 не исполнены;26 не создан. Папки candidate-emitted и withdrawn-planner-candidate относятся к отменённой промежуточной версии. Не использовать их как evidence итогового source.

Все project facts синтетические; локальные вызовы, изменения и handoffs реальные. Fresh/no-fork — назначение, isolation — инструкции на shared FS. Полный platform context/model settings не измерен; вывод не доказывает универсальную надёжность, экономию ресурсов, native UI или production behavior. Только у учитываемых consumers25/37 есть обрезанные stdout чтения; байты входов, команды и итоговые документы сохранены. Machine-specific пути в raw events — историческая provenance, не переносимые зависимости скила.
