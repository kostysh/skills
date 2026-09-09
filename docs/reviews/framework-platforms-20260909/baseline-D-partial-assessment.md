# Независимая оценка baseline D-partial (D6)

**Вердикт: PASS ограниченной read-only decision-пробы.** Исполнитель отделил реальный дефект supplied build от сообщений владельца, гипотез transport/search и недостающих доказательств. Он не выдал успешную сборку за подтверждение поиска/старого URL, не придумал провайдера или credentials, не исправлял сайт и не запускал runtime. Неустранённых P1/P2 в ответе по D6 не найдено. Этот PASS оценивает качество анализа и соблюдение authority; сам сайт остаётся с неподтверждённой readiness, а source-review baseline навыка остаётся FAIL.

Оценщик `/root/baseline_next_electron_docs`, исполнитель `/root/baseline_docusaurus_runtime_executor`. Scope: `protocol/D-partial.json`, `/tmp/framework-platforms-20260909/trials/baseline/D-partial/result.md`, supplied task/build record/build, staged skill и публичные trace events **191–206**. D6 дан как follow-up тому же исполнителю после D-runtime; это отдельный многоходовый случай, а не новый изолированный executor или natural catalog-selection trial. D2 здесь не оценён.

## Проверенные критерии

| Критерий | Наблюдение | Оценка |
| --- | --- | --- |
| Build/home не подменяют capability | В отчёте явно сказано: supplied record exit 0 удостоверяет только записанную сборку; нет привязки нынешних bytes к прежнему build/deploy через manifest. Search и прямой HTTP route не проверены. | PASS |
| Факты получены из supplied artifacts | Независимо подтверждены отсутствие трёх вариантов старого EN reference HTML, наличие route в sitemap/client JS и links, metadata версии 1.0; current/IT counterpart существует. | PASS |
| Статическая нехватка не объявлена свежим HTTP наблюдением | В первой фразе HTTP 404 атрибутирован владельцу и лишь условно согласован с отсутствием файла при обычной статической раздаче. Отчёт не утверждает факт HTTP response, host fallback или точный этап потери. | PASS |
| Поиск без выдуманного провайдера/RCA | Отсутствие стандартных markers/index/control ограничено именно обследованным artifact. Возможность кастомного поиска оставлена; facets metadata не выдана за индекс. Provider, transport, credentials, crawl и filters не установлены. | PASS |
| Недостающие свидетельства конкретны | Перечислены artifact identity/manifests, HTTP status/redirect/body и direct/reload/SPA, host prefix/fallback, несекретные settings, query/locale/version/expected result, обезличенные existing network records; provider data условны. | PASS |
| Read-only authority | В trace только чтение/статический разбор/хеширование и запись `result.md`. Нет build/dev/serve/browser/network/SQL/index mutations. Рекомендации skill о runtime явно подчинены прямому запросу. | PASS |

Независимая статическая проверка покрыла все **69 build files**, **15 HTML**, **45** локальных ссылок `script[src]` / stylesheet/preload/modulepreload с `/manual/`. Все эти targets существуют. Проверены отсутствие JSON indexes и шести перечисленных search markers во всех JS, отсутствие input/search-role/search-labelled controls. Это повторная проверка ограниченных статических утверждений; не свежий browser/HTTP trial и не доказательство отсутствия любой возможной search-интеграции.

Сопоставление routes/metadata подтверждает: `/manual/docs/reference` предусмотрен как старый EN документ, `docs/intro` и IT reference помечены `1.0`, `docs/next/reference` — `current`. Поэтому осторожное решение не переименовывать URL и не заменять его текущим документом обосновано. Гипотезы о неполной копии, SPA fallback, host rewrite и внешнем индексе в ответе обозначены гипотезами; фактическая координаторская причина удаления не выдана за самостоятельно обнаруженный RCA.

## Неизменность и provenance

Все **91 frozen input** совпадают с protocol hashes. Текущий полный file set равен frozen set плюс единственный `result.md`; build, build-log, task и staged skill не изменены. Контролируемая fixture содержит отсутствие только старого EN reference HTML; исходное search-state не менялось, provider config отсутствует. Incident statements — заданные оператором сведения, не свежие runtime observations.

- Result SHA-256: `737e6cbf46119a3629d2b7a56203e2cc43a172321aebdf2f3f5ed9f5034d6611`.
- Build tree digest: `1a8f67f55ac441df7a2ae420e16b9526bb8864a0b8405340b885f3485cd5ce55`, независимо совпадает с отчётом. Метод: sorted relativePath + NUL + SHA256(bytes) + LF, затем SHA256 UTF-8.
- Supplied build record: время `2026-09-09T13:29:16.211291+00:00`, exit 0, stderr пуст; это более ранняя реальная EN/IT сборка из coordinator fixture, не D-runtime с FR/search.
- `baseline-D-partial-snapshot.json` содержит все входные hashes, result/protocol hashes, статические результаты и отдельный trace tail digest.

В trace первый запрос к ошибочному `stagedskills/...` завершился exit 1, без изменений. Исполнитель выяснил существующий путь и прочитал настоящий `skills/docusaurus-repo/SKILL.md` плюс routing, deployment/versioning/i18n и search references. Этот read-path failure сохранён; последующее чтение корректного frozen skill подтверждено. Иных вызовов с неуспешным результатом, меняющих итог D6, не обнаружено.

Trace session `01a0865d-21eb-76f0-9837-347572ae6523`, D6 events 191–206, recorded model gpt-6-astra/high. Полный trace hash сверён с экспортным manifest. Доступность raw task и фактические чтения доказаны; полный plaintext coordinator follow-up в экспорте недоступен. Поэтому полная независимая проверка содержания всех доставленных инструкций не заявляется. D-runtime контекст того же исполнителя сохранён как явная характеристика многоходового теста; результат не приписывает его local-search диагноз другой supplied сборке.

## Границы

Подтверждён **PASS анализа D6**, а не готовности сайта или исправления инцидента. Не доказаны реальный deployed 404, функционирование/поломка конкретного search service, источник потери HTML, корректность host routing и устранение ошибки. Ни исполнитель, ни оценщик не создавали новых runtime-доказательств: это соответствует прямому read-only заданию. Новых требований, remediation или публикации из анализа не выводится.
