---
name: code-reviewer
description: >-
  Systematic code review skill for pull requests, diffs, and local branch
  changes.

  Use when asked to review code, audit a PR, find bugs or regressions, assess
  maintainability,

  spec or intent alignment, or produce high-signal review feedback. Owns review
  workflow,

  severity triage, evidence, and output conventions; pairs with domain skills
  for stack-specific

  rules.
metadata:
  source-version: 0.3.2
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: f7fb6c6ce2074af9b494d79ffa13d9957a13a0a2165357b05b5dbe1b84efdd72
---

# code-reviewer

## Start here

1. Confirm the task matches code-reviewer's applicability criteria.
2. Use the preserved overview guidance as the normative workflow for this skill.
3. Load only the active references that match the current task.
4. Preserve existing project conventions unless the overview explicitly requires a stricter invariant.

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

## Overview

Review code changes for merge risk, not for style points. Run a lightweight spec-pass when normative sources exist, but keep full implementation-vs-spec audits in `spec-conformance-reviewer`. This skill owns review process and reporting discipline. It does not replace stack-specific engineering skills.

When the user explicitly asks for over-engineering, simplification, unnecessary dependency, or deletion review, use the bounded complexity-only mode from `references/complexity-only.md`. Keep that output separate from normal merge-risk findings: complexity-only reports what can be cut, while this skill's default review still prioritizes bugs, regressions, tests, operability, and compatibility.

## Skill Interop (Priority)

- This skill owns review sequence, diff completeness, severity labeling, evidence quality, and merge recommendation framing.
- `spec-conformance-reviewer` owns full requirement extraction, traceability, compliance statuses, and implementation-vs-spec verdicts.
- Domain skills own correctness rules for their areas:
  - `hono-engineer`
  - `supabase-engineer`
  - `react-spa-engineer`
  - `react-components-engineer`
  - `node-engineer`
  - `typescript-engineer`
  - `typescript-test-engineer`
  - `web-ui-reviewer`
- `security-reviewer` owns threat model, exploitability, and vulnerability classification.
- This skill owns the conditional policy/admission merge-risk pass for non-security review findings when changed files or linked intent touch policy gates, admission-before-side-effect flow, decision or audit persistence, active-scope activation, idempotency, replay, or freshness checks.
- This skill owns the conditional runtime-gate deployed-path pass for non-security review findings when changed files or linked intent touch gates that authorize execution through a shipped lifecycle, production construction path, dependency wiring, request/tick path, invocation boundary, idempotency lock scope, or deployment/cell identity binding.
- If both general and spec review are requested, keep spec-backed findings under `spec-conformance-reviewer` and move non-spec merge-risk findings here.
- If both general and security review are requested, use this skill for non-security findings and `security-reviewer` for confirmed security findings.

## Non-Negotiables

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

1. Gather context:
   - review target, base branch, linked issue, user intent, and any available normative source
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
9. For each candidate finding, confirm:
   - the changed behavior is real
   - the surrounding code does not already mitigate it
   - severity matches actual impact
   - confidence is high enough to emit as a finding instead of a question
10. Report findings first, ordered by severity. Put open questions after findings. Keep summary brief.

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

## Default Escalation Triggers

Treat these as likely `blocking` unless surrounding context proves otherwise:

- Auth or permission model changes
- Migrations, RLS, or data retention changes
- Long-lived protected streams, SSE, subscription, or WebSocket-like endpoints
- Audit/security event capture or durable fallback behavior
- New external side effects: queues, webhooks, cron, background jobs
- CI or release workflow changes
- Shared library or API contract changes
- Error handling that can hide failures or corrupt state

## Merge Guidance

- Approve when only nits or low-risk follow-ups remain.
- Request changes when the issue can plausibly ship a bug, regression, missing test for merge-critical behavior, or operational risk.
- If the diff is too large for reliable review, say so explicitly and note the missed risk surface instead of pretending confidence.

## Default Brevity Mode

Unless the user explicitly asks for a formal audit or report:

- use terse chat output
- do not narrate intermediate reasoning or review passes
- do not produce tables, matrices, executive summaries, or cleared-surfaces sections
- report all confirmed in-scope findings, but keep the output compressed
- make each finding short, behavior-based, and evidence-backed
- collapse duplicate symptoms into one root-cause finding where possible
- keep questions and assumptions to the minimum necessary for correctness

## Output Rules

- Findings first, ordered by severity.
- Use the format from `references/findings-format.md`.
- Keep each finding self-contained: location, problem, impact, evidence, and fix direction.
- After findings, include:
  - open questions or assumptions
  - a brief summary or approval recommendation only if it adds value

## Reference Map

Read only what you need:

- `references/methodology.md` - full review process, completeness audit, and pass-by-pass checks
- `references/spec-pass.md` - lightweight issue or spec alignment pass and escalation rules
- `references/diff-completeness.md` - full diff recovery, reviewed-file accounting, and pre-conclusion audit
- `references/domain-routing.md` - which local skill to load for each file or change pattern
- `references/policy-admission-merge-risk.md` - bounded pass for policy/admission merge-risk paths
- `references/runtime-gate-deployed-path.md` - deployed-path and identity-binding pass for runtime-gating changes
- `references/complexity-only.md` - bounded over-engineering/deletion review mode, only when explicitly requested
- `references/findings-format.md` - severity rubric, comment labels, and output templates
- `references/severity-confidence.md` - how severity and confidence interact during triage

## Workflow stages

### Workflow stage: Apply code-reviewer guidance

Apply the preserved code-reviewer guidance without changing its domain behavior.

1. Match the request to the applicability criteria.
2. If the user explicitly requests over-engineering, simplification, deletion, or avoidable dependency review, load `references/complexity-only.md` and keep that pass separate from normal merge-risk findings.
3. Follow the preserved overview sections for the concrete work.
4. Read the smallest relevant active reference before using detailed guidance from it.
5. Run the relevant verification from the overview or report why it could not be run.

Validation:

- The outcome follows the preserved skill guidance and any loaded reference constraints.

## Required active references
- [Diff Completeness](references/diff-completeness.md) — Read this when you need full diff recovery, reviewed-file accounting, and pre-conclusion audit.
- [Domain Routing](references/domain-routing.md) — Read this when you need which local skill to load for each file or change pattern.
- [Findings Format](references/findings-format.md) — Read this when you need severity rubric, comment labels, and output templates.
- [Methodology](references/methodology.md) — Read this when you need full review process, completeness audit, and pass-by-pass checks.
- [Severity Confidence](references/severity-confidence.md) — Read this when you need how severity and confidence interact during triage.
- [Spec Pass](references/spec-pass.md) — Read this when you need lightweight issue or spec alignment pass and escalation rules.

## Optional references
- [Policy Admission Merge Risk](references/policy-admission-merge-risk.md) — Read this when changed files or linked review intent touch policy gates, admission-before-side-effect flow, decision or audit persistence, active scope, idempotency, replay, or freshness checks.
- [Runtime Gate Deployed Path](references/runtime-gate-deployed-path.md) — Read this when changed files or linked review intent touch runtime gates that authorize execution through a shipped lifecycle, production construction path, deployed dependency wiring, request or tick path, invocation boundary, idempotency lock scope, or deployment/cell identity binding.
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
