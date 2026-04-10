# Workflow stage steps: `plan-slice`

1. Re-read repo overlays that constrain planning, then re-check open questions, assumptions, dependencies, and the latest change log.
2. Evaluate workflow-stage logging triggers using [workflow-stage-logging.md](workflow-stage-logging.md).
   If logging is required, open `.dossier/logs/...` before the first substantive planning mutation.
3. Do not move to `planned` while any unresolved `Open question` is marked `needed_by: before_planned`. Resolve it or explicitly reclassify it first.
4. Identify the contract risks that must be killed before close-out. At minimum consider first-run behavior, machine-facing outputs, help/discoverability, path/root semantics, cross-skill handoff, docs/runtime parity, and operator ambiguity points when they are relevant.
5. Create 2–6 slices in delivery order.
   - order them prerequisite-first and risk-first, not just by happy path;
   - ensure at least one early slice proves the highest-risk boundary behavior, rollout path, or expensive assumption instead of only laying groundwork.
6. Keep each slice reviewable and provable as one coherent increment.
   - if a slice cannot be verified and reviewed in one bundle, split it.
7. For each slice, state the deliverable, which AC IDs it covers, and the verification artifact(s) that prove it.
8. When a slice depends on another dossier, external team, or shared subsystem, add `Depends on:` with owner and unblock condition.
9. When a slice relies on a high-risk assumption, add `Assumes:` and `Fallback:` notes.
10. If activation order matters because of migration, feature flag, cutover, backfill, or irreversible side effects, add a compact rollout / activation note with activation order and rollback limits.
11. If a slice touches a shared runtime, contract, migration path, or other cross-cutting surface, name the approval or decision path (repo ADR, architecture update, owner approval, or linked follow-up).
12. Plan drift-guard work when the feature spans multiple normative layers such as skill/process docs, utility spec, help output, and tests.
13. When the feature has meaningful operator-facing, agent-facing, or machine-facing behavior, add a real usage audit after the main implementation flow and pre-classify expected corrective findings as `docs-only`, `runtime`, `schema/help`, `cross-skill`, or `audit-only`.
14. For each slice, list tasks that reference AC IDs or Slice IDs only.
15. If the feature requires realignment of delivered work, make that realignment explicit as a slice or linked task.
16. Treat slices and tasks as forecast. Commitment remains in ACs, Definition of Done, verification/coverage gates, and explicit rollout constraints unless repo overlays say otherwise.
17. Set dossier `status: planned`.
18. Set or confirm `coverage_gate` explicitly.
   - Default: `deferred`
   - Tighten to `strict` only when the repo overlay requires it or planning is intentionally treated as a blocking verification gate.
19. If logging was required, update the stage log with slice boundary decisions, assumptions/fallbacks, review events, process misses, and the planned backlog actualization outcome before closure.
20. Before moving to implementation, return to `backlog-engineer` when the strongest available evidence now supports `delivery_state = planned`, or when planning exposed new dependencies, rollout constraints, or context facts.
    The planning stage is not complete until this required backlog actualization is done.
21. If logging was required, update the stage log with the backlog actualization result and links to applicable verification, review, and step-close artifacts.
