# Журнал реализации: SQLSTATE и transaction-retry safety

## Language

Russian.

## Log ID

`implementation-log-20260717-1`

## Related Issue

[`Aequitas-ADR/app#207`](https://github.com/Aequitas-ADR/app/issues/207) — `SPEC-0028/H01 — Обновить shared supabase-engineer skill по SQLSTATE safety`.

## Related Plan

План согласован в сессии оператора; отдельный persistent plan artifact не создавался.

## Operator Request

Обновить shared `supabase-engineer`, чтобы agent не маскировал доменные outcomes под PostgreSQL transaction rollback, отличал application recovery от retry всей транзакции и проверял effective function behavior вместо одного migration-файла.

## Summary

Active guidance уточняет классификацию manual class-40 SQLSTATE, сохранение настоящих database-generated `40001`/`40P01`, границу automatic transaction retry и review цепочек `CREATE OR REPLACE`.

Capability: будущий Supabase migration/function review не предлагает manual `40xxx` для domain taxonomy и не объединяет domain recovery с transaction retry.

Substrate: две active references, regenerated skill package и verification evidence.

Anti-claims: изменение не исправляет deployed functions, Aequitas runtime или historical SQLSTATE mismatches и не создаёт runtime retry framework.

## Changes Made

- `references/db-functions.md`: manual class-40 prohibition, project-owned application taxonomy, bare rethrow boundary и effective-definition review.
- `references/operations-reliability.md`: outer whole-transaction retry contract, replay-safety gates и separation from application recovery.
- `skill.yaml`: content version `0.1.5` и supporting-log declaration.
- Generated `SKILL.md` и compile report обновляются только через `skill-source-compiler`.

## Decisions

- SQLSTATE classification остаётся канонической в `db-functions.md`; reliability reference применяет её перед retry, не копируя полную taxonomy.
- Active guidance остаётся на английском, а supporting log — на языке оператора.
- Не добавляются scripts, runtime, dependencies, CI guard или permanent test harness: они не нужны для текущей documentation-skill capability.

## Verification Performed

- `skill-source-compiler lint`, `regenerate` и `check` — PASS.
- `quick_validate.py` — PASS.
- Out-of-place compile и packaged `check` — PASS.
- Source/package parity для обеих изменённых references — PASS.
- Portable-path scan активной package surface — PASS.
- `git diff --check` — PASS.
- `pnpm format:check` и `pnpm lint` — PASS.
- `pnpm test` — PASS: 18 Hono, 18 TypeScript-test, 22 security-reviewer и 44 skill-source-compiler tests.
- Author instruction-quality self-check — `PROVISIONAL`: outcome, authority, SQLSTATE classification, retry boundary, validation, fallback, stop rules, progressive disclosure и anti-claims согласованы; это не independent verdict.

### Skill Review Evidence

Blind forward-tests использовали out-of-place packaged skill с generated source hash `720ddd708112f629cec72b5d82f44f00c869ab88962ccec186349d204e84b154`. Evaluators получили только package и neutral task inputs; issue, expected diagnosis, intended fix и rubric не передавались. Таблица ниже является author evidence: raw evaluator transcripts не включены в package. Independent reviewer подтвердил эти summaries через direct instruction tracing и PostgreSQL domain readback.

| Case | Observed result | Rubric | Evidence limit |
| --- | --- | --- | --- |
| Manual `40001` optimistic conflict | Отклонён как false transaction-retry signal; предложена project-owned non-`40xxx` taxonomy и explicit refresh/reconcile flow. | PASS | Static task review; нет deployed RPC. |
| `ERRCODE = '40P01'` и named `deadlock_detected` | Оба варианта распознаны как manual misclassification domain/precondition outcomes; automatic retry запрещён. | PASS | Нет runtime caller readback. |
| Bare `RAISE;` | Исходный database-generated SQLSTATE сохранён; изменение кода не рекомендовано без evidence. | PASS | Не доказаны deployed caller envelope и durable logging. |
| Transaction retry против same-key recovery | Generic helper отклонён; genuine `40001`/`40P01` отделены от domain conflicts, whole-transaction boundary и replay-safety названы обязательными. | PASS | Transaction ownership и idempotency contract намеренно отсутствовали. |
| `CREATE OR REPLACE` chain | Вывод по migration 001 отклонён; effective private/public definitions и call boundary восстановлены из 014/021, потребованы clean replay и `pg_get_functiondef(...)`. | PASS | Нет deployed definition readback. |

Independent change review:

- Base revision: `67834580900bbef986d720f6c8e1aba920c77907`.
- Full-skill aggregate: `0054ddcc4eb4cfa1de56864c7153f062fe0518e14bbf1df4d139cd11d0492804`.
- Active/source aggregate: `b73604f44165afed2b3d1f0924c756ce2bdc15fb5bf76308db7715f657ae44c2`.
- Generated source hash: `720ddd708112f629cec72b5d82f44f00c869ab88962ccec186349d204e84b154`.
- Mode / assurance: `change` / `independent`.
- Findings: no P1, P2 or P3.
- Verdict: `PASS`.
- Evidence limit: no live transaction, deployed RPC, caller envelope or Supabase project was tested; the verdict applies to the documentation-guidance capability.

### Requirement Closure Matrix

| Requirement | Concrete change | Evidence | Status |
| --- | --- | --- | --- |
| Reject manual class-40 domain outcomes | Added SQLSTATE/ERRCODE/named-condition prohibition and project-owned non-`40xxx` taxonomy. | Cases 1–2; independent instruction and PostgreSQL domain readback. | verified |
| Preserve genuine database errors | Added bare `RAISE;` and genuine `40001`/`40P01` boundary. | Case 3; independent domain readback. | verified |
| Separate transaction retry from recovery | Added outer whole-transaction, replay-safety, bounded-budget rules and same-key recovery separation. | Case 4; independent review. | verified |
| Review effective definitions | Added `CREATE OR REPLACE` lineage, call-chain, clean-replay and `pg_get_functiondef(...)` guidance. | Case 5; independent review. | verified |
| Avoid speculative infrastructure | Added concrete-failure-mode and idempotency-contract gate for helpers/wrappers/registries/instrumentation. | Case 4; independent review. | verified |

## Deviations From Plan

None at implementation start.

## Side Effects

Изменяется только local documentation skill package. Application runtime, Supabase projects, cloud data и GitHub state не изменяются.

## Follow-up

Push, PR, issue comment, Project status и закрытие #207 не входят в разрешённый delivery boundary этой реализации.

## Final Status

LOCAL PASS — author checks, five blind forward-tests and independent change review passed. Push, PR and GitHub issue closure remain outside the authorized delivery boundary.
