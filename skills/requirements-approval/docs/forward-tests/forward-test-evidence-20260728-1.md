# Blind forward-test evidence: durable disposition

- **Дата:** 2026-07-28
- **Issue:** `Aequitas-ADR/app#239`
- **Версия:** `requirements-approval` 0.2.2
- **Статус:** `PASS`
- **Rendered SKILL SHA-256:** `e8a648ee659c1968e2abd4b9501890d837f7d3dcf29f582c470c5017d6c5baab`
- **Fixture SHA-256:** `6b13505ba3e6e5370db85f97673cbe898eb53c31a9bce5d84b824385e05bafeb`

## Boundary

Три свежих no-fork агента `/root/blind_direct`, `/root/blind_followup` и `/root/blind_comment` получили только rendered `SKILL.md`, fixture `evals/fixtures/durable-disposition-input.md` и по одному нейтральному prompt для `Q-DIRECT`, `Q-FOLLOWUP`, `Q-COMMENT`. `skill.yaml`, `evals/evals.json`, Git diff/history, этот evidence-файл, expected answers и rationale изменения им не передавались. Запуски были read-only.

## Cases

| Case | Observed output | Rubric | Evidence limit |
| --- | --- | --- | --- |
| `Q-DIRECT` | `answer=complete`, `workflow=verified`; canonical specification, published ref, fresh readback и terminal state названы evidence | `PASS` | Один fixture не доказывает все owning-source варианты или runtime реализацию семидневного срока. |
| `Q-FOLLOWUP` | `answer=complete`, `workflow=verified`; перечислены exact obligation, owner, owning increment, trigger, acceptance evidence, evidence-return и reciprocal link; `F-219` оставлен open | `PASS` | Один fixture не доказывает выполнение annual review или downstream capability. |
| `Q-COMMENT` | `answer=complete`, `workflow=partial`; closed issue/comment/terminal Project state отвергнуты без owning change или linked follow-up | `PASS` | Один negative fixture не доказывает все формы incomplete disposition. |

## Anti-claims из observed outputs

- Direct route подтверждён только на decision-workflow boundary, без заявления runtime implementation/deployment.
- Linked route не закрыл `F-219`, annual review или downstream operations/compliance capability.
- Terminal comment case не получил выдуманный owner, follow-up, trigger, acceptance или external mutation.

## Verdict

Три из трёх cases: `PASS`. Evidence подтверждает различение двух durable routes и substrate-only terminal state на этом rendered snapshot. Forward-tests являются samples и не заменяют independent skill review или будущую effectiveness-проверку `RETRO-STEP-21`.
