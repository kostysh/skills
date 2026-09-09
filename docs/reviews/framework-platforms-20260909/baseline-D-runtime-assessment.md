# Независимая оценка baseline D-runtime

**Вердикт: PASS в границах D1/D3/D4 — локальная production-механика существующего сайта.** Подтверждены французские страницы, локальный поиск, Mermaid, сохранение `/manual/`, current/1.0 и исходного EN/IT контента, а также работающие check-only проверки авторских файлов. Неустранённых P1/P2 в предъявленном результате этой пробы не найдено. Это не итоговый PASS навыка: source-review `baseline-docusaurus-review.md` остаётся FAIL до устранения его находок и оценки candidate.

Оценщик `/root/baseline_next_electron_docs` не является исполнителем `/root/baseline_docusaurus_runtime_executor`. Проверены завершённые артефакты, применимый публичный tool-trace, код проверок, stdout/stderr всех 23 runtime-записей, исходники, установленная публичная metadata пакетов и четыре скриншота. Оценщик не запускал runtime/build/install/browser, не изменял приложение, не читал private environment/profile и не делегировал работу. Вердикт основан на сохранённой фактической работе исполнителя.

## Объект и неизменность

Задание: `protocol/D-runtime.json`, неизменный `app/REQUIREMENTS.md`, критерии D1/D3/D4 из `case-proposals-next-electron-docusaurus.md`. D2 — отдельный реальный documentation/CLI consumer; D5 — legacy; D6 — отдельный ответ о неполных доказательствах. Они здесь не оценены и не засчитаны.

Проба: `/tmp/framework-platforms-20260909/trials/baseline/D-runtime`. Сохранены Docusaurus **3.10.2**, React/React DOM **19.2.8**, TypeScript **5.9.3**, pnpm **10.28.2**. Core/preset/react проверены также по установленным package manifests. Runtime использовал записанную контейнерную инфраструктуру Node 24 / Playwright 1.63.0.

Все **52** frozen inputs сверены. Изменены только четыре разрешённых исходных файла: package, lockfile, Docusaurus config и tsconfig. Остальные входы, включая требования, homepage, sidebars, published pages, CLI и все предоставленные skills, совпадают. Новые файлы находятся в разрешённом scope.

Все **35** итоговых source-файлов и отдельный staged `SKILL.md` совпадают с `final-hashes.json`. Полный source inventory совпадает; лишних probes нет. Все **336** production build files совпадают с `build-hashes.json`, включая отсутствие лишних/пропущенных файлов. Все **12** сохранённых EN/IT/current/1.0/CLI/fixture файлов совпадают с before/after и текущими bytes.

- Source aggregate SHA-256: `a2b347e3ac4583ce906ac566bdb4b5941df03e1096e5e62cf3ce5552228624b1`.
- Build aggregate SHA-256: `1242895eaeb087bfd786151672aaba6d2fb62298c3cd86ee979d5f010470c374`.
- Алгоритм: SHA-256 канонического JSON path→SHA-256 с сортировкой ключей и separators `(',', ':')`.

До запуска исполнителя координатор симметрично исправил два дефекта входной fixture: удалил package-level `type: module` после SSR `require.resolveWeak` и добавил baseUrl-aware homepage redirect. Обе поправки записаны в `protocol.input_updates`. Это подготовка инфраструктуры, не finding baseline-навыка; требования и CLI `.mjs` сохранены.

Полный readback: `baseline-D-runtime-snapshot.json`, содержащий source/build hashes, разрешённые изменения, installed metadata, публичные evidence hashes и protocol/trace identity.

## Критерии и наблюдения

| Критерий | Реальные доказательства | Оценка и граница |
| --- | --- | --- |
| D1: production сайт | Финальная запись 21: `pnpm run docs:quality`, exit 0, 24.697 s; Prettier/markdownlint проверили 16 MD/MDX, production build en/it/fr завершён. Запись 22 запускает declared `serve` для готового build, exit 0, 16.509 s. | PASS локального built preview, не remote deployment. |
| D1: baseUrl, MDX, Mermaid | `browser-interaction.mjs:24` проверяет точные path после клика; `:55` нажимает Shell tab и проверяет его содержимое; `:59` требует ровно один Mermaid SVG. Root readiness и последующие запросы не дали HTTP ≥400/внешних запросов. | PASS проверенных маршрутов/компонентов, не всех состояний сайта. |
| D1/D4: local search | Восемь финальных случаев: EN current/1.0, IT current/1.0, FR current/1.0, product, api. Каждый открывает реальный поиск, вводит query, получает result links, нажимает подходящий результат, ожидает точный path, делает reload и считывает H1. | PASS поиска по заданным сценариям, не полноты ранжирования/всех запросов. |
| D4: locale/version | FR introduction/installation/reference в current, FR introduction/reference в 1.0. Входного installation в старой версии не было: его не выдумывали. Браузер переключает FR→EN на той же current introduction, затем Next→1.0 с проверкой URL. | PASS существующей version-модели и новых страниц. |
| D4: direct URL/reload | Запись 12 / `browser-initial.json`: 12 загрузок, HTTP 200, H1 совпадают до/после reload; root, EN/IT/FR current/1.0, installation/reference, product/api. После последней сборки запись 22 повторно проверяет восемь search-click/reload случаев и дополнительные страницы MDX/diagram/меню. | PASS с границей времени: вся первоначальная 12-route capture после финальной сборки не повторялась. `browser-final.pages` пусто и не выдаётся за новую матрицу. |
| D3: author roots | Globs MD/MDX охватывают docs/product/api/i18n/versioned_docs. Запись 16: formatter/linter × шесть roots, включая FR current, EN versioned и IT versioned; в каждом случае nonzero и имя probe в diagnostic. | PASS 12 негативных Markdown-проверок. Отрицательный MDX probe не запускался; существующий MDX прошёл положительный gate. |
| D3: check-only | `quality-probe.mjs:14` сравнивает bytes после каждой команды; `finally` удаляет probe. Workflow: frozen install, format:check, lint:md, build. Write/fix scripts существуют отдельно для локальной работы. Финальный gate проходит после удаления probes. | PASS локального поведения и статического workflow-контракта. GitHub-hosted CI не запускался. |
| Сохранение | Все 12 опубликованных docs/CLI/fixtures неизменны; core pins сохранены. Prettier singleQuote и MD025 front_matter_title согласованы с существующим стилем, H1 rule полностью не отключён. | PASS сохранения bytes/pins. Семантика CLI не оценена. |
| Дополнительная проверка | Запись 19 typecheck exit 0; запись 20 dev smoke HTTP 200; финальный браузер открывает mobile sidebar при 390×844, фиксирует dark theme. | Поддерживает PASS, не полный accessibility/visual/browser аудит. |

Независимо просмотрены `installation-dark.png`, `search-4.png`, `search-7.png`, `mobile-nav.png`: Mermaid виден, FR и API поиск показывают результаты, мобильный sidebar открыт. Финальные `errors`, `badResponses`, `externalRequests` пусты. Скрипт наблюдает pageerror, HTTP ≥400 и фактические запросы данного page; он не слушает console.error, поэтому «вся консоль чиста» не заявляется. Dark mode прочитан из data-theme и подтверждён изображением, не отдельным строгим assert. Mobile text assertion может учитывать элементы вне видимого подменю, но снимок независимо подтверждает открытие.

## Промежуточные отказы и восстановление

Все 23 записи сохранены; успешный последний результат не скрывает ошибок.

| Записи | Причина | Исправление/подтверждение |
| --- | --- | --- |
| 1–2 | Install успешен; nested pnpm отсутствовал в runtime PATH, exit 1. | PATH дополнен объявленным pnpm bin; scripts не заменены обходом. |
| 3–5 | Formatter требовал изменения двух опубликованных MDX; lint считал front-matter title + H1 повторным heading. Запись 4 только печатает formatter output. | Настройки согласованы с существующим стилем, опубликованные bytes сохранены, final checks проходят. |
| 6–7 | Webpack не разрешал optional ELK import theme-mermaid. | Public manifest объявляет peer ^0.1.9, добавлен 0.1.9. Framework не обновлён. |
| 8–10 | IT fallback installation с новым file-link давал broken route, затем FR fallback reference не разрешал link на translated intro. | Исправлены только новые installation/FR страницы: route link и FR reference counterparts current/1.0; all-locales build проходит. |
| 11–12 | `nav` selector неоднозначен, capture падает. | Исправлен harness locator; 12-route capture завершён. Это дефект проверки, не продукта. |
| 13–15 | Search-клики работали, но клиент получал default-index 404. | Изучен установленный plugin; indexPages:true создаёт общий индекс каждого locale. Browser повторно проходит, final record 22 подтверждает результат. |
| 16 | 12 негативных probes прошли с неизменными bytes. | Probes удалены; final gate повторно PASS. |
| 17–19 | Typecheck не видел Docusaurus router/useBaseUrl для исходного homepage, exit 2. | Public module-type-aliases 3.10.2 и types подключены, typecheck exit 0. |
| 20–23 | Dev smoke, final quality/build, final browser, integrity. | Все exit 0. После final build продуктовых правок нет, меняются только supporting evidence/helpers. |

Сохранены warnings: повторная регистрация Lunr language functions при последовательной сборке locales; homepage redirect не имеет main, поэтому content общего индекса пуст. Финальный browser запрашивает существующие индексы без 404 и проходит search assertions. Install сообщал о deprecated transitive dependencies и blocked core-js script; его включение не требовалось для зафиксированного результата. Это не отдельный security verdict.

ELIFECYCLE после успешных start/serve проверок соответствует намеренному SIGTERM в finally; wrapper exit 0 и выполненные assertions подтверждают завершение теста. Код закрывает browser и server process group. Независимый глобальный process inventory не проводился: отсутствие любых оставшихся процессов оценщик не удостоверяет.

## Provenance

Все 14 файлов staged docusaurus совпадают с frozen inputs. Trace events 1/3/7 подтверждают чтение локального SKILL, пяти активных references и четырёх assets; далее использовались installed public package metadata и внешние источники совместимости. В рассмотренных tool calls нет чтений candidate, скрытого rubric, другого trial или canonical skill. Это принудительное применение предоставленного навыка, не natural catalog-selection тест.

Публичный trace session `01a0865d-21eb-76f0-9837-347572ae6523` после обновления экспорта содержит 206 events. Для D-runtime рассмотрены **только events 1–190**, с 13:30:58.472Z до завершения сообщения 13:54:13Z. Prefix SHA-256 `182b3f6a7ef27ca4e6dfd9bd0e543235bc6e57c0520a3b8ac42076aad9d1c21f` остался прежним после обновления. Events 191+ относятся к D6 и здесь не оценены. Полные trace/task-message hashes сверены с обновлённым manifest и записаны в snapshot.

Dispatch metadata подтверждает отдельный запуск fork_turns:none, gpt-6-astra/high. До окончания D-runtime есть пять coordinator-dispatch metadata records; их полный plaintext недоступен публичному экспорту. Поэтому отсутствие дополнительных подсказок в каждом dispatch независимо не удостоверено. Доступность raw task/требований и чтение frozen skill подтверждены; full-plaintext delivery/blindness остаётся отдельной provenance-границей. Это не отменяет наблюдаемую работоспособность результата, но исключает безусловный claim о полностью подтверждённом blind-протоколе.

## Граница вердикта

D1/D3/D4: **PASS в указанных сценариях**. Реальные build/production preview/browser и отрицательные проверки команд отделены от статических artifacts. D2, D5, D6, natural catalog selection, remote CI/deploy, полнота поиска, все браузеры и CLI consumer acceptance здесь **не оценены**. Source-review FAIL навыка сохраняется; улучшение candidate относительно baseline эта оценка не доказывает.
