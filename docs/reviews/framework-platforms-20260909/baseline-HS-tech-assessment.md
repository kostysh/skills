# Baseline HS-tech: независимая оценка

**PASS для двух заданий в их локальной HTTP/SDK границе.** Hono правильно различает ошибки входного Authorization, несовпадение credential и ошибку создания middleware. Supabase helper соблюдает общий предел двух наблюдавшихся GET, отключает внутренние повторы SDK и завершает зависший запрос по caller abort/deadline. В конечном снимке не установлен незакрытый P1/P2. Это bounded case PASS, а не итоговый PASS двух скиллов, БД/RLS/Auth или внешней готовности.

Режим `baseline`; assurance `independent`: оценщик не автор helper, тестов или candidate. Прочитаны protocol, raw inputs/task, полный final code,18 записей command capture, отдельный infrastructure recheck, observations и result. Ранее обнаруженные технические дефекты текста baseline скиллов этим успешным исполнением не отменяются. Оценщик не изменял trial/candidate и не повторял команды.

## Снимок и версии

Основание: [HS-tech.json](protocol/HS-tech.json), H-B + S-E, frozen2026-09-09T12:21:58.423741+00:00. Проверены все80 frozen inputs — совпадают, включая `task.txt`, `inputs.json`, active skill copies, package/lockfile, исходные app/server/health/tsconfig. Новые артефакты — `src/read-rows.ts` и `test/transport.test.ts`; исходный HTTP API не переписан, credentials матрицы не изменены.

| Артефакт | SHA-256 |
| --- | --- |
| [commands.jsonl](/tmp/framework-platforms-20260909/trials/baseline/HS-tech/commands.jsonl) | `507ba2205cdc8a1988b2e725103774e87e13825bbec928f0dafaaaa22a799a04` |
| [infrastructure-recheck.jsonl](/tmp/framework-platforms-20260909/trials/baseline/HS-tech/infrastructure-recheck.jsonl) | `49177eb65ea46ea0c2ef4bdac1c1786fc6b8bf016d4b40f914cc6e5d916017d2` |
| [read-rows.ts](/tmp/framework-platforms-20260909/trials/baseline/HS-tech/app/src/read-rows.ts) | `7b353478f146a4118607151c80549796bc489dd5a1663f4a40c064c45bd23129` |
| [transport.test.ts](/tmp/framework-platforms-20260909/trials/baseline/HS-tech/app/test/transport.test.ts) | `7c5c01f2d1c4c51f31f41262caf18cacadaad5b11c15cb22200df2415c43ef63` |
| [observations.json](/tmp/framework-platforms-20260909/trials/baseline/HS-tech/evidence/observations.json) | `797f56fc7a72e5131953101ef4a8e061d10d3607a6836f874aeebb07d5ba26b0` |
| [result.md](/tmp/framework-platforms-20260909/trials/baseline/HS-tech/result.md) | `23ff4d9ffddeee44184f3219d0cec5966b75e036fe7cb3019c94875cb71c7e75` |

[Safe readback](baseline-HS-tech-readback.json) содержит остальные хеши, mtimes, frozen comparison, записанные source-read команды и конечные checks. Node `v24.15.0` зафиксирован `node --version` в command3, первоначальным launcher error и `process.version` в observations. Установленные Hono4.13.7/@hono-node-server2.1.1/Supabase SDK2.116.0 сохранены; версия SDK не подменялась ради получения нужного retry поведения.

## Hono: request/config distinction

Тест создаёт настоящий Hono/Node server на127.0.0.1:18540 (`transport.test.ts:15-27`). Конфигурации копируются из frozen inputs; constructor exceptions фиксируются до HTTP, для остальных случаев запросы отправляются через `fetch` (`29-41`). Assertions проверяют полный status-vector и `WWW-Authenticate`; observations дополнительно содержат content-type и body.

| Входной случай | Фактическое наблюдение | Проверенная интерпретация |
| --- | --- | --- |
|1: token=`alpha`, header отсутствует |401, Unauthorized, `Bearer realm=""` | Отсутствие входного credential |
|2: token=`alpha`, `Bearer wrong` |401, Unauthorized, `Bearer error="invalid_token"` | Допустимый по синтаксису tokenValue не совпадает с configured credential |
|3: token=`alpha`, `Bearer alpha` |200, JSON `{status:"ok"}` | Успешный допуск к тестовому handler |
|4: token=`alpha`, `Bearer alpha beta` |400, Bad Request, `Bearer error="invalid_request"` | Синтаксически неправильный входной tokenValue |
|5: config `{}`, `Bearer alpha` |Constructor exception; HTTP не отправлялся | Требуется `token` или `verifyToken`; это не HTTP400 |
|6: token=`alpha beta`, `Bearer alpha beta` |Constructor успешно создан; HTTP400/invalid_request | Отклонён входной tokenValue до comparison; configured token не объявлен отдельным источником format400 |

Допускаемые credentials не нормализованы/расширены, middleware API не заменён. Case6 сам по себе не разделяет обе строки с пробелом; разделение дополнительно обосновано исполнителем чтением установленного `hono/dist/middleware/bearer-auth/index.js` в command3: regexp применяется к полученному tokenValue, constructor проверяет наличие options. Это сильнее переноса двусмысленной live-документации на config validation.

`result.md:18` явно корректирует неточную baseline-инструкцию о configured token. Следовательно, **Hono task PASS**: даны наблюдаемые ответы и корректное объяснение именно установленной версии. Успешное преодоление неправильного reference не делает сам baseline reference актуальным и не закрывает исходный H01 source finding.

## Supabase: транспортный budget, retry и cancellation

Код helper прочитан целиком:

- `read-rows.ts:8-10,44-46` — один operation timer2500ms и общий AbortSignal; timer очищается в finally.
- `14-16,30` — request-local client, auth persistence/refresh выключены, поддерживаемые `db.retry:false` и `.retry(false)` исключают внутреннее умножение попыток.
- `17-25` — signal проверяется до fetch, метод ограничен GET, счётчик ограничен двумя вызовами; `redirect:'error'` предотвращает скрытые дополнительные wire requests.
- `28-33` — максимум две последовательные SDK reads, повтор только ошибочного503; после SDK результата снова проверяется abort, чтобы `{error,status:0}` не скрывал caller cancellation.
- `34-41` — Retry-After ожидается с тем же signal, поэтому ожидание не создаёт отдельный неограниченный budget.

Counter наблюдает не только helper invocations: настоящий `node:http` server на18541 добавляет запись при каждом полученном запросе (`transport.test.ts:50-60`). Вызовы используют настоящий SDK `from(table).select('id')`; фиксируется `/rest/v1/items?select=id`. Это реальный SDK/локальный транспорт с синтетическими Supabase responses, не реальный Supabase backend.

| Конечный сценарий | Wire requests | Результат | Измеренное время |
| --- | --- | --- | --- |
|503 →200 |2 GET |status200, data `[{id:1}]`, error=null |13.91ms |
|503 →503 |2 GET |Вернулась ошибка второго503, третьей попытки нет |4.91ms |
|401 |1 GET |Ошибка401 без retry |2.12ms |
|Hanging response + caller abort25 |1 GET |AbortError |26.50ms |
|Hanging response + deadline2500 |1 GET |TimeoutError |2500.50449ms |
|503/Retry-After10s + caller abort25 |1 GET |AbortError, второй запрос не отправлен |25.80ms |

Эти строки взяты из конечного `observations.json` после последнего `npm test`, а не из более ранней таблицы в result.md. Старые measurements оставлены автором как история; финальное обновление соответствует текущему artifact.

**Timing judgment:** raw deadline остаётся2500ms. Helper действительно ставит timer на2500, использует его signal для обеих попыток/response body/ожидания, а hanging request заканчивается с TimeoutError примерно через2500.5ms. Разница около0.5ms совместима с планированием JS timer/event loop и обработкой cancellation; она не доказывает отсутствующий deadline. Test использует2700ms только как допуск measurement assertion (`transport.test.ts:89`); этот допуск не повышается оценщиком до нового product budget. PASS означает работающий timer-based deadline в наблюдавшемся сценарии, а не hard real-time гарантию завершения не позже2500.000ms при любой нагрузке.

Для caller abort таймер действительно установлен на25ms (`transport.test.ts:65`), общий signal приводит к раннему отклонению и дополнительных запросов нет. Флаг `wire.closed=true` записан в наблюдениях, но snapshot собирается после `server.closeAllConnections()` в cleanup (`81-85`); отдельного timestamp/assertion закрытия **до** forced cleanup нет. Поэтому поле само по себе не аттестует точный момент client-driven socket closure. Отмена операции и её bounded latency подтверждаются отдельно — результатом helper, elapsed time, signal wiring и отсутствием retry.

**POST scope:** helper не реализует write/replay API; все наблюдаемые запросы — GET, fetch guard отклоняет иной метод в фактически используемой SDK read ветке. Из этого не выводится, что весь Supabase SDK никогда не повторяет POST или что произвольные внешние writes безопасны. Исполнитель такого широкого утверждения не делает. Live retry-страница не использована вместо pinned source contract; записаны чтения установленного PostgREST builder/fetchWithRetry и официальный2.116 source snapshot.

Следовательно, **Supabase SDK task PASS**: требуемые503 recovery, общий wire-count, deadline и отдельная caller cancellation подтверждены в принятой локальной границе. Это не закрывает исходный S06 о полноте retry guidance самого baseline skill; данный executor обнаружил нужный API и правильно ограничил policy.

## Инфраструктурные и промежуточные ошибки

История сохранена, не переписана в «всё прошло с первого раза»:

- Command7: исходный `npm run typecheck` exit1, `Cannot find module '../lib/tsc.js'` из разыменованного `.bin/tsc`. Это зафиксированный infrastructure launcher failure, compiler ещё не оценил TS code. Protocol addendum описывает восстановление исходных npm symlinks без смены dependency versions. Текущий readback подтверждает `.bin/tsc -> ../typescript/bin/tsc` и аналогичный tsserver.
- Отдельный `infrastructure-recheck.jsonl`: рабочий compiler выявил TS2339 в test cleanup — union `ServerType` включает HTTP/2 без `closeAllConnections`. Это уже дефект typing теста, а не продолжение launcher failure. Final `transport.test.ts:43` сужает тип через `'closeAllConnections' in bearerServer`.
- Commands16/17 после исправления: `npm run typecheck` exit0, затем `npm test` exit0,2/2 теста (health и составной HTTP/transport test). Последний runtime test исполнил все шесть Bearer и шесть transport scenarios; observations обновлены.
- Command8: первый runtime test exit1, итоговый assertion `0 !== 2` замаскировал исходное исключение. Этот отдельный runtime failure **не назван доказанно инфраструктурным**. Диагностический run10 уже прошёл, затем fixture получил `Connection: close`, run12 и final run17 также прошли. Точная первоначальная причина по сохранённому trace не установлена; автор честно сохранил это ограничение. Из финальных успехов не выводится доказанный RCA или гарантия отсутствия startup/connection flakes.

Конечный PASS относится стабильному final helper/test snapshot после обязательных gates. Неразобранная причина исторического единичного runtime падения ограничивает объяснение истории; она не доказывает сохраняющийся дефект финального снимка и не отменяет наблюдаемые successful boundaries.

## Экспозиция и пределы вывода

Command1 stdout точно равен frozen task+inputs+двум root skill bodies. Commands2-4 показывают чтение конкретных Hono/Supabase references, версии Node, installed middleware/SDK code. Поэтому подтверждено **execution после загрузки** этих active surfaces, а не отдельный natural catalog selection. В записанных явных чтениях нет candidate/rubric; нельзя считать это доказательством любого незафиксированного контекста.

Семь записей `python -` не сохраняют stdin program. Видны их exit/stdout и нынешние артефакты, но полное содержимое сделанных ими reads/writes/downloads из command record не восстанавливается. В отличие от captured catalog `python -c` literal, данный журнал не позволяет побайтово реконструировать все edits. Эта provenance-граница записана в safe readback; нет оснований выдумывать скрытую экспозицию, но нет и полного независимого proof её отсутствия. Raw actual backend model identity этими файлами не удостоверена; assignment связывается с dispatch metadata владельца запуска.

Hono HTTP действительно выполнялся через Node server, SDK отправлял реальные local HTTP запросы. Backend responses — fixture; не проверены Supabase Auth/DB/RLS/Storage/Realtime, remote deployment, масштабирование или иной runtime. State/post-processing conditions, redirects, network-error classes кроме перечисленных и streaming-body cancellation не получили отдельного runtime сценария; они не включены в PASS сверх проверенного контракта.

Изменение baseline skills/candidate оценщиком не выполнялось. Обязательные final package checks подтверждены журналом; никакой дополнительный тяжёлый runtime/DB не запускался. Следующий шаг владельца — сохранить original errors, final positive observations и exposure limits, затем сопоставить candidate по тем же входам/критериям без превращения этого bounded PASS в итоговую семискилловую приёмку.


## Дополнение: восстановленные heredocs и предел RCA, 2026-09-09

Bounded **PASS для Hono Bearer и Supabase SDK task** сохранён. [baseline_hs_tech_executor.jsonl](raw-agent-traces/baseline_hs_tech_executor.jsonl) содержит38 событий и18 shell commands, согласующихся с recorder. Теперь доступны все семь ранее отсутствовавших `python -` stdin bodies: fetch официальных источников; initial helper/test; диагностические logging/writeback; fixture/cleanup correction; formatting/result; type narrowing; final result update. Их видимые reads/writes находятся в trial, installed sources и ранее указанных official URLs. Прежнюю запись о невосстановимых семи stdin нужно читать как историческое ограничение до этого экспорта.

Initial literals event11, замены events17/21/31 и formatting event27 безопасно воспроизведены только как операции над строками в памяти, без запуска trial-кода. Полученные `read-rows.ts` и `transport.test.ts` побайтово совпадают с проверенным final snapshot. Event21 кроме `Connection: close` переносит создание SDK client внутрь `try`, обеспечивая очистку deadline timer и при constructor exception; это видимый промежуточный edit, который ранее не был восстановим из recorder. Final helper/test hash привязаны в delta readback.

**Первая runtime ошибка остаётся без доказанного RCA.** Event11 восстанавливает исходную строку86: assertion wire count в `finally`, ожидающий2 для `503-200` или `503-503`. Event16 содержит только `0 !== 2`, без исходного exception/scenario. Event17 добавляет logging и промежуточный observations write; семантику helper и transport responses не меняет. Следующий run уже PASS (event20). `Connection: close` добавлен позже, в event21, поэтому его нельзя считать доказанным устранением первоначальной причины. По новым данным нельзя установить, какой из двух сценариев был текущим, или приписать отказ startup, keep-alive либо launcher. Финальная стабильная реализация и успешные gates остаются подтверждены; исторический RCA остаётся **unresolved**, без нового воспроизведения.

**Уточнение экспозиции:** initial root-body output event2 явно `truncated`; полный recorder stdout не равен доказательству полного model-visible текста. Events3/5/7 дают последующие конкретные root-tail/reference/installed-source reads. Подтверждено execution с видимой загрузкой этих surfaces; полное чтение обоих root bodies либо всего active closure отдельно не аттестовано. Финальная peer-socket-closure оговорка в основной оценке остаётся: observations сохраняются после forced server cleanup.

Проверены SHA-256 trace против manifest и последовательность публичных tool-call inputs/outputs. Model `gpt-6-astra`, effort `high` теперь наблюдаются в записанной turn configuration; это не независимая аттестация фактической backend model identity. Экспорт не содержит полного контекста/dispatch history: из него нельзя доказать отсутствие любой незафиксированной экспозиции. В явных reads не обнаружены candidate или закрытый rubric. Непрозрачные служебные communication payloads не интерпретировались и не использованы для выводов. Поведенческие испытания, изменения trial/candidate и обращения к БД оценщиком не выполнялись.
