# Baseline: supabase-engineer

**FAIL — 6 подтверждённых P2.** Режим `baseline`; assurance `independent`. Автор отчёта не создавал и не исправлял проверенный снимок. Это независимая исходная оценка, не итоговая приёмка исправленной версии.

Снимок: commit `d89d66f2c99bf8b9e84e5b4def54fa60192856a5`, skill `0.1.6`, SHA-256 `SKILL.md`: `3ee79ab832636a6cc36d1b9009a46b80c8090642bdfd89a90e478a271774a751`. Хеши всех файлов: [baseline readback](hono-supabase-baseline-readback.json), [полная карта](technical-supabase.json). Дата сверки: 2026-09-09.

Потребитель — агент, выполняющий принадлежащую скиллу задачу в существующем проекте. Ожидаются поддерживаемые installed-version API/команды, сохранение принятого контракта и проверка реально заявленной границы. Исходники, generated root, все active references, примеры, метаданные, UI, maintenance declaration и прямые owner-контракты прочитаны; supporting inventory отделён от действующих инструкций. Техническая карта включает весь active scope, а не только строки findings.

## Материальные findings

### S01 · P2 · Declarative db diff путь не соответствует CLI2.117

Источник: `skills/supabase-engineer/references/migrations-cli.md:9-14`. Basis: `conflicting` (точная версия CLI/SDK имеет приоритет над неверсированной live-страницей); confidence **high**.

Задача изменить согласованный declarative SQL → редактирование supabase/schemas → рекомендованный db diff -f при CLI2.117 сравнивает shadow/live DB → файловое изменение не превращается в ожидаемую миграцию. Это ошибка инструкции; успешное применение либо потеря в продукте не наблюдались.

Официальное основание: [cli-diff-doc](https://raw.githubusercontent.com/supabase/cli/v2.117.0/apps/cli/docs/supabase/db/diff.md), сохранённый original snapshot `official-hono-supabase/cli-diff-doc.txt`. Pinned CLI docs and read-only help distinguish ordinary shadow/live diff from experimental db schema declarative sync. Live website is stale relative to pinned CLI behavior.

P1 screen: No production mutation performed; migration can omit intended changes, a P2 contract failure. Отчёт не заявляет наблюдавшуюся ложную готовность или действие в продукте.

Исправление: Проверять installed --help. Для2.117 различать db diff и db schema declarative sync, явно назвать experimental opt-in; старую ветку оставить только с точной поддерживаемой версией. Не менять модель миграций и не обновлять CLI автоматически.

Закрывающая проверка: Change only declarative file and prove generated migration contains delta; ordinary dbdiff on pinned CLI is not that proof.

### S02 · P2 · Курсор created_at теряет строки с одинаковым timestamp

Источник: `skills/supabase-engineer/references/database.md:43-52`. Basis: `direct` для текста/официального контракта; неверный пользовательский результат выведен из указанного пути, не из слепого исполнения. Confidence **high**.

Задача разбить записи на страницы → копирование курсора из примера →50 из51 строк имеют общий timestamp на границе → следующий gt исключает оставшуюся строку.

Официальное основание: [pg-sql-select](https://www.postgresql.org/docs/current/sql-select.html), сохранённый original snapshot `official-hono-supabase/pg-sql-select.txt`. After returning50 of51 rows with identical created_at, gt(created_at,cursor) excludes the51st forever. No unique timestamp invariant is declared.

P1 screen: Deterministic data omission in example is P2; no production loss claimed. Отчёт не заявляет наблюдавшуюся ложную готовность или действие в продукте.

Исправление: Курсор и ORDER BY должны задавать один уникальный полный порядок, например created_at+id; либо явно подтвердить уникальность используемого одиночного ключа.

Закрывающая проверка: 51 equal timestamps with page size50 must all be returned exactly once; deny/error must remain distinct from no rows.

### S03 · P2 · IVFFlat создаётся до данных без измерения параметров

Источник: `skills/supabase-engineer/references/vector.md:3-16`. Basis: `direct` для текста/официального контракта; неверный пользовательский результат выведен из указанного пути, не из слепого исполнения. Confidence **high**.

Задача настроить новую векторную таблицу → последовательное исполнение setup создаёт IVFFlat на пустых данных → индекс обучается без представительной выборки и может не вернуть ожидаемый набор после наполнения.

Официальное основание: [pgvector](https://raw.githubusercontent.com/pgvector/pgvector/master/README.md), сохранённый original snapshot `official-hono-supabase/pgvector.txt`. Official pgvector/Supabase guidance requires representative data before IVFFlat build; empty/small training set reduces returned results. lists100 is not justified for this new empty table.

P1 screen: Confirmed setup/retrieval correctness risk is P2; no actual application vector workload observed. Отчёт не заявляет наблюдавшуюся ложную готовность или действие в продукте.

Исправление: Выбирать размерность из embedding-модели и индекс по workload. Новый setup может начинать с exact/HNSW; IVFFlat строить после достаточной загрузки с обоснованными lists/probes и проверкой recall. Не мигрировать существующий индекс автоматически.

Закрывающая проверка: Cold-table ANN build followed by dataset compare to exact search must meet accepted recall; dimensions follow embedding producer.

### S04 · P2 · Примеры пропускают nullable data/error контракт SDK

Источник: `skills/supabase-engineer/references/storage.md:20-24`. Basis: `direct` для текста/официального контракта; неверный пользовательский результат выведен из указанного пути, не из слепого исполнения. Confidence **high**.

Задача получить signed URL → отказ политики/несуществующий объект → SDK возвращает data:null,error → вложенное destructuring выбрасывает TypeError вместо обработки ожидаемой ошибки. Родственные snippets скрывают результат ошибки.

Официальное основание: [sdk-storage-source](https://raw.githubusercontent.com/supabase/supabase-js/v2.116.0/packages/core/storage-js/src/packages/StorageFileApi.ts), сохранённый original snapshot `official-hono-supabase/sdk-storage-source.txt`. createSignedUrl failure returns data:null plus error; nested signedUrl destructuring throws TypeError. Database/RPC/remove/list examples also omit returned errors, conflicting with root rule.

P1 screen: Local example failure is P2; no secret disclosure or irreversible external effect demonstrated. Отчёт не заявляет наблюдавшуюся ложную готовность или действие в продукте.

Исправление: Обрабатывать error до data во всех асинхронных CRUD/RPC/Storage snippets. Для signed URL не деструктурировать nullable data; не придумывать error поле у синхронного getPublicUrl.

Закрывающая проверка: 51 equal timestamps with page size50 must all be returned exactly once; deny/error must remain distinct from no rows.

### S05 · P2 · Operations reference навязывает новый HTTP/топологический контракт

Источник: `skills/supabase-engineer/references/operations-observability.md:3-12`. Basis: `direct` для текста/официального контракта; неверный пользовательский результат выведен из указанного пути, не из слепого исполнения. Confidence **high**.

Узкая диагностика Supabase или настройка существующего локального CI → reference требует /health, метрики, cloud-проекты или queue → конфликтует с действующим проектным HTTP/architecture/retry контрактом. Подтверждена неоднозначность обязательств на прямом handoff; фактическое самовольное выполнение не наблюдалось.

Нормативное основание: `fragments/overview.md:15-31`, `references/architecture.md:24-28`, `references/operations-reliability.md:3-18,26-28`; прямые стабильные Hono/architecture владельцы не передают Supabase право создавать HTTP/topology контракт. Expose /health, counters/traces and blanket429 queue/backoff are unconditional; release mandates dedicated CI project/separate projects/health despite root preserving topology and reliability requiring measured failure/idempotency.

P1 screen: P2 source-to-action conflict; exploit, actual scope expansion and production effects not observed. Отчёт не заявляет наблюдавшуюся ложную готовность или действие в продукте.

Исправление: Сделать observability/deploy рекомендации условными относительно принятого HTTP/architecture/CI контракта; сохранить измеряемую потребность в queue и idempotency/retry budget.

Закрывающая проверка: Narrow diagnostic task introduces public health endpoint/queue or retries a write without accepted idempotency.

### S06 · P2 · Retry budget не учитывает включённые повторы текущего SDK

Источник: `skills/supabase-engineer/references/operations-reliability.md:3-18`. Basis: `conflicting` (точная версия CLI/SDK имеет приоритет над неверсированной live-страницей); confidence **high**.

Задача ограничить повторы чтения → helper считает свои попытки → каждая SDK попытка уже может выполнить до4 транспортных запросов → бюджет попыток/deadline не соответствует заявленному, если эффективный встроенный policy не учтён.

Официальное основание: [sdk-retry](https://raw.githubusercontent.com/supabase/supabase-js/v2.116.0/packages/core/postgrest-js/src/fetchWithRetry.ts), сохранённый original snapshot `official-hono-supabase/sdk-retry.txt`. Pinned2.116 PostgREST builder uses default retry:true: GET/HEAD/OPTIONS transient transport failures can produce4 attempts before caller helper repeats. Current live doc describes a different retry set, so use pinned implementation for exact version.

P1 screen: Extra attempts/deadline violation possible in existing owned retry task; P2, no non-idempotent POST duplication claimed. Отчёт не заявляет наблюдавшуюся ложную готовность или действие в продукте.

Исправление: Проверить версию и эффективные transport retries, считать суммарные попытки и deadline; db.retry:false или query.retry(false) применять только если принятая внешняя политика должна владеть всем бюджетом. Не копировать POST retry из расходящейся live-страницы.

Закрывающая проверка: Injected transient failure counts actual transport calls against whole-operation budget including SDK retries.

## Подтверждённое и пределы доказательств

Покрыты 19 active references и 110 аспектов/поверхностей. Каждый раздел с API, командой, default, code example либо ограничением связан с official source ID, датой и версией; чистые локальные правила authority/evidence помечены N/A с основанием. Метаданные root не получают отдельный blanket technical PASS: vendor-дубликаты наследуют выводы references. [Каталог оригинальных источников](official-hono-supabase-sources.json) сохраняет URL, дату и SHA-256; search snippets не использованы как основание.

Версии: Hono4.13.7 и @hono/node-server2.1.1 stable; supabase-js2.116.0, @supabase/ssr0.12.7, CLI2.117.0 stable. Hosted Supabase/Cloudflare документы — rolling snapshot на дату проверки, не доказательство конкретного deployment. Declarative sync CLI отмечен experimental. Установленные продуктовые версии не исследовались и не обновлялись. Для совместного Node HTTP→Supabase сценария adapter2 требует Node>=20, SDK2.116 требует Node>=22; проверять весь набор, не только Hono.

Расхождения источников обработаны явно: pinned CLI2.117 help/docs против прежнего live declarative guide; pinned SDK2.116 retry implementation против более широкого live описания; adapter2.1.1 engine против старого Node minimum в live Hono guide. Ни одна неверсированная страница не выдана за точный runtime контракт.

Reviewer выполнил чтение, полный hash readback и read-only CLI version/help probes ([результат](supabase-cli-readonly-probes.json)); целевые файлы, глобальная среда, приложения и удалённые сервисы не менялись. Для Hono имеется `node --test test/docs-contract.test.mjs`, но это структурный контракт текста и reviewer его не запускал. Compiler, link/portability, package gates и `pnpm test:ci` в этой оценке не исполнены; их результат не придуман. Ни fresh GPT-6 Astra agent trial, ни реальная HTTP/DB/SSR/Storage/Realtime/Edge/deployment проверка не являются результатом этого отчёта. Historical logs прочитаны как supporting evidence, прежний PASS не перенесён.

Прямые owners: Hono отвечает за маршрут/Context/response lifecycle; Supabase — JWT client/RLS/RPC/transaction boundary; spec-engineer — HRB handoff; architecture-engineer — topology; security-reviewer — независимый security verdict; TypeScript/Node/test owners — язык, runtime и метод проверки. Ownership проверен статически; совместное наблюдаемое исполнение остаётся обязательным последующим gate.

Отсутствие behavioral evidence не отменяет подтверждённые P2: применяется первый пункт ordered verdict contract `skill-reviewer/references/methodology.md:69-78`. Поэтому **FAIL**, а не BLOCKED/PROVISIONAL. Следующий владелец — автор исправлений; после neutral baseline trials подготовить минимальный candidate, зафиксировать snapshot и предъявить эти failure paths на независимый re-audit. [Raw cases и закрытые критерии](case-proposals-hono-supabase.md) предложены до candidate; они ещё не исполнялись.
