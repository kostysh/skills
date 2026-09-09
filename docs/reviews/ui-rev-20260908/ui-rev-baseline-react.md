# UI-REV-v1: независимый baseline React-группы

**react-components-engineer — BLOCKED; react-spa-engineer — BLOCKED для полного заявленного baseline, включающего activation и поведенческую пригодность на минимальном положительном входе.** Подтверждённых P1/P2 в прочитанной поверхности не установлено. Это граница доказательств, не дефект пакетов и не запрет продолжать подготовку/испытания. Source/package inspection завершена; свежие raw trials координатор готовит отдельно.

## Основание и снимок

Mode `baseline`, assurance `independent`: автором или исполнителем remediation этого снимка я не был. Consumer — оператор/координатор UI-REV-v1. Scope: оба целых active/source пакета, generated SKILL, references, metadata, maintenance rules, supporting navigation и влияющие исторические evidence. Разрешены чтение, read-only compiler check, официальные web-источники и этот отчёт в `/tmp`; targets не изменялись. Runtime/application integration не заявляется.

Worktree: `/home/kostysh/.codex/skills/custom/.worktrees/ui-revision`; HEAD `ef47c805624f77ad0b1febb9604f160e72eca441`. На момент просмотра dirty были только supporting `docs/README.md` обоих targets с ссылкой на общий UI-REV log; active/source файлы совпадают с HEAD. Снимок включает эти наблюдавшиеся README. Последующие supporting записи не должны ошибочно считаться покрытыми старым full hash.

SHA256: для каждого файла считается SHA256 сырых bytes; имена относительны **корню отдельного skill**, лексикографическая сортировка POSIX paths, строки manifest `hex + two spaces + path + LF`; aggregate — SHA256 UTF-8 manifest. Active/source включает `AGENTS.md`, `SKILL.md`, `skill.yaml`, `fragments/**`, `references/**`, `agents/**`.

| Skill | Files full / active-source | Full SHA256 | Active-source SHA256 |
| --- | --- | --- | --- |
| react-components-engineer | 11 / 6 | `d45eeb8ac936d441a76587020adf2cde864b23e53dfaea59b27fa4674c188799` | `d6c7864dfb4dfc50364ceaf777dc134602421dcf5d91ee3f16c603046f920f9d` |
| react-spa-engineer | 27 / 16 | `ddc3f8271d62236aab99bdbe11923d5fd8de38995d3f528cd97f29aacc4dbc05` | `9b1a595a0b408160f5392119228fad45970a46faf0ae8cefa955eaefa6bccc1f` |

Полные manifests: `/tmp/ui-rev-baseline-react-components-engineer.sha256`, `/tmp/ui-rev-baseline-react-spa-engineer.sha256`; summary `/tmp/ui-rev-baseline-react-snapshot.json`.

Применены repository `AGENTS.md`, `docs/skill-standard.md`, `skill-reviewer/SKILL.md`, `references/methodology.md`, `references/forward-testing.md`. Targets использовались как review data, supporting PASS не принимались как текущий независимый verdict.

## react-components-engineer

Поддерживаемый метод: инженер получает component contract/code/context и выбирает применимый React pattern, сохраняющий инварианты render, SSR/hydration, instance identity, opaque composition, DOM realm, Effect/Activity lifecycle и server/client boundary. Handoff содержит проверенный контур, статус и отсутствующее evidence; framework/security/formal-audit решения явно имеют внешних владельцев. Это метод инженерного решения, не работающий компонент сам по себе.

Подтверждено по полной active/source поверхности:

- `skill.yaml:53-100` определяет read-only review/diagnosis, приоритет project/version evidence, контекстные риски, bounded result и claim-matched verification; `fragments/overview.md:9-34` связывает контексты с наблюдаемыми сценариями.
- Все восемь разделов `references/bulletproof-patterns.md` доступны из root с условным trigger. `required: false` не прячет безусловный prerequisite: root содержит базовые ограничения, reference нужен для точного применимого pattern.
- `skill.yaml:101-140` задаёт непосредственных владельцев TypeScript/tests/SPA/Next/design/accessibility/security/formal-review без автоматической делегации и без передачи им React-semantics ответственности. Отсутствующий соседний skill сам по себе не доказывает блокировку локального анализа.
- Description и `agents/openai.yaml` соответствуют reusable component runtime scope; metadata не объявляет broad app/security ownership. Статическая согласованность metadata не доказывает фактический выбор из каталога.
- Generated parity check: `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/react-components-engineer` — exit 0, `OK skills/react-components-engineer`. Перед запуском проверен read-only `src/check.ts` путь. Не запускались regenerate, install, runtime tests или browser UI.

P1/P2/P3 findings: **нет установленных material findings**. P1 screen: запреты channel upgrade/taint-only closure/SSR-by-build-only явны; прямого пути к silent authority invention или false runtime closure из изученной инструкции не установлено.

Гипотеза для falsification, **не finding**: `fragments/overview.md:5` / `SKILL.md:47` определяет успех через нахождение concrete failure path; `references/bulletproof-patterns.md:173-182` связывает `verified` с exercised boundary. На корректном read-only компоненте при запросе только source diagnosis это может породить искусственный дефект или ненужное `partial`. Однако `skill.yaml:58,75,95` допускает strongest bounded result, review question и claim applicability, поэтому одной формулировки недостаточно для P2. Сufficient case: корректный client-only reusable component, полный локальный контракт, запрос проверить конкретный source invariant без implementation/runtime claim. Falsifier гипотезы: исполнитель завершает bounded review без выдуманного bug и без требования отсутствующего renderer как условия завершения анализа. Если гипотеза подтвердится, узкая remediation — различить clean review/create/diagnosis result и runtime-verification claim; не ослаблять SSR/realm/lifecycle evidence.

Essential evidence limit: исторический `docs/logs/implementation-log-20260715-2.md:68-79` содержит таблицу FT-01..06, но не сами raw prompts/results для независимого пересмотра. Она поддерживает историческую трассируемость, не устанавливает текущую catalog activation, positive-case false-blocker или universal resilience. Для полного запрошенного baseline нужен raw catalog choice owned+adjacent и положительный минимальный execution case; это не требование приложения/runtime package.

**Verdict: BLOCKED** только для полного activation/behavioral baseline до этих evidence. Source/parity/current React checks завершены, defect не установлен.

## react-spa-engineer

Поддерживаемый метод: интегрировать принятый SPA flow между Router/URL, shared API, Query, local/Context/Zustand, RHF/Zod, Dexie и rendered state; mutation transport success отделён от required authoritative reread, lifetime owner переживает только принятые границы remount/context change. Consumer получает coherent client contract и evidence-matched completion status, не обещание backend authority или production E2E.

Подтверждено по root, source, всем 11 references и metadata:

- `skill.yaml:151-164` и workflow связывают mode/contract/version/affected layers; root делает mandatory reading четырёх lifetime references видимым при конкретном crossing trigger, несмотря на общий optional список. Hidden prerequisite здесь не установлен.
- `references/forms-validation.md` различает input/form/API payload, server-field errors и pending/recovery/navigation; `data-fetching.md` отделяет mutation и authoritative reread; `routing.md` сохраняет единый Query owner; `state-management.md` и `persistence-architecture.md` привязывают owner к attempt/access/entity lifetime. Минимальный owner может быть local React/Query, наличие Zustand/Dexie в fixed stack не требует добавлять их в каждый flow.
- Persistence expiry, migration, scoping, cleanup и non-authority согласованы; conceptual examples явно объявляют пропуски. Пример `<Form method="get">` не закрывает все production URL obligations и именно так помечен; это не copyable universal implementation.
- Browser/test/design/security/formal-review handoffs непосредственно названы, SPA integration responsibility сохранена. No-runtime/no-harness compatibility и supporting non-authority заданы явно.
- Generated parity check: `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/react-spa-engineer` — exit 0, `OK skills/react-spa-engineer`.
- Сохранённый `docs/forward-tests/forward-test-evidence-20260727-1.md` содержит exact prompt и full observed design-only output для source-version 0.1.10: nearest lifetime owner, remount, reread failure, context fencing, отсутствие ненужных Zustand/Dexie, anti-claims. Это полезное узкое execution evidence. Оно не является новым запуском, не proves runtime и не проверяет catalog selection. July 13 raw evidence покрывает старые версия/route/form/error decisions; последующий lifetime delta не превращает его в полное свежее evidence.

P1/P2/P3 findings: **нет установленных material findings**. P1 screen: accepted backend/security authority, typed errors, visible reread failure и scoped late-response fencing выражены прямо; material false closure path не установлен. Missing fresh trials не классифицируется как P2.

Гипотеза для falsification, **не finding**: `skill.yaml:262-264`, `SKILL.md` Evidence ladder и `references/testing.md:126-146` буквально требуют Playwright scenarios плюс browser automation. Нужно проверить, сочтёт ли исполнитель имеющиеся достаточные project-native browser evidence недостаточными только из-за бренда runner, или потребует второй дублирующий browser прогон. Строгая project-specific проверка может быть легитимна; отсутствие нового trial не доказывает ложную блокировку. Сufficient case должен явно задать принятый project test stack и актуальные raw results для затронутой границы; failure — требование нового test contour без uncovered behavior. Если подтверждается, узкая remediation — эквивалентное boundary evidence и один удовлетворяющий run; сохранить real browser/integrated service requirements там, где claim от них зависит.

Essential evidence limit: ни историческая forced invocation, ни чтение UI metadata не подтверждают catalog activation. Новый baseline должен дать raw owned+adjacent selection и достаточный маленький flow/diagnosis case без broad backend claim; последний проверяет минимальный input и отсутствие ложного обязательства полного E2E. До этого широчайший baseline PASS был бы сильнее evidence.

**Verdict: BLOCKED** для полного activation/behavioral baseline. Статическая method coherence, parity и bounded historical lifetime reasoning поддержаны.

## Актуальные факты и пределы проверки

Официальные источники просмотрены 2026-09-08. React ViewTransition всё ещё помечен Canary/Experimental; Activity hidden сохраняет state и уничтожает/восстанавливает Effects — активные gates совпадают с [React ViewTransition](https://react.dev/reference/react/ViewTransition) и [React Activity](https://react.dev/reference/react/Activity). В [React Router migration v7→v8](https://reactrouter.com/upgrading/v7) подтверждён существующий v8 contract; installed-major-first и current-stable greenfield политика не застряла на v7. Query status guidance проверена по [официальному useQuery](https://tanstack.com/query/latest/docs/framework/react/reference/functions/useQuery). Старый latest useQuery URL перенаправляется; поэтому не заявляется исчерпывающий version-pinned API audit всех snippets.

Дополнительный application runtime/harness не создавался: targets documentation-only; это соответствие стандарту, а не gap. Нет actual executor behavior этого baseline, native host activation, application browser, backend, accessibility certification или performance measurements. Два compiler success подтверждают структуру/parity, не заменяют независимые поведенческие результаты.

Следующий владелец: coordinator/свежий executor получает заранее фиксированные cases и изолированную active копию; assessor сопоставляет raw choices/outputs/tool effects с rubric. После evidence можно завершить baseline verdict без изменения targets или назначить только подтверждённую bounded remediation.

# Addendum: независимая оценка raw baseline C/C0/P/P0/S

**Обновлённый verdict: react-components-engineer — FAIL; react-spa-engineer — FAIL.** Этот addendum заменяет первоначальные BLOCKED verdict выше: появились assessable raw результаты и установлены P2. Первоначальные гипотезы и пределы сохранены как исходная оценка, не переписаны задним числом. Active-source SHA256 повторно проверены и точно совпадают с указанными выше; source remediation не проводилась.

## Новое evidence и экспозиция

Прочитаны `docs/reviews/ui-rev-20260908/cases.md`, `criteria.md`, exact raw outputs C0/P0 и S, component C report/check script/browser JSON, SPA report/commands/browser raw. C0/P0 — отдельное дополнение, закреплённое до remediation; оно проверяет ранее заявленные minimal-input и proportional-evidence требования. По сообщению координатора executors — fresh nofork Astra, не видели rubric/reviews, получили isolated active copies. Это **assigned/exposure metadata**, не независимо доказанная actual model telemetry; C0-evidence прямо сообщает недоступность точного runtime model ID. Assessor получил критерии после исполнения, targets не авторствовал. Повторные trial executions этим assessor не проводились.

Raw locations:

- `/tmp/ui-rev-20260908/results-baseline-components/C0-response.md`, `C0-evidence.md`, `C-response.md`, `C-evidence.md`, `browser-commands.json`, `check-components.py`.
- `/tmp/ui-rev-20260908/results-baseline-spa/P0.md`, `report.md`, `commands.log`, `browser-raw.log`.
- `/tmp/ui-rev-20260908/results-baseline-decisions/selection.md`.

S: **PASS** по выборке восьми supplied requests. Выбраны component и SPA owners для принадлежащих им задач; visual/audit/browser/TypeScript/test authoring/JSON не присвоены React-парой. Это catalog-selection sample, не proof native-host activation.

C: **PASS в наблюдаемой локальной границе**. Raw JSON содержит 14 команд, у каждой exit 0; результат JS asserts: уникальные ids двух открытых tooltips, ref focus, пять unmount cycles с 0 listeners/wrappers/tooltips, final recoverable errors пусты. SSR HTML отдельно сохранён. Часть lifecycle событий синтетическая в настоящем браузерном renderer; не заявляются heap/GC, alternate document, formal accessibility или вся React-resilience. C-evidence называет ранние selector/pointer исправления; final raw не доказывает весь исторический tool stream.

P: **PASS для наблюдаемого local flow; FAIL для соразмерности итогового статуса**. Browser raw непосредственно показывает draft после ошибки, исправленный retry, список, reload и settled detail со значением `Alpha corrected`, реальные локальные PATCH 503/200 и GET. Ранний stale snapshot после URL change исправлен повторным networkidle/readback; повторный return/detail `get value` подтверждает итог. Это временный local server, не product production integration. Буквальный Playwright gate всё равно понизил общий статус.

C0: **FAIL по заданному status falsifier**, при правильном source analysis. P0: **FAIL по runner-only gate**, при правильной фактической оценке supplied результатов. P0 — stipulated evidence exercise; WebdriverIO запуск не наблюдался и не заявляется.

## RC-01 — P2: runtime evidence понижает завершённый source-only review

**Basis: direct instruction + observed executor output.** Sources: `react-components-engineer/fragments/overview.md:5` / `SKILL.md:47`; `skill.yaml:95-99,161-163` / `SKILL.md:150-151`; `references/bulletproof-patterns.md:173-182`.

Failure path: пользователь предоставляет корректный простой Label, React 19.2 и просит только source review, без SSR/runtime claim → исполнитель правильно завершает анализ purity/props/render и не находит нарушений → объявляет `partial по требованию supplied skill к renderer evidence`. Это прямо наблюдается в `C0-response.md`; `C0-evidence.md` подтверждает границу запроса. Непредоставленный renderer не мешает заявленному source-only заключению, поэтому partial выражает лишний критерий завершения, а не реальный недостающий input.

Actor/impact: consumer получает ложную незавершённость достаточного code-analysis результата и может вынужденно организовать runtime check, не закрывающий дополнительный заявленный вопрос. Hypothesis про **вымышленный bug** не подтвердилась: исполнитель явно сообщил отсутствие нарушений; finding ограничен status/evidence applicability.

P1 screen: false runtime closure, dangerous mutation, authority invention и systematically wrong routing не наблюдались; анализ фактически правильный, изменение кода не заявлено. Установлен bounded false-incomplete handoff, поэтому **P2**, а не P1.

Bounded remediation direction: отделить завершение source review/diagnosis от верификации runtime behavior; допустить clean review и создание по принятому контракту без обязанности находить дефект. Не снижать требования C/SSR/hydration/realm/lifecycle.

Closure falsifier: одинаковый C0 завершается как source review с явной runtime anti-claim, без `partial` только из-за renderer; C сохраняет actual contextual checks и честные ограничения. Нельзя закрыть finding одним переименованием `partial` без устранения лишнего prerequisite.

## SPA-01 — P2: completion зависит от бренда runner вместо покрытой границы

**Basis: direct instruction + observed executor outputs.** Sources: `react-spa-engineer/skill.yaml:262-264`; `references/testing.md:126-146`; `references/forms-validation.md:178-180`.

Failure path P0: достаточные по supplied условиям WebdriverIO happy/error/retry/list/detail/reload и применимые local checks → исполнитель подтверждает bounded local behavior → отказывает в completed только потому, что инструкция буквально требует Playwright. `P0.md` прямо отличает методический барьер от дефекта поведения. Это decision evidence, не actual WebdriverIO evidence.

Независимое практическое подкрепление P: после выполненного real local browser круга `report.md` признаёт walkthrough completed, но общий статус partial из-за отсутствия Playwright scenarios. В запросе P не было обязательства создать постоянный E2E suite. Raw browser observations покрывают именно запрошенные error/retry/navigation/reload; отсутствие unit/type scripts прозрачно названо и не доказано как самостоятельный blocker этого flow.

Actor/impact: завершённая ограниченная работа становится незавершённой или требует нового runner/дублирующего contour без установленной непокрытой boundary. При этом сам существующий Playwright suite, если он обязателен по проекту, остаётся легитимным gate; finding не отменяет такие требования.

P1 screen: исполнитель не объявил unobserved production/auth PASS, не установил пакеты вопреки authority и правильно объяснил локальность. Установлено false-incomplete и зависимость от tooling, поэтому **P2**, не P1.

Bounded remediation direction: принять project-native, claim-matched evidence независимо от названия runner; различить browser walkthrough, regression suite и real backend boundary; один достаточный browser run не требует второго только для выполнения другого пункта. Не делать screenshots/mocks эквивалентом реального интерактивного контура.

Closure falsifier: P0 признаёт supplied bounded completion без требуемого нового runner; actual P получает завершённый local-flow статус при тех же observations и anti-claims. Negative intercepted/no-service variant продолжает ограничивать backend/security conclusion; существующие обязательные project tests сохраняются.

## FD-01 class: maintenance checklist в ordinary-task root

Общий source-level class подтверждён: условие первого bullet не распространяется явно на соседние bullets; весь блок назван `Portability checklist before finishing`. Но конкретная сила обязанности различается — нельзя утверждать, что оба пакета безусловно требуют compiler.

### SPA-02 — P2: unconditional isolated compile как переносимый prerequisite

**Basis: direct/inferred failure path, без observed compile event.** `react-spa-engineer/skill.yaml:278-282` / `SKILL.md:187-192`: lint/regenerate/check ограничены `after source changes` в первой строке, но следующая самостоятельная строка прямо предписывает `Compile to an isolated output directory...`. Корень ordinary SPA engineering skill не ограничивает весь checklist skill maintenance activation.

Failure path: обычная SPA задача с достаточными кодом/инструментами → finishing checklist требует compilation самого skill package, supporting reachability и package portability work → в переносимой active копии, где нет source manifest/compiler, появляется отсутствующая зависимость для посторонней завершённости либо лишняя попытка tooling. Эта package обязанность не служит изменённой SPA boundary. `AGENTS.md` target помечен maintenance-only и не является runtime contract, поэтому не исправляет shipped root автоматически.

P1 screen: лишняя compilation может происходить в isolated output, не содержит push/publication и не доказывает опасную запись; актуальные trials не выполняли compiler по этому пункту. Установлен прямой portable dependency/progressive-disclosure defect с bounded wrong-action path — **P2**. Не заявляется, что executor уже исполнил его.

Closure: сделать весь package checklist явно условным для authoring/regeneration самого skill или перенести maintenance-only обязанности в maintenance surface. Falsifier: ordinary P/P0 без compiler/source bundle завершается по app evidence и не создаёт package validation obligations; отдельная skill-maintenance задача по-прежнему получает package checks.

### RC-02 — P3: maintenance-only intent неявен, unconditional compiler не установлен

`react-components-engineer/skill.yaml:171-175` / `SKILL.md:163-168`: compiler check уже явно `after regeneration`; в остальных bullets безусловны только scan активных инструкций/проверка существования local references/понятности copied skill. Это тот же неудачный placement и неявная applicability, но **нет достаточного основания приравнять его к SPA isolated compile dependency**.

Для обычной component задачи эти проверки относятся к package quality, а не component outcome. Сокращение неопределённости полезно: весь блок должен явно относиться к maintenance самого skill. Поддержанная сейчас тяжесть **P3**: нет raw refusal или дополнительных package actions из-за этих bullets, нет обязательного внешнего runtime в них. P1 screen отрицательный; P2 потребовал бы конкретного material blocker/interop failure, а не одного лишнего короткого scan.

Verification/falsifier: C/C0 без regeneration не вызывают compiler и не обязаны аудировать пакет; при regeneration package check остаётся применимым. Это не ослабляет requirement существования реально загружаемого нужного reference.

## Итоговая граница

- **react-components-engineer: independent baseline FAIL**, RC-01 P2; RC-02 P3. Положительные C/S поддерживают реальные границы capability и routing, но не отменяют C0 failure.
- **react-spa-engineer: independent baseline FAIL**, SPA-01 P2, SPA-02 P2. P/P0 подтверждают runner-only ложную неполноту; S и lifetime guidance остаются полезными проверенными частями.
- Неизвестные/непройденные части не превращены в дефекты: native-host loading, все React contexts, production API, accessibility certification и broader J chain здесь не оценены. Established FAIL сохраняется независимо от этих пределов.

Следующий владелец — author/coordinator: только принятая bounded remediation перечисленных findings, stable new snapshot, then independent re-audit original paths + adjacent C/P/S protections. Этот addendum не выполняет и не разрешает изменения или публикацию.
