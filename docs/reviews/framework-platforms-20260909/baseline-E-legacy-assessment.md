# Независимая оценка baseline E-legacy

**Вердикт: PASS ограниченного E3-контура на Linux x64.** Настоящий packaged Electron 43.6.0 воспроизвёл отсутствие preload по старому пути; после смены `index.cjs` на существующий `bridge.cjs` тот же smoke подтвердил preload readiness. Electron43/electron-vite4, исходный build layout и защитные настройки сохранены. Marker наблюдался при перезагрузке уже открытого packaged окна после подключения listeners; перехват первой cold-start console event не доказан. [Baseline source review Electron](baseline-electron-review.md) остаётся **FAIL**; естественный catalog selection этим запуском не проверяется.

Оценщик `/root/baseline_next_electron_docs` независим от executor `/root/baseline_electron_legacy_executor`; участвовал в предложении кейсов, но не реализовывал этот fixture. Дата: 2026-09-09. Основания: [frozen E-legacy protocol](protocol/E-legacy.json), исходный REQUIREMENTS, [proposal E3](case-proposals-next-electron-docusaurus.md), исходный/финальный код, все recorded commands, assertions и содержимое package. Проверка read-only, без нового npm/build/Electron/browser запуска; приватные файлы не читались.

## Снимок и объём исправления

Trial — `/tmp/framework-platforms-20260909/trials/baseline/E-legacy`. Из 42 frozen inputs изменены только `app/forge.config.cjs` и `app/src/main/index.ts`; добавлен узкий `app/test/packaged-smoke.mjs`. Все остальные входы, включая package/lock, electron-vite/TypeScript config, preload и renderer, совпали. Финальные **11 source/config/test файлов и 74 packaged файла** совпали с `final-hashes.json`; неизвестных дополнительных файлов в packaged inventory нет. Полный [readback](baseline-E-legacy-readback.json) содержит сравнения, версии, archive inventory и хеши доказательств.

Установлены Electron **43.6.0**, electron-vite **4.0.1**, Forge CLI/core **7.11.2**, packager **18.4.4**, TypeScript **5.9.3**. Package/lock не обновлялись. Исходные `src/` и `out/main|preload|renderer` сохранены; выделен лишь отдельный каталог результата Forge `artifacts`. Нового IPC, preload facade или пользовательской capability не добавлено: задача требует восстановить существующий readiness marker.

## Причины подтверждены раздельно

Первая packaging ошибка мешала получить артефакт для исходного startup repro. В записи №2 electron-vite действительно создал `out/main/index.js` и `out/preload/bridge.cjs`, после чего Forge сообщил `main entry point ... was not found` из `validateElectronApp`.

Независимо прочитан установленный путь выбора/исключения output: `@electron-forge/core/dist/util/out-dir.js` выбирает `out` по умолчанию; Forge передаёт этот путь в `packageOpts.out`; `@electron/packager/dist/copy-filter.js` добавляет абсолютный output в ignored directories и отвергает его при копировании. При данном layout это исключает весь собственный `out` с main entry. Единственное изменение Forge `outDir: 'artifacts'` устраняет эту коллизию; запись №3 проходит. Проверены конкретные версии и source hashes этого пути, а не только гипотеза по тексту ошибки.

Затем запись №4 запускает настоящий package **до исправления preload path**. Runtime подтверждает `app.isPackaged:true`, Electron43 и правильный renderer URL внутри ASAR. Console показывает `Unable to load preload script .../out/preload/index.cjs` и `ENOENT`, marker отсутствует; smoke падает на `No preload load failure`. Таким образом, запуск окна без preload не был принят за успешный результат.

Точный product fix — одна замена в main: `../preload/index.cjs` → `../preload/bridge.cjs`. Исходный electron-vite config уже задаёт CJS `entryFileNames: 'bridge.cjs'`; preload и renderer неизменны. После этого typecheck, package и тот же smoke проходят. В публичных tool inputs проверочный script создаётся до отрицательного запуска и не изменяется между negative и positive: критерии не были ослаблены.

## Запуски и assertions

Нумерация `commands.jsonl` начинается с 1. Все девять записей сохранены, включая отрицательные:

| Запись | Проверка | Наблюдение |
| --- | --- | --- |
| №1 | Lockfile install | `npm ci --allow-git=all`, exit0 |
| №2 | Исходный package | exit1: main entry исключён коллизией output directories |
| №3 | Package после исправления только Forge output | exit0; исходная ошибка preload ещё присутствует |
| №4 | Negative packaged smoke | Реальный preload ENOENT и failed assertion; **exit5 включает дополнительную ошибку xvfb cleanup**, это не PASS и не ошибка, которую допустимо целиком списать на Xvfb |
| №5 | Typecheck после preload fix | exit0 |
| №6 | Финальный package | exit0, 3.435 с |
| №7 | Финальный packaged smoke | exit0, 0.86 с, `2026-09-09T13:21:40.118228+00:00`, `PACKAGED_SMOKE_PASS` |
| №8 | Manifest источников и package | exit0, финальные hashes |
| №9 | Recorded Docker readback | Фильтр активных task runtime containers вернул пустой список, exit0 |

`test/packaged-smoke.mjs` проверяет реальные Electron main/window/renderer состояния:

- `app.isPackaged:true`, `app.getAppPath()` заканчивается на `resources/app.asar`, Electron43.6.0 и renderer `file:` URL указывают на упакованный результат;
- фактические webPreferences: `sandbox:true`, `contextIsolation:true`, `nodeIntegration:false`; среди process arguments нет `--no-sandbox`, Playwright использует `chromiumSandbox:true` и `--disable-setuid-sandbox`;
- после подключения console/pageerror listeners перезагружается то же packaged окно, отображается исходный h1 `Desktop fixture`;
- renderer `window.require` и `window.process` отсутствуют, pageErrors пуст, preload error patterns отсутствуют;
- console содержит точный существующий marker `Fixture preload ready`. В исходном preload это единственный runtime statement; renderer его не имитирует.

Финальный stdout содержит один info-marker и пустой pageErrors, отрицательный — два preload error сообщения и тот же пустой pageErrors. Это проверка реального выполнения preload, не mock console или source-string scan. При этом свойство `prefs.preload`, добавленное в объект диагностики script, не сериализовано в stdout: его значение не используется как независимое runtime доказательство пути. Путь подтверждают source/ASAR, negative ENOENT и фактическое исполнение правильного preload после исправления.

Cold startup/открытие настоящего окна выполнены, однако listeners подключаются позднее. Поэтому «нет initial cold-start console errors» не заявляется; отрицательные/положительные preload observations относятся к последующему reload. Проверка этого reload прямо проходит через packaged preload и отвечает ограниченному требованию readiness.

## Независимый readback артефакта

Executable расположен в `app/artifacts/framework-electron-fixture-legacy-linux-x64/framework-electron-fixture-legacy`. После финальной упаковки нет product source/build изменений в доступном trace; smoke запускает именно этот executable, финальный manifest снимается после него.

- SHA-256 `resources/app.asar`: `71e960096975c6e320576440301c177c97a29d506923c4504a0d4e16d965df7f`.
- SHA-256 executable: `7cb3b42c3beb87ac1783c82cc7a3e8d53bdb9fc015a523a7cd078bba49807d63`.
- SHA-256 canonical JSON mapping всех 74 packaged file content hashes: `ccf35915f57993323f2b0d776975e76aad0bd569f867a5f886acf9017618fabd`; пересчитан независимо, совпал.
- ASAR прочитан напрямую: 10 entries, включая `out/preload/bridge.cjs`; `out/preload/index.cjs` отсутствует. Все ASAR integrity hashes совпадают, четыре emitted `out/` файла совпадают побайтно с текущим build output. `src/`, `test/` и test harness в архив не входят; существующие configs/REQUIREMENTS остаются.

Это идентичность содержимого проверенного локального package после runtime. Она не является подписью release или доказательством неизменности file modes/OS metadata; отрицательный package после последующей перепаковки отдельно не сохранён. Его поведение подтверждают исходные recorded output/trace, не текущий исправленный архив.

## Provenance и пределы

Публичный trace содержит 54 tool events; source session `01a0864f-58a4-7ba1-96ab-1633219f73c3`. Executor читает staged `skills/electron-engineer` по явным абсолютным путям, исходные REQUIREMENTS/config/source и установленный Forge source. Staged и canonical Electron skill packages совпадают с frozen hashes. Наблюдаемых вызовов чтения rubric/candidate/assessment нет.

Metadata указывает fresh spawn `fork_turns=none`, `gpt-6-astra`, effort `high`. Полный plaintext spawn и двух follow-up сообщений недоступен; хеши их metadata и публичного trace совпали. **Полнота blind delivery provenance не подтверждена.** Сообщения координатора не заменяют независимую аттестацию delivered prompts. Shared filesystem имеет инструкционное ограничение, не жёсткую изоляцию. Этот forced run не доказывает естественный catalog selection, общий behavioral PASS навыка или причинность его улучшения.

Проверен только Linux x64 packaged preload43/vite4. Sandbox утверждение ограничено наблюдёнными Electron preferences/launch flags и renderer boundary; новая kernel/process sandbox inspection не выполнялась. Installer/make, прочие OS, signing/notarization, updater, публикация, иные IPC/native capabilities не входят в кейс. npm сообщил 24 dependency findings; они не исправлялись при требовании сохранить версии, exploitability и общий security verdict не оценивались.

Application закрывается в `finally`, recorded Docker readback подтверждает отсутствие активных containers с task runtime prefix в тот момент. Это не глобальная инвентаризация всех процессов ОС. Оценщик не запускал приложение повторно, не читал приватные файлы и не менял app/skills. Созданы только данный отчёт и readback; source-review FAIL и остальные независимые gates сохраняются.
