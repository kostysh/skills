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
