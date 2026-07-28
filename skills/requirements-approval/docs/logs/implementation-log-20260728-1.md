# Журнал реализации: durable disposition customer decisions

- **Log ID:** `implementation-log-20260728-1`
- **Дата:** 2026-07-28
- **Issue:** `Aequitas-ADR/app#239`
- **Версия:** `requirements-approval` 0.2.2
- **Статус:** P1 remediation verified; independent re-audit pending

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
| Independent P1: current matching text мог подменить owning change | Direct route требует change evidence, трассируемое к accepted obligation; добавлен unchanged-source falsifier | Cases 12 и 15, independent re-audit | implemented; blind verified; re-audit pending |

## Verification

### Structural и portability

- `skill-source-compiler lint/regenerate/check`: `PASS`, warnings none.
- `SKILL.md`: `14 994/15 000` bytes.
- Isolated compile/check в disposable `/tmp`: `PASS`; новый fixture и supporting artifacts присутствуют в emitted package.
- Root `pnpm format:check`, `pnpm lint`, `pnpm test:ci`: `PASS`.
- Root отдельного `type-check` script не имеет; применимый TypeScript compiler gate входит в `pnpm lint` для code-backed compiler package. Изменение `requirements-approval` является documentation-only.
- Offline frozen install использовал существующий lockfile; manifest и lockfile не изменены.

### Blind forward-tests

P1-remediation rendered snapshot `0dc86f68d602aecb56eb71daa3a0b9a6a685cc08355608aa79cb811cb459f189`, normalized active hash `07f5c58c508df0c45d53658805b804ec80f0b3b42435b78037801420fbf87a1a`, fixture `bb8cef39d2f451f6681e332503465564fc5a94a36010d51fd74eeea3527c648b`: четыре независимых no-fork cases получили `PASS`.

- `Q-DIRECT`: obligation-traced `chg-7day` дал `workflow=verified` с runtime anti-claim.
- `Q-UNCHANGED`: pre-existing matching text без decision-traced change дал `workflow=partial`.
- `Q-FOLLOWUP`: complete linked route дал `workflow=verified` только на decision boundary; `F-219` остался open.
- `Q-COMMENT`: closed issue/comment/terminal Project state дали `workflow=partial`, без выдуманного disposition.

Полное evidence: [`forward-test-evidence-20260728-1.md`](../forward-tests/forward-test-evidence-20260728-1.md).

### Independent review

Change review snapshot `f9c1c853b3a4f8eb9ca6b60c4611367f7693ef0f`: independent `FAIL`, один P1. Наличие совпадающего current source text могло ложно удовлетворить direct route без owning change, трассируемого к accepted obligation. Узкая remediation потребовала obligation-traced change evidence и добавила adversarial `Q-UNCHANGED`; affected blind verification прошла, новый stable snapshot и independent re-audit ожидаются.

## Side Effects

External customer communication и email не выполнялись. GitHub mutations ограничены статусом/evidence issue `Aequitas-ADR/app#239`; push и integration не входят в CP1.

## Итог

Текущий статус: `implemented; P1 remediation blind-verified; independent re-audit pending`.
