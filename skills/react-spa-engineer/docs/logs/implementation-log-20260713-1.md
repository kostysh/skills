# Implementation Log

## Language

Русский.

## Log ID

`implementation-log-20260713-1`

## Related Issue

Нет отдельного issue; реализация выполнена по утвержденному оператором плану.

## Related Plan

План утвержден в текущем Codex thread; отдельный plan-файл не создавался.

## Operator Request

Укрепить `react-spa-engineer` без изменения фиксированного стека, устранить
сквозные capability и guidance gaps, синхронизировать source/generated/supporting
поверхности и получить независимый `skill-reviewer` verdict.

## Summary

Завершено. Fixed-stack capability contract, conditional guidance и evidence
поверхности синхронизированы; focused independent re-audit финального snapshot
вернул `PASS` без P0/P1/P2/P3.

## Changes Made

- `skill.yaml` и `fragments/overview.md` — сквозной contract, режимы, precedence,
  evidence ladder, interop и fixed-stack ownership.
- `references/*` — исправление противоречивых или устаревших copyable guidance.
- `agents/openai.yaml` — конкретный trigger-facing short description.
- `SKILL.md` и `docs/compile-report.md` — регенерированы компилятором.
- `docs/README.md` — evidence-limit для исторических self-certified PASS.
- `docs/logs/forward-test-raw-20260713-1.md` — дословный durable transcript
  свежего blind forward-test run.

## Decisions

- Стек React, TypeScript, Vite, TanStack Query, Zustand, React Hook Form/Zod,
  React Router и Dexie сохранен.
- React Router владеет navigation/URL/loaders; TanStack Query владеет project
  server reads/mutations; `shared/api` владеет transport.
- Runtime и постоянный test harness для documentation-only skill не добавляются.
- Старые логи не переписываются; их evidence-limit фиксируется в README.

## Remediation Matrix

| Finding | Concrete change | Evidence | Status |
| --- | --- | --- | --- |
| P1: отсутствует сквозной capability contract | Добавлены modes, authority/precedence, side-effect boundary, workflow, statuses, output contract и evidence ladder. | Generated readback, compiler checks, blind evidence и independent re-audit. | closed |
| P1: active references противоречат root/current APIs | Введен example contract; unsafe Query, Router, Dexie, RHF/Zod, accessibility, performance, testing и TypeScript guidance консолидирован. | Versioned compile-smokes, blind cases и independent re-audit. | closed |
| P2: trigger/source authority/interop неполны | Уточнены description/UI metadata, installed-version precedence и owner matrix. | Generated readback, conditional-reference reachability и independent re-audit. | closed |
| P2: legacy self-certified PASS | README явно ограничивает старые PASS; новый verdict snapshot-bound и независимый. | Historical logs не изменены; final independent verdict зафиксирован ниже. | closed |
| Re-audit P2: greenfield Router major/evidence conflict | Разделены current-stable greenfield policy и installed v7 compatibility; guidance проверено на React Router v8.2.0, v7 evidence переименовано. | V7/V8 compile-smokes, fresh blind Case 9 и focused independent re-audit. | closed |

## Verification Performed

Выполнено:

- `skill-source-compiler lint skills/react-spa-engineer` — PASS.
- `skill-source-compiler regenerate skills/react-spa-engineer` — PASS.
- `skill-source-compiler check skills/react-spa-engineer` — PASS, warnings отсутствуют.
- Out-of-place `compile` в disposable directory, повторный `check`, readback и
  `cmp` generated `SKILL.md`/`agents/openai.yaml` — PASS.
- Все 11 conditional references достижимы из generated `SKILL.md`; hidden
  required references отсутствуют.
- Portability search активной/source/supporting candidate surface — абсолютные
  machine-specific зависимости не найдены.
- `git diff --check -- skills/react-spa-engineer` — PASS.
- `pnpm test` — PASS: 99 tests в четырех code-backed workspace packages;
  `react-spa-engineer` остается documentation-only и собственного runtime/test
  package не поставляет.

### Versioned Compile Smoke

Disposable TypeScript project типизировал без emit объединенный smoke для:

- Zod `4.4.3`: `z.email({ error })`, string `.min(..., { error })` и boolean
  `.refine(..., { error })`;
- TanStack Query `5.101.2`: `isPending`, `isLoading`, `isFetching`,
  `isRefetching`, explicit `useMutation`;
- React Router `7.18.1`: compatibility smoke для запрошенной v7 границы — Data
  Mode route object, `Component`, `loader` и Query `ensureQueryData`
  orchestration; v7 не называется current major;
- React Router `8.2.0`: current-greenfield smoke тех же Data Mode route object,
  `Component`, `LoaderFunctionArgs`, `loader` и Query `ensureQueryData` APIs;
- React `19.2.7`, `@types/react` `19.2.17`, TypeScript `7.0.2` использовались
  только как disposable compile environment, не как изменение runtime package
  или переносимый version pin.

Ограничение evidence: compile-smoke подтверждает совместимость выбранных
типовых API на указанных major-версиях, но не runtime UX, backend integration или
production behavior. V7 smoke подтверждает installed-major compatibility, а v8
smoke — текущую greenfield boundary на дату проверки; ни один из них не
разрешает автоматический major upgrade существующего проекта.

### Independent Re-audit Cycle 1

- Reviewed active/source hash:
  `7028824fcb038ddfe48e445fabd429e119a91257839804015df81a7c4e4dd53a`.
- Assurance: independent `skill-reviewer`; read-only.
- Verdict: `FAIL` — P0/P1 отсутствуют, один P2.
- P2: root current-stable greenfield policy конфликтовал с `routing.md`, который
  называл v7 greenfield target, и с заголовком evidence `Current-major` для v7.
- Root cause remediation: existing projects по-прежнему следуют установленной
  major-версии; greenfield следует официальной current stable; routing guidance
  явно проверено на v8 с общей v7/v8 Data Mode поверхностью; v7 evidence
  переименовано в compatibility smoke; добавлен отдельный v8.2.0 smoke.
- Stack impact: отсутствует — React Router остается владельцем navigation/URL/
  loaders; competing router не добавлен, автоматический upgrade не предписан.
- Acceptance остается open до fresh greenfield blind case, нового snapshot и
  focused independent re-audit.

### Candidate Snapshot for Focused Re-audit

- Active/source contract hash:
  `5acb2be8f3d1471b12e6aa933a585b406c4eb3588478c1fa43ac4acf426a0416`.
- Hash scope/command идентичны Cycle 1; изменён только active
  `references/routing.md`, generated root остался compiler-synchronized.
- Updated forward evidence hash:
  `7da7b3bd2b74c30e994ac58dfdac93ca001dc7d8c030a43d83f031a970da96b5`.
- Case 9 result: PASS — fresh blind executor выбрал current React Router v8.2.0
  для greenfield, сохранил installed-version precedence для существующего v7,
  потребовал отдельное migration authority и не подменил navigation/auth
  behavior установленной зависимостью или build.
- Raw Case 9 сохраняет prompt и answer content; только два runtime-local absolute
  Markdown target нормализованы в portable relative links и явно отмечены в
  evidence artifact.
- Focused independent verdict: `PASS`, no P0/P1/P2/P3.

### Independent Focused Re-audit Cycle 2

- Assurance: independent `skill-reviewer`; read-only.
- Reviewed active/source hash:
  `5acb2be8f3d1471b12e6aa933a585b406c4eb3588478c1fa43ac4acf426a0416`.
- Reviewed forward evidence hash:
  `7da7b3bd2b74c30e994ac58dfdac93ca001dc7d8c030a43d83f031a970da96b5`.
- Hashes independently reproduced; official React Router current `8.2.0`
  verified.
- Cycle 1 P2 closed: greenfield uses live current-stable selection; existing
  projects retain manifest/lockfile and installed-major precedence; v7 is not
  automatically migrated.
- Structural evidence: compiler lint/check, disposable compile/readback,
  portability и `git diff --check` — PASS.
- Findings: none at P0/P1/P2/P3.
- Verdict: `PASS`.

### Author Self-check — PROVISIONAL

Author self-check по `Audit instruction quality`:

- outcome, modes, inputs, authority, allowed side effects, evidence и output
  shape определены в root contract;
- `SKILL.md` самодостаточен, а references загружаются условно по точным triggers;
- обязательные stop rules охватывают отсутствующие/конфликтующие product, API,
  security и compatibility contracts;
- interop назначает producible owners, сохраняя за `react-spa-engineer`
  интеграцию SPA flow;
- active/reference guidance не содержит найденных baseline-противоречий;
- documentation/runtime/test parity честно обозначена как documentation-only;
- substrate-only closure запрещен evidence ladder и anti-claims.

Результат author self-check: `PROVISIONAL PASS`. Это не независимый verdict и
не закрывает acceptance.

### Skill Review Evidence

- Baseline mode/assurance: `baseline` / `independent`.
- Baseline snapshot: `9cfb6f8fc53b9876e8db18b4d19df07c3761c881c6abdf4fc4951572eb72f8c6`, 19 files.
- Baseline verdict: `FAIL` — два P1 и два P2.
- Claimed capability: агент ведет интегрированный client-side SPA flow на
  фиксированном стеке до evidence-backed результата или честного partial/blocked
  handoff.
- Anti-claims: skill prose не запускает SPA, не подтверждает backend/security,
  не доказывает accessibility/performance и не превращает compiler/tests/mocks в
  более широкий runtime claim.
- Raw forward-test prompts/outputs сохранены в
  [forward-test-raw-20260713-1.md](forward-test-raw-20260713-1.md); candidate
  Cycle 2 snapshot получил независимый `PASS`.

### Candidate Snapshot for Independent Review

- Active/source contract hash:
  `7028824fcb038ddfe48e445fabd429e119a91257839804015df81a7c4e4dd53a`.
- Hash scope: 15 files — generated `SKILL.md`, `skill.yaml`,
  `fragments/overview.md`, `agents/openai.yaml` и все 11 `references/*.md`,
  отсортированные по skill-relative path; aggregate построен из их
  `sha256sum`. Воспроизводимая команда из корня skill:
  `{ printf '%s\0' SKILL.md agents/openai.yaml fragments/overview.md skill.yaml;
  find references -maxdepth 1 -type f -name '*.md' -print0; } | sort -z |
  xargs -0 sha256sum | sha256sum`.
- Verbatim blind evidence hash:
  `ac3bef5f779695a9d5ac58942dbd9273753a8ad31056860a69f602ff067a7373`.
- Full copied-skill check на момент freeze: 24 files, out-of-place compile/check
  PASS. Supporting log hashes не включены в active/source hash, чтобы запись
  verdict в этот log не меняла reviewed instruction surface.
- Независимый verdict этого Cycle 1 snapshot: `FAIL` — один P2, закрытый в
  Cycle 2.

Первоначально записанный aggregate `874039ec…` использовал тот же неизменный
набор и те же file hashes, но помещал `skill.yaml` перед `references/*` и потому
не соответствовал заявленной полной сортировке. Независимый reviewer обнаружил
невоспроизводимость до verdict; metadata исправлена, active files не менялись.

### Blind Forward-test Context

- Исполнитель: свежий delegated agent `/root/react_spa_candidate_blind`.
- Режим: read-only; файловые изменения запрещены.
- Исполнителю переданы только нейтральные prompts и указание использовать
  candidate как рабочий skill. Suspected defects, expected diagnosis и rubric
  answers не передавались.
- Evaluator context: ответы оценены против root mode/authority/ownership/evidence
  contract, а не по совпадению формулировок с планом.

### Blind Forward-test Rubric

| Case | Проверяемая capability | Result |
| --- | --- | --- |
| 1 | Сквозной URL + Query + Dexie ownership и claim-matched completion | PASS |
| 2 | Query v5 initial/background status semantics | PASS |
| 3 | Отказ от route/unit/mock/config/screenshot-only closure | PASS |
| 4 | Handoff reusable accessible component правильному owner | PASS |
| 5 | Актуальная Zod 4 schema/error API | PASS |
| 6 | Mutation вне `queryFn`, realtime transport и Dexie orchestration | PASS |
| 7 | Read-only review и полный output contract | PASS |
| 8 | `blocked` при missing API и equal-authority security conflict | PASS |
| 9 | Current-stable greenfield Router selection без автоматического v7 upgrade | PASS |

Ограничение: успешные forward cases подтверждают decision behavior на выбранных
сценариях, но не заменяют независимый review полного snapshot.

### Forward-test Evaluator Excerpts

Полный дословный transcript без сокращений находится в
[forward-test-raw-20260713-1.md](forward-test-raw-20260713-1.md). Ниже оставлены
human-readable evaluator excerpts; при расхождении raw artifact имеет приоритет.

#### Case 1

Prompt:

> «Спроектируй orders-page для tenant-scoped SPA: tenant в route, filters/page в URL, server list через Query, справочник статусов может переживать reload. Дай минимальную архитектуру и скажи, когда результат можно считать completed.»

Raw output:

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

#### Case 2

Prompt:

> «В TanStack Query v5 список уже показан, сейчас идет background refetch. Какой status использовать для небольшого refreshing indicator и нужно ли скрывать текущий список?»

Raw output:

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

#### Case 3

Prompt:

> «Мы добавили protected route, unit tests, MSW happy path, Playwright config и screenshot login-page. Можно закрыть задачу как полностью работающий cookie-session login flow? Если нет, какой status и минимальное недостающее доказательство?»

Raw output:

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

#### Case 4

Prompt:

> «Нужно сделать переиспользуемый accessible combobox для нескольких приложений; SPA routing/data/persistence не затронуты. Кто primary owner и что делает react-spa-engineer?»

Raw output:

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

#### Case 5

Prompt:

> Дай Zod 4 schema для формы с email, паролем минимум 8 символов и обязательным
> terms; используй актуальный error customization.

Raw output:

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email({ error: 'Enter a valid email address' }),
  password: z.string().min(8, { error: 'Use at least eight characters' }),
  terms: z.boolean().refine((accepted) => accepted, {
    error: 'Accept the terms to continue',
  }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

> Это форма для Zod 4: error customization передаётся через `error`, а email
> использует top-level `z.email()`.
>
> Loaded skill files: `SKILL.md`, `forms-validation.md`.
>
> Evidence limits: schema не компилировалась против manifest конкретного
> проекта; не проверены RHF integration, accessible rendering, API mapping и
> server validation; для Zod 3 snippet применять нельзя без адаптации.

#### Case 6

Prompt:

> При первом открытии chat-page сервер должен создать chat, если его нет, а затем
> подключить SSE updates и сохранить разрешенную локальную проекцию в Dexie. Где
> разместить create, realtime transport и persistence orchestration?

Raw output:

> 1. Проверка существования chat — repeatable read через TanStack Query;
>    `queryFn` не создаёт chat.
> 2. Создание — отдельная именованная Query mutation в feature data adapter,
>    вызывающая typed operation из `shared/api`; automatic create требует
>    принятого idempotency/retry contract.
> 3. SSE construction, credentials, parsing, reconnect, cancellation и typed
>    errors находятся в `shared/api`; UI hook не вызывает `new EventSource()`.
> 4. Dexie schema/migration/TTL/allowlist/scope/cleanup принадлежат
>    `shared/storage` либо feature persistence adapter; orchestration валидирует
>    event и пишет только разрешённую non-authoritative projection.
> 5. При unmount/logout/context switch subscription закрывается или fencing-
>    изолируется до cleanup; ordering, deduplication, reconnect, late events и
>    partial-failure reconciliation должны быть определены.
>
> Если нет owner-supplied idempotency contract для automatic create либо SSE
> auth/reconnect contract, status `blocked`, а не mutation внутри `queryFn`.
>
> Anti-claims: Dexie row не доказывает server acceptance/freshness/authorization;
> SSE connection не доказывает ordering/reconnect/deduplication.
>
> Loaded skill files: `SKILL.md`, `data-fetching.md`,
> `indexeddb-persistence.md`, `persistence-architecture.md`.
>
> Evidence limits: API, idempotency, SSE и durable-data contracts не
> предоставлены; backend/browser lifecycle/migration не проверялись.

#### Case 7

Prompt:

> Проведи review feature-flow. В репозитории есть formatter и автофикс lint. Можно
> ли сразу запустить их с записью по всему client package? Ответь также в
> обязательном output format с mode/status/anti-claims/next owner.

Raw output:

> Mode: `review`.
>
> Observable outcome: evidence-backed review feature-flow без изменения
> repository state.
>
> Changed or inspected surface: поверхность не предоставлена; файловые изменения
> не разрешены.
>
> Verification evidence: отсутствует — repository path, feature scope, contracts
> и результаты проверок не предоставлены.
>
> Status: `blocked`.
>
> Blockers/residual risks: отсутствует review surface; review по умолчанию
> read-only; formatter/lint autofix по всему client package — mutating broad
> rewrite без разрешения.
>
> Anti-claims: наличие formatter/autofix не является разрешением; format/lint/
> typecheck/build не доказывают feature-flow; отсутствие мутаций не означает
> завершённый review.
>
> Next owner: оператор предоставляет review scope; remediation и точный mutating
> scope разрешаются отдельно, а formal verdict остаётся за `code-reviewer`.
>
> Ответ: нет, сразу запускать formatter и lint autofix с записью нельзя.
>
> Loaded skill files: `SKILL.md`.
>
> Evidence limits: repository/feature-flow недоступны, команды не запускались.

#### Case 8

Prompt:

> Реализуй billing action: UI должен скрыть кнопку без permission, API contract
> для mutation отсутствует, а product и security документы одинакового
> приоритета расходятся в том, нужен ли CSRF token. Как продолжить и какой status
> вернуть?

Raw output:

> Mode: `implement`.
>
> Status: `blocked`.
>
> Реализацию mutation продолжать нельзя: обязательный API contract отсутствует,
> equal-authority product/security sources конфликтуют по CSRF, hidden button —
> только UX admission. Клиент не придумывает endpoint, payload, response/errors,
> idempotency, permission semantics или CSRF policy.
>
> До разрешения допустима только read-only фиксация blocker. Для разблокировки
> нужен owner-approved contract: endpoint/method/input/output; authentication и
> server authorization; permission source/forbidden response; CSRF issue/
> attach/refresh/replay semantics; idempotency, validation и typed errors.
>
> После принятия contract `shared/api` владеет transport/CSRF/errors, Query
> mutation — lifecycle/invalidation, UI — принятым UX behavior, server —
> authorization; real backend/browser scenarios проверяют allowed/forbidden
> paths, `security-reviewer` владеет security verdict.
>
> Observable outcome: безопасно остановлена реализация, требующая выдуманного
> backend/security behavior.
>
> Changed or inspected surface: только требования; files не изменялись.
>
> Verification evidence: prompt подтверждает missing API contract и
> equal-authority conflict; runtime evidence отсутствует.
>
> Blockers/residual risks: нерешённые API, authorization и CSRF contracts.
>
> Anti-claims: hidden button, client guard, mock mutation или passing component
> test не доказывают authorization/CSRF correctness.
>
> Next owner: product/API/security decision owners выпускают единый accepted
> contract; затем SPA owner интегрирует, security reviewer проверяет.
>
> Loaded skill files: `SKILL.md`, `data-fetching.md`, `routing.md`.
>
> Evidence limits: authoritative contracts/backend не предоставлены и не
> проверялись.

## Deviations From Plan

- Плановый React Router v7 compile-smoke сохранен как installed-major
  compatibility evidence. После independent freshness finding добавлен отдельный
  current-greenfield v8.2.0 smoke; стек React Router не менялся.
- Verbatim Case 9 содержал два runtime-local absolute Markdown target; только
  targets нормализованы в relative links с явной пометкой, чтобы supporting
  evidence оставалось portable.

## Side Effects

Активный instruction contract становится строже: review/diagnose остаются
read-only, а completion claims требуют evidence на фактической границе поведения.
Стек приложения и runtime package surface не меняются.

## Follow-up

- Обязательных follow-up нет. Будущая greenfield работа должна заново проверять
  current stable major по официальным docs; это не разрешает автоматические
  major upgrades существующих проектов.

## Final Status

PASS — independent focused re-audit; no P0/P1/P2/P3.
