# Журнал реализации: capability-first ревизия `financial-calculations-engineer`

## Идентификатор

`implementation-log-20260716-1`

## Связанные issue и plan

Отдельные repository issue и plan не создавались. Оператор утвердил план в текущем Codex thread.

## Запрос оператора

Провести полный review `financial-calculations-engineer`, проверить назначение, authority и responsibility boundaries, входы, выходы, interop, актуальность guidance, portability и substrate-only success paths. Минимально улучшить скил, синхронизировать generated package и получить независимый `skill-reviewer` verdict. Внешний `packages/money` использовать как read-only authority и не изменять.

## Capability и anti-claims

Заявляемая способность после изменения: направлять design, implementation и review детерминированной EUR-арифметики от принятого финансового правила до явного calculation contract, минимального изменения и evidence по реально исполненным contours.

Anti-claims:

- скил не определяет tax applicability, tariff policy, ledger accounts, recognition или posting lifecycle;
- документационный package не создаёт runtime financial capability;
- compiler success не доказывает качество финансовых решений;
- unit/browser tests money library не доказывают PostgreSQL, application wiring, persistence или end-to-end parity;
- примеры 22%, scorporo и SQL не являются business/legal authority;
- текущая работа не подключает `money` package к приложению и не добавляет SQL runtime.

## Baseline

- Skill repository revision: `a2588187e20999a9057b8ce62ad1fd9b73c8aabb`.
- Baseline skill aggregate SHA-256: `45b3e3b4fbd0249bff1e3ebfb48b8b4c3f46e154fc28aa5f7a33e93ebad0f6b1`.
- Read-only application revision: `af387e1056e99f49cc4c4c62e6b8e6031483cbb1`.
- Read-only `packages/money` aggregate SHA-256: `337c1bc66fdd7e5d43ad6a79da7be66cd19dbf4ad8d3c98a60cb3ec9b886d576`.
- Independent baseline `skill-reviewer` verdict: `FAIL`.

## Remediation matrix

| Baseline finding | Изменение | Evidence | Статус |
| --- | --- | --- | --- |
| P1: скил присваивал tax/accounting/ledger authority | Введены authority inputs, source precedence, missing/conflict stop и routing ledger/policy к принятым источникам | Конфликтующая ставка и ledger без accounting policy заблокированы в blind cases; независимый re-audit подтвердил closure | closed |
| P1: unitless JSON string допускал 100× reinterpretation | Разделены `amountCents` и human-input fields, parsers и round-trip contract | Blind case отклонил generic `amount: "1999"` и сохранил обе явные семантики; re-audit подтвердил closure | closed |
| P1: SQL helpers противоречили money API | Небезопасные snippets удалены; введён SQL conformance contract для denominator, rates, overflow, range, errors и tie-break | SQL edge case отклонил `NULL`, negative denominator и `BIGINT` intermediate; re-audit подтвердил closure | closed |
| P1: package tests могли закрыть cross-layer parity без SQL/app | Введены contour inventory, evidence matrix и `verified/partial/blocked` closure rules | Package-only case остался `partial`, а ограниченный library/PostgreSQL claim был принят без расширения scope; re-audit подтвердил closure | closed |
| P2: portable skill требовал один `packages/money` layout | Введены runtime discovery, verified public API profile и deterministic fallback/stop при отсутствии engine | Изолированная package readback прошла; no-engine case сохранил формулу у owning module и не создал speculative package; re-audit подтвердил closure | closed |

## Изменения

- Source version повышена до `0.2.0`.
- Root workflow заменён на четыре outcome-first стадии: authority contract, engine/contour discovery, minimal contract-complete implementation, real-boundary verification/reporting.
- Определён final output contract: authority, calculation contract, affected contours, outcome, evidence matrix, anti-claims, residual risk и status не сильнее weakest required contour.
- Все шесть references переведены в optional active surface с точными triggers.
- Browser/backend boundary использует unit-bearing DTO names и запрещает один parser для cents и human euros.
- SQL reference больше не предлагает unchecked executable helper.
- VAT/IVA reference параметризована accepted rate и требует отдельного residual-cent decision.
- Money-engine reference требует actual API discovery и не создаёт shared package для one-off domain formula.
- UI metadata синхронизирована с новым capability boundary.
- Собственный runtime, commands, assets и постоянный test harness не добавлены.

## Verification

### Author self-check

Статус: `PASS`.

- Purpose, trigger, responsibility, authority/input, output/verdict, interop, fallback, stop и validation contracts перечитаны на generated surface.
- Свобода действий ограничена финансовыми invariants и evidence gates без обязательной full-stack работы для локального изменения.
- Active references optional, достижимы из `SKILL.md` и имеют конкретные load triggers.
- Runtime/commands/tests не добавлены, потому что скил остаётся документационным; внешний `money` runtime не упакован и не заявлен как capability скила.

### Structural и portability

- `skill-source-compiler lint`: PASS.
- `skill-source-compiler regenerate`: PASS.
- Source `check`: PASS.
- Out-of-place `compile` и packaged `check`: PASS.
- Source/package active files: byte-identical.
- Stable active SHA-256: `2381e3528409e97530dc1d8e49d8a4464869d16a05a569c3134ae46606c20d34`.
- Reviewed candidate all-files SHA-256: `708723b6b774645be761a6c3c97c8a74a9f8e40768939c44b91d6a207ff018c9`.
- Description: 293 Unicode code points.
- Active absolute-path scan: empty.
- Stale unsafe-guidance scan: empty.
- `git diff --check`: PASS.

### Read-only `packages/money`

Final evidence на неизменённом external snapshot:

- type-check: PASS;
- lint: PASS;
- 63 unit tests: PASS;
- browser bundle: 1/1 PASS;
- внешний revision: `af387e1056e99f49cc4c4c62e6b8e6031483cbb1`;
- `money` aggregate SHA-256: `337c1bc66fdd7e5d43ad6a79da7be66cd19dbf4ad8d3c98a60cb3ec9b886d576`;
- внешний worktree после проверок чистый и hash не изменился.

Это evidence только для текущего library/API snapshot и browser bundle.

### Blind forward-tests

Отдельный свежий executor прочитал только packaged candidate и выполнил девять риск-ориентированных случаев:

1. Принятый VAT contract дал literals `20599`, `220000`, `4532`, `25131` и не превратил арифметическую проверку в runtime claim.
2. Конфликт ticket 10% и принятой tariff-spec 22% завершился `blocked` с точным authority question.
3. Неоднозначный `amount: "1999"` отклонён; `amountCents` и `amountInput` получили разные parsers и round-trip contract.
4. SQL с zero/negative denominator и переполнением intermediate отклонён; потребованы widening и real PostgreSQL evidence.
5. Зелёный package при отсутствующих SQL/backend/persistence/app contours не закрыл cross-layer parity и остался `partial`.
6. Ledger postings без chart/mapping/recognition/lifecycle заблокированы.
7. Отсутствие shared engine и одна локальная формула не привели к speculative generic package.
8. Узкий claim library runtime ↔ real PostgreSQL принят как `verified` только для исполненной версии fixtures; остальные contours обозначены `not-applicable`.
9. Review-only запрос остался read-only и передал formal findings process скилу `code-reviewer`.

В случае 5 executor консервативно поставил browser bundle `not-run`, прочитав вход как наличие bundle, а не выполненный зелёный test. Reviewer признал это безопасным under-claim: активная reference явно разрешает считать выполненный bundle-test evidence только его собственного contour и не расширяет claim до приложения.

### Independent re-audit

`skill-reviewer` re-audit на active SHA-256 `2381e3528409e97530dc1d8e49d8a4464869d16a05a569c3134ae46606c20d34`: `PASS`.

- P1: none.
- P2: none.
- P3: none.
- Все baseline findings закрыты.
- Any active-surface change invalidates verdict; supporting-log updates требуют только bounded delta audit при неизменном active hash.

## Отклонения от плана

Собственный runtime и постоянный prompt-test harness не добавлены: они не нужны для документационного скила и создали бы лишнюю conceptual surface. Реальный PostgreSQL parity contour приложения не выполнялся; baseline reviewer запускал только read-only SQL edge probes, которые не доказывают application parity. Вместо ложной parity-заявки проверены инструкции, которые требуют реальный contour при соответствующем claim.

## Side effects

- Изменения ограничены `skills/financial-calculations-engineer`.
- Внешний application repository остаётся read-only и чистым.
- Существующие несвязанные изменения в других skill folders не затрагиваются.

## Evidence limits

- Реальная PostgreSQL/backend/application parity текущего Aequitas приложения отсутствует и не будет заявлена результатом этой работы.
- Skill behavior был проверен на prompt-level forward cases; это не универсальная гарантия для всех моделей и financial domains.
- Актуальная tax/accounting authority должна поступать из owning sources при каждом применении.

## Финальный статус

`verified` для инструкционной capability скила на зафиксированном active snapshot. Это не заявляет готовность SQL/backend/persistence/application financial capability внешнего приложения.
