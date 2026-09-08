# Источники текущей ревизии

Прочитаны до правок, 2026-09-08. Нормативная база репозитория и версии методики зафиксированы в baseline-snapshot.json. Исторические logs используются как evidence, не как новая authority.

- [GPT-6 Astra prompting best practices](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices): ясный результат вместо механической процедуры; приоритет разрешений оператора; уточнение только существенных входов; доступная работа продолжается; соразмерная проверка; компактная отчётность. Назначенный explicit delegation применяется в рамках разрешения оператора. Эти рекомендации применяются к авторству, не добавляют модельную историю в shipped skills.
- [TypeScript const assertions caveats](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#caveats-1): literal const context не делает ранее созданную mutable reference глубоко readonly. Проверено компилятором5.9.3 в C04.
- [ECMAScript JSON.parse](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.parse) и [JSON.stringify](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.stringify): JSON может дать scalar/null/array/object; сериализация object с toJSON может дать undefined. Точный контрпример Basic Pattern выполнен в source-probes/baseline/overloads.
- [ts-node experimentalResolver](https://typestrong.org/ts-node/docs/options/#experimentalresolver): настроенный loader может сопоставлять .js specifier с .ts source. C08 выполнил фактический loader10.9.2.
- [Node v24.15.0 TypeScript](https://nodejs.org/download/release/v24.15.0/docs/api/typescript.html): встроенное stripping и сторонние loaders различаются; native execution требует runtime-разрешаемых extensions и не выполняет typecheck.

## Уточнение оператора

В ответ на запрос точного принятого снимка G5 оператор указал: «бери из master ветки». Финальная совместимость будет привязана к freshly-read опубликованному master; не к незавершённому G5 worktree. Это разрешает источник сравнения, не mutation, commit, push или merge. Само принятие/публикация содержимого G5 отдельно не предполагается.
