# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260501-4`

## Related Issue

`issue-20260501-4` — `skills/dossier-engineer/docs/issues/issue-20260501-4.md`

## Source Artifacts

- `skills/dossier-engineer/docs/issues/issue-20260501-4.md`
- `skills/dossier-engineer/docs/dossier-engineer-problem-analysis-and-proposals.ru.md`
- `skills/dossier-engineer/references/review-and-closure.md`
- `skills/dossier-engineer/references/workflow.md`
- `skills/dossier-engineer/references/capability-governance.md`
- `skills/dossier-engineer/src/app.ts`
- `skills/dossier-engineer/src/domain.ts`
- `skills/dossier-engineer/test/cli.test.ts`

## Objective

Сделать review policy менее шумной и более точной: micro-fixes inside the same material scope can be recorded as notes, but implementation closure requires a fresh eligible final review bundle for all required review classes; review freshness is tied to a normalized material scope hash that includes Phase 1/3 material inputs without staling on pure editorial changes.

Anti-claim: consolidated review is not a new review class and does not replace required spec/code/security/concept reviews.

## Assumptions

- Phase 1 provides `Spec Compact` / `Plan Slice` body contracts.
- Phase 3 provides integration path, AC/evidence/falsifier matrix, and live-app evidence path semantics.
- This phase may add freshness logic that depends on those fields, but does not reimplement Phase 1/3 gates.
- Material scope hashing should normalize material sections and ignore insignificant whitespace/non-material notes.

## Scope

In scope:

- Active guidance for micro-fix review policy.
- Material re-review triggers.
- Normalized material scope hash inputs.
- Freshness checks for concept-conformance reuse from plan-slice through implementation closure.
- Closure requirement for a final fresh review bundle across required review classes.
- Note-only micro-fix visibility in stage log, verification summary, or changeset summary.
- Tests and active guidance updates.

Out of scope:

- New review class named `consolidated`.
- Removing required review classes.
- Full review on every micro-fix.
- Phase 1/3 gate implementation except as hash inputs.
- New mandatory artifact families.

## Proposed Changes

- Add material scope normalization helper that hashes required material subsections, not raw full Markdown body.
- Include source/capability/delivery kind/acceptance/negative/falsifier/anti-claim/spec/plan/integration/matrix/risk/dependency/surface/change-proposal/demo/falsifier/live-app evidence path inputs.
- Mark reviews stale when material triggers change.
- Update `review required`, `stage close`, and implementation closure logic to require fresh eligible PASS artifacts for every required review class.
- Let note-only micro-fixes avoid full review bundle only when material scope and trust/security posture do not change.
- Ensure note-only micro-fixes are recorded in stage log, verification summary, or changeset summary.
- Update active review/closure guidance, command help, and docs/help output.

## Implementation Steps

1. Add tests for material scope hash normalization: whitespace/editorial notes do not stale reviews; material section changes do.
2. Add tests for demo scenario and falsifier set changes invalidating stale reviews.
3. Add tests that consolidated review is not a new review class and required review classes still need fresh PASS artifacts.
4. Add tests for note-only micro-fix recording and disallowing note-only treatment for trust/security changes.
5. Implement normalized material scope hash helper and update work/review freshness calculations.
6. Update review required / stage close / implementation closure logic.
7. Update docs/help output and active guidance examples.
8. Rebuild runtime and run full checks.

## Verification Plan

- `cd skills/dossier-engineer && pnpm run build`
- `cd skills/dossier-engineer && pnpm test`
- `cd skills/dossier-engineer && pnpm run lint`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/dossier-engineer`
- Runtime acceptance tests must cover:
  - plan-slice concept review is required before plan-slice close;
  - implementation closure reuses concept review only if material scope hash remains fresh;
  - material changes to claim, AC, `Spec Compact`, `Plan Slice`, trust boundary, security posture, implementation surface, demo scenario, or falsifier set stale required reviews;
  - source interpretation changes stale required reviews;
  - live-app evidence path changes stale required reviews;
  - delivery kind changes affect material scope hash;
  - pure whitespace/editorial non-material note changes do not stale reviews;
  - micro-fixes inside same material scope can be recorded without full review bundle for each fix;
  - note-only micro-fix treatment is rejected when source interpretation, capability claim, acceptance criteria, or production entrypoint changes;
  - final closure requires fresh eligible PASS artifacts for all required review classes;
  - note-only micro-fixes remain visible in stage log, verification summary, or changeset summary;
  - no `consolidated-reviewer` or equivalent new review class is introduced.
- Docs/help output reflects consolidated review as timing/scope policy, not a review class.

## Risks and Side Effects

- Hash normalization can miss meaningful prose changes. Mitigation: keep required material subsections conservative and include risk/matrix/falsifier/evidence sections.
- Too broad hash inputs can cause review churn. Mitigation: ignore insignificant whitespace and explicitly non-material notes.
- Agents may under-review by calling changes micro-fixes. Mitigation: explicit material triggers and final review bundle.
- Phase dependency can be brittle if implemented before Phase 1/3. Mitigation: implement Phase 4 after those contracts exist or guard missing fields conservatively.

## Rollback Plan

- Revert normalized hash/freshness changes and review gate updates.
- Keep active guidance changes only if runtime behavior remains aligned.
- If partial rollback is needed, preserve existing reviewFresh behavior and remove new stale triggers.
- Keep issue/plan as historical context unless explicitly removed.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agent `Parfit`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- Initial audit found missing material hash inputs for `delivery kind` and `live-app evidence path`, missing stale-review tests for source interpretation and live-app evidence path changes, incomplete note-only micro-fix disqualifier tests, and missing docs/help output updates.
- Corrections added those items to proposed changes, implementation steps, and verification.
- Re-audit confirmed the plan covers consolidated review as timing/scope policy, required review classes preserved, normalized material hash, no churn for pure editorial non-material notes, source interpretation/live-app evidence path/delivery kind hash inputs, expanded note-only disqualifiers, micro-fix note visibility, and docs/help output updates.

Required corrections: None after re-audit.

Final status: `PASS`
