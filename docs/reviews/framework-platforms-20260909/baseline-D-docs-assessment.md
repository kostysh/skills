# Независимая оценка baseline D-docs (D2)

**Вердикт: PASS ограниченного Docusaurus → documentation consumer сценария.** Свежий исполнитель использовал готовый producer snapshot, выбрал documentation и docusaurus-repo из предоставленного каталога, написал краткую английскую how-to, проверил реальные success/error/help локального CLI и отрисованную страницу в production preview. Изменён только разрешённый current EN документ. Неустранённых P1/P2 в пределах D2 не обнаружено.

Установка проверена как **frozen offline install из имеющегося cache**. Это не буквальное выполнение пользовательской команды без `--offline` и не cold-cache/online проверка реестра. Для данного задания это граница доказательства, а не провал D2: внешние сервисы запрещены, локальная установка успешно состоялась, CLI выполняется точно по документированным командам, зависимости и lockfile неизменны. Формулировка PASS не включает доступность registry или bootstrap нового окружения.

## Scope и source-authority

Задание и критерии: `protocol/D-docs.json` / `/tmp/framework-platforms-20260909/trials/baseline/D-docs/task.txt`; consumer исходного завершённого `baseline D-runtime`, без чужих report/rubric. Оценщик `/root/baseline_next_electron_docs` независим от автора `/root/baseline_docusaurus_docs_executor`.

Прочитаны исходный CLI и все три fixtures, итоговая страница, site/task rules, supporting source/config, оба harness, все 8 runtime-записей с stdout/stderr, четыре browser reports и весь публичный trace. Два финальных скриншота просмотрены независимо. Оценщик не запускал build/install/runtime/browser, не менял приложение и не привлекал агентов.

Документ называет рабочий каталог, prerequisites Node.js 20+ и pnpm 10.28.2, отделяет зависимости сайта от dependency-free CLI, даёт успешный вызов, намеренную ошибку, stdout/stderr/exit и исправление ошибки, ссылку на help/reference. How-to соответствует работе читателя и сохраняет существующие front matter, reference link и Mermaid. Прежнее Node 20+ условие сохранено; фактически runtime проверен только на Linux Node **24.20.0**, не на всех поддерживаемых версиях. Никакой установленный npm bin не обещан: объект — поставленный `tools/greet.mjs`.

## Producer handoff и сохранность

Все **35** начальных source-файлов consumer побайтно совпадают с финальным манифестом и текущими source-файлами producer D-runtime. Все **336** frozen build inputs совпадают с финальным producer build manifest. Это подтверждает действительный handoff существующего результата, а не отдельно созданный lookalike.

В protocol **400 frozen inputs**. Все non-build inputs остались неизменными, кроме `app/docs/installation.md`. Итоговый source inventory равен before/after manifests: **35 файлов, одно изменение, 34 сохранены, ноль добавлений/удалений**. CLI, fixtures, package/lock, config, sidebars, published 1.0 и все authored locale files неизменны. Производные build/.docusaurus/node_modules менялись при разрешённых проверках; их нельзя считать нарушением source scope.

- Итоговый installation SHA-256: `f95890e0096ccd7428d0d2493b5677581d157364ea10aee6c901635130fd01ea`.
- Source aggregate SHA-256: `dabe193e63cad1b30eba01ed407c4dd0aabdbbbb5adf4a6cc23087bd591b1217`.
- Текущий build: 336 файлов, aggregate SHA-256 `b21478ae84ed19ff4d21b7bb0e24085430b3f1aaa5f5e162ccc919f3d9da8f5e`.

Aggregate считается по каноническому JSON path→file SHA-256 с sort_keys и separators `(',', ':')`. Это независимый текущий snapshot; исполнитель не поставлял отдельный final build manifest. Trace подтверждает одну финальную сборку после изменения документа и отсутствие дальнейших source/build mutations перед browser evidence. Все **23** entries `evidence.sha256` совпадают, включая raw commands, CLI/browser results, screenshots и harness.

Детали: `baseline-D-docs-snapshot.json`, где записаны все source/build/input/evidence hashes и producer comparison. Сохранение authored locales не означает byte identity всего regenerated HTML: fallback содержимое может получать текущий EN источник в соответствии с сохранённой конфигурацией.

## Реальный CLI и установка

Запись 2 запускает `node ../verify-cli.mjs`. Harness использует `spawnSync(process.execPath, ['tools/greet.mjs', ...fixture.argv])` и сравнивает независимо **exitCode, stdout, stderr** с неизменёнными fixtures; actual process result не подменён ожидаемыми значениями. Сохранённый JSON точно совпадает с stdout runtime-записи.

| Вызов локального CLI | stdout | stderr | Exit |
| --- | --- | --- | --- |
| `node tools/greet.mjs --name Ada` | `Hello, Ada!\n` | пуст | 0 |
| `node tools/greet.mjs` | пуст | `Usage: greet --name NAME\n` | 2 |
| `node tools/greet.mjs --help` | полный usage/options text, точно равный help fixture, с завершающим LF | пуст | 0 |

Документированные success/error текст и коды совпадают с этими результатами и исходным CLI. Help реально исполнен; полной цитаты help в how-to не требуется. Это meaningful contract проверка для запрошенных трёх ветвей, не exhaustive тест парсера аргументов.

Запись 1: `pnpm install --frozen-lockfile --offline`, exit 0, **1.857 s**, добавлено 1321 package, downloaded 0. Документ показывает `pnpm install --frozen-lockfile`; последний вариант без offline отдельно не запускался. Проверены разрешение pinned lock и локальная установка из подготовленного store. Не доказаны чистый cache, скачивание из registry, установка pnpm/Node или все платформы. Наличие offline-модификатора отражено в отчёте исполнителя и здесь; evidence не переименовано в точную online команду. Запрет внешних сервисов не расширен ради дополнительных проверок.

## Production evidence и обязательные проверки

| Runtime запись | Результат и смысл |
| --- | --- |
| 1 | Frozen offline install exit 0; dependency/runtime source сохранён. |
| 2 | CLI success/error/help exit 0 у harness, точное соответствие fixtures; 0.222 s. |
| 3 | Declared `pnpm format`, exit 0; все author files уже formatted. Write-mode разрешён контентной задачей, фактической перезаписи соседей нет. |
| 4 | `pnpm docs:quality`, exit 0, **158.661 s**: format:check, markdownlint 16 MD/MDX без ошибок, production build en/it/fr и локальные индексы. |
| 5–7 | Три сохранённых browser failures, описаны ниже. Сайт не менялся. |
| 8 | Полный финальный browser pass, exit 0, **14.342 s**, 13 assertions/check groups. |

Browser harness обслуживает готовый build через declared `pnpm run serve --host 127.0.0.1 --port 18541 --no-open`; повторной сборки при preview нет. Chromium реально проверяет:

- HTTP 200 current EN installation, текст install/success/error и reload;
- существующий reference link, MDX Shell tab и возврат по sidebar;
- Mermaid SVG; независимо просмотренный screenshot подтверждает именно диаграмму, поскольку автоматический selector `main svg` сам по себе шире Mermaid;
- поиск `greeting` со страницы reference, настоящий listbox result и переход на Installation;
- language menu → French Installation с сохранённым fragment, version menu → published 1.0;
- direct URL/reload пяти EN/IT/FR current/published страниц.

Финальные `consoleErrors`, `pageErrors`, `failedRequests`, `externalRequests` пусты и проверяются assert. External requests перехватываются/отклоняются; их отсутствие означает отсутствие попыток в проверенном browser context. Отдельного глобального HTTP ≥400 listener нет: status 200 проверен на основных direct loads, остальные состояния поддержаны DOM/assertions и отсутствием console/request failures. `searchLinks` в JSON собран широким dropdown selector и содержит nav links; доказательство реального search-click — отдельный listbox locator, ожидание URL и screenshot, а не эта вспомогательная коллекция.

`installation-production.png` показывает все новые команды, stdout/stderr/exit explanations и diagram читаемо в существующей странице. `search-production.png` показывает актуальные результаты «Print a greeting» / «Check an error» для Installation. Production page не выдана за опубликованный сайт; remote CI, dev server, отдельный typecheck и все браузеры не проверялись и не нужны для изменения одной контентной страницы при выполненных обязательных format/lint/build.

## Сохранённые отказы и причины

1. Запись 5: exact heading locator `Check an error` не совпал с accessible name, включающим anchor `Direct link to Check an error`. Trace 61/62 показывает соответствующий rendered h2. Исправление — regex name без удаления проверки наличия heading; попытка сохранена отдельно.
2. Запись 6: поиск ожидал input до открытия detached modal. Сохранённый HTML показывает `aa-DetachedSearchButton` с title Search. Harness начинает с реального клика кнопки, затем вводит query и кликает конкретный listbox result. Это исправление проверки по наблюдаемому UI, а не отключение поиска.
3. Запись 7: exact URL не учитывал сохраняемый `#print-a-greeting`; HTML/body уже французской страницы подтверждают переход. Финальный harness проверяет точный pathname, а `localeUrlAfterClick` сохраняет фактический fragment. Требование той же страницы/локали осталось прежним.

Финальный проход содержит все 13 групп; source-поправок после первоначального документа/сборки нет. Неудачи не скрыты и не представлены как product defects. Из initial harness дополнительно усилены search-click, version/locale navigation и проверки console/request errors.

Warnings унаследованы от producer: ignored core-js script, landing pages без main и повторная регистрация Lunr filters. Они отражены в raw logs; изменённая страница проиндексирована и найденa в браузере. В preview log ELIFECYCLE появляется после намеренного SIGTERM server group в finally; harness закрывает browser, ждёт выхода server, сохраняет logs и заканчивается exit 0. Глобальное отсутствие оставшихся процессов независимо не проверялось.

## Catalog и provenance

Trace сначала читает только task/catalog, затем выбирает и читает **documentation + docusaurus-repo**, после чего использует content-authoring и deployment/versioning/i18n references. TypeScript skill из каталога не загружен: задача не меняет type contracts. Это наблюдаемая релевантная пара владельцев среди **трёх** доступных описаний; результат не обобщается на весь глобальный каталог и не засчитывается как negative-trigger suite.

CLI/Node specialists в предоставленном каталоге отсутствуют. Staged documentation, стадия `Produce the requested deliverable`, пункт 5 прямо разрешает при недоступном соседе продолжить accepted facts/direct checks с указанием непроведённой specialist assessment. Исполнитель эту границу указал и не заменял проверку запуска typecheck/build. Нужды в дополнительном агенте или изменении продукта не возникло.

Свежий session `01a08679-84ce-7c22-b736-ce570ecaba02`, recorded gpt-6-astra/high, spawn fork_turns:none. Проверены все **98 публичных tool events** и их hash соответствие manifest. В observed calls нет чтений другого trial/candidate/rubric/canonical skills; producer данные пришли как frozen local inputs. Полный plaintext spawn и одного coordinator message недоступен экспорту, поэтому полная доставка инструкций/отсутствие всех возможных подсказок независимо не удостоверена. Natural catalog selection подтверждено наблюдаемой последовательностью, с этой общей provenance-границей.

## Итоговая граница

D2: **PASS** существующей how-to → actual local CLI → production-page цепочки и ограниченного natural выбора documentation/Docusaurus. Source-review baseline docusaurus остаётся FAIL; эта успешная проба не устраняет его технические находки и не доказывает улучшение candidate. Online/cold-cache install, установленный published bin, remote deployment/CI и полный runtime/browser matrix в PASS не входят.
