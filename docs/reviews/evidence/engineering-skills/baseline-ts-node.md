# Baseline review: typescript-engineer и node-engineer

**FAIL — independent baseline.** Подтверждены три локальных P2: несостоятельный overload-пример, завышенная гарантия `as const` и объединение встроенного Node stripping со сторонними loaders под одним правилом import extensions. Новые поведенческие результаты координатора ещё не предоставлены; их отсутствие не отменяет установленные дефекты и не позволяет выдать полный PASS.

## Основание и граница

Потребитель результата — оператор и автор следующей source-first редакции двух навыков. Проверена способность навыков вести TypeScript- и Node.js-работу в своих границах: диагностировать, выбирать sound type/runtime contract, сохранять public consumers, разграничивать read-only и change, направлять специализированные решения и не выдавать статические проверки за runtime-доказательства. Это аудит инструкций, а не проверка реального приложения, всех поддерживаемых версий или native activation.

Основание: действующие `AGENTS.md`, `docs/skill-standard.md`, `skill-reviewer/SKILL.md`, `references/methodology.md` и `references/forward-testing.md`. Reviewer не автор baseline и не выполнял remediation. Целевые инструкции, примеры и история рассматривались как данные аудита. Проверки состояли из чтения, поиска, хеширования, сравнения с Git и чтения официальных источников. Единственная запись — этот отчёт; целевые пакеты, G5, Git refs и зависимости не менялись. Trials и делегирование reviewer не запускал.

Snapshot: `504b87331f22b3a5303875bef69163a40d4372d7`, [baseline-snapshot.json](baseline-snapshot.json), `sha256`, пути POSIX относительно корня пакета. Далее `TS/` означает `baseline-packages/typescript-engineer/`, `Node/` — `baseline-packages/node-engineer/`.

| Пакет | Файлы | Aggregate из переданного manifest | Независимый readback |
| --- | ---: | --- | --- |
| typescript-engineer | 21 | `89133410887087af23889fb68e7d1ee46ada944889a818d3b13fe6f510921fde` | Все file hashes совпали; все байты совпали с указанным Git base; лишних файлов нет |
| node-engineer | 15 | `7c76f185c6e790b8b36081346a147e463c2f1e4d9b790443454caad4e9ea324c` | Все file hashes совпали; все байты совпали с указанным Git base; лишних файлов нет |

Прочитаны оба source manifest, overview fragments, emitted `SKILL.md`, UI metadata, все 13 локальных references; supporting navigation/compile reports и релевантные исторические evidence/лог-границы. Прямые соседи проверялись только для interop: `typescript-test-engineer`, `code-reviewer`, `cli-engineer`, `architecture-engineer`, `implementation-discipline`. Это не отдельный baseline-аудит соседей.

## Материальные находки

### TS-01 — P2: базовый overload обещает `object`, который реализация не обеспечивает

- **Locator:** `TS/references/overloads.md:34–47`, прежде всего строки 37–43; reference подключён в `TS/skill.yaml:23–29` и `TS/SKILL.md:169`.
- **Basis: direct**, высокая уверенность. `parse(input: string): object` непосредственно возвращает `JSON.parse(input)`. Для JSON `null`, чисел, строк и boolean результат не соответствует `object`. Обратная ветка также обещает строку для любого `object`, хотя объект с `toJSON`, возвращающим `undefined`, не обеспечивает эту гарантию. Это расхождение активного образца с собственным требованием sound public contract, а не просто отсутствие defensive validation. [ECMAScript: JSON.parse](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.parse), [JSON.stringify](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.stringify).
- **Failure path:** запрос на input-dependent API → загрузка Basic Pattern → перенос объявленного overload в публичную обёртку → принимаемый компилятором вызов `Object.keys(parse("null"))` опирается на ложную non-null object гарантию. Это аналитический контрпример, не выполненный trial.
- **P1 screen:** поддержан локальный дефект публичного type/runtime контракта образца. Универсальное ложное закрытие задачи или опасная внешняя операция не установлены: root отдельно запрещает считать typecheck runtime-доказательством и требует consumer checks. Поэтому P2, а не P1.
- **Направление закрытия:** заменить базовый пример на действительно sound input/output relation либо явно обеспечить и проверить ограничения JSON-веток. Не добавлять общую validation-архитектуру ради учебного примера.
- **Узкая проверка:** проверка точного исправленного snippet поддерживаемым compiler, положительные overload calls и граничные результаты обоих направлений. Для сохранённого JSON-примера обязательно включить scalar/null и `toJSON`-случай; поведенческий executor не должен объявлять гарантии по одному compile success.

### TS-02 — P2: `as const` ошибочно обещает глубокий readonly для вложенных ссылок

- **Locator:** `TS/references/runtime-derived-types.md:187–189`; подключение `TS/SKILL.md:172`, source `TS/skill.yaml`, reference `ref-runtime-derived-types`.
- **Basis: direct**, высокая уверенность. Фраза «`as const` makes data deeply readonly» не ограничена литерально созданными вложенными значениями. Для `const values = [1]; const config = { values } as const` выражение `config.values.push(2)` остаётся допустимым. Официальная документация показывает именно ограничение через ранее созданную array reference. [TypeScript 3.4: const assertions, Caveats](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#caveats-1).
- **Failure path:** запрос на readonly API конфигурации с переиспользуемым массивом → рекомендация `as const` как достаточного глубокого readonly → публичный потребитель всё ещё может менять элементы через вложенную ссылку. Ошибка затрагивает собственную type-system способность навыка, даже без предположения о runtime freeze.
- **P1 screen:** установлен ограниченный edge-case дефект type guarantee. Root запрещает выводить runtime безопасность из типа, а источники не дают оснований утверждать систематическое ложное закрытие или опасное действие. P2.
- **Направление закрытия:** уточнить literal-context и alias границы; отделить readonly представление от runtime immutability. Не предписывать deep-freeze или deep-readonly helper без принятого контракта.
- **Узкая проверка:** сравнить вложенный literal и ранее созданный mutable array/object. Проверка должна подтвердить запрещённое переназначение readonly свойства и допустимую мутацию содержимого по сохранённой ссылке; отдельный достаточный кейс защищает от ненужного усложнения простого literal-only API.

### NODE-01 — P2: source execution через loader ошибочно подчинён правилам native stripping

- **Locator:** `Node/fragments/overview.md:24` → emitted `Node/SKILL.md:65`; повтор того же общего правила — `Node/references/runtime-typescript.md:53–56`.
- **Basis: direct + inferred failure path**, высокая уверенность в неверном обобщении. Строка явно объединяет «Node built-in stripping or an explicit loader» и требует `.ts/.mts/.cts` specifiers. У стороннего loader resolver может быть другой контракт: `ts-node` документирует remapping `./foo.js` → `foo.ts` при `experimentalResolver`. Native stripping и full loader support также разделены в официальной Node документации. [ts-node experimentalResolver](https://typestrong.org/ts-node/docs/options/#experimentalresolver), [Node TypeScript support](https://nodejs.org/api/typescript.html#enabling).
- **Failure path:** исправный проект с loader-resolved `.js` imports и production emit → запрос на диагностику соседнего runtime-сбоя → применение общей строки матрицы → необязательное требование переписать imports на `.ts` либо необоснованная блокировка корректного loader-контракта. TypeScript owner затем получает неверный runtime input и может изменить compiler/emit path без причины.
- **P1 screen:** подтверждён конкретный interop/compatibility edge case. Root требует inspection установленного tooling, ограничивает mutations и запрещает скрытую смену production artifact, поэтому систематическая ошибочная маршрутизация или разрешение опасного действия не установлены. P2.
- **Направление закрытия:** разделить built-in и custom loader режимы; для loader потребовать фактический resolver/transform contract и version-matched evidence, сохранив существующие source/emitted границы.
- **Узкая проверка:** одинаковая source/emitted задача в двух вариантах — native stripping и существующий loader с документированным `.js` → `.ts` mapping. Ожидание: native ограничение применяется только в первом; корректный второй вариант не получает forced rewrite, нового loader или ложного blocked. Проверить downstream emitted entry отдельно.

## Сильные стороны, interop и нематериальные замечания

- TypeScript root явно сохраняет public callers/declarations, graph-aware typecheck, positive/negative type assertions, installed lint-rule coverage и запрет установки отсутствующего линтера в несвязанной задаче. `monorepo.md` отдельно исключает ложный green от `files: []`; toolchain reference разделяет emitter, resolver и declaration consumer.
- Node root и references последовательно требуют actual executed artifact и проверяемый version range. Версионные утверждения о stripping по умолчанию, stable boundary 24.12 и удалении transform flag в 26 согласуются с открытой официальной Node документацией на дату проверки. Реальный запуск этих majors здесь не выполнялся.
- Streams reference корректно разделяет byte chunks, UTF-8 decoding и framing; требует backpressure, abort, failure и partial-output evidence. Shutdown reference покрывает readiness handoff, bounded/idempotent cleanup, logger completion и non-success forced fallback. Diagnostic resource types не объявлены доказательством ownership.
- **Interop producer/consumer:** Node производит executed-artifact/module/version contract, TS потребляет его для compiler settings; TS производит type/API и compile evidence, test owner — исполняемые test scenarios/runner evidence. CLI owner подтверждает public command/package boundary; formal review owner получает domain findings и производит merge-risk verdict; architecture owner задаёт распределённые cache/consistency решения. Эти выходы соответствуют прочитанным соседним контрактам; каталог названий сам по себе не использован как доказательство выполнения.
- **Missing dependency:** root-контракты допускают bounded/partial/blocked результат при отсутствующих sources/checks и требуют отметить unverified owner boundaries. При отсутствующем framework/domain owner можно продолжить локальную TS/Node диагностику, но нельзя заявить его заключение или broader runtime validation. Дополнительный доказанный P2 по missing dependency не установлен; реальная устойчивость этого fallback остаётся предметом ожидаемых trials.
- **P3, progressive disclosure:** TS называет references optional (`SKILL.md:166–175`, `skill.yaml` → `required: false`), но навигация использует императивные `Read this when`, а `type-debugging.md` требует `monorepo.md` перед fallback. Лучше единообразно обозначить условно обязательное чтение или настоящий optional context. Материальный пропуск защиты не установлен: graph/runtime/public-consumer ограничения продублированы в root.
- Повторение mode/source/evidence/output contracts в overview, workflow, policies и gotchas допускает упрощение вокруг одного владельца решения. Сам объём и число повторений не основание для P1/P2; уменьшение текста не доказывает улучшения поведения.

## Evidence limits и handoff

Source/installed drift в переданных frozen copies не обнаружен: проверены все file hashes и Git bytes, overview fragments присутствуют в emitted root, ссылки/UI прочитаны. Полный compiler regenerate/check здесь не запускался; механическое равенство текущих frozen packages исходному revision не подменяет независимую проверку генератора. Оба target являются documentation-only, собственного runtime/test package не заявляют и для этого аудита не требуют искусственного CLI.

Исторические TS forward-test записи относятся к другим указанным hashes, включая исправление ложного compiler claim; Node evidence отдельно отмечает coordinator-preserved summaries и отсутствие session-level raw transcript. Исторические PASS и compile reports не перенесены на текущий полный baseline verdict. Новая catalogue selection, execution behavior, достаточные/корректные сценарии, missing-owner и side-effect traces от координатора ещё не оценивались. Самостоятельных trial результатов этот отчёт не содержит.

Следующий владелец — координатор/автор: связать установленные находки с source-first remediation и передать стабильную candidate delta вместе с сырыми baseline/candidate результатами. После исправления — узкое независимое закрытие указанных failure paths и применимая проверка соседних регрессий. До этого оба целевых навыка остаются **FAIL** в данном baseline scope.
