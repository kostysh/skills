# Независимая оценка baseline E-runtime

**Вердикт: PASS в проверенных границах E1/E2/E4/E6 на Linux x64.** Записанный финальный запуск реально использует упакованный Electron 44.3.0: работают main/preload/renderer, версия, нативный chooser с выбором и Escape-cancel, clipboard, session-only token и lifecycle. Неправильное окно и payload проверены через настоящий IPC; неправильный frame — на уровне установленного handler с реальным `WebFrameMain`. Raw IPC transport из дочернего frame не проверен. Полнота plaintext blind delivery provenance также не подтверждена. Это не общий PASS навыка: [исходный source review](baseline-electron-review.md) остаётся **FAIL**.

Оценщик — `/root/baseline_next_electron_docs`, независимо от executor `/root/baseline_electron_runtime_executor`. Дата — 2026-09-09. Метод — чтение финального кода, assertions, полных recorded commands, публичных tool inputs, screenshots и самостоятельный readback hashes/ASAR; без нового запуска приложения, npm, build или GUI. Критерии — [замороженный протокол E-runtime](protocol/E-runtime.json), исходный `REQUIREMENTS.md` и E1/E2/E4/E6 из [proposal](case-proposals-next-electron-docusaurus.md). E3 legacy startup и E5 release authority не входят в эту оценку. Оценщик участвовал в предложении кейсов; независимость относится к реализации и её оценке, не к дизайну теста.

## Снимок и фактические входы

Trial: `/tmp/framework-platforms-20260909/trials/baseline/E-runtime`. Все 12 записей `hashes.json` совпали: пять исходников, конфигурация/package/lock и два главных файла упакованного результата. Из 51 замороженного входа изменены только пять разрешённых файлов реализации: main, preload, renderer TSX/HTML и `forge.config.cjs`. Новый `src/shared/desktop.ts` входит в финальный manifest. REQUIREMENTS, package/lock, electron-vite/TypeScript configs и baseline skill inputs сохранены. Подробности — [независимый readback](baseline-E-runtime-readback.json).

Executor фактически читал canonical `skills/electron-engineer` в основном checkout, а не временную копию навыка. Независимое сравнение всех 14 файлов этого пакета подтвердило совпадение canonical содержимого с frozen inputs. Поэтому это baseline content exposure; путь чтения явно отличается от пути staged copy. Trace также показывает чтение установленного `electron.d.ts`, включая clipboard/preload API. Доказательства естественного catalog selection здесь нет: это forced execution.

Фактический runtime зафиксировал Electron 44.3.0, Node 24.20.0 и `app.isPackaged: true`; версия приложения 1.0.0. Package сохраняет Electron 44.3.0, electron-vite 5.0.0, Vite 7.3.6, Forge 7.11.2, React 19.2.8 и TypeScript 5.9.3. Изменение Forge `outDir` на `artifacts` не меняет версии или защитные настройки.

## Наблюдаемое поведение

В `commands.jsonl` 13 записей; нумерация ниже начинается с 1. Запись №12 от `2026-09-09T13:09:47.351138+00:00` — `xvfb-run ... runtime.mjs --packaged`, exit 0 за 5.785 с. Все 17 JSON-наблюдений её stdout точно совпали с `packaged-evidence.json`. Запись №13 — отдельный `clipboard-check.mjs`, exit 0 за 2.405 с. Оценщик проверил сами assertions, а не только названия этих наблюдений.

| Критерий | Реальное доказательство | Итог и предел |
| --- | --- | --- |
| E1: минимальная capability | Version вызывает main `app.getVersion` через preload и появляется в renderer. Facade содержит ровно шесть именованных методов; renderer `require` отсутствует. `runtime.mjs:18–28`, main/preload/shared sources. | PASS |
| E1/E2: защита окон | У обоих окон `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`; временный test preload наблюдает `process.sandboxed: true`. Production help из отдельной непостоянной session до test injection не имеет `desktop` и `require`. | PASS для наблюдённого Electron runtime; coordinator OS preflight не принят за новое trial proof |
| E2: нативный chooser | Настоящее GTK окно обнаружено через X11; выбран local synthetic `.txt`, UI показывает basename. Второй dialog закрыт настоящим Escape; UI возвращается в Idle и сохраняет прежний basename. `runtime.mjs:36–42`, `x11.py:44–60`, `dialog.png`, `packaged-main.png`. | PASS; mock dialog result не используется |
| E2: help и payload | Временный session preload вызывает реальные `ipcRenderer.invoke`. Все шесть каналов из настоящего HTTP help получают `UNAUTHORIZED`; объект с path, лишние/неверные аргументы, пустой и чрезмерный ввод получают `INVALID_PAYLOAD`. `runtime.mjs:45–53`. | PASS этих adversarial paths; test-only raw facade отсутствует в production ASAR |
| E2: чужой frame | Создаётся реальный дочерний frame в основном окне; его `WebFrameMain` передаётся установленному version handler с реальным main `webContents`, возвращается `UNAUTHORIZED`. Общий guard проверяет sender/window, mainFrame identity, точный URL и session. `runtime.mjs:54–56`, main:45–54. | PASS handler boundary; **raw subframe IPC transport не проверен**, прямой вызов использует внутреннюю `_invokeHandlers` только в harness |
| E2: permissions/popups | В обоих окнах `navigator.permissions.query(geolocation)` возвращает denied, фактический geolocation request — PERMISSION_DENIED. Popup не добавляет окно. Source устанавливает request и check handlers до создания окон. `runtime.mjs:57–59`, main:20–28. | PASS geolocation и popup; остальные permissions не заявляются проверенными |
| E4: native clipboard | UI ждёт `clipboard.writeText` в main; фактический `readText` возвращает скопированный synthetic текст. Пустой ввод даёт UI error. Дополнительно rejected Promise через 800 мс показывает Copying → Copy failed; восстановленный настоящий API снова даёт Copied. `runtime.mjs:33–35`, `clipboard-check.mjs:12–23`, main:77. | PASS актуальной ветви44; failure-path — явная fault injection, не отказ OS |
| E6: session-only policy | set/get/clear работают. Token сохраняется при закрытии/открытии main в том же процессе; после полного restart того же package отсутствует. Отдельно зафиксированы `available:false`, backend `basic_text`; source хранит значение только в main memory. `runtime.mjs:29–32,60–64`, clipboard-check:11, main:13,74–76,85. | PASS session-only; secure persistent storage не заявляется |
| Lifecycle | Main закрывается и открывается из меню; app перезапускается с тем же user-data-dir, HTTP help снова открывается; закрытие всех окон приводит к событию close приложения. `runtime.mjs:60–66`. | PASS наблюдённого close/reopen/restart/quit |

Все четыре screenshots просмотрены независимо: GTK chooser, main после cancel, help и восстановленный clipboard success. Они согласованы с assertions, но не заменяют transport/native доказательство. Чтение profile не проводилось: `session-persistence-check.json` и публичная команда показывают выполненный executor поиск трёх конкретных synthetic literals без совпадений. Это ограниченный scan, а не независимое доказательство отсутствия любых секретов во всех OS-хранилищах. Runtime restart и source memory-only policy подтверждают более узкое обязательство кейса.

## Тот же упакованный результат

Единственная успешная упаковка — запись №3, exit 0, после исправления Forge output directory. Последующие записанные команды не выполняют package/make/build; публичные tool inputs после этой упаковки меняют только test harness/evidence. Runtime №12 и clipboard №13 явно запускают executable из одного `app/artifacts/framework-electron-fixture-linux-x64`, без development entry arguments; URL main renderer указывает на этот же `resources/app.asar`. Restart использует ту же launch function.

Независимый readback:

- `resources/app.asar`: SHA-256 `7ded356a3f81943674a8e373caba65763e4dad62e950853d905d35e343169f14`;
- executable: SHA-256 `9578f5ece2da6cbba4b5d0fb7e7adaaf8f07d44684bddfdab92024c84d80d2f3`;
- ASAR прочитан непосредственно: 10 файлов, список совпал с executor inventory; четыре emitted `out/` файла побайтно совпали с текущим build output и ASAR integrity hashes;
- `src/`, tests, sourcemaps и временные attack/runtime tools в архив не вошли. В архиве есть build configs и REQUIREMENTS, поэтому это локальный проверенный package, не минимизированный release bundle.

Хеши двух ключевых файлов записаны executor после основного runtime и совпали при независимой проверке после clipboard run. Не создавалась криптографическая attestation каждого platform asset до каждого запуска; утверждение о том же результате опирается на явный launch path, `app.isPackaged`, archive URL, отсутствие повторной сборки в доступном trace и совпадение ключевых файлов. Installer/make, signing, upload, updater и прочие OS не проверялись.

## Неуспешные попытки и восстановление

История сохранена полностью; успешная упаковка не была принята за runtime PASS.

| Запись | Фактически зафиксированная ошибка | Что изменилось после неё |
| --- | --- | --- |
| №2, exit 1 | Typecheck прошёл, electron-vite создал `out/main/index.js`; Forge `validateElectronApp` завершился `main entry point ... was not found`. | Добавлен Forge `outDir: artifacts`; повторная упаковка №3 прошла. Это подтверждает устранение конфликта output layout; отдельная независимая трассировка всех внутренних ignore decisions Forge не выполнялась. |
| №4, exit 1 | Development launch: `spawn ... node_modules/electron/dist/electron ENOENT`. | `npm rebuild electron` №5 вернул 0, но dev runtime повторно не подтверждён. Все последующие успешные проверки используют packaged executable; причины install lifecycle не достраиваются из предположений. |
| №6, exit 1 | Сразу после клика Version assertion получил пустую строку вместо `1.0.0`. | Immediate assertion заменён ожиданием видимого async результата. Критерий отображения версии сохранён. |
| №8, exit 1 | `firstWindow` не достиг ожидаемого file URL за 30 с. | Harness выбирает main по file URL; исходный traceback не содержит URL выбранного окна, поэтому точный случай не объявляется независимо установленным. |
| №7/9/10/11 | Timeout ожидания выбранного basename. №10 дополнительно: `xvfb-run ... problem while cleaning up temporary directory`, exit 5. | Менялся только X11 harness: Shift для пути, screenshot chooser, затем явный click по GTK Open. Screenshot и финальный проход подтверждают рабочий native путь; отдельно причина каждого промежуточного timeout не доказана. |
| №12/13, exit 0 | Полный packaged контур и дополнительный async clipboard сценарий. | Критерии dialog cancellation, isolation, token restart и clipboard error сохранены; после успешной упаковки product source не менялся. |

Эти ошибки не приписываются навыку без причинного доказательства. Trial не был успешен с первой попытки. Повторяющиеся native harness timeout остаются видимой стоимостью выполнения; локальный финальный PASS не превращает эту историю в безошибочную работу.

## Provenance и предел вердикта

[Manifest](raw-agent-traces/manifest.json) и экспорт executor содержат 78 public tool events; source session `01a08641-d472-7553-8033-311e8b3806d4`. Записаны `gpt-6-astra`, effort `high`, spawn с `fork_turns=none`; это metadata настройки, не backend-аттестация. Проверенные хеши trace/dispatch приведены в readback. Полный plaintext spawn и двух follow-up сообщений недоступен. Ни заявления координатора, ни наличие frozen raw task не заменяют доказательство полной delivered prompt exposure. В доступных вызовах не наблюдается чтение rubric/candidate/assessment; shared filesystem ограничен инструкциями, а не жёсткой изоляцией. **Blind delivery provenance: не подтверждена полностью.**

Код и runtime подтверждают указанные способности на одном Linux стенде. Подтверждения raw child-frame transport, legacy43/vite4, иных native backends, macOS/Windows, crash recovery, concurrent dialog/window races, системной инвентаризации sandbox-процессов и полного security audit нет. Runner не собирает все console/pageerror события, поэтому отсутствие ошибок во всём приложении не заявляется. Npm сообщил 24 dependency vulnerabilities; версии по задаче сохранены, exploitability не оценивалась и security-clean verdict не выдаётся. Финальный close наблюдался; отдельная process inventory после всех checks оценщиком не проводилась.

Оценщик не менял app или target skills, не читал `.env`/profile и не выполнял дополнительные runtime проверки. Созданы только данный отчёт и hash/readback record. Следующее сравнение с candidate должно сохранять исходные входы и одинаковый предел frame evidence; source-review FAIL, legacy/release cases и catalog gates остаются отдельными обязательствами.
