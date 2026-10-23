# Независимый security delta-audit CLI: раунд 2

В исправленной области не найдено подтверждённых уязвимостей. **Статус: PASS (scoped).**

## Основание и стабильный охват

Режим: bounded remediation re-audit после первого FORMAL security PASS (scoped).
Оператор разрешил независимые аудиты и исправления до PASS; публикация не разрешена.
Simplicity r2 PASS получен до начала этого аудита: `/tmp/kskills-simplicity-r2-fkn6jhd6/simplicity-r2.md`.

Предыдущий snapshot: `9e772b48a194c4850b869a2098b0cb32070b7ee686a678f07a080346d2a64d30`, 36 файлов, `/tmp/kskills-audit-r1-nh38dhtq/snapshot`.
Текущий snapshot: `4121038c67c199a97836368da6972b0e8475442d2fc7fd25b3daad11d91827d0`, 39 файлов, `/tmp/kskills-audit-r2-uptasuuu/snapshot`.
База реализации: `3f520264a44ca610832bf42a6f9c536adc12b60c`.

Прочитан весь delta из восьми файлов: `cli/src/pack.ts`, `cli/src/network.ts`,
`cli/test/pack-network.test.ts`, `cli/test/crash-fixture.ts`, `cli/test/recovery.test.ts`,
`cli/README.md`, `cli/docs/implementation-log-20261023-1.md`,
`cli/docs/reviews/implementation-r1.md`.
Сравнение двух manifest подтвердило неизменность остальных 31 файлов.
Их ранее проверенная security-поверхность исключена из повторного полного аудита:
archive/files/model/installer/CLI/prompts, упаковочные entrypoint/build/package,
оставшиеся tests, workspace/lock/configs и четыре workflows. Предыдущее заключение
сохраняется для неизменённых файлов и исходных границ угроз.

Research scope: прежние исходники и вывод r1, текущая матрица исправлений,
контекст неизменённых fingerprint/transaction/extraction функций, simplicity r2.
Методика: security-reviewer и ранее прочитанные methodology/input/secrets-config/Actions references;
применены repository AGENTS, skill standard, принятый план и implementation-discipline.
Snapshot/worktree не изменялись; проверки выполнены только в disposable copy.

## Угрозы и границы

Внешние GitHub/API/catalog/archive данные пересекают границу записи на пользовательскую
файловую систему. argv/config выбирают назначение. Локальные изменения и конкурирующие
CLI могут повлиять на согласованность файлов/config. Tag workflows и release artifacts
образуют отдельную привилегированную границу.

Атакующему не приписывалась произвольная запись от имени пользователя в его HOME.
Доверие к автору самого релиза/пакета и к явно выбранным рабочим ресурсам не изменилось.
Ручное восстановление выполняет оператор после остановки CLI; оно не является новым
автоматическим механизмом обхода конфликтов или доверия к содержимому.

## Исправления и прямой security blast radius

- **F1 — pack resource validation.** Ранее это был code/spec finding, а не security
  finding. Прочитаны проверки Markdown links, конкретных code spans и shell blocks
  в SKILL/references, фильтрация примеров и вызовы safeRelative. Новые проверки
  только читают текст/файлы и блокируют выпуск при отсутствующем ресурсе; они не
  выполняют shell-команды и не создают динамические imports. Источник доверия к
  shipped scripts, содержимое архива, ограничения extraction и запись назначения
  не изменены. Проверены отрицательные cases assets/scripts/references и положительная
  упаковка/распаковка. Подтверждённого security finding нет.
- **F2 — normalized release URL.** Исходное наблюдение r1 было отдельно передано
  code/spec owner: SHA/contentHash уже защищали байты. Теперь pin сравнивает
  `new URL(s.url).href` с базой выбранного релиза, сохраняя прежнюю проверку канала.
  Исходный путь `x/../../skills-other/example.tgz` и encoded dot-segments отвергаются.
  Нормальный discovery и install/update продолжают работать. Новых endpoint/config
  overrides или ослабления проверок байтов нет. Подтверждённого security finding нет.
- **D1 — crash recovery guidance.** Проверен точный README script: только stdlib,
  только чтение, SHA-256 и JSON формата существующего fingerprint; входной путь не
  выполняется как код. Отпечаток учитывает вложенные/скрытые файлы и отказывает на
  symlink. Инструкция требует остановить CLI, сохранить все копии, найти ровно один
  old с записанным hash, сохранить текущую копию в карантине, не объединять/не
  перезаписывать каталоги, проверить восстановленный hash и лишь затем снять lock.
  Неоднозначность или повреждённый/отсутствующий config явно останавливают процедуру.
  Прерывание реального дочернего процесса до config commit, возврат backup, update,
  authoritative readback и сохранение карантина пройдены. Crash monkey-patch находится
  только в test fixture и не достигается из production entrypoint. Подтверждённого
  security finding нет.

## Подтверждённые findings и needs verification

Подтверждённых security findings нет. Конкретных security-гипотез с одним решающим
неизвестным фактом, требующих следующей проверки, не осталось. F1/F2/D1 не переименованы
в уязвимости; это повторная оценка их security-влияния, а не замена code/spec/docs verdicts.

## Независимые проверки

До запуска проверок сверены 39/39 индивидуальных SHA-256 файлов с manifest.
Disposable copy: `/tmp/kskills-security-r2-psbx0tbo/repo`; node_modules связаны с
исходными установленными зависимостями, установки/изменения зависимостей не выполнялись.

Команда с изолированными cache/data paths:

```sh
PNPM_HOME=/tmp/kskills-pnpm XDG_DATA_HOME=/tmp/kskills-xdg npm_config_cache=/tmp/kskills-npm-cache pnpm --filter @kostysh/skills test:ci
```

Exit 0: Vite build PASS, **15/15 tests PASS**. Включены три новых регрессии:
транзитивные конкретные resources, нормализованные/encoded URL и actual-crash recovery.
Лог: `/tmp/kskills-security-r2-psbx0tbo/test-security-r2.log`.

Для дополнительной security-границы нового README script выполнен отдельный
неразрушающий probe: hash вложенного скрытого файла совпадает с production fingerprint;
symlink на внешний sentinel вызывает отказ, содержимое sentinel и сама ссылка сохранены.
Лог: `/tmp/kskills-security-r2-psbx0tbo/recovery-negative.log`.

После проверок при закрытии аудита повторно сверены 39/39 hashes;
reviewed snapshot неизменен.

## Пределы и остаточный риск

PASS ограничен текущим delta и переносом прежнего scoped PASS только на доказанно
неизменённую поверхность. Он не является общим merge/release verdict, penetration test,
dependency scan, standards compliance или whole-system assurance.

Реальные npm scope/Trusted Publisher/OIDC settings, remote release/tag protection,
публичная публикация и macOS/Windows CI не проверены и не запускались. Тестовая HTTP
fixture подтверждает локальный consumer path, но не реальный GitHub/npm выпуск.
Авторскую повторную упаковку/распаковку всех 37 настоящих скилов этот security delta-audit
не повторял; это не требовалось для неизменённого extraction boundary.

DB, raw SQL, REST/PostgREST, SDK data-access, RPC, RLS и service-role paths отсутствуют;
соответствующая проверка неприменима. Auth/backend/browser/telemetry не добавлены.

**Статус: PASS (scoped).** Следующий владелец — root и независимые code/spec/docs reviewers
для своих gates; Git-интеграция и публикация сохраняют отдельные полномочия оператора.
