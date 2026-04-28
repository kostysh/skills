# Implementation Plan

## Language

План написан на русском языке.

## Plan ID

`implementation-plan-20260428-1`

## Related Issue

`issue-20260428-1` — [issue-20260428-1.md](issue-20260428-1.md)

## Source Artifacts

- [issue-20260428-1.md](issue-20260428-1.md) — audited problem statement, required deployed-path and identity-binding review dimensions, scope, proposed resolution and verification expectations.
- `AGENTS.md` — repository rules for skill plans, independent audits, documentation layers, generated-skill parity and portability.
- `docs/templates/IMPLEMENTATION_PLAN_TEMPLATE.md` — repository-wide implementation plan template.
- `AGENTS.md` in the skill folder — generated-skill maintenance contract: source of truth is `skill.yaml`, `fragments/*`, `references/*` and `assets/*`.
- `skill.yaml` — source-of-truth manifest for generated skill sections, active references, assets, portability rules and compiler-owned output.
- `fragments/overview.md` — current root workflow, interop, non-negotiables, fast workflow, review checks and output rules rendered into `SKILL.md`.
- `references/methodology.md` — current pass order, evidence standard and conditional policy/admission merge-risk pass.
- `references/domain-routing.md` — current ownership boundaries across code-reviewer, security-reviewer, spec-conformance-reviewer and domain skills.
- `references/policy-admission-merge-risk.md` — existing bounded policy/admission pass that the runtime-gating deployed-path guidance must align with without becoming security-specific or spec-traceability-specific.
- `assets/review-checklist.md` — current portable quick checklist bundled with the skill.
- `assets/fixtures/policy-admission-review.md` — existing fixture pattern for conditional review examples and expected reviewer conclusions.
- `SKILL.md` and `docs/compile-report.md` — generated output that must be refreshed after source-bundle changes, not hand-edited as source of truth.
- `docs/README.md` — supporting navigation for issues, plans and implementation logs.

## Objective

Make `code-reviewer` require a bounded `tested path equals deployed path` review block for runtime-gating changes. A reviewer should not approve a runtime gate from isolated service/router logic alone when the production construction path, dependency wiring, request or tick execution path, invocation boundary, idempotency lock scope, deployed-path tests, or release/deployment/cell identity binding can bypass or mis-bind the gate.

## Assumptions

- `code-reviewer` remains a generated documentation skill with no shipped runtime CLI or executable test harness.
- Runtime-gating guidance belongs in `code-reviewer` when the review concern is non-security merge risk: production wiring bypasses a gate, tests miss the shipped lifecycle, or integration code hard-codes deployment identity.
- `security-reviewer` still owns exploitability, vulnerability classification, replay authority and security severity.
- `spec-conformance-reviewer` still owns requirement-by-requirement traceability and implementation-versus-spec verdicts.
- The new block is conditional. It triggers only when changed files or linked review intent touch runtime gates that authorize execution through a shipped lifecycle, such as policy/admission gates, router/model/provider gates, background tick gates, queue/job admission gates, deployment/cell routing, or idempotency/lock scopes around those gates.
- Deployed-path test evidence can be represented by portable review fixtures in `assets/fixtures/`, because the skill currently has no executable fixture runner.
- A future shared policy/admission risk-family reference may be mentioned by skill name only, but this skill must remain understandable inside its own folder.

## Scope

In scope:

- Add active review guidance for `tested path equals deployed path` on runtime-gating changes.
- Require inspection of production construction path, deployed dependency wiring, actual request/tick path, invocation boundary after policy/admission decision, and idempotency lock scope.
- Require deployed-path evidence: tests must execute the shipped lifecycle or construction path when production wiring can bypass the gate.
- Add integration identity checks for release/deployment/cell identity binding, non-default identity coverage, mismatch refusal, and no silent fallback to hard-coded defaults.
- Keep the new guidance portable, self-contained and aligned with the existing policy/admission merge-risk pass.
- Update source bundle, regenerated output and supporting navigation in one implementation change set.

Out of scope:

- Security-specific replay authority, credential handling, exploitability analysis or vulnerability severity.
- Full normative requirement traceability and compliance matrices.
- Application-specific runtime names, deployment topology or originating-project paths.
- Adding a runtime CLI, executable tests, or command semantics to `code-reviewer`.
- Making runtime-gating checks mandatory for unrelated diffs.

## Proposed Changes

- Add a focused optional active reference, for example `references/runtime-gate-deployed-path.md`:
  - trigger signals for runtime-gating changes;
  - the mandatory `tested path equals deployed path` block;
  - deployed-path probes for construction path, dependency wiring, request/tick execution path, invocation boundary and idempotency lock scope;
  - integration identity probes for release/deployment/cell identity sources, hard-coded defaults, non-default identity tests, mismatch refusal and silent-fallback prevention;
  - missing-test guidance for deployed-path coverage versus isolated unit coverage;
  - evidence standard and interop boundaries with `security-reviewer`, `spec-conformance-reviewer` and domain skills.
- Update `references/methodology.md`:
  - flag runtime-gating files as high-risk review surfaces;
  - add a conditional `Runtime-gate deployed-path pass` after the existing policy/admission pass or as a sub-pass when both triggers are present;
  - state that isolated service/router tests are insufficient when production construction or lifecycle wiring can bypass the gate.
- Update `references/policy-admission-merge-risk.md`:
  - cross-link the runtime-gate deployed-path reference when policy/admission decisions are enforced through a shipped runtime lifecycle;
  - avoid duplicating the full deployed-path checklist in the policy/admission reference.
- Update `references/domain-routing.md`:
  - clarify that `code-reviewer` owns non-security findings for deployed-path runtime-gate bypasses and hard-coded integration identity;
  - keep framework/runtime mechanics with the matching domain skill and security classifications with `security-reviewer`.
- Update `fragments/overview.md` and `skill.yaml`:
  - add a concise non-negotiable and fast-workflow hook for runtime-gating changes;
  - register the new optional active reference with a precise trigger;
  - register any new fixture asset;
  - bump `skill.source-version` because active skill guidance changes.
- Add a portable fixture asset, for example `assets/fixtures/runtime-gate-deployed-path-review.md`:
  - scenario where isolated gate tests pass but production lifecycle construction bypasses the gate before invocation;
  - scenario where deployment/cell identity is hard-coded at an integration boundary;
  - expected reviewer conclusions separating blocking findings, open questions and non-findings.
- Update `assets/review-checklist.md` with one concise conditional item for runtime-gating deployed-path and identity-binding checks.
- Regenerate compiler-owned output:
  - `SKILL.md`;
  - `docs/compile-report.md`.
- Update supporting docs:
  - keep this plan linked from `docs/README.md`;
  - during implementation, create `docs/logs/implementation-log-20260428-1.md` and link it from `docs/README.md`.

## Implementation Steps

1. Read the current `code-reviewer` source bundle and confirm the new runtime-gating pass does not duplicate existing policy/admission guidance.
2. Add `references/runtime-gate-deployed-path.md` with the conditional trigger, deployed-path checklist, identity-binding checklist, missing-test standard, evidence rules, non-goals and interop boundaries.
3. Update `references/methodology.md` to route runtime-gating changes into the new pass and to distinguish deployed-path evidence from isolated unit evidence.
4. Update `references/policy-admission-merge-risk.md` with a narrow cross-link for policy/admission gates enforced through deployed runtime paths.
5. Update `references/domain-routing.md` so ownership boundaries cover deployed-path gate bypasses, hard-coded deployment/cell identity, domain mechanics, security severity and spec traceability.
6. Update `fragments/overview.md`, `assets/review-checklist.md` and `skill.yaml` to expose the new guidance through progressive disclosure without bloating the root `SKILL.md`.
7. Add `assets/fixtures/runtime-gate-deployed-path-review.md` and register it in `skill.yaml`.
8. Bump `skill.source-version` in `skill.yaml` for the active instruction-surface change.
9. Regenerate `SKILL.md` and `docs/compile-report.md` with the `skill-source-compiler` runtime.
10. Update `docs/README.md` and create the implementation log after implementation.
11. Run the verification plan and review the final diff for generated-output parity, portability and unrelated churn.

## Verification Plan

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/code-reviewer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/code-reviewer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/code-reviewer`
- `rg -n -e '[/]home/' -e '[/]code/' -e 'C:[\\\\]' -e '[A-Za-z]:[\\\\]' skills/code-reviewer --glob '!**/docs/issues/implementation-plan-*.md'`
- Manual reachability check:
  - confirm `SKILL.md` links the new optional active reference through a precise runtime-gating trigger;
  - confirm every required or optional reference declared by `skill.yaml` exists inside `skills/code-reviewer`;
  - confirm `docs/compile-report.md` lists the new reference and fixture asset after regeneration.
- Manual fixture walk-through:
  - isolated service/router tests with missing deployed lifecycle coverage produce a blocking missing-test or wiring finding when the gate can be bypassed;
  - a request/tick path that invokes a provider before the gate produces a blocking finding;
  - a hard-coded deployment/cell identity at an integration boundary produces a blocking finding unless an explicit spec requires it;
  - tests cover non-default identity, mismatch refusal and absence of silent fallback to default identity.
- Instruction quality audit:
  - outcome-first success criteria, constraints, evidence rules, validation gates and output shape are explicit;
  - no duplicated checklist fights the existing policy/admission pass;
  - the new reference trigger is concrete enough for progressive disclosure;
  - stop rules keep unrelated diffs and speculative architecture concerns out of findings.
- Documentation parity check:
  - `fragments/overview.md`, `references/methodology.md`, `references/domain-routing.md`, `references/policy-admission-merge-risk.md`, the new reference, assets, `SKILL.md` and `docs/compile-report.md` describe the same trigger boundary;
  - no workflow stage is presented as a runnable CLI command;
  - `docs/*` remains supporting and historical unless explicitly promoted.

## Risks and Side Effects

- Risk: the runtime-gating pass could make ordinary policy/admission reviews too broad.
  - Mitigation: trigger only on changed files or linked intent involving a runtime gate in a shipped lifecycle; require reachable changed behavior before findings.
- Risk: the guidance could duplicate the existing policy/admission pass.
  - Mitigation: keep policy/admission generic probes in the existing reference and put deployed construction path, lifecycle wiring and identity binding in the new reference.
- Risk: reviewers could overreach into security or spec-conformance findings.
  - Mitigation: keep explicit boundaries and escalation rules in `domain-routing.md` and the new reference.
- Risk: fixture examples could be mistaken for product-specific requirements.
  - Mitigation: label fixtures as portable review examples, not requirements, and avoid originating-project names.
- Risk: generated output could drift from source if implementation hand-edits `SKILL.md`.
  - Mitigation: edit source bundle first, regenerate, and run compiler `check`.
- Destructive side effects: none expected; planned changes are documentation, fixture and generated-output updates inside the same skill folder.

## Rollback Plan

Revert the files changed for this issue: source-bundle prose, the new active reference, fixture asset, `skill.yaml`, regenerated `SKILL.md`, `docs/compile-report.md`, docs navigation and implementation log. Then rerun `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/code-reviewer` to confirm the generated skill returned to a consistent state.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agent `Erdos`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- План соответствует `issue-20260428-1`: покрыты `tested path equals deployed path`, production construction path, dependency wiring, request/tick path, invocation boundary, idempotency lock scope, deployed-path tests, deployment/cell identity binding, portability и generated-skill maintenance path.
- Source artifacts учтены достаточно: план явно включает repo/skill `AGENTS.md`, template, `skill.yaml`, `fragments/overview.md`, релевантные references, checklist, fixture pattern, generated outputs и `docs/README.md`.
- Safety границы описаны корректно: `security-reviewer` сохраняет exploitability/vulnerability ownership, `spec-conformance-reviewer` сохраняет traceability/verdict ownership, runtime/domain mechanics остаются за domain skills.
- Verification достаточна для documentation-backed generated skill: compiler lint/regenerate/check, reachability, fixture walkthrough, portability search, documentation parity и instruction quality audit.
- Остаточный риск: новая optional reference должна быть подключена так, чтобы при runtime-gating trigger ее применение было фактически обязательным. План это предусматривает через non-negotiable/fast-workflow hook, но это нужно внимательно проверить при реализации.

Required corrections:

- none

Final status: `PASS`
