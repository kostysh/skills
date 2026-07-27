# Blind forward-test evidence: pre-customer falsifiers

Дата: 2026-07-27

Issue: Aequitas-ADR/app#225

Версия: `requirements-approval` 0.2.1

## Blind boundary

Свежий no-fork агент `/root/blind_requirements_falsifiers` получил только:

- `SKILL.md`;
- `evals/fixtures/triage-falsifiers-input.md`;
- существующий `evals/fixtures/prepare-input.md`;
- пять независимых prompts для `Q-RUNTIME`, `Q-ENV`, `Q-TODO`, `Q-TECH` и regression.

Агенту были запрещены `skill.yaml`, `evals/evals.json`, docs, Git diff/history и любые другие файлы. Запуск был read-only.

## Observed separate cases

| Case | Classification | Customer escalation | Evidence / route |
| --- | --- | --- | --- |
| `Q-RUNTIME` | `resolved internally` | no | current integration test and deployed route contract |
| `Q-ENV` | `resolved internally` | no | mandatory seven-day environment contract; future provider/environment change named separately |
| `Q-TODO` | `customer input required`, already owned | no duplicate | reuse current `TODO-42`; preference was not falsely called internally resolved |
| `Q-TECH` | `partial`, internal owner route | no | architecture owner after volume and retention evidence; agent did not select storage |

## Existing-fixture regression

- `Q-CSV`: `resolved internally` from canonical `PRD-7/R-22`; no customer task.
- `Q-DAY`: `customer input required`; one draft-only request in Italian.
- `Q-STORE`: routed to architecture owner; no customer escalation and no technology choice invented.
- External writes: none; proposed and executed actions remained separate.

## Verdict and limits

Five blind cases: `PASS`.

Capability evidence: all four pre-customer falsifiers produced the intended non-duplicate/no-escalation route, while the real unresolved customer preference remained escalatable and the existing resolved fixture stayed green.

Anti-claim: fixture results do not prove future real-world effectiveness or external workflow closure.
