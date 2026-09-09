# Baseline HS-runtime: независимая оценка

**Общий результат: FAIL. Hono HTTP-часть — PASS в проверенном локальном сценарии; Supabase data/RPC-часть — FAIL из-за несовпадения нормализации title на прямой границе RPC.** Обнаружен один P2. Авторские14 групп runtime-проверок действительно исполнились успешно, но не покрывают установленный failure path. Это оценка конкретного baseline trial, не итоговые PASS навыков `hono-engineer`/`supabase-engineer` и не доказательство production/Next SSR.

Режим `baseline`, assurance `independent`: оценщик не автор реализации, исправлений или runtime-тестов. Прочитаны frozen contract/protocol, текущие исходники приложения, SQL migration, все три scripts, handoff, manifest/lockfile,5 записей command log и result.md. Тяжёлые команды не повторялись; `.env`, private credentials и чужие данные не читались; БД и исходная реализация не менялись.

## Основание и снимок

Авторитет: [HS-runtime.json](protocol/HS-runtime.json) и [HS-REQUIREMENTS.md](protocol/HS-REQUIREMENTS.md). Fixture `app/REQUIREMENTS.md` побайтово совпадает с frozen требованиями; SHA-256 `c90488c6969331b6ab00b8a3ec943319fe196af547ffed8ce911f783b7ae9bdc`.

Trial: `/tmp/framework-platforms-20260909/trials/baseline/HS-runtime`. Все79 ожидаемых неизменённых поверхностей из protocol, включая active skill copies, task, зависимости, tsconfig, server и исходный health test, совпали с frozen хешами. `src/app.ts` закономерно изменён. [Полный safe readback](baseline-HS-runtime-readback.json) содержит SHA-256 и timestamps оценённых артефактов без credentials.

| Артефакт | SHA-256 |
| --- | --- |
| `commands.jsonl` | `21b2a00410632987c7fa34e96aa76a8d4dc78af8ec2bb4b2fa597dc6704ae804` |
| `result.md` | `d841f1ddcb28656ad22b461aae48f75b63810a2b725aaef1ee334d6709ef5dab` |
| `app/src/app.ts` | `45a7b95a01e31c1249ba45e8206513006b033e09a418ff1079385afde7ab9d50` |
| `app/migrations/001_documents.sql` | `e9ac063c4ffaa4949c9cd689ca6f8d5cb641437301a2cb64251fc0beb4b12cc6` |
| `app/scripts/test-runtime.mjs` | `cd6d4adc61279838b2aa66c00a063e25e9708cae6876e729245203b15567b72b` |
| `app/scripts/readback.mjs` | `31151bbc7a8d1459d254efef7c39b64fc1c854d22ae485666f1ed574f687cd72` |
| `app/DATA_AUTH_HANDOFF.md` | `15f1fd4e9a4aa0c79d161a948a97a53ba272bf1a23215099faebd9a59ac25db4` |

Установленные package manifests прочитаны: Hono4.13.7, @hono/node-server2.1.1, supabase-js2.116.0, Zod4.5.4, TypeScript5.9.3. Manifest и lockfile не изменены. Команды выполнялись в зафиксированном `mcr.microsoft.com/playwright:v1.63.0-noble`, CPU1.25/memory6GB/pids512, `--network host`, с общим временным mount. Отдельного `node --version`/DB server-version вывода в предоставленном журнале нет: Node24 и конкретную версию серверного Postgres нельзя считать независимо измеренными только по executor summary.

## Проверка журнала против кода

В `commands.jsonl` пять завершённых команд, все exit0: `npm ci`, `node scripts/migrate.mjs`, `npm run typecheck`, `node scripts/test-runtime.mjs`, `npm test`. Runtime script имеет14 вызовов `check()`; каждый печатает PASS только после завершения assertions (`scripts/test-runtime.mjs:23`). В stdout15 строк PASS, поскольку дочерний readback дополнительно печатает собственный PASS. Поэтому итог `COMPLETED 14 runtime groups` согласуется с кодом, а не является неверным счётом.

| Требуемая граница | Проверенный путь и assertions | Оценка |
| --- | --- | --- |
| Настоящий HTTP и сохранённый health | `src/server.ts:1-4` запускает Node adapter на127.0.0.1:18510; test `start()` создаёт child server, запросы идут через `fetch`/`node:http` (`test-runtime.mjs:14-29,39-45,61-66`). Исходный `npm test` отдельно проверяет только app.request health. | PASS локального HTTP; health unit не подменён runtime доказательством |
| Реальный Auth и пользовательский client | `signInWithPassword` двух клиентов, `error===null`, токены берутся из полученных sessions (`test-runtime.mjs:40-44`). HTTP middleware создаёт client на каждый запрос, передаёт Bearer JWT и проверяет `getUser(token)` (`app.ts:18-30`). DB owner client существует только в scripts. | PASS указанной Auth/user-JWT границы; не mock и не SET ROLE |
| Admission до body/UUID parsing | Missing/broken/invalid JWT, повреждённая подпись, malformed и oversized unauthenticated body, malformed GET UUID без auth дают401 (`test-runtime.mjs:46-52`). Middleware стоит до handlers (`app.ts:33,68`). | PASS наблюдавшихся negative cases |
| JSON/media/key/body/byte limit/errors | Точные400/415/413/404 и JSON bodies; wrong owner field, invalid status, empty/oversize title, malformed JSON/key/UUID; chunked4097-byte request без Content-Length (`test-runtime.mjs:53-66`). Helper проверяет content-type/no-store (`24-31`); global hooks/error mapping видны в `app.ts:13-15`. | PASS набора; custom chunked assertion проверяет status/body, но не headers отдельно |
| Create/read/defaults/normalization/replay | Новый201, trimmed ASCII-space title, draft default, DTO owner, own GET200, normalized replay200 и тот же документ, конфликт title/status409, counts1/1/1 (`69-80`). | PASS этих входов; это не исчерпывающая межслойная нормализация |
| Owner isolation и scope ключа | UserB получает404 для документа A; missing UUID404; тот же ключ B создаёт независимый документ со своим owner/published (`81-87`). Прямой SELECT A возвращает ID, B — `[]`, anon — error (`107-113`). | PASS наблюдавшейся owner/RLS границы |
| Конкурентные одинаковые повторы |16 одновременно отправленных POST через Promise.all: один201, пятнадцать200, один ID, SQL counts document/audit/request по ключу1/1/1 (`88-94`). | PASS конкретной16-request гонки; не нагрузочный benchmark |
| Конкурентные разные тела | Два POST с одним ключом/разными title: статусы201/409, counts1/1/1 (`95-99`). | PASS конкретной гонки |
| Atomic failure/recovery | Fault header после document insert даёт500; counts по ключу0/0/0 и общий count документов не вырос; повтор без fault даёт201 (`100-106`). SQL64 поднимаетP0001 внутри одной RPC transaction. | PASS наблюдавшегося rollback/recovery |
| Запрет прямых unaudited writes | Для A/B/anon прямые document insert/update/delete возвращают SDK error; audit/ledger select/insert/update/delete тоже error (`114-126`). Migration28-30 выдаёт только own SELECT; записи выполняет единственный definer RPC. | PASS этих denied calls и схемы grants; конкретные SQLSTATE/status deny не сохранены |
| Прямой audited RPC | Anonymous/несколько malformed bodies возвращают error; корректный authenticated RPC создаёт owner из session и counts1/1/1 (`127-135`). | PASS этих вызовов; неполнота domain parity — finding HS-S01 ниже |
| Privilege/RLS/readback | Live catalog проверяет SECURITY DEFINER, `search_path=""`, anon EXECUTE=false/authenticated=true; RLS включён на3 таблицах; orphan/unlogged query=0 (`136-143`). | PASS явных catalog/integrity assertions |
| Restart и отдельное чтение | Test145 останавливает/заново запускает server; child `readback.mjs` создаёт новое SQL connection и Auth client, sign-in, SQL join и повторный HTTP POST; parent проверяет child exit0 (`146-150`). | PASS client/server restart и сохранённого replay result; БД не перезапускалась и этого контракт не требовал |
| Handoff следующему Next consumer | DTO, keys/replay, Bearer/request scope, own SELECT, grants/RPC, HRB inventory и future SSR boundary записаны (`DATA_AUTH_HANDOFF.md:8-59`). | Полезный deliverable; универсальное утверждение о SQL normalization требует исправления; Next implementation/SSR не выполнены |

Restart readback имеет точный предел: SQL join подтверждает наличие document/request/audit и `r.result` равный fixture document (`readback.mjs:10-13`); `d.title` и `a.event` выбираются, но отдельно не сравниваются. Повторный POST подтверждает stored replay, а не новый GET всех текущих document columns. Это сохраняется как предел силы readback, без объявления несуществующего failure.

Для части direct-deny tests проверяется только наличие SDK `error`; например audit insert передаёт неполный объект. Нельзя из каждого такого assertion отдельно вывести именно authorization rejection. Общую оценку grants поддерживают выполненная migration, прочитанный SQL, direct document requests с корректным payload, положительные control reads/RPC и live function/RLS catalog. Код тестов не логирует токены/credentials; `.env` оценщик не открывал.

## HS-S01 · P2 · Прямой RPC допускает title, отвергаемый HTTP

**Дефект подтверждён прямым runtime probe после статической диагностики.** Исходные14 runtime-групп не содержат этого входа и сохранены неизменными. Отдельный root assessment probe выполнился2026-09-09T12:18:46Z с exit0; оценщик прочитал его code, command log и фактический JSON результата. Основание finding — различающиеся условия кода/SQL плюс наблюдаемое принятие недопустимого title, а не само отсутствие теста.

Точные места:

- `app/src/app.ts:9`: Zod `z.string().trim().min(1).max(120)`;
- installed `node_modules/zod/v4/core/api.js:707`: trim вызывает `input.trim()`;
- `app/migrations/001_documents.sql:5,48-49`: длина и равенство `btrim(title)` без явного набора whitespace;
- `app/migrations/001_documents.sql:62-70,74`: authenticated RPC проходит эти условия, вставляет документ/audit и возвращает результат;
- `app/DATA_AUTH_HANDOFF.md:25-28,56-58`: заявляет SQL normalization и разрешённый прямой audited RPC;
- `app/scripts/test-runtime.mjs:129-130`: malformed RPC набор не проверяет whitespace-only title или нормализацию по той же функции, что HTTP.

PostgreSQL `btrim(text)` без второго аргумента удаляет только обычный пробел; `length(text)` считает символы. Поэтому строка из одного tab имеет длину1 и равна своему `btrim`, тогда как JS trim превращает её в пустую строку. Это подтверждено [официальным контрактом PostgreSQL string functions](https://www.postgresql.org/docs/current/functions-string.html), проверенным2026-09-09, и установленным Zod source. Версия серверного Postgres отдельно не выводилась в original log; семантическое расхождение дополнительно наблюдалось непосредственно на предоставленной DB/RPC границе.

Failure path: обычный authenticated caller вызывает разрешённый `fp_create_document` → передаёт title из одного tab → SQL validation/table CHECK считают его допустимым → RPC фиксирует whitespace-only title, который тот же сервис на HTTP входе отвергает как400 invalid_request. Owner/audit/idempotency остаются в силе; дефект касается инварианта нормализованных данных, а не чтения чужих документов или unaudited write.

Минимальный falsifier для отдельного assessment probe:

```text
POST /rest/v1/rpc/fp_create_document
Authorization: Bearer <реальный access JWT обычного тестового пользователя>
apikey: <заданный compatibility key, не выводить в evidence>
Content-Type: application/json

{"p_key":"assessor_trim_20260909_1","p_body":{"title":"\t","status":"draft"},"p_fail":false}
```

SQL signature: `public.fp_create_document(text,jsonb,boolean)`. **Наблюдаемый отдельный probe:** RPC вернул HTTP200, `replayed:false`, `document.title="\t"`; независимый SQL join document/request/audit вернул одну строку с title tab, probe key и event `created`. Сопоставимый Hono POST `/documents` с тем же body и отдельным ключом вернул400 `{error:"invalid_request"}`, `Cache-Control:no-store`. Probe фиксирует raw результат, а не только success marker. Он не добавлен задним числом к исходным14 группам. Отсутствие записи по отдельному HTTP probe key отдельно SQL-запросом в этом probe не проверялось; Hono отказ до RPC установлен кодом.

Basis: **direct** — код, фактические ответы HTTP/RPC и отдельный persisted SQL join. Confidence **high** в установленном межслойном дефекте. P1 screen: **P2** — поддержан ограниченный обход проверки нормализованного title через разрешённый audited API. Нет доказанного обхода owner/RLS, потери audit, опасного действия или систематического routing failure. Общий `completed` result нельзя переносить на полную эквивалентность HTTP/RPC validation, но из одного неподтестированного входа не делается вывод о тотальной ложной capability навыка.

Минимальное направление исправления для владельца: определить одну принятую семантику нормализации и одинаково применять/проверять её на HTTP и прямом SQL/RPC boundary. Сохранять режим normalised-only RPC либо нормализовать до idempotency comparison по явно выбранному контракту; не закрывать owner-issue запретом всей разрешённой RPC capability. Закрывающий тест сравнивает прямой RPC и HTTP для tab/newline/whitespace-only и непустой строки с краевыми whitespace, проверяет отсутствие недопустимых записей и сохраняет существующие race/rollback/RLS oracles. Изменение определения title без согласования — не remediation.

## Раздельные owner-выводы и ограничения

**Hono:** PASS для реализованных HTTP/middleware/error/type задач данного локального fixture и записанных assertions. Admission, actual-byte bound, media/key/schema checks, response contracts, user-scoped Context и existing composition подтверждены кодом/логом. Отдельной доказанной Hono-ошибки в оценённом наборе не установлено. Это не проверка Bearer middleware semantics, Workers defaults, других адаптеров либо всего Hono baseline skill.

**Supabase:** FAIL для полного принятого data/auth handoff вследствие HS-S01. При этом реальные положительные результаты Auth-issued sessions, userJWT path, RLS/grants, audited RPC, concurrency, atomic failure и restart/readback сохраняются. Нельзя заменять их формулировкой «проверена только документация»; нельзя и повышать их до полной domain parity.

**Interop:** Hono и Supabase разделены естественно: HTTP Context/DTO/wire versus real userJWT/RLS/RPC/transaction. Следующий Next consumer получает ограниченный handoff, но не реализованный SSR lifecycle. Общий сценарий не закрыт полностью из-за HS-S01. Отсутствует source-read tool trace до/вне записанных runtime commands: нельзя подтвердить какие именно тела/references исполнитель загрузил, что он не видел assessor rubric/других файлов, и причинно приписать дефект конкретной строке skill. Protocol фиксирует назначение `gpt-6-astra/high/no fork`; actual backend model identity не доказана этими файлами. Shared-filesystem restriction было инструкцией, не OS ACL.

Локальность предоставленной Auth/PostgREST/DB среды задана protocol owner. Код использует реальные SDK и SQL соединения без mocks; точные env origins/credentials намеренно не прочитаны оценщиком. Observed command log не содержит отдельного пакета сырых HTTP/SQL ответов: факт assertions восстанавливается по исполнившимся scripts и exit0/PASS markers. Нынешние source hashes и mtime предшествуют relevant command timestamps, но command log не хранит per-command source hashes; текущий readback не является криптографической аттестацией исторического filesystem.

Migration helper сбрасывает только три task-таблицы и named function (`scripts/migrate.mjs:7-8`); deployment, Git, cloud и другие task databases не затрагиваются прочитанным кодом. Строка `unrelated tables unchanged` в stdout не является отдельным before/after catalogue сравнения. Контрактные зависимости сохранены, лабораторный pg import служит setup/readback, а не HTTP data path. Никакой общей production/scale/OS/remote-service сертификации этот отчёт не даёт.

Следующее действие владельца: сохранить original baseline и отдельное probe-наблюдение, затем провести минимальную remediation и тот же candidate falsifier с необходимыми adjacent invariants. Сам оценщик исходники и БД не исправлял.

## Отдельное подтверждающее probe evidence

- [hs-trim-result.json](/tmp/framework-platforms-20260909/assessment-probes/hs-trim-result.json) — фактические RPC200/title tab, HTTP400/no-store и persisted SQL row.
- [hs-trim-commands.jsonl](/tmp/framework-platforms-20260909/assessment-probes/hs-trim-commands.jsonl) — отдельная команда `node hs-trim.mjs`, exit0, raw stdout; original runtime log не изменён.
- [hs-trim.mjs](/tmp/framework-platforms-20260909/assessment-probes/hs-trim.mjs) — обычный Auth user client, прямой fetch RPC, тот же Hono server и отдельный SQL readback; оценщик прочитал код без чтения `.env`.

Хеши probe и повторный readback оригинальных артефактов добавлены в [safe snapshot](baseline-HS-runtime-readback.json). Лабораторные UUID не нужны для вывода и здесь не повторяются. Probe принадлежит assessment evidence, а не исходному blind execution. Его результат не доказывает происхождение исходной ошибки из конкретной инструкции скилла.


## Дополнение: публичные reads/writes и точный snapshot, 2026-09-09

Общий **FAIL**, bounded Hono PASS и finding **HS-S01 P2** сохранены. [baseline_hs_runtime_executor.jsonl](raw-agent-traces/baseline_hs_runtime_executor.jsonl) содержит26 событий. Events1/3/5 связывают исполнение с заданием, `REQUIREMENTS.md`, обоими root skills, Hono framework-currency/HRB и Supabase HRB/auth/client-setup/RLS/db-functions/security-privileges/operations-reliability/database references; также видны package, app/server/tsconfig/health и официальные Hono/getUser/functions pages. Чтение `.env` программой выводит только имена переменных; значения для оценки не раскрывались.

**Уточнение загрузки:** event2 помечен `truncated output`. Поэтому факт команды `cat` обоих root bodies не доказывает, что весь их текст был представлен executor. Последующие конкретные reference outputs не имеют этой отметки; данные подтверждают видимый маршрут retrieval и частичную root exposure, но не полное потребление всех active instructions.

Heredocs events11/13/15/23 и явные четыре string replacements SQL позволяют восстановить семь текущих артефактов побайтово без исполнения записанного кода: `app/src/app.ts`, `001_documents.sql`, `DATA_AUTH_HANDOFF.md`, `migrate.mjs`, `readback.mjs`, `test-runtime.mjs`, `result.md`. Замена переменной SQL `result` на `v_result` записана до migration/runtime gates. Это существенно усиливает связь текущего reviewed code с code, созданным и проверенным в trial, сверх прежней опоры на mtime. Финальные hashes занесены в delta readback. Это всё ещё не per-command filesystem attestation и не отдельный сырой пакет HTTP/SQL responses.

Публичные inputs/output согласуются с пятью ранее проверенными runtime commands и их успешными exit codes. Ни новая source attribution к конкретной инструкции, ни remediation baseline не доказаны этим addendum. Отдельный whitespace probe остаётся отдельным assessment evidence; исходный runtime не превращён задним числом в trial с этим falsifier.

Проверены SHA-256 trace против manifest и последовательность публичных tool-call inputs/outputs. Model `gpt-6-astra`, effort `high` теперь наблюдаются в записанной turn configuration; это не независимая аттестация фактической backend model identity. Экспорт не содержит полного контекста/dispatch history: из него нельзя доказать отсутствие любой незафиксированной экспозиции. В явных reads не обнаружены candidate или закрытый rubric. Непрозрачные служебные communication payloads не интерпретировались и не использованы для выводов. Поведенческие испытания, изменения trial/candidate и обращения к БД оценщиком не выполнялись.
