# Workflow stage steps: `implementation`

1. Evaluate workflow-stage logging triggers using [workflow-stage-logging.md](workflow-stage-logging.md).
   For multi-step or package-based work, open or update the stage log before the first mutating edit.
2. Start from `docs/ssot/index.md`, then open the target dossier, dependent dossiers, relevant architecture sections, repo `AGENTS.md`, and repo ADRs.
3. Deliver on the canonical stack, runtime, and deployment path from the first executable change.
4. Before treating the first green increment as closure, identify the planned slices/packages and the allowed stop points recorded during `plan-slice`.
5. Build verification alongside implementation.
6. When the first working increment changes a security-sensitive seam, run the early security seam checkpoint from [Implementation audit policy](implementation-audit-policy.md) before building more work around that seam.
   This checkpoint is narrow, uses `security-reviewer`, and does not replace the final security audit.
   If the checkpoint finding requires behavior outside the dossier/spec/approved process model, stop and ask the operator instead of widening scope silently.
7. When implementation reveals a missing prerequisite seam or cross-cutting invariant, externalize it immediately.
8. Update the target dossier in the same workstream:
   - progress and links
   - coverage map
   - change log when behavior or assumptions changed
   - `coverage_gate: strict` when executable coverage must now block closure
9. Apply the [No-technical-debt policy](workflow.md#no-technical-debt-policy) before moving to verification and close-out.
10. Establish the intended final tree before closure: apply all in-scope code, dossier, verification, review, and backlog actualization changes that belong to the current closure target.
11. Run project checks plus `node scripts/dossier.mjs dossier-verify ...` on the intended final tree.
12. Run an explicit completeness review against the dossier, slices, approved changes, and repo overlays. Any stub, reduced scope, placeholder, or deferred behavior must be recorded explicitly; never leave it implicit.
13. Run `spec-conformance` review first against the dossier, overlays, approved changes, and relevant contracts. Use the audit brief and reround rules from [Implementation audit policy](implementation-audit-policy.md).
14. If the changed scope includes executable code, runtime wiring, or trust-boundary changes, run two nested review passes after `spec-conformance` passes:
   - `code-reviewer` for correctness, maintainability, contracts, lifecycle, and merge-risk findings;
   - `security-reviewer` for auth/authz, trust boundaries, input handling, secret exposure, and exploitability findings.
   These nested passes do not need standalone report artifacts, but all findings must be reported by the reviewing agent.
15. Run independent review and persist it. Use a separate reviewer agent; if spawning requires explicit user authorization, request it as a standalone line before continuing: `Please authorize spawning the required external audit/review agents for this phase.` If a separate reviewer agent still cannot be used, treat the step as blocked unless the user explicitly approves degraded review mode.
16. Persist only the independent reviewer verdict with `review-artifact`; nested `code-reviewer` and `security-reviewer` passes still feed that review, but `review-artifact` itself is not the review step.
17. Before claiming lifecycle progress, return to `backlog-engineer` when the strongest available evidence now supports `delivery_state = implemented`, or when implementation uncovered new blockers, dependencies, context facts, or architecture-significant follow-up work.
    The implementation stage is not complete until this required backlog actualization is done and backlog artifact integrity is clean when backlog truth changed.
18. Close the step with `dossier-step-close` only after the required backlog actualization and artifact-integrity confirmation are done.
19. If logging was required, update the stage log with slice status, completion decision, review events, debt review result, process misses, backlog actualization and artifact-integrity result, freshness fields, commit metadata when available, and links to applicable verification, review, and step-close artifacts.
20. Use this closure sequence: intended final tree -> verification -> external audits -> review / verification / step-close artifacts -> commit -> trace-only metadata backfill when needed.
    Post-commit metadata backfill may add trace links only; it must not change technical content, verification conclusions, review conclusions, or backlog truth.


## Completion guard

A final implementation close-out is allowed only when one of these conditions is true:

- all planned slices/packages for the current closure target are complete;
- the work reached a pre-recorded `allowed_stop_point` from `plan-slice` and the final answer states what remains outside that stop;
- a blocker requires operator decision;
- the operator explicitly asked to stop at the current checkpoint.

If none of these conditions is true, report checkpoint progress only. Do not use final completion language, do not run `dossier-step-close` as if the implementation stage were complete, and do not mark the backlog item `implemented`.
