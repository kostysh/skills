# Candidate M-mapping — независимая оценка

**PASS для ограниченного pure-mapping case.** Это не verdict всего payload-migration или Payload. Assessor не автор candidate и не исполнитель; действия только read-only, без повторного запуска кода.

Scope: неизменный raw task и M03 criteria в [protocol/M-mapping.json](protocol/M-mapping.json), [baseline assessment](baseline-M-mapping-assessment.md). Все input bytes сверены с [candidate freeze](candidate-M-mapping-inputs.json): расхождений нет. Baseline и candidate task/sources совпадают. Target root Payload 0.1.1 и migration 0.1.2 соответствует authoring freeze.

| Критерий | Наблюдение |
|---|---|
| WordPress форматы/status/GMT | Отдельные REST/DB функции, publish/private/future → published/private/scheduled; GMT → 2026-06-02T10:00:00.000Z. REST entity-decoded title сохранён как кандидат при неизвестной text policy. |
| Timestamp units | seconds явно ×1000, milliseconds без умножения; unknown unit и invalid calendar отклоняются. |
| Rich text | HTML/Markdown/Strapi Blocks дают ограниченные Lexical trees с bold/italic; unsupported grammar отклоняется. Trees названы prepared, без ложного installed-editor proof. |
| Strapi5 | documentId, не row id; разные bodyMarkdown/bodyBlocks остаются альтернативами до определения нужного поля. |
| Contentful | en/it title; отдельные Entry/Asset references и source namespace; Payload IDs не выдуманы. Missing body/status/media facts обозначены. |
| Sanity | custom productCard вместе с исходными данными и индексом сохранён; diagnostic tree нельзя сохранять как полный body; missing locale/project/dataset/status остаются unknown. |
| Identity/locales | Неполные namespaces не превращены в durable source keys; missing locale не заполнена fallback; дополнительные locale writes и fallbackLocale:false объяснены. |
| Authority/output | Все 7 полей представлены для 7 независимых records; import/DB/install запрещены и не заявлены выполненными; persisted count 0. |
| Pure checks | Сохранены check.mjs, output.json, check.output.txt и отдельный exit0. Ассессор прочёл код и сравнил output fields; не выдаёт новое выполнение за своё. |

Прочитаны полные mapping.mjs/check.mjs/result.md, JSON результата и источника, commands и сохранённый вывод. Public tool trace [candidate_mapping_executor.jsonl](raw-agent-traces/candidate_mapping_executor.jsonl) содержит 10 events: чтение обоих root и migration reference, создание mapping/check, вызов node check.mjs и запись report. Trace SHA256 b00c8f7ed298854ef6a7066f1f3fb92783e2e117b55e5610afd610734dfceaa3. Public events согласуются с persisted files. Полный initial context и encrypted dispatcher plaintext отсутствуют; отсутствие запрещённой деятельности вне exported scope не доказано. Shared filesystem — инструкционное ограничение, не hard sandbox.

Assigned candidate GPT-6 Astra medium, baseline high по operator correction. Это confounder сравнения: оба ограниченных случая PASS, но разницу поведения/эффективности нельзя приписать только skill. Backend identity независимо не аттестована. Case forced execution, не catalog selection.

Нет runtime Payload/Lexical acceptance, DB/API/media/renderer, full Contentful AST, crash/rerun либо универсального parser proof; эти границы не входили в этот raw task. Требуемые реальные миграционные проверки остаются отдельными gates.

Output SHA256:
- `result.md`: `2396132b9307df52ddb8866ff4d2926a1bc6f1a972c2eaa40c7b835f5aaa2d41`
- `commands.txt`: `b628b1a4bcead92931d11975a8298cc0afd87c2be96728c84a970d2b6618a3e7`
- `check.exit.txt`: `9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa`
- `output.json`: `cf6c5a57b1473ea3dd759e91b88ad2f51fbc20c7570d0c3e093797ee9804762e`
- `check.output.txt`: `8e4a53f3b68a9255719d881d05303e4f9f514ac16d089e2a2df16a79190ed191`
- `check.mjs`: `e6f4fe42b821103e147f06f884834d257fdbba9ceebd3e5cad66ba6a88aec8ca`
- `mapping.mjs`: `b21f99d6b90a5cc04e94a14db3e88479b81476c53c2114f11f6bc72ef38ab78d`
- `sources.json`: `ba6b4bba276a77c869bbbe130d492a78fe46708f1f1b7ea6bd91d02091b1b24d`
- `task.txt`: `b46f7d1addb8f5c7309dd8ea4b74cbee8d1effcaa7ca64efe1859273b616b3b9`
