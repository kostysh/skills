# Документация `implementation-discipline`

Эта папка содержит supporting и historical surface. Активные инструкции остаются в `SKILL.md` и явно подключенных `references/*`.

## Issues

| Issue | Status | Notes |
| --- | --- | --- |
| [issues/issue-20260429-1.md](issues/issue-20260429-1.md) | Audited PASS | Portable repeated-validation heuristic for adjacent observable cases. |
| [issues/issue-20260810-1.md](issues/issue-20260810-1.md) | Audited PASS; execution authorized | Source-authorized visible-defect-first и containment scope для T02. |

## Implementation Plans

| Plan | Related issue | Status |
| --- | --- | --- |
| [issues/implementation-plan-20260429-1.md](issues/implementation-plan-20260429-1.md) | [issues/issue-20260429-1.md](issues/issue-20260429-1.md) | Audited PASS |
| [issues/implementation-plan-20260810-1.md](issues/implementation-plan-20260810-1.md) | [issues/issue-20260810-1.md](issues/issue-20260810-1.md) | Audited PASS; `PR-before-integration`; execution authorized |

## Logs

- [logs/implementation-log-20260429-1.md](logs/implementation-log-20260429-1.md) - portable repeated-validation heuristic for adjacent observable cases.
- [logs/implementation-log-20260810-1.md](logs/implementation-log-20260810-1.md) - T02 source-premise review, minimal remediation, gates и independent change PASS.
- [logs/forward-test-evidence-20260810-1.md](logs/forward-test-evidence-20260810-1.md) - T02 baseline history и raw candidate A1/A2/B/C/D/E evidence.
- [logs/implementation-log-20260602-1.md](logs/implementation-log-20260602-1.md) - project-purpose alignment for non-trivial local implementation work.
- [logs/implementation-log-20260612-1.md](logs/implementation-log-20260612-1.md) - remediation matrix statuses and substrate-versus-runtime-capability evidence.
- [logs/implementation-log-20260622-1.md](logs/implementation-log-20260622-1.md) - first sufficient rung, shortcut trigger, and minimum-check guidance.
- [logs/implementation-log-20260708-1.md](logs/implementation-log-20260708-1.md) - stable-evidence and operator-not-QA remediation traceability.
- [logs/implementation-log-20260710-1.md](logs/implementation-log-20260710-1.md) - review-only mutation boundary and remediation status-to-claim contract.
- [logs/implementation-log-20260716-1.md](logs/implementation-log-20260716-1.md) - simplicity-first core, complexity exception gate, conditional references, and behavioral evidence.
- [logs/implementation-log-20260717-1.md](logs/implementation-log-20260717-1.md) - source-authorized scope and simplicity discipline for implementation and authoring skills.
- [logs/implementation-log-20260817-1.md](logs/implementation-log-20260817-1.md) - author-owned semantic source derivation and bounded remediation inside an already-authorized CI contour.
- [logs/implementation-log-20260818-1.md](logs/implementation-log-20260818-1.md) - customer-coordinated product authority, scope comparison и plain-language reporting; independent PASS.
- [logs/implementation-log-20260820-1.md](logs/implementation-log-20260820-1.md) - producer-to-reload verification и exact red/green witness для material cross-layer defects.

## Scope of This Folder

- `docs/issues/*` contains proposals, bug reports, investigations, and implementation plans.
- `docs/logs/*` contains non-normative implementation logs.
- `docs/compile-report.md` is generated and non-normative.
