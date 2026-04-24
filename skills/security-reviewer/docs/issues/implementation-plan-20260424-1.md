# Implementation Plan

## Language

План написан на русском языке.

## Plan ID

`implementation-plan-20260424-1`

## Related Issue

`SEC-02` — [issue-20260424-1.md](issue-20260424-1.md)

## Source Artifacts

- [issue-20260424-1.md](issue-20260424-1.md) — audited problem statement, checkpoint triggers, checklist, acceptance criteria, constraints and non-goals.
- [improvement-proposal-20260423-1.md](improvement-proposal-20260423-1.md) — existing route auth-admission issue that must remain separate from policy-governance admission.
- `AGENTS.md` — repository rules for plans, independent audits, documentation layers, generated skills and portability.
- `docs/templates/IMPLEMENTATION_PLAN_TEMPLATE.md` — repository-wide implementation plan template.
- `AGENTS.md` in the skill folder — generated-skill maintenance contract: update `skill.yaml`, `fragments/*`, `references/*`, `assets/*` first and regenerate generated output.
- `SKILL.md` — current generated active instruction surface with default threat model, Fast Workflow, route auth-admission checkpoint and output rules.
- `skill.yaml` — source-of-truth manifest for generated sections, active references, copied tests/package files and portability rules.
- `fragments/overview.md` — source fragment for overview, interop, non-negotiables, threat model, Fast Workflow, reporting and remediation rules.
- `references/methodology.md` — common security review standard, confidence rubric, evidence checklist and output templates.
- `references/api-auth-input.md` — current route-focused auth-admission early checklist.
- `references/domain-handoffs.md` — domain skill routing and Hono-specific admission fact handoffs.
- `test/docs-contract.test.mjs` — existing package-local docs-contract tests for auth-admission guidance.
- `package.json` — package-local test command and copied package metadata.
- `docs/README.md` — supporting navigation for issues, implementation plans and logs.

## Objective

Add a bounded policy-governance admission checkpoint to `security-reviewer` so security reviews of external consultant/tool invocation, policy profile activation, governance/audit persistence preconditions, fail-closed policy gates and replay/idempotency controls explicitly check deny/no-invocation, conflicting persistence, stale or missing freshness evidence, audit sufficiency and active-policy activation races. The guidance must distinguish this surface from route auth-admission and keep the existing HIGH-confidence reporting discipline: findings require a confirmed attacker/control path or security-relevant operator/control-plane impact.

## Assumptions

- `security-reviewer` remains a generated documentation skill with package-local docs-contract tests, not a shipped runtime CLI.
- Future implementation must edit the source bundle first and regenerate `SKILL.md` and `docs/compile-report.md`; generated files are not source of truth.
- The existing route auth-admission checkpoint from `ISS-05` remains narrow and should not absorb policy-governance admission concerns.
- The default external-attacker threat model remains unchanged. Policy-governance reviews may explicitly state a different relevant actor, such as an operator, compromised integration, external consultant/tool integration, or replay source, only when that actor is relevant to the reviewed surface.
- Non-security merge risks, including policy/admission defects without a security-relevant control path or control-plane impact, route back to `code-reviewer`.
- Acceptance criteria for tests/examples can be met by active reference examples plus docs-contract tests that guard the new checkpoint and example coverage.

## Scope

In scope:

- Add policy-governance admission checkpoint guidance to the active workflow or a precisely triggered active reference.
- Distinguish route auth-admission from policy-governance admission in `SKILL.md`/source fragment and references.
- Cover deny/no-invocation, failed/conflicting audit persistence, stale allow replay, freshness gaps, active-policy activation races and audit records sufficient to explain refusal/admission.
- Add example coverage for one external-invocation admission review and one active-policy activation review.
- Extend docs-contract tests to protect the new checkpoint, trigger boundary, interop boundary and example coverage.
- Update source bundle, generated output, compile report and docs navigation.

Out of scope:

- Expanding `ISS-05` route auth-admission guidance.
- Turning policy-governance admission into a general policy architecture or code-quality review.
- Reporting low-confidence or theoretical vulnerabilities.
- Duplicating `code-reviewer` general merge-risk checks.
- Requiring the checkpoint for features that do not gate external side effects, authorization, policy activation or security-relevant governance state.
- Adding shipped CLI commands or runtime behavior.

## Proposed Changes

- Update `fragments/overview.md` and `skill.yaml`:
  - add a short Fast Workflow hook after the route auth-admission checkpoint or near scope classification for policy-governance admission;
  - make the hook conditional on the issue's trigger surfaces;
  - state that this checkpoint is distinct from route auth-admission;
  - preserve HIGH-confidence reporting and require a confirmed attacker/control path or security-relevant operator/control-plane impact;
  - bump `skill.source-version`.
- Add an active reference such as `references/policy-governance-admission.md`:
  - trigger checklist for external consultant/tool invocation, policy profile activation, active-scope selection, governance/audit persistence preconditions, fail-closed gates and replay/idempotency controls around security-relevant decisions;
  - bounded security checklist for explicit deny/no-invocation, failed or conflicting persistence before side effects, stale allow replay, missing freshness timestamp with age gating, activation race serialization and audit explanation sufficiency;
  - actor guidance for operator, compromised integration and replay source without changing the default threat model globally;
  - reporting gates for HIGH confidence, mitigations-before-finding and routing non-security merge risks to `code-reviewer`;
  - examples for external-invocation admission review and active-policy activation review.
- Update `references/methodology.md`:
  - add policy-governance admission to surface discovery or audit order when the trigger is present;
  - clarify that security-relevant operator/control-plane impact can satisfy the impact side of a finding when the actor model is stated explicitly.
- Update `references/api-auth-input.md`:
  - add a cross-reference note that route auth-admission remains route-specific and policy-governance admission belongs to the new reference.
- Update `references/domain-handoffs.md`:
  - clarify that framework/runtime facts still go to domain skills, but policy-governance security reportability remains with `security-reviewer`;
  - keep Hono route-admission facts separate from non-route policy-governance admission.
- Update `test/docs-contract.test.mjs`:
  - assert `SKILL.md` exposes the policy-governance checkpoint and distinguishes it from route auth-admission;
  - assert the new reference contains the required probes: deny/no-invocation, failed/conflicting audit persistence, replay/stale allow, freshness, activation race and audit sufficiency;
  - assert examples cover external invocation admission and active-policy activation;
  - assert wording preserves HIGH-confidence reporting and routes non-security merge risks to `code-reviewer`.
- Regenerate compiler-owned output:
  - `SKILL.md`;
  - `docs/compile-report.md`.
- Update supporting docs:
  - add this plan to `docs/README.md`;
  - during implementation, create `docs/logs/implementation-log-20260424-1.md` and link it from `docs/README.md`.

## Implementation Steps

1. Edit source-bundle files: `fragments/overview.md`, `references/methodology.md`, `references/api-auth-input.md`, `references/domain-handoffs.md` and `skill.yaml`.
2. Add `references/policy-governance-admission.md` and register it in `skill.yaml` as an active reference with a precise trigger.
3. Add two compact examples inside the new reference: external consultant/tool invocation admission and active-policy activation race review.
4. Extend `test/docs-contract.test.mjs` for the new checkpoint, probes, example coverage and boundary wording.
5. Check wording against `SEC-02`: distinct from route auth-admission, conditional trigger only, actor model explicit when non-default, HIGH-confidence findings only, non-security merge risks routed to `code-reviewer`.
6. Run in-place regeneration for `skills/security-reviewer` with the `skill-source-compiler` runtime.
7. Inspect `SKILL.md` and `docs/compile-report.md` for generated-output parity, active reference reachability and accidental duplication.
8. Update `docs/README.md` and create the implementation log after implementation.
9. Run the verification plan and review the final diff for unrelated churn.

## Verification Plan

- `pnpm --filter @kostysh/security-reviewer test`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/security-reviewer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/security-reviewer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/security-reviewer`
- `rg -n "(/home/|/code/|C:\\\\|[A-Za-z]:\\\\)" skills/security-reviewer`
- Manual example walk-through:
  - external-invocation admission example asks about explicit deny, failed/conflicting persistence, stale allow replay and no invocation after deny;
  - active-policy activation example asks about serialized activation, simultaneous active policy prevention, freshness requirements and audit explanation sufficiency;
  - both examples require confirmed actor/control path or security-relevant operator/control-plane impact before reporting a finding.
- Documentation parity check:
  - `SKILL.md`, `fragments/overview.md`, `references/methodology.md`, `references/api-auth-input.md`, `references/domain-handoffs.md`, the new active reference and `test/docs-contract.test.mjs` describe the same trigger boundary;
  - route auth-admission remains route-specific and policy-governance admission remains separate;
  - no workflow stage is described as a runnable CLI command;
  - supporting `docs/*` remain non-normative unless explicitly promoted.

## Risks and Side Effects

- Risk: policy-governance admission could blur into general code review.
  - Mitigation: require a security-relevant actor/control path or operator/control-plane impact and route non-security merge risks to `code-reviewer`.
- Risk: the new checkpoint could duplicate route auth-admission from `ISS-05`.
  - Mitigation: keep route auth-admission in `references/api-auth-input.md` and place policy-governance admission in a separate reference with explicit distinction.
- Risk: actor-model wording could weaken the default threat model.
  - Mitigation: preserve the default threat model and allow operator, compromised integration or replay source actors only as explicit per-review adjustments.
- Risk: examples could encourage low-confidence theoretical findings.
  - Mitigation: examples must show mitigations-before-reporting and separate confirmed findings from needs-verification questions.
- Risk: docs-contract tests could overfit exact prose and make later maintenance brittle.
  - Mitigation: assert stable contract phrases and required probes rather than full paragraphs.
- Risk: generated output could drift if `SKILL.md` is hand-edited.
  - Mitigation: edit source bundle first, regenerate and run compiler check.
- Destructive side effects: none expected; planned changes are documentation, docs-contract tests and generated-output updates inside the same skill folder.

## Rollback Plan

Revert the files changed for this issue: source-bundle prose, new active reference, docs-contract tests, `skill.yaml`, regenerated `SKILL.md`, `docs/compile-report.md`, docs navigation and implementation log. Then rerun `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/security-reviewer` and `pnpm --filter @kostysh/security-reviewer test` to confirm the skill returns to a consistent generated and tested state.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agent `Aquinas`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- План покрывает `SEC-02` triggers, acceptance criteria and constraints for policy-governance admission.
- План явно отделяет policy-governance checkpoint от existing route auth-admission `ISS-05`.
- Generated-skill maintenance model учтен: source bundle changes first, registered reference in `skill.yaml`, regenerated `SKILL.md` and `docs/compile-report.md`.
- Docs-contract coverage, portability check, HIGH-confidence reporting, actor boundaries and routing non-security risks to `code-reviewer` are planned sufficiently.
- `docs/README.md` navigation is consistent with the current planned state.
- Остаточный риск execution-level: при реализации нужно проверить, что новый active reference попал в generated `SKILL.md` and compiler output, and docs-contract tests avoid brittle exact-prose snapshots.

Required corrections:

- none

Final status: `PASS`
