Основной сценарий редактирования нарушает принятый контракт: ошибка теряет ввод, а успешное сохранение не отражается после навигации до reload.

Статус: `findings`.

## Основание

Потребитель — следующий SPA-исполнитель временного Request Desk. Авторитет: joint/README.md (accepted contract) и фактическая стратегия results-candidate-additional/D1.md. Presentation handoff описывает реализованную часть, но не отменяет требований стратегии. Проверка read-only по переданному коду и browser evidence; новые серверы, тесты и browser sessions не запускались.

Стабильная цель: /tmp/ui-rev-20260908/joint; все восемь файлов из results-joint-presentation/snapshot.json проверены по SHA256 и совпали. src/main.jsx: ad0ae9d6254e9ec8601354fe82b7fea7f98f64cf86fa9c71c108e4188ffdc120; src/style.css: 3dc73059e2bac57a96da6dfd0d4a14b56a27afa14159c77af97040a05825651e. Полный manifest — указанный snapshot.json.

Базовый heuristic reference: supplied web-ui-reviewer/references/web-interface-guidelines.md, upstream revision 4e799d45c17aec1498c269287a83b9dba22b966b с локальными расширениями; live overlay не использован. Это UI-domain review приложения, не formal code-review, WCAG certification или оценка качества skill.

## Замечания

- **F1 — joint/src/main.jsx:20:** onError вызывает form.reset() и теряет введённое имя. README и D1 требуют сохранить ввод и дать повторить/исправить. raw.jsonl:17 показывает Changed; :23–25 после первого PATCH 503 показывает Alpha и alert. HAR независимо подтверждает PATCH name=Changed →503. mobile-error.png визуально показывает Alpha и доступную Save. Сохранить введённые значения при ошибке; повторная отправка без редактирования должна отправлять то же имя. Возможность исправить вручную уже наблюдалась, но она не компенсирует потерю ввода.
- **F2 — joint/src/main.jsx:20 (связанные :8, :11, :23):** успешный PATCH обновляет только form, оставляя list/detail query cache со старым именем при staleTime 600000. По raw.jsonl:37–39 после PATCH name=Again →200 видны Again и Saved, :44 при возврате список содержит Alpha, :49 повторный detail содержит Alpha; только reload (:53) показывает Again. HAR и :55 не показывают нового list/detail GET между success и reload. Это нарушает README/D1 о saved value после list navigation/detail return. Согласовать detail и все затронутые варианты list cache с сохранением, включая фильтры и страницы; API сохранить. Не выводить server response name из HAR: body ответа там отсутствует, итоговое значение подтверждено UI после reload.
- **F3 — joint/src/main.jsx:15:** Create имеет native required, но отсутствует предусмотренная D1 связанная inline-ошибка рядом с полем. Это code-level несоответствие принятому состоянию дизайна, также прямо обозначенное presentation handoff; не утверждение о недоступности native browser validation. Добавить отображение required-ошибки и связь с New request, сохранив единственное действующее правило обязательности. Runtime этого состояния не передан и после исправления требует проверки.

## Инвентаризация возможностей и состояний

| Поверхность | Disposition и evidence |
| --- | --- |
| List/table | Reuse README/D1; desktop 1280×900 list-desktop.png и mobile-return-list.png 390×844 просмотрены: table, ссылки, Delete, Page/Previous/Next доступны в этих кадрах |
| Search | Reuse; raw :9–10 подтверждает Alpha и URL q=Alpha&page=1; empty-mobile.png 375×812 просмотрен, No requests found сохраняет controls |
| Pagination | Reuse; controls и page 1/2 видны; переход на page 2 не проверен, полнота capability не подтверждена |
| Detail/edit | Reuse отдельного /items/:id; desktop-save-focus.png и mobile-error.png просмотрены, idle/error layout и видимый Save focus подтверждены только в этих состояниях; F1/F2 |
| Required | Editor relationship видна в коде :21, presentation сообщает runtime required; Create требует F3 |
| Pending/success | Pending labels и form aria-busy видны в коде, pending runtime не проверен; success Saved/Again подтверждён snapshot, не отдельным просмотренным screenshot |
| Read loading/error | Кодовые ветки присутствуют, runtime и визуальное состояние не проверены |
| Create/Delete | Reuse по D1; наличие controls подтверждено, mutation flows не проверены |
| Long content/zoom | Требования D1, текущего evidence нет |
| History/roles/notifications | N/A по D1; отсутствие не finding |
| /components | Независимый маршрут, N/A для принятого edit journey по D1; чужие component diagnostics не превращены в наш verdict |

Keyboard доказательства ограничены реально записанной последовательностью Name→Tab→Save→Enter, Save→Tab→Back→Enter и обратным Shift+Tab к Save. Screenshot показывает outline Save. Mobile 390 scrollWidth=390 — наблюдение для этой формы, не всех состояний и устройств. HMR websocket errors и два пустых browser errors сохраняются как ограничения диагностики; чистая console не заявляется. Browser producer status partial не равен нашему UI status: `findings` основан на сверенных исходных фактах, а оставшиеся области остаются непроверенными.

## Граница исправлений и bounded re-audit

В пределах переданного принятого контракта следующий SPA-исполнитель исправляет F1–F3 в form/mutation/query ownership. Разрешённый предмет handoff: сохранение ввода при ошибке, retry/correction, актуальный cache и связанная Create required-ошибка. Сохранить API, /items/:id, q/page и размер страницы 2, существующие tokens/table/inputs и текущие Create/Delete. Не добавлять историю, роли, уведомления, новую маршрутизацию или менять независимый Tooltip API. Этот отчёт не даёт новых полномочий на публикацию или на изменение внешнего проекта.

После исправления предоставить новый стабильный manifest, точный diff и browser evidence исходного failure path на одном непрерывно работающем сервере: Name=Changed → первый PATCH 503 → всё ещё Changed → retry/correction →200 и Saved → list → detail → reload, везде актуальное имя. Проверить retry без коррекции и correction как отдельные ветви на контролируемых свежих fixture runs при необходимости; не сбрасывать сервер внутри одного цикла. Передать request payload/status и фактические значения UI; состояние сервера не выводить из одного HTTP 200.

Re-audit ограничить F1–F3, исходными failure states и соседними регрессиями: Editor required/pending/error/success/focus, Create required→valid submit, list cache в уже посещённых filter/page вариантах и сохранённые search/pagination/Create/Delete переходы. CSS-соседство проверять только если изменён общий layout/markup. Не повторять неизменённые проверенные baseline desktop list/empty layout и независимый /components при неизменных файлах и зависимостях. Поведенческое исправление F1/F2 само по себе не расширяет re-audit. Расширять только при delta вне этой границы либо конкретном неограниченном blast radius, называя причину и добавленную поверхность.

Непроверенные D1 loading/read-error/pending, long-content, 200% zoom и непокрытые viewport/state combinations — отдельные оставшиеся evidence gaps для полного design-state claim; их отсутствие не превращено в дефекты и закрытие F1–F3 не закроет их автоматически. Новые screenshots desktop/mobile нужны для изменённых состояний. Формальная доступность, performance и внешний backend не оценивались.
