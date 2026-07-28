# Журнал реализации: durable disposition customer decisions

- **Log ID:** `implementation-log-20260728-1`
- **Дата:** 2026-07-28
- **Issue:** `Aequitas-ADR/app#239`
- **Версия:** `requirements-approval` 0.2.2
- **Статус:** implemented; structural и blind verification passed; independent review pending

## Capability

Skill допускает closure customer decision только когда каждое принятое обязательство имеет freshly verified durable disposition: owning artifact/code change либо полный current linked follow-up. Linked route закрывает только decision-workflow boundary и сохраняет downstream работу открытой.

## Substrate

- source-first изменение `skill.yaml` и `fragments/overview.md`;
- один portable fixture с direct, linked-follow-up и terminal-comment cases;
- три eval cases при сохранении существующих cases 1–11;
- regenerated `SKILL.md` и compile report;
- blind forward-test и independent review evidence после стабилизации snapshot.

## Anti-claims

- Terminal issue, Project state или comment не являются durable disposition.
- Полный linked follow-up не доказывает и не закрывает downstream product/runtime capability.
- Compiler, fixture и self-check не являются independent behavioral `PASS`.

## Preflight

Verdict `partial`: skill уже разделял authoritative answer и workflow closure, требовал propagation и запрещал closure по comment/commit отдельно. Реальный остаток состоял в явном alternate durable route через полный linked follow-up и в отдельном negative fixture для terminal issue без disposition.

## Решения

- Сохранены существующие workflow states `draft|partial|blocked|verified`.
- Новый dependency type, registry, runtime или direct dependency не создавались.
- Для linked route используются repository-defined follow-up fields; skill остаётся portable и требует их только когда applicable repository contract их определяет.

## Remediation matrix

| Finding/recommendation | Изменение | Evidence | Статус |
| --- | --- | --- | --- |
| `R-RULE-006`: comment может быть принят за disposition | Terminal state/comment явно исключены как самостоятельный closure route | Case 14 и independent review | implemented |
| `R-RULE-006`: отсутствует durable alternate route | Добавлены owning-change и complete-linked-follow-up routes | Cases 12–13 и independent review | implemented |
| `RETRO-STEP-12`: downstream capability может быть переоценена | Linked route ограничен decision-workflow boundary и сохраняет follow-up open | Case 13 и concept/document audit | implemented |

## Verification

### Structural и portability

- `skill-source-compiler lint/regenerate/check`: `PASS`, warnings none.
- `SKILL.md`: `14 994/15 000` bytes.
- Isolated compile/check в disposable `/tmp`: `PASS`; новый fixture и supporting artifacts присутствуют в emitted package.
- Root `pnpm format:check`, `pnpm lint`, `pnpm test:ci`: `PASS`.
- Root отдельного `type-check` script не имеет; применимый TypeScript compiler gate входит в `pnpm lint` для code-backed compiler package. Изменение `requirements-approval` является documentation-only.
- Offline frozen install использовал существующий lockfile; manifest и lockfile не изменены.

### Blind forward-tests

Rendered snapshot `e8a648ee659c1968e2abd4b9501890d837f7d3dcf29f582c470c5017d6c5baab`, fixture `6b13505ba3e6e5370db85f97673cbe898eb53c31a9bce5d84b824385e05bafeb`: три независимых no-fork cases получили `PASS`.

- `Q-DIRECT`: direct owning-source route дал `workflow=verified` с runtime anti-claim.
- `Q-FOLLOWUP`: complete linked route дал `workflow=verified` только на decision boundary; `F-219` остался open.
- `Q-COMMENT`: closed issue/comment/terminal Project state дали `workflow=partial`, без выдуманного disposition.

Полное evidence: [`forward-test-evidence-20260728-1.md`](../forward-tests/forward-test-evidence-20260728-1.md).

### Independent review

Ожидает stable commit. До independent `skill-reviewer PASS` общий skill verdict не заявляется.

## Side Effects

External customer communication и email не выполнялись. GitHub mutations ограничены статусом/evidence issue `Aequitas-ADR/app#239`; push и integration не входят в CP1.

## Итог

Текущий статус: `implemented; structural and blind verified; independent review pending`.
