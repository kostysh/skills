# `skill-source-compiler` Docs

Эта папка содержит supporting и historical surface для `skill-source-compiler`. Активные инструкции остаются в `SKILL.md` и явно подключенных `references/*`.

## Issues

| Issue | Status | Notes |
| --- | --- | --- |
| [issues/issue-20260424-1.md](issues/issue-20260424-1.md) | Implemented PASS | `compile` / `compile-all` destructive overlap fixed with safe `regenerate`, overlap guards, source-bundle `check`, and verified implementation. |
| [issues/issue-20260424-2.md](issues/issue-20260424-2.md) | Implemented PASS | Simple source bundles no longer need artificial `references/*` files; generated reference sections and checks are conditional. |

## Implementation Plans

| Plan | Related issue | Status |
| --- | --- | --- |
| [issues/implementation-plan-20260424-1.md](issues/implementation-plan-20260424-1.md) | [issues/issue-20260424-1.md](issues/issue-20260424-1.md) | Implemented PASS |
| [issues/implementation-plan-20260424-2.md](issues/implementation-plan-20260424-2.md) | [issues/issue-20260424-2.md](issues/issue-20260424-2.md) | Implemented PASS |

## Implementation Logs

| Log | Related issue | Status |
| --- | --- | --- |
| [logs/implementation-log-20260424-1.md](logs/implementation-log-20260424-1.md) | [issues/issue-20260424-1.md](issues/issue-20260424-1.md) | PASS |
| [logs/implementation-log-20260424-2.md](logs/implementation-log-20260424-2.md) | [issues/issue-20260424-2.md](issues/issue-20260424-2.md) | PASS |

## Supporting Docs

| File | Purpose |
| --- | --- |
| [compile-report.md](compile-report.md) | Generated compile report for the current emitted skill surface. |
| [issues/design-notes.md](issues/design-notes.md) | Historical design notes for generated skill source bundles. |
