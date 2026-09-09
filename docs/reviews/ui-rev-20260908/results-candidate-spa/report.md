Завершено: редактирование заявки исправлено в src/main.jsx disposable candidate-spa.

Удалён сброс формы при ошибке PATCH; успешный ответ обновляет Query detail cache с существующим строковым id и инвалидирует все list query keys, затем сбрасывает form baseline к серверному имени. Маршрут, серверный API, seed failure mode и архитектура сохранены; server.mjs и lockfile прошли проверку исходных SHA256.

Реальный browser walkthrough agent-browser 0.27.3 / Chrome против http://127.0.0.1:43786:
1. List Alpha → /items/1.
2. Ввод Alpha failed draft, PATCH 503, видна Try again: temporary save error, поле сохраняет ввод.
3. Исправление на Alpha corrected saved, PATCH 200, виден Saved.
4. Back to requests: новое имя видно в списке после GET 200.
5. Возврат в карточку: поле содержит новое имя.
6. Reload /items/1: новый GET 200, поле содержит новое имя.

Все assertions walkthrough.py выполнены, exit 0. npm run build exit 0; React dependency use-client bundler warnings не препятствуют сборке. Unit/type scripts проектом не объявлены. Это sampled local HTTP scenario синтетического сервера; network interception не использован. Нет claims о product/live integration, production persistence после restart или regression suite.

Evidence: browser-raw.log содержит реальные снимки, значения полей и сетевые статусы (PATCH 503, PATCH 200, GET после reload). commands.log, walkthrough.py, build.txt, change.diff, before/after source и snapshot.sha256 сохранены. HAR оказался пустым (0 requests), поэтому он не используется как доказательство.

Execution environment: initial default /run/user/1000 socket read-only; XDG_RUNTIME_DIR перенесён в собственный временный runtime. Chrome initial launch reported SUID sandbox failure and advised --no-sandbox; isolated synthetic local browser запущен с этим флагом. Между отдельными exec возникали empty page/unknown refs; цельный walkthrough с ожиданием каждого перехода завершился в sandbox без escalation. Vite HMR port 24678 занят соседним процессом; HTTP 43786 функционировал, HMR не проверялся. Собственная browser session закрыта; собственный npm server session 18759 остановлен Ctrl-C, exit 130. Чужие процессы не изменялись.

P0.md — отдельная stipulated оценка supplied WebdriverIO результатов, не actual run.
