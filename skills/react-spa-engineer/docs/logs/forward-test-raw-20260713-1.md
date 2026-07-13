# Blind Forward-test Raw Evidence — 2026-07-13

## Case 1

Prompt:

> «Спроектируй orders-page для tenant-scoped SPA: tenant в route, filters/page в URL, server list через Query, справочник статусов может переживать reload. Дай минимальную архитектуру и скажи, когда результат можно считать completed.»

Raw answer:

Mode: `design/setup`.

Минимальная архитектура:

- Route: `/tenants/:tenantId/orders`.
  - React Router валидирует `tenantId`.
  - `status`, `page`, sort/search при наличии принадлежат URL, парсятся и канонизируются на входе.
  - Изменение фильтра явно сбрасывает `page` в `1`; back/forward и direct link должны восстанавливать представление.

- Server list:
  - `shared/api/orders` владеет HTTP transport, credentials, parsing, cancellation и typed errors.
  - Feature Query adapter владеет `orderKeys` и Query options.
  - Query key включает как минимум `tenantId` и все параметры, меняющие список: filters, page, sort/search.
  - TanStack Query владеет чтением, retry, invalidation и runtime cache.
  - Компонент страницы не вызывает transport напрямую и не копирует filters/page в Zustand.

- Reload-safe status dictionary:
  - Dexie допустим только как неавторитетная allowlisted projection.
  - Запись должна иметь канонический cache identity, соответствующий Query identity, tenant/user scope по API contract, `loadedAt`, `expiresAt`, schema version, migration и cleanup policy.
  - Истечение TTL означает необходимость refresh, а не подтверждение актуальности или доступа.
  - При tenant/user switch старые subscription/query/storage operations сначала отменяются или fencing-изолируются, затем очищаются Query, Dexie и зависимое runtime state.
  - Если справочник глобальный, а не tenant-scoped, это должен явно установить API/product contract; ослаблять scope по предположению нельзя.

- UI states:
  - initial pending, data, empty, background refresh, stale cached projection, refresh error и retry должны быть различимы;
  - уже показанный список не скрывается при background refetch.

Status: `partial` — архитектура определена, но без repository manifest, API/product contracts и исполняемой среды она не является подтверждённой project-ready реализацией.

Результат можно считать `completed`, когда:

1. приняты contracts для tenant identity, dictionary scope/freshness и API errors;
2. URL canonicalization проверена direct link, reload, manual edit и back/forward;
3. Query keys и Dexie keys доказанно включают полный semantic identity;
4. browser scenario подтверждает initial load, filter/page navigation, background refresh и recovery;
5. persistence scenarios подтверждают reload, TTL/expiry, representative migration и tenant/user switch без repopulation старого контекста;
6. выполнены соответствующие tests и browser automation, а их команды, окружение и результаты зафиксированы.

Anti-claims: наличие route, Query key, Dexie table, mock или успешного build отдельно не доказывает интегрированный tenant-scoped flow; client scope не является server authorization.

Next owner: владелец product/API contracts — для scope и freshness справочника; после принятия contracts — SPA implementer и browser-test owner.

Loaded skill files:

- `skills/react-spa-engineer/SKILL.md`
- `skills/react-spa-engineer/references/routing.md`
- `skills/react-spa-engineer/references/data-fetching.md`
- `skills/react-spa-engineer/references/indexeddb-persistence.md`
- `skills/react-spa-engineer/references/persistence-architecture.md`
- `skills/react-spa-engineer/references/state-management.md`
- `skills/react-spa-engineer/references/testing.md`

Evidence limits:

- Репозиторий, manifest/lockfile, API contracts и работающая SPA не предоставлены.
- Код и browser scenarios не запускались.
- Ответ подтверждает только conceptual architecture и критерии её последующей проверки.

## Case 2

Prompt:

> «В TanStack Query v5 список уже показан, сейчас идет background refetch. Какой status использовать для небольшого refreshing indicator и нужно ли скрывать текущий список?»

Raw answer:

Для небольшого индикатора именно background refetch используй `isRefetching`.

```tsx
<OrdersView
  orders={ordersQuery.data}
  refreshing={ordersQuery.isRefetching}
/>
```

Текущий список скрывать не нужно: данные уже успешно получены, а refetch выполняется в фоне.

Различие сигналов в TanStack Query v5:

- `isPending` — успешных данных ещё нет;
- `isLoading` — выполняется первоначальный fetch: `isPending && isFetching`;
- `isFetching` — выполняется любой `queryFn`, включая initial fetch и background refetch;
- `isRefetching` — выполняется повторный fetch, но не initial pending fetch.

`isFetching` подходит для общего индикатора любой сетевой активности, а `isRefetching` — для указанного небольшого refreshing indicator поверх уже показанных данных.

Loaded skill files:

- `skills/react-spa-engineer/SKILL.md`
- `skills/react-spa-engineer/references/data-fetching.md`
- `skills/react-spa-engineer/references/accessibility.md`

Evidence limits:

- Это семантика TanStack Query v5, а не наблюдение конкретного приложения.
- Не проверены installed package version и фактическое поведение UI.
- Индикатор не должен создавать неожиданный focus change или избыточное live announcement; конкретная accessibility policy проекта не предоставлена.

## Case 3

Prompt:

> «Мы добавили protected route, unit tests, MSW happy path, Playwright config и screenshot login-page. Можно закрыть задачу как полностью работающий cookie-session login flow? Если нет, какой status и минимальное недостающее доказательство?»

Raw answer:

Нет. Status: `partial`.

Имеющиеся артефакты доказывают только ограниченные границы:

- protected route — client-side UX admission, не server authorization;
- unit tests — вызванную локальную логику;
- MSW happy path — client contract против mock;
- Playwright config — готовность test substrate, но не выполненный scenario;
- screenshot — внешний вид одного состояния, но не login behavior.

Минимальное недостающее доказательство для claim «полностью работающий cookie-session login flow»:

1. выполненный Playwright scenario в реальном браузере против интегрированного test service, который устанавливает настоящую cookie session;
2. подтверждённая навигация guest → login → authenticated protected route;
3. проверка как минимум meaningful failure boundary: неверный login либо отсутствующая/истёкшая session получает принятый server response и не открывает protected data;
4. зафиксированные команда, успешный результат, окружение, browser execution и реальные/замоканные границы.

Если claim включает CSRF recovery, logout invalidation или server authorization, соответствующая real-backend boundary также должна быть упражнена. Security verdict остаётся за `security-reviewer`.

Anti-claims: redirect wrapper, hidden UI, MSW response, config и screenshot не доказывают cookie issuance, server session validation или authorization.

Next owner: владелец integrated test environment и browser execution; для security closure — `security-reviewer`.

Loaded skill files:

- `skills/react-spa-engineer/SKILL.md`
- `skills/react-spa-engineer/references/routing.md`
- `skills/react-spa-engineer/references/testing.md`
- `skills/react-spa-engineer/references/data-fetching.md`

Evidence limits:

- Нет raw test results, integrated backend или cookie inspection.
- Неизвестны принятые session/CSRF/logout contracts.
- Поэтому ответ не устанавливает работоспособность или безопасность login flow.

## Case 4

Prompt:

> «Нужно сделать переиспользуемый accessible combobox для нескольких приложений; SPA routing/data/persistence не затронуты. Кто primary owner и что делает react-spa-engineer?»

Raw answer:

Primary owner — `react-components-engineer`, потому что основной артефакт — переиспользуемый component contract, а SPA routing/data/persistence не затронуты.

Дополнительно:

- `web-ui-reviewer` владеет формальным accessibility/UX verdict;
- компонент должен либо использовать уже проверенный primitive, либо полностью реализовать выбранный WAI-ARIA APG combobox contract: focus model, keyboard behavior, selection, `aria-activedescendant` или roving focus, relationships, dynamic options, disabled states и announcements.

`react-spa-engineer` здесь не должен становиться владельцем компонента. Он подключается только при отдельной app-level задаче интеграции combobox в route, form, Query flow, runtime state или persistence и проверяет, что интеграция не ломает SPA ownership boundaries.

Loaded skill files:

- `skills/react-spa-engineer/SKILL.md`
- `skills/react-spa-engineer/references/component-architecture.md`
- `skills/react-spa-engineer/references/accessibility.md`

Evidence limits:

- Не определены component API, supported rendering contexts, выбранный APG interaction model и target applications.
- Accessibility verdict не проводился.
- Ответ определяет ownership/handoff, но не подтверждает correctness будущего combobox.

## Case 5

Prompt:

> «Дай Zod 4 schema для формы с email, паролем минимум 8 символов и обязательным terms; используй актуальный error customization.»

Raw answer:

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email({
    error: 'Enter a valid email address',
  }),
  password: z.string().min(8, {
    error: 'Use at least eight characters',
  }),
  terms: z.boolean().refine((accepted) => accepted, {
    error: 'Accept the terms to continue',
  }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

Это форма для Zod 4: error customization передаётся через `error`, а email использует top-level `z.email()`.

Loaded skill files:

- `skills/react-spa-engineer/SKILL.md`
- `skills/react-spa-engineer/references/forms-validation.md`

Evidence limits:

- Schema не компилировалась против manifest конкретного проекта.
- Не проверены React Hook Form integration, accessible rendering, API command mapping и server validation.
- Для Zod 3 этот snippet применять нельзя без адаптации к установленной major-версии.

## Case 6

Prompt:

> «При первом открытии chat-page сервер должен создать chat, если его нет, а затем подключить SSE updates и сохранить разрешенную локальную проекцию в Dexie. Где разместить create, realtime transport и persistence orchestration?»

Raw answer:

Раздели flow по владельцам:

1. Проверка существования chat:
   - repeatable server read через TanStack Query;
   - `queryFn` не создаёт chat.

2. Создание отсутствующего chat:
   - отдельная именованная TanStack Query mutation в feature data/Query adapter;
   - mutation вызывает typed API operation из `shared/api`;
   - автоматический create допустим только при принятом idempotency/retry contract;
   - после success mutation обновляет или invalidates соответствующий Query state.

3. SSE transport:
   - создание соединения, credentials, parsing, reconnect, cancellation и typed errors находятся в `shared/api`;
   - UI hook не вызывает `new EventSource()` напрямую;
   - feature orchestration подписывается на typed adapter только после получения канонического chat identity.

4. Dexie persistence:
   - schema, migration, TTL, allowlist, tenant/user scoping и cleanup принадлежат `shared/storage` либо feature persistence adapter;
   - orchestration валидирует SSE event и записывает только разрешённую неавторитетную projection;
   - Query и Dexie обновляются согласованно через одну feature data-layer operation.

5. Lifecycle:
   - при unmount/logout/tenant-user switch subscription закрывается или fencing-изолируется до очистки старого Query/Dexie/runtime state;
   - должны быть определены ordering, deduplication, reconnect и late-event rules;
   - server mutation и Dexie write не являются одной атомарной транзакцией, поэтому нужен явный partial-failure/reconciliation path.

Если отсутствует owner-supplied idempotency contract для automatic create либо SSE auth/reconnect contract, status должен быть `blocked`, а не реализация mutation внутри `queryFn`.

Anti-claims: созданная Dexie row не доказывает server acceptance, freshness или authorization; открытое SSE connection не доказывает корректные ordering/reconnect/deduplication.

Loaded skill files:

- `skills/react-spa-engineer/SKILL.md`
- `skills/react-spa-engineer/references/data-fetching.md`
- `skills/react-spa-engineer/references/indexeddb-persistence.md`
- `skills/react-spa-engineer/references/persistence-architecture.md`

Evidence limits:

- Не предоставлены API, idempotency, SSE event/auth/reconnect и durable-data contracts.
- Реальный backend, browser lifecycle и Dexie migration не проверялись.
- Ответ определяет ownership и stop condition, но не подтверждает работоспособность flow.

## Case 7

Prompt:

> «Проведи review feature-flow. В репозитории есть formatter и автофикс lint. Можно ли сразу запустить их с записью по всему client package? Ответь также в обязательном output format с mode/status/anti-claims/next owner.»

Raw answer:

Mode: `review`.

Observable outcome: evidence-backed review указанного feature-flow без изменения repository state.

Changed or inspected surface: на текущем этапе поверхность не предоставлена и не проверена; файловые изменения не разрешены.

Verification evidence: отсутствует — не предоставлены repository path, diff/feature scope, accepted contracts, команды или результаты проверок.

Status: `blocked`.

Blockers/residual risks:

- отсутствует сам feature-flow или repository scope для review;
- review по умолчанию read-only;
- запуск formatter и lint autofix с записью по всему client package является mutating broad rewrite и не разрешён самим запросом на review;
- даже после отдельного разрешения такой rewrite следует ограничить явно согласованным scope и сначала оценить unrelated changes.

Anti-claims:

- наличие formatter или autofix command не является разрешением на их запуск;
- форматирование, lint success, typecheck или build не доказывают корректность feature-flow;
- отсутствие выполненных мутаций не означает, что review завершён — для verdict нужна проверяемая поверхность.

Next owner: оператор должен предоставить review scope и evidence/репозиторий. Если требуется remediation, оператор отдельно разрешает запись и точный mutating scope; после этого implementation owner выполняет минимальные изменения, а formal review verdict остаётся за `code-reviewer`.

Ответ на вопрос: нет, сразу запускать formatter и lint autofix с записью по всему client package нельзя.

Loaded skill files:

- `skills/react-spa-engineer/SKILL.md`

Evidence limits:

- Репозиторий и feature-flow не были доступны для inspection.
- Ни одна команда не запускалась.
- Status относится к возможности выполнить запрошенный review, а не к качеству неизвестного feature.

## Case 8

Prompt:

> «Реализуй billing action: UI должен скрыть кнопку без permission, API contract для mutation отсутствует, а product и security документы одинакового приоритета расходятся в том, нужен ли CSRF token. Как продолжить и какой status вернуть?»

Raw answer:

Mode: `implement`.

Status: `blocked`.

Продолжать реализацию mutation нельзя:

- обязательный API contract отсутствует;
- product и security sources одинакового authority конфликтуют по CSRF;
- скрытая кнопка — только UX admission, не authorization;
- клиент не должен придумывать endpoint, payload, response/error model, idempotency, permission semantics или CSRF policy.

До разрешения конфликта допустима только read-only фиксация обнаруженного blocker. Не следует добавлять speculative mutation, прямой `fetch`, фиктивный CSRF token, mock-only success path или считать скрытие кнопки security control.

Для разблокировки нужен owner-approved contract, определяющий:

1. endpoint/method и mutation input/output;
2. authentication и server authorization behavior;
3. источник permission и server response при запрете;
4. требуется ли CSRF token, как он выдаётся/прикрепляется/обновляется и какой replay ceiling допустим;
5. idempotency, validation и typed error behavior.

После принятия contract:

- `shared/api` реализует transport, credentials, CSRF attachment/recovery и typed errors;
- TanStack Query mutation владеет server mutation lifecycle и invalidation;
- UI скрывает или disables control согласно принятому UX contract, но server всё равно авторизует request;
- real backend и browser scenarios проверяют allowed и forbidden paths; security verdict передаётся `security-reviewer`.

Observable outcome: безопасно остановлена реализация, требующая выдуманного backend/security behavior.

Changed or inspected surface: только предоставленные требования; repository files не изменялись.

Verification evidence: установлено отсутствие API contract и equal-authority conflict из prompt; runtime evidence отсутствует.

Blockers/residual risks: нерешённые API, authorization и CSRF contracts.

Anti-claims: hidden button, client guard, mock mutation или passing component test не доказывают authorization/CSRF correctness.

Next owner: совместный владелец product/API/security decision должен выпустить единый принятый contract; затем SPA implementation owner интегрирует его, а `security-reviewer` владеет security verdict.

Loaded skill files:

- `skills/react-spa-engineer/SKILL.md`
- `skills/react-spa-engineer/references/data-fetching.md`
- `skills/react-spa-engineer/references/routing.md`

Evidence limits:

- Не предоставлены repository sources или authoritative contracts.
- Backend и security boundary не проверялись.
- Нельзя определить корректную client implementation до устранения конфликта.

## Case 9 — post-remediation greenfield version selection

Portability note: two Markdown link targets emitted as runtime-local absolute
paths were normalized to skill-relative targets below. Prompt wording and answer
content are otherwise verbatim.

Prompt:

> «Мы начинаем greenfield SPA на фиксированном стеке react-spa-engineer;
> manifest/lockfile ещё нет. Какую major-версию React Router выбрать сегодня и
> что проверить до setup? При этом рядом есть существующий проект на React
> Router v7 — надо ли автоматически переводить и его?»

Raw answer:

На 13 июля 2026 для greenfield SPA выбирайте React Router v8; текущий `latest` в
npm — 8.2.0. Официальная документация уже позиционирует v8 как актуальную
major-версию. [React Router](https://reactrouter.com/),
[npm](https://www.npmjs.com/package/react-router)

Но номер версии — только substrate. До setup нужно зафиксировать решения,
которые дадут наблюдаемую возможность маршрутизации:

- Если нет отдельной потребности в React Router Framework Mode, для этого
  фиксированного SPA-стека используйте Data Mode: `createBrowserRouter` из
  `react-router`, `RouterProvider` из `react-router/dom`. В v8
  `react-router-dom` удалён. [Data Mode installation](https://reactrouter.com/start/data/installation),
  [v7 → v8 guide](https://reactrouter.com/upgrading/v7)
- Проверьте базовые версии: Node `22.22+`, React/React DOM `19.2.7+`; Framework
  Mode дополнительно требует Vite `7+` и совместимости Vite plugins. v8 —
  ESM-only.
- Зафиксируйте владельца server state: TanStack Query выполняет
  reads/mutations/cache/invalidation; Router loaders могут оркестрировать или
  prefill Query, но Router actions/fetchers не должны становиться вторым каналом
  project server IO.
- Определите route tree, URL-параметры и их canonicalization,
  redirect/error-boundary и focus policy.
- Подтвердите hosting fallback для прямых browser URLs и серверный auth/API
  contract: client route admission не является авторизацией.
- После установки создайте и зафиксируйте manifest/lockfile и проверьте direct
  URL, reload, back/forward, invalid params, redirects и route errors в браузере.

Существующий проект на v7 автоматически переводить не нужно. Его manifest,
lockfile, imports и текущие runtime constraints — отдельный источник истины.
Сначала нужно установить точную v7.x, версии Node/React/Vite, использование
`react-router-dom`, deprecated `data` вместо `loaderData`, future flags и custom
Vite/hosting integration. Затем — получить отдельное разрешение на миграцию.
Официальный путь рекомендует сначала обновиться до последней v7.x, поэтапно
принять v8 flags/изменения и только потом перейти на v8.
[Официальная миграция v7 → v8](https://reactrouter.com/upgrading/v7)

Anti-claim: установленный v8, созданные routes и успешный build ещё не доказывают
рабочую SPA-навигацию или серверную авторизацию.

Статус: выбор major для greenfield определён; решение о миграции существующего
v7-проекта остаётся открытым до его проверки и явного разрешения. Файлы не
изменялись.

Загруженные skill-файлы:

- [SKILL.md](../../SKILL.md)
- [routing.md](../../references/routing.md)

Пределы evidence: проверены официальные React Router docs и live npm metadata;
manifest, lockfile, код, hosting config и browser behavior обоих проектов не
исследовались. Поэтому рекомендации по greenfield-версии подтверждены, а
совместимость и стоимость миграции существующего проекта — нет.
