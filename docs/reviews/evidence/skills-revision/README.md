# Исходная база ревизии десяти скилов

Supporting evidence; не active instructions. План: `docs/plans/implementation-plan-20260907-2.md`, исходный commit `4ddcb698457a741028664ed9af441009c4838d23`.

`initial-source-manifests.json` фиксирует SHA-256 каждого tracked файла десяти target skills и двух неизменяемых инструментов — skill-reviewer 0.2.5, skill-source-compiler content 0.2.10/runtime 0.2.5. Пути относительно соответствующей папки скила; исходные байты доступны в указанном Git commit. Это identity, не verdict и не сборка emitted package.

`astra-source.json` содержит URL, время получения и hash оригинального HTML; `astra-guide.html.gz` — точный HTTP response после gzip decompression. Для принятого критерия использовать раздел GPT-6 Astra / Prompting best practices. Источник рекомендательный и не предоставляет полномочия. При смене документа сравнить изменения с frozen basis, не подменять критерии задним числом.

Новые свидетельства каждой ревизии хранятся внутри docs соответствующего скила и коммитятся вместе только с этим скилом. Общий план и этот исходный набор коммитятся отдельно. Независимый аудит плана выполнен `/root/ten_skills_plan_audit`, fresh context, назначенное reasoning high; сохранён точный результат, не авторская реконструкция вердикта.
