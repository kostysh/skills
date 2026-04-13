# Project adaptation notes

This skill was designed against a workflow that uses structured stage logs for:
- `spec-compact`
- `plan-slice`
- `implementation`

It is especially effective when logs record:
- start, ready-for-review, final-pass, and commit timestamps;
- review rounds and findings;
- process misses;
- backlog actualization status;
- verification, review, and step-close artifact links.

The included CLI is generic and heuristic, so adapt field mappings if your session trace schema is richer than the default assumptions.

## Deterministic path discovery order

The agent performs path discovery after it has resolved `session_id` and found the canonical session trace.

When the trace exposes `session_meta.cwd`, treat it as the candidate `project root` and discover evidence in this order:

1. session trace
2. `cwd`
3. `.dossier/logs`
4. `.dossier/reviews`
5. `.dossier/verification`
6. `.dossier/steps`
7. `docs/features`
8. `docs/adr`
9. `docs/backlog`

These are only candidate evidence roots. Move an artifact into the real retrospective scope only when it is linked by trace-derived ids or paths.

For `.dossier/logs`, apply a stricter rule: include only the stage-log paths that the trace shows as created or changed in the analyzed session. Do not widen stage-log scope by feature-id matching alone.
