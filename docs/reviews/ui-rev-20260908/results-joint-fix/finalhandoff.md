F1–F3 исправлены и подтверждены реальным локальным HTTP journey. Общий статус: partial — bounded исправления завершены, полный D1 design-state claim ограничен непроверенным настоящим 200% browser zoom и неполной матрицей viewport/state.

Потребитель — следующий bounded UI reviewer. Mode: implement. Источники: joint/README.md, фактические results-joint-review/report.md и results-candidate-additional/D1.md. Применены переданные candidate-active/react-spa-engineer (data-fetching, forms-validation, testing, accessibility, state-management, persistence-architecture) и candidate-v2-active/agent-browser. Это выполнение прикладного задания, не оценка качества skills. Делегирования/публикации не было. Модель/effort унаследованы от вызывающего агента, override не задавался; точные runtime model/effort API здесь не предоставил, не утверждаю их по названию платформы. CLI agent-browser 0.27.3; Chrome 152.0.7977.82; fixture зависимости из package.json без изменений.

Изменён только src/main.jsx (stablemanifest.json): 458c0078fc7a7f876dd674eafade8a7094e3161add678b615fc4a06136b213bc. Остальные семь файлов совпадают с before-manifest.json, включая CSS, server API, Tooltip, lockfile. before-main.jsx / after-main.jsx / change.diff дают точный delta.

F1: убран reset при ошибке PATCH. F2: ответ PATCH пишет detail cache по ['item', String(id)]; все варианты ['items', q, page] инвалидируются с refetchType all до завершения onSuccess. Form reset применяется к принятому сервером ответу. F3: единственное native required правило сохранено; onInvalid показывает связанную inline-ошибку new-name-error, aria-invalid, onChange снимает ошибку по native validity. Не добавлены ограничения длины/формата.

Матрица владельцев: draft — RHF Editor, identity item.id, сохраняется после failed attempt; pending/error/success — Query mutation в Editor; server response/detail/list — QueryClient, переживает возврат со страницы. Принятый journey выполняет навигацию после success; сохранение pending-статуса при уходе со страницы, access context, portal, Dexie, timer persistence N/A для данного контракта. Обновление списков покрывает уже посещённые filters/pages. Сервер остаётся истиной; reload создаёт новый клиент и читает сервер. Отдельный workflow подтверждения записи через reread перед Saved контрактом не задан; navigation/reload подтверждены отдельно. Не заявляется обобщённая гарантия для ухода во время pending или отказа фонового reread.

Подтверждённые realHTTP сценарии:

| Сценарий | Evidence и результат |
| --- | --- |
| Исходная ветвь retry | verified-retry.har + verified-retry-requests.json: PATCH {name:Changed} 503, затем тот же payload 200. raw.jsonl:73 = Changed после503; :78 = Changed/Saved; list snapshot показывает Changed; посещённый Alpha filter стал No requests found; :103 detail Changed; :106 reload Changed. Весь цикл на одном непрерывном процессе 983814, сервер перезапущен только после окончания ветви. |
| Отдельная correction | correction.har + correction-requests.json: PATCH Changed503→Corrected200. raw:124 Changed, :130 Corrected/Saved, list Corrected, :137 detail Corrected, :140 reload Corrected. Свежий процесс 987429 не перезапускался внутри ветви. |
| Required | Editor empty submit показывает Name is required и фокус input, PATCH для пустого поля отсутствует в verified-retry HAR. Create empty submit показывает inline required и native validation; raw:116 подтверждает aria-invalid=true / aria-describedby=new-name-error. Скриншоты required desktop/mobile просмотрены. |
| Посещённая страница | neighbors.har: page2 с Gamma посещена до edit; PATCH Gamma updated200, возврат через page1 и page2 показывает Gamma updated. URL q/page и page size2 сохранены. |
| Create/Delete | neighbors.har: POST длинного имени201→новая ссылка на page2 и total4; затем DELETE /api/items/4 200→строка исчезла и total3. Не выведено из одного статуса: проверены snapshots. |
| Длинный контент | longcontent desktop/mobile + long-editor desktop/mobile просмотрены. В таблице длинный непрерывный текст переносится, editor input остаётся в viewport. Mobile scrollWidth=innerWidth=375 (raw166,175). Низ длинной мобильной строки выходит за высоту screenshot; Delete достигнут scrollintoview и реально выполнен. |

Дополнительные состояния D1 отдельно от core realHTTP: states.py временно оборачивает fetch, задерживая доставку настоящего response на 2500ms, затем восстанавливает fetch. Это UI-only контролируемый timing, не измерение сервера. Просмотрены ui-only-detail-loading-desktop, ui-only-list-loading-desktop, ui-only-saving-desktop, ui-only-creating-desktop: Loading, Saving…/Creating…, disabled и сохранённый ввод; raw206 aria-busy=true/disabled=true/Beta pending. Запросы завершены. ui-only-list-error-desktop получен network abort; маршрут затем снят. Real-detail-404 desktop/mobile — настоящий /items/999 Not found. Контрольная сеть не применялась к трём core HAR.

Просмотренные screenshots: create-required-desktop/mobile; verified-editor-required-desktop; verified-error-desktop; verified-success-desktop; correction-error-mobile; correction-success-mobile; longcontent-desktop/mobile; long-editor-desktop/mobile; все четыре ui-only loading/pending desktop; ui-only-list-error-desktop; real-detail-404-desktop/mobile. Эти кадры показывают читаемые подписи, поля, действия и error/status без наблюдаемого горизонтального переполнения. Формальная WCAG/assistive-technology оценка не выполнялась.

Неудачные попытки сохранены, не являются evidence успеха:

- raw1–3: sandbox socket read-only; последующий разрешённый запуск успешен.
- branch1.py / branch1.har и ранние editor-required-desktop.png, error-desktop.png, success-desktop.png содержат неудачный быстрый прогон со stale refs/DOM состояниями. Эти три ранних имени исключены из принятого визуального evidence; использовать verified-*.
- Пустой fill Search не установил ожидаемый фильтр в быстрых последовательностях; последующие действия дали timeout. После текущего snapshot применён непустой Changed, проверены detail/reload без рестарта сервера. Raw сохраняет обе попытки.
- Первый click на длинную кнопку Delete не породил DELETE и timeout не принят за успех. После current snapshot и scrollintoview @e17 настоящий DELETE200 и total3 подтверждены.
- Ctrl+plus четырежды не изменил innerWidth1280/devicePixelRatio1/visualViewport.scale1 (raw235,240). Настоящий 200% browser zoom НЕ подтверждён; CSS scale/zoom за browser zoom не выдан. Mobile loading/pending и все комбинации viewport/state не покрыты. No clean-console claim: raw console сохранён, включает ожидаемую потерю Vite connection при межветочном restart; errors пуст в последнем чтении.

Build: npm run build exit0; build.txt — Vite7.1.12, 86 modules, warnings об ignored use client из зависимостей сохранены. Build не подменяет runtime proof. Новые зависимости/тестовый framework не добавлены. Синтетические серверные данные сброшены cleanup.

Cleanup проверен в cleanup.json: оба owned server PID отсутствуют, connect к43803 возвращает111, browser ui-rev-joint-fix закрыт и session sidecars отсутствуют. Неизменённые /components и baseline empty/list layout повторно не проверялись как самостоятельные gates.

Следующий шаг — bounded UI re-audit стабильного main.jsx и доказательств F1–F3/соседних регрессий. Полный D1 acceptance не следует из закрытия этих findings; остаточная zoom/viewport матрица явно открыта.
