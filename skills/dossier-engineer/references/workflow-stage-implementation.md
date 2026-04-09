# Workflow stage steps: `implementation`

1. For multi-step or package-based work, open or update the implementation log before the first mutating edit.
2. Start from `docs/ssot/index.md`, then open the target dossier, dependent dossiers, relevant architecture sections, repo `AGENTS.md`, and repo ADRs.
3. Deliver on the canonical stack, runtime, and deployment path from the first executable change.
4. Build verification alongside implementation.
5. When implementation reveals a missing prerequisite seam or cross-cutting invariant, externalize it immediately.
6. Update the target dossier in the same workstream:
   - progress and links
   - coverage map
   - change log when behavior or assumptions changed
   - `coverage_gate: strict` when executable coverage must now block closure
7. Apply the [No-technical-debt policy](workflow.md#no-technical-debt-policy) before moving to verification and close-out.
8. Run project checks plus `node scripts/dossier.mjs dossier-verify ...`.
9. Run an explicit completeness review against the dossier, slices, approved changes, and repo overlays. Any stub, reduced scope, placeholder, or deferred behavior must be recorded explicitly; never leave it implicit.
10. Run `spec-conformance` review first against the dossier, overlays, approved changes, and relevant contracts. Use the audit brief and reround rules from [Implementation audit policy](implementation-audit-policy.md).
11. If the changed scope includes executable code, runtime wiring, or trust-boundary changes, run two nested review passes after `spec-conformance` passes:
   - `code-reviewer` for correctness, maintainability, contracts, lifecycle, and merge-risk findings;
   - `security-reviewer` for auth/authz, trust boundaries, input handling, secret exposure, and exploitability findings.
   These nested passes do not need standalone report artifacts, but all findings must be reported by the reviewing agent.
12. Run independent review and persist it. Use a separate reviewer agent; if spawning requires explicit user authorization, ask for it, and if a separate reviewer agent still cannot be used, treat the step as blocked unless the user explicitly approves degraded review mode.
13. Persist only the independent reviewer verdict with `review-artifact`; nested `code-reviewer` and `security-reviewer` passes still feed that review, but `review-artifact` itself is not the review step.
14. Before claiming lifecycle progress, return to `backlog-engineer` when the strongest available evidence now supports `delivery_state = implemented`, or when implementation uncovered new blockers, dependencies, context facts, or architecture-significant follow-up work.
    The implementation stage is not complete until this required backlog actualization is done.
15. Close the step with `dossier-step-close` only after the required backlog actualization is done.
