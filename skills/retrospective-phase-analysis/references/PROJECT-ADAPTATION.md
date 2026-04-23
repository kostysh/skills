# Project adaptation notes

This skill was designed against a workflow that uses structured stage logs for:
- `spec-compact`
- `plan-slice`
- `implementation`

It is especially effective when logs record:
- start, ready-for-review, final-pass, and commit timestamps;
- review rounds and findings;
- structured process misses via `process_misses` or `process_misses_total`;
- structured skill usage via `skills_used`;
- artifact identity via `primary_feature_id`, `primary_backlog_item_key`, or `phase_scope`;
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

For `.dossier/reviews`, `.dossier/verification`, and `.dossier/steps`, prefer explicit links declared by included stage logs or bounded stage state. A matching feature id in a file name is only a candidate signal, not auto-inclusion evidence.

Do not broad-scan `.dossier/stages/*`. If an included stage log identifies a helper-managed state file through its feature and stage metadata, that single bounded state path may be read to enrich artifact identity, artifact links, timestamps, and structured metrics.

When structured completion timestamps from linked stage artifacts prove that later same-session events belong to follow-up retrospective work, use an artifact-derived boundary. If no strong timestamp exists and same-session scope remains ambiguous, stop and require `--until-line` or `--until-ts`; manual artifact overrides do not resolve this boundary.

If `session_meta.cwd` is missing, stale, or otherwise unreliable, do not widen the search across arbitrary repositories. First try:

1. an explicit project root provided by the operator;
2. a single candidate root implied by repeated trace-linked file paths.

If these anchors do not converge on one reliable root, stop and surface the ambiguity instead of guessing `--logs-dir` or `--artifacts-dir`.
