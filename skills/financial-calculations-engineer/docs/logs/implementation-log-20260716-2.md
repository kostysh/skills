# Журнал реализации: расширяемый currency contract

## Идентификатор

`implementation-log-20260716-2`

## Связанные issue и plan

Отдельные issue и plan не создавались; работа выполняется по утверждённому запросу оператора в текущем Codex thread.

## Запрос оператора

Актуализировать `financial-calculations-engineer` под публичный contract `money`: сохранить EUR facade как default, направлять авторитетные non-EUR code/scale через immutable currency engine, сохранять currency/scale на boundaries, запрещать relabel, mixed arithmetic и выдуманный FX, а parity подтверждать только исполнением реальных contours.

## Результат

Instruction capability расширена с EUR-only на EUR-first deterministic monetary arithmetic. Изменение не добавляет валюты, FX, ISO registry, persistence schema, SQL parity или tax/accounting authority в приложение.

## Авторитетные snapshots

- Skill baseline revision: `05418b9c1f3a3f3a66ee8e43b192b696429be6f2`.
- Baseline folder SHA-256: `60fe525e1f89ac615f68e515dc9c4de8d20a801b4733c0f2aec57ff720f0e66d` (`find . -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum`).
- Read-only implementation commit: `245a7a4422ba35b95d1a4e5760f31e7295b33893`.
- Read-only `packages/money` subtree: `3d293e6f5c468390f66b8c1690b4d8a26df8c5c8`.

## Изменения

- `skill.yaml`: source-version `0.3.0`, activation, authority/readiness, API-profile, stop, safety и evidence rules.
- `fragments/overview.md`: EUR-first capability, integer minor units, code/scale и anti-claims.
- `references/*`: facade/engine API split, strict DTOs, browser/server/persistence/SQL boundaries, safety и parity risks.
- `agents/openai.yaml`: UI trigger синхронизирован с EUR-first и explicit currency/scale.
- `SKILL.md` и `docs/compile-report.md`: регенерированы compiler-ом, не редактировались вручную.

## Remediation matrix

| Расхождение | Изменение | Evidence | Статус |
| --- | --- | --- | --- |
| EUR-only activation | Description, `whenToUse`, overview и UI охватывают non-EUR financial tasks, сохраняя EUR default | Parsed source/generated/UI; FT-01/02/09 | verified |
| Code/scale authority | Non-EUR требует авторитетные code и `minorUnitDigits`; `[A-Z]{3}`/`0..20` явно только structural | Root/reference readback; FT-03/04 | verified |
| Два API-профиля | EUR facade и generic `createCurrencyEngine`/`CurrencyAmount`/engine methods описаны раздельно | Authority exports/tests; FT-01/02/09 | verified |
| Formatter/relabel semantics | `FormatOptions` ограничен locale; currency берётся из facade/engine; relabel запрещён | Authority source/tests; FT-05 | verified |
| Registry/FX overclaim | Factory определён как local constructor без discovery, ISO catalog или FX | Authority source/docs; FT-07 | verified |
| Boundary DTO/parser | Зафиксированы EUR и generic DTO shapes, public strict parser/serializer и запрет `BigInt(untrustedString)` | DTO references/source/tests; FT-01/02/09 | verified |
| Currency/scale continuity | Browser/server/persistence contracts сохраняют code/scale; mixed currency/scale fail closed | Engine guards/tests; FT-06 | verified |
| Canonical cents overgeneralization | Универсальная единица заменена на integer minor units; cents оставлены EUR specialization | Source/generated/reference inspection | verified |
| Safety contract | Full signed int64, widened `roundDiv` numerator/result guard, unconditional DTO range, weighted zero-total preconditions | Authority source и 62 selected tests reviewer-а | verified |
| Global/per-engine state | Process-global locale/math/compatibility/resources отделены от immutable engine definition | Source/generated/authority inspection | verified |
| Parity risks | Matrix содержит wrong DTO discriminants/scale, mixed currency/scale, relabel и unsupported FX | Packaged matrix; FT-05/06/07/09 | verified |
| Substrate-only closure | Package/browser-bundle evidence не закрывает application, persistence или SQL contours | Evidence references; FT-08 | verified |
| Version/generated/UI parity | Source-version повышена; source, generated output и UI source синхронизированы | Lint/check, isolated compile, exact manifests | verified |

## Выполненная проверка

### Author self-check

Статус: `ready-to-regenerate`. Outcome, authority, inputs, decisions, stop/fallback, output/evidence и anti-claims проверены; равноправных semantic conflicts не найдено. Это self-check, не независимый `PASS`.

### Structural evidence

- `skill-source-compiler lint`: PASS.
- `skill-source-compiler regenerate`: PASS без warnings; generated `SKILL.md` — 19 982 bytes, 230 lines.
- Source `check` и packaged `check`: PASS.
- Isolated compile byte-identical для active/generated/UI/supporting files.
- Parsed description: 296 Unicode code points.
- Reviewed active manifest: 8 files, SHA-256 `5c5c5b0df4c98034d7ad4773c59bae1d95d6f63cc8256a1580e1f05c91fbd946`.
- Reviewed all-files manifest: 13 files, SHA-256 `5548a25fb00cfb01dd2986b2af7ea9b3edcead3ee97c7d451e5e07506f7bfd00`.
- Active absolute-path и stale-guidance scans: empty.
- `git diff --check`: PASS.

### Blind forward-tests

Свежий evaluator получил packaged candidate и девять raw cases без expected outcomes или remediation notes. FT-01..FT-09 завершились `PASS`: EUR facade, BHD/JPY generic engines, missing/conflicting scale stops, relabel/mixed rejection, unsupported FX и package-only evidence boundary.

- Raw prompts SHA-256: `77d39ebbedd6059adcc746a65cf4d77c07524db0db56149d2b4ca1aaed366f32`.
- Observed report SHA-256: `567636ea5076e6242796c771ee064c3ea1a02d071702c5701bd1684d7f8ccfc7`.

### Independent review

`skill-reviewer` change review на stable active snapshot: `PASS`.

- P1: 0; P2: 0; P3: 0.
- Review report SHA-256: `ea085252ebb8364b91b31245deb84f02b7dd7017ed7f74db2517621d0b0bb93d`.
- Reviewer подтвердил все строки remediation matrix, exact authority contract, portability, source/generated/package parity и ограничения evidence.
- Any active-surface change invalidates verdict; этот log остаётся supporting/non-normative.

## Решения

- Не добавлялись runtime, registry, FX abstraction или постоянный prompt-test harness: они не нужны для текущей documentation-only capability.
- Реальный application/SQL contour не исполнялся и не будет заявлен результатом package checks.

## Отклонения от плана

Нет. Root guidance была сокращена после compiler size warning; подробные API/safety правила сохранены в active references.

## Side effects

Изменения ограничены `skills/financial-calculations-engineer`. Read-only `packages/money` и приложение не изменялись.

## Follow-up

Application/SQL/FX/tax/accounting capabilities требуют отдельной реализации, authority и evidence на соответствующих real contours; они не являются follow-up текущего skill-only scope.

## Финальный статус

`INDEPENDENT PASS` для instruction capability на active snapshot `5c5c5b0d…`; это не application, persistence, SQL или FX capability.
