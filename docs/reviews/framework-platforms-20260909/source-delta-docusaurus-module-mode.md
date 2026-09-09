# D04/D20: уточнение module mode для Docusaurus

2026-09-09, независимая проверка источника; **новый baseline finding не создаётся**, severity и verdict существующего review не меняются. Это дополнение к [technical Docusaurus](technical-docusaurus.json), а не результат D runtime trial.

Подтверждено: в [ответе maintainer #11326 от 2025-07-15](https://github.com/facebook/docusaurus/discussions/11326) объяснено, что webpack-инфраструктура сайта ожидает ambiguous module mode; package-level `"type":"module"` в приведённом Docusaurus3.8.1 repro приводит к `require.resolveWeak is not a function`. [ESM migration tracker #6520](https://github.com/facebook/docusaurus/issues/6520), просмотренный 2026-09-09, остаётся открытым; его старые технические ограничения нельзя автоматически переносить на текущий Node/TypeScript.

Практический вывод для **D04**: перед изменением package-level module mode проверять поддержку установленной Docusaurus-ветви и production SSR build. Поддержка ESM-синтаксиса отдельных config/CLI файлов не доказывает поддержку package-wide strict ESM. Не превращать общий совет «использовать ESM» в обязательное добавление `type:module` всему сайту.

Для **D20 / Node-owner interop**: handoff должен сохранять framework module-mode constraint, отдельно указывать site package scope, config format и `.mjs` executable boundary. Это совместимость владельцев, не основание переписывать все scripts на CommonJS.

Координатор сообщил аналогичный preflight failure на Docusaurus3.10.2, удаление только package-level `type` в обеих D fixtures до executor и сохранение `.mjs` CLI/dependency pins; изменения зарегистрированы в протоколе. Эти runtime действия оценщик не воспроизводил и их успешное завершение здесь не аттестует. Ошибка coordinator fixture не приписывается baseline навыку. В прочитанных D04/D20 исходных инструкциях требования добавлять `type:module` не обнаружено, поэтому отдельный P2 из этого сообщения не следует.
