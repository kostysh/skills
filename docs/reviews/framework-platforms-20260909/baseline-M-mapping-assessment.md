# Baseline M-mapping — независимая оценка исполнения

**PASS для ограниченного случая M-mapping: чистая подготовка преобразований предоставленных fixture.** Материальных P1/P2 в выполнении этого raw task не установлено. Это не общий PASS скилла `payload-migration`: исходный source-review FAIL остаётся в силе. Корректное выполнение агентом конкретного случая не устраняет дефекты инструкций и не подтверждает все миграционные возможности.

## Scope, snapshot и экспозиция

Raw task и inputs зафиксированы в [protocol/M-mapping.json](protocol/M-mapping.json), freeze `2026-09-09T12:07:16.319331+00:00`. Оценщик сопоставил фактические файлы `/tmp/framework-platforms-20260909/trials/baseline/M-mapping` с **каждым** input SHA256 протокола: расхождений нет. Критерии — ранее зафиксированный M03 из [case-proposals-payload.md](case-proposals-payload.md), с ограничением raw task: импорт, БД и установка зависимостей запрещены; разрешены JS/TS mapping и локальные чистые вызовы.

Это forced execution. В `commands.jsonl:1–2` записано чтение task, sources, root `payload-migration` и его активного field reference. Копия `payload` также присутствовала в exposure, но её фактическое чтение журналом не подтверждено. Каталожный выбор этим случаем не испытывался. GPT-6 Astra предписана общей программой; конкретная runtime identity/model settings не содержатся в этих артефактах и здесь не объявляются независимо подтверждёнными. Координатор должен связать case с actor/model metadata общей программы.

Полная external-source read/tool trace недоступна. `result.md` содержит официальные ссылки и прямо сообщает неудачу одной попытки прочитать exact-tag source. Поэтому этот assessment не удостоверяет, какие именно официальные страницы исполнитель прочитал. Технические значения сопоставлены оценщиком с ранее проверенной официальной базой, а не приняты по наличию ссылок в ответе.

## Критерии → фактическое наблюдение

| Критерий M03 / raw task | Наблюдение и оценка |
| --- | --- |
| Разные WordPress formats и состояния | `mapping.mjs:72–93` имеет отдельные REST/DB branches. `publish/private/future` преобразованы в `published/private/scheduled`; неизвестный `pending` отклоняется. GMT из обеих форм представлен `2026-06-02T10:00:00.000Z`, локальное 12:00 не присвоено UTC. REST title entity `&amp;` декодирован. **PASS.** |
| Unix seconds и milliseconds | `mapping.mjs:68–70`, tests:15–19: явные units, seconds ×1000. Оба сохранённых значения совпадают с `2026-06-02T10:00:00.000Z`. Единица не угадывается. **PASS.** |
| HTML не принимается за richText | `mapping.mjs:17–32` строит ограниченный Lexical root/paragraph/text tree; `Hello ` и bold `Ada` сохраняются раздельно. Unsupported HTML отклоняется. Неизвестная локаль WP оставляет body `needs-input`, а не подставляет en. **PASS в grammar данного fixture.** |
| Strapi5 identity и Markdown/Blocks | Использован `documentId=article-stable-id`, а не numeric `id=15`. Markdown даёт bold `Bold`, Blocks — italic `Italic`. Оба кандидата оставлены, явный выбор `bodySource` требуется из-за различного содержания. Missing title/relations/media названы. **PASS.** |
| Contentful links/locales | Namespace содержит space/environment, Entry и Asset сохранены как разные unresolved source references; Payload IDs не выдуманы. `title` содержит en/it. `localeWrites` даёт отдельные patches одного документа; unresolved author/hero отсутствуют в shared write data. Missing body/publication metadata названы. **PASS.** В fixture нет Contentful Rich Text AST; его преобразование этим случаем не проверено. |
| Sanity Portable Text и custom block | Обычный strong span преобразован только в `supportedPreview`. Полный body с `productCard` сохранён в `source`, имеет `needs-input` и не содержит ready `value`. Нужны block schema/feature, converter и product reference. `_id` не объявлен доказательством публикации; отсутствующие project/dataset/locale отмечены. **PASS.** |
| Нет invented IDs или ложной локализации | Все неподтверждённые links остаются `needs-input`; unit ID 42 из теста не попал в `mapped-values.json`. Неизвестные WP/Sanity locale не выбраны автоматически; отсутствующий it не копируется из en. **PASS.** |
| Авторитет модели и предел результата | Принятый `publicationState` enum сохранён; исполнитель явно отделил его от `_status`, privacy и scheduling. Не создавал лишние коллекции/БД и не запрашивал повторное schema approval. Сообщил необходимые missing inputs. **PASS.** |
| Проверки и честная граница | Записаны 8/8 unit PASS и генерация JSON exit0. Отчёт прямо отрицает DB/import/renderer proof и ограничивает converter grammar. **PASS.** |

Ключи WP/Strapi объявлены схемой для независимых наборов примеров, не глобальной identity guarantee. Исполнитель отдельно потребовал namespace установки/окружения/content type для реального переноса. Это допустимо для предоставленного raw task; готовность этих ключей к production reconciliation не доказана.

## Доказательства и действия оценщика

Прочитаны все строки `mapping.mjs` и `mapping.test.mjs`, источники, результат и command metadata; сохранённый `mapped-values.json` разобран и сопоставлен с actual output. В журнале исполнения:

- `commands.jsonl:4`: `node mapping.mjs`, exit 0, `2026-09-09T12:10:37.108937+00:00`.
- `commands.jsonl:5`: `node --test mapping.test.mjs`, exit 0, tests 8 / pass 8 / fail 0, `2026-09-09T12:10:37.230694+00:00`.

Оценщик не повторял весь test suite. Выполнен один независимый read-only Node invocation с **11 assertions**: exact artifact parity, WP state/GMT, обе timestamp units, unresolved WP body, точные Contentful locale patches, сохранность Sanity full source и отсутствие ready body, strong preview, explicit WP it body и explicit Strapi Blocks italic. Результат: **PASS**, exit 0. Вызов не писал файлов, не создавал БД и не устанавливал пакеты.

| Артефакт | SHA256 |
| --- | --- |
| `mapping.mjs` | `e43411a488243095183cfe3123294450574d5cf70cf17571bb07a50235c887cd` |
| `mapping.test.mjs` | `302290caf54a7868553805c51e266e30f35e0647ffb19963ae189d002e251a8b` |
| `mapped-values.json` | `fb78fca610130c72ae0f3d5204d9b6dbef077d57eb2ae294db3450a62aeb5ed4` |
| `commands.jsonl` | `aa1b44210e1a29c5433ee543f5fccd1a4635d08d35687ebfdfdbcaefc35379e6` |
| `result.md` | `a6a758d3bd5184b69fe88211b4a6ce48dea71956e1d2e26ed11fe77c8be2cd4b` |

## Пределы вывода

Нет доказательства installed Payload 3.88/Lexical acceptance, editor import/export, DB write/read, media download/upload, relation resolution в существующую БД, rendering, crash/rerun или reconciliation. Они не требовались этим raw task и местами были прямо запрещены. Тесты — fixture-specific pure transformations; они не подтверждают универсальный HTML/Markdown/vendor AST converter. Contentful AST отсутствует, Sanity custom block намеренно не преобразован без необходимых контрактов. Generic malformed/absent inputs вне заявленной grammar также не покрыты полностью.

Следующее действие координатора — сохранить этот baseline PASS как ограниченный результат M-mapping и применить **тот же** raw task/fixture/rubric к candidate. Проверки реального импорта и полного Contentful rich text должны остаться в отдельном authorized migration runtime case. Не переносить этот PASS на пакет целиком и не подменять им независимый candidate review.


## Bounded evidence addendum — 2026-09-09

Это дополнение уточняет только evidence/provenance после публикации sanitized public tool-call inputs/outputs. Повторного исполнения, изменения fixture или исходников не было. Проверен SHA256 соответствующего JSONL против `raw-agent-traces/manifest.json`, export `2026-09-09T12:39:35.739251+00:00`. Manifest фиксирует configured model `gpt-6-astra`, effort `high`; это recorded turn configuration, **не независимая аттестация backend identity**. Public trace не включает полный initial context, incoming conversation, reasoning или системные инструкции, поэтому отсутствие скрытого контекста и абсолютная независимость exposure этим экспортом не доказаны.

[Public trace](raw-agent-traces/baseline_mapping_executor.jsonl), 14 tool events; SHA256 `4e3a8997b85814f7e545334dcf4b1707cc06a2491856ede955d5d5d31eaa9f97`; один recorded turn. Строки 1–4 подтверждают чтение task/sources, root payload-migration и field reference. Чтение root payload по-прежнему не наблюдается; forced exposure не становится catalog-selection evidence.

Прежняя оговорка «external-source tool trace недоступна» теперь заменена наблюдаемой узкой экспозицией: строки 5–8 содержат два web вызова и ответы. Были search snippets официальных WordPress Posts (date_gmt/status), Strapi5 (documentId/locale), Sanity Portable Text/custom blocks и Contentful assets/localization; поисковая выдача также содержала сторонние результаты. Payload rich-text overview и localization были запрошены через open; сохранённый короткий ответ содержит сведения о страницах, но не полный их текст. Exact-tag nodeFormat.ts вернул `Internal Error`, а не успешно прочитанный типовой контракт. Поэтому факт web-запросов и получения фрагментов подтверждён, **полное source-grounded покрытие и прочтение целых страниц не заявляются**.

Строки 9–10 и 13–14 сохраняют heredoc bodies создания mapping/tests/result; происхождение артефактов теперь прослеживается дальше, чем recorder `python -`. Строки 11–12 согласуются с уже оценёнными node test и mapping outputs. Новых несоответствий фактическим значениям не установлено. **M-mapping PASS и прежние runtime/grammar limits сохранены.**
