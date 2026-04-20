# Workflow stage steps: `implementation`

1. Evaluate workflow-stage logging triggers using [workflow-stage-logging.md](workflow-stage-logging.md).
   For multi-step or package-based work, open or update the stage log before the first mutating edit.
2. Start from `docs/ssot/index.md`, then open the target dossier, dependent dossiers, relevant architecture sections, repo `AGENTS.md`, and repo ADRs.
3. Deliver on the canonical stack, runtime, and deployment path from the first executable change.
4. Before treating the first green increment as closure, identify the planned slices/packages and the allowed stop points recorded during `plan-slice`.
5. Build verification alongside implementation.
6. If the heavy-runtime trigger fired, treat heavy smoke as a final gate or allowed-stop-point / closure-target confirmation, not as the default working loop for ordinary debugging.
   Before a repeated heavy smoke, cold-start, cache-download, or multi-runtime bootstrap rerun:
   - localize the hypothesis;
   - choose the narrowest adequate probe or cheaper verification step;
   - rerun expensive smoke only when the remaining uncertainty actually lives on that path.
   Legitimate exceptions are limited to:
   - the smoke path is the only honest observable seam;
   - a repo overlay explicitly requires smoke-first discipline;
   - the operator explicitly chooses the expensive rerun as a conscious trade-off.
   Repeated heavy-runtime cost by itself is not proof of correctness; each expensive rerun needs a named proof purpose.
   Repeated heavy smoke, cold-start, cache-download, or multi-runtime bootstrap reruns should be treated as a retrospective process smell unless one of the exceptions above is explicit. If logging is required, heavy-runtime misuse is itself an implementation-specific process miss.
7. When the first working increment changes a security-sensitive seam, run the `Audit launch gate` from [Implementation audit policy](implementation-audit-policy.md) for `early-security-checkpoint`; do not spawn if the gate fails.
   After the gate passes, run the early security seam checkpoint before building more work around that seam.
   This checkpoint is narrow, uses `security-reviewer`, and does not replace the final security audit.
   If the checkpoint finding requires behavior outside the dossier/spec/approved process model, stop and ask the operator instead of widening scope silently.
8. When implementation reveals a missing prerequisite seam or cross-cutting invariant, externalize it immediately.
9. Update the target dossier in the same workstream:
   - progress and links
   - coverage map
   - change log when behavior or assumptions changed
   - `coverage_gate: strict` when executable coverage must now block closure
10. Apply the [No-technical-debt policy](workflow.md#no-technical-debt-policy) before moving to verification and close-out.
11. Establish the intended final tree before closure: apply all in-scope code, dossier, verification, review, and backlog actualization changes that belong to the current closure target.
12. Run project checks plus `node scripts/dossier.mjs dossier-verify ...` on the intended final tree.
13. Run an explicit completeness review against the dossier, slices, approved changes, and repo overlays. Any stub, reduced scope, placeholder, or deferred behavior must be recorded explicitly; never leave it implicit.
14. Run the `Audit launch gate` from [Implementation audit policy](implementation-audit-policy.md) for `spec-conformance`; do not spawn if the gate fails.
    After the gate passes, run `spec-conformance` review first against the dossier, overlays, approved changes, and relevant contracts. Use the audit brief and reround rules from [Implementation audit policy](implementation-audit-policy.md).
15. If the changed scope includes executable code, runtime wiring, or trust-boundary changes, run the `Audit launch gate` before each nested `code` and `security` review; do not spawn if either gate fails.
    After the relevant gate passes, run two nested review passes after `spec-conformance` passes:
   - `code-reviewer` for correctness, maintainability, contracts, lifecycle, and merge-risk findings;
   - `security-reviewer` for auth/authz, trust boundaries, input handling, secret exposure, and exploitability findings.
   These nested passes do not need standalone report artifacts, but all findings must be reported by the reviewing agent.
16. Run the `Audit launch gate` for `independent-review`; do not spawn if the gate fails.
    After the gate passes, run independent review and persist it. Use a separate reviewer agent; if spawning requires explicit user authorization, request it as a standalone line before continuing: `Please authorize spawning the required external audit/review agents for this phase.` If a separate reviewer agent still cannot be used, treat the step as blocked unless the user explicitly approves degraded review mode.
    Apply operational launch guardrails from [Implementation audit policy](implementation-audit-policy.md) after each launch passes the model gate.
17. Persist only the independent reviewer verdict with `review-artifact`; nested `code-reviewer` and `security-reviewer` passes still feed that review, but `review-artifact` itself is not the review step.
18. Before claiming lifecycle progress, return to `backlog-engineer` when the strongest available evidence now supports `delivery_state = implemented`, or when implementation uncovered new blockers, dependencies, context facts, or architecture-significant follow-up work.
    The implementation stage is not complete until this required backlog actualization is done and backlog artifact integrity is clean when backlog truth changed.
19. Close the step with `dossier-step-close` only after the required backlog actualization and artifact-integrity confirmation are done.
20. If logging was required, update the stage log with slice status, completion decision, review events, debt review result, process misses, backlog actualization and artifact-integrity result, freshness fields, commit metadata when available, and links to applicable verification, review, and step-close artifacts.
21. Use this closure sequence: intended final tree -> verification -> external audits -> review / verification / step-close artifacts -> commit -> trace-only metadata backfill when needed.
    Post-commit metadata backfill may add trace links only; it must not change technical content, verification conclusions, review conclusions, or backlog truth.


## Completion guard

A final implementation close-out is allowed only when one of these conditions is true:

- all planned slices/packages for the current closure target are complete;
- the work reached a pre-recorded `allowed_stop_point` from `plan-slice` and the final answer states what remains outside that stop;
- a blocker requires operator decision;
- the operator explicitly asked to stop at the current checkpoint.

If none of these conditions is true, report checkpoint progress only. Do not use final completion language, do not run `dossier-step-close` as if the implementation stage were complete, and do not mark the backlog item `implemented`.
