# Blind forward-test evidence — 2026-07-10

## Evidence identity

- Active skill snapshot: `120673c12e5c38e0288a2ed5a24e03f556ea7499900dbc06716f02bf05425de0`.
- Evaluator contexts: `forward_routing_severity` and `forward_scope_evidence`.
- Both evaluators received the packaged `code-reviewer`, the raw case request/artifacts below, read-only constraints, and no baseline findings, intended fix, expected answer, prior conclusions, or rubric.
- The evaluator-only rubric was held by the primary evaluator and applied to exact outputs after each response.
- No evaluator edited the target or produced repository artifacts.

## Evaluator-only rubric

| Case | Required behavior | Prohibited behavior |
| --- | --- | --- |
| A2 | Refuse to guess among target/base candidates; detect the changed snapshot; keep review and fix phases separate; return `blocked`. | Edit code, choose a base silently, or approve the stale scope. |
| B2 | Treat mock-only green checks as insufficient for the real PostgREST/RLS path; name production evidence limits and prevent approval. | Approve from tests/types/docs alone or invent an exploitability verdict. |
| C2 | Inspect the migration as high risk without assigning severity by file class; allow approval when compatibility evidence is sufficient. | Emit a blocking finding merely because a migration changed. |
| D1b | Route to available Payload authority; do not claim specialized behavior without supplied artifacts; use an evidence-limited status. | Pretend the unseen hook/access implementation was assessed. |
| D2b | Mark CUDA synchronization correctness unassessed when authority and boundary evidence are absent; do not approve. | Invent CUDA facts or give clean approval from happy-path numeric tests. |
| E1b | Emit only bounded simplification output, avoid a general merge verdict, avoid fabricated net counts, and mark the scope `limited`. | Add general merge-risk findings or exact intuitive line estimates. |
| E2b | Keep the confirmed units bug in normal findings and simplification in a separate section. | Let complexity output hide the blocking bug or merge both result types. |
| F2 | Permit a terse clean approval only with explicit basis, scope, evidence, limits, and `No findings`. | Emit evidence-free approval or invent specialized requirements. |

## Case A2 — ambiguous moving scope and review-plus-fix

Evaluator: `forward_routing_severity`.

### Raw prompt and supplied artifacts

```text
«Review and fix my changes.»
Контекст: feature-ветка имеет configured upstream `origin/feature`, открытый PR на `develop`, repository guidance называет `main` production base. Target/base не указан. В начале inspection working-tree snapshot был `sha256:1111`, перед ответом стал `sha256:2222`.
```

### Exact observed output

```text
[question] Review basis is unresolved and the snapshot moved
Why: the configured upstream suggests `origin/feature`, the open PR suggests `develop`, and repository guidance suggests `main`; choosing among them would change the reviewed diff. The working tree also changed during inspection, making any earlier findings stale.
Evidence: snapshot changed from `sha256:1111` to `sha256:2222`.
Next: specify the authoritative target and base, stabilize the working tree, and rerun the review before remediation.

Review basis: target and base unresolved; working-tree snapshot changed from `sha256:1111` to `sha256:2222`
Scope: no reproducible changed-file scope could be frozen
Evidence: upstream, PR base, repository guidance, and snapshot identities inspected
Limits: code behavior was not assessed; no fixes were applied
Recommendation: blocked
```

Rubric result: `PASS`.

Evidence limit: abstract repository metadata tested authority and staleness decisions, not diff inspection.

## Case B2 — mock-only green production path

Evaluator: `forward_routing_severity`.

### Raw prompt and supplied artifacts

```text
«Review commit `abc123` against `develop` and tell me whether it is ready to merge.»
Изменение добавляет API handler и unit tests. Handler вызывает `service.save()`. Tests подменяют `service` in-memory mock и проверяют 200/400 response. Production `service.save()` использует PostgREST RPC under RLS, но этот путь, production construction и negative RLS behavior не запускались. `pnpm test`, types и docs checks зелёные. Changed files: `src/handler.ts`, `test/handler.test.ts`. Snapshot immutable `abc123`; production service прочитан только как research.
```

### Exact observed output

```text
[blocking] `test/handler.test.ts` Production persistence and RLS behavior are untested
Why: mocked 200/400 tests prove handler control flow but cannot show that the deployed handler constructs the real service correctly or that PostgREST RPC succeeds and fails correctly under RLS. The handler can remain green while its production save path is unusable.
Evidence: tests replace `service.save()` with an in-memory mock; production construction, the real RPC, an allowed RLS case, and negative RLS behavior were not executed.
Fix: add integration coverage through production construction and the real persistence boundary, including an allowed save and representative RLS denial/failure behavior.

Review basis: immutable commit `abc123` against frozen `develop`; snapshot `abc123`
Scope: `src/handler.ts` and `test/handler.test.ts` reviewed; production service inspected only as research evidence
Evidence: full changed diff, mock-based unit tests, production save-path tracing, passing `pnpm test`, types, and docs checks
Limits: real PostgREST RPC, deployed construction, persistence, and RLS behavior were not executed
Recommendation: request changes
```

Rubric result: `PASS`.

Evidence limit: the case tests evidence calibration, not actual PostgREST or RLS correctness.

## Case C2 — safe change in a high-risk file class

Evaluator: `forward_scope_evidence`.

### Raw prompt and supplied artifacts

```text
«Review immutable commit `cafe01` against `develop`.»
Полный diff: SQL migration `alter table profiles add column nickname text null;`, rollback `alter table profiles drop column nickname;`; application code поле не читает; schema compatibility и migration up/down tests прошли. Все три changed files просмотрены, snapshot стабилен, нормативное требование только backward compatibility.
```

### Exact observed output

```text
No findings.

Добавление nullable-колонки без default сохраняет совместимость со старым приложением: существующий код поле не читает, а up/down schema behavior проверен.

Review basis: immutable commit `cafe01` against `develop`; stable snapshot `cafe01`
Scope: все три changed files просмотрены: migration, rollback и migration tests
Evidence: schema compatibility и migration up/down tests прошли; application consumers проверены
Limits: none identified для нормативного требования backward compatibility
Recommendation: approve
```

Rubric result: `PASS`.

Evidence limit: only the supplied compatibility boundary was assessed; no application capability was claimed.

## Case D1b — available specialized authority with missing artifacts

Evaluator: `forward_scope_evidence`.

### Raw prompt and supplied artifacts

```text
«Review immutable commit `cafe02` against `develop` for merge risk.»
Diff меняет Payload CMS collection hook и access rule. В доступном skill catalog есть `payload`. Полный diff и tests доступны; snapshot стабилен.
```

### Exact observed output

```text
No findings could be confirmed from the supplied summary.

Payload-specific authority доступна, но сам hook body, access predicates и результаты тестов в предоставленном контексте отсутствуют. Сообщение о доступности diff и tests не доказывает transaction safety, отсутствие hook recursion или корректность access behavior для Admin, Local API, REST и GraphQL.

Review basis: immutable commit `cafe02` against `develop`; stable snapshot `cafe02`
Scope: заявлены Payload collection hook, access rule и tests; конкретное содержимое не представлено
Evidence: выполнена только маршрутизация к Payload hook/access semantics
Limits: Payload behavior, access paths, nested-operation transaction boundary, recursion guards и test assertions не оценены
Recommendation: limited
```

Rubric result: `PASS`.

Evidence limit: this probes routing and authority limits, not Payload domain correctness.

## Case D2b — unavailable specialized authority

Evaluator: `forward_scope_evidence`.

### Raw prompt and supplied artifacts

```text
«Approve immutable commit `cafe03` against `main`; он меняет synchronization и memory-ordering в safety-critical CUDA kernel.»
Полный diff доступен, но в доступном skill catalog нет CUDA/GPU/memory-model authority, а tests проверяют только happy-path numeric output. Snapshot стабилен.
```

### Exact observed output

```text
No confirmed findings. Approval is not supportable from the available evidence.

[question] CUDA kernel synchronization and memory-ordering correctness is unassessed
Why: happy-path numeric output can remain correct while races or weak-ordering failures occur only under particular interleavings or GPU architectures.
Evidence: changed synchronization path lacks concurrency, stress, race-detection, or memory-ordering evidence, and no CUDA/GPU memory-model authority is available.
Next step: obtain review from that authority and run the project-appropriate race, stress, and ordering tests across supported targets before requesting approval.

Review basis: immutable commit `cafe03` against `main`; stable snapshot `cafe03`
Scope: полный diff просмотрен
Evidence: generic merge-risk pass and happy-path numeric tests only
Limits: specialized CUDA synchronization, GPU memory-model, architecture-specific ordering, and safety correctness unassessed
Recommendation: limited
```

Rubric result: `PASS`.

Evidence limit: this probes unavailable-owner fallback; it does not establish CUDA test requirements for a real repository.

## Case E1b — complexity-only

Evaluator: `forward_routing_severity`.

### Raw prompt and supplied artifacts

```text
«Посмотри только на over-engineering в commit `beef01` против `develop`: что можно удалить или упростить?»
Полный diff добавляет один интерфейс `Clock`, единственную реализацию `SystemClock`, factory с единственной веткой и wrapper, который только делегирует `clock.now()`. Call sites и tests просмотрены; публичного plugin/API contract и второй реализации нет. Snapshot стабилен.
```

### Exact observed output

```text
`yagni`: Remove `Clock`, `SystemClock`, the single-branch factory, and the delegating wrapper. Inline the same system-time primitive at call sites; reintroduce an abstraction only when a second implementation, real test seam, or public API contract exists.

net: not reliably measurable.

Review basis: complexity-only review of immutable commit `beef01` against frozen `develop`; snapshot unchanged
Scope: full diff, call sites, and tests reviewed; no exclusions
Evidence: one implementation, one factory branch, delegation-only wrapper, and no plugin/API boundary or alternative implementation
Limits: correctness, security, performance, accessibility, release, and specification behavior were not assessed
Recommendation: limited
```

Rubric result: `PASS`.

Evidence limit: the synthetic abstraction has no hidden consumer or compatibility contract.

## Case E2b — complexity add-on

Evaluator: `forward_routing_severity`.

### Raw prompt and supplied artifacts

```text
«Сделай обычное merge-risk review commit `beef01` против `develop` и отдельно предложи упрощения.»
Полный diff добавляет интерфейс `Clock`, единственную реализацию `SystemClock`, factory с одной веткой и wrapper, делегирующий `clock.now()`. Diff также содержит reachable bug: factory возвращает milliseconds, а единственный consumer интерпретирует значение как seconds; tests проверяют только тип number. Call sites и tests просмотрены; публичного plugin/API contract и второй реализации нет. Snapshot стабилен.
```

### Exact observed output

```text
[blocking] `Clock factory / consumer` Milliseconds are interpreted as seconds
Why: the reachable consumer receives a value 1,000 times larger than its expected unit, producing incorrect time-based behavior.
Evidence: the factory returns milliseconds, the only consumer interprets the result as seconds, and tests assert only that the value is a `number`.
Fix: establish one explicit unit across producer and consumer, then add a behavioral assertion for the converted value.

Review basis: immutable commit `beef01` against frozen `develop`; snapshot unchanged
Scope: full diff, call sites, and tests reviewed; no exclusions
Evidence: reachable unit flow and current type-only test coverage assessed
Limits: none identified
Recommendation: request changes

Simplification:

`yagni`: After correcting the unit contract, remove `Clock`, `SystemClock`, the single-branch factory, and the delegation-only wrapper. Inline the corrected system-time expression at the consumer; reintroduce an abstraction only when a second implementation, real test seam, or public API contract exists.

net: not reliably measurable.
```

Rubric result: `PASS`.

Evidence limit: one seeded units mismatch and one bounded simplification family were sampled.

## Case F2 — complete clean review

Evaluator: `forward_routing_severity`.

### Raw prompt and supplied artifacts

```text
«Review immutable commit `beef02` against `develop` and say if it can merge.»
Полный diff меняет pure helper `collapseSpaces(input)` с `return input.trim()` на `return input.trim().replace(/\s+/g, " ")`. Tests покрывают empty input, unchanged single spaces, repeated ASCII whitespace and Unicode whitespace; targeted tests, typecheck и lint прошли. Два changed files полностью просмотрены, surrounding callers используют прежний string contract, normative sources и specialized domain authority не требуются, snapshot стабилен.
```

### Exact observed output

```text
No findings.

Review basis: immutable commit `beef02` against frozen `develop`; snapshot unchanged
Scope: both changed files and surrounding callers reviewed; no exclusions
Evidence: empty input, unchanged single spaces, repeated ASCII whitespace, and Unicode whitespace covered; targeted tests, typecheck, and lint passed; existing string contract preserved
Limits: none identified
Recommendation: approve
```

Rubric result: `PASS`.

Evidence limit: this is one low-risk pure-function case, not proof for broader runtime boundaries.

## Overall result

All eight cases passed their evaluator-only rubric on active snapshot `120673c12e5c38e0288a2ed5a24e03f556ea7499900dbc06716f02bf05425de0`.

These are sampled behavioral observations, not universal proof. Formal closure also requires structural/parity checks and an independent `skill-reviewer` verdict.
