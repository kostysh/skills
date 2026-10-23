# Независимое ревью документации CLI — раунд 2

**Локальный Audit Gate: PASS. Статус documentation: verified в обозначенной локальной области.**

D1 закрыт. Подтверждённых новых material findings нет. Это не разрешение публикации и не подтверждение публичного выпуска.

## Область и стабильный снимок

Режим: независимое read-only bounded re-audit после исправлений. Аудитор: `/root/implementation_docs`. Делегирования не было. Рассмотрены инструкция установки/обновления/восстановления в `cli/README.md`, root README/navigation, `cli/docs/implementation-log-20261023-1.md`, сводный отчёт раунда 1, help/messages, package/scripts и release workflows как фактическое основание. Связанные изменения F1/F2 рассмотрены только в части соответствия утверждениям документации; профильные code/spec и security verdict этим заключением не присваиваются.

Читатели: пользователь npm-пакета `@kostysh/skills@0.1.0` с bin `kskills` и сопровождающий workspace. Формы: координирующий README с how-to/reference sections; журнал и предыдущий отчёт — evidence/status records. Язык CLI и руководства — русский; английская root navigation сохранена.

Основание: принятый `kskills-plan-20261023-v2`, дополнение о пользовательском пути проекта, repository AGENTS/skill-standard, навыки documentation и cli-engineer. Ранее полученный PASS простоты является входным gate, но не доказательством правильности документации.

Snapshot: `4121038c67c199a97836368da6972b0e8475442d2fc7fd25b3daad11d91827d0`, 39 файлов. Источник и manifest: `/tmp/kskills-audit-r2-uptasuuu/`. Предыдущий snapshot: `9e772b48a194c4850b869a2098b0cb32070b7ee686a678f07a080346d2a64d30`. Все 39 file SHA-256 совпали с manifest до и после проверки. Snapshot и исходный worktree не изменялись.

Disposable copy: `/tmp/kskills-docs-r2-9cogcimk/repo`; использованы существующие root/cli node_modules через symlink. Среда: Linux, Node.js v24.21.0, pnpm 10.28.2. PNPM_HOME, XDG_DATA_HOME и npm cache перенаправлены в `/tmp`; реальные пользовательские установки не затронуты.

## Закрытие D1

README:32-88 теперь описывает конкретный crash между заменой каталога и записью конфига. Порядок включает остановку CLI, отдельное сохранение конфига/копий, read-only вычисление contentHash, сопоставление с записью конфига, восстановление только единственного совпавшего `old`, карантин отличающейся текущей копии без merge/overwrite, повторную проверку и удаление lock после согласования состояния. Для отсутствующей записи, отсутствующих/неоднозначных совпадений и потерянного/повреждённого конфига границы обозначены явно. Версии/хэши не предлагается подбирать или редактировать.

Точный JavaScript из README использует только Node.js stdlib; алгоритм совпадает с `files.ts#fingerprint`: отсортированные относительные пути, SHA-256 байтов каждого файла и SHA-256 JSON массива пар. Символические ссылки и необычные типы отвергаются. Скрипт доступен в README упакованного npm-пакета; `src/`, `test/`, `docs/` пользователю не нужны.

Независимо выполненный `recovery.test.ts` воспроизвёл исходную failure path: дочерний процесс завершился кодом 99 после замены skill-dir, перед config commit. Конфиг остался 1.0.0, установленная копия отличалась, backup совпал с config hash. Точный snippet README проверил копии; текущий каталог перемещён в карантин, `old` возвращён; hash восстановленной копии совпал с config. После удаления stale lock update до 2.0.0 прошёл с readback версии/hash; карантин остался сохранён. Журнал теперь правдиво ссылается на описанную процедуру.

## Независимые проверки

1. `pnpm --filter @kostysh/skills test` — exit 0; pretest build PASS; 15/15 тестов PASS, включая real child crash/recovery. Последовательность запускалась в disposable copy.
2. `pnpm --filter @kostysh/skills verify:package` — exit 0; tarball, чистая установка вне checkout, точный bin, npx/dlx, help/version, success/failure, install/update PASS. HTTP остаётся release-shaped test fixture.
3. `npm pack ./cli --ignore-scripts --pack-destination /tmp/kskills-docs-r2-9cogcimk --json` — exit 0. Архив `/tmp/kskills-docs-r2-9cogcimk/kostysh-skills-0.1.0.tgz` содержит ровно package.json, README.md, dist/cli.mjs и dist/cli.mjs.map. Recovery snippet извлечён именно из упакованного README.
4. Извлечённый snippet выполнен отдельно в `/tmp/kskills-docs-r2-9cogcimk/standalone`, вне checkout, без npm-зависимостей. Сверка с независимо вычисленным Python SHA-256 для вложенных Unicode/hidden/binary файлов и пустого каталога — PASS. Добавленная символическая ссылка дала ненулевой код и явную ошибку — PASS fail-closed. Скрипт только читает проверяемый каталог.
5. Проверены прямая согласованность README/help/public flags/exit codes и существование новых локальных ссылок журнала. Пакетные команды и workflows не расходятся с описанием. Граница локальных проверок, первого выпуска и OIDC сохранена.

## Пределы и следующий шаг

Локальное `verified` относится к проверенным руководствам и CLI/package boundary на Linux. HTTP fixture не подтверждает настоящий публичный GitHub/npm. Настройки и исполнение npm OIDC, macOS/Windows, запуск workflows и реальный published install/update остаются открытыми. Упаковка всех 37 реальных скилов и корневые quality gates после r2 в журнале обозначают авторские результаты; этим документационным re-audit они заново не присваиваются как независимые проверки.

Полноценные code/spec и security re-audits принадлежат соответствующим аудиторам. В журнале r2 независимость ещё обозначена как ожидающая; после получения заключений допустима запись фактических результатов, без превращения прежних авторских checks в независимые verdict.

Для обозначенной области docs больше не требуется исправлений. Следующий gate — остальные назначенные независимые заключения и фиксация их фактических результатов. Commit/push/публикация не выполнялись и этим PASS не разрешаются.
