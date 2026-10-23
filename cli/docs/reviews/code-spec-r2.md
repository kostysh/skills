# Независимый bounded code/spec re-audit: раунд 2

F2 закрыт, исходные примеры F1 исправлены, но тот же дефект F1 сохраняется в непосредственном соседнем синтаксисе обязательных путей. Локальный implementation gate — FAIL. Общие проверки CLI проходят; это не устраняет подтверждённый дефект упаковки.

## Основание, authority и границы

Оператор прямо поручил независимые аудиты и исправления до PASS. Повторный аудит начат после независимого PASS простоты r2 (`/tmp/kskills-simplicity-r2-fkn6jhd6/simplicity-r2.md`). Ревью read-only; snapshot и original worktree не менялись. Проверки с записью выполнены в disposable copy `/tmp/kskills-code-spec-r2-ugvud2an/repo`; зависимости подключены read-only symlinks из существующего worktree. Runtime Linux, Node v24.21.0, pnpm 10.28.2.

- База реализации: `3f520264a44ca610832bf42a6f9c536adc12b60c`.
- Предыдущий snapshot: `9e772b48a194c4850b869a2098b0cb32070b7ee686a678f07a080346d2a64d30`, 36 файлов.
- Текущий snapshot: `/tmp/kskills-audit-r2-uptasuuu/snapshot`, manifest SHA identity `4121038c67c199a97836368da6972b0e8475442d2fc7fd25b3daad11d91827d0`, 39 файлов.
- Нормативный источник: принятый оператором `PLAN.md`, SHA-256 `1f97f138a875264a4b302b83fe06d1160326ed425ee52f17bf67891eb1fd11db`; дополнения оператора о custom target и готовых скилах/рабочих assets действуют. План неизменен. Авторские tests/logs — evidence, не новая authority.
- Прочитан полный delta r1→r2: `cli/src/pack.ts`, `cli/src/network.ts`, `cli/test/pack-network.test.ts`, `cli/README.md`, `cli/docs/implementation-log-20261023-1.md`; новые `cli/test/crash-fixture.ts`, `cli/test/recovery.test.ts`, `cli/docs/reviews/implementation-r1.md`. Все 8 файлов accounted/read. Остальные 31 файл unchanged и сохраняют ранее установленное покрытие; повторный полный аудит неизменённых требований не выполнялся.
- Непосредственный blast radius: извлечение обязательных literal resources, эквивалентные относительные пути, исключение иллюстративного текста, selected-release URL validation, test-only crash lifecycle и точный README recovery snippet. Это не общий парсер программ/естественного языка и не повторный аудит всех скилов.
- Перед отчётом все 39 индивидуальных SHA-256 проверены повторно: mismatches отсутствуют; hash плана совпал.

## Сохранённые первоначальные findings и результат

### F1 (r1), major — транзитивные обязательные ресурсы

Требование **R-PACK-DEPS**, `must`, `explicit`, функциональная проверка выпуска: «Сохранить … транзитивные рабочие зависимости. Отсутствующий обязательный ресурс блокирует выпуск».

Исходный witness: SKILL.md требует references/workflow.md; workflow требует прочитать `assets/missing.md` и выполнить fenced shell-команду `node scripts/missing.mjs`. Оба файла отсутствуют, но r1 packSkills создавал каталог и архив. В r1 `pack.ts:33` удалял fenced blocks целиком, `pack.ts:47–51` проверял inline paths только в SKILL.md. Последствие — выпуск скила без обязательного ресурса, с которым его нельзя выполнить.

r2 закрывает оба исходных witness: пакет отвергается с `references/workflow.md: отсутствует ресурс assets/missing.md` и `... scripts/missing.mjs`. Новый positive test также пакует/распаковывает существующий script и сохраняет явно иллюстративные examples.

**F1 остаётся открыт — major, high confidence; R-PACK-DEPS `not_fulfilled`.**

Непосредственные соседние witness, независимо выполненные тем же packSkills:

1. Required fenced shell command `node ./scripts/missing.mjs` — **ACCEPTED**, архив создан без script.
2. ``For every operation, first read `../assets/missing.md` relative to this file.`` в `references/workflow.md` — **ACCEPTED**, архив создан без asset.
3. ``For every operation, first read `assets/missing.md`; for example, this also applies to updates.`` — **ACCEPTED**, архив создан без asset.

Локализация r2: `cli/src/pack.ts:33` допускает только bare `assets|scripts|agents|references/`, `cli/src/pack.ts:72` извлекает только bare shell path; `cli/src/pack.ts:59` пропускает всю строку при любом совпадении illustrative regex из строки 30. Поэтому эквивалентный путь `./scripts/...` не распознаётся, relative inline path не разрешается относительно reference, а явное обязательство исчезает из проверки из-за пояснения «for example». Для первого witness не нужна интерпретация естественного языка: `scripts/missing.mjs` и `./scripts/missing.mjs` — один файл при том же cwd.

Вывод исходной неисправности сохранён; это не новое требование поддерживать произвольные языки, AST, source compiler или все варианты человеческой речи. Исправление остаётся внутри accepted checkLinks поверхности. Нужно нормализовать поддерживаемые конкретные path forms до одной проверки bundled path и не исключать явное обязательство из-за произвольного слова elsewhere в строке. Проверить исходный negative witness, эти прямые варианты, positive existing resources, historical/illustrative exclusions и реальные 37 скилов.

**Repeated-related blocker:** это второй раунд той же R-PACK-DEPS неисправности. Перед следующей точечной правкой требуется исследование причины и полного пути extraction→resolution→classification→included-set check. Простое добавление отдельных regex exceptions без проверки этой цепочки не закроет требуемый root-cause этап. Достаточен компактный разбор в текущем журнале; новый registry/Issue/AST/harness не требуется.

Постоянные tests r2 проходят, но не содержат перечисленных трёх форм; поэтому зелёные tests не опровергают witness. Независимый probe: `/tmp/kskills-code-spec-r2-ugvud2an/f1-probes.ts` (вне package test/lint surface).

### F2 (r1), major — фиксация выбранного релиза

Требование **R-RELEASE-PIN**, `must`, `explicit`, invariant: CLI выбирает один стабильный опубликованный релиз скилов и фиксирует его на всю операцию.

Исходный witness: `.../skills-current/x/../../skills-other/example.tgz` принимался raw `startsWith(base)`, хотя fetch нормализует URL в другой релиз. `isPublishedUrl` уже использовал нормализованный URL, но проверка конкретного release — исходную строку. SHA/contentHash защищали bytes; это не объявлялось security vulnerability.

**Закрыт.** r2 `cli/src/network.ts:63` сравнивает `new URL(s.url).href.startsWith(base)`. Нормализация теперь совпадает с моделью WHATWG URL/fetch. Прямой и percent-encoded dot-segments witnesses отвергнуты regression tests; положительное discovery и built process install/update проходят. Новый namespace/source/protocol не добавлен. Для этого bounded correction R-RELEASE-PIN — `fulfilled` в локальном contract-conformant контуре; публичная GitHub boundary отдельно не проверена.

## D1 и non-spec code review

D1 принадлежит documentation owner; здесь проверена только новая исполняемая test/recovery поверхность и её риск для кода. Child fixture прекращается exit 99 до rename config; изменения built-in fs exports живут только в отдельном дочернем процессе. Тест подтверждает config 1.0.0, отличающиеся установленные файлы, оставшийся lock/old, затем выполняет точный stdlib-only snippet из README, делает quarantine/restore, update/readback и сохраняет quarantine. 15-й тест проходит. Дополнительного non-spec code finding не подтверждено. Это не присвоение отдельного documentation verdict и не доказательство всех аварийных состояний.

No findings в отдельной non-spec code части. Общая recommendation остаётся request changes из-за подтверждённого in-scope code/spec blocker F1.

## Requirement traceability и внешние limits

| Требование | Origin / modality | r2 outcome | Evidence / limit |
| --- | --- | --- | --- |
| R-PACK-DEPS: обязательный отсутствующий ресурс блокирует выпуск | explicit / must | `not_fulfilled` | исходные cases исправлены; три direct adjacent witnesses всё ещё публикуют broken package |
| R-RELEASE-PIN: один selected stable release на операцию | explicit / must | `fulfilled` в bounded local contour | normalized comparison, negative encoded/unencoded cases, positive discovery/process tests |
| R-STATE / R-ROLLBACK / R-CONFLICT: сохранить пользовательские файлы/config | explicit / must | прежние conclusions unchanged | production installer unchanged; regression suite и новая interrupted process recovery проверка PASS |
| R-PACKAGE / R-INTERFACE: packed CLI/install/update/outputs | explicit / must | прежние local conclusions unchanged | build, tests, verify:package PASS; production change network.ts проверена положительным process path |
| R-THREE-OS: process checks Linux/macOS/Windows | explicit / must | `cannot_determine` | Linux выполнен; macOS/Windows не выполнялись; workflows — substrate |
| R-LIVE: real GitHub/npm и опубликованный package install/update | explicit / must | `cannot_determine` | test-only release-shaped preload не проверяет live assets/npm/OIDC; публикация не разрешена |

Остальные 31 unchanged files/ранее проверенные requirements исключены из повторного полного анализа по bounded re-audit policy, не потеряны из coverage. Авторское evidence всех 37 реальных скилов и unchanged hashes рассмотрено как supplied evidence; независимо повторно все 37 здесь не паковались. Успешная упаковка текущих 37 не отменяет обязательные отрицательные cases release checker.

## Независимые проверки

В disposable copy выполнено через package commands с PNPM_HOME=/tmp/kskills-pnpm, XDG_DATA_HOME=/tmp/kskills-xdg, npm_config_cache=/tmp/kskills-npm-cache:

- `pnpm --filter @kostysh/skills test` — PASS, 15/15, build PASS.
- `pnpm --filter @kostysh/skills lint` — PASS, включает typecheck.
- `pnpm --filter @kostysh/skills format:check` — PASS.
- `pnpm --filter @kostysh/skills verify:package` — PASS: tarball/isolated install/bin/npx/pnpm dlx/install/update/error; HTTP test-only fixture.
- `node /tmp/kskills-code-spec-r2-ugvud2an/f1-probes.ts` — исходные F1 cases REJECTED, три перечисленные соседние формы ACCEPTED.
- Manifest readback 39/39 и normative plan hash — unchanged.

Полный root workspace suite не повторялся: root и skill packages unchanged в r2; это не пропуск changed mandatory package checks. Tests не предупреждали, не зависали, не содержали skips. Новые external actions, commit/push/tag/publish не выполнялись.

## Заключение и handoff

**Локальный implementation gate: FAIL** — R-PACK-DEPS F1 остаётся воспроизводимым. F2 закрыт. Это gate покрытой локальной реализации, не отдельный security/documentation или public release verdict.

**Formal conformance verdict: non-compliant.** Обязательное R-PACK-DEPS `not_fulfilled` определяет verdict; одновременно R-THREE-OS и R-LIVE остаются `cannot_determine`. Если F1 будет закрыт, эти внешние evidence gaps всё равно не позволят присвоить всему принятому плану compliant/compliant with minor gaps; без иных обязательных нарушений итог для целого плана будет `cannot determine due to insufficient implementation evidence`. Отсутствие publish authority не исправляется самовольной публикацией и не требует выдумывать полномочия на внешний CI.

Remediation owner — автор реализации; источник разрешения — поручение оператора исправлять findings. Следующий шаг: ограниченное root-cause исследование F1, минимальная правка, её negative/positive evidence, новый стабильный snapshot и bounded independent re-audit.

Review basis: base `3f520264a44ca610832bf42a6f9c536adc12b60c`, prior snapshot `9e772b48a194c4850b869a2098b0cb32070b7ee686a678f07a080346d2a64d30`, current snapshot `4121038c67c199a97836368da6972b0e8475442d2fc7fd25b3daad11d91827d0`.
Scope: bounded 8/8 delta files read; 31 unchanged files retain r1 coverage; explicit direct blast radius reviewed; 39/39 manifest hashes unchanged.
Evidence: independent build+15 tests, lint/typecheck, format, packed installed command verification, targeted negative probes, full delta inspection.
Limits: live GitHub/npm/OIDC/publication/macOS/Windows unverified; no separate security/documentation verdict issued; all37 author evidence not independently repeated.
Recommendation: request changes
