# Blind forward-test evidence: durable disposition

- **Дата:** 2026-07-28
- **Issue:** `Aequitas-ADR/app#239`
- **Версия:** `requirements-approval` 0.2.2
- **Статус:** `PASS` после second P1 remediation
- **Tested rendered SKILL SHA-256:** `16f801f09a941ba6a7bb519958f62aa28f091f88547d4614e061a8bbaeed0a11`
- **Tested normalized active SHA-256:** `943e5a0d0c38c62e108434524933618d58d2ba79397c603b11e714e0c8052b82` (`skillforge-source-hash` line excluded)
- **Fixture SHA-256:** `d86afead199c7a8572f853080279b9c60da9a43ceaf3ac6c7a93e948c6435ae3`

## Boundary

Пять свежих no-fork агентов `/root/blind_stale_owner_v3`, `/root/blind_direct_v3`, `/root/blind_followup_v3`, `/root/blind_unchanged_v3` и `/root/blind_comment_v3` получили только rendered `SKILL.md`, fixture `evals/fixtures/durable-disposition-input.md` и по одному нейтральному prompt для своего question code. `skill.yaml`, `evals/evals.json`, Git diff/history, этот evidence-файл, expected answers, prior findings и rationale изменения им не передавались. Запуски были read-only.

## Cases

| Case | Observed output | Rubric | Evidence limit |
| --- | --- | --- | --- |
| `Q-DIRECT` | `answer=complete`, `workflow=verified`; `chg-7day` трассирован к obligation и меняет prior authoritative state; publication/readback/terminal state названы evidence | `PASS` | Один fixture не доказывает все owning-change варианты или runtime реализацию семидневного срока. |
| `Q-FOLLOWUP` | `answer=complete`, `workflow=verified`; перечислены все required owners/routes; `F-219` оставлен open | `PASS` | Один fixture не доказывает выполнение annual review или downstream capability. |
| `Q-STALE-OWNER` | `answer=complete`, `workflow=blocked`; product owner route принят, stale architecture handoff без follow-up блокирует closure | `PASS` | Один falsifier не покрывает все multi-owner inconsistency variants. |
| `Q-UNCHANGED` | `answer=complete`, `workflow=blocked`; pre-existing matching text отвергнут как change evidence, durable disposition отсутствует | `PASS` | Один falsifier не покрывает все формы ложного change provenance. |
| `Q-COMMENT` | `answer=complete`, `workflow=blocked`; closed issue/comment/terminal Project state отвергнуты без required-owner inventory и durable route | `PASS` | Один negative fixture не доказывает все формы incomplete disposition. |

## Anti-claims из observed outputs

- Direct route подтверждён только при obligation-traced owning change и только на decision-workflow boundary, без заявления runtime implementation/deployment.
- Pre-existing matching text не стало ретроактивной traceability и не дало closure.
- Один успешный owning change не скрыл stale второго required owner.
- Linked route не закрыл `F-219`, annual review или downstream operations/compliance capability.
- Terminal comment case не получил выдуманный owner, follow-up, trigger, acceptance или external mutation.

## Verdict

Пять из пяти second-P1 cases: `PASS`. `Q-STALE-OWNER` блокирует closure при одном успешном route и одном stale required owner; direct/linked positives и unchanged/comment negatives сохраняют ожидаемые границы. Forward-tests являются samples и не заменяют independent audits или будущую effectiveness-проверку `RETRO-STEP-21`.
