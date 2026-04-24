# Implementation Plan

## Language

План написан на русском языке.

## Plan ID

`implementation-plan-20260424-1`

## Related Issue

`CR-01` — [issue-20260424-1.md](issue-20260424-1.md)

## Source Artifacts

- [issue-20260424-1.md](issue-20260424-1.md) — audited problem statement, required probe checklist, acceptance criteria, constraints and non-goals.
- `AGENTS.md` — repository rules for skill plans, audits, documentation layers and portable skills.
- `docs/templates/IMPLEMENTATION_PLAN_TEMPLATE.md` — repository-wide implementation plan template.
- `SKILL.md` — current generated active instruction surface for `code-reviewer`.
- `AGENTS.md` in the skill folder — generated-skill maintenance contract: source of truth is `skill.yaml`, `fragments/*`, `references/*` and `assets/*`.
- `skill.yaml` — source-of-truth manifest for generated skill sections, active references, assets, portability rules and compiler-owned output.
- `fragments/overview.md` — source fragment for overview, interop, non-negotiables, fast workflow, checks and output rules rendered into `SKILL.md`.
- `references/methodology.md` — current pass-by-pass review process and evidence standard.
- `references/domain-routing.md` — current routing guidance for domain skills and reviewer ownership boundaries.
- `references/spec-pass.md` — current lightweight spec alignment pass and escalation rules.
- `assets/review-checklist.md` — current quick checklist bundled with the skill.
- `docs/README.md` — supporting navigation for issues, plans and implementation logs.

## Objective

Make `code-reviewer` reliably run a bounded policy/admission merge-risk pass when the changed files or linked review intent touch policy gates, admission-before-side-effect flow, decision or audit persistence, active-scope activation, idempotency, replay or freshness checks. The new guidance must help reviewers find concrete merge risks such as invocation after deny, stale evidence admission, replay conflict, fail-open persistence and active-scope concurrency, while preserving the existing findings-first, high-confidence-only code review discipline.

## Assumptions

- `code-reviewer` remains a generated documentation skill with no shipped runtime CLI or test harness.
- Future implementation must edit the source bundle first and regenerate compiler-owned files; `SKILL.md` and `docs/compile-report.md` must not be hand-edited as source of truth.
- The pass is conditional. It triggers only from changed files or linked intent that touches the issue's listed policy/admission surfaces.
- This skill owns non-security merge-risk probes. Security exploitability classification remains with `security-reviewer`, and full normative traceability remains with `spec-conformance-reviewer`.
- Fixture/example coverage can be satisfied by portable review fixtures or examples inside the skill folder, because this skill currently has no executable tests.
- A missing test may be a blocking finding only when the missing coverage maps to reachable changed behavior on a merge-critical policy/admission path.

## Scope

In scope:

- Add conditional policy/admission merge-risk guidance to the active review workflow.
- Define trigger signals and bounded probes for no-invocation-after-deny, replay/conflict, freshness, fail-closed persistence, active-scope concurrency and tests that exercise the actual risk path.
- Keep all finding guidance grounded in changed behavior, surrounding mitigations and high confidence.
- Add portable fixtures or examples covering at least one replay conflict and one freshness gap.
- Update source bundle, generated output and docs navigation as part of implementation.

Out of scope:

- Replacing `spec-conformance-reviewer` requirement matrices or producing full traceability tables.
- Replacing `security-reviewer` threat modeling, exploitability analysis or security severity classification.
- Making policy/admission probes mandatory for unrelated diffs.
- Blocking merges for style, naming or preference-only comments.
- Adding runtime CLI commands or command semantics to `code-reviewer`.

## Proposed Changes

- Update `references/methodology.md`:
  - add a conditional `Policy/admission merge-risk pass`;
  - list trigger surfaces from the issue: policy gates, admission before external invocation, decision/audit persistence, active-scope activation, idempotency, replay and freshness checks;
  - define the bounded probe checklist from the issue;
  - state that theoretical concerns move to questions or are omitted.
- Update `references/domain-routing.md`:
  - clarify that this pass belongs to `code-reviewer` for non-security merge risk even when a domain skill is also loaded;
  - route exploitability/security-only concerns to `security-reviewer`;
  - route requirement-by-requirement compliance concerns to `spec-conformance-reviewer`.
- Update `fragments/overview.md` and `skill.yaml`:
  - add a short Fast Workflow hook after domain routing, so the generated `SKILL.md` points reviewers to the pass only when triggers are present;
  - keep detailed checklist prose out of the root file where possible;
  - bump `skill.source-version` because active skill guidance changes.
- Add an active reference such as `references/policy-admission-merge-risk.md`:
  - trigger checklist;
  - bounded probes with examples of concrete reachable evidence;
  - guidance for when a missing test is blocking;
  - self-check to keep speculative concerns out of findings;
  - explicit non-goals and interop boundaries.
- Add portable fixture/example material, for example under `assets/fixtures/policy-admission-review.md`:
  - replay conflict scenario where a duplicate request or stale audit row must be resolved before side effects;
  - freshness gap scenario where `maxEvidenceAgeMs` exists but `observedAt` is missing;
  - expected reviewer conclusions that separate confirmed findings from questions.
- Update `assets/review-checklist.md` with one concise conditional item for policy/admission merge-risk paths.
- Regenerate compiler-owned output:
  - `SKILL.md`;
  - `docs/compile-report.md`.
- Update supporting docs:
  - add this plan to `docs/README.md`;
  - during implementation, create `docs/logs/implementation-log-20260424-1.md` and link it from `docs/README.md`.

## Implementation Steps

1. Edit source-bundle files: `references/methodology.md`, `references/domain-routing.md`, `fragments/overview.md`, `skill.yaml` and `assets/review-checklist.md`.
2. Add `references/policy-admission-merge-risk.md` and register it in `skill.yaml` as an optional active reference with a precise trigger.
3. Add a portable fixture/example file under `assets/fixtures/` and register it in `skill.yaml` assets.
4. Check the wording against `CR-01` constraints: conditional trigger only, reachable changed behavior only, high-confidence findings only, theoretical concerns downgraded or omitted.
5. Run in-place regeneration for `skills/code-reviewer` with the `skill-source-compiler` runtime.
6. Inspect `SKILL.md` and `docs/compile-report.md` for generated-output parity and accidental duplication.
7. Update `docs/README.md` and create the implementation log after implementation.
8. Run the verification plan and review the final diff for unrelated churn.

## Verification Plan

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/code-reviewer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/code-reviewer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/code-reviewer`
- `rg -n "(/home/|/code/|C:\\\\|[A-Za-z]:\\\\)" skills/code-reviewer`
- Manual fixture walk-through:
  - confirm replay conflict example would produce a concrete merge-risk probe before side effects;
  - confirm freshness gap example fails closed when age limits exist and `observedAt` is absent;
  - confirm active-scope and persistence checks stay conditional and do not become universal requirements.
- Documentation parity check:
  - `SKILL.md`, `fragments/overview.md`, `references/methodology.md`, `references/domain-routing.md`, the new active reference, assets and `docs/compile-report.md` describe the same trigger boundary;
  - no workflow stage is described as a runnable CLI command;
  - supporting `docs/*` remain non-normative unless explicitly promoted.

## Risks and Side Effects

- Risk: guidance could over-expand normal reviews into broad policy architecture audits.
  - Mitigation: trigger only on changed files or linked intent that touches the listed surfaces; require reachable behavior evidence before findings.
- Risk: the pass could duplicate `spec-conformance-reviewer` or `security-reviewer`.
  - Mitigation: keep this pass limited to merge-risk review, and document escalation boundaries in `domain-routing.md` and the new reference.
- Risk: reviewers may report concurrency or persistence theories without proof.
  - Mitigation: require surrounding-code mitigation checks and move unverified concerns to questions or omit them.
- Risk: fixture examples could be mistaken for universal product requirements.
  - Mitigation: label fixtures as review examples and keep conclusions framed around changed behavior and evidence.
- Risk: generated output could drift if `SKILL.md` is hand-edited.
  - Mitigation: edit source bundle first, regenerate, and run compiler check.
- Destructive side effects: none expected; planned changes are documentation, fixture and generated-output updates inside the same skill folder.

## Rollback Plan

Revert the files changed for this issue: source-bundle prose, new active reference, fixture assets, `skill.yaml`, regenerated `SKILL.md`, `docs/compile-report.md`, docs navigation and implementation log. Then rerun `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/code-reviewer` to confirm the skill is back to a consistent generated state.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agent `Goodall`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- План покрывает conditional trigger, replay/conflict, freshness, fail-closed persistence, no-invocation-after-deny, active-scope concurrency, high-confidence-only findings and fixture/example coverage.
- Generated-skill maintenance model учтен: source bundle changes first, regenerated `SKILL.md` and `docs/compile-report.md`, no hand-editing generated output as source of truth.
- `docs/README.md` navigation is consistent with the current planned state.
- Остаточный риск execution-level: при реализации нужно зарегистрировать новый reference/asset в `skill.yaml`, regenerate output and run parity/portability checks.

Required corrections:

- none

Final status: `PASS`
