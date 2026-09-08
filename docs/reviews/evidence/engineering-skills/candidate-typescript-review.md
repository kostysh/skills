# Независимая оценка typescript-engineer 0.2.2

**PASS.** В проверенном candidate исправлены TS-01, TS-02 и замечание P3; неразрешённых P1/P2 не установлено. Это verdict качества инструкций и наблюдавшегося поведения в указанной границе, без общей приёмки совместного процесса четырёх скиллов.

## Основание, scope и assurance

- Mode: `change` с проверкой устранения baseline findings. Assurance: `independent`; reviewer `/root/baseline_ts_node` не автор и не remediator candidate; автор — `/root/author_ts_node`.
- Consumer: инженерный агент с конкретной TypeScript-задачей; ожидается sound type/config решение, необходимые положительные/отрицательные compiler проверки и честный handoff владельцу runtime/другой границы. Compiler success не доказывает runtime, security, release или продуктовую готовность.
- Base: `504b87331f22b3a5303875bef69163a40d4372d7`. [Candidate snapshot](candidate-snapshot.json), создан `2026-09-08T19:14:07.312823+00:00`: 22 файла; aggregate SHA-256 `398f2821afd2dbf24b9bdd91383dc1beaa6cbd1dd092eba91cef95de3bbf67f3`; пути POSIX относительно корня пакета. Reviewed root SHA-256: `8dccdca0e96b7c9f7caf51baaab9fb909df0bb01345a0ae7fac7c444bb597e86`.
- Проверены полный package delta, declared `skill.yaml`, emitted `SKILL.md`, затронутые references, UI/activation metadata, source/generated readback и supporting docs/logs; неизменённый baseline использован для примыкающих ограничений. История не повышена до активной инструкции.
- Reviewer не менял skill packages. Независимый [hash readback](candidate-ts-node-independent-readback.json) подтвердил каждый файл manifest, равенство working/archive пакетов и привязку C01–C08 к active snapshot. [Master readback](master-readback.json) подтверждает тот же опубликованный base для соседей; G5 не использован.

## Устранение findings и проверки поведения

| Baseline | Candidate и независимая оценка evidence | Итог |
| --- | --- | --- |
| TS-01, P2: `parse(string): object` и `parse(object): string` обещают больше native JSON | [overloads.md:37](candidate-packages/typescript-engineer/references/overloads.md#basic-pattern) возвращает `unknown` / `string \| undefined`, различает implementation signature и публичный контракт, требует narrowing и сохраняет throws. Архивный `subject.ts` соответствует примеру. Guided probe проверяет null, число, boolean, строку, array, object, `toJSON → undefined`; negative type assertions исключают старые обещания; malformed JSON/cycle/BigInt сохраняют исключения. [Проверки после восстановления toolchain](source-probes/candidate/ts-node/restored-environment-checks.json): typecheck и оба runtime прогона exit 0. | CLOSED |
| TS-02, P2: blanket deep-readonly для существующих aliases | [runtime-derived-types.md](candidate-packages/typescript-engineer/references/runtime-derived-types.md) разграничивает readonly property/literal tuple и прежний mutable alias; freeze не обещается. Guided probe проверяет запрещённые property/tuple mutations, разрешённые array/object alias mutations и `Object.isFrozen === false`. Blind C04 независимо дал правильный вывод и исполнил локальное поведение. | CLOSED |
| P3: optional navigation с обязательными условиями чтения | Все девять references packaged как required, точные условные triggers сохранены; [root:21](candidate-packages/typescript-engineer/SKILL.md) требует только triggered references, не чтение всех файлов. Emitted navigation и compiler report согласованы. | CLOSED |

Guided probes — авторские целевые воспроизведения известных дефектов; reviewer прочитал исходные программы и сырые результаты, но не называет их blind trials. Инцидент pnpm auto-install и неудачные loader-запуски сохранены; [toolchain-restore.json](toolchain-restore.json) и повторные npm/type/runtime checks восстанавливают соответствующую границу доказательства, не превращая исходные ошибки в PASS.

| Blind case | Наблюдение reviewer по RESULT, product files и commands.jsonl | Итог |
| --- | --- | --- |
| [C01](results/candidate/C01/RESULT.md) | `first<T>(readonly T[]): T \| undefined`, прежнее тело/consumers сохранены; positive и negative consumer assertions. Исходный TS2345 воспроизведён, итоговый declared typecheck exit 0; не добавлен linter и нет runtime claim. | PASS |
| [C02](results/candidate/C02/RESULT.md) | Нет выдуманного normalize API; запрошены необходимые code/config/diagnostics/consumer inputs, объяснена граница tsc/runtime; неизвестное не остановило независимый ответ. | PASS |
| [C03](results/candidate/C03/RESULT.md) | Исправлен только `privateLength` через `value.length`; TS2322 → typecheck exit 0. `result()` и его конфликтующий контракт сохранены, решение nullability возвращено владельцу. | PASS |
| [C04](results/candidate/C04/RESULT.md) | TypeScript 5.9.3 вывел `{ readonly flags: string[] }`; runtime показал `["read","write"]` и отсутствие freeze. Отсутствующий сосед не превратился в blanket blocker. Product files не изменены. | PASS |

[Run index](run-index.json) фиксирует fresh `fork: none`, assigned Astra/high и исключение source/supporting history/answer keys. Изоляция доступа инструкционная на shared filesystem; полной независимой session trace нет. Это forced skill execution, а не проверка естественного выбора/активации. C01–C04 input и criteria не менялись относительно baseline и прошли также baseline: вывод — сохранённое sampled поведение; улучшение source-примеров отдельно подтверждено направленными probes. Более широкая generalization не заявляется.

## Interop, структура и итоговая граница

Проверена owner-producibility и consumer-usability новых [interop/policies:133–159](candidate-packages/typescript-engineer/SKILL.md) против frozen инструкций девяти соседей из того же snapshot:

| Сосед | Совместимая передача |
| --- | --- |
| typescript-test-engineer | Публичный type oracle/positive-negative assertions → сценарии и фактически проверенные команды; runner policy остаётся у test owner. |
| code-reviewer | Stable diff, callers/declarations и compiler evidence → формальный scoped review; domain fix не присваивает verdict. |
| security-reviewer | Конкретный untrusted type/runtime boundary → scoped exploitability findings; типы не дают security guarantee. |
| architecture-engineer | Принятые constraints/obligations → технический факт или противоречие владельцу. |
| spec-engineer | Принятый implementation contract → type/compiler evidence, без изобретения поведения. |
| prd-engineer | Принятый product behavior → вопрос владельцу при пробеле, без самостоятельного изменения scope. |
| delivery-planner | Task scope/checkpoints → работа в принятой границе; artifact не авторизует расширение. |
| git-engineer | Только authorized publication: exact revision/paths/checks → проверенные refs. |
| gh-utility | Только authorized GitHub action: matching revision → fresh remote/check evidence. |

Непосредственный TS↔Node handoff согласован: entry/version/mode/resolver → compiler config/emitted specifiers/type results → runtime execution того же пути. Условия materiality, same contract/version/snapshot и dependent-only partial/blocked предотвращают беспричинную загрузку соседей и выдуманный их результат. Это source-grounded compatibility; отдельного исполнения каждой из девяти передач этот отчёт не утверждает. Joint C17/C19 остаются отдельной оценкой координатора.

[Author self-check](author-ts-node.md), [raw structural commands](author-ts-node-commands.jsonl) и [emitted readback](author-ts-node-readback.json) проверены как отдельная evidence: lint/regenerate/check, out-of-place compile/check, skill validator и diff-check exit 0; author source manifest точно совпадает с candidate. [Mandatory CI](candidate-ci.json): frozen install и `pnpm test:ci` exit 0, включая 44 compiler tests. [Integrity](candidate-integrity.json): active links/parity/non-target scope без выявленной ошибки. Эти результаты подтверждают структуру и регрессии compiler, не независимое поведение агента сами по себе.

Применимые проверки достаточны для этого `PASS`; material unassessed claim в указанном scope не оставлен. Не заявлены production/native activation, широкая framework/lint/version matrix, runtime validation, security audit, совместная готовность C17/C19 или публикация. Следующее действие — координатор связывает verdict с общей evidence и принятым acceptance checkpoint; изменение активного snapshot требует нового review либо обоснованного bounded delta audit.
