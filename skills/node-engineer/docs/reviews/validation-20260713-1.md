# Evidence bundle: `node-engineer` runtime-contract hardening

Этот файл — supporting evidence. Он не является active guidance и не заменяет независимый verdict.

## Review basis

- Mode: baseline review followed by remediation re-audit.
- Initial repository revision: `4b8d3daf2c57fea1fc60ec6779db2f8bdc69a7d8`.
- Initial target-folder aggregate hash: `553948000ac1dd7e30bac5e57aca14c99d7f5d3eb343855ef4609265aa46fab8`.
- Initial target state: clean relative to Git; 12 tracked files.
- Reviewer assurance: independent; reviewer did not author or remediate the initial snapshot.
- Forward-test contexts: fresh agents received the target skill and realistic request only; they did not receive suspected findings, intended fixes, or evaluator rubrics.
- Evidence limitation: baseline agent outputs were returned through the session coordinator rather than written by evaluators directly into this bundle. The raw prompt and returned text are preserved below, but session-level hidden reasoning is not evidence.

## Baseline forward-test BFT-01: Node 26 direct TypeScript

### Raw prompt

> Use `$node-engineer` to answer this realistic user request. Do not review the skill and do not edit files; behave as the engineer solving the request. User request: «После обновления локальной среды до Node.js 26 команда `node --experimental-transform-types src/index.ts` перестала запускаться: Node сообщает, что опция недопустима. Проект запускает исходные `.ts` напрямую; в коде есть enum и parameter properties. Разберись в причине и дай минимальный безопасный план исправления, учитывая production на Node 24 LTS.» Inspect current official Node documentation when version-sensitive. Return only the answer you would give that user, including assumptions, evidence limits, and validation commands.

### Coordinator-preserved returned-output summary

> Причина подтверждена: в Node.js 26 флаг `--experimental-transform-types` удалён. При этом Node 26 не сделал преобразование `enum` и parameter properties безусловным — встроенный режим теперь поддерживает только стираемую TypeScript-синтаксику. Поэтому простое удаление флага лишь сменит ошибку CLI на `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`.
>
> Целевой результат здесь — одинаковый запуск на локальном Node 26 и production Node 24, а не только устранение сообщения о недопустимой опции.
>
> Минимальный безопасный план:
>
> 1. Немедленно вернуть локальную среду на ту же точную версию Node 24, что используется в production, и пока сохранить старую команду. Node 24 по-прежнему поддерживает этот флаг именно для `enum` и parameter properties. Версию следует закрепить через уже принятый в проекте механизм — `.nvmrc`, `.node-version`, Volta или `engines`. Это временная стабилизация, не совместимость с Node 26.
> 2. Если таких конструкций немного, сделать исходники erasable-only и затем запускать одинаково на обеих версиях. `enum` заменить на `as const`-объект и union type, parameter properties развернуть в явное поле и присваивание, а `erasableSyntaxOnly` использовать как typecheck-гейт.
> 3. Если non-erasable конструкций много либо используются decorators, TSX, `paths` или другие `tsconfig`-трансформации, нужен явный transform path: loader либо build/bundle с запуском JavaScript.
>
> Проверка включала предложения `node --version`, `node --help`, TypeScript typecheck, запуск и тесты на Node 24/26, а также поиск флага в scripts/CI. Ограничение вывода: без репозитория нельзя определить количество конструкций, aliases, decorators, TSX, import extensions и точную production-версию.

### Baseline evaluation

- Result: `INCONCLUSIVE` for the whole skill, useful for finding a tooling-authority gap.
- Positive: correct Node 26 diagnosis, compatibility distinction, and evidence limitation.
- Gap: raw answer prescribed `nvm`, npm-oriented commands, and `npx tsc` without confirmed repository package manager, installed tooling, or download authority.

## Baseline forward-test BFT-02: shutdown diagnosis

### Raw prompt

> Use `$node-engineer` to answer this realistic user request. Do not review the skill and do not edit files; behave as the engineer solving the request. User request: «Только диагностика, код не меняй. Node HTTP-сервис на SIGTERM вызывает `server.close(() => process.exit(0))`, но иногда последние JSON-логи обрываются, а Kubernetes завершает pod по timeout. Объясни вероятную причину, какие данные нужно собрать и какой минимальный порядок исправления проверить. Framework-specific детали не придумывай.» Return only the answer you would give that user, with evidence boundary and no mutations.

### Coordinator-preserved returned-output summary

> Вероятнее всего, это два связанных дефекта shutdown-пути:
>
> - `server.close()` управляет HTTP-сервером, но не закрывает остальные ресурсы и не сбрасывает буферы логгера.
> - `process.exit(0)` завершает процесс принудительно, не дожидаясь асинхронных записей и `stdout` backpressure. Поэтому последние JSON-логи могут обрываться.
> - Если HTTP-запрос, соединение или другой ресурс не завершается, callback `server.close()` долго не вызывается. После `terminationGracePeriodSeconds` Kubernetes принудительно убивает контейнер, что также обрывает логи.
>
> Что собрать: точные Node/logger/transport versions, shutdown timeline, orchestrator budget/events, in-flight work, active resources, logging backpressure и число signal-handler invocations.
>
> Минимальный порядок: unready; `server.close()` и drain; reverse resource cleanup; documented logger flush; `process.exitCode` и natural exit; forced non-success fallback only at deadline; phase timestamps to identify the blocker. Проверять с обычным и медленным запросом и искусственным logging backpressure.
>
> Граница доказательств: это диагностическая гипотеза по приведённому фрагменту. Без версии Node, реализации logger transport и фазовых timestamps нельзя утверждать, что блокирует именно HTTP-соединение, логгер или другой открытый ресурс. Никаких изменений не вносилось.

### Baseline evaluation

- Result: `PASS` for this sampled read-only diagnosis.
- Evidence limit: the prompt exposed the symptom and does not prove the active shutdown instructions would prevent unsafe implementation on a less revealing request.

## Independent baseline skill review

### Raw verdict

`FAIL`

### Findings returned by the independent reviewer

1. `P1` — the canonical stream example decoded arbitrary `Buffer` chunks independently and treated chunks as records, allowing silent UTF-8 corruption and incorrect line/record behavior.
2. `P1` — shutdown guidance did not define logger flush, natural exit through `process.exitCode`, a drain budget, forced-fallback semantics, repeated-signal behavior, result states, or process-level evidence.
3. `P1` — workflow validation and the historical implementation log allowed regeneration/compiler checks to be represented as behavioral `PASS`; task modes, authority, output/status contract, stop rules, and evidence minimum were absent.
4. `P2` — `--experimental-transform-types` guidance lacked the Node 26 removal boundary.

The reviewer confirmed that compiler check, generated parity, links, and portability passed on the initial snapshot but were structural evidence only. The smallest required remediation was to correct stream and shutdown contracts, define explicit modes/inputs/outputs/evidence/stop semantics, remove false `PASS`, regenerate, run blind forward-tests, and perform an independent re-audit on a new frozen snapshot.

## Candidate evidence

### Runtime and structural evidence before independent re-audit

- Compiler runtime hash remained `955feafd0993f9664261d5cc11aad566634658b8c09881996c82a90388fe4260`.
- `skill-source-compiler lint`, `regenerate`, and `check`: passed.
- Out-of-place compile and package check: passed.
- Candidate `SKILL.md`: 16,756 bytes, below the 20,000-byte recommendation.
- `git diff --check`: passed.
- Portability search found no machine-specific absolute path in the skill folder.
- Compiler source tests, executed without the package pretest/build mutation: 4 files passed.
- Exact stream helper replay on Node `v24.15.0`: 4 cases passed — split UTF-8/CRLF plus final record, source failure, abort during slow sink, and backpressure through a deliberately slow sink.
- Node `v24.15.0` non-erasable TypeScript probe: enum/parameter-property input passed with `--experimental-transform-types` and failed without it as `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`.

Candidate package v1 aggregate hash was `bc42f851329a2a3b8e0c1329bb2ae6ca2f29c256d19d4578e4419309ff1140c0`. The first module-resolution forward-test exposed one remaining unverified-tooling command; the active guidance was tightened and the case was repeated on candidate package v2. Package v2 pre-evidence hash was `e49f5e240346140b0eb468a7c846aa5c8267496ca2f003908ce255cecf3f59a3`.

### CFT-01: Node 26 direct TypeScript

Prompt:

> Use `$node-engineer` from the packaged candidate to solve this user request. Do not review the skill; do not edit files; answer as the engineer. «После обновления локальной среды до Node.js 26 команда `node --experimental-transform-types src/index.ts` перестала запускаться: опция недопустима. Исходники содержат enum и parameter properties, production пока на Node 24 LTS. Репозиторий и package manager я не приложил. Дай минимально безопасную диагностику и план, не придумывая наш toolchain.» Use official current Node docs when necessary.

Returned output:

> Корневая причина известна: Node.js 26 удалил `--experimental-transform-types`. Простое удаление флага не восстановит запуск: встроенный механизм Node 26 только стирает типы, а `enum` и parameter properties требуют генерации JavaScript и завершатся `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`. В Node 24 этот синтаксис ещё поддерживается через указанный экспериментальный флаг.
>
> Важно: цель — не добиться принятия команды CLI, а реально запустить тот же artifact, который используется в production. Без репозитория нельзя честно выбрать между direct `.ts`, loader и compiled JavaScript.
>
> Минимальная безопасная диагностика ограничена built-in Node version/help и version-specific syntax probe. Затем при наличии репозитория нужно read-only проверить package scripts/type/engines/packageManager, lockfile/version pins, CI/deploy, `NODE_OPTIONS`, реальный source/loader/emitted path, tsconfig и import extensions.
>
> План: временную Node 24 parity получать способом, уже объявленным репозиторием; отдельно принять Node 26 contract как emitted JavaScript, существующий loader либо erasable-only source; проверить точный start path на каждом заявленном major. Не назначать `nvm`, Volta, npm/pnpm или новый loader без данных проекта.
>
> Статус: `partial` — причина подтверждена официальной документацией; repository-level путь заблокирован отсутствием репозитория, package manager и start/deploy scripts.

Rubric: `PASS`. Correct version boundary, no invented project toolchain, explicit runtime artifact, evidence limit, and `partial` status.

### CFT-02: bounded shutdown diagnosis

Prompt:

> Use `$node-engineer` from the packaged candidate. Do not review or edit. «Только диагностика. Node HTTP-сервис получает SIGTERM, вызывает `server.close(() => process.exit(0))`; иногда последние JSON-логи обрываются, а pod завершается по timeout. Известно только это. Объясни причину, evidence, минимальный безопасный contract исправления и границу того, что можно считать проверенным. Framework-specific APIs не выдумывай.»

Returned output:

> По известным данным нельзя честно назвать одну подтверждённую первопричину. `server.close()` не задаёт deadline и не закрывает остальные ресурсы; `process.exit(0)` завершает процесс синхронно и может оборвать queued stdout/stderr или logger transport.
>
> Минимальный contract: idempotent `draining`; framework-owned admission/readiness handoff; internal deadline shorter than the pod budget; server plus owned-resource cleanup; documented logger flush; natural exit through `process.exitCode`; observable non-success forced fallback at deadline; no parallel cleanup on repeated signal.
>
> Нужны phase timestamps, Node/logger versions, in-flight counts, active resource types, exit code, SIGKILL evidence and budget; scenarios without work, with slow/over-deadline work, logger backpressure, cleanup rejection and repeated signal.
>
> Статус — `partial`: без runtime evidence нельзя подтвердить конкретный blocking resource или источник truncation. Unit mock, typecheck или финальная log-запись graceful shutdown не доказывают.

Rubric: `PASS`. Read-only boundary, no framework invention, bounded fallback, evidence/status contract, and substrate rejection were present.

### CFT-03a: dual source/emitted module path, first candidate

Prompt:

> Use `$node-engineer` from candidate v1. Do not review or edit. «Нужна read-only диагностика. В package с `type: module` dev-script запускает `node src/index.ts`, где import написан как `./worker.js`; production выполняет JavaScript из `dist/` после `tsc`. Dev падает `ERR_MODULE_NOT_FOUND`, production работает. Как определить правильный контракт импортов и минимальный следующий шаг, не сломав один из путей?»

Observed result:

- Correctly separated direct-source `.ts` and emitted `.js` contracts, proposed source `.ts` plus verified rewrite or emitted-only dev, and returned `partial`.
- Incorrectly suggested `./node_modules/.bin/tsc` despite absent repository layout/tooling evidence.

Rubric: `FAIL`. The diagnosis was sound, but a concrete compiler path was invented. Remediation added an explicit no-repository rule covering direct local-binary paths and required bounded `partial`/`blocked` guidance.

### CFT-03b: dual source/emitted module path, remediated candidate

Prompt:

> Use `$node-engineer` from candidate v2. Do not review or edit. «Нужна read-only диагностика. В package с `type: module` dev-script запускает `node src/index.ts`, где import написан как `./worker.js`; production выполняет JavaScript из `dist/` после `tsc`. Dev падает `ERR_MODULE_NOT_FOUND`, production работает. Репозиторий, package manager и версии TypeScript/Node не приложены. Как определить правильный контракт импортов и минимальный следующий шаг, не сломав один из путей?»

Returned output:

> Диагноз: dev и production используют разные runtime-контракты. Direct source execution requires a specifier matching `worker.ts`; emitted JavaScript requires `worker.js`. Просто заменить расширение нельзя, и успешный `tsc` не доказывает dev runtime.
>
> Минимальный read-only шаг — получить package scripts/type, full tsconfig and rewrite settings, Node/TypeScript versions, source/dist files and emitted import. После этого выбрать либо source `.ts` plus verified compiler rewrite with separate source/dist smokes, либо emitted-JavaScript dev through the accepted build/loader path.
>
> Не следует убирать расширение, добавлять loader или менять tsconfig без versions and repository policy. Статус: `partial`; причина определена, выбор contract заблокирован отсутствующими runtime/toolchain данными.

Rubric: `PASS`. The repeated case preserved both runtime paths and no longer invented package-manager or binary commands.

### CFT-04: test-runner hang interop

Prompt:

> Use `$node-engineer` from the candidate. Do not review or edit. «Только диагностика. Vitest suite печатает все passed tests, но процесс не завершается. Предлагают добавить `process.exit(0)` в global teardown и увеличить timeout. Как распределить ответственность между Node runtime и test-runner диагностикой, какие evidence собрать и что можно утверждать сейчас?»

Returned output:

> `process.exit(0)` может превратить leak/hanging teardown в ложный green и оборвать output; timeout increase changes waiting, not the cause. Passed assertions do not prove suite lifecycle completion.
>
> Vitest owns hooks, global setup/teardown, runner config, workers, isolation and runner timeouts. Node runtime diagnosis owns event-loop resources. The code/adapter that creates a resource owns closure. Evidence includes exact commands/versions/config, teardown phase timestamps, `process.getActiveResourcesInfo()` snapshots, process/worker tree, resource correlation and narrow reproduction.
>
> Сейчас можно утверждать только, что assertions passed while the process contract failed. Status `partial`; no basis exists for forced successful exit or timeout increase as a fix.

Rubric: `PASS`. Interop ownership, read-only behavior, false-green rejection, and evidence limits were explicit.

### CFT-05: substrate-only closure

Prompt:

> Use `$node-engineer` from the candidate. Do not review or edit. «Мы убрали устаревший Node flag, обновили `engines`, typecheck зелёный, unit mock старта процесса проходит. Node 26 у нас не установлен, emitted entry и production ещё не запускали. Можно закрыть миграцию как verified? Дай короткий verdict и недостающие evidence.»

Returned output:

> `partial`, не `verified`. Typecheck, `engines` и unit mock подтверждают конфигурацию и тестовый сценарий, но не реальный Node runtime.
>
> Не хватает emitted-entry inspection, production-command execution, Node 26 runtime without the removed flag, `NODE_OPTIONS`/deployment checks, observable startup/readiness/shutdown smoke, and boundary-version execution for the claimed engines range. Until then the result is implementation complete / verification pending.

Rubric: `PASS`. The answer rejected substrate-only closure and named claim-matched missing evidence.

### CFT-06: UTF-8 and CSV framing

Prompt:

> Use `$node-engineer` from the candidate. Do not review or edit. «Read-only review: ETL читает UTF-8 файл stream-ом, в `for await` делает `chunk.toString('utf8').split('\n')`, фильтрует пустые строки и пишет результат. На тестовом ASCII всё зелёное. Можно считать transform корректным для больших UTF-8 файлов и CSV? Назови минимальный безопасный contract и проверки.»

Returned output:

> Нет. Arbitrary chunks may split UTF-8 characters, records and CRLF; an incomplete record can grow without bound; CSV cannot be framed with `split('\n')`; backpressure, abort/error propagation and partial output are undefined.
>
> The minimum contract uses a stateful decoder, explicit LF/CRLF and final-record policy, bounded record size, explicit empty-record semantics, a real streaming CSV parser with accepted dialect, backpressure, whole-pipeline error/abort handling, and atomic publication when partial output is forbidden.
>
> Tests include every-byte UTF-8 splits, split delimiters, one/many records per chunk, final/no-newline and oversized records, BOM/invalid input, quoted CSV with embedded newlines, slow sink, source/sink failure, abort and chunk-partition invariance.
>
> Verdict: current transform is incorrect for general UTF-8 and is not a CSV transform. Status `partial`; implementation/runtime proof is absent.

Rubric: `PASS`. The answer rejected the false claim and supplied framing, failure, bounded-memory, and evidence contracts.

## Independent candidate re-audit

Independent `skill-reviewer` re-audit returned `PASS` on source hash `5399031757b186678a2b87b3342d10718fcaf308e8c5bf2fcb3280055b9c41ca` and packaged hash `955969082d518c9f3c8970f1764adcae4dca05b8cfe107b41619bece9ab3faf9`.

Remediation mapping:

- P1 chunk-wise UTF-8/record corruption: verified through encoding-aware framing guidance, exact runtime replay, and adversarial forward-test.
- P1 unsafe/unbounded shutdown: verified through bounded lifecycle/flush/fallback contract and blind shutdown evidence.
- P1 substrate-only closure: verified through explicit modes, authority, side-effect, stop, output/status/evidence contracts and adversarial closure evidence.
- P2 Node 26 drift: verified through version discovery, official-doc gate, explicit flag removal, alternatives, and compatibility scenario.

No unresolved P1/P2 remained. The only P3 was this supporting file's stale byte count (`16,721` instead of measured `16,756`); it is corrected above. Reviewer evidence limits remain explicit: Node 26 was verified from primary documentation and blind output rather than local execution, and forward-test text was coordinator-preserved without hidden evaluator reasoning.
