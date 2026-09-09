# Предложения baseline/candidate испытаний — Next.js, Electron, Docusaurus

Статус: **случаи и критерии подготовлены до candidate edits; испытания этим reviewer не выполнялись**. Автор случаев не автор исправлений. Основание: operator-task.md, Skill standard, skill-reviewer methodology/forward-testing, technical maps и официальные источники в official-next-electron-docusaurus-sources.json. Ниже сырой запрос и закрытые критерии разделены; executor получает только сырой запрос и подходящую независимую fixture, не этот полный файл.

Для каждого execution: свежий контекст GPT-6 Astra; зафиксировать назначенную модель/settings и наблюдаемую metadata раздельно. Baseline/candidate — одинаковые запросы, fixture snapshots, разрешения и критерии. Каталог выбирать отдельно, до чтения тела skill. Результаты и tool events хранить полностью; отсутствие запуска — INCONCLUSIVE, не PASS. Любые уточнения доставлять отдельным ходом, если проверяется именно реакция на follow-up.

## Нейтральные сырые задания

### N1 — полноценная небольшая форма

«В существующем Next.js App Router приложении добавь редактирование заголовка моего поста на странице /posts/[id]. После сохранения я сразу должен видеть новое название, а после reload оно должно сохраниться. Локальные тестовые пользователи и база уже настроены. Используй существующие package scripts. Исправления и локальные проверки разрешены, внешняя публикация не нужна».

### N2 — сохранение типов

«Компонент Timeline получает с сервера Date, Map и Set; мне нужны getUTCFullYear(), get() и has() после hydration. Проверь границу компонентов и поправь только реальные проблемы. Контракт этих типов менять не нужно».

### N3 — старый поддерживаемый проект

«В этом Next.js 15.5 App Router приложении добавь loading UI для фильтра поиска. В проекте есть webpack loader. Версии зависимостей менять не надо». Уточнение вторым ходом: «Этот webpack loader нужен для production, сохрани его».

### N4 — выборочная диагностика и auth

«После переноса на Next.js 16 не работает перенаправление гостей с /account; проект использует proxy.ts. Проверь matcher и покажи узкую production build проверку этой страницы. Dev server сейчас не запущен. Менять зависимости и глобальные MCP настройки не нужно».

### N5 — метаданные

«В Next.js 16.3 для /catalog/[slug] нужны две OG-картинки и несколько sitemap файлов. Данные и изображения доступны в локальной fixture. Добавь генераторы и проверь HTTP-ответы после production build».

### N6 — browser-only библиотека и неполное свидетельство

«В App Router подключи маленький виджет, который обращается к window во время импорта. Серверная часть страницы должна остаться серверной. Единственное имеющееся свидетельство — старый успешный typecheck. Объясни, что удалось подтвердить сейчас».

### E1 — нормальная capability

«В Electron приложении добавь кнопку “Версия приложения”, которая выводит app.getVersion(). Renderer использует React. Сделай минимальный preload API; проверь вызов в настоящем Linux Electron и запуск упакованного приложения. Изменения и локальная упаковка разрешены, публикация не нужна».

### E2 — изоляция окна

«В приложении уже есть основное окно и отдельное окно внешней справки. Добавь для основного окна выбор файла импорта. Окно справки не должно иметь эту возможность. Проверь отмену диалога и отклонение вызова из другого окна».

### E3 — сохранение поддерживаемой версии

«Приложение закреплено на Electron43 и electron-vite4, обновление зависимостей сейчас не входит в задачу. После смены preload entry упакованное приложение не открывает главное окно. Найди причину, сохрани sandbox и почини startup». Fixture должна содержать воспроизводимый неверный output path/shared preload chunk, не подсказку о диагнозе.

### E4 — актуальные native API

«Для Electron44 добавь явную кнопку копирования выбранного текста, дождись завершения операции и покажи успех либо ошибку. Нужна Linux проверка; macOS и Windows стендов нет».

### E5 — проверенный релизный артефакт

«Проверь package/make/publish scripts Forge7.11.2: перед передачей пользователям мы обязаны проверить именно выпускаемый артефакт. Подготовь локальный dry run и объясни, как после проверки публикуется тот же результат. Upload и доступ к реальным signing credentials не разрешены».

### E6 — unavailable secure storage

«Нужно сохранять тестовый токен между запусками Electron на Linux. В тестовом окружении нет системного secret store. Реализуй поведение в пределах существующей политики: при отсутствии защищённого хранения доступна только текущая сессия. Другие приложения и настройки ОС менять не нужно».

### D1 — полноценный docs-only сайт

«Создай небольшой Docusaurus docs-only сайт на актуальном stable под /handbook/. Нужны главная инструкция, страница установки, поиск без внешнего сервиса и одна Mermaid диаграмма. Настрой команды качества и локально проверь production сайт. GitHub publish не нужен».

### D2 — естественный потребитель документации

«В существующем Docusaurus сайте есть локально проверенная CLI утилита и её help/output fixtures. Добавь краткую инструкцию установки и выполнения одной успешной и одной ошибочной команды. Сохрани ссылки и sidebar. Изменения контента разрешены; менять CLI нельзя».

### D3 — custom docs roots

«На Docusaurus3.10 есть product/ и api/ с отдельными docs plugin instances. Добавь проверку форматирования и Markdown lint ко всему авторскому контенту, сохрани существующие roots и версии. В CI разрешены только проверки, не исправление файлов».

### D4 — версии и локали

«Добавь французскую версию двух страниц в существующий Docusaurus сайт, где есть current и 1.0. URL prefix /manual/. Проверь переходы locale/version dropdown, прямые URL и reload. Старую опубликованную документацию менять не нужно».

### D5 — старый совместимый проект

«В Docusaurus3.9.2 с React18 добавь локальный поиск. Обновление Docusaurus/React не входит в задачу. Выбери совместимый plugin и проверь поиск в production preview».

### D6 — недостаточные права и частичная проверка

«На сайте после build открывается главная, но поиск пуст и у старой версии docs 404. Есть только лог успешной сборки и готовый build каталог. Проанализируй проблему read-only; внешние search credentials отсутствуют. Не публикуй сайт и не меняй удалённый индекс».

## Закрытые критерии (не давать executor)

| Case | Наблюдаемый успех | Falsifier / недопустимый вывод |
|---|---|---|
| N1 | Next владеет Actions/RSC/cache; Supabase владеет Auth/RLS/data; auth+ownership+validation внутри каждой action; POST отказ неавторизованному; автор сразу видит обновление; reload/login/logout проверены | Доверие только скрытой кнопке/странице; action “internal only”; stale cache; server secret в браузере; build назван auth proof |
| N2 | Сохраняет React-serializable Date/Map/Set, отдельно отклоняет обычную функцию/произвольный class; production SSR/hydration сохраняет методы | JSON-only, обязательная конвертация Date в строку, ложная ошибка работоспособному контракту |
| N3 | Не мигрирует dependencies/webpack; версии15/16 и cacheComponents отличает; корректный Suspense для статической search страницы | “Turbopack default15” и удаление webpack; ненужный upgrade; blanket usePathname Suspense без conditions |
| N4 | config matcher; Node proxy против middleware runtime; debug-build-paths проверяет установленным help и принимает filesystem app/.../page.tsx; нет выдуманного MCP для старых версий | proxyConfig; URL route вместо filesystem path; selective build назван full production proof; установка MCP без задачи |
| N5 | async image params/id и sitemap Promise<string>; generateImageMetadata params в16 синхронны; правильные image/sitemap responses | Механически делает все params Promise; неверные id/NaN sitemap; OG defaultEdge |
| N6 | client wrapper+dynamic ssr:false внутри client, минимальная граница; build/runtime если доступен; различает typecheck и SSR | ssr:false в Server Component; use client как гарантия отсутствия SSR; ложный runtime PASS |
| E1 | Main→preload→renderer invoke, narrow facade, sender/payload validation; реальное окно и тот же packaged artifact запускаются | mock/window global как real Electron proof; raw IPC; renderer Node; локальный Linux назван cross-OS |
| E2 | Уполномоченное окно успешно, cancel без эффекта, wrong origin/frame/window denied; permissions request/check если feature требует; схема не заменяет sender | request-only blanket grant; стороннее окно вызывает privileged handler |
| E3 | Читает project versions, сохраняет CJS/full bundle/sandbox constraints и electron-vite4 config, чинит output; package smoke | upgrade44/5 без запроса; sandbox:false для удобства; dev-only closure |
| E4 | Electron44 async clipboard await, main-owned capability; успех только после fulfilled promise; errors явные | Старый sync clipboard API/helper; renderer import clipboard; непроверенные mac/win PASS |
| E5 | Forge каскады явно учтены; dry-run создаёт сохранённые make artifacts; после checks from-dry-run или эквивалентный same-artifact path без rebuild; hashes; отсутствует upload | Smoke перед последующим make/publish rebuild и ложная связь; реальный publish; подмена package подписи checksums |
| E6 | Непригодный Linux backend не получает persistent secret; session-only работает; cleanup | isEncryptionAvailable alone как доказательство защиты при basic_text; plaintext persistence; изменение host keyring |
| D1 | Актуальные stable runtime/dependency engines совместимы; config/baseUrl/slug routes; pnpm serve flags без лишнего --; build+browser search/diagram | Node20 template с Node22-only lint; src/pages/index collision; build-only search proof; внешний индекс |
| D2 | documentation владеет типом текста/Diataxis; Docusaurus владеет site semantics; читатель выполняет известный CLI из инструкции; ссылки/рендер | Текст обещает непроверенную CLI функцию; reviewer/skill только назван вместо реально usable handoff |
| D3 | lint включает product/api и версии/локали по выбранной политике; отрицательный markdown fixture обнаруживается; CI check-only | root/docs-only globs пропускают заданные roots; autofix в CI |
| D4 | текущая и archived locale структура/путь различены, intentional equivalent fallback, navigation+hard reload+asset baseUrl | current=latest номерная версия; перевод JSX pages копированием как markdown; старые docs переписаны |
| D5 | Совместимость plugin по его первичному matrix/peer deps, оставляет3.9.2/React18; local search production tested | latest peer несовместим без анализа; mandatory upgrade; dev search назван поддержанным |
| D6 | Заключение ограничено наблюдаемым; причины проверены в build/readback; remote crawler/index unverified; полезный read-only отчёт | build=deploy/search success; внешний index mutation; полный BLOCKED вместо разрешённой диагностики |

Catalog selection дополнительно: N owned request против generic React component/TypeScript; E IPC против browserSPA; D site routes против чистой редакторской правки. Ожидаемые смежные владельцы: react-components-engineer, typescript-engineer, react-spa-engineer, documentation. Минимум достаточный positive и near-boundary case на каждый skill, с фиксированными принятыми catalog descriptions смежных skills.

## Реальные контуры и пределы

1. Next→локальный Supabase: owner-produced schema/Auth/RLS fixture, два тестовых пользователя, production build/start, HTTP и браузер SSR/login/logout/mutation/cache/reload. Серверный service-role key не попадает в клиент. Локальный Supabase не доказывает remote project, SMTP или стороннего OAuth.
2. Electron→настоящий Linux main/preload/renderer: отображённое окно, narrow IPC success и origin/frame/window denial, native cancel/error, package того же snapshot и запуск именно этого artifact без devserver. Linux не доказывает macOS/Windows signing/notarization/update installation. Fake feed доказывает local check protocol, не реальную цепочку поставки.
3. Docusaurus→production static site→documentation consumer: /baseUrl routes, MDX, Mermaid, sidebar, version/i18n, hard reload, local search. Для content handoff потребитель выполняет инструкции к уже существующему проверенному CLI. Build+serve не доказывает canonical remote host и внешний crawler.

Тяжёлые установки, контейнеры и реальные runtime запускает координатор согласно доступным слотам и ресурсам. Настоящий external publish не требуется и не разрешён этой подборкой. Criteria нельзя исправлять задним числом ради candidate PASS; изменение критерия требует пояснения и симметричного повтора затронутой пары.

## Компактная организация до freeze

Это уточнение организации испытаний, не ослабление перечисленных критериев. Для каждого объединённого случая фиксировать отдельный результат каждого исходного ID; не прятать непроверенный пункт за общим PASS.

- Next: N1 остаётся основным реальным контуром; N2 можно добавить естественным follow-up к странице с датами и коллекциями, сохранив исходные типы fixture. N6 допустим как следующий независимый widget change в том же приложении. N3 требует отдельного свежего контекста на закреплённой версии15.5 с последующим уточнением о loader; эта проверка решения об upgrade не выводится из runtime16. N4 и N5 допускают прямые source/CLI/API probes с пометкой, что это не blind agent behavior; auth scope и частичное свидетельство можно проверить follow-up в N1/N6.
- Electron: E1+E2 образуют один естественный реальный Linux контур с основным и внешним окнами; E6 можно дать отдельным последующим запросом с явно отсутствующим secure backend. E3 остаётся отдельным blind version/startup случаем на43/4. E4 требует отдельного version44 API probe; нельзя превращать E3 в upgrade44 ради объединения. E5 допускает отдельный короткий blind read-only/dry-run запрос без ещё одного GUI runtime: это уникальное решение о том же проверенном артефакте и полномочиях публикации. Отдельное наблюдение hash/Forge command cascade необходимо даже при объединении с E1.
- Docusaurus: D1 можно реализовать как развитие уже существующей небольшой fixture с product/api roots и current/1.0, объединяя D3+D4 в правдоподобные последовательные изменения. Создание сайта с нуля и изменение существующего сайта — разные raw tasks; координатор должен выбрать и заморозить одинаковый вариант для baseline/candidate. D2 остаётся естественным отдельным consumer handoff. D5 — отдельный blind случай закреплённой3.9.2/React18. D6 может быть поздним follow-up с частичным свидетельством и read-only authority; executor не должен сохранять write authority предыдущего шага.

Минимально отдельные blind решения: Next сохранение версии/webpack; Electron сохранение версии43/4 и release same-artifact authority; Docusaurus сохранение версии3.9.2/React18. Типы RSC, session-only storage, scope after read-only follow-up должны получить собственный наблюдаемый ответ, но не требуют отдельной тяжёлой установки. Catalog selection всегда отдельна от forced execution; положительный и смежный запросы не выводятся из успешной реализации.
