# Независимая оценка baseline M-runtime

**Наблюдаемая миграция и публичное чтение: PASS в пределах fixture. Полный контракт проверки и отчётности исполнителя: FAIL (P2).** Итоговые данные корректны, HTTP503 и реальное прерывание обработаны повторным запуском, содержимое доступно после перезапуска Next. Однако собственная сверка исполнителя не охватывает все target posts, а отчёт о первом незавершённом harness расходится с окончательным журналом команд. Это не свидетельство потери данных и не отмена подтверждённого runtime результата.

Дата: 2026-09-09. Reviewer: `/root/baseline_payload`, не автор импортера. Кандидатные инструкции и исправления при этой оценке не использованы. Модель, исходный экспорт, mapping и ожидаемые границы зафиксированы до исполнения в [protocol/M-runtime.json](protocol/M-runtime.json). Нормативные входы: `app/REQUIREMENTS.md`, `app/source/README.md`; отдельно предоставленные владельцем `cms=contentful`, `space=fp-space`, `environment=main` записаны в protocol и `app/source/owner-metadata.json`. Запрос этих отсутствовавших в экспорте фактов был уместен; повторного согласования уже принятой модели не было.

## Снимок и способ проверки

Trial: `/tmp/framework-platforms-20260909/trials/baseline/M-runtime`. Прочитаны importer, verifier, сценарии, browser checks, config, страницы, source generator/server/supervisor, входы и выходные свидетельства. Просмотрен `app/evidence/italian-index.png`. Установленные пакеты прочитаны из метаданных: Payload и db-postgres 3.88.0, Next 16.3.4, React 19.2.8, TypeScript 5.9.3. Из ранее замороженных входов изменены package.json (добавлен import script), config (LinkFeature) и index page; исходные export/assets/mapping и skill packages сохранены. Добавленные importer, страницы и supporting checks находятся внутри trial.

Reviewer не запускал установку, сборку, импорт или reset повторно. Выполнение процессов установлено по сохранённому raw command output и проверенным исходникам harness; браузерные assertions не заменены утверждением исполнителя. Координатор дополнительно получил **нефильтрованный read-only SQL snapshot** исключительно принятых content/locale/relation tables, без auth/user/system row contents: `/tmp/framework-platforms-20260909/assessment-probes/payload-db-snapshot.json`. Reviewer независимо сопоставил каждую source identity, локализованное значение, rich-text node/mark/link/upload, связь и media bytes с полными строками этого снимка. Источник запроса и recorder находятся рядом: `payload-snapshot.mjs`, `payload-db-snapshot-commands.jsonl`.

Хеши безопасных входов/выходов и результат этой сверки: [baseline-M-runtime-assessment-snapshot.json](baseline-M-runtime-assessment-snapshot.json). `.env` и зависимости не включены. Дополнительный SQL probe подтверждает доставленное состояние, но не засчитывается как действие baseline исполнителя и не исправляет его checker задним числом.

## Подтверждённые границы

| Требование | Наблюдение и свидетельство |
| --- | --- |
| Реальная запись и полный итоговый набор | SQL: authors=2, authors_locales=4, media=2, media_locales=4, posts=3, posts_locales=6, posts_rels=3; точные составные sourceKey совпадают с полным экспортом, дополнительных/пропущенных/дублированных identities нет. Итоговые author IDs 3/4, media IDs 3/4, post IDs 4/5/6 не подменены source IDs. |
| Локали и content | Для каждого документа присутствуют отдельные en/it строки; name/title/alt/body совпадают с source. REST использует fallback-locale=none; frontend Local API — fallbackLocale:false. Полное дерево rich text сохраняет текст, bold/italic, внутренние post links и embedded media. |
| Связи и optional null | Проверены каждый author/hero/related, null hero у post-3 и цикл 4→5→6→4. Внутренние ссылки и upload IDs разрешены на реальные target записи. |
| Media | Все source/stored bytes совпали при независимом сравнении; verifier отдельно сравнил SHA256 скачанного Payload URL, размер/MIME/2×2 dimensions и отсутствие лишних upload files. Браузерные изображения загрузились из Payload после остановки source server. |
| Настоящий HTTP503 | `503-failure.json`: source server зарегистрировал HTTP503; importer exit1 после двух авторов, до media/posts. `503-import.log` сохраняет ошибку. Восстановление и повтор имеют exit0, source parity и стабильные IDs/файлы в `503-recovery-parity.json` / `503-rerun-parity.json`. |
| Прерывание после persistence | `interruption.json`: независимый REST read уже видит одного автора; media/posts ещё отсутствуют. Supervisor получил control event и завершил принадлежащий ему importer process group SIGKILL; exit137. Recovery и следующий rerun завершаются exit0 со стабильными IDs/файлами и content parity. |
| Реальный consumer после restart | `scenarios.json` фиксирует остановку Next и source server, новый Next process и новый Chromium context. `browser.json` охватывает шесть article/locale страниц плюс assertions обоих index в browser.mjs; проверены title/author, bold/italic, related/body hyperlinks, locale switch, nullable hero и загруженные media/alt. `pageErrors=[]`. |
| Сборка и завершение успешной попытки | commands.jsonl содержит успешные npm ci, typecheck и production build; запись 24 — полный сценарий exit0, 36.707 s, включая all-scenarios-pass. Это отдельная завершённая попытка, независимо от незавершённой первой. |
| Границы доступа/авторитета | Elevated Local API явно выбран для разрешённого setup/import; публичный Next читает с overrideAccess:false. Изменения Lexical разрешены принятым task input. Нет наблюдаемой мутации других БД, users, production или Git. |

## Findings

### M-runtime-01 — P2: собственная «полная» сверка не видит непубличные target posts

**Где:** `app/scripts/verify.mjs:15–24,60`; `app/payload.config.ts:4`; раздел «Полнота данных» в `result.md`.

**Failure path:** verifier делает анонимный REST GET `/api/posts`. Read access возвращает `{published:{equals:true}}`, поэтому totalDocs и identity set относятся только к публичному подмножеству. Неожиданная или оставшаяся после частичного импорта запись с published=false не попадёт в сравнение. Тем не менее evidence `checks` и result.md заявляют full target identity sets и отсутствие unexpected records без указания этого фильтра. Принятое REQUIREMENTS прямо требует полного target набора.

**Наблюдение:** это подтверждённый пробел критерия обнаружения, а не найденная лишняя запись. Дополнительная нефильтрованная SQL сверка reviewer показывает, что фактический итоговый набор данного запуска корректен. Она закрывает вопрос состояния, но оставляет ложную общую полноту checker/отчёта baseline.

**Минимальное исправление:** отдельная явно разрешённая нефильтрованная сверка через elevated Local API либо read-only DB для полного migration inventory, затем отдельная проверка публичного REST consumer. Полностью прочитать набор; сравнить exact sourceKey sets, дубликаты, локали и связи. В отчёте назвать обе границы.

**Фальсификатор:** в изолированном проверочном состоянии непубличная лишняя post запись должна сделать inventory check неуспешным при сохранении успешного public REST чтения ожидаемых статей. Reviewer не создавал такую запись и не менял trial.

### M-runtime-02 — P2: завершение первой попытки заявлено до окончательного recorder результата

**Где:** `result.md`, `app/evidence/initial-harness-failure.json`; `commands.jsonl:28`.

**Failure path:** выходные артефакты сообщают «первый harness прерван exit130». Окончательная запись recorder для `fp20260909-run-7f2308ec` показывает exit124 после 420.016 s с `Recorder timeout; task process group killed`, время завершения 12:33:56 UTC. Result был записан ранее, в 12:31:54 UTC. Следовательно, описанный exit130 не является подтверждённым окончательным результатом первого recorder process.

**Влияние:** теряется точная история неуспешного запуска и преждевременно утверждается его завершение. EADDRINUSE18521 действительно сохранён; координатор отдельно установил оставшийся подготовительный source process и остановил его. Это инфраструктурная помеха, после которой успешный replacement run exit0 доказан записью 24. Timeout не следует приписывать потере данных или успешной второй попытке.

**Минимальное исправление:** дождаться и записать terminal outcome каждой начатой попытки, сохранить её точный exit/signal/duration и связь с ранним запросом остановки; исправить итоговый отчёт по recorder. Не повторять успешный импорт ради исправления описания.

**Фальсификатор:** отчёт о первой попытке и JSON evidence должны согласовываться с окончательной записью recorder; exit130 допустим только как отдельно доказанный результат конкретного вложенного процесса, а не замена exit124 внешней попытки.

## Атрибуция и пределы

Это успешный behavioral witness для выполнения разрешённой Contentful→Payload→Next миграции в данном fixture с реальными failure/recovery и consumer boundaries. Он не доказывает, что baseline skill гарантирует этот результат: сильные REQUIREMENTS, соседние skills, installed types и самостоятельные решения исполнителя также влияют на поведение. Нельзя считать наблюдённый успех изолированным эффектом одной инструкции или автоматически перенести его на candidate.

Проверена одна SIGKILL граница после первого автора; аварии на каждой файловой/транзакционной границе, параллельные импорты, большой набор и production deployment не проверены и не требовались этим case. Импорт целиком неатомарен; повтор проходит весь источник и временно снимает published у статей до заполнения связей. Эти ограничения исполнитель описал. Ранний reset-timeout124 на 45 s сохранён отдельно; явный process.exit одноразового CLI после awaited writes не является доказательством естественного освобождения пула.

**Итог для матрицы:** runtime outcome = PASS; executor full-target-verification/reporting contract = FAIL, findings M-runtime-01/02. Если матрица допускает только один verdict по всем требованиям M-runtime, применять FAIL с явным указанием подтверждённого runtime успеха. Повторение baseline с подсказкой про найденный checker не будет новым blind свидетельством. Для парного candidate сохранить исходный raw task/inputs и оценивать состояния теми же независимыми границами.


## Bounded evidence addendum — 2026-09-09

Это дополнение уточняет только evidence/provenance после публикации sanitized public tool-call inputs/outputs. Повторного исполнения, изменения fixture или исходников не было. Проверен SHA256 соответствующего JSONL против `raw-agent-traces/manifest.json`, export `2026-09-09T12:39:35.739251+00:00`. Manifest фиксирует configured model `gpt-6-astra`, effort `high`; это recorded turn configuration, **не независимая аттестация backend identity**. Public trace не включает полный initial context, incoming conversation, reasoning или системные инструкции, поэтому отсутствие скрытого контекста и абсолютная независимость exposure этим экспортом не доказаны.

[Public trace](raw-agent-traces/baseline_migration_runtime_executor.jsonl), 72 tool events; SHA256 `b896c5e04b455ad3c60ec22ddbff074e6443d010efe74ef8ef9d2f45650702be`; один recorded turn. Строки 1–10 показывают запросы чтения frozen migration/Payload/Next instructions, task/REQUIREMENTS, source, mapping и relevant references; часть больших tool outputs явно truncated. Поздние выборочные rereads видны, но из наличия cat нельзя заключать, что каждый запрошенный root/reference полностью попал в видимый результат. Строки 17–20 и 49–56 подтверждают конкретные installed Lexical/Payload/Postgres/Drizzle source reads; web calls здесь не наблюдаются. Исполнитель реально использовал соседние skills и installed source, поэтому runtime успех по-прежнему нельзя приписывать только payload-migration.

Heredoc bodies теперь прослеживают создание importer/checks/pages и последующие изменения, включая namespace. В строке 15 первоначально подготовлен код с null placeholders для отсутствовавших space/environment. В строке 21 owner-metadata.json записан с fp-space/main, а importer изменён до запуска импорта. Это уточняет процесс подготовки: placeholders существовали в промежуточном коде, но нет свидетельства записи с ними в БД. Доставка входящего owner сообщения не включена в public trace; authoritative текст и время остаются в protocol, наблюдаемое применение — в tool call. Не заявляется независимое восстановление transport содержимого.

### Уточнение M-runtime-02: два реальных кода на разных границах

Новые строки 39–40 **подтверждают** write_stdin Ctrl-C (`chars: \u0003`) для session 50512 и tool result `exit_code:130` в 12:27:43.203 UTC. Строки 29–30 связывают session 50512 с первым runtime-run.py запуском. Поэтому прежнюю формулировку нельзя читать как «exit130 не было» или как выдуманный код: это реальный результат terminal execution surface.

Отдельно commands.jsonl:28 фиксирует docker command `fp20260909-run-7f2308ec`, timeout124 через 420.016 s, окончательная запись 12:33:56.654 UTC. Read-only inspection runtime-run.py/record.py показывает цепь wrapper→recorder→docker и `start_new_session=True` у recorded subprocess. Эти границы могут завершаться по-разному. Сигнал/результат terminal session не доказывает завершения всей вложенной попытки; точное состояние каждого потомка в момент Ctrl-C не восстановлено. **Оба кода следует сохранить с названиями границ, а не заменять один другим.** Успешная replacement attempt exit0 также подтверждена tool lines65–66 и прежней recorder записью24.

M-runtime-02 сужен до недостающего различения lifecycle boundaries и позднего recorder результата в итоговом отчёте; **severity изменена P2→P3**. Исходное утверждение о необоснованном exit130 отозвано в пользу подтверждённого terminal exit130. Материальный M-runtime-01 (public-only target reconciliation) не затронут. **Runtime PASS, полный contract FAIL из-за M-runtime-01 P2 сохранены; итог теперь один P2 и один P3.** Не требуется повторять runtime ради исправления этого evidence addendum.
