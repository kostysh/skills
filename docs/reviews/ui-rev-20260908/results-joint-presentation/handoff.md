Producer → consumer: presentation/component stage → SPA diagnostic implementation stage

Результат: код реализован; ограниченные visual/component runtime проверки пройдены. Общая runtime-implementation готовность остаётся implemented-not-verified до следующего этапа. Это не formal skill verdict.

Основание: actual strategy /tmp/ui-rev-20260908/results-candidate-additional/D1.md; joint README/package контракт. System-constrained product/app, data-led: существующие токены, таблица и отдельный detail. Snapshot: snapshot.json; actual diff: code.diff; before/after копии только трёх исходников.

Изменения: src/style.css ограничивает ширину inputs/forms, сохраняет mobile layout, переносит длинный контент и pagination, добавляет restrained hover. src/main.jsx показывает empty row, pending labels/aria-busy, field error relationship. Transport, queries, mutation callbacks и server API оставлены прежними. src/Tooltip.js использует useId, owned wrapper realm, одинаковый listener setup/cleanup; сохраняет {label, children, ref}, caller ref направлен на button, children остаются непрозрачным содержимым; добавлено Escape close.

Accepted behavior: поиск q/page с page reset=1, pagination size=2, /items/:id, сохранение введённого значения после 503, retry/correction, saved name после возврата к list/detail и reload без перезапуска сервера. Последнее ещё НЕ выполнено этим этапом.

Открыто для SPA owner: Editor onError вызывает form.reset(), теряя введённое значение; onSuccess не обновляет/инвалидирует list/detail query cache при staleTime 600000. Устранить на базе README, сохранив API. Проверить весь реальный цикл первого PATCH 503 → исправление/retry → success → list → detail → reload, также Create/Delete/search/pagination. Наш этап PATCH не выполнял.

Material states: idle list/detail, empty search, required Name, component SSR/multi-instance/mount получены в браузере. Pending rendering реализован, но pending/error/success и read loading/error runtime evidence ещё нужны. Zoom, длинный контент, keyboard/focus sweep и console/network diagnostics требуют следующего прохода. Существующее create native required сохранено; inline create-required сообщение не добавлено — включить в следующий form-owner этап для полной D1 реализации.

Ограничения: только disposable joint; новых dependencies, product API, permanent harness нет. Сервер этапа остановлен после проверки; следующий owner запускает свой сервер, чтобы seed/first PATCH state был чистым. Browser session ui-rev-joint-presentation закрыта.
