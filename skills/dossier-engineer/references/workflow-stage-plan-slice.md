# Workflow stage steps: `plan-slice`

1. Re-read repo overlays that constrain planning, then re-check open questions, assumptions, dependencies, and the latest change log.
2. Open or update the stage log according to [workflow-stage-logging.md](workflow-stage-logging.md) before the first substantive planning mutation.
3. Do not move to `planned` while any unresolved `Open question` is marked `needed_by: before_planned`. Resolve it or explicitly reclassify it first.
4. Identify the contract risks that must be killed before close-out. At minimum consider first-run behavior, machine-facing outputs, help/discoverability, path/root semantics, cross-skill handoff, docs/runtime parity, and operator ambiguity points when they are relevant.
5. For every non-`N/A` adversarial semantics entry from the spec, add a risk-to-proof mapping before closing planning.
   The mapping may be a table or compact list, but it must include `Risk / edge case`, `Spec source`, `Required proof`, `Slice`, `Verification artifact`, and `N/A rationale`.
   The `Required proof` must name the operation pair or participating operation(s), race window or ordering boundary, expected observable result/error, and durable invariant.
   Use the side-effecting implementation checklist as a source for proof obligations before implementation: timeout budget, late completion, abort/cancellation, partial side effects, idempotency / duplicate delivery, logging/audit append failures, and crash/restart boundaries.
   Keep sequential replay distinct from concurrent replay when concurrency is possible, and keep closed admission distinct from already-started in-flight operation handling when shutdown/startup/order semantics matter.
6. Run a proof specificity smell pass before implementation.
   Flag generic verification labels such as `idempotency tests`, `race tests`, `shutdown tests`, `boundary tests`, `failure tests`, `integration tests`, `coverage for edge cases`, or `adversarial tests` unless the concrete proof details are adjacent.
7. When the heavy-runtime trigger fired during `spec-compact`, express the verification plan as a ladder rather than one broad verification label.
   At minimum include:
   - lightweight local checks;
   - targeted runtime probes;
   - integration checks when relevant;
   - final smoke gate.
   Each meaningful runtime hypothesis should map to the cheapest adequate proof before the plan resorts to a final smoke rerun.
8. Treat broad labels such as `smoke`, `runtime test`, or `end-to-end verification` as insufficient for heavy-runtime features unless adjacent text says what remains for the final smoke gate and what gets killed earlier by cheaper probes.
9. If the expensive smoke path is the only honest observable seam, state that explicitly and explain why cheaper probes would not prove the relevant behavior.
10. When adversarial semantics are non-empty, run or request a narrow pre-implementation missing-proof-obligations review unless repo/operator context explicitly keeps planning lightweight.
   Use this prompt:

   ```md
   Find missing adversarial proof obligations in this spec and slicing plan.
   Focus on concurrency, stale state, partial side effects, retry/replay, shutdown/startup,
   ownership boundaries, durable evidence, and proof specificity.
   ```

   This review checks missing proofs; it does not replace the risk-to-proof matrix, expand implementation scope, or make blocking audit decisions on weak/mini models.
11. Create 2–6 slices in delivery order.
   - order them prerequisite-first and risk-first, not just by happy path;
   - ensure at least one early slice proves the highest-risk boundary behavior, rollout path, or expensive assumption instead of only laying groundwork or deferring all heavy-runtime truth to the final smoke gate.
12. Keep each slice reviewable and provable as one coherent increment.
   - if a slice cannot be verified and reviewed in one bundle, split it.
13. For each slice, state the deliverable, which AC IDs it covers, and the verification artifact(s) that prove it.
14. When a slice depends on another dossier, external team, or shared subsystem, add `Depends on:` with owner and unblock condition.
15. When a slice relies on a high-risk assumption, add `Assumes:` and `Fallback:` notes.
16. If activation order matters because of migration, feature flag, cutover, backfill, or irreversible side effects, add a compact rollout / activation note with activation order and rollback limits.
17. If a slice touches a shared runtime, contract, migration path, or other cross-cutting surface, name the approval or decision path (repo ADR, architecture update, owner approval, or linked follow-up).
18. Plan drift-guard work when the feature spans multiple normative layers such as skill/process docs, utility spec, help output, and tests.
19. When the feature has meaningful operator-facing, agent-facing, or machine-facing behavior, add a real usage audit after the main implementation flow and pre-classify expected corrective findings as `docs-only`, `runtime`, `schema/help`, `cross-skill`, or `audit-only`.
20. For each slice, list tasks that reference AC IDs or Slice IDs only.
21. If the work is multi-slice or package-based, define `allowed_stop_points` explicitly before implementation starts.
    Each allowed stop point must name the completed slice/package boundary, the safe reason to stop there, the verification expected at that boundary, and what remains outside that stop.
22. If the feature requires realignment of delivered work, make that realignment explicit as a slice or linked task.
23. Treat slices and tasks as forecast. Commitment remains in ACs, Definition of Done, verification/coverage gates, and explicit rollout constraints unless repo overlays say otherwise.
24. Set dossier `status: planned`.
25. Set or confirm `coverage_gate` explicitly.
   - Default: `deferred`
   - Tighten to `strict` only when the repo overlay requires it or planning is intentionally treated as a blocking verification gate.
26. Update the stage log with slice boundary decisions, assumptions/fallbacks, review events, process misses, and the planned backlog actualization outcome before closure.
27. Before moving to implementation, return to `backlog-engineer` when the strongest available evidence now supports `delivery_state = planned`, or when planning exposed new dependencies, rollout constraints, or context facts.
    The planning stage is not complete until this required backlog actualization is done.
28. Update the stage log with the backlog actualization result and links to applicable verification, review, and step-close artifacts.
