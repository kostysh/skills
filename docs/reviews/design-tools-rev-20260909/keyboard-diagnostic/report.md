# Guided keyboard diagnostic

Результат: **completed**. В ограниченном сравнении из двух попыток воспроизведён исходный сбой и установлен соответствующий ему порядок событий. Исходный C1 trial не переоценивался; его evidence и исходники не изменены.

Обычный `agent-browser press ArrowRight` отпустил клавишу до отложенного фокуса Radix: фокус перешёл на Weekly, но выбранным остался Daily. При отдельных `keydown ArrowRight` / `keyup ArrowRight` с удержанием 100 мс фокус и активация произошли до отпускания, Weekly выбран. Это подтверждает механизм зависимости от порядка keyup/focus в данной установленной связке; не доказывает частоту сбоя или отсутствие других причин в иных окружениях.

## Контекст и границы

- Та же disposable app: `/tmp/design-tools-rev-20260909/live-c1`.
- Только отдельные session `dtr-keydiag` и localhost `127.0.0.1:43863`.
- Весь новый evidence записан вне app: `/tmp/design-tools-rev-20260909/keyboard-diagnostic`.
- agent-browser **0.27.3**, установленный Chrome; без подмены сетевых ответов, app/library/skill edits и без новых зависимостей.
- Начальная трассировка загружена через документированный `open --init-script` до первого выполнения app. Она пассивно записывает keydown, keyup, focusin, click и timestamps; не подменяет события или обработчики и не читает DOM checked state на каждом событии. Итоговые checked/focus прочитаны отдельно.
- Оба arm начинаются с чистой загрузки: первый — navigation, второй — reload. В каждом выполняется первый ArrowRight после загрузки. Дополнительных повторов ради успешного результата не было.

## Контракт и метод

В `press --help` нет параметра duration/delay, однако полная установленная core guidance и отдельные `keydown --help` / `keyup --help` документируют раздельное нажатие и отпускание. Использовались именно эти команды, без CDP обхода или синтетического dispatchEvent. См. `browser-version.txt`, `browser-guidance.txt` (строки 843–850), `press-help.txt`, `keydown-help.txt`, `keyup-help.txt`.

Одинаковый путь в двух arm: заполнить email → Tab к switch → Space выключить → Tab к Review → Enter → дождаться Cancel → Shift+Tab/Tab → Escape → дождаться закрытия → Shift+Tab к switch → Space включить → Tab к Daily. Перед первым ArrowRight проверен фактический фокус `daily` и начальный checked state. Проверки первоначальной email validation в этот диагностический путь не включались.

- **fast:** `press ArrowRight`.
- **held:** `keydown ArrowRight`, пауза **0.1 s в Python harness**, затем `keyup ArrowRight`. Это заданная длительность физически правдоподобного удержания, не задержка в app source. Из-за транспорта фактическая длительность по browser timestamps составила около 104.2 мс.

`run.py` содержит сценарий. `commands.json` сохраняет точные argv, stdout/stderr, exit status и длительности всех browser-команд из сценария. `trace-init.js` содержит всю инструментальную трассировку. Наблюдения до/после и полный порядок событий: `fast-before-arrow.json`, `fast-after-arrow.json`, `held-before-arrow.json`, `held-after-arrow.json`.

## Наблюдаемые факты

Timestamps относительны началу соответствующей загрузки страницы и не сравниваются напрямую между arm.

| Arm | keydown | keyup | focusin Weekly | click Weekly | Итог |
| --- | ---: | ---: | ---: | ---: | --- |
| fast | 644.4 ms | 644.9 ms | 654.2 ms | отсутствует | focus Weekly; checked Daily |
| held | 284.2 ms | 388.4 ms | 292.1 ms | 292.1 ms | focus Weekly; checked Weekly |

В fast клавиша была отпущена примерно через **0.5 ms**, за **9.3 ms до** фокуса Weekly. В held фокус и программный click произошли приблизительно через **7.9 ms после** keydown, за **96.3 ms до** keyup. Keydown/keyup/focusin имеют `isTrusted=true`; click Weekly в held имеет `isTrusted=false`, что согласуется с вызовом `.click()` внутри Radix. В обоих arm перед ArrowRight Daily был выбран, Weekly — нет.

## Сопоставление с установленным source

Источник прочитан через стандартное разрешение публичных package entrypoints: `createRequire(project/package.json)` → `resolve('radix-ui')` → `createRequire(resolvedEntry)` → `resolve('@radix-ui/react-radio-group')` и `resolve('@radix-ui/react-roving-focus')`. Внутренние `.pnpm` пути не конструировались и не использовались как обход команды/зависимости. Версии из project lockfile: **react-radio-group 1.4.7**, **react-roving-focus 1.1.19** (`installed-versions.txt`). Сохранены опубликованные CJS entrypoint source и нумерованные excerpts. Сценарий разрешения: `source-resolution.mjs`.

- RadioGroup: строка 384 создаёт `isArrowKeyPressedRef`; 386–390 устанавливают его при arrow keydown; 391 сбрасывает при keyup; 392–393 регистрируют document listeners. Строки 415–418 вызывают `.click()` при focus только пока флаг true.
- RovingFocus: keydown выбирает следующую доступную radio-ноду; строка 232 вызывает `setTimeout(() => focusFirst(candidateNodes))`.

Порядок fast позволяет keyup сбросить флаг до отложенного focus, поэтому focus не вызывает selection-click. Порядок held оставляет флаг true на момент focus, и click обновляет выбранное значение. Наблюдаемый click/no-click и checked state согласуются с обеими ветками. Это source-grounded объяснение конкретно воспроизведённого отказа; внутренний ref непосредственно не инструментировался, и app callbacks не переписывались.

При первой попытке получить package.json дочернего пакета через публичный subpath получен `ERR_PACKAGE_PATH_NOT_EXPORTED`. Неэкспортированный subpath далее не обходился: source разрешён через публичный entrypoint, версии взяты из lockfile. Эта setup-ошибка не относится к app или browser behavior.

## Пределы причинного вывода

1. Два arm подтверждают зависимость конкретного пути от длительности нажатия/порядка событий. Они не дают статистики и не гарантируют поведение при любом CPU/load/browser timing.
2. Исходная гипотеза о том, что предыдущая тяжёлая трассировка изменила timing, **не доказана**: здесь обе попытки имеют одну и ту же лёгкую трассировку, и fast всё равно падает. Сравнение observer/no-observer не выполнялось, поскольку нужный failure уже воспроизведён.
3. Фактический fast press здесь имеет sub-millisecond удержание; отсутствие documented delay в press help не является доказательством внутренней реализации CLI или неизменного zero-delay на всех запусках.
4. Причина не требует патча app: различие воспроизведено без изменения её исходников и соответствует установленной primitive event logic. Library fix и formal review не входят в этот диагностический результат. Это не blanket-утверждение, что любой keyboard дефект является ошибкой инструмента, и не отменяет исходное ограничение blind C1.
5. Console содержит только сообщения Vite/React development; page errors пусты (`console.txt`, `errors.txt`).

## Неизменность и cleanup

`original-hashes.json` фиксирует SHA256 всех файлов исходников и первоначального `live-c1/evidence` до диагностики. После обеих попыток и повторно после cleanup хеши совпали (`preservation.txt`). Ничего в исходном C1 evidence не исправлялось задним числом.

Закрыта только `dtr-keydiag`; финальный `agent-browser session list` — **No active sessions**. До остановки по `ss` подтверждён Vite listener PID **130962** и его pnpm tree. TERM отправлен только этому Vite PID. Launcher завершился 143; финальный `ss` не показывает listener на 43863, а `ps` не показывает ни одного PID его записанной цепочки. Файлы: `browser-close.txt`, `browser-sessions-final.txt`, `server-before-stop.txt`, `processes-before-stop.txt`, `server-after-stop.txt`, `server-processes-after.txt`. Новых работающих ресурсов не осталось по этим проверкам.
