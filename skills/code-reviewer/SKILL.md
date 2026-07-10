---
name: code-reviewer
description: >-
  Read-only code review for pull requests, diffs, and local branch changes. Use
  when asked to

  find bugs or regressions, assess maintainability, test adequacy,
  compatibility, or lightweight

  intent alignment, and produce evidence-backed merge guidance. Owns stable
  review scope,

  severity triage, evidence, and output conventions; pairs with available domain
  skills.
metadata:
  source-version: 0.4.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 82f64eda5c0ce2acba41677034d9c7e44d1fd4dba65ed977c75f50c133e7be84
---

# code-reviewer

## Start here

1. Confirm the request is for read-only merge-risk review, not implementation or a specialized audit owned by another skill.
2. Read the three required references and freeze a reproducible target, base, scope, and starting snapshot before judging code.
3. Load only conditional references and available domain skills whose triggers match the changed behavior.
4. Recheck snapshot identity before reporting and return an evidence-calibrated recommendation with explicit limits.

## When to use this skill

- Reviewing a pull request, diff, branch, or changed file set
- "Review my changes", "find bugs in this patch", "what should block this merge"
- Auditing maintainability, regression risk, test adequacy, or compatibility impact
- Reviewing a diff or repository scope specifically for over-engineering, unnecessary abstraction, avoidable dependencies, or deletable code
- Running a lightweight issue or spec alignment check as part of normal PR review
- Producing concise review comments with severity and evidence

## When NOT to use this skill

- Security-first or exploitability-driven review: use `security-reviewer`
- Full implementation-versus-spec compliance audit: use `spec-conformance-reviewer`
- UI, accessibility, or UX-only audit: use `web-ui-reviewer`
- Framework implementation guidance or design from scratch: use the relevant domain skill
- Test architecture or runner policy design: use `typescript-test-engineer`
- AI-agent skill capability or instruction-quality audit: use `skill-reviewer`; use this skill only for ordinary code/runtime merge risk inside a skill package
- Implementing review fixes: use the relevant implementation skill; any mutation makes the prior verdict stale

## Overview

Review one reproducible code-change snapshot for merge risk, not style. Keep review read-only and end with findings plus reconstructible, evidence-calibrated merge guidance. Run a lightweight spec-pass when normative sources exist; keep full implementation-vs-spec audits in `spec-conformance-reviewer` and specialized correctness with domain owners.

When the user asks only for over-engineering, simplification, unnecessary dependency, or deletion review, use the bounded `complexity-only` mode from `references/complexity-only.md` and do not imply a general merge recommendation. When the user asks for both normal review and simplification, run normal merge-risk review first and add a separate complexity section.

## Skill Interop (Priority)

- This skill owns review sequence, diff completeness, severity labeling, evidence quality, and merge recommendation framing.
- `spec-conformance-reviewer` owns full requirement extraction, traceability, compliance statuses, and implementation-vs-spec verdicts.
- Discover the closest available domain authority from the skill catalog or repository guidance; routing examples are not exhaustive.
- Without a matching authority, keep generic review bounded, mark specialized correctness `unassessed`, and use `limited` or `blocked` when the gap prevents the requested recommendation.
- `security-reviewer` owns threat model, exploitability, and vulnerability classification.
- `skill-reviewer` owns AI-agent skill capability, instruction-quality, interop, parity, portability, and evidence-integrity verdicts. Use this skill only for ordinary code/runtime merge risk inside a skill package.
- This skill owns the conditional policy/admission merge-risk pass for non-security review findings when changed files or linked intent touch policy gates, admission-before-side-effect flow, decision or audit persistence, active-scope activation, idempotency, replay, or freshness checks.
- This skill owns the conditional runtime-gate deployed-path pass for non-security review findings when changed files or linked intent touch gates that authorize execution through a shipped lifecycle, production construction path, dependency wiring, request/tick path, invocation boundary, idempotency lock scope, or deployment/cell identity binding.
- If both general and spec review are requested, keep spec-backed findings under `spec-conformance-reviewer` and move non-spec merge-risk findings here.
- If both general and security review are requested, use this skill for non-security findings and `security-reviewer` for confirmed security findings.

## Non-Negotiables

- Read `references/diff-completeness.md`, `references/findings-format.md`, and `references/severity-confidence.md` on every review. Load all other references only when their triggers match.
- Keep review read-only. If the user also requests fixes, treat implementation as a separate phase and mark the review stale after any mutation.
- Read the full diff. If the diff is truncated, enumerate changed files and read changed hunks directly from the files.
- Separate report scope from research scope:
  - report only on the diff or files under review
  - research the wider codebase when needed to confirm or clear a concern
- When a linked issue, acceptance criteria, contract, ADR, or other normative source exists, run the lightweight pass from `references/spec-pass.md` before finalizing findings.
- When changed files or linked intent touch policy/admission surfaces, run the bounded pass from `references/policy-admission-merge-risk.md`.
- When changed files or linked intent touch runtime gates in a shipped lifecycle, run the deployed-path pass from `references/runtime-gate-deployed-path.md`.
- For backend auth/RBAC/session/context/data-access changes, check for fake-green tests: mocks or in-memory paths can prove API flow while leaving the real persistence/RLS/RPC/provider path untested.
- For fixture-heavy tests, check that fixtures model production invariants such as session row/version, active context, role/scope/tenant, status, and profile/readiness gates instead of seeding impossible states.
- For long-lived protected endpoints, do not reduce the review to one-shot handler admission when permission can change while the stream or socket is open.
- Review behavior, compatibility, tests, and operability before discussing minor cleanup.
- Do not use line-count reduction as severity in normal review; line-count estimates belong only to the explicit complexity-only mode.
- Do not block on formatting, naming preference, or framework taste unless it creates concrete risk.
- Verify each finding against surrounding code, nearby tests, and existing guards before reporting it.
- Explain why the issue matters in runtime terms: regression, incorrect result, broken invariant, missing coverage, migration risk, or operational hazard.
- Prefer a smaller set of real findings over a long list of weak comments.
- If you cannot verify a concern, move it to assumptions or open questions instead of upgrading it to a finding.

## Fast Workflow

1. Establish the review basis using `references/diff-completeness.md`:
   - authoritative target, base, scope, starting snapshot identity, linked issue, user intent, and any available normative source
   - note risky file classes: migrations, auth, CI, runtime config, state, tests, runtime gates
2. Read the full diff and list touched files.
3. If normative context exists, run the lightweight pass from `references/spec-pass.md`.
4. If diff completeness is in doubt, follow `references/diff-completeness.md` before writing any findings.
5. Route by file type and load only the relevant domain skill. See `references/domain-routing.md`.
6. If policy/admission triggers are present, run the bounded pass from `references/policy-admission-merge-risk.md`.
7. If runtime-gate deployed-path triggers are present, run the pass from `references/runtime-gate-deployed-path.md`.
8. If backend auth/RBAC/session/context, direct data access, long-lived protected streams, or audit durability changed, include a production-path evidence pass: route/service path, real store/RLS/RPC/provider path, fixtures, negative tests, and audit fallback/error paths.
9. Review in four passes:
   - correctness and regressions
   - design and maintainability
   - tests and operability
   - performance and compatibility
10. For each candidate finding, confirm:
   - the changed behavior is real
   - the surrounding code does not already mitigate it
   - severity matches actual impact
   - confidence is high enough to emit as a finding instead of a question
11. Recheck snapshot identity. If it changed, mark the review stale and do not approve until a fresh or bounded delta review completes.
12. Report findings first, ordered by severity, followed by the mandatory evidence footer and exactly one recommendation status.

## What to Check

### Correctness and Regression

- Spec, issue, or acceptance-criteria drift between intended and implemented behavior
- Broken control flow, state drift, stale assumptions, or missing edge-case handling
- Incorrect data mapping, serialization, parsing, or boundary handling
- Async ordering issues, retries, timeouts, cancellation, or resource cleanup gaps
- Contract drift between producer and consumer

### Design and Maintainability

- Hidden coupling, duplicated rules, poor abstraction seams, or unclear ownership
- Public API changes without migration path or compatibility strategy
- Significant new behavior with no clear requirement or contract basis
- Configuration or environment assumptions that are not explicit
- Code that makes future changes harder without a payoff

### Tests and Operability

- Missing tests for merge-critical behavior
- Missing tests for requirement-critical behavior when a normative source is available
- Tests that do not exercise the real risk path
- API tests that pass through mocked or in-memory stores while the real persistence/RLS/RPC/provider boundary can behave differently
- Fixtures that bypass production invariants, such as impossible role/profile states, mismatched session/context versions, wrong tenant/scope, or disabled/revoked statuses that production would reject
- Missing negative tests for stale session, stale active context, wrong role, wrong scope/tenant, disabled/revoked account/session/role, or missing profile/readiness state in auth/RBAC/session/context changes
- Long-lived protected endpoints that only test opening admission and not permission revocation, status change, maintenance denial, or context change during the connection
- Audit/durable behavior whose fallback or error path is silent best effort without test evidence
- New logs, metrics, migrations, jobs, or background work without enough validation
- Changes that need rollback or release notes but do not acknowledge it

### Performance and Compatibility

- New hot-path work, N+1 patterns, expensive loops, or repeated I/O
- Browser, runtime, schema, or API compatibility hazards
- Cache invalidation or stale data risks
- Resource usage that can grow with attacker or user input

## High-risk Review Surfaces

Prioritize focused inspection for these surfaces. Their presence does not determine severity; emit `blocking` only for a confirmed reachable failure path with merge-critical impact:

- Auth or permission model changes
- Migrations, RLS, or data retention changes
- Long-lived protected streams, SSE, subscription, or WebSocket-like endpoints
- Audit/security event capture or durable fallback behavior
- New external side effects: queues, webhooks, cron, background jobs
- CI or release workflow changes
- Shared library or API contract changes
- Error handling that can hide failures or corrupt state

## Merge Guidance

- `approve`: no blocking finding remains, the full declared scope is accounted for, and evidence is sufficient for the stated merge boundary; nits or bounded low-risk follow-ups may remain.
- `request changes`: at least one confirmed blocking finding can ship a bug, regression, missing merge-critical test, compatibility break, or operational risk.
- `limited`: review produced useful findings but incomplete scope, behavioral evidence, or specialized authority prevents a clean recommendation.
- `blocked`: target/base/snapshot authority cannot be resolved reproducibly or the requested review cannot be assessed safely.

## Default Brevity Mode

Unless the user explicitly asks for a formal audit or report:

- use terse chat output
- do not narrate intermediate reasoning or review passes
- do not produce tables, matrices, executive summaries, or cleared-surfaces sections
- report all confirmed in-scope findings, but keep the output compressed
- make each finding short, behavior-based, and evidence-backed
- collapse duplicate symptoms into one root-cause finding where possible
- keep questions and assumptions to the minimum necessary for correctness
- always include the compact evidence footer; brevity never removes snapshot, scope, evidence, limits, or recommendation status

## Output Rules

- Findings first, ordered by severity.
- Use the format from `references/findings-format.md`.
- Keep each finding self-contained: location, problem, impact, evidence, and fix direction.
- If no findings are confirmed, say `No findings.` instead of leaving the section empty.
- After findings and any open questions, always include the compact evidence footer from `references/findings-format.md` with exactly one status: `approve`, `request changes`, `limited`, or `blocked`.

## Reference Map

Always read:

- `references/diff-completeness.md` - review-basis authority, frozen snapshot, full-diff recovery, and ending identity check
- `references/findings-format.md` - findings shape, mandatory evidence footer, and recommendation statuses
- `references/severity-confidence.md` - confidence gating and impact-based severity

Read conditionally:

- `references/methodology.md` - broad, formal, high-risk, or large review needing the full pass order
- `references/spec-pass.md` - linked issue, acceptance criteria, contract, ADR, migration note, or other normative source
- `references/domain-routing.md` - changed behavior needing specialized authority
- `references/policy-admission-merge-risk.md` - bounded pass for policy/admission merge-risk paths
- `references/runtime-gate-deployed-path.md` - deployed-path and identity-binding pass for runtime-gating changes
- `references/complexity-only.md` - explicit complexity-only or complexity add-on request

## Workflow stages

### Workflow stage: Conduct a stable evidence-backed review

Produce findings and merge guidance for one reproducible read-only snapshot.

1. Resolve target and base by the authority order in `references/diff-completeness.md`; return `blocked` instead of guessing through unresolved candidates.
2. Freeze the snapshot, account for the changed scope, and use surrounding code only as research evidence.
3. Run matching conditional and domain passes, then validate candidates against reachable behavior and existing guards.
4. Recheck the snapshot identity and mark the result stale if the reviewed surface changed.
5. Report findings first and include the mandatory evidence footer and one recommendation status.

Validation:

- Another reviewer can reconstruct the reviewed target and scope from the report.
- No recommendation exceeds the behavioral evidence or specialized authority actually assessed.

## Gotchas

- **high** — Compare the ending snapshot identity to the starting identity. Any reviewed-surface mutation makes the prior result stale and requires a fresh or bounded delta review before approval.
- **high** — Do not pass a change only because types/tests/docs look correct when the requested outcome is runtime behavior, browser behavior, security behavior, or data persistence that was not exercised.

## Policies

### Read-only review boundary
Review is read-only unless the user separately authorizes remediation. For a combined review-and-fix request, finish and record the review first, perform remediation as a separate phase, and invalidate the earlier verdict after the first mutation.

### Review scope evidence
Every review must state the target/base/snapshot, changed-scope accounting, checks and behavioral evidence considered, untested or unassessed user/API/data paths, and exactly one recommendation status. The absence of findings is not evidence for paths outside that boundary.

## Required active references
- [Review Basis and Diff Completeness](references/diff-completeness.md) — Always read this before reviewing to freeze the target, preserve read-only scope, account for changed files, and recheck snapshot identity before the verdict.
- [Findings Format](references/findings-format.md) — Always read this before reporting findings, evidence limits, or a merge recommendation.
- [Severity Confidence](references/severity-confidence.md) — Always read this before promoting a candidate concern to a finding or assigning severity.

## Optional references
- [Domain Routing](references/domain-routing.md) — Read this when changed code needs specialized framework, platform, security, privacy, financial, skill-package, or other domain authority.
- [Methodology](references/methodology.md) — Read this for a broad, formal, high-risk, or large review that needs the full pass order and completeness audit.
- [Policy Admission Merge Risk](references/policy-admission-merge-risk.md) — Read this when changed files or linked review intent touch policy gates, admission-before-side-effect flow, decision or audit persistence, active scope, idempotency, replay, or freshness checks.
- [Runtime Gate Deployed Path](references/runtime-gate-deployed-path.md) — Read this when changed files or linked review intent touch runtime gates that authorize execution through a shipped lifecycle, production construction path, deployed dependency wiring, request or tick path, invocation boundary, idempotency lock scope, or deployment/cell identity binding.
- [Spec Pass](references/spec-pass.md) — Read this when a linked issue, acceptance criteria, contract, ADR, migration note, or other normative source exists.
- [Complexity-only Review](references/complexity-only.md) — Read this only when the user explicitly asks to review for over-engineering, simplification, unnecessary dependencies, dead flexibility, or what can be deleted.

## Bundled assets

- `assets/pr-review-template.md` — Bundled asset: assets/pr-review-template.md.
- `assets/review-checklist.md` — Bundled asset: assets/review-checklist.md.
- `assets/fixtures/policy-admission-review.md` — Fixture examples for the conditional policy/admission merge-risk pass.
- `assets/fixtures/runtime-gate-deployed-path-review.md` — Fixture examples for runtime-gate deployed-path and identity-binding review.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory code-reviewer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
