---
name: code-reviewer
description: Perform read-only review of PRs, diffs, and local branch changes.
  Use to find bugs or regressions, assess maintainability, tests, compatibility,
  or lightweight intent alignment, and provide evidence-backed merge guidance
  with stable scope, severity, and findings; pair with relevant domain skills.
metadata:
  source-version: 0.4.6
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 72faf03a8b5215232c2f1fd6169b72e541a3b774ede4e80e189838d4e399ef28
---

# code-reviewer

## Start here

1. Select normal merge-risk review, explicit complexity-only review, or a combined request; preserve the requested mode and leave specialized verdicts with their owners.
2. Read diff-completeness, findings-format, and severity-confidence on every review; freeze the target and scope plus the applicable base and snapshot. Explicit snippet or repository scope need not have a diff base.
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

The mode determines which passes apply; common snapshot, read-only, evidence, and authority rules still apply. Follow the user's current scope within host and repository constraints. If a rule blocks the requested review, name the exact rule, applicability and missing input; preserve independently supported findings. Reuse existing permission for the same bounded action, and check command side effects before running tests or tools. Use a disposable copy for checks that would change the reviewed snapshot.

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

- Read `references/diff-completeness.md`, `references/findings-format.md`, and `references/severity-confidence.md` on every review. Other references are required only when their triggers match.
- Keep review read-only. If the user also requests fixes, treat implementation as a separate phase and mark the review stale after any mutation.
- Account for the full requested scope. For diff review, recover truncated hunks from the files when possible; list unavailable files explicitly and retain supported partial findings under `limited`.
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

## Normal Merge-risk Workflow

1. Establish the review basis using `references/diff-completeness.md`:
   - authoritative target, base, scope, starting snapshot identity, linked issue, user intent, and any available normative source
   - note risky file classes: migrations, auth, CI, runtime config, state, tests, runtime gates
2. Read the available diff and account for every touched file, distinguishing inspected content from unavailable content.
3. If normative context exists, run the lightweight pass from `references/spec-pass.md`.
4. Resolve completeness limits through `references/diff-completeness.md`; do not discard a finding established on a stable accessible part because another file is unavailable.
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
11. Recheck snapshot identity. If it changed, mark the review stale and do not approve until a fresh or bounded delta review completes. After sufficient checks, repeat or broaden only for a new change, failure, or concrete unresolved concern.
12. Start with one plain-language outcome sentence, then report findings by severity, the mandatory evidence footer, and exactly one recommendation status.

## Review lenses

Apply the four passes to the changed behavior: correctness and contract drift;
justified design and dependencies; tests and operability; performance and
compatibility. Consider boundary values, async/resource lifetime, failure paths,
public consumers and rollback where relevant. The detailed questions belong in
`references/methodology.md` for broad, formal, high-risk or large reviews; the
conditional gate references own their specialized checks.

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

- Begin with one plain-language outcome sentence, then findings by severity.
- Use the format from `references/findings-format.md`.
- Keep each finding self-contained: location, problem, impact, evidence, and fix direction.
- If no findings are confirmed, say `No findings.` instead of leaving the section empty.
- After findings and any open questions, always include the compact evidence footer from `references/findings-format.md` with exactly one status: `approve`, `request changes`, `limited`, or `blocked`.

## Reference Map

Always read:

- `references/diff-completeness.md` - review-basis authority, frozen snapshot, full-diff recovery, and ending identity check
- `references/findings-format.md` - findings shape, mandatory evidence footer, and recommendation statuses
- `references/severity-confidence.md` - confidence gating and impact-based severity

Required when the stated condition applies:

- `references/methodology.md` - broad, formal, high-risk, or large review needing the full pass order
- `references/spec-pass.md` - linked issue, acceptance criteria, contract, ADR, migration note, or other normative source
- `references/domain-routing.md` - changed behavior needing specialized authority
- `references/policy-admission-merge-risk.md` - bounded pass for policy/admission merge-risk paths
- `references/runtime-gate-deployed-path.md` - deployed-path and identity-binding pass for runtime-gating changes
- `references/complexity-only.md` - explicit complexity-only or complexity add-on request

## Workflow stages

### Workflow stage: Conduct a stable evidence-backed review

Produce findings and merge guidance for one reproducible read-only snapshot.

1. Resolve the mode, target and applicable base by `references/diff-completeness.md`; do not invent a comparison for an explicitly scoped snippet or choose between unresolved targets.
2. Freeze the snapshot, account for the changed scope, and use surrounding code only as research evidence.
3. Run only the passes applicable to that mode and changed behavior, then validate candidates against reachable behavior and existing guards. Retain confirmed findings on a stable accessible part when the remainder is unavailable.
4. Recheck the snapshot identity and mark the result stale if the reviewed surface changed.
5. Start with one plain-language outcome sentence, then report findings and the mandatory evidence footer with one recommendation status.

Validation:

- Another reviewer can reconstruct the reviewed target and scope from the report.
- No recommendation exceeds the behavioral evidence or specialized authority actually assessed.

## Gotchas

- **high** — Compare the ending snapshot identity to the starting identity. Any reviewed-surface mutation makes the prior result stale and requires a fresh or bounded delta review before approval.
- **high** — Do not pass a change only because types/tests/docs look correct when the requested outcome is runtime behavior, browser behavior, security behavior, or data persistence that was not exercised.

## Policies

### Read-only review boundary
Review is read-only absent separate remediation authority. For review-and-fix, record review first, remediate separately, and invalidate the verdict after mutation. A related blocker recurring after remediation requires root-cause review of assumptions, failure path, adjacent surfaces, and scope before another fix.

### Review scope evidence
Every review states the target, applicable base, snapshot, scope accounting, actual evidence, unassessed paths, and one recommendation status. Accounted but unread files limit coverage; they do not erase confirmed findings from the stable accessible part or permit clean approval.

## Required active references
- [Review Basis and Diff Completeness](references/diff-completeness.md) — Always read this before reviewing to freeze the target, preserve read-only scope, account for changed files, and recheck snapshot identity before the verdict.
- [Findings Format](references/findings-format.md) — Always read this before reporting findings, evidence limits, or a merge recommendation.
- [Severity Confidence](references/severity-confidence.md) — Always read this before promoting a candidate concern to a finding or assigning severity.
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

- During skill maintenance only, run compiler check after regeneration and inspect active local dependencies for portability.
- During skill maintenance only, verify all declared references and their load triggers. Ordinary code review does not compile or validate this skill package.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
