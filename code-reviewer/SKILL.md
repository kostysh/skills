---
name: code-reviewer
description: |
  Systematic code review skill for pull requests, diffs, and local branch changes.
  Use when asked to review code, audit a PR, find bugs or regressions, assess maintainability,
  or produce high-signal review feedback. Owns review workflow, severity triage, evidence,
  and output conventions; pairs with domain skills for stack-specific rules.
---

# Code Reviewer

Review code changes for merge risk, not for style points. This skill owns review process and reporting discipline. It does not replace stack-specific engineering skills.

## When to Use

- Reviewing a pull request, diff, branch, or changed file set
- "Review my changes", "find bugs in this patch", "what should block this merge"
- Auditing maintainability, regression risk, test adequacy, or compatibility impact
- Producing concise review comments with severity and evidence

## When NOT to Use

- Security-first or exploitability-driven review: use `security-reviewer`
- UI, accessibility, or UX-only audit: use `web-ui-reviewer`
- Framework implementation guidance or design from scratch: use the relevant domain skill
- Test architecture or runner policy design: use `typescript-test-engineer`

## Skill Interop (Priority)

- This skill owns review sequence, diff completeness, severity labeling, evidence quality, and merge recommendation framing.
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
- If both general and security review are requested, use this skill for non-security findings and `security-reviewer` for confirmed security findings.

## Non-Negotiables

- Read the full diff. If the diff is truncated, enumerate changed files and read changed hunks directly from the files.
- Separate report scope from research scope:
  - report only on the diff or files under review
  - research the wider codebase when needed to confirm or clear a concern
- Review behavior, compatibility, tests, and operability before discussing minor cleanup.
- Do not block on formatting, naming preference, or framework taste unless it creates concrete risk.
- Verify each finding against surrounding code, nearby tests, and existing guards before reporting it.
- Explain why the issue matters in runtime terms: regression, incorrect result, broken invariant, missing coverage, migration risk, or operational hazard.
- Prefer a smaller set of real findings over a long list of weak comments.
- If you cannot verify a concern, move it to assumptions or open questions instead of upgrading it to a finding.

## Fast Workflow

1. Gather context:
   - review target, base branch, linked issue, and user intent
   - note risky file classes: migrations, auth, CI, runtime config, state, tests
2. Read the full diff and list touched files.
3. If diff completeness is in doubt, follow `references/diff-completeness.md` before writing any findings.
4. Route by file type and load only the relevant domain skill. See `references/domain-routing.md`.
5. Review in four passes:
   - correctness and regressions
   - design and maintainability
   - tests and operability
   - performance and compatibility
6. For each candidate finding, confirm:
   - the changed behavior is real
   - the surrounding code does not already mitigate it
   - severity matches actual impact
   - confidence is high enough to emit as a finding instead of a question
7. Report findings first, ordered by severity. Put open questions after findings. Keep summary brief.

## What to Check

### Correctness and Regression

- Broken control flow, state drift, stale assumptions, or missing edge-case handling
- Incorrect data mapping, serialization, parsing, or boundary handling
- Async ordering issues, retries, timeouts, cancellation, or resource cleanup gaps
- Contract drift between producer and consumer

### Design and Maintainability

- Hidden coupling, duplicated rules, poor abstraction seams, or unclear ownership
- Public API changes without migration path or compatibility strategy
- Configuration or environment assumptions that are not explicit
- Code that makes future changes harder without a payoff

### Tests and Operability

- Missing tests for merge-critical behavior
- Tests that do not exercise the real risk path
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
- New external side effects: queues, webhooks, cron, background jobs
- CI or release workflow changes
- Shared library or API contract changes
- Error handling that can hide failures or corrupt state

## Merge Guidance

- Approve when only nits or low-risk follow-ups remain.
- Request changes when the issue can plausibly ship a bug, regression, missing test for merge-critical behavior, or operational risk.
- If the diff is too large for reliable review, say so explicitly and note the missed risk surface instead of pretending confidence.

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
- `references/diff-completeness.md` - full diff recovery, reviewed-file accounting, and pre-conclusion audit
- `references/domain-routing.md` - which local skill to load for each file or change pattern
- `references/findings-format.md` - severity rubric, comment labels, and output templates
- `references/severity-confidence.md` - how severity and confidence interact during triage
