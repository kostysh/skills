# D5 baseline D-legacy: PASS в границах наблюдаемого исполнения

Независимая ограниченная оценка подтверждает D5: исполнитель добавил совместимый локальный поиск, сохранил Docusaurus 3.9.2 и React/React DOM 18.3.1 и проверил production-переходы с перезагрузкой для en/it × current/1.0. Материальных P1/P2 по этому исходу не установлено. Это результат одного поведенческого случая; прежний source-review FAIL и общий статус skill не изменяются.

Режим: оценка baseline trial, assurance `independent`: оценщик не создавал реализацию или harness. Критерии — D5 в `case-proposals-next-electron-docusaurus.md`, frozen task и `app/REQUIREMENTS.md`. Применены действующие methodology/forward-testing skill-reviewer и нормативный skill-standard. Пользователь получает работающий поиск существующего сайта без upgrade и публикации. Полный аудит skill, activation, remote deployment, security и остальные D-кейсы исключены.

## Снимок и сохранность

[Snapshot](baseline-D-legacy-assessment-snapshot.json) содержит SHA-256 файлов, исходные и наблюдаемые hashes всех 50 protocol inputs, source/build/browser evidence и точную запись executor из manifest. Из 50 входов неизменны 47, включая task, REQUIREMENTS, все переданные skills, документы обеих версий/локалей, greet, tsconfig, sidebar, homepage и CSS. Изменены только `app/package.json`, `app/pnpm-lock.yaml`, `app/docusaurus.config.ts`; единственный новый исходный файл приложения — `app/SEARCH.md`. Установленные package manifests дополнительно подтверждают реальные версии 3.9.2 / 18.3.1 / 18.3.1 и search-local 2.0.1. Generated build и отдельный browser harness входят в свидетельства, не в исходные invariants.

Protocol фиксирует подготовку до исполнителя: удаление ошибочного package `type:module`, добавление homepage, override Webpack 5.105.4 и отсутствовавших нейтральных REQUIREMENTS. Это подготовка координатора, не действие/находка skill. Protocol сообщает успешный preflight обоих locales; отдельный `D-legacy-webpack-preparation.json` всё ещё содержит `runtime_after: pending`, поэтому сам по себе не доказывает preflight. Для текущего D5 имеется самостоятельный успешный executor build. Симметрия будущего candidate должна проверяться по замороженным hashes; она здесь не предполагается установленной.

## Проверенное поведение

| Критерий | Наблюдение | Результат |
| --- | --- | --- |
| Совместимость без upgrade | `commands.jsonl` строки 1–2: npm metadata/readme до установки; опубликованные peers Docusaurus ^3.0.0, React/DOM ^18 или ^19. Установленный manifest 2.0.1 совпадает. Package и runtime manifests сохраняют требуемые версии | PASS |
| Production local search | Строка 7: `corepack pnpm build`, exit 0, оба locale и по два индекса. Config индексирует docs, языки en/it, отключает blog/pages | PASS |
| Матрица 2×2 | Строка 10 exit 0, stdout совпадает с `browser-results.json`; harness открывает поиск, вводит запрос, проверяет href, реально кликает, проверяет H1, reload HTTP 200 и H1 | PASS |
| Сохранение сайта/CLI | Hash-проверка неизменных inputs; `/manual/` в config/проверенных URL; строка 12 `pnpm greet --name Ada`, exit 0, Hello, Ada! | PASS |
| Пределы полномочий/отчёт | В публичных действиях реализация и локальные проверки; публикационных команд не найдено. Result раскрывает typecheck failure и первоначальный timeout, не объявляет полный package PASS | PASS в наблюдаемой области |

Проверенные destination paths: `/manual/docs/next/reference`, `/manual/docs/reference`, `/manual/it/docs/next/reference`, `/manual/it/docs/reference`. Для каждого сохранены search/destination PNG. Оценщик просмотрел `it-current-search.png`: локализованный результат отображён. Все четыре сценария проверены по скрипту, stdout и JSON; это не визуальный аудит всех восьми PNG. Зарегистрированных pageerror нет; отсутствие иных console/network ошибок не проверялось.

## Ошибки и пределы доказательств

- Строка 3: отсутствующий предоставленный pnpm wrapper, exit 127; штатный `corepack pnpm add` затем exit 0. Это не upgrade платформы.
- Строка 8: первоначальный browser probe ожидал input до открытия кнопки, timeout/exit 124; recorder сообщает прекращение группы процессов. Строка 9 — диагностический успешный probe, строка 10 — полный исправленный matrix. Исправление harness видно в raw trace. Поздний `docker stop` возвратил «No such container»; это не отдельное подтверждение cleanup. Финальный harness закрывает browser и process group в finally, команда завершается exit 0; независимого конечного process inventory нет.
- Строка 11 — составная `install && typecheck && greet`, общий exit 2. Frozen install завершился успешно (дальше начался typecheck); отдельного записанного exit 0 для него нет. Typecheck сообщает TS2307 для `@docusaurus/router` и `@docusaurus/useBaseUrl` в неизменном подготовленном homepage. Предварительного baseline typecheck нет, поэтому причинность «точно существовало раньше» не доказана. Это незакрытая диагностика fixture, не основание заявлять полную готовность проекта. Третий command цепочки не выполнялся; greet отдельно проверен строкой 12.
- Install содержит peer warnings Webpack 5.110.3/override 5.105.4 и ignored core-js scripts; build содержит Lunr registration warnings. Они не скрыты и не опровергают наблюдаемый поиск, но не закрыты как общая совместимость dependency tree.
- Raw trace (82 события) и task-messages hashes совпали с manifest. Зафиксирован fresh `fork_turns:none`, gpt-6-astra/medium. Текст dispatch и сообщения в 14:27:27 зашифрован и не экспортирован: независимая проверка отсутствия подсказки невозможна. Наблюдаемые reads не открывают rubric/соседние результаты; строгая blind-квалификация остаётся неподтверждённой. Настройки — записанная turn configuration, не backend attestation.
- Исторические baseline этой серии выполнялись с high, D5 здесь с medium. Будущие medium сравнения с историческими high не изолируют причинный эффект skill; совпадающие настройки этой пары должны подтверждаться отдельно. Один PASS не доказывает обобщение или естественный выбор skill из каталога.

Публичный trace, записи команд, конечные файлы и manifest дают пропорциональное свидетельство именно D5. P1 screen: ложного полного закрытия, обязательного upgrade, несовместимого peer выбора или публикационного действия в наблюдаемой области не установлено; gaps выше сохранены как ограничения, не как доказательство отсутствия действий за её пределами.

Оценщик выполнял только чтение, hashes, лёгкие Python assertions и просмотр сохранённого PNG; install/build/server/browser/DB не запускались, target не менялся. Следующий владелец — координатор: включить ограниченный D5 PASS и перечисленные пределы в общий baseline record, сохранив прежний source FAIL.
