# Независимый security delta-audit CLI: раунд 3

В изменённой области не найдено подтверждённых уязвимостей. **Статус: PASS (scoped).**

## Основание и охват

Режим: bounded remediation re-audit после r2 security PASS (scoped).
Оператор поручил независимые аудиты с исправлениями до PASS; публикация не разрешена.
Simplicity r3 PASS получен до начала security audit:
`/tmp/kskills-simplicity-r3-sh48svf1/simplicity-r3.md`.

Предыдущий snapshot r2: `4121038c67c199a97836368da6972b0e8475442d2fc7fd25b3daad11d91827d0`,
39 файлов, `/tmp/kskills-audit-r2-uptasuuu/snapshot`.
Текущий snapshot r3: `b4584956beeef62fa3999ddc80df28da5705200a135403ce62d41f7f9ce9c3ce`,
44 файла, `/tmp/kskills-audit-r3-xkixadkc/snapshot`.
База реализации: `3f520264a44ca610832bf42a6f9c536adc12b60c`.

Прочитан полный delta из восьми файлов: `cli/src/pack.ts`,
`cli/test/pack-network.test.ts`, `cli/docs/implementation-log-20261023-1.md`,
`cli/docs/reviews/code-spec-r2.md`, `documentation-r2.md`, `manifest-r2.json`,
`security-r2.md`, `simplicity-r2.md`.
Новый экземпляр security-r2.md совпадает с собственным исходным отчётом;
manifest-r2.json совпадает с первоначальным manifest r2.

Сравнение manifest подтвердило неизменность остальных 36 файлов. Их прежнее
security-покрытие сохраняется; полный повторный аудит исключён для network,
installer, archive/files/model, production CLI/prompts/build/package, README recovery,
остальных tests, dependencies/lock/workspace/config и четырёх workflows.

Research scope: контекст safeRelative, regularFiles, archive containment, прежние
F1/F2/D1 выводы, r2 отчёты и текущая remediation matrix. Для оценки вновь сохраняемой
поверхности agents просмотрены структура 33 YAML metadata существующих скилов,
представительные interface/default_prompt и все найденные dependencies/policy declarations.
Это исследование границ упаковки, а не отдельный аудит качества инструкций 37 скилов.
Применены ранее прочитанные security-reviewer methodology/input/secrets-config/Actions,
repository AGENTS/skill standard, принятый план и implementation-discipline.

## Угрозы и проверенная граница

Модель угроз r1/r2 сохранена: внешние GitHub/API/catalog/archive данные доходят до
пользовательской файловой системы; argv/config выбирают назначение; локальные
изменения/конкурирующие CLI влияют на state consistency; tag workflows и release
artifacts пересекают отдельную привилегированную границу. Произвольная запись
атакующего от имени пользователя в HOME не предполагалась.

Delta затрагивает publisher-side проверку литеральных ссылок и отбор файлов.
Недоверенный текст не должен выполнять команды или разрешать чтение/включение
ресурса вне папки скила. Появление agents metadata не должно обходить existing
symlink/типовые ограничения, границу архива или превращаться в установку инструментов.

## Анализ исправлений и security blast radius

**F1: извлечение и нормализация.** Это сохранённый code/spec finding, не security finding.
Одна literalResources используется для inline-команд и shell blocks; она извлекает
литеральные пути, но не исполняет команды. Bare/./ paths разрешаются от корня скила;
../ paths — от документа. После Node resolve/relative вызывается safeRelative, затем
проверяется membership в уже отобранном наборе. Выход из корня остаётся запрещён;
существование внешнего файла не делает его допустимым. Подстроки ../ внутри пути
не передаются напрямую tar как выбранные имена. Неподдерживаемый синтаксис текста
сам по себе не даёт атакующему нового файлового или execution sink.

**Примеры.** Исключение ограничено началом текущей фразы перед code span; shell
literals проверяются всегда. Изменённая классификация может блокировать или разрешать
упаковку по её contract, но не меняет полномочия чтения/записи и не интерпретирует
команды. Исходные и соседние ./, ../, quoted/flag, mandatory+example cases проверены
поведенчески. Отдельный code/spec verdict остаётся за owning reviewer.

**agents metadata.** Фильтр developmentName теперь проверяет basename файла;
папка agents не классифицируется как служебный AGENTS файл. Рабочая metadata
сохраняется, agents/README.md исключён; исключения docs/node_modules/.git и assets
остались прежними. regularFiles по-прежнему отвергает symlinks и необычные типы
до fingerprint/tar. Проверенные YAML metadata описывают host interface; найденная
MCP dependency Pencil и policy allow_implicit_invocation не исполняются упаковщиком.
CLI не устанавливает дополнительные инструменты и не получает новые права от этих
деклараций. Доверие host к самим инструкциям/metadata не расширяет authority CLI.
История contentHash и запрет изменения опубликованной версии не ослаблены.

**Подтверждённых security findings нет.** Не осталось конкретных security-гипотез
с одним решающим неизвестным фактом. Предыдущие non-security findings не
переименованы в уязвимости; этот PASS не закрывает чужие code/spec/docs gates.

## Независимые проверки

Перед проверками сверены 44/44 индивидуальных SHA-256 с manifest; установлены ровно
8 изменённых/добавленных файлов. Snapshot/worktree не изменялись, делегирования не было.
Disposable copy: `/tmp/kskills-security-r3-74ulwdqz/repo`, существующие node_modules
связаны symlinks; зависимости не устанавливались и не менялись.

```sh
PNPM_HOME=/tmp/kskills-pnpm XDG_DATA_HOME=/tmp/kskills-xdg npm_config_cache=/tmp/kskills-npm-cache pnpm --filter @kostysh/skills test:ci
```

Exit 0; Vite build PASS; **16/16 tests PASS**, без skips/cancellations.
Новый table-driven test проверяет 15 negative forms, положительный pack/extract,
все четыре resource directories, metadata readback, исключение agents/README и traversal.
Прежние archive/config/rollback/concurrency/process/recovery регрессии проходят.
Лог: `/tmp/kskills-security-r3-74ulwdqz/test-security-r3.log`.

Дополнительно независимо выполнен containment probe: реально существующий внешний
sentinel через ../../../assets отвергается safeRelative; symlink в agents на тот же
sentinel отвергается regularFiles. Sentinel сохранён. Лог:
`/tmp/kskills-security-r3-74ulwdqz/containment-probe-corrected.log`.
Первый probe имел ошибку fixture layout (лишняя папка в корне набора скилов приводила
к ENOENT до нужной границы); layout исправлен без изменений target source, после чего
обе проверки прошли. Ошибка fixture не использована как доказательство защиты.

При закрытии аудита повторно сверены 44/44 hashes: reviewed snapshot неизменен.

## Пределы и следующий владелец

PASS ограничен r3 delta и доказанно неизменённой security-поверхностью прежних PASS.
Это не общий merge/release verdict, penetration test, dependency scan, standards
compliance или whole-system assurance. Runtime/meta semantics конкретных host agents
не испытывались. Авторскую упаковку 37 реальных архивов и byte-readback всех 33
metadata этот bounded audit независимо не повторял; его independent boundary evidence
— настоящий pack/extract fixture и дополнительные containment probes.

Реальные npm scope/Trusted Publisher/OIDC settings, remote tag/release protection,
macOS/Windows CI и публичная GitHub/npm publication/install/update не проверены и не
запускались. HTTP fixture подтверждает только локальный consumer path.
DB/raw SQL/REST/PostgREST/SDK data-access/RPC/RLS/service-role paths отсутствуют;
соответствующая проверка неприменима. Backend/auth/browser/telemetry не добавлены.

**Статус: PASS (scoped).** Следующий владелец — root и независимые code/spec/docs
reviewers для своих gates. Отдельные полномочия на Git-интеграцию и публикацию сохраняются.
