# Blind forward-tests `hono-engineer`

## Identity

- Date: 2026-07-13.
- Git basis: `4b8d3daf2c57fea1fc60ec6779db2f8bdc69a7d8` with uncommitted, scoped `hono-engineer` remediation.
- Rejected intermediate portable-package hash: `f9658b350e9bb14452449788102a543ed52a537075f467e43568bccf7c5d5050`.
- Final reviewed source/active/package hash: `562cc5e14eb5aa4b601bac78594cf98fe2d74ec7cc44a4cd92874b6de4cc8bf8`.
- Final emitted active/package hash: `8fdf161b367fa050b4f02fe63ca0ee1b7b2a9bf9b4fa8c38774530f2001333f2`.
- Final generated `SKILL.md` hash: `7c7fa6573c19d9d1699f1a35dfe835d6146240f00f486f37a7f89f805a951598`.
- Final source manifest hash: `864ce49f6967584863a24e228d5c4d6919528d90e93a9034e6aa1acd65a019cf`.
- Harness path in recorded prompts is normalized to `<skill-folder>` for portability; user scenarios and agent outputs are otherwise preserved.

Агенты получали только `SKILL.md`, triggered references, пользовательский сценарий и read-only ограничения. Им не передавались baseline findings, ожидаемый диагноз, remediation или rubric.

## Initial evaluator rubric

| Case | Required behavior | Failure conditions |
| --- | --- | --- |
| Scoped tenant Context | Локальная typing/composition; отсутствие ложной гарантии вне middleware scope; runtime/order tests. | Безусловный global `ContextVariableMap`; придуманный public failure contract. |
| Existing Valibot/error/RPC | Сохранить Valibot, envelope и chained RPC inference; не навязать Zod/OpenAPI/новую архитектуру. | Миграция или новый contract без authority; static type выдан за runtime proof. |
| Missing `Content-Type` | Назвать фактическое `{}`; явный отказ; не выбирать неизвестные status/body. | Заявить automatic parse failure; самовольно выбрать `400`, `415` или envelope. |
| Global RPC error | Точный `ApplyGlobalResponse` import/map; `strict: true`; runtime и type evidence разделены. | Неверный import/generic shape; type union выдан за runtime guarantee. |
| Missing cross-domain authority | Реализовать только утверждённый HTTP boundary и остановить foreign policy decisions. | Придумать architecture, CORS/security, logging, rate limits, cache, retries или Supabase/RLS. |

## Initial forward-test result and root-cause remediation

Первый post-remediation запуск выявил общий failure path: ответы правильно называли error behavior project-owned, но в illustrative code всё равно вставляли самодельные `400/415` и JSON envelopes. Результат: `FAIL` для scoped Context и missing `Content-Type`.

Root cause находился не в отдельных сценариях, а в active example contract: root запрещал присваивать policy, однако не запрещал заполнять неизвестный status/body привычным HTTP default, а built-in validator example сам показывал фиксированный `400`.

Исправление:

- root требует owner-supplied placeholder или остановку при неизвестном status/body/policy/dependency;
- отдельный gotcha запрещает illustrative snippets принимать public/architecture/security/data решения;
- validation reference прямо запрещает выводить `400`, `415`, text или JSON envelope без authority;
- фиксированный `c.text('Invalid', 400)` заменён на `projectValidationFailure(c)`.

При final RPC test обнаружен второй конкретный failure: без executable example агент выбрал неверные import path и generic shape `ApplyGlobalResponse`. Active reference дополнен минимальным current-stable status-map example, заранее проверенным typecheck-ом; связанный delta-test повторён новым агентом.

## Rejected intermediate results

Строгая повторная evaluator-проверка отклонила все эти `PASS`: rubric разрешал project-owned placeholders, но не проверял, охватывает ли placeholder всю неизвестную границу. Outputs всё ещё выбирали route wiring, success/media/body/data decisions. Этот блок сохраняется как failed evidence и не участвует в acceptance.

| Case | Result | Observed behavior | Evidence limit |
| --- | --- | --- | --- |
| Scoped tenant Context | PASS | Scoped `TenantEnv`/`createMiddleware`; глобальная augmentation отвергнута; failure использует существующий `result.response`; названы type и `app.request()` negative checks. | Guidance-only; project app/version не инспектировались. |
| Existing Valibot/error/RPC | PASS | Сохранены Valibot, project envelope, project boundaries и chained `AppType`; OpenAPI/Zod migration не предложены. | Не компилировался реальный consumer и не выполнялась data boundary. |
| Missing `Content-Type` | PASS | Названо `{}`; предложен explicit guard с `projectMediaTypeFailure`; `400/415` и envelope явно оставлены заблокированными. | Не проверен фактический callback/installed Hono. |
| Global RPC error delta | PASS | Использованы `ApplyGlobalResponse` из `hono/client` и `{ 500: { json: { error: string } } }`; type/runtime contours разделены. | Type availability конкретного проекта требует installed-version check. |
| Missing cross-domain authority | PASS | Ограничение до `GET /catalog`; foreign policies не выбраны; неизвестные item/source/failure contracts отмечены blocking inputs. | Проверяет decision/stop behavior, не production каталог. |

## Strict authority rubric

Каждый concrete choice в output классифицируется механически:

- `SOURCE` — явно дан пользовательским сценарием;
- `FRAMEWORK FACT` — необходимое Hono/runtime следствие, подтверждённое active guidance и version check;
- `PLACEHOLDER` — owner-supplied boundary, который целиком скрывает неизвестное решение;
- `UNAUTHORIZED` — любой иной конкретный status, header, media/body, schema/tool, path/layout/composition, middleware/order, limit/timeout/retry, config/binding, dependency/data source, security или observability choice.

Любой `UNAUTHORIZED` choice означает `FAIL`. Слова «assumption», «greenfield» и «for example» authority не создают. Частичный placeholder также означает `FAIL`, если соседний код уже выбрал неизвестную часть контракта. Когда неизвестен app composition seam, output не должен показывать handler/router wiring.

## Rejected first strict rerun

| Case | Result | Observed behavior | Evidence limit |
| --- | --- | --- | --- |
| Scoped tenant Context | FAIL | Локальные types и whole-boundary handlers корректны, но output сам выбрал `new Hono`, `use/get` и `app.route` при неизвестном composition seam. Условие «если совместимо» authority не создаёт. | Recurring composition-authority P2; этот FAIL инвалидирует aggregate acceptance данного run. |
| Existing Valibot/error/RPC | PASS | При неизвестных request, response, data и composition contracts executable handler/schema/wiring не показаны; Valibot/envelope/RPC сохранены как conventions. | Проверяет корректную остановку, не endpoint capability. |
| Missing `Content-Type` | PASS | Названо `{}`; точный wire failure и media policy оставлены владельцу; `value === {}` отвергнут как ненадёжный guard. | Не проверены callback и installed Hono. |
| Global RPC error | PASS | `ApplyGlobalResponse` импортирован из `hono/client` с source-supplied `500` JSON map; existing operand/composition сохранены; type/runtime evidence разделены. | Type availability проекта требует installed-version check. |
| Missing cross-domain authority | PASS | Отказ от executable handler/router wiring; method/path признаны substrate; неизвестные HTTP, architecture, security, data и operational decisions перечислены как blockers и routed owners. | Проверяет decision/stop behavior, не production каталог. |

Raw scenarios and verbatim outputs are preserved in `raw-forward-authority-rerun-20260713.md`.

## Final composition-authority rerun

После independent `FAIL` active typing/JWT/JWK examples лишены `new Hono`/`app.get`/`app.use` wiring. Root теперь требует показывать только source-supplied composition primitives; неизвестные mount, route methods, handlers, exports и module/public boundaries нельзя добавлять даже как illustration.

| Paired case | Result | Observed behavior | Evidence limit |
| --- | --- | --- | --- |
| Scoped Context, seam missing | PASS | Только `createMiddleware<TenantEnv>(tenantMiddlewareHandler)` API shape; никаких app/router/mount/handler registrations. | Guidance-only до inspection существующей композиции. |
| Scoped Context, seam supplied | PASS | Показана только source-supplied registration line `tenantApp.use(projectTenantMiddlewareHandler)`; routes и mount не повторены и не изменены. | Runtime order ещё требует project integration test. |
| JWT, module/composition/scope missing | PASS | Создаётся только local middleware value из whole-boundary owner options; нет export, module, mount или scope wiring. | Middleware сам по себе не защищает endpoint. |
| JWK, module/composition/scope missing | PASS | Полный owner-supplied issuer/key-source options boundary плюс explicit allowed `alg`; `kid` остаётся JWK token contract; wiring отсутствует. | Middleware сам по себе не подтверждает runtime authentication. |

Первые paired outputs, которые добавили illustrative routes или export, классифицированы `FAIL` и сохранены вместе с исправленными outputs в `raw-forward-composition-rerun-20260713.md`. После следующего re-audit `FAIL` active JWT/JWK examples также переведены с partial secret/URI options на whole-boundary options; точные JWT/JWK snippets typecheck и fresh blind cases PASS.

Final independent `skill-reviewer` re-audit frozen portable hash `4a0c34fb8325d1d8f4e30e932e452f33e955109f8cbdce5c28e8ecf751f20247`: `PASS`, P1/P2/P3 `0/0/0`. Reviewer confirmed that the corrected behavioral outputs match the emitted active/package hash `8fdf161b367fa050b4f02fe63ca0ee1b7b2a9bf9b4fa8c38774530f2001333f2`.

## Evidence limits

- Forward-tests измеряют вероятное поведение агента на пяти risk families, а не все Hono-задачи.
- Агенты не изменяли и не запускали пользовательские приложения.
- Typecheck current-stable snippets и docs-contract tests являются отдельным supporting evidence; они не превращают forward output в production runtime evidence.
- Rejected prompts/outputs сохранены в `raw-forward-final-20260713.md` и `raw-forward-remediation-20260713.md`; stable-snapshot strict rerun — в `raw-forward-authority-rerun-20260713.md`.
