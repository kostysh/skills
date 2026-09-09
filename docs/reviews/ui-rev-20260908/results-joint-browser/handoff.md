# Browser producer → UI-review consumer

Status: partial. Запрошенный цикл выполнен целиком, однако README requirement не соблюдён: ошибка теряет введённое имя, возврат через список показывает прежнее имя. Финальный reload показывает сохранённое Again. Это observations, не formal UI/skill verdict.

Target: /tmp/ui-rev-20260908/joint; source edits не выполнялись. Agent-browser 0.27.3, собственная session ui-rev-joint-evidence. URL http://127.0.0.1:43789, synthetic local HTTP server. Реальные browser→local fixture HTTP, без interception, без external integration claim. Первый запуск43788 завершился EADDRINUSE; координатор разрешил свободный43789. HMR websocket24678 также был занят; HTTP flow работал, console содержит Vite websocket connection error.

| Шаг | URL suffix | До → после / видимый результат | Network |
|---|---|---|---|
| Открыть список | / | Search пустой, Alpha/Beta, page1/2,total3 | GET api/items?q=&page=1 200 |
| Search Alpha | /?q=Alpha&page=1 | пустой → Alpha; только Alpha,page1/1,total1 | GET api/items?q=Alpha&page=1 200 |
| Открыть Alpha | /items/1 | Name Alpha | GET api/items/1 200 |
| Ввести Changed | /items/1 | Alpha → Changed; get value подтверждает | Нет mutation до save |
| Tab→Save, Enter | /items/1 | Changed → Alpha; alert Try again: temporary save error | PATCH body name=Changed →503 |
| Correction Again | /items/1 | Alpha → Again; get value подтверждает | Нет mutation до save |
| Tab→Save, Enter | /items/1 | Again → Again; status Saved | PATCH body name=Again →200 |
| Tab→Back, Enter | / | Name списка Alpha (ожидался Again); Search пустой | Новый list GET не наблюдался |
| Открыть Alpha | /items/1 | Name Alpha (ожидался Again) | Новый detail GET не наблюдался |
| Reload | /items/1 | Alpha → Again | Document200, GET api/items/1 200 |

Keyboard evidence: из Name после fill Tab ставит focus на Save (DOM activeElement BUTTON Save), Enter реально отправляет оба PATCH. После successful save Tab переводит focus на Back to requests, Enter реально возвращает в список. В финальном detail последовательность Name→Tab→Tab→Shift+Tab возвращает focus Save. Screenshot desktop-save-focus показывает видимый outline Save, mobile-name-focus — видимый outline Name. Это sampled keyboard evidence, не exhaustive accessibility verdict.

Viewport evidence: desktop1280×900 (initial, save-focus, error); mobile390×844 (error, save-focus, list return, reload, name-focus). Mobile scrollWidth390 при viewport390, горизонтального переполнения в этой форме не наблюдалось. Скриншоты без дополнительных имитаций zoom/touch; проверка device viewport, не physical mobile device. Desktop-save-focus и mobile-name-focus визуально прочитаны.

Raw evidence: raw.jsonl содержит последовательные команды, exit и output, в том числе snapshots, values, URL, activeElement, console/errors/network. network.har содержит23 captured requests; api-evidence.json — API subset с PATCH payload/status. HAR не содержит response body text; не выводить серверный response name из одного status. network requests включает initial load, который был до HAR start. Команда errors возвратила два пустых сообщения; исходный output сохранён, причина не установлена. Скриншоты *.png дополняют interaction evidence.

Непроверенный scope: create/delete, pagination click, pending capture, forced GET failures, zoom, screen reader, long text, exhaustive focus order и full accessibility. Не выводить положительный terminal verdict из screenshot либо успешного200.

Cleanup: agent-browser close → Browser closed. PID970961 проверен как node server.mjs с cwd target и остановлен SIGTERM; cleanup-check.json содержит прямой readback PID отсутствует,43789 connection refused и own socket отсутствует. Другие sessions/processes не закрывались этим producer. npm server запуск возвращал execution session15985; начальная диагностика /proc в sandbox была неполной, последняя проверка сделана с разрешением окружения.
