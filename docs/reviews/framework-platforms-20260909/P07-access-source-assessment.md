# P07 — независимая оценка literal access source projection

**Вердикт: FAIL — контракт композиции access callback. Достоверность переноса исходника: PASS.** Это ограниченная оценка исполнимого примера frozen baseline, а не blind forward-test агента и не HTTP/DB проверка.

Оценщик независимо прочитал исходный фрагмент, `projection.mjs`, `probe.mjs`, все 18 наблюдений и manifest; пересчитал SHA-256 и машинно сравнил extraction/transformation. Target skills, probe, результаты и данные не менялись; повторного Node/Payload запуска оценщик не выполнял.

## Снимок и полнота evidence

- Source: `baseline-packages/payload/references/plugin-development.md:1052–1078`, SHA-256 `6081759fc1f16b75de63cbb74dd30c28233dfb251323a2c8c63acfe65b25b9c5`.
- Extraction `P07-access-source/original.ts`: SHA-256 `4f5765ee5932dfc3803aad11d465411b36aec1b80fe08a5f3f51436c17da6bfa`; точное равенство указанным строкам подтверждено.
- `projection.mjs`: SHA-256 `7f9e50de5f4e278d5331fa141f2e9f103ab264ab8dc4d19e93de9df913b268a1`; единственные преобразования — удаление параметрического `PluginOptions` и параметрического/возвращаемого `Config`. Семантика не исправлена.
- `probe.mjs`: SHA-256 `6d7e90da2acd743b652ef1d0af2291a65579d6463c6003e64caabccf1af88961`; `observations.json`: SHA-256 `4359a04b7b2df87696415fd055661013677d1e2a83eeba45fd28fc7a9f3c4ca1`. Все хеши совпали с `P07-access-projection-manifest.json`.
- В manifest координатор сообщает Node 24.15.0, `node probe.mjs`, exit 0; первоначальный вызов отсутствующего `.bin/node` завершился 127 до исполнения, затем использован system Node. Отдельной записи этого исполнения в просмотренном infrastructure command journal не найдено, поэтому версия/exit приведены как provenance координатора. Проверены сами исходник и сохранённые наблюдения; независимая воспроизводимость повторным запуском не заявляется.

Probe перебирает `false`, `true`, `Where` синхронно и через Promise для tenant alpha, beta и отсутствующего пользователя: 18 случаев. `await` применяется к внешнему вызову wrapper. Внутренний Promise не теряется при JSON-сериализации: probe фиксирует его тип заранее как `Promise`. Сам probe записывает наблюдения и не содержит assertion gates; exit 0 означает завершение регистрации, а не прохождение критериев.

## Результат относительно заранее записанных критериев

| Проверяемая граница | Наблюдение | Вердикт |
| --- | --- | --- |
| Исходный deny остаётся deny | Во всех трёх sync-false случаях результат — объект `and: [false, tenantFilter]`, а не `false`. | FAIL |
| Boolean/Promise не попадают внутрь Where | 6 из 18 результатов содержат boolean внутри `and`; все 9 async случаев содержат Promise внутри `and`. | FAIL |
| Исходный callback вызывается и получает исходные args | Вызван ровно один раз во всех 18 случаях. Переданные probe `id` и `data` потеряны во всех случаях: wrapper вызывает только `original({ req })`. | Частично: вызов PASS, сохранение args FAIL |
| Поддерживаемый sync Where с известным tenant | В alpha/beta присутствуют исходный `visible.equals=true` и tenant equality в двух элементах `and`. | PASS, только структура callback |
| Отсутствующий пользователь | Второй элемент содержит `tenant.equals=undefined`; сериализованный результат показывает `tenant: {}`. | Нет доказательства корректного anonymous deny |
| Сохранение соседней конфигурации | Во всех 18 случаях сохранены identities fields, hooks, admin, update callback и нецелевой collection. | PASS для указанной структуры |

**P07-S01 / существующий P-B04 — P2:** literal source example не сохраняет boolean/async access contract. Конкретный witness — исходный `false` возвращается вложенным в Where, а Promise остаётся неразрешённым внутри `and`. Это подтверждает технический дефект P-B04 наблюдением функции. Повышение до P1 не обосновано: HTTP/Payload запрос не исполнялся, выдача запрещённых документов не наблюдалась, malformed query может также приводить к ошибке. Ошибка запроса не была бы успешной композицией, но её наличие здесь тоже не проверено.

**P07-S02 — P2, та же поверхность композиции:** wrapper отбрасывает `id`/`data`, необходимые исходным правилам, которые их используют. Probe передаёт оба аргумента и получает null в записи forwarded arguments всех случаев; source однозначно вызывает прежнюю функцию только с `req`. Это не отдельная доказанная эксплуатация.

Ограниченное исправление при последующей авторизованной remediation: сохранить исходные args; дождаться результата; оставить `false` верхнеуровневым запретом, преобразовать `true` в tenant rule, совместить Where с tenant rule. Для отсутствующего пользователя требуется явно определённая политика. Falsifier исправления — тот же набор callback случаев плюс P-core HTTP actor/ID проверки; отсутствие boolean/Promise внутри Where и сохранение исходного deny обязательны.

## Пределы вывода

Нет HTTP/DB, hook execution/order, Payload query processing или proof отсутствия tenant leakage. Identity hooks не доказывает запуск hook. Не исследованы отсутствующий original read, rejected Promise и произвольные другие формы аргументов/config. P07 jobs/workflow не входит в данный пакет и не получает здесь verdict. Полный P07 behavioral outcome должен оцениваться отдельно по фактическому blind P-core исполнению. Эта оценка расширяет evidence P-B04 только до pure callback boundary; остальные пункты baseline review и technical inventory не пересматриваются.
