# Независимая оценка baseline N-runtime

**Вердикт: PASS в границах выполненного runtime-кейса.** Реальное production-приложение прошло login/logout, разделение двух пользователей, защищённое изменение заголовка, обновление представлений и refresh после фактического истечения JWT. Сохранены Date/Map/Set после hydration и серверная страница с browser-only виджетом. Это не общий PASS навыка `nextjs`: независимый исходный [source review](baseline-nextjs-review.md) остаётся FAIL, а полнота blind delivery provenance ограничена доступными следами.

Оценщик: `/root/baseline_next_electron_docs`, независимо от executor `/root/baseline_next_runtime_executor`; оценщик не менял продукт и не запускал runtime повторно. Дата: 2026-09-09. Тип: оценка наблюдаемого поведения завершённого forced-execution baseline, N1 + положительная часть N2 + семантическая N6 + текущая ветвь S-F. Основание: [замороженный протокол](protocol/N-runtime.json), исходный `REQUIREMENTS.md`, исходные assertions, полные записи пяти запусков и финальный код. Авторство предложений кейсов известно и не является независимостью от дизайна теста.

## Снимок и воспроизводимость оценки

Рабочий результат расположен в `/tmp/framework-platforms-20260909/trials/baseline/N-runtime`. Финальный `snapshot.json` описывает 17 файлов приложения; его агрегат — `065de0e689f3b6755de4a2bcf2f6e426d996a7ab4e1a0db465f0d1fa34f626f9`. Все 17 хешей совпали при независимом readback. Из 77 замороженных входов изменены только разрешённые поверхности реализации: `app/page.tsx`, `app/timeline.tsx` и автоматически дополненный Next.js `tsconfig.json`; неожиданных изменений неизменяемых входов нет. Package scripts, package/lock, baseline skill packages, исходная SQL-миграция и producer handoff совпадают с протоколом. Проверки и актуальные хеши публичных доказательств записаны в [readback](baseline-N-runtime-readback.json).

Использованы установленные Next.js 16.3.4, React 19.2.8, `@supabase/supabase-js` 2.116.0, `@supabase/ssr` 0.12.7 и TypeScript 5.9.3. Исходный HS producer передан как неизменяемая подложка данных; `REQUIREMENTS.md` прямо разрешает добавить `fp_update_document_title` и атомарный audit event. Поэтому новая `002_update_document_title.sql` входит в разрешённую интеграцию. HTTP-посредник Hono этим кейсом не требуется; ни актуальность candidate HS producer, ни успешный Hono HTTP-контур здесь не заявляются.

Финальные записи `commands.jsonl`: №32 — production build, №34–35 — reset seed и применение миграции, №36 — полный runtime runner с exit 0 за 71.02 с, №38 — ограниченная проверка клиентских bundles, №39 — typecheck с exit 0. Последний runtime запуск зафиксирован в `2026-09-09T12:44:16.896971+00:00`; после финального build продуктовый код не менялся. Нумерация записей здесь начинается с 1.

## Проверенные исходы

Все 13 групп в `app/integration/verification-results.json` имеют `passed`. Это не только отчёт executor: оценщик прочёл соответствующий исполняемый `app/integration/verify.mjs`, SQL, Proxy, server helpers/actions и компоненты и сопоставил assertions с сырыми результатами.

| Контур | Доказательство и граница | Итог |
| --- | --- | --- |
| N1: login и изоляция | Настоящий Auth выдал сессии двум пользователям; браузерные контексты раздельны. Own-account содержит своё содержимое, чужая detail даёт 404, гостевые account/detail переводят на login. `verify.mjs:20–38,45–59`. | PASS |
| N1: изменение и инвалидация | UI отправляет padded title, DB хранит trimmed title и ровно один новый edit event; новый title виден в detail сразу, после hard reload, перехода на account и его reload. Невалидный ввод остаётся в форме и не меняет DB. `verify.mjs:58–65`. | PASS |
| N1: прямой action POST | Runner захватывает реальный `next-action` запрос, повторяет его гостем и чужим владельцем. Гостю требуется login; чужому пользователю возвращается отказ, title/event count не меняются. После logout повтор тоже запрещён. Actions выполняют свою auth/validation, а RPC ограничивает owner. `verify.mjs:61–70,87–90`. | PASS |
| S-F: настоящий SSR refresh | Исходные сессии имеют `expires_in=60`; runner дожидается максимального фактического `expires_at` обеих сессий плюс 1.5 с. У обоих пользователей после `/account` новый token и более поздний expiry, правильная identity, `Set-Cookie`, `private`, `no-store`, `Pragma: no-cache`, `Expires: 0`; следующий reload сохраняет identity. Cookies/clock не подменены. `verify.mjs:71–85`. | PASS |
| S-F: logout и доверие Proxy | Logout удаляет auth cookie Alice, закрывает account/action; Bob остаётся авторизован. Присланный гостем `x-fp-access-token` с действительным Alice JWT не даёт доступ: Proxy удаляет внешний заголовок и формирует внутренний только после проверки сессии. `verify.mjs:52,87–90`, `proxy.ts`, `lib/supabase.ts`. | PASS |
| N2: Date/Map/Set | Server page передаёт исходные типы без JSON downgrade; Timeline после эффекта hydration вызывает их методы и отображает `2026 ready local`. `verify.mjs:48`, page/Timeline. Обычная функция и произвольный class instance не входили в runtime fixture. | PASS только положительной части |
| N6: browser-only import | Client wrapper импортирует модуль, читающий `window`, в effect. Production HTML содержит заголовок server page; после hydration виджет показывает hostname. Server page сохраняет серверную границу. `verify.mjs:48–50`, `browser-widget.tsx`, неизменённый vendor module. | PASS семантического требования |
| Data-owner интеграция | Прямые Data API/RPC запросы запрещают anonymous/foreign update, прямую запись таблицы и чтение audit; null/blank/121-char title не меняет состояние. Принудительное исключение при audit insert откатывает title и event. Каталог подтверждает grants, SECURITY DEFINER и фиксированный пустой search_path. `verify.mjs:28–44`, `002_update_document_title.sql`. | PASS |

В Proxy refresh ограничен одним SSR client на запрос: callback обновляет request cookies, копит response cookies и cache headers; `getSession` используется для получения/обновления токена, затем токен проверяется `getClaims`. Защищённые server paths получают отдельный stateless client с проверкой `getUser`, отключённым автоматическим refresh и `fetch` без кэширования. Приложение не использует service/DB-owner credentials для пользовательских запросов. Это подтверждает именно исследованный путь; blanket security assurance не выдаётся.

## Сохранённая история ошибок

Начальный успех build/typecheck не принят за runtime PASS. Сохранились все пять запусков `verify.mjs`, включая четыре ошибки:

| Запись | Наблюдение | Устранение / финальное свидетельство |
| --- | --- | --- |
| №14, exit 1 | Locator `role=alert` совпал с validation message и Next announcer. | Assertion уточнён по тексту; критерий сохранения формы остался. |
| №16 и №22, exit 1 | После Save новый heading не появился; диагностический readback показал старый title с новым edit event. | Исправлена uncontrolled form на controlled input, чтобы сброс формы не отправлял старый title. Финальный runner проверяет введённое значение, новое представление и DB. |
| №28, exit 1 | После прохождения mutation/ownership и фактического ожидания expiry не восстановилась identity. | Изучен реальный путь refresh установленной auth-библиотеки; устранён повторный refresh в downstream clients при TTL меньше proactive-refresh margin. Финальный Proxy передаёт уже проверенный токен stateless clients. |
| №36, exit 0 | Все 13 групп, включая обе истёкшие сессии и logout. | Полный проход после финального production build; критерии не ослаблены. |

История показывает recovery внутри execution attempt, а не успех с первой попытки. Не делается вывод, что baseline инструкции вызвали все ошибки или что единственный успешный исход доказывает улучшение навыка.

## Протокол, независимость и ограничения

Замороженная proposal N6 называла `next/dynamic(..., {ssr:false})` как рецепт, тогда как owning `REQUIREMENTS.md` требует безопасный browser-only import при сохранении server page. Координатор зафиксировал в протоколе разъяснение `2026-09-09T12:53:36.239380+00:00`: effect-time `import()` допускается по тем же наблюдаемым инвариантам для обеих версий. Это уточнение после baseline execution, до candidate edits/execution; исходное задание и fixture не менялись. Поэтому PASS относится к поведению; выполнение именно рецепта `next/dynamic` не заявляется. N2 negative ordinary-function/class branch не была подана и не считается проверенной.

Публичный trace содержит 84 tool events; source session — `01a08625-e54b-7032-859e-b9e0e9988d6e`. В manifest записаны `gpt-6-astra`, effort `high`; dispatch metadata — fresh agent с `fork_turns=none`. Trace подтверждает чтение raw task, REQUIREMENTS и supplied baseline packages, официальных документов и установленного кода. В доступных вызовах не наблюдается чтение rubric, assessment или candidate. Однако полные plaintext dispatch/follow-up messages недоступны: экспорт содержит только metadata трёх dispatch, а shared filesystem не является жёсткой границей. Полная аттестация blind exposure остаётся **не подтверждена**; это отдельное ограничение provenance, не отрицание записанного runtime результата. Forced use не проверяет естественный catalog selection. Model/effort также являются записанной настройкой, не независимой backend-аттестацией.

Оценка ограничена одним локальным production server и двумя тестовыми пользователями. Она не охватывает legacy SSR packages, concurrent refresh, multi-server/CDN/cache-handler deployment, Cache Components, иные RSC types, все security paths или долговременное поведение. В guest POST assertion нет отдельного DB snapshot непосредственно до запроса: отсутствие его эффекта подкреплено проверенной auth-before-RPC структурой; foreign/logout replay имеют прямое сравнение состояния. Browser `pageerror` count равен нулю; stdout/stderr самого server подавлены runner, поэтому отсутствие server errors не заявляется. Проверка bundles №38 ищет конкретные credential literals в 16 `.next/static` JS файлах и не является полным аудитом утечек. Cleanup присутствует в `finally`; независимая инвентаризация оставшихся процессов не выполнялась.

Оценщик не читал `.env` и не копировал credentials/cookies. Повторный тяжёлый запуск не потребовался: исходные assertions, финальный код, результаты и хеши согласованы. Изменения для этой оценки — только данный отчёт и readback; навыки и trial product не изменены.

**Следующий шаг:** сопоставить этот ограниченный baseline результат с независимым candidate runtime при неизменённых входах и симметричном семантическом критерии. Исходные source-review findings и отдельные обязательные gates сохраняют силу.
