# Blind forward-test evidence: source reconciliation

Дата: 2026-07-27

Issue: Aequitas-ADR/app#225

Версия: `prd-engineer` 0.1.7

## Blind boundary

Свежий no-fork агент `/root/blind_prd_reconciliation` получил только:

- `SKILL.md`;
- `evals/fixtures/source-bundle-input.md`;
- prompt: `Review the supplied draft PRD against the complete source bundle and assess whether it is ready for delivery planning.`

Агенту были запрещены `skill.yaml`, `evals/evals.json`, docs, Git diff/history и любые другие файлы. Запуск был read-only.

## Observed result

Агент вернул `Authority: non-authoritative` и `Handoff: blocked for delivery-planning`.

Он независимо обнаружил:

- потерянное scheduled-maintenance exception и operator-specific trigger из `Contract §4.2`;
- искажённое condition `report contains personal data` из `T3-R1`;
- потерянные retry control и failure reason из `T3-R2`;
- отсутствующее решение `D-17`: automatic retry out of scope, retry operator-initiated;
- отсутствующие visibility и adjacency obligations из `M-8`.

Summary и generic `recovery action` не были приняты как disposition или достаточная acceptance. Агент потребовал source-traceable correction и повторное одобрение новой версии до delivery-planning.

## Verdict and limits

Blind case: `PASS`.

Capability evidence: mixed-format omissions найдены, qualifying details сохранены, false-ready handoff заблокирован.

Anti-claim: один fixture не доказывает эффективность на следующих реальных source audits; longitudinal effectiveness принадлежит отдельному downstream validation.
