# Подготовка нейтральных Electron / Docusaurus fixtures

Инфраструктура до baseline freeze. Skill-файлы и behavioral trials не изменялись/не запускались.

## Electron

- `/tmp/framework-platforms-20260909/fixtures/electron`: минимальное React окно, пустой preload. IPC/version button, импорт файлов, clipboard, secure storage и release verification не реализованы.
- Исправлен стартовый preload output на `index.cjs`, формат CJS явно задан для sandbox. Main использует тот же путь; исходные `contextIsolation`, `sandbox`, `nodeIntegration` сохранены.
- Electron 44.3.0, electron-vite 5.0.0, Forge 7.11.2 сохранены. Vite 8.0.3 заменён на совместимый 7.3.6 после реального ERESOLVE: `peer vite@"^5.0.0 || ^6.0.0 || ^7.0.0" from electron-vite@5.0.0`. Последний Vite7 сверён через `npm view vite@7 version --json`.
- Первый `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` завершился EROFS из-за default cache. Повтор с `--cache .npm-cache` выявил указанный ERESOLVE. После изменения Vite повтор остановился EALLOWGIT: npm12 запрещает git dependencies по умолчанию, Forge требует `@electron/node-gyp@git+https://github.com/electron/node-gyp.git#06b29aafb7708acef8b3669835c8a7857ebc92d2`.
- Lockfile успешно создан командой `npm install --package-lock-only --ignore-scripts --no-audit --no-fund --allow-git=all --cache .npm-cache`. Только command-local разрешение чтения git dependency; global config не изменён, lifecycle scripts отключены. Peer bypass не использован.

## Docusaurus

- `/tmp/framework-platforms-20260909/fixtures/docusaurus`: существующие stable pins сохранены. Добавлены две страницы current и опубликованной 1.0, MDX с Tabs, итальянские переводы обеих версий, locale/version dropdowns под `/manual/`.
- Французские переводы, поиск, Mermaid, инструкция установки/ошибок и quality workflows остаются невыполненными задачами trials. Fixture не представляет D1 новый сайт либо D3 custom roots; для этих отдельных случаев нужны собственные исходные snapshots.
- Реальная `tools/greet.mjs` поддерживает `--help`, `--name NAME`; пустой/неверный ввод возвращает 2. Команда доступна через `npm run greet -- --name Ada`. Прямым Node запуском зафиксированы help=0, success=0 (`Hello, Ada!`), error=2 в `tools/fixtures/*.json`.

- Docusaurus package-lock успешно создан через `npm install --package-lock-only --ignore-scripts --no-audit --no-fund --cache .npm-cache`. Временные npm caches удалены из обеих fixtures.

## Основания и границы

Использованы локальные официальные corpus: electron-vite migration/build, Docusaurus versioning/i18n, а также metadata npm resolver. Установка node_modules, build, Electron запуск, package/make, HTTP/browser проверки не выполнялись: это следующий последовательный инфраструктурный smoke root-agent. Подготовка не является behavioral PASS.

Рекомендуемые smoke команды после установки в изолированном контейнере Node24:

- Electron: `npm ci --allow-git=all --no-audit --no-fund`, `npm run typecheck`, `npm run build`; затем `xvfb-run -a npm start -- --no-sandbox` только как root-container smoke. Реальный trial запускать непривилегированно с sandbox. Проверить видимость заголовка Desktop fixture; упаковка: `npm run package` (результат отдельного smoke, не verification выпуска).
- Docusaurus: `npm ci --no-audit --no-fund`, `npm run typecheck`, `npm run build`, `npm run serve -- --host 0.0.0.0 --port 4173`; проверить `/manual/docs/intro`, `/manual/docs/next/intro`, `/manual/it/docs/intro` и `/manual/it/docs/next/intro`, переходы dropdown и reload.

## Дополнительные legacy fixtures

По дополнительному поручению root созданы `fixtures/electron-legacy` и `fixtures/docusaurus-legacy` как копии нейтральных starters. Registry проверен 2026-09-09; максимальные non-prerelease patches в запрошенных линиях: Electron43.6.0, electron-vite4.0.1, React18.3.1. Docusaurus ровно3.9.2 по заданию.

- `electron@43.6.0`: https://registry.npmjs.org/electron/43.6.0; peers `{}`.
- `electron-vite@4.0.1`: https://registry.npmjs.org/electron-vite/4.0.1; peers `{"@swc/core": "^1.0.0", "vite": "^5.0.0 || ^6.0.0 || ^7.0.0"}`.
- `vite@7.3.6`: https://registry.npmjs.org/vite/7.3.6; peers `{"@types/node": "^20.19.0 || >=22.12.0", "jiti": ">=1.21.0", "less": "^4.0.0", "lightningcss": "^1.21.0", "sass": "^1.70.0", "sass-embedded": "^1.70.0", "stylus": ">=0.54.8", "sugarss": "^5.0.0", "terser": "^5.16.0", "tsx": "^4.8.1", "yaml": "^2.4.2"}`.
- `@docusaurus/core@3.9.2`: https://registry.npmjs.org/@docusaurus/core/3.9.2; peers `{"@mdx-js/react": "^3.0.0", "react": "^18.0.0 || ^19.0.0", "react-dom": "^18.0.0 || ^19.0.0"}`.
- `@docusaurus/preset-classic@3.9.2`: https://registry.npmjs.org/@docusaurus/preset-classic/3.9.2; peers `{"react": "^18.0.0 || ^19.0.0", "react-dom": "^18.0.0 || ^19.0.0"}`.
- `react@18.3.1`: https://registry.npmjs.org/react/18.3.1; peers `{}`.
- `react-dom@18.3.1`: https://registry.npmjs.org/react-dom/18.3.1; peers `{"react": "^18.3.1"}`.

Electron legacy содержит один намеренный mismatch: compiler output `bridge.cjs`, main запрашивает `index.cjs`. Это исходная неисправность E3, решения в fixture не добавлены. **Ограничение:** при пустом preload это вызывает ошибку загрузки preload, но само по себе не доказывает симптом «не открывается главное окно»; полное соответствие raw E3 требует решения владельца сценария до freeze. Legacy Docusaurus не содержит search plugin.

Оба legacy package-lock созданы успешно теми же последовательными lock-only командами (Electron с command-local `--allow-git=all`). Caches удалены. node_modules/build/runtime не запускались. Smoke команды аналогичны соответствующему starter; legacy Electron ожидаемо имеет preload-load error до исправления исполнителем.
