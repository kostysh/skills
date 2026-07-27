# Документация `typescript-test-engineer`

Эта папка содержит supporting и historical surface. Активные инструкции остаются в `SKILL.md` и явно подключенных `references/*`.

## Issues

| Issue | Status | Notes |
| --- | --- | --- |
| [issues/issue-20260425-1.md](issues/issue-20260425-1.md) | Implemented | Negative matrix для side-effecting/state-changing workflows и contract tests для fixtures/test doubles. |

## Implementation Plans

| Plan | Related issue | Status |
| --- | --- | --- |
| [issues/implementation-plan-20260425-1.md](issues/implementation-plan-20260425-1.md) | [issues/issue-20260425-1.md](issues/issue-20260425-1.md) | Implemented |

## Implementation Logs

| Log | Related issue | Status |
| --- | --- | --- |
| [logs/implementation-log-20260425-1.md](logs/implementation-log-20260425-1.md) | [issues/issue-20260425-1.md](issues/issue-20260425-1.md) | PASS |
| [logs/implementation-log-20260429-1.md](logs/implementation-log-20260429-1.md) | None | PASS |
| [logs/implementation-log-20260601-1.md](logs/implementation-log-20260601-1.md) | None | PASS |
| [logs/implementation-log-20260611-1.md](logs/implementation-log-20260611-1.md) | Direct operator request | PASS |
| [logs/implementation-log-20260622-1.md](logs/implementation-log-20260622-1.md) | Direct operator request | PASS |
| [logs/implementation-log-20260708-1.md](logs/implementation-log-20260708-1.md) | Direct operator request | PASS |
| [logs/implementation-log-20260710-1.md](logs/implementation-log-20260710-1.md) | Direct operator request | PASS |
| [logs/implementation-log-20260727-1.md](logs/implementation-log-20260727-1.md) | `Aequitas-ADR/app#228` | На ревью |

## Forward Tests

| Evidence | Snapshot | Status |
| --- | --- | --- |
| [logs/forward-tests-20260710.md](logs/forward-tests-20260710.md) | `f601c74a...0ec35df` | 13/13 sampled cases PASS |
| [forward-tests/forward-test-evidence-20260727-1.md](forward-tests/forward-test-evidence-20260727-1.md) | initial candidate `0.1.8` | Blind FAIL after independent review |
| [forward-tests/forward-test-evidence-20260727-2.md](forward-tests/forward-test-evidence-20260727-2.md) | uncommitted P1 remediation candidate | Output PASS; snapshot identity incomplete |
| [forward-tests/forward-test-evidence-20260727-3.md](forward-tests/forward-test-evidence-20260727-3.md) | `7cc9a07a09bb6cb5712e4da66710cd057b8414a7` | Exact-snapshot fresh blind PASS |

## Обслуживание описания

- [implementation-log-20260715-1.md](logs/implementation-log-20260715-1.md) — описание сокращено до 300 code points; independent scoped PASS.
