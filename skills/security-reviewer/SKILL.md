---
name: security-reviewer
description: |
  Systematic security code review skill for vulnerabilities in application code, CI workflows,
  permission models, webhooks, secrets, and configuration. Use when asked to security review,
  find vulnerabilities, audit auth or RLS, check GitHub Actions security, inspect webhook
  verification, or review code against OWASP-style risks. Owns threat modeling, confidence
  gating, exploitability checks, and evidence; pairs with domain skills for framework details.
---

# Security Reviewer

Find exploitable security weaknesses without turning every suspicious pattern into a finding. This skill owns threat model, confidence, exploitability, and security reporting discipline.

## When to Use

- "security review", "find vulnerabilities", "audit for OWASP issues"
- Reviewing authn, authz, session, token, secret, or permission changes
- Reviewing GitHub Actions, release workflows, or automation with secrets
- Reviewing Supabase RLS, grants, privileged functions, or service-role boundaries
- Reviewing webhook handlers, signature verification, replay protection, or idempotency
- Checking user-controlled input flowing into sensitive sinks

## When NOT to Use

- General code quality review without a security objective: use `code-reviewer`
- Pure framework implementation guidance: use the relevant domain skill
- UI or accessibility review: use `web-ui-reviewer`
- Pure shell portability or style review with no security angle: use the relevant engineering skill or tooling

## Skill Interop (Priority)

- This skill owns security threat model, confidence thresholds, exploitability checks, and vulnerability reporting.
- Domain skills own framework/runtime facts and remediation detail:
  - `hono-engineer`
  - `supabase-engineer`
  - `react-spa-engineer`
  - `react-components-engineer`
  - `node-engineer`
- `code-reviewer` owns non-security review flow and general merge-risk findings.
- If both skills are active, keep confirmed security findings under this skill and move non-security findings to `code-reviewer`.

## Non-Goals

- Do not turn this into a generic code-quality reviewer.
- Do not embed framework implementation playbooks that already belong to domain skills.
- Do not author final Hono middleware designs, Supabase policies, or Cloudflare configuration from this skill alone.

## Non-Negotiables

- Research before reporting. Do not flag issues from pattern matching alone.
- Trace attacker-controlled input, identity, or code execution path to the sink or missing control.
- Check surrounding code for mitigations, validation, framework defaults, and trust boundaries.
- Distinguish attacker-controlled data from server-controlled config, constants, and operator-managed settings.
- Report HIGH confidence findings by default. MEDIUM confidence items belong in a separate "needs verification" section only when they materially affect next steps.
- Do not report LOW confidence, purely theoretical, dead-code, comment-only, or test-only issues unless the user explicitly asks.

## Default Threat Model

Unless the user gives a different one, assume:

- external attacker
- no repository write access
- no privileged production shell access
- can send requests, open accounts, submit forms, upload files, open pull requests from forks, post public comments, and replay network traffic they control

Adjust the threat model explicitly if the code is internal-only or requires trusted operator access.

## Fast Workflow

1. Classify the review scope and load only the needed references:
   - general methodology
   - API/auth/input
   - GitHub Actions
   - Supabase RLS
   - webhooks
   - secrets/config
2. Map trust boundaries:
   - inputs
   - identities and roles
   - secrets and credentials
   - privileged actions
   - sensitive sinks
3. Trace the attack path:
   - entry point
   - attacker-controlled value
   - execution or authorization mechanism
   - impact
4. Verify mitigations:
   - validation or sanitization
   - framework escaping or parameterization
   - access controls
   - environment or deployment constraints
5. Classify confidence and severity.
6. Report confirmed findings first. Keep medium-confidence notes separate.

## What Not to Flag by Default

- tests, fixtures, dead code, comments, or docs
- constants and server-controlled config values
- framework-protected patterns unless protections are disabled or bypassed
- authenticated-only actions where the reported exploit still requires the same privileged role you are treating as trusted
- defense-in-depth observations with no plausible exploit path

## Confidence Levels

| Level | Criteria | Action |
|---|---|---|
| HIGH | attacker control, reachability, and impact are confirmed | report as a finding |
| MEDIUM | a meaningful issue exists but one link still needs verification | keep in "needs verification" |
| LOW | theoretical, best-practice only, or clearly mitigated elsewhere | do not report |

## Severity Levels

| Severity | Use for |
|---|---|
| Critical | direct compromise, auth bypass, repo or production takeover, secret exfiltration, destructive write impact |
| High | exploitable with clear path and significant confidentiality, integrity, or availability impact |
| Medium | real weakness with narrower preconditions or reduced blast radius |
| Low | defense-in-depth only; usually do not report unless explicitly requested |

## Output Rules

- Findings first, ordered by severity.
- Use the format from `references/methodology.md`.
- Every reported finding must include:
  - location
  - confidence
  - issue
  - impact
  - evidence
  - fix direction
- If useful, add a short "needs verification" section for medium-confidence items.
- Add a short "reviewed and cleared" section when it helps show what high-risk areas were inspected and rejected.
- If nothing clears the bar, say so plainly instead of inventing issues.

## Reference Map

Read only what you need:

- `references/methodology.md` - confidence gating, exploitability test, and reporting format
- `references/api-auth-input.md` - input validation, injection, authn, authz, CSRF, mass assignment, and file handling checks
- `references/github-actions.md` - GitHub Actions threat model, attack classes, and safe patterns
- `references/supabase-rls.md` - RLS, grants, privileged functions, RPC, and service-role review
- `references/webhooks.md` - signature verification, replay windows, raw body handling, and idempotency
- `references/secrets-config.md` - secrets, config trust boundaries, token scope, and logging exposure
- `references/domain-handoffs.md` - when to stop and defer to domain skills for framework-specific detail
