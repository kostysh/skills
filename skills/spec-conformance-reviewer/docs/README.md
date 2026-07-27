# Документация `spec-conformance-reviewer`

Эта папка содержит supporting и historical surface. Активные инструкции остаются в `SKILL.md` и явно подключенных `references/*`.

## Issues

| Issue | Status | Notes |
| --- | --- | --- |
| [issues/issue-20260424-1.md](issues/issue-20260424-1.md) | Implemented | Условная policy/admission edge-case matrix для normative allow/deny, refusal, freshness, replay и activation requirements. Log: [logs/implementation-log-20260424-1.md](logs/implementation-log-20260424-1.md). |
| [issues/issue-20260428-1.md](issues/issue-20260428-1.md) | Audited PASS | Traceability и checklist для policy/admission conformance; включает matrix `AC -> code path -> negative test -> evidence source` и shared risk-family alignment. |

## Implementation Plans

| Plan | Related issue | Status |
| --- | --- | --- |
| [issues/implementation-plan-20260424-1.md](issues/implementation-plan-20260424-1.md) | [issues/issue-20260424-1.md](issues/issue-20260424-1.md) | Audited PASS; implemented |

## Implementation Logs

Статусы в этой таблице различают implementation/self-check evidence и независимый capability verdict. Исторический `PASS` без snapshot-bound `skill-reviewer` audit не означает подтверждённую способность скила.

| Log | Related issue | Status |
| --- | --- | --- |
| [logs/implementation-log-20260424-1.md](logs/implementation-log-20260424-1.md) | [issues/issue-20260424-1.md](issues/issue-20260424-1.md) | Implementation/self-check PASS; no independent capability verdict |
| [logs/implementation-log-20260611-1.md](logs/implementation-log-20260611-1.md) | Direct operator request | Implementation/self-check PASS; no independent capability verdict |
| [logs/implementation-log-20260708-1.md](logs/implementation-log-20260708-1.md) | Direct operator request | Implementation/self-check PASS; no independent capability verdict |
| [logs/implementation-log-20260710-1.md](logs/implementation-log-20260710-1.md) | Direct operator request | Independent `skill-reviewer` capability PASS on recorded snapshot |
| [logs/implementation-log-20260713-1.md](logs/implementation-log-20260713-1.md) | Direct operator request | Independent PASS |
| [logs/implementation-log-20260715-1.md](logs/implementation-log-20260715-1.md) | Direct operator request | Independent scoped PASS |
| [logs/implementation-log-20260727-1.md](logs/implementation-log-20260727-1.md) | Aequitas-ADR/app#226 | Independent PASS; bounded remediation re-audit |
