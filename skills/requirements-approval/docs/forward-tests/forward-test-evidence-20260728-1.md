# Blind forward-test evidence: durable disposition

- **Дата:** 2026-07-28
- **Issue:** `Aequitas-ADR/app#239`
- **Версия:** `requirements-approval` 0.2.2
- **Статус:** `PASS` после P1 remediation
- **Tested rendered SKILL SHA-256:** `0dc86f68d602aecb56eb71daa3a0b9a6a685cc08355608aa79cb811cb459f189`
- **Tested normalized active SHA-256:** `07f5c58c508df0c45d53658805b804ec80f0b3b42435b78037801420fbf87a1a` (`skillforge-source-hash` line excluded)
- **Fixture SHA-256:** `bb8cef39d2f451f6681e332503465564fc5a94a36010d51fd74eeea3527c648b`

## Boundary

Четыре свежих no-fork агента `/root/blind_direct_v2`, `/root/blind_unchanged_v2`, `/root/blind_followup_v2` и `/root/blind_comment_v2` получили только rendered `SKILL.md`, fixture `evals/fixtures/durable-disposition-input.md` и по одному нейтральному prompt для своего question code. `skill.yaml`, `evals/evals.json`, Git diff/history, этот evidence-файл, expected answers, prior findings и rationale изменения им не передавались. Запуски были read-only.

## Cases

| Case | Observed output | Rubric | Evidence limit |
| --- | --- | --- | --- |
| `Q-DIRECT` | `answer=complete`, `workflow=verified`; `chg-7day` трассирован к obligation и меняет prior authoritative state; publication/readback/terminal state названы evidence | `PASS` | Один fixture не доказывает все owning-change варианты или runtime реализацию семидневного срока. |
| `Q-UNCHANGED` | `answer=complete`, `workflow=partial`; pre-existing matching text отвергнут как change evidence, durable disposition отсутствует | `PASS` | Один falsifier не покрывает все формы ложного change provenance. |
| `Q-FOLLOWUP` | `answer=complete`, `workflow=verified`; перечислены exact obligation, owner, owning increment, trigger, acceptance evidence, evidence-return и reciprocal link; `F-219` оставлен open | `PASS` | Один fixture не доказывает выполнение annual review или downstream capability. |
| `Q-COMMENT` | `answer=complete`, `workflow=partial`; closed issue/comment/terminal Project state отвергнуты без owning change или linked follow-up | `PASS` | Один negative fixture не доказывает все формы incomplete disposition. |

## Anti-claims из observed outputs

- Direct route подтверждён только при obligation-traced owning change и только на decision-workflow boundary, без заявления runtime implementation/deployment.
- Pre-existing matching text не стало ретроактивной traceability и не дало closure.
- Linked route не закрыл `F-219`, annual review или downstream operations/compliance capability.
- Terminal comment case не получил выдуманный owner, follow-up, trigger, acceptance или external mutation.

## Verdict

Четыре из четырёх P1-remediation cases: `PASS`. Positive direct и adversarial unchanged cases различили owning change и pre-existing text; linked/comment regressions сохранили narrow closure boundary. Forward-tests являются samples и не заменяют independent skill re-audit или будущую effectiveness-проверку `RETRO-STEP-21`.
